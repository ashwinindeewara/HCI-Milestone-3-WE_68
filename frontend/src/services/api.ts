import axios from 'axios';
import { Platform } from 'react-native';

/**
 * Spring Boot Backend API Base URL Configuration:
 * - Web / standard: http://localhost:8080/api
 * - Android Emulator: http://10.0.2.2:8080/api
 */
const GET_BASE_URL = () => {
  const envUrl = process.env.EXPO_PUBLIC_API_URL;
  if (envUrl) {
    if (Platform.OS === 'android' && envUrl.includes('localhost')) {
      return envUrl.replace('localhost', '10.0.2.2');
    }
    return envUrl;
  }
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:8082/api';
  }
  return 'http://localhost:8082/api';
};

export const API_BASE_URL = GET_BASE_URL();

export const resolveMediaUrl = (url?: string): string => {
  if (!url) return '';
  if (url.startsWith('data:') || url.startsWith('blob:')) {
    return url;
  }
  let resolved = url;
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    const host = API_BASE_URL.replace(/\/api\/?$/, '');
    const cleanPath = url.startsWith('/') ? url : `/${url}`;
    resolved = `${host}${cleanPath}`;
  }
  // Ensure file URLs use the /preview endpoint so browsers render them inline instead of triggering download attachment
  if (resolved.includes('/api/files/') && resolved.endsWith('/download')) {
    resolved = resolved.replace(/\/download$/, '/preview');
  }
  return resolved;
};

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  timeout: 10000,
});

apiClient.interceptors.request.use(
  (config) => {
    console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.warn(`[API Warning] Backend endpoint error: ${error.message}`);
    return Promise.reject(error);
  }
);

export const getCurrentUser = () => {
  if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
    try {
      const stored = localStorage.getItem('auth_user');
      if (stored) return JSON.parse(stored);
    } catch (e) {}
  }
  return null;
};

export const FreelancerApiService = {
  // Contracts
  getContracts: () => apiClient.get('/contracts'),
  getFreelancerContracts: (freelancerName?: string) => {
    const user = getCurrentUser();
    const name = freelancerName || user?.fullName || '';
    return apiClient.get(`/contracts/freelancer?freelancerName=${encodeURIComponent(name)}`);
  },
  getContract: (id: string) => apiClient.get(`/contracts/${id}`),
  getContractDownloadUrl: (id: string) => `${API_BASE_URL}/contracts/${id}/download`,
  acceptContract: (id: string, signerName?: string) => {
    const user = getCurrentUser();
    const name = signerName || user?.fullName || '';
    return apiClient.post(`/contracts/${id}/accept?signerName=${encodeURIComponent(name)}`);
  },
  rejectContract: (id: string, reason = 'Declined by freelancer') =>
    apiClient.post(`/contracts/${id}/reject?reason=${encodeURIComponent(reason)}`),

  // Projects
  getProjects: () => apiClient.get('/projects'),
  getFreelancerProjects: (freelancerName?: string) => {
    const user = getCurrentUser();
    const name = freelancerName || user?.fullName || '';
    return apiClient.get(`/freelancer/projects?freelancerName=${encodeURIComponent(name)}`);
  },
  getProject: (id: string) => apiClient.get(`/projects/${id}`),
  getProjectMilestones: (id: string) => apiClient.get(`/projects/${id}/milestones`),
  getProjectActivities: (id: string) => apiClient.get(`/projects/${id}/activities`),
  getProjectFiles: (id: string) => apiClient.get(`/projects/${id}/files`),

  // Milestones & Deliverables
  getMilestone: (id: string) => apiClient.get(`/milestones/${id}`),
  submitDeliverable: (milestoneId: string, data: { fileName: string; fileSize?: string; notes?: string }) =>
    apiClient.post(`/milestones/${milestoneId}/deliverables`, data),
  getDeliverables: (milestoneId: string) => apiClient.get(`/milestones/${milestoneId}/deliverables`),
  getDeliverable: (id: string) => apiClient.get(`/deliverables/${id}`),
  approveDeliverable: (id: string) => apiClient.post(`/deliverables/${id}/approve`),
  rejectDeliverable: (id: string, feedback?: string) =>
    apiClient.post(`/deliverables/${id}/reject`, { feedback }),

  // Disputes
  getDisputes: (freelancerName?: string) =>
    apiClient.get('/disputes', { params: freelancerName ? { freelancerName } : {} }),
  getDispute: (id: string) => apiClient.get(`/disputes/${id}`),
  createDispute: (data: {
    project: string;
    issueType: string;
    description: string;
    amount?: number;
    parties?: string;
    clientName?: string;
    freelancerName?: string;
    contractId?: string;
    priority?: string;
    evidenceFile?: string;
  }) => apiClient.post('/disputes', data),
  addDisputeMessage: (disputeId: string, data: { senderName: string; senderRole: string; message: string }) =>
    apiClient.post(`/disputes/${disputeId}/messages`, data),
  resolveDispute: (id: string, data: { status: string; statusType?: string; resolutionNote?: string }) =>
    apiClient.put(`/disputes/${id}/resolve`, data),

  // Profile
  getProfile: (email?: string) => {
    const user = getCurrentUser();
    const targetEmail = email || user?.email;
    if (targetEmail) {
      return apiClient.get('/freelancer/profile', { params: { email: targetEmail } });
    }
    return apiClient.get('/freelancer/profile');
  },
  updateProfile: (data: any, email?: string) => {
    const user = getCurrentUser();
    const targetEmail = email || user?.email || data?.email;
    if (targetEmail) {
      return apiClient.put('/freelancer/profile', data, { params: { email: targetEmail } });
    }
    return apiClient.put('/freelancer/profile', data);
  },
  addSkill: (skill: string, email?: string) => {
    const user = getCurrentUser();
    const targetEmail = email || user?.email || '';
    return apiClient.post('/freelancer/profile/skills', { skill, email: targetEmail });
  },
  removeSkill: (skill: string, email?: string) => {
    const user = getCurrentUser();
    const targetEmail = email || user?.email || '';
    return apiClient.delete('/freelancer/profile/skills', { data: { skill, email: targetEmail } });
  },

  // Notifications
  getNotifications: () => apiClient.get('/notifications'),
  getNotification: (id: number | string) => apiClient.get(`/notifications/${id}`),
  markNotificationAsRead: (id: number | string) => apiClient.put(`/notifications/${id}/read`),
  markAllNotificationsAsRead: () => apiClient.put('/notifications/read-all'),

  // Files
  getFileDownloadUrl: (fileId: string) => `${API_BASE_URL}/files/${fileId}/download`,
  getEntityFiles: (entityType: string, entityId: string) =>
    apiClient.get(`/files/entity/${entityType}/${entityId}`),
};

export default apiClient;
