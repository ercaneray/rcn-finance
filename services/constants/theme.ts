export const COLORS = {
  // Modern Gradient Theme
  primary: '#6366f1',           // Indigo - modern primary
  primaryDark: '#4f46e5',       // Darker indigo
  primaryLight: '#8b5cf6',      // Purple accent
  
  // Background gradients
  background: '#0f0f23',        // Deep navy background
  backgroundSecondary: '#1a1a3a', // Slightly lighter navy
  
  // Card and surface colors
  card: 'rgba(255, 255, 255, 0.1)',     // Glassmorphism white
  cardSecondary: 'rgba(99, 102, 241, 0.1)', // Glassmorphism primary
  
  // Text colors
  text: '#ffffff',              // Pure white text
  textSecondary: 'rgba(255, 255, 255, 0.7)', // Semi-transparent white
  textTertiary: 'rgba(255, 255, 255, 0.5)',  // More transparent white
  
  // Accent colors
  accent: '#10b981',            // Emerald green
  accentSecondary: '#f59e0b',   // Amber
  
  // Status colors
  success: '#22c55e',           // Green
  error: '#ef4444',             // Red
  warning: '#f59e0b',           // Amber
  info: '#3b82f6',              // Blue
  
  // Border and separator
  border: 'rgba(255, 255, 255, 0.1)',
  borderLight: 'rgba(255, 255, 255, 0.05)',
  
  // Legacy colors for compatibility
  darkGray: '#6b7280',
  lightGray: '#f3f4f6',
  overlay: 'rgba(0, 0, 0, 0.3)',
  
  // Special gradients
  gradientPrimary: ['#6366f1', '#8b5cf6', '#d946ef'],
  gradientSecondary: ['#10b981', '#059669', '#047857'],
  gradientBackground: ['#0f0f23', '#1a1a3a', '#2d1b69'],
  
  // Glassmorphism overlay
  glassOverlay: 'rgba(255, 255, 255, 0.05)',
};

export const SIZES = {
  // Font boyutları
  heading: 28,
  subheading: 22,
  title: 20,
  label: 18,
  body: 16,
  caption: 14,
  small: 12,
  
  // Kenar boşlukları
  padding: 20,
  paddingSmall: 12,
  paddingLarge: 32,
  margin: 16,
  marginSmall: 8,
  marginLarge: 24,
  radius: 16,
  radiusSmall: 12,
  radiusLarge: 24,
  
  // İkonlar
  iconSmall: 18,
  iconMedium: 24,
  iconLarge: 30,
  
  // Butonlar
  buttonHeight: 56,
  inputHeight: 56,
  
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
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  large: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  glow: {
    shadowColor: '#6366f1',
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
};

// Glassmorphism effects
export const GLASS = {
  light: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  medium: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  dark: {
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
};

// Gradient presets
export const GRADIENTS = {
  primary: {
    colors: COLORS.gradientPrimary,
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  },
  secondary: {
    colors: COLORS.gradientSecondary,
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  },
  background: {
    colors: COLORS.gradientBackground,
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  },
};

// Kolay kullanım için tüm tema bileşenlerini export et
export const THEME = {
  COLORS,
  SIZES,
  SHADOWS,
  GLASS,
  GRADIENTS,
};

export default THEME; 