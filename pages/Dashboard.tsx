
import React, { useState } from 'react';
import { Target, FileText, Search, Play, Brain, Shield, ArrowRight, AlertTriangle } from 'lucide-react';
import MetricCard from '../components/MetricCard';
import SkillCard from '../components/SkillCard';
import { extractSkills, analyzeGaps, generateRoadmap } from '../services/gemini';
import { SkillAnalysis } from '../types';

interface DashboardProps {
  onAnalysisUpdate: (data: { analysis: SkillAnalysis[], matchScore: number, roadmap: any, skills: string[] }) => void;
  analysis: any;
}

const Dashboard: React.FC<DashboardProps> = ({ onAnalysisUpdate, analysis }) => {
  const [jd, setJd] = useState("");
  const [resume, setResume] = useState("");
  const [hours, setHours] = useState(2);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAnalysis = async () => {
    if (!jd || !resume) return;
    setLoading(true);
    setError(null);
    try {
      // Step 1: Extract skills first
      const skills = await extractSkills(jd);
      
      // Step 2: Run Gap Analysis and Roadmap Generation in parallel
      const [gapResults, roadmap] = await Promise.all([
        analyzeGaps(resume, jd, skills),
        generateRoadmap(skills, hours)
      ]);
      
      onAnalysisUpdate({
        analysis: gapResults?.analysis || [],
        matchScore: gapResults?.match_score || 0,
        roadmap: roadmap || { roadmap: [] },
        skills
      });
    } catch (err: any) {
      console.error(err);
      if (err?.message?.includes("429") || err?.message?.includes("quota")) {
        setError("API Quota Exceeded: The intelligence engine is currently at capacity. Please try again in a few minutes or check your billing plan.");
      } else {
        setError("An unexpected error occurred during analysis. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h2 className="text-4xl font-black text-slate-900 tracking-tight">Intelligence Dashboard</h2>
          <p className="text-slate-500 font-medium">Quantify your career path and automate your professional growth.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-indigo-50 px-5 py-2.5 rounded-2xl border border-indigo-100 text-indigo-700 text-xs font-black uppercase tracking-widest shadow-sm">
            <Brain size={16} className="animate-pulse" />
            Gemini Flash Optimized
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 p-6 rounded-[2rem] flex items-start gap-4 animate-in slide-in-from-top-4 duration-500">
          <div className="p-3 bg-rose-100 text-rose-600 rounded-2xl">
            <AlertTriangle size={24} />
          </div>
          <div>
            <h4 className="font-black text-rose-900 uppercase tracking-tight text-sm">Protocol Interrupted</h4>
            <p className="text-rose-700 text-sm font-medium mt-1 leading-relaxed">{error}</p>
          </div>
        </div>
      )}

      {/* Input Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-xl shadow-slate-200/40 space-y-5">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-600 text-white rounded-2xl shadow-lg shadow-blue-200"><Target size={22}/></div>
              <h3 className="font-black text-xl text-slate-900">Target Role</h3>
            </div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-3 py-1 rounded-full border border-slate-100">Input A</span>
          </div>
          <textarea
            className="w-full h-56 p-6 bg-slate-50 border border-slate-200 rounded-[2rem] focus:ring-4 focus:ring-blue-100 focus:border-blue-500 focus:bg-white outline-none transition-all resize-none text-sm text-slate-900 font-medium placeholder-slate-400"
            placeholder="Paste the target job description here..."
            value={jd}
            onChange={(e) => setJd(e.target.value)}
          />
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-xl shadow-slate-200/40 space-y-5">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-indigo-600 text-white rounded-2xl shadow-lg shadow-indigo-200"><FileText size={22}/></div>
              <h3 className="font-black text-xl text-slate-900">Current Profile</h3>
            </div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-3 py-1 rounded-full border border-slate-100">Input B</span>
          </div>
          <textarea
            className="w-full h-56 p-6 bg-slate-50 border border-slate-200 rounded-[2rem] focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 focus:bg-white outline-none transition-all resize-none text-sm text-slate-900 font-medium placeholder-slate-400"
            placeholder="Paste your professional resume text here..."
            value={resume}
            onChange={(e) => setResume(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-slate-900 p-10 rounded-[3rem] shadow-2xl flex flex-col md:flex-row items-center justify-between gap-10 border border-slate-800">
        <div className="flex-1 w-full space-y-4">
          <div className="flex justify-between items-end">
            <label className="block text-xs font-black text-blue-400 uppercase tracking-[0.2em]">Learning Velocity</label>
            <span className="text-white font-black text-2xl">{hours}h<span className="text-slate-500 text-sm">/day</span></span>
          </div>
          <input 
            type="range" 
            min="1" 
            max="12" 
            value={hours} 
            onChange={(e) => setHours(parseInt(e.target.value))}
            className="w-full h-3 bg-slate-800 rounded-full appearance-none cursor-pointer accent-blue-500"
          />
          <div className="flex justify-between text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">
            <span>Chill</span>
            <span>Intense</span>
          </div>
        </div>
        <button 
          onClick={handleAnalysis}
          disabled={loading || !jd || !resume}
          className="w-full md:w-auto px-12 py-6 bg-blue-600 text-white rounded-3xl font-black text-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-4 shadow-2xl shadow-blue-500/20 active:scale-95 group"
        >
          {loading ? (
            <>
              <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
              Turbo Analysis...
            </>
          ) : (
            <>
              Generate Strategy
              <ArrowRight size={24} className="group-hover:translate-x-1 transition-transform" />
            </>
          )}
        </button>
      </div>

      {analysis && (
        <div className="space-y-12 animate-in slide-in-from-bottom-8 duration-700">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <MetricCard label="Market Match" value={`${analysis.matchScore}%`} icon={<Target />} trend={{ value: 12, isUp: true }} />
            <MetricCard label="Skills Extracted" value={analysis.analysis?.length || 0} icon={<Search />} />
            <MetricCard label="ATS Readiness" value="High" icon={<Shield />} />
          </div>

          <div className="space-y-6">
            <div className="flex items-center justify-between">
               <h3 className="text-2xl font-black text-slate-900 tracking-tight">Skill Gap Audit</h3>
               <div className="px-4 py-1.5 bg-slate-100 text-slate-500 rounded-full text-[10px] font-black uppercase tracking-widest">Foundational vs Advanced</div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {(analysis.analysis || []).map((item: SkillAnalysis, i: number) => (
                <SkillCard key={i} {...item} />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
