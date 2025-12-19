import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  ActivityIndicator, 
  StyleSheet, 
  KeyboardAvoidingView, 
  Platform, 
  TouchableWithoutFeedback, 
  Keyboard, 
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Building2, AlignLeft, ArrowLeft } from 'lucide-react-native';
import { api } from '@/lib/api';

export default function CreateOrganization() {
  const router = useRouter();
  
  // Form State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  // Logic: Stubbed Backend Connection
  const handleCreate = async () => {
    // Basic client-side validation
    if (!name.trim()) {
      // In a real app, you might show a toast or error state here
      return; 
    }

    setLoading(true);

    try {
        const newOrg = await api.createOrganization({
            name: name.trim(),
            description: description.trim() || undefined
        });
        router.replace(`/(app)/${newOrg.id}`);
    } catch (error) {
      Alert.alert('Error',"Error creating an organization, please try again later.");
      console.error('Failed to create organization', error);
      setLoading(false);
    } finally {
        setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardContainer}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.contentContainer}>
            
            {/* Header Section */}
            <View style={styles.header}>
              <TouchableOpacity 
                style={styles.backButton} 
                onPress={() => router.back()}
                activeOpacity={0.7}
              >
                <ArrowLeft size={24} color="#94a3b8" />
              </TouchableOpacity>
              <Text style={styles.title}>New Organization</Text>
              <Text style={styles.subtitle}>
                Create a new workspace for your team to manage schedules and shifts.
              </Text>
            </View>

            {/* Form Section */}
            <View style={styles.form}>
              
              {/* Name Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Organization Name</Text>
                <View style={[styles.inputContainer, name.length > 0 && styles.inputContainerActive]}>
                  <Building2 size={20} color="#64748b" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. Joe's Bar & Grill"
                    placeholderTextColor="#475569"
                    value={name}
                    onChangeText={setName}
                    autoCapitalize="words"
                    autoCorrect={false}
                  />
                </View>
              </View>

              {/* Description Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Description (Optional)</Text>
                <View style={[styles.inputContainer]}>
                  <AlignLeft size={20} color="#64748b" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Downtown location..."
                    placeholderTextColor="#475569"
                    value={description}
                    onChangeText={setDescription}
                  />
                </View>
              </View>

            </View>

            {/* Action Footer */}
            <View style={styles.footer}>
              <TouchableOpacity 
                style={[styles.createButton, (!name.trim() || loading) && styles.createButtonDisabled]} 
                onPress={handleCreate}
                disabled={!name.trim() || loading}
                activeOpacity={0.8}
              >
                {loading ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text style={styles.createButtonText}>Create Workspace</Text>
                )}
              </TouchableOpacity>
            </View>

          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // Layout
  container: {
    flex: 1,
    backgroundColor: '#020617', // App Background (Slate 950)
  },
  keyboardContainer: {
    flex: 1,
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
  },

  // Header
  header: {
    marginBottom: 32,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    marginBottom: 16,
    marginLeft: -8, // optical alignment
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: '#94a3b8', // Slate 400
    lineHeight: 24,
  },

  // Form
  form: {
    flex: 1,
    gap: 24,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#cbd5e1', // Slate 300
    marginLeft: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f172a', // Surface (Slate 900)
    borderWidth: 1,
    borderColor: '#1e293b', // Subtle Border
    borderRadius: 12,
    height: 56,
    paddingHorizontal: 16,
  },
  inputContainerActive: {
    borderColor: '#334155', // Slightly lighter border when filled
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    color: '#ffffff',
    fontSize: 16,
    height: '100%',
  },

  // Footer / Buttons
  footer: {
    paddingVertical: 24,
  },
  createButton: {
    backgroundColor: '#4f46e5', // Brand Indigo
    height: 56,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#4f46e5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 4,
  },
  createButtonDisabled: {
    backgroundColor: '#1e293b', // Slate 800
    shadowOpacity: 0,
    elevation: 0,
  },
  createButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
});