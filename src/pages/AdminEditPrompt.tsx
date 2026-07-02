import { useState, useEffect } from 'react';
import { AdminLayout } from '../components/AdminLayout';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../lib/firebase';
import { CATEGORIES, Prompt } from '../types';
import { toast } from 'sonner';
import { Upload, X, Loader2, ArrowLeft } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { useNavigate, useParams } from 'react-router-dom';

export function AdminEditPrompt() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [originalImage, setOriginalImage] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    prompt: '',
    negativePrompt: '',
    category: CATEGORIES[0],
    tags: '',
    model: 'Midjourney v6',
    aspectRatio: '1:1',
    seed: '',
    cfg: '7',
    steps: '30',
    sampler: 'Euler a',
    featured: false,
    trending: false,
  });

  useEffect(() => {
    async function fetchPrompt() {
      if (!id) return;
      try {
        const docRef = doc(db, 'prompts', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data() as Prompt;
          setFormData({
            title: data.title || '',
            prompt: data.prompt || '',
            negativePrompt: data.negativePrompt || '',
            category: data.category || CATEGORIES[0],
            tags: data.tags?.join(', ') || '',
            model: data.model || 'Midjourney v6',
            aspectRatio: data.aspectRatio || '1:1',
            seed: data.seed || '',
            cfg: data.cfg?.toString() || '7',
            steps: data.steps?.toString() || '30',
            sampler: data.sampler || 'Euler a',
            featured: data.featured || false,
            trending: data.trending || false,
          });
          setOriginalImage(data.image);
        } else {
          toast.error("Prompt not found");
          navigate('/admin');
        }
      } catch (error) {
        console.error(error);
        toast.error("Failed to load prompt");
      }
      setLoading(false);
    }
    fetchPrompt();
  }, [id, navigate]);

  const onDrop = (acceptedFiles: File[]) => {
    if (acceptedFiles[0]) {
      setFile(acceptedFiles[0]);
      setPreview(URL.createObjectURL(acceptedFiles[0]));
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': [] },
    maxFiles: 1
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    if (!formData.title || !formData.prompt) {
      toast.error("Title and prompt are required");
      return;
    }

    setSaving(true);
    try {
      let imageUrl = originalImage;

      // 1. Upload new image if exists
      if (file) {
        const storageRef = ref(storage, `prompts/${Date.now()}_${file.name}`);
        await uploadBytes(storageRef, file);
        imageUrl = await getDownloadURL(storageRef);
      }

      // 2. Update Document
      const tagsArray = formData.tags.split(',').map(t => t.trim()).filter(Boolean);

      const docRef = doc(db, 'prompts', id);
      await updateDoc(docRef, {
        ...formData,
        cfg: Number(formData.cfg),
        steps: Number(formData.steps),
        tags: tagsArray,
        image: imageUrl,
        updatedAt: serverTimestamp(),
      });

      toast.success("Prompt updated successfully!");
      navigate('/admin');
    } catch (error) {
      console.error("Update error", error);
      toast.error("Failed to update prompt");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-zinc-950 flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-indigo-500" /></div>;
  }

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto">
        <button 
          onClick={() => navigate('/admin')}
          className="flex items-center gap-2 text-zinc-400 hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </button>
        <h1 className="text-3xl font-display font-bold mb-8">Edit Prompt</h1>

        <form onSubmit={handleSubmit} className="space-y-8">
          
          {/* Image Upload */}
          <div className="bg-zinc-900 p-6 rounded-2xl border border-white/10">
            <h2 className="text-xl font-semibold mb-4">Artwork</h2>
            <div className="flex flex-col md:flex-row gap-6">
               <div className="w-full md:w-1/2 aspect-square relative rounded-xl overflow-hidden bg-black flex justify-center items-center border border-white/10">
                  <span className="absolute top-2 left-2 bg-black/60 backdrop-blur px-2 py-1 rounded text-xs text-zinc-300 z-10">Current Image</span>
                  <img src={originalImage || ''} alt="Original" className="max-h-full max-w-full object-contain" />
               </div>
               
               <div className="w-full md:w-1/2">
                  {!preview ? (
                    <div 
                      {...getRootProps()} 
                      className={`h-full border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-colors ${
                        isDragActive ? 'border-indigo-500 bg-indigo-500/10' : 'border-zinc-700 hover:border-zinc-500'
                      }`}
                    >
                      <input {...getInputProps()} />
                      <Upload className="w-10 h-10 text-zinc-500 mx-auto mb-4" />
                      <p className="text-zinc-400">Upload new image to replace</p>
                      <p className="text-xs text-zinc-600 mt-2">Supports JPG, PNG, WEBP</p>
                    </div>
                  ) : (
                    <div className="h-full relative rounded-xl overflow-hidden bg-black aspect-square flex justify-center items-center border border-indigo-500">
                      <span className="absolute top-2 left-2 bg-indigo-500/80 backdrop-blur px-2 py-1 rounded text-xs text-white z-10">New Image Preview</span>
                      <img src={preview} alt="Preview" className="max-h-full max-w-full object-contain" />
                      <button 
                        type="button"
                        onClick={() => { setFile(null); setPreview(null); }}
                        className="absolute top-4 right-4 p-2 bg-black/50 hover:bg-black/80 rounded-full text-white backdrop-blur transition"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  )}
               </div>
            </div>
          </div>

          {/* Details */}
          <div className="bg-zinc-900 p-6 rounded-2xl border border-white/10 space-y-6">
            <h2 className="text-xl font-semibold">Prompt Details</h2>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-400">Title</label>
              <input 
                type="text" 
                required
                value={formData.title}
                onChange={e => setFormData({...formData, title: e.target.value})}
                className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-400">Prompt</label>
              <textarea 
                required
                rows={4}
                value={formData.prompt}
                onChange={e => setFormData({...formData, prompt: e.target.value})}
                className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-400">Negative Prompt (Optional)</label>
              <textarea 
                rows={2}
                value={formData.negativePrompt}
                onChange={e => setFormData({...formData, negativePrompt: e.target.value})}
                className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-400">Category</label>
                <select 
                  value={formData.category}
                  onChange={e => setFormData({...formData, category: e.target.value})}
                  className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white"
                >
                  {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-400">Tags (comma separated)</label>
                <input 
                  type="text" 
                  value={formData.tags}
                  onChange={e => setFormData({...formData, tags: e.target.value})}
                  className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white"
                />
              </div>
            </div>
          </div>

          {/* Settings */}
          <div className="bg-zinc-900 p-6 rounded-2xl border border-white/10 space-y-6">
            <h2 className="text-xl font-semibold">Settings</h2>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-400">Model</label>
                <input 
                  type="text" 
                  value={formData.model}
                  onChange={e => setFormData({...formData, model: e.target.value})}
                  className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-400">Aspect Ratio</label>
                <input 
                  type="text" 
                  value={formData.aspectRatio}
                  onChange={e => setFormData({...formData, aspectRatio: e.target.value})}
                  className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-400">Seed</label>
                <input 
                  type="text" 
                  value={formData.seed}
                  onChange={e => setFormData({...formData, seed: e.target.value})}
                  className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-400">CFG Scale</label>
                <input 
                  type="number" 
                  value={formData.cfg}
                  onChange={e => setFormData({...formData, cfg: e.target.value})}
                  className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-400">Steps</label>
                <input 
                  type="number" 
                  value={formData.steps}
                  onChange={e => setFormData({...formData, steps: e.target.value})}
                  className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-400">Sampler</label>
                <input 
                  type="text" 
                  value={formData.sampler}
                  onChange={e => setFormData({...formData, sampler: e.target.value})}
                  className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-white/5 grid grid-cols-2 gap-6">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className={`w-6 h-6 rounded-md border flex items-center justify-center transition-colors ${formData.featured ? 'bg-indigo-500 border-indigo-500' : 'bg-black/50 border-white/20 group-hover:border-white/40'}`}>
                    {formData.featured && <div className="w-2.5 h-2.5 bg-white rounded-sm" />}
                  </div>
                  <span className="text-sm font-medium">Featured Prompt</span>
                  <input type="checkbox" className="hidden" checked={formData.featured} onChange={e => setFormData({...formData, featured: e.target.checked})} />
                </label>

                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className={`w-6 h-6 rounded-md border flex items-center justify-center transition-colors ${formData.trending ? 'bg-indigo-500 border-indigo-500' : 'bg-black/50 border-white/20 group-hover:border-white/40'}`}>
                    {formData.trending && <div className="w-2.5 h-2.5 bg-white rounded-sm" />}
                  </div>
                  <span className="text-sm font-medium">Trending Prompt</span>
                  <input type="checkbox" className="hidden" checked={formData.trending} onChange={e => setFormData({...formData, trending: e.target.checked})} />
                </label>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={saving}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-4 rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            {saving ? (
              <><Loader2 className="w-5 h-5 animate-spin" /> Saving Changes...</>
            ) : (
              'Save Changes'
            )}
          </button>
        </form>
      </div>
    </AdminLayout>
  );
}
