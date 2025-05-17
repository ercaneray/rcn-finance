import { Redirect } from 'expo-router';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

export default function Index() {
  // Test amaçlı doğrudan sekmelere yönlendir
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#4dabf7" />
      <Text style={styles.loadingText}>Yükleniyor...</Text>
      
      <Redirect href="/(tabs)" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    marginTop: 10,
    fontSize: 16,
  }
});