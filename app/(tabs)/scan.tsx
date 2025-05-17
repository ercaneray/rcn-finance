import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { getAuth } from 'firebase/auth';
import React, { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { groupService } from '../../services/apis/group-service';
import { COLORS, SHADOWS, SIZES } from '../../services/constants/theme';
import { Group } from '../../services/types/group-types';

export default function ScanScreen() {
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showDestinationModal, setShowDestinationModal] = useState(false);
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedDestination, setSelectedDestination] = useState<'personal' | Group | null>(null);
  const [isSelecting, setIsSelecting] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  
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

  const takePicture = async () => {
    console.log('takePicture - cameraRef.current:', cameraRef.current);
    console.log('takePicture - cameraReady:', cameraReady);
    
    if (!cameraRef.current || !cameraReady) {
      Alert.alert('Hata', 'Kamera hazır değil, lütfen tekrar deneyin.');
      return;
    }
    
    try {
      setIsProcessing(true);
      
      // Burada gelecekte gerçek kamera fonksiyonalitesi eklenecek
      // Şimdilik kamera çekme işini simüle edelim
      setTimeout(() => {
        setIsProcessing(false);
        setCapturedImage('https://via.placeholder.com/300');
        setIsSelecting(true);
      }, 500);
    } catch (error) {
      console.error('Fotoğraf çekilirken hata:', error);
      Alert.alert('Hata', 'Fotoğraf çekilirken bir sorun oluştu.');
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
  };

  const handleCameraReady = () => {
    console.log('Kamera hazır!');
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
          
          {/* Kamera kontrolleri - absolute pozisyonda */}
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
          <View style={styles.previewControls}>
            <TouchableOpacity 
              style={styles.previewButton} 
              onPress={cancelCapture}
            >
              <Ionicons name="close" size={24} color={COLORS.text} />
              <Text style={styles.previewButtonText}>İptal</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.previewButton, styles.confirmButton]} 
              onPress={() => setIsSelecting(true)}
            >
              <Ionicons name="checkmark" size={24} color={COLORS.text} />
              <Text style={styles.previewButtonText}>Devam Et</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Hedef Seçim Modalı */}
      <Modal
        visible={isSelecting}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setIsSelecting(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Harcamayı Nereye Eklemek İstersiniz?</Text>
              <TouchableOpacity onPress={() => setIsSelecting(false)}>
                <Ionicons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.destinationList}>
              <TouchableOpacity
                style={styles.destinationItem}
                onPress={() => handleDestinationSelect('personal')}
              >
                <View style={styles.destinationIcon}>
                  <Ionicons name="person" size={24} color={COLORS.primary} />
                </View>
                <View style={styles.destinationInfo}>
                  <Text style={styles.destinationName}>Kişisel Harcama</Text>
                  <Text style={styles.destinationDescription}>Sadece sizin görebileceğiniz kişisel harcamalarınız</Text>
                </View>
              </TouchableOpacity>
              
              <View style={styles.sectionDivider}>
                <Text style={styles.sectionTitle}>Gruplar</Text>
              </View>
              
              {groups.map(group => (
                <TouchableOpacity
                  key={group.id}
                  style={styles.destinationItem}
                  onPress={() => handleDestinationSelect(group)}
                >
                  <View style={[styles.destinationIcon, {backgroundColor: 'rgba(77, 171, 247, 0.15)'}]}>
                    <Ionicons name="people" size={24} color={COLORS.primary} />
                  </View>
                  <View style={styles.destinationInfo}>
                    <Text style={styles.destinationName}>{group.name}</Text>
                    <Text style={styles.destinationDescription}>
                      {group.description || `${group.name} harcama grubu`}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
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
  previewControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    backgroundColor: COLORS.card,
  },
  previewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: SIZES.radius,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  confirmButton: {
    backgroundColor: COLORS.primary,
  },
  previewButtonText: {
    color: COLORS.text,
    marginLeft: 8,
    fontSize: 16,
  },
  // Modal Stilleri
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    ...SHADOWS.large,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  modalTitle: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: 'bold',
  },
  destinationList: {
    padding: 15,
  },
  destinationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: COLORS.card,
    borderRadius: SIZES.radius,
    marginBottom: 10,
  },
  destinationIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  destinationInfo: {
    flex: 1,
  },
  destinationName: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 5,
  },
  destinationDescription: {
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  sectionDivider: {
    marginVertical: 15,
    paddingVertical: 5,
  },
  sectionTitle: {
    color: COLORS.textSecondary,
    fontSize: 16,
    fontWeight: 'bold',
  },
}); 