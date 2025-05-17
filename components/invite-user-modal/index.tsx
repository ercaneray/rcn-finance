import { Ionicons } from '@expo/vector-icons';
import { FC, PropsWithChildren, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Modal,
    Platform,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { groupService } from '../../services/apis/group-service';
import { styles } from './styles';
import { InviteUserModalProps } from './types';

const InviteUserModal: FC<PropsWithChildren<InviteUserModalProps>> = ({
  visible,
  onClose,
  onSuccess,
  groupId,
  groupName,
  currentUserId,
  currentUserName
}) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchingUser, setSearchingUser] = useState(false);
  const [foundUser, setFoundUser] = useState<{ uid: string; email: string; displayName: string } | null>(null);

  const handleSearchUser = async () => {
    if (!email.trim()) {
      Alert.alert('Hata', 'Lütfen bir e-posta adresi girin.');
      return;
    }

    if (!email.includes('@')) {
      Alert.alert('Hata', 'Geçerli bir e-posta adresi girin.');
      return;
    }

    setSearchingUser(true);
    try {
      const user = await groupService.searchUserByEmail(email.trim());
      setFoundUser(user);
      
      if (!user) {
        Alert.alert('Uyarı', 'Bu e-posta adresine sahip bir kullanıcı bulunamadı.');
      }
    } catch (error) {
      console.error('Kullanıcı aranırken hata:', error);
      Alert.alert('Hata', 'Kullanıcı aranırken bir hata oluştu.');
    } finally {
      setSearchingUser(false);
    }
  };

  const handleInviteUser = async () => {
    if (!foundUser) {
      Alert.alert('Hata', 'Davet etmek için önce bir kullanıcı bulun.');
      return;
    }

    if (foundUser.uid === currentUserId) {
      Alert.alert('Hata', 'Kendinizi davet edemezsiniz.');
      return;
    }

    setLoading(true);
    try {
      // İlk olarak bu kullanıcının zaten grup üyesi olup olmadığını kontrol et
      const groupMembers = await groupService.getGroupMembers(groupId);
      const isAlreadyMember = groupMembers.some(member => member.userId === foundUser.uid);
      
      if (isAlreadyMember) {
        Alert.alert('Bilgi', 'Bu kullanıcı zaten grubun üyesi.');
        setLoading(false);
        return;
      }

      // Sonra bu kullanıcının zaten davet edilip edilmediğini kontrol et
      const userInvitations = await groupService.getUserInvitations(foundUser.email);
      const hasPendingInvitation = userInvitations.some(invitation => 
        invitation.groupId === groupId && invitation.status === 'pending'
      );
      
      if (hasPendingInvitation) {
        Alert.alert('Bilgi', 'Bu kullanıcı zaten gruba davet edilmiş.');
        setLoading(false);
        return;
      }

      // Davetiyeyi oluştur
      const invitation = {
        groupId,
        groupName,
        inviterUserId: currentUserId,
        inviterName: currentUserName,
        invitedEmail: foundUser.email,
        status: 'pending' as const,
        createdAt: Date.now()
      };
      
      await groupService.inviteUserToGroup(invitation);
      
      Alert.alert('Başarılı', `${foundUser.displayName} gruba davet edildi.`);
      
      if (onSuccess) onSuccess();
      
      // Formu ve bulunan kullanıcıyı temizle
      setEmail('');
      setFoundUser(null);
      onClose();
    } catch (error) {
      console.error('Kullanıcı davet edilirken hata:', error);
      Alert.alert('Hata', 'Kullanıcı davet edilirken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.centeredView}
      >
        <View style={styles.modalView}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Kullanıcı Davet Et</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>
          </View>

          <View style={styles.formContainer}>
            <Text style={styles.groupName}>{groupName}</Text>
            
            <View style={styles.searchContainer}>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="Kullanıcı e-posta adresi"
                placeholderTextColor="#777"
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!searchingUser && !loading}
              />
              <TouchableOpacity 
                style={styles.searchButton} 
                onPress={handleSearchUser}
                disabled={searchingUser || loading}
              >
                {searchingUser ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.searchButtonText}>Ara</Text>
                )}
              </TouchableOpacity>
            </View>

            {foundUser && (
              <View style={styles.userResultContainer}>
                <View style={styles.userAvatar}>
                  <Ionicons name="person" size={24} color="#fff" />
                </View>
                <View style={styles.userInfo}>
                  <Text style={styles.userName}>{foundUser.displayName}</Text>
                  <Text style={styles.userEmail}>{foundUser.email}</Text>
                </View>
              </View>
            )}

            <TouchableOpacity 
              style={[
                styles.inviteButton, 
                (!foundUser || loading) && styles.disabledButton
              ]} 
              onPress={handleInviteUser}
              disabled={!foundUser || loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.inviteButtonText}>Davet Et</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

export default InviteUserModal; 