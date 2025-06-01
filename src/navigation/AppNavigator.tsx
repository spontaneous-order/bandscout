import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from '../screens/HomeScreen';
import ProfileScreen from '../screens/ProfileScreen';
import VenuePostScreen from '../screens/VenuePostScreen';
import MyVenuesScreen from '../screens/MyVenuesScreen';
import { Ionicons } from '@expo/vector-icons';
import { View, TouchableOpacity, StyleSheet, Platform } from 'react-native';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();
const ProfileStack = createNativeStackNavigator();
const PostStack = createNativeStackNavigator();

function ProfileStackScreen({ user, onSignOut }: { user: any, onSignOut: () => void }) {
  return (
    <ProfileStack.Navigator>
      <ProfileStack.Screen
        name="ProfileMain"
        options={{ headerShown: true, title: 'Profile' }}
        component={ProfileScreen}
        initialParams={{ user, onSignOut }}
      />
      <ProfileStack.Screen
        name="MyVenues"
        options={{ headerShown: true }}
        component={MyVenuesScreen}
        initialParams={{ user }}
      />
      <ProfileStack.Screen
        name="AddVenue"
        options={{ headerShown: true, title: 'Add Venue' }}
        children={() => <VenuePostScreen user={user} profile={null} onVenuePosted={() => {}} />}
      />
    </ProfileStack.Navigator>
  );
}

function PostStackScreen({ user, profile }: { user: any, profile: any }) {
  return (
    <PostStack.Navigator>
      <PostStack.Screen
        name="AddVenue"
        options={{ title: 'Add Venue' }}
        children={() => <VenuePostScreen user={user} profile={profile} onVenuePosted={() => {}} />}
      />
    </PostStack.Navigator>
  );
}

function MainTabs({ user, profile, onSignOut, navigation }: { user: any, profile: any, onSignOut: () => void, navigation?: any }) {
  const ICONS = {
    Home: 'home',
    Post: 'add-circle',
    Profile: 'person',
  } as const;
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => {
          const iconName = ICONS[route.name as keyof typeof ICONS] || 'ellipse';
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        headerShown: false,
        tabBarHideOnKeyboard: true,
      })}
    >
      <Tab.Screen name="Home">{({ navigation }) => <HomeScreen user={user} navigation={navigation} />}</Tab.Screen>
      <Tab.Screen
        name="Post"
        children={() => <PostStackScreen user={user} profile={profile} />}
        options={{
          tabBarLabel: 'Add Venue',
        }}
      />
      <Tab.Screen name="Profile">{() => <ProfileStackScreen user={user} onSignOut={onSignOut} />}</Tab.Screen>
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  fabContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: Platform.OS === 'ios' ? 36 : 24,
    alignItems: 'center',
    zIndex: 100,
    pointerEvents: 'box-none',
  },
  fab: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#a78bfa',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
});

export default function AppNavigator({ user, profile, onSignOut }: { user: any, profile: any, onSignOut: () => void }) {
  return (
    <Stack.Navigator
      screenOptions={{
        contentStyle: { backgroundColor: '#0a001a' },
      }}
    >
      <Stack.Screen name="MainTabs" options={{ headerShown: false }}>
        {({ navigation }) => <MainTabs user={user} profile={profile} onSignOut={onSignOut} navigation={navigation} />}
      </Stack.Screen>
      {/* FullMapScreen is now handled directly in HomeScreen, not as a stack screen, to avoid navigation transitions and white flash. */}
    </Stack.Navigator>
  );
} 