
import React, { useState, useRef, useEffect } from 'react';
import { Send, BrainCircuit, ShieldAlert, Sparkles, MessageCircle } from 'lucide-react';
import { thinkingChat } from '../services/gemini';

const ThinkingChat: React.FC = () => {
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const userMsg = { role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const response = await thinkingChat(input);
      setMessages(prev => [...prev, { role: 'assistant', content: response }]);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto h-[calc(100vh-12rem)] flex flex-col space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-900 flex items-center gap-3">
            Deep Reasoning Engine
          </h2>
          <p className="text-slate-500">Advanced analysis using Gemini 3 Pro with Thinking Mode enabled.</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-purple-50 text-purple-600 rounded-full border border-purple-100 text-xs font-bold uppercase tracking-widest">
           <Sparkles size={14} /> Thinking Budget: 32K
        </div>
      </div>

      <div className="flex-1 bg-white rounded-[2rem] border border-slate-200 shadow-sm flex flex-col overflow-hidden">
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-8 space-y-8">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-6 max-w-md mx-auto">
               <div className="w-20 h-20 bg-purple-50 text-purple-600 rounded-3xl flex items-center justify-center"><BrainCircuit size={40} /></div>
               <div>
                 <h3 className="text-lg font-bold text-slate-900">Complex Query Mode</h3>
                 <p className="text-sm text-slate-500 leading-relaxed">Ask complex questions about your career trajectory, industry shifts, or advanced technical architecture. This model takes longer to "think" for better results.</p>
               </div>
               <div className="grid grid-cols-1 gap-2 w-full">
                 {["Evaluate the impact of AI on cloud architecture", "Should I specialize in Rust or Go in 2024?", "Review my career strategy for a CTO role"].map(q => (
                   <button 
                     key={q}
                     onClick={() => setInput(q)}
                     className="p-3 text-xs font-semibold text-slate-600 bg-slate-50 border border-slate-100 rounded-xl hover:bg-slate-100 transition-colors"
                   >
                     "{q}"
                   </button>
                 ))}
               </div>
            </div>
          )}
          {messages.map((m, i) => (
            <div key={i} className={`flex items-start gap-4 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`p-3 rounded-2xl ${m.role === 'assistant' ? 'bg-purple-100 text-purple-600 shadow-sm' : 'bg-slate-100 text-slate-500'}`}>
                {m.role === 'assistant' ? <BrainCircuit size={20} /> : <MessageCircle size={20} />}
              </div>
              <div className={`max-w-[85%] p-6 rounded-[2rem] text-sm leading-relaxed shadow-sm ${
                m.role === 'assistant' 
                  ? 'bg-slate-50 text-slate-800 rounded-tl-none border border-slate-100' 
                  : 'bg-slate-900 text-white rounded-tr-none'
              }`}>
                {m.content}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex items-start gap-4 animate-pulse">
               <div className="p-3 rounded-2xl bg-purple-50 text-purple-300"><BrainCircuit size={20} /></div>
               <div className="space-y-3 flex-1">
                 <div className="flex items-center gap-2 text-[10px] font-black text-purple-400 uppercase tracking-widest animate-pulse">
                   <Sparkles size={12} /> Gemini is thinking deeply...
                 </div>
                 <div className="bg-slate-50 h-32 w-full rounded-2xl rounded-tl-none border border-slate-100"></div>
               </div>
            </div>
          )}
        </div>

        <div className="p-6 bg-slate-50 border-t border-slate-100">
           <div className="relative max-w-4xl mx-auto">
             <input 
               type="text"
               value={input}
               onChange={(e) => setInput(e.target.value)}
               placeholder="Enter a complex career or technical query..."
               className="w-full bg-white p-5 pr-16 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-purple-100 focus:border-purple-300 outline-none text-sm shadow-sm font-medium transition-all"
               onKeyDown={(e) => e.key === 'Enter' && handleSend()}
             />
             <button 
               onClick={handleSend}
               disabled={loading || !input.trim()}
               className="absolute right-2 top-1/2 -translate-y-1/2 p-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 disabled:opacity-50 transition-all shadow-lg shadow-purple-200"
             >
               <Send size={20} />
             </button>
           </div>
        </div>
      </div>
      
      <div className="flex items-center justify-center gap-4 text-slate-400">
        <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest"><ShieldAlert size={12} /> Deterministic Output</div>
        <div className="w-1 h-1 bg-slate-300 rounded-full"></div>
        <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest"><BrainCircuit size={12} /> High Reasoning</div>
      </div>
    </div>
  );
};

export default ThinkingChat;
