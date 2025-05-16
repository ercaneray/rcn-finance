export interface LoginScreenProps {
  onLogin?: (email: string, password: string) => void;
  onRegister?: () => void;
} 