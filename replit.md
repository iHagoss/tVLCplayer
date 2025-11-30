# StreamPlayer - VLC-Based Media Player

## Overview
StreamPlayer is a native Android media player built with Expo/React Native that provides intelligent skip detection, custom time display, and integration with Trakt.tv and Debrid services.

## Current State
- **Version**: 1.0.0
- **Status**: MVP Complete
- **Last Updated**: November 30, 2025

## Project Architecture

### Directory Structure
```
├── App.tsx                    # Root component with navigation
├── types/index.ts             # TypeScript types and defaults
├── constants/theme.ts         # Design system (colors, spacing, typography)
├── storage/
│   └── settingsStorage.ts     # AsyncStorage persistence layer
├── hooks/
│   ├── useSettings.ts         # Settings state management hook
│   ├── useTheme.ts            # Theme hook
│   └── useScreenInsets.ts     # Safe area insets hook
├── navigation/
│   ├── RootNavigator.tsx      # Main stack navigator
│   └── screenOptions.ts       # Common screen options
├── screens/
│   ├── PlayerScreen.tsx       # Main video player screen
│   ├── SettingsScreen.tsx     # App settings
│   ├── SkipConfigurationScreen.tsx  # Manual skip times configuration
│   └── TraktAuthScreen.tsx    # Trakt OAuth PIN flow
└── components/
    ├── VideoPlayer.tsx        # Video player with controls and overlays
    ├── SkipButton.tsx         # Animated skip intro/credits button
    ├── TimeDisplay.tsx        # Current time and end time overlay
    ├── SettingsRow.tsx        # Reusable settings row components
    └── ...                    # Other UI components
```

### Key Features
1. **Skip Detection System** (Three-tier approach):
   - Chapter-based skip (reads video chapter markers)
   - Audio fingerprint skip (detects repeated patterns)
   - Manual skip markers (user-defined per episode)

2. **Custom Time Display**:
   - Shows current clock time (12-hour AM/PM)
   - Shows calculated end time based on remaining duration and playback speed

3. **Playback Controls**:
   - Play/pause, seek ±10s
   - Variable playback speed (0.5x - 2.0x)
   - Position memory (resume from where left off)

4. **Trakt.tv Integration**:
   - OAuth2 PIN-based authentication flow
   - Watch history scrobbling

5. **Debrid Services**:
   - Support for Real-Debrid, AllDebrid, Premiumize, TorBox

## Design System
- **Theme**: Dark mode (OLED optimized)
- **Primary Color**: #E50914 (Netflix red)
- **Background**: #000000 (pure black for OLED)
- **TV Focus Color**: #FFD700 (gold)

## User Preferences
- Dark theme only (optimized for TV viewing)
- Landscape orientation for video playback
- Clean, minimal UI during playback

## Storage
All settings are persisted using AsyncStorage with the following keys:
- `@streamplayer/skip_settings` - Skip detection toggles
- `@streamplayer/playback_settings` - Speed, auto-play preferences
- `@streamplayer/trakt_credentials` - Trakt auth tokens
- `@streamplayer/debrid_settings` - Debrid service configuration
- `@streamplayer/manual_skip_{episodeId}` - Per-episode skip times
- `@streamplayer/position_{videoUri}` - Playback resume positions

## Recent Changes
- Initial MVP implementation with all core features
- Created skip detection system with manual skip support
- Implemented Trakt OAuth PIN flow
- Added custom time display overlay
- Built settings screens with full toggle support

## Development Notes
- Uses expo-video for video playback (Expo Go compatible)
- All screens support safe area insets for notches/status bars
- Navigation uses react-navigation v7 with native stack
- Animations use react-native-reanimated for smooth performance
