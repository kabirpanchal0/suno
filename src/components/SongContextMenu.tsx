import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Song, Playlist } from '../store/musicStore';
import { colors, spacing, borderRadius, typography } from '../theme/colors';

interface SongContextMenuProps {
  visible: boolean;
  song: Song | null;
  playlists: Playlist[];
  onClose: () => void;
  onPlayNext: (song: Song) => void;
  onAddToQueue: (song: Song) => void;
  onAddToPlaylist: (song: Song, playlistId: string) => void;
  onToggleFavorite: (song: Song) => void;
  onCreatePlaylist: (song: Song) => void;
  isFavorite: boolean;
}

const { height } = Dimensions.get('window');

export const SongContextMenu: React.FC<SongContextMenuProps> = ({
  visible,
  song,
  playlists,
  onClose,
  onPlayNext,
  onAddToQueue,
  onAddToPlaylist,
  onToggleFavorite,
  onCreatePlaylist,
  isFavorite,
}) => {
  const [showPlaylistSelection, setShowPlaylistSelection] = React.useState(false);

  const handlePlayNext = () => {
    if (song) {
      onPlayNext(song);
      onClose();
    }
  };

  const handleAddToQueue = () => {
    if (song) {
      onAddToQueue(song);
      onClose();
    }
  };

  const handleToggleFavorite = () => {
    if (song) {
      onToggleFavorite(song);
      onClose();
    }
  };

  const handleAddToPlaylistClick = () => {
    setShowPlaylistSelection(true);
  };

  const handlePlaylistSelect = (playlistId: string) => {
    if (song) {
      onAddToPlaylist(song, playlistId);
      setShowPlaylistSelection(false);
      onClose();
    }
  };

  const handleCreateNewPlaylist = () => {
    if (song) {
      onCreatePlaylist(song);
      setShowPlaylistSelection(false);
      onClose();
    }
  };

  const handleBackToMenu = () => {
    setShowPlaylistSelection(false);
  };

  if (!song) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}>
      <TouchableOpacity
        style={styles.backdrop}
        activeOpacity={1}
        onPress={onClose}>
        <View style={styles.container}>
          <TouchableOpacity activeOpacity={1} onPress={(e) => e.stopPropagation()}>
            <View style={styles.menu}>
              {/* Song Info */}
              <View style={styles.songInfo}>
                <Text style={styles.songTitle} numberOfLines={1}>
                  {song.title}
                </Text>
                <Text style={styles.songArtist} numberOfLines={1}>
                  {song.artist}
                </Text>
              </View>

              {!showPlaylistSelection ? (
                /* Main Menu */
                <ScrollView style={styles.menuScroll}>
                  <MenuItem
                    iconName="skip-next"
                    label="Play Next"
                    onPress={handlePlayNext}
                  />
                  <MenuItem
                    iconName="playlist-plus"
                    label="Add to Queue"
                    onPress={handleAddToQueue}
                  />
                  <MenuItem
                    iconName="playlist-music"
                    label="Add to Playlist"
                    onPress={handleAddToPlaylistClick}
                    hasChevron
                  />
                  <MenuItem
                    iconName={isFavorite ? "heart" : "heart-outline"}
                    label={isFavorite ? "Remove from Favorites" : "Add to Favorites"}
                    onPress={handleToggleFavorite}
                    iconColor={isFavorite ? colors.accent : undefined}
                  />
                </ScrollView>
              ) : (
                /* Playlist Selection */
                <>
                  <TouchableOpacity
                    style={styles.backButton}
                    onPress={handleBackToMenu}>
                    <Icon name="chevron-left" size={24} color={colors.accent} />
                    <Text style={styles.backButtonText}>Back</Text>
                  </TouchableOpacity>

                  <ScrollView style={styles.menuScroll}>
                    <MenuItem
                      iconName="playlist-plus"
                      label="Create New Playlist"
                      onPress={handleCreateNewPlaylist}
                    />
                    
                    {playlists.length > 0 && (
                      <View style={styles.separator} />
                    )}

                    {playlists.map((playlist) => (
                      <MenuItem
                        key={playlist.id}
                        iconName="playlist-music"
                        label={playlist.name}
                        subtitle={`${playlist.songs.length} song${playlist.songs.length !== 1 ? 's' : ''}`}
                        onPress={() => handlePlaylistSelect(playlist.id)}
                      />
                    ))}

                    {playlists.length === 0 && (
                      <Text style={styles.emptyText}>
                        No playlists yet. Create one to get started!
                      </Text>
                    )}
                  </ScrollView>
                </>
              )}
            </View>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

interface MenuItemProps {
  iconName: string;
  label: string;
  subtitle?: string;
  onPress: () => void;
  hasChevron?: boolean;
  iconColor?: string;
}

const MenuItem: React.FC<MenuItemProps> = ({
  iconName,
  label,
  subtitle,
  onPress,
  hasChevron,
  iconColor,
}) => (
  <TouchableOpacity style={styles.menuItem} onPress={onPress} activeOpacity={0.7}>
    <Icon 
      name={iconName} 
      size={24} 
      color={iconColor || colors.text.primary} 
      style={styles.menuIcon}
    />
    <View style={styles.menuItemContent}>
      <Text style={styles.menuLabel}>{label}</Text>
      {subtitle && <Text style={styles.menuSubtitle}>{subtitle}</Text>}
    </View>
    {hasChevron && <Icon name="chevron-right" size={24} color={colors.text.tertiary} />}
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
  },
  container: {
    justifyContent: 'flex-end',
  },
  menu: {
    backgroundColor: colors.backgroundElevated,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    borderTopWidth: 1,
    borderColor: colors.borderLight,
    maxHeight: height * 0.7,
  },
  songInfo: {
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  songTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  songArtist: {
    fontSize: typography.sizes.md,
    color: colors.accentLight,
  },
  menuScroll: {
    maxHeight: height * 0.5,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    paddingVertical: spacing.md,
    marginHorizontal: spacing.sm,
    borderRadius: borderRadius.md,
  },
  menuIcon: {
    marginRight: spacing.md,
    width: 24,
  },
  menuItemContent: {
    flex: 1,
  },
  menuLabel: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.medium,
    color: colors.text.primary,
  },
  menuSubtitle: {
    fontSize: typography.sizes.sm,
    color: colors.text.tertiary,
    marginTop: 2,
  },
  chevron: {
    fontSize: typography.sizes.xl,
    color: colors.text.tertiary,
    marginLeft: spacing.sm,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButtonText: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.medium,
    color: colors.accent,
    marginLeft: spacing.xs,
  },
  separator: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.sm,
  },
  emptyText: {
    fontSize: typography.sizes.sm,
    color: colors.text.tertiary,
    textAlign: 'center',
    padding: spacing.xl,
  },
});
