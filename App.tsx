import React, { useEffect, useState } from 'react';
import { supabase } from './src/lib/supabase';
import AuthScreen from './src/screens/AuthScreen';
import AppNavigator from './src/navigation/AppNavigator';
import ProfileSetupScreen from './src/screens/ProfileSetupScreen';
import WelcomeScreen from './src/screens/WelcomeScreen';
import LocationPermissionScreen from './src/screens/LocationPermissionScreen';
import { NavigationContainer } from '@react-navigation/native';
import { View } from 'react-native';
import { MD3DarkTheme as PaperDarkTheme, Provider as PaperProvider, ActivityIndicator as PaperActivityIndicator, Text as PaperText } from 'react-native-paper';
import { DarkTheme as NavigationDarkTheme } from '@react-navigation/native';
import * as Location from 'expo-location';

const App: React.FC = () => {
  const [session, setSession] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [booting, setBooting] = useState(true);
  const [showWelcome, setShowWelcome] = useState(false);
  const [locationPermission, setLocationPermission] = useState<'granted' | 'denied' | 'undetermined' | null>(null);

  // Preload check: session, profile, and location permission
  useEffect(() => {
    const preload = async () => {
      // 1. Check session and profile
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      let userProfile = null;
      if (session?.user) {
        const { data } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
        setProfile(data);
        userProfile = data;
      } else {
        setProfile(null);
      }
      // 2. If profile exists, check location permission
      if (session?.user && userProfile) {
        try {
          const { status } = await Location.getForegroundPermissionsAsync();
          setLocationPermission(status);
        } catch {
          setLocationPermission('denied');
        }
      } else {
        setLocationPermission(null);
      }
      setBooting(false);
    };
    preload();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) setShowWelcome(true);
      // When auth state changes, re-check profile
      if (session?.user) {
        supabase.from('profiles').select('*').eq('id', session.user.id).single().then(({ data }) => setProfile(data));
      } else {
        setProfile(null);
      }
    });
    return () => {
      listener?.subscription.unsubscribe();
    };
  }, []);

  async function checkLocationPermission() {
    try {
      const { status } = await Location.getForegroundPermissionsAsync();
      setLocationPermission(status);
    } catch {
      setLocationPermission('denied');
    }
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    setSession(null);
    setProfile(null);
    setShowWelcome(false);
    setLocationPermission(null);
  }

  if (booting) {
    return (
      <PaperProvider>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0a001a' }}>
          <PaperText variant="headlineLarge" style={{ marginBottom: 16, color: '#fff' }}>BandScout</PaperText>
          <PaperActivityIndicator size="large" />
        </View>
      </PaperProvider>
    );
  }

  if (!session || !session.user) {
    return <AuthScreen onAuthSuccess={() => {
      setBooting(true);
      supabase.auth.getSession().then(({ data: { session } }) => {
        setSession(session);
        if (session?.user) {
          supabase.from('profiles').select('*').eq('id', session.user.id).single().then(({ data }) => {
            setProfile(data);
            setBooting(false);
          });
        } else {
          setProfile(null);
          setBooting(false);
        }
      });
    }} />;
  }

  if (showWelcome && !profile) {
    return <WelcomeScreen onContinue={() => setShowWelcome(false)} />;
  }

  if (!profile) {
    return <ProfileSetupScreen user={session.user} onProfileSet={() => {
      setBooting(true);
      supabase.from('profiles').select('*').eq('id', session.user.id).single().then(({ data }) => {
        setProfile(data);
        setBooting(false);
      });
    }} />;
  }

  if (profile && locationPermission !== 'granted') {
    return <LocationPermissionScreen onPermissionGranted={checkLocationPermission} />;
  }

  return (
    <PaperProvider theme={PaperDarkTheme}>
      <NavigationContainer theme={NavigationDarkTheme}>
        <AppNavigator user={session.user} profile={profile} onSignOut={handleSignOut} />
      </NavigationContainer>
    </PaperProvider>
  );
};

export default App;
