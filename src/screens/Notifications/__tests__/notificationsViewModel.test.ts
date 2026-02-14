import { getStrings } from '../../../localization/strings';
import { NotificationRecord } from '../../../services/notifications';
import { buildNotificationListState } from '../notificationsViewModel';

const makeNotification = (overrides: Partial<NotificationRecord> = {}): NotificationRecord => ({
  id: 'n-1',
  userId: 'viewer-1',
  type: 'follow_started',
  actorUserId: 'actor-1',
  actorName: 'Taylor',
  actorHandle: 'taylor',
  actorAvatar: null,
  createdAt: '2026-02-14T10:00:00.000Z',
  readAt: null,
  requestStatus: null,
  targetReviewId: null,
  targetReviewPlaceTitle: null,
  targetReviewPlaceSubtitle: null,
  targetReviewImageUrl: null,
  targetReviewVisibility: null,
  ...overrides,
});

describe('notificationsViewModel', () => {
  it('builds records map and grouped sections', () => {
    const strings = getStrings().notifications;
    const nowSpy = jest.spyOn(Date, 'now').mockReturnValue(new Date('2026-02-14T12:00:00.000Z').getTime());

    try {
      const pendingRequest = makeNotification({
        id: 'n-request',
        type: 'follow_request',
        requestStatus: 'pending',
        createdAt: '2026-02-14T11:55:00.000Z',
      });
      const earlierToday = makeNotification({
        id: 'n-earlier',
        type: 'follow_started',
        createdAt: '2026-02-14T09:00:00.000Z',
      });
      const weekItem = makeNotification({
        id: 'n-week',
        type: 'review_published',
        targetReviewVisibility: 'subscribers',
        targetReviewImageUrl: 'https://example.com/photo.jpg',
        targetReviewPlaceTitle: 'Cafe',
        createdAt: '2026-02-10T09:00:00.000Z',
      });

      const result = buildNotificationListState([pendingRequest, earlierToday, weekItem], strings);

      expect(Object.keys(result.recordsById)).toEqual(['n-request', 'n-earlier', 'n-week']);
      expect(result.sections.map((section) => section.title)).toEqual([
        strings.sectionNew,
        strings.sectionEarlier,
        strings.sectionWeek,
      ]);
      expect(result.sections[0].data[0].id).toBe('n-request');
      expect(result.sections[1].data[0].id).toBe('n-earlier');
      expect(result.sections[2].data[0].id).toBe('n-week');
      expect(result.sections[2].data[0].premiumCard).toBe(true);
    } finally {
      nowSpy.mockRestore();
    }
  });
});
