import React, { useEffect, useState } from 'react';
import { collection, query, onSnapshot, orderBy, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { StatusBadge } from './Dashboard';
import { format } from 'date-fns';
import { Check, X, MessageSquare, ChevronDown, ChevronUp, Users, FileText, ExternalLink } from 'lucide-react';

export default function AdminDashboard() {
  const [stories, setStories] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState<'stories' | 'users'>('stories');

  useEffect(() => {
    const qStories = query(collection(db, 'character_stories'), orderBy('createdAt', 'desc'));
    const unsubscribeStories = onSnapshot(qStories, (snapshot) => {
      setStories(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });

    const qUsers = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
    const unsubscribeUsers = onSnapshot(qUsers, (snapshot) => {
      setUsers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => {
      unsubscribeStories();
      unsubscribeUsers();
    };
  }, []);

  const handleUpdateStatus = async (storyId: string, newStatus: 'approved' | 'rejected') => {
    try {
      const storyRef = doc(db, 'character_stories', storyId);
      await updateDoc(storyRef, {
        status: newStatus,
        adminFeedback: feedback[storyId] || '',
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error("Error updating status:", error);
      alert("Failed to update status.");
    }
  };

  if (loading) {
    return <div className="text-center py-12">Loading admin dashboard...</div>;
  }

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-bold">Admin Panel</h2>
        <p className="text-gray-400">Review character stories and manage users.</p>
      </div>

      <div className="flex space-x-4 mb-6 border-b border-gray-800">
        <button
          onClick={() => setActiveTab('stories')}
          className={`pb-3 px-2 flex items-center gap-2 font-medium transition-colors ${activeTab === 'stories' ? 'text-orange-500 border-b-2 border-orange-500' : 'text-gray-400 hover:text-gray-200'}`}
        >
          <FileText className="w-4 h-4" /> Character Stories
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`pb-3 px-2 flex items-center gap-2 font-medium transition-colors ${activeTab === 'users' ? 'text-orange-500 border-b-2 border-orange-500' : 'text-gray-400 hover:text-gray-200'}`}
        >
          <Users className="w-4 h-4" /> Users
        </button>
      </div>

      {activeTab === 'stories' && (
        <div className="space-y-4">
          {stories.map(story => (
            <div key={story.id} className="bg-[#141414] border border-gray-800 rounded-xl overflow-hidden">
              {/* Header / Summary */}
              <div 
                className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-800/50 transition-colors"
                onClick={() => setExpandedId(expandedId === story.id ? null : story.id)}
              >
                <div className="flex items-center gap-4">
                  <div>
                    <h3 className="font-bold text-lg">{story.characterName}</h3>
                    <p className="text-sm text-gray-400">by {story.authorName}</p>
                  </div>
                  <StatusBadge status={story.status} />
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-gray-500">
                    {story.createdAt?.toDate ? format(story.createdAt.toDate(), 'MMM d, yyyy') : ''}
                  </span>
                  {expandedId === story.id ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
                </div>
              </div>

              {/* Expanded Content */}
              {expandedId === story.id && (
                <div className="p-6 border-t border-gray-800 bg-[#0a0a0a]">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 bg-[#141414] p-4 rounded-lg border border-gray-800">
                    <div>
                      <p className="text-xs text-gray-500 uppercase">IC Level</p>
                      <p className="font-medium">{story.icLevel}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase">IC Age</p>
                      <p className="font-medium">{story.icAge}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase">SS Stats</p>
                      <a href={story.statsImageUrl} target="_blank" rel="noreferrer" className="text-orange-500 hover:underline flex items-center gap-1 text-sm">
                        View Image <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase">SS Tab</p>
                      <a href={story.tabImageUrl} target="_blank" rel="noreferrer" className="text-orange-500 hover:underline flex items-center gap-1 text-sm">
                        View Image <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6 mb-6">
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 mb-2 uppercase tracking-wider">Original Text</h4>
                      <div className="bg-[#141414] p-4 rounded-lg border border-gray-800 text-sm text-gray-400 whitespace-pre-wrap max-h-96 overflow-y-auto">
                        {story.originalText}
                      </div>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-orange-500 mb-2 uppercase tracking-wider">AI Corrected Text</h4>
                      <div className="bg-[#141414] p-4 rounded-lg border border-orange-500/20 text-sm text-gray-200 whitespace-pre-wrap max-h-96 overflow-y-auto">
                        {story.correctedText}
                      </div>
                    </div>
                  </div>

                  <div className="bg-[#141414] p-4 rounded-lg border border-gray-800">
                    <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                      <MessageSquare className="w-4 h-4" /> Admin Feedback (Optional)
                    </label>
                    <textarea
                      rows={3}
                      value={feedback[story.id] !== undefined ? feedback[story.id] : (story.adminFeedback || '')}
                      onChange={(e) => setFeedback({ ...feedback, [story.id]: e.target.value })}
                      className="w-full bg-[#0a0a0a] border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-orange-500 transition-colors resize-y mb-4"
                      placeholder="Leave feedback for the player..."
                    />
                    
                    <div className="flex gap-3 justify-end">
                      <button
                        onClick={() => handleUpdateStatus(story.id, 'rejected')}
                        className="px-4 py-2 rounded-lg font-medium flex items-center gap-2 bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors"
                      >
                        <X className="w-4 h-4" /> Reject
                      </button>
                      <button
                        onClick={() => handleUpdateStatus(story.id, 'approved')}
                        className="px-4 py-2 rounded-lg font-medium flex items-center gap-2 bg-green-500/10 text-green-500 hover:bg-green-500/20 transition-colors"
                      >
                        <Check className="w-4 h-4" /> Approve
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
          
          {stories.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              No character stories found.
            </div>
          )}
        </div>
      )}

      {activeTab === 'users' && (
        <div className="bg-[#141414] border border-gray-800 rounded-xl overflow-hidden overflow-x-auto">
          <table className="w-full text-left text-sm min-w-[600px]">
            <thead className="bg-[#0a0a0a] border-b border-gray-800 text-gray-400 uppercase">
              <tr>
                <th className="px-6 py-4 font-medium">User</th>
                <th className="px-6 py-4 font-medium">Email</th>
                <th className="px-6 py-4 font-medium">Role</th>
                <th className="px-6 py-4 font-medium">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {users.map(u => (
                <tr key={u.id} className="hover:bg-gray-800/30 transition-colors">
                  <td className="px-6 py-4 flex items-center gap-3">
                    {u.photoURL ? (
                      <img src={u.photoURL} alt="" className="w-8 h-8 rounded-full" referrerPolicy="no-referrer" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center">
                        <Users className="w-4 h-4" />
                      </div>
                    )}
                    <span className="font-medium text-gray-200">{u.displayName || 'Unknown'}</span>
                  </td>
                  <td className="px-6 py-4 text-gray-400">{u.email}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${u.role === 'admin' ? 'bg-orange-500/10 text-orange-500 border border-orange-500/20' : 'bg-gray-800 text-gray-300'}`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-500">
                    {u.createdAt?.toDate ? format(u.createdAt.toDate(), 'MMM d, yyyy') : 'Unknown'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
