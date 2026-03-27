import React, { useState, useRef, useEffect, useImperativeHandle, forwardRef } from 'react';
import { Send, Paperclip, Mic, Camera, Sparkles, X, Image as ImageIcon, MicOff } from 'lucide-react';
import { cn } from '../lib/utils';

// Add SpeechRecognition types
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export interface ChatInputHandle {
  setInputValue: (value: string) => void;
}

interface ChatInputProps {
  onSend: (text: string, files: { data: string; mimeType: string; name: string }[]) => void;
  isLoading: boolean;
  placeholder?: string;
}

const ChatInput = forwardRef<ChatInputHandle, ChatInputProps>(({ onSend, isLoading, placeholder = "MADS কে কিছু জিজ্ঞাসা করুন..." }, ref) => {
  const [input, setInput] = useState('');
  const [files, setFiles] = useState<{ data: string; mimeType: string; name: string }[]>([]);
  const [isListening, setIsListening] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;

      recognitionRef.current.onresult = (event: any) => {
        let currentTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            setInput(prev => prev + transcript + ' ');
          } else {
            currentTranscript += transcript;
          }
        }
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error', event.error);
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
  }, []);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current?.start();
        setIsListening(true);
      } catch (e) {
        console.error("Speech recognition failed to start", e);
      }
    }
  };

  useImperativeHandle(ref, () => ({
    setInputValue: (value: string) => setInput(value)
  }));

  const handleSend = () => {
    if ((input.trim() || files.length > 0) && !isLoading) {
      onSend(input, files);
      setInput('');
      setFiles([]);
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles) return;

    Array.from(selectedFiles).forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = (event.target?.result as string).split(',')[1];
        setFiles(prev => [...prev, { 
          data: base64, 
          mimeType: file.type, 
          name: file.name 
        }]);
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [input]);

  return (
    <div className="w-full max-w-4xl mx-auto px-3 sm:px-6 pb-4 sm:pb-8">
      {/* Main Input Container */}
      <div className="relative group">
        <div className={cn(
          "bg-white border border-gray-200 rounded-[2rem] shadow-lg focus-within:ring-4 focus-within:ring-blue-500/10 focus-within:border-blue-400 transition-all duration-300 flex flex-col overflow-hidden",
          isLoading && "opacity-80 grayscale-[0.2]"
        )}>
          <textarea
            ref={textareaRef}
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="w-full bg-transparent border-none focus:ring-0 text-gray-900 placeholder:text-gray-400 py-4 px-6 resize-none max-h-[150px] sm:max-h-[250px] text-base leading-relaxed"
          />
          
          <div className="flex items-center justify-between px-4 pb-3 pt-1">
            <div className="flex items-center gap-1">
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="p-2.5 hover:bg-gray-100 rounded-full transition-all text-gray-500 hover:text-blue-600 active:scale-95"
                title="Attach file"
              >
                <Paperclip size={20} />
              </button>
              <button 
                onClick={toggleListening}
                className={cn(
                  "p-2.5 rounded-full transition-all active:scale-95",
                  isListening 
                    ? "bg-red-50 text-red-600 hover:bg-red-100 animate-pulse" 
                    : "hover:bg-gray-100 text-gray-500 hover:text-blue-600"
                )}
                title={isListening ? "Stop listening" : "Start voice input"}
              >
                {isListening ? <MicOff size={20} /> : <Mic size={20} />}
              </button>
              <button className="p-2.5 hover:bg-gray-100 rounded-full transition-all text-gray-500 hover:text-blue-600 active:scale-95 hidden sm:block">
                <Camera size={20} />
              </button>
              <button className="p-2.5 hover:bg-gray-100 rounded-full transition-all text-gray-500 hover:text-blue-600 active:scale-95 hidden sm:block">
                <Sparkles size={20} />
              </button>
            </div>
            
            <button
              onClick={handleSend}
              disabled={isLoading || (!input.trim() && files.length === 0)}
              className={cn(
                "w-11 h-11 rounded-full flex items-center justify-center transition-all duration-300 transform active:scale-90",
                (input.trim() || files.length > 0) && !isLoading
                  ? "bg-blue-600 text-white hover:bg-blue-700 shadow-md hover:shadow-blue-500/30"
                  : "bg-gray-100 text-gray-400 cursor-not-allowed"
              )}
            >
              <Send size={20} className={cn("transition-transform", (input.trim() || files.length > 0) && "translate-x-0.5 -translate-y-0.5")} />
            </button>
          </div>
        </div>
      </div>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        multiple
      />

      {files.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-3 px-2">
          {files.map((file, i) => (
            <div key={i} className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 border border-gray-200 rounded-lg text-xs font-medium text-gray-700">
              <ImageIcon size={14} className="text-gray-500" />
              <span className="truncate max-w-[150px]">{file.name}</span>
              <button 
                onClick={() => setFiles(prev => prev.filter((_, idx) => idx !== i))}
                className="hover:text-red-500 text-gray-400 transition-colors ml-1"
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
});

ChatInput.displayName = 'ChatInput';

export default React.memo(ChatInput);
