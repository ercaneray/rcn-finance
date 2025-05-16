import { Ionicons } from '@expo/vector-icons';
import { FC, PropsWithChildren, useState } from 'react';
import {
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
import { CreateGroupModalProps } from './types';

const CreateGroupModal: FC<PropsWithChildren<CreateGroupModalProps>> = ({
  visible,
  onClose,
  onSuccess,
  currentUserId,
  userName,
  email
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreateGroup = async () => {
    if (!name.trim()) {
      Alert.alert('Hata', 'Grup adı boş olamaz.');
      return;
    }

    setLoading(true);
    try {
      // Yeni grup oluştur
      const group = {
        name: name.trim(),
        description: description.trim(),
        createdBy: currentUserId,
        createdAt: Date.now()
      };
      
      const groupId = await groupService.createGroup(group);
      
      // Grup oluştuktan sonra mevcut kullanıcıyı grup sahibi olarak ekle
      const member = {
        groupId,
        userId: currentUserId,
        name: userName,
        email: email,
        role: 'owner' as const,
        joinedAt: Date.now()
      };
      
      await groupService.addGroupMember(member);
      
      // Başarılı işlem
      Alert.alert('Başarılı', 'Grup başarıyla oluşturuldu.');
      setName('');
      setDescription('');
      if (onSuccess) onSuccess();
      onClose();
    } catch (error) {
      console.error('Grup oluşturulurken hata:', error);
      Alert.alert('Hata', 'Grup oluşturulurken bir hata oluştu.');
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
            <Text style={styles.modalTitle}>Yeni Grup Oluştur</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>
          </View>

          <View style={styles.formContainer}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Grup Adı</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Grup adı giriniz"
                placeholderTextColor="#777"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Açıklama (İsteğe bağlı)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={description}
                onChangeText={setDescription}
                placeholder="Grup hakkında kısa bir açıklama"
                placeholderTextColor="#777"
                multiline={true}
                numberOfLines={3}
              />
            </View>

            <TouchableOpacity 
              style={styles.createButton} 
              onPress={handleCreateGroup}
              disabled={loading}
            >
              <Text style={styles.createButtonText}>
                {loading ? 'Oluşturuluyor...' : 'Grup Oluştur'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

export default CreateGroupModal; 