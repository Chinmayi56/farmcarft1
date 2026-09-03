import { useState } from "react";
import { Bell, Building2, Mail, MapPin, Palette, Phone, Save, Shield, User } from "lucide-react";
import { Card, CardHeader } from "../components/ui/Card";
import Toast, { type ToastState } from "../components/ui/Toast";
import { useAuth } from "../context/AuthContext";

const TABS = [
  { id: "profile", label: "Profile", icon: User },
  { id: "company", label: "Company", icon: Building2 },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "appearance", label: "Appearance", icon: Palette },
  { id: "security", label: "Security", icon: Shield },
] as const;

type TabId = (typeof TABS)[number]["id"];

// Official Farm Craft business information — centralized here for the
// Admin Company/Settings area. FARM CRAFT is the company/brand name;
// the Admin/contact person's name comes from the authenticated Admin
// account (`admin?.name`) and is never combined with the company name.
const OFFICIAL_INFO = {
  companyName: "FARM CRAFT",
  gstin: "37AQXPV3001H1ZG",
  phone1: "+91 94404 36868",
  phone1Tel: "tel:+919440436868",
  phone2: "+91 94904 36868",
  phone2Tel: "tel:+919490436868",
  whatsapp: "https://wa.me/919440436868",
  email: "farmcraft68@gmail.com",
  address: "1-23A, Swaraj Tractor Showroom, Palakonda, Manyam District, Andhra Pradesh - 532440",
};

