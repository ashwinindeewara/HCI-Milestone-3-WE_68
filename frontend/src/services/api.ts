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
    return 'http://10.0.2.2:8083/api';
  }
  return 'http://localhost:8083/api';
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

// Dual-layer fast cache (In-memory + localStorage persistence for instant page loads across reloads)
const apiCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL_MS = 60000; // 60 seconds background revalidate freshness

export const getCachedApiData = <T = any>(url: string, params?: any): T | null => {
  if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
    try {
      const cacheKey = `${url}?${JSON.stringify(params || {})}`;
      const memory = apiCache.get(cacheKey);
      if (memory) return memory.data as T;

      const stored = localStorage.getItem(`api_cache_${cacheKey}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && parsed.data !== undefined) {
          apiCache.set(cacheKey, parsed);
          return parsed.data as T;
        }
      }
    } catch {}
  }
  return null;
};

export const clearApiCache = (urlPrefix?: string) => {
  apiCache.clear();
  if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
    try {
      if (!urlPrefix) {
        const keysToRemove: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (k && k.startsWith('api_cache_')) keysToRemove.push(k);
        }
        keysToRemove.forEach((k) => localStorage.removeItem(k));
      } else {
        const keysToRemove: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (k && k.startsWith('api_cache_') && k.includes(urlPrefix)) keysToRemove.push(k);
        }
        keysToRemove.forEach((k) => localStorage.removeItem(k));
      }
    } catch {}
  }
};

apiClient.interceptors.request.use(
  (config) => {
    const method = config.method?.toUpperCase();
    if (method && ['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) {
      // Invalidate cache immediately on mutations
      clearApiCache();
    }
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

// Intercept get() with Stale-While-Revalidate for 0ms perceived load time
const originalGet = apiClient.get.bind(apiClient);
apiClient.get = ((url: string, config?: any) => {
  const cacheKey = `${url}?${JSON.stringify(config?.params || {})}`;
  const now = Date.now();

  // 1. Check memory cache
  let cached = apiCache.get(cacheKey);

  // 2. Check localStorage cache
  if (!cached && Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
    try {
      const stored = localStorage.getItem(`api_cache_${cacheKey}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && parsed.data !== undefined) {
          cached = parsed;
          apiCache.set(cacheKey, parsed);
        }
      }
    } catch {}
  }

  // Fresh cache hit: return immediately
  if (cached && now - cached.timestamp < CACHE_TTL_MS) {
    return Promise.resolve({
      data: cached.data,
      status: 200,
      statusText: 'OK',
      headers: {},
      config: config || {},
    } as any);
  }

  // Stale cache hit: return cached data immediately and revalidate in background!
  if (cached) {
    originalGet(url, config)
      .then((response) => {
        const entry = { data: response.data, timestamp: Date.now() };
        apiCache.set(cacheKey, entry);
        if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
          try {
            localStorage.setItem(`api_cache_${cacheKey}`, JSON.stringify(entry));
          } catch {}
        }
      })
      .catch(() => {});

    return Promise.resolve({
      data: cached.data,
      status: 200,
      statusText: 'OK',
      headers: {},
      config: config || {},
    } as any);
  }

  // No cache: fetch from network and store in cache
  return originalGet(url, config).then((response) => {
    const entry = { data: response.data, timestamp: Date.now() };
    apiCache.set(cacheKey, entry);
    if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
      try {
        localStorage.setItem(`api_cache_${cacheKey}`, JSON.stringify(entry));
      } catch {}
    }
    return response;
  });
}) as any;

