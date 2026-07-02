import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAdminAuth } from '../auth/admin/AdminAuthProvider';
import { 
  LayoutDashboard, 
  Upload, 
  HardDrive, 
  Activity, 
  Globe, 
  LogOut, 
  Menu, 
  X,
  Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const { adminUser, logoutAdmin } = useAdminAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Keyboard shortcut: Press V to instantly open the public website
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      if (activeEl && (
        activeEl.tagName === 'INPUT' ||
        activeEl.tagName === 'TEXTAREA' ||
        activeEl.hasAttribute('contenteditable')
      )) {
        return;
      }
      if (e.key === 'v' || e.key === 'V') {
        navigate('/');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate]);

  const menuItems = [
    { name: 'Dashboard', path: '/admin', icon: LayoutDashboard },
    { name: 'Upload Prompt', path: '/admin/upload', icon: Upload },
    { name: 'Bulk Upload', path: '/admin/bulk-upload', icon: HardDrive },
    { name: 'Analytics', path: '/admin/analytics', icon: Activity },
  ];

  const sidebarContent = (
    <div className="flex flex-col h-full justify-between">
      <div>
        {/* Logo / Header */}
        <div className="flex items-center gap-3 px-2 py-4 mb-6 border-b border-white/5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-purple to-brand-blue flex items-center justify-center shadow-lg shadow-brand-purple/20">
            <span className="text-white text-lg font-bold font-display leading-none">A</span>
          </div>
          <div>
            <span className="text-xs tracking-[0.2em] uppercase font-bold text-zinc-500 block">Aura</span>
            <span className="text-sm font-semibold text-white">Admin Portal</span>
          </div>
        </div>

        {/* Navigation links */}
        <nav className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.name}
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group relative",
                  isActive 
                    ? "text-white bg-white/5 border-l-2 border-brand-purple" 
                    : "text-zinc-400 hover:text-white hover:bg-white/5"
                )}
              >
                <Icon className={cn(
                  "w-4 h-4 transition-colors",
                  isActive ? "text-brand-purple" : "text-zinc-500 group-hover:text-zinc-300"
                )} />
                <span>{item.name}</span>
                {isActive && (
                  <motion.div
                    layoutId="sidebar-active-indicator"
                    className="absolute inset-0 bg-gradient-to-r from-brand-purple/10 to-transparent rounded-xl -z-10"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Sidebar Footer */}
      <div className="space-y-3 pt-6 border-t border-white/5">
        {/* View Website at bottom of sidebar */}
        <Link
          to="/"
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-zinc-300 hover:text-white hover:bg-white/5 border border-white/5 transition-all duration-200 group bg-black/20"
        >
          <Globe className="w-4 h-4 text-brand-blue group-hover:animate-pulse" />
          <span>View Website</span>
        </Link>

        {/* Logout */}
        <button
          onClick={logoutAdmin}
          className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex">
      {/* Desktop Sidebar */}
      <aside className="hidden md:block w-64 border-r border-white/10 bg-zinc-950/80 backdrop-blur-xl p-5 fixed top-0 bottom-0 left-0 z-40">
        {sidebarContent}
      </aside>

      {/* Main Panel */}
      <div className="flex-1 md:pl-64 min-h-screen flex flex-col">
        {/* Top Header / Navbar */}
        <header className="sticky top-0 z-30 flex items-center justify-between px-6 md:px-8 py-4 bg-zinc-950/60 backdrop-blur-md border-b border-white/5">
          {/* Mobile hamburger menu button */}
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="md:hidden p-2 -ml-2 text-zinc-400 hover:text-white transition-colors"
            aria-label="Open navigation menu"
          >
            <Menu className="w-6 h-6" />
          </button>

          {/* Admin title display context */}
          <div className="flex items-center gap-2 max-md:hidden">
            <Sparkles className="w-4 h-4 text-brand-purple" />
            <span className="text-xs font-mono text-zinc-500 uppercase tracking-widest">
              Active Session: {adminUser?.email}
            </span>
          </div>

          <div className="flex items-center gap-3 ml-auto">
            {/* View Website Pill Button with gradient border & glassmorphism */}
            <Link
              to="/"
              className="
                group relative flex items-center gap-2 px-5 py-2.5 rounded-full 
                bg-white/5 border border-white/10 hover:border-white/20
                text-sm font-semibold text-white shadow-[0_4px_20px_rgba(0,0,0,0.5)] 
                hover:shadow-[0_4px_25px_rgba(139,92,246,0.15)]
                transition-all duration-300 overflow-hidden
              "
            >
              {/* Premium gradient border hover overlay */}
              <div className="absolute inset-0 bg-gradient-to-r from-brand-purple/20 to-brand-blue/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              
              <Globe className="w-4 h-4 text-brand-blue group-hover:scale-110 transition-transform duration-300" />
              <span>View Website</span>
              
              <kbd className="hidden sm:inline-flex items-center h-5 select-none pointer-events-none px-1.5 font-mono text-[10px] font-bold bg-white/10 text-zinc-400 rounded border border-white/5 ml-1">
                V
              </kbd>
            </Link>
          </div>
        </header>

        {/* Page Content area */}
        <main className="flex-1 p-6 md:p-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile Drawer Navigation overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 md:hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="absolute top-0 bottom-0 left-0 w-72 bg-zinc-950 p-6 border-r border-white/10 flex flex-col justify-between"
            >
              {/* Close button inside drawer */}
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="absolute top-5 right-5 p-2 text-zinc-400 hover:text-white transition-colors"
                aria-label="Close navigation menu"
              >
                <X className="w-6 h-6" />
              </button>
              {sidebarContent}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
