# Personal Music Player - React Native

A high-performance, minimalist music player for Android built with React Native. Designed for speed, simplicity, and a calm, focused user experience.

## Features

### Core Playback
- ✨ Play/Pause, Next/Previous, Seek
- 🔀 Shuffle & Repeat modes
- 📱 Background audio playback
- 🔒 Lock screen controls
- 📊 Queue management
- ⏭️ Play Next functionality

### Library Management
- 📁 Local device music scanning
- 🎵 Automatic organization by Songs, Albums, Artists
- 🔍 Fast instant search across all music
- ⭐ Favorites/Liked songs
- 🕐 Recently played tracking
- 📂 Playlist creation and management

### User Interface
- 🎨 Calm, meditation-inspired design
- 🌙 Dark theme with warm accents
- ⚡ Optimized for performance
- 📲 Minimal navigation (Home, Library, Now Playing)
- 🎯 Quick access to all features
- 💫 Smooth animations

## Tech Stack

- **React Native 0.87** - Cross-platform framework
- **react-native-track-player** - Audio playback with background support
- **Zustand** - Lightweight state management
- **react-native-fs** - File system access for local music
- **TypeScript** - Type safety

## Setup Instructions

### Prerequisites

1. **Node.js** (>= 22.11.0)
2. **Android Studio** with Android SDK
3. **Java Development Kit (JDK 17+)**

### Installation

1. **Install Dependencies**
```bash
npm install
```

2. **Android SDK Setup**
- Install Android Studio
- Set up Android SDK (API 34+)
- Update `android/local.properties` with your SDK path:
```
sdk.dir=C:\\Users\\YourUsername\\AppData\\Local\\Android\\Sdk
```

3. **Link Native Dependencies**
```bash
npx react-native link react-native-track-player
npx react-native link react-native-fs
npx react-native link @react-native-community/slider
```

### Running the App

1. **Start Metro Bundler**
```bash
npm start
```

2. **Run on Android**
```bash
npm run android
```

Or in separate terminals:
```bash
# Terminal 1
npm start

# Terminal 2
npm run android
```

### Build for Release

```bash
cd android
./gradlew assembleRelease
```

The APK will be at: `android/app/build/outputs/apk/release/app-release.apk`

## Project Structure

```
suno/
├── src/
│   ├── components/       # Reusable UI components
│   │   ├── MiniPlayer.tsx
│   │   ├── SearchBar.tsx
│   │   └── SongItem.tsx
│   ├── screens/          # Main screens
│   │   ├── HomeScreen.tsx
│   │   ├── LibraryScreen.tsx
│   │   └── NowPlayingScreen.tsx
│   ├── services/         # Business logic
│   │   ├── MusicService.ts
│   │   ├── FileService.ts
│   │   └── playbackService.ts
│   ├── store/            # State management
│   │   └── musicStore.ts
│   └── theme/            # Design system
│       └── colors.ts
├── android/              # Android native code
├── App.tsx               # Main app component
└── index.js              # App entry point
```

## Usage Guide

### First Launch
1. App will request storage permissions
2. Automatically scans device for music files
3. Organizes music by songs, albums, and artists

### Quick Actions
- **Search**: Tap search bar on Home screen
- **Play Song**: Tap any song to start playback
- **View Album**: Switch to Library > Albums
- **Create Playlist**: Long press on a song (feature ready for implementation)
- **Shuffle Play**: Tap shuffle icon in Now Playing screen
- **Add to Queue**: Long press song (feature ready for implementation)

### Navigation
- **Home Tab**: All songs, recent, favorites with search
- **Library Tab**: Browse by albums, artists, playlists
- **Mini Player**: Tap to open full Now Playing screen
- **Now Playing**: Full playback controls, artwork, queue info

## Design Philosophy

### Performance First
- Virtualized lists for smooth scrolling
- Optimized re-renders with Zustand
- Efficient music library scanning
- Background audio with minimal battery drain

### Minimal & Calm
- Dark theme with warm accent colors (#B8A583)
- Clean typography and spacing
- Subtle animations
- No visual clutter
- Focus on content over chrome

### Instant Feel
- Fast search (filters as you type)
- Quick library loading
- Immediate playback start
- Smooth transitions

## Permissions

The app requires the following Android permissions:
- `READ_EXTERNAL_STORAGE` - Access music files
- `READ_MEDIA_AUDIO` - Read audio files (Android 13+)
- `WAKE_LOCK` - Keep playback during sleep
- `FOREGROUND_SERVICE` - Background audio
- `FOREGROUND_SERVICE_MEDIA_PLAYBACK` - Media playback service

## Troubleshooting

### Music Not Showing
- Check storage permissions are granted
- Ensure music files are in `/Music` or `/Download` folders
- Supported formats: MP3, M4A, AAC, FLAC, WAV, OGG
- Tap "Refresh Library" on Home screen

### Build Errors
```bash
cd android
./gradlew clean
cd ..
npm start -- --reset-cache
npm run android
```

### Track Player Issues
- Clear app data and reinstall
- Check that `playbackService.ts` is registered in `index.js`
- Verify AndroidManifest.xml includes MusicService

## Future Enhancements

- [ ] Playlist editing (add/remove songs)
- [ ] Song context menu (add to queue, play next)
- [ ] Album artwork fetching
- [ ] Lyrics support
- [ ] Audio equalizer
- [ ] Sleep timer
- [ ] Widgets
- [ ] Car mode

## Performance Tips

- App scans up to 5 directory levels deep
- Large libraries (1000+ songs) may take 10-30 seconds to scan
- Search is instant and filters all metadata
- Queue persists across app restarts
- Background playback uses minimal battery

## License

Personal use only.

## Credits

Built with React Native and modern Android audio APIs for a smooth, native music experience.
