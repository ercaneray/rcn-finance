import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalView: {
    backgroundColor: '#121212',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: '90%',
    width: '100%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
    paddingVertical: 15,
    paddingHorizontal: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  closeButton: {
    padding: 5,
  },
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#4dabf7',
  },
  tabText: {
    color: '#ccc',
    fontWeight: '500',
    fontSize: 16,
  },
  activeTabText: {
    color: '#4dabf7',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    fontSize: 16,
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
    borderBottomColor: '#222',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#4dabf7',
  },
  actionButtonIcon: {
    marginRight: 5,
  },
  actionButtonText: {
    color: '#4dabf7',
    fontWeight: '500',
  },
  leaveButton: {
    borderColor: '#ff6b6b',
  },
  leaveButtonText: {
    color: '#ff6b6b',
  },
  // Üye stilleri
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  memberAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '500',
  },
  memberEmail: {
    fontSize: 14,
    color: '#aaa',
  },
  memberAction: {
    flexDirection: 'column',
    alignItems: 'flex-end',
  },
  memberRole: {
    color: '#4dabf7',
  },
  roleText: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 5,
  },
  ownerRole: {
    color: '#ff9800',
  },
  removeButton: {
    padding: 5,
  },
  // Harcama stilleri
  expenseForm: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  expenseInput: {
    backgroundColor: '#1e1e1e',
    borderRadius: 8,
    padding: 12,
    color: '#fff',
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#333',
    marginBottom: 10,
  },
  addExpenseButton: {
    backgroundColor: '#4dabf7',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  addExpenseText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  expenseItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  expenseDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  expenseAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4dabf7',
    marginRight: 10,
  },
  expenseDescription: {
    fontSize: 16,
    color: '#fff',
    flex: 1,
  },
  expenseUserInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  expenseUserName: {
    fontSize: 14,
    color: '#aaa',
  },
  expenseDate: {
    fontSize: 14,
    color: '#777',
  },
  emptyListContainer: {
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyListText: {
    color: '#777',
    fontSize: 16,
  },
}); 