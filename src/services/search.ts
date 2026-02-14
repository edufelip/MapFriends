import { getFirestoreDb, isFirebaseConfigured } from './firebase';
import { runFirestoreOperation } from './firebaseDbLogger';
import { getRecentReviews } from './reviews';
import { buildSearchPrefixes, normalizeSearchQuery } from './searchIndex';

export type SearchPerson = {
  id: string;
  name: string;
  handle: string;
  avatar: string | null;
  visibility: 'open' | 'locked';
  postCount?: number;
  isPro?: boolean;
  isFollowing?: boolean;
};

// Legacy type kept for compatibility with place-only UI components that remain in the tree.
export type SearchPlace = {
  id: string;
  name: string;
  category: string;
  location: string;
  image: string;
  isPremium?: boolean;
};

type SearchIndexProfileInput = {
  userId: string;
  name: string;
  handle: string;
  avatar: string | null;
  visibility: 'open' | 'locked';
  updatedAt?: string;
};

type SearchRepository = {
  upsertSearchProfile: (input: SearchIndexProfileInput) => Promise<void>;
  deleteSearchProfile: (input: { userId: string }) => Promise<void>;
  searchPeople: (input: { normalizedQuery: string; limit: number }) => Promise<SearchPerson[]>;
  listRecentPeople: (input: { userId: string; limit: number }) => Promise<SearchPerson[]>;
  saveRecentPerson: (input: { userId: string; person: SearchPerson; openedAt: string }) => Promise<void>;
  removeRecentPerson: (input: { userId: string; searchedUserId: string }) => Promise<void>;
  clearRecentPeople: (input: { userId: string }) => Promise<void>;
  getSearchProfilesByIds: (input: { userIds: string[] }) => Promise<Record<string, SearchPerson>>;
};

const SEARCH_LIMIT_DEFAULT = 20;
const RECENT_LIMIT_DEFAULT = 5;
const TRENDING_LIMIT_DEFAULT = 10;
const TRENDING_WINDOW_DAYS_DEFAULT = 7;
const TRENDING_REVIEW_SCAN_LIMIT = 400;
const RECENT_BATCH_DELETE_LIMIT = 100;

const localSearchIndexByUserId: Record<string, SearchPerson> = {};
const localRecentByUserId: Record<string, Record<string, SearchPerson & { openedAt: string }>> = {};

const normalizeNameForSearch = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9_\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const normalizeHandleForSearch = (value: string) => normalizeSearchQuery(value || '');

const scoreSearchResult = (person: SearchPerson, normalizedQuery: string) => {
  const normalizedHandle = normalizeHandleForSearch(person.handle);
  const normalizedName = normalizeNameForSearch(person.name);
  const collapsedName = normalizedName.replace(/\s+/g, '');
  const nameTokens = normalizedName.split(' ').filter(Boolean);

  let score = 0;

  if (normalizedHandle === normalizedQuery) {
    score += 120;
  } else if (normalizedHandle.startsWith(normalizedQuery)) {
    score += 90;
  }

  if (nameTokens.some((token) => token === normalizedQuery)) {
    score += 80;
  } else if (nameTokens.some((token) => token.startsWith(normalizedQuery))) {
    score += 65;
  } else if (collapsedName.startsWith(normalizedQuery)) {
    score += 55;
  } else if (collapsedName.includes(normalizedQuery)) {
    score += 35;
  }

  if (person.visibility === 'open') {
    score += 1;
  }

  return score;
};

const sortBySearchRelevance = (items: SearchPerson[], normalizedQuery: string) =>
  items
    .map((item) => ({ item, score: scoreSearchResult(item, normalizedQuery) }))
    .sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      return a.item.name.localeCompare(b.item.name);
    })
    .map((entry) => entry.item);

const toVisibility = (value: unknown): 'open' | 'locked' =>
  value === 'locked' ? 'locked' : 'open';

const toStringOrNull = (value: unknown) =>
  typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;

