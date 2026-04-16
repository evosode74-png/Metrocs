import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { collection, query, where, onSnapshot, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebase';
import { Link } from 'react-router-dom';
import { FileText, Plus, Clock, CheckCircle, XCircle } from 'lucide-react';
import { format } from 'date-fns';

export default function Dashboard() {
  const { user } = useAuth();
  const [stories, setStories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'character_stories'),
      where('authorUid', '==', user.uid),
      orderBy('createdAt', 'desc'),
      limit(10)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setStories(docs);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching stories:", error);
      setLoading(false);
    });

    return unsubscribe;
  }, [user]);

  if (loading) {
    return <div className="text-center py-12">Loading your stories...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-bold">My Character Stories</h2>
          <p className="text-gray-400">Manage and track your submitted stories.</p>
        </div>
        <Link 
          to="/submit" 
          className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors"
        >
          <Plus className="w-4 h-4" /> New Story
        </Link>
      </div>

      {stories.length === 0 ? (
        <div className="bg-[#141414] border border-gray-800 rounded-2xl p-12 text-center">
          <FileText className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">No stories yet</h3>
          <p className="text-gray-400 mb-6">You haven't submitted any character stories.</p>
          <Link to="/submit" className="text-orange-500 hover:text-orange-400 font-medium">
            Submit your first story &rarr;
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {stories.map(story => (
            <div key={story.id} className="bg-[#141414] border border-gray-800 rounded-xl p-6 flex flex-col md:flex-row gap-6">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-lg font-bold">{story.characterName}</h3>
                  <StatusBadge status={story.status} />
                </div>
                <p className="text-sm text-gray-400 mb-4">
                  Submitted on {story.createdAt?.toDate ? format(story.createdAt.toDate(), 'PPP') : 'Unknown'}
                </p>
                <div className="bg-[#0a0a0a] p-4 rounded-lg border border-gray-800">
                  <h4 className="text-sm font-medium text-gray-500 mb-2 uppercase tracking-wider">Corrected Text</h4>
                  <p className="text-gray-300 text-sm whitespace-pre-wrap line-clamp-3">
                    {story.correctedText}
                  </p>
                </div>
              </div>
              
              {story.adminFeedback && (
                <div className="md:w-1/3 bg-orange-500/5 border border-orange-500/20 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-orange-500 mb-2">Admin Feedback</h4>
                  <p className="text-sm text-gray-300 whitespace-pre-wrap">{story.adminFeedback}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case 'pending':
      return <span className="flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full bg-yellow-500/10 text-yellow-500 border border-yellow-500/20"><Clock className="w-3 h-3" /> Pending</span>;
    case 'approved':
      return <span className="flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full bg-green-500/10 text-green-500 border border-green-500/20"><CheckCircle className="w-3 h-3" /> Approved</span>;
    case 'rejected':
      return <span className="flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full bg-red-500/10 text-red-500 border border-red-500/20"><XCircle className="w-3 h-3" /> Rejected</span>;
    default:
      return null;
  }
}
