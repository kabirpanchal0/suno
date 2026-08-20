import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Song } from '../store/musicStore';
import { colors, spacing, borderRadius, typography, elevation } from '../theme/colors';

interface SongItemProps {
  song: Song;
  onPress: () => void;
  onLongPress?: () => void;
  isPlaying?: boolean;
}

const formatDuration = (seconds?: number): string => {
  if (!seconds) return '--:--';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export const SongItem: React.FC<SongItemProps> = ({
  song,
  onPress,
  onLongPress,
  isPlaying = false,
}) => {
  return (
    <TouchableOpacity
      style={[styles.container, isPlaying && styles.containerActive]}
      onPress={onPress}
      onLongPress={onLongPress}
      activeOpacity={0.7}>
      {/* Artwork */}
      <View style={styles.artwork}>
        {song.artwork ? (
          <Image source={{ uri: song.artwork }} style={styles.artworkImage} />
        ) : (
          <View style={styles.artworkPlaceholder}>
            <Icon name="music-note" size={20} color={colors.tertiary} />
          </View>
        )}
        {isPlaying && (
          <View style={styles.playingIndicator}>
            <Icon name="equalizer" size={14} color={colors.text.inverse} />
          </View>
        )}
      </View>

      {/* Song info */}
      <View style={styles.info}>
        <Text
          style={[styles.title, isPlaying && styles.titleActive]}
          numberOfLines={1}>
          {song.title}
        </Text>
        <Text style={styles.artist} numberOfLines={1}>
          {song.artist}
        </Text>
      </View>

      {/* Duration */}
      <Text style={styles.duration}>{formatDuration(song.duration)}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    marginHorizontal: spacing.sm,
    marginBottom: 2,
    borderRadius: borderRadius.md,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  containerActive: {
    backgroundColor: colors.accentDim,
    borderColor: colors.borderGlow,
  },
  artwork: {
    width: 52,
    height: 52,
    marginRight: spacing.md,
    position: 'relative',
    borderRadius: borderRadius.sm,
    overflow: 'hidden',
  },
  artworkImage: {
    width: '100%',
    height: '100%',
    borderRadius: borderRadius.sm,
  },
  artworkPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playingIndicator: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    backgroundColor: colors.accent,
    paddingHorizontal: 5,
    paddingVertical: 3,
    borderRadius: borderRadius.sm,
    ...elevation.glow,
  },
  info: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.medium,
    color: colors.text.primary,
    marginBottom: 3,
  },
  titleActive: {
    color: colors.accentLight,
    fontWeight: typography.weights.semibold,
  },
  artist: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
  },
  duration: {
    fontSize: typography.sizes.sm,
    color: colors.text.tertiary,
    marginLeft: spacing.sm,
    fontWeight: typography.weights.medium,
  },
});
