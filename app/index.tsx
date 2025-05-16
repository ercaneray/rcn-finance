import { Redirect } from 'expo-router';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

export default function Index() {
  // Sadece başlangıçta kimlik kontrolü ve yönlendirme yap
  // Auth durumuna göre ya giriş sayfasına ya da ana ekrana yönlendir
  
  // Bu sayfa sadece yönlendirme amaçlı kullanılıyor
  // Kullanıcının oturum durumuna göre uygun sayfaya yönlendirme yapılacak
  
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#4dabf7" />
      <Text style={styles.loadingText}>Yükleniyor...</Text>
      
      <Redirect href="/auth" />
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