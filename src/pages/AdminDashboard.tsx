import { Link, useNavigate } from 'react-router-dom';
import { AdminLayout } from '../components/AdminLayout';
import { Upload, Image as ImageIcon, Users, Download, Activity, HardDrive, Edit, Trash2, Search, Loader2, ArrowRight } from 'lucide-react';
import { useEffect, useState } from 'react';
import { collection, getCountFromServer, query, orderBy, limit, getDocs, deleteDoc, doc, startAfter, QueryDocumentSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Prompt } from '../types';
import { toast } from 'sonner';

export function AdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    prompts: 0,
    downloads: 0,
    views: 0
  });
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [lastVisible, setLastVisible] = useState<QueryDocumentSnapshot | null>(null);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const promptsSnap = await getCountFromServer(collection(db, 'prompts'));
        setStats(prev => ({ ...prev, prompts: promptsSnap.data().count }));
      } catch(e) {}
    }
    fetchStats();
    fetchPrompts();
  }, []);

  const fetchPrompts = async (isLoadMore = false) => {
    try {
      let q;
      if (isLoadMore && lastVisible) {
        q = query(collection(db, 'prompts'), orderBy('createdAt', 'desc'), startAfter(lastVisible), limit(10));
      } else {
        q = query(collection(db, 'prompts'), orderBy('createdAt', 'desc'), limit(10));
        setLoading(true);
      }
      
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(d => ({ id: d.id, ...(d.data() as Record<string, any>) } as Prompt));
      
      if (isLoadMore) {
        setPrompts(prev => [...prev, ...data]);
      } else {
        setPrompts(data);
      }
      
      setLastVisible(snapshot.docs[snapshot.docs.length - 1]);
      setHasMore(snapshot.docs.length === 10);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load prompts");
    }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this prompt?")) return;
    try {
      await deleteDoc(doc(db, 'prompts', id));
      setPrompts(prev => prev.filter(p => p.id !== id));
      setStats(prev => ({ ...prev, prompts: prev.prompts - 1 }));
      toast.success("Prompt deleted");
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete prompt");
    }
  };

  const filteredPrompts = prompts.filter(p => 
    p.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    p.prompt.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <h1 className="text-3xl font-display font-bold">Admin Dashboard</h1>
        <div className="flex items-center gap-3">
          <Link 
            to="/admin/analytics" 
            className="bg-zinc-800 text-white px-4 py-2 rounded-xl font-medium hover:bg-zinc-700 transition-colors flex items-center gap-2 border border-white/10"
          >
            <Activity className="w-4 h-4" />
            Analytics
          </Link>
          <Link 
            to="/admin/bulk-upload" 
            className="bg-zinc-800 text-white px-4 py-2 rounded-xl font-medium hover:bg-zinc-700 transition-colors flex items-center gap-2 border border-white/10"
          >
            <HardDrive className="w-4 h-4" />
            Bulk Upload
          </Link>
          <Link 
            to="/admin/upload" 
            className="bg-white text-black px-4 py-2 rounded-xl font-medium hover:bg-zinc-200 transition-colors flex items-center gap-2"
          >
            <Upload className="w-4 h-4" />
            Upload
          </Link>
        </div>
      </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <StatCard icon={<ImageIcon />} label="Total Prompts" value={stats.prompts} />
          <StatCard icon={<Download />} label="Downloads" value={stats.downloads} />
          <StatCard icon={<Activity />} label="Total Views" value={stats.views} />
          <StatCard icon={<Users />} label="Total Users" value={0} />
        </div>

        <div className="bg-zinc-900 border border-white/10 rounded-2xl overflow-hidden">
          <div className="p-6 border-b border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <h2 className="text-xl font-semibold">Manage Prompts</h2>
            
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input 
                type="text"
                placeholder="Search prompts..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-2 bg-black/50 border border-white/10 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full md:w-64"
              />
            </div>
          </div>
          
          {loading && prompts.length === 0 ? (
            <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-indigo-500" /></div>
          ) : filteredPrompts.length === 0 ? (
            <div className="text-zinc-500 text-sm text-center py-12">
              No prompts found.
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {filteredPrompts.map((prompt) => (
                <div key={prompt.id} className="p-4 flex items-center gap-4 hover:bg-white/5 transition-colors group">
                  <img src={prompt.image} alt={prompt.title} className="w-16 h-16 object-cover rounded-lg bg-zinc-800 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium truncate text-white">{prompt.title}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">{prompt.category}</span>
                      <span className="text-xs text-zinc-500 truncate">{prompt.model}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-6 pr-4">
                    <div className="hidden md:flex items-center gap-4 text-xs text-zinc-500">
                      <span className="flex items-center gap-1" title="Views"><Activity className="w-3 h-3"/> {prompt.views || 0}</span>
                      <span className="flex items-center gap-1" title="Downloads"><Download className="w-3 h-3"/> {prompt.downloads || 0}</span>
                    </div>
                    
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => navigate(`/admin/edit/${prompt.id}`)} className="p-2 text-zinc-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(prompt.id)} className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {!loading && hasMore && !searchQuery && (
            <div className="p-4 border-t border-white/10 bg-black/20">
              <button 
                onClick={() => fetchPrompts(true)}
                className="w-full py-2 flex items-center justify-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors"
              >
                Load More <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
    </AdminLayout>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode, label: string, value: string | number }) {
  return (
    <div className="bg-zinc-900 border border-white/10 p-6 rounded-2xl flex items-center gap-4">
      <div className="p-4 bg-indigo-500/10 text-indigo-400 rounded-xl">
        {icon}
      </div>
      <div>
        <p className="text-sm text-zinc-400 font-medium">{label}</p>
        <p className="text-2xl font-bold text-white">{value}</p>
      </div>
    </div>
  );
}
