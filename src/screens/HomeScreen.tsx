import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  Text,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { useMusicStore } from '../store/musicStore';
import { SearchBar } from '../components/SearchBar';
import { SongItem } from '../components/SongItem';
import { SongContextMenu } from '../components/SongContextMenu';
import { CreatePlaylistDialog } from '../components/CreatePlaylistDialog';
import { colors, spacing, typography, borderRadius, elevation } from '../theme/colors';
import { scanMusicLibrary, searchSongs } from '../services/FileService';
import { playTrack, addToQueue as addTrackToQueue } from '../services/MusicService';

export const HomeScreen: React.FC = () => {
  const {
    songs,
    setSongs,
    searchQuery,
    setSearchQuery,
    currentSong,
    recentlyPlayed,
    favorites,
    playlists,
    setCurrentSong,
    setIsPlaying,
    playNext,
    addToQueue,
    toggleFavorite,
    createPlaylist,
    addToPlaylist,
  } = useMusicStore();

  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'recent' | 'favorites'>('all');
  const [contextMenuSong, setContextMenuSong] = useState<any>(null);
  const [showCreatePlaylist, setShowCreatePlaylist] = useState(false);
  const [pendingSong, setPendingSong] = useState<any>(null);

  useEffect(() => {
    loadMusicLibrary();
  }, []);

  const loadMusicLibrary = async () => {
    setIsLoading(true);
    try {
      const scannedSongs = await scanMusicLibrary();
      setSongs(scannedSongs);
    } catch (error) {
      console.error('Error loading music library:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredSongs = useMemo(() => {
    let baseSongs = songs;
    
    if (activeTab === 'recent') {
      baseSongs = recentlyPlayed;
    } else if (activeTab === 'favorites') {
      baseSongs = favorites;
    }

    return searchQuery ? searchSongs(baseSongs, searchQuery) : baseSongs;
  }, [songs, recentlyPlayed, favorites, searchQuery, activeTab]);

  const handleSongPress = async (song: any, index: number) => {
    setCurrentSong(song);
    setIsPlaying(true);
    const queue = filteredSongs.slice(index + 1);
    await playTrack(song, queue);
  };

  const handleSongLongPress = (song: any) => {
    setContextMenuSong(song);
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

  const renderSong = ({ item, index }: { item: any; index: number }) => (
    <SongItem
      song={item}
      onPress={() => handleSongPress(item, index)}
      onLongPress={() => handleSongLongPress(item)}
      isPlaying={currentSong?.id === item.id}
    />
  );
  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      {isLoading ? (
        <>
          <ActivityIndicator size="large" color={colors.accent} />
          <Text style={styles.emptyText}>Scanning music library...</Text>
        </>
      ) : (
        <>
          <Text style={styles.emptyIcon}>♪</Text>
          <Text style={styles.emptyText}>
            {searchQuery
              ? 'No songs found'
              : activeTab === 'recent'
              ? 'No recently played songs'
              : activeTab === 'favorites'
              ? 'No favorite songs yet'
              : 'No music found'}
          </Text>
          {!searchQuery && activeTab === 'all' && (
            <TouchableOpacity
              style={styles.refreshButton}
              onPress={loadMusicLibrary}>
              <Text style={styles.refreshButtonText}>Refresh Library</Text>
            </TouchableOpacity>
          )}
        </>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Ambient glow accents */}
      <View style={styles.ambientGlowWarm} pointerEvents="none" />
      <View style={styles.ambientGlowCool} pointerEvents="none" />

      {/* Sticky Header */}
      <View style={styles.headerContainer}>
        <View style={styles.header}>
          <Text style={styles.eyebrow}>Your Sound</Text>
          <Text style={styles.title}>Music</Text>
          <SearchBar
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search your library..."
          />
        </View>
        {/* Sticky Tabs */}
        <View style={styles.tabsContainer}>
          <View style={styles.tabs}>
            <TabButton
              label="All Songs"
              active={activeTab === 'all'}
              onPress={() => setActiveTab('all')}
              count={songs.length}
            />
            <TabButton
              label="Recent"
              active={activeTab === 'recent'}
              onPress={() => setActiveTab('recent')}
              count={recentlyPlayed.length}
            />
            <TabButton
              label="Favorites"
              active={activeTab === 'favorites'}
              onPress={() => setActiveTab('favorites')}
              count={favorites.length}
            />
          </View>
        </View>
      </View>

      {/* Scrollable Song List */}
      <FlatList
        data={filteredSongs}
        renderItem={renderSong}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        initialNumToRender={20}
        maxToRenderPerBatch={20}
        windowSize={10}
        removeClippedSubviews={true}
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
  count: number;
}

const TabButton: React.FC<TabButtonProps> = ({ label, active, onPress, count }) => (
  <TouchableOpacity
    style={[styles.tab, active && styles.tabActive]}
    onPress={onPress}
    activeOpacity={0.7}>
    <Text style={[styles.tabText, active && styles.tabTextActive]}>
      {label} {count > 0 && `(${count})`}
    </Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    overflow: 'hidden',
  },
  ambientGlowWarm: {
    position: 'absolute',
    top: -120,
    right: -100,
    width: 320,
    height: 320,
    borderRadius: 999,
    backgroundColor: colors.glowWarm,
  },
  ambientGlowCool: {
    position: 'absolute',
    top: 180,
    left: -140,
    width: 280,
    height: 280,
    borderRadius: 999,
    backgroundColor: colors.glowCool,
  },
  listContent: {
    flexGrow: 1,
    paddingTop: spacing.sm,
  },
  headerContainer: {
    backgroundColor: 'transparent',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  header: {
    padding: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    marginTop: 20
  },
  eyebrow: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
    color: colors.accent,
    textTransform: 'uppercase',
    letterSpacing: typography.letterSpacing.wider,
    marginBottom: spacing.xs,
  },
  title: {
    fontSize: typography.sizes.xxxl,
    fontWeight: typography.weights.black,
    letterSpacing: typography.letterSpacing.tight,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  tabsContainer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  tabs: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  tab: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.full,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.border,
  },
  tabActive: {
    backgroundColor: colors.accentDim,
    borderColor: colors.borderGlow,
  },
  tabText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
    color: colors.text.secondary,
  },
  tabTextActive: {
    color: colors.accentLight,
    fontWeight: typography.weights.semibold,
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
    marginTop: spacing.md,
  },
  refreshButton: {
    marginTop: spacing.xl,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...elevation.card,
  },
  refreshButtonText: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: colors.accentLight,
  },
});
