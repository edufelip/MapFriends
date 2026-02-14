jest.mock('../firebase', () => ({
  isFirebaseConfigured: false,
  getFirestoreDb: jest.fn(),
}));

jest.mock('../firebaseDbLogger', () => ({
  runFirestoreOperation: jest.fn((_operation, _details, callback) => callback()),
}));

import { getRecentReviews } from '../reviews';
import {
  clearRecentPeople,
  getRecentPlaces,
  getTrendingPeople,
  getTrendingPlaces,
  listRecentPeople,
  saveRecentPerson,
  searchPeople,
  upsertSearchIndexProfile,
} from '../search';

jest.mock('../reviews', () => ({
  getRecentReviews: jest.fn(),
}));

const mockGetRecentReviews = getRecentReviews as jest.MockedFunction<typeof getRecentReviews>;

const nowIso = () => new Date().toISOString();

const daysAgoIso = (days: number) =>
  new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

describe('search service', () => {
  beforeEach(() => {
    mockGetRecentReviews.mockReset();
  });

  it('searches people by handle and name', async () => {
    await upsertSearchIndexProfile({
      userId: 'search-user-lucas',
      name: 'Lucas Rocha',
      handle: 'lucas_rocha',
      avatar: null,
      visibility: 'open',
    });

    await upsertSearchIndexProfile({
      userId: 'search-user-maria',
      name: 'Maria Fernanda',
      handle: 'mariaf',
      avatar: null,
      visibility: 'locked',
    });

    const byHandle = await searchPeople({ query: '@luc', limit: 10 });
    const byName = await searchPeople({ query: 'mari', limit: 10 });

    expect(byHandle.some((person) => person.id === 'search-user-lucas')).toBe(true);
    expect(byName.some((person) => person.id === 'search-user-maria')).toBe(true);
  });

  it('stores recent people per user and trims to max 5', async () => {
    const userId = 'search-viewer-1';

    const people = Array.from({ length: 6 }).map((_, index) => ({
      id: `recent-person-${index + 1}`,
      name: `Recent Person ${index + 1}`,
      handle: `recent_person_${index + 1}`,
      avatar: null,
      visibility: 'open' as const,
    }));

    for (const person of people) {
      await saveRecentPerson({
        userId,
        person,
        openedAt: new Date(Date.now() + Number(person.id.split('-').pop())).toISOString(),
      });
    }

    const recents = await listRecentPeople({ userId, limit: 10 });

    expect(recents).toHaveLength(5);
    expect(recents[0].id).toBe('recent-person-6');
    expect(recents.some((person) => person.id === 'recent-person-1')).toBe(false);

    await saveRecentPerson({
      userId,
      person: people[2],
      openedAt: new Date(Date.now() + 99_999).toISOString(),
    });

    const refreshed = await listRecentPeople({ userId, limit: 10 });
    expect(refreshed[0].id).toBe('recent-person-3');

    await clearRecentPeople({ userId });
    const cleared = await listRecentPeople({ userId, limit: 10 });
    expect(cleared).toEqual([]);
  });

  it('returns trending creators ranked by 7-day posting volume', async () => {
    await upsertSearchIndexProfile({
      userId: 'creator-open',
      name: 'Open Creator',
      handle: 'open_creator',
      avatar: null,
      visibility: 'open',
      updatedAt: nowIso(),
    });

    await upsertSearchIndexProfile({
      userId: 'creator-locked',
      name: 'Locked Creator',
      handle: 'locked_creator',
      avatar: null,
      visibility: 'locked',
      updatedAt: nowIso(),
    });

    mockGetRecentReviews.mockResolvedValue([
      {
        id: 'review-1',
        placeId: 'place-1',
        placeTitle: 'Place 1',
        placeCoordinates: null,
        title: 'Review 1',
        notes: 'Great',
        rating: 9,
        visibility: 'followers',
        userId: 'creator-open',
        userName: 'Open Creator',
        userHandle: 'open_creator',
        userAvatar: null,
        photos: [],
        photoUrls: [],
        createdAt: daysAgoIso(1),
        updatedAt: daysAgoIso(1),
      },
      {
        id: 'review-2',
        placeId: 'place-2',
        placeTitle: 'Place 2',
        placeCoordinates: null,
        title: 'Review 2',
        notes: 'Great',
        rating: 9,
        visibility: 'followers',
        userId: 'creator-open',
        userName: 'Open Creator',
        userHandle: 'open_creator',
        userAvatar: null,
        photos: [],
        photoUrls: [],
        createdAt: daysAgoIso(2),
        updatedAt: daysAgoIso(2),
      },
      {
        id: 'review-3',
        placeId: 'place-3',
        placeTitle: 'Place 3',
        placeCoordinates: null,
        title: 'Review 3',
        notes: 'Great',
        rating: 9,
        visibility: 'followers',
        userId: 'creator-open',
        userName: 'Open Creator',
        userHandle: 'open_creator',
        userAvatar: null,
        photos: [],
        photoUrls: [],
        createdAt: daysAgoIso(3),
        updatedAt: daysAgoIso(3),
      },
      {
        id: 'review-4',
        placeId: 'place-4',
        placeTitle: 'Place 4',
        placeCoordinates: null,
        title: 'Review 4',
        notes: 'Great',
        rating: 9,
        visibility: 'followers',
        userId: 'creator-locked',
        userName: 'Locked Creator',
        userHandle: 'locked_creator',
        userAvatar: null,
        photos: [],
        photoUrls: [],
        createdAt: daysAgoIso(1),
        updatedAt: daysAgoIso(1),
      },
      {
        id: 'review-5',
        placeId: 'place-5',
        placeTitle: 'Place 5',
        placeCoordinates: null,
        title: 'Review 5',
        notes: 'Great',
        rating: 9,
        visibility: 'followers',
        userId: 'creator-locked',
        userName: 'Locked Creator',
        userHandle: 'locked_creator',
        userAvatar: null,
        photos: [],
        photoUrls: [],
        createdAt: daysAgoIso(2),
        updatedAt: daysAgoIso(2),
      },
      {
        id: 'review-old',
        placeId: 'place-6',
        placeTitle: 'Place 6',
        placeCoordinates: null,
        title: 'Old Review',
        notes: 'Old',
        rating: 8,
        visibility: 'followers',
        userId: 'creator-old',
        userName: 'Old Creator',
        userHandle: 'old_creator',
        userAvatar: null,
        photos: [],
        photoUrls: [],
        createdAt: daysAgoIso(20),
        updatedAt: daysAgoIso(20),
      },
      {
        id: 'review-viewer',
        placeId: 'place-7',
        placeTitle: 'Place 7',
        placeCoordinates: null,
        title: 'Viewer Review',
        notes: 'Mine',
        rating: 8,
        visibility: 'followers',
        userId: 'viewer-user',
        userName: 'Viewer',
        userHandle: 'viewer',
        userAvatar: null,
        photos: [],
        photoUrls: [],
        createdAt: daysAgoIso(1),
        updatedAt: daysAgoIso(1),
      },
    ]);

    const trending = await getTrendingPeople({
      viewerUserId: 'viewer-user',
      limit: 10,
      timespanDays: 7,
    });

    expect(trending).toHaveLength(2);
    expect(trending[0].id).toBe('creator-open');
    expect(trending[0].postCount).toBe(3);
    expect(trending[1].id).toBe('creator-locked');
    expect(trending[1].visibility).toBe('locked');
    expect(trending[1].postCount).toBe(2);
  });

  it('keeps legacy places APIs returning empty arrays', async () => {
    await expect(getRecentPlaces()).resolves.toEqual([]);
    await expect(getTrendingPlaces()).resolves.toEqual([]);
  });
});
