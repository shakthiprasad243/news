
import React, { useEffect, useState, useRef } from 'react';
import { Network, Info, Download, Share2, AlertCircle, RefreshCw, ZoomIn, ZoomOut, Target, Focus } from 'lucide-react';
import { generateMindMapMarkdown } from '../services/gemini';

interface SkillMapProps {
  skills: string[];
}

const SkillMap: React.FC<SkillMapProps> = ({ skills }) => {
  const [markdown, setMarkdown] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [focusActive, setFocusActive] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);
  const markmapInstanceRef = useRef<any>(null);

  const fetchMindMap = async () => {
    if (skills.length === 0) return;
    setLoading(true);
    setError(null);
    try {
      const res = await generateMindMapMarkdown(skills);
      setMarkdown(res);
    } catch (e: any) {
      console.error(e);
      if (e?.message?.includes("429") || e?.message?.includes("quota")) {
        setError("API Quota Exceeded: The mapping engine is currently unavailable. Please try again later.");
      } else {
        setError("Failed to generate mind map. Please retry.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMindMap();
  }, [skills]);

  const clearHighlights = () => {
    if (!svgRef.current || !(window as any).d3) return;
    const d3 = (window as any).d3;
    const svg = d3.select(svgRef.current);
    svg.classed('map-focus-active', false);
    svg.selectAll('.markmap-node').classed('node-focused node-neighbor', false);
    svg.selectAll('.markmap-link').classed('link-highlighted', false);
    setFocusActive(false);
  };

  useEffect(() => {
    if (markdown && svgRef.current) {
      const markmap = (window as any).markmap;
      const d3 = (window as any).d3;
      
      if (!markmap || !d3) {
        console.error("Markmap or D3 libraries not available on window.");
        return;
      }

      try {
        // Attempt to find the Transformer and Markmap constructors across potential global paths
        const Transformer = markmap.Transformer;
        const Markmap = markmap.Markmap;

        if (!Transformer) {
          throw new Error("Markmap Transformer not found. Ensure script tags are loaded correctly.");
        }

        const transformer = new Transformer();
        const { root } = transformer.transform(markdown);
        
        const options = {
          autoFit: true,
          duration: 500,
          color: (node: any) => {
             const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
             return colors[node.depth % colors.length];
          },
          paddingX: 16,
          maxWidth: 300,
        };

        if (markmapInstanceRef.current) {
          markmapInstanceRef.current.setData(root);
          markmapInstanceRef.current.fit();
        } else {
          markmapInstanceRef.current = Markmap.create(svgRef.current, options, root);
        }

        const svg = d3.select(svgRef.current);
        const timer = setTimeout(() => {
          svg.selectAll('.markmap-node').on('click', function(event: any, d: any) {
            event.stopPropagation();
            
            svg.classed('map-focus-active', true);
            setFocusActive(true);
            
            svg.selectAll('.markmap-node').classed('node-focused node-neighbor', false);
            svg.selectAll('.markmap-link').classed('link-highlighted', false);

            d3.select(this).classed('node-focused', true);

            const neighbors = new Set<any>();
            if (d.parent) neighbors.add(d.parent.data);
            if (d.children) d.children.forEach((child: any) => neighbors.add(child.data));

            svg.selectAll('.markmap-node').filter((nodeData: any) => neighbors.has(nodeData)).classed('node-neighbor', true);

            svg.selectAll('.markmap-link').filter((linkData: any) => {
              return (linkData.source.data === d.data) || (linkData.target.data === d.data);
            }).classed('link-highlighted', true);
          });

          svg.on('click', () => clearHighlights());
        }, 300);

        return () => clearTimeout(timer);
      } catch (err) {
        console.error("Error during Markmap rendering:", err);
      }
    }
  }, [markdown]);

  const handleZoomIn = () => markmapInstanceRef.current?.rescale(1.2);
  const handleZoomOut = () => markmapInstanceRef.current?.rescale(0.8);
  const handleFit = () => markmapInstanceRef.current?.fit();

  if (skills.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-32 bg-white rounded-[3rem] border-2 border-dashed border-slate-200">
        <div className="p-6 bg-slate-50 text-slate-300 rounded-full mb-6">
          <Network size={64} />
        </div>
        <h3 className="text-2xl font-black text-slate-900">Career Intel Required</h3>
        <p className="text-slate-500 font-medium max-w-sm text-center mt-2">Initialize a career audit on the Dashboard to see your technical ecosystem visualised as an interactive mind map.</p>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-10rem)] flex flex-col space-y-6 animate-in zoom-in-95 duration-700">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-4xl font-black text-slate-900 tracking-tight">Technical Cognition</h2>
          <p className="text-slate-500 font-medium">Interactive skill graph with contextual focus mapping.</p>
        </div>
        <div className="flex items-center gap-3">
          {focusActive && (
            <button 
              onClick={clearHighlights}
              className="flex items-center gap-2 px-4 py-2 bg-rose-50 text-rose-600 rounded-xl font-bold text-xs border border-rose-100 hover:bg-rose-100 transition-all animate-in fade-in slide-in-from-right-2"
            >
              <Focus size={14} />
              Reset Focus
            </button>
          )}
          <div className="flex items-center bg-white border border-slate-200 rounded-2xl p-1 shadow-sm">
            <button onClick={handleZoomIn} className="p-2 hover:bg-slate-50 text-slate-600 rounded-xl transition-colors"><ZoomIn size={18} /></button>
            <button onClick={handleZoomOut} className="p-2 hover:bg-slate-50 text-slate-600 rounded-xl transition-colors"><ZoomOut size={18} /></button>
            <div className="w-px h-4 bg-slate-200 mx-1"></div>
            <button onClick={handleFit} className="p-2 hover:bg-slate-50 text-slate-600 rounded-xl transition-colors" title="Fit to Screen"><Target size={18} /></button>
          </div>
          <button 
            onClick={fetchMindMap}
            disabled={loading}
            className="p-3 bg-white text-slate-600 rounded-2xl border border-slate-200 hover:bg-slate-50 transition-colors shadow-sm disabled:opacity-50" 
            title="Regenerate Mind Map"
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
          <button className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-2xl font-black text-sm hover:bg-slate-800 transition-all shadow-lg shadow-slate-200">
            <Download size={18} />
            Export SVG
          </button>
        </div>
      </div>

      <div className="flex-1 bg-white rounded-[3rem] border border-slate-200 shadow-2xl shadow-slate-200/40 relative overflow-hidden flex flex-col group/map">
        <div className="absolute bottom-8 left-8 z-10 flex flex-col gap-3 pointer-events-none">
           <div className="flex items-center gap-3 bg-white/90 backdrop-blur-md p-3 rounded-2xl border border-slate-100 shadow-lg pointer-events-auto">
              <div className="p-1.5 bg-blue-100 text-blue-600 rounded-lg"><Focus size={14} /></div>
              <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Context-Aware Focus</span>
           </div>
           <div className="flex items-center gap-3 bg-white/90 backdrop-blur-md p-3 rounded-2xl border border-slate-100 shadow-lg pointer-events-auto">
              <div className="p-1.5 bg-emerald-100 text-emerald-600 rounded-lg"><Share2 size={14} /></div>
              <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Multi-Branch Traversal</span>
           </div>
        </div>

        <div className="absolute top-8 right-8 z-10 pointer-events-none">
           <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl border border-indigo-100 flex items-center gap-2 text-xs font-bold shadow-sm pointer-events-auto">
              <Info size={16} />
              Click any node to focus its neighbors
           </div>
        </div>

        <div className="flex-1 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:32px_32px] overflow-hidden">
          {loading ? (
            <div className="h-full flex flex-col items-center justify-center gap-4">
              <div className="w-12 h-12 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
              <p className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] animate-pulse">Mapping Cognitive Domain...</p>
            </div>
          ) : error ? (
            <div className="h-full flex flex-col items-center justify-center gap-4 text-center max-w-sm mx-auto">
              <AlertCircle size={48} className="text-rose-500" />
              <p className="text-sm font-bold text-slate-900">{error}</p>
              <button 
                onClick={fetchMindMap}
                className="px-6 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition-colors shadow-lg"
              >
                Retry Generation
              </button>
            </div>
          ) : (
            <svg 
              ref={svgRef} 
              className="markmap-container w-full h-full transition-all duration-700 cursor-grab active:cursor-grabbing"
            ></svg>
          )}
        </div>

        <div className="p-6 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
           <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
              <AlertCircle size={14} className="text-blue-500" />
              Focus Mode: Clicking a node isolates its parent and immediate descendants.
           </div>
           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Engine: skillX Vision • Markmap Core</p>
        </div>
      </div>
    </div>
  );
};

export default SkillMap;
