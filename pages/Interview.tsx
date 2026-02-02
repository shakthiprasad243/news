
import React, { useState, useRef, useEffect } from 'react';
import { Send, User, Bot, RefreshCw, Mic, MicOff, Loader2 } from 'lucide-react';
import { getInterviewResponse, transcribeAudio } from '../services/gemini';
import { ChatMessage } from '../types';

const Interview: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'assistant', content: 'Hello! I am your technical interviewer today. To get started, could you introduce yourself and tell me about a complex project you recently worked on?' }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [difficulty, setDifficulty] = useState("Medium");
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const userMsg: ChatMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const response = await getInterviewResponse([...messages, userMsg], difficulty);
      setMessages(prev => [...prev, { role: 'assistant', content: response }]);
      
      // Dynamic difficulty adjustment
      if (input.length > 300) setDifficulty("Hard");
      else if (input.length < 50) setDifficulty("Easy");
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
          const base64Audio = (reader.result as string).split(',')[1];
          setTranscribing(true);
          try {
            const text = await transcribeAudio(base64Audio);
            if (text) {
              setInput(prev => (prev ? prev + " " + text : text));
            }
          } catch (err) {
            console.error("Transcription error:", err);
          } finally {
            setTranscribing(false);
          }
        };
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Microphone access denied:", err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  return (
    <div className="h-[calc(100vh-12rem)] flex flex-col space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-900">Adaptive Interview</h2>
          <p className="text-slate-500">Practice behavioral and technical questions with AI feedback.</p>
        </div>
        <div className="flex items-center gap-4 bg-white p-2 px-4 rounded-xl border border-slate-200 shadow-sm">
           <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">Difficulty</div>
           <select 
             className="text-sm font-bold text-blue-600 bg-transparent outline-none cursor-pointer"
             value={difficulty}
             onChange={(e) => setDifficulty(e.target.value)}
           >
             <option value="Easy">Beginner</option>
             <option value="Medium">Standard</option>
             <option value="Hard">Expert</option>
           </select>
           <button 
             onClick={() => setMessages([{ role: 'assistant', content: 'Interview reset. Tell me about your background.' }])}
             className="text-slate-400 hover:text-rose-500 transition-colors p-1"
             title="Reset Interview"
           >
             <RefreshCw size={16} />
           </button>
        </div>
      </div>

      <div className="flex-1 bg-white rounded-3xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-8 space-y-6">
          {messages.map((m, i) => (
            <div key={i} className={`flex items-start gap-4 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`p-2.5 rounded-xl ${m.role === 'assistant' ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-600'}`}>
                {m.role === 'assistant' ? <Bot size={20} /> : <User size={20} />}
              </div>
              <div className={`max-w-[80%] p-5 rounded-2xl text-sm leading-relaxed ${
                m.role === 'assistant' 
                  ? 'bg-slate-50 text-slate-800 rounded-tl-none border border-slate-100 shadow-sm' 
                  : 'bg-blue-600 text-white rounded-tr-none font-medium'
              }`}>
                {m.content}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex items-start gap-4 animate-pulse">
              <div className="p-2.5 rounded-xl bg-blue-50 text-blue-300">
                <Bot size={20} />
              </div>
              <div className="bg-slate-50 h-16 w-64 rounded-2xl rounded-tl-none border border-slate-100"></div>
            </div>
          )}
        </div>

        <div className="p-6 bg-slate-50 border-t border-slate-100">
          <div className="relative max-w-4xl mx-auto flex items-end gap-3">
            <div className="relative flex-1">
              <textarea
                className="w-full bg-white p-4 pr-12 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none text-sm resize-none shadow-sm font-medium min-h-[56px]"
                placeholder={transcribing ? "Transcribing your voice..." : "Type or speak your response..."}
                rows={2}
                value={input}
                disabled={transcribing}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
              />
              <div className="absolute right-3 bottom-3 flex items-center gap-2">
                {transcribing && <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />}
              </div>
            </div>
            
            <div className="flex gap-2">
              <button
                onMouseDown={startRecording}
                onMouseUp={stopRecording}
                onMouseLeave={stopRecording}
                onTouchStart={startRecording}
                onTouchEnd={stopRecording}
                className={`p-4 rounded-2xl transition-all shadow-md flex items-center justify-center ${
                  isRecording 
                    ? 'bg-rose-500 text-white animate-pulse' 
                    : 'bg-white text-slate-500 hover:text-blue-600 border border-slate-200'
                }`}
                title="Hold to speak"
              >
                {isRecording ? <MicOff size={20} /> : <Mic size={20} />}
              </button>

              <button 
                onClick={handleSend}
                disabled={loading || !input.trim() || transcribing}
                className="p-4 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 disabled:opacity-50 transition-all shadow-md shadow-blue-200"
              >
                <Send size={20} />
              </button>
            </div>
          </div>
          <div className="flex justify-between max-w-4xl mx-auto mt-3 px-1">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
              {isRecording ? "Recording... Release to transcribe" : "Shift + Enter for new line • Enter to send"}
            </p>
            {transcribing && (
              <p className="text-[10px] text-blue-500 font-bold uppercase tracking-widest animate-pulse">
                AI is transcribing your audio...
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Interview;
