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
    if (event.track !== undefined) {
      const track = await TrackPlayer.getTrack(event.track);
      if (track) {
        useMusicStore.getState().setCurrentSong(track as any);
      }
    }
  });
}
