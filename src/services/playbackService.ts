import TrackPlayer, { Event } from 'react-native-track-player';
import { useMusicStore } from '../store/musicStore';

export async function PlaybackService() {
  TrackPlayer.addEventListener(Event.RemotePlay, () => {
    TrackPlayer.play();
    useMusicStore.getState().setIsPlaying(true);
  });

  TrackPlayer.addEventListener(Event.RemotePause, () => {
    TrackPlayer.pause();
    useMusicStore.getState().setIsPlaying(false);
  });

  TrackPlayer.addEventListener(Event.RemoteNext, () => {
    TrackPlayer.skipToNext();
  });

  TrackPlayer.addEventListener(Event.RemotePrevious, () => {
    TrackPlayer.skipToPrevious();
  });

  TrackPlayer.addEventListener(Event.RemoteSeek, (event) => {
    TrackPlayer.seekTo(event.position);
  });

  TrackPlayer.addEventListener(Event.PlaybackState, async (state) => {
    const isPlaying = state.state === 'playing';
    useMusicStore.getState().setIsPlaying(isPlaying);
  });

  TrackPlayer.addEventListener(Event.PlaybackProgressUpdated, async (event) => {
    useMusicStore.getState().setPosition(event.position);
    useMusicStore.getState().setDuration(event.duration);
  });

  TrackPlayer.addEventListener(Event.PlaybackActiveTrackChanged, async (event) => {
    // event.track is already the full Track object in this version of the
    // library — no need for (and no valid way to do) an extra getTrack(index)
    // call with it.
    if (event.track) {
      useMusicStore.getState().setCurrentSong(event.track as any);
    }

    // The store's `queue` is a client-side snapshot taken when playback
    // started; it never re-synced after TrackPlayer.skipToNext/Previous moved
    // its own internal queue index. Without this, "Up Next" and the
    // next-track peek kept showing stale data (e.g. the now-playing track
    // still listed as "next") after every skip. Re-derive it here from
    // TrackPlayer's actual queue + index, which is the real source of truth.
    try {
      const [fullQueue, activeIndex] = await Promise.all([
        TrackPlayer.getQueue(),
        TrackPlayer.getActiveTrackIndex(),
      ]);
      const remaining =
        activeIndex === undefined ? [] : fullQueue.slice(activeIndex + 1);
      useMusicStore.getState().setQueue(remaining as any);
    } catch (error) {
      console.error('Error resyncing queue after track change:', error);
    }
  });
}
