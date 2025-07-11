import React from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';

interface SelectionButtonProps {
  title: string;
  selected: boolean;
  onPress: () => void;
  variant?: 'default' | 'theme';
  style?: any;
}

export default function SelectionButton({ 
  title, 
  selected, 
  onPress, 
  variant = 'default',
  style 
}: SelectionButtonProps) {
  const getButtonStyle = () => {
    if (variant === 'theme') {
      return [
        styles.themeButton,
        selected && styles.themeButtonSelected,
        style
      ];
    }
    return [
      styles.defaultButton,
      selected && styles.defaultButtonSelected,
      style
    ];
  };

  const getTextStyle = () => {
    if (variant === 'theme') {
      return [
        styles.themeButtonText,
        selected && styles.themeButtonTextSelected
      ];
    }
    return [
      styles.defaultButtonText,
      selected && styles.defaultButtonTextSelected
    ];
  };

  return (
    <TouchableOpacity style={getButtonStyle()} onPress={onPress}>
      <Text style={getTextStyle()}>{title}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  defaultButton: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e9ecef',
    flex: 1,
  },
  defaultButtonSelected: {
    backgroundColor: '#2F7417',
    borderColor: '#2F7417',
  },
  defaultButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  defaultButtonTextSelected: {
    color: '#FFFFFF',
  },
  themeButton: {
    backgroundColor: '#F0F9F0',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: 'rgba(47, 116, 23, 0.3)',
  },
  themeButtonSelected: {
    backgroundColor: '#2F7417',
    borderColor: '#2F7417',
  },
  themeButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#2F7417',
  },
  themeButtonTextSelected: {
    color: '#FFFFFF',
  },
}); 