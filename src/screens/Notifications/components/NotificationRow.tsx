import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { NotificationItem } from '../../../services/notifications';
import AvatarWithBadge from './AvatarWithBadge';
import NotificationPreviewCard from './NotificationPreviewCard';
import NotificationPremiumCard from './NotificationPremiumCard';

type Props = {
  item: NotificationItem;
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
    premiumTitle: string;
    premiumSubtitle: string;
    premiumCta: string;
  };
};

export default function NotificationRow({ item, theme, labels }: Props) {
  return (
    <View style={[styles.row, { borderBottomColor: theme.border }]}> 
      <AvatarWithBadge avatar={item.avatar} badge={item.badge} background={theme.background} />
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

        {item.actions?.length ? (
          <View style={styles.actionRow}>
            <Pressable style={[styles.actionPrimary, { backgroundColor: theme.primary }]}>
              <Text style={styles.actionPrimaryText}>{labels.accept}</Text>
            </Pressable>
            <Pressable style={[styles.actionSecondary, { borderColor: theme.border }]}> 
              <Text style={[styles.actionSecondaryText, { color: theme.textPrimary }]}>
                {labels.decline}
              </Text>
            </Pressable>
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
          <Pressable style={[styles.followButton, { borderColor: theme.primary }]}> 
            <Text style={[styles.followText, { color: theme.primary }]}>{labels.follow}</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
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
