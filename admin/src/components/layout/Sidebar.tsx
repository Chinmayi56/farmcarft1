import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  AlertTriangle,
  Tag,
  BarChart3,
  Settings as SettingsIcon,
  LogOut,
  X,
  Sprout,
  Inbox,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import logo from "../../assets/farmcraft-logo-full.png";
import logoMark from "../../assets/farmcraft-logo-mark.png";

const NAV_ITEMS = [
  { to: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/admin/products", label: "Products", icon: Package },
  { to: "/admin/purchased-products", label: "Purchased Products", icon: ShoppingCart },
  { to: "/admin/customers", label: "Customers", icon: Users },
  { to: "/admin/out-of-stock", label: "Out of Stock", icon: AlertTriangle },
  { to: "/admin/offers", label: "Offers", icon: Tag },
  { to: "/admin/reports", label: "Reports", icon: BarChart3 },
  { to: "/admin/contact-messages", label: "Contact Messages", icon: Inbox },
  { to: "/admin/settings", label: "Settings", icon: SettingsIcon },
];

interface SidebarProps {
  mobileOpen: boolean;
  onCloseMobile: () => void;
  collapsed: boolean;
}

export default function Sidebar({ mobileOpen, onCloseMobile, collapsed }: SidebarProps) {
  const { admin, logout } = useAuth();

  const content = (
    <div className="flex h-full flex-col bg-farm-charcoal-deep text-farm-mist">
      {/* Brand */}
      <div className="flex items-center gap-3 border-b border-white/10 px-5 py-5">
        <img
          src={collapsed ? logoMark : logo}
          alt="Farm Craft"
          className={collapsed
            ? "h-10 w-10 shrink-0 rounded-lg object-contain ring-1 ring-white/10"
            : "h-10 w-28 shrink-0 rounded-lg bg-white object-contain p-1 ring-1 ring-white/10"}
        />
        {!collapsed && (
          <div className="min-w-0">
            <p className="truncate font-display text-base font-bold tracking-tight text-white">
              FARM CRAFT
            </p>
            <p className="text-[11px] text-farm-green-300">Admin Portal</p>
          </div>
        )}
        <button
          onClick={onCloseMobile}
          className="ml-auto rounded-lg p-1.5 text-farm-mist/70 hover:bg-white/10 lg:hidden"
          aria-label="Close menu"
        >
          <X size={18} />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="space-y-1">
          {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
            <li key={to}>
              <NavLink
                to={to}
                onClick={onCloseMobile}
                className={({ isActive }) =>
                  `group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-farm-green-700 text-white shadow-card"
                      : "text-farm-mist/70 hover:bg-white/5 hover:text-white"
                  }`
                }
              >
                <Icon size={18} strokeWidth={2} className="shrink-0" />
                {!collapsed && <span className="truncate">{label}</span>}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* Footer / profile */}
      <div className="border-t border-white/10 p-3">
        <div className="flex items-center gap-3 rounded-xl px-2 py-2">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-farm-green-600 text-sm font-semibold text-white">
            <Sprout size={16} />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-white">{admin?.name ?? "Admin"}</p>
              <p className="truncate text-xs text-farm-mist/60">{admin?.email}</p>
            </div>
          )}
        </div>
        <button
          onClick={logout}
          className="mt-2 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-farm-mist/70 transition-colors hover:bg-red-500/10 hover:text-red-300"
        >
          <LogOut size={18} />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop / tablet sidebar */}
      <aside
        className={`hidden shrink-0 border-r border-black/5 transition-all duration-200 lg:block ${
          collapsed ? "w-[76px]" : "w-64"
        }`}
      >
        {content}
      </aside>

      {/* Mobile slide-out */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={onCloseMobile}
            aria-hidden="true"
          />
          <div className="relative z-10 h-full w-72 animate-slide-in shadow-2xl">{content}</div>
        </div>
      )}
    </>
  );
}
