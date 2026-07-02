import { Link } from 'react-router-dom';
import { ArrowRight, Twitter, Github, Dribbble, Disc as Discord } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-brand-bg pt-20 pb-10 border-t border-white/5 overflow-hidden relative">
      {/* Background elements */}
      <div className="absolute bottom-0 left-1/4 w-[500px] h-[500px] bg-brand-purple/5 rounded-full blur-[120px] pointer-events-none" />
      
      <div className="max-w-7xl mx-auto px-4 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          <div className="lg:col-span-1">
            <Link to="/" className="text-2xl font-display font-bold tracking-tight text-white flex items-center gap-2 mb-6">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-brand-purple to-brand-blue flex items-center justify-center">
                <span className="text-white text-lg leading-none">A</span>
              </div>
              Aura
            </Link>
            <p className="text-zinc-400 mb-6 text-sm leading-relaxed">
              Premium AI art prompts curated for creators. Elevate your generations with our vast collection of meticulously crafted prompts.
            </p>
            <div className="flex items-center gap-4 text-zinc-400">
              <a href="#" className="hover:text-white transition-colors p-2 hover:bg-white/5 rounded-full"><Twitter className="w-5 h-5" /></a>
              <a href="#" className="hover:text-white transition-colors p-2 hover:bg-white/5 rounded-full"><Github className="w-5 h-5" /></a>
              <a href="#" className="hover:text-white transition-colors p-2 hover:bg-white/5 rounded-full"><Discord className="w-5 h-5" /></a>
              <a href="#" className="hover:text-white transition-colors p-2 hover:bg-white/5 rounded-full"><Dribbble className="w-5 h-5" /></a>
            </div>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-6">Explore</h4>
            <ul className="space-y-4 text-sm text-zinc-400">
              <li><Link to="/trending" className="hover:text-brand-purple transition-colors">Trending Prompts</Link></li>
              <li><Link to="/popular" className="hover:text-brand-purple transition-colors">Popular Creators</Link></li>
              <li><Link to="/categories" className="hover:text-brand-purple transition-colors">Categories</Link></li>
              <li><Link to="/latest" className="hover:text-brand-purple transition-colors">Latest Uploads</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-6">Resources</h4>
            <ul className="space-y-4 text-sm text-zinc-400">
              <li><a href="#" className="hover:text-brand-purple transition-colors">Prompt Guide</a></li>
              <li><a href="#" className="hover:text-brand-purple transition-colors">API Documentation</a></li>
              <li><a href="#" className="hover:text-brand-purple transition-colors">Pricing</a></li>
              <li><a href="#" className="hover:text-brand-purple transition-colors">Help Center</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-6">Newsletter</h4>
            <p className="text-sm text-zinc-400 mb-4">Get the best prompts delivered weekly.</p>
            <form className="relative" onSubmit={e => e.preventDefault()}>
              <input 
                type="email" 
                placeholder="Enter your email" 
                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-4 pr-12 text-sm text-zinc-100 focus:outline-none focus:border-brand-purple/50 focus:bg-white/10 transition-all"
              />
              <button type="submit" className="absolute right-2 top-2 bottom-2 bg-white/10 hover:bg-white/20 text-white rounded-lg px-2 flex items-center justify-center transition-colors">
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>

        <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-zinc-500">
          <p>© {new Date().getFullYear()} Aura AI. All rights reserved.</p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
