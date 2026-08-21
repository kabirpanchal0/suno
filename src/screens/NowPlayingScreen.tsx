import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Animated,
  Dimensions,
} from 'react-native';
import { Gesture, GestureDetector, ScrollView } from 'react-native-gesture-handler';
import Slider from '@react-native-community/slider';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useProgress } from 'react-native-track-player';
import { useMusicStore, Song } from '../store/musicStore';
import { spacing, borderRadius, typography, nowPlayingColors as colors } from '../theme/colors';
import {
  play,
  pause,
  skipToNext,
  skipToPrevious,
  seekTo,
  setRepeatMode,
} from '../services/MusicService';

const { width, height } = Dimensions.get('window');
const CLOSE_DRAG_THRESHOLD = 120;
const SWIPE_TRACK_THRESHOLD = width * 0.28;
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

  const { position, duration } = useProgress(250, 250);
  const [isSeeking, setIsSeeking] = useState(false);
  const [tempPosition, setTempPosition] = useState(0);

  // react-native-reanimated isn't usable on this RN version (see git history
  // for details), so gestures are recognized/arbitrated by
  // react-native-gesture-handler while the actual animated values are driven
  // by React Native's own built-in Animated library.
  const dragY = useRef(new Animated.Value(0)).current;
  const artworkX = useRef(new Animated.Value(0)).current;
  const artworkOpacity = useRef(new Animated.Value(1)).current;

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

  const currentPosition = isSeeking ? tempPosition : position;
  const currentDuration = duration || 0;

  const isSongFavorite = (song: Song): boolean =>
    favorites.some((s) => s.id === song.id);

  // --- Gestures, scoped to the artwork image only -----------------------
  // Attaching these to the whole screen (an earlier version of this file
  // did) let the gesture recognizer intercept taps meant for the play/pause
  // and other buttons before they resolved as taps. Scoping to just the
  // artwork — the same place Spotify scopes this gesture — means every
  // button on this screen always gets a clean tap.

  const resetArtworkPosition = () => {
    Animated.parallel([
      Animated.spring(artworkX, {
        toValue: 0,
        useNativeDriver: true,
        tension: 70,
        friction: 11,
      }),
      Animated.timing(artworkOpacity, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const animateTrackChange = (direction: 'next' | 'previous') => {
    const exitX = direction === 'next' ? -width : width;
    Animated.parallel([
      Animated.timing(artworkX, {
        toValue: exitX,
        duration: 180,
        useNativeDriver: true,
      }),
      Animated.timing(artworkOpacity, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start(() => {
      if (direction === 'next') {
        handleNext();
      } else {
        handlePrevious();
      }
      // The actual track/queue data swaps via the store update triggered by
      // handleNext/handlePrevious above (playbackService's
      // PlaybackActiveTrackChanged handler resyncs `queue` from TrackPlayer's
      // real state).
      artworkX.setValue(direction === 'next' ? width : -width);
      Animated.parallel([
        Animated.timing(artworkX, {
          toValue: 0,
          duration: 220,
          useNativeDriver: true,
        }),
        Animated.timing(artworkOpacity, {
          toValue: 1,
          duration: 220,
          useNativeDriver: true,
        }),
      ]).start();
    });
  };

  const closeGesture = Gesture.Pan()
    .activeOffsetY([10, 1000])
    .failOffsetX([-20, 20])
    .onUpdate((e) => {
      if (e.translationY > 0) {
        dragY.setValue(e.translationY);
      }
    })
    .onEnd((e) => {
      if (e.translationY > CLOSE_DRAG_THRESHOLD || e.velocityY > 800) {
        Animated.timing(dragY, {
          toValue: height,
          duration: 180,
          useNativeDriver: true,
        }).start(() => {
          dragY.setValue(0);
          onClose();
        });
      } else {
        Animated.spring(dragY, {
          toValue: 0,
          useNativeDriver: true,
          tension: 60,
          friction: 10,
        }).start();
      }
    });

  const trackSwipeGesture = Gesture.Pan()
    .activeOffsetX([-10, 10])
    .failOffsetY([-20, 20])
    .onUpdate((e) => {
      artworkX.setValue(e.translationX);
    })
    .onEnd((e) => {
      const goNext = e.translationX <= -SWIPE_TRACK_THRESHOLD || e.velocityX < -600;
      const goPrevious = e.translationX >= SWIPE_TRACK_THRESHOLD || e.velocityX > 600;

      if (goNext) {
        animateTrackChange('next');
      } else if (goPrevious) {
        animateTrackChange('previous');
      } else {
        resetArtworkPosition();
      }
    })
    .onFinalize((_e, success) => {
      if (!success) {
        resetArtworkPosition();
      }
    });

  const artworkGesture = Gesture.Simultaneous(closeGesture, trackSwipeGesture);

  const containerAnimatedStyle = {
    transform: [{ translateY: dragY }],
  };

  const artworkAnimatedStyle = {
    transform: [{ translateX: artworkX }],
    opacity: artworkOpacity,
  };

  if (!currentSong) {
    return (
      <Animated.View style={[styles.container, containerAnimatedStyle]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Icon name="chevron-down" size={28} color={colors.fg} />
          </TouchableOpacity>
          <Text style={styles.headerLabel}>Now Playing</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.emptyContainer}>
          <Icon name="music-note-off" size={80} color={colors.fgMuted} />
          <Text style={styles.emptyText}>No song playing</Text>
        </View>
      </Animated.View>
    );
  }

  return (
    <Animated.View style={[styles.container, containerAnimatedStyle]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Icon name="chevron-down" size={28} color={colors.fg} />
        </TouchableOpacity>
        <Text style={styles.headerLabel}>Now Playing</Text>
        <TouchableOpacity onPress={handleFavorite} style={styles.closeButton}>
          <Icon
            name={isFavorite ? 'heart' : 'heart-outline'}
            size={24}
            color={isFavorite ? colors.accent2 : colors.fg}
          />
        </TouchableOpacity>
      </View>

      {/* Artwork — swipe down to close, swipe left/right to change track */}
      <View style={styles.artworkContainer}>
        <GestureDetector gesture={artworkGesture}>
          <Animated.View style={[styles.artwork, artworkAnimatedStyle]}>
            {currentSong.artwork ? (
              <Image source={{ uri: currentSong.artwork }} style={styles.artworkImage} />
            ) : (
              <View style={styles.artworkPlaceholder}>
                <Icon name="music-note" size={80} color={colors.fgMuted} />
              </View>
            )}
          </Animated.View>
        </GestureDetector>
      </View>

      {/* Title / artist */}
      <View style={styles.infoContainer}>
        <Text style={styles.title} numberOfLines={1}>
          {currentSong.title}
        </Text>
        <Text style={styles.artist} numberOfLines={1}>
          {currentSong.artist}
        </Text>
      </View>

      {/* Progress bar — a single, standard horizontal slider. */}
      <View style={styles.progressContainer}>
        <Slider
          style={styles.slider}
          value={currentPosition}
          minimumValue={0}
          maximumValue={Math.max(currentDuration, 1)}
          minimumTrackTintColor={colors.accent2}
          maximumTrackTintColor={colors.chipBg}
          thumbTintColor={colors.accent2}
          onSlidingStart={handleSlidingStart}
          onValueChange={handleValueChange}
          onSlidingComplete={handleSlidingComplete}
          step={0.1}
          tapToSeek={true}
        />
        <View style={styles.timeRow}>
          <Text style={styles.timeText}>{formatTime(currentPosition)}</Text>
          <Text style={styles.timeText}>{formatTime(currentDuration)}</Text>
        </View>
      </View>

      {/* Transport row — one play/pause button, no duplicates. */}
      <View style={styles.transport}>
        <TouchableOpacity style={styles.sideBtn} onPress={handleShuffle}>
          <Icon
            name="shuffle"
            size={24}
            color={shuffle ? colors.accent2 : colors.fg}
          />
        </TouchableOpacity>

        <TouchableOpacity style={styles.sideBtn} onPress={handlePrevious}>
          <Icon name="skip-previous" size={32} color={colors.fg} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.playButton}
          onPress={handlePlayPause}
          activeOpacity={0.85}>
          <Icon
            name={isPlaying ? 'pause' : 'play'}
            size={32}
            color={colors.onAccent}
          />
        </TouchableOpacity>

        <TouchableOpacity style={styles.sideBtn} onPress={handleNext}>
          <Icon name="skip-next" size={32} color={colors.fg} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.sideBtn} onPress={handleRepeat}>
          <Icon
            name={repeat === 'track' ? 'repeat-once' : 'repeat'}
            size={24}
            color={repeat !== 'off' ? colors.accent2 : colors.fg}
          />
        </TouchableOpacity>
      </View>

      {/* Up Next — a real, scrollable queue list. */}
      <View style={styles.queueHeader}>
        <Text style={styles.queueHeaderText}>Up Next</Text>
        {queue.length > 0 && (
          <Text style={styles.queueCount}>
            {queue.length} track{queue.length !== 1 ? 's' : ''}
          </Text>
        )}
      </View>

      <ScrollView
        style={styles.queueScroll}
        contentContainerStyle={styles.queueScrollContent}
        showsVerticalScrollIndicator={true}>
        {queue.length === 0 ? (
          <Text style={styles.queueEmptyText}>No songs queued next.</Text>
        ) : (
          queue.map((song, index) => (
            <View key={`${song.id}-${index}`} style={styles.queueRow}>
              <View style={styles.queueArtwork}>
                {song.artwork ? (
                  <Image source={{ uri: song.artwork }} style={styles.queueArtworkImage} />
                ) : (
                  <View style={styles.queueArtworkPlaceholder}>
                    <Icon name="music-note" size={18} color={colors.fgMuted} />
                  </View>
                )}
              </View>
              <View style={styles.queueRowInfo}>
                <Text style={styles.queueRowTitle} numberOfLines={1}>
                  {song.title}
                </Text>
                <Text style={styles.queueRowArtist} numberOfLines={1}>
                  {song.artist}
                </Text>
              </View>
              {isSongFavorite(song) && (
                <Icon
                  name="heart"
                  size={16}
                  color={colors.accent2}
                  style={styles.queueRowHeart}
                />
              )}
              <Text style={styles.queueRowDuration}>{formatTime(song.duration || 0)}</Text>
            </View>
          ))
        )}
      </ScrollView>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.sm,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.chipBg,
  },
  headerLabel: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
    color: colors.fgMuted,
    textTransform: 'uppercase',
    letterSpacing: typography.letterSpacing.wider,
  },
  headerSpacer: {
    width: 40,
  },

  artworkContainer: {
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },
  artwork: {
    width: ARTWORK_SIZE,
    height: ARTWORK_SIZE,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    backgroundColor: colors.surfaceRecessed,
  },
  artworkImage: {
    width: '100%',
    height: '100%',
  },
  artworkPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },

  infoContainer: {
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.md,
  },
  title: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: colors.fg,
    marginBottom: spacing.xs,
  },
  artist: {
    fontSize: typography.sizes.md,
    color: colors.fgMuted,
  },

  progressContainer: {
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.sm,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timeText: {
    fontSize: typography.sizes.xs,
    color: colors.fgMuted,
  },

  transport: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.lg,
  },
  sideBtn: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButton: {
    width: 64,
    height: 64,
    borderRadius: borderRadius.full,
    backgroundColor: colors.accent2,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },

  queueHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.sm,
  },
  queueHeaderText: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.fg,
  },
  queueCount: {
    fontSize: typography.sizes.xs,
    color: colors.fgMuted,
  },
  queueScroll: {
    flex: 1,
  },
  queueScrollContent: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxl,
  },
  queueEmptyText: {
    fontSize: typography.sizes.sm,
    color: colors.fgMuted,
    paddingVertical: spacing.md,
  },
  queueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  queueArtwork: {
    width: 44,
    height: 44,
    marginRight: spacing.md,
    borderRadius: borderRadius.sm,
    overflow: 'hidden',
    backgroundColor: colors.surfaceRecessed,
  },
  queueArtworkImage: {
    width: '100%',
    height: '100%',
  },
  queueArtworkPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  queueRowInfo: {
    flex: 1,
  },
  queueRowTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.medium,
    color: colors.fg,
    marginBottom: 2,
  },
  queueRowArtist: {
    fontSize: typography.sizes.sm,
    color: colors.fgMuted,
  },
  queueRowHeart: {
    marginRight: spacing.sm,
  },
  queueRowDuration: {
    fontSize: typography.sizes.sm,
    color: colors.fgMuted,
    fontWeight: typography.weights.medium,
  },

  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: typography.sizes.lg,
    color: colors.fgMuted,
    marginTop: spacing.lg,
  },
});
