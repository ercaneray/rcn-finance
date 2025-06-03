import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as FileSystem from 'expo-file-system';
import { getAuth } from 'firebase/auth';
import React, { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { expenseService, groupService } from '../../services/apis/group-service';
import { COLORS, SHADOWS, SIZES } from '../../services/constants/theme';
import { Group } from '../../services/types/group-types';

const SERVER_URL = 'http://172.20.10.10:3000';

export default function ScanScreen() {
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showDestinationModal, setShowDestinationModal] = useState(false);
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedDestination, setSelectedDestination] = useState<'personal' | Group | null>(null);
  const [isSelecting, setIsSelecting] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [summaryModalVisible, setSummaryModalVisible] = useState(false);
  const [summaryData, setSummaryData] = useState<{ açıklama: string, tutar: number } | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  // Düzenleme için state'ler
  const [editableAmount, setEditableAmount] = useState<string>('');
  const [editableDescription, setEditableDescription] = useState<string>('');
  const [isEditing, setIsEditing] = useState(false);

  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<any>(null);
  const auth = getAuth();
  const currentUser = auth.currentUser;

  useEffect(() => {
    if (currentUser) {
      loadGroups();
    }
  }, [currentUser]);

  useEffect(() => {
    if (summaryData) {
      setEditableAmount(summaryData.tutar.toString());
      setEditableDescription(summaryData.açıklama);
    }
  }, [summaryData]);

  const loadGroups = async () => {
    if (!currentUser) return;
    try {
      const userGroups = await groupService.getUserGroups(currentUser.uid);
      setGroups(userGroups);
    } catch (error) {
      console.error('Gruplar yüklenirken hata:', error);
    }
  };

  const processReceipt = async (photoUri: string) => {
    try {
      const base64 = await FileSystem.readAsStringAsync(photoUri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      const ocrResponse = await fetch(`${SERVER_URL}/ocr`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ base64: `data:image/jpeg;base64,${base64}` }),
      });

      const { text: ocrText } = await ocrResponse.json();

      const gptResponse = await fetch(`${SERVER_URL}/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ocrText }),
      });

      const result = await gptResponse.json();
      setSummaryData(JSON.parse(result.structuredData));
      setSummaryModalVisible(true);
    } catch (e) {
      console.error('İşleme hatası:', e);
      Alert.alert('Hata', 'Fiş işlenirken bir sorun oluştu.');
    }
  };

  const takePicture = async () => {
    if (!cameraRef.current || !cameraReady) {
      Alert.alert('Hata', 'Kamera hazır değil, lütfen tekrar deneyin.');
      return;
    }
    try {
      setIsProcessing(true);
      const photo = await cameraRef.current.takePictureAsync({ base64: false });
      setCapturedImage(photo.uri);
      await processReceipt(photo.uri);
    } catch (error) {
      console.error('Fotoğraf çekilirken hata:', error);
      Alert.alert('Hata', 'Fotoğraf çekilirken bir sorun oluştu.');
    } finally {
      setIsProcessing(false);
    }
  };

  const validateExpenseData = () => {
    const amount = parseFloat(editableAmount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Hata', 'Lütfen geçerli bir tutar girin.');
      return false;
    }
    if (!editableDescription.trim()) {
      Alert.alert('Hata', 'Lütfen harcama açıklaması girin.');
      return false;
    }
    return true;
  };

  const saveExpense = async (destination: 'personal' | Group) => {
    if (!validateExpenseData() || !currentUser) {
      return;
    }

    setIsSaving(true);
    try {
      const baseExpenseData = {
        amount: parseFloat(editableAmount),
        description: editableDescription.trim(),
        userId: currentUser.uid,
        userName: currentUser.displayName || currentUser.email || 'İsimsiz Kullanıcı',
        createdAt: Date.now(),
      };

      if (destination === 'personal') {
        await expenseService.addPersonalExpense(baseExpenseData);
        Alert.alert('Başarılı!', 'Harcama kişisel giderlerinize eklendi.', [
          {
            text: 'Tamam',
            onPress: () => resetScanState()
          }
        ]);
      } else {
        const groupExpenseData = { ...baseExpenseData, groupId: destination.id };
        await expenseService.addExpense(groupExpenseData);
        Alert.alert('Başarılı!', `Harcama "${destination.name}" grubuna eklendi.`, [
          {
            text: 'Tamam',
            onPress: () => resetScanState()
          }
        ]);
      }
    } catch (error) {
      console.error('Harcama kaydedilirken hata:', error);
      Alert.alert('Hata', 'Harcama kaydedilirken bir sorun oluştu.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDestinationSelect = (destination: 'personal' | Group) => {
    setSelectedDestination(destination);
    setShowDestinationModal(false);
    saveExpense(destination);
  };

  const resetScanState = () => {
    setCapturedImage(null);
    setShowDestinationModal(false);
    setSelectedDestination(null);
    setSummaryModalVisible(false);
    setSummaryData(null);
    setIsSelecting(false);
    setIsEditing(false);
    setEditableAmount('');
    setEditableDescription('');
  };

  const cancelCapture = () => {
    resetScanState();
  };

  const retryCapture = async () => {
    if (capturedImage) {
      setIsProcessing(true);
      await processReceipt(capturedImage);
      setIsProcessing(false);
    }
  };

  const handleCameraReady = () => {
    setCameraReady(true);
  };

  const showDestinationSelection = () => {
    if (!validateExpenseData()) {
      return;
    }
    setSummaryModalVisible(false);
    setShowDestinationModal(true);
  };

  const toggleEditMode = () => {
    setIsEditing(!isEditing);
  };

  const formatCurrency = (amount: string | number) => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (isNaN(numAmount)) return '0 TL';
    return new Intl.NumberFormat('tr-TR', { 
      style: 'currency', 
      currency: 'TRY',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(numAmount);
  };

  if (!permission) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Kamera izni verilmedi</Text>
        <TouchableOpacity
          style={styles.permissionButton}
          onPress={requestPermission}
        >
          <Text style={styles.permissionButtonText}>İzin İste</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {!capturedImage ? (
        <View style={styles.camera}>
          <CameraView
            style={styles.cameraView}
            facing="back"
            onCameraReady={handleCameraReady}
            ref={cameraRef}
          />

          <View style={styles.cameraControls}>
            <View style={styles.cameraButtonContainer}>
              <TouchableOpacity
                style={styles.captureButton}
                onPress={takePicture}
                disabled={isProcessing}
              >
                <View style={styles.captureButtonInner} />
              </TouchableOpacity>
            </View>

            <View style={styles.cameraOverlay}>
              <View style={styles.cameraGuide}>
                <Ionicons name="receipt-outline" size={100} color="rgba(255,255,255,0.5)" />
                <Text style={styles.cameraGuideText}>Fişi kamera çerçevesine sığdırın</Text>
              </View>
            </View>
          </View>
        </View>
      ) : (
        <View style={styles.previewContainer}>
          <Image
            source={{ uri: capturedImage }}
            style={styles.previewImage}
          />
        </View>
      )}

      {/* Enhanced Summary Modal */}
      <Modal
        visible={summaryModalVisible || isProcessing}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setSummaryModalVisible(false)}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.enhancedModalContent}>
            {isProcessing ? (
              <View style={styles.processingContainer}>
                <ActivityIndicator size="large" color={COLORS.primary} />
                <Text style={styles.processingText}>Fiş işleniyor...</Text>
                <Text style={styles.processingSubtext}>OCR ve AI analizi yapılıyor</Text>
              </View>
            ) : (
              <ScrollView showsVerticalScrollIndicator={false}>
                {/* Header */}
                <View style={styles.modalHeader}>
                  <View style={styles.receiptIconContainer}>
                    <Ionicons name="receipt" size={24} color={COLORS.primary} />
                  </View>
                  <Text style={styles.modalTitle}>Harcama Özeti</Text>
                  <TouchableOpacity 
                    style={styles.editButton}
                    onPress={toggleEditMode}
                  >
                    <Ionicons 
                      name={isEditing ? "checkmark" : "pencil"} 
                      size={20} 
                      color={isEditing ? COLORS.success : COLORS.primary} 
                    />
                  </TouchableOpacity>
                </View>

                {/* Expense Details */}
                <View style={styles.expenseDetailsContainer}>
                  {/* Amount Section */}
                  <View style={styles.expenseSection}>
                    <Text style={styles.sectionLabel}>Tutar</Text>
                    {isEditing ? (
                      <View style={styles.inputContainer}>
                        <TextInput
                          style={styles.amountInput}
                          value={editableAmount}
                          onChangeText={setEditableAmount}
                          placeholder="0.00"
                          placeholderTextColor={COLORS.textSecondary}
                          keyboardType="numeric"
                          selectTextOnFocus={true}
                        />
                        <Text style={styles.currencyLabel}>TL</Text>
                      </View>
                    ) : (
                      <View style={styles.displayContainer}>
                        <Text style={styles.amountDisplay}>{formatCurrency(editableAmount)}</Text>
                      </View>
                    )}
                  </View>

                  {/* Description Section */}
                  <View style={styles.expenseSection}>
                    <Text style={styles.sectionLabel}>Açıklama</Text>
                    {isEditing ? (
                      <TextInput
                        style={styles.descriptionInput}
                        value={editableDescription}
                        onChangeText={setEditableDescription}
                        placeholder="Harcama açıklaması..."
                        placeholderTextColor={COLORS.textSecondary}
                        multiline={true}
                        numberOfLines={3}
                        textAlignVertical="top"
                      />
                    ) : (
                      <View style={styles.displayContainer}>
                        <Text style={styles.descriptionDisplay}>{editableDescription}</Text>
                      </View>
                    )}
                  </View>
                </View>

                {/* Action Buttons */}
                <View style={styles.actionButtonsContainer}>
                  <TouchableOpacity 
                    style={[styles.actionButton, styles.secondaryButton]} 
                    onPress={cancelCapture}
                  >
                    <Ionicons name="close" size={20} color={COLORS.error} />
                    <Text style={[styles.actionButtonText, styles.secondaryButtonText]}>
                      İptal
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={[styles.actionButton, styles.primaryButton]} 
                    onPress={showDestinationSelection}
                  >
                    <Ionicons name="checkmark" size={20} color="white" />
                    <Text style={[styles.actionButtonText, styles.primaryButtonText]}>
                      Kaydet
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={[styles.actionButton, styles.tertiaryButton]} 
                    onPress={retryCapture}
                  >
                    <Ionicons name="refresh" size={20} color={COLORS.primary} />
                    <Text style={[styles.actionButtonText, styles.tertiaryButtonText]}>
                      Tekrar Tara
                    </Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            )}
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Destination Selection Modal */}
      <Modal
        visible={showDestinationModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowDestinationModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.destinationModalContent}>
            {isSaving ? (
              <View style={styles.savingContainer}>
                <ActivityIndicator size="large" color={COLORS.primary} />
                <Text style={styles.savingText}>Kaydediliyor...</Text>
              </View>
            ) : (
              <>
                <Text style={styles.destinationModalTitle}>Harcamayı Nereye Kaydetmek İstiyorsunuz?</Text>
                
                <ScrollView style={styles.destinationList}>
                  {/* Personal Expenses Option */}
                  <TouchableOpacity
                    style={styles.destinationOption}
                    onPress={() => handleDestinationSelect('personal')}
                  >
                    <View style={styles.destinationIconContainer}>
                      <Ionicons name="person-outline" size={24} color={COLORS.primary} />
                    </View>
                    <View style={styles.destinationInfo}>
                      <Text style={styles.destinationName}>Kişisel Harcamalar</Text>
                      <Text style={styles.destinationDescription}>Bu harcamayı sadece sizin görebileceğiniz kişisel harcamalarınıza ekleyin</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
                  </TouchableOpacity>

                  {/* Groups */}
                  {groups.length > 0 && (
                    <>
                      <View style={styles.sectionDivider} />
                      <Text style={styles.sectionTitle}>Gruplarım</Text>
                      {groups.map((group) => (
                        <TouchableOpacity
                          key={group.id}
                          style={styles.destinationOption}
                          onPress={() => handleDestinationSelect(group)}
                        >
                          <View style={styles.destinationIconContainer}>
                            <Ionicons name="people-outline" size={24} color={COLORS.primary} />
                          </View>
                          <View style={styles.destinationInfo}>
                            <Text style={styles.destinationName}>{group.name}</Text>
                            <Text style={styles.destinationDescription}>
                              {group.description || 'Bu harcamayı grup üyeleriyle paylaşın'}
                            </Text>
                          </View>
                          <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
                        </TouchableOpacity>
                      ))}
                    </>
                  )}
                </ScrollView>

                <TouchableOpacity
                  style={styles.cancelDestinationButton}
                  onPress={() => setShowDestinationModal(false)}
                >
                  <Text style={styles.cancelDestinationButtonText}>İptal</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
  },
  camera: {
    flex: 1,
    position: 'relative',
  },
  cameraView: {
    flex: 1,
  },
  cameraControls: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 30,
  },
  cameraButtonContainer: {
    position: 'absolute',
    bottom: 30,
    alignSelf: 'center',
    zIndex: 10,
  },
  captureButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.primary,
    borderWidth: 2,
    borderColor: 'white',
  },
  cameraOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraGuide: {
    alignItems: 'center',
  },
  cameraGuideText: {
    color: 'white',
    fontSize: 16,
    marginTop: 10,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  enhancedModalContent: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    width: '90%',
    maxHeight: '85%',
    ...SHADOWS.large,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  receiptIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: `${COLORS.primary}20`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    flex: 1,
  },
  editButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: `${COLORS.primary}15`,
  },
  processingContainer: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  processingText: {
    marginTop: 20,
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    textAlign: 'center',
  },
  processingSubtext: {
    marginTop: 8,
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  expenseDetailsContainer: {
    padding: 20,
  },
  expenseSection: {
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 12,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  amountInput: {
    flex: 1,
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    paddingVertical: 12,
  },
  currencyLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.textSecondary,
    marginLeft: 8,
  },
  displayContainer: {
    backgroundColor: COLORS.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  amountDisplay: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.primary,
    textAlign: 'center',
  },
  descriptionInput: {
    backgroundColor: COLORS.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: COLORS.text,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  descriptionDisplay: {
    fontSize: 16,
    color: COLORS.text,
    lineHeight: 22,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
    ...SHADOWS.small,
  },
  secondaryButton: {
    backgroundColor: COLORS.error,
  },
  primaryButton: {
    backgroundColor: COLORS.success,
  },
  tertiaryButton: {
    backgroundColor: COLORS.primary,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  secondaryButtonText: {
    color: 'white',
  },
  primaryButtonText: {
    color: 'white',
  },
  tertiaryButtonText: {
    color: 'white',
  },
  destinationModalContent: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    width: '90%',
    maxHeight: '80%',
    padding: 20,
  },
  destinationModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    color: COLORS.text,
    marginBottom: 20,
  },
  destinationList: {
    maxHeight: 400,
  },
  destinationOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: COLORS.background,
    borderRadius: 12,
    marginBottom: 12,
  },
  destinationIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.card,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  destinationInfo: {
    flex: 1,
  },
  destinationName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
  },
  destinationDescription: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  sectionDivider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 12,
  },
  cancelDestinationButton: {
    marginTop: 16,
    padding: 12,
    backgroundColor: COLORS.error,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelDestinationButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  savingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  savingText: {
    marginTop: 15,
    fontSize: 16,
    color: COLORS.text,
  },
  errorText: {
    color: COLORS.error,
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
  },
  permissionButton: {
    backgroundColor: COLORS.primary,
    padding: 12,
    borderRadius: SIZES.radius,
  },
  permissionButtonText: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: 'bold',
  },
  previewContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  previewImage: {
    flex: 1,
    resizeMode: 'contain',
  },
});
