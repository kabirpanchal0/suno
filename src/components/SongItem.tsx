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
import { colors, spacing, borderRadius, typography } from '../theme/colors';

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
            <Icon name="equalizer" size={16} color={colors.background} />
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
    backgroundColor: 'transparent',
  },
  containerActive: {
    backgroundColor: colors.surfaceLight,
  },
  artwork: {
    width: 52,
    height: 52,
    marginRight: spacing.md,
    position: 'relative',
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
    bottom: 6,
    right: 6,
    backgroundColor: colors.accent,
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 4,
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
    color: colors.accent,
  },
  artist: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
  },
  duration: {
    fontSize: typography.sizes.sm,
    color: colors.text.tertiary,
    marginLeft: spacing.sm,
  },
});
