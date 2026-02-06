import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { styles } from '../ProfileSetupScreen.styles';

type Visibility = 'open' | 'locked';

type VisibilityTheme = {
  surface: string;
  border: string;
  primary: string;
  iconMuted: string;
  textPrimary: string;
  textMuted: string;
};

type Props = {
  visibility: Visibility;
  onChange: (visibility: Visibility) => void;
  theme: VisibilityTheme;
  openTitle: string;
  openDescription: string;
  openA11yLabel: string;
  lockedTitle: string;
  lockedDescription: string;
  lockedA11yLabel: string;
};

export function ProfileSetupVisibilitySelector({
  visibility,
  onChange,
  theme,
  openTitle,
  openDescription,
  openA11yLabel,
  lockedTitle,
  lockedDescription,
  lockedA11yLabel,
}: Props) {
  return (
    <View style={styles.visibilityGrid}>
      <Pressable
        onPress={() => onChange('open')}
        style={styles.visibilityCard}
        accessibilityRole="button"
        accessibilityState={{ selected: visibility === 'open' }}
        accessibilityLabel={openA11yLabel}
      >
        <View
          style={[
            styles.visibilityCardInner,
            {
              backgroundColor: theme.surface,
              borderColor: visibility === 'open' ? theme.primary : theme.border,
            },
          ]}
        >
          <MaterialIcons
            name="public"
            size={24}
            color={visibility === 'open' ? theme.primary : theme.iconMuted}
          />
          <Text
            style={[
              styles.visibilityTitle,
              { color: visibility === 'open' ? theme.primary : theme.textPrimary },
            ]}
          >
            {openTitle}
          </Text>
          <Text style={[styles.visibilityDesc, { color: theme.textMuted }]}>{openDescription}</Text>
        </View>

        {visibility === 'open' ? (
          <MaterialIcons
            name="check-circle"
            size={18}
            color={theme.primary}
            style={styles.visibilityCheck}
          />
        ) : null}
      </Pressable>

      <Pressable
        onPress={() => onChange('locked')}
        style={styles.visibilityCard}
        accessibilityRole="button"
        accessibilityState={{ selected: visibility === 'locked' }}
        accessibilityLabel={lockedA11yLabel}
      >
        <View
          style={[
            styles.visibilityCardInner,
            {
              backgroundColor: theme.surface,
              borderColor: visibility === 'locked' ? theme.primary : theme.border,
            },
          ]}
        >
          <MaterialIcons
            name="lock"
            size={24}
            color={visibility === 'locked' ? theme.primary : theme.iconMuted}
          />
          <Text
            style={[
              styles.visibilityTitle,
              { color: visibility === 'locked' ? theme.primary : theme.textPrimary },
            ]}
          >
            {lockedTitle}
          </Text>
          <Text style={[styles.visibilityDesc, { color: theme.textMuted }]}>{lockedDescription}</Text>
        </View>

        {visibility === 'locked' ? (
          <MaterialIcons
            name="check-circle"
            size={18}
            color={theme.primary}
            style={styles.visibilityCheck}
          />
        ) : null}
      </Pressable>
    </View>
  );
}
