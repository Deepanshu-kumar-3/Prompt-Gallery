import { Link, useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { useUserAuth } from '../auth/user/UserAuthProvider';
import { useAdminAuth } from '../auth/admin/AdminAuthProvider';
import { Search, Menu, LogIn, LogOut, Moon, Sun, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from 'motion/react';
import { cn } from '../lib/utils';

export function Header() {
  const { user, logout, openAuthModal } = useUserAuth();
  const { isAdmin } = useAdminAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const query = searchParams.get('q') || '';
  
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (latest) => {
    setIsScrolled(latest > 20);
  });

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const q = formData.get('q');
    navigate(`/?q=${q}`);
  };

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Categories', path: '/categories' },
    { name: 'Trending', path: '/trending' },
    { name: 'Popular', path: '/popular' },
  ];

  return (
    <>
      <motion.header 
        className={cn(
          "fixed left-0 right-0 z-50 transition-all duration-500 ease-in-out px-4 flex justify-center",
          isScrolled ? "top-4" : "top-6"
        )}
      >
        <div 
          className={cn(
            "w-full transition-all duration-500 flex items-center justify-between px-6 py-3 rounded-full",
            isScrolled 
              ? "max-w-5xl bg-brand-secondary/70 backdrop-blur-2xl border border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.5)]" 
              : "max-w-7xl bg-transparent border-transparent"
          )}
        >
          <Link to="/" className="text-xl font-display font-bold tracking-tight text-white flex items-center gap-2 group relative z-10">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-brand-purple to-brand-blue flex items-center justify-center shadow-lg group-hover:shadow-brand-purple/50 transition-all duration-300">
              <span className="text-white text-lg leading-none">A</span>
            </div>
            <span className="group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r from-brand-purple to-brand-blue transition-all duration-300">Aura</span>
          </Link>
          
          <nav className="hidden md:flex items-center gap-1 absolute left-1/2 -translate-x-1/2">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.path}
                className={cn(
                  "px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 relative group",
                  location.pathname === link.path ? "text-white" : "text-zinc-400 hover:text-white"
                )}
              >
                {link.name}
                {location.pathname === link.path && (
                  <motion.div
                    layoutId="navbar-indicator"
                    className="absolute inset-0 bg-white/10 rounded-full -z-10"
                    transition={{ type: "spring", bounce: 0.25, duration: 0.5 }}
                  />
                )}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-3 z-10">
            <div className="hidden lg:block relative group w-64">
              <form onSubmit={handleSearch}>
                <Search className="h-4 w-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2 group-focus-within:text-brand-purple transition-colors" />
                <input 
                  name="q"
                  defaultValue={query}
                  type="text" 
                  placeholder="Search prompts..."
                  className="w-full bg-black/20 border border-white/10 rounded-full py-2 pl-9 pr-4 text-sm text-zinc-100 focus:outline-none focus:ring-1 focus:ring-brand-purple/50 focus:border-brand-purple/50 focus:bg-black/40 transition-all placeholder:text-zinc-600 shadow-inner"
                />
              </form>
            </div>

            {isAdmin && (
              <Link 
                to="/admin" 
                className="
                  flex items-center gap-1.5 sm:gap-2 px-3.5 py-2 rounded-full 
                  bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 
                  text-[10px] sm:text-xs font-semibold shadow-[0_2px_10px_rgba(16,185,129,0.1)]
                  hover:bg-emerald-500/15 hover:border-emerald-500/40 hover:shadow-[0_4px_15px_rgba(16,185,129,0.2)]
                  transition-all duration-300 shrink-0
                "
              >
                <span className="w-1.5 sm:w-2 h-1.5 sm:h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                <span className="max-sm:hidden">Admin Mode</span>
                <span className="sm:hidden text-[9px]">Admin</span>
              </Link>
            )}
            
            {user ? (
              <button onClick={logout} className="p-2 text-zinc-400 hover:text-white transition-colors rounded-full hover:bg-white/10">
                <LogOut className="w-5 h-5" />
              </button>
            ) : (
              <button onClick={openAuthModal} className="hidden sm:flex items-center gap-2 text-sm font-medium bg-white text-black px-5 py-2 rounded-full hover:bg-zinc-200 transition-colors shadow-lg hover:shadow-white/20">
                <LogIn className="w-4 h-4" />
                Sign In
              </button>
            )}
            
            <button 
              className="md:hidden p-2 text-zinc-400 hover:text-white"
              onClick={() => setMobileMenuOpen(true)}
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </div>
      </motion.header>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 md:hidden"
            />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 bottom-0 w-3/4 max-w-sm bg-brand-secondary border-l border-white/10 z-50 p-6 flex flex-col md:hidden shadow-2xl"
            >
              <div className="flex justify-between items-center mb-8">
                <span className="text-xl font-display font-bold text-white">Menu</span>
                <button onClick={() => setMobileMenuOpen(false)} className="p-2 bg-white/5 rounded-full text-zinc-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <form onSubmit={handleSearch} className="mb-8">
                <div className="relative">
                  <Search className="h-4 w-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input 
                    name="q"
                    defaultValue={query}
                    type="text" 
                    placeholder="Search..."
                    className="w-full bg-black/30 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-sm text-zinc-100 focus:outline-none focus:border-brand-purple"
                  />
                </div>
              </form>

              <nav className="flex flex-col gap-2">
                {navLinks.map((link) => (
                  <Link
                    key={link.name}
                    to={link.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className="px-4 py-3 rounded-xl text-zinc-300 hover:bg-white/5 hover:text-white transition-colors"
                  >
                    {link.name}
                  </Link>
                ))}
              </nav>

              <div className="mt-auto pt-8 border-t border-white/10 flex flex-col gap-4">
                {!user && (
                  <button onClick={() => { openAuthModal(); setMobileMenuOpen(false); }} className="flex justify-center items-center gap-2 w-full text-sm font-medium bg-white text-black px-5 py-3 rounded-xl hover:bg-zinc-200">
                    <LogIn className="w-4 h-4" /> Sign In
                  </button>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Floating Admin Dashboard Button in bottom-right corner for admins */}
      {isAdmin && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 50 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.5 }}
          className="fixed bottom-6 right-6 z-50"
        >
          <Link
            to="/admin"
            className="
              flex items-center gap-2.5 px-5 py-3.5 rounded-2xl
              bg-zinc-900/85 backdrop-blur-md border border-white/10
              text-sm font-semibold text-white shadow-[0_16px_36px_rgba(0,0,0,0.6)]
              hover:bg-zinc-800 hover:border-brand-purple/50 hover:shadow-[0_0_30px_rgba(139,92,246,0.25)]
              active:scale-95 transition-all duration-300 group
            "
          >
            <div className="w-2.5 h-2.5 rounded-full bg-brand-purple animate-pulse shrink-0" />
            <span>Admin Dashboard</span>
            <span className="text-zinc-500 group-hover:text-brand-purple transition-colors ml-1">→</span>
          </Link>
        </motion.div>
      )}
    </>
  );
}
