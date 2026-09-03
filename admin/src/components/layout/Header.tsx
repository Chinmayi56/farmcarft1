import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronDown, Menu, Search, User, Settings as SettingsIcon, LogOut } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import NotificationBell from "./NotificationBell";

interface HeaderProps {
  title: string;
  onOpenMobileMenu: () => void;
  onToggleCollapse: () => void;
}

export default function Header({ title, onOpenMobileMenu, onToggleCollapse }: HeaderProps) {
  const { admin, logout } = useAuth();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-black/5 bg-white/90 px-4 py-3 backdrop-blur sm:px-6">
      <button
        onClick={onOpenMobileMenu}
        className="rounded-lg p-2 text-farm-charcoal hover:bg-farm-mist lg:hidden"
        aria-label="Open menu"
      >
        <Menu size={20} />
      </button>
      <button
        onClick={onToggleCollapse}
        className="hidden rounded-lg p-2 text-farm-charcoal hover:bg-farm-mist lg:block"
        aria-label="Toggle sidebar"
      >
        <Menu size={20} />
      </button>

      <h1 className="font-display text-lg font-semibold text-farm-charcoal-deep sm:text-xl">
        {title}
      </h1>

      <div className="ml-auto flex items-center gap-2 sm:gap-3">
        <div className="relative hidden sm:block">
          <Search
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-farm-charcoal/40"
          />
          <input
            type="text"
            placeholder="Search..."
            className="w-40 rounded-full border border-black/10 bg-farm-mist/60 py-2 pl-9 pr-3 text-sm text-farm-charcoal-deep placeholder:text-farm-charcoal/40 focus:w-56 focus:border-farm-green-600 focus:bg-white focus:outline-none transition-all"
          />
        </div>

        <NotificationBell />

        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen((o) => !o)}
            className="flex items-center gap-2 rounded-full py-1 pl-1 pr-2 hover:bg-farm-mist"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-farm-green-700 text-sm font-semibold text-white">
              {admin?.name?.charAt(0) ?? "A"}
            </div>
            <span className="hidden text-sm font-medium text-farm-charcoal-deep sm:inline">
              {admin?.name ?? "Admin"}
            </span>
            <ChevronDown size={15} className="hidden text-farm-charcoal/50 sm:inline" />
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-48 animate-fade-in rounded-xl border border-black/5 bg-white py-1.5 shadow-card-hover">
              <button
                onClick={() => {
                  setDropdownOpen(false);
                  navigate("/admin/settings");
                }}
                className="flex w-full items-center gap-2.5 px-4 py-2 text-sm text-farm-charcoal-deep hover:bg-farm-mist"
              >
                <User size={15} /> Profile
              </button>
              <button
                onClick={() => {
                  setDropdownOpen(false);
                  navigate("/admin/settings");
                }}
                className="flex w-full items-center gap-2.5 px-4 py-2 text-sm text-farm-charcoal-deep hover:bg-farm-mist"
              >
                <SettingsIcon size={15} /> Settings
              </button>
              <div className="my-1 border-t border-black/5" />
              <button
                onClick={logout}
                className="flex w-full items-center gap-2.5 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
              >
                <LogOut size={15} /> Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
