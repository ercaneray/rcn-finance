import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { getAuth } from 'firebase/auth';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
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

const { width, height } = Dimensions.get('window');

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
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(50));
  
  const auth = getAuth();
  const currentUser = auth.currentUser;
  const screenWidth = Dimensions.get('window').width - 40; // Ekran genişliği - margin
  const chartWidth = screenWidth * 0.85; // Grafik genişliği biraz daha küçük

  useEffect(() => {
    if (currentUser) {
      loadExpenses();
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
          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Header */}
            <View style={styles.header}>
              <View>
                <Text style={styles.welcomeText}>Kişisel Harcamalarım</Text>
                <Text style={styles.subWelcomeText}>Akıllı finansal takibiniz</Text>
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

            {/* Balance Card */}
            <View style={styles.balanceCard}>
              <LinearGradient
                colors={['rgba(255, 255, 255, 0.15)', 'rgba(255, 255, 255, 0.05)']}
                style={styles.balanceCardGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <View style={styles.balanceHeader}>
                  <View style={styles.balanceIconContainer}>
                    <LinearGradient
                      colors={['#10b981', '#059669']}
                      style={styles.balanceIcon}
                    >
                      <Ionicons name="wallet" size={24} color="white" />
                    </LinearGradient>
                  </View>
                  <Text style={styles.balanceLabel}>Toplam Harcama</Text>
                </View>
                
                <Text style={styles.balanceAmount}>{formatCurrency(totalExpenses)}</Text>
                
                {/* Modern Chart */}
                {!loading && (
                  <View style={styles.chartContainer}>
                    <Text style={styles.chartTitle}>7 Günlük Trend</Text>
                    <LineChart
                      data={chartData}
                      width={chartWidth}
                      height={180}
                      chartConfig={{
                        backgroundGradientFrom: 'transparent',
                        backgroundGradientTo: 'transparent',
                        color: (opacity = 1) => `rgba(99, 102, 241, ${opacity})`,
                        fillShadowGradientFrom: '#6366f1',
                        fillShadowGradientFromOpacity: 0.4,
                        fillShadowGradientTo: '#8b5cf6',
                        fillShadowGradientToOpacity: 0.1,
                        strokeWidth: 4,
                        labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity * 0.8})`,
                        style: {
                          borderRadius: 16,
                        },
                        propsForDots: {
                          r: '8',
                          strokeWidth: '0',
                          fill: '#ffffff',
                          fillOpacity: 1,
                          stroke: '#6366f1',
                        },
                        propsForBackgroundLines: {
                          strokeDasharray: '2, 4',
                          stroke: 'rgba(255, 255, 255, 0.08)',
                          strokeWidth: 1,
                        },
                        formatYLabel: (value) => {
                          const numValue = Number(value);
                          if (numValue >= 1000) {
                            return `${Math.round(numValue / 1000)}K`;
                          }
                          return Math.round(numValue).toString();
                        },
                        propsForLabels: {
                          fontSize: 11,
                          fontWeight: '600',
                        },
                        decimalPlaces: 0,
                        useShadowColorFromDataset: false,
                      }}
                      style={{
                        marginVertical: 8,
                        borderRadius: 16,
                        paddingRight: 0,
                      }}
                      withDots={true}
                      withShadow={true}
                      withInnerLines={false}
                      withOuterLines={false}
                      withVerticalLines={false}
                      withHorizontalLines={true}
                      withVerticalLabels={true}
                      withHorizontalLabels={true}
                      fromZero={true}
                      bezier
                      onDataPointClick={handleDataPointClick}
                    />
                  </View>
                )}
              </LinearGradient>
            </View>

            {/* Quick Actions */}
            <View style={styles.quickActionsContainer}>
              <Text style={styles.sectionTitle}>Hızlı İşlemler</Text>
              <View style={styles.quickActions}>
                <TouchableOpacity style={styles.quickActionButton} onPress={handleShowAddExpense}>
                  <LinearGradient
                    colors={['#6366f1', '#8b5cf6']}
                    style={styles.quickActionGradient}
                  >
                    <Ionicons name="add" size={24} color="white" />
                  </LinearGradient>
                  <Text style={styles.quickActionText}>Harcama Ekle</Text>
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.quickActionButton}>
                  <LinearGradient
                    colors={['#f59e0b', '#d97706']}
                    style={styles.quickActionGradient}
                  >
                    <Ionicons name="analytics" size={24} color="white" />
                  </LinearGradient>
                  <Text style={styles.quickActionText}>Analiz</Text>
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.quickActionButton}>
                  <LinearGradient
                    colors={['#ef4444', '#dc2626']}
                    style={styles.quickActionGradient}
                  >
                    <Ionicons name="receipt" size={24} color="white" />
                  </LinearGradient>
                  <Text style={styles.quickActionText}>Fiş Tara</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Recent Transactions */}
            <View style={styles.transactionsContainer}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Son Harcamalar</Text>
                <TouchableOpacity style={styles.seeAllButton}>
                  <Text style={styles.seeAllText}>Tümünü Gör</Text>
                  <Ionicons name="chevron-forward" size={16} color={COLORS.primary} />
                </TouchableOpacity>
              </View>
              
              {loading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color={COLORS.primary} />
                  <Text style={styles.loadingText}>Yükleniyor...</Text>
                </View>
              ) : recentExpenses.length > 0 ? (
                <View style={styles.transactionsList}>
                  {recentExpenses.map((expense, index) => (
                    <View key={expense.id || index} style={styles.transactionItem}>
                      <View style={styles.transactionIconContainer}>
                        <LinearGradient
                          colors={['rgba(239, 68, 68, 0.2)', 'rgba(239, 68, 68, 0.1)']}
                          style={styles.transactionIcon}
                        >
                          <Ionicons name="remove" size={20} color="#ef4444" />
                        </LinearGradient>
                      </View>
                      <View style={styles.transactionInfo}>
                        <Text style={styles.transactionName}>{expense.description}</Text>
                        <Text style={styles.transactionDate}>
                          {formatDate(expense.createdAt)} • {formatTime(expense.createdAt)}
                        </Text>
                      </View>
                      <Text style={styles.transactionAmount}>-{formatCurrency(expense.amount)}</Text>
                    </View>
                  ))}
                </View>
              ) : (
                <View style={styles.emptyContainer}>
                  <View style={styles.emptyIconContainer}>
                    <Ionicons name="receipt-outline" size={48} color={COLORS.textTertiary} />
                  </View>
                  <Text style={styles.emptyText}>Henüz harcama bulunmuyor</Text>
                  <Text style={styles.emptySubtext}>İlk harcamanızı ekleyerek başlayın</Text>
                </View>
              )}
            </View>
          </ScrollView>
        </Animated.View>
      </LinearGradient>

      {/* Add Expense Modal */}
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
            <LinearGradient
              colors={['rgba(255, 255, 255, 0.15)', 'rgba(255, 255, 255, 0.05)']}
              style={styles.modalGradient}
            >
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Yeni Harcama Ekle</Text>
                <TouchableOpacity 
                  onPress={() => setShowAddExpenseModal(false)}
                  style={styles.closeButton}
                >
                  <Ionicons name="close" size={24} color={COLORS.text} />
                </TouchableOpacity>
              </View>

              <View style={styles.formContainer}>
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Tutar</Text>
                  <View style={styles.inputWrapper}>
                    <Ionicons name="cash-outline" size={20} color={COLORS.textSecondary} style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="0.00"
                      placeholderTextColor={COLORS.textTertiary}
                      keyboardType="numeric"
                      value={newExpense.amount}
                      onChangeText={(text) => setNewExpense({...newExpense, amount: text})}
                    />
                    <Text style={styles.currencyText}>TL</Text>
                  </View>
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Açıklama</Text>
                  <View style={styles.inputWrapper}>
                    <Ionicons name="document-text-outline" size={20} color={COLORS.textSecondary} style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="Ne için harcadınız?"
                      placeholderTextColor={COLORS.textTertiary}
                      value={newExpense.description}
                      onChangeText={(text) => setNewExpense({...newExpense, description: text})}
                    />
                  </View>
                </View>

                <TouchableOpacity style={styles.addExpenseButtonWrapper} onPress={handleAddExpense}>
                  <LinearGradient
                    colors={['#10b981', '#059669']}
                    style={styles.addExpenseButton}
                  >
                    <Ionicons name="checkmark" size={20} color="white" style={{ marginRight: 8 }} />
                    <Text style={styles.addExpenseButtonText}>Harcama Ekle</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Data Point Detail Modal */}
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
                <LinearGradient
                  colors={['rgba(255, 255, 255, 0.15)', 'rgba(255, 255, 255, 0.05)']}
                  style={styles.dataPointModalGradient}
                >
                  <View style={styles.dataPointModalHeader}>
                    <Text style={styles.dataPointModalTitle}>
                      {selectedDataPoint?.date} Harcamaları
                    </Text>
                    <TouchableOpacity onPress={handleCloseDataPointModal}>
                      <Ionicons name="close" size={24} color={COLORS.text} />
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
                              -{formatCurrency(expense.amount)}
                            </Text>
                          </View>
                        ))}
                      </ScrollView>
                    ) : (
                      <View style={styles.dataPointEmptyContainer}>
                        <Ionicons name="information-circle-outline" size={40} color={COLORS.textTertiary} />
                        <Text style={styles.dataPointEmptyText}>
                          Bu tarih için harcama bulunmuyor.
                        </Text>
                      </View>
                    )}
                  </View>
                </LinearGradient>
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
  },
  backgroundGradient: {
    flex: 1,
    position: 'relative',
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
    paddingTop: 60,
    paddingBottom: 20,
  },
  welcomeText: {
    fontSize: SIZES.subheading,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  subWelcomeText: {
    fontSize: SIZES.body,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  avatarContainer: {
    ...SHADOWS.medium,
  },
  avatar: {
    width: SIZES.avatarMedium,
    height: SIZES.avatarMedium,
    borderRadius: SIZES.avatarMedium / 2,
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
    borderRadius: SIZES.radiusLarge,
    ...SHADOWS.large,
  },
  balanceCardGradient: {
    borderRadius: SIZES.radiusLarge,
    padding: 24,
  },
  balanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  balanceIconContainer: {
    marginRight: 12,
  },
  balanceIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  balanceLabel: {
    fontSize: SIZES.body,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  balanceAmount: {
    fontSize: 36,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 20,
  },
  chartContainer: {
    marginTop: 15,
    marginLeft: -24,
    marginRight: -24,
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  chartTitle: {
    fontSize: SIZES.body,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 16,
    textAlign: 'center',
  },
  quickActionsContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  quickActionButton: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 6,
  },
  quickActionGradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    ...SHADOWS.medium,
  },
  quickActionText: {
    fontSize: SIZES.caption,
    color: COLORS.text,
    fontWeight: '600',
    textAlign: 'center',
  },
  transactionsContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: SIZES.label,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  seeAllText: {
    fontSize: SIZES.body,
    color: COLORS.primary,
    fontWeight: '600',
    marginRight: 4,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: SIZES.body,
    color: COLORS.textSecondary,
    marginLeft: 12,
  },
  transactionsList: {
    gap: 12,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: COLORS.card,
    borderRadius: SIZES.radius,
    ...SHADOWS.small,
  },
  transactionIconContainer: {
    marginRight: 12,
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  transactionInfo: {
    flex: 1,
  },
  transactionName: {
    fontSize: SIZES.body,
    color: COLORS.text,
    fontWeight: '600',
    marginBottom: 4,
  },
  transactionDate: {
    fontSize: SIZES.small,
    color: COLORS.textSecondary,
  },
  transactionAmount: {
    fontSize: SIZES.body,
    fontWeight: 'bold',
    color: '#ef4444',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.card,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyText: {
    color: COLORS.textSecondary,
    fontSize: SIZES.body,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptySubtext: {
    color: COLORS.textTertiary,
    fontSize: SIZES.caption,
    textAlign: 'center',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: COLORS.overlay,
  },
  modalContainer: {
    borderTopLeftRadius: SIZES.radiusLarge,
    borderTopRightRadius: SIZES.radiusLarge,
    ...SHADOWS.large,
  },
  modalGradient: {
    borderTopLeftRadius: SIZES.radiusLarge,
    borderTopRightRadius: SIZES.radiusLarge,
    padding: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: SIZES.subheading,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.card,
    justifyContent: 'center',
    alignItems: 'center',
  },
  formContainer: {
    gap: 20,
  },
  inputContainer: {
    gap: 8,
  },
  inputLabel: {
    fontSize: SIZES.body,
    fontWeight: '600',
    color: COLORS.text,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: SIZES.radius,
    paddingHorizontal: 16,
    paddingVertical: 4,
    height: 56,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    color: COLORS.text,
    fontSize: SIZES.body,
    paddingVertical: 16,
  },
  currencyText: {
    fontSize: SIZES.body,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginLeft: 8,
  },
  addExpenseButtonWrapper: {
    borderRadius: SIZES.radius,
    overflow: 'hidden',
    ...SHADOWS.medium,
  },
  addExpenseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  addExpenseButtonText: {
    color: 'white',
    fontSize: SIZES.body,
    fontWeight: 'bold',
  },
  // Data Point Modal styles
  dataPointModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dataPointModalContainer: {
    width: '90%',
    borderRadius: SIZES.radius,
    ...SHADOWS.large,
    maxHeight: '70%',
    overflow: 'hidden',
  },
  dataPointModalGradient: {
    borderRadius: SIZES.radius,
  },
  dataPointModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  dataPointModalTitle: {
    color: COLORS.text,
    fontSize: SIZES.subheading,
    fontWeight: 'bold',
  },
  dataPointModalBody: {
    padding: 20,
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
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  dataPointExpenseInfo: {
    flex: 1,
  },
  dataPointExpenseName: {
    color: COLORS.text,
    fontSize: SIZES.body,
    fontWeight: '600',
    marginBottom: 4,
  },
  dataPointExpenseTime: {
    color: COLORS.textSecondary,
    fontSize: SIZES.small,
  },
  dataPointExpenseAmount: {
    color: '#ef4444',
    fontSize: SIZES.body,
    fontWeight: 'bold',
  },
  dataPointEmptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  dataPointEmptyText: {
    color: COLORS.textSecondary,
    fontSize: SIZES.body,
    textAlign: 'center',
    marginTop: 16,
  },
}); 