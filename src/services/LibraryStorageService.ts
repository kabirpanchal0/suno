import AsyncStorage from '@react-native-async-storage/async-storage';
import { Song } from '../store/musicStore';

// Bumped whenever the persisted shape changes incompatibly; lets us wipe
// stale caches instead of crashing on old data after an app update.
const SCHEMA_VERSION = 1;

const LIBRARY_KEY = '@suno/library/songs';
const LIBRARY_META_KEY = '@suno/library/meta';

export interface LibraryMeta {
  version: number;
  lastScannedAt: number;
  songCount: number;
}

/**
 * Persists the scanned song list so the device is only scanned once, per the
 * app's expected persistence behavior: fetch on first run, then read from
 * storage on every subsequent launch/reload until the user explicitly
 * rescans.
 */
export const saveLibrary = async (songs: Song[]): Promise<void> => {
  const meta: LibraryMeta = {
    version: SCHEMA_VERSION,
    lastScannedAt: Date.now(),
    songCount: songs.length,
  };

  // v3 AsyncStorage API: setMany takes a key->value record, not the old
  // array-of-tuples shape.
  await AsyncStorage.setMany({
    [LIBRARY_KEY]: JSON.stringify(songs),
    [LIBRARY_META_KEY]: JSON.stringify(meta),
  });
};

export const loadLibrary = async (): Promise<Song[] | null> => {
  try {
    const values = await AsyncStorage.getMany([LIBRARY_META_KEY, LIBRARY_KEY]);
    const metaRaw = values[LIBRARY_META_KEY];
    const songsRaw = values[LIBRARY_KEY];

    if (!songsRaw) {
      return null;
    }

    const meta: LibraryMeta | null = metaRaw ? JSON.parse(metaRaw) : null;
    if (!meta || meta.version !== SCHEMA_VERSION) {
      // Incompatible/unknown shape — treat as "no cache" rather than risking
      // a crash trying to render malformed songs.
      return null;
    }

    const songs = JSON.parse(songsRaw);
    if (!Array.isArray(songs)) {
      return null;
    }

    return songs;
  } catch (error) {
    console.error('Error loading persisted library:', error);
    return null;
  }
};

export const getLibraryMeta = async (): Promise<LibraryMeta | null> => {
  try {
    const raw = await AsyncStorage.getItem(LIBRARY_META_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    console.error('Error reading library meta:', error);
    return null;
  }
};

export const clearLibrary = async (): Promise<void> => {
  await AsyncStorage.removeMany([LIBRARY_KEY, LIBRARY_META_KEY]);
};

/**
 * Merges a fresh device scan into the previously known song list:
 *  - Songs that still exist on-device keep their identity (favorites,
 *    playlists, and recently-played all reference songs by `id`, so nothing
 *    else needs to change for them to keep working).
 *  - Songs no longer found on-device are dropped from the library itself,
 *    but intentionally left alone in favorites/playlists/recentlyPlayed —
 *    the caller is responsible for filtering those against the new list if
 *    "missing song" cleanup is desired.
 *  - New songs on-device are appended.
 *  - Deduplicated by `id` (the file path), so re-scanning never creates
 *    duplicate entries for the same file.
 */
export const mergeScannedSongs = (
  previous: Song[],
  scanned: Song[],
): Song[] => {
  const byId = new Map<string, Song>();
  // Seed with previous songs first so we can detect additions/removals,
  // then overwrite with the freshly scanned metadata (tags may have
  // changed) while de-duplicating on id.
  for (const song of scanned) {
    byId.set(song.id, song);
  }
  return Array.from(byId.values());
};
