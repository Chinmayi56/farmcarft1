// Admin notification store.
//
// Frontend-only for now (same pattern as orderStorage/offerStorage —
// localStorage-backed, seeded lazily). Real notification-worthy events
// already happening in the admin app (an order status change, a stock
// update that crosses into Low/Out of Stock) call `addNotification` from
// the data layer that owns that mutation, so no page component has to know
// about notifications directly.
//
// To wire this to the FastAPI backend later: replace `loadNotifications` /
// `persistNotifications` with API calls, and replace the polling watcher in
// NotificationContext with a WebSocket/SSE subscription that calls
// `addNotification` when the server pushes an event. Everything downstream
// (the bell UI, the sound, the mute preference) stays the same.

export type NotificationType = "order" | "stock" | "system";

export interface AdminNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  createdAt: string; // ISO timestamp
  read: boolean;
}

const STORAGE_KEY = "farmcraft_admin_notifications";
const MAX_STORED = 50;

// Fired whenever the notification list changes, so any mounted
// NotificationProvider can re-sync — including when the change came from
// outside React (e.g. a data-layer mutation function, not a component).
export const NOTIFICATIONS_EVENT = "farmcraft:admin-notifications-changed";

function emitChange() {
  window.dispatchEvent(new CustomEvent(NOTIFICATIONS_EVENT));
}

export function loadNotifications(): AdminNotification[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as AdminNotification[];
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    // fall through to an empty list on any parse error
  }
  return [];
}

export function persistNotifications(list: AdminNotification[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list.slice(0, MAX_STORED)));
  emitChange();
}

function makeId(): string {
  return `NTF-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export function addNotification(input: {
  type: NotificationType;
  title: string;
  message: string;
}): AdminNotification[] {
  const list = loadNotifications();
  const entry: AdminNotification = {
    id: makeId(),
    type: input.type,
    title: input.title,
    message: input.message,
    createdAt: new Date().toISOString(),
    read: false,
  };
  const next = [entry, ...list];
  persistNotifications(next);
  return next;
}

export function markNotificationRead(id: string): AdminNotification[] {
  const next = loadNotifications().map((n) => (n.id === id ? { ...n, read: true } : n));
  persistNotifications(next);
  return next;
}

export function markAllNotificationsRead(): AdminNotification[] {
  const next = loadNotifications().map((n) => ({ ...n, read: true }));
  persistNotifications(next);
  return next;
}

export function unreadCount(list: AdminNotification[]): number {
  return list.filter((n) => !n.read).length;
}
