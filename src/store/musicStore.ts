import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Track } from 'react-native-track-player';

export interface Song extends Track {
  id: string;
  title: string;
  artist: string;
  album?: string;
  artwork?: string;
  url: string;
  duration?: number;
  isFavorite?: boolean;
}

export interface Playlist {
  id: string;
  name: string;
  songs: Song[];
  artwork?: string;
  createdAt: number;
}

interface MusicState {
  // Library
  songs: Song[];
  albums: Map<string, Song[]>;
  artists: Map<string, Song[]>;
  playlists: Playlist[];
  /** True once the persisted library has been read from storage (or found
   * empty) at least once. Lets screens distinguish "haven't checked storage
   * yet" from "checked storage, there's genuinely nothing there". */
  hasHydrated: boolean;

  // Playback
  currentSong: Song | null;
  /** The actual upcoming playback order — shuffled, if shuffle is on. This
   * is what "Up Next" should render and what mirrors TrackPlayer's real
   * queue. */
  queue: Song[];
  /** The pre-shuffle order of `queue`, kept only while shuffle is on, so
   * turning shuffle back off can restore true order instead of leaving the
   * queue permanently shuffled. */
  originalQueue: Song[] | null;
  isPlaying: boolean;
  position: number;
  duration: number;
  shuffle: boolean;
  repeat: 'off' | 'track' | 'queue';

  // Search
  searchQuery: string;

  // Recent & Favorites
  recentlyPlayed: Song[];
  favorites: Song[];

  // Actions
  setSongs: (songs: Song[]) => void;
  setHasHydrated: (hasHydrated: boolean) => void;
  pruneMissingSongs: (validIds: Set<string>) => void;
  setCurrentSong: (song: Song | null) => void;
  setIsPlaying: (isPlaying: boolean) => void;
  setPosition: (position: number) => void;
  setDuration: (duration: number) => void;
  setQueue: (queue: Song[]) => void;
  addToQueue: (song: Song) => void;
  playNext: (song: Song) => void;
  removeFromQueue: (index: number) => void;
  setSearchQuery: (query: string) => void;
  /** Returns the queue order to actually hand to TrackPlayer, and updates
   * `shuffle`/`originalQueue` bookkeeping. Callers are responsible for
   * feeding the returned order into TrackPlayer.
   */
  toggleShuffle: () => Song[];
  toggleRepeat: () => 'off' | 'track' | 'queue';
  toggleFavorite: (song: Song) => void;
  addToRecentlyPlayed: (song: Song) => void;
  createPlaylist: (name: string) => Playlist;
  addToPlaylist: (playlistId: string, song: Song) => void;
  removeFromPlaylist: (playlistId: string, songId: string) => void;
  deletePlaylist: (playlistId: string) => void;
  organizeMusicLibrary: () => void;
}

// Fisher–Yates — unbiased, O(n), in place on a copy.
const shuffleArray = <T,>(items: T[]): T[] => {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
};

