// hooks/useThemeColors.ts
import { useColorScheme } from "react-native";
import { Colors } from "@/constants/Colors";

// Strongly typed based on light theme structure
export type ThemeColors = typeof Colors.light;

// Custom hook that returns either the light or dark theme colors
export const useThemeColors = (): ThemeColors => {
  const scheme = useColorScheme() || "light";
  return Colors[scheme];
};
