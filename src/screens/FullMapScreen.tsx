import React, { useRef, useState } from 'react';
import { View, FlatList, Dimensions, Animated, TouchableOpacity, Modal, Pressable, Platform, Linking, StatusBar, SafeAreaView, Image } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { Text as PaperText, IconButton } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const CARD_WIDTH = Math.min(width * 0.8, 340);
const CARD_SPACING = 16;

export default function FullMapScreen({ venues, onClose }: { venues: any[], onClose: () => void }) {
  const mapRef = useRef<MapView>(null);
  const flatListRef = useRef<FlatList>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [actionSheetVisible, setActionSheetVisible] = useState(false);
  const [actionSheetVenue, setActionSheetVenue] = useState<any>(null);

  const handleSnap = (index: number) => {
    setSelectedIndex(index);
    const venue = venues[index];
    if (venue && mapRef.current && venue.latitude && venue.longitude) {
      mapRef.current.animateToRegion({
        latitude: venue.latitude,
        longitude: venue.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }, 400);
    }
  };

  function formatVenueDate(time: string) {
    try {
      return new Date(time).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return time;
    }
  }
  function formatVenueTimeOnly(time: string) {
    try {
      return new Date(time).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
    } catch {
      return time;
    }
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
  }
  function handleProfile(venue: any) {
    // Implement profile logic here (e.g., navigate to profile)
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#0a001a' }}>
      <StatusBar backgroundColor="#0a001a" barStyle="light-content" />
      <SafeAreaView style={{ flex: 1, backgroundColor: '#0a001a' }}>
        <View style={{ flex: 1, backgroundColor: '#0a001a' }}>
          <MapView
            ref={mapRef}
            style={{ flex: 1, backgroundColor: '#0a001a' }}
            initialRegion={venues[0] && venues[0].latitude && venues[0].longitude ? {
              latitude: venues[0].latitude,
              longitude: venues[0].longitude,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            } : undefined}
            customMapStyle={[
              { elementType: 'geometry', stylers: [{ color: '#23233b' }] },
              { elementType: 'labels.text.stroke', stylers: [{ color: '#23233b' }] },
              { elementType: 'labels.text.fill', stylers: [{ color: '#bdbdbd' }] },
              { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#383858' }] },
              { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#444466' }] },
              { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#a78bfa' }] },
              { featureType: 'poi', elementType: 'geometry', stylers: [{ color: '#2d2d3d' }] },
              { featureType: 'administrative', elementType: 'geometry', stylers: [{ color: '#2d2d3d' }] },
            ]}
          >
            {venues.map((venue: any, i: number) => (
              <Marker
                key={venue.id}
                coordinate={{ latitude: venue.latitude, longitude: venue.longitude }}
                title={venue.name}
                pinColor={i === selectedIndex ? '#a78bfa' : '#222'}
              >
                <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#222', alignItems: 'center', justifyContent: 'center', borderWidth: i === selectedIndex ? 2 : 0, borderColor: i === selectedIndex ? '#a78bfa' : 'transparent' }}>
                  <MaterialCommunityIcons name="music" size={22} color="#a78bfa" />
                </View>
              </Marker>
            ))}
          </MapView>
          <View style={{ position: 'absolute', left: 0, right: 0, bottom: 24, alignItems: 'center' }}>
            <FlatList
              ref={flatListRef}
              data={venues}
              keyExtractor={item => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              snapToInterval={CARD_WIDTH + CARD_SPACING}
              decelerationRate="fast"
              contentContainerStyle={{ paddingHorizontal: (width - CARD_WIDTH) / 2 }}
              renderItem={({ item, index }) => (
                <View
                  style={{
                    width: CARD_WIDTH,
                    marginRight: CARD_SPACING,
                    backgroundColor: '#181825',
                    borderRadius: 16,
                    padding: 16,
                    elevation: 2,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.2,
                    shadowRadius: 4,
                    borderWidth: index === selectedIndex ? 2 : 0,
                    borderColor: index === selectedIndex ? '#a78bfa' : 'transparent',
                    flexDirection: 'row',
                    alignItems: 'center',
                  }}
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
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 10 }}>
                    <TouchableOpacity onPress={() => handleDirections(item)} style={{ marginLeft: 0 }}>
                      <MaterialCommunityIcons name="directions" size={24} color="#a78bfa" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => { setActionSheetVenue(item); setActionSheetVisible(true); }} style={{ marginLeft: 10 }}>
                      <MaterialCommunityIcons name="dots-horizontal" size={24} color="#aaa" />
                    </TouchableOpacity>
                  </View>
                </View>
              )}
              onMomentumScrollEnd={ev => {
                const idx = Math.round(ev.nativeEvent.contentOffset.x / (CARD_WIDTH + CARD_SPACING));
                handleSnap(idx);
              }}
            />
          </View>
        </View>
      </SafeAreaView>
      {/* Action Sheet Modal */}
      <Modal
        visible={actionSheetVisible}
        transparent
        animationType="fade"
        onRequestClose={() => { setActionSheetVisible(false); setActionSheetVenue(null); }}
      >
        <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.7)' }} onPress={() => { setActionSheetVisible(false); setActionSheetVenue(null); }} />
        <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: '#232323', borderTopLeftRadius: 18, borderTopRightRadius: 18, padding: 24, alignItems: 'center' }}>
          <TouchableOpacity onPress={() => handleDirections(actionSheetVenue)} style={{ width: '100%', paddingVertical: 16, alignItems: 'center' }}>
            <MaterialCommunityIcons name="directions" size={22} color="#a78bfa" style={{ marginBottom: 2 }} />
            <PaperText style={{ color: '#fff', fontSize: 16, fontWeight: 'bold' }}>Directions</PaperText>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleProfile(actionSheetVenue)} style={{ width: '100%', paddingVertical: 16, alignItems: 'center' }}>
            <MaterialCommunityIcons name="account" size={22} color="#a78bfa" style={{ marginBottom: 2 }} />
            <PaperText style={{ color: '#fff', fontSize: 16, fontWeight: 'bold' }}>Profile</PaperText>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => { setActionSheetVisible(false); setActionSheetVenue(null); }} style={{ width: '100%', paddingVertical: 16, alignItems: 'center' }}>
            <PaperText style={{ color: '#aaa', fontSize: 16 }}>Cancel</PaperText>
          </TouchableOpacity>
        </View>
      </Modal>
      {/* Fallback dark background */}
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#0a001a', zIndex: -1 }} pointerEvents="none" />
      {/* Close button (top right) */}
      <TouchableOpacity onPress={onClose} style={{ position: 'absolute', top: 36, right: 24, zIndex: 1000, backgroundColor: '#181825', borderRadius: 20, padding: 8 }}>
        <MaterialCommunityIcons name="close" size={28} color="#fff" />
      </TouchableOpacity>
    </View>
  );
} 