import { Ionicons } from '@expo/vector-icons';
import { FC, PropsWithChildren, useEffect, useState } from 'react';
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
import { Expense, GroupMember } from '../../services/types/group-types';
import { styles } from './styles';
import { GroupDetailModalProps } from './types';

const GroupDetailModal: FC<PropsWithChildren<GroupDetailModalProps>> = ({
  visible,
  groupId,
  onClose,
  currentUserId
}) => {
  const [activeTab, setActiveTab] = useState<'members' | 'expenses'>('members');
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [groupName, setGroupName] = useState('');
  
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
      
      // Grup üyelerini yükle
      const groupMembers = await groupService.getGroupMembers(groupId);
      setMembers(groupMembers);
      
      // Grup harcamalarını yükle
      const groupExpenses = await expenseService.getGroupExpenses(groupId);
      setExpenses(groupExpenses);
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
      
      // Harcamaları yeniden yükle
      const updatedExpenses = await expenseService.getGroupExpenses(groupId);
      setExpenses(updatedExpenses);
      
      // Formu temizle
      setNewExpense({ amount: '', description: '' });
    } catch (error) {
      console.error('Harcama eklenirken hata:', error);
      Alert.alert('Hata', 'Harcama eklenirken bir hata oluştu.');
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
            <Text style={styles.modalTitle}>{groupName}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>
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
                <FlatList
                  data={members}
                  keyExtractor={(item) => item.id || item.userId}
                  renderItem={({ item }) => (
                    <View style={styles.memberItem}>
                      <View style={styles.memberAvatar}>
                        <Ionicons name="person" size={24} color="#fff" />
                      </View>
                      <View style={styles.memberInfo}>
                        <Text style={styles.memberName}>{item.name}</Text>
                        <Text style={styles.memberEmail}>{item.email}</Text>
                      </View>
                      <View style={styles.memberRole}>
                        <Text style={[
                          styles.roleText, 
                          item.role === 'owner' ? styles.ownerRole : styles.memberRole
                        ]}>
                          {item.role === 'owner' ? 'Sahibi' : 'Üye'}
                        </Text>
                      </View>
                    </View>
                  )}
                />
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
                    renderItem={({ item }) => (
                      <View style={styles.expenseItem}>
                        <View style={styles.expenseDetails}>
                          <Text style={styles.expenseAmount}>{item.amount.toFixed(2)} ₺</Text>
                          <Text style={styles.expenseDescription}>{item.description}</Text>
                        </View>
                        <View style={styles.expenseUserInfo}>
                          <Text style={styles.expenseUserName}>{item.userName}</Text>
                          <Text style={styles.expenseDate}>
                            {new Date(item.createdAt).toLocaleDateString('tr-TR')}
                          </Text>
                        </View>
                      </View>
                    )}
                  />
                </>
              )}
            </>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

export default GroupDetailModal; 