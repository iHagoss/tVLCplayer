import React, { useCallback } from "react";
import { StyleSheet, View, ScrollView, Alert, Platform } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";

import { ThemedView } from "@/components/ThemedView";
import { SettingsRow, SettingsSectionHeader } from "@/components/SettingsRow";
import { useSettings } from "@/hooks/useSettings";
import { RootStackParamList } from "@/types";
import { Colors, Spacing, Typography } from "@/constants/theme";

type SettingsScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, "Settings">;

const SPEED_OPTIONS = ["0.5x", "0.75x", "1.0x", "1.25x", "1.5x", "1.75x", "2.0x"];
const DEBRID_SERVICES = [
  { label: "None", value: "none" },
  { label: "Real-Debrid", value: "realdebrid" },
  { label: "AllDebrid", value: "alldebrid" },
  { label: "Premiumize", value: "premiumize" },
  { label: "TorBox", value: "torbox" },
];

export default function SettingsScreen() {
  const navigation = useNavigation<SettingsScreenNavigationProp>();
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const { settings, updateSkipSettings, updatePlaybackSettings, disconnectTrakt, updateDebridSettings } = useSettings();

  const handleManualSkipsPress = useCallback(() => {
    navigation.navigate("SkipConfiguration");
  }, [navigation]);

  const handleTraktConnect = useCallback(() => {
    navigation.navigate("TraktAuth");
  }, [navigation]);

  const handleTraktDisconnect = useCallback(() => {
    Alert.alert(
      "Disconnect Trakt",
      "Are you sure you want to disconnect your Trakt account?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Disconnect", 
          style: "destructive",
          onPress: () => disconnectTrakt(),
        },
      ]
    );
  }, [disconnectTrakt]);

  const handleDebridServiceChange = useCallback(() => {
    const currentIndex = DEBRID_SERVICES.findIndex((s) => s.value === settings.debrid.service);
    const nextIndex = (currentIndex + 1) % DEBRID_SERVICES.length;
    const nextService = DEBRID_SERVICES[nextIndex];
    updateDebridSettings({ service: nextService.value as any });
  }, [settings.debrid.service, updateDebridSettings]);

  const handleSpeedChange = useCallback(() => {
    const currentSpeed = `${settings.playback.defaultSpeed}x`;
    const currentIndex = SPEED_OPTIONS.indexOf(currentSpeed);
    const nextIndex = (currentIndex + 1) % SPEED_OPTIONS.length;
    const nextSpeed = parseFloat(SPEED_OPTIONS[nextIndex]);
    updatePlaybackSettings({ defaultSpeed: nextSpeed });
  }, [settings.playback.defaultSpeed, updatePlaybackSettings]);

  const traktStatus = settings.trakt.username 
    ? `Connected as ${settings.trakt.username}`
    : "Not connected";

  const debridLabel = DEBRID_SERVICES.find((s) => s.value === settings.debrid.service)?.label || "None";

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: headerHeight + Spacing.xl,
            paddingBottom: insets.bottom + Spacing.xl,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <SettingsSectionHeader title="Skip Detection" />
        <View style={styles.section}>
          <SettingsRow
            type="toggle"
            label="Chapter-Based Skip"
            subtitle="Use video chapter markers to detect intros"
            icon="bookmark"
            value={settings.skip.enabledChapterSkip}
            onValueChange={(value) => updateSkipSettings({ enabledChapterSkip: value })}
          />
          <View style={styles.separator} />
          <SettingsRow
            type="toggle"
            label="Audio Fingerprint Skip"
            subtitle="Detect intros by analyzing audio patterns"
            icon="music"
            value={settings.skip.enabledAudioSkip}
            onValueChange={(value) => updateSkipSettings({ enabledAudioSkip: value })}
          />
          <View style={styles.separator} />
          <SettingsRow
            type="toggle"
            label="Community Skip Markers"
            subtitle="Use IntroHater community-driven skip data"
            icon="users"
            value={settings.skip.enabledCommunitySkip}
            onValueChange={(value) => updateSkipSettings({ enabledCommunitySkip: value })}
          />
          <View style={styles.separator} />
          <SettingsRow
            type="toggle"
            label="Manual Skip Markers"
            subtitle="Use custom skip times as final fallback"
            icon="edit-3"
            value={settings.skip.enabledManualSkip}
            onValueChange={(value) => updateSkipSettings({ enabledManualSkip: value })}
          />
          <View style={styles.separator} />
          <SettingsRow
            type="toggle"
            label="Auto-Skip"
            subtitle="Automatically skip without pressing button"
            icon="fast-forward"
            value={settings.skip.autoSkipEnabled}
            onValueChange={(value) => updateSkipSettings({ autoSkipEnabled: value })}
          />
          <View style={styles.separator} />
          <SettingsRow
            type="navigation"
            label="Configure Fallback Skip Times"
            subtitle="Set global intro/credits skip times"
            icon="clock"
            onPress={handleManualSkipsPress}
          />
        </View>

        <SettingsSectionHeader title="Playback" />
        <View style={styles.section}>
          <SettingsRow
            type="navigation"
            label="Default Speed"
            icon="activity"
            value={`${settings.playback.defaultSpeed}x`}
            onPress={handleSpeedChange}
          />
          <View style={styles.separator} />
          <SettingsRow
            type="toggle"
            label="Remember Position"
            subtitle="Resume playback from where you left off"
            icon="save"
            value={settings.playback.rememberPosition}
            onValueChange={(value) => updatePlaybackSettings({ rememberPosition: value })}
          />
          <View style={styles.separator} />
          <SettingsRow
            type="toggle"
            label="Auto-Play Next Episode"
            subtitle="Automatically start the next episode"
            icon="skip-forward"
            value={settings.playback.autoPlayNext}
            onValueChange={(value) => updatePlaybackSettings({ autoPlayNext: value })}
          />
        </View>

        <SettingsSectionHeader title="Trakt Integration" />
        <View style={styles.section}>
          <SettingsRow
            type="info"
            label="Status"
            icon="user"
            value={traktStatus}
            valueColor={settings.trakt.username ? Colors.dark.success : Colors.dark.disabled}
          />
          <View style={styles.separator} />
          {settings.trakt.username ? (
            <SettingsRow
              type="button"
              label="Account"
              icon="log-out"
              buttonLabel="Disconnect"
              buttonVariant="danger"
              onPress={handleTraktDisconnect}
            />
          ) : (
            <SettingsRow
              type="button"
              label="Connect to Trakt"
              subtitle="Enable scrobbling and sync"
              icon="link"
              buttonLabel="Connect"
              onPress={handleTraktConnect}
            />
          )}
        </View>

        <SettingsSectionHeader title="Debrid Services" />
        <View style={styles.section}>
          <SettingsRow
            type="navigation"
            label="Service"
            icon="cloud"
            value={debridLabel}
            onPress={handleDebridServiceChange}
          />
          {settings.debrid.service !== "none" ? (
            <>
              <View style={styles.separator} />
              <SettingsRow
                type="info"
                label="Status"
                icon="check-circle"
                value={settings.debrid.isConnected ? "Connected" : "Not configured"}
                valueColor={settings.debrid.isConnected ? Colors.dark.success : Colors.dark.warning}
              />
            </>
          ) : null}
        </View>

        <SettingsSectionHeader title="About" />
        <View style={styles.section}>
          <SettingsRow
            type="info"
            label="Version"
            icon="info"
            value="1.0.0"
          />
          <View style={styles.separator} />
          <SettingsRow
            type="info"
            label="Build"
            icon="package"
            value={Platform.OS === "web" ? "Web" : `${Platform.OS} ${Platform.Version}`}
          />
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.backgroundRoot,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: Spacing["2xl"],
  },
  section: {
    backgroundColor: Colors.dark.backgroundDefault,
    borderRadius: Spacing.md,
    marginHorizontal: Spacing.lg,
    overflow: "hidden",
  },
  separator: {
    height: 1,
    backgroundColor: Colors.dark.backgroundSecondary,
    marginLeft: Spacing["3xl"] + Spacing.lg,
  },
});
