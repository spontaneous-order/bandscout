import React, { useEffect, useState, useRef } from 'react';
import { View, FlatList, Dimensions, Animated, ScrollView, TouchableOpacity, Image, Modal, Pressable, SafeAreaView, Linking, Platform } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import { Button, Card, List, ActivityIndicator as PaperActivityIndicator, Text as PaperText, Chip, Avatar, IconButton, Dialog, Portal, Paragraph } from 'react-native-paper';
import { supabase } from '../lib/supabase';
import { format, addDays, endOfWeek, endOfMonth, startOfWeek, startOfMonth, isWithinInterval, parseISO, differenceInMinutes, addHours, isAfter, isBefore } from 'date-fns';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import tw from 'twrnc';
import { FlatList as RNFlatList } from 'react-native';
import { Easing } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import FullMapScreen from './FullMapScreen';
// import { GOOGLE_PLACES_API_KEY } from '../config'; // Adjust path as needed
const GOOGLE_PLACES_API_KEY = 'AIzaSyAcg_Sb3wpRrW_INVPAZq8-Y5qkG73K8AM';

const { height } = Dimensions.get('window');

const MUSIC_TYPES = [
  'Rock', 'Pop', 'Jazz', 'Hip-Hop', 'Classical', 'Electronic', 'Country', 'Reggae', 'Blues', 'Folk', 'Metal', 'R&B', 'Soul', 'Punk', 'Indie', 'Other'
];

