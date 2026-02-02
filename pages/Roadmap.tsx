
import React from 'react';
import { Roadmap as RoadmapType } from '../types';
import { Calendar, Layers, Clock, Star, ArrowUpRight } from 'lucide-react';

interface RoadmapProps {
  roadmap: RoadmapType | null;
  skills: string[];
}

const Roadmap: React.FC<RoadmapProps> = ({ roadmap }) => {
  if (!roadmap || !roadmap.roadmap || roadmap.roadmap.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-32 bg-white rounded-[3rem] border-2 border-dashed border-slate-200">
        <div className="p-6 bg-slate-50 text-slate-300 rounded-full mb-6">
          <Layers size={64} />
        </div>
        <h3 className="text-2xl font-black text-slate-900">No Active Protocol</h3>
        <p className="text-slate-500 font-medium max-w-sm text-center mt-2">Submit your resume and target role in the Dashboard to generate a tactical learning roadmap.</p>
      </div>
    );
  }

  const totalHours = roadmap.roadmap.reduce((acc, curr) => acc + (curr.estimated_hours || 0), 0);

  return (
    <div className="space-y-12 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-200 pb-8">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-[10px] font-black text-blue-600 uppercase tracking-widest bg-blue-50 px-3 py-1 rounded-full w-fit">
            Tactical Roadmap
          </div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tight">Learning Journey</h2>
          <p className="text-slate-500 font-medium flex items-center gap-2">
            Target Milestone: <span className="text-slate-900 font-bold">{roadmap.project_name || "Growth Project"}</span>
          </p>
        </div>
        <div className="flex gap-4">
           <div className="px-6 py-4 bg-white rounded-3xl border border-slate-200 shadow-sm flex items-center gap-4">
              <div className="p-2 bg-emerald-100 text-emerald-600 rounded-xl"><Clock size={20} /></div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Duration</p>
                <p className="text-lg font-black text-slate-900">
                  {totalHours} Hours
                </p>
              </div>
           </div>
        </div>
      </div>

      <div className="relative max-w-4xl mx-auto space-y-12">
        {/* Timeline Line */}
        <div className="absolute left-0 md:left-1/2 top-4 bottom-4 w-px bg-slate-200 md:-translate-x-1/2 hidden md:block"></div>

        {roadmap.roadmap.map((phase, idx) => {
          const isEven = idx % 2 === 0;
          return (
            <div key={idx} className={`relative flex items-center gap-10 ${isEven ? 'md:flex-row' : 'md:flex-row-reverse'}`}>
              {/* Dot */}
              <div className="absolute left-0 md:left-1/2 w-4 h-4 rounded-full bg-blue-600 border-4 border-white shadow-lg md:-translate-x-1/2 z-10 hidden md:block"></div>

              <div className="flex-1 w-full">
                <div className={`bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-xl shadow-slate-200/20 group hover:border-blue-400 transition-all duration-300 ${isEven ? 'md:text-right' : 'md:text-left'}`}>
                  <div className={`flex flex-col ${isEven ? 'md:items-end' : 'md:items-start'} gap-4`}>
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-black bg-slate-900 text-white px-3 py-1 rounded-full uppercase tracking-widest">Phase {idx + 1}</span>
                      <div className="p-2 bg-yellow-50 text-yellow-600 rounded-xl group-hover:bg-yellow-100 transition-colors"><Star size={16} fill="currentColor" /></div>
                    </div>
                    
                    <h4 className="text-2xl font-black text-slate-900">{phase.phase_name}</h4>
                    <p className="text-sm text-slate-500 font-medium leading-relaxed max-w-lg">
                      {phase.description}
                    </p>

                    <div className={`flex flex-wrap gap-2 ${isEven ? 'md:justify-end' : 'md:justify-start'}`}>
                      {(phase.topics || []).map((t, ti) => (
                        <span key={ti} className="text-[9px] font-black uppercase bg-blue-50 text-blue-700 px-3 py-1 rounded-lg border border-blue-100/50">
                          {t}
                        </span>
                      ))}
                    </div>

                    <div className="mt-4 p-5 bg-slate-50 rounded-2xl border border-slate-100 w-full text-left">
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                         <ArrowUpRight size={12} className="text-blue-500" /> Key Deliverable
                       </p>
                       <p className="text-sm font-bold text-slate-800">{phase.weekly_project}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Empty space for timeline on other side */}
              <div className="flex-1 hidden md:block"></div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Roadmap;
