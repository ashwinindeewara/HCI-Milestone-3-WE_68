/**
 * Session & User Credentials Storage Utility
 * Supports Web LocalStorage and In-Memory Fallback
 */

export interface UserSession {
  id?: number | string;
  fullName?: string;
  email?: string;
  role?: string;
  status?: string;
  token?: string;
}

const STORAGE_KEY = 'freelance_app_user_session';
let inMemorySession: UserSession | null = null;

export const saveUserSession = (session: UserSession) => {
  inMemorySession = session;
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    }
  } catch (e) {
    console.warn('LocalStorage save error:', e);
  }
};

export const getUserSession = (): UserSession | null => {
  if (inMemorySession) return inMemorySession;
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const data = window.localStorage.getItem(STORAGE_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        inMemorySession = parsed;
        return parsed;
      }
    }
  } catch (e) {
    console.warn('LocalStorage read error:', e);
  }
  return null;
};

export const clearUserSession = () => {
  inMemorySession = null;
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  } catch (e) {
    console.warn('LocalStorage clear error:', e);
  }
};

export default {
  saveUserSession,
  getUserSession,
  clearUserSession,
};
