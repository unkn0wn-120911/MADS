import React, { useState, useRef, useEffect } from 'react';
import { Send, Paperclip, X, Sparkles, BookOpen, BrainCircuit, Microscope, Bot, LogOut, Menu, Trash2, Edit2, Check, ExternalLink, Download, Settings, Server, Plus, FileText, GraduationCap, ChevronRight, Mic, Camera, Image as ImageIcon, MessageSquare } from 'lucide-react';
import { cn } from './lib/utils';
import MessageItem from './components/MessageItem';
import ChatInput, { ChatInputHandle } from './components/ChatInput';
import MessageList from './components/MessageList';
import AuthScreen from './components/AuthScreen';
import MadsLogo from './components/MadsLogo';
import { LearningPathView } from './components/LearningPathView';
import { CommunityNotesView } from './components/CommunityNotesView';
import { useChat } from './hooks/useChat';
import { motion, AnimatePresence } from 'motion/react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

const App: React.FC = () => {
  const { 
    user,
    login,
    signup,
    logout,
    messages, 
    sendMessage, 
    deleteConversation,
    renameConversation,
    isLoading, 
    error,
    clearError,
    conversations, 
    currentConversationId, 
    setCurrentConversationId,
    startNewConversation,
    knowledge,
    uploadToLibrary,
    addBiologyBookContent,
    trainPhysics,
    seedDatabase,
    isAdmin,
    submitFeedback,
    groqApiKey,
    updateGroqApiKey,
    localMemory,
    updateLocalMemory,
    clearLocalMemory,
    deleteKnowledge,
    performResearch,
    learningPaths,
    activePath,
    setActivePath,
    activeSteps,
    createLearningPath,
    updateStepStatus,
    deleteLearningPath
  } = useChat();
  
  const [showSettings, setShowSettings] = useState(false);
  const [showCommunityNotes, setShowCommunityNotes] = useState(false);
  const [showLearningPath, setShowLearningPath] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [shareNoteData, setShareNoteData] = useState<{ topic: string, content: string } | null>(null);
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => window.innerWidth >= 768);

  // Handle window resize for sidebar
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setIsSidebarOpen(false);
      } else {
        setIsSidebarOpen(true);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [activeSubject, setActiveSubject] = useState<'GENERAL' | 'PHYSICS' | 'CHEMISTRY' | 'BIOLOGY' | 'PROGRAMMING'>('GENERAL');
  const [tempGroqKey, setTempGroqKey] = useState('');

  const chatInputRef = useRef<ChatInputHandle>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setTempGroqKey(groqApiKey);
  }, [groqApiKey]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading]);

  if (!user) {
    return <AuthScreen onLogin={login} onSignup={signup} />;
  }

  const handleSend = async (text: string, files: { data: string; mimeType: string; name: string }[]) => {
    if ((!text.trim() && files.length === 0) || isLoading) return;
    await sendMessage(text, files.map(f => ({ data: f.data, mimeType: f.mimeType })));
  };

  const saveRename = async (id: string) => {
    if (editTitle.trim()) {
      await renameConversation(id, editTitle);
    }
    setEditingId(null);
  };

  const handleShareToCommunity = (topic: string, content: string) => {
    setShareNoteData({ topic, content });
    setShowCommunityNotes(true);
  };

  return (
    <div className="flex h-screen bg-[#f9fafb] text-gray-900 overflow-hidden font-sans relative">
      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-gray-900/20 backdrop-blur-sm z-40 md:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <AnimatePresence mode="wait">
        {isSidebarOpen && (
          <motion.aside
            initial={{ x: -320, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -320, opacity: 0 }}
            className="absolute md:relative inset-y-0 left-0 w-[280px] sm:w-80 bg-gray-50 border-r border-gray-200 flex flex-col z-50 shrink-0 shadow-2xl md:shadow-none h-full"
          >
            {/* Sidebar Header */}
            <div className="p-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <MadsLogo size="sm" />
                <span className="text-xl font-bold tracking-tight text-gray-900">MADS</span>
              </div>
              <button 
                onClick={() => setIsSidebarOpen(false)}
                className="p-2 hover:bg-gray-200 rounded-xl transition-colors text-gray-500"
              >
                <X size={20} />
              </button>
            </div>

            {/* New Session Button */}
            <div className="px-6 mb-6">
              <button 
                onClick={startNewConversation}
                className="w-full py-3 px-4 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300 transition-all flex items-center justify-center gap-2 shadow-sm text-gray-700 font-medium"
              >
                <Plus size={18} className="text-blue-600" />
                <span>New Chat</span>
              </button>
            </div>

            {/* Recent Conversations */}
            <div className="flex-1 overflow-y-auto px-4 custom-scrollbar">
              <div className="flex items-center justify-between px-2 mb-3">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Recent</span>
              </div>
              
              <div className="space-y-1">
                {conversations.map((conv) => (
                  <div key={conv.id} className="group relative">
                    <button
                      onClick={() => {
                        setCurrentConversationId(conv.id);
                        if (window.innerWidth < 768) setIsSidebarOpen(false);
                      }}
                      className={cn(
                        "w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-200 text-left pr-10",
                        currentConversationId === conv.id 
                          ? "bg-blue-50 text-blue-700" 
                          : "hover:bg-gray-100 text-gray-700"
                      )}
                    >
                      <MessageSquare size={16} className={currentConversationId === conv.id ? "text-blue-600" : "text-gray-400"} />
                      <div className="flex-1 truncate">
                        <div className="text-sm font-medium truncate">{conv.title}</div>
                      </div>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteConversation(conv.id);
                      }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                      title="Delete conversation"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Sidebar Footer - Profile Card */}
            <div className="p-4 mt-auto border-t border-gray-200 relative">
              <div 
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer" 
                onClick={() => setShowProfileMenu(!showProfileMenu)}
              >
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-sm">
                  {user.name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-gray-900 truncate">{user.name}</div>
                  <div className="text-xs text-gray-500 truncate">{user.email}</div>
                </div>
              </div>

              {/* Profile Dropdown Menu */}
              <AnimatePresence>
                {showProfileMenu && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute bottom-full left-4 right-4 mb-2 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden z-50"
                  >
                    <div className="p-3 border-b border-gray-100">
                      <div className="text-sm font-semibold text-gray-900 truncate">{user.name}</div>
                      <div className="text-xs text-gray-500 truncate">{user.email}</div>
                    </div>
                    <div className="p-1.5">
                      <button 
                        onClick={() => {
                          setShowProfileMenu(false);
                          setShowSettings(true);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors text-left"
                      >
                        <Settings size={16} />
                        Settings
                      </button>
                      <button 
                        onClick={() => {
                          setShowProfileMenu(false);
                          logout();
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors text-left"
                      >
                        <LogOut size={16} />
                        Log out
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative overflow-hidden min-w-0 bg-white w-full">
        {/* Header */}
        <header className="h-16 border-b border-gray-200 flex items-center justify-between px-4 sm:px-6 bg-white/80 backdrop-blur-md z-30 shrink-0">
          <div className="flex items-center gap-3 overflow-hidden">
            {!isSidebarOpen && (
              <button 
                onClick={() => setIsSidebarOpen(true)}
                className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-600 shrink-0"
              >
                <Menu size={20} />
              </button>
            )}
            <div className="font-medium text-gray-800 truncate">
              {conversations.find(c => c.id === currentConversationId)?.title || "New Chat"}
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <button 
              onClick={() => setShowLearningPath(!showLearningPath)}
              className={cn(
                "flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 border rounded-lg text-sm font-medium transition-all",
                showLearningPath 
                  ? "bg-indigo-50 border-indigo-200 text-indigo-700" 
                  : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
              )}
            >
              <GraduationCap size={16} />
              <span className="hidden sm:inline">Paths</span>
            </button>

            <button 
              onClick={() => setShowCommunityNotes(true)}
              className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 bg-blue-50 border border-blue-100 rounded-lg text-sm font-medium text-blue-700 hover:bg-blue-100 transition-all"
            >
              <MessageSquare size={16} />
              <span className="hidden sm:inline">Community</span>
            </button>
            
            <button className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-all shadow-sm">
              <Download size={16} />
              <span className="hidden sm:inline">Export</span>
            </button>
          </div>
        </header>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto relative custom-scrollbar">
          {messages.length === 0 ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-8">
              <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-600 mb-6 shadow-sm">
                <Sparkles size={32} />
              </div>
              <h2 className="text-2xl font-semibold mb-2 text-gray-900">How can I help you today?</h2>
              <p className="text-gray-500 text-center max-w-md mb-8">
                I can help you learn new topics, write code, or answer questions.
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 w-full max-w-2xl px-4 sm:px-0">
                {[
                  { icon: <Bot size={18} />, title: "Explain quantum computing", desc: "in simple terms" },
                  { icon: <FileText size={18} />, title: "Write a React component", desc: "for a user profile" },
                  { icon: <Microscope size={18} />, title: "Analyze this data", desc: "and find trends" },
                  { icon: <GraduationCap size={18} />, title: "Create a study plan", desc: "for learning Python" }
                ].map((suggestion, i) => (
                  <button 
                    key={i}
                    onClick={() => handleSend(`${suggestion.title} ${suggestion.desc}`, [])}
                    className="p-3 sm:p-4 rounded-xl border border-gray-200 bg-white hover:border-blue-300 hover:shadow-md transition-all text-left flex items-start gap-3 group"
                  >
                    <div className="p-2 bg-gray-50 rounded-lg text-gray-500 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                      {suggestion.icon}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{suggestion.title}</div>
                      <div className="text-sm text-gray-500">{suggestion.desc}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="max-w-4xl mx-auto py-4 sm:py-8 px-2 sm:px-6 lg:px-8 w-full">
              <MessageList 
                messages={messages} 
                isLoading={isLoading} 
                submitFeedback={submitFeedback} 
                performResearch={performResearch} 
                onShareToCommunity={handleShareToCommunity}
              />
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="p-4 bg-white border-t border-gray-100">
          <div className="max-w-4xl mx-auto">
            <ChatInput 
              ref={chatInputRef}
              onSend={handleSend} 
              isLoading={isLoading} 
            />
            <div className="text-center mt-2 text-xs text-gray-400">
              AI can make mistakes. Consider verifying important information.
            </div>
          </div>
        </div>
      </main>

      {/* Right Sidebar (Learning Paths) Overlay */}
      <AnimatePresence>
        {showLearningPath && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowLearningPath(false)}
            className="fixed inset-0 bg-gray-900/20 backdrop-blur-sm z-40 xl:hidden"
          />
        )}
      </AnimatePresence>

      {/* Right Sidebar (Learning Paths) */}
      <AnimatePresence>
        {showLearningPath && (
          <motion.aside
            initial={{ x: 320, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 320, opacity: 0 }}
            className="absolute xl:relative right-0 inset-y-0 w-[280px] sm:w-80 border-l border-gray-200 bg-gray-50 flex flex-col z-50 shrink-0 shadow-2xl xl:shadow-none h-full"
          >
            <LearningPathView 
              paths={learningPaths}
              activePath={activePath}
              activeSteps={activeSteps}
              onSetActivePath={setActivePath}
              onCreatePath={handleCreateLearningPath}
              onUpdateStep={handleUpdateStepStatus}
              onDeletePath={handleDeleteLearningPath}
              isLoading={isLoading}
            />
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Community Notes Modal */}
      <AnimatePresence>
        {showCommunityNotes && (
          <CommunityNotesView 
            onClose={() => {
              setShowCommunityNotes(false);
              setShareNoteData(null);
            }} 
            initialTopic={shareNoteData?.topic}
            initialContent={shareNoteData?.content}
          />
        )}
      </AnimatePresence>

      {/* Settings Modal */}
      <AnimatePresence>
        {showSettings && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSettings(false)}
              className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-2xl shadow-xl p-6 border border-gray-100"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Settings</h2>
                <button onClick={() => setShowSettings(false)} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Groq API Key</label>
                  <div className="flex gap-2">
                    <input 
                      type="password"
                      value={tempGroqKey}
                      onChange={(e) => setTempGroqKey(e.target.value)}
                      placeholder="gsk_..."
                      className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                    />
                    <button 
                      onClick={() => {
                        updateGroqApiKey(tempGroqKey);
                        setShowSettings(false);
                      }}
                      className="px-4 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-all flex items-center justify-center"
                    >
                      <Check size={20} />
                    </button>
                  </div>
                </div>

                {isAdmin && (
                  <div className="pt-6 border-t border-gray-100 space-y-4">
                    <div className="text-sm font-medium text-gray-700">Admin Controls</div>
                    <button 
                      onClick={seedDatabase}
                      className="w-full py-2.5 bg-red-50 text-red-600 border border-red-100 rounded-xl text-sm font-medium hover:bg-red-100 transition-all"
                    >
                      Seed Knowledge Base
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default App;
