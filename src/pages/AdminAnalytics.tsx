import { AdminLayout } from '../components/AdminLayout';
import { Activity, Download, Eye, TrendingUp, Users } from 'lucide-react';
import { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Prompt } from '../types';

export function AdminAnalytics() {
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        const q = query(collection(db, 'prompts'), orderBy('views', 'desc'), limit(50));
        const snapshot = await getDocs(q);
        setPrompts(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Prompt)));
      } catch (error) {
        console.error("Error fetching analytics", error);
      }
      setLoading(false);
    }
    fetchAnalytics();
  }, []);

  const totalViews = prompts.reduce((acc, p) => acc + (p.views || 0), 0);
  const totalDownloads = prompts.reduce((acc, p) => acc + (p.downloads || 0), 0);
  const totalLikes = prompts.reduce((acc, p) => acc + (p.likes || 0), 0);

  return (
    <AdminLayout>
      <h1 className="text-3xl font-display font-bold mb-8">Analytics Overview</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <StatCard icon={<Eye className="text-indigo-400" />} label="Total Views" value={totalViews} />
        <StatCard icon={<Download className="text-emerald-400" />} label="Total Downloads" value={totalDownloads} />
        <StatCard icon={<Activity className="text-rose-400" />} label="Total Likes" value={totalLikes} />
      </div>

      <div className="bg-zinc-900 border border-white/10 rounded-2xl overflow-hidden p-6">
        <h2 className="text-xl font-semibold mb-6 flex items-center gap-2"><TrendingUp className="w-5 h-5 text-indigo-400"/> Top Performing Prompts</h2>
        
        {loading ? (
          <div className="animate-pulse space-y-4">
            {[1,2,3].map(i => <div key={i} className="h-16 bg-white/5 rounded-xl"></div>)}
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {prompts.slice(0, 10).map((prompt, index) => (
              <div key={prompt.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <span className="text-xl font-bold text-zinc-600 w-6 text-center">#{index + 1}</span>
                  <img src={prompt.image} alt={prompt.title} className="w-12 h-12 rounded-lg object-cover bg-zinc-800" />
                  <div>
                    <h3 className="font-medium text-white line-clamp-1">{prompt.title}</h3>
                    <p className="text-sm text-zinc-400">{prompt.category}</p>
                  </div>
                </div>
                <div className="flex gap-6 text-sm font-medium">
                  <span className="flex items-center gap-1.5 text-zinc-300"><Eye className="w-4 h-4 text-zinc-500" /> {prompt.views || 0}</span>
                  <span className="flex items-center gap-1.5 text-zinc-300"><Download className="w-4 h-4 text-zinc-500" /> {prompt.downloads || 0}</span>
                  <span className="flex items-center gap-1.5 text-zinc-300"><Activity className="w-4 h-4 text-zinc-500" /> {prompt.likes || 0}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode, label: string, value: string | number }) {
  return (
    <div className="bg-zinc-900 border border-white/10 p-6 rounded-2xl flex items-center gap-4">
      <div className="p-4 bg-white/5 rounded-xl border border-white/5">
        {icon}
      </div>
      <div>
        <p className="text-sm text-zinc-400 font-medium">{label}</p>
        <p className="text-2xl font-bold text-white">{value.toLocaleString()}</p>
      </div>
    </div>
  );
}
