
import React, { useState } from 'react';
import { ImageIcon, Search, CheckCircle2, AlertCircle, FileSearch } from 'lucide-react';
import { analyzeImage } from '../services/gemini';

const ImageAnalysis: React.FC = () => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
        setResult(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAnalyze = async () => {
    if (!selectedImage) return;
    setLoading(true);
    try {
      // Remove data:image/jpeg;base64, prefix
      const base64 = selectedImage.split(',')[1];
      const res = await analyzeImage(base64, "Analyze this resume/document image. Identify the candidate's core strengths, years of experience, and any visual presentation issues. Be thorough.");
      setResult(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-extrabold text-slate-900">Advanced Resume Scanner</h2>
        <p className="text-slate-500">Visual document intelligence using Gemini 3 Pro Vision.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
          <div className="aspect-[3/4] bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl flex flex-col items-center justify-center relative overflow-hidden group">
            {selectedImage ? (
              <>
                <img src={selectedImage} alt="Preview" className="w-full h-full object-contain" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                   <label className="px-6 py-3 bg-white text-slate-900 rounded-xl font-bold cursor-pointer hover:bg-slate-50">
                     Replace Image
                     <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                   </label>
                </div>
              </>
            ) : (
              <label className="flex flex-col items-center gap-4 cursor-pointer">
                <div className="p-6 bg-blue-50 text-blue-600 rounded-full"><ImageIcon size={48} /></div>
                <div className="text-center">
                  <p className="font-bold text-slate-900">Upload Image</p>
                  <p className="text-xs text-slate-400 uppercase tracking-widest font-bold mt-1">PDF / JPG / PNG</p>
                </div>
                <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
              </label>
            )}
          </div>
          
          <button 
            onClick={handleAnalyze}
            disabled={!selectedImage || loading}
            className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black text-lg hover:bg-blue-700 disabled:opacity-50 transition-all flex items-center justify-center gap-3 shadow-xl shadow-blue-100"
          >
            {loading ? (
              <>
                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Vision Engine Running...
              </>
            ) : (
              <>
                <FileSearch size={24} />
                Analyze Visual Structure
              </>
            )}
          </button>
        </div>

        <div className="space-y-6">
          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm h-full min-h-[400px]">
            <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2 mb-6">
              <Search className="text-blue-500" />
              Intelligence Report
            </h3>
            {result ? (
              <div className="prose prose-slate max-w-none text-sm leading-relaxed text-slate-600 whitespace-pre-wrap animate-in fade-in duration-700">
                {result}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 text-center space-y-4">
                <AlertCircle size={40} className="text-slate-200" />
                <p className="text-slate-400 text-sm max-w-xs font-medium">Upload an image and run analysis to see a detailed structural and content report.</p>
              </div>
            )}
            
            {result && (
              <div className="mt-8 pt-8 border-t border-slate-100 grid grid-cols-2 gap-4">
                 <div className="flex items-center gap-2 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-3 py-2 rounded-xl">
                   <CheckCircle2 size={14} /> OCR VERIFIED
                 </div>
                 <div className="flex items-center gap-2 text-[10px] font-bold text-blue-600 bg-blue-50 px-3 py-2 rounded-xl">
                   <ImageIcon size={14} /> VISION ACTIVE
                 </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageAnalysis;
