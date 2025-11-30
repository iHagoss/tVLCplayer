import React, { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { BorderRadius, Spacing, Colors, Typography } from "@/constants/theme";

interface TimeDisplayProps {
  currentPosition: number;
  duration: number;
  playbackSpeed: number;
  visible: boolean;
}

function formatTime(date: Date): string {
  let hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12;
  hours = hours ? hours : 12;
  const minutesStr = String(minutes).padStart(2, "0");
  return `${hours}:${minutesStr} ${ampm}`;
}

export function TimeDisplay({
  currentPosition,
  duration,
  playbackSpeed,
  visible,
}: TimeDisplayProps) {
  const [currentTime, setCurrentTime] = useState(new Date());
  const opacity = useSharedValue(visible ? 1 : 0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    opacity.value = withTiming(visible ? 1 : 0, { duration: 200 });
  }, [visible, opacity]);

  const remainingSeconds = Math.max(0, duration - currentPosition);
  const adjustedRemaining = remainingSeconds / playbackSpeed;
  const endTime = new Date(currentTime.getTime() + adjustedRemaining * 1000);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      <ThemedText style={styles.timeText}>
        {formatTime(currentTime)}
      </ThemedText>
      <View style={styles.separator} />
      <ThemedText style={styles.endTimeText}>
        Ends at {formatTime(endTime)}
      </ThemedText>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 24,
    right: 24,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    borderRadius: BorderRadius.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  timeText: {
    ...Typography.timeDisplay,
    color: Colors.dark.text,
  },
  separator: {
    width: 1,
    height: 14,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    marginHorizontal: Spacing.sm,
  },
  endTimeText: {
    ...Typography.timeDisplay,
    color: "rgba(255, 255, 255, 0.7)",
  },
});
