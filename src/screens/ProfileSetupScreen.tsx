import React, { useState } from 'react';
import { View, Text, TextInput, Switch, Button, Alert, TouchableOpacity, ScrollView, SafeAreaView, Image, ActivityIndicator } from 'react-native';
import tw from 'twrnc';
import { supabase } from '../lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

const GENRES = [
  'Rock', 'Jazz', 'Hip-Hop', 'Classical', 'Pop', 'Electronic', 'Country', 'Blues', 'Reggae', 'Metal', 'Folk', 'Other'
];

const ProfileSetupScreen = ({ user, onProfileSet }: { user: any, onProfileSet: () => void }) => {
  const [name, setName] = useState('');
  const [isMusician, setIsMusician] = useState(false);
  const [musicPreferences, setMusicPreferences] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  function toggleGenre(genre: string) {
    setMusicPreferences((prefs) =>
      prefs.includes(genre) ? prefs.filter((g) => g !== genre) : [...prefs, genre]
    );
  }

  async function pickImage() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
      base64: true,
    });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      const asset = result.assets[0];
      setProfileImage(asset.uri);
      // Upload base64 to Supabase
      const fileExt = asset.uri.split('.').pop() || 'jpg';
      if (asset.base64) {
        await uploadImageToSupabaseBase64(asset.base64, fileExt);
      } else {
        Alert.alert('Image upload failed', 'No base64 data found.');
      }
    }
  }

  async function uploadImageToSupabaseBase64(base64String: string, fileExt = 'jpg') {
    try {
      setUploading(true);
      const fileName = `${user.id}_${Date.now()}.${fileExt}`;
      // Convert base64 to blob
      const byteCharacters = atob(base64String);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: `image/${fileExt}` });
      const { data, error } = await supabase.storage
        .from('profile-images')
        .upload(fileName, blob, { upsert: true, contentType: `image/${fileExt}` });
      if (error) throw error;
      const { data: publicUrlData } = supabase.storage
        .from('profile-images')
        .getPublicUrl(fileName);
      setUploading(false);
      // Save the public URL to state for preview and to DB on save
      setProfileImage(publicUrlData.publicUrl);
      return publicUrlData.publicUrl;
    } catch (e) {
      setUploading(false);
      const msg = typeof e === 'object' && e && 'message' in e ? (e as any).message : String(e);
      Alert.alert('Image upload failed', msg);
      return null;
    }
  }

  async function saveProfile() {
    setLoading(true);
    const { error } = await supabase.from('profiles').upsert({
      id: user.id,
      name,
      is_musician: isMusician,
      music_preferences: musicPreferences,
      profile_image_url: profileImage || undefined,
    });
    setLoading(false);
    if (error) Alert.alert(error.message);
    else onProfileSet();
  }

  async function handleLogoutAndReset() {
    await supabase.auth.signOut();
    await AsyncStorage.clear();
    Alert.alert('App reset', 'You have been logged out and local data cleared.');
  }

  return (
    <LinearGradient colors={['#0a001a', '#22004a', '#000']} style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1, backgroundColor: 'transparent' }}>
        <ScrollView contentContainerStyle={tw`flex-1 justify-center px-8`} style={{ backgroundColor: 'transparent' }}>
          <Text style={[tw`text-2xl font-bold mb-6 text-center`, { color: '#fff', letterSpacing: 1 }]}>Set Up Profile</Text>
          <View style={{ alignItems: 'center', marginBottom: 24 }}>
            <TouchableOpacity onPress={pickImage} style={{ marginBottom: 12 }}>
              {uploading ? (
                <ActivityIndicator size="large" color="#a78bfa" />
              ) : (
                <Image
                  source={profileImage ? { uri: profileImage } : { uri: 'https://ui-avatars.com/api/?name=' + encodeURIComponent(name || user.email || 'User') + '&background=6366f1&color=fff&size=128' }}
                  style={{ width: 96, height: 96, borderRadius: 48, borderWidth: 2, borderColor: '#fff' }}
                />
              )}
              <Text style={{ color: '#a78bfa', marginTop: 8, fontWeight: 'bold' }}>Change Photo</Text>
            </TouchableOpacity>
          </View>
          <TextInput
            style={{ backgroundColor: '#181825', color: '#fff', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, marginBottom: 16, fontSize: 16, borderWidth: 1, borderColor: '#23233b' }}
            placeholder="Display Name"
            placeholderTextColor="#888"
            value={name}
            onChangeText={setName}
          />
          <View style={tw`flex-row items-center mb-4`}>
            <Text style={{ color: '#fff', fontSize: 16, marginRight: 8 }}>Are you a musician?</Text>
            <Switch value={isMusician} onValueChange={setIsMusician} trackColor={{ false: '#23233b', true: '#a78bfa' }} thumbColor={isMusician ? '#a78bfa' : '#888'} />
          </View>
          <Text style={[tw`mb-2 font-bold`, { color: '#fff', fontSize: 16 }]}>Music Preferences</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 16 }}>
            {GENRES.map((genre) => (
              <TouchableOpacity
                key={genre}
                style={{ marginRight: 6, marginBottom: 6, backgroundColor: musicPreferences.includes(genre) ? '#23233b' : '#181825', borderRadius: 8, height: 28, minWidth: 0, paddingHorizontal: 12, alignItems: 'center', justifyContent: 'center', borderWidth: musicPreferences.includes(genre) ? 1 : 0, borderColor: musicPreferences.includes(genre) ? '#a78bfa' : 'transparent' }}
                onPress={() => toggleGenre(genre)}
              >
                <Text style={{ color: musicPreferences.includes(genre) ? '#a78bfa' : '#e0e7ff', fontSize: 13, fontWeight: 'normal' }}>{genre}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity onPress={saveProfile} disabled={loading} style={{ backgroundColor: '#a78bfa', borderRadius: 24, paddingVertical: 16, alignItems: 'center', marginBottom: 12, opacity: loading ? 0.7 : 1 }}>
            <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 18, letterSpacing: 1 }}>{loading ? 'Saving...' : 'Save Profile'}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleLogoutAndReset} style={{ backgroundColor: '#23233b', borderRadius: 24, paddingVertical: 14, alignItems: 'center' }}>
            <Text style={{ color: '#f87171', fontWeight: 'bold', fontSize: 16 }}>Logout & Reset App</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
};

export default ProfileSetupScreen; 