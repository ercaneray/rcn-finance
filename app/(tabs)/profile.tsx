import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { getAuth, signOut, updatePassword, updateProfile } from 'firebase/auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { db } from '../../firebaseConfig';
import { groupService } from '../../services/apis/group-service';
import { COLORS, SHADOWS, SIZES } from '../../services/constants/theme';
import { GroupInvitation } from '../../services/types/group-types';

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
  
  // Modal states
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [showNotificationsModal, setShowNotificationsModal] = useState(false);
  
  // Form states
  const [editDisplayName, setEditDisplayName] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  
  // Notifications states
  const [invitations, setInvitations] = useState<GroupInvitation[]>([]);
  const [loadingInvitations, setLoadingInvitations] = useState(false);

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
      const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
      
      if (userDoc.exists()) {
        const profileData = userDoc.data() as UserProfile;
        setUserProfile(profileData);
        setEditDisplayName(profileData.displayName);
      } else {
        const profileData = {
          displayName: currentUser.displayName || 'İsimsiz Kullanıcı',
          email: currentUser.email || 'Email yok'
        };
        setUserProfile(profileData);
        setEditDisplayName(profileData.displayName);
      }
    } catch (error) {
      console.error('Kullanıcı profili yüklenirken hata:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadInvitations = async () => {
    if (!currentUser?.email) return;
    
    setLoadingInvitations(true);
    try {
      const userInvitations = await groupService.getUserInvitations(currentUser.email);
      setInvitations(userInvitations);
    } catch (error) {
      console.error('Davetler yüklenirken hata:', error);
    } finally {
      setLoadingInvitations(false);
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
    setShowEditProfileModal(true);
  };

  const handleSaveProfile = async () => {
    if (!currentUser || !editDisplayName.trim()) {
      Alert.alert('Hata', 'İsim alanı boş olamaz.');
      return;
    }

    setIsUpdating(true);
    try {
      // Firebase Auth profilini güncelle
      await updateProfile(currentUser, {
        displayName: editDisplayName.trim()
      });

      // Firestore'da kullanıcı belgesini güncelle
      await updateDoc(doc(db, 'users', currentUser.uid), {
        displayName: editDisplayName.trim(),
        updatedAt: Date.now()
      });

      // Local state'i güncelle
      setUserProfile(prev => prev ? { ...prev, displayName: editDisplayName.trim() } : null);
      
      setShowEditProfileModal(false);
      Alert.alert('Başarılı', 'Profil bilgileriniz güncellendi.');
    } catch (error) {
      console.error('Profil güncellenirken hata:', error);
      Alert.alert('Hata', 'Profil güncellenirken bir hata oluştu.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleNotifications = () => {
    setShowNotificationsModal(true);
    loadInvitations();
  };

  const handleChangePassword = () => {
    setShowChangePasswordModal(true);
  };

  const handleSavePassword = async () => {
    if (!newPassword || !confirmPassword || !currentPassword) {
      Alert.alert('Hata', 'Tüm alanları doldurun.');
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert('Hata', 'Yeni şifre en az 6 karakter olmalıdır.');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Hata', 'Yeni şifreler eşleşmiyor.');
      return;
    }

    if (!currentUser) return;

    setIsUpdating(true);
    try {
      await updatePassword(currentUser, newPassword);
      
      setShowChangePasswordModal(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      
      Alert.alert('Başarılı', 'Şifreniz başarıyla değiştirildi.');
    } catch (error: any) {
      console.error('Şifre değiştirilirken hata:', error);
      if (error.code === 'auth/requires-recent-login') {
        Alert.alert('Hata', 'Şifre değiştirmek için tekrar giriş yapmanız gerekiyor.');
      } else {
        Alert.alert('Hata', 'Şifre değiştirilirken bir hata oluştu.');
      }
    } finally {
      setIsUpdating(false);
    }
  };

  const handleInvitationResponse = async (invitationId: string, status: 'accepted' | 'rejected', invitation: GroupInvitation) => {
    try {
      await groupService.updateInvitationStatus(invitationId, status);
      
      if (status === 'accepted' && currentUser) {
        // Kullanıcıyı gruba ekle
        await groupService.addGroupMember({
          groupId: invitation.groupId,
          userId: currentUser.uid,
          name: currentUser.displayName || 'İsimsiz Kullanıcı',
          email: currentUser.email || '',
          role: 'member',
          joinedAt: Date.now()
        });
      }
      
      // Davetleri yeniden yükle
      loadInvitations();
      
      const message = status === 'accepted' 
        ? `"${invitation.groupName}" grubuna katıldınız!`
        : 'Davet reddedildi.';
      
      Alert.alert('Başarılı', message);
    } catch (error) {
      console.error('Davet yanıtlanırken hata:', error);
      Alert.alert('Hata', 'Davet yanıtlanırken bir hata oluştu.');
    }
  };

  const handleAbout = () => {
    Alert.alert(
      "RCN Finance Hakkında",
      "RCN Finance v1.0\n\n" +
      "Akıllı fiş tarama ve grup harcama yönetimi uygulaması.\n\n" +
      "✨ Özellikler:\n" +
      "• OCR teknolojisi ile fiş tarama\n" +
      "• AI destekli harcama analizi\n" +
      "• Grup harcama paylaşımı\n" +
      "• Gerçek zamanlı istatistikler\n" +
      "• Güvenli Firebase entegrasyonu\n\n" +
      "© 2024 RCN Finance\n" +
      "Tüm hakları saklıdır."
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
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Yükleniyor...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.profileImageContainer}>
          <Ionicons name="person" size={60} color={COLORS.text} />
        </View>
        <Text style={styles.name}>{userProfile?.displayName || 'İsimsiz Kullanıcı'}</Text>
        <Text style={styles.email}>{userProfile?.email || 'Email yok'}</Text>
      </View>

      {/* Account Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Hesap Bilgileri</Text>
        
        <TouchableOpacity style={styles.menuItem} onPress={handleEditProfile}>
          <Ionicons name="person-outline" size={24} color={COLORS.primary} style={styles.menuIcon} />
          <Text style={styles.menuText}>Profili Düzenle</Text>
          <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.menuItem} onPress={handleNotifications}>
          <Ionicons name="notifications-outline" size={24} color={COLORS.primary} style={styles.menuIcon} />
          <View style={styles.menuTextContainer}>
            <Text style={styles.menuText}>Bildirimler</Text>
            {invitations.length > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{invitations.length}</Text>
              </View>
            )}
          </View>
          <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.menuItem} onPress={handleChangePassword}>
          <Ionicons name="lock-closed-outline" size={24} color={COLORS.primary} style={styles.menuIcon} />
          <Text style={styles.menuText}>Şifre Değiştir</Text>
          <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
        </TouchableOpacity>
      </View>
      
      {/* Other Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Diğer</Text>
        
        <TouchableOpacity style={styles.menuItem} onPress={handleAbout}>
          <Ionicons name="information-circle-outline" size={24} color={COLORS.primary} style={styles.menuIcon} />
          <Text style={styles.menuText}>Hakkında</Text>
          <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
        </TouchableOpacity>
      </View>
      
      {/* Logout Button */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={20} color="white" style={{ marginRight: 8 }} />
        <Text style={styles.logoutText}>Çıkış Yap</Text>
      </TouchableOpacity>

      {/* Edit Profile Modal */}
      <Modal
        visible={showEditProfileModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowEditProfileModal(false)}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Profili Düzenle</Text>
              <TouchableOpacity onPress={() => setShowEditProfileModal(false)}>
                <Ionicons name="close" size={24} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.modalBody}>
              <Text style={styles.inputLabel}>İsim</Text>
              <TextInput
                style={styles.textInput}
                value={editDisplayName}
                onChangeText={setEditDisplayName}
                placeholder="İsminizi girin"
                placeholderTextColor={COLORS.textSecondary}
              />
              
              <Text style={styles.inputLabel}>Email</Text>
              <TextInput
                style={[styles.textInput, styles.disabledInput]}
                value={userProfile?.email || ''}
                editable={false}
                placeholder="Email değiştirilemez"
                placeholderTextColor={COLORS.textSecondary}
              />
            </View>
            
            <View style={styles.modalFooter}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]} 
                onPress={() => setShowEditProfileModal(false)}
              >
                <Text style={styles.cancelButtonText}>İptal</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.saveButton]} 
                onPress={handleSaveProfile}
                disabled={isUpdating}
              >
                {isUpdating ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text style={styles.saveButtonText}>Kaydet</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Change Password Modal */}
      <Modal
        visible={showChangePasswordModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowChangePasswordModal(false)}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Şifre Değiştir</Text>
              <TouchableOpacity onPress={() => setShowChangePasswordModal(false)}>
                <Ionicons name="close" size={24} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.modalBody}>
              <Text style={styles.inputLabel}>Mevcut Şifre</Text>
              <TextInput
                style={styles.textInput}
                value={currentPassword}
                onChangeText={setCurrentPassword}
                placeholder="Mevcut şifrenizi girin"
                placeholderTextColor={COLORS.textSecondary}
                secureTextEntry
              />
              
              <Text style={styles.inputLabel}>Yeni Şifre</Text>
              <TextInput
                style={styles.textInput}
                value={newPassword}
                onChangeText={setNewPassword}
                placeholder="Yeni şifrenizi girin"
                placeholderTextColor={COLORS.textSecondary}
                secureTextEntry
              />
              
              <Text style={styles.inputLabel}>Yeni Şifre (Tekrar)</Text>
              <TextInput
                style={styles.textInput}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Yeni şifrenizi tekrar girin"
                placeholderTextColor={COLORS.textSecondary}
                secureTextEntry
              />
            </View>
            
            <View style={styles.modalFooter}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]} 
                onPress={() => setShowChangePasswordModal(false)}
              >
                <Text style={styles.cancelButtonText}>İptal</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.saveButton]} 
                onPress={handleSavePassword}
                disabled={isUpdating}
              >
                {isUpdating ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text style={styles.saveButtonText}>Değiştir</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Notifications Modal */}
      <Modal
        visible={showNotificationsModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowNotificationsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.notificationModalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Bildirimler</Text>
              <TouchableOpacity onPress={() => setShowNotificationsModal(false)}>
                <Ionicons name="close" size={24} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.notificationsList}>
              <Text style={styles.sectionTitle}>Grup Davetleri</Text>
              
              {loadingInvitations ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color={COLORS.primary} />
                  <Text style={styles.loadingText}>Davetler yükleniyor...</Text>
                </View>
              ) : invitations.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Ionicons name="mail-outline" size={48} color={COLORS.textSecondary} />
                  <Text style={styles.emptyText}>Henüz grup davetiniz yok</Text>
                </View>
              ) : (
                invitations.map((invitation) => (
                  <View key={invitation.id} style={styles.invitationCard}>
                    <View style={styles.invitationHeader}>
                      <Ionicons name="people" size={24} color={COLORS.primary} />
                      <View style={styles.invitationInfo}>
                        <Text style={styles.invitationGroupName}>{invitation.groupName}</Text>
                        <Text style={styles.invitationInviter}>
                          {invitation.inviterName} tarafından davet edildiniz
                        </Text>
                        <Text style={styles.invitationDate}>
                          {new Date(invitation.createdAt).toLocaleDateString('tr-TR')}
                        </Text>
                      </View>
                    </View>
                    
                    <View style={styles.invitationActions}>
                      <TouchableOpacity 
                        style={[styles.invitationButton, styles.rejectButton]}
                        onPress={() => handleInvitationResponse(invitation.id!, 'rejected', invitation)}
                      >
                        <Text style={styles.rejectButtonText}>Reddet</Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={[styles.invitationButton, styles.acceptButton]}
                        onPress={() => handleInvitationResponse(invitation.id!, 'accepted', invitation)}
                      >
                        <Text style={styles.acceptButtonText}>Kabul Et</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    padding: 30,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  profileImageContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.card,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
    ...SHADOWS.medium,
  },
  name: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 5,
  },
  email: {
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 15,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  menuIcon: {
    marginRight: 15,
  },
  menuText: {
    flex: 1,
    fontSize: 16,
    color: COLORS.text,
  },
  menuTextContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  badge: {
    backgroundColor: COLORS.error,
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 8,
    minWidth: 20,
    alignItems: 'center',
  },
  badgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  logoutButton: {
    margin: 20,
    backgroundColor: COLORS.error,
    padding: 15,
    borderRadius: SIZES.radius,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    ...SHADOWS.small,
  },
  logoutText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  errorText: {
    color: COLORS.error,
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
  },
  loadingText: {
    color: COLORS.text,
    fontSize: 16,
    marginTop: 10,
  },
  loginButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: SIZES.radius,
  },
  loginButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    width: '90%',
    maxHeight: '80%',
    ...SHADOWS.large,
  },
  notificationModalContent: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    width: '90%',
    maxHeight: '80%',
    ...SHADOWS.large,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  modalBody: {
    padding: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
    marginTop: 16,
  },
  textInput: {
    backgroundColor: COLORS.background,
    padding: 16,
    borderRadius: 12,
    color: COLORS.text,
    fontSize: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  disabledInput: {
    backgroundColor: COLORS.darkGray,
    color: COLORS.textSecondary,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    ...SHADOWS.small,
  },
  cancelButton: {
    backgroundColor: COLORS.error,
  },
  saveButton: {
    backgroundColor: COLORS.primary,
  },
  cancelButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  notificationsList: {
    padding: 20,
    maxHeight: 400,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    color: COLORS.textSecondary,
    fontSize: 16,
    marginTop: 12,
    textAlign: 'center',
  },
  invitationCard: {
    backgroundColor: COLORS.background,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    ...SHADOWS.small,
  },
  invitationHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  invitationInfo: {
    flex: 1,
    marginLeft: 12,
  },
  invitationGroupName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
  },
  invitationInviter: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  invitationDate: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  invitationActions: {
    flexDirection: 'row',
    gap: 12,
  },
  invitationButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    ...SHADOWS.small,
  },
  rejectButton: {
    backgroundColor: COLORS.error,
  },
  acceptButton: {
    backgroundColor: COLORS.success,
  },
  rejectButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  acceptButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
}); 