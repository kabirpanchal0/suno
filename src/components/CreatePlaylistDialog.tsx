import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { colors, spacing, borderRadius, typography } from '../theme/colors';

interface CreatePlaylistDialogProps {
  visible: boolean;
  onClose: () => void;
  onCreate: (name: string) => void;
}

export const CreatePlaylistDialog: React.FC<CreatePlaylistDialogProps> = ({
  visible,
  onClose,
  onCreate,
}) => {
  const [playlistName, setPlaylistName] = useState('');

  const handleCreate = () => {
    if (playlistName.trim()) {
      onCreate(playlistName.trim());
      setPlaylistName('');
      onClose();
    }
  };

  const handleCancel = () => {
    setPlaylistName('');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleCancel}>
      <KeyboardAvoidingView
        style={styles.backdrop}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={handleCancel}>
          <TouchableOpacity
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}>
            <View style={styles.dialog}>
              <Text style={styles.title}>Create Playlist</Text>
              
              <TextInput
                style={styles.input}
                placeholder="Playlist name"
                placeholderTextColor={colors.text.tertiary}
                value={playlistName}
                onChangeText={setPlaylistName}
                autoFocus
                maxLength={50}
                returnKeyType="done"
                onSubmitEditing={handleCreate}
              />

              <View style={styles.buttons}>
                <TouchableOpacity
                  style={[styles.button, styles.cancelButton]}
                  onPress={handleCancel}
                  activeOpacity={0.7}>
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.button,
                    styles.createButton,
                    !playlistName.trim() && styles.createButtonDisabled,
                  ]}
                  onPress={handleCreate}
                  disabled={!playlistName.trim()}
                  activeOpacity={0.7}>
                  <Text
                    style={[
                      styles.createButtonText,
                      !playlistName.trim() && styles.createButtonTextDisabled,
                    ]}>
                    Create
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  dialog: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    width: '100%',
    maxWidth: 400,
  },
  title: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    marginBottom: spacing.lg,
  },
  input: {
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontSize: typography.sizes.md,
    color: colors.text.primary,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  buttons: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  button: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: colors.surfaceLight,
  },
  cancelButtonText: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.medium,
    color: colors.text.primary,
  },
  createButton: {
    backgroundColor: colors.accent,
  },
  createButtonDisabled: {
    backgroundColor: colors.surfaceLight,
  },
  createButtonText: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: colors.background,
  },
  createButtonTextDisabled: {
    color: colors.text.tertiary,
  },
});
