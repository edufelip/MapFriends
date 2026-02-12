import React from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

type Props = {
  onCreate: () => void;
  theme: {
    background: string;
    surface: string;
    textPrimary: string;
    textMuted: string;
    primary: string;
    border: string;
  };
  strings: {
    title: string;
    subtitle: string;
    cta: string;
    footnote: string;
  };
};

function FeedEmptyState({ onCreate, theme, strings }: Props) {
  const entrance = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.timing(entrance, {
      toValue: 1,
      duration: 320,
      useNativeDriver: true,
    }).start();
  }, [entrance]);

  return (
    <View style={styles.container} testID="feed-empty-state">
      <View style={[styles.glowLarge, { backgroundColor: theme.primary }]} />
      <View style={[styles.glowSmall, { backgroundColor: theme.primary }]} />

      <Animated.View
        style={[
          styles.card,
          {
            backgroundColor: theme.surface,
            borderColor: theme.border,
            opacity: entrance,
            transform: [
              {
                translateY: entrance.interpolate({
                  inputRange: [0, 1],
                  outputRange: [14, 0],
                }),
              },
            ],
          },
        ]}
      >
        <View style={[styles.iconWrap, { borderColor: theme.border, backgroundColor: theme.background }]}>
          <MaterialIcons name="nightlight-round" size={20} color={theme.primary} />
        </View>

        <Text style={[styles.title, { color: theme.textPrimary }]}>{strings.title}</Text>
        <Text style={[styles.subtitle, { color: theme.textMuted }]}>{strings.subtitle}</Text>

        <Pressable
          style={({ pressed }) => [
            styles.cta,
            {
              backgroundColor: theme.primary,
              opacity: pressed ? 0.88 : 1,
            },
          ]}
          onPress={onCreate}
          testID="feed-empty-cta"
          accessibilityRole="button"
          accessibilityLabel={strings.cta}
        >
          <Text style={styles.ctaText}>{strings.cta}</Text>
        </Pressable>

        <Text style={[styles.footnote, { color: theme.textMuted }]}>{strings.footnote}</Text>
      </Animated.View>
    </View>
  );
}

export default React.memo(FeedEmptyState);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    minHeight: 420,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  glowLarge: {
    position: 'absolute',
    width: 240,
    height: 240,
    borderRadius: 120,
    opacity: 0.08,
    top: '24%',
  },
  glowSmall: {
    position: 'absolute',
    width: 130,
    height: 130,
    borderRadius: 65,
    opacity: 0.1,
    bottom: '24%',
    right: '20%',
  },
  card: {
    width: '100%',
    borderWidth: 1,
    borderRadius: 24,
    paddingHorizontal: 22,
    paddingVertical: 26,
    alignItems: 'center',
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  title: {
    textAlign: 'center',
    fontSize: 21,
    lineHeight: 28,
    fontFamily: 'BeVietnamPro-Bold',
  },
  subtitle: {
    marginTop: 10,
    textAlign: 'center',
    fontSize: 14,
    lineHeight: 21,
    fontFamily: 'NotoSans-Regular',
  },
  cta: {
    marginTop: 20,
    borderRadius: 999,
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  ctaText: {
    color: '#ffffff',
    fontSize: 14,
    fontFamily: 'BeVietnamPro-Bold',
  },
  footnote: {
    marginTop: 15,
    textAlign: 'center',
    fontSize: 12,
    lineHeight: 18,
    fontFamily: 'NotoSans-Regular',
  },
});
