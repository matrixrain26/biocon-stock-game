import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { isSoundEnabled, toggleSound } from './src-sound-utils';

interface SoundControlProps {
  className?: string;
}

const SoundControl: React.FC<SoundControlProps> = ({ className = '' }) => {
  const [soundOn, setSoundOn] = useState<boolean>(true);
  
  // Initialize sound state from localStorage
  useEffect(() => {
    setSoundOn(isSoundEnabled());
  }, []);
  
  // Handle sound toggle
  const handleToggleSound = () => {
    const newState = toggleSound();
    setSoundOn(newState);
  };
  
  return (
    <motion.div 
      className={`sound-control ${className}`}
      whileTap={{ scale: 0.9 }}
      whileHover={{ scale: 1.1 }}
      onClick={handleToggleSound}
      title={soundOn ? "Mute Sound" : "Enable Sound"}
    >
      {soundOn ? (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
          <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
          <path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path>
        </svg>
      ) : (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
          <line x1="23" y1="9" x2="17" y2="15"></line>
          <line x1="17" y1="9" x2="23" y2="15"></line>
        </svg>
      )}
    </motion.div>
  );
};

export default SoundControl;
