import React, { useState, useCallback } from "react";
import { StyleSheet, View, TextInput, Alert, Pressable, KeyboardAvoidingView, Platform } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { Feather } from "@expo/vector-icons";

import { ThemedView } from "@/components/ThemedView";
import { ThemedText } from "@/components/ThemedText";
import { Button } from "@/components/Button";
import { useSettings } from "@/hooks/useSettings";
import { RootStackParamList } from "@/types";
import { Colors, Spacing, BorderRadius, Typography } from "@/constants/theme";

type SkipConfigScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, "SkipConfiguration">;

function formatSecondsToTime(seconds: number): string {
  if (seconds <= 0) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${String(secs).padStart(2, "0")}`;
}

export default function SkipConfigurationScreen() {
  const navigation = useNavigation<SkipConfigScreenNavigationProp>();
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const { settings, updateSkipSettings } = useSettings();

  const [introSeconds, setIntroSeconds] = useState(
    settings.skip.globalIntroSkipSeconds > 0 ? String(settings.skip.globalIntroSkipSeconds) : ""
  );
  const [creditsSeconds, setCreditsSeconds] = useState(
    settings.skip.globalCreditsSkipSeconds > 0 ? String(settings.skip.globalCreditsSkipSeconds) : ""
  );
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = useCallback(async () => {
    const introValue = parseInt(introSeconds, 10) || 0;
    const creditsValue = parseInt(creditsSeconds, 10) || 0;

    if (introValue < 0 || creditsValue < 0) {
      Alert.alert("Invalid Input", "Skip times must be positive numbers.");
      return;
    }

    setIsSaving(true);
    
    await updateSkipSettings({
      globalIntroSkipSeconds: introValue,
      globalCreditsSkipSeconds: creditsValue,
    });
    
    setIsSaving(false);
    
    Alert.alert("Saved", "Global skip times have been saved.", [
      { text: "OK", onPress: () => navigation.goBack() },
    ]);
  }, [introSeconds, creditsSeconds, updateSkipSettings, navigation]);

  const handleClear = useCallback(() => {
    Alert.alert(
      "Clear Skip Times",
      "Are you sure you want to clear all global skip times?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear",
          style: "destructive",
          onPress: async () => {
            await updateSkipSettings({
              globalIntroSkipSeconds: 0,
              globalCreditsSkipSeconds: 0,
            });
            setIntroSeconds("");
            setCreditsSeconds("");
          },
        },
      ]
    );
  }, [updateSkipSettings]);

  const introTime = parseInt(introSeconds, 10) || 0;
  const creditsTime = parseInt(creditsSeconds, 10) || 0;
  const hasValues = introTime > 0 || creditsTime > 0;

  return (
    <ThemedView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={headerHeight}
      >
        <View style={[styles.content, { paddingTop: headerHeight + Spacing.xl, paddingBottom: insets.bottom + Spacing.xl }]}>
          <View style={styles.headerInfo}>
            <View style={styles.iconContainer}>
              <Feather name="shield" size={32} color={Colors.dark.accent} />
            </View>
            <ThemedText style={styles.title}>Fallback Skip Times</ThemedText>
            <ThemedText style={styles.subtitle}>
              These times are used when chapter markers and audio fingerprinting are unavailable or disabled. They apply to ALL videos as a last resort.
            </ThemedText>
          </View>

          <View style={styles.priorityInfo}>
            <ThemedText style={styles.priorityTitle}>Skip Detection Priority:</ThemedText>
            <View style={styles.priorityItem}>
              <View style={[styles.priorityBadge, styles.tier1]}>
                <ThemedText style={styles.priorityBadgeText}>1</ThemedText>
              </View>
              <ThemedText style={styles.priorityText}>Chapter Markers (most accurate)</ThemedText>
            </View>
            <View style={styles.priorityItem}>
              <View style={[styles.priorityBadge, styles.tier2]}>
                <ThemedText style={styles.priorityBadgeText}>2</ThemedText>
              </View>
              <ThemedText style={styles.priorityText}>Audio Fingerprinting</ThemedText>
            </View>
            <View style={styles.priorityItem}>
              <View style={[styles.priorityBadge, styles.tier3]}>
                <ThemedText style={styles.priorityBadgeText}>3</ThemedText>
              </View>
              <ThemedText style={styles.priorityText}>Community Skip Markers (IntroHater + Stremio)</ThemedText>
            </View>
            <View style={styles.priorityItem}>
              <View style={[styles.priorityBadge, styles.tier4]}>
                <ThemedText style={styles.priorityBadgeText}>4</ThemedText>
              </View>
              <ThemedText style={styles.priorityText}>Manual Fallback (these settings)</ThemedText>
            </View>
          </View>

          <View style={styles.inputSection}>
            <View style={styles.inputGroup}>
              <View style={styles.labelRow}>
                <Feather name="skip-forward" size={18} color={Colors.dark.text} />
                <ThemedText style={styles.inputLabel}>
                  Intro Skip Duration
                </ThemedText>
              </View>
              <ThemedText style={styles.inputHint}>
                Seconds to skip from the start of every video
              </ThemedText>
              <TextInput
                style={styles.input}
                value={introSeconds}
                onChangeText={setIntroSeconds}
                placeholder="e.g. 90 for 1:30"
                placeholderTextColor={Colors.dark.disabled}
                keyboardType="number-pad"
                returnKeyType="next"
              />
              {introTime > 0 ? (
                <ThemedText style={styles.helperText}>
                  Will skip first {formatSecondsToTime(introTime)} of all videos
                </ThemedText>
              ) : null}
            </View>

            <View style={styles.inputGroup}>
              <View style={styles.labelRow}>
                <Feather name="skip-back" size={18} color={Colors.dark.text} />
                <ThemedText style={styles.inputLabel}>
                  Credits Skip Duration
                </ThemedText>
              </View>
              <ThemedText style={styles.inputHint}>
                Seconds before the end to trigger credits skip
              </ThemedText>
              <TextInput
                style={styles.input}
                value={creditsSeconds}
                onChangeText={setCreditsSeconds}
                placeholder="e.g. 180 for 3:00"
                placeholderTextColor={Colors.dark.disabled}
                keyboardType="number-pad"
                returnKeyType="done"
              />
              {creditsTime > 0 ? (
                <ThemedText style={styles.helperText}>
                  Will show skip button {formatSecondsToTime(creditsTime)} before end
                </ThemedText>
              ) : null}
            </View>
          </View>

          <View style={styles.buttonContainer}>
            <Button
              onPress={handleSave}
              disabled={isSaving}
              style={styles.saveButton}
            >
              {isSaving ? "Saving..." : "Save Fallback Times"}
            </Button>
            
            {hasValues ? (
              <Pressable
                onPress={handleClear}
                style={({ pressed }) => [
                  styles.clearButton,
                  { opacity: pressed ? 0.6 : 1 },
                ]}
              >
                <Feather name="trash-2" size={18} color={Colors.dark.error} />
                <ThemedText style={styles.clearButtonText}>Clear</ThemedText>
              </Pressable>
            ) : null}
          </View>
        </View>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.backgroundRoot,
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.xl,
  },
  headerInfo: {
    alignItems: "center",
    marginBottom: Spacing["2xl"],
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.dark.backgroundDefault,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.md,
  },
  title: {
    ...Typography.h3,
    color: Colors.dark.text,
    marginBottom: Spacing.sm,
  },
  subtitle: {
    ...Typography.body,
    color: Colors.dark.disabled,
    textAlign: "center",
    lineHeight: 22,
  },
  priorityInfo: {
    backgroundColor: Colors.dark.backgroundDefault,
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing["2xl"],
  },
  priorityTitle: {
    ...Typography.h4,
    color: Colors.dark.text,
    marginBottom: Spacing.md,
  },
  priorityItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  priorityBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  tier1: {
    backgroundColor: Colors.dark.success,
  },
  tier2: {
    backgroundColor: Colors.dark.warning,
  },
  tier3: {
    backgroundColor: Colors.dark.warning,
  },
  tier4: {
    backgroundColor: Colors.dark.accent,
  },
  priorityBadgeText: {
    ...Typography.small,
    fontWeight: "700",
    color: Colors.dark.text,
  },
  priorityText: {
    ...Typography.body,
    color: Colors.dark.text,
  },
  inputSection: {
    gap: Spacing["2xl"],
  },
  inputGroup: {
    gap: Spacing.xs,
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  inputLabel: {
    ...Typography.body,
    fontWeight: "600",
    color: Colors.dark.text,
  },
  inputHint: {
    ...Typography.small,
    color: Colors.dark.disabled,
    marginBottom: Spacing.xs,
  },
  input: {
    height: Spacing.inputHeight,
    backgroundColor: Colors.dark.backgroundDefault,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.lg,
    ...Typography.body,
    color: Colors.dark.text,
    borderWidth: 1,
    borderColor: Colors.dark.backgroundSecondary,
  },
  helperText: {
    ...Typography.helper,
    color: Colors.dark.success,
    marginTop: Spacing.xs,
  },
  buttonContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.lg,
    marginTop: Spacing["3xl"],
  },
  saveButton: {
    flex: 1,
  },
  clearButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    padding: Spacing.md,
  },
  clearButtonText: {
    ...Typography.body,
    color: Colors.dark.error,
  },
});
