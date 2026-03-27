import React, { useState } from 'react';
import { BrainCircuit, Mail, Lock, User, ArrowRight, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';

interface AuthScreenProps {
  onLogin: () => Promise<boolean>;
  onSignup: () => Promise<boolean>;
}

const AuthScreen: React.FC<AuthScreenProps> = ({ onLogin, onSignup }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError('');
    try {
      const success = await onLogin();
      if (!success) setError('Login failed. Please try again.');
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px]"></div>
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full bg-white rounded-3xl p-6 sm:p-10 relative z-10 border border-gray-200 shadow-xl"
      >
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-blue-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-blue-600/20 relative group overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-blue-700"></div>
            <BrainCircuit size={40} className="text-white relative z-10" />
            <motion.div 
              animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.5, 0.2] }}
              transition={{ duration: 4, repeat: Infinity }}
              className="absolute inset-0 bg-white/20 blur-xl"
            />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">MADS AI</h1>
          <p className="text-blue-600 text-xs font-bold uppercase tracking-[0.2em] mt-2">Neural Core v3.1</p>
        </div>

        <div className="space-y-6">
          <div className="p-6 bg-blue-50/50 border border-blue-100/50 rounded-2xl text-center">
            <p className="text-gray-700 text-sm leading-relaxed">
              Welcome to the Master Academic Deep-learning System. Please sign in with your Google account to access the neural network.
            </p>
            <p className="text-[10px] text-blue-500 mt-3 font-medium">
              Note: If you're using the mobile app, a browser window will open for secure authentication.
            </p>
          </div>

          {error && <p className="text-red-500 text-sm font-medium text-center">{error}</p>}

          <button 
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className="w-full bg-white border border-gray-200 text-gray-900 py-3.5 rounded-xl font-medium flex items-center justify-center gap-3 hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm disabled:opacity-50 group"
          >
            {isLoading ? <Loader2 className="animate-spin text-gray-400" size={20} /> : (
              <>
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                <span className="text-sm">Continue with Google</span>
              </>
            )}
          </button>
        </div>

        <div className="mt-10 text-center">
          <p className="text-xs font-medium text-gray-400">Encrypted Neural Uplink Active</p>
        </div>
      </motion.div>
    </div>
  );
};

export default AuthScreen;