const toSearchPerson = (id: string, raw: unknown): SearchPerson | null => {
  if (!raw || typeof raw !== 'object') {
    return null;
  }

  const source = raw as Record<string, unknown>;
  const name = toStringOrNull(source.name);
  const handle = toStringOrNull(source.handle);

  if (!name || !handle) {
    return null;
  }

  return {
    id,
    name,
    handle: normalizeHandleForSearch(handle),
    avatar: toStringOrNull(source.avatar),
    visibility: toVisibility(source.visibility),
  };
};

const toIndexPayload = (input: SearchIndexProfileInput) => ({
  uid: input.userId,
  name: input.name.trim(),
  handle: normalizeHandleForSearch(input.handle),
  avatar: input.avatar ?? null,
  visibility: input.visibility,
  updatedAt: input.updatedAt || new Date().toISOString(),
  searchPrefixes: buildSearchPrefixes({
    name: input.name,
    handle: input.handle,
  }),
});

const splitIntoChunks = <T,>(items: T[], chunkSize: number) => {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += chunkSize) {
    chunks.push(items.slice(i, i + chunkSize));
  }
  return chunks;
};

function createLocalSearchRepository(): SearchRepository {
  return {
    upsertSearchProfile: async (input) => {
      localSearchIndexByUserId[input.userId] = {
        id: input.userId,
        name: input.name.trim(),
        handle: normalizeHandleForSearch(input.handle),
        avatar: input.avatar ?? null,
        visibility: input.visibility,
      };
    },
    deleteSearchProfile: async ({ userId }) => {
      delete localSearchIndexByUserId[userId];
      Object.values(localRecentByUserId).forEach((recentByTarget) => {
        delete recentByTarget[userId];
      });
    },
    searchPeople: async ({ normalizedQuery, limit }) => {
      const allPeople = Object.values(localSearchIndexByUserId);
      const matched = allPeople.filter((person) => {
        const normalizedHandle = normalizeHandleForSearch(person.handle);
        const normalizedName = normalizeNameForSearch(person.name).replace(/\s+/g, '');
        return (
          normalizedHandle.includes(normalizedQuery) ||
          normalizedName.includes(normalizedQuery)
        );
      });
      return sortBySearchRelevance(matched, normalizedQuery).slice(0, Math.max(1, limit));
    },
    listRecentPeople: async ({ userId, limit }) =>
      Object.values(localRecentByUserId[userId] || {})
        .sort((a, b) => b.openedAt.localeCompare(a.openedAt))
        .slice(0, Math.max(1, limit)),
    saveRecentPerson: async ({ userId, person, openedAt }) => {
      localRecentByUserId[userId] = {
        ...(localRecentByUserId[userId] || {}),
        [person.id]: {
          ...person,
          openedAt,
        },
      };

      const sorted = Object.values(localRecentByUserId[userId]).sort((a, b) =>
        b.openedAt.localeCompare(a.openedAt)
      );

      const trimmed = sorted.slice(0, RECENT_LIMIT_DEFAULT);
      localRecentByUserId[userId] = trimmed.reduce<Record<string, SearchPerson & { openedAt: string }>>(
        (acc, item) => {
          acc[item.id] = item;
          return acc;
        },
        {}
      );
    },
    removeRecentPerson: async ({ userId, searchedUserId }) => {
      const next = { ...(localRecentByUserId[userId] || {}) };
      delete next[searchedUserId];
      localRecentByUserId[userId] = next;
    },
    clearRecentPeople: async ({ userId }) => {
      localRecentByUserId[userId] = {};
    },
    getSearchProfilesByIds: async ({ userIds }) => {
      const result: Record<string, SearchPerson> = {};
      userIds.forEach((userId) => {
        const entry = localSearchIndexByUserId[userId];
        if (entry) {
          result[userId] = entry;
        }
      });
      return result;
    },
  };
}

