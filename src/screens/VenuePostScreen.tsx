import React, { useState } from 'react';
import { View, Text, TextInput, Button, Alert, FlatList, TouchableOpacity, Modal, ScrollView, SafeAreaView, Image } from 'react-native';
import { Calendar } from 'react-native-calendars';
import MapView, { Marker } from 'react-native-maps';
import { TextInput as PaperTextInput, Button as PaperButton, Modal as PaperModal, Portal, Dialog, Paragraph, ActivityIndicator as PaperActivityIndicator, Text as PaperText, Chip, Appbar } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../lib/supabase';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';

const GOOGLE_MAPS_APIKEY = 'AIzaSyAcg_Sb3wpRrW_INVPAZq8-Y5qkG73K8AM';

const hours = Array.from({ length: 12 }, (_, i) => (i + 1).toString().padStart(2, '0'));
const minutes = Array.from({ length: 59 }, (_, i) => (i + 1).toString().padStart(2, '0'));
const ampm = ['AM', 'PM'];

const MUSIC_TYPES = [
  'Rock', 'Pop', 'Jazz', 'Hip-Hop', 'Classical', 'Electronic', 'Country', 'Reggae', 'Blues', 'Folk', 'Metal', 'R&B', 'Soul', 'Punk', 'Indie', 'Other'
];

function Dropdown({ value, options, onSelect }: { value: string, options: string[], onSelect: (v: string) => void }) {
  const [visible, setVisible] = useState(false);
  return (
    <View style={{ flex: 1, marginHorizontal: 2 }}>
      <PaperButton mode="outlined" onPress={() => setVisible(true)} style={{ borderRadius: 8, padding: 0 }} labelStyle={{ textAlign: 'center' }}>{value}</PaperButton>
      <Portal>
        <Dialog visible={visible} onDismiss={() => setVisible(false)}>
          <Dialog.Title>Select</Dialog.Title>
          <Dialog.ScrollArea style={{ maxHeight: 300 }}>
            <ScrollView>
              {options.map(opt => (
                <PaperButton key={opt} onPress={() => { onSelect(opt); setVisible(false); }} style={{ justifyContent: 'center' }}>
                  {opt}
                </PaperButton>
              ))}
            </ScrollView>
          </Dialog.ScrollArea>
        </Dialog>
      </Portal>
    </View>
  );
}

