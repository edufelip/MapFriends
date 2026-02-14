import {
  clearNotifications,
  createNotification,
  listNotifications,
  markNotificationRead,
  updateNotificationRequestStatus,
  NotificationRecord,
} from '../../../services/notifications';
import {
  acceptFollowRequest,
  createFollowLink,
  declineFollowRequest,
} from '../../../services/following';
import { useNotificationsStore } from '../notificationsStore';

jest.mock('../../../services/notifications', () => ({
  listNotifications: jest.fn(),
  clearNotifications: jest.fn(),
  markNotificationRead: jest.fn(),
  updateNotificationRequestStatus: jest.fn(),
  createNotification: jest.fn(),
}));

jest.mock('../../../services/following', () => ({
  acceptFollowRequest: jest.fn(),
  declineFollowRequest: jest.fn(),
  createFollowLink: jest.fn(),
}));

const mockListNotifications = listNotifications as jest.MockedFunction<typeof listNotifications>;
const mockClearNotifications = clearNotifications as jest.MockedFunction<typeof clearNotifications>;
const mockMarkNotificationRead = markNotificationRead as jest.MockedFunction<typeof markNotificationRead>;
const mockUpdateNotificationRequestStatus =
  updateNotificationRequestStatus as jest.MockedFunction<typeof updateNotificationRequestStatus>;
const mockCreateNotification = createNotification as jest.MockedFunction<typeof createNotification>;
const mockAcceptFollowRequest = acceptFollowRequest as jest.MockedFunction<typeof acceptFollowRequest>;
const mockDeclineFollowRequest = declineFollowRequest as jest.MockedFunction<typeof declineFollowRequest>;
const mockCreateFollowLink = createFollowLink as jest.MockedFunction<typeof createFollowLink>;

const makeNotification = (overrides: Partial<NotificationRecord> = {}): NotificationRecord => ({
  id: 'notification-1',
  userId: 'viewer-1',
  type: 'follow_request',
  actorUserId: 'actor-1',
  actorName: 'Taylor',
  actorHandle: 'taylor',
  actorAvatar: null,
  createdAt: '2026-02-14T12:00:00.000Z',
  readAt: null,
  requestStatus: 'pending',
  targetReviewId: null,
  targetReviewPlaceTitle: null,
  targetReviewPlaceSubtitle: null,
  targetReviewImageUrl: null,
  targetReviewVisibility: null,
  ...overrides,
});

