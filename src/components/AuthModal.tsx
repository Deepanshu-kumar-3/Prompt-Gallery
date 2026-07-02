import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Mail, ArrowLeft, Loader2, Check } from 'lucide-react';
import { useUserAuth } from '../auth/user/UserAuthProvider';
import { auth, googleProvider } from '../lib/firebase';
import { signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { toast } from 'sonner';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Custom Google SVG Logo for a premium touch
const GoogleIcon = () => (
  <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24" fill="none">
    <path
      fill="#EA4335"
      d="M12 5.04c1.67 0 3.2.58 4.4 1.7l3.25-3.25C17.68 1.58 14.97 1 12 1 7.24 1 3.2 3.74 1.25 7.72l3.85 3C6.01 7.67 8.78 5.04 12 5.04z"
    />
    <path
      fill="#4285F4"
      d="M23.49 12.27c0-.81-.07-1.59-.2-2.36H12v4.51h6.43c-.28 1.44-1.1 2.66-2.33 3.48l3.63 2.81c2.13-1.97 3.76-4.87 3.76-8.44z"
    />
    <path
      fill="#FBBC05"
      d="M5.1 14.28c-.23-.69-.36-1.42-.36-2.28s.13-1.59.36-2.28L1.25 6.72C.45 8.3.01 10.1.01 12s.44 3.7 1.24 5.28l3.85-3z"
    />
    <path
      fill="#34A853"
      d="M12 23c3.24 0 5.97-1.07 7.96-2.91l-3.63-2.81c-1.1.74-2.51 1.18-4.33 1.18-3.22 0-5.99-2.63-6.9-5.68l-3.85 3C3.2 20.26 7.24 23 12 23z"
    />
  </svg>
);

type ViewState = 'main' | 'login' | 'signup';

export function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const [view, setView] = useState<ViewState>('main');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  // Check for mobile layout for bottom sheet transition
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 640);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Handle ESC key press to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Reset states on open/close
  useEffect(() => {
    if (isOpen) {
      setView('main');
      setEmail('');
      setPassword('');
      setName('');
      setError('');
      setIsLoading(false);
      setIsSuccess(false);
    }
  }, [isOpen]);

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError('');
    try {
      const result = await signInWithPopup(auth, googleProvider);
      setIsSuccess(true);
      toast.success(`Welcome back, ${result.user.displayName || 'User'}!`, {
        icon: '✨',
      });
      setTimeout(() => {
        onClose();
      }, 600);
    } catch (err: any) {
      setIsLoading(false);
      if (err?.code === 'auth/popup-closed-by-user' || err?.code === 'auth/cancelled-popup-request') {
        return;
      }
      if (err?.code === 'auth/unauthorized-domain') {
        setError('Domain not authorized. Please open this app in a New Tab to login.');
      } else {
        setError(err.message || 'Failed to authenticate');
      }
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setIsLoading(true);
    setError('');

    try {
      if (view === 'signup') {
        const result = await createUserWithEmailAndPassword(auth, email, password);
        if (name) {
          await updateProfile(result.user, { displayName: name });
        }
        setIsSuccess(true);
        toast.success(`Account created! Welcome, ${name || result.user.email}!`, {
          icon: '✨',
        });
      } else {
        const result = await signInWithEmailAndPassword(auth, email, password);
        setIsSuccess(true);
        toast.success(`Welcome back, ${result.user.displayName || result.user.email}!`, {
          icon: '✨',
        });
      }
      setTimeout(() => {
        onClose();
      }, 600);
    } catch (err: any) {
      setIsLoading(false);
      if (err.code === 'auth/email-already-in-use') {
        setError('This email is already in use. Try logging in.');
      } else if (err.code === 'auth/weak-password') {
        setError('Password must be at least 6 characters long.');
      } else if (err.code === 'auth/invalid-email') {
        setError('Invalid email address format.');
      } else if (
        err.code === 'auth/wrong-password' ||
        err.code === 'auth/user-not-found' ||
        err.code === 'auth/invalid-credential'
      ) {
        setError('Invalid email or password.');
      } else {
        setError(err.message || 'Authentication failed');
      }
    }
  };

  // Click outside to close helper
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
      onClose();
    }
  };

  const modalVariants = {
    hidden: isMobile ? { y: '100%', opacity: 1 } : { scale: 0.95, y: 15, opacity: 0 },
    visible: isMobile
      ? { y: 0, opacity: 1, transition: { type: 'spring' as const, damping: 25, stiffness: 220 } }
      : { scale: 1, y: 0, opacity: 1, transition: { type: 'spring' as const, damping: 22, stiffness: 280 } },
    exit: isMobile
      ? { y: '100%', opacity: 1, transition: { duration: 0.25, ease: 'easeInOut' as const } }
      : { scale: 0.95, y: 15, opacity: 0, transition: { duration: 0.18, ease: 'easeIn' as const } }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop/Overlay with exactly 12px blur & transparent dark background */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleBackdropClick}
            className="absolute inset-0 bg-black/60 backdrop-blur-[12px] transition-all"
          />

          {/* Centered Modal Container */}
          <motion.div
            ref={modalRef}
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className={`
              relative max-w-[420px] w-full 
              bg-zinc-950/75 backdrop-blur-xl border border-white/10
              shadow-[0_24px_64px_rgba(0,0,0,0.8)]
              rounded-[24px] overflow-hidden p-8 text-center
              max-sm:fixed max-sm:bottom-0 max-sm:left-0 max-sm:right-0 
              max-sm:max-w-none max-sm:rounded-t-[24px] max-sm:rounded-b-none max-sm:p-6
            `}
          >
            {/* Top Close (X) button */}
            <button
              onClick={onClose}
              className="absolute top-5 right-5 w-8 h-8 flex items-center justify-center rounded-full bg-white/5 border border-white/10 text-zinc-400 hover:text-white hover:bg-white/10 hover:rotate-90 transition-all duration-300"
              aria-label="Close authentication modal"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Success state display overlay */}
            <AnimatePresence>
              {isSuccess && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-zinc-950/90 z-40 flex flex-col items-center justify-center p-6"
                >
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1, transition: { type: 'spring', delay: 0.1 } }}
                    className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mb-4 shadow-[0_0_30px_rgba(16,185,129,0.2)]"
                  >
                    <Check className="w-8 h-8" strokeWidth={3} />
                  </motion.div>
                  <h3 className="text-xl font-bold text-white font-display mb-1">Authenticated!</h3>
                  <p className="text-zinc-400 text-sm">Welcome back to Aura.</p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* MAIN CHOICE VIEW */}
            <AnimatePresence mode="wait">
              {view === 'main' && (
                <motion.div
                  key="main"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ duration: 0.2 }}
                  className="flex flex-col h-full justify-between"
                >
                  {/* Aura Logo Header */}
                  <div className="mb-8">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-purple to-brand-blue flex items-center justify-center shadow-[0_8px_24px_rgba(139,92,246,0.35)] mb-4 mx-auto">
                      <span className="text-white text-2xl font-bold font-display leading-none">A</span>
                    </div>
                    <span className="text-zinc-500 text-xs tracking-[0.25em] uppercase font-bold block mb-1">
                      Aura
                    </span>
                    <h2 className="text-2xl font-bold tracking-tight text-white font-display mb-2">
                      Welcome Back
                    </h2>
                    <p className="text-zinc-400 text-sm max-w-[320px] mx-auto leading-relaxed">
                      Sign in to save prompts, create collections, and access your favorites.
                    </p>
                  </div>

                  {/* Buttons */}
                  <div className="flex flex-col gap-3.5 w-full">
                    {/* Premium Google Button */}
                    <button
                      onClick={handleGoogleLogin}
                      disabled={isLoading}
                      className="
                        w-full flex items-center justify-center 
                        bg-white text-black font-semibold py-3.5 px-5 rounded-2xl 
                        hover:bg-zinc-100 active:scale-[0.98]
                        transition-all duration-200 shadow-[0_4px_20px_rgba(255,255,255,0.05)]
                        hover:shadow-[0_4px_25px_rgba(255,255,255,0.12)]
                        disabled:opacity-50
                      "
                    >
                      {isLoading ? (
                        <Loader2 className="w-5 h-5 mr-3 animate-spin" />
                      ) : (
                        <GoogleIcon />
                      )}
                      <span>Continue with Google</span>
                    </button>

                    {/* Styled OR Divider */}
                    <div className="relative my-3 flex items-center justify-center">
                      <div className="w-full border-t border-white/5"></div>
                      <span className="absolute bg-[#09090b] px-4 text-[10px] font-mono font-bold tracking-[0.2em] text-zinc-500 uppercase">
                        OR
                      </span>
                    </div>

                    {/* Email Buttons */}
                    <button
                      onClick={() => setView('login')}
                      className="
                        w-full bg-white/5 border border-white/10 text-white font-medium 
                        py-3 px-5 rounded-2xl hover:bg-white/10 active:scale-[0.98]
                        transition-all duration-200 hover:border-white/25
                      "
                    >
                      Login with Email
                    </button>

                    <button
                      onClick={() => setView('signup')}
                      className="
                        w-full bg-brand-purple text-white font-medium 
                        py-3 px-5 rounded-2xl hover:bg-brand-purple/90 active:scale-[0.98]
                        transition-all duration-200 hover:shadow-[0_0_24px_rgba(139,92,246,0.25)]
                      "
                    >
                      Create Account
                    </button>
                  </div>

                  {error && (
                    <p className="text-red-400 text-xs mt-4 bg-red-500/10 border border-red-500/20 py-2.5 px-3 rounded-xl">
                      {error}
                    </p>
                  )}
                </motion.div>
              )}

              {/* EMAIL LOGIN VIEW */}
              {view === 'login' && (
                <motion.div
                  key="login"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  {/* Header / Back */}
                  <div className="flex items-center mb-6">
                    <button
                      onClick={() => setView('main')}
                      className="p-2 -ml-2 rounded-full text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
                    >
                      <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div className="flex-1 text-center pr-9">
                      <span className="text-zinc-500 text-[10px] tracking-[0.2em] uppercase font-bold">
                        Email Sign In
                      </span>
                    </div>
                  </div>

                  <div className="text-left mb-6">
                    <h3 className="text-xl font-bold font-display text-white mb-1">
                      Welcome Back
                    </h3>
                    <p className="text-zinc-400 text-sm">
                      Enter your details below to login to your account.
                    </p>
                  </div>

                  <form onSubmit={handleEmailSubmit} className="space-y-4 text-left">
                    <div>
                      <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
                        Email Address
                      </label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        disabled={isLoading}
                        className="
                          w-full bg-zinc-900 border border-white/10 rounded-2xl py-3 px-4 
                          text-white text-sm focus:outline-none focus:border-brand-purple focus:ring-1 
                          focus:ring-brand-purple/50 transition-all placeholder:text-zinc-600
                        "
                        required
                      />
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-1.5">
                        <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                          Password
                        </label>
                      </div>
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        disabled={isLoading}
                        className="
                          w-full bg-zinc-900 border border-white/10 rounded-2xl py-3 px-4 
                          text-white text-sm focus:outline-none focus:border-brand-purple focus:ring-1 
                          focus:ring-brand-purple/50 transition-all placeholder:text-zinc-600
                        "
                        required
                      />
                    </div>

                    {error && (
                      <p className="text-red-400 text-xs bg-red-500/10 border border-red-500/20 py-2.5 px-3 rounded-xl leading-relaxed">
                        {error}
                      </p>
                    )}

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="
                        w-full bg-white text-black font-semibold py-3.5 px-5 rounded-2xl 
                        hover:bg-zinc-100 active:scale-[0.98] transition-all duration-200 
                        shadow-lg flex items-center justify-center gap-2 disabled:opacity-50
                      "
                    >
                      {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                      <span>{isLoading ? 'Signing In...' : 'Continue'}</span>
                    </button>
                  </form>

                  <div className="mt-6 text-center">
                    <button
                      onClick={() => setView('signup')}
                      className="text-xs text-zinc-400 hover:text-white transition-colors"
                    >
                      Don't have an account? <span className="text-brand-purple font-medium">Sign Up</span>
                    </button>
                  </div>
                </motion.div>
              )}

              {/* EMAIL SIGN UP VIEW */}
              {view === 'signup' && (
                <motion.div
                  key="signup"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  {/* Header / Back */}
                  <div className="flex items-center mb-6">
                    <button
                      onClick={() => setView('main')}
                      className="p-2 -ml-2 rounded-full text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
                    >
                      <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div className="flex-1 text-center pr-9">
                      <span className="text-zinc-500 text-[10px] tracking-[0.2em] uppercase font-bold">
                        Create Account
                      </span>
                    </div>
                  </div>

                  <div className="text-left mb-6">
                    <h3 className="text-xl font-bold font-display text-white mb-1">
                      Start Your Journey
                    </h3>
                    <p className="text-zinc-400 text-sm">
                      Create an account to unlock all features of Aura.
                    </p>
                  </div>

                  <form onSubmit={handleEmailSubmit} className="space-y-4 text-left">
                    <div>
                      <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
                        Your Name
                      </label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="John Doe"
                        disabled={isLoading}
                        className="
                          w-full bg-zinc-900 border border-white/10 rounded-2xl py-3 px-4 
                          text-white text-sm focus:outline-none focus:border-brand-purple focus:ring-1 
                          focus:ring-brand-purple/50 transition-all placeholder:text-zinc-600
                        "
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
                        Email Address
                      </label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        disabled={isLoading}
                        className="
                          w-full bg-zinc-900 border border-white/10 rounded-2xl py-3 px-4 
                          text-white text-sm focus:outline-none focus:border-brand-purple focus:ring-1 
                          focus:ring-brand-purple/50 transition-all placeholder:text-zinc-600
                        "
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
                        Choose Password
                      </label>
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="At least 6 characters"
                        disabled={isLoading}
                        className="
                          w-full bg-zinc-900 border border-white/10 rounded-2xl py-3 px-4 
                          text-white text-sm focus:outline-none focus:border-brand-purple focus:ring-1 
                          focus:ring-brand-purple/50 transition-all placeholder:text-zinc-600
                        "
                        required
                        minLength={6}
                      />
                    </div>

                    {error && (
                      <p className="text-red-400 text-xs bg-red-500/10 border border-red-500/20 py-2.5 px-3 rounded-xl leading-relaxed">
                        {error}
                      </p>
                    )}

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="
                        w-full bg-brand-purple text-white font-semibold py-3.5 px-5 rounded-2xl 
                        hover:bg-brand-purple/90 active:scale-[0.98] transition-all duration-200 
                        shadow-lg flex items-center justify-center gap-2 disabled:opacity-50
                        hover:shadow-[0_0_24px_rgba(139,92,246,0.25)]
                      "
                    >
                      {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                      <span>{isLoading ? 'Creating Account...' : 'Create Account'}</span>
                    </button>
                  </form>

                  <div className="mt-6 text-center">
                    <button
                      onClick={() => setView('login')}
                      className="text-xs text-zinc-400 hover:text-white transition-colors"
                    >
                      Already have an account? <span className="text-brand-purple font-medium">Login</span>
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
