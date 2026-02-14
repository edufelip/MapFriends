import {
  doc,
  getDoc,
  runTransaction,
  serverTimestamp,
} from 'firebase/firestore';
import { getFirestoreDb } from './firebase';
import { runFirestoreOperation } from './firebaseDbLogger';
import { isHandleReserved, isHandleValidFormat, normalizeHandle } from './handlePolicy';
import { buildSearchPrefixes } from './searchIndex';

type ClaimProfileInput = {
  uid: string;
  name: string;
  handle: string;
  bio: string;
  visibility: 'open' | 'locked';
  avatar: string | null;
};

export type HandleAvailabilityStatus = 'invalid' | 'reserved' | 'taken' | 'available';

const toErrorWithCode = (code: string) => Object.assign(new Error(code), { code });

export const checkHandleAvailability = async (
  rawHandle: string,
  uid?: string
): Promise<HandleAvailabilityStatus> => {
  const handle = normalizeHandle(rawHandle);
  if (!isHandleValidFormat(handle)) {
    return 'invalid' as const;
  }
  if (isHandleReserved(handle)) {
    return 'reserved' as const;
  }

  const db = getFirestoreDb();
  const handleRef = doc(db, 'handles', handle);
  const snapshot = await runFirestoreOperation(
    'handles.checkAvailability',
    {
      handle,
      path: handleRef.path,
      requesterUid: uid || null,
    },
    () => getDoc(handleRef)
  );
  if (!snapshot.exists()) {
    return 'available' as const;
  }
  const ownerUid = (snapshot.data() as { uid?: string }).uid;
  if (uid && ownerUid === uid) {
    return 'available' as const;
  }
  return 'taken' as const;
};

export const claimProfileHandle = async ({
  uid,
  name,
  handle: rawHandle,
  bio,
  visibility,
  avatar,
}: ClaimProfileInput) => {
  const handle = normalizeHandle(rawHandle);
  if (!isHandleValidFormat(handle)) {
    throw toErrorWithCode('profile/handle-invalid');
  }
  if (isHandleReserved(handle)) {
    throw toErrorWithCode('profile/handle-reserved');
  }

  const db = getFirestoreDb();
  const handleRef = doc(db, 'handles', handle);
  const userRef = doc(db, 'users', uid);
  const searchIndexRef = doc(db, 'userSearchIndex', uid);

  await runFirestoreOperation(
    'handles.claimTransaction',
    {
      uid,
      handle,
      handlePath: handleRef.path,
      userPath: userRef.path,
      searchIndexPath: searchIndexRef.path,
    },
    () =>
      runTransaction(db, async (transaction) => {
        const userSnapshot = await transaction.get(userRef);
        const existingUserHandle = normalizeHandle((userSnapshot.data() as { handle?: string })?.handle || '');
        if (existingUserHandle && existingUserHandle !== handle) {
          throw toErrorWithCode('profile/handle-immutable');
        }

        const handleSnapshot = await transaction.get(handleRef);
        if (handleSnapshot.exists()) {
          const ownerUid = (handleSnapshot.data() as { uid?: string }).uid;
          if (ownerUid !== uid) {
            throw toErrorWithCode('profile/handle-taken');
          }
        } else {
          transaction.set(handleRef, {
            uid,
            createdAt: serverTimestamp(),
          });
        }

        transaction.set(
          userRef,
          {
            uid,
            name,
            handle,
            bio,
            visibility,
            avatar: avatar ?? null,
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        );

        transaction.set(
          searchIndexRef,
          {
            uid,
            name,
            handle,
            avatar: avatar ?? null,
            visibility,
            updatedAt: new Date().toISOString(),
            searchPrefixes: buildSearchPrefixes({
              name,
              handle,
            }),
          },
          { merge: true }
        );
      })
  );

  return handle;
};
