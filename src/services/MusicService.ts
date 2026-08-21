import TrackPlayer, {
  AppKilledPlaybackBehavior,
  Capability,
  RepeatMode,
  Event,
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
      compactCapabilities: [
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

export const playTrack = async (track: any, queue: any[] = []) => {
  try {
    await TrackPlayer.reset();
    await TrackPlayer.add([track, ...queue]);
    await TrackPlayer.play();
  } catch (error) {
    console.error('Error playing track:', error);
  }
};

export const playQueue = async (queue: any[], startIndex: number = 0) => {
  try {
    await TrackPlayer.reset();
    await TrackPlayer.add(queue);
    await TrackPlayer.skip(startIndex);
    await TrackPlayer.play();
  } catch (error) {
    console.error('Error playing queue:', error);
  }
};

export const play = async () => {
  await TrackPlayer.play();
};

export const pause = async () => {
  await TrackPlayer.pause();
};

export const skipToNext = async () => {
  await TrackPlayer.skipToNext();
};

export const skipToPrevious = async () => {
  await TrackPlayer.skipToPrevious();
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

export const removeFromQueue = async (index: number) => {
  await TrackPlayer.remove(index);
};
