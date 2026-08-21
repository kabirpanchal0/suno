import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Modal,
  BackHandler,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useMusicStore, Playlist, Song } from '../store/musicStore';
import { CreatePlaylistDialog } from '../components/CreatePlaylistDialog';
import { PlaylistDetailScreen } from './PlaylistDetailScreen';
import { SearchBar } from '../components/SearchBar';
import { colors, spacing, borderRadius, typography, elevation } from '../theme/colors';
import { playQueue } from '../services/MusicService';
import { useSongActions } from '../hooks/useSongActions';

type ViewMode = 'albums' | 'artists' | 'playlists';

export const LibraryScreen: React.FC = () => {
  const albums = useMusicStore((s) => s.albums);
  const artists = useMusicStore((s) => s.artists);
  const playlists = useMusicStore((s) => s.playlists);
  const setCurrentSong = useMusicStore((s) => s.setCurrentSong);
  const setIsPlaying = useMusicStore((s) => s.setIsPlaying);
  const setQueue = useMusicStore((s) => s.setQueue);

  // LibraryScreen's grid items are albums/artists/playlists, not individual
  // songs, so there's no long-press-a-song surface here — only the
  // "New Playlist" creation flow from useSongActions is actually reachable
  // from this screen. (Individual song actions live in PlaylistDetailScreen,
  // which does use the full hook.)
  const { showCreatePlaylist, handleCreatePlaylistButton, handlePlaylistCreated, closeCreatePlaylistDialog } =
    useSongActions();

  const [viewMode, setViewMode] = useState<ViewMode>('albums');
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

  const handleAlbumPress = useCallback(
    async (albumSongs: Song[]) => {
      if (albumSongs.length > 0) {
        setCurrentSong(albumSongs[0]);
        setQueue(albumSongs.slice(1));
        setIsPlaying(true);
        await playQueue(albumSongs);
      }
    },
    [setCurrentSong, setQueue, setIsPlaying]
  );

  const handlePlaylistPress = useCallback((playlist: Playlist) => {
    setSelectedPlaylist(playlist);
  }, []);

  const handleBackFromPlaylist = useCallback(() => {
    setSelectedPlaylist(null);
  }, []);

  // There's no navigation stack in this app — viewing a playlist's detail
  // is just a local state swap, not a pushed route. Without this, Android's
  // hardware/gesture back button falls through to the OS default (typically
  // backgrounding/exiting the app) instead of returning to the playlist
  // list, since nothing else intercepts it.
  useEffect(() => {
    if (!selectedPlaylist) {
      return;
    }
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      setSelectedPlaylist(null);
      return true;
    });
    return () => subscription.remove();
  }, [selectedPlaylist]);

  const renderAlbum = useCallback(
    ({ item }: { item: any }) => (
      <TouchableOpacity
        style={styles.gridItem}
        onPress={() => handleAlbumPress(item.songs)}
        activeOpacity={0.7}>
        <View style={styles.gridItemArtwork}>
          {item.artwork ? (
            <Image source={{ uri: item.artwork }} style={imageStyles.gridItemImage} />
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
    ),
    [handleAlbumPress]
  );

  const renderPlaylist = useCallback(
    ({ item }: { item: any }) => (
      <TouchableOpacity
        style={styles.listItem}
        onPress={() => handlePlaylistPress(item)}
        activeOpacity={0.7}>
        <View style={styles.listItemArtwork}>
          {item.songs?.[0]?.artwork ? (
            <Image source={{ uri: item.songs[0].artwork }} style={imageStyles.listItemImage} />
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
    ),
    [handlePlaylistPress]
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
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
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
    paddingBottom: spacing.xxl,
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
    paddingBottom: spacing.xxl,
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

// Split into their own StyleSheet.create call: RN's StyleSheet.create infers
// a single shared type across every key in one call, so mixing Image styles
// into the same object as View/Text styles above widened everything to
// ViewStyle | TextStyle | ImageStyle — which broke both the <Image> style
// props (ImageStyle disallows ViewStyle's `overflow: 'scroll'`) and, as
// collateral damage, `gap` on unrelated View styles in that same object.
// Keeping Image-only styles in a separate call keeps both sides precisely
// typed.
const imageStyles = StyleSheet.create({
  gridItemImage: {
    width: '100%',
    height: '100%',
    borderRadius: borderRadius.md,
  },
  listItemImage: {
    width: '100%',
    height: '100%',
    borderRadius: borderRadius.sm,
  },
});
