import React, { ReactNode } from "react";
import { StyleSheet, View, Pressable, Switch, Platform } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { Feather } from "@expo/vector-icons";

import { ThemedText } from "@/components/ThemedText";
import { Spacing, Colors, Typography } from "@/constants/theme";

interface BaseRowProps {
  label: string;
  subtitle?: string;
  icon?: keyof typeof Feather.glyphMap;
}

interface ToggleRowProps extends BaseRowProps {
  type: "toggle";
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
}

interface NavigationRowProps extends BaseRowProps {
  type: "navigation";
  value?: string;
  onPress: () => void;
  disabled?: boolean;
}

interface ButtonRowProps extends BaseRowProps {
  type: "button";
  buttonLabel: string;
  onPress: () => void;
  buttonVariant?: "default" | "danger" | "success";
  disabled?: boolean;
}

interface InfoRowProps extends BaseRowProps {
  type: "info";
  value: string;
  valueColor?: string;
}

export type SettingsRowProps = ToggleRowProps | NavigationRowProps | ButtonRowProps | InfoRowProps;

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function SettingsRow(props: SettingsRowProps) {
  const { label, subtitle, icon, type } = props;
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    if (type !== "info") {
      scale.value = withSpring(0.98, { damping: 15, stiffness: 200 });
    }
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 200 });
  };

  const renderRight = () => {
    switch (type) {
      case "toggle":
        return (
          <Switch
            value={props.value}
            onValueChange={props.onValueChange}
            trackColor={{
              false: Colors.dark.backgroundSecondary,
              true: Colors.dark.accent,
            }}
            thumbColor={Colors.dark.text}
            disabled={props.disabled}
          />
        );
      case "navigation":
        return (
          <View style={styles.navigationRight}>
            {props.value ? (
              <ThemedText style={styles.valueText}>{props.value}</ThemedText>
            ) : null}
            <Feather name="chevron-right" size={20} color={Colors.dark.disabled} />
          </View>
        );
      case "button":
        const buttonColors = {
          default: Colors.dark.accent,
          danger: Colors.dark.error,
          success: Colors.dark.success,
        };
        const buttonColor = buttonColors[props.buttonVariant || "default"];
        return (
          <Pressable
            onPress={props.onPress}
            disabled={props.disabled}
            style={({ pressed }) => [
              styles.button,
              { backgroundColor: buttonColor, opacity: pressed ? 0.8 : props.disabled ? 0.5 : 1 },
            ]}
          >
            <ThemedText style={styles.buttonLabel}>{props.buttonLabel}</ThemedText>
          </Pressable>
        );
      case "info":
        return (
          <ThemedText
            style={[styles.valueText, props.valueColor ? { color: props.valueColor } : null]}
          >
            {props.value}
          </ThemedText>
        );
      default:
        return null;
    }
  };

  const isDisabled = type !== "info" && "disabled" in props && props.disabled;
  const onPress = type === "navigation" ? props.onPress : type === "toggle" ? () => props.onValueChange(!props.value) : undefined;

  const content = (
    <>
      <View style={styles.left}>
        {icon ? (
          <Feather
            name={icon}
            size={20}
            color={isDisabled ? Colors.dark.disabled : Colors.dark.text}
            style={styles.icon}
          />
        ) : null}
        <View style={styles.labelContainer}>
          <ThemedText
            style={[styles.label, isDisabled ? { color: Colors.dark.disabled } : null]}
          >
            {label}
          </ThemedText>
          {subtitle ? (
            <ThemedText style={styles.subtitle}>{subtitle}</ThemedText>
          ) : null}
        </View>
      </View>
      {renderRight()}
    </>
  );

  if (type === "info" || type === "button") {
    return <View style={styles.container}>{content}</View>;
  }

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={isDisabled}
      style={[styles.container, animatedStyle]}
    >
      {content}
    </AnimatedPressable>
  );
}

export function SettingsSectionHeader({ title }: { title: string }) {
  return (
    <View style={styles.sectionHeader}>
      <ThemedText style={styles.sectionTitle}>{title}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: Spacing.settingsRowHeight,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    backgroundColor: Colors.dark.backgroundDefault,
  },
  left: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  icon: {
    marginRight: Spacing.md,
  },
  labelContainer: {
    flex: 1,
  },
  label: {
    ...Typography.body,
    color: Colors.dark.text,
  },
  subtitle: {
    ...Typography.small,
    color: Colors.dark.disabled,
    marginTop: 2,
  },
  valueText: {
    ...Typography.small,
    color: Colors.dark.disabled,
  },
  navigationRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  button: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Spacing.xs,
  },
  buttonLabel: {
    ...Typography.small,
    fontWeight: "600",
    color: Colors.dark.text,
  },
  sectionHeader: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing["2xl"],
    paddingBottom: Spacing.sm,
  },
  sectionTitle: {
    ...Typography.sectionHeader,
    color: Colors.dark.accent,
  },
});
