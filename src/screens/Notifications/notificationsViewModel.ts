import { getStrings } from '../../localization/strings';
import { NotificationRecord } from '../../services/notifications';
import { NotificationRowItem } from './components/NotificationRow';

export type NotificationSection = {
  title: string;
  data: NotificationRowItem[];
};

type NotificationStrings = ReturnType<typeof getStrings>['notifications'];

type SectionBuckets = {
  new: NotificationRowItem[];
  earlier: NotificationRowItem[];
  week: NotificationRowItem[];
};

const HOUR_MS = 60 * 60 * 1000;

const toRelativeTime = (isoDate: string, now: number) => {
  const timestamp = Date.parse(isoDate);
  if (Number.isNaN(timestamp)) {
    return 'now';
  }

  const diff = Math.max(0, now - timestamp);
  const minutes = Math.floor(diff / (60 * 1000));
  if (minutes < 1) {
    return 'now';
  }
  if (minutes < 60) {
    return `${minutes}m`;
  }

  const hours = Math.floor(diff / HOUR_MS);
  if (hours < 24) {
    return `${hours}h`;
  }

  const days = Math.floor(hours / 24);
  return `${days}d`;
};

const toBadge = (record: NotificationRecord) => {
  switch (record.type) {
    case 'follow_request':
      return { icon: 'person-add-alt', color: '#135bec' };
    case 'follow_started':
      return { icon: 'person-add', color: '#2563eb' };
    case 'follow_request_accepted':
      return { icon: 'check', color: '#38bdf8' };
    case 'review_published':
      return record.targetReviewVisibility === 'subscribers'
        ? { icon: 'emoji-events', color: '#f59e0b' }
        : { icon: 'star', color: '#22c55e' };
    default:
      return null;
  }
};

const toName = (record: NotificationRecord) => record.actorName || `@${record.actorHandle}`;

const toMessage = (record: NotificationRecord, strings: NotificationStrings) => {
  switch (record.type) {
    case 'follow_request':
      return strings.followRequestMessage;
    case 'follow_started':
      return strings.followStartedMessage;
    case 'follow_request_accepted':
      return strings.followRequestAcceptedMessage;
    case 'review_published':
      return record.targetReviewVisibility === 'subscribers'
        ? strings.reviewPublishedPremiumMessage
        : strings.reviewPublishedMessage;
    default:
      return '';
  }
};

const toSectionKey = (record: NotificationRecord, now: number): keyof SectionBuckets => {
  if (
    record.type === 'follow_request' &&
    record.requestStatus !== 'accepted' &&
    record.requestStatus !== 'declined'
  ) {
    return 'new';
  }

  const timestamp = Date.parse(record.createdAt);
  if (!Number.isNaN(timestamp) && now - timestamp <= 24 * HOUR_MS) {
    return 'earlier';
  }

  return 'week';
};

const toRowItem = (
  record: NotificationRecord,
  strings: NotificationStrings,
  now: number
): NotificationRowItem => ({
  id: record.id,
  name: toName(record),
  time: toRelativeTime(record.createdAt, now),
  avatar: record.actorAvatar,
  message: toMessage(record, strings),
  badge: toBadge(record),
  preview:
    record.type === 'review_published'
      ? {
          title: record.targetReviewPlaceTitle || 'Review',
          subtitle: record.targetReviewPlaceSubtitle || `@${record.actorHandle}`,
          image: record.targetReviewImageUrl || '',
        }
      : null,
  premiumCard: record.type === 'review_published' && record.targetReviewVisibility === 'subscribers',
  action: record.type === 'follow_started' ? 'follow' : null,
  isRead: Boolean(record.readAt),
  hasRequestActions: record.type === 'follow_request',
  requestStatus:
    record.type === 'follow_request' ? (record.requestStatus || 'pending') : record.requestStatus,
});

export function buildNotificationListState(records: NotificationRecord[], strings: NotificationStrings): {
  recordsById: Record<string, NotificationRecord>;
  sections: NotificationSection[];
} {
  const now = Date.now();
  const recordsById: Record<string, NotificationRecord> = {};
  const grouped: SectionBuckets = {
    new: [],
    earlier: [],
    week: [],
  };

  records.forEach((record) => {
    recordsById[record.id] = record;
    grouped[toSectionKey(record, now)].push(toRowItem(record, strings, now));
  });

  return {
    recordsById,
    sections: [
      { title: strings.sectionNew, data: grouped.new },
      { title: strings.sectionEarlier, data: grouped.earlier },
      { title: strings.sectionWeek, data: grouped.week },
    ].filter((section) => section.data.length > 0),
  };
}
