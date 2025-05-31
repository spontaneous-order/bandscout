import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, ActivityIndicator } from 'react-native';
import tw from 'twrnc';
import { supabase } from '../lib/supabase';

const HomeScreen = () => {
  const [venues, setVenues] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchVenues();
  }, []);

  async function fetchVenues() {
    setLoading(true);
    const { data, error } = await supabase
      .from('venues')
      .select('*, profiles(name, is_musician)')
      .order('time', { ascending: false });
    if (!error && data) setVenues(data);
    setLoading(false);
  }

  return (
    <View style={tw`flex-1 bg-white px-4 pt-8`}> 
      <Text style={tw`text-2xl font-bold mb-4 text-center`}>Venues</Text>
      {loading ? (
        <ActivityIndicator size="large" />
      ) : (
        <FlatList
          data={venues}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <View style={tw`mb-4 p-4 border rounded bg-gray-100`}>
              <Text style={tw`text-lg font-bold`}>{item.name}</Text>
              <Text>Time: {item.time}</Text>
              <Text>By: {item.profiles?.name} ({item.profiles?.is_musician ? 'Musician' : 'User'})</Text>
            </View>
          )}
        />
      )}
    </View>
  );
};

export default HomeScreen; 