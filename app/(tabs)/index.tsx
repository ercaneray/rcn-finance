import { Ionicons } from '@expo/vector-icons';
import { getAuth } from 'firebase/auth';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View
} from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { expenseService } from '../../services/apis/group-service';
import { COLORS, SHADOWS, SIZES } from '../../services/constants/theme';
import { Expense } from '../../services/types/group-types';

export default function HomeScreen() {
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [recentExpenses, setRecentExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState<{labels: string[], datasets: {data: number[]}[]}>({
    labels: [],
    datasets: [{data: []}]
  });
  const [originalExpenses, setOriginalExpenses] = useState<Expense[]>([]);
  const [selectedDataPoint, setSelectedDataPoint] = useState<{
    value: number;
    date: string;
    expenses: Expense[];
    index: number;
  } | null>(null);
  
  // Bireysel harcama ekleme için state ve modal
  const [showAddExpenseModal, setShowAddExpenseModal] = useState(false);
  const [showDataPointModal, setShowDataPointModal] = useState(false);
  const [newExpense, setNewExpense] = useState({
    amount: '',
    description: ''
  });
  
  const [activePointIndex, setActivePointIndex] = useState<number | null>(null);
  
  const auth = getAuth();
  const currentUser = auth.currentUser;
  const screenWidth = Dimensions.get('window').width - 40; // Ekran genişliği - margin

  useEffect(() => {
    if (currentUser) {
      loadExpenses();
    }
  }, [currentUser]);

  const loadExpenses = async () => {
    if (!currentUser) return;
    
    setLoading(true);
    try {
      // Bireysel harcamaları getir (groupId olmayan harcamalar)
      const personalExpenses = await expenseService.getPersonalExpenses(currentUser.uid);
      
      // Tüm harcamaları kaydedelim
      setOriginalExpenses(personalExpenses);
      
      // Son harcamaları göster
      const sortedExpenses = personalExpenses.sort((a: Expense, b: Expense) => b.createdAt - a.createdAt).slice(0, 5);
      
      // Toplam hesapla
      const total = personalExpenses.reduce((sum: number, expense: Expense) => sum + expense.amount, 0);
      
      setTotalExpenses(total);
      setRecentExpenses(sortedExpenses);
      
      // Grafik verilerini hazırla
      prepareChartData(personalExpenses);
    } catch (error) {
      console.error('Harcamalar yüklenirken hata:', error);
    } finally {
      setLoading(false);
    }
  };

  const prepareChartData = (expenses: Expense[]) => {
    if (expenses.length === 0) {
      setChartData({
        labels: ['Bugün'],
        datasets: [{data: [0]}]
      });
      return;
    }

    // Tarihleri sırala (en eskiden en yeniye)
    const sortedExpenses = [...expenses].sort((a, b) => a.createdAt - b.createdAt);
    
    // Son 7 günlük veriyi al
    const last7Days = getLastNDays(7);
    const dailyData: Record<string, number> = {};
    const dailyExpenses: Record<string, Expense[]> = {};
    
    // Her gün için 0 değerini ve boş expense dizisi atayarak başla
    last7Days.forEach(day => {
      dailyData[day] = 0;
      dailyExpenses[day] = [];
    });

    // Harcamaları günlere göre topla
    sortedExpenses.forEach(expense => {
      const expenseDate = new Date(expense.createdAt);
      const dateKey = formatDateForKey(expenseDate);
      
      if (dailyData[dateKey] !== undefined) {
        dailyData[dateKey] += expense.amount;
        dailyExpenses[dateKey].push(expense);
      }
    });

    // Birikimli toplam için
    let cumulativeSum = 0;
    const cumulativeData = Object.values(dailyData).map(value => {
      cumulativeSum += value;
      return cumulativeSum;
    });

    // Formatlanmış etiketleri oluştur (kısa tarih gösterimi için)
    const formattedLabels = last7Days.map(day => {
      const date = new Date(day);
      return formatChartLabel(date);
    });

    setChartData({
      labels: formattedLabels,
      datasets: [{
        data: cumulativeData.length > 0 ? cumulativeData : [0]
      }]
    });
  };

  // Son N günü tarih formatında döndürür
  const getLastNDays = (n: number): string[] => {
    const dates: string[] = [];
    for (let i = n - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      dates.push(formatDateForKey(date));
    }
    return dates;
  };

  // Tarih anahtarı formatı (YYYY-MM-DD)
  const formatDateForKey = (date: Date): string => {
    return date.toISOString().split('T')[0];
  };

  // Grafik etiketi için tarih formatı (GG.AA)
  const formatChartLabel = (date: Date): string => {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    return `${day}.${month}`;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(amount);
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit' });
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', hour12: false });
  };

  const handleDataPointClick = (data: any) => {
    if (!data || data.index === undefined || data.value === undefined) {
      return;
    }

    // Set the active point to highlight it
    setActivePointIndex(data.index);

    const index = data.index;
    const dateKey = getLastNDays(7)[index];
    const date = new Date(dateKey);
    
    // Find expenses for this specific day
    const dayExpenses = originalExpenses.filter(expense => {
      const expDate = new Date(expense.createdAt);
      return formatDateForKey(expDate) === dateKey;
    });

    // Calculate total for this day (not cumulative)
    const dayTotal = dayExpenses.reduce((sum, expense) => sum + expense.amount, 0);

    setSelectedDataPoint({
      value: dayTotal, // Use the day's actual total, not cumulative
      date: formatChartLabel(date),
      expenses: dayExpenses.sort((a, b) => b.createdAt - a.createdAt), // Sort by most recent first
      index
    });
    
    // Give haptic feedback if available
    if (Platform.OS === 'ios' || Platform.OS === 'android') {
      try {
        // This is a lightweight way to give feedback without importing a library
        // In a full implementation, you'd use react-native-haptic-feedback
        if (Platform.OS === 'ios') {
          // @ts-ignore - this is available on iOS
          Vibration?.selectionAsync?.();
        }
      } catch (e) {
        console.log('Haptic feedback not available');
      }
    }
    
    setShowDataPointModal(true);
  };

  const handleShowAddExpense = () => {
    setNewExpense({ amount: '', description: '' });
    setShowAddExpenseModal(true);
  };

  const handleAddExpense = async () => {
    if (!newExpense.amount || !newExpense.description) {
      Alert.alert('Hata', 'Lütfen tutar ve açıklama giriniz.');
      return;
    }

    const amount = parseFloat(newExpense.amount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Hata', 'Geçerli bir tutar giriniz.');
      return;
    }

    try {
      const expense: Expense = {
        amount,
        description: newExpense.description,
        userId: currentUser?.uid || '',
        userName: currentUser?.displayName || 'Kullanıcı',
        createdAt: Date.now()
        // No groupId for personal expenses
      };
      
      await expenseService.addPersonalExpense(expense);
      
      // Harcamaları yeniden yükle
      loadExpenses();
      
      // Modalı kapat
      setShowAddExpenseModal(false);
      
      // Başarı mesajı göster
      Alert.alert('Başarılı', 'Harcama başarıyla eklendi.');
    } catch (error) {
      console.error('Harcama eklenirken hata:', error);
      Alert.alert('Hata', 'Harcama eklenirken bir hata oluştu.');
    }
  };

  // Reset active point when modal closes
  const handleCloseDataPointModal = () => {
    setShowDataPointModal(false);
    setTimeout(() => {
      setActivePointIndex(null);
    }, 300); // Wait for modal animation to complete
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
      <ScrollView>
        {/* Üst Bar ve Profil */}
        <View style={styles.header}>
          <View>
            <Text style={styles.welcomeText}>Kişisel Harcamalarım</Text>
          </View>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {currentUser.displayName ? currentUser.displayName.charAt(0).toUpperCase() : '?'}
            </Text>
          </View>
        </View>

        {/* Bakiye Kartı */}
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Toplam Harcama</Text>
          <Text style={styles.balanceAmount}>{formatCurrency(totalExpenses)}</Text>
          
          {/* Line Chart */}
          {!loading && (
            <View style={styles.chartContainer}>
              <LineChart
                data={chartData}
                width={screenWidth}
                height={180}
                chartConfig={{
                  backgroundColor: COLORS.card,
                  backgroundGradientFrom: COLORS.card,
                  backgroundGradientTo: COLORS.card,
                  decimalPlaces: 0,
                  color: (opacity = 1) => `rgba(77, 171, 247, ${opacity})`,
                  labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity * 0.5})`,
                  style: {
                    borderRadius: 16,
                  },
                  propsForDots: {
                    r: activePointIndex !== null ? '5' : '4',
                    strokeWidth: activePointIndex !== null ? '1' : '0',
                    stroke: "#4dabf7",
                    fill: "#4dabf7",
                  },
                  propsForBackgroundLines: {
                    strokeDasharray: '5, 5', // Dotted line
                    stroke: 'rgba(255, 255, 255, 0.15)',
                    strokeWidth: 1,
                  },
                  formatYLabel: (value) => {
                    // Value to '5K' or '10K' format
                    const numValue = Number(value);
                    if (numValue >= 1000) {
                      return `${Math.round(numValue / 1000)}K`;
                    }
                    return value;
                  },
                  // Make the line smoother
                  propsForLabels: {
                    fontSize: 10,
                  },
                }}
                bezier
                style={{
                  marginVertical: 8,
                  borderRadius: 16,
                  paddingRight: 0,
                }}
                withDots={true}
                withShadow={false}
                withInnerLines={true}
                withOuterLines={false}
                withVerticalLines={false}
                withHorizontalLines={true}
                withVerticalLabels={true}
                withHorizontalLabels={true}
                yAxisInterval={1}
                fromZero={true}
                // Decorators help create the final dot at the end
                decorator={() => {
                  return chartData.datasets[0].data.length > 0 ? (
                    <View
                      style={{
                        position: 'absolute',
                        right: 20,
                        bottom: 80,
                        width: 10,
                        height: 10,
                        borderRadius: 5,
                        backgroundColor: '#4dabf7',
                        borderWidth: 2,
                        borderColor: '#121212',
                      }}
                    />
                  ) : null;
                }}
                onDataPointClick={handleDataPointClick}
              />
            </View>
          )}
        </View>

        {/* Son Hareketler */}
        <View style={styles.transactionsContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Harcamalarım</Text>
            <TouchableOpacity style={styles.addTransactionButton} onPress={handleShowAddExpense}>
              <Ionicons name="add" size={SIZES.iconMedium} color={COLORS.text} />
            </TouchableOpacity>
          </View>
          
          {loading ? (
            <ActivityIndicator size="large" color={COLORS.primary} style={styles.loader} />
          ) : recentExpenses.length > 0 ? (
            <View>
              {recentExpenses.map((expense, index) => (
                <View key={expense.id || index} style={styles.transactionItem}>
                  <View style={styles.transactionIcon}>
                    <Ionicons name="folder-outline" size={22} color="#4dabf7" />
                  </View>
                  <View style={styles.transactionInfo}>
                    <Text style={styles.transactionName}>{expense.description}</Text>
                    <Text style={styles.transactionDate}>{formatDate(expense.createdAt)}</Text>
                  </View>
                  <Text style={styles.transactionAmount}>- {formatCurrency(expense.amount)}</Text>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Henüz işlem yok</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Bireysel Harcama Ekleme Modal */}
      <Modal
        visible={showAddExpenseModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowAddExpenseModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Yeni Harcama Ekle</Text>
              <TouchableOpacity onPress={() => setShowAddExpenseModal(false)}>
                <Ionicons name="close" size={SIZES.iconMedium} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.formContainer}>
              <Text style={styles.formLabel}>Tutar</Text>
              <TextInput
                style={styles.input}
                placeholder="Tutar giriniz"
                placeholderTextColor={COLORS.textSecondary}
                keyboardType="numeric"
                value={newExpense.amount}
                onChangeText={(text) => setNewExpense({...newExpense, amount: text})}
              />

              <Text style={styles.formLabel}>Açıklama</Text>
              <TextInput
                style={styles.input}
                placeholder="Açıklama giriniz"
                placeholderTextColor={COLORS.textSecondary}
                value={newExpense.description}
                onChangeText={(text) => setNewExpense({...newExpense, description: text})}
              />

              <TouchableOpacity style={styles.addExpenseButton} onPress={handleAddExpense}>
                <Text style={styles.addExpenseButtonText}>Ekle</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Veri Noktası Detay Modalı */}
      <Modal
        visible={showDataPointModal}
        transparent={true}
        animationType="fade"
        onRequestClose={handleCloseDataPointModal}
      >
        <TouchableWithoutFeedback onPress={handleCloseDataPointModal}>
          <View style={styles.dataPointModalOverlay}>
            <TouchableWithoutFeedback onPress={e => e.stopPropagation()}>
              <View style={styles.dataPointModalContainer}>
                <View style={styles.dataPointModalHeader}>
                  <Text style={styles.dataPointModalTitle}>
                    {selectedDataPoint?.date} Harcamaları
                  </Text>
                  <TouchableOpacity onPress={handleCloseDataPointModal}>
                    <Ionicons name="close" size={SIZES.iconMedium} color={COLORS.text} />
                  </TouchableOpacity>
                </View>
                
                <View style={styles.dataPointModalBody}>
                  <Text style={styles.dataPointModalSummary}>
                    Toplam: {selectedDataPoint ? formatCurrency(selectedDataPoint.value) : ''}
                  </Text>
                  
                  {selectedDataPoint && selectedDataPoint.expenses.length > 0 ? (
                    <ScrollView style={styles.dataPointExpensesList}>
                      {selectedDataPoint.expenses.map((expense, index) => (
                        <View key={index} style={styles.dataPointExpenseItem}>
                          <View style={styles.dataPointExpenseInfo}>
                            <Text style={styles.dataPointExpenseName}>{expense.description}</Text>
                            <Text style={styles.dataPointExpenseTime}>{formatTime(expense.createdAt)}</Text>
                          </View>
                          <Text style={styles.dataPointExpenseAmount}>
                            - {formatCurrency(expense.amount)}
                          </Text>
                        </View>
                      ))}
                    </ScrollView>
                  ) : (
                    <View style={styles.dataPointEmptyContainer}>
                      <Ionicons name="information-circle-outline" size={40} color={COLORS.textSecondary} />
                      <Text style={styles.dataPointEmptyText}>
                        Bu tarih için detaylı harcama bilgisi bulunmuyor.
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: COLORS.error,
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  welcomeText: {
    fontSize: SIZES.subheading,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  avatar: {
    width: SIZES.avatarMedium,
    height: SIZES.avatarMedium,
    borderRadius: SIZES.avatarMedium / 2,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: SIZES.label,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  balanceCard: {
    margin: 20,
    padding: 20,
    backgroundColor: COLORS.card,
    borderRadius: SIZES.radius,
    ...SHADOWS.medium,
  },
  balanceLabel: {
    fontSize: SIZES.body,
    color: COLORS.textSecondary,
    marginBottom: 5,
  },
  balanceAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 10,
  },
  totalExpenseLabel: {
    fontSize: SIZES.caption,
    color: COLORS.textSecondary,
    marginBottom: 20,
  },
  chartContainer: {
    marginTop: 15,
    marginLeft: -20, // Chart padding compensation
    marginRight: -20,
    alignItems: 'center',
  },
  transactionsContainer: {
    padding: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: SIZES.label,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  addTransactionButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loader: {
    marginVertical: 20,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: COLORS.card,
    borderRadius: SIZES.radius,
    marginBottom: 10,
  },
  transactionIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(77, 171, 247, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionName: {
    fontSize: SIZES.body,
    color: COLORS.text,
    fontWeight: '500',
  },
  transactionDate: {
    fontSize: SIZES.small,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  transactionAmount: {
    fontSize: SIZES.body,
    fontWeight: 'bold',
    color: '#ff6b6b',
  },
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    color: COLORS.textSecondary,
    fontSize: SIZES.body,
  },
  // Modal stilleri
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: COLORS.overlay,
  },
  modalContainer: {
    backgroundColor: COLORS.background,
    borderTopLeftRadius: SIZES.radiusLarge,
    borderTopRightRadius: SIZES.radiusLarge,
    padding: 20,
    ...SHADOWS.large,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: SIZES.subheading,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  formContainer: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: SIZES.body,
    fontWeight: '500',
    color: COLORS.text,
    marginBottom: 10,
  },
  input: {
    backgroundColor: COLORS.card,
    borderRadius: SIZES.radius,
    padding: 15,
    marginBottom: 20,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  addExpenseButton: {
    backgroundColor: COLORS.primary,
    borderRadius: SIZES.radius,
    padding: 15,
    alignItems: 'center',
    marginTop: 10,
  },
  addExpenseButtonText: {
    color: COLORS.text,
    fontSize: SIZES.body,
    fontWeight: 'bold',
  },
  // Veri Noktası Modal stilleri
  dataPointModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dataPointModalContainer: {
    width: '90%',
    backgroundColor: COLORS.card,
    borderRadius: SIZES.radius,
    ...SHADOWS.large,
    maxHeight: '70%',
    overflow: 'hidden',
  },
  dataPointModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  dataPointModalTitle: {
    color: COLORS.text,
    fontSize: SIZES.subheading,
    fontWeight: 'bold',
  },
  dataPointModalBody: {
    padding: 15,
  },
  dataPointModalSummary: {
    color: COLORS.primary,
    fontSize: SIZES.body,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  dataPointExpensesList: {
    maxHeight: 300,
  },
  dataPointExpenseItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  dataPointExpenseInfo: {
    flex: 1,
  },
  dataPointExpenseName: {
    color: COLORS.text,
    fontSize: SIZES.body,
    fontWeight: '500',
  },
  dataPointExpenseTime: {
    color: COLORS.textSecondary,
    fontSize: SIZES.small,
    marginTop: 2,
  },
  dataPointExpenseAmount: {
    color: '#ff6b6b',
    fontSize: SIZES.body,
    fontWeight: 'bold',
  },
  dataPointEmptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 30,
  },
  dataPointEmptyText: {
    color: COLORS.textSecondary,
    fontSize: SIZES.body,
    textAlign: 'center',
    marginTop: 15,
  },
}); 