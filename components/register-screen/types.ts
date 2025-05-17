export interface RegisterScreenProps {
  onRegister?: (email: string, password: string, displayName: string) => void;
  onBackToLogin?: () => void;
} 