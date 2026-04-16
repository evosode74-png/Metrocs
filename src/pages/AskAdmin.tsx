import React, { useState, useEffect } from 'react';
import { collection, query, where, orderBy, onSnapshot, addDoc, serverTimestamp, limit } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { HelpCircle, Send, Clock, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';

export default function AskAdmin() {
  const { user, profile } = useAuth();
  const [asks, setAsks] = useState<any[]>([]);
  const [question, setQuestion] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, 'asks'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc'),
      limit(50)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setAsks(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return unsubscribe;
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim() || !user || !profile) return;

    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'asks'), {
        userId: user.uid,
        userName: profile.displayName || user.email,
        question: question.trim(),
        status: 'pending',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      setQuestion('');
    } catch (error) {
      console.error("Error submitting question:", error);
      alert("Gagal mengirim pertanyaan.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
          <HelpCircle className="w-6 h-6 text-orange-500" />
          Ask Admin
        </h2>
        <p className="text-gray-400">Tanya seputar roleplay, CS, atau aturan server langsung ke admin.</p>
      </div>

      <div className="bg-[#141414] border border-gray-800 rounded-2xl p-6 mb-8">
        <form onSubmit={handleSubmit}>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Pertanyaan Kamu
          </label>
          <textarea
            required
            rows={3}
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            className="w-full bg-[#0a0a0a] border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-orange-500 transition-colors resize-y mb-4"
            placeholder="Min, kalau CS ditolak karena typo, boleh langsung submit lagi ga?"
          />
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting || !question.trim()}
              className="bg-orange-500 hover:bg-orange-600 disabled:bg-orange-500/50 disabled:cursor-not-allowed text-white px-6 py-2 rounded-xl font-medium flex items-center gap-2 transition-colors"
            >
              <Send className="w-4 h-4" />
              Kirim Pertanyaan
            </button>
          </div>
        </form>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-bold mb-4">Riwayat Pertanyaan</h3>
        {asks.length === 0 ? (
          <div className="text-center py-8 text-gray-500 border border-gray-800 rounded-2xl border-dashed">
            Belum ada pertanyaan.
          </div>
        ) : (
          asks.map(ask => (
            <div key={ask.id} className="bg-[#141414] border border-gray-800 rounded-2xl p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-2">
                  {ask.status === 'pending' ? (
                    <span className="flex items-center gap-1 text-xs font-medium text-yellow-500 bg-yellow-500/10 px-2 py-1 rounded">
                      <Clock className="w-3 h-3" /> Menunggu Balasan
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-xs font-medium text-green-500 bg-green-500/10 px-2 py-1 rounded">
                      <CheckCircle2 className="w-3 h-3" /> Dijawab
                    </span>
                  )}
                  <span className="text-xs text-gray-500">
                    {ask.createdAt?.toDate ? format(ask.createdAt.toDate(), 'MMM d, HH:mm') : ''}
                  </span>
                </div>
              </div>
              
              <div className="mb-4">
                <p className="text-gray-300 text-sm whitespace-pre-wrap">{ask.question}</p>
              </div>

              {ask.status === 'answered' && ask.answer && (
                <div className="bg-[#0a0a0a] border border-gray-800 rounded-xl p-4 mt-4 relative">
                  <div className="absolute -top-3 left-4 bg-[#0a0a0a] px-2 text-xs font-bold text-orange-500">
                    Admin Reply
                  </div>
                  <p className="text-gray-300 text-sm whitespace-pre-wrap mt-2">{ask.answer}</p>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
