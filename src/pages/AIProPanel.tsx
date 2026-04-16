import React, { useState } from 'react';
import { Bot, Zap, Sparkles, Send, BrainCircuit, Search, Code2 } from 'lucide-react';
import { chatWithMetroBot } from '../services/geminiService';

export default function AIProPanel() {
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState<'general' | 'coding' | 'brainstorm'>('general');

  const handleProcess = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || isLoading) return;

    setIsLoading(true);
    try {
      // Reusing Metro Bot's infrastructure but with a "Pro" context
      const prefix = mode === 'coding' ? "SYSTEM: Expert Coder. " : mode === 'brainstorm' ? "SYSTEM: Creative Genius. " : "";
      const res = await chatWithMetroBot(prefix + query);
      setResponse(res);
    } catch (e) {
      setResponse("Maaf, AI Pro sedang sibuk. Coba lagi nanti.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      <div className="flex items-center gap-3 mb-2">
        <div className="p-2 bg-orange-500 rounded-lg shadow-[0_0_15px_rgba(249,115,22,0.5)]">
          <Zap className="w-6 h-6 text-white animate-pulse" />
        </div>
        <div>
          <h2 className="text-2xl font-black italic tracking-tighter text-white uppercase">AI PRO PANEL</h2>
          <p className="text-[10px] text-gray-500 font-mono">POWERED BY GEMINI 1.5 PRO • LOW LATENCY</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {[
          { id: 'general', label: 'UMUM', icon: BrainCircuit, color: 'text-blue-400' },
          { id: 'coding', label: 'KODING', icon: Code2, color: 'text-green-400' },
          { id: 'brainstorm', label: 'IDE', icon: Sparkles, color: 'text-purple-400' },
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => setMode(item.id as any)}
            className={`p-3 rounded-xl border flex flex-col items-center gap-1 transition-all ${mode === item.id ? 'bg-orange-500/10 border-orange-500 text-orange-500' : 'bg-[#141414] border-gray-800 text-gray-500 hover:border-gray-600'}`}
          >
            <item.icon className={`w-5 h-5 ${mode === item.id ? 'text-orange-500' : item.color}`} />
            <span className="text-[10px] font-bold">{item.label}</span>
          </button>
        ))}
      </div>

      <div className="bg-[#141414] border border-gray-800 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 blur-3xl pointer-events-none"></div>
        
        <form onSubmit={handleProcess} className="space-y-4 relative z-10">
          <div className="relative">
            <textarea
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={`Tanya apa saja di mode ${mode}...`}
              rows={4}
              className="w-full bg-[#0a0a0a] border border-gray-700 rounded-xl px-4 py-4 text-sm text-gray-200 focus:outline-none focus:border-orange-500/50 transition-all resize-none shadow-inner"
            />
            <div className="absolute bottom-3 right-3 flex items-center gap-2">
               <span className="text-[9px] text-gray-600 italic">Fast rendering active</span>
               <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-ping"></div>
            </div>
          </div>

          <button
            type="submit"
            disabled={!query.trim() || isLoading}
            className="w-full bg-white text-black font-black py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-orange-500 hover:text-white transition-all transform active:scale-[0.98] disabled:opacity-50"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                <Zap className="w-5 h-5 fill-current" />
                DAPATKAN JAWABAN PRO
              </>
            )}
          </button>
        </form>

        {response && (
          <div className="mt-8 animate-in fade-in slide-in-from-top-4 duration-500">
             <div className="flex items-center gap-2 mb-3 px-1">
                <div className="w-6 h-6 bg-gray-800 rounded flex items-center justify-center">
                  <Bot className="w-3 h-3 text-orange-500" />
                </div>
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">PRO RESPONSE</span>
             </div>
             <div className="bg-black/50 border border-gray-800/50 rounded-xl p-6 text-sm text-gray-300 leading-relaxed whitespace-pre-wrap selection:bg-orange-500/30">
               {response}
             </div>
          </div>
        )}
      </div>

      <div className="bg-orange-500/5 border border-orange-500/10 rounded-xl p-4 flex items-center gap-3">
        <Search className="w-5 h-5 text-gray-600" />
        <p className="text-[11px] text-gray-500 italic uppercase">
          Tips: Gunakan koding mode untuk membuat script PAWN lebih akurat. AI Pro belajar dari data developer dunia.
        </p>
      </div>
    </div>
  );
}
