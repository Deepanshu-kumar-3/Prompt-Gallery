import { useState, useEffect } from 'react';
import { collection, query, orderBy, limit, getDocs, startAfter, QueryDocumentSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Prompt } from '../types';
import { PromptCard } from '../components/PromptCard';
import { PromptModal } from '../components/PromptModal';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { useInView } from 'react-intersection-observer';
import { toast } from 'sonner';
import { motion } from 'motion/react';
import { Flame } from 'lucide-react';

export function Trending() {
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPrompt, setSelectedPrompt] = useState<Prompt | null>(null);
  const [lastVisible, setLastVisible] = useState<QueryDocumentSnapshot | null>(null);
  const [hasMore, setHasMore] = useState(true);
  
  const { ref, inView } = useInView();

  useEffect(() => {
    fetchInitialPrompts();
  }, []);

  useEffect(() => {
    if (inView && hasMore && !loading) {
      fetchMorePrompts();
    }
  }, [inView]);

  const fetchInitialPrompts = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'prompts'), orderBy('views', 'desc'), limit(16));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Prompt));
      
      setPrompts(data);
      setLastVisible(snapshot.docs[snapshot.docs.length - 1]);
      setHasMore(snapshot.docs.length === 16);
    } catch (error) {
      console.error("Error fetching prompts", error);
    }
    setLoading(false);
  };

  const fetchMorePrompts = async () => {
    if (!lastVisible) return;
    try {
      const q = query(collection(db, 'prompts'), orderBy('views', 'desc'), startAfter(lastVisible), limit(12));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Prompt));
      setPrompts(prev => [...prev, ...data]);
      setLastVisible(snapshot.docs[snapshot.docs.length - 1]);
      setHasMore(snapshot.docs.length === 12);
    } catch (error) {
      console.error("Error fetching more prompts", error);
    }
  };

  const handleCopy = (e: React.MouseEvent, text: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    toast.success("Prompt copied to clipboard!");
  };

  const handleNext = () => {
    if (!selectedPrompt) return;
    const index = prompts.findIndex(p => p.id === selectedPrompt.id);
    if (index < prompts.length - 1) setSelectedPrompt(prompts[index + 1]);
  };

  const handlePrev = () => {
    if (!selectedPrompt) return;
    const index = prompts.findIndex(p => p.id === selectedPrompt.id);
    if (index > 0) setSelectedPrompt(prompts[index - 1]);
  };

  return (
    <div className="min-h-screen bg-brand-bg selection:bg-brand-purple/30">
      <Header />
      
      <main className="pt-32 pb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="px-4 max-w-7xl mx-auto mb-16 text-center"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-brand-purple/10 mb-6">
            <Flame className="w-8 h-8 text-brand-purple" />
          </div>
          <h1 className="text-4xl md:text-6xl font-display font-bold text-white mb-6">
            Trending <span className="text-gradient">Masterpieces</span>
          </h1>
          <p className="text-zinc-400 max-w-2xl mx-auto text-lg">
            Discover the most viewed and highly sought-after AI prompts sweeping the community right now.
          </p>
        </motion.div>

        {/* Gallery */}
        <section className="px-4 max-w-7xl mx-auto min-h-[50vh]">
          {prompts.length === 0 && !loading ? (
             <div className="text-center py-32">
                <div className="w-24 h-24 mx-auto mb-6 bg-brand-secondary/50 rounded-full flex items-center justify-center border border-white/5">
                  <Flame className="w-10 h-10 text-zinc-500" />
                </div>
                <h3 className="text-xl font-medium text-white mb-2">No trending prompts</h3>
                <p className="text-zinc-500">Check back later.</p>
             </div>
          ) : (
            <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-6 space-y-6">
              {prompts.map((prompt) => (
                <div key={prompt.id} className="break-inside-avoid">
                  <PromptCard 
                    prompt={prompt} 
                    onClick={setSelectedPrompt} 
                    onCopy={handleCopy}
                  />
                </div>
              ))}
            </div>
          )}

          {/* Loading / Infinite Scroll trigger */}
          <div ref={ref} className="py-20 flex justify-center">
            {loading && (
              <div className="flex items-center gap-3 bg-brand-secondary/50 px-6 py-3 rounded-full border border-white/5 backdrop-blur-sm">
                <div className="w-5 h-5 border-2 border-brand-purple border-t-transparent rounded-full animate-spin" />
                <span className="text-sm font-medium text-zinc-300">Loading masterworks...</span>
              </div>
            )}
          </div>
        </section>
      </main>

      <Footer />

      {/* Modal */}
      {selectedPrompt && (
        <PromptModal 
          prompt={selectedPrompt} 
          onClose={() => setSelectedPrompt(null)} 
          onCopy={handleCopy}
          onNext={handleNext}
          onPrev={handlePrev}
        />
      )}
    </div>
  );
}
