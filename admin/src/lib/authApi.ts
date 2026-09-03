// Admin authentication against the real FastAPI backend
// (POST /api/auth/admin/login) — Backend Step 4.

import { apiRequest } from "./apiClient";

export interface AdminUser {
  name: string;
  email: string;
  role: string;
}

interface UserOut {
  id: string;
  name: string | null;
  email: string;
  role: string;
  is_active: boolean;
  created_at: string;
}

interface TokenResponse {
  access_token: string;
  token_type: string;
  user: UserOut;
}

function toAdminUser(user: UserOut): AdminUser {
  return {
    name: user.name ?? user.email,
    email: user.email,
    role: user.role,
  };
}

export async function adminLogin(email: string, password: string): Promise<{ token: string; admin: AdminUser }> {
  const data = await apiRequest<TokenResponse>("/auth/admin/login", {
    method: "POST",
    auth: false,
    body: { email, password },
  });
  return { token: data.access_token, admin: toAdminUser(data.user) };
}

export async function adminLogout(): Promise<void> {
  try {
    await apiRequest<void>("/auth/logout", { method: "POST" });
  } catch {
    // Logout is a client-side action regardless (JWTs are stateless) —
    // ignore network/API errors so the user can always sign out locally.
  }
}
