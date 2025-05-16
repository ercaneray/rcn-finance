import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import React, { useState } from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';
import LoginScreen from '../components/login-screen';
import RegisterScreen from '../components/register-screen';
import { auth, db } from '../firebaseConfig';

export default function Auth() {
  const [isLoginScreen, setIsLoginScreen] = useState(true);

  const handleLogin = async (email: string, password: string) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log('Giriş Başarılı:', userCredential.user);
      // Başarılı girişten sonra ana ekrana yönlendir
      router.replace('/(tabs)');
    } catch (error) {
      console.error('Giriş Hatası:', error);
    }
  };

  const handleRegister = async (email: string, password: string) => {
    try {
      // Yeni kullanıcı oluştur
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Kullanıcı profilini güncelle (email'den bir kullanıcı adı oluştur)
      const displayName = email.split('@')[0];
      await updateProfile(user, {
        displayName: displayName
      });
      
      // Kullanıcıyı Firestore'a ekle
      await setDoc(doc(db, 'users', user.uid), {
        email: email,
        displayName: displayName,
        createdAt: new Date().toISOString()
      });
      
      console.log('Kayıt Başarılı:', user);
      
      // Ana sayfaya yönlendir
      router.replace('/(tabs)');
    } catch (error) {
      console.error('Kayıt Hatası:', error);
      // Hata durumunda giriş ekranına dön
      setIsLoginScreen(true);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      {isLoginScreen ? (
        <LoginScreen 
          onLogin={handleLogin} 
          onRegister={() => setIsLoginScreen(false)}
        />
      ) : (
        <RegisterScreen 
          onRegister={handleRegister}
          onBackToLogin={() => setIsLoginScreen(true)}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
}); 