const VenuePostScreen = ({ user, profile, onVenuePosted }: { user: any, profile: any, onVenuePosted: () => void }) => {
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [date, setDate] = useState(''); // YYYY-MM-DD
  const [hour, setHour] = useState('12');
  const [minute, setMinute] = useState('00');
  const [ampmValue, setAmpmValue] = useState('PM');
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showMap, setShowMap] = useState(false);
  const navigation = useNavigation();
  const [dialog, setDialog] = useState<{ visible: boolean, message: string }>({ visible: false, message: '' });
  const [selectedMusicTypes, setSelectedMusicTypes] = useState<string[]>([]);
  const [musicTypeDialogVisible, setMusicTypeDialogVisible] = useState(false);
  const [placeId, setPlaceId] = useState<string | null>(null);
  const [selectedDuration, setSelectedDuration] = useState(3); // default 3 hours

  async function fetchSuggestions(input: string) {
    if (!input) {
      setSuggestions([]);
      return;
    }
    const res = await fetch(
      `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(input)}&key=${GOOGLE_MAPS_APIKEY}`
    );
    const json = await res.json();
    setSuggestions(json.predictions || []);
  }

  async function handleSelectSuggestion(item: any) {
    setQuery(item.description);
    setSuggestions([]);
    setPlaceId(item.place_id);
    // Fetch place details for lat/lng
    const res = await fetch(
      `https://maps.googleapis.com/maps/api/place/details/json?placeid=${item.place_id}&key=${GOOGLE_MAPS_APIKEY}`
    );
    const json = await res.json();
    const details = json.result;
    if (details && details.geometry && details.geometry.location) {
      setAddress(details.formatted_address || item.description);
      setLatitude(details.geometry.location.lat);
      setLongitude(details.geometry.location.lng);
    } else {
      setDialog({ visible: true, message: 'Could not get location details for this address. Please try another.' });
      setAddress('');
      setLatitude(null);
      setLongitude(null);
      setPlaceId(null);
    }
  }

  function get24HourTime(hour: string, minute: string, ampmValue: string) {
    let h = parseInt(hour, 10);
    if (ampmValue === 'PM' && h !== 12) h += 12;
    if (ampmValue === 'AM' && h === 12) h = 0;
    return `${h.toString().padStart(2, '0')}:${minute}`;
  }

  async function postVenue() {
    // Clean and trim all fields
    const cleanName = name.trim();
    const cleanAddress = address.trim();
    const cleanDate = date.trim();
    const cleanHour = hour.padStart(2, '0');
    const cleanMinute = minute.padStart(2, '0');
    const cleanAmpm = ampmValue.trim();

    if (!profile.is_musician) {
      setDialog({ visible: true, message: 'Only musicians can post venues.' });
      return;
    }
    if (!cleanName) {
      setDialog({ visible: true, message: 'Please enter a venue name.' });
      return;
    }
    if (!cleanAddress) {
      setDialog({ visible: true, message: 'Please select an address from the suggestions.' });
      return;
    }
    if (latitude === null || longitude === null) {
      setDialog({ visible: true, message: 'Please select an address from the suggestions to get the location.' });
      return;
    }
    if (!cleanDate) {
      setDialog({ visible: true, message: 'Please select a date.' });
      return;
    }
    if (!cleanHour || !cleanMinute || !cleanAmpm) {
      setDialog({ visible: true, message: 'Please select a valid time.' });
      return;
    }
    // Combine date and time as ISO string
    let h = parseInt(cleanHour, 10);
    if (cleanAmpm === 'PM' && h !== 12) h += 12;
    if (cleanAmpm === 'AM' && h === 12) h = 0;
    const time24 = `${h.toString().padStart(2, '0')}:${cleanMinute}`;
    const isoString = `${cleanDate}T${time24}:00`;
    setLoading(true);
    const { error } = await supabase.from('venues').insert({
      name: cleanName,
      address: cleanAddress,
      latitude,
      longitude,
      time: isoString,
      user_id: user.id,
      music_preferences: selectedMusicTypes,
      place_id: placeId,
      duration: selectedDuration,
    });
    setLoading(false);
    if (error) setDialog({ visible: true, message: error.message });
    else {
      setName('');
      setAddress('');
      setLatitude(null);
      setLongitude(null);
      setDate('');
      setHour('12');
      setMinute('00');
      setAmpmValue('PM');
      setQuery('');
      setSuggestions([]);
      if (onVenuePosted) onVenuePosted();
      setDialog({ visible: true, message: 'Venue posted!' });
      navigation.goBack();
    }
  }

  // Default map location (center of US)
  const defaultRegion = {
    latitude: latitude ?? 39.8283,
    longitude: longitude ?? -98.5795,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  };

  return (
    <LinearGradient colors={['#0a001a', '#22004a', '#000']} style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1, backgroundColor: 'transparent' }}>
        <ScrollView contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 0, paddingTop: 32, paddingBottom: 32 }} style={{ backgroundColor: 'transparent' }}>
          {/* Venue Details Card */}
          <View style={{ backgroundColor: '#181825', borderRadius: 16, marginHorizontal: 20, marginBottom: 24, padding: 20, elevation: 2 }}>
            <PaperText style={{ color: '#fff', fontWeight: 'bold', marginBottom: 8 }}>Venue Details</PaperText>
            <PaperTextInput
              label="Venue Name"
              value={name}
              onChangeText={setName}
              dense
              style={{ marginBottom: 16 }}
              theme={{ colors: { text: '#fff', placeholder: '#a1a1aa', background: 'transparent', primary: '#6366f1' } }}
              underlineColor="#6366f1"
              textColor="#fff"
            />
            <View style={{ flexDirection: 'row', marginBottom: 16, alignItems: 'center' }}>
              <PaperTextInput
                label="Venue Address"
                value={query}
                onChangeText={text => {
                  setQuery(text);
                  fetchSuggestions(text);
                }}
                dense
                style={{ flex: 1 }}
                theme={{ colors: { text: '#fff', placeholder: '#a1a1aa', background: 'transparent', primary: '#6366f1' } }}
                underlineColor="#6366f1"
                textColor="#fff"
              />
              <PaperButton mode="contained" onPress={() => setShowMap(true)} style={{ marginLeft: 8, borderRadius: 8, height: 48, justifyContent: 'center', backgroundColor: '#6366f1' }} labelStyle={{ color: '#fff' }}>
                Show Map
              </PaperButton>
            </View>
            {suggestions.length > 0 && (
              <FlatList
                data={suggestions}
                keyExtractor={item => item.place_id}
                renderItem={({ item }) => (
                  <PaperButton
                    onPress={() => handleSelectSuggestion(item)}
                    style={{ justifyContent: 'flex-start', alignItems: 'flex-start', borderBottomWidth: 1, borderColor: '#23233b', backgroundColor: '#181825', borderRadius: 8 }}
                    labelStyle={{ textAlign: 'left', color: '#fff' }}
                    rippleColor="#23233b"
                  >
                    {item.description}
                  </PaperButton>
                )}
                style={{ maxHeight: 150, marginBottom: 8, borderWidth: 1, borderColor: '#23233b', borderRadius: 8, backgroundColor: '#181825' }}
              />
            )}
          </View>
          {/* Date & Time Card */}
          <View style={{ backgroundColor: '#181825', borderRadius: 16, marginHorizontal: 20, marginBottom: 24, padding: 20, elevation: 2 }}>
            <PaperText style={{ color: '#fff', fontWeight: 'bold', marginBottom: 8 }}>Date & Time</PaperText>
            <Calendar
              onDayPress={day => setDate(day.dateString)}
              markedDates={date ? { [date]: { selected: true } } : {}}
              style={{ marginBottom: 16, backgroundColor: '#181825', borderRadius: 12 }}
              theme={{
                backgroundColor: '#181825',
                calendarBackground: '#181825',
                textSectionTitleColor: '#fff',
                dayTextColor: '#fff',
                monthTextColor: '#fff',
                arrowColor: '#a78bfa',
                selectedDayBackgroundColor: '#a78bfa',
                selectedDayTextColor: '#fff',
                todayTextColor: '#a78bfa',
                textDisabledColor: '#444',
                dotColor: '#a78bfa',
                selectedDotColor: '#fff',
              }}
            />
            <PaperText style={{ color: '#fff', fontWeight: 'bold', marginBottom: 8, marginTop: 8 }}>Time</PaperText>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 0 }}>
              <Dropdown value={hour} options={hours} onSelect={setHour} />
              <Dropdown value={minute} options={minutes} onSelect={setMinute} />
              <Dropdown value={ampmValue} options={ampm} onSelect={setAmpmValue} />
            </View>
          </View>
          {/* Duration Card */}
          <View style={{ backgroundColor: '#181825', borderRadius: 16, marginHorizontal: 20, marginBottom: 24, padding: 20, elevation: 2 }}>
            <PaperText style={{ color: '#fff', fontWeight: 'bold', marginBottom: 8 }}>Duration</PaperText>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
              {[1,2,3,4,5,6,7,8].map(hr => (
                <Chip
                  key={hr}
                  selected={selectedDuration === hr}
                  onPress={() => setSelectedDuration(hr)}
                  style={{ marginRight: 8, marginBottom: 8, backgroundColor: selectedDuration === hr ? '#6366f1' : '#23233b', borderRadius: 16, height: 32, paddingHorizontal: 12 }}
                  textStyle={{ color: selectedDuration === hr ? '#fff' : '#a78bfa', fontSize: 13 }}
                >
                  {hr} hour{hr > 1 ? 's' : ''}
                </Chip>
              ))}
            </View>
          </View>
          {/* Music Preferences Card */}
          <View style={{ backgroundColor: '#181825', borderRadius: 16, marginHorizontal: 20, marginBottom: 24, padding: 20, elevation: 2 }}>
            <PaperText style={{ color: '#fff', fontWeight: 'bold', marginBottom: 8 }}>Music Preferences</PaperText>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 8 }}>
              {MUSIC_TYPES.map(type => (
                <Chip
                  key={type}
                  selected={selectedMusicTypes.includes(type)}
                  onPress={() => {
                    setSelectedMusicTypes(selectedMusicTypes.includes(type)
                      ? selectedMusicTypes.filter(t => t !== type)
                      : [...selectedMusicTypes, type]);
                  }}
                  style={{ marginRight: 6, marginBottom: 6, backgroundColor: selectedMusicTypes.includes(type) ? '#6366f1' : '#e0e7ff' }}
                  textStyle={{ color: selectedMusicTypes.includes(type) ? '#fff' : '#3730a3', fontSize: 12 }}
                >
                  {type}
                </Chip>
              ))}
            </View>
          </View>
          {/* Actions Card */}
          <View style={{ backgroundColor: '#181825', borderRadius: 16, marginHorizontal: 20, marginBottom: 0, padding: 20, elevation: 2 }}>
            <PaperButton mode="contained" onPress={postVenue} disabled={loading} style={{ borderRadius: 8, height: 48, justifyContent: 'center', backgroundColor: '#6366f1', marginBottom: 0 }} labelStyle={{ color: '#fff' }}>
              {loading ? <PaperActivityIndicator size="small" /> : 'Post Venue'}
            </PaperButton>
          </View>
        </ScrollView>
        {/* Always render MapView, but only show overlay when showMap is true */}
        <View
          pointerEvents={showMap ? 'auto' : 'none'}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 100,
            display: showMap ? 'flex' : 'none',
            backgroundColor: 'rgba(0,0,0,0.3)'
          }}
        >
          <View style={{ width: '90%', backgroundColor: '#181825', borderRadius: 16, padding: 16, alignItems: 'center' }}>
            <MapView
              style={{ width: '100%', height: 300, borderRadius: 12 }}
              region={defaultRegion}
            >
              {latitude && longitude && (
                <Marker coordinate={{ latitude, longitude }} title={name || 'Venue'} />
              )}
            </MapView>
            <PaperButton mode="contained" onPress={() => setShowMap(false)} style={{ marginTop: 8, borderRadius: 8, backgroundColor: '#6366f1' }} labelStyle={{ color: '#fff' }}>
              Close Map
            </PaperButton>
          </View>
        </View>
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
      </SafeAreaView>
    </LinearGradient>
  );
};

export default VenuePostScreen;