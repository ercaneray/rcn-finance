export const COLORS = {
  // Ana renkler
  primary: '#4dabf7',     // Ana mavi renk (vurgu rengi)
  background: '#121212',  // Ana arka plan rengi (koyu siyah)
  card: '#1e1e1e',        // Kart arka plan rengi (koyu gri)
  text: '#ffffff',        // Ana metin rengi (beyaz)
  textSecondary: '#aaaaaa', // İkincil metin rengi (açık gri)
  border: '#333333',      // Sınır çizgisi rengi
  
  // Eylem renkleri
  success: '#3dd598',     // Başarı rengi (yeşil)
  error: '#ff6b6b',       // Hata rengi (kırmızı)
  warning: '#ff9800',     // Uyarı rengi (turuncu)

  // Diğer renkler
  darkGray: '#777777',    // Koyu gri
  lightGray: '#f5f5f5',   // Açık gri
  overlay: 'rgba(0, 0, 0, 0.5)', // Modal arka planı için
};

export const SIZES = {
  // Font boyutları
  heading: 24,
  subheading: 20,
  label: 18,
  body: 16,
  caption: 14,
  small: 12,
  
  // Kenar boşlukları
  padding: 16,
  margin: 16,
  radius: 10,      // Kenar yuvarlaklığı (border radius)
  radiusLarge: 20,
  
  // İkonlar
  iconSmall: 18,
  iconMedium: 24,
  iconLarge: 30,
  
  // Butonlar
  buttonHeight: 48,
  
  // Avatar boyutları
  avatarSmall: 36,
  avatarMedium: 48,
  avatarLarge: 64,
};

export const SHADOWS = {
  small: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 2,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 6,
  },
  large: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.37,
    shadowRadius: 7.49,
    elevation: 12,
  },
};

// Kolay kullanım için tüm tema bileşenlerini export et
export const THEME = {
  COLORS,
  SIZES,
  SHADOWS,
};

export default THEME; 