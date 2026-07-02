import { motion } from 'motion/react';
import { Prompt } from '../types';
import { Download, Heart, Copy, Eye, Sparkles } from 'lucide-react';
import { doc, increment, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { cn } from '../lib/utils';
import { useState } from 'react';
import { toast } from 'sonner';

interface PromptCardProps {
  prompt: Prompt;
  onClick: (prompt: Prompt) => void;
  onCopy: (e: React.MouseEvent, text: string) => void;
}

export function PromptCard({ prompt, onClick, onCopy }: PromptCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  
  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const response = await fetch(prompt.image);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${prompt.title.replace(/\s+/g, '-').toLowerCase()}-${prompt.id}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Download failed", error);
    }
  };

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    updateDoc(doc(db, 'prompts', prompt.id), { likes: increment(1) }).catch(console.error);
    toast.success("Added to favorites", { icon: "💖" });
  };

  const getAspectClass = (ratio?: string) => {
    switch (ratio) {
      case '16:9': return 'aspect-video';
      case '9:16': return 'aspect-[9/16]';
      case '4:3': return 'aspect-[4/3]';
      case '3:4': return 'aspect-[3/4]';
      case '3:2': return 'aspect-[3/2]';
      case '2:3': return 'aspect-[2/3]';
      case '1:1': return 'aspect-square';
      default: return 'aspect-[4/5]';
    }
  };

  const aspectRatioClass = getAspectClass(prompt.aspectRatio);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group relative rounded-[24px] overflow-hidden bg-brand-card border border-white/5 cursor-pointer shadow-lg hover:shadow-2xl hover:shadow-brand-purple/20 transition-all duration-500 will-change-transform"
      onClick={() => onClick(prompt)}
    >
      <div className={cn("relative overflow-hidden w-full bg-brand-secondary", aspectRatioClass)}>
        
        {/* Border Glow Effect */}
        <div className="absolute inset-0 bg-gradient-to-tr from-brand-purple/40 to-brand-blue/40 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none mix-blend-overlay z-10" />

        <motion.img 
          src={prompt.image} 
          alt={prompt.title}
          animate={{ scale: isHovered ? 1.08 : 1 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="w-full h-full object-cover"
          loading="lazy"
        />
        
        {/* Top Badges */}
        <div className="absolute top-4 left-4 right-4 flex justify-between items-start z-20 pointer-events-none">
          <div className="flex flex-col gap-2">
            <span className="px-3 py-1 bg-black/40 backdrop-blur-md rounded-full text-[11px] font-medium text-white border border-white/10 shadow-xl">
              {prompt.category}
            </span>
          </div>
          {prompt.featured && (
            <span className="px-3 py-1 bg-gradient-to-r from-brand-purple to-brand-pink rounded-full text-[11px] font-medium text-white shadow-lg flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> Premium
            </span>
          )}
        </div>

        {/* Bottom Glass Panel */}
        <div 
          className="absolute inset-0 bg-gradient-to-t from-brand-bg/90 via-brand-bg/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex flex-col justify-end p-5 z-20"
        >
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: isHovered ? 0 : 20, opacity: isHovered ? 1 : 0 }}
            transition={{ duration: 0.4, ease: "easeOut", delay: 0.1 }}
            className="flex flex-col gap-3"
          >
            <h3 className="text-white font-display font-medium text-lg truncate drop-shadow-md">{prompt.title}</h3>
            
            <div className="flex gap-2">
              <button 
                onClick={(e) => onCopy(e, prompt.prompt)}
                className="flex-1 bg-white/10 hover:bg-white/20 backdrop-blur-xl border border-white/10 text-white py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 text-sm font-medium transition-all shadow-xl hover:shadow-white/5 active:scale-95"
              >
                <Copy className="w-4 h-4" />
                Copy
              </button>
              <button 
                onClick={handleDownload}
                className="bg-white/10 hover:bg-white/20 backdrop-blur-xl border border-white/10 text-white p-2.5 rounded-xl flex items-center justify-center transition-all shadow-xl hover:shadow-white/5 active:scale-95"
              >
                <Download className="w-4 h-4" />
              </button>
              <button 
                onClick={handleLike}
                className="bg-brand-purple/20 hover:bg-brand-purple/40 backdrop-blur-xl border border-brand-purple/30 text-brand-pink p-2.5 rounded-xl flex items-center justify-center transition-all shadow-xl hover:shadow-brand-purple/10 active:scale-95"
              >
                <Heart className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="p-4 bg-brand-card">
        <div className="flex items-center justify-between text-xs text-zinc-400">
          <span className="truncate font-medium">{prompt.creator || 'Aura Creator'}</span>
          <div className="flex items-center gap-3 shrink-0">
            <span className="flex items-center gap-1.5"><Eye className="w-3.5 h-3.5" /> {prompt.views || 0}</span>
            <span className="flex items-center gap-1.5"><Heart className="w-3.5 h-3.5" /> {prompt.likes || 0}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