export const getCurrentUser = () => {
  if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
    try {
      const stored = localStorage.getItem('auth_user');
      if (stored) {
        const u = JSON.parse(stored);
        return {
          ...u,
          fullName: u.fullName || localStorage.getItem('auth_name') || '',
          email: u.email || localStorage.getItem('auth_email') || '',
        };
      }
      const email = localStorage.getItem('auth_email');
      const fullName = localStorage.getItem('auth_name');
      if (email || fullName) {
        return {
          email: email || '',
          fullName: fullName || '',
          role: localStorage.getItem('auth_role') || 'FREELANCER',
        };
      }
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
  getDisputes: (freelancerName?: string) => {
    const user = getCurrentUser();
    const name = freelancerName || user?.fullName || '';
    return apiClient.get('/disputes', { params: name ? { freelancerName: name } : {} });
  },
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
  uploadProfileImage: async (file: any, email?: string) => {
    const user = getCurrentUser();
    const targetEmail = email || user?.email || '';
    const formData = new FormData();
    formData.append('file', file);
    if (targetEmail) {
      formData.append('email', targetEmail);
    }
    const res = await fetch(`${API_BASE_URL}/freelancer/profile/image${targetEmail ? `?email=${encodeURIComponent(targetEmail)}` : ''}`, {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) {
      throw new Error(`Profile image upload failed: ${res.statusText}`);
    }
    return res.json();
  },
  uploadFile: async (file: any, relatedEntityType = 'PROJECT', relatedEntityId = 'GENERAL', uploadedBy?: string) => {
    const user = getCurrentUser();
    const formData = new FormData();
    formData.append('file', file);
    formData.append('relatedEntityType', relatedEntityType);
    formData.append('relatedEntityId', relatedEntityId);
    formData.append('uploadedBy', uploadedBy || user?.fullName || 'Freelancer');
    const res = await fetch(`${API_BASE_URL}/files/upload`, {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) {
      throw new Error(`File upload failed: ${res.statusText}`);
    }
    return res.json();
  },
  getFiles: (entityType?: string, entityId?: string) => {
    if (entityType && entityId) {
      return apiClient.get(`/files/entity/${entityType}/${entityId}`);
    }
    return apiClient.get('/files');
  },


  // Notifications
  getNotifications: (freelancerName?: string, freelancerEmail?: string) => {
    const user = getCurrentUser();
    const name = freelancerName || user?.fullName || '';
    const email = freelancerEmail || user?.email || '';
    const params: any = {};
    if (name) params.freelancerName = name;
    if (email) params.freelancerEmail = email;
    return apiClient.get('/notifications', { params });
  },
  getNotification: (id: number | string) => apiClient.get(`/notifications/${id}`),
  markNotificationAsRead: (id: number | string) => apiClient.put(`/notifications/${id}/read`),
  markAllNotificationsAsRead: () => apiClient.put('/notifications/read-all'),

  // Escrow & Transactions
  getEscrowSummary: (freelancerName?: string) => {
    const user = getCurrentUser();
    const name = freelancerName || user?.fullName || '';
    return apiClient.get('/escrow/summary', { params: name ? { freelancerName: name } : {} });
  },
  getTransactions: (type?: string, freelancerName?: string) => {
    const user = getCurrentUser();
    const name = freelancerName || user?.fullName || '';
    return apiClient.get('/transactions', {
      params: {
        ...(type && type !== 'ALL' ? { type } : {}),
        ...(name ? { freelancerName: name } : {}),
      },
    });
  },

  // Payout & Bank Accounts
  getPayoutAccounts: (email?: string, freelancerName?: string) => {
    const user = getCurrentUser();
    const targetEmail = email || user?.email || '';
    const name = freelancerName || user?.fullName || '';
    return apiClient.get('/payout-accounts', {
      params: {
        ...(targetEmail ? { email: targetEmail } : {}),
        ...(name ? { freelancerName: name } : {}),
      },
    });
  },
  createPayoutAccount: (data: any) => apiClient.post('/payout-accounts', data),
  updatePayoutAccount: (id: string, data: any) => apiClient.put(`/payout-accounts/${id}`, data),
  setDefaultPayoutAccount: (id: string, email?: string) => {
    const user = getCurrentUser();
    const targetEmail = email || user?.email || '';
    return apiClient.put(`/payout-accounts/${id}/default`, null, {
      params: targetEmail ? { email: targetEmail } : {},
    });
  },
  deletePayoutAccount: (id: string) => apiClient.delete(`/payout-accounts/${id}`),

  // Files
  getFileDownloadUrl: (fileId: string) => `${API_BASE_URL}/files/${fileId}/download`,
  getEntityFiles: (entityType: string, entityId: string) =>
    apiClient.get(`/files/entity/${entityType}/${entityId}`),
};

export default apiClient;