export default function Settings() {
  const { admin } = useAuth();
  const [tab, setTab] = useState<TabId>("profile");
  const [saved, setSaved] = useState(false);
  const [theme, setTheme] = useState<"Light" | "Dark">("Light");
  const [toast, setToast] = useState<ToastState | null>(null);

  const handleSave = () => {
    setSaved(true);
    setToast({ message: "Settings saved", variant: "success" });
    setTimeout(() => setSaved(false), 1600);
  };

  return (
    <div className="grid grid-cols-1 gap-5 animate-fade-in lg:grid-cols-4">
      <Card className="h-fit p-2 lg:col-span-1">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex w-full items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors ${
              tab === id
                ? "bg-farm-green-50 text-farm-green-700"
                : "text-farm-charcoal/65 hover:bg-farm-mist"
            }`}
          >
            <Icon size={16} /> {label}
          </button>
        ))}
      </Card>

      <Card className="lg:col-span-3">
        {tab === "profile" && (
          <>
            <CardHeader title="Profile" subtitle="Your admin / contact person details" />
            <div className="space-y-4 p-5">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-farm-green-700 text-xl font-semibold text-white">
                  {admin?.name?.charAt(0) ?? "A"}
                </div>
                <div>
                  <p className="text-sm font-semibold text-farm-charcoal-deep">{admin?.name}</p>
                  <p className="text-xs text-farm-charcoal/50">Contact Person &middot; {admin?.role}</p>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-farm-charcoal-deep">Full Name</label>
                  <input
                    defaultValue={admin?.name}
                    className="w-full rounded-xl border border-black/10 bg-white px-3.5 py-2.5 text-sm focus:border-farm-green-600 focus:outline-none focus:ring-2 focus:ring-farm-green-100"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-farm-charcoal-deep">Email</label>
                  <input
                    defaultValue={admin?.email}
                    disabled
                    className="w-full rounded-xl border border-black/10 bg-farm-mist/50 px-3.5 py-2.5 text-sm text-farm-charcoal/60"
                  />
                </div>
              </div>
              <p className="text-xs text-farm-charcoal/45">
                This is the Admin / contact person's profile — separate from the Farm Craft company
                name shown on the Company tab.
              </p>
            </div>
          </>
        )}

        {tab === "company" && (
          <>
            <CardHeader title="Company" subtitle="Farm Craft business details" />
            <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-farm-charcoal-deep">Company Name</label>
                <input
                  defaultValue={OFFICIAL_INFO.companyName}
                  className="w-full rounded-xl border border-black/10 bg-white px-3.5 py-2.5 text-sm focus:border-farm-green-600 focus:outline-none focus:ring-2 focus:ring-farm-green-100"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-farm-charcoal-deep">Contact Person</label>
                <input
                  defaultValue={admin?.name}
                  disabled
                  className="w-full rounded-xl border border-black/10 bg-farm-mist/50 px-3.5 py-2.5 text-sm text-farm-charcoal/60"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-farm-charcoal-deep">GSTIN</label>
                <input
                  defaultValue={OFFICIAL_INFO.gstin}
                  className="w-full rounded-xl border border-black/10 bg-white px-3.5 py-2.5 text-sm focus:border-farm-green-600 focus:outline-none focus:ring-2 focus:ring-farm-green-100"
                />
              </div>
            </div>

            <div className="space-y-1 border-t border-black/5 p-5">
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-farm-charcoal/45">
                Official Contact Details
              </p>
              <a
                href={OFFICIAL_INFO.phone1Tel}
                className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm text-farm-charcoal-deep hover:bg-farm-mist/40"
              >
                <Phone size={15} className="shrink-0 text-farm-charcoal/40" /> {OFFICIAL_INFO.phone1}
                <span className="text-xs text-farm-charcoal/45">(Primary)</span>
              </a>
              <a
                href={OFFICIAL_INFO.phone2Tel}
                className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm text-farm-charcoal-deep hover:bg-farm-mist/40"
              >
                <Phone size={15} className="shrink-0 text-farm-charcoal/40" /> {OFFICIAL_INFO.phone2}
                <span className="text-xs text-farm-charcoal/45">(Secondary)</span>
              </a>
              <a
                href={OFFICIAL_INFO.whatsapp}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm text-farm-charcoal-deep hover:bg-farm-mist/40"
              >
                <Phone size={15} className="shrink-0 text-farm-charcoal/40" /> WhatsApp — {OFFICIAL_INFO.phone1}
              </a>
              <a
                href={`mailto:${OFFICIAL_INFO.email}`}
                className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm text-farm-charcoal-deep hover:bg-farm-mist/40"
              >
                <Mail size={15} className="shrink-0 text-farm-charcoal/40" /> {OFFICIAL_INFO.email}
              </a>
              <div className="flex items-start gap-2.5 rounded-xl px-3 py-2.5 text-sm text-farm-charcoal-deep">
                <MapPin size={15} className="mt-0.5 shrink-0 text-farm-charcoal/40" /> {OFFICIAL_INFO.address}
              </div>
            </div>
          </>
        )}

        {tab === "notifications" && (
          <>
            <CardHeader title="Notifications" subtitle="Choose what you'd like to be alerted about" />
            <div className="space-y-1 p-5">
              {["Purchase notifications", "Stock alerts", "Offer notifications"].map(
                (item) => (
                  <label
                    key={item}
                    className="flex items-center justify-between rounded-xl px-3 py-3 hover:bg-farm-mist/40"
                  >
                    <span className="text-sm text-farm-charcoal-deep">{item}</span>
                    <input type="checkbox" defaultChecked className="h-4 w-4 accent-farm-green-700" />
                  </label>
                )
              )}
            </div>
          </>
        )}

        {tab === "appearance" && (
          <>
            <CardHeader title="Appearance" subtitle="Personalize how the admin portal looks" />
            <div className="space-y-4 p-5">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-farm-charcoal-deep">Theme</label>
                <div className="flex gap-2">
                  {(["Light", "Dark"] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setTheme(t)}
                      className={`rounded-xl border px-4 py-2.5 text-sm font-medium transition-colors ${
                        theme === t
                          ? "border-farm-green-600 bg-farm-green-50 text-farm-green-700"
                          : "border-black/10 text-farm-charcoal/60 hover:bg-farm-mist"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
                <p className="mt-2 text-xs text-farm-charcoal/45">
                  Dark mode is a demo preference and does not change the interface in this build.
                </p>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-farm-charcoal-deep">Accent Color</label>
                <div className="flex gap-2">
                  {["#1c6b3d", "#4bad74", "#2563eb", "#b45309"].map((color) => (
                    <span
                      key={color}
                      className="h-8 w-8 rounded-full ring-2 ring-white ring-offset-2 ring-offset-white"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </>
        )}

        {tab === "security" && (
          <>
            <CardHeader title="Security" subtitle="Manage password and access" />
            <div className="space-y-4 p-5">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-farm-charcoal-deep">Current Password</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-black/10 bg-white px-3.5 py-2.5 text-sm focus:border-farm-green-600 focus:outline-none focus:ring-2 focus:ring-farm-green-100"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-farm-charcoal-deep">New Password</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-black/10 bg-white px-3.5 py-2.5 text-sm focus:border-farm-green-600 focus:outline-none focus:ring-2 focus:ring-farm-green-100"
                />
              </div>
              <p className="text-xs text-farm-charcoal/45">
                This is a demo portal — password changes are not persisted.
              </p>
            </div>
          </>
        )}

        <div className="flex justify-end border-t border-black/5 p-5">
          <button
            onClick={handleSave}
            className="flex items-center gap-2 rounded-xl bg-farm-green-700 px-5 py-2.5 text-sm font-semibold text-white shadow-card hover:bg-farm-green-800"
          >
            <Save size={16} /> {saved ? "Saved!" : "Save Changes"}
          </button>
        </div>
      </Card>

      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
    </div>
  );
}
