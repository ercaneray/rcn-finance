import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as FileSystem from 'expo-file-system';
import { getAuth } from 'firebase/auth';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { groupService } from '../../services/apis/group-service';
import { COLORS, SIZES } from '../../services/constants/theme';
import { Group } from '../../services/types/group-types';

const SERVER_URL = 'http://172.20.10.2:3000';

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

  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<any>(null);
  const auth = getAuth();
  const currentUser = auth.currentUser;

  useEffect(() => {
    if (currentUser) {
      loadGroups();
    }
  }, [currentUser]);

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

  const handleDestinationSelect = (destination: 'personal' | Group) => {
    setSelectedDestination(destination);
    setIsSelecting(false);
    setTimeout(() => {
      let message = destination === 'personal'
        ? 'Fiş kişisel harcama olarak işlenecek'
        : `Fiş "${destination.name}" grubuna eklenecek`;
      Alert.alert('Bilgi', message, [
        {
          text: 'Tamam',
          onPress: () => {
            setCapturedImage(null);
            setSelectedDestination(null);
            setShowDestinationModal(false);
          }
        }
      ]);
    }, 500);
  };

  const cancelCapture = () => {
    setCapturedImage(null);
    setShowDestinationModal(false);
    setSelectedDestination(null);
    setSummaryModalVisible(false);
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

      <Modal
        visible={summaryModalVisible || isProcessing}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setSummaryModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { padding: 20, alignItems: 'center' }]}>
            {isProcessing ? (
              <>
                <ActivityIndicator size="large" color={COLORS.primary} />
                <Text style={{ marginTop: 15 }}>İşleniyor...</Text>
              </>
            ) : (
              <>
                <Text style={styles.modalTitle}>Harcama Özeti</Text>
                <Text style={{ fontSize: 16, marginTop: 10 }}>{summaryData?.açıklama}</Text>
                <Text style={{ fontSize: 18, fontWeight: 'bold', marginTop: 10 }}>Tutar: {summaryData?.tutar} TL</Text>

                <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginTop: 20, width: '100%' }}>
                  <TouchableOpacity onPress={cancelCapture}>
                    <Text style={{ color: 'red' }}>İptal</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => {
                    setIsSelecting(true);
                    setSummaryModalVisible(false);
                  }}>
                    <Text style={{ color: 'green' }}>Devam Et</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => {
                    retryCapture();
                    setSummaryModalVisible(false);
                  }}>
                    <Text style={{ color: 'blue' }}>Yeniden Dene</Text>
                  </TouchableOpacity>
                </View>
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
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    width: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
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
