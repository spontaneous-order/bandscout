import React from 'react';
import { View, Text, Button, SafeAreaView, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import tw from 'twrnc';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const WelcomeScreen = ({ onContinue }: { onContinue: () => void }) => (
  <LinearGradient colors={['#0a001a', '#22004a', '#000']} style={{ flex: 1 }}>
    <SafeAreaView style={{ flex: 1, backgroundColor: 'transparent' }}>
      <View style={tw`flex-1 justify-center items-center px-8`}>
        <MaterialCommunityIcons name="music-circle" size={96} color="#a78bfa" style={{ marginBottom: 24 }} />
        <Text style={[tw`text-3xl font-bold mb-6 text-center`, { color: '#fff', letterSpacing: 1 }]}>Welcome to BandScout!</Text>
        <Text style={[tw`text-lg mb-8 text-center`, { color: '#e0e7ff' }]}>
          Find and share live music venues. Let's set up your profile to get started!
        </Text>
        <TouchableOpacity onPress={onContinue} style={{ backgroundColor: '#a78bfa', borderRadius: 24, paddingVertical: 16, paddingHorizontal: 40, marginTop: 12 }}>
          <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 18, letterSpacing: 1 }}>Get Started</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  </LinearGradient>
);

export default WelcomeScreen; 