import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    getDoc,
    getDocs,
    orderBy,
    query,
    updateDoc,
    where
} from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { Expense, Group, GroupMember } from '../types/group-types';

// Gruplar için hizmet fonksiyonları
export const groupService = {
  // Kullanıcının tüm gruplarını getir (sahibi olduğu ve üyesi olduğu)
  getUserGroups: async (userId: string): Promise<Group[]> => {
    // Kullanıcının grup üyeliklerini getir
    const membershipQuery = query(
      collection(db, 'group_members'),
      where('userId', '==', userId)
    );
    
    const memberships = await getDocs(membershipQuery);
    const groupIds = memberships.docs.map(doc => doc.data().groupId);
    
    if (groupIds.length === 0) return [];
    
    // Bu grup ID'lerini kullanarak grupları getir
    const groups: Group[] = [];
    
    for (const groupId of groupIds) {
      const groupDoc = await getDoc(doc(db, 'groups', groupId));
      if (groupDoc.exists()) {
        groups.push({ id: groupDoc.id, ...groupDoc.data() } as Group);
      }
    }
    
    return groups;
  },
  
  // Yeni grup oluştur
  createGroup: async (group: Group): Promise<string> => {
    const docRef = await addDoc(collection(db, 'groups'), group);
    return docRef.id;
  },
  
  // Grup üyelerini getir
  getGroupMembers: async (groupId: string): Promise<GroupMember[]> => {
    const membersQuery = query(
      collection(db, 'group_members'),
      where('groupId', '==', groupId)
    );
    
    const members = await getDocs(membersQuery);
    return members.docs.map(doc => ({ id: doc.id, ...doc.data() } as GroupMember));
  },
  
  // Kullanıcıyı gruba ekle
  addGroupMember: async (member: GroupMember): Promise<string> => {
    const docRef = await addDoc(collection(db, 'group_members'), member);
    return docRef.id;
  },
  
  // Grup bilgilerini getir
  getGroupById: async (groupId: string): Promise<Group | null> => {
    const groupDoc = await getDoc(doc(db, 'groups', groupId));
    
    if (!groupDoc.exists()) {
      return null;
    }
    
    return { id: groupDoc.id, ...groupDoc.data() } as Group;
  },
};

// Harcamalar için hizmet fonksiyonları
export const expenseService = {
  // Grup için tüm harcamaları getir
  getGroupExpenses: async (groupId: string): Promise<Expense[]> => {
    const expensesQuery = query(
      collection(db, 'expenses'),
      where('groupId', '==', groupId),
      orderBy('createdAt', 'desc')
    );
    
    const expenses = await getDocs(expensesQuery);
    return expenses.docs.map(doc => ({ id: doc.id, ...doc.data() } as Expense));
  },
  
  // Yeni harcama ekle
  addExpense: async (expense: Expense): Promise<string> => {
    const docRef = await addDoc(collection(db, 'expenses'), expense);
    return docRef.id;
  },
  
  // Harcamayı güncelle
  updateExpense: async (id: string, expense: Partial<Expense>): Promise<void> => {
    await updateDoc(doc(db, 'expenses', id), expense);
  },
  
  // Harcamayı sil
  deleteExpense: async (id: string): Promise<void> => {
    await deleteDoc(doc(db, 'expenses', id));
  },
}; 