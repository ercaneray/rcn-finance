import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

export default function HomeScreen() {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Finans Takip</Text>
        <Text style={styles.subtitle}>Hoş Geldiniz</Text>
      </View>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Son Harcamalar</Text>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Henüz harcama yok</Text>
          <Text style={styles.cardText}>Harcamalarınız burada görünecek</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Özet</Text>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Toplam Harcama</Text>
          <Text style={styles.cardText}>₺0</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  header: {
    padding: 20,
    marginBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  subtitle: {
    fontSize: 16,
    color: '#aaa',
    marginTop: 5,
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 15,
  },
  card: {
    backgroundColor: '#1e1e1e',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  cardText: {
    fontSize: 14,
    color: '#aaa',
  },
}); 