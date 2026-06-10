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
  style,
}: SelectionButtonProps) {
  const getButtonStyle = () => {
    if (variant === 'theme') {
      return [styles.themeButton, selected && styles.themeButtonSelected, style];
    }
    return [styles.defaultButton, selected && styles.defaultButtonSelected, style];
  };

  const getTextStyle = () => {
    if (variant === 'theme') {
      return [styles.themeButtonText, selected && styles.themeButtonTextSelected];
    }
    return [styles.defaultButtonText, selected && styles.defaultButtonTextSelected];
  };

  return (
    <TouchableOpacity style={getButtonStyle()} onPress={onPress}>
      <Text style={getTextStyle()}>{title}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  defaultButton: {
    backgroundColor: 'rgba(122,184,245,0.06)',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(122,184,245,0.18)',
    flex: 1,
  },
  defaultButtonSelected: {
    backgroundColor: '#7AB8F5',
    borderColor: '#7AB8F5',
  },
  defaultButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.55)',
  },
  defaultButtonTextSelected: {
    color: '#0D0D0D',
    fontWeight: '600',
  },
  themeButton: {
    backgroundColor: 'rgba(122,184,245,0.06)',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: 'rgba(122,184,245,0.18)',
  },
  themeButtonSelected: {
    backgroundColor: '#7AB8F5',
    borderColor: '#7AB8F5',
  },
  themeButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(122,184,245,0.70)',
  },
  themeButtonTextSelected: {
    color: '#0D0D0D',
    fontWeight: '600',
  },
});
