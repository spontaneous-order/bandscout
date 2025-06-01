import React, { useEffect, useState, useRef } from 'react';
import { View, FlatList, Dimensions, Animated, TouchableOpacity, Image } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { Appbar, Card, ActivityIndicator as PaperActivityIndicator, Text as PaperText, Chip, Avatar, IconButton, Dialog, Portal, Paragraph, Button } from 'react-native-paper';
import { supabase } from '../lib/supabase';
import { format } from 'date-fns';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import tw from 'twrnc';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native';

const { height } = Dimensions.get('window');

const SkeletonCard = () => {
  const opacity = useRef(new Animated.Value(0.5)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.5, duration: 700, useNativeDriver: true }),
      ])
    ).start();
  }, [opacity]);
  return (
    <Animated.View style={[tw`mb-4 p-4 rounded bg-gray-200 flex-row`, { opacity }]}> 
      <View style={tw`w-10 h-10 rounded-full bg-gray-300`} />
      <View style={tw`ml-4 flex-1`}>
        <View style={tw`w-32 h-4 rounded bg-gray-300 mb-2`} />
        <View style={tw`w-20 h-3 rounded bg-gray-200 mb-1`} />
        <View style={tw`w-24 h-3 rounded bg-gray-200`} />
      </View>
    </Animated.View>
  );
};

const MyVenuesScreen = ({ route, navigation, onVenueDeleted }: any) => {
  const { user } = route.params;
  const [venues, setVenues] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVenueId, setSelectedVenueId] = useState<string | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<{ visible: boolean, venueId: string | null }>({ visible: false, venueId: null });
  const mapRef = useRef<MapView>(null);

  useEffect(() => {
    (async () => {
      await fetchVenues();
    })();
  }, [user.id]);

  async function fetchVenues() {
    setLoading(true);
    const { data, error } = await supabase
      .from('venues')
      .select('*, profiles(name, music_preferences, is_musician)')
      .order('time', { ascending: false });
    if (!error && data) setVenues(data.filter((v: any) => v.user_id === user.id));
    setLoading(false);
  }

  function formatVenueDate(time: string) {
    try {
      return format(new Date(time), 'MMM d, yyyy');
    } catch {
      return time;
    }
  }

  function formatVenueTimeOnly(time: string) {
    try {
      return format(new Date(time), 'h:mm a');
    } catch {
      return time;
    }
  }

  async function handleDeleteVenue(venueId: string) {
    await supabase.from('venues').delete().eq('id', venueId);
    fetchVenues();
    setDeleteDialog({ visible: false, venueId: null });
    if (onVenueDeleted) onVenueDeleted();
  }

  return (
    <LinearGradient colors={['#0a001a', '#22004a', '#000']} style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1, backgroundColor: 'transparent' }}>
        <View style={{ flex: 1 }}>
          {loading ? (
            <View style={{ paddingHorizontal: 12, paddingTop: 16 }}>
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </View>
          ) : venues.length === 0 ? (
            <PaperText style={{ textAlign: 'center', color: 'gray', marginTop: 8 }}>You have not posted any venues.</PaperText>
          ) : (
            <FlatList
              data={venues}
              keyExtractor={item => item.id}
              contentContainerStyle={{ paddingHorizontal: 0, paddingBottom: 16, paddingTop: 0 }}
              renderItem={({ item }) => (
                <TouchableOpacity
                  activeOpacity={0.7}
                  style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 20 }}
                >
                  <View style={{ width: 48, height: 48, borderRadius: 8, backgroundColor: '#222', alignItems: 'center', justifyContent: 'center', marginRight: 16, overflow: 'hidden' }}>
                    {item.profiles?.profile_image_url ? (
                      <Image
                        source={{ uri: item.profiles.profile_image_url }}
                        style={{ width: 44, height: 44, borderRadius: 8 }}
                        resizeMode="cover"
                      />
                    ) : item.profiles?.name ? (
                      <Image
                        source={{ uri: 'https://ui-avatars.com/api/?name=' + encodeURIComponent(item.profiles.name) + '&background=6366f1&color=fff&size=128' }}
                        style={{ width: 44, height: 44, borderRadius: 8 }}
                        resizeMode="cover"
                      />
                    ) : (
                      <MaterialCommunityIcons name="music" size={28} color="#a78bfa" />
                    )}
                  </View>
                  <View style={{ flex: 1 }}>
                    <PaperText style={{ color: '#fff', fontSize: 16, fontWeight: 'bold' }} numberOfLines={1}>{item.name}</PaperText>
                    <PaperText style={{ color: '#888', fontSize: 12 }} numberOfLines={1}>{item.address || ''}</PaperText>
                    <PaperText style={{ color: '#a78bfa', fontSize: 13, fontWeight: 'bold' }} numberOfLines={1}>{formatVenueDate(item.time)} • {formatVenueTimeOnly(item.time)}</PaperText>
                    {item.music_preferences?.length > 0 && (
                      <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 4, alignItems: 'flex-start' }}>
                        {item.music_preferences.map((genre: string) => (
                          <View key={genre} style={{ marginRight: 2, marginBottom: 2, backgroundColor: '#23233b', borderRadius: 8, height: 18, minWidth: 0, paddingHorizontal: 6, alignItems: 'center', justifyContent: 'center' }}>
                            <PaperText style={{ color: '#a78bfa', fontSize: 10, fontWeight: 'normal', lineHeight: 12, padding: 0, margin: 0 }} numberOfLines={1}>{genre}</PaperText>
                          </View>
                        ))}
                      </View>
                    )}
                  </View>
                  <IconButton
                    icon="delete"
                    size={24}
                    style={{ marginLeft: 10, backgroundColor: 'transparent' }}
                    iconColor="#a78bfa"
                    onPress={() => setDeleteDialog({ visible: true, venueId: item.id })}
                    accessibilityLabel="Delete Venue"
                  />
                </TouchableOpacity>
              )}
            />
          )}
          <Portal>
            <Dialog visible={deleteDialog.visible} onDismiss={() => setDeleteDialog({ visible: false, venueId: null })}>
              <Dialog.Title>Delete Venue</Dialog.Title>
              <Dialog.Content>
                <Paragraph>Are you sure you want to delete this venue post? This cannot be undone.</Paragraph>
              </Dialog.Content>
              <Dialog.Actions>
                <Button onPress={() => setDeleteDialog({ visible: false, venueId: null })}>Cancel</Button>
                <Button onPress={() => handleDeleteVenue(deleteDialog.venueId!)} color="red">Delete</Button>
              </Dialog.Actions>
            </Dialog>
          </Portal>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
};

export default MyVenuesScreen; 