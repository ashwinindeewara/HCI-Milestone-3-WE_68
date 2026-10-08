import apiClient from './api';

const TOKEN_KEY = 'freelanceflow_auth_token';
const USER_KEY = 'freelanceflow_user_data';

// Cross-Platform Session Storage Utility (Web, Android, iOS)
const storage = {
  getItem: (key: string): string | null => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        return window.localStorage.getItem(key);
      }
    } catch {
      // Memory fallback
    }
    return null;
  },
  setItem: (key: string, value: string): void => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(key, value);
      }
    } catch {
      // Memory fallback
    }
  },
  removeItem: (key: string): void => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(key);
      }
    } catch {
      // Memory fallback
    }
  },
  clear: (): void => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(TOKEN_KEY);
        window.localStorage.removeItem(USER_KEY);
      }
    } catch {
      // Memory fallback
    }
  },
};

export const matchesUserIdentity = (recordedName: string | null | undefined, identities: unknown[]) => {
  const normalize = (value: unknown) =>
    typeof value === 'string' ? value.trim().toLowerCase().replace(/\s+/g, ' ') : '';
  const normalizedName = normalize(recordedName);

  if (!normalizedName) return false;

  return identities.some((identity) => {
    const normalizedIdentity = normalize(identity);
    return normalizedIdentity.length > 0 && (
      normalizedName === normalizedIdentity ||
      normalizedName.startsWith(`${normalizedIdentity} `) ||
      normalizedIdentity.startsWith(`${normalizedName} `)
    );
  });
};

/**
 * Saves authentication session token and user profile details
 */
export const saveAuthSession = (token: string, userData?: any) => {
  if (token) {
    storage.setItem(TOKEN_KEY, token);
    apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }
  if (userData) {
    storage.setItem(USER_KEY, JSON.stringify(userData));
  }
};

/**
 * Retrieves saved authentication token
 */
export const getAuthToken = (): string | null => {
  return storage.getItem(TOKEN_KEY);
};

/**
 * Retrieves saved user details
 */
export const getSavedUserData = (): any | null => {
  const data = storage.getItem(USER_KEY);
  console.log(USER_KEY);
  if (data) {
    try {
      return JSON.parse(data);
    } catch {
      return null;
    }
  }
  return null;
};

/**
 * Updates stored user profile details in active session
 */
export const updateSavedUserData = (updatedFields: any): any => {
  const current = getSavedUserData() || {};
  const merged = { ...current, ...updatedFields };
  storage.setItem(USER_KEY, JSON.stringify(merged));
  return merged;
};

/**
 * Clears stored authentication session tokens and API authorization headers
 */
export const clearAuthSession = (): void => {
  storage.clear();
  delete apiClient.defaults.headers.common['Authorization'];
};

/**
 * Complete Logout execution helper:
 * 1. Clears stored tokens/session data from storage & API client headers
 * 2. Replaces route stack to /login, preventing hardware back button navigation
 */
export const performLogout = (router: any): void => {
  clearAuthSession();

  if (router) {
    try {
      if (typeof router.dismissAll === 'function') {
        router.dismissAll();
      }
    } catch {
      // Ignored if stack has no dismissable screens
    }
    try {
      router.replace('/login');
    } catch {
      try {
        router.push('/login');
      } catch {
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
      }
    }
  }
};
