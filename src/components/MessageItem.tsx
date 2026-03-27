import React, { useState, useMemo } from 'react';
import { Message } from '../hooks/useChat';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { 
  Copy, 
  Check, 
  Play, 
  ThumbsUp, 
  ThumbsDown, 
  Share2, 
  Search, 
  ExternalLink,
  BrainCircuit,
  Microscope,
  Bot,
  Code2,
  Eye
} from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts';

interface MessageItemProps {
  message: Message;
  onFeedback?: (id: string, isPositive: boolean) => void;
  onResearch?: (id: string, query: string) => void;
  onShareToCommunity?: (topic: string, content: string) => void;
}

const MessageItem: React.FC<MessageItemProps> = ({ message, onFeedback, onResearch, onShareToCommunity }) => {
  const isBot = message.role === 'model';
  const [copied, setCopied] = useState(false);
  const [feedback, setFeedback] = useState<'positive' | 'negative' | null>(null);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFeedback = (isPositive: boolean) => {
    setFeedback(isPositive ? 'positive' : 'negative');
    if (onFeedback) onFeedback(message.id, isPositive);
  };

  // Helper to extract charts from markdown
  const chartData = useMemo(() => {
    const chartRegex = /```chart\s+([\s\S]*?)```/g;
    const match = chartRegex.exec(message.content);
    if (match) {
      try {
        return JSON.parse(match[1]);
      } catch (e) {
        return null;
      }
    }
    return null;
  }, [message.content]);

  const cleanContent = message.content.replace(/```chart\s+[\s\S]*?```/g, '');

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "py-4 px-2 sm:px-6 flex gap-3 sm:gap-6 group w-full",
        !isBot && "flex-row-reverse"
      )}
    >
      {/* Avatar */}
      <div className="shrink-0 mt-1">
        <div className={cn(
          "w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold shadow-sm",
          isBot 
            ? "bg-blue-600 text-white ring-4 ring-blue-50" 
            : "bg-gray-800 text-white ring-4 ring-gray-50"
        )}>
          {isBot ? <BrainCircuit size={16} /> : "U"}
        </div>
      </div>

      {/* Content */}
      <div className={cn(
        "flex flex-col gap-1.5 min-w-0",
        !isBot ? "items-end max-w-[90%] sm:max-w-[85%]" : "items-start w-full"
      )}>
        <div className={cn(
          "flex items-center gap-2",
          !isBot && "flex-row-reverse"
        )}>
          <span className="text-sm font-semibold text-gray-900">
            {isBot ? "MADS" : "You"}
          </span>
          <span className="text-xs text-gray-400">
            {message.createdAt ? new Date(message.createdAt.seconds ? message.createdAt.toDate() : message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
          </span>
        </div>

        <div className={cn(
          "prose max-w-none text-[15px] leading-relaxed break-words overflow-hidden",
          isBot ? "message-bot w-full" : "message-user"
        )}>
          <Markdown
            remarkPlugins={[remarkGfm, remarkMath]}
            rehypePlugins={[rehypeKatex]}
            components={{
              code({ node, inline, className, children, ...props }: any) {
                const match = /language-(\w+)/.exec(className || '');
                const language = match ? match[1] : '';
                
                // State for code preview toggle
                const [showPreview, setShowPreview] = useState(false);
                const isWebCode = language === 'html' || language === 'xml' || language === 'svg';
                
                if (!inline && language) {
                  return (
                    <div className="relative group/code my-4 rounded-xl overflow-hidden border border-gray-200/20 bg-gray-900 shadow-sm max-w-full">
                      <div className="flex items-center justify-between px-4 py-2 bg-gray-800 border-b border-gray-700">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-gray-400">{language}</span>
                          {isWebCode && (
                            <div className="flex items-center bg-gray-700/50 rounded-lg p-0.5 ml-2">
                              <button
                                onClick={() => setShowPreview(false)}
                                className={cn(
                                  "px-2 py-1 text-[10px] font-medium rounded-md transition-all flex items-center gap-1",
                                  !showPreview ? "bg-gray-600 text-white shadow-sm" : "text-gray-400 hover:text-gray-200"
                                )}
                              >
                                <Code2 size={12} /> Code
                              </button>
                              <button
                                onClick={() => setShowPreview(true)}
                                className={cn(
                                  "px-2 py-1 text-[10px] font-medium rounded-md transition-all flex items-center gap-1",
                                  showPreview ? "bg-gray-600 text-white shadow-sm" : "text-gray-400 hover:text-gray-200"
                                )}
                              >
                                <Eye size={12} /> Preview
                              </button>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleCopy(String(children))}
                            className="p-1.5 hover:bg-gray-700 rounded-md text-gray-400 hover:text-white transition-all"
                          >
                            {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
                          </button>
                        </div>
                      </div>
                      
                      {showPreview && isWebCode ? (
                        <div className="bg-white p-4 overflow-auto max-h-[500px] w-full">
                          <iframe 
                            srcDoc={String(children)} 
                            title="Code Preview" 
                            className="w-full min-h-[300px] border-0 rounded-md bg-white"
                            sandbox="allow-scripts"
                          />
                        </div>
                      ) : (
                        <div className="overflow-x-auto max-w-full">
                          <SyntaxHighlighter
                            style={vscDarkPlus}
                            language={language}
                            PreTag="div"
                            className="!bg-transparent !m-0 !p-4 !text-sm font-mono min-w-full"
                            {...props}
                          >
                            {String(children).replace(/\n$/, '')}
                          </SyntaxHighlighter>
                        </div>
                      )}
                    </div>
                  );
                }
                return <code className={cn(
                  "px-1.5 py-0.5 rounded-md text-sm font-mono",
                  isBot ? "bg-gray-100 text-blue-600" : "bg-blue-700 text-blue-50"
                )} {...props}>{children}</code>;
              }
            }}
          >
            {cleanContent}
          </Markdown>
        </div>

        {/* Charts */}
        {chartData && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mt-6 p-6 bg-white border border-gray-200 rounded-2xl shadow-sm"
          >
            <div className="flex items-center justify-between mb-6">
              <h4 className="text-sm font-semibold text-gray-900">{chartData.title || 'Data Visualization'}</h4>
            </div>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                {chartData.type === 'bar' ? (
                  <BarChart data={chartData.data}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                    <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      itemStyle={{ color: '#2563eb' }}
                    />
                    <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                ) : chartData.type === 'line' ? (
                  <LineChart data={chartData.data}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                    <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      itemStyle={{ color: '#2563eb' }}
                    />
                    <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={3} dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }} activeDot={{ r: 6, strokeWidth: 0 }} />
                  </LineChart>
                ) : (
                  <PieChart>
                    <Pie
                      data={chartData.data}
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {chartData.data.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#3b82f6' : 'rgba(59,130,246,0.2)'} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    />
                  </PieChart>
                )}
              </ResponsiveContainer>
            </div>
          </motion.div>
        )}

        {/* Actions */}
        {isBot && (
          <div className="mt-4 sm:mt-6 flex flex-wrap items-center justify-between pt-4 border-t border-gray-100 gap-2">
            <div className="flex items-center gap-1 sm:gap-2">
              <button 
                onClick={() => handleFeedback(true)}
                className={cn(
                  "px-2 sm:px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 text-xs font-medium",
                  feedback === 'positive' ? "bg-blue-50 text-blue-600" : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                )}
              >
                <ThumbsUp size={14} />
                <span className="hidden sm:inline">Helpful</span>
              </button>
              <button 
                onClick={() => handleFeedback(false)}
                className={cn(
                  "p-1.5 rounded-lg transition-all flex items-center gap-1.5 text-xs font-medium",
                  feedback === 'negative' ? "bg-red-50 text-red-600" : "text-gray-500 hover:text-red-600 hover:bg-red-50"
                )}
              >
                <ThumbsDown size={14} />
              </button>
            </div>

            <div className="flex items-center gap-1 sm:gap-2">
              <button 
                onClick={() => onResearch && onResearch(message.id, message.content.slice(0, 100))}
                className="px-2 sm:px-3 py-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all flex items-center gap-1.5 text-xs font-medium"
              >
                <Search size={14} />
                <span className="hidden sm:inline">Deep Research</span>
              </button>
              <button 
                onClick={() => onShareToCommunity && onShareToCommunity('Shared Note', cleanContent)}
                className="px-2 sm:px-3 py-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all flex items-center gap-1.5 text-xs font-medium"
              >
                <Share2 size={14} />
                <span className="hidden sm:inline">Share</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default React.memo(MessageItem);
