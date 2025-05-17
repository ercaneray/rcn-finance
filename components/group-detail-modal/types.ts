export interface GroupDetailModalProps {
  visible: boolean;
  groupId: string;
  onClose: () => void;
  currentUserId: string;
  userName: string;
} 