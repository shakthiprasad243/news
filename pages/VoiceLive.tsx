
import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Volume2, Info, BrainCircuit, User, Bot, Sparkles } from 'lucide-react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';

// Helper functions for audio processing as per guidelines
function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

function encode(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

interface ChatEntry {
  role: 'user' | 'assistant';
  text: string;
}

const VoiceLive: React.FC = () => {
  const [isActive, setIsActive] = useState(false);
  const [history, setHistory] = useState<ChatEntry[]>([]);
  const [currentInput, setCurrentInput] = useState("");
  const [currentOutput, setCurrentOutput] = useState("");
  
  const sessionRef = useRef<any>(null);
  const audioContextsRef = useRef<{ input: AudioContext; output: AudioContext } | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const scrollRef = useRef<HTMLDivElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Use refs for transcription to avoid stale closure issues in onmessage
  const inputAccumulator = useRef("");
  const outputAccumulator = useRef("");

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [history, currentInput, currentOutput]);

  const stopSession = () => {
    // Safety checks for cleanup
    if (sessionRef.current) {
      try {
        sessionRef.current.close();
      } catch (e) {
        console.warn("Error closing session:", e);
      }
      sessionRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    if (audioContextsRef.current) {
      try {
        if (audioContextsRef.current.input.state !== 'closed') {
          audioContextsRef.current.input.close();
        }
        if (audioContextsRef.current.output.state !== 'closed') {
          audioContextsRef.current.output.close();
        }
      } catch (e) {
        console.warn("Error closing audio contexts:", e);
      }
      audioContextsRef.current = null;
    }

    sourcesRef.current.forEach(s => {
      try {
        s.stop();
      } catch (e) {}
    });
    sourcesRef.current.clear();
    
    setIsActive(false);
    inputAccumulator.current = "";
    outputAccumulator.current = "";
    setCurrentInput("");
    setCurrentOutput("");
  };

  const startSession = async () => {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const inputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      const outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      audioContextsRef.current = { input: inputAudioContext, output: outputAudioContext };

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        callbacks: {
          onopen: () => {
            setIsActive(true);
            const source = inputAudioContext.createMediaStreamSource(stream);
            const scriptProcessor = inputAudioContext.createScriptProcessor(4096, 1, 1);
            
            scriptProcessor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const l = inputData.length;
              const int16 = new Int16Array(l);
              for (let i = 0; i < l; i++) {
                int16[i] = inputData[i] * 32768;
              }
              const pcmBlob = {
                data: encode(new Uint8Array(int16.buffer)),
                mimeType: 'audio/pcm;rate=16000',
              };
              // Only send if session is active
              sessionPromise.then(session => {
                if (sessionRef.current) {
                  session.sendRealtimeInput({ media: pcmBlob });
                }
              });
            };

            source.connect(scriptProcessor);
            scriptProcessor.connect(inputAudioContext.destination);
          },
          onmessage: async (message: LiveServerMessage) => {
            // Real-time incremental transcription from AI
            if (message.serverContent?.outputTranscription) {
              const text = message.serverContent.outputTranscription.text;
              outputAccumulator.current += text;
              setCurrentOutput(outputAccumulator.current);
            } 
            // Real-time incremental transcription from User
            else if (message.serverContent?.inputTranscription) {
              const text = message.serverContent.inputTranscription.text;
              inputAccumulator.current += text;
              setCurrentInput(inputAccumulator.current);
            }

            // Handle Audio Playback
            const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (base64Audio && audioContextsRef.current) {
              const ctx = audioContextsRef.current.output;
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
              const audioBuffer = await decodeAudioData(decode(base64Audio), ctx, 24000, 1);
              const source = ctx.createBufferSource();
              source.buffer = audioBuffer;
              source.connect(ctx.destination);
              source.addEventListener('ended', () => sourcesRef.current.delete(source));
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += audioBuffer.duration;
              sourcesRef.current.add(source);
            }

            // Handle Interruption (e.g. user starts talking)
            if (message.serverContent?.interrupted) {
              sourcesRef.current.forEach(s => {
                try { s.stop(); } catch(e) {}
              });
              sourcesRef.current.clear();
              nextStartTimeRef.current = 0;
            }

            // Turn is finished - push to history
            if (message.serverContent?.turnComplete) {
              const uText = inputAccumulator.current;
              const aText = outputAccumulator.current;
              
              setHistory(prev => {
                const newEntries: ChatEntry[] = [];
                if (uText.trim()) newEntries.push({ role: 'user', text: uText });
                if (aText.trim()) newEntries.push({ role: 'assistant', text: aText });
                return [...prev, ...newEntries];
              });
              
              // Reset accumulators and live states
              inputAccumulator.current = "";
              outputAccumulator.current = "";
              setCurrentInput("");
              setCurrentOutput("");
            }
          },
          onerror: (e) => {
            console.error('Live session error:', e);
            stopSession();
          },
          onclose: () => {
            console.debug('Live session closed');
            stopSession();
          },
        },
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } },
          },
          systemInstruction: 'You are an elite Career Coach. Help the user with advice, interviews, and skills. Use their transcriptions to provide highly personalized feedback. Keep it brief and professional.',
          outputAudioTranscription: {},
          inputAudioTranscription: {},
        },
      });

      sessionRef.current = await sessionPromise;
    } catch (err) {
      console.error('Failed to start session:', err);
      stopSession();
    }
  };

  const toggleVoice = () => {
    if (isActive) {
      stopSession();
    } else {
      startSession();
    }
  };

  return (
    <div className="max-w-5xl mx-auto flex flex-col h-[calc(100vh-10rem)] animate-in fade-in duration-500">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-900 flex items-center gap-2">
            <Mic className="text-blue-600" /> Live Career Coach
          </h2>
          <p className="text-slate-500">Multimodal real-time career coaching via Gemini 2.5 Native Audio.</p>
        </div>
        <div className={`px-4 py-2 rounded-full border text-xs font-bold uppercase tracking-widest flex items-center gap-2 transition-all ${isActive ? 'bg-emerald-50 text-emerald-600 border-emerald-100 shadow-sm' : 'bg-slate-50 text-slate-400 border-slate-100'}`}>
          <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`}></div>
          {isActive ? 'Session Active' : 'Ready to Connect'}
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 overflow-hidden">
        {/* Chat Transcription Interface */}
        <div className="lg:col-span-8 bg-white rounded-3xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-4">
            {history.length === 0 && !currentInput && !currentOutput && (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-4">
                <div className="p-4 bg-blue-50 text-blue-600 rounded-2xl">
                  <Bot size={32} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Voice Intelligence Bridge</h3>
                  <p className="text-sm text-slate-500 max-w-xs">Transcriptions appear here in real-time as you speak. Start a session to begin your coaching journey.</p>
                </div>
              </div>
            )}
            
            {history.map((entry, i) => (
              <div key={i} className={`flex items-start gap-3 ${entry.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`p-2 rounded-xl flex-shrink-0 ${entry.role === 'assistant' ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-500'}`}>
                  {entry.role === 'assistant' ? <Bot size={18} /> : <User size={18} />}
                </div>
                <div className={`max-w-[85%] p-4 rounded-2xl text-sm leading-relaxed ${
                  entry.role === 'assistant' 
                    ? 'bg-slate-50 text-slate-800 rounded-tl-none border border-slate-100 shadow-sm' 
                    : 'bg-blue-600 text-white rounded-tr-none font-medium'
                }`}>
                  {entry.text}
                </div>
              </div>
            ))}

            {/* Current Turn Streaming - Live Feedback */}
            {currentInput && (
              <div className="flex items-start gap-3 flex-row-reverse animate-in fade-in slide-in-from-right-2 duration-300">
                <div className="p-2 rounded-xl flex-shrink-0 bg-slate-100 text-slate-500">
                  <User size={18} />
                </div>
                <div className="max-w-[85%] p-4 rounded-2xl text-sm leading-relaxed bg-blue-500/90 text-white rounded-tr-none font-medium italic border border-blue-400">
                  {currentInput}
                  <span className="ml-1 inline-block w-1.5 h-1.5 bg-white rounded-full animate-bounce"></span>
                </div>
              </div>
            )}
            {currentOutput && (
              <div className="flex items-start gap-3 animate-in fade-in slide-in-from-left-2 duration-300">
                <div className="p-2 rounded-xl flex-shrink-0 bg-blue-100 text-blue-600">
                  <Bot size={18} />
                </div>
                <div className="max-w-[85%] p-4 rounded-2xl text-sm leading-relaxed bg-slate-50 text-slate-800 rounded-tl-none border border-blue-200 shadow-sm">
                  {currentOutput}
                  <span className="inline-block w-1 h-4 bg-blue-400 animate-pulse ml-1 align-middle"></span>
                </div>
              </div>
            )}
          </div>

          <div className="p-6 bg-slate-50 border-t border-slate-100 flex items-center justify-center">
            <button 
              onClick={toggleVoice}
              className={`group relative p-8 rounded-full transition-all duration-500 transform active:scale-95 ${
                isActive 
                  ? 'bg-rose-600 text-white shadow-xl shadow-rose-200 hover:bg-rose-700' 
                  : 'bg-blue-600 text-white shadow-xl shadow-blue-200 hover:bg-blue-700'
              }`}
            >
              {isActive ? (
                <>
                  <MicOff size={32} />
                  <div className="absolute inset-0 rounded-full border-4 border-rose-400 animate-ping opacity-25"></div>
                </>
              ) : (
                <Mic size={32} />
              )}
            </button>
          </div>
        </div>

        {/* Info & Status Sidebar */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest flex items-center gap-2">
              <Sparkles size={16} className="text-yellow-500" /> Active Intel
            </h3>
            
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Primary Modality</p>
                <div className="flex items-center gap-2 text-sm font-bold text-slate-700">
                  <Volume2 size={16} className="text-blue-500" />
                  Native Audio Out
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Live Transcription</p>
                <div className="flex items-center gap-2 text-sm font-bold text-emerald-600">
                  <Info size={16} />
                  Enabled
                </div>
              </div>

              <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100">
                <p className="text-[10px] font-medium text-blue-700 leading-relaxed">
                  The model listens continuously. Speak naturally. It can detect interruptions and switch topics instantly.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 shadow-xl overflow-hidden relative group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
               <BrainCircuit size={80} className="text-white" />
            </div>
            <h3 className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-4">Tech Specs</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400">Model:</span>
                <span className="text-blue-400 font-mono">Gemini 2.5 Flash</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400">Audio:</span>
                <span className="text-emerald-400 font-mono">PCM @ 16/24kHz</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400">Latency:</span>
                <span className="text-emerald-400 font-mono">Sub-500ms</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VoiceLive;
