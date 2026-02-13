import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

type Props = {
  avatarUri: string | null;
  reviewerName: string;
  reviewerMeta: string;
  ratingLabel: string;
  theme: {
    primary: string;
    textPrimary: string;
    textMuted: string;
  };
};

export default function ReviewDetailReviewerRow({
  avatarUri,
  reviewerName,
  reviewerMeta,
  ratingLabel,
  theme,
}: Props) {
  const hasAvatar = Boolean(avatarUri?.trim());

  return (
    <View style={styles.wrap}>
      <View style={styles.left}>
        <View style={[styles.avatarShell, { borderColor: theme.primary }]}>
          {hasAvatar ? (
            <Image source={{ uri: avatarUri!.trim() }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatarFallback, { backgroundColor: `${theme.primary}18` }]}> 
              <MaterialIcons name="person" size={22} color={theme.textMuted} />
            </View>
          )}
        </View>
        <View style={styles.authorMeta}>
          <Text style={[styles.authorName, { color: theme.textPrimary }]}>{reviewerName}</Text>
          <Text style={[styles.authorSubline, { color: theme.textMuted }]}>{reviewerMeta}</Text>
        </View>
      </View>

      <View style={[styles.ratingPill, { backgroundColor: theme.primary }]}> 
        <Text style={styles.ratingValue}>{ratingLabel}</Text>
        <Text style={styles.ratingCaption}>Score</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  avatarShell: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  avatarFallback: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  authorMeta: {
    flex: 1,
  },
  authorName: {
    fontSize: 15,
    fontFamily: 'BeVietnamPro-Bold',
  },
  authorSubline: {
    marginTop: 2,
    fontSize: 11,
    fontFamily: 'NotoSans-Medium',
  },
  ratingPill: {
    width: 52,
    height: 52,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ratingValue: {
    color: '#ffffff',
    fontSize: 18,
    lineHeight: 20,
    fontFamily: 'BeVietnamPro-Bold',
  },
  ratingCaption: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 8,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
    fontFamily: 'NotoSans-Bold',
  },
});
