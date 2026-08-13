import RNFS from 'react-native-fs';
import { Song } from '../store/musicStore';
import { PermissionsAndroid, Platform } from 'react-native';

const MUSIC_EXTENSIONS = ['.mp3', '.m4a', '.aac', '.flac', '.wav', '.ogg'];

export const requestStoragePermission = async (): Promise<boolean> => {
  if (Platform.OS !== 'android') {
    return true;
  }

  try {
    const granted = await PermissionsAndroid.requestMultiple([
      PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
      PermissionsAndroid.PERMISSIONS.READ_MEDIA_AUDIO,
    ]);

    return (
      granted['android.permission.READ_EXTERNAL_STORAGE'] ===
        PermissionsAndroid.RESULTS.GRANTED ||
      granted['android.permission.READ_MEDIA_AUDIO'] ===
        PermissionsAndroid.RESULTS.GRANTED
    );
  } catch (err) {
    console.error('Permission error:', err);
    return false;
  }
};

const extractMetadataFromPath = (filePath: string): Partial<Song> => {
  const fileName = filePath.split('/').pop() || '';
  const nameWithoutExt = fileName.replace(/\.[^/.]+$/, '');
  
  // Try to parse format: Artist - Title
  const parts = nameWithoutExt.split(' - ');
  if (parts.length >= 2) {
    return {
      artist: parts[0].trim(),
      title: parts.slice(1).join(' - ').trim(),
    };
  }
  
  return {
    title: nameWithoutExt,
    artist: 'Unknown Artist',
  };
};

const scanDirectory = async (
  dirPath: string,
  songs: Song[] = [],
  maxDepth: number = 5,
  currentDepth: number = 0
): Promise<Song[]> => {
  if (currentDepth >= maxDepth) {
    return songs;
  }

  try {
    const items = await RNFS.readDir(dirPath);

    for (const item of items) {
      if (item.isDirectory()) {
        await scanDirectory(item.path, songs, maxDepth, currentDepth + 1);
      } else if (item.isFile()) {
        const ext = item.name.substring(item.name.lastIndexOf('.')).toLowerCase();
        if (MUSIC_EXTENSIONS.includes(ext)) {
          const metadata = extractMetadataFromPath(item.path);
          const song: Song = {
            id: item.path,
            url: `file://${item.path}`,
            title: metadata.title || item.name,
            artist: metadata.artist || 'Unknown Artist',
            album: 'Unknown Album',
            duration: 0,
          };
          songs.push(song);
        }
      }
    }
  } catch (error) {
    console.error(`Error scanning directory ${dirPath}:`, error);
  }

  return songs;
};

export const scanMusicLibrary = async (): Promise<Song[]> => {
  const hasPermission = await requestStoragePermission();
  if (!hasPermission) {
    console.error('Storage permission not granted');
    return [];
  }

  const songs: Song[] = [];
  
  try {
    // Android paths
    if (Platform.OS === 'android') {
      const musicDirs = [
        '/storage/emulated/0/Music',
        '/storage/emulated/0/Download',
        `${RNFS.ExternalStorageDirectoryPath}/Music`,
        `${RNFS.ExternalStorageDirectoryPath}/Download`,
      ];

      for (const dir of musicDirs) {
        const exists = await RNFS.exists(dir);
        if (exists) {
          await scanDirectory(dir, songs);
        }
      }
    } else {
      // iOS paths
      const musicDir = `${RNFS.DocumentDirectoryPath}/Music`;
      const exists = await RNFS.exists(musicDir);
      if (exists) {
        await scanDirectory(musicDir, songs);
      }
    }

    console.log(`Found ${songs.length} songs`);
    return songs;
  } catch (error) {
    console.error('Error scanning music library:', error);
    return songs;
  }
};

export const searchSongs = (songs: Song[], query: string): Song[] => {
  if (!query.trim()) {
    return songs;
  }

  const lowerQuery = query.toLowerCase();
  return songs.filter(
    (song) =>
      song.title.toLowerCase().includes(lowerQuery) ||
      song.artist.toLowerCase().includes(lowerQuery) ||
      song.album?.toLowerCase().includes(lowerQuery)
  );
};
