import React, { useEffect, useState } from 'react';
import { collection, query, onSnapshot, orderBy, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { format } from 'date-fns';
import { Check, MessageSquare, Clock, ShieldAlert } from 'lucide-react';

export default function DevPanel() {
  const [asks, setAsks] = useState<any[]>([]);
  const [replyText, setReplyText] = useState<Record<string, string>>({});

  useEffect(() => {
    const q = query(collection(db, 'asks'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setAsks(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return unsubscribe;
  }, []);

  const handleReply = async (askId: string) => {
    const answer = replyText[askId];
    if (!answer?.trim()) return;

    try {
      await updateDoc(doc(db, 'asks', askId), {
        answer: answer.trim(),
        status: 'answered',
        updatedAt: serverTimestamp()
      });
      setReplyText(prev => ({ ...prev, [askId]: '' }));
    } catch (error) {
      console.error("Error replying to ask:", error);
      alert("Gagal membalas.");
    }
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8 flex items-center gap-3">
        <ShieldAlert className="w-8 h-8 text-red-500" />
        <div>
          <h2 className="text-2xl font-bold text-red-500">Developer Panel</h2>
          <p className="text-gray-400">Manage user asks and system settings.</p>
        </div>
      </div>

      <div className="space-y-6">
        <h3 className="text-xl font-bold border-b border-gray-800 pb-2">User Asks (Q&A)</h3>
        
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
      </div>
    </div>
  );
}
