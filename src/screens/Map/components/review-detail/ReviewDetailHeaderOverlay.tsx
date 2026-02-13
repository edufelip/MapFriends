import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

type Props = {
  topInset: number;
  onBack: () => void;
  onMorePress?: () => void;
  showMoreButton?: boolean;
  theme: {
    textPrimary: string;
    glass: string;
  };
};

export default function ReviewDetailHeaderOverlay({
  topInset,
  onBack,
  onMorePress,
  showMoreButton = false,
  theme,
}: Props) {
  return (
    <View style={[styles.container, { paddingTop: topInset + 8 }]}>
      <Pressable
        accessibilityRole="button"
        onPress={onBack}
        style={[styles.actionButton, { borderColor: 'rgba(255,255,255,0.15)', backgroundColor: theme.glass }]}
      >
        <MaterialIcons name="arrow-back-ios-new" size={18} color={theme.textPrimary} />
      </Pressable>
      {showMoreButton && onMorePress ? (
        <Pressable
          accessibilityRole="button"
          onPress={onMorePress}
          style={[
            styles.actionButton,
            { borderColor: 'rgba(255,255,255,0.15)', backgroundColor: theme.glass },
          ]}
        >
          <MaterialIcons name="more-horiz" size={20} color={theme.textPrimary} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 30,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
