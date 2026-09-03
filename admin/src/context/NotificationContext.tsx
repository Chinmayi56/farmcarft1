import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  loadNotifications,
  addNotification,
  markAllNotificationsRead,
  markNotificationRead,
  unreadCount as computeUnreadCount,
  NOTIFICATIONS_EVENT,
  type AdminNotification,
} from "../data/notificationStorage";
import { loadOrders, getSeenOrderIds, markOrderIdsSeen } from "../data/orderStorage";

const MUTE_KEY = "farmcraft_admin_notif_muted";
const NEW_ORDER_POLL_MS = 5000;

interface NotificationContextValue {
  notifications: AdminNotification[];
  unreadCount: number;
  muted: boolean;
  markRead: (id: string) => void;
  markAllRead: () => void;
  toggleMute: () => void;
}

const NotificationContext = createContext<NotificationContextValue | null>(null);

// Short, soft two-tone chime synthesised with the Web Audio API — no audio
// file to bundle, and easy to keep subtle. Runs on a lazily-created
// AudioContext so it respects browser autoplay restrictions (see the
// unlock-on-first-interaction handling in the provider below).
function playChime(ctx: AudioContext) {
  const now = ctx.currentTime;
  const notes: [number, number][] = [
    [880, now],
    [1108.7, now + 0.11],
  ];
  notes.forEach(([freq, start]) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(0.14, start + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.32);
    osc.connect(gain).connect(ctx.destination);
    osc.start(start);
    osc.stop(start + 0.34);
  });
}

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [muted, setMuted] = useState<boolean>(() => localStorage.getItem(MUTE_KEY) === "1");

  const audioCtxRef = useRef<AudioContext | null>(null);
  const unreadIdsRef = useRef<Set<string>>(new Set());
  const hasLoadedOnceRef = useRef(false);

  const sync = useCallback(() => {
    setNotifications(loadNotifications());
  }, []);

  // Create (or resume) the AudioContext on the first user gesture anywhere
  // in the app. Browsers block audio before any interaction, so this just
  // gets us ready to play the moment a real notification arrives.
  useEffect(() => {
    const unlock = () => {
      if (!audioCtxRef.current) {
        try {
          const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
          if (Ctor) audioCtxRef.current = new Ctor();
        } catch {
          // Web Audio unsupported — sound simply won't play, everything else still works.
        }
      } else if (audioCtxRef.current.state === "suspended") {
        audioCtxRef.current.resume().catch(() => {});
      }
    };
    document.addEventListener("pointerdown", unlock);
    document.addEventListener("keydown", unlock);
    return () => {
      document.removeEventListener("pointerdown", unlock);
      document.removeEventListener("keydown", unlock);
    };
  }, []);

  // Keep in sync with notification changes raised from anywhere (data-layer
  // mutations dispatch NOTIFICATIONS_EVENT; other tabs trigger `storage`).
  useEffect(() => {
    sync();
    window.addEventListener(NOTIFICATIONS_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(NOTIFICATIONS_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, [sync]);

  // Play the chime exactly once per notification that is new since the last
  // render — never on first load (so opening the app doesn't replay a
  // backlog of sounds) and never when a notification is merely read.
  useEffect(() => {
    if (!hasLoadedOnceRef.current) {
      hasLoadedOnceRef.current = true;
      unreadIdsRef.current = new Set(notifications.map((n) => n.id));
      return;
    }
    const currentIds = new Set(notifications.map((n) => n.id));
    let hasNew = false;
    currentIds.forEach((id) => {
      if (!unreadIdsRef.current.has(id)) hasNew = true;
    });
    unreadIdsRef.current = currentIds;
    if (hasNew && !muted && audioCtxRef.current) {
      if (audioCtxRef.current.state === "suspended") {
        audioCtxRef.current.resume().catch(() => {});
      }
      playChime(audioCtxRef.current);
    }
  }, [notifications, muted]);

  // Watches for orders that appear in the store that the admin hasn't been
  // notified about yet. Today this only fires when this same browser's
  // localStorage order list grows (e.g. once the backend/customer app and
  // admin app share real order data) — nothing here fabricates orders.
  useEffect(() => {
    const seen = getSeenOrderIds();
    loadOrders().then((initialOrders) => {
    if (seen.size === 0) {
      // First run ever in this browser — baseline against the existing
      // orders so we don't notify retroactively for orders that already existed.
      markOrderIdsSeen(initialOrders.map((o) => o.id));
    }
    });

    const poll = async () => {
      const current = getSeenOrderIds();
      const orders = await loadOrders();
      const unseen = orders.filter((o) => !current.has(o.id));
      if (unseen.length > 0) {
        unseen.forEach((order) => {
          addNotification({
            type: "order",
            title: "New order received",
            message: `Order ${order.id} — ${order.product} for ${order.customer}.`,
          });
        });
        markOrderIdsSeen(orders.map((o) => o.id));
      }
    };

    const interval = window.setInterval(() => { poll().catch(() => {}); }, NEW_ORDER_POLL_MS);
    return () => window.clearInterval(interval);
  }, []);

  const markRead = useCallback((id: string) => {
    setNotifications(markNotificationRead(id));
  }, []);

  const markAllRead = useCallback(() => {
    setNotifications(markAllNotificationsRead());
  }, []);

  const toggleMute = useCallback(() => {
    setMuted((m) => {
      const next = !m;
      localStorage.setItem(MUTE_KEY, next ? "1" : "0");
      return next;
    });
  }, []);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount: computeUnreadCount(notifications),
        muted,
        markRead,
        markAllRead,
        toggleMute,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications(): NotificationContextValue {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error("useNotifications must be used within a NotificationProvider");
  return ctx;
}
