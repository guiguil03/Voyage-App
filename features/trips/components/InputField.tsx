import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

interface InputFieldProps {
  label: string;
  placeholder: string;
  value: string;
  onChangeText?: (text: string) => void;
  onPress?: () => void;
  iconName: keyof typeof Ionicons.glyphMap;
  editable?: boolean;
}

export default function InputField({ 
  label, 
  placeholder, 
  value, 
  onChangeText,
  onPress,
  iconName,
  editable = true
}: InputFieldProps) {
  const InputComponent = editable ? (
    <TextInput
      style={styles.textInput}
      placeholder={placeholder}
      placeholderTextColor="#999"
      value={value}
      onChangeText={onChangeText}
      editable={editable}
    />
  ) : (
    <Text style={[styles.textInput, { color: value ? '#1a1a1a' : '#999' }]}>
      {value || placeholder}
    </Text>
  );

  const Container = onPress ? TouchableOpacity : View;

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{label}</Text>
      <Container style={styles.inputContainer} onPress={onPress}>
        <Ionicons name={iconName} size={20} color="#2F7417" style={styles.inputIcon} />
        {InputComponent}
      </Container>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  inputIcon: {
    marginRight: 12,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: '#1a1a1a',
  },
}); 