import { Dimensions, StyleSheet } from 'react-native';
import { COLORS, SHADOWS, SIZES } from '../../services/constants/theme';

const { width } = Dimensions.get('window');

export const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBackground: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  modalContainer: {
    width: width * 0.9,
    maxWidth: 420,
    borderRadius: 16,
    overflow: 'hidden',
    ...SHADOWS.large,
  },
  modalView: {
    borderRadius: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
    marginRight: 14,
  },
  headerIcon: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTextContainer: {
    flex: 1,
  },
  modalTitle: {
    fontSize: SIZES.subheading,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: SIZES.body,
    color: COLORS.textSecondary,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    overflow: 'hidden',
  },
  closeButtonGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  formScrollView: {
    maxHeight: 350,
  },
  formContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  inputContainer: {
    marginBottom: 18,
  },
  label: {
    color: COLORS.text,
    marginBottom: 10,
    fontSize: SIZES.body,
    fontWeight: '600',
  },
  inputWrapper: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  inputGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    height: 54,
  },
  textAreaGradient: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    minHeight: 90,
  },
  inputIconContainer: {
    paddingHorizontal: 14,
    paddingVertical: 16,
  },
  input: {
    flex: 1,
    color: COLORS.text,
    fontSize: SIZES.body,
    paddingVertical: 16,
    paddingRight: 16,
  },
  textArea: {
    minHeight: 70,
    textAlignVertical: 'top',
    paddingTop: 16,
  },
  infoCard: {
    marginBottom: 24,
    borderRadius: 12,
    overflow: 'hidden',
  },
  infoCardGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)',
  },
  infoIconContainer: {
    marginRight: 12,
  },
  infoTextContainer: {
    flex: 1,
  },
  infoTitle: {
    fontSize: SIZES.body,
    fontWeight: '600',
    color: '#10b981',
    marginBottom: 4,
  },
  infoText: {
    fontSize: SIZES.small,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 14,
    paddingTop: 4,
    paddingBottom: 20,
  },
  cancelButton: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  cancelButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 18,
    gap: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  cancelButtonText: {
    color: '#ef4444',
    fontSize: SIZES.body,
    fontWeight: '600',
  },
  createButton: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  createButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 18,
    gap: 8,
    borderRadius: 12,
  },
  createButtonText: {
    color: 'white',
    fontSize: SIZES.body,
    fontWeight: '600',
  },
  loadingIcon: {
    // Animation styles can be added here if needed
  },
}); 