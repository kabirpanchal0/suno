import React, { useEffect, useState, useMemo, useCallback } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  Text,
  ActivityIndicator,
  TouchableOpacity,
  Modal,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useMusicStore, Song } from '../store/musicStore';
import { SearchBar } from '../components/SearchBar';
import { SongItem } from '../components/SongItem';
import { SongContextMenu } from '../components/SongContextMenu';
import { CreatePlaylistDialog } from '../components/CreatePlaylistDialog';
import { colors, spacing, typography, borderRadius, elevation } from '../theme/colors';
import { scanMusicLibrary, searchSongs } from '../services/FileService';
import { playTrack } from '../services/MusicService';
import { loadLibrary, saveLibrary, mergeScannedSongs } from '../services/LibraryStorageService';
import { useSongActions, useIsSongFavorite } from '../hooks/useSongActions';

export const HomeScreen: React.FC = () => {
  // Selector-scoped subscriptions: each field is its own subscription, so a
  // change to e.g. `position` (which ticks ~once/second during playback,
  // see MusicService's progressUpdateEventInterval) no longer re-renders
  // this whole screen — only the fields actually read here do.
  const songs = useMusicStore((s) => s.songs);
  const setSongs = useMusicStore((s) => s.setSongs);
  const setHasHydrated = useMusicStore((s) => s.setHasHydrated);
  const pruneMissingSongs = useMusicStore((s) => s.pruneMissingSongs);
  const searchQuery = useMusicStore((s) => s.searchQuery);
  const setSearchQuery = useMusicStore((s) => s.setSearchQuery);
  const currentSongId = useMusicStore((s) => s.currentSong?.id);
  const recentlyPlayed = useMusicStore((s) => s.recentlyPlayed);
  const favorites = useMusicStore((s) => s.favorites);
  const playlists = useMusicStore((s) => s.playlists);
  const setCurrentSong = useMusicStore((s) => s.setCurrentSong);
  const setIsPlaying = useMusicStore((s) => s.setIsPlaying);
  const setQueue = useMusicStore((s) => s.setQueue);

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

  const [isLoading, setIsLoading] = useState(false);
  const [isRescanning, setIsRescanning] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'recent' | 'favorites'>('all');
  const [showTabMenu, setShowTabMenu] = useState(false);

  const tabOptions = useMemo(
    () =>
      [
        { key: 'all' as const, label: 'All Songs', count: songs.length },
        { key: 'recent' as const, label: 'Recent', count: recentlyPlayed.length },
        { key: 'favorites' as const, label: 'Favorites', count: favorites.length },
      ],
    [songs.length, recentlyPlayed.length, favorites.length]
  );
  const activeTabOption = tabOptions.find((t) => t.key === activeTab)!;

  // Runs once per mount. Loads whatever was persisted from a previous scan
  // first; only touches the device filesystem if nothing has ever been
  // persisted (first-ever launch, or the cache was cleared/invalidated).
  // This is the fix for songs being re-fetched from the device on every
  // reload/reopen — see LibraryStorageService for the persistence layer.
  useEffect(() => {
    let isMounted = true;

    const hydrate = async () => {
      setIsLoading(true);
      try {
        const persisted = await loadLibrary();
        if (persisted && persisted.length > 0) {
          if (isMounted) {
            setSongs(persisted);
          }
        } else {
          await performScan({ persist: true });
        }
      } catch (error) {
        console.error('Error hydrating music library:', error);
      } finally {
        if (isMounted) {
          setIsLoading(false);
          setHasHydrated(true);
        }
      }
    };

    hydrate();

    return () => {
      isMounted = false;
    };
    // Intentionally run only on mount — this effect owns first-load hydration;
    // rescans are triggered explicitly via handleRescanLibrary, not by this effect.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Scans the device and reconciles the result against whatever is
  // currently in the store: new songs are added, songs no longer found
  // on-device are dropped from the library (their references elsewhere —
  // favorites/playlists/recently-played — are pruned too), and songs that
  // still exist keep their identity, so nothing gets duplicated.
  const performScan = useCallback(
    async ({ persist }: { persist: boolean }) => {
      const scannedSongs = await scanMusicLibrary();
      const currentSongs = useMusicStore.getState().songs;
      const merged = mergeScannedSongs(currentSongs, scannedSongs);

      setSongs(merged);
      pruneMissingSongs(new Set(merged.map((s) => s.id)));

      if (persist) {
        await saveLibrary(merged);
      }
      return merged;
    },
    [setSongs, pruneMissingSongs]
  );

  // Explicit user-triggered rescan (pull-to-refresh / "Refresh Library"
  // button / empty-state retry). This is the ONLY path that hits the device
  // filesystem after first launch.
  const handleRescanLibrary = useCallback(async () => {
    setIsRescanning(true);
    try {
      await performScan({ persist: true });
    } catch (error) {
      console.error('Error rescanning music library:', error);
    } finally {
      setIsRescanning(false);
    }
  }, [performScan]);

  const filteredSongs = useMemo(() => {
    let baseSongs = songs;

    if (activeTab === 'recent') {
      baseSongs = recentlyPlayed;
    } else if (activeTab === 'favorites') {
      baseSongs = favorites;
    }

    return searchQuery ? searchSongs(baseSongs, searchQuery) : baseSongs;
  }, [songs, recentlyPlayed, favorites, searchQuery, activeTab]);

  const handleSongPress = useCallback(
    async (song: Song, index: number) => {
      const queue = filteredSongs.slice(index + 1);
      setCurrentSong(song);
      setIsPlaying(true);
      // Without this, the store's `queue` stayed empty until the next track
      // change resynced it (see playbackService's PlaybackActiveTrackChanged
      // handler) — so Now Playing's "Up Next" list had nothing to show and
      // looked broken/unscrollable right after playing a song from Home.
      setQueue(queue);
      await playTrack(song, queue);
    },
    [filteredSongs, setCurrentSong, setIsPlaying, setQueue]
  );

  const renderSong = useCallback(
    ({ item, index }: { item: Song; index: number }) => (
      <SongItem
        song={item}
        index={index}
        onPress={handleSongPress}
        onLongPress={openContextMenu}
        isPlaying={currentSongId === item.id}
        onSwipeToQueue={handleAddToQueue}
      />
    ),
    [handleSongPress, openContextMenu, currentSongId, handleAddToQueue]
  );

  const renderEmpty = useCallback(
    () => (
      <View style={styles.emptyContainer}>
        {isLoading || isRescanning ? (
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
              <TouchableOpacity style={styles.refreshButton} onPress={handleRescanLibrary}>
                <Text style={styles.refreshButtonText}>Refresh Library</Text>
              </TouchableOpacity>
            )}
          </>
        )}
      </View>
    ),
    [isLoading, isRescanning, searchQuery, activeTab, handleRescanLibrary]
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
          <View style={styles.titleRow}>
            <Text style={styles.title}>Music</Text>
            <View style={styles.titleRowActions}>
              <TouchableOpacity
                style={styles.rescanButton}
                onPress={handleRescanLibrary}
                disabled={isRescanning}
                activeOpacity={0.7}>
                <Icon
                  name="refresh"
                  size={18}
                  color={isRescanning ? colors.text.tertiary : colors.accentLight}
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.tabMenuButton}
                onPress={() => setShowTabMenu(true)}
                activeOpacity={0.7}>
                <Text style={styles.tabMenuButtonText}>{activeTabOption.label}</Text>
                <Icon name="chevron-down" size={18} color={colors.accentLight} />
              </TouchableOpacity>
            </View>
          </View>
          <SearchBar
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search your library..."
          />
        </View>
      </View>

      <Modal
        visible={showTabMenu}
        transparent
        animationType="fade"
        onRequestClose={() => setShowTabMenu(false)}>
        <TouchableOpacity
          style={styles.tabMenuBackdrop}
          activeOpacity={1}
          onPress={() => setShowTabMenu(false)}>
          <View style={styles.tabMenu}>
            {tabOptions.map((option) => (
              <TouchableOpacity
                key={option.key}
                style={styles.tabMenuOption}
                onPress={() => {
                  setActiveTab(option.key);
                  setShowTabMenu(false);
                }}
                activeOpacity={0.7}>
                <Text
                  style={[
                    styles.tabMenuOptionText,
                    activeTab === option.key && styles.tabMenuOptionTextActive,
                  ]}>
                  {option.label} {option.count > 0 && `(${option.count})`}
                </Text>
                {activeTab === option.key && (
                  <Icon name="check" size={18} color={colors.accentLight} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

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
        onClose={closeContextMenu}
        onPlayNext={handlePlayNext}
        onAddToQueue={handleAddToQueue}
        onAddToPlaylist={handleAddToPlaylist}
        onToggleFavorite={handleToggleFavorite}
        onCreatePlaylist={handleCreatePlaylist}
        isFavorite={isSongFavorite(contextMenuSong)}
      />

      <CreatePlaylistDialog
        visible={showCreatePlaylist}
        onClose={closeCreatePlaylistDialog}
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
    paddingBottom: spacing.xxl,
  },
  headerContainer: {
    backgroundColor: 'transparent',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  header: {
    padding: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
  },
  eyebrow: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
    color: colors.accent,
    textTransform: 'uppercase',
    letterSpacing: typography.letterSpacing.wider,
    marginBottom: spacing.xs,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  title: {
    fontSize: typography.sizes.xxxl,
    fontWeight: typography.weights.black,
    letterSpacing: typography.letterSpacing.tight,
    color: colors.text.primary,
  },
  titleRowActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  rescanButton: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.accentDim,
    borderWidth: 1,
    borderColor: colors.borderGlow,
  },
  tabMenuButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.full,
    backgroundColor: colors.accentDim,
    borderWidth: 1,
    borderColor: colors.borderGlow,
  },
  tabMenuButtonText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: colors.accentLight,
  },
  tabMenuBackdrop: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: 150,
    paddingRight: spacing.lg,
  },
  tabMenu: {
    minWidth: 180,
    backgroundColor: colors.backgroundElevated,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
    paddingVertical: spacing.xs,
    ...elevation.floating,
  },
  tabMenuOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.md,
  },
  tabMenuOptionText: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.medium,
    color: colors.text.primary,
  },
  tabMenuOptionTextActive: {
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
