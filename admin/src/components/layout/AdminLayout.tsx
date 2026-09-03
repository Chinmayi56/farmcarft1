import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import Header from "./Header";

const PAGE_TITLES: Record<string, string> = {
  "/admin/dashboard": "Dashboard",
  "/admin/products": "Products",
  "/admin/products/add": "Add Product",
  "/admin/purchased-products": "Purchased Products",
  "/admin/customers": "Customers",
  "/admin/out-of-stock": "Out of Stock",
  "/admin/offers": "Offers",
  "/admin/reports": "Reports",
  "/admin/contact-messages": "Contact Messages",
  "/admin/settings": "Settings",
};

function resolveTitle(pathname: string): string {
  if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname];
  if (pathname.endsWith("/edit") && pathname.startsWith("/admin/products/")) return "Edit Product";
  if (pathname.startsWith("/admin/products/")) return "Product Details";
  if (pathname.startsWith("/admin/customers/")) return "Customer Details";
  if (pathname.startsWith("/admin/contact-messages/")) return "Enquiry Details";
  return "Farm Craft Admin";
}

export default function AdminLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  return (
    <div className="flex h-screen overflow-hidden bg-farm-cream">
      <Sidebar
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
        collapsed={collapsed}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header
          title={resolveTitle(location.pathname)}
          onOpenMobileMenu={() => setMobileOpen(true)}
          onToggleCollapse={() => setCollapsed((c) => !c)}
        />
        <main className="flex-1 overflow-y-auto px-4 py-5 sm:px-6 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
