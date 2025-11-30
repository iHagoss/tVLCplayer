import React, { useEffect } from "react";
import { StyleSheet, Pressable, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  runOnJS,
  Easing,
} from "react-native-reanimated";
import { Feather } from "@expo/vector-icons";

import { ThemedText } from "@/components/ThemedText";
import { BorderRadius, Spacing, Colors, Typography } from "@/constants/theme";
import { SkipType } from "@/types";

interface SkipButtonProps {
  type: SkipType;
  duration: number;
  onSkip: () => void;
  onDismiss?: () => void;
  visible: boolean;
  autoSkipCountdown?: number;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function formatDuration(seconds: number): string {
  if (seconds < 60) {
    return `${seconds}s`;
  }
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return secs > 0 ? `${mins}:${String(secs).padStart(2, "0")}` : `${mins}m`;
}

function getSkipLabel(type: SkipType): string {
  switch (type) {
    case "intro":
      return "Skip Intro";
    case "credits":
      return "Skip Credits";
    case "recap":
      return "Skip Recap";
    case "preview":
      return "Skip Preview";
    default:
      return "Skip";
  }
}

export function SkipButton({
  type,
  duration,
  onSkip,
  onDismiss,
  visible,
  autoSkipCountdown,
}: SkipButtonProps) {
  const translateY = useSharedValue(100);
  const scale = useSharedValue(0.8);
  const opacity = useSharedValue(0);
  const pressScale = useSharedValue(1);

  useEffect(() => {
    if (visible) {
      translateY.value = withSpring(0, {
        damping: 15,
        stiffness: 150,
        mass: 0.5,
      });
      scale.value = withSpring(1, {
        damping: 12,
        stiffness: 180,
      });
      opacity.value = withTiming(1, { duration: 200 });
    } else {
      translateY.value = withSpring(100, {
        damping: 20,
        stiffness: 200,
      });
      scale.value = withTiming(0.8, { duration: 200 });
      opacity.value = withTiming(0, { duration: 150 });
    }
  }, [visible, translateY, scale, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { scale: scale.value * pressScale.value },
    ],
    opacity: opacity.value,
  }));

  const handlePressIn = () => {
    pressScale.value = withSpring(0.95, {
      damping: 15,
      stiffness: 300,
    });
  };

  const handlePressOut = () => {
    pressScale.value = withSpring(1, {
      damping: 15,
      stiffness: 300,
    });
  };

  const label = getSkipLabel(type);
  const durationText = formatDuration(duration);
  const showCountdown = autoSkipCountdown !== undefined && autoSkipCountdown > 0;

  if (!visible) return null;

  return (
    <AnimatedPressable
      onPress={onSkip}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[styles.container, animatedStyle]}
    >
      <View style={styles.content}>
        <Feather name="skip-forward" size={20} color={Colors.dark.skipButtonText} />
        <ThemedText style={styles.label}>
          {label} ({durationText})
        </ThemedText>
        {showCountdown ? (
          <ThemedText style={styles.countdown}>
            Auto-skip in {autoSkipCountdown}
          </ThemedText>
        ) : null}
      </View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 80,
    alignSelf: "center",
    backgroundColor: Colors.dark.skipButton,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  label: {
    ...Typography.skipButton,
    color: Colors.dark.skipButtonText,
  },
  countdown: {
    ...Typography.small,
    color: Colors.dark.disabled,
    marginLeft: Spacing.sm,
  },
});
