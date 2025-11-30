import { Platform } from "react-native";

const accentColor = "#E50914";
const tvFocusColor = "#FFD700";

export const Colors = {
  light: {
    text: "#FFFFFF",
    buttonText: "#000000",
    tabIconDefault: "#888888",
    tabIconSelected: accentColor,
    link: accentColor,
    backgroundRoot: "#000000",
    backgroundDefault: "#1C1C1C",
    backgroundSecondary: "#2A2A2A",
    backgroundTertiary: "#3A3A3A",
    accent: accentColor,
    disabled: "#888888",
    tvFocus: tvFocusColor,
    overlay: "rgba(0, 0, 0, 0.8)",
    skipButton: "#FFFFFF",
    skipButtonText: "#000000",
    success: "#4CAF50",
    error: "#FF5252",
    warning: "#FFC107",
  },
  dark: {
    text: "#FFFFFF",
    buttonText: "#000000",
    tabIconDefault: "#888888",
    tabIconSelected: accentColor,
    link: accentColor,
    backgroundRoot: "#000000",
    backgroundDefault: "#1C1C1C",
    backgroundSecondary: "#2A2A2A",
    backgroundTertiary: "#3A3A3A",
    accent: accentColor,
    disabled: "#888888",
    tvFocus: tvFocusColor,
    overlay: "rgba(0, 0, 0, 0.8)",
    skipButton: "#FFFFFF",
    skipButtonText: "#000000",
    success: "#4CAF50",
    error: "#FF5252",
    warning: "#FFC107",
  },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  "2xl": 24,
  "3xl": 32,
  "4xl": 40,
  "5xl": 48,
  inputHeight: 56,
  buttonHeight: 52,
  settingsRowHeight: 48,
  tvMinTouchTarget: 64,
};

export const BorderRadius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  "2xl": 32,
  "3xl": 40,
  full: 9999,
};

export const Typography = {
  h1: {
    fontSize: 32,
    fontWeight: "700" as const,
  },
  h2: {
    fontSize: 28,
    fontWeight: "700" as const,
  },
  h3: {
    fontSize: 24,
    fontWeight: "600" as const,
  },
  h4: {
    fontSize: 20,
    fontWeight: "600" as const,
  },
  body: {
    fontSize: 16,
    fontWeight: "400" as const,
  },
  small: {
    fontSize: 14,
    fontWeight: "400" as const,
  },
  link: {
    fontSize: 16,
    fontWeight: "400" as const,
  },
  timeDisplay: {
    fontSize: 16,
    fontWeight: "500" as const,
  },
  skipButton: {
    fontSize: 18,
    fontWeight: "700" as const,
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: "500" as const,
    textTransform: "uppercase" as const,
    letterSpacing: 1,
  },
  helper: {
    fontSize: 12,
    fontWeight: "400" as const,
  },
  tiny: {
    fontSize: 10,
    fontWeight: "400" as const,
  },
  traktPin: {
    fontSize: 48,
    fontWeight: "700" as const,
    letterSpacing: 8,
  },
};

export const Fonts = Platform.select({
  ios: {
    sans: "system-ui",
    serif: "ui-serif",
    rounded: "ui-rounded",
    mono: "ui-monospace",
  },
  default: {
    sans: "normal",
    serif: "serif",
    rounded: "normal",
    mono: "monospace",
  },
  web: {
    sans: "Roboto, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});

export const Animations = {
  spring: {
    damping: 15,
    mass: 0.3,
    stiffness: 150,
    overshootClamping: true,
  },
  skipButton: {
    duration: 300,
    easing: "ease-out" as const,
  },
};
