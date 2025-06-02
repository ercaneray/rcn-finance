import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { getAuth } from 'firebase/auth';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Animated,
    Dimensions,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import CreateGroupModal from '../../components/create-group-modal';
import GroupDetailModal from '../../components/group-detail-modal';
import { groupService } from '../../services/apis/group-service';
import { COLORS, SHADOWS, SIZES } from '../../services/constants/theme';
import { Group, GroupInvitation } from '../../services/types/group-types';

const { height } = Dimensions.get('window');

export default function GroupsScreen() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [invitations, setInvitations] = useState<GroupInvitation[]>([]);
  const [loadingInvitations, setLoadingInvitations] = useState(true);
  
  // Animation states
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(50));

  const auth = getAuth();
  const currentUser = auth.currentUser;

  useEffect(() => {
    if (currentUser) {
      loadGroups();
      loadInvitations();
      // Animate page load
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
      ]).start();
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
        <LinearGradient
          colors={['#0f0f23', '#1a1a3a', '#2d1b69'] as const}
          style={styles.backgroundGradient}
        >
          <Text style={styles.errorText}>Giriş yapmanız gerekiyor</Text>
        </LinearGradient>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Background Gradient */}
      <LinearGradient
        colors={['#0f0f23', '#1a1a3a', '#2d1b69'] as const}
        style={styles.backgroundGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {/* Floating background shapes */}
        <View style={styles.backgroundShapes}>
          <View style={[styles.shape, styles.shape1]} />
          <View style={[styles.shape, styles.shape2]} />
          <View style={[styles.shape, styles.shape3]} />
        </View>

        <Animated.View 
          style={[
            styles.content, 
            { 
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          <ScrollView 
            style={styles.scrollView} 
            contentContainerStyle={loading ? styles.centerContent : null}
            showsVerticalScrollIndicator={false}
          >
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={COLORS.primary} />
                <Text style={styles.loadingText}>Gruplar yükleniyor...</Text>
              </View>
            ) : (
              <>
                {/* Header */}
                <View style={styles.header}>
                  <View>
                    <Text style={styles.title}>Gruplarım</Text>
                    <Text style={styles.subTitle}>Paylaşılan harcama grupları</Text>
                  </View>
                  <TouchableOpacity style={styles.avatarContainer}>
                    <LinearGradient
                      colors={['#6366f1', '#8b5cf6', '#d946ef'] as const}
                      style={styles.avatar}
                    >
                      <Text style={styles.avatarText}>
                        {currentUser.displayName ? currentUser.displayName.charAt(0).toUpperCase() : '?'}
                      </Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>

                {/* Davetler Bölümü */}
                {invitations.length > 0 && (
                  <View style={styles.invitationsContainer}>
                    <Text style={styles.sectionTitle}>Bekleyen Davetler</Text>
                    
                    {invitations.map((invitation, index) => (
                      <View key={invitation.id} style={styles.invitationCard}>
                        <LinearGradient
                          colors={['rgba(255, 255, 255, 0.15)', 'rgba(255, 255, 255, 0.05)']}
                          style={styles.invitationCardGradient}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                        >
                          <View style={styles.invitationIconContainer}>
                            <LinearGradient
                              colors={['#f59e0b', '#d97706']}
                              style={styles.invitationIcon}
                            >
                              <Ionicons name="mail" size={20} color="white" />
                            </LinearGradient>
                          </View>
                          
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
                              <LinearGradient
                                colors={['#10b981', '#059669']}
                                style={styles.actionButtonGradient}
                              >
                                <Ionicons name="checkmark" size={18} color="white" />
                              </LinearGradient>
                            </TouchableOpacity>
                            
                            <TouchableOpacity 
                              style={styles.rejectButton}
                              onPress={() => handleRejectInvitation(invitation.id || '')}
                            >
                              <LinearGradient
                                colors={['#ef4444', '#dc2626']}
                                style={styles.actionButtonGradient}
                              >
                                <Ionicons name="close" size={18} color="white" />
                              </LinearGradient>
                            </TouchableOpacity>
                          </View>
                        </LinearGradient>
                      </View>
                    ))}
                  </View>
                )}

                {/* Gruplarım Bölümü */}
                <View style={styles.groupsContainer}>
                  <View style={styles.groupsHeader}>
                    <Text style={styles.sectionTitle}>Aktif Gruplar</Text>
                    <TouchableOpacity style={styles.refreshButton} onPress={handleRefresh}>
                      <LinearGradient
                        colors={['rgba(255, 255, 255, 0.15)', 'rgba(255, 255, 255, 0.05)']}
                        style={styles.refreshButtonGradient}
                      >
                        <Ionicons name="refresh" size={20} color={COLORS.primary} />
                      </LinearGradient>
                    </TouchableOpacity>
                  </View>
                  
                  {groups.length === 0 ? (
                    <View style={styles.emptyCard}>
                      <LinearGradient
                        colors={['rgba(255, 255, 255, 0.15)', 'rgba(255, 255, 255, 0.05)']}
                        style={styles.emptyCardGradient}
                      >
                        <View style={styles.emptyIconContainer}>
                          <LinearGradient
                            colors={['#6366f1', '#8b5cf6']}
                            style={styles.emptyIcon}
                          >
                            <Ionicons name="people-outline" size={32} color="white" />
                          </LinearGradient>
                        </View>
                        <Text style={styles.emptyText}>Henüz bir grubunuz yok</Text>
                        <Text style={styles.emptySubText}>
                          Yeni bir grup oluşturmak için + butonuna tıklayın
                        </Text>
                      </LinearGradient>
                    </View>
                  ) : (
                    groups.map((group, index) => (
                      <TouchableOpacity
                        key={group.id}
                        style={styles.groupCard}
                        onPress={() => setSelectedGroupId(group.id || null)}
                      >
                        <LinearGradient
                          colors={['rgba(255, 255, 255, 0.15)', 'rgba(255, 255, 255, 0.05)']}
                          style={styles.groupCardGradient}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                        >
                          <View style={styles.groupIconContainer}>
                            <LinearGradient
                              colors={index % 2 === 0 ? ['#6366f1', '#8b5cf6'] : ['#10b981', '#059669']}
                              style={styles.groupIcon}
                            >
                              <Ionicons name="people" size={20} color="white" />
                            </LinearGradient>
                          </View>
                          
                          <View style={styles.groupInfo}>
                            <Text style={styles.groupName}>{group.name}</Text>
                            <Text style={styles.groupDescription}>
                              {group.description || group.name + ' harcama grubu'}
                            </Text>
                          </View>
                          
                          <View style={styles.chevronContainer}>
                            <Ionicons name="chevron-forward" size={20} color={COLORS.primary} />
                          </View>
                        </LinearGradient>
                      </TouchableOpacity>
                    ))
                  )}
                </View>
              </>
            )}
          </ScrollView>
        </Animated.View>
      </LinearGradient>
      
      {/* Floating Add Button */}
      <TouchableOpacity 
        style={styles.addButton}
        onPress={() => setShowCreateModal(true)}
      >
        <LinearGradient
          colors={['#6366f1', '#8b5cf6', '#d946ef'] as const}
          style={styles.addButtonGradient}
        >
          <Ionicons name="add" size={28} color="white" />
        </LinearGradient>
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
  subTitle: {
    fontSize: SIZES.body,
    color: COLORS.textSecondary,
  },
  avatarContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
  },
  avatar: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: SIZES.body,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  // Gruplar Bölümü
  groupsContainer: {
    padding: 20,
  },
  groupsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: SIZES.label,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  refreshButton: {
    padding: 5,
  },
  refreshButtonGradient: {
    borderRadius: 10,
    padding: 5,
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
  groupCardGradient: {
    borderRadius: SIZES.radius,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
  },
  groupIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
    marginRight: 10,
  },
  groupIcon: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  chevronContainer: {
    padding: 4,
  },
  // Davetler Bölümü
  invitationsContainer: {
    padding: 20,
    paddingTop: 0,
    paddingBottom: 5,
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
  invitationCardGradient: {
    borderRadius: SIZES.radius,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
  },
  invitationIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
    marginRight: 10,
  },
  invitationIcon: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  actionButtonGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 18,
  },
  // Boş içerik
  emptyCard: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: COLORS.card,
    borderRadius: SIZES.radius,
  },
  emptyCardGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    borderRadius: SIZES.radius,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    overflow: 'hidden',
    marginBottom: 10,
  },
  emptyIcon: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  addButtonGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 28,
  },
  backgroundGradient: {
    flex: 1,
  },
  backgroundShapes: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
  },
  shape: {
    position: 'absolute',
    borderRadius: 100,
    opacity: 0.05,
  },
  shape1: {
    width: 200,
    height: 200,
    backgroundColor: '#6366f1',
    top: -50,
    right: -50,
    borderRadius: 100,
  },
  shape2: {
    width: 150,
    height: 150,
    backgroundColor: '#10b981',
    bottom: 100,
    left: -30,
    borderRadius: 75,
  },
  shape3: {
    width: 100,
    height: 100,
    backgroundColor: '#8b5cf6',
    top: height * 0.3,
    left: 20,
    borderRadius: 50,
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: SIZES.body,
    color: COLORS.text,
    marginTop: 10,
  },
}); 