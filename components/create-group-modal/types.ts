export interface CreateGroupModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  currentUserId: string;
  userName: string;
  email: string;
} 