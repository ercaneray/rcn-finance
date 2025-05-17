export interface InviteUserModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  groupId: string;
  groupName: string;
  currentUserId: string;
  currentUserName: string;
} 