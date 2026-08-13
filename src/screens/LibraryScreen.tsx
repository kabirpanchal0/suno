import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
} from 'react-native';
import { useMusicStore } from '../store/musicStore';
import { SongContextMenu } from '../components/SongContextMenu';
import { CreatePlaylistDialog } from '../components/CreatePlaylistDialog';
import { colors, spacing, borderRadius, typography } from '../theme/colors';
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

  const handleAlbumPress = async (albumSongs: any[]) => {
    if (albumSongs.length > 0) {
      setCurrentSong(albumSongs[0]);
      setQueue(albumSongs.slice(1));
      setIsPlaying(true);
      await playQueue(albumSongs);
    }
  };

  const handlePlaylistPress = async (playlist: any) => {
    if (playlist.songs && playlist.songs.length > 0) {
      setCurrentSong(playlist.songs[0]);
      setQueue(playlist.songs.slice(1));
      setIsPlaying(true);
      await playQueue(playlist.songs);
    }
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
      <FlatList
        data={playlists}
        renderItem={renderPlaylist}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>♪</Text>
            <Text style={styles.emptyText}>No playlists yet</Text>
            <Text style={styles.emptySubtext}>
              Create your first playlist from a song
            </Text>
          </View>
        }
      />
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Library</Text>
        <View style={styles.tabs}>
          <TabButton
            label="Albums"
            active={viewMode === 'albums'}
            onPress={() => setViewMode('albums')}
          />
          <TabButton
            label="Artists"
            active={viewMode === 'artists'}
            onPress={() => setViewMode('artists')}
          />
          <TabButton
            label="Playlists"
            active={viewMode === 'playlists'}
            onPress={() => setViewMode('playlists')}
          />
        </View>
      </View>
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

interface TabButtonProps {
  label: string;
  active: boolean;
  onPress: () => void;
}

const TabButton: React.FC<TabButtonProps> = ({ label, active, onPress }) => (
  <TouchableOpacity
    style={[styles.tab, active && styles.tabActive]}
    onPress={onPress}
    activeOpacity={0.7}>
    <Text style={[styles.tabText, active && styles.tabTextActive]}>
      {label}
    </Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    padding: spacing.lg,
    paddingTop: spacing.xl,
  },
  title: {
    fontSize: typography.sizes.xxxl,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    marginBottom: spacing.lg,
  },
  tabs: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  tab: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: spacing.md,
    backgroundColor: 'transparent',
  },
  tabActive: {
    backgroundColor: colors.surfaceLight,
  },
  tabText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
    color: colors.text.secondary,
  },
  tabTextActive: {
    color: colors.accent,
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
  },
  listItemArtwork: {
    width: 60,
    height: 60,
    marginRight: spacing.md,
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
});
