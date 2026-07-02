import { useState } from 'react';
import { AdminLayout } from '../components/AdminLayout';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../lib/firebase';
import { CATEGORIES } from '../types';
import { toast } from 'sonner';
import { Upload, X, Loader2 } from 'lucide-react';
import { useDropzone } from 'react-dropzone';

export function AdminUpload() {
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

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
    creator: 'Admin',
  });

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
    if (!file) {
      toast.error("Please select an image");
      return;
    }
    if (!formData.title || !formData.prompt) {
      toast.error("Title and prompt are required");
      return;
    }

    setUploading(true);
    try {
      // 1. Upload Image
      const storageRef = ref(storage, `prompts/${Date.now()}_${file.name}`);
      await uploadBytes(storageRef, file);
      const imageUrl = await getDownloadURL(storageRef);

      // 2. Save Document
      const tagsArray = formData.tags.split(',').map(t => t.trim()).filter(Boolean);

      await addDoc(collection(db, 'prompts'), {
        ...formData,
        cfg: Number(formData.cfg),
        steps: Number(formData.steps),
        tags: tagsArray,
        image: imageUrl,
        downloads: 0,
        views: 0,
        likes: 0,
        featured: false,
        trending: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      toast.success("Prompt uploaded successfully!");
      setFile(null);
      setPreview(null);
      setFormData({ ...formData, title: '', prompt: '', negativePrompt: '', tags: '' });

    } catch (error) {
      console.error("Upload error", error);
      toast.error("Failed to upload prompt");
    } finally {
      setUploading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-display font-bold mb-8">Upload New Prompt</h1>

        <form onSubmit={handleSubmit} className="space-y-8">
          
          {/* Image Upload */}
          <div className="bg-zinc-900 p-6 rounded-2xl border border-white/10">
            <h2 className="text-xl font-semibold mb-4">Artwork</h2>
            {!preview ? (
              <div 
                {...getRootProps()} 
                className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-colors ${
                  isDragActive ? 'border-indigo-500 bg-indigo-500/10' : 'border-zinc-700 hover:border-zinc-500'
                }`}
              >
                <input {...getInputProps()} />
                <Upload className="w-10 h-10 text-zinc-500 mx-auto mb-4" />
                <p className="text-zinc-400">Drag & drop an image here, or click to select</p>
                <p className="text-xs text-zinc-600 mt-2">Supports JPG, PNG, WEBP (Max 5MB)</p>
              </div>
            ) : (
              <div className="relative rounded-xl overflow-hidden bg-black aspect-video flex justify-center items-center">
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
                placeholder="E.g., Neon Cyberpunk Cityscape"
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
                placeholder="The exact prompt used to generate the image..."
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
                  placeholder="cyberpunk, neon, futuristic"
                />
              </div>
            </div>
          </div>

          {/* Generation Params */}
          <div className="bg-zinc-900 p-6 rounded-2xl border border-white/10 space-y-6">
            <h2 className="text-xl font-semibold">Generation Parameters</h2>
            
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
          </div>

          <button 
            type="submit" 
            disabled={uploading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-4 rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            {uploading ? (
              <><Loader2 className="w-5 h-5 animate-spin" /> Uploading...</>
            ) : (
              'Publish Prompt'
            )}
          </button>
        </form>
      </div>
    </AdminLayout>
  );
}
