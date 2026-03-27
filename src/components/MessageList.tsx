import React from 'react';
import MessageItem from './MessageItem';
import { Message } from '../hooks/useChat';
import MadsLogo from './MadsLogo';
import { motion } from 'motion/react';

interface MessageListProps {
  messages: Message[];
  isLoading: boolean;
  submitFeedback: (messageId: string, isPositive: boolean) => void;
  performResearch: (messageId: string, queryText: string) => void;
  onShareToCommunity?: (topic: string, content: string) => void;
}

const MessageList: React.FC<MessageListProps> = ({ 
  messages, 
  isLoading, 
  submitFeedback, 
  performResearch,
  onShareToCommunity
}) => {
  return (
    <div className="max-w-5xl mx-auto w-full">
      {messages.map(msg => (
        <MessageItem 
          key={msg.id} 
          message={msg} 
          onFeedback={submitFeedback}
          onResearch={performResearch}
          onShareToCommunity={onShareToCommunity}
        />
      ))}
      {isLoading && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="py-4 px-2 sm:px-6 flex gap-3 sm:gap-6 w-full group"
        >
          <div className="shrink-0 mt-1">
            <div className="w-8 h-8 rounded-full flex items-center justify-center bg-blue-600 text-white shadow-sm ring-4 ring-blue-50">
              <MadsLogo size="sm" isThinking={true} className="text-white" />
            </div>
          </div>
          <div className="flex flex-col gap-1.5 min-w-0 items-start w-full">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-gray-900">
                Assistant
              </span>
            </div>
            <div className="message-bot w-full">
              <div className="flex items-center gap-2 h-6">
                <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></span>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default React.memo(MessageList);
