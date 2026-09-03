import { useEffect, useRef, useState } from "react";
import { Bell, CheckCheck, PackageX, Receipt, Volume2, VolumeX } from "lucide-react";
import { useNotifications } from "../../context/NotificationContext";
import type { AdminNotification, NotificationType } from "../../data/notificationStorage";

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
}

function NotificationIcon({ type }: { type: NotificationType }) {
  const map: Record<NotificationType, { Icon: typeof Bell; cls: string }> = {
    order: { Icon: Receipt, cls: "bg-farm-green-50 text-farm-green-700" },
    stock: { Icon: PackageX, cls: "bg-amber-50 text-amber-600" },
    system: { Icon: Bell, cls: "bg-farm-mist text-farm-charcoal/60" },
  };
  const { Icon, cls } = map[type];
  return (
    <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${cls}`}>
      <Icon size={16} />
    </div>
  );
}

function NotificationRow({
  n,
  onRead,
}: {
  n: AdminNotification;
  onRead: (id: string) => void;
}) {
  return (
    <button
      onClick={() => onRead(n.id)}
      className={`flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-farm-mist/60 ${
        n.read ? "" : "bg-farm-green-50/40"
      }`}
    >
      <NotificationIcon type={n.type} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-semibold text-farm-charcoal-deep">{n.title}</p>
          {!n.read && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-farm-green-600" aria-label="Unread" />}
        </div>
        <p className="mt-0.5 line-clamp-2 text-xs text-farm-charcoal/65">{n.message}</p>
        <p className="mt-1 text-[11px] text-farm-charcoal/40">{timeAgo(n.createdAt)}</p>
      </div>
    </button>
  );
}

export default function NotificationBell() {
  const { notifications, unreadCount, muted, markRead, markAllRead, toggleMute } = useNotifications();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const badgeLabel = unreadCount > 9 ? "9+" : String(unreadCount);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative rounded-full p-2 text-farm-charcoal hover:bg-farm-mist"
        aria-label={`Notifications${unreadCount ? ` (${unreadCount} unread)` : ""}`}
      >
        <Bell size={19} />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold leading-none text-white ring-2 ring-white">
            {badgeLabel}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-40 mt-2 w-[min(22rem,90vw)] animate-fade-in overflow-hidden rounded-xl border border-black/5 bg-white shadow-card-hover">
          <div className="flex items-center justify-between border-b border-black/5 px-4 py-3">
            <p className="font-display text-sm font-semibold text-farm-charcoal-deep">Notifications</p>
            <div className="flex items-center gap-1">
              <button
                onClick={toggleMute}
                className="rounded-lg p-1.5 text-farm-charcoal/60 hover:bg-farm-mist"
                aria-label={muted ? "Unmute notification sound" : "Mute notification sound"}
                title={muted ? "Unmute notification sound" : "Mute notification sound"}
              >
                {muted ? <VolumeX size={15} /> : <Volume2 size={15} />}
              </button>
              <button
                onClick={markAllRead}
                className="rounded-lg p-1.5 text-farm-charcoal/60 hover:bg-farm-mist"
                aria-label="Mark all as read"
                title="Mark all as read"
              >
                <CheckCheck size={15} />
              </button>
            </div>
          </div>

          <div className="max-h-80 overflow-y-auto scrollbar-thin">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center px-6 py-10 text-center">
                <Bell size={22} className="mb-2 text-farm-charcoal/25" />
                <p className="text-sm text-farm-charcoal/50">You're all caught up.</p>
              </div>
            ) : (
              <div className="divide-y divide-black/5">
                {notifications.map((n) => (
                  <NotificationRow key={n.id} n={n} onRead={markRead} />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
