import { useState, useCallback } from 'react';
import { useMusicStore, Song } from '../store/musicStore';
import { addToQueue as addTrackToQueue } from '../services/MusicService';

/**
 * Shared "long-press context menu" song actions — play next, add to queue,
 * add/create playlist, toggle favorite — previously duplicated verbatim
 * across HomeScreen, LibraryScreen, and PlaylistDetailScreen. Extracting
 * this once means a behavior fix here applies everywhere instead of needing
 * three manual edits.
 *
 * Store actions (playNext, addToQueue, toggleFavorite, createPlaylist,
 * addToPlaylist) are stable references from Zustand and don't need
 * selectors — subscribing to them causes no extra re-renders.
 */
export const useSongActions = () => {
  const playNext = useMusicStore((s) => s.playNext);
  const addToQueue = useMusicStore((s) => s.addToQueue);
  const toggleFavorite = useMusicStore((s) => s.toggleFavorite);
  const createPlaylist = useMusicStore((s) => s.createPlaylist);
  const addToPlaylist = useMusicStore((s) => s.addToPlaylist);

  const [contextMenuSong, setContextMenuSong] = useState<Song | null>(null);
  const [showCreatePlaylist, setShowCreatePlaylist] = useState(false);
  const [pendingSong, setPendingSong] = useState<Song | null>(null);

  const openContextMenu = useCallback((song: Song) => setContextMenuSong(song), []);
  const closeContextMenu = useCallback(() => setContextMenuSong(null), []);

  const handlePlayNext = useCallback(
    (song: Song) => {
      playNext(song);
      addTrackToQueue(song);
    },
    [playNext]
  );

  const handleAddToQueue = useCallback(
    (song: Song) => {
      addToQueue(song);
      addTrackToQueue(song);
    },
    [addToQueue]
  );

  const handleAddToPlaylist = useCallback(
    (song: Song, playlistId: string) => {
      addToPlaylist(playlistId, song);
    },
    [addToPlaylist]
  );

  const handleToggleFavorite = useCallback(
    (song: Song) => {
      toggleFavorite(song);
    },
    [toggleFavorite]
  );

  const handleCreatePlaylist = useCallback((song: Song) => {
    setPendingSong(song);
    setShowCreatePlaylist(true);
  }, []);

  const handleCreatePlaylistButton = useCallback(() => {
    setPendingSong(null);
    setShowCreatePlaylist(true);
  }, []);

  const handlePlaylistCreated = useCallback(
    (name: string) => {
      const playlist = createPlaylist(name);
      if (pendingSong) {
        addToPlaylist(playlist.id, pendingSong);
        setPendingSong(null);
      }
    },
    [createPlaylist, addToPlaylist, pendingSong]
  );

  const closeCreatePlaylistDialog = useCallback(() => {
    setShowCreatePlaylist(false);
    setPendingSong(null);
  }, []);

  return {
    contextMenuSong,
    openContextMenu,
    closeContextMenu,
    showCreatePlaylist,
    handlePlayNext,
    handleAddToQueue,
    handleAddToPlaylist,
    handleToggleFavorite,
    handleCreatePlaylist,
    handleCreatePlaylistButton,
    handlePlaylistCreated,
    closeCreatePlaylistDialog,
  };
};

/** `favorites.some(...)` re-derived per call — cheap for typical favorite-list
 * sizes and avoids needing a Set rebuilt on every favorites change just for
 * this. Selects only `favorites` so callers don't re-render on unrelated
 * store changes. */
export const useIsSongFavorite = () => {
  const favorites = useMusicStore((s) => s.favorites);
  return useCallback(
    (song: Song | null | undefined) =>
      !!song && favorites.some((s) => s.id === song.id),
    [favorites]
  );
};
