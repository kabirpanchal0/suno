import React, { useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Animated,
  Dimensions,
  FlatList,
  Alert,
  Modal,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
// @react-native-community/slider@5.2.0's exported class type doesn't satisfy
// React 19's stricter JSX component-instance shape (missing `context`,
// `setState`, etc. on the intersection type it builds internally) — a known
// upstream typing gap, not a runtime issue. Re-typed against the library's
// own exported SliderProps (rather than inspecting the broken class type)
// so JSX usage below type-checks.
import SliderComponent, { SliderProps } from '@react-native-community/slider';
const Slider = SliderComponent as unknown as React.ComponentType<SliderProps>;
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
  reorderUpcomingQueue,
  removeUpcomingAt,
  skipToUpcomingAt,
} from '../services/MusicService';

const { width, height } = Dimensions.get('window');
const CLOSE_DRAG_THRESHOLD = 120;
const SWIPE_TRACK_THRESHOLD = width * 0.28;
const ARTWORK_SIZE = width - spacing.xl * 2;

// Queue preview row is artwork (44) + vertical padding (spacing.sm * 2) tall.
const QUEUE_ROW_HEIGHT = 44 + spacing.sm * 2;
// Compact inline preview shows this many rows before scrolling.
const QUEUE_PREVIEW_VISIBLE_ROWS = 4;
// Scrolling roughly this far down inside the compact preview auto-opens the
// full-screen queue — "two scrolls" or "past ~4 songs", whichever the user
// naturally does first, both land around this same distance.
const QUEUE_PREVIEW_AUTO_EXPAND_OFFSET = QUEUE_ROW_HEIGHT * QUEUE_PREVIEW_VISIBLE_ROWS;

