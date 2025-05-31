import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import HomeScreen from '../screens/HomeScreen';
import ProfileScreen from '../screens/ProfileScreen';
import VenuePostScreen from '../screens/VenuePostScreen';
import { Ionicons } from '@expo/vector-icons';

const Tab = createBottomTabNavigator();

const AppNavigator = ({ user, profile, onSignOut }: { user: any, profile: any, onSignOut: () => void }) => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      tabBarIcon: ({ color, size }) => {
        let iconName: keyof typeof Ionicons.glyphMap = 'home';
        if (route.name === 'Home') iconName = 'home';
        if (route.name === 'Post') iconName = 'add-circle';
        if (route.name === 'Profile') iconName = 'person';
        return <Ionicons name={iconName} size={size} color={color} />;
      },
      headerShown: false,
    })}
  >
    <Tab.Screen name="Home" component={HomeScreen} />
    <Tab.Screen name="Post">
      {() => <VenuePostScreen user={user} profile={profile} onVenuePosted={() => {}} />}
    </Tab.Screen>
    <Tab.Screen name="Profile">
      {() => <ProfileScreen user={user} onSignOut={onSignOut} />}
    </Tab.Screen>
  </Tab.Navigator>
);

export default AppNavigator; 