import { create } from 'zustand';
import TrackPlayer, { State, Track } from 'react-native-track-player';

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
  
  // Playback
  currentSong: Song | null;
  queue: Song[];
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
  setCurrentSong: (song: Song | null) => void;
  setIsPlaying: (isPlaying: boolean) => void;
  setPosition: (position: number) => void;
  setDuration: (duration: number) => void;
  setQueue: (queue: Song[]) => void;
  addToQueue: (song: Song) => void;
  playNext: (song: Song) => void;
  removeFromQueue: (index: number) => void;
  setSearchQuery: (query: string) => void;
  toggleShuffle: () => void;
  toggleRepeat: () => void;
  toggleFavorite: (song: Song) => void;
  addToRecentlyPlayed: (song: Song) => void;
  createPlaylist: (name: string) => Playlist;
  addToPlaylist: (playlistId: string, song: Song) => void;
  removeFromPlaylist: (playlistId: string, songId: string) => void;
  deletePlaylist: (playlistId: string) => void;
  organizeMusicLibrary: () => void;
}

export const useMusicStore = create<MusicState>((set, get) => ({
  songs: [],
  albums: new Map(),
  artists: new Map(),
  playlists: [],
  currentSong: null,
  queue: [],
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

  setCurrentSong: (song) => {
    set({ currentSong: song });
    if (song) {
      get().addToRecentlyPlayed(song);
    }
  },

  setIsPlaying: (isPlaying) => set({ isPlaying }),
  setPosition: (position) => set({ position }),
  setDuration: (duration) => set({ duration }),
  setQueue: (queue) => set({ queue }),

  addToQueue: (song) => {
    const { queue } = get();
    set({ queue: [...queue, song] });
  },

  playNext: (song) => {
    const { queue } = get();
    set({ queue: [song, ...queue] });
  },

  removeFromQueue: (index) => {
    const { queue } = get();
    set({ queue: queue.filter((_, i) => i !== index) });
  },

  setSearchQuery: (query) => set({ searchQuery: query }),

  toggleShuffle: () => set((state) => ({ shuffle: !state.shuffle })),

  toggleRepeat: () => {
    const { repeat } = get();
    const nextRepeat = repeat === 'off' ? 'queue' : repeat === 'queue' ? 'track' : 'off';
    set({ repeat: nextRepeat });
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
}));
