import { Tabs } from 'expo-router';
import React from 'react';
import { Platform, View } from 'react-native';

import { HapticTab } from '@/components/ui/HapticTab';
import { IconSymbol } from '@/components/ui/IconSymbol';
import TabBarBackground from '@/components/ui/TabBarBackground';

function CreateTabIcon({ color, focused }: { color: string; focused: boolean }) {
  return (
    <View style={{
      width: 52,
      height: 52,
      borderRadius: 26,
      backgroundColor: focused ? '#7AB8F5' : 'rgba(122,184,245,0.15)',
      borderWidth: 1.5,
      borderColor: focused ? '#7AB8F5' : 'rgba(122,184,245,0.35)',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 4,
      shadowColor: '#7AB8F5',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: focused ? 0.4 : 0.1,
      shadowRadius: 10,
      elevation: focused ? 6 : 2,
    }}>
      <IconSymbol size={26} name="plus" color={focused ? '#0D0D0D' : '#7AB8F5'} />
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#7AB8F5',
        tabBarInactiveTintColor: 'rgba(122,184,245,0.35)',
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
            borderTopColor: 'rgba(122,184,245,0.15)',
            borderTopWidth: 1,
            elevation: 0,
          },
        }),
      }}>

      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <IconSymbol size={26} name="house.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Explorer',
          tabBarIcon: ({ color }) => <IconSymbol size={26} name="globe" color={color} />,
        }}
      />
      <Tabs.Screen
        name="create"
        options={{
          title: '',
          tabBarIcon: ({ color, focused }) => <CreateTabIcon color={color} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="voyage"
        options={{
          title: 'Voyages',
          headerShown: false,
          tabBarIcon: ({ color }) => <IconSymbol size={26} name="airplane" color={color} />,
        }}
      />
      <Tabs.Screen
        name="account"
        options={{
          title: 'Compte',
          headerShown: false,
          tabBarIcon: ({ color }) => <IconSymbol size={26} name="person.fill" color={color} />,
        }}
      />

      {/* Amis accessible via Home et Compte */}
      <Tabs.Screen
        name="amis"
        options={{
          href: null,
        }}
      />

    </Tabs>
  );
}
