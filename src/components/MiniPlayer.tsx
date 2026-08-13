import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Animated,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useMusicStore } from '../store/musicStore';
import { colors, spacing, borderRadius, typography } from '../theme/colors';
import { play, pause } from '../services/MusicService';

interface MiniPlayerProps {
  onPress: () => void;
}

export const MiniPlayer: React.FC<MiniPlayerProps> = ({ onPress }) => {
  const { currentSong, isPlaying, position, duration } = useMusicStore();
  const scaleAnim = React.useRef(new Animated.Value(1)).current;

  if (!currentSong) {
    return null;
  }

  const handlePlayPause = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    if (isPlaying) {
      pause();
    } else {
      play();
    }
  };

  const progress = duration > 0 ? position / duration : 0;

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.9}>
      {/* Progress bar */}
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
      </View>

      <View style={styles.content}>
        {/* Artwork */}
        <View style={styles.artwork}>
          {currentSong.artwork ? (
            <Image source={{ uri: currentSong.artwork }} style={styles.artworkImage} />
          ) : (
            <View style={styles.artworkPlaceholder}>
              <Icon name="music-note" size={24} color={colors.tertiary} />
            </View>
          )}
        </View>

        {/* Song info */}
        <View style={styles.info}>
          <Text style={styles.title} numberOfLines={1}>
            {currentSong.title}
          </Text>
          <Text style={styles.artist} numberOfLines={1}>
            {currentSong.artist}
          </Text>
        </View>

        {/* Play/Pause button */}
        <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
          <TouchableOpacity
            style={styles.playButton}
            onPress={handlePlayPause}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Icon 
              name={isPlaying ? "pause" : "play"} 
              size={20} 
              color={colors.text.primary} 
            />
          </TouchableOpacity>
        </Animated.View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  progressBar: {
    height: 2,
    backgroundColor: colors.surfaceLight,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.accent,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
  },
  artwork: {
    width: 48,
    height: 48,
    marginRight: spacing.md,
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
  info: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.medium,
    color: colors.text.primary,
    marginBottom: 2,
  },
  artist: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
  },
  playButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: borderRadius.full,
    backgroundColor: colors.surfaceLight,
  },
});
