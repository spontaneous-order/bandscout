import React, { useState } from 'react';
import { View, TextInput, Button, Text, Alert, SafeAreaView, TouchableOpacity } from 'react-native';
import { supabase } from '../lib/supabase';
import tw from 'twrnc';
import { LinearGradient } from 'expo-linear-gradient';

interface AuthScreenProps {
  onAuthSuccess: (session: any) => void;
}

const AuthScreen: React.FC<AuthScreenProps> = ({ onAuthSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function signInWithEmail() {
    setLoading(true);
    const { error, data } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) Alert.alert(error.message);
    else onAuthSuccess(data.session);
  }

  async function signUpWithEmail() {
    setLoading(true);
    const { error, data } = await supabase.auth.signUp({ email, password });
    setLoading(false);
    if (error) Alert.alert(error.message);
    else onAuthSuccess(data.session);
  }

  return (
    <LinearGradient colors={['#0a001a', '#22004a', '#000']} style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1, backgroundColor: 'transparent' }}>
        <View style={tw`flex-1 justify-center px-8`}>
          <Text style={[tw`text-2xl font-bold mb-6 text-center`, { color: '#fff', letterSpacing: 1 }]}>Sign In / Sign Up</Text>
          <TextInput
            style={{ backgroundColor: '#181825', color: '#fff', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, marginBottom: 16, fontSize: 16, borderWidth: 1, borderColor: '#23233b' }}
            placeholder="Email"
            placeholderTextColor="#888"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <TextInput
            style={{ backgroundColor: '#181825', color: '#fff', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, marginBottom: 16, fontSize: 16, borderWidth: 1, borderColor: '#23233b' }}
            placeholder="Password"
            placeholderTextColor="#888"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
          <TouchableOpacity onPress={signInWithEmail} disabled={loading} style={{ backgroundColor: '#a78bfa', borderRadius: 24, paddingVertical: 16, alignItems: 'center', marginBottom: 12, opacity: loading ? 0.7 : 1 }}>
            <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 18, letterSpacing: 1 }}>Sign In</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={signUpWithEmail} disabled={loading} style={{ backgroundColor: '#23233b', borderRadius: 24, paddingVertical: 14, alignItems: 'center' }}>
            <Text style={{ color: '#a78bfa', fontWeight: 'bold', fontSize: 16 }}>Sign Up</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
};

export default AuthScreen; 