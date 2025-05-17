import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { getAuth, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { db } from '../../firebaseConfig';

interface UserProfile {
  displayName: string;
  email: string;
  createdAt?: string;
}

export default function ProfileScreen() {
  const auth = getAuth();
  const currentUser = auth.currentUser;
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentUser) {
      loadUserProfile();
    } else {
      setLoading(false);
    }
  }, [currentUser]);

  const loadUserProfile = async () => {
    if (!currentUser) return;

    try {
      // Firestore'dan kullanıcı profilini yükleme
      const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
      
      if (userDoc.exists()) {
        setUserProfile(userDoc.data() as UserProfile);
      } else {
        // Firestore'da kullanıcı yoksa, Auth bilgilerini kullan
        setUserProfile({
          displayName: currentUser.displayName || 'İsimsiz Kullanıcı',
          email: currentUser.email || 'Email yok'
        });
      }
    } catch (error) {
      console.error('Kullanıcı profili yüklenirken hata:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      "Çıkış Yap",
      "Hesabınızdan çıkış yapmak istediğinize emin misiniz?",
      [
        { text: "İptal", style: "cancel" },
        { 
          text: "Çıkış Yap", 
          style: "destructive",
          onPress: async () => {
            try {
              await signOut(auth);
              router.replace('/auth');
            } catch (error) {
              console.error('Çıkış yapılırken hata:', error);
              Alert.alert('Hata', 'Çıkış yapılırken bir hata oluştu.');
            }
          }
        }
      ]
    );
  };

  const handleEditProfile = () => {
    Alert.alert("Bilgi", "Profil düzenleme özelliği henüz geliştirme aşamasında.");
  };

  const handleNotifications = () => {
    Alert.alert("Bilgi", "Bildirim ayarları henüz geliştirme aşamasında.");
  };

  const handleChangePassword = () => {
    Alert.alert("Bilgi", "Şifre değiştirme özelliği henüz geliştirme aşamasında.");
  };

  const handleHelp = () => {
    Alert.alert(
      "Yardım",
      "Uygulama hakkında yardım almak için support@finanstakip.com adresine e-posta gönderebilirsiniz."
    );
  };

  const handleAbout = () => {
    Alert.alert(
      "Hakkında",
      "Finans Takip v1.0\nGruplara özel harcama takibi yapmanıza yardımcı olan bir uygulamadır. © 2024"
    );
  };

  if (!currentUser) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Text style={styles.errorText}>Oturum açmanız gerekiyor</Text>
        <TouchableOpacity 
          style={styles.loginButton}
          onPress={() => router.replace('/auth')}
        >
          <Text style={styles.loginButtonText}>Giriş Yap</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#4dabf7" />
        <Text style={styles.loadingText}>Yükleniyor...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.profileImageContainer}>
          <Ionicons name="person" size={60} color="#fff" />
        </View>
        <Text style={styles.name}>{userProfile?.displayName || 'İsimsiz Kullanıcı'}</Text>
        <Text style={styles.email}>{userProfile?.email || 'Email yok'}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Hesap Bilgileri</Text>
        
        <TouchableOpacity style={styles.menuItem} onPress={handleEditProfile}>
          <Ionicons name="person-outline" size={24} color="#4dabf7" style={styles.menuIcon} />
          <Text style={styles.menuText}>Profili Düzenle</Text>
          <Ionicons name="chevron-forward" size={20} color="#777" />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.menuItem} onPress={handleNotifications}>
          <Ionicons name="notifications-outline" size={24} color="#4dabf7" style={styles.menuIcon} />
          <Text style={styles.menuText}>Bildirimler</Text>
          <Ionicons name="chevron-forward" size={20} color="#777" />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.menuItem} onPress={handleChangePassword}>
          <Ionicons name="lock-closed-outline" size={24} color="#4dabf7" style={styles.menuIcon} />
          <Text style={styles.menuText}>Şifre Değiştir</Text>
          <Ionicons name="chevron-forward" size={20} color="#777" />
        </TouchableOpacity>
      </View>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Diğer</Text>
        
        <TouchableOpacity style={styles.menuItem} onPress={handleHelp}>
          <Ionicons name="help-circle-outline" size={24} color="#4dabf7" style={styles.menuIcon} />
          <Text style={styles.menuText}>Yardım</Text>
          <Ionicons name="chevron-forward" size={20} color="#777" />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.menuItem} onPress={handleAbout}>
          <Ionicons name="information-circle-outline" size={24} color="#4dabf7" style={styles.menuIcon} />
          <Text style={styles.menuText}>Hakkında</Text>
          <Ionicons name="chevron-forward" size={20} color="#777" />
        </TouchableOpacity>
      </View>
      
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>Çıkış Yap</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    padding: 30,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  profileImageContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#333',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
  },
  name: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  email: {
    fontSize: 16,
    color: '#aaa',
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 15,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  menuIcon: {
    marginRight: 15,
  },
  menuText: {
    flex: 1,
    fontSize: 16,
    color: '#fff',
  },
  logoutButton: {
    margin: 20,
    backgroundColor: '#ff6b6b',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  logoutText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  errorText: {
    color: '#ff6b6b',
    fontSize: 16,
    marginBottom: 20,
  },
  loadingText: {
    color: '#fff',
    fontSize: 16,
  },
  loginButton: {
    backgroundColor: '#4dabf7',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 8,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
}); 