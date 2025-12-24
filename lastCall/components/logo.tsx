import React from 'react';
import Svg, { Path, Circle } from 'react-native-svg';
import { View, Text, StyleSheet } from 'react-native';

interface LogoProps {
  size?: number;
  showText?: boolean;
}

export default function Logo({ size = 48, showText = true }: LogoProps) {
  // Linear Palette
  const strokeColor = "#ffffff";
  const accentColor = "#818cf8"; // Indigo Accent
  
  return (
    <View style={styles.container}>
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        {/* Martini Glass Shape */}
        <Path 
          d="M8 22h8M12 22v-9M12 13l-9-9h18l-9 9" 
          stroke={strokeColor} 
          strokeWidth="0.9" 
          strokeLinecap="round" 
          strokeLinejoin="round" 
        />
        
        {/* Clock Face (Liquid Area) */}
        {/* We simulate the clock inside the triangle of the glass */}
        <Circle cx="12" cy="7.5" r="2.5" stroke={accentColor} strokeWidth="0.5" />
        <Path d="M12 7.5V6" stroke={accentColor} strokeWidth=".5" strokeLinecap="round" />
        <Path d="M12 7.5l1.5 1.5" stroke={accentColor} strokeWidth=".5" strokeLinecap="round" />
      </Svg>

      {showText && (
        <Text style={[styles.text, { fontSize: size * 0.5 }]}>
          LastCall<Text style={{ color: accentColor }}>.</Text>
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  text: {
    fontFamily: 'System', // Or your custom font (Inter/Geist)
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: -0.5,
  },
});