function createFirestoreSearchRepository(): SearchRepository {
  return {
    upsertSearchProfile: async (input) => {
      const { doc, setDoc } = await import('firebase/firestore');
      const db = getFirestoreDb();
      const ref = doc(db, 'userSearchIndex', input.userId);
      const payload = toIndexPayload(input);

      await runFirestoreOperation(
        'search.upsertSearchProfile',
        {
          userId: input.userId,
          path: ref.path,
        },
        () => setDoc(ref, payload, { merge: true })
      );
    },
    deleteSearchProfile: async ({ userId }) => {
      const { deleteDoc, doc } = await import('firebase/firestore');
      const db = getFirestoreDb();
      const ref = doc(db, 'userSearchIndex', userId);

      await runFirestoreOperation(
        'search.deleteSearchProfile',
        {
          userId,
          path: ref.path,
        },
        () => deleteDoc(ref)
      );
    },
    searchPeople: async ({ normalizedQuery, limit }) => {
      const { collection, getDocs, limit: limitFn, query, where } = await import('firebase/firestore');
      const db = getFirestoreDb();
      const boundedLimit = Math.max(1, limit);
      const q = query(
        collection(db, 'userSearchIndex'),
        where('searchPrefixes', 'array-contains', normalizedQuery),
        limitFn(boundedLimit)
      );

      const snapshot = await runFirestoreOperation(
        'search.searchPeople',
        {
          normalizedQuery,
          limit: boundedLimit,
          path: 'userSearchIndex',
        },
        () => getDocs(q)
      );

      const people: SearchPerson[] = [];
      snapshot.forEach((item) => {
        const parsed = toSearchPerson(item.id, item.data());
        if (parsed) {
          people.push(parsed);
        }
      });

      return sortBySearchRelevance(people, normalizedQuery).slice(0, boundedLimit);
    },
    listRecentPeople: async ({ userId, limit }) => {
      const { collection, getDocs, limit: limitFn, orderBy, query } = await import('firebase/firestore');
      const db = getFirestoreDb();
      const boundedLimit = Math.max(1, limit);
      const q = query(
        collection(db, 'userSearchRecent', userId, 'items'),
        orderBy('openedAt', 'desc'),
        limitFn(boundedLimit)
      );

      const snapshot = await runFirestoreOperation(
        'search.listRecentPeople',
        {
          userId,
          limit: boundedLimit,
          path: `userSearchRecent/${userId}/items`,
        },
        () => getDocs(q)
      );

      const people: SearchPerson[] = [];
      snapshot.forEach((item) => {
        const parsed = toSearchPerson(item.id, item.data());
        if (parsed) {
          people.push(parsed);
        }
      });

      return people;
    },
    saveRecentPerson: async ({ userId, person, openedAt }) => {
      const { collection, doc, getDocs, limit: limitFn, orderBy, query, setDoc, writeBatch } = await import(
        'firebase/firestore'
      );
      const db = getFirestoreDb();
      const ref = doc(db, 'userSearchRecent', userId, 'items', person.id);

      await runFirestoreOperation(
        'search.saveRecentPerson',
        {
          userId,
          searchedUserId: person.id,
          path: ref.path,
        },
        () =>
          setDoc(ref, {
            userId,
            searchedUserId: person.id,
            name: person.name,
            handle: normalizeHandleForSearch(person.handle),
            avatar: person.avatar ?? null,
            visibility: person.visibility,
            openedAt,
          })
      );

      const overLimitQuery = query(
        collection(db, 'userSearchRecent', userId, 'items'),
        orderBy('openedAt', 'desc'),
        limitFn(RECENT_LIMIT_DEFAULT + 10)
      );

      const snapshot = await runFirestoreOperation(
        'search.saveRecentPerson.trim',
        {
          userId,
          limit: RECENT_LIMIT_DEFAULT + 10,
          path: `userSearchRecent/${userId}/items`,
        },
        () => getDocs(overLimitQuery)
      );

      if (snapshot.size <= RECENT_LIMIT_DEFAULT) {
        return;
      }

      const batch = writeBatch(db);
      snapshot.docs.slice(RECENT_LIMIT_DEFAULT).forEach((docSnapshot) => {
        batch.delete(docSnapshot.ref);
      });

      await runFirestoreOperation(
        'search.saveRecentPerson.trimCommit',
        {
          userId,
          trimmedCount: Math.max(0, snapshot.size - RECENT_LIMIT_DEFAULT),
          path: `userSearchRecent/${userId}/items`,
        },
        () => batch.commit()
      );
    },
    removeRecentPerson: async ({ userId, searchedUserId }) => {
      const { deleteDoc, doc } = await import('firebase/firestore');
      const db = getFirestoreDb();
      const ref = doc(db, 'userSearchRecent', userId, 'items', searchedUserId);

      await runFirestoreOperation(
        'search.removeRecentPerson',
        {
          userId,
          searchedUserId,
          path: ref.path,
        },
        () => deleteDoc(ref)
      );
    },
    clearRecentPeople: async ({ userId }) => {
      const { collection, getDocs, limit: limitFn, query, writeBatch } = await import('firebase/firestore');
      const db = getFirestoreDb();
      const collectionRef = collection(db, 'userSearchRecent', userId, 'items');

      while (true) {
        const pageQuery = query(collectionRef, limitFn(RECENT_BATCH_DELETE_LIMIT));
        const snapshot = await runFirestoreOperation(
          'search.clearRecentPeople.page',
          {
            userId,
            pageSize: RECENT_BATCH_DELETE_LIMIT,
            path: `userSearchRecent/${userId}/items`,
          },
          () => getDocs(pageQuery)
        );

        if (snapshot.empty) {
          return;
        }

        const batch = writeBatch(db);
        snapshot.docs.forEach((docSnapshot) => batch.delete(docSnapshot.ref));
        await runFirestoreOperation(
          'search.clearRecentPeople.commit',
          {
            userId,
            deletedInBatch: snapshot.size,
            path: `userSearchRecent/${userId}/items`,
          },
          () => batch.commit()
        );

        if (snapshot.size < RECENT_BATCH_DELETE_LIMIT) {
          return;
        }
      }
    },
    getSearchProfilesByIds: async ({ userIds }) => {
      if (userIds.length === 0) {
        return {};
      }

      const { collection, documentId, getDocs, query, where } = await import('firebase/firestore');
      const db = getFirestoreDb();
      const chunks = splitIntoChunks(Array.from(new Set(userIds)), 10);
      const output: Record<string, SearchPerson> = {};

      for (const chunk of chunks) {
        const q = query(collection(db, 'userSearchIndex'), where(documentId(), 'in', chunk));
        const snapshot = await runFirestoreOperation(
          'search.getSearchProfilesByIds',
          {
            userIds: chunk,
            path: 'userSearchIndex',
          },
          () => getDocs(q)
        );

        snapshot.forEach((item) => {
          const parsed = toSearchPerson(item.id, item.data());
          if (parsed) {
            output[item.id] = parsed;
          }
        });
      }

      return output;
    },
  };
}

