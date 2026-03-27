import React from 'react';
import { BrainCircuit } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';

interface MadsLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  isThinking?: boolean;
  className?: string;
}

const MadsLogo: React.FC<MadsLogoProps> = ({ size = 'md', isThinking = false, className }) => {
  const sizes = {
    sm: 'w-8 h-8',
    md: 'w-16 h-16',
    lg: 'w-32 h-32',
    xl: 'w-48 h-48'
  };

  const iconSizes = {
    sm: 16,
    md: 32,
    lg: 64,
    xl: 96
  };

  return (
    <div className={cn(`relative flex items-center justify-center ${sizes[size]}`, className)}>
      {/* Outer Sphere Glow */}
      <motion.div
        animate={{
          scale: isThinking ? [1, 1.1, 1] : [1, 1.05, 1],
          opacity: isThinking ? [0.2, 0.4, 0.2] : [0.1, 0.2, 0.1],
        }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        className="absolute inset-0 rounded-full bg-blue-500/20 blur-2xl"
      />

      {/* Sphere Border */}
      <div className="absolute inset-0 rounded-full border border-blue-500/20 backdrop-blur-sm shadow-[inset_0_0_20px_rgba(59,130,246,0.1)]" />

      {/* Orbiting Particles */}
      <div className="absolute inset-0">
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            animate={{
              rotate: 360,
            }}
            transition={{
              duration: 10 + i * 2,
              repeat: Infinity,
              ease: "linear"
            }}
            className="absolute inset-0"
          >
            <div 
              className="absolute w-1 h-1 bg-blue-400 rounded-full"
              style={{
                top: '50%',
                left: '-2px',
                boxShadow: '0 0 10px #3b82f6'
              }}
            />
          </motion.div>
        ))}
      </div>

      {/* Central Brain Icon */}
      <motion.div
        animate={isThinking ? {
          scale: [1, 1.1, 1],
          filter: ["drop-shadow(0 0 10px #3b82f6)", "drop-shadow(0 0 25px #3b82f6)", "drop-shadow(0 0 10px #3b82f6)"]
        } : {
          scale: [1, 1.02, 1],
          filter: "drop-shadow(0 0 15px rgba(59, 130, 246, 0.3))"
        }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        className="relative z-10 text-blue-600"
      >
        <BrainCircuit size={iconSizes[size]} strokeWidth={1.5} />
      </motion.div>

      {/* Internal Glow */}
      <div className="absolute w-1/2 h-1/2 bg-blue-500/10 blur-xl rounded-full" />
    </div>
  );
};

export default MadsLogo;
