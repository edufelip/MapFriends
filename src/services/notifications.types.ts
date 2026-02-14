export type NotificationBadge = {
  icon: string;
  color: string;
};

export type NotificationPreview = {
  title: string;
  subtitle: string;
  image: string;
};

export type NotificationType =
  | 'follow_started'
  | 'follow_request'
  | 'review_published'
  | 'follow_request_accepted';

export type NotificationRequestStatus = 'pending' | 'accepted' | 'declined' | null;

export type NotificationRecord = {
  id: string;
  userId: string;
  type: NotificationType;
  actorUserId: string;
  actorName: string;
  actorHandle: string;
  actorAvatar: string | null;
  createdAt: string;
  readAt: string | null;
  requestStatus: NotificationRequestStatus;
  targetReviewId: string | null;
  targetReviewPlaceTitle: string | null;
  targetReviewPlaceSubtitle: string | null;
  targetReviewImageUrl: string | null;
  targetReviewVisibility: 'followers' | 'subscribers' | null;
};

export type CreateNotificationInput = {
  id?: string;
  userId: string;
  type: NotificationType;
  actorUserId: string;
  actorName: string;
  actorHandle: string;
  actorAvatar?: string | null;
  createdAt: string;
  readAt?: string | null;
  requestStatus?: NotificationRequestStatus;
  targetReviewId?: string | null;
  targetReviewPlaceTitle?: string | null;
  targetReviewPlaceSubtitle?: string | null;
  targetReviewImageUrl?: string | null;
  targetReviewVisibility?: 'followers' | 'subscribers' | null;
};

export type ListNotificationsResult = {
  items: NotificationRecord[];
  unreadCount: number;
};
