import TrackPlayer, {
  AppKilledPlaybackBehavior,
  Capability,
  RepeatMode,
} from 'react-native-track-player';
import { useMusicStore } from '../store/musicStore';

export const setupPlayer = async () => {
  try {
    await TrackPlayer.setupPlayer({
      maxCacheSize: 1024 * 10,
    });
  } catch (error: any) {
    // In dev, effects can run twice (Fast Refresh / Strict Mode remount)
    // while the native player module keeps its state across that remount —
    // TrackPlayer then throws "already been initialized" even though setup
    // genuinely succeeded the first time. That's not a real failure, so
    // don't treat it as one; anything else should still surface loudly.
    const alreadyInitialized =
      error?.code === 'player_already_initialized' ||
      (typeof error?.message === 'string' &&
        error.message.includes('already been initialized'));

    if (!alreadyInitialized) {
      console.error('Error setting up player:', error);
      return;
    }
  }

  try {
    await TrackPlayer.updateOptions({
      android: {
        appKilledPlaybackBehavior: AppKilledPlaybackBehavior.ContinuePlayback,
      },
      capabilities: [
        Capability.Play,
        Capability.Pause,
        Capability.SkipToNext,
        Capability.SkipToPrevious,
        Capability.SeekTo,
        Capability.Stop,
      ],
      // Renamed from `compactCapabilities` in older major versions of this
      // library — this is the field the installed version's UpdateOptions
      // type actually declares for the collapsed/compact notification.
      notificationCapabilities: [
        Capability.Play,
        Capability.Pause,
        Capability.SkipToNext,
        Capability.SkipToPrevious,
      ],
      progressUpdateEventInterval: 1,
    });
  } catch (error) {
    console.error('Error updating player options:', error);
  }
};

// Re-applies the store's current repeat mode to the native player. Needed
// after any TrackPlayer.reset() (playTrack/playQueue below both reset before
// re-adding), since reset() drops native repeat state back to Off — without
// this, the repeat icon in Now Playing could stay highlighted while the
// player itself silently stopped repeating.
const reapplyRepeatMode = async () => {
  const { repeat } = useMusicStore.getState();
  if (repeat === 'off') {
    return;
  }
  await TrackPlayer.setRepeatMode(repeat === 'track' ? RepeatMode.Track : RepeatMode.Queue);
};

export const playTrack = async (track: any, queue: any[] = []) => {
  try {
    await TrackPlayer.reset();
    await TrackPlayer.add([track, ...queue]);
    await reapplyRepeatMode();
    await TrackPlayer.play();
  } catch (error) {
    console.error('Error playing track:', error);
    // Roll back the optimistic UI state the caller already set (setIsPlaying(true),
    // setCurrentSong(...)) so a failed load (e.g. a deleted file) doesn't leave
    // the UI claiming something is playing when nothing actually is.
    useMusicStore.getState().setIsPlaying(false);
    throw error;
  }
};

export const playQueue = async (queue: any[], startIndex: number = 0) => {
  try {
    await TrackPlayer.reset();
    await TrackPlayer.add(queue);
    await TrackPlayer.skip(startIndex);
    await reapplyRepeatMode();
    await TrackPlayer.play();
  } catch (error) {
    console.error('Error playing queue:', error);
    useMusicStore.getState().setIsPlaying(false);
    throw error;
  }
};

export const play = async () => {
  await TrackPlayer.play();
};

export const pause = async () => {
  await TrackPlayer.pause();
};

// Both skip calls throw when there's nothing to skip to (e.g. single-track
// queue, repeat off) — previously unhandled, which surfaced as an unhandled
// promise rejection. Callers that want to gate on success (e.g. NowPlayingScreen's
// swipe-to-skip animation) should check the boolean return value.
export const skipToNext = async (): Promise<boolean> => {
  try {
    await TrackPlayer.skipToNext();
    return true;
  } catch (error) {
    console.error('Error skipping to next track:', error);
    return false;
  }
};

export const skipToPrevious = async (): Promise<boolean> => {
  try {
    await TrackPlayer.skipToPrevious();
    return true;
  } catch (error) {
    console.error('Error skipping to previous track:', error);
    return false;
  }
};

export const seekTo = async (position: number) => {
  try {
    await TrackPlayer.seekTo(Math.max(0, position));
  } catch (error) {
    console.error('Error seeking:', error);
  }
};

export const setRepeatMode = async (mode: 'off' | 'track' | 'queue') => {
  const repeatMode =
    mode === 'track'
      ? RepeatMode.Track
      : mode === 'queue'
      ? RepeatMode.Queue
      : RepeatMode.Off;
  await TrackPlayer.setRepeatMode(repeatMode);
};

export const addToQueue = async (track: any) => {
  await TrackPlayer.add(track);
};

// `upcomingIndex` is relative to the store's `queue` (i.e. 0 = the next
// track to play), matching musicStore's removeFromQueue — NOT TrackPlayer's
// own absolute queue index, which also counts the currently-playing track
// and everything before it. Translated here via a fresh
// getActiveTrackIndex() call (not a stale captured value) so it stays
// correct even if the active track has moved since the caller last synced.
export const removeUpcomingAt = async (upcomingIndex: number) => {
  try {
    const activeIndex = await TrackPlayer.getActiveTrackIndex();
    if (activeIndex === undefined) {
      return;
    }
    await TrackPlayer.remove(activeIndex + 1 + upcomingIndex);
  } catch (error) {
    console.error('Error removing queued track:', error);
  }
};

// Jumps playback directly to an "Up Next" row (tap-to-play-now). Same
// relative-index translation as removeUpcomingAt.
export const skipToUpcomingAt = async (upcomingIndex: number): Promise<boolean> => {
  try {
    const activeIndex = await TrackPlayer.getActiveTrackIndex();
    if (activeIndex === undefined) {
      return false;
    }
    await TrackPlayer.skip(activeIndex + 1 + upcomingIndex);
    return true;
  } catch (error) {
    console.error('Error jumping to queued track:', error);
    return false;
  }
};

// Replaces everything after the currently-playing track with a new order,
// without touching the active track itself — used by shuffle toggling.
export const reorderUpcomingQueue = async (newUpcoming: any[]) => {
  try {
    await TrackPlayer.removeUpcomingTracks();
    if (newUpcoming.length > 0) {
      await TrackPlayer.add(newUpcoming);
    }
  } catch (error) {
    console.error('Error reordering queue:', error);
  }
};
