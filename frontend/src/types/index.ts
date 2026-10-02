export type MilestoneStatus = 'PENDING' | 'FUNDED' | 'DELIVERED' | 'RELEASED';
export type ContractStatus = 'ACTIVE' | 'IN_PROGRESS' | 'COMPLETED' | 'DISPUTED';
export type TransactionType = 'FUND' | 'RELEASE' | 'DISPUTE';
export type TransactionStatus = 'COMPLETED' | 'PENDING' | 'DISPUTED';

export interface Deliverable {
  id: string;
  milestoneId: string;
  fileName: string;
  fileSize?: string;
  notes: string;
  uploadedAt: string;
  status: 'PENDING_REVIEW' | 'APPROVED' | 'REVISION_REQUESTED';
}

export interface Milestone {
  id: string;
  contractId: string;
  title: string;
  description: string;
  amount: number;
  dueDate: string;
  status: MilestoneStatus;
  deliverables: Deliverable[];
}

export interface Contract {
  id: string;
  title: string;
  clientName: string;
  freelancerName: string;
  totalBudget: number;
  status: ContractStatus;
  startDate: string;
  endDate: string;
  milestones: Milestone[];
}

export interface EscrowSummary {
  totalInEscrow: number;
  fundedAmount: number;
  releasedAmount: number;
  availableBalance: number;
}

export interface Transaction {
  id: string;
  referenceNo: string;
  contractId: string;
  milestoneId?: string;
  milestoneTitle: string;
  amount: number;
  type: TransactionType;
  status: TransactionStatus;
  timestamp: string;
}

export interface DashboardMetrics {
  activeContractsCount: number;
  totalEarnings: number;
  pendingMilestonesCount: number;
  totalInEscrow: number;
  recentActivity: Array<{
    id: string;
    title: string;
    description: string;
    timestamp: string;
    type: 'CONTRACT' | 'PAYMENT' | 'MILESTONE';
  }>;
}
