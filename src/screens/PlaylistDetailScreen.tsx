import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useMusicStore, Song, Playlist } from '../store/musicStore';
import { SearchBar } from '../components/SearchBar';
import { SongContextMenu } from '../components/SongContextMenu';
import { colors, spacing, borderRadius, typography, elevation } from '../theme/colors';
import { playQueue, addToQueue as addTrackToQueue } from '../services/MusicService';

interface PlaylistDetailScreenProps {
  playlist: Playlist;
  onBack: () => void;
}

export const PlaylistDetailScreen: React.FC<PlaylistDetailScreenProps> = ({
  playlist,
  onBack,
}) => {
  const {
    playlists,
    favorites,
    setCurrentSong,
    setIsPlaying,
    setQueue,
    playNext,
    addToQueue,
    toggleFavorite,
    createPlaylist,
    addToPlaylist,
    removeFromPlaylist,
    deletePlaylist,
  } = useMusicStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [contextMenuSong, setContextMenuSong] = useState<Song | null>(null);
  const [showCreatePlaylist, setShowCreatePlaylist] = useState(false);
  const [pendingSong, setPendingSong] = useState<Song | null>(null);

  // Get the current playlist data (it might have been updated)
  const currentPlaylist = playlists.find((p) => p.id === playlist.id) || playlist;

  const filteredSongs = React.useMemo(() => {
    if (!searchQuery.trim()) {
      return currentPlaylist.songs || [];
    }

    const query = searchQuery.toLowerCase();
    return (currentPlaylist.songs || []).filter(
      (song) =>
        song.title?.toLowerCase().includes(query) ||
        song.artist?.toLowerCase().includes(query) ||
        song.album?.toLowerCase().includes(query)
    );
  }, [currentPlaylist.songs, searchQuery]);

  const handleSongPress = async (song: Song, index: number) => {
    setCurrentSong(song);
    setQueue(filteredSongs.slice(index + 1));
    setIsPlaying(true);
    await playQueue(filteredSongs.slice(index));
  };

  const handleSongLongPress = (song: Song) => {
    setContextMenuSong(song);
  };

  const handlePlayAll = async () => {
    if (filteredSongs.length > 0) {
      setCurrentSong(filteredSongs[0]);
      setQueue(filteredSongs.slice(1));
      setIsPlaying(true);
      await playQueue(filteredSongs);
    }
  };

  const handleDeletePlaylist = () => {
    Alert.alert(
      'Delete Playlist',
      `Are you sure you want to delete "${currentPlaylist.name}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deletePlaylist(currentPlaylist.id);
            onBack();
          },
        },
      ]
    );
  };

  const handleRemoveSong = (song: Song) => {
    Alert.alert(
      'Remove Song',
      `Remove "${song.title}" from this playlist?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            removeFromPlaylist(currentPlaylist.id, song.id);
          },
        },
      ]
    );
  };

  const handleCloseContextMenu = () => {
    setContextMenuSong(null);
  };

  const handlePlayNext = (song: Song) => {
    playNext(song);
    addTrackToQueue(song);
  };

  const handleAddToQueue = (song: Song) => {
    addToQueue(song);
    addTrackToQueue(song);
  };

  const handleAddToPlaylist = (song: Song, playlistId: string) => {
    addToPlaylist(playlistId, song);
  };

  const handleToggleFavorite = (song: Song) => {
    toggleFavorite(song);
  };

  const handleCreatePlaylist = (song: Song) => {
    setPendingSong(song);
    setShowCreatePlaylist(true);
  };

  const isSongFavorite = (song: Song): boolean => {
    return favorites.some((s) => s.id === song.id);
  };

  const renderSong = ({ item, index }: { item: Song; index: number }) => (
    <TouchableOpacity
      style={styles.songItem}
      onPress={() => handleSongPress(item, index)}
      onLongPress={() => handleSongLongPress(item)}
      activeOpacity={0.7}>
      <View style={styles.songArtwork}>
        {item.artwork ? (
          <Image source={{ uri: item.artwork }} style={styles.songImage} />
        ) : (
          <View style={styles.songPlaceholder}>
            <Icon name="music-note" size={24} color={colors.tertiary} />
          </View>
        )}
      </View>
      <View style={styles.songInfo}>
        <Text style={styles.songTitle} numberOfLines={1}>
          {item.title}
        </Text>
        <Text style={styles.songArtist} numberOfLines={1}>
          {item.artist}
        </Text>
      </View>
      <TouchableOpacity
        style={styles.removeButton}
        onPress={() => handleRemoveSong(item)}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
        <Icon name="close" size={20} color={colors.text.tertiary} />
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.moreButton}
        onPress={() => handleSongLongPress(item)}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
        <Icon name="dots-vertical" size={24} color={colors.text.tertiary} />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={onBack}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Icon name="chevron-left" size={32} color={colors.text.primary} />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.title} numberOfLines={1}>
            {currentPlaylist.name}
          </Text>
          <Text style={styles.subtitle}>
            {currentPlaylist.songs?.length || 0} song
            {currentPlaylist.songs?.length !== 1 ? 's' : ''}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={handleDeletePlaylist}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Icon name="delete-outline" size={24} color={colors.text.tertiary} />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search in playlist..."
        />
      </View>

      {/* Play All Button */}
      {filteredSongs.length > 0 && (
        <View style={styles.actionContainer}>
          <TouchableOpacity
            style={styles.playAllButton}
            onPress={handlePlayAll}
            activeOpacity={0.85}>
            <Icon name="play" size={22} color={colors.text.inverse} />
            <Text style={styles.playAllText}>Play All</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Song List */}
      <FlatList
        data={filteredSongs}
        renderItem={renderSong}
        keyExtractor={(item: any) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="playlist-music-outline" size={64} color={colors.tertiary} />
            <Text style={styles.emptyText}>
              {searchQuery ? 'No songs found' : 'No songs in this playlist'}
            </Text>
            <Text style={styles.emptySubtext}>
              {searchQuery
                ? 'Try a different search term'
                : 'Add songs from your library using the context menu'}
            </Text>
          </View>
        }
      />

      <SongContextMenu
        visible={!!contextMenuSong}
        song={contextMenuSong}
        playlists={playlists}
        onClose={handleCloseContextMenu}
        onPlayNext={handlePlayNext}
        onAddToQueue={handleAddToQueue}
        onAddToPlaylist={handleAddToPlaylist}
        onToggleFavorite={handleToggleFavorite}
        onCreatePlaylist={handleCreatePlaylist}
        isFavorite={contextMenuSong ? isSongFavorite(contextMenuSong) : false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    paddingTop: spacing.lg,
    gap: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    padding: spacing.xs,
  },
  headerInfo: {
    flex: 1,
  },
  title: {
    fontSize: typography.sizes.xxl,
    fontWeight: typography.weights.bold,
    letterSpacing: typography.letterSpacing.tight,
    color: colors.text.primary,
  },
  subtitle: {
    fontSize: typography.sizes.sm,
    color: colors.secondaryAccent,
    fontWeight: typography.weights.medium,
    marginTop: spacing.xs,
  },
  deleteButton: {
    padding: spacing.sm,
  },
  searchContainer: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
  },
  actionContainer: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
  },
  playAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accent,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.full,
    gap: spacing.sm,
    ...elevation.glow,
  },
  playAllText: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: colors.text.inverse,
  },
  listContent: {
    paddingHorizontal: spacing.md,
    flexGrow: 1,
  },
  songItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    marginBottom: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  songArtwork: {
    width: 50,
    height: 50,
    marginRight: spacing.md,
    borderRadius: borderRadius.sm,
    overflow: 'hidden',
  },
  songImage: {
    width: '100%',
    height: '100%',
    borderRadius: borderRadius.sm,
  },
  songPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  songInfo: {
    flex: 1,
  },
  songTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.medium,
    color: colors.text.primary,
    marginBottom: 3,
  },
  songArtist: {
    fontSize: typography.sizes.sm,
    color: colors.text.tertiary,
  },
  removeButton: {
    padding: spacing.sm,
    marginRight: spacing.xs,
  },
  moreButton: {
    padding: spacing.sm,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
    minHeight: 300,
  },
  emptyText: {
    fontSize: typography.sizes.md,
    color: colors.text.secondary,
    textAlign: 'center',
    marginTop: spacing.lg,
  },
  emptySubtext: {
    fontSize: typography.sizes.sm,
    color: colors.text.tertiary,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
});
