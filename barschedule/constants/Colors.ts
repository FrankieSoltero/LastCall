/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 */

const tintColorLight = '#8BDC5D'; // Lime green tint for light mode
const tintColorDark = '#8BDC5D';  // Lime green tint for dark mode
const buttonBackgroundLight = '#8BDC5D'; // Green for button in light mode
const buttonBackgroundDark = '#8BDC5D';  // Green for button in dark mode

export const Colors = {
  light: {
    text: '#082C44', // Dark blue text
    background: '#fff', // White background
    tint: tintColorLight, // Lime green tint
    icon: '#687076', // Muted gray-green icons
    tabIconDefault: '#687076', // Default tab icons in muted gray-green
    tabIconSelected: tintColorLight, // Selected tab icon in lime green
    buttonBackground: buttonBackgroundLight, // Green button background
    buttonText: '#fff', // White text for buttons
  },
  dark: {
    text: '#E0E9F2', // White text
    background: '#051A2E', // Dark blue background
    tint: tintColorDark, // Lime green tint
    icon: '#9BA1A6', // Lighter gray-blue icons
    tabIconDefault: '#9BA1A6', // Default tab icons in light gray-blue
    tabIconSelected: tintColorDark, // Selected tab icon in lime green
    buttonBackground: buttonBackgroundDark, // Green button background
    buttonText: '#fff', // White text for buttons
  },
};