const HomeScreen = ({ user, navigation }: { user: any, navigation: any }) => {
  const [venues, setVenues] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [location, setLocation] = useState<any>(null);
  const [locationLoading, setLocationLoading] = useState(true);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [selectedVenueId, setSelectedVenueId] = useState<string | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<{ visible: boolean, venueId: string | null }>({ visible: false, venueId: null });
  const mapRef = useRef<MapView>(null);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedDateRange, setSelectedDateRange] = useState<string>('');
  const [myPreferencesActive, setMyPreferencesActive] = useState(false);
  const [userPreferences, setUserPreferences] = useState<string[]>([]);
  const [filtersVisible, setFiltersVisible] = useState(false);
  const shimmerAnim = useRef(new Animated.Value(0)).current;
  const [actionSheetVisible, setActionSheetVisible] = useState(false);
  const [actionSheetVenue, setActionSheetVenue] = useState<any>(null);
  const [showFullMap, setShowFullMap] = useState(false);

  useEffect(() => {
    fetchVenues();
    getLocation();
    (async () => {
      const { data } = await supabase.from('profiles').select('music_preferences').eq('id', user.id).single();
      setUserPreferences(data?.music_preferences || []);
    })();
  }, [user.id]);

  useEffect(() => {
    if (selectedVenueId) {
      shimmerAnim.setValue(0);
      Animated.loop(
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        })
      ).start();
    } else {
      shimmerAnim.stopAnimation();
    }
  }, [selectedVenueId]);

  async function fetchVenues() {
    setLoading(true);
    const { data, error } = await supabase
      .from('venues')
      .select('*, profiles(name, music_preferences, is_musician)')
      .order('time', { ascending: false });
    if (!error && data) setVenues(data);
    setLoading(false);
  }

  async function getLocation() {
    setLocationLoading(true);
    setLocationError(null);
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationError('Permission to access location was denied');
        setLocationLoading(false);
        return;
      }
      let loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      setLocation(loc.coords);
    } catch (e) {
      setLocationError('Could not get location');
    }
    setLocationLoading(false);
  }

  function handleVenuePress(venue: any) {
    setSelectedVenueId(venue.id);
    if (venue.latitude && venue.longitude && mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: venue.latitude,
        longitude: venue.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }, 500);
    }
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

  const filteredVenues = venues.filter((venue: any) => {
    // Only show events that have not finished
    const start = parseISO(venue.time);
    const duration = typeof venue.duration === 'number' ? venue.duration : 3; // fallback to 3 if missing
    const end = addHours(start, duration);
    const now = new Date();
    if (isAfter(now, end)) return false;

    let typeMatch = true;
    if (myPreferencesActive && userPreferences.length > 0) {
      typeMatch = venue.music_preferences?.some((type: string) => userPreferences.includes(type));
    } else if (selectedTypes.length > 0) {
      typeMatch = venue.music_preferences?.some((type: string) => selectedTypes.includes(type));
    }
    let dateMatch = true;
    if (selectedDateRange) {
      const venueDate = parseISO(venue.time);
      const now = new Date();
      if (selectedDateRange === 'this_week') {
        dateMatch = isWithinInterval(venueDate, { start: startOfWeek(now), end: endOfWeek(now) });
      } else if (selectedDateRange === 'next_week') {
        const nextWeekStart = addDays(endOfWeek(now), 1);
        const nextWeekEnd = addDays(nextWeekStart, 6);
        dateMatch = isWithinInterval(venueDate, { start: nextWeekStart, end: nextWeekEnd });
      } else if (selectedDateRange === 'next_month') {
        const nextMonthStart = addDays(endOfMonth(now), 1);
        const nextMonthEnd = endOfMonth(addDays(endOfMonth(now), 32));
        dateMatch = isWithinInterval(venueDate, { start: nextMonthStart, end: nextMonthEnd });
      }
    }
    return typeMatch && dateMatch;
  });

  const renderChip = ({ item }: { item: { label: string; selected: boolean; onPress: () => void } }) => (
    <Chip
      key={item.label}
      selected={item.selected}
      onPress={item.onPress}
      style={{
        marginRight: 8,
        marginBottom: 4,
        backgroundColor: item.selected ? '#6366f1' : '#e0e7ff',
        height: 32,
        justifyContent: 'center',
        borderRadius: 16,
        paddingHorizontal: 8,
      }}
      textStyle={{ color: item.selected ? '#fff' : '#3730a3', fontSize: 13 }}
    >
      {item.label}
    </Chip>
  );

  const toggleFilters = () => {
    setFiltersVisible(!filtersVisible);
  };

  function openActionSheet(venue: any) {
    setActionSheetVenue(venue);
    setActionSheetVisible(true);
  }
  function closeActionSheet() {
    setActionSheetVisible(false);
    setActionSheetVenue(null);
  }
  function handleDirections(venue: any) {
    let url = '';
    if (venue.latitude && venue.longitude) {
      if (Platform.OS === 'ios') {
        url = `http://maps.apple.com/?daddr=${venue.latitude},${venue.longitude}`;
      } else {
        url = `google.navigation:q=${venue.latitude},${venue.longitude}`;
      }
    } else if (venue.address) {
      const encoded = encodeURIComponent(venue.address);
      if (Platform.OS === 'ios') {
        url = `http://maps.apple.com/?daddr=${encoded}`;
      } else {
        url = `google.navigation:q=${encoded}`;
      }
    }
    if (url) {
      Linking.openURL(url);
    }
    closeActionSheet();
  }
  function handleProfile(venue: any) {
    // Implement profile logic here (e.g., navigate to profile)
    closeActionSheet();
  }

  // Update the darkMapStyle to be lighter and match the app's purple/gray theme
  const darkMapStyle = [
    { elementType: 'geometry', stylers: [{ color: '#23233b' }] },
    { elementType: 'labels.text.stroke', stylers: [{ color: '#23233b' }] },
    { elementType: 'labels.text.fill', stylers: [{ color: '#bdbdbd' }] },
    { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#383858' }] },
    { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#444466' }] },
    { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#a78bfa' }] },
    { featureType: 'poi', elementType: 'geometry', stylers: [{ color: '#2d2d3d' }] },
    { featureType: 'administrative', elementType: 'geometry', stylers: [{ color: '#2d2d3d' }] },
  ];

  const refreshVenues = () => fetchVenues();

  function isEventLive(eventTime: string) {
    // Assume event lasts 3 hours
    const start = parseISO(eventTime);
    const end = addHours(start, 3);
    const now = new Date();
    return isAfter(now, start) && isBefore(now, end);
  }

  return (
    <LinearGradient
      colors={['#0a001a', '#22004a', '#000']}
      style={{ flex: 1 }}
    >
      <SafeAreaView style={{ flex: 1, backgroundColor: 'transparent' }}>
        <View style={{ flex: 1 }}>
          {/* Header */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 32, height: 60, backgroundColor: 'transparent', borderBottomWidth: 2, borderColor: '#222' }}>
            <PaperText style={{ fontSize: 26, fontWeight: 'bold', color: '#fff', letterSpacing: 1 }}>BandScout</PaperText>
            <TouchableOpacity onPress={() => setShowFullMap(true)} style={{ padding: 4 }}>
              <MaterialCommunityIcons name="map" size={28} color="#a78bfa" />
            </TouchableOpacity>
          </View>
          {/* Map Section (smaller) */}
          <View style={{ height: '20%', minHeight: 120, backgroundColor: 'transparent' }}>
            {locationLoading ? (
              <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <PaperActivityIndicator size="large" />
                <PaperText style={{ marginTop: 2 }}>Getting your location...</PaperText>
              </View>
            ) : locationError ? (
              <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <PaperText style={{ color: 'red' }}>{locationError}</PaperText>
              </View>
            ) : (
              <MapView
                ref={mapRef}
                style={{ flex: 1, width: '100%' }}
                region={location ? {
                  latitude: location.latitude,
                  longitude: location.longitude,
                  latitudeDelta: 0.01,
                  longitudeDelta: 0.01,
                } : undefined}
                showsUserLocation={true}
                showsMyLocationButton={true}
                customMapStyle={darkMapStyle}
              >
                {venues.map((venue: any) => (
                  <Marker
                    key={venue.id}
                    coordinate={{ latitude: venue.latitude, longitude: venue.longitude }}
                    title={venue.name}
                    pinColor={selectedVenueId === venue.id ? '#a78bfa' : '#222'}
                  >
                    <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#222', alignItems: 'center', justifyContent: 'center', borderWidth: selectedVenueId === venue.id ? 2 : 0, borderColor: selectedVenueId === venue.id ? '#a78bfa' : 'transparent' }}>
                      <MaterialCommunityIcons name="music" size={22} color="#a78bfa" />
                    </View>
                  </Marker>
                ))}
              </MapView>
            )}
          </View>
          {/* Music Style Filter Bar (directly above the list, consistent pill style) */}
          <View style={{ paddingHorizontal: 12, paddingTop: 12, paddingBottom: 8, backgroundColor: 'transparent' }}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ alignItems: 'center', flexDirection: 'row' }}>
              <Chip
                selected={myPreferencesActive}
                onPress={() => { setMyPreferencesActive(!myPreferencesActive); setSelectedTypes([]); }}
                style={{ marginRight: 8, marginBottom: 4, backgroundColor: myPreferencesActive ? '#23233b' : '#181825', height: 32, justifyContent: 'center', borderRadius: 8, paddingHorizontal: 12 }}
                textStyle={{ color: myPreferencesActive ? '#a78bfa' : '#e0e7ff', fontSize: 13, fontWeight: 'normal' }}
              >
                My Preferences
              </Chip>
              {MUSIC_TYPES.map(type => (
                <Chip
                  key={type}
                  selected={selectedTypes.includes(type) && !myPreferencesActive}
                  onPress={() => {
                    setMyPreferencesActive(false);
                    setSelectedTypes(selectedTypes.includes(type)
                      ? selectedTypes.filter(t => t !== type)
                      : [...selectedTypes, type]);
                  }}
                  style={{ marginRight: 8, marginBottom: 4, backgroundColor: selectedTypes.includes(type) && !myPreferencesActive ? '#23233b' : '#181825', height: 32, justifyContent: 'center', borderRadius: 8, paddingHorizontal: 12 }}
                  textStyle={{ color: selectedTypes.includes(type) && !myPreferencesActive ? '#a78bfa' : '#e0e7ff', fontSize: 13, fontWeight: 'normal' }}
                >
                  {type}
                </Chip>
              ))}
            </ScrollView>
          </View>
          {/* Venue List (Spotify style) */}
          <FlatList
            data={filteredVenues}
            keyExtractor={item => item.id}
            contentContainerStyle={{ paddingHorizontal: 0, paddingBottom: 16, paddingTop: 0 }}
            style={{ flex: 1, backgroundColor: 'transparent' }}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => handleVenuePress(item)}
                activeOpacity={0.7}
                style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 20 }}
              >
                {/* Green dot if event is live */}
                {isEventLive(item.time) && (
                  <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: '#22c55e', marginRight: 8, borderWidth: 2, borderColor: '#111' }} />
                )}
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
                  <PaperText style={{ color: '#aaa', fontSize: 11, marginTop: 2 }} numberOfLines={1}>{item.profiles?.name || 'Unknown'}</PaperText>
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
                <TouchableOpacity onPress={() => handleDirections(item)} style={{ marginLeft: 10 }}>
                  <MaterialCommunityIcons name="directions" size={24} color="#a78bfa" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => openActionSheet(item)} style={{ marginLeft: 10 }}>
                  <MaterialCommunityIcons name="dots-horizontal" size={24} color="#aaa" />
                </TouchableOpacity>
              </TouchableOpacity>
            )}
          />
          {/* Action Sheet Modal */}
          <Modal
            visible={actionSheetVisible}
            transparent
            animationType="fade"
            onRequestClose={closeActionSheet}
          >
            <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.7)' }} onPress={closeActionSheet} />
            <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: '#232323', borderTopLeftRadius: 18, borderTopRightRadius: 18, padding: 24, alignItems: 'center' }}>
              <TouchableOpacity onPress={() => handleDirections(actionSheetVenue)} style={{ width: '100%', paddingVertical: 16, alignItems: 'center' }}>
                <MaterialCommunityIcons name="directions" size={22} color="#a78bfa" style={{ marginBottom: 2 }} />
                <PaperText style={{ color: '#fff', fontSize: 16, fontWeight: 'bold' }}>Directions</PaperText>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleProfile(actionSheetVenue)} style={{ width: '100%', paddingVertical: 16, alignItems: 'center' }}>
                <MaterialCommunityIcons name="account" size={22} color="#a78bfa" style={{ marginBottom: 2 }} />
                <PaperText style={{ color: '#fff', fontSize: 16, fontWeight: 'bold' }}>Profile</PaperText>
              </TouchableOpacity>
              <TouchableOpacity onPress={closeActionSheet} style={{ width: '100%', paddingVertical: 16, alignItems: 'center' }}>
                <PaperText style={{ color: '#aaa', fontSize: 16 }}>Cancel</PaperText>
              </TouchableOpacity>
            </View>
          </Modal>
          {showFullMap && (
            <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 999 }}>
              <FullMapScreen venues={venues} onClose={() => { setShowFullMap(false); fetchVenues(); }} />
            </View>
          )}
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
};

export default HomeScreen; 