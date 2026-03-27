import React, { useState, useEffect } from 'react';
import { Play, X, Maximize2, RotateCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface CodePreviewProps {
  code: string;
  language: string;
  onClose: () => void;
}

const CodePreview: React.FC<CodePreviewProps> = ({ code, language, onClose }) => {
  const [srcDoc, setSrcDoc] = useState('');

  useEffect(() => {
    if (language === 'html' || language === 'xml' || language === 'svg') {
      setSrcDoc(code);
    } else if (language === 'javascript' || language === 'typescript' || language === 'js' || language === 'ts') {
      setSrcDoc(`
        <html>
          <head>
            <style>
              body { font-family: sans-serif; color: #fff; background: #111; padding: 20px; }
            </style>
          </head>
          <body>
            <div id="root"></div>
            <script>
              try {
                ${code}
              } catch (err) {
                document.body.innerHTML = '<pre style="color: #ff4444">' + err.toString() + '</pre>';
              }
            </script>
          </body>
        </html>
      `);
    } else if (language === 'css') {
      setSrcDoc(`
        <html>
          <head>
            <style>${code}</style>
          </head>
          <body>
            <div style="padding: 20px; color: #fff;">
              <h1>CSS Preview</h1>
              <p>This is a preview of your CSS styles applied to a basic page.</p>
              <button style="padding: 10px 20px;">Sample Button</button>
              <div style="margin-top: 20px; padding: 20px; border: 1px solid #444; border-radius: 8px;">
                Sample Box
              </div>
            </div>
          </body>
        </html>
      `);
    }
  }, [code, language]);

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-10 bg-black/80 backdrop-blur-sm"
    >
      <div className="w-full h-full max-w-6xl bg-[#050505] border border-white/10 rounded-3xl overflow-hidden flex flex-col shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span className="ml-2 text-[10px] font-black text-white/40 uppercase tracking-widest">Neural Preview Engine</span>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setSrcDoc(srcDoc)} // Simple refresh
              className="p-2 hover:bg-white/5 rounded-lg text-white/40 hover:text-white transition-colors"
              title="Restart"
            >
              <RotateCcw size={18} />
            </button>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-red-500/20 rounded-lg text-white/40 hover:text-red-400 transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>
        
        <div className="flex-1 bg-white relative">
          <iframe
            srcDoc={srcDoc}
            title="preview"
            sandbox="allow-scripts"
            frameBorder="0"
            width="100%"
            height="100%"
            className="w-full h-full"
          />
        </div>
        
        <div className="px-6 py-3 border-t border-white/5 bg-white/[0.02] flex justify-between items-center">
          <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest">Language: {language}</span>
          <span className="text-[10px] font-bold text-[#76b900] uppercase tracking-widest flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-[#76b900] animate-pulse"></div>
            Live Execution Active
          </span>
        </div>
      </div>
    </motion.div>
  );
};

export default CodePreview;
