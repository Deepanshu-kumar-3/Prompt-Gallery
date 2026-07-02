import { motion } from 'motion/react';
import { Search, Sparkles, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function Hero() {
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const q = formData.get('q');
    navigate(`/?q=${q}`);
  };

  const trendingTags = ['Midjourney v6', 'Cinematic', 'Anime', 'Cyberpunk', 'Photorealistic', 'Logo Design'];

  return (
    <div className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden flex flex-col items-center justify-center min-h-[70vh]">
      
      {/* Background blobs */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-brand-purple/20 rounded-full blur-[120px] opacity-50 pointer-events-none" />
      <div className="absolute top-1/3 left-1/4 w-[600px] h-[600px] bg-brand-pink/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-brand-blue/20 rounded-full blur-[100px] pointer-events-none" />
      
      <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 mb-8 backdrop-blur-md"
        >
          <Sparkles className="w-4 h-4 text-brand-purple" />
          <span className="text-sm text-zinc-300">Discover 10,000+ AI Prompts</span>
        </motion.div>

        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1, ease: "easeOut" }}
          className="text-5xl md:text-7xl font-display font-bold tracking-tight mb-6 leading-tight"
        >
          Fuel Your <span className="text-gradient">Creativity</span> <br className="hidden md:block" />
          with AI Art Prompts
        </motion.h1>

        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2, ease: "easeOut" }}
          className="text-lg md:text-xl text-zinc-400 mb-10 max-w-2xl mx-auto leading-relaxed"
        >
          Explore a premium collection of highly curated prompts for Midjourney, Stable Diffusion, and DALL-E. Copy, create, and inspire.
        </motion.p>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3, ease: "easeOut" }}
          className="w-full max-w-2xl mx-auto"
        >
          <form onSubmit={handleSearch} className="relative group">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
              <Search className="h-6 w-6 text-zinc-400 group-focus-within:text-brand-purple transition-colors" />
            </div>
            <input 
              name="q"
              type="text" 
              placeholder="Describe what you want to create..."
              className="w-full bg-white/5 border border-white/10 hover:border-white/20 rounded-full py-4 pl-14 pr-6 text-lg text-white focus:outline-none focus:ring-2 focus:ring-brand-purple/50 focus:bg-white/10 transition-all backdrop-blur-xl shadow-2xl"
            />
            <button type="submit" className="absolute right-2 top-2 bottom-2 bg-gradient-to-r from-brand-purple to-brand-blue text-white px-6 rounded-full font-medium shadow-lg hover:shadow-brand-purple/25 transition-all">
              Search
            </button>
          </form>
          
          <div className="mt-6 flex flex-wrap items-center justify-center gap-2 text-sm text-zinc-400">
            <span className="flex items-center gap-1 mr-2"><TrendingUp className="w-4 h-4" /> Trending:</span>
            {trendingTags.map((tag) => (
              <button 
                key={tag}
                onClick={() => navigate(`/?q=${tag}`)}
                className="px-3 py-1 rounded-full bg-white/5 border border-white/5 hover:bg-white/10 hover:text-white transition-colors"
              >
                {tag}
              </button>
            ))}
          </div>
        </motion.div>
      </div>

    </div>
  );
}
