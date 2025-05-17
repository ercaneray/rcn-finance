import { Ionicons } from '@expo/vector-icons';
import { getAuth } from 'firebase/auth';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import CreateGroupModal from '../../components/create-group-modal';
import GroupDetailModal from '../../components/group-detail-modal';
import { groupService } from '../../services/apis/group-service';
import { Group, GroupInvitation } from '../../services/types/group-types';

export default function GroupsScreen() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [invitations, setInvitations] = useState<GroupInvitation[]>([]);
  const [loadingInvitations, setLoadingInvitations] = useState(true);

  const auth = getAuth();
  const currentUser = auth.currentUser;

  useEffect(() => {
    if (currentUser) {
      loadGroups();
      loadInvitations();
    }
  }, [currentUser]);

  const loadGroups = async () => {
    if (!currentUser) return;
    
    setLoading(true);
    try {
      const userGroups = await groupService.getUserGroups(currentUser.uid);
      setGroups(userGroups);
    } catch (error) {
      console.error('Gruplar yüklenirken hata:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadInvitations = async () => {
    if (!currentUser || !currentUser.email) return;
    
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

  const handleRefresh = () => {
    setRefreshing(true);
    loadGroups();
    loadInvitations();
  };

  const handleCreateGroupSuccess = () => {
    loadGroups();
  };

  const handleAcceptInvitation = async (invitationId: string, groupId: string, groupName: string) => {
    try {
      await groupService.updateInvitationStatus(invitationId, 'accepted');
      
      // Kullanıcıyı gruba ekle
      const member = {
        groupId,
        userId: currentUser?.uid || '',
        name: currentUser?.displayName || 'Kullanıcı',
        email: currentUser?.email || '',
        role: 'member' as const,
        joinedAt: Date.now()
      };
      
      await groupService.addGroupMember(member);
      
      // Davetleri ve grupları yeniden yükle
      loadInvitations();
      loadGroups();
    } catch (error) {
      console.error('Davet kabul edilirken hata:', error);
    }
  };
  
  const handleRejectInvitation = async (invitationId: string) => {
    try {
      await groupService.updateInvitationStatus(invitationId, 'rejected');
      loadInvitations();
    } catch (error) {
      console.error('Davet reddedilirken hata:', error);
    }
  };

  if (!currentUser) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Text style={styles.errorText}>Giriş yapmanız gerekiyor</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={loading ? styles.centerContent : null}>
        {loading ? (
          <ActivityIndicator size="large" color="#4dabf7" />
        ) : (
          <>
            {/* Davetler Bölümü */}
            {invitations.length > 0 && (
              <View style={styles.invitationsContainer}>
                <Text style={styles.invitationsTitle}>Grup Davetleri</Text>
                
                {invitations.map((invitation) => (
                  <View key={invitation.id} style={styles.invitationCard}>
                    <View style={styles.invitationInfo}>
                      <Text style={styles.invitationGroupName}>{invitation.groupName}</Text>
                      <Text style={styles.invitationSender}>
                        {invitation.inviterName} tarafından davet edildiniz
                      </Text>
                    </View>
                    <View style={styles.invitationActions}>
                      <TouchableOpacity 
                        style={styles.acceptButton}
                        onPress={() => handleAcceptInvitation(invitation.id || '', invitation.groupId, invitation.groupName)}
                      >
                        <Ionicons name="checkmark" size={18} color="#fff" />
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={styles.rejectButton}
                        onPress={() => handleRejectInvitation(invitation.id || '')}
                      >
                        <Ionicons name="close" size={18} color="#fff" />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            )}

            <View style={styles.header}>
              <Text style={styles.title}>Gruplarım</Text>
              <TouchableOpacity style={styles.refreshButton} onPress={handleRefresh}>
                <Ionicons name="refresh" size={24} color="#4dabf7" />
              </TouchableOpacity>
            </View>
            
            {groups.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="people-outline" size={50} color="#777" />
                <Text style={styles.emptyText}>Henüz bir grubunuz yok</Text>
                <Text style={styles.emptySubText}>Yeni bir grup oluşturmak için + butonuna tıklayın</Text>
              </View>
            ) : (
              groups.map((group) => (
                <View key={group.id} style={styles.groupCard}>
                  <View style={styles.groupInfo}>
                    <Text style={styles.groupName}>{group.name}</Text>
                    <Text style={styles.groupMembers}>
                      {group.description || 'Açıklama yok'}
                    </Text>
                  </View>
                  <TouchableOpacity 
                    style={styles.viewButton}
                    onPress={() => setSelectedGroupId(group.id || null)}
                  >
                    <Text style={styles.viewButtonText}>Görüntüle</Text>
                  </TouchableOpacity>
                </View>
              ))
            )}
          </>
        )}
      </ScrollView>
      
      <TouchableOpacity 
        style={styles.addButton}
        onPress={() => setShowCreateModal(true)}
      >
        <Ionicons name="add" size={24} color="#fff" />
      </TouchableOpacity>

      {/* Grup Detay Modalı */}
      <GroupDetailModal 
        visible={!!selectedGroupId}
        groupId={selectedGroupId || ''}
        onClose={() => setSelectedGroupId(null)}
        currentUserId={currentUser.uid}
        userName={currentUser.displayName || 'Kullanıcı'}
      />

      {/* Yeni Grup Oluşturma Modalı */}
      <CreateGroupModal 
        visible={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleCreateGroupSuccess}
        currentUserId={currentUser.uid}
        userName={currentUser.displayName || 'Kullanıcı'}
        email={currentUser.email || ''}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  scrollView: {
    flex: 1,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    padding: 20,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  refreshButton: {
    padding: 5,
  },
  groupCard: {
    backgroundColor: '#1e1e1e',
    borderRadius: 10,
    padding: 15,
    marginHorizontal: 20,
    marginBottom: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  groupInfo: {
    flex: 1,
  },
  groupName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  groupMembers: {
    fontSize: 14,
    color: '#aaa',
  },
  viewButton: {
    backgroundColor: '#4dabf7',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 5,
  },
  viewButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  addButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: '#4dabf7',
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    marginTop: 60,
  },
  emptyText: {
    fontSize: 18,
    color: '#fff',
    marginTop: 10,
  },
  emptySubText: {
    fontSize: 14,
    color: '#aaa',
    marginTop: 5,
    textAlign: 'center',
  },
  errorText: {
    color: '#ff6b6b',
    fontSize: 16,
  },
  invitationsContainer: {
    padding: 20,
    marginBottom: 10,
  },
  invitationsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 15,
  },
  invitationCard: {
    backgroundColor: '#1e1e1e',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  invitationInfo: {
    flex: 1,
  },
  invitationGroupName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  invitationSender: {
    fontSize: 14,
    color: '#aaa',
  },
  invitationActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  acceptButton: {
    backgroundColor: '#4dabf7',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  rejectButton: {
    backgroundColor: '#ff6b6b',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
}); 