const repository = isFirebaseConfigured ? createFirestoreSearchRepository() : createLocalSearchRepository();

export async function upsertSearchIndexProfile(input: SearchIndexProfileInput): Promise<void> {
  await repository.upsertSearchProfile(input);
}

export async function deleteSearchIndexProfile(input: { userId: string }): Promise<void> {
  await repository.deleteSearchProfile(input);
}

export async function searchPeople(input: {
  query: string;
  limit?: number;
  excludeUserId?: string;
}): Promise<SearchPerson[]> {
  const normalizedQuery = normalizeSearchQuery(input.query || '');
  if (normalizedQuery.length < 2) {
    return [];
  }

  const limit = Math.max(1, input.limit ?? SEARCH_LIMIT_DEFAULT);
  const people = await repository.searchPeople({ normalizedQuery, limit });

  return people
    .filter((person) => person.id !== input.excludeUserId)
    .slice(0, limit);
}

export async function listRecentPeople(input: {
  userId: string;
  limit?: number;
}): Promise<SearchPerson[]> {
  if (!input.userId) {
    return [];
  }

  return repository.listRecentPeople({
    userId: input.userId,
    limit: Math.max(1, input.limit ?? RECENT_LIMIT_DEFAULT),
  });
}

export async function saveRecentPerson(input: {
  userId: string;
  person: SearchPerson;
  openedAt?: string;
}): Promise<void> {
  if (!input.userId || !input.person?.id) {
    return;
  }

  await repository.saveRecentPerson({
    userId: input.userId,
    person: input.person,
    openedAt: input.openedAt || new Date().toISOString(),
  });
}

