import React from 'react';
import { Image, Pressable, Text, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { styles } from '../ProfileSetupScreen.styles';

type AvatarTheme = {
  border: string;
  surface: string;
  primary: string;
  background: string;
  textMuted: string;
  danger: string;
};

type Props = {
  avatarUri: string | null;
  onPress: () => void;
  avatarLabel: string;
  addA11yLabel: string;
  changeA11yLabel: string;
  a11yHint: string;
  errorMessage: string | null;
  theme: AvatarTheme;
};

export function ProfileSetupAvatarSection({
  avatarUri,
  onPress,
  avatarLabel,
  addA11yLabel,
  changeA11yLabel,
  a11yHint,
  errorMessage,
  theme,
}: Props) {
  return (
    <View style={styles.avatarSection}>
      <Pressable
        style={styles.avatarWrapper}
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={avatarUri ? changeA11yLabel : addA11yLabel}
        accessibilityHint={a11yHint}
      >
        {avatarUri ? (
          <Image
            source={{ uri: avatarUri }}
            style={[
              styles.avatarImage,
              { borderColor: theme.border, backgroundColor: theme.surface },
            ]}
            accessibilityIgnoresInvertColors
          />
        ) : (
          <View
            style={[
              styles.avatarImage,
              { borderColor: theme.border, backgroundColor: theme.surface },
            ]}
          >
            <MaterialIcons name="add-a-photo" size={32} color={theme.textMuted} />
          </View>
        )}

        <View
          style={[
            styles.avatarBadge,
            { backgroundColor: theme.primary, borderColor: theme.background },
          ]}
        >
          <MaterialIcons name="edit" size={12} color="#ffffff" />
        </View>
      </Pressable>

      <Text style={[styles.avatarLabel, { color: theme.textMuted }]}>{avatarLabel}</Text>
      {errorMessage ? (
        <Text style={[styles.avatarError, { color: theme.danger }]}>{errorMessage}</Text>
      ) : null}
    </View>
  );
}
