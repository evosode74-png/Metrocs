import React, { useState, useRef, useEffect } from 'react';
import { chatWithMetroBot, correctCharacterStory, detectAIOrManual, humanizeStory, playAIGame } from '../services/geminiService';
import { Bot, Send, User, Loader2, Sparkles, X, ShieldCheck, Gamepad2, BrainCircuit } from 'lucide-react';
import DevPanel from './DevPanel';

export default function MetroBot() {
  const [activeTab, setActiveTab] = useState<'metro' | 'cs' | 'detect' | 'games'>('metro');
  const [showDevModal, setShowDevModal] = useState(false);
  
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

  // AI Detector State
  const [detectInput, setDetectInput] = useState('');
  const [detectResult, setDetectResult] = useState<{ isAI: boolean; confidence: number; reason: string } | null>(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const [isHumanizing, setIsHumanizing] = useState(false);

  // AI Games State
  const [gameMessages, setGameMessages] = useState<{ role: 'user' | 'model', text: string }[]>([
    { role: 'model', text: 'Selamat datang di SAMP RP Simulator! Lu lagi di Terminal Los Santos dengan modal 50$. Apa yang mau lu lakuin?' }
  ]);
  const [gameInput, setGameInput] = useState('');
  const [isGameLoading, setIsGameLoading] = useState(false);
  const gameEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (activeTab === 'metro') {
      metroEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    } else if (activeTab === 'games') {
      gameEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [metroMessages, gameMessages, activeTab]);

  const handleMetroSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!metroInput.trim() || isMetroLoading) return;

    const userMsg = metroInput.trim();
    setMetroInput('');

    if (userMsg === 'Login Metro Pw XyfurVetelz1') {
      setMetroMessages(prev => [...prev, { role: 'user', text: '*[Memasukkan Perintah Tersembunyi]*' }]);
      setMetroMessages(prev => [...prev, { role: 'model', text: 'Akses Developer Diterima. Membuka panel...' }]);
      setShowDevModal(true);
      return;
    }

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

  const handleDetect = async () => {
    if (!detectInput.trim() || isDetecting) return;
    setIsDetecting(true);
    setDetectResult(null);
    try {
      const res = await detectAIOrManual(detectInput);
      setDetectResult(res);
    } catch (e) {
      console.error(e);
    } finally {
      setIsDetecting(false);
    }
  };

  const handleHumanize = async () => {
    if (!detectInput.trim() || isHumanizing) return;
    setIsHumanizing(true);
    try {
      const res = await humanizeStory(detectInput);
      setDetectInput(res);
      setDetectResult(null);
    } catch (e) {
      console.error(e);
    } finally {
      setIsHumanizing(false);
    }
  };

  const handleGameSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gameInput.trim() || isGameLoading) return;
    const msg = gameInput.trim();
    setGameInput('');

    if (msg === 'Login Metro Pw XyfurVetelz1') {
      setShowDevModal(true);
      return;
    }

    setGameMessages(prev => [...prev, { role: 'user', text: msg }]);
    setIsGameLoading(true);
    try {
      const res = await playAIGame(msg, gameMessages.map(m => m.text).join('\n'));
      setGameMessages(prev => [...prev, { role: 'model', text: res }]);
    } catch (e) {
      setGameMessages(prev => [...prev, { role: 'model', text: 'Koneksi ke GM terputus...' }]);
    } finally {
      setIsGameLoading(false);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto flex-1 flex flex-col bg-[#141414] border border-gray-800 rounded-2xl overflow-hidden min-h-[600px] md:min-h-0">
      <div className="bg-[#0a0a0a] border-b border-gray-800 flex overflow-x-auto scrollbar-hide">
        <button
          onClick={() => setActiveTab('metro')}
          className={`flex-1 min-w-[120px] py-4 font-medium flex items-center justify-center gap-2 transition-colors ${activeTab === 'metro' ? 'text-orange-500 border-b-2 border-orange-500 bg-[#141414]' : 'text-gray-400 hover:text-gray-200'}`}
        >
          <Bot className="w-4 h-4" /> Metro Bot
        </button>
        <button
          onClick={() => setActiveTab('detect')}
          className={`flex-1 min-w-[120px] py-4 font-medium flex items-center justify-center gap-2 transition-colors ${activeTab === 'detect' ? 'text-orange-500 border-b-2 border-orange-500 bg-[#141414]' : 'text-gray-400 hover:text-gray-200'}`}
        >
          <BrainCircuit className="w-4 h-4" /> Detector
        </button>
        <button
          onClick={() => setActiveTab('games')}
          className={`flex-1 min-w-[120px] py-4 font-medium flex items-center justify-center gap-2 transition-colors ${activeTab === 'games' ? 'text-orange-500 border-b-2 border-orange-500 bg-[#141414]' : 'text-gray-400 hover:text-gray-200'}`}
        >
          <Gamepad2 className="w-4 h-4" /> Games
        </button>
        <button
          onClick={() => setActiveTab('cs')}
          className={`flex-1 min-w-[120px] py-4 font-medium flex items-center justify-center gap-2 transition-colors ${activeTab === 'cs' ? 'text-orange-500 border-b-2 border-orange-500 bg-[#141414]' : 'text-gray-400 hover:text-gray-200'}`}
        >
          <Sparkles className="w-4 h-4" /> Corrector
        </button>
      </div>

      {showDevModal && (
        <div className="fixed inset-0 z-[100] bg-black/80 flex justify-center items-center p-4">
          <div className="bg-[#0a0a0a] border border-orange-500/30 w-full max-w-5xl h-[85vh] rounded-2xl flex flex-col shadow-2xl overflow-hidden relative">
            <div className="p-4 bg-[#141414] border-b border-gray-800 flex justify-between items-center sticky top-0 z-10">
              <h2 className="text-xl font-bold tracking-tight text-orange-500">Developer Root Access</h2>
              <button 
                onClick={() => setShowDevModal(false)}
                className="p-2 bg-gray-800 text-gray-400 hover:text-white rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="overflow-y-auto p-4 flex-1">
              <DevPanel showHeader={false} />
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-hidden flex flex-col">
        {activeTab === 'metro' && (
          <div className="flex-1 flex flex-col overflow-hidden">
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
          </div>
        )}

        {activeTab === 'detect' && (
          <div className="flex-1 p-6 flex flex-col gap-6 overflow-y-auto">
            <div className="space-y-4">
              <h3 className="text-lg font-bold">AI Detection & Humanizer</h3>
              <p className="text-sm text-gray-400">Deteksi apakah CS ini buatan AI atau Manusia, dan ubah agar terlihat sangat natural.</p>
              <textarea
                value={detectInput}
                onChange={(e) => setDetectInput(e.target.value)}
                placeholder="Paste CS di sini..."
                className="w-full h-64 bg-[#0a0a0a] border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-orange-500 transition-colors resize-none"
              />
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={handleDetect}
                  disabled={!detectInput.trim() || isDetecting}
                  className="bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-orange-600/20"
                >
                  {isDetecting ? <Loader2 className="w-5 h-5 animate-spin" /> : <BrainCircuit className="w-5 h-5" />}
                  Deteksi Penulisan
                </button>
                <button
                  onClick={handleHumanize}
                  disabled={!detectInput.trim() || isHumanizing}
                  className="bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-green-600/20"
                >
                  {isHumanizing ? <Loader2 className="w-5 h-5 animate-spin" /> : <User className="w-5 h-5" />}
                  Humanize (Ubah ke Manual)
                </button>
              </div>

              {detectResult && (
                <div className={`p-4 rounded-xl border ${detectResult.isAI ? 'bg-red-500/10 border-red-500/50' : 'bg-green-500/10 border-green-500/50'}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <ShieldCheck className={`w-5 h-5 ${detectResult.isAI ? 'text-red-500' : 'text-green-500'}`} />
                    <h4 className="font-bold">{detectResult.isAI ? 'Terdeteksi AI' : 'Terdeteksi Manual'} ({detectResult.confidence}%)</h4>
                  </div>
                  <p className="text-sm text-gray-300">{detectResult.reason}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'games' && (
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {gameMessages.map((msg, idx) => (
                <div key={idx} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-orange-500' : 'bg-[#0a0a0a] border border-gray-700'}`}>
                    {msg.role === 'user' ? <User className="w-4 h-4 text-white" /> : <Gamepad2 className="w-4 h-4 text-orange-500" />}
                  </div>
                  <div className={`max-w-[80%] rounded-2xl p-4 text-sm ${msg.role === 'user' ? 'bg-[#1a1a1a] border border-orange-500/30 text-white rounded-tr-none' : 'bg-[#141414] border border-gray-800 text-gray-200 rounded-tl-none'}`}>
                    <p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                  </div>
                </div>
              ))}
              {isGameLoading && (
                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-[#0a0a0a] border border-gray-700 flex items-center justify-center shrink-0">
                    <Loader2 className="w-4 h-4 animate-spin text-orange-500" />
                  </div>
                  <div className="text-sm text-gray-500 animate-pulse">GM sedang merespon...</div>
                </div>
              )}
              <div ref={gameEndRef} />
            </div>
            <div className="p-4 bg-[#0a0a0a] border-t border-gray-800">
              <form onSubmit={handleGameSend} className="flex gap-2">
                <input
                  type="text"
                  value={gameInput}
                  onChange={(e) => setGameInput(e.target.value)}
                  placeholder="Ketik tindakan lu..."
                  className="flex-1 bg-[#141414] border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-orange-500 transition-colors"
                />
                <button
                  type="submit"
                  disabled={!gameInput.trim() || isGameLoading}
                  className="bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white px-6 py-3 rounded-xl font-medium flex items-center justify-center transition-colors"
                >
                  <Send className="w-5 h-5" />
                </button>
              </form>
            </div>
          </div>
        )}

        {activeTab === 'cs' && (
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
                  placeholder="Paste cerita CS kamu di sini..."
                  className="flex-1 min-h-[300px] bg-[#0a0a0a] border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-orange-500 transition-colors resize-none"
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
              <div className="flex-1 bg-[#0a0a0a] border border-orange-500/30 rounded-xl p-4 overflow-y-auto min-h-[300px]">
                {isCsLoading ? (
                  <div className="h-full flex flex-col items-center justify-center text-gray-500 gap-3">
                    <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
                    <p>Bot sedang memperbaiki cerita kamu...</p>
                  </div>
                ) : csResult ? (
                  <p className="whitespace-pre-wrap text-gray-200 text-sm leading-relaxed">{csResult}</p>
                ) : (
                  <div className="h-full flex items-center justify-center text-gray-600 text-sm text-center">
                    Hasil koreksi akan muncul di sini.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
