jest.mock('../firebase', () => ({
  isFirebaseConfigured: false,
  getFirestoreDb: jest.fn(),
}));

jest.mock('../firebaseDbLogger', () => ({
  runFirestoreOperation: jest.fn((_operation, _details, callback) => callback()),
}));

import {
  clearNotifications,
  createNotification,
  listNotifications,
  markNotificationRead,
  subscribeNotificationUnreadCount,
  updateNotificationRequestStatus,
} from '../notifications';

describe('notifications service', () => {
  it('creates and lists notifications with unread count', async () => {
    const userId = `user-notifications-${Date.now()}-a`;

    await createNotification({
      userId,
      type: 'follow_started',
      actorUserId: 'actor-1',
      actorName: 'Alex',
      actorHandle: 'alex',
      createdAt: '2026-02-14T10:00:00.000Z',
    });

    const result = await listNotifications({ userId });

    expect(result.items).toHaveLength(1);
    expect(result.items[0].type).toBe('follow_started');
    expect(result.unreadCount).toBe(1);

    await clearNotifications({ userId });
  });

  it('sorts by newest and updates read/request status', async () => {
    const userId = `user-notifications-${Date.now()}-b`;

    const older = await createNotification({
      userId,
      type: 'follow_request',
      actorUserId: 'actor-1',
      actorName: 'Taylor',
      actorHandle: 'taylor',
      createdAt: '2026-02-13T10:00:00.000Z',
      requestStatus: 'pending',
    });

    const newer = await createNotification({
      userId,
      type: 'review_published',
      actorUserId: 'actor-2',
      actorName: 'Morgan',
      actorHandle: 'morgan',
      createdAt: '2026-02-14T12:00:00.000Z',
      targetReviewId: 'review-1',
      targetReviewVisibility: 'followers',
    });

    const before = await listNotifications({ userId });

    expect(before.items.map((item) => item.id)).toEqual([newer.id, older.id]);
    expect(before.unreadCount).toBe(2);

    await markNotificationRead({
      userId,
      notificationId: newer.id,
      readAt: '2026-02-14T12:01:00.000Z',
    });

    await updateNotificationRequestStatus({
      userId,
      notificationId: older.id,
      requestStatus: 'accepted',
      readAt: '2026-02-14T12:02:00.000Z',
    });

    const after = await listNotifications({ userId });
    const acceptedRequest = after.items.find((item) => item.id === older.id);
    const readReview = after.items.find((item) => item.id === newer.id);

    expect(after.unreadCount).toBe(0);
    expect(readReview?.readAt).toBe('2026-02-14T12:01:00.000Z');
    expect(acceptedRequest?.requestStatus).toBe('accepted');

    await clearNotifications({ userId });
  });

  it('emits unread-count updates through local unread subscription', async () => {
    const userId = `user-notifications-${Date.now()}-c`;
    const values: number[] = [];

    const unsubscribe = await subscribeNotificationUnreadCount({
      userId,
      onChange: (count) => {
        values.push(count);
      },
    });

    const notification = await createNotification({
      userId,
      type: 'follow_started',
      actorUserId: 'actor-sub',
      actorName: 'Sub',
      actorHandle: 'sub',
      createdAt: '2026-02-14T10:00:00.000Z',
    });

    await markNotificationRead({ userId, notificationId: notification.id, readAt: '2026-02-14T10:01:00.000Z' });

    unsubscribe();

    expect(values).toEqual([0, 1, 0]);

    await clearNotifications({ userId });
  });
});