const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export const NowPlayingScreen: React.FC<{ onClose: () => void }> = ({
  onClose,
}) => {
  // This screen only mounts (as a full-screen Modal, see App.tsx) while
  // Now Playing is actually open, so subscribing broadly here doesn't cost
  // background screens anything — but individual selectors still keep this
  // screen from re-rendering on store fields it doesn't use (e.g. `songs`,
  // `playlists`, `searchQuery`).
  const currentSong = useMusicStore((s) => s.currentSong);
  const isPlaying = useMusicStore((s) => s.isPlaying);
  const shuffle = useMusicStore((s) => s.shuffle);
  const repeat = useMusicStore((s) => s.repeat);
  const queue = useMusicStore((s) => s.queue);
  const removeFromQueueStore = useMusicStore((s) => s.removeFromQueue);
  const toggleShuffle = useMusicStore((s) => s.toggleShuffle);
  const toggleRepeat = useMusicStore((s) => s.toggleRepeat);
  const toggleFavorite = useMusicStore((s) => s.toggleFavorite);
  const favorites = useMusicStore((s) => s.favorites);
  const setIsPlaying = useMusicStore((s) => s.setIsPlaying);

  const { position, duration } = useProgress(250);
  const [isSeeking, setIsSeeking] = useState(false);
  const [tempPosition, setTempPosition] = useState(0);
  const [showQueueModal, setShowQueueModal] = useState(false);

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

  const handleNext = async (): Promise<boolean> => {
    return skipToNext();
  };

  const handlePrevious = async (): Promise<boolean> => {
    return skipToPrevious();
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

  const handleShuffle = async () => {
    // toggleShuffle reorders the store's `queue` (the actual upcoming
    // order) and returns that new order — push the same order into
    // TrackPlayer's real queue so playback matches what "Up Next" shows.
    const newUpcoming = toggleShuffle();
    await reorderUpcomingQueue(newUpcoming);
  };

  const handleRepeat = async () => {
    // Use the value toggleRepeat() actually applied, not a duplicate
    // recomputation from the (possibly stale, pre-update) `repeat` closure
    // variable — the two could disagree and desync the icon from the real
    // native repeat mode.
    const newRepeat = toggleRepeat();
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

  const isSongFavorite = useCallback(
    (song: Song): boolean => favorites.some((s) => s.id === song.id),
    [favorites]
  );

  // Tap a row in "Up Next" to jump straight to it. Optimistically trims the
  // store's queue up to that point so the UI doesn't wait on the round-trip —
  // playbackService's PlaybackActiveTrackChanged handler re-syncs the exact
  // queue once TrackPlayer confirms the jump.
  const handleJumpToQueueItem = useCallback(
    async (index: number) => {
      await skipToUpcomingAt(index);
    },
    []
  );

  const handleRemoveFromQueueItem = useCallback(
    async (index: number) => {
      removeFromQueueStore(index);
      await removeUpcomingAt(index);
    },
    [removeFromQueueStore]
  );

  const handleClearQueue = useCallback(() => {
    if (queue.length === 0) {
      return;
    }
    Alert.alert('Clear Queue', 'Remove all upcoming tracks from the queue?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear',
        style: 'destructive',
        onPress: async () => {
          for (let i = queue.length - 1; i >= 0; i--) {
            removeFromQueueStore(i);
          }
          await reorderUpcomingQueue([]);
        },
      },
    ]);
  }, [queue.length, removeFromQueueStore]);

  // Scrolling the compact inline preview past ~QUEUE_PREVIEW_VISIBLE_ROWS
  // songs auto-opens the full-screen queue instead of continuing to scroll
  // in the cramped preview — the preview is meant as a peek, not a real
  // browsing surface. Guarded so it only fires once per preview scroll
  // gesture (not on every onScroll tick past the threshold) and only while
  // the modal isn't already open.
  const hasAutoExpandedRef = useRef(false);
  const handleQueuePreviewScroll = useCallback(
    (event: { nativeEvent: { contentOffset: { y: number } } }) => {
      if (hasAutoExpandedRef.current) {
        return;
      }
      if (event.nativeEvent.contentOffset.y > QUEUE_PREVIEW_AUTO_EXPAND_OFFSET) {
        hasAutoExpandedRef.current = true;
        setShowQueueModal(true);
      }
    },
    []
  );

  // Reset the guard whenever the preview is (re)shown, so the next time the
  // user scrolls the preview it can auto-expand again.
  const handleQueueModalClose = useCallback(() => {
    hasAutoExpandedRef.current = false;
    setShowQueueModal(false);
  }, []);

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

  // Guards against animating a "track change" that can't actually happen —
  // e.g. swiping next on the last queued track with repeat off. `queue` here
  // is the store's real upcoming-order snapshot, so this check is accurate
  // for the forward direction without needing to ask TrackPlayer first.
  const canAdvance = (direction: 'next' | 'previous') =>
    direction === 'next' ? queue.length > 0 : true;

  const animateTrackChange = (direction: 'next' | 'previous') => {
    if (!canAdvance(direction)) {
      resetArtworkPosition();
      return;
    }

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
    ]).start(async () => {
      // Only play the "enters from the other side" animation if the skip
      // actually succeeded — otherwise (e.g. previous with nothing before
      // it) snap back to reveal the unchanged current track instead of
      // faking a track change that didn't happen.
      const succeeded =
        direction === 'next' ? await handleNext() : await handlePrevious();

      if (!succeeded) {
        artworkX.setValue(0);
        artworkOpacity.setValue(1);
        return;
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

      {/* Up Next — a compact, genuinely scrollable preview (~4 rows tall)
          with an "Expand" affordance that opens the same list full-screen
          via QueueListScreen. Scrolling past ~4 songs inside this preview
          auto-opens the full-screen view instead of continuing to scroll
          in the cramped space — the preview is a peek, not the real
          browsing surface. */}
      <View style={styles.queueHeader}>
        <TouchableOpacity
          style={styles.queueHeaderTitleRow}
          onPress={() => setShowQueueModal(true)}
          disabled={queue.length === 0}
          activeOpacity={0.7}>
          <Text style={styles.queueHeaderText}>Up Next</Text>
          {queue.length > 0 && (
            <Icon name="chevron-up" size={18} color={colors.fgMuted} />
          )}
        </TouchableOpacity>
        <View style={styles.queueHeaderRight}>
          {queue.length > 0 && (
            <Text style={styles.queueCount}>
              {queue.length} track{queue.length !== 1 ? 's' : ''}
            </Text>
          )}
          {queue.length > 0 && (
            <TouchableOpacity
              onPress={handleClearQueue}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={styles.queueClearText}>Clear</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {queue.length === 0 ? (
        <Text style={styles.queueEmptyText}>No songs queued next.</Text>
      ) : (
        <FlatList
          style={styles.queuePreview}
          contentContainerStyle={styles.queuePreviewContent}
          data={queue}
          keyExtractor={(song, index) => `${song.id}-${index}`}
          renderItem={({ item, index }) => (
            <QueueRow
              song={item}
              index={index}
              isFavorite={isSongFavorite(item)}
              onPress={handleJumpToQueueItem}
              onRemove={handleRemoveFromQueueItem}
            />
          )}
          onScroll={handleQueuePreviewScroll}
          scrollEventThrottle={32}
          showsVerticalScrollIndicator={false}
          nestedScrollEnabled
        />
      )}

      <Modal
        visible={showQueueModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={handleQueueModalClose}>
        <QueueListScreen
          queue={queue}
          isSongFavorite={isSongFavorite}
          onJumpTo={handleJumpToQueueItem}
          onRemove={handleRemoveFromQueueItem}
          onClear={handleClearQueue}
          onClose={handleQueueModalClose}
        />
      </Modal>
    </Animated.View>
  );
};

interface QueueListScreenProps {
  queue: Song[];
  isSongFavorite: (song: Song) => boolean;
  onJumpTo: (index: number) => void;
  onRemove: (index: number) => void;
  onClear: () => void;
  onClose: () => void;
}

// The same "Up Next" list, full-screen: opened from NowPlayingScreen's
// compact preview via the header/tap-to-expand affordance above. Same
// virtualized FlatList and row actions (jump/remove/clear), just with the
// whole screen's height to scroll through instead of a 3-row peek.
const QueueListScreen: React.FC<QueueListScreenProps> = ({
  queue,
  isSongFavorite,
  onJumpTo,
  onRemove,
  onClear,
  onClose,
}) => {
  const handleJumpAndClose = useCallback(
    (index: number) => {
      onJumpTo(index);
      onClose();
    },
    [onJumpTo, onClose]
  );

  return (
    <View style={styles.queueModalContainer}>
      <View style={styles.queueModalHeader}>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Icon name="chevron-down" size={28} color={colors.fg} />
        </TouchableOpacity>
        <View style={styles.queueModalHeaderTitle}>
          <Text style={styles.queueModalHeaderText}>Up Next</Text>
          {queue.length > 0 && (
            <Text style={styles.queueCount}>
              {queue.length} track{queue.length !== 1 ? 's' : ''}
            </Text>
          )}
        </View>
        {queue.length > 0 ? (
          <TouchableOpacity
            onPress={onClear}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text style={styles.queueClearText}>Clear</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.headerSpacer} />
        )}
      </View>

      <FlatList
        style={styles.queueScroll}
        contentContainerStyle={styles.queueModalScrollContent}
        data={queue}
        keyExtractor={(song, index) => `${song.id}-${index}`}
        renderItem={({ item, index }) => (
          <QueueRow
            song={item}
            index={index}
            isFavorite={isSongFavorite(item)}
            onPress={handleJumpAndClose}
            onRemove={onRemove}
          />
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="playlist-music-outline" size={64} color={colors.fgMuted} />
            <Text style={styles.emptyText}>No songs queued next.</Text>
          </View>
        }
        showsVerticalScrollIndicator={true}
        initialNumToRender={20}
        maxToRenderPerBatch={20}
        windowSize={10}
        removeClippedSubviews={true}
      />
    </View>
  );
};

interface QueueRowProps {
  song: Song;
  index: number;
  isFavorite: boolean;
  onPress: (index: number) => void;
  onRemove: (index: number) => void;
}

// Memoized so scrolling/re-rendering the queue list doesn't re-render every
// row — only the ones whose own props actually changed.
const QueueRow: React.FC<QueueRowProps> = React.memo(function QueueRowImpl({
  song,
  index,
  isFavorite,
  onPress,
  onRemove,
}) {
  const handlePress = useCallback(() => onPress(index), [onPress, index]);
  const handleRemove = useCallback(() => onRemove(index), [onRemove, index]);

  return (
    <TouchableOpacity style={styles.queueRow} onPress={handlePress} activeOpacity={0.7}>
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
      {isFavorite && (
        <Icon name="heart" size={16} color={colors.accent2} style={styles.queueRowHeart} />
      )}
      <Text style={styles.queueRowDuration}>{formatTime(song.duration || 0)}</Text>
      <TouchableOpacity
        style={styles.queueRowRemove}
        onPress={handleRemove}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
        <Icon name="close" size={18} color={colors.fgMuted} />
      </TouchableOpacity>
    </TouchableOpacity>
  );
});

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
    paddingTop: spacing.xxl,
    paddingBottom: spacing.md,
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
  queueHeaderTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  queueHeaderText: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.fg,
  },
  queueHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  queueCount: {
    fontSize: typography.sizes.xs,
    color: colors.fgMuted,
  },
  queueClearText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
    color: colors.accent2,
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
    paddingHorizontal: spacing.xl,
  },
  // Compact "peek" of the queue shown inline on Now Playing — genuinely
  // scrollable up to QUEUE_PREVIEW_VISIBLE_ROWS rows tall, past which
  // handleQueuePreviewScroll auto-opens the full QueueListScreen modal
  // (also reachable directly via the header or its own chevron).
  queuePreview: {
    flexGrow: 0,
    maxHeight: QUEUE_ROW_HEIGHT * QUEUE_PREVIEW_VISIBLE_ROWS,
  },
  queuePreviewContent: {
    paddingHorizontal: spacing.xl,
  },
  // Full-screen queue modal (QueueListScreen)
  queueModalContainer: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
  queueModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  queueModalHeaderTitle: {
    alignItems: 'center',
  },
  queueModalHeaderText: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.fg,
  },
  queueModalScrollContent: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxl,
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
  queueRowRemove: {
    marginLeft: spacing.sm,
    padding: spacing.xs,
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
