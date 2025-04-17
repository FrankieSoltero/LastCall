import { useColorScheme } from "react-native";
import { useState, useEffect } from "react";
import { Colors } from "@/constants/Colors";

// Strongly typed based on light theme structure
export type ThemeColors = typeof Colors.light;

export const useThemeColors = (): ThemeColors => {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const systemTheme = useColorScheme(); // Gets the system-wide theme either light or dark)

  // Automatically switch to system theme if no manual theme is set
  useEffect(() => {
    if (!theme) {
      setTheme(systemTheme || 'light');
    }
  }, [systemTheme]);

  // Return the appropriate theme colors based on the selected theme
  return Colors[theme];
};

// Function to toggle the theme manually 
export const toggleTheme = (currentTheme: string): string => {
  return currentTheme === 'light' ? 'dark' : 'light';
};
