import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { FC, PropsWithChildren, useState } from 'react';
import {
  Alert,
  Animated,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
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
  const [modalAnim] = useState(new Animated.Value(0));

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

  const handleModalShow = () => {
    Animated.timing(modalAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const handleModalHide = () => {
    Animated.timing(modalAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={onClose}
      onShow={handleModalShow}
    >
      <View style={styles.modalOverlay}>
        <LinearGradient
          colors={['rgba(15, 15, 35, 0.95)', 'rgba(26, 26, 58, 0.95)', 'rgba(45, 27, 105, 0.95)']}
          style={styles.modalBackground}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.centeredView}
          >
            <Animated.View 
              style={[
                styles.modalContainer,
                {
                  opacity: modalAnim,
                  transform: [{
                    scale: modalAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.9, 1],
                    }),
                  }],
                }
              ]}
            >
              <LinearGradient
                colors={['rgba(255, 255, 255, 0.15)', 'rgba(255, 255, 255, 0.05)']}
                style={styles.modalView}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                {/* Modal Header */}
                <View style={styles.modalHeader}>
                  <View style={styles.headerIconContainer}>
                    <LinearGradient
                      colors={['#6366f1', '#8b5cf6']}
                      style={styles.headerIcon}
                    >
                      <Ionicons name="people" size={24} color="white" />
                    </LinearGradient>
                  </View>
                  <View style={styles.headerTextContainer}>
                    <Text style={styles.modalTitle}>Yeni Grup Oluştur</Text>
                    <Text style={styles.modalSubtitle}>Arkadaşlarınızla harcamaları paylaşın</Text>
                  </View>
                  <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                    <LinearGradient
                      colors={['rgba(255, 255, 255, 0.2)', 'rgba(255, 255, 255, 0.1)']}
                      style={styles.closeButtonGradient}
                    >
                      <Ionicons name="close" size={20} color="white" />
                    </LinearGradient>
                  </TouchableOpacity>
                </View>

                {/* Form Content */}
                <ScrollView style={styles.formScrollView} showsVerticalScrollIndicator={false}>
                  <View style={styles.formContainer}>
                    {/* Group Name Input */}
                    <View style={styles.inputContainer}>
                      <Text style={styles.label}>Grup Adı *</Text>
                      <View style={styles.inputWrapper}>
                        <LinearGradient
                          colors={['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.05)']}
                          style={styles.inputGradient}
                        >
                          <View style={styles.inputIconContainer}>
                            <Ionicons name="people-outline" size={20} color="#8b5cf6" />
                          </View>
                          <TextInput
                            style={styles.input}
                            value={name}
                            onChangeText={setName}
                            placeholder="Grup adı giriniz"
                            placeholderTextColor="rgba(255, 255, 255, 0.4)"
                            maxLength={50}
                          />
                        </LinearGradient>
                      </View>
                    </View>

                    {/* Description Input */}
                    <View style={styles.inputContainer}>
                      <Text style={styles.label}>Açıklama</Text>
                      <View style={styles.inputWrapper}>
                        <LinearGradient
                          colors={['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.05)']}
                          style={styles.textAreaGradient}
                        >
                          <View style={styles.inputIconContainer}>
                            <Ionicons name="document-text-outline" size={20} color="#10b981" />
                          </View>
                          <TextInput
                            style={[styles.input, styles.textArea]}
                            value={description}
                            onChangeText={setDescription}
                            placeholder="Grup hakkında kısa bir açıklama (isteğe bağlı)"
                            placeholderTextColor="rgba(255, 255, 255, 0.4)"
                            multiline={true}
                            numberOfLines={3}
                            textAlignVertical="top"
                            maxLength={200}
                          />
                        </LinearGradient>
                      </View>
                    </View>

                    {/* Info Card */}
                    <View style={styles.infoCard}>
                      <LinearGradient
                        colors={['rgba(16, 185, 129, 0.15)', 'rgba(16, 185, 129, 0.05)']}
                        style={styles.infoCardGradient}
                      >
                        <View style={styles.infoIconContainer}>
                          <Ionicons name="information-circle" size={20} color="#10b981" />
                        </View>
                        <View style={styles.infoTextContainer}>
                          <Text style={styles.infoTitle}>Grup Oluşturma</Text>
                          <Text style={styles.infoText}>
                            Grubu oluşturduktan sonra arkadaşlarınızı davet edebilirsiniz.
                          </Text>
                        </View>
                      </LinearGradient>
                    </View>

                    {/* Action Buttons */}
                    <View style={styles.buttonContainer}>
                      <TouchableOpacity 
                        style={styles.cancelButton} 
                        onPress={onClose}
                        disabled={loading}
                      >
                        <LinearGradient
                          colors={['rgba(239, 68, 68, 0.2)', 'rgba(220, 38, 38, 0.2)']}
                          style={styles.cancelButtonGradient}
                        >
                          <Ionicons name="close" size={18} color="#ef4444" />
                          <Text style={styles.cancelButtonText}>İptal</Text>
                        </LinearGradient>
                      </TouchableOpacity>

                      <TouchableOpacity 
                        style={styles.createButton} 
                        onPress={handleCreateGroup}
                        disabled={loading || !name.trim()}
                      >
                        <LinearGradient
                          colors={!name.trim() ? ['#4b5563', '#374151'] : ['#6366f1', '#8b5cf6']}
                          style={styles.createButtonGradient}
                        >
                          {loading ? (
                            <>
                              <Ionicons name="refresh" size={18} color="white" />
                              <Text style={styles.createButtonText}>Oluşturuluyor...</Text>
                            </>
                          ) : (
                            <>
                              <Ionicons name="checkmark" size={18} color="white" />
                              <Text style={styles.createButtonText}>Grup Oluştur</Text>
                            </>
                          )}
                        </LinearGradient>
                      </TouchableOpacity>
                    </View>
                  </View>
                </ScrollView>
              </LinearGradient>
            </Animated.View>
          </KeyboardAvoidingView>
        </LinearGradient>
      </View>
    </Modal>
  );
};

export default CreateGroupModal; 