export const useMusicStore = create<MusicState>()(
  persist(
    (set, get) => ({
      songs: [],
      albums: new Map(),
      artists: new Map(),
      playlists: [],
      hasHydrated: false,
      currentSong: null,
      queue: [],
      originalQueue: null,
      isPlaying: false,
      position: 0,
      duration: 0,
      shuffle: false,
      repeat: 'off',
      searchQuery: '',
      recentlyPlayed: [],
      favorites: [],

      setSongs: (songs) => {
        set({ songs });
        get().organizeMusicLibrary();
      },

      setHasHydrated: (hasHydrated) => set({ hasHydrated }),

      // Called after a rescan to drop library entries (and their queue/current
      // song references) for songs that no longer exist on-device. Favorites,
      // playlists, and recentlyPlayed intentionally keep the entries — they're
      // historical records — but are filtered so their song lists never dangle.
      pruneMissingSongs: (validIds) => {
        const { favorites, recentlyPlayed, playlists, currentSong, queue, originalQueue } = get();
        set({
          favorites: favorites.filter((s) => validIds.has(s.id)),
          recentlyPlayed: recentlyPlayed.filter((s) => validIds.has(s.id)),
          playlists: playlists.map((pl) => ({
            ...pl,
            songs: pl.songs.filter((s) => validIds.has(s.id)),
          })),
          currentSong: currentSong && !validIds.has(currentSong.id) ? null : currentSong,
          queue: queue.filter((s) => validIds.has(s.id)),
          originalQueue: originalQueue ? originalQueue.filter((s) => validIds.has(s.id)) : null,
        });
      },

      setCurrentSong: (song) => {
        set({ currentSong: song });
        if (song) {
          get().addToRecentlyPlayed(song);
        }
      },

      setIsPlaying: (isPlaying) => set({ isPlaying }),
      setPosition: (position) => set({ position }),
      setDuration: (duration) => set({ duration }),

      // Setting a fresh queue (e.g. starting playback of a new list) always
      // clears any leftover shuffle bookkeeping from a previous track's
      // queue — otherwise toggling shuffle off later would restore a stale,
      // unrelated "original" order.
      setQueue: (queue) => set({ queue, originalQueue: null }),

      addToQueue: (song) => {
        const { queue, originalQueue } = get();
        set({
          queue: [...queue, song],
          originalQueue: originalQueue ? [...originalQueue, song] : null,
        });
      },

      playNext: (song) => {
        const { queue, originalQueue } = get();
        set({
          queue: [song, ...queue],
          originalQueue: originalQueue ? [song, ...originalQueue] : null,
        });
      },

      removeFromQueue: (index) => {
        const { queue, originalQueue } = get();
        const removed = queue[index];
        set({
          queue: queue.filter((_, i) => i !== index),
          originalQueue:
            originalQueue && removed
              ? originalQueue.filter((s) => s.id !== removed.id)
              : originalQueue,
        });
      },

      setSearchQuery: (query) => set({ searchQuery: query }),

      // Shuffling reorders the actual queue (not just a cosmetic flag) so
      // "Up Next" and real playback order always agree. Turning shuffle back
      // off restores the order the queue was in before shuffle was enabled.
      // Returns the new order so the caller can push it into TrackPlayer.
      toggleShuffle: () => {
        const { shuffle, queue, originalQueue } = get();
        if (!shuffle) {
          const shuffled = shuffleArray(queue);
          set({ shuffle: true, queue: shuffled, originalQueue: queue });
          return shuffled;
        }
        const restored = originalQueue ?? queue;
        set({ shuffle: false, queue: restored, originalQueue: null });
        return restored;
      },

      toggleRepeat: () => {
        const { repeat } = get();
        const nextRepeat = repeat === 'off' ? 'queue' : repeat === 'queue' ? 'track' : 'off';
        set({ repeat: nextRepeat });
        return nextRepeat;
      },

      toggleFavorite: (song) => {
        const { favorites } = get();
        const isFavorite = favorites.some((s) => s.id === song.id);
        if (isFavorite) {
          set({ favorites: favorites.filter((s) => s.id !== song.id) });
        } else {
          set({ favorites: [...favorites, song] });
        }
      },

      addToRecentlyPlayed: (song) => {
        const { recentlyPlayed } = get();
        const filtered = recentlyPlayed.filter((s) => s.id !== song.id);
        set({ recentlyPlayed: [song, ...filtered].slice(0, 50) });
      },

      createPlaylist: (name) => {
        const playlist: Playlist = {
          id: Date.now().toString(),
          name,
          songs: [],
          createdAt: Date.now(),
        };
        set((state) => ({ playlists: [...state.playlists, playlist] }));
        return playlist;
      },

      addToPlaylist: (playlistId, song) => {
        set((state) => ({
          playlists: state.playlists.map((pl) =>
            pl.id === playlistId && !pl.songs.some((s) => s.id === song.id)
              ? { ...pl, songs: [...pl.songs, song] }
              : pl
          ),
        }));
      },

      removeFromPlaylist: (playlistId, songId) => {
        set((state) => ({
          playlists: state.playlists.map((pl) =>
            pl.id === playlistId
              ? { ...pl, songs: pl.songs.filter((s) => s.id !== songId) }
              : pl
          ),
        }));
      },

      deletePlaylist: (playlistId) => {
        set((state) => ({
          playlists: state.playlists.filter((pl) => pl.id !== playlistId),
        }));
      },

      organizeMusicLibrary: () => {
        const { songs } = get();
        const albums = new Map<string, Song[]>();
        const artists = new Map<string, Song[]>();

        songs.forEach((song) => {
          // Group by album
          if (song.album) {
            if (!albums.has(song.album)) {
              albums.set(song.album, []);
            }
            albums.get(song.album)!.push(song);
          }

          // Group by artist
          if (!artists.has(song.artist)) {
            artists.set(song.artist, []);
          }
          artists.get(song.artist)!.push(song);
        });

        set({ albums, artists });
      },
    }),
    {
      name: '@suno/user-library',
      storage: createJSONStorage(() => AsyncStorage),
      // Only playlists/favorites/recentlyPlayed are persisted here — the
      // scanned song library has its own dedicated persistence
      // (LibraryStorageService) with merge/prune/rescan semantics this
      // generic middleware doesn't provide, and playback/UI state
      // (currentSong, queue, isPlaying, searchQuery, ...) is intentionally
      // session-only and shouldn't survive a restart.
      partialize: (state) => ({
        playlists: state.playlists,
        favorites: state.favorites,
        recentlyPlayed: state.recentlyPlayed,
      }),
    }
  )
);
