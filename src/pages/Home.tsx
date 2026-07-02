import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { collection, query, orderBy, limit, getDocs, startAfter, QueryDocumentSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Prompt, CATEGORIES } from '../types';
import { PromptCard } from '../components/PromptCard';
import { PromptModal } from '../components/PromptModal';
import { Header } from '../components/Header';
import { Hero } from '../components/Hero';
import { Footer } from '../components/Footer';
import { useInView } from 'react-intersection-observer';
import { toast } from 'sonner';

export function Home() {
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPrompt, setSelectedPrompt] = useState<Prompt | null>(null);
  const [lastVisible, setLastVisible] = useState<QueryDocumentSnapshot | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();
  const searchQuery = searchParams.get('q') || "";
  const categoryParam = searchParams.get('category');
  const [activeCategory, setActiveCategory] = useState(categoryParam || "All");
  const [sortBy, setSortBy] = useState("Newest");

  useEffect(() => {
    if (categoryParam) {
      setActiveCategory(categoryParam);
    }
  }, [categoryParam]);

  const { ref, inView } = useInView();

  useEffect(() => {
    fetchInitialPrompts();
  }, [activeCategory, sortBy, searchQuery]);

  useEffect(() => {
    if (inView && hasMore && !loading && !searchQuery) {
      fetchMorePrompts();
    }
  }, [inView]);

  const getSortField = () => {
    if (sortBy === "Most Liked") return "likes";
    if (sortBy === "Most Downloaded") return "downloads";
    if (sortBy === "Trending") return "views";
    return "createdAt";
  };

  const fetchInitialPrompts = async () => {
    setLoading(true);
    try {
      let q = query(collection(db, 'prompts'));
      
      // We can only do simple ordering/limiting on client side easily without composite indexes
      if (activeCategory !== "All") {
        q = query(collection(db, 'prompts'), limit(100)); // Simple fetch for category
      } else {
        q = query(collection(db, 'prompts'), orderBy(getSortField(), 'desc'), limit(12));
      }
      
      const snapshot = await getDocs(q);
      let data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Prompt));

      if (activeCategory !== "All") {
        data = data.filter(p => p.category === activeCategory);
      }
      
      if (searchQuery) {
        const lowerQ = searchQuery.toLowerCase();
        data = data.filter(p => 
          p.title.toLowerCase().includes(lowerQ) || 
          p.prompt.toLowerCase().includes(lowerQ) ||
          p.tags?.some(t => t.toLowerCase().includes(lowerQ))
        );
      }

      setPrompts(data);
      setLastVisible(snapshot.docs[snapshot.docs.length - 1]);
      setHasMore(snapshot.docs.length === 12 && !searchQuery && activeCategory === "All");
    } catch (error) {
      console.error("Error fetching prompts", error);
    }
    setLoading(false);
  };

  const fetchMorePrompts = async () => {
    if (!lastVisible || searchQuery || activeCategory !== "All") return;
    try {
      const q = query(collection(db, 'prompts'), orderBy(getSortField(), 'desc'), startAfter(lastVisible), limit(12));
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
      
      <main className="pb-16">
        <Hero />

        {/* Categories */}
        <section className="px-4 max-w-7xl mx-auto mb-12 overflow-x-auto custom-scrollbar pb-4 -mt-10 relative z-20">
          <div className="flex gap-3 items-center">
            <button 
              onClick={() => setActiveCategory("All")}
              className={`whitespace-nowrap px-6 py-2.5 rounded-full text-sm font-medium transition-all ${activeCategory === "All" ? 'bg-gradient-to-r from-brand-purple to-brand-blue text-white shadow-lg shadow-brand-purple/25 border border-transparent' : 'bg-brand-secondary/80 text-zinc-400 hover:bg-brand-card hover:text-white border border-white/5 backdrop-blur-sm'}`}
            >
              All Prompts
            </button>
            {CATEGORIES.slice(0, 12).map(cat => (
              <button 
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`whitespace-nowrap px-6 py-2.5 rounded-full text-sm font-medium transition-all ${activeCategory === cat ? 'bg-gradient-to-r from-brand-purple to-brand-blue text-white shadow-lg shadow-brand-purple/25 border border-transparent' : 'bg-brand-secondary/80 text-zinc-400 hover:bg-brand-card hover:text-white border border-white/5 backdrop-blur-sm'}`}
              >
                {cat}
              </button>
            ))}
          </div>
        </section>

        {/* Filters */}
        <section className="px-4 max-w-7xl mx-auto mb-10 flex items-center justify-between">
          <h2 className="text-2xl font-display font-semibold text-white">
            {activeCategory === "All" && !searchQuery ? "Trending Masterpieces" : searchQuery ? `Search Results for "${searchQuery}"` : `${activeCategory} Curated Prompts`}
          </h2>
          <div className="relative">
            <select 
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="appearance-none bg-brand-secondary/50 border border-white/10 text-sm text-zinc-300 rounded-full px-5 py-2.5 pr-10 outline-none focus:ring-2 focus:ring-brand-purple/50 backdrop-blur-sm hover:bg-brand-secondary transition-colors"
            >
              <option>Newest</option>
              <option>Trending</option>
              <option>Most Liked</option>
              <option>Most Downloaded</option>
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
              <svg className="w-4 h-4 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
            </div>
          </div>
        </section>

        {/* Gallery */}
        <section className="px-4 max-w-7xl mx-auto min-h-[50vh]">
          {prompts.length === 0 && !loading ? (
             <div className="text-center py-32">
                <div className="w-24 h-24 mx-auto mb-6 bg-brand-secondary/50 rounded-full flex items-center justify-center border border-white/5">
                  <svg className="w-10 h-10 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                </div>
                <h3 className="text-xl font-medium text-white mb-2">No prompts found</h3>
                <p className="text-zinc-500">Try adjusting your search or filters.</p>
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
