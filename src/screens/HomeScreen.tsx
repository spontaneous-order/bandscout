import React from 'react';
import { View, Dimensions } from 'react-native';
import MapView from 'react-native-maps';
import tw from 'twrnc';

const { width, height } = Dimensions.get('window');

const HomeScreen = () => (
  <View style={tw`flex-1`}>
    <MapView
      style={{ width, height }}
      initialRegion={{
        latitude: 37.78825,      // Default center (San Francisco)
        longitude: -122.4324,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      }}
    />
  </View>
);

export default HomeScreen; 