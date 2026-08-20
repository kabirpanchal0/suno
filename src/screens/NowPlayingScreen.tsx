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
import { colors, spacing, borderRadius, typography, elevation } from '../theme/colors';
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

  const { position, duration } = useProgress(250, 250); // Update every 250ms
  const [isSeeking, setIsSeeking] = useState(false);
  const [tempPosition, setTempPosition] = useState(0);

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

  const handleSlidingStart = (value: number) => {
    setIsSeeking(true);
    setTempPosition(value);
  };

  const handleValueChange = (value: number) => {
    if (isSeeking) {
      setTempPosition(value);
    }
  };

  const handleSlidingComplete = async (value: number) => {
    try {
      await seekTo(value);
    } finally {
      setIsSeeking(false);
    }
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

  // Use temp position while seeking, otherwise use actual position
  const currentPosition = isSeeking ? tempPosition : position;
  const currentDuration = duration || 0;

  if (!currentSong) {
    return (
      <View style={styles.container}>
        <View style={styles.ambientGlowWarm} pointerEvents="none" />
        <View style={styles.ambientGlowCool} pointerEvents="none" />
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
      {/* Ambient gradient-mesh glow, echoing the artwork's mood */}
      <View style={styles.ambientGlowWarm} pointerEvents="none" />
      <View style={styles.ambientGlowCool} pointerEvents="none" />

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
        <View style={styles.artworkHalo} />
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
          <View style={styles.artworkRim} pointerEvents="none" />
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
          value={currentPosition}
          minimumValue={0}
          maximumValue={Math.max(currentDuration, 1)}
          minimumTrackTintColor={colors.accent}
          maximumTrackTintColor={colors.surfaceLight}
          thumbTintColor={colors.accent}
          onSlidingStart={handleSlidingStart}
          onValueChange={handleValueChange}
          onSlidingComplete={handleSlidingComplete}
          step={0.1}
          tapToSeek={true}
        />
        <View style={styles.timeContainer}>
          <Text style={styles.time}>{formatTime(currentPosition)}</Text>
          <Text style={styles.time}>{formatTime(currentDuration)}</Text>
        </View>
      </View>

      {/* Controls */}
      <View style={styles.controlsContainer}>
        <TouchableOpacity
          style={[styles.secondaryControl, shuffle && styles.secondaryControlActive]}
          onPress={handleShuffle}>
          <Icon
            name="shuffle"
            size={22}
            color={shuffle ? colors.accent : colors.text.tertiary}
          />
        </TouchableOpacity>

        <TouchableOpacity style={styles.control} onPress={handlePrevious}>
          <Icon name="skip-previous" size={32} color={colors.text.primary} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.playButton} onPress={handlePlayPause} activeOpacity={0.85}>
          <Icon
            name={isPlaying ? "pause" : "play"}
            size={34}
            color={colors.text.inverse}
          />
        </TouchableOpacity>

        <TouchableOpacity style={styles.control} onPress={handleNext}>
          <Icon name="skip-next" size={32} color={colors.text.primary} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.secondaryControl, repeat !== 'off' && styles.secondaryControlActive]}
          onPress={handleRepeat}>
          <Icon
            name={repeat === 'track' ? 'repeat-once' : 'repeat'}
            size={22}
            color={repeat !== 'off' ? colors.accent : colors.text.tertiary}
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
    overflow: 'hidden',
  },
  ambientGlowWarm: {
    position: 'absolute',
    top: -140,
    left: -80,
    width: 380,
    height: 380,
    borderRadius: 999,
    backgroundColor: colors.glowWarm,
  },
  ambientGlowCool: {
    position: 'absolute',
    bottom: -160,
    right: -100,
    width: 360,
    height: 360,
    borderRadius: 999,
    backgroundColor: colors.glowCool,
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
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
    color: colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: typography.letterSpacing.wider,
  },
  favoriteButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  artworkContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: spacing.xl,
  },
  artworkHalo: {
    position: 'absolute',
    width: ARTWORK_SIZE + 60,
    height: ARTWORK_SIZE + 60,
    borderRadius: (ARTWORK_SIZE + 60) / 2,
    backgroundColor: colors.accentGlow,
    opacity: 0.35,
  },
  artwork: {
    width: ARTWORK_SIZE,
    height: ARTWORK_SIZE,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.5,
    shadowRadius: 28,
    elevation: 16,
  },
  artworkImage: {
    width: '100%',
    height: '100%',
    borderRadius: ARTWORK_SIZE / 2,
  },
  artworkPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.surfaceLight,
    borderRadius: ARTWORK_SIZE / 2,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  artworkRim: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: ARTWORK_SIZE / 2,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  infoContainer: {
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.xl,
  },
  title: {
    fontSize: typography.sizes.xxl,
    fontWeight: typography.weights.bold,
    letterSpacing: typography.letterSpacing.tight,
    color: colors.text.primary,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  artist: {
    fontSize: typography.sizes.lg,
    color: colors.accentLight,
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
    fontWeight: typography.weights.medium,
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
    borderRadius: borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryControlActive: {
    backgroundColor: colors.accentDim,
  },
  controlIcon: {
    fontSize: typography.sizes.xl,
    color: colors.text.primary,
  },
  controlIconActive: {
    color: colors.accent,
  },
  playButton: {
    width: 74,
    height: 74,
    borderRadius: borderRadius.full,
    backgroundColor: colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
    ...elevation.glow,
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
