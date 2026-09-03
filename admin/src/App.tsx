import { Navigate, Route, Routes } from "react-router-dom";
import ProtectedRoute from "./routes/ProtectedRoute";
import AdminLayout from "./components/layout/AdminLayout";
import { NotificationProvider } from "./context/NotificationContext";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Products from "./pages/Products";
import AddProduct from "./pages/AddProduct";
import EditProduct from "./pages/EditProduct";
import ProductDetail from "./pages/ProductDetail";
import PurchasedProducts from "./pages/PurchasedProducts";
import OrderDetail from "./pages/OrderDetail";
import Invoice from "./pages/Invoice";
import Customers from "./pages/Customers";
import CustomerDetail from "./pages/CustomerDetail";
import OutOfStock from "./pages/OutOfStock";
import Offers from "./pages/Offers";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import ContactMessages from "./pages/ContactMessages";
import ContactMessageDetail from "./pages/ContactMessageDetail";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/admin/login" replace />} />
      <Route path="/admin/login" element={<Login />} />

      <Route
        element={
          <ProtectedRoute>
            <NotificationProvider>
              <AdminLayout />
            </NotificationProvider>
          </ProtectedRoute>
        }
      >
        <Route path="/admin/dashboard" element={<Dashboard />} />
        <Route path="/admin/products" element={<Products />} />
        <Route path="/admin/products/add" element={<AddProduct />} />
        <Route path="/admin/products/:id/edit" element={<EditProduct />} />
        <Route path="/admin/products/:id" element={<ProductDetail />} />
        <Route path="/admin/purchased-products" element={<PurchasedProducts />} />
        <Route path="/admin/purchased-products/:id" element={<OrderDetail />} />
        <Route path="/admin/purchased-products/:id/invoice" element={<Invoice />} />
        <Route path="/admin/customers" element={<Customers />} />
        <Route path="/admin/customers/:id" element={<CustomerDetail />} />
        <Route path="/admin/out-of-stock" element={<OutOfStock />} />
        <Route path="/admin/offers" element={<Offers />} />
        <Route path="/admin/reports" element={<Reports />} />
        <Route path="/admin/contact-messages" element={<ContactMessages />} />
        <Route path="/admin/contact-messages/:id" element={<ContactMessageDetail />} />
        <Route path="/admin/settings" element={<Settings />} />
      </Route>

      <Route path="*" element={<Navigate to="/admin/login" replace />} />
    </Routes>
  );
}
