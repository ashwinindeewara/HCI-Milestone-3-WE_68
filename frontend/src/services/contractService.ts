import apiClient from './api';
import {
  Contract,
  Milestone,
  Deliverable,
  EscrowSummary,
  Transaction,
  DashboardMetrics,
} from '../types';

// Initial Mock Data (used as fallback when Spring Boot backend is offline)
let MOCK_CONTRACTS: Contract[] = [
  {
    id: 'C-101',
    title: 'E-Commerce Mobile App Redesign',
    clientName: 'TechVentures Inc.',
    freelancerName: 'Chathuni Imalsha',
    totalBudget: 8500,
    status: 'IN_PROGRESS',
    startDate: '2026-09-01',
    endDate: '2026-11-30',
    milestones: [
      {
        id: 'M-1',
        contractId: 'C-101',
        title: '1. Wireframes & UX Research',
        description: 'Complete user flow diagrams and low-fidelity prototypes.',
        amount: 2500,
        dueDate: '2026-09-15',
        status: 'RELEASED',
        deliverables: [
          {
            id: 'D-1',
            milestoneId: 'M-1',
            fileName: 'ux_research_v1.pdf',
            fileSize: '4.2 MB',
            notes: 'Initial user interviews and wireframes attached.',
            uploadedAt: '2026-09-14',
            status: 'APPROVED',
          },
        ],
      },
      {
        id: 'M-2',
        contractId: 'C-101',
        title: '2. UI Design Phase & Design System',
        description: 'High-fidelity Figma screens and component library.',
        amount: 3000,
        dueDate: '2026-10-15',
        status: 'FUNDED',
        deliverables: [
          {
            id: 'D-2',
            milestoneId: 'M-2',
            fileName: 'homepage_final_design.fig',
            fileSize: '12.8 MB',
            notes: 'High fidelity interface prototype ready for review.',
            uploadedAt: '2026-10-01',
            status: 'PENDING_REVIEW',
          },
        ],
      },
      {
        id: 'M-3',
        contractId: 'C-101',
        title: '3. React Native Mobile App Frontend',
        description: 'Implement Expo mobile app screens and backend integration.',
        amount: 3000,
        dueDate: '2026-11-30',
        status: 'PENDING',
        deliverables: [],
      },
    ],
  },
  {
    id: 'C-102',
    title: 'Marketing Brand Strategy & Assets',
    clientName: 'Apex Solutions Ltd.',
    freelancerName: 'Chathuni Imalsha',
    totalBudget: 4200,
    status: 'ACTIVE',
    startDate: '2026-09-20',
    endDate: '2026-10-25',
    milestones: [
      {
        id: 'M-4',
        contractId: 'C-102',
        title: '1. Brand Guidelines & Logo Assets',
        description: 'Vector logo files, typography, and brand identity manual.',
        amount: 1800,
        dueDate: '2026-10-05',
        status: 'FUNDED',
        deliverables: [],
      },
      {
        id: 'M-5',
        contractId: 'C-102',
        title: '2. Social Media Marketing Kit',
        description: 'Templates and promo banners for launch campaign.',
        amount: 2400,
        dueDate: '2026-10-25',
        status: 'PENDING',
        deliverables: [],
      },
    ],
  },
];

let MOCK_TRANSACTIONS: Transaction[] = [
  {
    id: 'TXN-2847',
    referenceNo: 'FTX-90182',
    contractId: 'C-101',
    milestoneId: 'M-1',
    milestoneTitle: 'Wireframes & UX Research',
    amount: 2500,
    type: 'RELEASE',
    status: 'COMPLETED',
    timestamp: '2026-09-16 10:30 AM',
  },
  {
    id: 'TXN-2848',
    referenceNo: 'FTX-90183',
    contractId: 'C-101',
    milestoneId: 'M-2',
    milestoneTitle: 'UI Design Phase & Design System',
    amount: 3000,
    type: 'FUND',
    status: 'COMPLETED',
    timestamp: '2026-09-28 02:15 PM',
  },
  {
    id: 'TXN-2849',
    referenceNo: 'FTX-90184',
    contractId: 'C-102',
    milestoneId: 'M-4',
    milestoneTitle: 'Brand Guidelines & Logo Assets',
    amount: 1800,
    type: 'FUND',
    status: 'COMPLETED',
    timestamp: '2026-10-01 09:45 AM',
  },
];

