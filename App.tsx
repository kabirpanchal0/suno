import React, { useEffect, useState } from 'react';
import {
  SafeAreaView,
  StatusBar,
  StyleSheet,
  View,
  TouchableOpacity,
  Text,
  Modal,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { setupPlayer } from './src/services/MusicService';
import { HomeScreen } from './src/screens/HomeScreen';
import { LibraryScreen } from './src/screens/LibraryScreen';
import { NowPlayingScreen } from './src/screens/NowPlayingScreen';
import { MiniPlayer } from './src/components/MiniPlayer';
import { colors, spacing, typography } from './src/theme/colors';
import TrackPlayer from 'react-native-track-player';

type Tab = 'home' | 'library';

function App(): React.JSX.Element {
  const [isPlayerReady, setIsPlayerReady] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [showNowPlaying, setShowNowPlaying] = useState(false);

  useEffect(() => {
    const setup = async () => {
      await setupPlayer();
      setIsPlayerReady(true);
    };
    setup();
  }, []);

  const handleMiniPlayerPress = () => {
    setShowNowPlaying(true);
  };

  const handleCloseNowPlaying = () => {
    setShowNowPlaying(false);
  };

  if (!isPlayerReady) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <StatusBar barStyle="light-content" backgroundColor={colors.background} />
        <Icon name="music" size={80} color={colors.accent} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />
      
      <View style={styles.content}>
        {activeTab === 'home' ? <HomeScreen /> : <LibraryScreen />}
      </View>

      <MiniPlayer onPress={handleMiniPlayerPress} />

      <View style={styles.tabBar}>
        <TabBarButton
          label="Home"
          iconName="home"
          active={activeTab === 'home'}
          onPress={() => setActiveTab('home')}
        />
        <TabBarButton
          label="Library"
          iconName="music-box-multiple"
          active={activeTab === 'library'}
          onPress={() => setActiveTab('library')}
        />
      </View>

      <Modal
        visible={showNowPlaying}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={handleCloseNowPlaying}>
        <NowPlayingScreen onClose={handleCloseNowPlaying} />
      </Modal>
    </SafeAreaView>
  );
}

interface TabBarButtonProps {
  label: string;
  iconName: string;
  active: boolean;
  onPress: () => void;
}

const TabBarButton: React.FC<TabBarButtonProps> = ({
  label,
  iconName,
  active,
  onPress,
}) => (
  <TouchableOpacity
    style={styles.tabButton}
    onPress={onPress}
    activeOpacity={0.7}>
    <Icon 
      name={iconName} 
      size={24} 
      color={active ? colors.accent : colors.text.tertiary} 
    />
    <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>
      {label}
    </Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingBottom: spacing.xs,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  tabLabel: {
    fontSize: typography.sizes.xs,
    color: colors.text.tertiary,
  },
  tabLabelActive: {
    color: colors.accent,
  },
});

export default App;
