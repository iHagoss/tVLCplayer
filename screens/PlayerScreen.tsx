import React, { useEffect, useState, useCallback } from "react";
import { StyleSheet, View, Platform } from "react-native";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as ScreenOrientation from "expo-screen-orientation";

import { VideoPlayer } from "@/components/VideoPlayer";
import { ThemedView } from "@/components/ThemedView";
import { ThemedText } from "@/components/ThemedText";
import { Button } from "@/components/Button";
import { useSettings } from "@/hooks/useSettings";
import { savePlaybackPosition } from "@/storage/settingsStorage";
import { communitySkipService } from "@/services/communitySkipService";
import { RootStackParamList, SkipMarker } from "@/types";
import { Colors, Spacing, Typography } from "@/constants/theme";

type PlayerScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, "Player">;
type PlayerScreenRouteProp = RouteProp<RootStackParamList, "Player">;

const SAMPLE_VIDEO_URL = "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4";

export default function PlayerScreen() {
  const navigation = useNavigation<PlayerScreenNavigationProp>();
  const route = useRoute<PlayerScreenRouteProp>();
  const insets = useSafeAreaInsets();
  const { settings, isLoading } = useSettings();
  
  const [communitySkipMarkers, setCommunitySkipMarkers] = useState<SkipMarker[]>([]);
  const [hasVideo, setHasVideo] = useState(false);
  
  const videoUri = route.params?.uri || SAMPLE_VIDEO_URL;
  const videoTitle = route.params?.title || "Sample Video";
  const showName = route.params?.showName || "Unknown Show";
  const imdbId = route.params?.imdbId || "tt0000000";
  const season = route.params?.season ?? 1;
  const episode = route.params?.episode ?? 1;

  useEffect(() => {
    async function lockOrientation() {
      if (Platform.OS !== "web") {
        await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
      }
    }
    lockOrientation();

    return () => {
      if (Platform.OS !== "web") {
        ScreenOrientation.unlockAsync();
      }
    };
  }, []);

  useEffect(() => {
    async function loadSkipData() {
      // Load community skip markers if enabled
      if (settings.skip.enabledCommunitySkip) {
        const markers = await communitySkipService.getSkipMarkersForEpisode(imdbId, season, episode);
        setCommunitySkipMarkers(markers);
      } else {
        setCommunitySkipMarkers([]);
      }
    }
    loadSkipData();
  }, [imdbId, season, episode, settings.skip.enabledCommunitySkip]);

  useEffect(() => {
    if (route.params?.uri) {
      setHasVideo(true);
    }
  }, [route.params?.uri]);

  const handleSettingsPress = useCallback(() => {
    navigation.navigate("Settings");
  }, [navigation]);

  const handleProgress = useCallback((position: number, duration: number) => {
    if (position > 0 && settings.playback.rememberPosition) {
      savePlaybackPosition(videoUri, position);
    }
  }, [videoUri, settings.playback.rememberPosition]);

  const handleLoadSampleVideo = useCallback(() => {
    setHasVideo(true);
  }, []);

  if (isLoading) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ThemedText style={styles.loadingText}>Loading...</ThemedText>
      </ThemedView>
    );
  }

  if (!hasVideo && !route.params?.uri) {
    return (
      <ThemedView style={[styles.emptyContainer, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <View style={styles.emptyContent}>
          <ThemedText style={styles.emptyTitle}>StreamPlayer</ThemedText>
          <ThemedText style={styles.emptySubtitle}>
            Open a video from Stremio or another app to start playing
          </ThemedText>
          
          <View style={styles.buttonContainer}>
            <Button onPress={handleLoadSampleVideo} style={styles.sampleButton}>
              Play Sample Video
            </Button>
            
            <Button onPress={handleSettingsPress} style={styles.settingsButton}>
              Open Settings
            </Button>
          </View>

          <View style={styles.infoContainer}>
            <ThemedText style={styles.infoTitle}>Features:</ThemedText>
            <ThemedText style={styles.infoItem}>
              - Skip detection: Chapter, Audio, Community, Manual
            </ThemedText>
            <ThemedText style={styles.infoItem}>
              - Real-time clock and end time display
            </ThemedText>
            <ThemedText style={styles.infoItem}>
              - Playback speed control (0.5x - 2.0x)
            </ThemedText>
            <ThemedText style={styles.infoItem}>
              - Trakt.tv scrobbling integration
            </ThemedText>
            <ThemedText style={styles.infoItem}>
              - Debrid service support
            </ThemedText>
          </View>
        </View>
      </ThemedView>
    );
  }

  return (
    <View style={styles.container}>
      <VideoPlayer
        uri={videoUri}
        title={videoTitle}
        onSettingsPress={handleSettingsPress}
        skipSettings={settings.skip}
        communitySkipMarkers={communitySkipMarkers}
        manualIntroSkip={settings.skip.globalIntroSkipSeconds}
        manualCreditsSkip={settings.skip.globalCreditsSkipSeconds}
        onProgress={handleProgress}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.backgroundRoot,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.dark.backgroundRoot,
  },
  loadingText: {
    ...Typography.body,
    color: Colors.dark.text,
  },
  emptyContainer: {
    flex: 1,
    backgroundColor: Colors.dark.backgroundRoot,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: Spacing["2xl"],
  },
  emptyContent: {
    alignItems: "center",
    maxWidth: 500,
  },
  emptyTitle: {
    ...Typography.h1,
    color: Colors.dark.accent,
    marginBottom: Spacing.md,
  },
  emptySubtitle: {
    ...Typography.body,
    color: Colors.dark.disabled,
    textAlign: "center",
    marginBottom: Spacing["3xl"],
  },
  buttonContainer: {
    flexDirection: "row",
    gap: Spacing.lg,
    marginBottom: Spacing["3xl"],
  },
  sampleButton: {
    paddingHorizontal: Spacing["2xl"],
  },
  settingsButton: {
    paddingHorizontal: Spacing["2xl"],
    backgroundColor: Colors.dark.backgroundSecondary,
  },
  infoContainer: {
    alignItems: "flex-start",
    backgroundColor: Colors.dark.backgroundDefault,
    padding: Spacing.xl,
    borderRadius: Spacing.md,
    width: "100%",
  },
  infoTitle: {
    ...Typography.h4,
    color: Colors.dark.text,
    marginBottom: Spacing.md,
  },
  infoItem: {
    ...Typography.small,
    color: Colors.dark.disabled,
    marginBottom: Spacing.xs,
  },
});