export const ContractService = {
  /**
   * Fetch Dashboard Overview Metrics
   */
  async getDashboardMetrics(): Promise<DashboardMetrics> {
    try {
      const response = await apiClient.get('/dashboard/metrics');
      return response.data;
    } catch {
      // Fallback Mock Data
      const activeContractsCount = MOCK_CONTRACTS.length;
      const totalEarnings = 3200;
      const pendingMilestonesCount = MOCK_CONTRACTS.flatMap((c) => c.milestones).filter(
        (m) => m.status === 'PENDING' || m.status === 'FUNDED'
      ).length;
      const totalInEscrow = MOCK_CONTRACTS.flatMap((c) => c.milestones)
        .filter((m) => m.status === 'FUNDED')
        .reduce((sum, m) => sum + m.amount, 0);

      return {
        activeContractsCount,
        totalEarnings,
        pendingMilestonesCount,
        totalInEscrow,
        recentActivity: [
          {
            id: 'ACT-1',
            title: 'Milestone Funded',
            description: 'TechVentures funded $3,000 for UI Design Phase',
            timestamp: '2 hours ago',
            type: 'PAYMENT',
          },
          {
            id: 'ACT-2',
            title: 'Deliverable Submitted',
            description: 'Submitted homepage_final_design.fig for review',
            timestamp: 'Yesterday',
            type: 'MILESTONE',
          },
          {
            id: 'ACT-3',
            title: 'Payment Released',
            description: '$2,500 released for Wireframes & UX Research',
            timestamp: 'Sep 16, 2026',
            type: 'PAYMENT',
          },
        ],
      };
    }
  },

  /**
   * Fetch All Contracts & Milestones
   */
  async getContracts(): Promise<Contract[]> {
    try {
      const response = await apiClient.get('/contracts');
      return response.data;
    } catch {
      return [...MOCK_CONTRACTS];
    }
  },

  /**
   * Fetch Contract Details by ID
   */
  async getContractById(id: string): Promise<Contract | undefined> {
    try {
      const response = await apiClient.get(`/contracts/${id}`);
      return response.data;
    } catch {
      return MOCK_CONTRACTS.find((c) => c.id === id);
    }
  },

  /**
   * Upload Deliverable for Milestone (FR04 / FR09)
   */
  async uploadDeliverable(
    milestoneId: string,
    fileName: string,
    notes: string
  ): Promise<Deliverable> {
    const payload = { fileName, notes, uploadedAt: new Date().toISOString() };
    try {
      const response = await apiClient.post(`/milestones/${milestoneId}/deliverables`, payload);
      return response.data;
    } catch {
      // Local dynamic mock update
      const newDeliverable: Deliverable = {
        id: `D-${Date.now()}`,
        milestoneId,
        fileName,
        fileSize: '3.5 MB',
        notes,
        uploadedAt: new Date().toISOString().split('T')[0],
        status: 'PENDING_REVIEW',
      };

      MOCK_CONTRACTS = MOCK_CONTRACTS.map((contract) => ({
        ...contract,
        milestones: contract.milestones.map((m) => {
          if (m.id === milestoneId) {
            return {
              ...m,
              deliverables: [...m.deliverables, newDeliverable],
            };
          }
          return m;
        }),
      }));

      return newDeliverable;
    }
  },

  /**
   * Fetch Escrow Account Summary (FR05)
   */
  async getEscrowSummary(): Promise<EscrowSummary> {
    try {
      const response = await apiClient.get('/escrow/summary');
      return response.data;
    } catch {
      const funded = MOCK_CONTRACTS.flatMap((c) => c.milestones)
        .filter((m) => m.status === 'FUNDED')
        .reduce((sum, m) => sum + m.amount, 0);

      const released = MOCK_CONTRACTS.flatMap((c) => c.milestones)
        .filter((m) => m.status === 'RELEASED')
        .reduce((sum, m) => sum + m.amount, 0);

      return {
        totalInEscrow: funded,
        fundedAmount: funded,
        releasedAmount: released,
        availableBalance: 3200,
      };
    }
  },

  /**
   * Fund Milestone upfront into Escrow (Client Action - FR05)
   */
  async fundMilestone(milestoneId: string): Promise<Milestone> {
    try {
      const response = await apiClient.post(`/escrow/fund`, { milestoneId });
      return response.data;
    } catch {
      let updatedMilestone!: Milestone;
      MOCK_CONTRACTS = MOCK_CONTRACTS.map((c) => ({
        ...c,
        milestones: c.milestones.map((m) => {
          if (m.id === milestoneId) {
            updatedMilestone = { ...m, status: 'FUNDED' };
            return updatedMilestone;
          }
          return m;
        }),
      }));

      // Add to transaction log
      MOCK_TRANSACTIONS.unshift({
        id: `TXN-${Date.now()}`,
        referenceNo: `FTX-${Math.floor(10000 + Math.random() * 90000)}`,
        contractId: updatedMilestone?.contractId || 'C-101',
        milestoneId: updatedMilestone?.id,
        milestoneTitle: updatedMilestone?.title || 'Funded Milestone',
        amount: updatedMilestone?.amount || 1000,
        type: 'FUND',
        status: 'COMPLETED',
        timestamp: 'Just now',
      });

      return updatedMilestone;
    }
  },

  /**
   * Release Escrow Funds to Freelancer (Client Approval Action - FR05)
   */
  async releasePayment(milestoneId: string): Promise<Milestone> {
    try {
      const response = await apiClient.post(`/escrow/release`, { milestoneId });
      return response.data;
    } catch {
      let updatedMilestone!: Milestone;
      MOCK_CONTRACTS = MOCK_CONTRACTS.map((c) => ({
        ...c,
        milestones: c.milestones.map((m) => {
          if (m.id === milestoneId) {
            updatedMilestone = { ...m, status: 'RELEASED' };
            return updatedMilestone;
          }
          return m;
        }),
      }));

      MOCK_TRANSACTIONS.unshift({
        id: `TXN-${Date.now()}`,
        referenceNo: `FTX-${Math.floor(10000 + Math.random() * 90000)}`,
        contractId: updatedMilestone?.contractId || 'C-101',
        milestoneId: updatedMilestone?.id,
        milestoneTitle: updatedMilestone?.title || 'Released Payment',
        amount: updatedMilestone?.amount || 1000,
        type: 'RELEASE',
        status: 'COMPLETED',
        timestamp: 'Just now',
      });

      return updatedMilestone;
    }
  },

  /**
   * Fetch Transaction History Log with optional filtering (FR05 / UI-05)
   */
  async getTransactions(filterType?: string): Promise<Transaction[]> {
    try {
      const response = await apiClient.get('/transactions', { params: { type: filterType } });
      return response.data;
    } catch {
      if (!filterType || filterType === 'ALL') {
        return [...MOCK_TRANSACTIONS];
      }
      return MOCK_TRANSACTIONS.filter((t) => t.type === filterType);
    }
  },
};

export default ContractService;
