import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { clearToken, getToken, setToken } from "../lib/apiClient";
import { adminLogin, adminLogout, type AdminUser } from "../lib/authApi";

const SESSION_KEY = "farmcraft_admin_session";

interface AuthState {
  isAuthenticated: boolean;
  admin: AdminUser | null;
}

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function readAdmin(): AdminUser | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as AdminUser) : null;
  } catch {
    return null;
  }
}

function readAuth(): AuthState {
  const token = getToken();
  const admin = token ? readAdmin() : null;
  return { isAuthenticated: Boolean(token && admin), admin };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>(() => readAuth());

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === SESSION_KEY || e.key === null) setState(readAuth());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const login = async (email: string, password: string) => {
    const { token, admin } = await adminLogin(email, password);
    setToken(token);
    localStorage.setItem(SESSION_KEY, JSON.stringify(admin));
    setState({ isAuthenticated: true, admin });
  };

  const logout = () => {
    clearToken();
    localStorage.removeItem(SESSION_KEY);
    setState({ isAuthenticated: false, admin: null });
    void adminLogout();
  };

  return (
    <AuthContext.Provider value={{ ...state, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