describe('notificationsStore', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useNotificationsStore.getState().clearNotificationsState();
  });

  it('hydrates notifications and unread count', async () => {
    mockListNotifications.mockResolvedValueOnce({
      items: [
        makeNotification({ id: 'n-2', createdAt: '2026-02-14T14:00:00.000Z' }),
        makeNotification({ id: 'n-1', createdAt: '2026-02-14T13:00:00.000Z' }),
      ],
      unreadCount: 2,
    });

    await useNotificationsStore.getState().hydrateNotifications({ userId: 'viewer-1' });

    const state = useNotificationsStore.getState();
    expect(state.notificationIds).toEqual(['n-2', 'n-1']);
    expect(state.unreadCount).toBe(2);
    expect(state.hydratedUserId).toBe('viewer-1');
  });

  it('marks a notification as read and decrements unread', async () => {
    useNotificationsStore.setState({
      notificationsById: {
        'n-1': makeNotification({ id: 'n-1' }),
      },
      notificationIds: ['n-1'],
      hydratedUserId: 'viewer-1',
      unreadCount: 1,
    });

    mockMarkNotificationRead.mockResolvedValueOnce();

    await useNotificationsStore.getState().markNotificationReadAndStore({
      userId: 'viewer-1',
      notificationId: 'n-1',
    });

    const state = useNotificationsStore.getState();
    expect(mockMarkNotificationRead).toHaveBeenCalledTimes(1);
    expect(state.notificationsById['n-1'].readAt).toBeTruthy();
    expect(state.unreadCount).toBe(0);
  });

  it('accepts follow request and updates notification status', async () => {
    useNotificationsStore.setState({
      notificationsById: {
        'n-1': makeNotification({ id: 'n-1', actorUserId: 'requester-1', readAt: null }),
      },
      notificationIds: ['n-1'],
      unreadCount: 1,
      hydratedUserId: 'viewer-1',
    });

    mockAcceptFollowRequest.mockResolvedValueOnce();
    mockUpdateNotificationRequestStatus.mockResolvedValueOnce();
    mockCreateNotification.mockResolvedValueOnce(
      makeNotification({
        id: 'n-created',
        userId: 'requester-1',
        type: 'follow_request_accepted',
        requestStatus: null,
      })
    );

    await useNotificationsStore.getState().acceptFollowRequestAndStore({
      userId: 'viewer-1',
      notificationId: 'n-1',
      actor: {
        id: 'viewer-1',
        name: 'Viewer',
        handle: 'viewer',
        avatar: null,
      },
    });

    const state = useNotificationsStore.getState();

    expect(mockAcceptFollowRequest).toHaveBeenCalledWith({
      userId: 'viewer-1',
      requesterUserId: 'requester-1',
      acceptedAt: expect.any(String),
    });
    expect(mockUpdateNotificationRequestStatus).toHaveBeenCalledWith({
      userId: 'viewer-1',
      notificationId: 'n-1',
      requestStatus: 'accepted',
      readAt: expect.any(String),
    });
    expect(mockCreateNotification).toHaveBeenCalledWith({
      userId: 'requester-1',
      type: 'follow_request_accepted',
      actorUserId: 'viewer-1',
      actorName: 'Viewer',
      actorHandle: 'viewer',
      actorAvatar: null,
      createdAt: expect.any(String),
    });
    expect(state.notificationsById['n-1'].requestStatus).toBe('accepted');
    expect(state.unreadCount).toBe(0);
    expect(state.pendingActionById['n-1']).toBeUndefined();
  });

  it('follows back and marks source notification as read', async () => {
    useNotificationsStore.setState({
      notificationsById: {
        'n-1': makeNotification({
          id: 'n-1',
          type: 'follow_started',
          actorUserId: 'actor-55',
          requestStatus: null,
        }),
      },
      notificationIds: ['n-1'],
      unreadCount: 1,
      hydratedUserId: 'viewer-1',
    });

    mockCreateFollowLink.mockResolvedValueOnce();
    mockMarkNotificationRead.mockResolvedValueOnce();
    mockCreateNotification.mockResolvedValueOnce(
      makeNotification({
        id: 'n-followed',
        userId: 'actor-55',
        type: 'follow_started',
        requestStatus: null,
      })
    );

    await useNotificationsStore.getState().followBackAndStore({
      userId: 'viewer-1',
      notificationId: 'n-1',
      actor: {
        id: 'viewer-1',
        name: 'Viewer',
        handle: 'viewer',
        avatar: null,
      },
    });

    const state = useNotificationsStore.getState();
    expect(mockCreateFollowLink).toHaveBeenCalledWith({
      userId: 'viewer-1',
      followedUserId: 'actor-55',
      createdAt: expect.any(String),
    });
    expect(mockMarkNotificationRead).toHaveBeenCalledWith({
      userId: 'viewer-1',
      notificationId: 'n-1',
      readAt: expect.any(String),
    });
    expect(state.notificationsById['n-1'].readAt).toBeTruthy();
    expect(state.unreadCount).toBe(0);
  });

  it('re-hydrates after partial accept failure to avoid stale local state', async () => {
    useNotificationsStore.setState({
      notificationsById: {
        'n-1': makeNotification({ id: 'n-1', actorUserId: 'requester-1', readAt: null }),
      },
      notificationIds: ['n-1'],
      unreadCount: 1,
      hydratedUserId: 'viewer-1',
    });

    mockAcceptFollowRequest.mockResolvedValueOnce();
    mockUpdateNotificationRequestStatus.mockResolvedValueOnce();
    mockCreateNotification.mockRejectedValueOnce(new Error('fanout-failed'));
    mockListNotifications.mockResolvedValueOnce({
      items: [
        makeNotification({
          id: 'n-1',
          actorUserId: 'requester-1',
          requestStatus: 'accepted',
          readAt: '2026-02-14T13:00:00.000Z',
        }),
      ],
      unreadCount: 0,
    });

    await expect(
      useNotificationsStore.getState().acceptFollowRequestAndStore({
        userId: 'viewer-1',
        notificationId: 'n-1',
        actor: {
          id: 'viewer-1',
          name: 'Viewer',
          handle: 'viewer',
          avatar: null,
        },
      })
    ).rejects.toThrow('fanout-failed');

    expect(mockListNotifications).toHaveBeenCalledWith({ userId: 'viewer-1', limit: 120 });

    const state = useNotificationsStore.getState();
    expect(state.notificationsById['n-1']?.requestStatus).toBe('accepted');
    expect(state.notificationsById['n-1']?.readAt).toBe('2026-02-14T13:00:00.000Z');
    expect(state.pendingActionById['n-1']).toBeUndefined();
  });

  it('clears notifications remotely and locally', async () => {
    useNotificationsStore.setState({
      notificationsById: {
        'n-1': makeNotification({ id: 'n-1' }),
      },
      notificationIds: ['n-1'],
      unreadCount: 1,
      hydratedUserId: 'viewer-1',
    });

    mockClearNotifications.mockResolvedValueOnce();

    await useNotificationsStore.getState().clearNotificationsAndStore({ userId: 'viewer-1' });

    const state = useNotificationsStore.getState();
    expect(mockClearNotifications).toHaveBeenCalledWith({ userId: 'viewer-1' });
    expect(state.notificationIds).toEqual([]);
    expect(state.unreadCount).toBe(0);
  });
});
