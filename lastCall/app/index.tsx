import React from 'react';
import { View, Text, TouchableOpacity, StatusBar, StyleSheet } from 'react-native';
import { Link } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowRight } from 'lucide-react-native';
import Logo from '@/components/logo';

export default function LandingPage() {

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* 1. Ambient Background Glow */}
      <LinearGradient
        colors={['rgba(99, 102, 241, 0.15)', 'transparent']}
        style={styles.backgroundGradient}
      />

      {/* 2. Main Content (The Brand) */}
      <View style={styles.contentContainer}>
        {/* Logo Container */}
        <View style={styles.logoContainer}>
          <Logo size={80} showText={false} />
        </View>

        {/* Typography */}
        <Text style={styles.title}>LastCall.</Text>
        <Text style={styles.subtitle}>
          The operating system for{'\n'}service industry professionals.
        </Text>
      </View>

      {/* 3. Action Area (Bottom) */}
      <SafeAreaView edges={['bottom']} style={styles.bottomArea}>
        <View style={styles.buttonStack}>
          
          {/* Primary Action: Get Started */}
          <Link href="/(auth)/signup" asChild>
            <TouchableOpacity style={styles.primaryButton}>
              <Text style={styles.primaryButtonText}>Get Started</Text>
              <ArrowRight size={20} color="#020617" strokeWidth={2.5} />
            </TouchableOpacity>
          </Link>

          {/* Secondary Action: Log In */}
          <Link href="/(auth)/login" asChild>
            <TouchableOpacity style={styles.secondaryButton}>
              <Text style={styles.secondaryButtonText}>I have an account</Text>
            </TouchableOpacity>
          </Link>

          {/* Micro-text */}
          <Text style={styles.footerText}>
            v1.0.0 • Built for the Night Shift
          </Text>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020617', // Slate-950
  },
  backgroundGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: 500,
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  logoContainer: {
    width: 96,
    height: 96,
    backgroundColor: '#0f172a', // Slate-900
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
    borderWidth: 1,
    borderColor: '#1e293b', // Slate-800
    // Shadow for iOS
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    // Elevation for Android
    elevation: 10,
  },
  title: {
    fontSize: 48,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: -1,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 20,
    color: '#94a3b8', // Slate-400
    textAlign: 'center',
    fontWeight: '500',
    lineHeight: 28,
  },
  bottomArea: {
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  buttonStack: {
    gap: 12,
  },
  primaryButton: {
    backgroundColor: '#ffffff',
    height: 56,
    borderRadius: 9999,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#ffffff',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 2,
  },
  primaryButtonText: {
    color: '#020617',
    fontSize: 18,
    fontWeight: '700',
  },
  secondaryButton: {
    height: 56,
    borderRadius: 9999,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#1e293b',
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
  },
  secondaryButtonText: {
    color: '#cbd5e1', // Slate-300
    fontSize: 18,
    fontWeight: '600',
  },
  footerText: {
    color: '#475569', // Slate-600
    fontSize: 12,
    textAlign: 'center',
    marginTop: 16,
  },
});