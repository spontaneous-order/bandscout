import React, { useState } from 'react';
import { View, Text, Button, ActivityIndicator, Linking, Platform, SafeAreaView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import tw from 'twrnc';

const LocationPermissionScreen = ({ onPermissionGranted }: { onPermissionGranted: () => void }) => {
  const [requesting, setRequesting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requestPermission = async () => {
    setRequesting(true);
    setError(null);
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        onPermissionGranted();
        return;
      } else {
        setError('Location permission is required to use BandScout.');
      }
    } catch (e) {
      setError('An error occurred while requesting location permission.');
    }
    setRequesting(false);
  };

  const openSettings = () => {
    if (Platform.OS === 'ios') {
      Linking.openURL('app-settings:');
    } else {
      Linking.openSettings();
    }
  };

  return (
    <LinearGradient colors={['#0a001a', '#22004a', '#000']} style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1, backgroundColor: 'transparent' }}>
        <View style={tw`flex-1 justify-center items-center px-8`}>
          <Text style={tw`text-2xl font-bold mb-4 text-center`}>We Need Your Location</Text>
          <Text style={tw`text-base text-center mb-6`}>BandScout uses your location to show you venues and musicians nearby. Please enable location access to continue using the app.</Text>
          {error && <Text style={tw`text-red-500 mb-4 text-center`}>{error}</Text>}
          {requesting ? (
            <ActivityIndicator size="large" />
          ) : (
            <>
              <Button title="Allow Location Access" onPress={requestPermission} />
              <View style={tw`h-4`} />
              <Button title="Open Settings" onPress={openSettings} />
            </>
          )}
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
};

export default LocationPermissionScreen; 