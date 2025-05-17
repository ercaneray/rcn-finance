export interface Group {
  id?: string;
  name: string;
  description?: string;
  createdBy: string;
  createdAt: number;
}

export interface GroupMember {
  id?: string;
  groupId: string;
  userId: string;
  name: string;
  email: string;
  role: 'owner' | 'member';
  joinedAt: number;
}

export interface Expense {
  id?: string;
  amount: number;
  description: string;
  groupId?: string;
  userId: string;
  userName: string;
  createdAt: number;
}

export interface GroupInvitation {
  id?: string;
  groupId: string;
  groupName: string;
  inviterUserId: string;
  inviterName: string;
  invitedEmail: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: number;
  updatedAt?: number;
} 