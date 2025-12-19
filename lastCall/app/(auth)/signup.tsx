import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  KeyboardAvoidingView, 
  Platform,
  ActivityIndicator,
  Alert,
  ScrollView
} from 'react-native';
import { Link, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';

export default function SignUp() {
  const router = useRouter();
  const { signUp } = useAuth();
  
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSignUp = async () => {
    if (!form.firstName || !form.lastName || !form.email || !form.password) {
      Alert.alert('Missing Info', 'Please fill in all fields to create your identity.');
      return;
    }

    setLoading(true);
    try {
      await signUp(form.email, form.password, form.firstName, form.lastName);
    } catch (error: any) {
      Alert.alert('Registration Failed', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.push('/')} style={styles.backButton}>
              <ArrowLeft size={24} color="#ffffff" />
            </TouchableOpacity>
          </View>

          <View style={styles.content}>
            <Text style={styles.title}>Create Identity</Text>
            <Text style={styles.subtitle}>One profile for every venue you work at.</Text>

            <View style={styles.form}>
              
              {/* Name Row */}
              <View style={styles.row}>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.label}>First Name</Text>
                  <View style={styles.inputContainer}>
                    <TextInput
                      style={styles.input}
                      placeholder="Jane"
                      placeholderTextColor="#64748b"
                      value={form.firstName}
                      onChangeText={(t) => setForm({...form, firstName: t})}
                    />
                  </View>
                </View>

                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.label}>Last Name</Text>
                  <View style={styles.inputContainer}>
                    <TextInput
                      style={styles.input}
                      placeholder="Doe"
                      placeholderTextColor="#64748b"
                      value={form.lastName}
                      onChangeText={(t) => setForm({...form, lastName: t})}
                    />
                  </View>
                </View>
              </View>

              {/* Email */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Email</Text>
                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.input}
                    placeholder="name@work.com"
                    placeholderTextColor="#64748b"
                    value={form.email}
                    onChangeText={(t) => setForm({...form, email: t})}
                    autoCapitalize="none"
                    keyboardType="email-address"
                  />
                </View>
              </View>

              {/* Password */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Password</Text>
                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.input}
                    placeholder="Create a strong password"
                    placeholderTextColor="#64748b"
                    value={form.password}
                    onChangeText={(t) => setForm({...form, password: t})}
                    secureTextEntry
                  />
                </View>
              </View>

              <TouchableOpacity 
                style={[styles.button, loading && styles.buttonDisabled]} 
                onPress={handleSignUp}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text style={styles.buttonText}>Create Account</Text>
                )}
              </TouchableOpacity>

            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020617',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#94a3b8',
    marginBottom: 32,
  },
  form: {
    gap: 20,
  },
  row: {
    flexDirection: 'row',
    gap: 16,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#cbd5e1',
    marginLeft: 4,
  },
  inputContainer: {
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 12,
    height: 56,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  input: {
    color: '#ffffff',
    fontSize: 16,
    height: '100%',
  },
  button: {
    backgroundColor: '#4f46e5', // Indigo-600
    height: 56,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    shadowColor: '#4f46e5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 4,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
});