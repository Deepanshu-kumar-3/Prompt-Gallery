import { createContext, useContext } from 'react';
import { User, signInWithPopup, signOut } from 'firebase/auth';
import { auth, googleProvider } from '../../lib/firebase';
import { useUserAuth } from '../user/UserAuthProvider';

interface AdminAuthContextType {
  adminUser: User | null;
  loading: boolean;
  isAdmin: boolean;
  loginAdmin: () => Promise<void>;
  logoutAdmin: () => Promise<void>;
}

const AdminAuthContext = createContext<AdminAuthContextType>({
  adminUser: null,
  loading: true,
  isAdmin: false,
  loginAdmin: async () => {},
  logoutAdmin: async () => {},
});

export const ADMIN_WHITELIST = ["dkumar.iit.b.2026@gmail.com"];

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useUserAuth();

  const isAdmin = user !== null && user.email !== null && ADMIN_WHITELIST.includes(user.email);
  const adminUser = isAdmin ? user : null;

  const loginAdmin = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      if (result.user.email && !ADMIN_WHITELIST.includes(result.user.email)) {
        await signOut(auth);
        alert("Access Denied. Administrator account required.");
        window.location.href = '/';
      }
    } catch (error: any) {
      if (error?.code === 'auth/popup-closed-by-user' || error?.code === 'auth/cancelled-popup-request') {
        return;
      }
      if (error?.code === 'auth/unauthorized-domain') {
        alert("Domain not authorized. Please make sure you added the exact domain to Firebase Auth -> Settings -> Authorized Domains. Note: do not include 'https://'. Alternatively, open this app in a New Tab.");
      } else {
        alert("Admin Login failed: " + error.message);
      }
      console.error("Admin Login failed", error);
    }
  };

  const logoutAdmin = async () => {
    await logout();
  };

  return (
    <AdminAuthContext.Provider value={{ adminUser, loading, isAdmin, loginAdmin, logoutAdmin }}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export const useAdminAuth = () => useContext(AdminAuthContext);
