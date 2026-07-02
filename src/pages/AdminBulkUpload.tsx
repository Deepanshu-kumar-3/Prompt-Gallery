import { useState, useRef } from 'react';
import { AdminLayout } from '../components/AdminLayout';
import { collection, addDoc, serverTimestamp, writeBatch, doc, getDocs, query, where } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../lib/firebase';
import { CATEGORIES } from '../types';
import { toast } from 'sonner';
import { Upload, X, Loader2, Image as ImageIcon, CheckCircle2, AlertCircle, FileText, FileSpreadsheet, FileJson, RefreshCw } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import Papa from 'papaparse';
import * as xlsx from 'xlsx';

type UploadTab = 'images' | 'data';

export function AdminBulkUpload() {
  const [activeTab, setActiveTab] = useState<UploadTab>('images');
  
  // Image Upload State
  const [uploading, setUploading] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<{ name: string, status: 'success' | 'error', error?: string }[]>([]);

  // Data Upload State
  const [dataFile, setDataFile] = useState<File | null>(null);
  const [dataRows, setDataRows] = useState<any[]>([]);
  const [dataUploading, setDataUploading] = useState(false);
  const [dataProgress, setDataProgress] = useState(0);
  const [dataResults, setDataResults] = useState<{ row: number, title: string, status: 'success' | 'error' | 'duplicate', error?: string }[]>([]);

  const onDropImages = (acceptedFiles: File[]) => {
    setFiles(prev => [...prev, ...acceptedFiles]);
  };

  const { getRootProps: getImageRootProps, getInputProps: getImageInputProps, isDragActive: isImageDragActive } = useDropzone({
    onDrop: onDropImages,
    accept: { 'image/*': [] }
  });

  const onDropData = async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;
    
    setDataFile(file);
    setDataResults([]);
    
    try {
      if (file.name.endsWith('.csv')) {
        Papa.parse(file, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => {
            setDataRows(results.data);
          },
          error: (error: any) => {
            toast.error("Failed to parse CSV: " + error.message);
          }
        });
      } else if (file.name.endsWith('.json')) {
        const text = await file.text();
        const json = JSON.parse(text);
        setDataRows(Array.isArray(json) ? json : [json]);
      } else if (file.name.match(/\.(xls|xlsx)$/)) {
        const buffer = await file.arrayBuffer();
        const workbook = xlsx.read(buffer, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const data = xlsx.utils.sheet_to_json(sheet);
        setDataRows(data);
      } else {
        toast.error("Unsupported file format");
        setDataFile(null);
      }
    } catch (error: any) {
      toast.error("Failed to read file: " + error.message);
      setDataFile(null);
    }
  };

  const { getRootProps: getDataRootProps, getInputProps: getDataInputProps, isDragActive: isDataDragActive } = useDropzone({
    onDrop: onDropData,
    accept: {
      'text/csv': ['.csv'],
      'application/json': ['.json'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls']
    },
    maxFiles: 1
  });

  const removeImageFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleImageBulkUpload = async () => {
    if (files.length === 0) return;
    
    setUploading(true);
    setProgress(0);
    setResults([]);

    let successCount = 0;
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        const storageRef = ref(storage, `prompts/bulk_${Date.now()}_${file.name}`);
        await uploadBytes(storageRef, file);
        const imageUrl = await getDownloadURL(storageRef);

        const cleanName = file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, ' ');

        await addDoc(collection(db, 'prompts'), {
          title: cleanName,
          prompt: `A beautiful artwork of ${cleanName}`,
          negativePrompt: '',
          category: CATEGORIES[0], // Default
          tags: ['bulk-upload'],
          model: 'Unknown Model',
          aspectRatio: '1:1',
          seed: '',
          cfg: 7,
          steps: 30,
          sampler: 'Euler a',
          creator: 'Admin',
          image: imageUrl,
          downloads: 0,
          views: 0,
          likes: 0,
          featured: false,
          trending: false,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });

        successCount++;
        setResults(prev => [...prev, { name: file.name, status: 'success' }]);
      } catch (error: any) {
        setResults(prev => [...prev, { name: file.name, status: 'error', error: error.message }]);
      }
      setProgress(Math.round(((i + 1) / files.length) * 100));
    }

    setUploading(false);
    toast.success(`Bulk upload complete! ${successCount} successful.`);
    if (successCount === files.length) {
      setFiles([]);
    } else {
      const failedNames = results.filter(r => r.status === 'error').map(r => r.name);
      setFiles(prev => prev.filter(f => failedNames.includes(f.name)));
    }
  };

  const processDataRows = async (rowsToProcess: {row: any, index: number}[]) => {
    setDataUploading(true);
    setDataProgress(0);
    
    let successCount = 0;
    const newResults = [...dataResults];

    for (let i = 0; i < rowsToProcess.length; i++) {
      const item = rowsToProcess[i].row;
      const originalIndex = rowsToProcess[i].index;
      
      const title = item.Title || item.title || 'Untitled';
      const promptText = item.Prompt || item.prompt;
      
      try {
        if (!promptText) {
          throw new Error("Missing prompt text");
        }
        if (!item['Image URL'] && !item.imageUrl && !item.image) {
          throw new Error("Missing Image URL");
        }

        // Validate duplicates
        const qTitle = query(collection(db, 'prompts'), where('title', '==', title));
        const titleSnap = await getDocs(qTitle);
        
        if (!titleSnap.empty) {
           newResults[originalIndex] = { row: originalIndex + 1, title, status: 'duplicate', error: 'Title already exists' };
           continue;
        }

        const tagsRaw = item.Tags || item.tags || '';
        const tagsArray = typeof tagsRaw === 'string' ? tagsRaw.split(',').map(t => t.trim()).filter(Boolean) : (Array.isArray(tagsRaw) ? tagsRaw : []);
        
        await addDoc(collection(db, 'prompts'), {
          title: title,
          prompt: promptText,
          negativePrompt: item['Negative Prompt'] || item.negativePrompt || '',
          category: item.Category || item.category || CATEGORIES[0],
          tags: tagsArray,
          model: item.Model || item.model || 'Unknown Model',
          aspectRatio: item.aspectRatio || '1:1',
          seed: item.Seed || item.seed || '',
          cfg: Number(item.CFG || item.cfg) || 7,
          steps: Number(item.Steps || item.steps) || 30,
          sampler: item.Sampler || item.sampler || 'Euler a',
          creator: item.Creator || item.creator || 'Admin',
          image: item['Image URL'] || item.imageUrl || item.image,
          downloads: 0,
          views: 0,
          likes: 0,
          featured: false,
          trending: false,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });

        successCount++;
        newResults[originalIndex] = { row: originalIndex + 1, title, status: 'success' };
      } catch (error: any) {
        newResults[originalIndex] = { row: originalIndex + 1, title, status: 'error', error: error.message };
      }
      
      setDataResults([...newResults]);
      setDataProgress(Math.round(((i + 1) / rowsToProcess.length) * 100));
    }

    setDataUploading(false);
    toast.success(`Processed ${rowsToProcess.length} rows. ${successCount} successful.`);
  };

  const handleDataBulkUpload = async () => {
    if (dataRows.length === 0) return;
    setDataResults(new Array(dataRows.length).fill(null));
    await processDataRows(dataRows.map((row, index) => ({row, index})));
  };

  const handleRetryFailed = async () => {
    const failedIndices = dataResults
      .map((r, index) => r && (r.status === 'error' || r.status === 'duplicate') ? index : -1)
      .filter(i => i !== -1);
      
    if (failedIndices.length === 0) return;
    
    const rowsToProcess = failedIndices.map(index => ({ row: dataRows[index], index }));
    await processDataRows(rowsToProcess);
  };

  return (
    <AdminLayout>
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-display font-bold">Bulk Upload</h1>
        </div>

        <div className="flex gap-4 border-b border-white/10 mb-8">
          <button 
            onClick={() => setActiveTab('images')}
            className={`pb-4 px-4 font-medium transition-colors border-b-2 ${activeTab === 'images' ? 'border-indigo-500 text-white' : 'border-transparent text-zinc-400 hover:text-white'}`}
          >
            Image Upload
          </button>
          <button 
            onClick={() => setActiveTab('data')}
            className={`pb-4 px-4 font-medium transition-colors border-b-2 ${activeTab === 'data' ? 'border-indigo-500 text-white' : 'border-transparent text-zinc-400 hover:text-white'}`}
          >
            Data Upload (CSV/Excel/JSON)
          </button>
        </div>

        {activeTab === 'images' ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <div 
                {...getImageRootProps()} 
                className={`bg-zinc-900 border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-colors ${
                  isImageDragActive ? 'border-indigo-500 bg-indigo-500/10' : 'border-zinc-700 hover:border-zinc-500'
                }`}
              >
                <input {...getImageInputProps()} />
                <Upload className="w-10 h-10 text-zinc-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-white mb-2">Drag & Drop Multiple Images</h3>
                <p className="text-zinc-400">Supports JPG, PNG, WEBP. Upload 100+ images at once.</p>
                <p className="text-xs text-zinc-500 mt-4">Filename will be used as the prompt title temporarily.</p>
              </div>

              {files.length > 0 && (
                <div className="bg-zinc-900 border border-white/10 rounded-2xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-lg">Queued Files ({files.length})</h3>
                    <button 
                      onClick={() => setFiles([])}
                      disabled={uploading}
                      className="text-sm text-red-400 hover:text-red-300 disabled:opacity-50"
                    >
                      Clear All
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 max-h-[500px] overflow-y-auto custom-scrollbar pr-2">
                    {files.map((file, i) => (
                      <div key={`${file.name}-${i}`} className="group relative aspect-square bg-zinc-800 rounded-xl overflow-hidden border border-white/5">
                        <img src={URL.createObjectURL(file)} alt="" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <button 
                            onClick={() => removeImageFile(i)}
                            disabled={uploading}
                            className="p-2 bg-red-500/80 text-white rounded-lg hover:bg-red-500 disabled:opacity-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent">
                          <p className="text-[10px] truncate">{file.name}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-6">
              <div className="bg-zinc-900 border border-white/10 rounded-2xl p-6 sticky top-24">
                <h3 className="font-semibold text-lg mb-4">Upload Status</h3>
                
                <div className="space-y-4 mb-6">
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-400">Total Files</span>
                    <span className="font-medium">{files.length}</span>
                  </div>
                  {uploading && (
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-zinc-400">Progress</span>
                        <span className="font-medium text-indigo-400">{progress}%</span>
                      </div>
                      <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-500 transition-all duration-300" style={{ width: `${progress}%` }} />
                      </div>
                    </div>
                  )}
                </div>

                <button 
                  onClick={handleImageBulkUpload}
                  disabled={uploading || files.length === 0}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {uploading ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Uploading...</>
                  ) : (
                    <><Upload className="w-4 h-4" /> Start Bulk Upload</>
                  )}
                </button>

                {results.length > 0 && (
                  <div className="mt-6 space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar">
                    {results.map((res, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm p-2 rounded-lg bg-black/20 border border-white/5">
                        {res.status === 'success' ? (
                          <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                        )}
                        <span className="truncate flex-1" title={res.name}>{res.name}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              {!dataFile ? (
                <div 
                  {...getDataRootProps()} 
                  className={`bg-zinc-900 border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-colors ${
                    isDataDragActive ? 'border-indigo-500 bg-indigo-500/10' : 'border-zinc-700 hover:border-zinc-500'
                  }`}
                >
                  <input {...getDataInputProps()} />
                  <FileSpreadsheet className="w-10 h-10 text-zinc-500 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-white mb-2">Upload Data File</h3>
                  <p className="text-zinc-400">Supports CSV, XLSX, XLS, and JSON.</p>
                  <div className="mt-6 text-left inline-block">
                    <p className="text-xs text-zinc-400 font-semibold mb-2">Expected Columns/Keys:</p>
                    <ul className="text-xs text-zinc-500 list-disc list-inside">
                      <li>Title, Prompt (Required), Image URL (Required)</li>
                      <li>Negative Prompt, Category, Tags</li>
                      <li>Seed, CFG, Steps, Sampler, Creator, Model</li>
                    </ul>
                  </div>
                </div>
              ) : (
                <div className="bg-zinc-900 border border-white/10 rounded-2xl p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-xl">
                        {dataFile.name.endsWith('.json') ? <FileJson className="w-6 h-6" /> : 
                         dataFile.name.endsWith('.csv') ? <FileText className="w-6 h-6" /> : 
                         <FileSpreadsheet className="w-6 h-6" />}
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">{dataFile.name}</h3>
                        <p className="text-sm text-zinc-400">{dataRows.length} valid rows found</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => { setDataFile(null); setDataRows([]); setDataResults([]); }}
                      disabled={dataUploading}
                      className="text-sm text-zinc-400 hover:text-white disabled:opacity-50"
                    >
                      Remove File
                    </button>
                  </div>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="text-xs text-zinc-400 uppercase bg-black/50 border-y border-white/10">
                        <tr>
                          <th className="px-4 py-3">Row</th>
                          <th className="px-4 py-3">Title</th>
                          <th className="px-4 py-3">Image</th>
                          <th className="px-4 py-3">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {dataRows.slice(0, 50).map((row, index) => {
                          const result = dataResults[index];
                          return (
                            <tr key={index} className="border-b border-white/5">
                              <td className="px-4 py-3 text-zinc-500">{index + 1}</td>
                              <td className="px-4 py-3 truncate max-w-[200px]" title={row.Title || row.title}>{row.Title || row.title || 'Untitled'}</td>
                              <td className="px-4 py-3">
                                {row['Image URL'] || row.imageUrl || row.image ? (
                                  <a href={row['Image URL'] || row.imageUrl || row.image} target="_blank" rel="noreferrer" className="text-indigo-400 hover:underline flex items-center gap-1">
                                    <ImageIcon className="w-3 h-3" /> View
                                  </a>
                                ) : (
                                  <span className="text-zinc-600">No Image</span>
                                )}
                              </td>
                              <td className="px-4 py-3">
                                {!result ? (
                                  <span className="text-zinc-500">Pending</span>
                                ) : result.status === 'success' ? (
                                  <span className="text-green-400 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Success</span>
                                ) : result.status === 'duplicate' ? (
                                  <span className="text-yellow-400 flex items-center gap-1" title={result.error}><AlertCircle className="w-3 h-3" /> Duplicate</span>
                                ) : (
                                  <span className="text-red-400 flex items-center gap-1" title={result.error}><AlertCircle className="w-3 h-3" /> Error</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                        {dataRows.length > 50 && (
                          <tr>
                            <td colSpan={4} className="px-4 py-3 text-center text-zinc-500">
                              ... and {dataRows.length - 50} more rows
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-6">
              <div className="bg-zinc-900 border border-white/10 rounded-2xl p-6 sticky top-24">
                <h3 className="font-semibold text-lg mb-4">Upload Status</h3>
                
                <div className="space-y-4 mb-6">
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-400">Total Rows</span>
                    <span className="font-medium">{dataRows.length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-400">Success</span>
                    <span className="font-medium text-green-400">{dataResults.filter(r => r?.status === 'success').length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-400">Failed / Duplicate</span>
                    <span className="font-medium text-red-400">{dataResults.filter(r => r?.status === 'error' || r?.status === 'duplicate').length}</span>
                  </div>

                  {dataUploading && (
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-zinc-400">Progress</span>
                        <span className="font-medium text-indigo-400">{dataProgress}%</span>
                      </div>
                      <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-500 transition-all duration-300" style={{ width: `${dataProgress}%` }} />
                      </div>
                    </div>
                  )}
                </div>

                {!dataUploading && dataResults.some(r => r?.status === 'error' || r?.status === 'duplicate') ? (
                  <button 
                    onClick={handleRetryFailed}
                    className="w-full bg-zinc-800 hover:bg-zinc-700 text-white font-medium py-3 rounded-xl transition-colors flex items-center justify-center gap-2 mb-3"
                  >
                    <RefreshCw className="w-4 h-4" /> Retry Failed
                  </button>
                ) : null}

                <button 
                  onClick={handleDataBulkUpload}
                  disabled={dataUploading || dataRows.length === 0 || (dataResults.length > 0 && !dataResults.includes(null) && dataResults.every(r => r?.status === 'success'))}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {dataUploading ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Processing...</>
                  ) : (
                    <><Upload className="w-4 h-4" /> Start Bulk Upload</>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </AdminLayout>
  );
}

import { Trash2 } from 'lucide-react';

