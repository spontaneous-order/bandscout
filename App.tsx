import React from 'react';
import MapView from 'react-native-maps';
import { StyleSheet, View } from 'react-native';

const App: React.FC = () => {
  return (
    <View style={styles.container}>
      <MapView style={styles.map} />
    </View>
  );
};

export default App;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    width: '100%',
    height: '100%',
  },
});
