import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Animated,
  Dimensions,
} from 'react-native';
import Slider from '@react-native-community/slider';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import TrackPlayer, { useProgress } from 'react-native-track-player';
import { useMusicStore } from '../store/musicStore';
import { colors, spacing, borderRadius, typography } from '../theme/colors';
import {
  play,
  pause,
  skipToNext,
  skipToPrevious,
  seekTo,
  setRepeatMode,
} from '../services/MusicService';

const { width } = Dimensions.get('window');
const ARTWORK_SIZE = width - spacing.xl * 2;

const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export const NowPlayingScreen: React.FC<{ onClose: () => void }> = ({
  onClose,
}) => {
  const {
    currentSong,
    isPlaying,
    shuffle,
    repeat,
    queue,
    toggleShuffle,
    toggleRepeat,
    toggleFavorite,
    favorites,
    setIsPlaying,
  } = useMusicStore();

  const { position, duration } = useProgress();
  const [isSeeking, setIsSeeking] = useState(false);
  const [seekPosition, setSeekPosition] = useState(0);

  const rotateAnim = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isPlaying) {
      Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 20000,
          useNativeDriver: true,
        })
      ).start();
    } else {
      rotateAnim.stopAnimation();
    }
  }, [isPlaying]);

  const rotation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const handlePlayPause = async () => {
    if (isPlaying) {
      await pause();
      setIsPlaying(false);
    } else {
      await play();
      setIsPlaying(true);
    }
  };

  const handleNext = async () => {
    await skipToNext();
  };

  const handlePrevious = async () => {
    await skipToPrevious();
  };

  const handleSeekStart = () => {
    setIsSeeking(true);
  };

  const handleSeekChange = (value: number) => {
    setSeekPosition(value);
  };

  const handleSeekComplete = async (value: number) => {
    await seekTo(value);
    setIsSeeking(false);
  };

  const handleShuffle = () => {
    toggleShuffle();
  };

  const handleRepeat = async () => {
    toggleRepeat();
    const newRepeat = repeat === 'off' ? 'queue' : repeat === 'queue' ? 'track' : 'off';
    await setRepeatMode(newRepeat);
  };

  const handleFavorite = () => {
    if (currentSong) {
      toggleFavorite(currentSong);
    }
  };

  const isFavorite = currentSong
    ? favorites.some((s) => s.id === currentSong.id)
    : false;

  const displayPosition = isSeeking ? seekPosition : position;

  if (!currentSong) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Icon name="chevron-down" size={28} color={colors.text.primary} />
          </TouchableOpacity>
        </View>
        <View style={styles.emptyContainer}>
          <Icon name="music-note-off" size={80} color={colors.tertiary} />
          <Text style={styles.emptyText}>No song playing</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Icon name="chevron-down" size={28} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Now Playing</Text>
        <TouchableOpacity onPress={handleFavorite} style={styles.favoriteButton}>
          <Icon 
            name={isFavorite ? "heart" : "heart-outline"} 
            size={26} 
            color={isFavorite ? colors.accent : colors.text.tertiary} 
          />
        </TouchableOpacity>
      </View>

      {/* Artwork */}
      <View style={styles.artworkContainer}>
        <Animated.View style={[styles.artwork, { transform: [{ rotate: rotation }] }]}>
          {currentSong.artwork ? (
            <Image
              source={{ uri: currentSong.artwork }}
              style={styles.artworkImage}
            />
          ) : (
            <View style={styles.artworkPlaceholder}>
              <Icon name="music-note" size={100} color={colors.tertiary} />
            </View>
          )}
        </Animated.View>
      </View>

      {/* Song Info */}
      <View style={styles.infoContainer}>
        <Text style={styles.title} numberOfLines={2}>
          {currentSong.title}
        </Text>
        <Text style={styles.artist} numberOfLines={1}>
          {currentSong.artist}
        </Text>
        {currentSong.album && (
          <Text style={styles.album} numberOfLines={1}>
            {currentSong.album}
          </Text>
        )}
      </View>

      {/* Progress */}
      <View style={styles.progressContainer}>
        <Slider
          style={styles.slider}
          value={displayPosition}
          minimumValue={0}
          maximumValue={duration || 1}
          minimumTrackTintColor={colors.accent}
          maximumTrackTintColor={colors.surfaceLight}
          thumbTintColor={colors.accent}
          onSlidingStart={handleSeekStart}
          onValueChange={handleSeekChange}
          onSlidingComplete={handleSeekComplete}
        />
        <View style={styles.timeContainer}>
          <Text style={styles.time}>{formatTime(displayPosition)}</Text>
          <Text style={styles.time}>{formatTime(duration)}</Text>
        </View>
      </View>

      {/* Controls */}
      <View style={styles.controlsContainer}>
        <TouchableOpacity
          style={styles.secondaryControl}
          onPress={handleShuffle}>
          <Icon 
            name="shuffle" 
            size={26} 
            color={shuffle ? colors.accent : colors.text.primary} 
          />
        </TouchableOpacity>

        <TouchableOpacity style={styles.control} onPress={handlePrevious}>
          <Icon name="skip-previous" size={32} color={colors.text.primary} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.playButton} onPress={handlePlayPause}>
          <Icon 
            name={isPlaying ? "pause" : "play"} 
            size={36} 
            color={colors.background} 
          />
        </TouchableOpacity>

        <TouchableOpacity style={styles.control} onPress={handleNext}>
          <Icon name="skip-next" size={32} color={colors.text.primary} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryControl}
          onPress={handleRepeat}>
          <Icon 
            name={repeat === 'track' ? 'repeat-once' : 'repeat'} 
            size={26} 
            color={repeat !== 'off' ? colors.accent : colors.text.primary} 
          />
        </TouchableOpacity>
      </View>

      {/* Queue Info */}
      {queue.length > 0 && (
        <View style={styles.queueInfo}>
          <Text style={styles.queueText}>
            {queue.length} song{queue.length !== 1 ? 's' : ''} in queue
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.md,
  },
  closeButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
    color: colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  favoriteButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  artworkContainer: {
    alignItems: 'center',
    marginVertical: spacing.xl,
  },
  artwork: {
    width: ARTWORK_SIZE,
    height: ARTWORK_SIZE,
  },
  artworkImage: {
    width: '100%',
    height: '100%',
    borderRadius: borderRadius.lg,
  },
  artworkPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoContainer: {
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.xl,
  },
  title: {
    fontSize: typography.sizes.xxl,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  artist: {
    fontSize: typography.sizes.lg,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  album: {
    fontSize: typography.sizes.md,
    color: colors.text.tertiary,
    textAlign: 'center',
  },
  progressContainer: {
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.xl,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  timeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  time: {
    fontSize: typography.sizes.sm,
    color: colors.text.tertiary,
  },
  controlsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
    paddingHorizontal: spacing.xl,
  },
  control: {
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryControl: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  controlIcon: {
    fontSize: typography.sizes.xl,
    color: colors.text.primary,
  },
  controlIconActive: {
    color: colors.accent,
  },
  playButton: {
    width: 70,
    height: 70,
    borderRadius: borderRadius.full,
    backgroundColor: colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
  },
  queueInfo: {
    marginTop: spacing.xl,
    alignItems: 'center',
  },
  queueText: {
    fontSize: typography.sizes.sm,
    color: colors.text.tertiary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: typography.sizes.lg,
    color: colors.text.secondary,
    marginTop: spacing.lg,
  },
});
