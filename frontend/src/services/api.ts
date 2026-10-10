import axios from 'axios';
import { Platform } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { getUserSession } from './storage';
import { getSavedUserData, getAuthToken } from './authService';

export interface PickedDocument {
  uri: string;
  name: string;
  type: string;
  size?: number;
  file?: File;
}

/**
 * Pick single or multiple documents/files securely from native device storage or web browser.
 */
export const pickDocument = async (options?: {
  multiple?: boolean;
  type?: string | string[];
}): Promise<PickedDocument[]> => {
  try {
    const result = await DocumentPicker.getDocumentAsync({
      type: options?.type || '*/*',
      copyToCacheDirectory: true,
      multiple: options?.multiple ?? false,
    });

    if (result.canceled || !result.assets || result.assets.length === 0) {
      return [];
    }

    return result.assets.map((asset) => ({
      uri: asset.uri,
      name: asset.name || 'document',
      type: asset.mimeType || (asset as any).type || 'application/octet-stream',
      size: asset.size,
      file: asset.file,
    }));
  } catch (error) {
    console.warn('Error picking document:', error);
    return [];
  }
};

/**
 * Safely append file to FormData for Spring Boot multipart endpoints across Web and Native React Native.
 */
export const appendFileToFormData = (formData: FormData, fieldName: string, file: any) => {
  if (Platform.OS === 'web' && file instanceof File) {
    formData.append(fieldName, file);
  } else if (Platform.OS === 'web' && file?.file instanceof File) {
    formData.append(fieldName, file.file);
  } else if (typeof file === 'object' && file?.uri) {
    formData.append(fieldName, {
      uri: file.uri,
      name: file.name || file.fileName || 'upload',
      type: file.type || file.mimeType || 'application/octet-stream',
    } as any);
  } else if (typeof file === 'string' && (file.startsWith('file://') || file.startsWith('content://') || file.startsWith('ph://'))) {
    formData.append(fieldName, {
      uri: file,
      name: file.split('/').pop() || 'upload',
      type: 'application/octet-stream',
    } as any);
  } else {
    formData.append(fieldName, file);
  }
};


/**
 * Spring Boot Backend API Base URL Configuration:
 * - Web / standard: http://localhost:8080/api
 * - Android Emulator: http://10.0.2.2:8080/api
 */
const GET_BASE_URL = () => {
  const envUrl = process.env.EXPO_PUBLIC_API_URL;
  if (envUrl) {
    let url = envUrl.trim();
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = `https://${url}`;
    }
    if (!url.endsWith('/api') && !url.endsWith('/api/')) {
      url = `${url.replace(/\/$/, '')}/api`;
    }
    if (Platform.OS === 'android' && url.includes('localhost')) {
      return url.replace('localhost', '10.0.2.2');
    }
    return url;
  }
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:8080/api';
  }
  return 'http://localhost:8080/api';
};

export const API_BASE_URL = GET_BASE_URL();

export const calculateMilestoneProgress = (milestones: Array<{ status?: string }>): number => {
  const completedCount = milestones.filter((milestone) =>
    ['COMPLETED', 'RELEASED', 'APPROVED', 'SUBMITTED'].includes(String(milestone.status).toUpperCase())
  ).length;
  if (milestones.length === 0) return 0;
  if (milestones.length === 3) {
    return completedCount === 1 ? 30 : completedCount === 2 ? 65 : completedCount === 3 ? 100 : 0;
  }
  return Math.round((completedCount / milestones.length) * 100);
};

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

