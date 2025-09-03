import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface ModeToggleProps {
  mode: 'signin' | 'signup';
  onModeChange: (mode: 'signin' | 'signup') => void;
  disabled?: boolean;
}

export default function ModeToggle({ mode, onModeChange, disabled = false }: ModeToggleProps) {
  return (
    <View style={styles.modeIndicator}>
      <TouchableOpacity
        style={[styles.modeTab, mode === 'signin' && styles.modeTabActive]}
        onPress={() => onModeChange('signin')}
        disabled={disabled}
        activeOpacity={0.7}
      >
        <Text style={[styles.modeTabText, mode === 'signin' && styles.modeTabTextActive]}>
          Connexion
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.modeTab, mode === 'signup' && styles.modeTabActive]}
        onPress={() => onModeChange('signup')}
        disabled={disabled}
        activeOpacity={0.7}
      >
        <Text style={[styles.modeTabText, mode === 'signup' && styles.modeTabTextActive]}>
          Inscription
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  modeIndicator: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    padding: 4,
    marginBottom: 32,
  },
  modeTab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  modeTabActive: {
    backgroundColor: '#2F7417',
    shadowColor: '#2F7417',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  modeTabText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748B',
  },
  modeTabTextActive: {
    color: '#FFFFFF',
  },
});
