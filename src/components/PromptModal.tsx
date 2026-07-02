import { motion, AnimatePresence } from 'motion/react';
import { Prompt } from '../types';
import { X, Copy, Download, Share2, Heart, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { useEffect } from 'react';
import { doc, increment, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { cn } from '../lib/utils';
import { toast } from 'sonner';

interface PromptModalProps {
  prompt: Prompt | null;
  onClose: () => void;
  onCopy: (e: React.MouseEvent, text: string) => void;
  onNext?: () => void;
  onPrev?: () => void;
}

export function PromptModal({ prompt, onClose, onCopy, onNext, onPrev }: PromptModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight' && onNext) onNext();
      if (e.key === 'ArrowLeft' && onPrev) onPrev();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, onNext, onPrev]);

  useEffect(() => {
    // Increment views
    if (prompt) {
      updateDoc(doc(db, 'prompts', prompt.id), {
        views: increment(1)
      }).catch(console.error);
    }
  }, [prompt]);

  if (!prompt) return null;

  const handleDownload = async () => {
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
      
      // Increment downloads
      updateDoc(doc(db, 'prompts', prompt.id), {
        downloads: increment(1)
      }).catch(console.error);
      
      toast.success("Download started");
    } catch (error) {
      console.error("Download failed", error);
      toast.error("Download failed");
    }
  };

  const handleLike = () => {
    updateDoc(doc(db, 'prompts', prompt.id), {
      likes: increment(1)
    }).catch(console.error);
    toast.success("Added to favorites", { icon: "💖" });
  };

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-2xl p-4 md:p-8"
        onClick={onClose}
      >
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 md:top-8 md:right-8 p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-white transition-all shadow-xl z-50 hover:scale-105 active:scale-95"
        >
          <X className="w-6 h-6" />
        </button>

        {onPrev && (
          <button onClick={(e) => { e.stopPropagation(); onPrev(); }} className="absolute left-4 p-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-white transition-all hidden md:block z-50 shadow-xl hover:scale-105 active:scale-95">
            <ChevronLeft className="w-6 h-6" />
          </button>
        )}

        {onNext && (
          <button onClick={(e) => { e.stopPropagation(); onNext(); }} className="absolute right-4 p-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-white transition-all hidden md:block z-50 shadow-xl hover:scale-105 active:scale-95">
            <ChevronRight className="w-6 h-6" />
          </button>
        )}

        <motion.div 
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-[1200px] h-[90vh] bg-brand-card border border-white/10 rounded-[28px] overflow-hidden shadow-2xl flex flex-col md:flex-row relative"
        >
          {/* Image Section */}
          <div className="flex-1 bg-brand-bg relative flex items-center justify-center min-h-[40vh] md:min-h-0 overflow-hidden group">
            {prompt.featured && (
               <div className="absolute top-6 left-6 z-10 px-4 py-2 bg-gradient-to-r from-brand-purple to-brand-pink rounded-full text-sm font-medium text-white shadow-xl flex items-center gap-2">
                 <Sparkles className="w-4 h-4" /> Premium
               </div>
            )}
            
            {/* Background blur effect for image */}
            <div 
              className="absolute inset-0 bg-cover bg-center opacity-30 blur-3xl scale-110"
              style={{ backgroundImage: `url(${prompt.image})` }}
            />
            
            <img 
              src={prompt.image} 
              alt={prompt.title} 
              className="w-full h-full object-contain relative z-10 p-4 md:p-8 drop-shadow-2xl"
            />
          </div>

          {/* Details Section */}
          <div className="w-full md:w-[450px] lg:w-[500px] p-6 md:p-10 overflow-y-auto bg-brand-secondary/80 backdrop-blur-xl flex flex-col gap-8 custom-scrollbar border-l border-white/5 relative z-20">
            
            <div>
              <h2 className="text-3xl font-display font-bold text-white mb-3 drop-shadow-md leading-tight">{prompt.title}</h2>
              <div className="flex items-center gap-3 text-sm text-zinc-400">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-brand-purple to-brand-blue flex items-center justify-center text-xs text-white">
                    {prompt.creator ? prompt.creator[0].toUpperCase() : 'A'}
                  </div>
                  <span className="font-medium text-zinc-300">{prompt.creator || 'Aura Creator'}</span>
                </div>
                <span>•</span>
                <span className="px-3 py-1 bg-white/5 rounded-full border border-white/5">{prompt.model}</span>
              </div>
            </div>

            <div className="space-y-6">
              <div className="space-y-3 relative group">
                <div className="flex justify-between items-center">
                  <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Prompt</h3>
                </div>
                <div className="p-5 bg-black/30 rounded-[20px] text-sm text-zinc-200 leading-relaxed border border-white/5 shadow-inner">
                  {prompt.prompt}
                </div>
                <button 
                  onClick={(e) => onCopy(e, prompt.prompt)} 
                  className="absolute bottom-4 right-4 p-2 bg-brand-purple/20 text-brand-purple hover:bg-brand-purple hover:text-white rounded-xl transition-all shadow-lg opacity-0 group-hover:opacity-100"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>

              {prompt.negativePrompt && (
                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Negative Prompt</h3>
                  <div className="p-5 bg-black/30 rounded-[20px] text-sm text-zinc-400 leading-relaxed border border-red-500/10 shadow-inner">
                    {prompt.negativePrompt}
                  </div>
                </div>
              )}
            </div>

            {/* Metadata Grid */}
            <div className="grid grid-cols-3 gap-3">
              <MetaItem label="Model" value={prompt.model} />
              <MetaItem label="Ratio" value={prompt.aspectRatio || "1:1"} />
              <MetaItem label="Seed" value={prompt.seed || "Random"} />
              <MetaItem label="CFG" value={prompt.cfg?.toString() || "7"} />
              <MetaItem label="Steps" value={prompt.steps?.toString() || "30"} />
              <MetaItem label="Sampler" value={prompt.sampler || "Euler a"} />
            </div>

            <div className="flex flex-wrap gap-2 pt-2">
              <span className="px-4 py-1.5 bg-brand-purple/10 text-brand-purple rounded-full text-xs font-medium border border-brand-purple/20">
                {prompt.category}
              </span>
              {prompt.tags?.map(tag => (
                <span key={tag} className="px-4 py-1.5 bg-white/5 hover:bg-white/10 text-zinc-300 rounded-full text-xs border border-white/5 transition-colors cursor-pointer">
                  {tag}
                </span>
              ))}
            </div>

            {/* Actions */}
            <div className="mt-auto pt-8 flex gap-3">
              <button 
                onClick={(e) => onCopy(e, prompt.prompt)}
                className="flex-1 bg-gradient-to-r from-brand-purple to-brand-blue hover:opacity-90 text-white py-3.5 px-4 rounded-[16px] font-medium flex items-center justify-center gap-2 transition-all shadow-lg shadow-brand-purple/25 active:scale-95"
              >
                <Copy className="w-5 h-5" />
                Copy Prompt
              </button>
              <button 
                onClick={handleDownload}
                className="bg-white/5 hover:bg-white/10 border border-white/10 text-white p-3.5 rounded-[16px] flex items-center justify-center transition-all hover:scale-105 active:scale-95"
              >
                <Download className="w-5 h-5" />
              </button>
              <button 
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({
                      title: prompt.title,
                      text: prompt.prompt,
                      url: window.location.href,
                    }).catch(console.error);
                  }
                }}
                className="bg-white/5 hover:bg-white/10 border border-white/10 text-white p-3.5 rounded-[16px] flex items-center justify-center transition-all hover:scale-105 active:scale-95"
              >
                <Share2 className="w-5 h-5" />
              </button>
              <button 
                onClick={handleLike}
                className="bg-brand-pink/10 hover:bg-brand-pink/20 border border-brand-pink/20 text-brand-pink p-3.5 rounded-[16px] flex items-center justify-center transition-all shadow-lg shadow-brand-pink/10 hover:scale-105 active:scale-95"
              >
                <Heart className="w-5 h-5" />
              </button>
            </div>

          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function MetaItem({ label, value }: { label: string, value: string }) {
  return (
    <div className="bg-black/20 p-3 rounded-xl border border-white/5 hover:border-white/10 transition-colors">
      <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-1.5">{label}</div>
      <div className="text-sm font-medium text-zinc-200 truncate">{value}</div>
    </div>
  );
}
