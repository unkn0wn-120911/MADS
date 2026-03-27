import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { collection, query, orderBy, limit, getDocs, addDoc, serverTimestamp, doc, getDoc, setDoc, deleteDoc, runTransaction } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { ThumbsUp, MessageSquare, User, Clock, Search, X, Plus } from 'lucide-react';
import Markdown from 'react-markdown';
import { cn } from '../lib/utils';

interface SharedNote {
  id: string;
  userId: string;
  authorName: string;
  topic: string;
  content: string;
  upvotes: number;
  createdAt: any;
}

export const CommunityNotesView: React.FC<{ 
  onClose: () => void;
  initialTopic?: string;
  initialContent?: string;
}> = ({ onClose, initialTopic = '', initialContent = '' }) => {
  const [notes, setNotes] = useState<SharedNote[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreating, setIsCreating] = useState(!!initialTopic || !!initialContent);
  const [newTopic, setNewTopic] = useState(initialTopic);
  const [newContent, setNewContent] = useState(initialContent);
  const [userVotes, setUserVotes] = useState<Record<string, number>>({});

  useEffect(() => {
    fetchNotes();
  }, []);

  const fetchNotes = async () => {
    setIsLoading(true);
    try {
      const q = query(collection(db, 'sharedNotes'), orderBy('upvotes', 'desc'), limit(50));
      const snapshot = await getDocs(q);
      const fetchedNotes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SharedNote));
      setNotes(fetchedNotes);

      // Fetch user votes
      if (auth.currentUser) {
        const votes: Record<string, number> = {};
        for (const note of fetchedNotes) {
          const voteId = `${auth.currentUser.uid}_${note.id}`;
          const voteDoc = await getDoc(doc(db, 'sharedNoteVotes', voteId));
          if (voteDoc.exists()) {
            votes[note.id] = voteDoc.data().value;
          }
        }
        setUserVotes(votes);
      }
    } catch (error) {
      console.error('Error fetching shared notes:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateNote = async () => {
    if (!newTopic.trim() || !newContent.trim() || !auth.currentUser) return;
    
    try {
      const noteData = {
        userId: auth.currentUser.uid,
        authorName: auth.currentUser.displayName || 'Anonymous User',
        topic: newTopic,
        content: newContent,
        upvotes: 0,
        createdAt: serverTimestamp()
      };
      
      const docRef = await addDoc(collection(db, 'sharedNotes'), noteData);
      setNotes([{ id: docRef.id, ...noteData, createdAt: new Date() } as SharedNote, ...notes]);
      setIsCreating(false);
      setNewTopic('');
      setNewContent('');
    } catch (error) {
      console.error('Error creating shared note:', error);
    }
  };

  const handleVote = async (noteId: string, value: number) => {
    if (!auth.currentUser) return;
    
    const voteId = `${auth.currentUser.uid}_${noteId}`;
    const voteRef = doc(db, 'sharedNoteVotes', voteId);
    const noteRef = doc(db, 'sharedNotes', noteId);
    
    try {
      await runTransaction(db, async (transaction) => {
        const noteDoc = await transaction.get(noteRef);
        if (!noteDoc.exists()) throw new Error("Note does not exist!");
        
        const currentVote = userVotes[noteId] || 0;
        
        if (currentVote === value) {
          // Remove vote
          transaction.delete(voteRef);
          transaction.update(noteRef, { upvotes: noteDoc.data().upvotes - value });
          setUserVotes(prev => {
            const next = { ...prev };
            delete next[noteId];
            return next;
          });
          setNotes(prev => prev.map(n => n.id === noteId ? { ...n, upvotes: n.upvotes - value } : n));
        } else {
          // Add or change vote
          const voteDiff = value - currentVote;
          transaction.set(voteRef, {
            userId: auth.currentUser!.uid,
            noteId: noteId,
            value: value
          });
          transaction.update(noteRef, { upvotes: noteDoc.data().upvotes + voteDiff });
          setUserVotes(prev => ({ ...prev, [noteId]: value }));
          setNotes(prev => prev.map(n => n.id === noteId ? { ...n, upvotes: n.upvotes + voteDiff } : n));
        }
      });
    } catch (error) {
      console.error('Error voting on note:', error);
    }
  };

  const filteredNotes = notes.filter(note => 
    note.topic.toLowerCase().includes(searchQuery.toLowerCase()) || 
    note.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-gray-50 text-gray-900">
      <header className="border-b border-gray-200 flex flex-col sm:flex-row items-start sm:items-center justify-between px-4 sm:px-6 py-3 sm:py-0 sm:h-16 bg-white/80 backdrop-blur-md shrink-0 gap-3 sm:gap-0">
        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-100 border border-blue-200 flex items-center justify-center text-blue-600">
              <MessageSquare size={18} />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">Community Notes</h1>
              <p className="text-xs text-gray-500">Collaborative Learning Hub</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 sm:hidden hover:bg-gray-100 rounded-lg transition-colors text-gray-500 hover:text-gray-900"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-none">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text"
              placeholder="Search topics..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-gray-100 border border-transparent rounded-full pl-9 pr-4 py-1.5 text-sm text-gray-900 outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all w-full sm:w-64"
            />
          </div>
          <button 
            onClick={() => setIsCreating(true)}
            className="flex items-center justify-center gap-1.5 px-3 sm:px-4 py-1.5 bg-blue-600 text-white rounded-full font-medium text-sm hover:bg-blue-700 transition-all shadow-sm whitespace-nowrap"
          >
            <Plus size={16} />
            <span className="hidden sm:inline">Share Note</span>
          </button>
          <button 
            onClick={onClose}
            className="hidden sm:block p-1.5 hover:bg-gray-100 rounded-lg transition-colors text-gray-500 hover:text-gray-900"
          >
            <X size={20} />
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 custom-scrollbar">
        <div className="max-w-4xl mx-auto">
          {isCreating && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl p-4 sm:p-6 mb-8 border border-blue-200 shadow-sm"
            >
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Share a New Note</h2>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1.5 block">Topic</label>
                  <input 
                    type="text"
                    value={newTopic}
                    onChange={(e) => setNewTopic(e.target.value)}
                    placeholder="E.g., Quantum Entanglement Explained"
                    className="w-full bg-white border border-gray-300 rounded-xl px-4 py-2.5 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1.5 block">Content (Markdown supported)</label>
                  <textarea 
                    value={newContent}
                    onChange={(e) => setNewContent(e.target.value)}
                    placeholder="Write your explanation here..."
                    rows={6}
                    className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all resize-none"
                  />
                </div>
                <div className="flex justify-end gap-3 mt-6">
                  <button 
                    onClick={() => setIsCreating(false)}
                    className="px-4 py-2 rounded-xl text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleCreateNote}
                    disabled={!newTopic.trim() || !newContent.trim()}
                    className="px-6 py-2 bg-blue-600 text-white rounded-xl font-medium text-sm hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                  >
                    Publish Note
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {isLoading ? (
            <div className="flex justify-center py-20">
              <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filteredNotes.length === 0 ? (
            <div className="text-center py-20 text-gray-400">
              <MessageSquare size={48} className="mx-auto mb-4 opacity-20" />
              <p className="text-lg font-semibold text-gray-900">No notes found</p>
              <p className="text-sm">Be the first to share your knowledge!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              {filteredNotes.map((note) => (
                <motion.div 
                  key={note.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-white border border-gray-200 rounded-2xl p-4 sm:p-6 flex flex-col shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">{note.topic}</h3>
                    <div className="flex items-center gap-1 bg-gray-50 border border-gray-100 rounded-full px-3 py-1">
                      <button 
                        onClick={() => handleVote(note.id, 1)}
                        className={cn("p-1 rounded-full transition-colors", userVotes[note.id] === 1 ? "text-blue-600" : "text-gray-400 hover:text-gray-600")}
                      >
                        <ThumbsUp size={14} />
                      </button>
                      <span className="text-xs font-semibold w-4 text-center text-gray-700">{note.upvotes}</span>
                    </div>
                  </div>
                  
                  <div className="prose prose-slate prose-sm max-w-none flex-1 mb-6 overflow-hidden relative text-gray-600">
                    <div className="max-h-40 overflow-hidden">
                      <Markdown>{note.content}</Markdown>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-white to-transparent" />
                  </div>
                  
                  <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-100">
                    <div className="flex items-center gap-2 text-gray-500">
                      <User size={14} />
                      <span className="text-xs font-medium">{note.authorName}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-500">
                      <Clock size={14} />
                      <span className="text-xs font-medium">
                        {note.createdAt?.toDate ? note.createdAt.toDate().toLocaleDateString() : 'Just now'}
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};
