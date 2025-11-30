import React, { useState, useEffect, useCallback, useRef } from "react";
import { StyleSheet, View, Alert, Pressable, Platform } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { Feather } from "@expo/vector-icons";
import * as WebBrowser from "expo-web-browser";
import * as Clipboard from "expo-clipboard";

import { ThemedView } from "@/components/ThemedView";
import { ThemedText } from "@/components/ThemedText";
import { Button } from "@/components/Button";
import { useSettings } from "@/hooks/useSettings";
import { traktService, DeviceCodeResponse } from "@/services/traktService";
import { RootStackParamList } from "@/types";
import { Colors, Spacing, BorderRadius, Typography } from "@/constants/theme";

type TraktAuthScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, "TraktAuth">;

export default function TraktAuthScreen() {
  const navigation = useNavigation<TraktAuthScreenNavigationProp>();
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const { updateTraktCredentials } = useSettings();

  const [deviceCode, setDeviceCode] = useState<DeviceCodeResponse | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const [pollCount, setPollCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  
  const pollingInterval = useRef<NodeJS.Timeout | null>(null);
  const maxPollAttempts = useRef(0);

  useEffect(() => {
    return () => {
      if (pollingInterval.current) {
        clearInterval(pollingInterval.current);
      }
    };
  }, []);

  const requestDeviceCode = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const codeResponse = await traktService.getDeviceCode();
      setDeviceCode(codeResponse);
      maxPollAttempts.current = Math.floor(codeResponse.expires_in / codeResponse.interval);
    } catch (err) {
      setError("Failed to get device code. Please check your internet connection.");
      console.error("Device code error:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    requestDeviceCode();
  }, [requestDeviceCode]);

  const startPolling = useCallback(async () => {
    if (!deviceCode) return;

    setIsPolling(true);
    setPollCount(0);
    setError(null);

    pollingInterval.current = setInterval(async () => {
      setPollCount((prev) => {
        const newCount = prev + 1;
        
        if (newCount >= maxPollAttempts.current) {
          if (pollingInterval.current) {
            clearInterval(pollingInterval.current);
          }
          setIsPolling(false);
          setError("Authentication timed out. Please try again.");
          return prev;
        }
        
        return newCount;
      });

      try {
        const tokenResponse = await traktService.pollForToken(deviceCode.device_code);
        
        if (tokenResponse) {
          if (pollingInterval.current) {
            clearInterval(pollingInterval.current);
          }
          setIsPolling(false);

          const credentials = await traktService.saveTokens(tokenResponse);
          updateTraktCredentials(credentials);

          Alert.alert(
            "Connected!",
            `Successfully connected to Trakt as ${credentials.username}`,
            [{ text: "OK", onPress: () => navigation.goBack() }]
          );
        }
      } catch (err: any) {
        if (pollingInterval.current) {
          clearInterval(pollingInterval.current);
        }
        setIsPolling(false);
        setError(err.message || "Authentication failed");
      }
    }, (deviceCode.interval || 5) * 1000);
  }, [deviceCode, navigation, updateTraktCredentials]);

  const handleOpenTrakt = useCallback(async () => {
    if (!deviceCode) return;

    try {
      if (Platform.OS === "web") {
        window.open(deviceCode.verification_url, "_blank");
      } else {
        await WebBrowser.openBrowserAsync(deviceCode.verification_url);
      }
      
      startPolling();
    } catch (err) {
      Alert.alert("Error", "Failed to open Trakt website. Please visit trakt.tv/activate manually.");
    }
  }, [deviceCode, startPolling]);

  const handleCopyCode = useCallback(async () => {
    if (!deviceCode) return;

    try {
      await Clipboard.setStringAsync(deviceCode.user_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      Alert.alert("Copy Failed", "Could not copy code to clipboard.");
    }
  }, [deviceCode]);

  const handleRetry = useCallback(() => {
    if (pollingInterval.current) {
      clearInterval(pollingInterval.current);
    }
    setIsPolling(false);
    setPollCount(0);
    setError(null);
    requestDeviceCode();
  }, [requestDeviceCode]);

  const remainingTime = deviceCode 
    ? Math.max(0, deviceCode.expires_in - (pollCount * (deviceCode.interval || 5)))
    : 0;
  const remainingMinutes = Math.floor(remainingTime / 60);
  const remainingSeconds = remainingTime % 60;

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.content, { paddingTop: headerHeight + Spacing.xl, paddingBottom: insets.bottom + Spacing.xl }]}>
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Feather name="tv" size={48} color={Colors.dark.accent} />
          </View>
          <ThemedText style={styles.title}>Connect to Trakt.tv</ThemedText>
          <ThemedText style={styles.subtitle}>
            Sync your watch history and get personalized recommendations
          </ThemedText>
        </View>

        {error ? (
          <View style={styles.errorContainer}>
            <Feather name="alert-circle" size={24} color={Colors.dark.error} />
            <ThemedText style={styles.errorText}>{error}</ThemedText>
            <Pressable
              onPress={handleRetry}
              style={({ pressed }) => [styles.retryButton, { opacity: pressed ? 0.6 : 1 }]}
            >
              <ThemedText style={styles.retryText}>Try Again</ThemedText>
            </Pressable>
          </View>
        ) : isLoading ? (
          <View style={styles.loadingContainer}>
            <Feather name="loader" size={32} color={Colors.dark.accent} />
            <ThemedText style={styles.loadingText}>Getting device code...</ThemedText>
          </View>
        ) : deviceCode ? (
          <>
            <View style={styles.codeContainer}>
              <ThemedText style={styles.codeLabel}>Your Code</ThemedText>
              <Pressable 
                onPress={handleCopyCode} 
                style={({ pressed }) => [styles.codeBox, { opacity: pressed ? 0.8 : 1 }]}
              >
                <ThemedText style={styles.codeText}>{deviceCode.user_code}</ThemedText>
                <Feather 
                  name={copied ? "check" : "copy"} 
                  size={20} 
                  color={copied ? Colors.dark.success : Colors.dark.disabled} 
                  style={styles.copyIcon} 
                />
              </Pressable>
              <ThemedText style={styles.codeHint}>
                {copied ? "Copied!" : "Tap to copy"}
              </ThemedText>
            </View>

            <View style={styles.instructionsContainer}>
              <ThemedText style={styles.instructionsTitle}>Instructions:</ThemedText>
              <View style={styles.instructionStep}>
                <View style={styles.stepNumber}>
                  <ThemedText style={styles.stepNumberText}>1</ThemedText>
                </View>
                <ThemedText style={styles.stepText}>
                  Visit <ThemedText style={styles.linkText}>{deviceCode.verification_url}</ThemedText>
                </ThemedText>
              </View>
              <View style={styles.instructionStep}>
                <View style={styles.stepNumber}>
                  <ThemedText style={styles.stepNumberText}>2</ThemedText>
                </View>
                <ThemedText style={styles.stepText}>Enter the code shown above</ThemedText>
              </View>
              <View style={styles.instructionStep}>
                <View style={styles.stepNumber}>
                  <ThemedText style={styles.stepNumberText}>3</ThemedText>
                </View>
                <ThemedText style={styles.stepText}>Approve the connection</ThemedText>
              </View>
            </View>

            {isPolling ? (
              <View style={styles.pollingContainer}>
                <Feather name="loader" size={24} color={Colors.dark.accent} />
                <ThemedText style={styles.pollingText}>
                  Waiting for authorization...
                </ThemedText>
                <ThemedText style={styles.pollingTimer}>
                  {remainingMinutes}:{String(remainingSeconds).padStart(2, "0")} remaining
                </ThemedText>
              </View>
            ) : (
              <Button
                onPress={handleOpenTrakt}
                style={styles.connectButton}
              >
                Open Trakt.tv
              </Button>
            )}
          </>
        ) : null}

        <Pressable
          onPress={() => navigation.goBack()}
          style={({ pressed }) => [styles.cancelButton, { opacity: pressed ? 0.6 : 1 }]}
        >
          <ThemedText style={styles.cancelText}>Cancel</ThemedText>
        </Pressable>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.backgroundRoot,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.xl,
    alignItems: "center",
  },
  header: {
    alignItems: "center",
    marginBottom: Spacing["3xl"],
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.dark.backgroundDefault,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.xl,
  },
  title: {
    ...Typography.h2,
    color: Colors.dark.text,
    marginBottom: Spacing.sm,
  },
  subtitle: {
    ...Typography.body,
    color: Colors.dark.disabled,
    textAlign: "center",
    maxWidth: 300,
  },
  loadingContainer: {
    alignItems: "center",
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  loadingText: {
    ...Typography.body,
    color: Colors.dark.text,
  },
  errorContainer: {
    alignItems: "center",
    gap: Spacing.md,
    marginBottom: Spacing.xl,
    padding: Spacing.xl,
    backgroundColor: Colors.dark.backgroundDefault,
    borderRadius: BorderRadius.md,
  },
  errorText: {
    ...Typography.body,
    color: Colors.dark.error,
    textAlign: "center",
  },
  retryButton: {
    marginTop: Spacing.md,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.dark.accent,
    borderRadius: BorderRadius.sm,
  },
  retryText: {
    ...Typography.body,
    fontWeight: "600",
    color: Colors.dark.text,
  },
  codeContainer: {
    alignItems: "center",
    marginBottom: Spacing["3xl"],
  },
  codeLabel: {
    ...Typography.small,
    color: Colors.dark.disabled,
    marginBottom: Spacing.sm,
  },
  codeBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.dark.backgroundDefault,
    paddingHorizontal: Spacing["2xl"],
    paddingVertical: Spacing.xl,
    borderRadius: BorderRadius.md,
    borderWidth: 2,
    borderColor: Colors.dark.accent,
  },
  codeText: {
    ...Typography.traktPin,
    color: Colors.dark.text,
  },
  copyIcon: {
    marginLeft: Spacing.lg,
  },
  codeHint: {
    ...Typography.helper,
    color: Colors.dark.disabled,
    marginTop: Spacing.xs,
  },
  instructionsContainer: {
    width: "100%",
    maxWidth: 400,
    backgroundColor: Colors.dark.backgroundDefault,
    padding: Spacing.xl,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing["3xl"],
  },
  instructionsTitle: {
    ...Typography.h4,
    color: Colors.dark.text,
    marginBottom: Spacing.lg,
  },
  instructionStep: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.dark.accent,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  stepNumberText: {
    ...Typography.body,
    fontWeight: "700",
    color: Colors.dark.text,
  },
  stepText: {
    ...Typography.body,
    color: Colors.dark.text,
    flex: 1,
  },
  linkText: {
    color: Colors.dark.accent,
    fontWeight: "600",
  },
  pollingContainer: {
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  pollingText: {
    ...Typography.body,
    color: Colors.dark.text,
  },
  pollingTimer: {
    ...Typography.small,
    color: Colors.dark.disabled,
  },
  connectButton: {
    width: "100%",
    maxWidth: 300,
    marginBottom: Spacing.lg,
  },
  cancelButton: {
    padding: Spacing.md,
  },
  cancelText: {
    ...Typography.body,
    color: Colors.dark.disabled,
  },
});
