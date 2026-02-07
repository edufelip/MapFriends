import { checkHandleAvailability, claimProfileHandle } from '../handleRegistry';

const mockGetDoc = jest.fn();
const mockRunTransaction = jest.fn();
const mockDoc = jest.fn((_db: unknown, collection: string, id: string) => `${collection}/${id}`);
const mockServerTimestamp = jest.fn(() => 'server-ts');

jest.mock('../firebase', () => ({
  getFirestoreDb: () => ({ app: 'mock-firestore' }),
}));

jest.mock('firebase/firestore', () => ({
  doc: (...args: unknown[]) => mockDoc(...args),
  getDoc: (...args: unknown[]) => mockGetDoc(...args),
  runTransaction: (...args: unknown[]) => mockRunTransaction(...args),
  serverTimestamp: () => mockServerTimestamp(),
}));

describe('handleRegistry', () => {
  beforeEach(() => {
    mockGetDoc.mockReset();
    mockRunTransaction.mockReset();
    mockDoc.mockClear();
    mockServerTimestamp.mockClear();
  });

  it('returns available when handle belongs to same user', async () => {
    mockGetDoc.mockResolvedValue({
      exists: () => true,
      data: () => ({ uid: 'user-1' }),
    });

    const availability = await checkHandleAvailability('alex', 'user-1');

    expect(availability).toBe('available');
  });

  it('throws handle-taken when another user owns the handle', async () => {
    mockRunTransaction.mockImplementation(async (_db: unknown, operation: (tx: unknown) => Promise<void>) => {
      const transaction = {
        get: jest.fn(async (ref: string) => {
          if (ref === 'users/user-1') {
            return { data: () => ({}) };
          }
          if (ref === 'handles/alex') {
            return {
              exists: () => true,
              data: () => ({ uid: 'user-2' }),
            };
          }
          return { exists: () => false, data: () => ({}) };
        }),
        set: jest.fn(),
      };
      await operation(transaction);
    });

    await expect(
      claimProfileHandle({
        uid: 'user-1',
        name: 'Alex',
        handle: 'alex',
        bio: 'Explorer',
        visibility: 'open',
        avatar: null,
      })
    ).rejects.toMatchObject({ code: 'profile/handle-taken' });
  });

  it('throws handle-immutable when user already has another claimed handle', async () => {
    mockRunTransaction.mockImplementation(async (_db: unknown, operation: (tx: unknown) => Promise<void>) => {
      const transaction = {
        get: jest.fn(async (ref: string) => {
          if (ref === 'users/user-1') {
            return { data: () => ({ handle: 'already_claimed' }) };
          }
          return { exists: () => false, data: () => ({}) };
        }),
        set: jest.fn(),
      };
      await operation(transaction);
    });

    await expect(
      claimProfileHandle({
        uid: 'user-1',
        name: 'Alex',
        handle: 'alex',
        bio: 'Explorer',
        visibility: 'open',
        avatar: null,
      })
    ).rejects.toMatchObject({ code: 'profile/handle-immutable' });
  });

  it('writes handle and user documents when claim succeeds', async () => {
    const set = jest.fn();
    mockRunTransaction.mockImplementation(async (_db: unknown, operation: (tx: unknown) => Promise<void>) => {
      const transaction = {
        get: jest.fn(async (ref: string) => {
          if (ref === 'users/user-1') {
            return { data: () => ({}) };
          }
          if (ref === 'handles/alex') {
            return { exists: () => false, data: () => ({}) };
          }
          return { exists: () => false, data: () => ({}) };
        }),
        set,
      };
      await operation(transaction);
    });

    const claimedHandle = await claimProfileHandle({
      uid: 'user-1',
      name: 'Alex',
      handle: 'alex',
      bio: 'Explorer',
      visibility: 'open',
      avatar: null,
    });

    expect(claimedHandle).toBe('alex');
    expect(set).toHaveBeenCalledTimes(2);
    expect(set).toHaveBeenCalledWith('handles/alex', {
      uid: 'user-1',
      createdAt: 'server-ts',
    });
    expect(set).toHaveBeenCalledWith(
      'users/user-1',
      expect.objectContaining({
        uid: 'user-1',
        name: 'Alex',
        handle: 'alex',
        bio: 'Explorer',
      }),
      { merge: true }
    );
  });
});

