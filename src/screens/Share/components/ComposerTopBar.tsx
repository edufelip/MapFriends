import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

type Props = {
  topInset: number;
  onBack: () => void;
  onSubmit: () => void;
  submitLabel: string;
  isSubmitting: boolean;
  disabled: boolean;
  theme: {
    surface: string;
    border: string;
    textPrimary: string;
    textMuted: string;
    primary: string;
  };
};

export default function ComposerTopBar({
  topInset,
  onBack,
  onSubmit,
  submitLabel,
  isSubmitting,
  disabled,
  theme,
}: Props) {
  const isDisabled = disabled || isSubmitting;

  return (
    <View style={[styles.container, { top: topInset + 8 }]}>
      <Pressable
        onPress={onBack}
        style={[
          styles.backButton,
          {
            backgroundColor: theme.surface,
            borderColor: theme.border,
          },
        ]}
      >
        <MaterialIcons name="arrow-back-ios-new" size={16} color={theme.textPrimary} />
      </Pressable>

      <Pressable
        onPress={onSubmit}
        disabled={isDisabled}
        accessibilityRole="button"
        accessibilityState={{ disabled: isDisabled }}
        testID="review-submit"
        style={[
          styles.submitButton,
          {
            backgroundColor: isDisabled ? `${theme.primary}66` : theme.primary,
          },
        ]}
      >
        {isSubmitting ? (
          <ActivityIndicator size="small" color="#ffffff" />
        ) : (
          <Text style={styles.submitText}>{submitLabel}</Text>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 2,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButton: {
    minWidth: 76,
    height: 34,
    borderRadius: 17,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitText: {
    color: '#ffffff',
    fontSize: 12,
    fontFamily: 'NotoSans-Bold',
  },
});
