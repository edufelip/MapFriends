import React from 'react';
import { Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

type Props = {
  visible: boolean;
  onClose: () => void;
  title: string;
  message: string;
  emailLabel: string;
  emailPlaceholder: string;
  cancelLabel: string;
  confirmLabel: string;
  emailValue: string;
  onChangeEmail: (value: string) => void;
  canConfirm: boolean;
  onConfirm: () => void;
  theme: {
    background: string;
    border: string;
    surface: string;
    textPrimary: string;
    textMuted: string;
    danger: string;
  };
};

export default function DeleteAccountSheet({
  visible,
  onClose,
  title,
  message,
  emailLabel,
  emailPlaceholder,
  cancelLabel,
  confirmLabel,
  emailValue,
  onChangeEmail,
  canConfirm,
  onConfirm,
  theme,
}: Props) {
  return (
    <Modal
      transparent
      animationType="slide"
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFillObject} onPress={onClose} />
        <View style={[styles.card, { backgroundColor: theme.background, borderColor: theme.border }]}>
          <Text style={[styles.title, { color: theme.textPrimary }]}>{title}</Text>
          <Text style={[styles.message, { color: theme.textMuted }]}>{message}</Text>
          <Text style={[styles.fieldLabel, { color: theme.textPrimary }]}>{emailLabel}</Text>
          <TextInput
            style={[
              styles.input,
              {
                borderColor: theme.border,
                backgroundColor: theme.surface,
                color: theme.textPrimary,
              },
            ]}
            value={emailValue}
            onChangeText={onChangeEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            placeholder={emailPlaceholder}
            placeholderTextColor={theme.textMuted}
          />
          <View style={styles.actions}>
            <Pressable
              style={[styles.button, { backgroundColor: theme.surface, borderColor: theme.border }]}
              onPress={onClose}
            >
              <Text style={[styles.cancelText, { color: theme.textPrimary }]}>
                {cancelLabel}
              </Text>
            </Pressable>
            <Pressable
              style={[
                styles.button,
                { backgroundColor: canConfirm ? theme.danger : theme.border, borderColor: theme.border },
              ]}
              disabled={!canConfirm}
              onPress={onConfirm}
            >
              <Text style={styles.confirmText}>{confirmLabel}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  card: {
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    borderWidth: 1,
    borderBottomWidth: 0,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 30,
    gap: 10,
  },
  title: {
    fontSize: 17,
    fontFamily: 'BeVietnamPro-Bold',
  },
  message: {
    fontSize: 12,
    lineHeight: 18,
    fontFamily: 'NotoSans-Regular',
  },
  fieldLabel: {
    fontSize: 12,
    fontFamily: 'NotoSans-Bold',
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 14,
    fontFamily: 'NotoSans-Regular',
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
  },
  button: {
    flex: 1,
    borderRadius: 10,
    borderWidth: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  cancelText: {
    fontSize: 13,
    fontFamily: 'NotoSans-Bold',
  },
  confirmText: {
    color: '#ffffff',
    fontSize: 13,
    fontFamily: 'NotoSans-Bold',
  },
});
