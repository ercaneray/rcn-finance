export interface RegisterScreenProps {
  onRegister?: (email: string, password: string) => void;
  onBackToLogin?: () => void;
} 