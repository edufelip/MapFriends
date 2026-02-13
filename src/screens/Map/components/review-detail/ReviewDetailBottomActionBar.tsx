import React from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

type Props = {
  bottomInset: number;
  isLiked: boolean;
  likeCount: number;
  isTogglingLike: boolean;
  onToggleLike: () => void;
  isFavorited: boolean;
  isSavingFavorite: boolean;
  onToggleFavorite: () => void;
  onShare: () => void;
  labels: {
    like: string;
    save: string;
    saved: string;
  };
  theme: {
    primary: string;
    surface: string;
    border: string;
    textPrimary: string;
    textMuted: string;
    danger: string;
    glass: string;
  };
};

export default function ReviewDetailBottomActionBar({
  bottomInset,
  isLiked,
  likeCount,
  isTogglingLike,
  onToggleLike,
  isFavorited,
  isSavingFavorite,
  onToggleFavorite,
  onShare,
  labels,
  theme,
}: Props) {
  const likeScale = React.useRef(new Animated.Value(1)).current;

  const animateLikeTap = React.useCallback(() => {
    likeScale.setValue(0.92);
    Animated.sequence([
      Animated.timing(likeScale, {
        toValue: 1.2,
        duration: 120,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.spring(likeScale, {
        toValue: 1,
        friction: 4,
        tension: 90,
        useNativeDriver: true,
      }),
    ]).start();
  }, [likeScale]);

  const handleToggleLike = React.useCallback(() => {
    animateLikeTap();
    onToggleLike();
  }, [animateLikeTap, onToggleLike]);

  return (
    <View
      style={[
        styles.container,
        {
          paddingBottom: Math.max(12, bottomInset),
          backgroundColor: theme.glass,
          borderTopColor: theme.border,
        },
      ]}
    >
      <View style={styles.actionsRow}>
        <Pressable
          accessibilityRole="button"
          onPress={handleToggleLike}
          style={[styles.likeButton, { borderColor: `${theme.danger}66`, backgroundColor: `${theme.danger}14` }]}
          disabled={isTogglingLike}
        >
          <Animated.View style={{ transform: [{ scale: likeScale }] }}>
            <MaterialIcons
              name={isLiked ? 'favorite' : 'favorite-border'}
              size={18}
              color={theme.danger}
            />
          </Animated.View>
          <Text style={[styles.likeButtonText, { color: theme.danger }]}> 
            {labels.like} {Math.max(0, likeCount)}
          </Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          onPress={onToggleFavorite}
          disabled={isSavingFavorite}
          style={[
            styles.primaryButton,
            { backgroundColor: theme.primary, opacity: isSavingFavorite ? 0.75 : 1 },
          ]}
        >
          {isSavingFavorite ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <MaterialIcons name={isFavorited ? 'bookmark' : 'bookmark-border'} size={18} color="#ffffff" />
          )}
          <Text style={styles.primaryButtonText}>{isFavorited ? labels.saved : labels.save}</Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          onPress={onShare}
          style={[styles.secondaryButton, { backgroundColor: theme.surface, borderColor: theme.border }]}
        >
          <MaterialIcons name="share" size={20} color={theme.textPrimary} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    borderTopWidth: 1,
    paddingTop: 12,
    paddingHorizontal: 18,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  likeButton: {
    minHeight: 54,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  likeButtonText: {
    fontSize: 12,
    fontFamily: 'NotoSans-Bold',
  },
  primaryButton: {
    flex: 1,
    minHeight: 54,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontFamily: 'BeVietnamPro-Bold',
  },
  secondaryButton: {
    width: 54,
    height: 54,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