export async function removeRecentPerson(input: {
  userId: string;
  searchedUserId: string;
}): Promise<void> {
  if (!input.userId || !input.searchedUserId) {
    return;
  }

  await repository.removeRecentPerson(input);
}

export async function clearRecentPeople(input: { userId: string }): Promise<void> {
  if (!input.userId) {
    return;
  }

  await repository.clearRecentPeople(input);
}

export async function getTrendingPeople(input?: {
  viewerUserId?: string;
  limit?: number;
  timespanDays?: number;
}): Promise<SearchPerson[]> {
  const limit = Math.max(1, input?.limit ?? TRENDING_LIMIT_DEFAULT);
  const timespanDays = Math.max(1, input?.timespanDays ?? TRENDING_WINDOW_DAYS_DEFAULT);
  const cutoffIso = new Date(Date.now() - timespanDays * 24 * 60 * 60 * 1000).toISOString();

  const recentReviews = await getRecentReviews(TRENDING_REVIEW_SCAN_LIMIT);
  const recentInWindow = recentReviews.filter((review) => review.createdAt >= cutoffIso);

  const aggregate = new Map<
    string,
    {
      count: number;
      latestCreatedAt: string;
      fallback: SearchPerson;
    }
  >();

  recentInWindow.forEach((review) => {
    const entry = aggregate.get(review.userId);
    if (entry) {
      entry.count += 1;
      if (review.createdAt > entry.latestCreatedAt) {
        entry.latestCreatedAt = review.createdAt;
      }
      return;
    }

    aggregate.set(review.userId, {
      count: 1,
      latestCreatedAt: review.createdAt,
      fallback: {
        id: review.userId,
        name: review.userName,
        handle: normalizeHandleForSearch(review.userHandle),
        avatar: review.userAvatar,
        visibility: 'open',
      },
    });
  });

  const sortedCreatorIds = Array.from(aggregate.entries())
    .sort((a, b) => {
      const byCount = b[1].count - a[1].count;
      if (byCount !== 0) {
        return byCount;
      }
      return b[1].latestCreatedAt.localeCompare(a[1].latestCreatedAt);
    })
    .map(([userId]) => userId);

  const bufferedIds = sortedCreatorIds.slice(0, limit + 10);
  const profilesById = await repository.getSearchProfilesByIds({ userIds: bufferedIds });

  const creators: SearchPerson[] = [];
  for (const creatorId of bufferedIds) {
    if (creatorId === input?.viewerUserId) {
      continue;
    }

    const aggregateEntry = aggregate.get(creatorId);
    if (!aggregateEntry) {
      continue;
    }

    const profile = profilesById[creatorId] || aggregateEntry.fallback;
    creators.push({
      ...profile,
      postCount: aggregateEntry.count,
    });

    if (creators.length >= limit) {
      break;
    }
  }

  return creators;
}

// Legacy APIs kept temporarily to avoid runtime breakage in components not yet migrated.
export async function getRecentPeople(input: { userId: string; limit?: number }): Promise<SearchPerson[]> {
  return listRecentPeople(input);
}

export async function getRecentPlaces(): Promise<SearchPlace[]> {
  return [];
}

export async function getTrendingPlaces(): Promise<SearchPlace[]> {
  return [];
}
