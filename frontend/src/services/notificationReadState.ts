/**
 * Client notification read state shared by the dashboard and notification screen.
 * Expo Web persists to localStorage; native Expo keeps state in module memory for
 * the current app process. Read status is stored per signed-in client.
 */
export interface NotificationReadState {
  readIds: string[];
}

const memory = new Map<string, NotificationReadState>();
const MAX_READ_IDS = 5000;

function loadState(key: string): NotificationReadState {
  const cached = memory.get(key);
  if (cached) return cached;

  try {
    const browserStorage = (globalThis as any)?.localStorage;
    const raw = browserStorage?.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      const state: NotificationReadState = {
        readIds: Array.isArray(parsed?.readIds) ? parsed.readIds.map(String) : [],
      };
      memory.set(key, state);
      return state;
    }
  } catch (error) {
    console.info('[Notifications] Could not load read state:', error);
  }

  const empty: NotificationReadState = { readIds: [] };
  memory.set(key, empty);
  return empty;
}

function saveState(key: string, ids: string[]) {
  const state: NotificationReadState = {
    readIds: Array.from(new Set(ids.filter(Boolean).map(String))).slice(-MAX_READ_IDS),
  };
  memory.set(key, state);

  try {
    const browserStorage = (globalThis as any)?.localStorage;
    browserStorage?.setItem(key, JSON.stringify(state));
  } catch (error) {
    console.info('[Notifications] Could not persist read state:', error);
  }
}

export function getClientNotificationReadKey(owner: string): string {
  const normalizedOwner = String(owner || 'unknown-client').trim().toLowerCase();
  return `freelancerflow:client-notifications:read:${normalizedOwner}`;
}

/** Count unique activity IDs that have not yet been viewed. */
export function countUnreadNotifications(key: string, ids: string[]): number {
  const read = new Set(loadState(key).readIds);
  const uniqueIds = Array.from(new Set(ids.filter(Boolean).map(String)));
  return uniqueIds.filter((id) => !read.has(id)).length;
}

/** Mark the supplied IDs as viewed without marking future activity as read. */
export function markNotificationsRead(key: string, ids: string[]) {
  const previous = loadState(key).readIds;
  saveState(key, [...previous, ...ids]);
}