export const getCurrentUser = () => {
  const saved = getSavedUserData();
  if (saved && (saved.email || saved.fullName)) {
    return {
      ...saved,
      fullName: saved.fullName || saved.name || '',
      email: saved.email || '',
      role: String(saved.role || 'FREELANCER').toUpperCase(),
    };
  }
  const session = getUserSession();
  if (session && (session.email || session.fullName)) {
    return {
      ...session,
      fullName: session.fullName || '',
      email: session.email || '',
      role: String(session.role || 'FREELANCER').toUpperCase(),
    };
  }
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const stored = localStorage.getItem('auth_user');
      if (stored) {
        const u = JSON.parse(stored);
        return {
          ...u,
          fullName: u.fullName || localStorage.getItem('auth_name') || '',
          email: u.email || localStorage.getItem('auth_email') || '',
          role: String(u.role || localStorage.getItem('auth_role') || 'FREELANCER').toUpperCase(),
        };
      }
      const rawSession = localStorage.getItem('freelance_app_user_session') || localStorage.getItem('freelanceflow_user_data');
      if (rawSession) {
        const u = JSON.parse(rawSession);
        return {
          ...u,
          fullName: u.fullName || '',
          email: u.email || '',
          role: String(u.role || 'FREELANCER').toUpperCase(),
        };
      }
      const email = localStorage.getItem('auth_email');
      const fullName = localStorage.getItem('auth_name');
      if (email || fullName) {
        return {
          email: email || '',
          fullName: fullName || '',
          role: String(localStorage.getItem('auth_role') || 'FREELANCER').toUpperCase(),
        };
      }
    } catch (e) {}
  }
  return null;
};

const getCurrentUserScope = (): string => {
  const user = getCurrentUser();
  if (user?.email) {
    return user.email.toLowerCase().trim();
  }
  return 'anonymous';
};

export const getCachedApiData = <T = any>(url: string, params?: any): T | null => {
  const scope = getCurrentUserScope();
  const cacheKey = `${scope}:${url}?${JSON.stringify(params || {})}`;
  const memory = apiCache.get(cacheKey);
  if (memory) return memory.data as T;

  if (typeof window !== 'undefined' && window.localStorage) {
    try {
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
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && (k.startsWith('api_cache_') || k.startsWith('profile_cache_'))) {
          if (!urlPrefix || k.includes(urlPrefix)) {
            keysToRemove.push(k);
          }
        }
      }
      keysToRemove.forEach((k) => localStorage.removeItem(k));
    } catch {}
  }
};

apiClient.interceptors.request.use(
  (config) => {
    // Dynamically attach active Authorization Bearer Token on every request across platforms
    let token: string | null | undefined = getAuthToken() || getUserSession()?.token;
    if (!token && typeof window !== 'undefined' && window.localStorage) {
      token = localStorage.getItem('freelanceflow_auth_token') || localStorage.getItem('auth_token') || undefined;
    }

    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }

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
  const cacheKey = `${getCurrentUserScope()}:${url}?${JSON.stringify(config?.params || {})}`;
  const now = Date.now();

  // 1. Check memory cache
  let cached = apiCache.get(cacheKey);

  // 2. Check localStorage cache
  if (!cached && typeof window !== 'undefined' && window.localStorage) {
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
        if (typeof window !== 'undefined' && window.localStorage) {
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
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        localStorage.setItem(`api_cache_${cacheKey}`, JSON.stringify(entry));
      } catch {}
    }
    return response;
  });
}) as any;

