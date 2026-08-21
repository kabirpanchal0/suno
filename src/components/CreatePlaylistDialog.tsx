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
  StatusBar,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { colors, spacing, borderRadius, typography, elevation } from '../theme/colors';

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
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={handleCancel}>
      <StatusBar barStyle="light-content" />
      <View style={styles.container}>
        {/* Gradient Background Layers */}
        <View style={styles.gradientLayer1} />
        <View style={styles.gradientLayer2} />
        <View style={styles.gradientLayer3} />

        <KeyboardAvoidingView
          style={styles.keyboardView}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={0}>

          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={handleCancel}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Icon name="close" size={28} color={colors.text.primary} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>New Playlist</Text>
            <View style={styles.headerSpacer} />
          </View>

          {/* Content - Centered vertically */}
          <View style={styles.content}>
            {/* Description at Top */}
            <Text style={styles.description}>
              Create a new playlist to organize your favorite songs
            </Text>

            {/* Decorative Music Icons */}
            <View style={styles.decorativeContainer}>
              <View style={[styles.iconCircle, styles.iconCircle1]}>
                <Icon name="music-note" size={24} color={colors.accent} />
              </View>
              <View style={[styles.iconCircle, styles.iconCircle2]}>
                <Icon name="playlist-music" size={20} color={colors.secondaryAccent} />
              </View>
              <View style={[styles.iconCircle, styles.iconCircle3]}>
                <Icon name="music" size={18} color={colors.accentLight} />
              </View>
              <View style={[styles.iconCircle, styles.iconCircle4]}>
                <Icon name="headphones" size={22} color={colors.secondaryAccent} />
              </View>
              <View style={[styles.iconCircle, styles.iconCircle5]}>
                <Icon name="music-note-eighth" size={16} color={colors.accent} />
              </View>
            </View>

            {/* Input Section */}
            <View style={styles.inputSection}>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  placeholder="Enter playlist name"
                  placeholderTextColor={colors.tertiary}
                  value={playlistName}
                  onChangeText={setPlaylistName}
                  autoFocus
                  maxLength={50}
                  returnKeyType="done"
                  onSubmitEditing={handleCreate}
                />
              </View>
              <Text style={styles.charCount}>
                {playlistName.length}/50
              </Text>
            </View>

            {/* Buttons Side by Side */}
            <View style={styles.buttonsContainer}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={handleCancel}
                activeOpacity={0.7}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.createButton,
                  !playlistName.trim() && styles.createButtonDisabled,
                ]}
                onPress={handleCreate}
                disabled={!playlistName.trim()}
                activeOpacity={0.8}>
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
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  gradientLayer1: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '40%',
    backgroundColor: colors.glowCool,
  },
  gradientLayer2: {
    position: 'absolute',
    top: '30%',
    left: 0,
    right: 0,
    height: '40%',
    backgroundColor: colors.gradientMid,
    opacity: 0.6,
  },
  gradientLayer3: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '40%',
    backgroundColor: colors.glowWarm,
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.lg,
  },
  closeButton: {
    padding: spacing.xs,
    width: 44,
  },
  headerTitle: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    letterSpacing: typography.letterSpacing.tight,
    color: colors.text.primary,
    flex: 1,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 44,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    justifyContent: 'center',
  },
  description: {
    fontSize: typography.sizes.md,
    color: colors.text.secondary,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  decorativeContainer: {
    height: 120,
    marginBottom: spacing.xl,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconCircle: {
    position: 'absolute',
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.surfaceGlass,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  iconCircle1: {
    top: 20,
    left: '15%',
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  iconCircle2: {
    top: 10,
    right: '20%',
    width: 45,
    height: 45,
    borderRadius: 22.5,
  },
  iconCircle3: {
    bottom: 15,
    left: '25%',
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  iconCircle4: {
    bottom: 25,
    right: '15%',
    width: 55,
    height: 55,
    borderRadius: 27.5,
  },
  iconCircle5: {
    top: 50,
    left: '50%',
    width: 35,
    height: 35,
    borderRadius: 17.5,
    marginLeft: -17.5,
  },
  inputSection: {
    marginBottom: spacing.xl,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 2,
    borderColor: colors.borderGlow,
  },
  input: {
    flex: 1,
    paddingVertical: spacing.md,
    fontSize: typography.sizes.xl,
    color: colors.text.primary,
    fontWeight: typography.weights.medium,
  },
  charCount: {
    fontSize: typography.sizes.xs,
    color: colors.text.tertiary,
    marginTop: spacing.sm,
    textAlign: 'right',
  },
  buttonsContainer: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.medium,
    color: colors.text.primary,
  },
  createButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderRadius: borderRadius.full,
    backgroundColor: colors.accent,
    gap: spacing.xs,
    ...elevation.glow,
  },
  createButtonDisabled: {
    backgroundColor: colors.surfaceLight,
    shadowOpacity: 0,
    elevation: 0,
  },
  createButtonText: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
    color: colors.text.inverse,
  },
  createButtonTextDisabled: {
    color: colors.text.tertiary,
  },
});
