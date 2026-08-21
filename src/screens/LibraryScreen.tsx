import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Modal,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useMusicStore, Playlist } from '../store/musicStore';
import { SongContextMenu } from '../components/SongContextMenu';
import { CreatePlaylistDialog } from '../components/CreatePlaylistDialog';
import { PlaylistDetailScreen } from './PlaylistDetailScreen';
import { SearchBar } from '../components/SearchBar';
import { colors, spacing, borderRadius, typography, elevation } from '../theme/colors';
import { playQueue, addToQueue as addTrackToQueue } from '../services/MusicService';

type ViewMode = 'albums' | 'artists' | 'playlists';

export const LibraryScreen: React.FC = () => {
  const {
    albums,
    artists,
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
  } = useMusicStore();

  const [viewMode, setViewMode] = useState<ViewMode>('albums');
  const [contextMenuSong, setContextMenuSong] = useState<any>(null);
  const [showCreatePlaylist, setShowCreatePlaylist] = useState(false);
  const [pendingSong, setPendingSong] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(null);
  const [showViewModeMenu, setShowViewModeMenu] = useState(false);

  const viewModeLabels: Record<ViewMode, string> = {
    albums: 'Albums',
    artists: 'Artists',
    playlists: 'Playlists',
  };

  const albumsList = useMemo(() => {
    return Array.from(albums.entries()).map(([name, songs]) => ({
      id: name,
      name,
      songs,
      artwork: songs[0]?.artwork,
    }));
  }, [albums]);

  const artistsList = useMemo(() => {
    return Array.from(artists.entries()).map(([name, songs]) => ({
      id: name,
      name,
      songs,
      artwork: songs[0]?.artwork,
    }));
  }, [artists]);

  const filteredPlaylists = useMemo(() => {
    if (!searchQuery.trim()) {
      return playlists;
    }

    const query = searchQuery.toLowerCase();
    return playlists.filter((playlist) => {
      // Search by playlist name
      if (playlist.name.toLowerCase().includes(query)) {
        return true;
      }

      // Search by songs in the playlist
      return playlist.songs?.some((song) =>
        song.title?.toLowerCase().includes(query) ||
        song.artist?.toLowerCase().includes(query)
      );
    });
  }, [playlists, searchQuery]);

  const handleAlbumPress = async (albumSongs: any[]) => {
    if (albumSongs.length > 0) {
      setCurrentSong(albumSongs[0]);
      setQueue(albumSongs.slice(1));
      setIsPlaying(true);
      await playQueue(albumSongs);
    }
  };

  const handlePlaylistPress = (playlist: Playlist) => {
    setSelectedPlaylist(playlist);
  };

  const handleBackFromPlaylist = () => {
    setSelectedPlaylist(null);
  };

  const handleCloseContextMenu = () => {
    setContextMenuSong(null);
  };

  const handlePlayNext = (song: any) => {
    playNext(song);
    addTrackToQueue(song);
  };

  const handleAddToQueue = (song: any) => {
    addToQueue(song);
    addTrackToQueue(song);
  };

  const handleAddToPlaylist = (song: any, playlistId: string) => {
    addToPlaylist(playlistId, song);
  };

  const handleToggleFavorite = (song: any) => {
    toggleFavorite(song);
  };

  const handleCreatePlaylist = (song: any) => {
    setPendingSong(song);
    setShowCreatePlaylist(true);
  };

  const handlePlaylistCreated = (name: string) => {
    const playlist = createPlaylist(name);
    if (pendingSong) {
      addToPlaylist(playlist.id, pendingSong);
      setPendingSong(null);
    }
  };

  const handleCreatePlaylistButton = () => {
    setPendingSong(null);
    setShowCreatePlaylist(true);
  };

  const isSongFavorite = (song: any): boolean => {
    return favorites.some((s) => s.id === song.id);
  };

  const renderAlbum = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.gridItem}
      onPress={() => handleAlbumPress(item.songs)}
      activeOpacity={0.7}>
      <View style={styles.gridItemArtwork}>
        {item.artwork ? (
          <Image source={{ uri: item.artwork }} style={styles.gridItemImage} />
        ) : (
          <View style={styles.gridItemPlaceholder}>
            <Text style={styles.gridItemPlaceholderText}>♪</Text>
          </View>
        )}
      </View>
      <Text style={styles.gridItemTitle} numberOfLines={2}>
        {item.name}
      </Text>
      <Text style={styles.gridItemSubtitle}>
        {item.songs.length} song{item.songs.length !== 1 ? 's' : ''}
      </Text>
    </TouchableOpacity>
  );

  const renderPlaylist = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.listItem}
      onPress={() => handlePlaylistPress(item)}
      activeOpacity={0.7}>
      <View style={styles.listItemArtwork}>
        {item.songs?.[0]?.artwork ? (
          <Image source={{ uri: item.songs[0].artwork }} style={styles.listItemImage} />
        ) : (
          <View style={styles.listItemPlaceholder}>
            <Text style={styles.listItemPlaceholderText}>♪</Text>
          </View>
        )}
      </View>
      <View style={styles.listItemInfo}>
        <Text style={styles.listItemTitle} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={styles.listItemSubtitle}>
          {item.songs?.length || 0} song{item.songs?.length !== 1 ? 's' : ''}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderContent = () => {
    if (viewMode === 'albums') {
      return (
        <FlatList
          key="albums-grid"
          data={albumsList}
          renderItem={renderAlbum}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={styles.gridRow}
          contentContainerStyle={styles.gridContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>♪</Text>
              <Text style={styles.emptyText}>No albums found</Text>
            </View>
          }
        />
      );
    }

    if (viewMode === 'artists') {
      return (
        <FlatList
          key="artists-grid"
          data={artistsList}
          renderItem={renderAlbum}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={styles.gridRow}
          contentContainerStyle={styles.gridContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>♪</Text>
              <Text style={styles.emptyText}>No artists found</Text>
            </View>
          }
        />
      );
    }

    return (
      <View style={styles.playlistsContainer}>
        <View style={styles.playlistsHeader}>
          <SearchBar
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search playlists..."
          />
          <TouchableOpacity
            style={styles.createButton}
            onPress={handleCreatePlaylistButton}
            activeOpacity={0.8}>
            <Icon name="plus-circle" size={26} color={colors.text.inverse} />
            <Text style={styles.createButtonText}>New Playlist</Text>
          </TouchableOpacity>
        </View>
        <FlatList
          key="playlists-list"
          data={filteredPlaylists}
          renderItem={renderPlaylist}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>♪</Text>
              <Text style={styles.emptyText}>
                {searchQuery ? 'No playlists found' : 'No playlists yet'}
              </Text>
              <Text style={styles.emptySubtext}>
                {searchQuery
                  ? 'Try a different search term'
                  : 'Tap "Create Playlist" to get started'}
              </Text>
            </View>
          }
        />
      </View>
    );
  };

  // Show playlist detail screen if a playlist is selected
  if (selectedPlaylist) {
    return (
      <PlaylistDetailScreen
        playlist={selectedPlaylist}
        onBack={handleBackFromPlaylist}
      />
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.ambientGlowWarm} pointerEvents="none" />
      {/* Sticky Header */}
      <View style={styles.headerContainer}>
        <View style={styles.header}>
          <Text style={styles.eyebrow}>Browse</Text>
          <View style={styles.titleRow}>
            <Text style={styles.title}>Library</Text>
            <TouchableOpacity
              style={styles.viewModeButton}
              onPress={() => setShowViewModeMenu(true)}
              activeOpacity={0.7}>
              <Text style={styles.viewModeButtonText}>{viewModeLabels[viewMode]}</Text>
              <Icon name="chevron-down" size={18} color={colors.secondaryAccent} />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <Modal
        visible={showViewModeMenu}
        transparent
        animationType="fade"
        onRequestClose={() => setShowViewModeMenu(false)}>
        <TouchableOpacity
          style={styles.viewModeBackdrop}
          activeOpacity={1}
          onPress={() => setShowViewModeMenu(false)}>
          <View style={styles.viewModeMenu}>
            {(['albums', 'artists', 'playlists'] as ViewMode[]).map((mode) => (
              <TouchableOpacity
                key={mode}
                style={styles.viewModeOption}
                onPress={() => {
                  setViewMode(mode);
                  setShowViewModeMenu(false);
                }}
                activeOpacity={0.7}>
                <Text
                  style={[
                    styles.viewModeOptionText,
                    viewMode === mode && styles.viewModeOptionTextActive,
                  ]}>
                  {viewModeLabels[mode]}
                </Text>
                {viewMode === mode && (
                  <Icon name="check" size={18} color={colors.secondaryAccent} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Scrollable Content */}
      {renderContent()}

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

      <CreatePlaylistDialog
        visible={showCreatePlaylist}
        onClose={() => {
          setShowCreatePlaylist(false);
          setPendingSong(null);
        }}
        onCreate={handlePlaylistCreated}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    overflow: 'hidden',
  },
  ambientGlowWarm: {
    position: 'absolute',
    top: -100,
    right: -120,
    width: 300,
    height: 300,
    borderRadius: 999,
    backgroundColor: colors.glowCool,
  },
  headerContainer: {
    backgroundColor: 'transparent',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  header: {
    padding: spacing.lg,
    paddingTop: spacing.lg,
    marginTop: 20
  },
  eyebrow: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
    color: colors.secondaryAccent,
    textTransform: 'uppercase',
    letterSpacing: typography.letterSpacing.wider,
    marginBottom: spacing.xs,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: typography.sizes.xxxl,
    fontWeight: typography.weights.black,
    letterSpacing: typography.letterSpacing.tight,
    color: colors.text.primary,
  },
  viewModeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.full,
    backgroundColor: colors.secondaryAccentDim,
    borderWidth: 1,
    borderColor: colors.secondaryAccent,
  },
  viewModeButtonText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: colors.secondaryAccent,
  },
  viewModeBackdrop: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: 130,
    paddingRight: spacing.lg,
  },
  viewModeMenu: {
    minWidth: 160,
    backgroundColor: colors.backgroundElevated,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
    paddingVertical: spacing.xs,
    ...elevation.floating,
  },
  viewModeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.md,
  },
  viewModeOptionText: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.medium,
    color: colors.text.primary,
  },
  viewModeOptionTextActive: {
    color: colors.secondaryAccent,
    fontWeight: typography.weights.semibold,
  },
  gridContent: {
    padding: spacing.md,
    flexGrow: 1,
  },
  gridRow: {
    gap: spacing.md,
  },
  gridItem: {
    flex: 1,
    marginBottom: spacing.lg,
  },
  gridItemArtwork: {
    width: '100%',
    aspectRatio: 1,
    marginBottom: spacing.sm,
    borderRadius: borderRadius.md,
    ...elevation.card,
  },
  gridItemImage: {
    width: '100%',
    height: '100%',
    borderRadius: borderRadius.md,
  },
  gridItemPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  gridItemPlaceholderText: {
    fontSize: 48,
    color: colors.tertiary,
  },
  gridItemTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.medium,
    color: colors.text.primary,
    marginBottom: 2,
  },
  gridItemSubtitle: {
    fontSize: typography.sizes.sm,
    color: colors.text.tertiary,
  },
  listContent: {
    padding: spacing.md,
    flexGrow: 1,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    marginBottom: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  listItemArtwork: {
    width: 60,
    height: 60,
    marginRight: spacing.md,
    borderRadius: borderRadius.sm,
    overflow: 'hidden',
  },
  listItemImage: {
    width: '100%',
    height: '100%',
    borderRadius: borderRadius.sm,
  },
  listItemPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listItemPlaceholderText: {
    fontSize: typography.sizes.xl,
    color: colors.tertiary,
  },
  listItemInfo: {
    flex: 1,
  },
  listItemTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.medium,
    color: colors.text.primary,
    marginBottom: 3,
  },
  listItemSubtitle: {
    fontSize: typography.sizes.sm,
    color: colors.text.tertiary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
    minHeight: 400,
  },
  emptyIcon: {
    fontSize: 64,
    color: colors.tertiary,
    marginBottom: spacing.lg,
  },
  emptyText: {
    fontSize: typography.sizes.md,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: typography.sizes.sm,
    color: colors.text.tertiary,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  playlistsContainer: {
    flex: 1,
  },
  playlistsHeader: {
    padding: spacing.md,
    gap: spacing.md,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
    backgroundColor: colors.accent,
    borderRadius: borderRadius.full,
    alignSelf: 'flex-start',
    ...elevation.glow,
  },
  createButtonText: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: colors.text.inverse,
  },
});
