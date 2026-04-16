import React, { useState, useEffect, useRef } from 'react';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, limit, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { Send, User, MessageSquare, Trash2 } from 'lucide-react';
import { format } from 'date-fns';

export default function GlobalChat() {
  const { user, profile } = useAuth();
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const q = query(collection(db, 'global_chat'), orderBy('createdAt', 'desc'), limit(30));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })).reverse();
      setMessages(msgs);
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    });
    return unsubscribe;
  }, []);

  const handleDelete = async (msgId: string) => {
    try {
      if (window.confirm("Hapus pesan ini?")) {
        await deleteDoc(doc(db, 'global_chat', msgId));
      }
    } catch (e) {
      console.error("Delete error", e);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !user || !profile) return;

    let text = input.trim();
    setInput('');

    try {
      // Basic Emoji Support (Common patterns)
      text = text
        .replace(/:smile:/g, '😊')
        .replace(/:love:/g, '❤️')
        .replace(/:fire:/g, '🔥')
        .replace(/:haha:/g, '🤣')
        .replace(/:sad:/g, '😢');

      await addDoc(collection(db, 'global_chat'), {
        uid: user.uid,
        sampId: profile.sampId || 'SYS00',
        displayName: profile.displayName || user.email,
        role: profile.role || 'user',
        text,
        createdAt: serverTimestamp()
      });
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto flex-1 flex flex-col bg-[#141414] border border-gray-800 rounded-2xl overflow-hidden min-h-[500px] md:min-h-0">
      <div className="bg-[#0a0a0a] border-b border-gray-800 p-4 flex items-center gap-3">
        <div className="w-10 h-10 bg-orange-500/10 rounded-full flex items-center justify-center">
          <MessageSquare className="w-6 h-6 text-orange-500" />
        </div>
        <div>
          <h2 className="font-bold text-lg">Global Chat</h2>
          <p className="text-xs text-gray-400">Ngobrol bareng player lain</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.map((msg) => {
          const isMe = msg.uid === user?.uid;
          return (
            <div key={msg.id} className={`flex gap-3 ${isMe ? 'flex-row-reverse' : ''}`}>
              <div className="shrink-0">
                {msg.photoURL ? (
                  <img src={msg.photoURL} alt="" className="w-8 h-8 rounded-full" referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center">
                    <User className="w-4 h-4 text-white" />
                  </div>
                )}
              </div>
              <div className={`max-w-[75%] flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-[10px] font-bold px-1 rounded ${msg.role === 'admin' ? 'bg-orange-500/20 text-orange-500 border border-orange-500/30' : 'bg-gray-800 text-gray-400'}`}>
                    {msg.role === 'admin' ? 'ADMIN' : `ID: ${msg.sampId}`}
                  </span>
                  <span className="text-xs font-medium text-gray-400">{msg.displayName}</span>
                  <span className="text-[10px] text-gray-600">
                    {msg.createdAt?.toDate ? format(msg.createdAt.toDate(), 'HH:mm') : ''}
                  </span>
                  {(isMe || profile?.role === 'admin') && (
                    <button onClick={() => handleDelete(msg.id)} className="text-gray-600 hover:text-red-500 transition-colors">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
                <div className={`rounded-2xl p-3 text-sm ${isMe ? 'bg-orange-500 text-white rounded-tr-none' : 'bg-[#0a0a0a] border border-gray-800 text-gray-200 rounded-tl-none'}`}>
                  <p className="whitespace-pre-wrap break-words">{msg.text}</p>
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 bg-[#0a0a0a] border-t border-gray-800">
        <form onSubmit={handleSend} className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ketik pesan..."
            className="flex-1 bg-[#141414] border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-orange-500 transition-colors"
          />
          <button
            type="submit"
            disabled={!input.trim()}
            className="bg-orange-500 hover:bg-orange-600 disabled:bg-orange-500/50 disabled:cursor-not-allowed text-white px-6 py-3 rounded-xl font-medium flex items-center justify-center transition-colors"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
}
