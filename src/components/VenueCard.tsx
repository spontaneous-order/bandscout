import React from 'react';
import { View, TouchableOpacity, Animated } from 'react-native';
import { Avatar, Text as PaperText, Chip } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import tw from 'twrnc';
import { BlurView } from 'expo-blur';

interface VenueCardProps {
  item: any;
  selected: boolean;
  onPress: () => void;
}

// NOTE: Glassmorphism only works if this card is rendered on a gradient or image background!
const VenueCard: React.FC<VenueCardProps> = ({ item, selected, onPress }) => (
  <TouchableOpacity onPress={onPress}>
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 16,
        elevation: selected ? 4 : 2,
        borderWidth: 0,
        borderColor: 'transparent',
        marginBottom: 14,
        padding: 0,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOpacity: 0.18,
        shadowRadius: 16,
        backgroundColor: '#23233b',
        borderStyle: 'solid',
      }}
    >
      <View style={{ flex: 1, marginRight: 12, padding: 10 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 2 }}>
          <Avatar.Icon icon="music" size={28} style={{ backgroundColor: '#e0e7ff', marginRight: 8 }} color="#3730a3" />
          <PaperText style={{ fontSize: 16, fontWeight: 'bold', flex: 1 }}>{item.name}</PaperText>
        </View>
        <View style={{ marginBottom: 2 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <MaterialCommunityIcons name="calendar" size={14} color="#6366f1" style={{ marginRight: 4 }} />
            <PaperText style={{ color: '#222', fontWeight: 'bold', fontSize: 14 }}>{item.timeFormattedDate}</PaperText>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 1 }}>
            <MaterialCommunityIcons name="clock-outline" size={14} color="#6366f1" style={{ marginRight: 4 }} />
            <PaperText style={{ color: '#222', fontWeight: 'bold', fontSize: 14 }}>{item.timeFormattedTime}</PaperText>
          </View>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 2 }}>
          <MaterialCommunityIcons name="account" size={14} color="#6366f1" style={{ marginRight: 4 }} />
          <PaperText style={{ color: '#888', fontSize: 13 }}>{item.profiles?.name || 'Unknown'}</PaperText>
        </View>
        {item.music_preferences?.length > 0 && (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 4, alignItems: 'flex-start' }}>
            {item.music_preferences.map((genre: string) => (
              <Chip key={genre} style={{ marginRight: 4, marginBottom: 4, backgroundColor: '#e0e7ff', paddingVertical: 2 }} textStyle={{ color: '#3730a3', fontSize: 11 }}>{genre}</Chip>
            ))}
          </View>
        )}
      </View>
    </View>
  </TouchableOpacity>
);

export default VenueCard; 