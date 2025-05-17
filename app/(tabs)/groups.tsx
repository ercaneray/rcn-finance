import { Ionicons } from '@expo/vector-icons';
import { getAuth } from 'firebase/auth';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import CreateGroupModal from '../../components/create-group-modal';
import GroupDetailModal from '../../components/group-detail-modal';
import { groupService } from '../../services/apis/group-service';
import { COLORS, SHADOWS, SIZES } from '../../services/constants/theme';
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
          <ActivityIndicator size="large" color={COLORS.primary} />
        ) : (
          <>
            {/* Üst Başlık */}
            <View style={styles.header}>
              <Text style={styles.title}>Gruplarım</Text>
              <TouchableOpacity style={styles.refreshButton} onPress={handleRefresh}>
                <Ionicons name="refresh" size={SIZES.iconMedium} color={COLORS.primary} />
              </TouchableOpacity>
            </View>

            {/* Davetler Bölümü */}
            {invitations.length > 0 && (
              <View style={styles.invitationsContainer}>
                <Text style={styles.invitationsTitle}>Davetler</Text>
                
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
                        <Ionicons name="checkmark" size={SIZES.iconSmall} color={COLORS.text} />
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={styles.rejectButton}
                        onPress={() => handleRejectInvitation(invitation.id || '')}
                      >
                        <Ionicons name="close" size={SIZES.iconSmall} color={COLORS.text} />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* Gruplarım Bölümü */}
            <View style={styles.groupsSection}>
              {groups.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Ionicons name="people-outline" size={50} color={COLORS.darkGray} />
                  <Text style={styles.emptyText}>Henüz bir grubunuz yok</Text>
                  <Text style={styles.emptySubText}>Yeni bir grup oluşturmak için + butonuna tıklayın</Text>
                </View>
              ) : (
                groups.map((group) => (
                  <TouchableOpacity
                    key={group.id}
                    style={styles.groupCard}
                    onPress={() => setSelectedGroupId(group.id || null)}
                  >
                    <View style={styles.groupInfo}>
                      <Text style={styles.groupName}>{group.name}</Text>
                      <Text style={styles.groupDescription}>
                        {group.description || group.name + ' harcama grubu'}
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={SIZES.iconMedium} color={COLORS.primary} />
                  </TouchableOpacity>
                ))
              )}
            </View>
          </>
        )}
      </ScrollView>
      
      <TouchableOpacity 
        style={styles.addButton}
        onPress={() => setShowCreateModal(true)}
      >
        <Ionicons name="add" size={SIZES.iconMedium} color={COLORS.text} />
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
    backgroundColor: COLORS.background,
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
    fontSize: SIZES.heading,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  refreshButton: {
    padding: 5,
  },
  // Gruplar Bölümü
  groupsSection: {
    padding: 20,
  },
  groupCard: {
    backgroundColor: COLORS.card,
    borderRadius: SIZES.radius,
    padding: 15,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    ...SHADOWS.small,
  },
  groupInfo: {
    flex: 1,
  },
  groupName: {
    fontSize: SIZES.body,
    fontWeight: '500',
    color: COLORS.text,
    marginBottom: 3,
  },
  groupDescription: {
    fontSize: SIZES.small,
    color: COLORS.textSecondary,
  },
  // Davetler Bölümü
  invitationsContainer: {
    padding: 20,
    paddingTop: 0,
    paddingBottom: 5,
  },
  invitationsTitle: {
    fontSize: SIZES.label,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 15,
  },
  invitationCard: {
    backgroundColor: COLORS.card,
    borderRadius: SIZES.radius,
    padding: 15,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    ...SHADOWS.small,
  },
  invitationInfo: {
    flex: 1,
  },
  invitationGroupName: {
    fontSize: SIZES.body,
    fontWeight: '500',
    color: COLORS.text,
    marginBottom: 3,
  },
  invitationSender: {
    fontSize: SIZES.small,
    color: COLORS.textSecondary,
  },
  invitationActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  acceptButton: {
    backgroundColor: COLORS.success,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  rejectButton: {
    backgroundColor: COLORS.error,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Boş içerik
  emptyContainer: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: COLORS.card,
    borderRadius: SIZES.radius,
  },
  emptyText: {
    fontSize: SIZES.body,
    color: COLORS.text,
    marginTop: 10,
  },
  emptySubText: {
    fontSize: SIZES.small,
    color: COLORS.textSecondary,
    marginTop: 5,
    textAlign: 'center',
  },
  errorText: {
    color: COLORS.error,
    fontSize: SIZES.body,
  },
  // Yeni grup ekleme butonu
  addButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: COLORS.primary,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.medium,
  },
}); 