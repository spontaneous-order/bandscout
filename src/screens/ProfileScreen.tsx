import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, Switch, Button, Alert, ActivityIndicator, Image, ScrollView, TouchableOpacity } from 'react-native';
import { TextInput as PaperTextInput, Button as PaperButton, Switch as PaperSwitch, ActivityIndicator as PaperActivityIndicator, Text as PaperText, Chip, Dialog, Portal, Paragraph, Appbar } from 'react-native-paper';
import tw from 'twrnc';
import { supabase } from '../lib/supabase';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';


const MUSIC_TYPES = [
  'Rock', 'Pop', 'Jazz', 'Hip-Hop', 'Classical', 'Electronic', 'Country', 'Reggae', 'Blues', 'Folk', 'Metal', 'R&B', 'Soul', 'Punk', 'Indie', 'Other'
];

const ProfileScreen = ({ route, navigation }: any) => {
  const { user, onSignOut } = route.params;
  const [name, setName] = useState('');
  const [isMusician, setIsMusician] = useState(false);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [musicPreferences, setMusicPreferences] = useState<string[]>([]);
  const [dialog, setDialog] = useState<{ visible: boolean, message: string }>({ visible: false, message: '' });
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (user) {
      const fetchProfile = async () => {
        setLoading(true);
        const { data, error } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        if (error) setDialog({ visible: true, message: error.message });
        if (data) {
          setName(data.name || '');
          setIsMusician(!!data.is_musician);
          setMusicPreferences(data.music_preferences || []);
          setProfileImage(data.profile_image_url || null);
        }
        setLoading(false);
      };
      fetchProfile();
    }
  }, [user]);

  async function updateProfile() {
    setLoading(true);
    const { error } = await supabase.from('profiles').upsert({
      id: user.id,
      name,
      is_musician: isMusician,
      music_preferences: musicPreferences,
    });
    setLoading(false);
    if (error) setDialog({ visible: true, message: error.message });
    else setDialog({ visible: true, message: 'Profile updated!' });
  }

  async function handleDeleteProfile() {
    setDeleting(true);
    const { error } = await supabase.from('profiles').delete().eq('id', user.id);
    setDeleting(false);
    if (error) {
      Alert.alert('Error', error.message);
    } else {
      Alert.alert('Account deleted', 'Your profile has been deleted.');
      onSignOut();
    }
  }

  function deleteAccount() {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your account? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete', style: 'destructive', onPress: handleDeleteProfile
        }
      ]
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
      // Use fetch polyfill to convert base64 to blob
      const blob = await (await fetch(`data:image/${fileExt};base64,${base64String}`)).blob();
      const { data, error } = await supabase.storage
        .from('profile-images')
        .upload(fileName, blob, { upsert: true, contentType: `image/${fileExt}` });
      if (error) throw error;
      const { data: publicUrlData } = supabase.storage
        .from('profile-images')
        .getPublicUrl(fileName);
      setUploading(false);
      setProfileImage(publicUrlData.publicUrl);
      // Update profile in DB
      await supabase.from('profiles').update({ profile_image_url: publicUrlData.publicUrl }).eq('id', user.id);
      return publicUrlData.publicUrl;
    } catch (e) {
      setUploading(false);
      const msg = typeof e === 'object' && e && 'message' in e ? (e as any).message : String(e);
      Alert.alert('Image upload failed', msg);
      return null;
    }
  }

  return (
    <LinearGradient colors={['#0a001a', '#22004a', '#000']} style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1, backgroundColor: 'transparent' }}>
        <ScrollView contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 0, paddingTop: 32, paddingBottom: 32 }} style={{ backgroundColor: 'transparent' }}>
          <View style={{ alignItems: 'center', marginBottom: 24 }}>
            <TouchableOpacity onPress={pickImage} style={{ marginBottom: 12 }}>
              {uploading ? (
                <ActivityIndicator size="large" color="#a78bfa" />
              ) : (
                <Image
                  source={profileImage ? { uri: profileImage } : { uri: 'https://ui-avatars.com/api/?name=' + encodeURIComponent(name || user.email || 'User') + '&background=6366f1&color=fff&size=128' }}
                  style={{ width: 96, height: 96, borderRadius: 48, marginBottom: 12, borderWidth: 2, borderColor: '#fff' }}
                />
              )}
              <Text style={{ color: '#a78bfa', marginTop: 8, fontWeight: 'bold' }}>Change Photo</Text>
            </TouchableOpacity>
            <PaperText style={{ color: '#fff', fontSize: 20, fontWeight: 'bold', marginBottom: 2 }}>{name || 'No Name'}</PaperText>
            <PaperText style={{ color: '#a1a1aa', fontSize: 14, marginBottom: 8 }}>{user.email}</PaperText>
          </View>
          <View style={{ backgroundColor: '#181825', borderRadius: 16, marginHorizontal: 20, marginBottom: 24, padding: 20, elevation: 2 }}>
            <PaperTextInput
              label="Display Name"
              value={name}
              onChangeText={setName}
              dense
              style={{ marginBottom: 16 }}
              theme={{ colors: { text: '#fff', placeholder: '#a1a1aa', background: 'transparent', primary: '#6366f1' } }}
              underlineColor="#6366f1"
              textColor="#fff"
            />
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
              <PaperText style={{ color: '#fff', marginRight: 8 }}>Are you a musician?</PaperText>
              <PaperSwitch value={isMusician} onValueChange={setIsMusician} color="#6366f1" />
            </View>
            <PaperButton mode="contained" onPress={updateProfile} disabled={loading} style={{ marginTop: 8, borderRadius: 8, height: 48, justifyContent: 'center', backgroundColor: '#6366f1' }} labelStyle={{ color: '#fff' }}>
              {loading ? <PaperActivityIndicator size="small" /> : 'Update Profile'}
            </PaperButton>
          </View>
          <View style={{ backgroundColor: '#181825', borderRadius: 16, marginHorizontal: 20, marginBottom: 24, padding: 20, elevation: 2 }}>
            <PaperText style={{ color: '#fff', fontWeight: 'bold', marginBottom: 8 }}>Music Preferences</PaperText>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 8 }}>
              {MUSIC_TYPES.map(type => (
                <Chip
                  key={type}
                  selected={musicPreferences.includes(type)}
                  onPress={() => {
                    setMusicPreferences(musicPreferences.includes(type)
                      ? musicPreferences.filter(t => t !== type)
                      : [...musicPreferences, type]);
                  }}
                  style={{ marginRight: 6, marginBottom: 6, backgroundColor: musicPreferences.includes(type) ? '#6366f1' : '#e0e7ff' }}
                  textStyle={{ color: musicPreferences.includes(type) ? '#fff' : '#3730a3', fontSize: 12 }}
                >
                  {type}
                </Chip>
              ))}
            </View>
          </View>
          <View style={{ backgroundColor: '#181825', borderRadius: 16, marginHorizontal: 20, marginBottom: 24, padding: 20, elevation: 2 }}>
            <PaperText style={{ color: '#fff', fontWeight: 'bold', marginBottom: 8 }}>Venues</PaperText>
            <PaperButton mode="outlined" onPress={() => navigation.push('MyVenues')} style={{ marginBottom: 12, borderRadius: 8, height: 48, justifyContent: 'center', borderColor: '#6366f1' }} labelStyle={{ color: '#6366f1' }}>
              My Venues
            </PaperButton>
            <PaperButton
              mode="contained"
              icon={({ size, color }) => <Ionicons name="add" size={size} color={color} />}
              onPress={() => navigation.push('AddVenue')}
              style={{ borderRadius: 8, height: 48, justifyContent: 'center', backgroundColor: '#6366f1' }}
              labelStyle={{ color: '#fff' }}
            >
              Add Venue
            </PaperButton>
          </View>
          <View style={{ backgroundColor: '#181825', borderRadius: 16, marginHorizontal: 20, marginBottom: 0, padding: 20, elevation: 2 }}>
            <PaperText style={{ color: '#fff', fontWeight: 'bold', marginBottom: 8 }}>Account Actions</PaperText>
            <PaperButton mode="outlined" onPress={onSignOut} style={{ marginBottom: 12, borderRadius: 8, height: 48, justifyContent: 'center', borderColor: '#6366f1' }} labelStyle={{ color: '#6366f1' }}>
              Sign Out
            </PaperButton>
            {deleting ? (
              <PaperActivityIndicator size="large" color="#6366f1" />
            ) : (
              <PaperButton mode="contained" onPress={deleteAccount} style={{ borderRadius: 8, height: 48, justifyContent: 'center', backgroundColor: '#000' }} labelStyle={{ color: '#fff' }}>
                Delete Account
              </PaperButton>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
      <Portal>
        <Dialog visible={dialog.visible} onDismiss={() => setDialog({ visible: false, message: '' })}>
          <Dialog.Content>
            <Paragraph>{dialog.message}</Paragraph>
          </Dialog.Content>
          <Dialog.Actions>
            <PaperButton onPress={() => setDialog({ visible: false, message: '' })}>OK</PaperButton>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </LinearGradient>
  );
};

export default ProfileScreen; 