jest.mock('../firebase', () => ({
  isFirebaseConfigured: false,
  getFirestoreDb: jest.fn(),
}));

jest.mock('../firebaseDbLogger', () => ({
  runFirestoreOperation: jest.fn((_operation, _details, callback) => callback()),
}));

import {
  acceptFollowRequest,
  createFollowRequest,
  listFollowRequests,
  listOutgoingFollowRequestTargetUserIds,
} from '../following';

describe('following service', () => {
  it('lists outgoing follow requests for requester across targets', async () => {
    await createFollowRequest({
      targetUserId: 'target-user-1',
      requesterUserId: 'requester-user-1',
      requesterName: 'Requester One',
      requesterHandle: 'requester_one',
      requesterAvatar: null,
      createdAt: '2026-02-14T10:00:00.000Z',
    });

    await createFollowRequest({
      targetUserId: 'target-user-2',
      requesterUserId: 'requester-user-2',
      requesterName: 'Requester Two',
      requesterHandle: 'requester_two',
      requesterAvatar: null,
      createdAt: '2026-02-14T10:01:00.000Z',
    });

    const outgoing = await listOutgoingFollowRequestTargetUserIds({
      requesterUserId: 'requester-user-1',
      targetUserIds: ['target-user-1', 'target-user-2', 'target-user-3'],
    });

    expect(outgoing).toEqual(['target-user-1']);
  });

  it('removes outgoing request target after request is accepted', async () => {
    await createFollowRequest({
      targetUserId: 'target-user-accept',
      requesterUserId: 'requester-user-accept',
      requesterName: 'Requester Accept',
      requesterHandle: 'requester_accept',
      requesterAvatar: null,
      createdAt: '2026-02-14T11:00:00.000Z',
    });

    const beforeAccept = await listOutgoingFollowRequestTargetUserIds({
      requesterUserId: 'requester-user-accept',
      targetUserIds: ['target-user-accept'],
    });
    expect(beforeAccept).toEqual(['target-user-accept']);

    await acceptFollowRequest({
      userId: 'target-user-accept',
      requesterUserId: 'requester-user-accept',
      acceptedAt: '2026-02-14T11:05:00.000Z',
    });

    const afterAccept = await listOutgoingFollowRequestTargetUserIds({
      requesterUserId: 'requester-user-accept',
      targetUserIds: ['target-user-accept'],
    });
    expect(afterAccept).toEqual([]);

    const incoming = await listFollowRequests({ userId: 'target-user-accept' });
    expect(incoming).toEqual([]);
  });
});
