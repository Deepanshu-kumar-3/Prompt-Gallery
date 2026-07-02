import { useState, useEffect, createContext, useContext } from 'react';
import { User, onAuthStateChanged, signInWithPopup, signOut, AuthProvider as FirebaseAuthProvider } from 'firebase/auth';
import { auth, googleProvider } from '../../lib/firebase';
import { AuthModal } from '../../components/AuthModal';

interface UserAuthContextType {
  user: User | null;
  loading: boolean;
  loginWithProvider: (provider: 'google') => Promise<void>;
  logout: () => Promise<void>;
  isAuthModalOpen: boolean;
  openAuthModal: () => void;
  closeAuthModal: () => void;
}

const UserAuthContext = createContext<UserAuthContextType>({
  user: null,
  loading: true,
  loginWithProvider: async () => {},
  logout: async () => {},
  isAuthModalOpen: false,
  openAuthModal: () => {},
  closeAuthModal: () => {},
});

export function UserAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const loginWithProvider = async (providerName: 'google') => {
    try {
      if (providerName === 'google') {
        await signInWithPopup(auth, googleProvider);
      }
    } catch (error: any) {
      if (error?.code === 'auth/popup-closed-by-user' || error?.code === 'auth/cancelled-popup-request') {
        return;
      }
      if (error?.code === 'auth/unauthorized-domain') {
        alert("Domain not authorized. Please make sure you added the exact domain to Firebase Auth -> Settings -> Authorized Domains. Note: do not include 'https://'. Alternatively, open this app in a New Tab.");
      } else {
        alert("Login failed: " + error.message);
      }
      console.error("Login failed", error);
    }
  };

  const logout = async () => {
    await signOut(auth);
  };

  const openAuthModal = () => setIsAuthModalOpen(true);
  const closeAuthModal = () => setIsAuthModalOpen(false);

  return (
    <UserAuthContext.Provider value={{ 
      user, 
      loading, 
      loginWithProvider, 
      logout, 
      isAuthModalOpen, 
      openAuthModal, 
      closeAuthModal 
    }}>
      {children}
      <AuthModal isOpen={isAuthModalOpen} onClose={closeAuthModal} />
    </UserAuthContext.Provider>
  );
}

export const useUserAuth = () => useContext(UserAuthContext);

