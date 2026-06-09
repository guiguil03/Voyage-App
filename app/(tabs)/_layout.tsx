import { Tabs } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';

import { HapticTab } from '@/components/ui/HapticTab';
import { IconSymbol } from '@/components/ui/IconSymbol';
import TabBarBackground from '@/components/ui/TabBarBackground';

export default function TabLayout() {

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#F5EDD6',
        tabBarInactiveTintColor: 'rgba(245,237,214,0.35)',
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarBackground: TabBarBackground,
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '300',
          letterSpacing: 0.5,
          marginBottom: 2,
        },
        tabBarStyle: Platform.select({
          ios: {
            position: 'absolute',
            backgroundColor: 'transparent',
            borderTopWidth: 0,
            elevation: 0,
          },
          default: {
            backgroundColor: 'rgba(8,8,8,0.95)',
            borderTopColor: 'rgba(245,237,214,0.15)',
            borderTopWidth: 1,
            elevation: 0,
          },
        }),
      }}>
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="house.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="create"
        options={{
          title: 'Créer',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="plus.circle.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Explorer',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="globe" color={color} />,
        }}
      />
      {/* Vos voyages */}
      <Tabs.Screen
        name="voyage"
        options={{
          title: 'Vos voyages',
          headerShown: false,
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="airplane" color={color} />,
        }}
      />
       <Tabs.Screen
        name="amis"
        options={{
          title: 'Amis',
          headerShown: false,
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="person.2.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="account"
        options={{
          title: 'Compte',
          headerShown: false,
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="person.fill" color={color} />,
        }}
      />
     
    </Tabs>
  );
}
