import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { NotificationBadge, NotificationPreview } from '../../../services/notifications';
import AvatarWithBadge from './AvatarWithBadge';
import NotificationPreviewCard from './NotificationPreviewCard';
import NotificationPremiumCard from './NotificationPremiumCard';

export type NotificationRowItem = {
  id: string;
  name: string;
  time: string;
  avatar: string | null;
  message: string;
  quote?: string;
  badge?: NotificationBadge | null;
  preview?: NotificationPreview | null;
  premiumCard?: boolean;
  action?: 'follow' | null;
  isRead: boolean;
  hasRequestActions?: boolean;
  requestStatus?: 'pending' | 'accepted' | 'declined' | null;
};

type Props = {
  item: NotificationRowItem;
  theme: {
    background: string;
    surfaceMuted: string;
    border: string;
    textPrimary: string;
    textMuted: string;
    primary: string;
  };
  labels: {
    accept: string;
    decline: string;
    follow: string;
    accepted: string;
    declined: string;
    premiumTitle: string;
    premiumSubtitle: string;
    premiumCta: string;
  };
  onPress?: (notificationId: string) => void;
  onAcceptPress?: (notificationId: string) => void;
  onDeclinePress?: (notificationId: string) => void;
  onFollowPress?: (notificationId: string) => void;
  pendingAction?: boolean;
};

function NotificationRowComponent({
  item,
  theme,
  labels,
  onPress,
  onAcceptPress,
  onDeclinePress,
  onFollowPress,
  pendingAction = false,
}: Props) {
  const requestStatusChipLabel =
    item.requestStatus === 'accepted'
      ? labels.accepted
      : item.requestStatus === 'declined'
        ? labels.declined
        : null;

  return (
    <Pressable
      style={({ pressed }) => [
        styles.row,
        {
          borderBottomColor: theme.border,
          backgroundColor: item.isRead ? theme.background : `${theme.primary}14`,
          opacity: pressed ? 0.92 : 1,
        },
      ]}
      onPress={onPress ? () => onPress(item.id) : undefined}
      disabled={!onPress}
      testID={`notification-row-${item.id}`}
    >
      <View style={styles.avatarShell}>
        {!item.isRead ? (
          <View style={[styles.unreadDot, { backgroundColor: theme.primary }]} />
        ) : null}
        <AvatarWithBadge avatar={item.avatar} badge={item.badge} background={theme.background} />
      </View>

      <View style={styles.content}>
        <View style={styles.topRow}>
          <Text style={[styles.text, { color: theme.textPrimary }]}>
            <Text style={styles.bold}>{item.name}</Text> {item.message}{' '}
            {item.quote ? (
              <Text style={[styles.quote, { color: theme.textMuted }]}>{item.quote}</Text>
            ) : null}
          </Text>
          <Text style={[styles.time, { color: theme.textMuted }]}>{item.time}</Text>
        </View>

        {item.hasRequestActions && item.requestStatus === 'pending' ? (
          <View style={styles.actionRow}>
            <Pressable
              style={[
                styles.actionPrimary,
                { backgroundColor: theme.primary, opacity: pendingAction ? 0.6 : 1 },
              ]}
              disabled={pendingAction}
              onPress={onAcceptPress ? () => onAcceptPress(item.id) : undefined}
              testID={`notification-accept-${item.id}`}
            >
              <Text style={styles.actionPrimaryText}>{labels.accept}</Text>
            </Pressable>
            <Pressable
              style={[
                styles.actionSecondary,
                { borderColor: theme.border, opacity: pendingAction ? 0.6 : 1 },
              ]}
              disabled={pendingAction}
              onPress={onDeclinePress ? () => onDeclinePress(item.id) : undefined}
              testID={`notification-decline-${item.id}`}
            >
              <Text style={[styles.actionSecondaryText, { color: theme.textPrimary }]}>
                {labels.decline}
              </Text>
            </Pressable>
          </View>
        ) : null}

        {requestStatusChipLabel ? (
          <View
            style={[
              styles.statusChip,
              { borderColor: theme.border, backgroundColor: `${theme.primary}10` },
            ]}
          >
            <Text style={[styles.statusChipText, { color: theme.textPrimary }]}>
              {requestStatusChipLabel}
            </Text>
          </View>
        ) : null}

        {item.preview ? (
          <NotificationPreviewCard
            preview={item.preview}
            theme={{
              surfaceMuted: theme.surfaceMuted,
              border: theme.border,
              textPrimary: theme.textPrimary,
              textMuted: theme.textMuted,
            }}
          />
        ) : null}

        {item.premiumCard ? (
          <NotificationPremiumCard
            theme={{ primary: theme.primary }}
            labels={{
              title: labels.premiumTitle,
              subtitle: labels.premiumSubtitle,
              cta: labels.premiumCta,
            }}
          />
        ) : null}

        {item.action === 'follow' ? (
          <Pressable
            style={[
              styles.followButton,
              {
                borderColor: theme.primary,
                opacity: pendingAction ? 0.6 : 1,
              },
            ]}
            onPress={onFollowPress ? () => onFollowPress(item.id) : undefined}
            disabled={pendingAction}
            testID={`notification-follow-${item.id}`}
          >
            <Text style={[styles.followText, { color: theme.primary }]}>{labels.follow}</Text>
          </Pressable>
        ) : null}
      </View>
    </Pressable>
  );
}

const NotificationRow = React.memo(NotificationRowComponent);

export default NotificationRow;

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  avatarShell: {
    width: 48,
    alignItems: 'center',
  },
  unreadDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    position: 'absolute',
    left: -2,
    top: 22,
    zIndex: 2,
  },
  content: {
    flex: 1,
    gap: 8,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  text: {
    flex: 1,
    fontSize: 13,
    fontFamily: 'NotoSans-Regular',
    lineHeight: 18,
  },
  bold: {
    fontFamily: 'BeVietnamPro-Bold',
  },
  quote: {
    fontStyle: 'italic',
  },
  time: {
    fontSize: 11,
    fontFamily: 'NotoSans-Regular',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  actionPrimary: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
  },
  actionPrimaryText: {
    color: '#ffffff',
    fontSize: 12,
    fontFamily: 'BeVietnamPro-Bold',
  },
  actionSecondary: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
  },
  actionSecondaryText: {
    fontSize: 12,
    fontFamily: 'BeVietnamPro-Bold',
  },
  statusChip: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
  },
  statusChipText: {
    fontSize: 11,
    fontFamily: 'BeVietnamPro-Bold',
  },
  followButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
  },
  followText: {
    fontSize: 12,
    fontFamily: 'BeVietnamPro-Bold',
  },
});
