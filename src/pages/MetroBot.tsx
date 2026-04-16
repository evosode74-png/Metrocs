import React, { useState, useRef, useEffect } from 'react';
import { chatWithMetroBot, correctCharacterStory } from '../services/geminiService';
import { Bot, Send, User, Loader2, Sparkles } from 'lucide-react';

export default function MetroBot() {
  const [activeTab, setActiveTab] = useState<'metro' | 'cs'>('metro');
  
  // Metro Bot State
  const [metroMessages, setMetroMessages] = useState<{ role: 'user' | 'model', text: string }[]>([
    { role: 'model', text: 'Halo bro! Gue Metro Bot. Ada yang bisa dibantu soal server atau rules CS?' }
  ]);
  const [metroInput, setMetroInput] = useState('');
  const [isMetroLoading, setIsMetroLoading] = useState(false);
  const metroEndRef = useRef<HTMLDivElement>(null);

  // CS Corrector Bot State
  const [csName, setCsName] = useState('');
  const [csInput, setCsInput] = useState('');
  const [csResult, setCsResult] = useState('');
  const [isCsLoading, setIsCsLoading] = useState(false);

  useEffect(() => {
    if (activeTab === 'metro') {
      metroEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [metroMessages, activeTab]);

  const handleMetroSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!metroInput.trim() || isMetroLoading) return;

    const userMsg = metroInput.trim();
    setMetroInput('');
    setMetroMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsMetroLoading(true);

    try {
      const response = await chatWithMetroBot(userMsg, metroMessages);
      setMetroMessages(prev => [...prev, { role: 'model', text: response }]);
    } catch (error) {
      setMetroMessages(prev => [...prev, { role: 'model', text: 'Waduh, sistem Metro lagi error nih bro. Sabar ya.' }]);
    } finally {
      setIsMetroLoading(false);
    }
  };

  const handleCsCorrect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!csInput.trim() || !csName.trim() || isCsLoading) return;

    setIsCsLoading(true);
    setCsResult('');
    try {
      const response = await correctCharacterStory(csInput, csName);
      setCsResult(response);
    } catch (error) {
      setCsResult('Gagal mengoreksi cerita. Coba lagi nanti.');
    } finally {
      setIsCsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto flex-1 flex flex-col bg-[#141414] border border-gray-800 rounded-2xl overflow-hidden min-h-[600px] md:min-h-0">
      <div className="bg-[#0a0a0a] border-b border-gray-800 flex">
        <button
          onClick={() => setActiveTab('metro')}
          className={`flex-1 py-4 font-medium flex items-center justify-center gap-2 transition-colors ${activeTab === 'metro' ? 'text-orange-500 border-b-2 border-orange-500 bg-[#141414]' : 'text-gray-400 hover:text-gray-200'}`}
        >
          <Bot className="w-5 h-5" /> Metro Bot
        </button>
        <button
          onClick={() => setActiveTab('cs')}
          className={`flex-1 py-4 font-medium flex items-center justify-center gap-2 transition-colors ${activeTab === 'cs' ? 'text-orange-500 border-b-2 border-orange-500 bg-[#141414]' : 'text-gray-400 hover:text-gray-200'}`}
        >
          <Sparkles className="w-5 h-5" /> CS Corrector Bot
        </button>
      </div>

      {activeTab === 'metro' ? (
        <>
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {metroMessages.map((msg, idx) => (
              <div key={idx} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-gray-700' : 'bg-orange-500/20'}`}>
                  {msg.role === 'user' ? <User className="w-4 h-4 text-white" /> : <Bot className="w-4 h-4 text-orange-500" />}
                </div>
                <div className={`max-w-[80%] rounded-2xl p-4 text-sm ${msg.role === 'user' ? 'bg-orange-500 text-white rounded-tr-none' : 'bg-[#0a0a0a] border border-gray-800 text-gray-200 rounded-tl-none'}`}>
                  <p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                </div>
              </div>
            ))}
            {isMetroLoading && (
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-orange-500/20 flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4 text-orange-500" />
                </div>
                <div className="bg-[#0a0a0a] border border-gray-800 rounded-2xl rounded-tl-none p-4 flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-orange-500" />
                  <span className="text-sm text-gray-400">Metro lagi ngetik...</span>
                </div>
              </div>
            )}
            <div ref={metroEndRef} />
          </div>

          <div className="p-4 bg-[#0a0a0a] border-t border-gray-800">
            <form onSubmit={handleMetroSend} className="flex gap-2">
              <input
                type="text"
                value={metroInput}
                onChange={(e) => setMetroInput(e.target.value)}
                placeholder="Tanya Metro di sini bro..."
                className="flex-1 bg-[#141414] border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-orange-500 transition-colors"
              />
              <button
                type="submit"
                disabled={!metroInput.trim() || isMetroLoading}
                className="bg-orange-500 hover:bg-orange-600 disabled:bg-orange-500/50 disabled:cursor-not-allowed text-white px-6 py-3 rounded-xl font-medium flex items-center justify-center transition-colors"
              >
                <Send className="w-5 h-5" />
              </button>
            </form>
          </div>
        </>
      ) : (
        <div className="flex-1 overflow-y-auto p-6 flex flex-col md:flex-row gap-6">
          <div className="flex-1 flex flex-col h-full">
            <h3 className="text-lg font-bold mb-4">Input Cerita Asli</h3>
            <form onSubmit={handleCsCorrect} className="flex flex-col h-full gap-4">
              <input
                type="text"
                required
                value={csName}
                onChange={(e) => setCsName(e.target.value)}
                placeholder="Nama Karakter (Tanpa Garis Bawah)"
                className="bg-[#0a0a0a] border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-orange-500 transition-colors"
              />
              <textarea
                required
                value={csInput}
                onChange={(e) => setCsInput(e.target.value)}
                placeholder="Paste cerita CS kamu di sini untuk dikoreksi bot..."
                className="flex-1 bg-[#0a0a0a] border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-orange-500 transition-colors resize-none"
              />
              <button
                type="submit"
                disabled={!csInput.trim() || !csName.trim() || isCsLoading}
                className="bg-orange-500 hover:bg-orange-600 disabled:bg-orange-500/50 text-white px-6 py-3 rounded-xl font-medium flex items-center justify-center gap-2 transition-colors"
              >
                {isCsLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                Koreksi Sekarang
              </button>
            </form>
          </div>
          
          <div className="flex-1 flex flex-col h-full">
            <h3 className="text-lg font-bold mb-4 text-orange-500">Hasil Koreksi AI</h3>
            <div className="flex-1 bg-[#0a0a0a] border border-orange-500/30 rounded-xl p-4 overflow-y-auto">
              {isCsLoading ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-500 gap-3">
                  <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
                  <p>Bot sedang memperbaiki cerita kamu...</p>
                </div>
              ) : csResult ? (
                <p className="whitespace-pre-wrap text-gray-200 text-sm leading-relaxed">{csResult}</p>
              ) : (
                <div className="h-full flex items-center justify-center text-gray-600 text-sm text-center">
                  Hasil koreksi akan muncul di sini.<br/>Kamu bisa copy hasilnya untuk disubmit nanti.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
