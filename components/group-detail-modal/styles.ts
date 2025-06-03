import { StyleSheet } from 'react-native';
import { COLORS, SHADOWS, SIZES } from '../../services/constants/theme';

export const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: COLORS.background,
  },
  modalView: {
    backgroundColor: COLORS.background,
    borderTopLeftRadius: SIZES.radiusLarge,
    borderTopRightRadius: SIZES.radiusLarge,
    height: '90%',
    width: '100%',
    ...SHADOWS.large,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingVertical: 15,
    paddingHorizontal: 20,
  },
  modalTitle: {
    fontSize: SIZES.subheading,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  closeButton: {
    padding: 5,
  },
  // Grup özeti kartı
  summaryCard: {
    margin: 20,
    marginBottom: 10,
    padding: 15,
    backgroundColor: COLORS.card,
    borderRadius: SIZES.radius,
    ...SHADOWS.small,
  },
  summaryTitle: {
    fontSize: SIZES.body,
    color: COLORS.textSecondary,
    marginBottom: 5,
  },
  summaryAmount: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 5,
  },
  summaryInfo: {
    fontSize: SIZES.small,
    color: COLORS.textSecondary,
  },
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: COLORS.primary,
  },
  tabText: {
    color: COLORS.textSecondary,
    fontWeight: '500',
    fontSize: SIZES.body,
  },
  activeTabText: {
    color: COLORS.primary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: COLORS.text,
    fontSize: SIZES.body,
  },
  // Tab içeriği konteyner
  tabContent: {
    flex: 1,
  },
  // Davet etme aksiyonları
  tabActionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: SIZES.radius,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  actionButtonIcon: {
    marginRight: 5,
  },
  actionButtonText: {
    color: COLORS.primary,
    fontWeight: '500',
  },
  leaveButton: {
    borderColor: COLORS.error,
  },
  leaveButtonText: {
    color: COLORS.error,
  },
  // Üye stilleri
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  memberAvatar: {
    width: SIZES.avatarMedium,
    height: SIZES.avatarMedium,
    borderRadius: SIZES.avatarMedium / 2,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  memberInitial: {
    color: COLORS.text,
    fontSize: SIZES.body,
    fontWeight: 'bold',
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: SIZES.body,
    color: COLORS.text,
    fontWeight: '500',
  },
  memberEmail: {
    fontSize: SIZES.small,
    color: COLORS.textSecondary,
  },
  memberAction: {
    flexDirection: 'column',
    alignItems: 'flex-end',
  },
  memberRole: {
    color: COLORS.primary,
  },
  roleText: {
    fontSize: SIZES.small,
    fontWeight: '500',
    marginBottom: 5,
  },
  ownerRole: {
    color: COLORS.warning,
  },
  expenseText: {
    fontSize: SIZES.small,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 5,
  },
  removeButton: {
    padding: 5,
  },
  // Harcama stilleri
  expenseForm: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  expenseInput: {
    backgroundColor: COLORS.card,
    borderRadius: SIZES.radius,
    padding: 12,
    color: COLORS.text,
    fontSize: SIZES.body,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 10,
  },
  addExpenseButton: {
    backgroundColor: COLORS.primary,
    borderRadius: SIZES.radius,
    padding: 12,
    alignItems: 'center',
  },
  addExpenseText: {
    color: COLORS.text,
    fontWeight: 'bold',
  },
  expenseItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  expenseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  spenderAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  spenderInitial: {
    fontSize: SIZES.small,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  expenseInfo: {
    flex: 1,
  },
  expenseDetails: {
    marginLeft: 46, // Avatar genişliği + marginRight
  },
  expenseAmount: {
    fontSize: SIZES.body,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginRight: 10,
  },
  expenseDescription: {
    fontSize: SIZES.body,
    color: COLORS.text,
  },
  expenseUserName: {
    fontSize: SIZES.small,
    fontWeight: '500',
    color: COLORS.text,
  },
  expenseDate: {
    fontSize: SIZES.small,
    color: COLORS.textSecondary,
  },
  emptyListContainer: {
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyListText: {
    color: COLORS.textSecondary,
    fontSize: SIZES.body,
  },
}); 