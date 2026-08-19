/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import "@/global.css";

import { Platform } from "react-native";

export const Colors = {
  light: {
    // 基础文本和背景
    text: "#000000",
    background: "#ffffff",
    backgroundElement: "#F0F0F3",
    backgroundSelected: "#E0E1E6",
    textSecondary: "#60646C",

    // 扩展中性色
    textTertiary: "#8E929A",
    textQuaternary: "#B0B4BA",
    backgroundHover: "#E8E9ED",
    backgroundPressed: "#D5D6DD",
    border: "#E0E1E6",
    borderStrong: "#C8C9D0",
    borderFocus: "#208AEF",

    // 品牌色
    brand: "#208AEF",
    brandLight: "#4DA3F2",
    brandLighter: "#7ABCF5",
    brandDark: "#1A7BD4",
    brandDarker: "#146CB8",
    brandBackground: "rgba(32, 138, 239, 0.1)",
    brandBackgroundStrong: "rgba(32, 138, 239, 0.2)",

    // 成功色
    success: "#22C55E",
    successLight: "#4ADE80",
    successDark: "#16A34A",
    successBackground: "rgba(34, 197, 94, 0.1)",

    // 警告色
    warning: "#F59E0B",
    warningLight: "#FBBF24",
    warningDark: "#D97706",
    warningBackground: "rgba(245, 158, 11, 0.1)",

    // 错误色
    error: "#E5484D",
    errorLight: "#F05B5F",
    errorDark: "#C73A3F",
    errorBackground: "rgba(229, 72, 77, 0.1)",

    // 信息色
    info: "#3B82F6",
    infoLight: "#60A5FA",
    infoDark: "#2563EB",
    infoBackground: "rgba(59, 130, 246, 0.1)",

    // 阴影
    shadow: "rgba(0, 0, 0, 0.08)",
    shadowStrong: "rgba(0, 0, 0, 0.15)",
    shadowHeavy: "rgba(0, 0, 0, 0.25)",

    // 特殊用途
    overlay: "rgba(0, 0, 0, 0.4)",
    skeleton: "#E8E9ED",
    skeletonShine: "#F5F5F7",
    white: "#FFFFFF",
    black: "#000000",
  },

  dark: {
    // 基础文本和背景
    text: "#FFFFFF",
    background: "#000000",
    backgroundElement: "#212225",
    backgroundSelected: "#2E3135",
    textSecondary: "#B0B4BA",

    // 扩展中性色
    textTertiary: "#7C8088",
    textQuaternary: "#5A5E66",
    backgroundHover: "#2A2D31",
    backgroundPressed: "#383C42",
    border: "#2E3135",
    borderStrong: "#40444B",
    borderFocus: "#208AEF",

    // 品牌色
    brand: "#208AEF",
    brandLight: "#4DA3F2",
    brandLighter: "#7ABCF5",
    brandDark: "#1A7BD4",
    brandDarker: "#146CB8",
    brandBackground: "rgba(32, 138, 239, 0.15)",
    brandBackgroundStrong: "rgba(32, 138, 239, 0.3)",

    // 成功色
    success: "#22C55E",
    successLight: "#4ADE80",
    successDark: "#16A34A",
    successBackground: "rgba(34, 197, 94, 0.15)",

    // 警告色
    warning: "#F59E0B",
    warningLight: "#FBBF24",
    warningDark: "#D97706",
    warningBackground: "rgba(245, 158, 11, 0.15)",

    // 错误色
    error: "#E5484D",
    errorLight: "#F05B5F",
    errorDark: "#C73A3F",
    errorBackground: "rgba(229, 72, 77, 0.15)",

    // 信息色
    info: "#3B82F6",
    infoLight: "#60A5FA",
    infoDark: "#2563EB",
    infoBackground: "rgba(59, 130, 246, 0.15)",

    // 阴影
    shadow: "rgba(0, 0, 0, 0.3)",
    shadowStrong: "rgba(0, 0, 0, 0.5)",
    shadowHeavy: "rgba(0, 0, 0, 0.7)",

    // 特殊用途
    overlay: "rgba(0, 0, 0, 0.6)",
    skeleton: "#2A2D31",
    skeletonShine: "#383C42",
    white: "#FFFFFF",
    black: "#000000",
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: "system-ui",
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: "ui-serif",
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: "ui-rounded",
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: "ui-monospace",
  },
  default: {
    sans: "normal",
    serif: "serif",
    rounded: "normal",
    mono: "monospace",
  },
  web: {
    sans: "var(--font-display)",
    serif: "var(--font-serif)",
    rounded: "var(--font-rounded)",
    mono: "var(--font-mono)",
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
