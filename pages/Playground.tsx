
import React, { useState, useEffect } from 'react';
import { Gamepad2, Code2, LayoutPanelLeft, Compass, Play, CheckCircle, AlertTriangle, Send } from 'lucide-react';
import { generateArchitecture, generateCodeChallenge, generateScenario, getScenarioFeedback } from '../services/gemini';

interface PlaygroundProps {
  skills: string[];
  projectName: string;
}

const Playground: React.FC<PlaygroundProps> = ({ skills, projectName }) => {
  const [activeTab, setActiveTab] = useState('arch');
  const [loading, setLoading] = useState(false);
  const [blueprint, setBlueprint] = useState<any>(null);
  
  // Code Zen state
  const [challenge, setChallenge] = useState<any>(null);
  const [userCode, setUserCode] = useState("");

  // Crisis Mode state
  const [scenario, setScenario] = useState<any>(null);
  const [scenarioInput, setScenarioInput] = useState("");
  const [scenarioFeedback, setScenarioFeedback] = useState("");

  // Mermaid rendering effect
  useEffect(() => {
    if (blueprint?.mermaid_code && (window as any).mermaid) {
      // Clear previous content
      const mermaidDiv = document.querySelector('.mermaid-render-target');
      if (mermaidDiv) {
        mermaidDiv.removeAttribute('data-processed');
        (window as any).mermaid.contentLoaded();
      }
    }
  }, [blueprint, activeTab]);

  const handleArchGen = async () => {
    setLoading(true);
    try {
      const res = await generateArchitecture(projectName, skills);
      setBlueprint(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleChallengeGen = async () => {
    setLoading(true);
    try {
      const res = await generateCodeChallenge(skills);
      setChallenge(res);
      setUserCode(res.boilerplate || "");
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleScenarioGen = async () => {
    setLoading(true);
    setScenarioFeedback("");
    try {
      const res = await generateScenario(skills);
      setScenario(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleScenarioSubmit = async () => {
    if (!scenarioInput.trim() || loading) return;
    setLoading(true);
    try {
      const res = await getScenarioFeedback(scenario, scenarioInput);
      setScenarioFeedback(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'arch', label: 'Architecture Dojo', icon: <LayoutPanelLeft size={18} /> },
    { id: 'code', label: 'Code Zen', icon: <Code2 size={18} /> },
    { id: 'scenario', label: 'Crisis Mode', icon: <Gamepad2 size={18} /> },
    { id: 'strategy', label: 'Strategic Fit', icon: <Compass size={18} /> },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-900">Career Playground</h2>
          <p className="text-slate-500">Practice your target skills in a safe, AI-guided environment.</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-1 p-1 bg-slate-200 rounded-2xl w-fit">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all ${
              activeTab === tab.id 
                ? 'bg-white text-blue-600 shadow-sm' 
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm min-h-[600px]">
        {activeTab === 'arch' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold">Architecture Design Studio</h3>
                <p className="text-sm text-slate-500">Build the system design for: {projectName}</p>
              </div>
              <button 
                onClick={handleArchGen}
                disabled={loading}
                className="px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 disabled:opacity-50 transition-all shadow-lg shadow-blue-100 flex items-center gap-2"
              >
                {loading ? "Designing..." : <><Play size={16} fill="currentColor" /> Generate Blueprint</>}
              </button>
            </div>

            {blueprint && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in slide-in-from-top-4 duration-500">
                <div className="space-y-6">
                  <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">System Overview</h4>
                    <p className="text-sm text-slate-700 leading-relaxed">{blueprint.overview || "No overview provided."}</p>
                  </div>
                  <div className="space-y-4">
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Tech Stack Decisions</h4>
                    <div className="grid grid-cols-1 gap-2">
                      {(blueprint.tech_stack_decisions || []).map((d: string, i: number) => (
                        <div key={i} className="flex items-start gap-3 p-3 bg-blue-50/50 border border-blue-100 rounded-xl text-xs font-semibold text-blue-800">
                          <span className="w-5 h-5 flex-shrink-0 flex items-center justify-center bg-blue-100 rounded-full text-[10px]">{i+1}</span>
                          {d}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                   <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Live Visual Schema</h4>
                   <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden min-h-[400px] flex items-center justify-center p-4">
                     <div className="mermaid-render-target mermaid text-center w-full">
                       {blueprint.mermaid_code || "graph TD\n  Start --> End"}
                     </div>
                   </div>
                   <div className="p-4 bg-slate-900 rounded-xl">
                      <pre className="text-[10px] text-emerald-400 overflow-x-auto">
                        {blueprint.mermaid_code || "No code available."}
                      </pre>
                   </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'code' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold">Code Zen Mode</h3>
                <p className="text-sm text-slate-500">Real-time skill validation through code.</p>
              </div>
              <button 
                onClick={handleChallengeGen}
                disabled={loading}
                className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 disabled:opacity-50 transition-all shadow-lg shadow-indigo-100"
              >
                {loading ? "Generating..." : "Get New Challenge"}
              </button>
            </div>

            {challenge ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in zoom-in duration-500">
                <div className="space-y-6">
                  <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                    <h4 className="font-bold text-slate-900 mb-2">{challenge.title}</h4>
                    <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">{challenge.description}</p>
                  </div>
                  <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100 flex items-start gap-3">
                    <CheckCircle className="text-emerald-500 flex-shrink-0" size={18} />
                    <p className="text-[11px] text-emerald-800">Submit your solution for AI-powered code review and optimization suggestions.</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-2xl relative">
                    <div className="absolute top-4 right-4 flex gap-2">
                       <div className="w-3 h-3 rounded-full bg-rose-500"></div>
                       <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                       <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                    </div>
                    <textarea 
                      className="w-full h-[350px] bg-transparent text-emerald-400 font-mono text-xs outline-none resize-none pt-4"
                      value={userCode}
                      onChange={(e) => setUserCode(e.target.value)}
                    />
                    <button className="w-full mt-4 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-all border border-white/5">
                       Submit for Code Review
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                 <Code2 size={48} className="text-slate-200 mb-4" />
                 <h4 className="text-slate-400 font-medium">Select a challenge to start your Zen session</h4>
              </div>
            )}
          </div>
        )}

        {activeTab === 'scenario' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold">Crisis Simulations</h3>
                <p className="text-sm text-slate-500">Handle production outages in a high-stakes scenario.</p>
              </div>
              <button 
                onClick={handleScenarioGen}
                disabled={loading}
                className="px-6 py-3 bg-rose-600 text-white rounded-xl font-bold hover:bg-rose-700 disabled:opacity-50 transition-all shadow-lg shadow-rose-100"
              >
                {loading ? "Initializing..." : "Deploy Crisis Scenario"}
              </button>
            </div>

            {scenario ? (
              <div className="max-w-3xl mx-auto space-y-8 animate-in slide-in-from-bottom-6 duration-500">
                <div className="bg-rose-50 p-8 rounded-3xl border border-rose-100 relative overflow-hidden">
                   <AlertTriangle className="absolute -top-4 -right-4 text-rose-100" size={120} />
                   <div className="relative">
                      <h4 className="text-rose-900 font-black text-xl mb-2">{scenario.title}</h4>
                      <p className="text-rose-700 text-sm mb-6 leading-relaxed">{scenario.description}</p>
                      <div className="p-4 bg-white rounded-2xl border border-rose-200">
                         <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest mb-1">Your Task</p>
                         <p className="text-sm font-bold text-slate-900">{scenario.task}</p>
                      </div>
                   </div>
                </div>

                <div className="space-y-4">
                   <h5 className="text-xs font-black text-slate-400 uppercase tracking-widest">Proposed Resolution Strategy</h5>
                   <textarea 
                      className="w-full h-32 p-4 bg-white border border-slate-200 rounded-2xl shadow-sm outline-none focus:ring-2 focus:ring-rose-500 text-sm transition-all"
                      placeholder="Explain your step-by-step plan to fix the outage..."
                      value={scenarioInput}
                      onChange={(e) => setScenarioInput(e.target.value)}
                   />
                   <button 
                      onClick={handleScenarioSubmit}
                      disabled={loading || !scenarioInput.trim()}
                      className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold flex items-center justify-center gap-2"
                   >
                      {loading ? "Analyzing..." : <><Send size={18} /> Submit Solution</>}
                   </button>
                </div>

                {scenarioFeedback && (
                  <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100 animate-in fade-in duration-700">
                    <h5 className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-2">Scenario Feedback</h5>
                    <p className="text-sm text-blue-900 leading-relaxed whitespace-pre-wrap">{scenarioFeedback}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                 <Gamepad2 size={48} className="text-slate-200 mb-4" />
                 <h4 className="text-slate-400 font-medium">Warning: Simulations involve unpredictable failure modes</h4>
              </div>
            )}
          </div>
        )}

        {activeTab === 'strategy' && (
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
             <Compass size={48} className="text-slate-200" />
             <h3 className="text-xl font-bold text-slate-900">Career Strategy Mapping</h3>
             <p className="text-slate-500 max-w-md">Analyze long-term trajectory based on your target skills and industry trends. (Coming Soon)</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Playground;