export const FreelancerApiService = {
  // Contracts
  getContracts: () => {
    const user = getCurrentUser();
    const name = user?.fullName || '';
    const email = user?.email || '';
    return apiClient.get('/contracts', {
      params: {
        ...(name ? { freelancerName: name } : {}),
        ...(email ? { email } : {}),
      },
    });
  },
  getFreelancerContracts: (freelancerName?: string, emailParam?: string) => {
    const user = getCurrentUser();
    const name = freelancerName || user?.fullName || '';
    const email = emailParam || user?.email || '';
    const params: any = {};
    if (name) params.freelancerName = name;
    if (email) params.email = email;
    return apiClient.get('/contracts/freelancer', { params });
  },
  getContract: (id: string) => apiClient.get(`/contracts/${id}`),
  deleteAccount: (email: string) => apiClient.delete('/users/delete-by-email', { params: { email } }),
  getContractDownloadUrl: (id: string) => `${API_BASE_URL}/contracts/${id}/download`,
  acceptContract: (id: string, signerName?: string) => {
    const user = getCurrentUser();
    const name = signerName || user?.fullName || '';
    return apiClient.post(`/contracts/${id}/accept?signerName=${encodeURIComponent(name)}`);
  },
  rejectContract: (id: string, reason = 'Declined by freelancer') =>
    apiClient.post(`/contracts/${id}/reject?reason=${encodeURIComponent(reason)}`),

  // Projects
  getProjects: () => {
    const user = getCurrentUser();
    const name = user?.fullName || '';
    const email = user?.email || '';
    return apiClient.get('/projects', {
      params: {
        ...(name ? { freelancerName: name } : {}),
        ...(email ? { email } : {}),
      },
    });
  },
  getFreelancerProjects: (freelancerName?: string, emailParam?: string) => {
    const user = getCurrentUser();
    const name = freelancerName || user?.fullName || '';
    const email = emailParam || user?.email || '';
    const params: any = {};
    if (name) params.freelancerName = name;
    if (email) params.email = email;
    return apiClient.get('/freelancer/projects', { params });
  },
  getClientProjects: (clientName?: string) => {
    const user = getCurrentUser();
    return apiClient.get('/client/projects', {
      params: { clientName: clientName || user?.fullName || '' },
    });
  },
  getProject: (id: string) => apiClient.get(`/projects/${id}`),
  getProjectMilestones: (id: string) => apiClient.get(`/projects/${id}/milestones`),
  getProjectActivities: (id: string) => apiClient.get(`/projects/${id}/activities`),
  getProjectFiles: (id: string) => apiClient.get(`/projects/${id}/files`),

  // Milestones & Deliverables
  getContractMilestones: (contractId: string) => apiClient.get(`/milestones/contract/${contractId}`),
  getMilestone: (id: string) => apiClient.get(`/milestones/${id}`),
  submitDeliverable: (milestoneId: string, data: { fileName: string; fileSize?: string; notes?: string }) =>
    apiClient.post(`/milestones/${milestoneId}/deliverables`, data),
  getDeliverables: (milestoneId: string) => apiClient.get(`/milestones/${milestoneId}/deliverables`),
  getDeliverable: (id: string) => apiClient.get(`/deliverables/${id}`),
    updateDeliverable: (id: string, data: { fileName: string; fileSize?: string; notes?: string }) =>
      apiClient.put(`/deliverables/${id}`, data),
    deleteDeliverable: (id: string) => apiClient.delete(`/deliverables/${id}`),
  approveDeliverable: (id: string) => apiClient.post(`/deliverables/${id}/approve`),
  rejectDeliverable: (id: string, feedback?: string) =>
    apiClient.post(`/deliverables/${id}/reject`, { feedback }),

  // Disputes
  getDisputes: (freelancerName?: string, email?: string) => {
    const user = getCurrentUser();
    const name = freelancerName || user?.fullName || '';
    const targetEmail = email || user?.email || '';
    return apiClient.get('/disputes', { params: { ...(name ? { freelancerName: name } : {}), ...(targetEmail ? { email: targetEmail } : {}) } });
  },
  getClientDisputes: (clientName?: string, email?: string) =>
    apiClient.get('/disputes', {
      params: {
        ...(clientName ? { clientName } : {}),
        ...(email ? { clientEmail: email } : {}),
      },
    }),
  getDispute: (id: string, viewerName?: string, viewerEmail?: string, role?: string) =>
    apiClient.get(`/disputes/${id}`, {
      params: {
        ...(viewerName ? { viewerName } : {}),
        ...(viewerEmail ? { viewerEmail } : {}),
        ...(role ? { role } : {}),
      },
    }),
  createDispute: (data: {
    project: string;
    issueType: string;
    description: string;
    amount?: number;
    parties?: string;
    clientName?: string;
    freelancerName?: string;
    freelancerEmail?: string;
    contractId?: string;
    priority?: string;
    evidenceFile?: string;
  }) => apiClient.post('/disputes', data),
  updateDispute: (id: string, data: {
    project: string;
    issueType: string;
    description: string;
    evidenceFile?: string;
  }) => apiClient.put(`/disputes/${id}`, data),
  deleteDispute: (id: string) => apiClient.delete(`/disputes/${id}`),
  addDisputeMessage: (disputeId: string, data: { senderName: string; senderRole: string; message: string }) =>
    apiClient.post(`/disputes/${disputeId}/messages`, data),
  resolveDispute: (id: string, data: { status: string; statusType?: string; resolutionNote?: string }) =>
    apiClient.put(`/disputes/${id}/resolve`, data),

  // Profile
  getProfile: (email?: string) => {
    const user = getCurrentUser();
    let targetEmail = email || user?.email;
    if (!targetEmail && Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
      try {
        targetEmail = localStorage.getItem('auth_email') || JSON.parse(localStorage.getItem('freelance_app_user_session') || '{}')?.email;
      } catch {}
    }
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
    appendFileToFormData(formData, 'file', file);
    if (targetEmail) {
      formData.append('email', targetEmail);
    }
    const res = await apiClient.post('/freelancer/profile/image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      params: targetEmail ? { email: targetEmail } : undefined,
    });
    return res.data;
  },
  deleteProfile: (idOrEmail?: string | number) => {
    if (typeof idOrEmail === 'number' || (typeof idOrEmail === 'string' && /^\d+$/.test(idOrEmail))) {
      return apiClient.delete(`/freelancer/profile/${idOrEmail}`);
    }
    const user = getCurrentUser();
    const targetEmail = (typeof idOrEmail === 'string' ? idOrEmail : '') || user?.email || '';
    if (targetEmail) {
      return apiClient.delete('/freelancer/profile', { params: { email: targetEmail } });
    }
    return apiClient.delete('/freelancer/profile');
  },
  deleteUserProfileById: (id: number | string) => {
    return apiClient.delete(`/profile/${id}`);
  },
  uploadFile: async (file: any, relatedEntityType = 'PROJECT', relatedEntityId = 'GENERAL', uploadedBy?: string) => {
    const user = getCurrentUser();
    const formData = new FormData();
    appendFileToFormData(formData, 'file', file);
    formData.append('relatedEntityType', relatedEntityType);
    formData.append('relatedEntityId', relatedEntityId);
    formData.append('uploadedBy', uploadedBy || user?.fullName || 'Freelancer');
    if (user?.email) formData.append('uploadedByEmail', user.email);
    const res = await apiClient.post('/files/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },
  uploadProjectFile: async (projectId: string, file: any, uploadedBy?: string) => {
    const user = getCurrentUser();
    const formData = new FormData();
    appendFileToFormData(formData, 'file', file);
    formData.append('uploadedBy', uploadedBy || user?.fullName || 'Freelancer');
    if (user?.email) formData.append('uploadedByEmail', user.email);
    const res = await apiClient.post(`/projects/${projectId}/files`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },
  getFiles: (entityType?: string, entityId?: string) => {
    if (entityType && entityId) {
      return apiClient.get(`/files/entity/${entityType}/${entityId}`);
    }
    const user = getCurrentUser();
    return apiClient.get('/files', { params: user?.email ? { ownerEmail: user.email } : {} });
  },


  // Notifications
  getNotifications: (
    recipientName?: string,
    recipientEmail?: string,
    recipientRole: 'CLIENT' | 'FREELANCER' = 'FREELANCER'
  ) => {
    const user = getCurrentUser();
    const name = recipientName || user?.fullName || '';
    const email = recipientEmail || user?.email || '';
    const params: Record<string, string> = { recipientRole };
    if (name) params[recipientRole === 'CLIENT' ? 'clientName' : 'freelancerName'] = name;
    if (email) params.email = email;
    return apiClient.get('/notifications', { params });
  },
  getNotification: (
    id: number | string,
    recipientEmail?: string,
    recipientName?: string,
    recipientRole: 'CLIENT' | 'FREELANCER' = 'FREELANCER'
  ) =>
    apiClient.get(`/notifications/${id}`, {
      params: { email: recipientEmail, name: recipientName, recipientRole },
    }),
  markNotificationAsRead: (
    id: number | string,
    recipientEmail?: string,
    recipientName?: string,
    recipientRole: 'CLIENT' | 'FREELANCER' = 'FREELANCER'
  ) =>
    apiClient.put(`/notifications/${id}/read`, null, {
      params: { email: recipientEmail, name: recipientName, recipientRole },
    }),
  markAllNotificationsAsRead: (
    recipientEmail?: string,
    recipientName?: string,
    recipientRole: 'CLIENT' | 'FREELANCER' = 'FREELANCER'
  ) =>
    apiClient.put('/notifications/read-all', null, {
      params: { email: recipientEmail, name: recipientName, recipientRole },
    }),

  // Escrow & Transactions
  getEscrowSummary: (freelancerName?: string, email?: string) => {
    const user = getCurrentUser();
    const name = freelancerName || user?.fullName || '';
    const targetEmail = email || user?.email || '';
    const params: any = {};
    if (name) params.freelancerName = name;
    if (targetEmail) params.email = targetEmail;
    return apiClient.get('/escrow/summary', { params });
  },
  getTransactions: (type?: string, freelancerName?: string, email?: string) => {
    const user = getCurrentUser();
    const name = freelancerName || user?.fullName || '';
    const targetEmail = email || user?.email || '';
    return apiClient.get('/transactions', {
      params: {
        ...(type && type !== 'ALL' ? { type } : {}),
        ...(name ? { freelancerName: name } : {}),
        ...(targetEmail ? { email: targetEmail } : {}),
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
  deletePayoutAccount: (id: string, email?: string) => {
    const targetEmail = email || getCurrentUser()?.email || '';
    return apiClient.delete(`/payout-accounts/${id}`, { params: targetEmail ? { email: targetEmail } : {} });
  },

  // Files
  getFileDownloadUrl: (fileId: string) => `${API_BASE_URL}/files/${fileId}/download`,
  getEntityFiles: (entityType: string, entityId: string) =>
    apiClient.get(`/files/entity/${entityType}/${entityId}`),

  // Staff Payment & Financial Reports
  getReportSummary: (email?: string, role?: string, days = 30) => {
    const user = getCurrentUser();
    const targetEmail = email || user?.email || '';
    const targetRole = role || user?.role || 'PAYMENT_STAFF';
    return apiClient.get('/staff/reports/summary', {
      params: {
        ...(targetEmail ? { email: targetEmail } : {}),
        ...(targetRole ? { role: targetRole } : {}),
        days,
      },
    });
  },
  generateReport: (email?: string, role?: string, days = 30) => {
    const user = getCurrentUser();
    const targetEmail = email || user?.email || '';
    const targetRole = role || user?.role || 'PAYMENT_STAFF';
    return apiClient.get('/staff/reports/generate', {
      params: {
        ...(targetEmail ? { email: targetEmail } : {}),
        ...(targetRole ? { role: targetRole } : {}),
        days,
      },
    });
  },
  exportReport: (email?: string, role?: string) => {
    const user = getCurrentUser();
    const targetEmail = email || user?.email || '';
    const targetRole = role || user?.role || 'PAYMENT_STAFF';
    return apiClient.get('/staff/reports/export', {
      params: {
        ...(targetEmail ? { email: targetEmail } : {}),
        ...(targetRole ? { role: targetRole } : {}),
      },
    });
  },
};

export default apiClient;
