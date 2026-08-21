import React, { useRef, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Animated,
  PanResponder,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Song } from '../store/musicStore';
import { colors, spacing, borderRadius, typography, elevation } from '../theme/colors';

interface SongItemProps {
  song: Song;
  index: number;
  onPress: (song: Song, index: number) => void;
  onLongPress?: (song: Song) => void;
  isPlaying?: boolean;
  /** Called when the row is swiped right past the reveal threshold. */
  onSwipeToQueue?: (song: Song) => void;
}

const formatDuration = (seconds?: number): string => {
  if (!seconds) return '--:--';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const SWIPE_REVEAL_WIDTH = 76;
const SWIPE_TRIGGER_THRESHOLD = 56;

// Memoized: rendered once per row in potentially long song FlatLists (Home,
// Playlist Detail). Without this, every parent re-render (e.g. a progress
// tick reaching this far, or search text changing) would re-render every
// visible row even though most rows' props haven't changed.
export const SongItem: React.FC<SongItemProps> = React.memo(function SongItemImpl({
  song,
  index,
  onPress,
  onLongPress,
  isPlaying = false,
  onSwipeToQueue,
}) {
  const translateX = useRef(new Animated.Value(0)).current;

  // Bind song/index here, inside the memoized component, rather than the
  // parent creating a fresh closure per row on every render — that's what
  // lets React.memo's prop-equality check above actually skip re-renders
  // for rows whose own data hasn't changed.
  const handlePress = useCallback(() => onPress(song, index), [onPress, song, index]);
  const handleLongPress = useCallback(() => onLongPress?.(song), [onLongPress, song]);

  const resetSwipe = () => {
    Animated.spring(translateX, {
      toValue: 0,
      useNativeDriver: true,
      tension: 60,
      friction: 10,
    }).start();
  };

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_evt, gesture) =>
        !!onSwipeToQueue &&
        gesture.dx > 8 &&
        Math.abs(gesture.dx) > Math.abs(gesture.dy) * 1.5,
      onPanResponderMove: (_evt, gesture) => {
        if (gesture.dx > 0) {
          translateX.setValue(Math.min(gesture.dx, SWIPE_REVEAL_WIDTH * 1.4));
        }
      },
      onPanResponderRelease: (_evt, gesture) => {
        if (onSwipeToQueue && gesture.dx > SWIPE_TRIGGER_THRESHOLD) {
          onSwipeToQueue(song);
        }
        resetSwipe();
      },
      onPanResponderTerminate: resetSwipe,
    })
  ).current;

  return (
    <View style={styles.rowWrapper}>
      {!!onSwipeToQueue && (
        <View style={styles.swipeBackdrop} pointerEvents="none">
          <Icon name="playlist-plus" size={22} color={colors.accentLight} />
          <Text style={styles.swipeBackdropText}>Queue</Text>
        </View>
      )}
      <Animated.View
        style={{ transform: [{ translateX }] }}
        {...(onSwipeToQueue ? panResponder.panHandlers : {})}>
        <TouchableOpacity
          style={[styles.container, isPlaying && styles.containerActive]}
          onPress={handlePress}
          onLongPress={handleLongPress}
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
      </Animated.View>
    </View>
  );
});

const styles = StyleSheet.create({
  rowWrapper: {
    position: 'relative',
  },
  swipeBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingLeft: spacing.lg,
    backgroundColor: colors.accentDim,
    borderRadius: borderRadius.md,
    marginHorizontal: spacing.sm,
  },
  swipeBackdropText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: colors.accentLight,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    marginHorizontal: spacing.sm,
    marginBottom: 2,
    borderRadius: borderRadius.md,
    backgroundColor: colors.background,
  },
  containerActive: {
    backgroundColor: colors.accentDim,
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
