import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminAuth, ADMIN_WHITELIST } from './AdminAuthProvider';
import { LogIn } from 'lucide-react';
import { motion } from 'motion/react';

export function ProtectedAdminRoute({ children }: { children: React.ReactNode }) {
  const { adminUser, isAdmin, loading, loginAdmin } = useAdminAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && adminUser && !isAdmin) {
      navigate('/');
    }
  }, [loading, adminUser, isAdmin, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-brand-purple border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full bg-zinc-900 border border-white/10 rounded-2xl p-8 text-center"
        >
          <div className="w-16 h-16 bg-brand-purple/20 text-brand-purple rounded-full flex items-center justify-center mx-auto mb-6">
            <LogIn className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold font-display mb-2">Admin Portal</h1>
          <p className="text-zinc-400 mb-8">Sign in with your administrator account to access the dashboard. Only whitelisted Google accounts are permitted.</p>
          
          <button 
            onClick={loginAdmin}
            className="w-full bg-white text-black font-medium py-3 rounded-xl hover:bg-zinc-200 transition-colors mb-4"
          >
            Continue with Google
          </button>
        </motion.div>
      </div>
    );
  }

  return <>{children}</>;
}
