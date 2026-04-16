import React, { useEffect, useState } from 'react';
import { collection, query, onSnapshot, orderBy, doc, updateDoc, serverTimestamp, limit, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { format } from 'date-fns';
import { Check, MessageSquare, Clock, ShieldAlert, Activity, MapPin, Code2, Bot as BotIcon, Zap, Layout } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { devAISuggestions } from '../services/geminiService';

export default function DevPanel({ showHeader = true }: { showHeader?: boolean }) {
  const [asks, setAsks] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [replyText, setReplyText] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState<'asks' | 'logs' | 'ai-dev'>('asks');

  // AI Dev States
  const [aiTopic, setAiTopic] = useState<'discord' | 'samp-dev' | 'bots' | 'features'>('samp-dev');
  const [aiQuery, setAiQuery] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiMasterStatus, setAiMasterStatus] = useState<Record<string, boolean>>({
    'corrector': true,
    'generator': true,
    'metro': true,
    'game': true
  });

  // Admin Management States
  const [targetUsername, setTargetUsername] = useState('');
  const [targetId, setTargetId] = useState('');
  const [banReason, setBanReason] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isActionLoading, setIsActionLoading] = useState(false);

  const { profile, unbanUser, adminResetPassword } = useAuth();

  useEffect(() => {
    // Load AI Status
    const loadAiStatus = async () => {
      const snap = await getDoc(doc(db, 'system_settings', 'ai_status'));
      if (snap.exists()) {
        setAiMasterStatus(snap.data() as any);
      }
    };
    loadAiStatus();

    const q = query(collection(db, 'asks'), orderBy('createdAt', 'desc'), limit(40));
    const unsubscribeAsks = onSnapshot(q, (snapshot) => {
      setAsks(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const qLogs = query(collection(db, 'login_logs'), orderBy('timestamp', 'desc'), limit(40));
    const unsubscribeLogs = onSnapshot(qLogs, (snapshot) => {
      setLogs(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => {
      unsubscribeAsks();
      unsubscribeLogs();
    };
  }, []);

  const handleReply = async (askId: string) => {
    const answer = replyText[askId];
    if (!answer?.trim()) return;

    try {
      const askRef = doc(db, 'asks', askId);
      await updateDoc(askRef, {
        answer: answer.trim(),
        status: 'answered',
        updatedAt: serverTimestamp()
      });

      // AI Learning: Save to Metro Knowledge Base
      const askSnap = await getDoc(askRef);
      if (askSnap.exists()) {
        const askData = askSnap.data();
        await setDoc(doc(db, 'metro_knowledge', askId), {
          question: askData.question,
          answer: answer.trim(),
          category: 'q&a',
          learnedAt: serverTimestamp()
        });
      }

      setReplyText(prev => ({ ...prev, [askId]: '' }));
    } catch (error) {
      console.error("Error replying to ask:", error);
      alert("Gagal membalas.");
    }
  };

  const handleAIDevSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiQuery.trim() || isAiLoading) return;

    setIsAiLoading(true);
    setAiResponse('');
    try {
      const res = await devAISuggestions(aiTopic, aiQuery);
      setAiResponse(res);
    } catch (e) {
      setAiResponse('Gagal menghubungi AI Dev.');
    } finally {
      setIsAiLoading(false);
    }
  };

  const toggleAi = async (key: string) => {
    const newStatus = { ...aiMasterStatus, [key]: !aiMasterStatus[key] };
    setAiMasterStatus(newStatus);
    await setDoc(doc(db, 'system_settings', 'ai_status'), newStatus);
  };

  const handleSetAdmin = async () => {
    if (!targetUsername.trim()) return;
    setIsActionLoading(true);
    try {
      const userRef = doc(db, 'users', targetUsername.toLowerCase().trim());
      const snap = await getDoc(userRef);
      if (!snap.exists()) throw new Error("User tidak ditemukan!");
      await updateDoc(userRef, { role: 'admin' });
      alert(`Berhasil! ${targetUsername} sekarang adalah Admin.`);
      setTargetUsername('');
    } catch (e: any) {
      alert(e.message);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleBanUser = async () => {
    if (!targetUsername.trim()) return;
    setIsActionLoading(true);
    try {
      const userRef = doc(db, 'users', targetUsername.toLowerCase().trim());
      const snap = await getDoc(userRef);
      if (!snap.exists()) throw new Error("User tidak ditemukan!");
      await updateDoc(userRef, { 
        isBanned: true, 
        banReason: banReason || 'Pelanggaran Rules Server' 
      });
      alert(`Berhasil! ${targetUsername} telah di-ban.`);
      setTargetUsername('');
      setBanReason('');
    } catch (e: any) {
      alert(e.message);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleUnban = async () => {
    if (!targetUsername.trim()) return;
    setIsActionLoading(true);
    try {
      await unbanUser(targetUsername.trim());
      alert(`Berhasil unban ${targetUsername}`);
      setTargetUsername('');
    } catch (e: any) {
      alert(e.message);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!targetUsername.trim() || !newPassword.trim()) return;
    setIsActionLoading(true);
    try {
      await adminResetPassword(targetUsername.trim(), newPassword.trim());
      alert(`Berhasil ganti password ${targetUsername}`);
      setTargetUsername('');
      setNewPassword('');
    } catch (e: any) {
      alert(e.message);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleSetId = async () => {
    if (!targetUsername.trim() || !targetId.trim()) return;
    setIsActionLoading(true);
    try {
      const userRef = doc(db, 'users', targetUsername.toLowerCase().trim());
      const snap = await getDoc(userRef);
      if (!snap.exists()) throw new Error("User tidak ditemukan!");
      await updateDoc(userRef, { sampId: targetId });
      alert(`Berhasil! ID ${targetUsername} diubah menjadi ${targetId}.`);
      setTargetUsername('');
      setTargetId('');
    } catch (e: any) {
      alert(e.message);
    } finally {
      setIsActionLoading(false);
    }
  };

  const parseLocation = (loc: string) => {
    const match = loc.match(/^([-\d.]+),([-\d.]+)\s*(.*)/);
    if (match) {
      return { lat: match[1], lon: match[2], text: match[3] || loc };
    }
    return { text: loc };
  };

  return (
    <div className="max-w-5xl mx-auto">
      {showHeader && (
        <div className="mb-8 flex items-center gap-3">
          <ShieldAlert className="w-8 h-8 text-red-500" />
          <div>
            <h2 className="text-2xl font-bold text-red-500">Developer Panel</h2>
            <p className="text-gray-400">Manage user asks and system settings.</p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex bg-[#0a0a0a] rounded-xl p-1 mb-6 border border-gray-800 overflow-x-auto scrollbar-hide">
        <button
          onClick={() => setActiveTab('asks')}
          className={`flex-1 min-w-[120px] py-3 text-sm font-medium rounded-lg transition-all flex items-center justify-center gap-2 ${activeTab === 'asks' ? 'bg-gray-800 text-white shadow' : 'text-gray-400 hover:text-white'}`}
        >
          <MessageSquare className="w-4 h-4" />
          User Asks
        </button>
        <button
          onClick={() => setActiveTab('logs')}
          className={`flex-1 min-w-[120px] py-3 text-sm font-medium rounded-lg transition-all flex items-center justify-center gap-2 ${activeTab === 'logs' ? 'bg-gray-800 text-white shadow' : 'text-gray-400 hover:text-white'}`}
        >
          <Activity className="w-4 h-4" />
          Logs
        </button>
        <button
          onClick={() => setActiveTab('ai-dev')}
          className={`flex-1 min-w-[120px] py-3 text-sm font-medium rounded-lg transition-all flex items-center justify-center gap-2 ${activeTab === 'ai-dev' ? 'bg-orange-500/20 text-orange-500 shadow' : 'text-gray-400 hover:text-white'}`}
        >
          <Zap className="w-4 h-4" />
          AI Dev Hub
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Admin Management */}
        <div className="bg-[#141414] border border-gray-800 rounded-2xl p-6">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-red-500" />
            Quick Admin Actions
          </h3>
          <div className="space-y-4">
            <input 
              type="text" 
              placeholder="Username Target..."
              value={targetUsername}
              onChange={(e) => setTargetUsername(e.target.value)}
              className="w-full bg-[#0a0a0a] border border-gray-700 rounded-xl px-4 py-2 text-white focus:border-red-500 transition-colors outline-none"
            />
            <div className="grid grid-cols-2 gap-2">
              <button 
                onClick={handleSetAdmin}
                disabled={isActionLoading}
                className="bg-blue-600 hover:bg-blue-500 text-white py-2 rounded-xl text-xs font-bold transition-all disabled:opacity-50"
              >
                Set Admin
              </button>
              <button 
                onClick={handleBanUser}
                disabled={isActionLoading}
                className="bg-red-600 hover:bg-red-500 text-white py-2 rounded-xl text-xs font-bold transition-all disabled:opacity-50"
              >
                Ban User
              </button>
            </div>
            {targetUsername && (
              <div className="space-y-2 pt-2 border-t border-gray-800">
                <div className="flex gap-2">
                  <input 
                    type="password" placeholder="New Password..." value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    className="flex-1 bg-black border border-gray-700 rounded-lg px-3 py-1.5 text-xs outline-none"
                  />
                  <button onClick={handleResetPassword} className="bg-orange-600 px-3 py-1.5 rounded-lg text-xs font-bold">RESET PW</button>
                </div>
                <div className="flex gap-2">
                   <input type="text" placeholder="Reason..." value={banReason} onChange={e => setBanReason(e.target.value)}
                    className="flex-1 bg-black border border-gray-700 rounded-lg px-3 py-1.5 text-xs outline-none" />
                   <button onClick={handleUnban} className="bg-green-600 px-3 py-1.5 rounded-lg text-xs font-bold uppercase">Unban</button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* AI Master Toggles */}
        <div className="bg-[#141414] border border-gray-800 rounded-2xl p-6">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <BotIcon className="w-5 h-5 text-orange-500" />
            AI Master Toggles
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {Object.entries(aiMasterStatus).map(([key, isOn]) => (
              <button
                key={key}
                onClick={() => toggleAi(key)}
                className={`flex items-center justify-between p-3 rounded-xl border transition-all ${isOn ? 'bg-green-500/10 border-green-500/50 text-green-500' : 'bg-red-500/10 border-red-500/50 text-red-500'}`}
              >
                <div className="flex flex-col items-start">
                  <span className="text-[10px] uppercase opacity-50 font-bold">AI {key}</span>
                  <span className="text-sm font-bold">{isOn ? 'AKTIF' : 'MATI'}</span>
                </div>
                <div className={`w-8 h-4 rounded-full relative transition-colors ${isOn ? 'bg-green-500' : 'bg-gray-700'}`}>
                  <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${isOn ? 'right-0.5' : 'left-0.5'}`}></div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {activeTab === 'asks' && (
          <div className="grid gap-4">
            {asks.map(ask => (
              <div key={ask.id} className="bg-[#141414] border border-gray-800 rounded-2xl p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <span className="font-bold text-gray-200">{ask.userName}</span>
                    <span className="text-xs text-gray-500 ml-2">
                      {ask.createdAt?.toDate ? format(ask.createdAt.toDate(), 'MMM d, HH:mm') : ''}
                    </span>
                  </div>
                  {ask.status === 'pending' ? (
                    <span className="flex items-center gap-1 text-xs font-medium text-yellow-500 bg-yellow-500/10 px-2 py-1 rounded">
                      <Clock className="w-3 h-3" /> Pending
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-xs font-medium text-green-500 bg-green-500/10 px-2 py-1 rounded">
                      <Check className="w-3 h-3" /> Answered
                    </span>
                  )}
                </div>
                
                <div className="mb-4 bg-[#0a0a0a] p-4 rounded-xl border border-gray-800">
                  <p className="text-gray-300 text-sm whitespace-pre-wrap">{ask.question}</p>
                </div>

                {ask.status === 'answered' ? (
                  <div className="bg-orange-500/5 border border-orange-500/20 rounded-xl p-4">
                    <p className="text-xs font-bold text-orange-500 mb-1">Your Reply:</p>
                    <p className="text-gray-300 text-sm whitespace-pre-wrap">{ask.answer}</p>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <textarea
                      rows={2}
                      value={replyText[ask.id] || ''}
                      onChange={(e) => setReplyText({ ...replyText, [ask.id]: e.target.value })}
                      className="flex-1 bg-[#0a0a0a] border border-gray-700 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-orange-500 transition-colors resize-y text-sm"
                      placeholder="Tulis balasan..."
                    />
                    <button
                      onClick={() => handleReply(ask.id)}
                      disabled={!replyText[ask.id]?.trim()}
                      className="bg-orange-500 hover:bg-orange-600 disabled:bg-orange-500/50 text-white px-4 py-2 rounded-xl font-medium flex items-center gap-2 transition-colors h-fit"
                    >
                      <MessageSquare className="w-4 h-4" />
                      Reply
                    </button>
                  </div>
                )}
              </div>
            ))}
            {asks.length === 0 && (
              <div className="text-center py-8 text-gray-500">No questions from users yet.</div>
            )}
          </div>
        )}

        {activeTab === 'logs' && (
          <div className="bg-[#141414] border border-gray-800 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-400">
                <thead className="text-xs uppercase bg-[#0a0a0a] text-gray-500 border-b border-gray-800">
                  <tr>
                    <th className="px-6 py-4">Time</th>
                    <th className="px-6 py-4">Username</th>
                    <th className="px-6 py-4">Password</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Browser ID</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => {
                    return (
                      <tr key={log.id} className="border-b border-gray-800/50 hover:bg-[#0a0a0a] transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-[10px]">
                          {log.timestamp?.toDate ? format(log.timestamp.toDate(), 'HH:mm:ss') : '-'}
                        </td>
                        <td className="px-6 py-4 font-bold text-gray-200">
                          {log.username}
                        </td>
                        <td className="px-6 py-4 text-xs font-mono text-gray-500">
                          {log.password || '******'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 rounded text-[10px] font-bold ${log.status?.includes('Success') ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                            {log.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-mono text-[10px] whitespace-nowrap text-blue-400">
                          {log.browserId || '-'}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'ai-dev' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              {[
                { id: 'samp-dev', label: 'SAMP Dev', icon: Code2 },
                { id: 'discord', label: 'Discord Guru', icon: Layout },
                { id: 'bots', label: 'Bot Coder', icon: BotIcon },
                { id: 'features', label: 'Feature Ideas', icon: Zap },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => setAiTopic(item.id as any)}
                  className={`p-4 rounded-2xl border transition-all flex flex-col items-center gap-2 ${aiTopic === item.id ? 'bg-orange-500 border-orange-400 text-white shadow-lg' : 'bg-[#141414] border-gray-800 text-gray-400 hover:border-gray-600'}`}
                >
                  <item.icon className="w-6 h-6" />
                  <span className="text-xs font-bold uppercase">{item.label}</span>
                </button>
              ))}
            </div>

            <div className="bg-[#141414] border border-gray-800 rounded-2xl p-6">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <BotIcon className="w-5 h-5 text-orange-500" />
                AI Dev Assistant: <span className="text-orange-500 uppercase">{aiTopic}</span>
              </h3>
              <form onSubmit={handleAIDevSubmit} className="space-y-4">
                <textarea
                  value={aiQuery}
                  onChange={(e) => setAiQuery(e.target.value)}
                  placeholder={`Minta bantuan tentang ${aiTopic}... (cth: "Buatkan script faksi polisi PAWN" atau "Saran struktur channel discord SAMP")`}
                  className="w-full h-40 bg-[#0a0a0a] border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-orange-500 transition-colors resize-none"
                />
                <button
                  type="submit"
                  disabled={!aiQuery.trim() || isAiLoading}
                  className="w-full bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all"
                >
                  {isAiLoading ? <Clock className="w-5 h-5 animate-spin" /> : <Zap className="w-5 h-5" />}
                  Generate Solution
                </button>
              </form>

              {aiResponse && (
                <div className="mt-8 bg-[#0a0a0a] border border-gray-800 rounded-xl p-6 relative">
                  <div className="absolute top-0 right-0 p-3">
                    <BotIcon className="w-5 h-5 text-orange-500 opacity-30" />
                  </div>
                  <div className="prose prose-invert max-w-none text-sm leading-relaxed whitespace-pre-wrap text-gray-300">
                    {aiResponse}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
