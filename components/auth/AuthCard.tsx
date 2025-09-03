import React from 'react';
import { StyleSheet, View, ViewProps } from 'react-native';

interface AuthCardProps extends ViewProps {
  children: React.ReactNode;
}

export default function AuthCard({ children, style, ...props }: AuthCardProps) {
  return (
    <View style={[styles.card, style]} {...props}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
    // Effet de bordure subtile
    borderWidth: 1,
    borderColor: 'rgba(47, 116, 23, 0.1)',
  },
});
