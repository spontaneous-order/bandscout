import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, Switch, Button, Alert } from 'react-native';
import tw from 'twrnc';
import { supabase } from '../lib/supabase';

const ProfileScreen = ({ user, onSignOut }: { user: any, onSignOut: () => void }) => {
  const [name, setName] = useState('');
  const [isMusician, setIsMusician] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) fetchProfile();
  }, [user]);

  async function fetchProfile() {
    setLoading(true);
    const { data, error } = await supabase.from('profiles').select('*').eq('id', user.id).single();
    if (error) Alert.alert(error.message);
    if (data) {
      setName(data.name || '');
      setIsMusician(!!data.is_musician);
    }
    setLoading(false);
  }

  async function updateProfile() {
    setLoading(true);
    const { error } = await supabase.from('profiles').upsert({
      id: user.id,
      name,
      is_musician: isMusician,
    });
    setLoading(false);
    if (error) Alert.alert(error.message);
    else Alert.alert('Profile updated!');
  }

  return (
    <View style={tw`flex-1 justify-center px-8 bg-white`}>
      <Text style={tw`text-2xl font-bold mb-6 text-center`}>Profile</Text>
      <Text style={tw`mb-2`}>Email: {user.email}</Text>
      <TextInput
        style={tw`border border-gray-300 rounded px-4 py-2 mb-4`}
        placeholder="Display Name"
        value={name}
        onChangeText={setName}
      />
      <View style={tw`flex-row items-center mb-4`}>
        <Text>Are you a musician?</Text>
        <Switch value={isMusician} onValueChange={setIsMusician} />
      </View>
      <Button title={loading ? 'Loading...' : 'Update Profile'} onPress={updateProfile} disabled={loading} />
      <View style={tw`h-2`} />
      <Button title="Sign Out" onPress={onSignOut} />
    </View>
  );
};

export default ProfileScreen; 