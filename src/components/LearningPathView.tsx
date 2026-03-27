import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BookOpen, 
  CheckCircle2, 
  Circle, 
  Lock, 
  Plus, 
  Trash2, 
  ChevronRight, 
  GraduationCap,
  ExternalLink,
  BrainCircuit
} from 'lucide-react';
import { LearningPath, LearningStep } from '../hooks/useChat';

interface LearningPathViewProps {
  paths: LearningPath[];
  activePath: LearningPath | null;
  activeSteps: LearningStep[];
  onSetActivePath: (path: LearningPath | null) => void;
  onCreatePath: (goal: string, level: 'beginner' | 'intermediate' | 'advanced') => Promise<void>;
  onUpdateStep: (pathId: string, stepId: string, status: 'locked' | 'available' | 'completed') => Promise<void>;
  onDeletePath: (id: string) => Promise<void>;
  isLoading: boolean;
}

export const LearningPathView: React.FC<LearningPathViewProps> = ({
  paths,
  activePath,
  activeSteps,
  onSetActivePath,
  onCreatePath,
  onUpdateStep,
  onDeletePath,
  isLoading
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [newGoal, setNewGoal] = useState('');
  const [newLevel, setNewLevel] = useState<'beginner' | 'intermediate' | 'advanced'>('beginner');

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGoal.trim()) return;
    await onCreatePath(newGoal, newLevel);
    setIsCreating(false);
    setNewGoal('');
  };

  if (activePath) {
    return (
      <div className="flex flex-col h-full bg-white/50 backdrop-blur-sm rounded-2xl border border-white/20 overflow-hidden">
        <div className="p-4 border-b border-black/5 flex items-center justify-between bg-gradient-to-r from-indigo-500/10 to-purple-500/10">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => onSetActivePath(null)}
              className="p-2 hover:bg-black/5 rounded-full transition-colors"
            >
              <ChevronRight className="w-5 h-5 rotate-180" />
            </button>
            <div>
              <h2 className="font-bold text-gray-900 line-clamp-1">{activePath.goal}</h2>
              <span className="text-xs font-medium uppercase tracking-wider text-indigo-600">{activePath.level}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${
              activePath.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
            }`}>
              {activePath.status}
            </span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {activeSteps.map((step, index) => (
            <motion.div 
              key={step.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`relative pl-8 pb-6 last:pb-0 ${
                index !== activeSteps.length - 1 ? 'border-l-2 border-dashed border-gray-200' : ''
              }`}
            >
              <div className={`absolute left-[-11px] top-0 w-5 h-5 rounded-full flex items-center justify-center z-10 ${
                step.status === 'completed' ? 'bg-green-500 text-white' :
                step.status === 'available' ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-200' :
                'bg-gray-200 text-gray-400'
              }`}>
                {step.status === 'completed' ? <CheckCircle2 className="w-3 h-3" /> :
                 step.status === 'available' ? <Circle className="w-3 h-3 fill-current" /> :
                 <Lock className="w-3 h-3" />}
              </div>

              <div className={`p-4 rounded-xl border transition-all ${
                step.status === 'locked' ? 'bg-gray-50 border-gray-100 opacity-60' :
                step.status === 'completed' ? 'bg-green-50/30 border-green-100' :
                'bg-white border-indigo-100 shadow-sm'
              }`}>
                <h3 className="font-bold text-gray-900 mb-2">{step.title}</h3>
                
                {step.status !== 'locked' && (
                  <div className="space-y-4">
                    <p className="text-sm text-gray-600 leading-relaxed">{step.explanation}</p>
                    
                    {step.practiceProblem && (
                      <div className="p-3 bg-indigo-50/50 rounded-lg border border-indigo-100/50">
                        <div className="flex items-center gap-2 mb-2">
                          <BrainCircuit className="w-4 h-4 text-indigo-600" />
                          <span className="text-xs font-bold text-indigo-600 uppercase">Practice Problem</span>
                        </div>
                        <p className="text-sm text-gray-700 italic">{step.practiceProblem}</p>
                      </div>
                    )}

                    {step.resources && step.resources.length > 0 && (
                      <div className="space-y-2">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Resources</span>
                        <div className="flex flex-wrap gap-2">
                          {step.resources.map((res, i) => (
                            <div key={i} className="flex items-center gap-1 px-2 py-1 bg-gray-100 rounded text-[11px] text-gray-600">
                              <ExternalLink className="w-3 h-3" />
                              {res}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {step.status === 'available' && (
                      <button 
                        onClick={() => onUpdateStep(activePath.id, step.id, 'completed')}
                        className="w-full py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        Mark as Completed
                      </button>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white/50 backdrop-blur-sm rounded-2xl border border-white/20 overflow-hidden">
      <div className="p-4 border-b border-black/5 flex items-center justify-between bg-gradient-to-r from-indigo-500/10 to-purple-500/10">
        <div className="flex items-center gap-2">
          <GraduationCap className="w-5 h-5 text-indigo-600" />
          <h2 className="font-bold text-gray-900">Learning Paths</h2>
        </div>
        <button 
          onClick={() => setIsCreating(true)}
          className="p-2 hover:bg-black/5 rounded-full transition-colors text-indigo-600"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        <AnimatePresence>
          {isCreating && (
            <motion.form 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              onSubmit={handleCreate}
              className="p-4 bg-white rounded-xl border border-indigo-100 shadow-sm space-y-4 mb-4"
            >
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">What do you want to learn?</label>
                <input 
                  type="text"
                  value={newGoal}
                  onChange={(e) => setNewGoal(e.target.value)}
                  placeholder="e.g. Quantum Mechanics, React.js, Organic Chemistry"
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Level</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['beginner', 'intermediate', 'advanced'] as const).map((lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => setNewLevel(lvl)}
                      className={`py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${
                        newLevel === lvl ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                <button 
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="flex-1 py-2 text-gray-500 text-sm font-bold hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={isLoading || !newGoal.trim()}
                  className="flex-1 py-2 bg-indigo-600 text-white text-sm font-bold rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
                >
                  {isLoading ? 'Generating...' : 'Start Path'}
                </button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>

        {paths.length === 0 && !isCreating ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mb-4">
              <BookOpen className="w-8 h-8 text-indigo-200" />
            </div>
            <h3 className="text-gray-900 font-bold mb-1">No learning paths yet</h3>
            <p className="text-sm text-gray-500 max-w-[200px]">Create a path to start your personalized learning journey.</p>
          </div>
        ) : (
          paths.map((path) => (
            <motion.div 
              key={path.id}
              layout
              className="group relative bg-white p-4 rounded-xl border border-gray-100 hover:border-indigo-200 hover:shadow-sm transition-all cursor-pointer"
              onClick={() => onSetActivePath(path)}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900 line-clamp-1 group-hover:text-indigo-600 transition-colors">{path.goal}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] font-bold uppercase text-gray-400">{path.level}</span>
                    <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                    <span className={`text-[10px] font-bold uppercase ${
                      path.status === 'completed' ? 'text-green-500' : 'text-blue-500'
                    }`}>{path.status}</span>
                  </div>
                </div>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeletePath(path.id);
                  }}
                  className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <div className="flex items-center justify-between text-[11px] text-gray-500">
                <span>Created {new Date(path.createdAt?.seconds * 1000).toLocaleDateString()}</span>
                <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all" />
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};
