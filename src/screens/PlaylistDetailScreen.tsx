import React, { useState, useCallback } from 'react';
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
import { CreatePlaylistDialog } from '../components/CreatePlaylistDialog';
import { colors, spacing, borderRadius, typography, elevation } from '../theme/colors';
import { playQueue } from '../services/MusicService';
import { useSongActions, useIsSongFavorite } from '../hooks/useSongActions';

interface PlaylistDetailScreenProps {
  playlist: Playlist;
  onBack: () => void;
}

export const PlaylistDetailScreen: React.FC<PlaylistDetailScreenProps> = ({
  playlist,
  onBack,
}) => {
  const playlists = useMusicStore((s) => s.playlists);
  const setCurrentSong = useMusicStore((s) => s.setCurrentSong);
  const setIsPlaying = useMusicStore((s) => s.setIsPlaying);
  const setQueue = useMusicStore((s) => s.setQueue);
  const removeFromPlaylist = useMusicStore((s) => s.removeFromPlaylist);
  const deletePlaylist = useMusicStore((s) => s.deletePlaylist);

  const {
    contextMenuSong,
    openContextMenu,
    closeContextMenu,
    showCreatePlaylist,
    handlePlayNext,
    handleAddToQueue,
    handleAddToPlaylist,
    handleToggleFavorite,
    handleCreatePlaylist,
    handlePlaylistCreated,
    closeCreatePlaylistDialog,
  } = useSongActions();
  const isSongFavorite = useIsSongFavorite();

  const [searchQuery, setSearchQuery] = useState('');

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

  const handleSongPress = useCallback(
    async (song: Song, index: number) => {
      setCurrentSong(song);
      setQueue(filteredSongs.slice(index + 1));
      setIsPlaying(true);
      await playQueue(filteredSongs.slice(index));
    },
    [filteredSongs, setCurrentSong, setQueue, setIsPlaying]
  );

  // Always plays the whole playlist, regardless of an active search filter —
  // previously this used `filteredSongs`, so "Play All" while a search term
  // was still typed silently played only the matching subset instead of the
  // full playlist its label promised.
  const handlePlayAll = useCallback(async () => {
    const allSongs = currentPlaylist.songs || [];
    if (allSongs.length > 0) {
      setCurrentSong(allSongs[0]);
      setQueue(allSongs.slice(1));
      setIsPlaying(true);
      await playQueue(allSongs);
    }
  }, [currentPlaylist.songs, setCurrentSong, setQueue, setIsPlaying]);

  const handleDeletePlaylist = useCallback(() => {
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
  }, [currentPlaylist.id, currentPlaylist.name, deletePlaylist, onBack]);

  const handleRemoveSong = useCallback(
    (song: Song) => {
      Alert.alert('Remove Song', `Remove "${song.title}" from this playlist?`, [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            removeFromPlaylist(currentPlaylist.id, song.id);
          },
        },
      ]);
    },
    [currentPlaylist.id, removeFromPlaylist]
  );

  const renderSong = useCallback(
    ({ item, index }: { item: Song; index: number }) => (
      <PlaylistSongRow
        song={item}
        index={index}
        onPress={handleSongPress}
        onLongPress={openContextMenu}
        onRemove={handleRemoveSong}
      />
    ),
    [handleSongPress, openContextMenu, handleRemoveSong]
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
        onClose={closeContextMenu}
        onPlayNext={handlePlayNext}
        onAddToQueue={handleAddToQueue}
        onAddToPlaylist={handleAddToPlaylist}
        onToggleFavorite={handleToggleFavorite}
        onCreatePlaylist={handleCreatePlaylist}
        isFavorite={isSongFavorite(contextMenuSong)}
      />

      {/* Previously missing entirely: the context menu's "Create New
          Playlist" option called handleCreatePlaylist (which opens this
          dialog's visible state) but nothing here ever rendered the dialog
          itself, so tapping it silently did nothing. */}
      <CreatePlaylistDialog
        visible={showCreatePlaylist}
        onClose={closeCreatePlaylistDialog}
        onCreate={handlePlaylistCreated}
      />
    </View>
  );
};

interface PlaylistSongRowProps {
  song: Song;
  index: number;
  onPress: (song: Song, index: number) => void;
  onLongPress: (song: Song) => void;
  onRemove: (song: Song) => void;
}

// Memoized for the same reason as SongItem/QueueRow: this list can be long,
// and without this every row would re-render whenever the screen re-renders
// for any reason (e.g. a search keystroke), not just when its own data changes.
const PlaylistSongRow: React.FC<PlaylistSongRowProps> = React.memo(function PlaylistSongRowImpl({
  song,
  index,
  onPress,
  onLongPress,
  onRemove,
}) {
  const handlePress = useCallback(() => onPress(song, index), [onPress, song, index]);
  const handleLongPress = useCallback(() => onLongPress(song), [onLongPress, song]);
  const handleRemove = useCallback(() => onRemove(song), [onRemove, song]);

  return (
    <TouchableOpacity
      style={styles.songItem}
      onPress={handlePress}
      onLongPress={handleLongPress}
      activeOpacity={0.7}>
      <View style={styles.songArtwork}>
        {song.artwork ? (
          <Image source={{ uri: song.artwork }} style={imageStyles.songImage} />
        ) : (
          <View style={styles.songPlaceholder}>
            <Icon name="music-note" size={24} color={colors.tertiary} />
          </View>
        )}
      </View>
      <View style={styles.songInfo}>
        <Text style={styles.songTitle} numberOfLines={1}>
          {song.title}
        </Text>
        <Text style={styles.songArtist} numberOfLines={1}>
          {song.artist}
        </Text>
      </View>
      <TouchableOpacity
        style={styles.removeButton}
        onPress={handleRemove}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
        <Icon name="close" size={20} color={colors.text.tertiary} />
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.moreButton}
        onPress={handleLongPress}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
        <Icon name="dots-vertical" size={24} color={colors.text.tertiary} />
      </TouchableOpacity>
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
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
    paddingBottom: spacing.xxl,
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

// Split out for the same reason as LibraryScreen's imageStyles: keeps this
// Image-typed style precisely typed instead of widened to
// ViewStyle | TextStyle | ImageStyle by sharing a StyleSheet.create call
// with View/Text styles.
const imageStyles = StyleSheet.create({
  songImage: {
    width: '100%',
    height: '100%',
    borderRadius: borderRadius.sm,
  },
});
