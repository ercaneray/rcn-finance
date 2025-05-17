import { Ionicons } from '@expo/vector-icons';
import React, { FC, PropsWithChildren, useEffect, useState } from 'react';
import {
    Alert,
    FlatList,
    KeyboardAvoidingView,
    Modal,
    Platform,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { expenseService, groupService } from '../../services/apis/group-service';
import { COLORS } from '../../services/constants/theme';
import { Expense, GroupMember } from '../../services/types/group-types';
import InviteUserModal from '../invite-user-modal';
import { styles } from './styles';
import { GroupDetailModalProps } from './types';

interface MemberWithExpense extends GroupMember {
  totalExpense: number;
}

const GroupDetailModal: FC<PropsWithChildren<GroupDetailModalProps>> = ({
  visible,
  groupId,
  onClose,
  currentUserId,
  userName
}) => {
  const [activeTab, setActiveTab] = useState<'members' | 'expenses'>('members');
  const [members, setMembers] = useState<MemberWithExpense[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [groupName, setGroupName] = useState('');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [isCurrentUserOwner, setIsCurrentUserOwner] = useState(false);
  
  // Grup özeti bilgileri
  const [totalGroupExpense, setTotalGroupExpense] = useState(0);
  
  // Yeni harcama ekleme
  const [newExpense, setNewExpense] = useState({
    amount: '',
    description: ''
  });

  useEffect(() => {
    if (visible && groupId) {
      loadGroupDetails();
    }
  }, [visible, groupId]);

  const loadGroupDetails = async () => {
    setLoading(true);
    try {
      // Grup bilgilerini yükle
      const group = await groupService.getGroupById(groupId);
      if (group) {
        setGroupName(group.name);
      }
      
      // Grup harcamalarını yükle
      const groupExpenses = await expenseService.getGroupExpenses(groupId);
      setExpenses(groupExpenses);
      
      // Grup üyelerini yükle
      const groupMembers = await groupService.getGroupMembers(groupId);
      
      // Toplam grup harcamasını hesapla
      const total = groupExpenses.reduce((sum, expense) => sum + expense.amount, 0);
      setTotalGroupExpense(total);
      
      // Üye bazında harcama miktarlarını hesapla
      const membersWithExpenses: MemberWithExpense[] = groupMembers.map(member => {
        const memberExpenses = groupExpenses.filter(expense => expense.userId === member.userId);
        const memberTotal = memberExpenses.reduce((sum, expense) => sum + expense.amount, 0);
        return {
          ...member,
          totalExpense: memberTotal
        };
      });
      
      setMembers(membersWithExpenses);
      
      // Mevcut kullanıcının grup sahibi olup olmadığını kontrol et
      const currentMember = groupMembers.find(member => member.userId === currentUserId);
      setIsCurrentUserOwner(currentMember?.role === 'owner');
      
    } catch (error) {
      console.error('Grup detayları yüklenirken hata:', error);
      Alert.alert('Hata', 'Grup bilgileri yüklenirken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddExpense = async () => {
    if (!newExpense.amount || !newExpense.description) {
      Alert.alert('Hata', 'Lütfen tutar ve açıklama giriniz.');
      return;
    }

    const amount = parseFloat(newExpense.amount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Hata', 'Geçerli bir tutar giriniz.');
      return;
    }

    try {
      // Mevcut kullanıcının adını bulmak için üyeler listesinden arayalım
      const currentMember = members.find(member => member.userId === currentUserId);
      const userName = currentMember?.name || 'Bilinmeyen Kullanıcı';
      
      const expense: Expense = {
        amount,
        description: newExpense.description,
        groupId,
        userId: currentUserId,
        userName,
        createdAt: Date.now()
      };
      
      await expenseService.addExpense(expense);
      
      // Grup bilgilerini yeniden yükle
      loadGroupDetails();
      
      // Formu temizle
      setNewExpense({ amount: '', description: '' });
    } catch (error) {
      console.error('Harcama eklenirken hata:', error);
      Alert.alert('Hata', 'Harcama eklenirken bir hata oluştu.');
    }
  };

  const handleRemoveUser = (member: MemberWithExpense) => {
    if (!isCurrentUserOwner) return;
    if (member.userId === currentUserId) {
      Alert.alert('Uyarı', 'Kendinizi gruptan çıkaramazsınız. Gruptan ayrılmak için "Gruptan Ayrıl" seçeneğini kullanın.');
      return;
    }

    Alert.alert(
      'Üyeyi Çıkar',
      `${member.name} üyesini gruptan çıkarmak istediğinize emin misiniz?`,
      [
        { text: 'İptal', style: 'cancel' },
        { 
          text: 'Çıkar', 
          style: 'destructive',
          onPress: async () => {
            try {
              if (!member.id) {
                throw new Error('Üye ID bulunamadı');
              }
              
              await groupService.removeUserFromGroup(member.id);
              
              // Üyeler listesini güncelle
              const updatedMembers = members.filter(m => m.id !== member.id);
              setMembers(updatedMembers);
              
              Alert.alert('Başarılı', 'Üye gruptan çıkarıldı.');
            } catch (error) {
              console.error('Üye çıkarılırken hata:', error);
              Alert.alert('Hata', 'Üye çıkarılırken bir hata oluştu.');
            }
          }
        }
      ]
    );
  };

  const handleLeaveGroup = () => {
    if (isCurrentUserOwner && members.length > 1) {
      Alert.alert(
        'Uyarı',
        'Siz grup sahibisiniz. Gruptan ayrılmadan önce başka bir üyeyi grup sahibi yapmalısınız.',
        [{ text: 'Tamam' }]
      );
      return;
    }

    Alert.alert(
      'Gruptan Ayrıl',
      'Bu gruptan ayrılmak istediğinize emin misiniz?',
      [
        { text: 'İptal', style: 'cancel' },
        { 
          text: 'Ayrıl', 
          style: 'destructive',
          onPress: async () => {
            try {
              await groupService.leaveGroup(currentUserId, groupId);
              Alert.alert('Başarılı', 'Gruptan ayrıldınız.');
              onClose();
            } catch (error) {
              console.error('Gruptan ayrılırken hata:', error);
              Alert.alert('Hata', 'Gruptan ayrılırken bir hata oluştu.');
            }
          }
        }
      ]
    );
  };

  const handleInviteSuccess = () => {
    Alert.alert('Başarılı', 'Kullanıcı gruba davet edildi.');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(amount);
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
            <Text style={styles.modalTitle}>{groupName}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* Grup Özeti Kartı */}
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Toplam Harcama</Text>
            <Text style={styles.summaryAmount}>{formatCurrency(totalGroupExpense)}</Text>
          </View>

          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'members' && styles.activeTab]}
              onPress={() => setActiveTab('members')}
            >
              <Text style={[styles.tabText, activeTab === 'members' && styles.activeTabText]}>Üyeler</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'expenses' && styles.activeTab]}
              onPress={() => setActiveTab('expenses')}
            >
              <Text style={[styles.tabText, activeTab === 'expenses' && styles.activeTabText]}>Harcamalar</Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Yükleniyor...</Text>
            </View>
          ) : (
            <>
              {activeTab === 'members' && (
                <View style={styles.tabContent}>
                  <View style={styles.tabActionsContainer}>
                    <TouchableOpacity 
                      style={styles.actionButton}
                      onPress={() => setShowInviteModal(true)}
                    >
                      <Ionicons name="person-add" size={18} color={COLORS.primary} style={styles.actionButtonIcon} />
                      <Text style={styles.actionButtonText}>Davet Et</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                      style={[styles.actionButton, styles.leaveButton]}
                      onPress={handleLeaveGroup}
                    >
                      <Ionicons name="exit-outline" size={18} color={COLORS.error} style={styles.actionButtonIcon} />
                      <Text style={[styles.actionButtonText, styles.leaveButtonText]}>Gruptan Ayrıl</Text>
                    </TouchableOpacity>
                  </View>

                  <FlatList
                    data={members}
                    keyExtractor={(item) => item.id || item.userId}
                    renderItem={({ item }) => (
                      <View style={styles.memberItem}>
                        <View style={[styles.memberAvatar, item.userId === currentUserId ? {backgroundColor: COLORS.primary} : {backgroundColor: getAvatarColor(item.name)}]}>
                          <Text style={styles.memberInitial}>
                            {item.name.charAt(0).toUpperCase()}
                          </Text>
                        </View>
                        <View style={styles.memberInfo}>
                          <Text style={styles.memberName}>{item.name}</Text>
                          <Text style={styles.memberEmail}>{item.email}</Text>
                        </View>
                        <View style={styles.memberAction}>
                          <Text style={[
                            styles.roleText, 
                            item.role === 'owner' ? styles.ownerRole : styles.memberRole
                          ]}>
                            {item.role === 'owner' ? 'Sahibi' : 'Üye'}
                          </Text>

                          <Text style={styles.expenseText}>
                            {formatCurrency(item.totalExpense)}
                          </Text>

                          {isCurrentUserOwner && item.userId !== currentUserId && (
                            <TouchableOpacity 
                              style={styles.removeButton}
                              onPress={() => handleRemoveUser(item)}
                            >
                              <Ionicons name="close-circle" size={20} color={COLORS.error} />
                            </TouchableOpacity>
                          )}
                        </View>
                      </View>
                    )}
                  />
                </View>
              )}

              {activeTab === 'expenses' && (
                <>
                  <View style={styles.expenseForm}>
                    <TextInput
                      style={styles.expenseInput}
                      value={newExpense.amount}
                      onChangeText={(text) => setNewExpense({...newExpense, amount: text})}
                      placeholder="Tutar"
                      placeholderTextColor="#777"
                      keyboardType="numeric"
                    />
                    <TextInput
                      style={styles.expenseInput}
                      value={newExpense.description}
                      onChangeText={(text) => setNewExpense({...newExpense, description: text})}
                      placeholder="Açıklama"
                      placeholderTextColor="#777"
                    />
                    <TouchableOpacity 
                      style={styles.addExpenseButton}
                      onPress={handleAddExpense}
                    >
                      <Text style={styles.addExpenseText}>Ekle</Text>
                    </TouchableOpacity>
                  </View>
                  
                  <FlatList
                    data={expenses}
                    keyExtractor={(item) => item.id || String(item.createdAt)}
                    renderItem={({ item }) => {
                      // Harcamayı yapan kişiyi bul
                      const spender = members.find(member => member.userId === item.userId);
                      
                      return (
                        <View style={styles.expenseItem}>
                          <View style={styles.expenseHeader}>
                            <View style={[styles.spenderAvatar, {backgroundColor: getAvatarColor(item.userName)}]}>
                              <Text style={styles.spenderInitial}>
                                {item.userName.charAt(0).toUpperCase()}
                              </Text>
                            </View>
                            <View style={styles.expenseInfo}>
                              <Text style={styles.expenseUserName}>{item.userName}</Text>
                              <Text style={styles.expenseDate}>
                                {new Date(item.createdAt).toLocaleDateString('tr-TR')}
                              </Text>
                            </View>
                            <Text style={styles.expenseAmount}>{formatCurrency(item.amount)}</Text>
                          </View>
                          <View style={styles.expenseDetails}>
                            <Text style={styles.expenseDescription}>{item.description}</Text>
                          </View>
                        </View>
                      );
                    }}
                    ListEmptyComponent={
                      <View style={styles.emptyListContainer}>
                        <Text style={styles.emptyListText}>Henüz harcama yok</Text>
                      </View>
                    }
                  />
                </>
              )}
            </>
          )}
        </View>
      </KeyboardAvoidingView>

      <InviteUserModal 
        visible={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        onSuccess={handleInviteSuccess}
        groupId={groupId}
        groupName={groupName}
        currentUserId={currentUserId}
        currentUserName={userName}
      />
    </Modal>
  );
};

// İsme göre avatarlar için renk üretme
const getAvatarColor = (name: string): string => {
  const colors = [
    '#4dabf7', // mavi
    '#ff6b6b', // kırmızı
    '#3dd598', // yeşil
    '#ff9800', // turuncu
    '#7048e8', // mor
    '#f783ac', // pembe
    '#fcc419', // sarı
  ];
  
  // İsmin harflerinin ascii değerlerini topla
  const sum = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  
  // Renk dizisindeki bir rengi seç
  return colors[sum % colors.length];
};

export default GroupDetailModal; 