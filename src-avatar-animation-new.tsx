import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import './src-avatar-animation.css';

// Types
export interface AvatarAnimationProps {
  playerState: 'waiting' | 'riding' | 'fallen' | 'missed';
  currentPrice: number;
  currentIndex: number;
  chartWidth: number;
  chartHeight: number;
  priceRange: number[];
  dateRange: string[];
  dragonIntensity?: number;
  narrativeMessage?: string;
}

export const AvatarAnimation: React.FC<AvatarAnimationProps> = ({
  playerState,
  currentPrice,
  currentIndex,
  chartWidth,
  chartHeight,
  priceRange,
  dateRange,
  dragonIntensity = 0,
  narrativeMessage = ''
}) => {
  // Track price direction for animation
  const [priceDirection, setPriceDirection] = useState<'up' | 'down' | 'neutral'>('neutral');
  const [prevPrice, setPrevPrice] = useState<number | null>(null);
  const [showNarrative, setShowNarrative] = useState(false);
  const [avatarImage, setAvatarImage] = useState('/avatar-waiting.svg');
  const [backgroundImage, setBackgroundImage] = useState('');
  
  // Animation state
  const [animation, setAnimation] = useState({
    avatarPosition: { x: chartWidth * 0.8, y: chartHeight * 0.5 },
    avatarScale: 1,
    avatarRotation: 0,
    dragonOpacity: 0.7,
    dragonScale: 1,
    narrativeOpacity: 0
  });

  // Update price direction based on price change
  useEffect(() => {
    if (prevPrice !== null) {
      if (currentPrice > prevPrice) {
        setPriceDirection('up');
      } else if (currentPrice < prevPrice) {
        setPriceDirection('down');
      } else {
        setPriceDirection('neutral');
      }
    }
    setPrevPrice(currentPrice);
  }, [currentPrice, prevPrice]);

  // Update avatar image and background based on player state
  useEffect(() => {
    switch (playerState) {
      case 'waiting':
        setAvatarImage('/IMAGE/jack sully.png');
        setBackgroundImage('');
        break;
      case 'riding':
        setAvatarImage('/avatar-riding.svg');
        setBackgroundImage('/IMAGE/ride.png');
        break;
      case 'fallen':
        setAvatarImage('/avatar-fallen.svg');
        setBackgroundImage('');
        break;
      case 'missed':
        setAvatarImage('/avatar-missed.svg');
        setBackgroundImage('');
        break;
    }
  }, [playerState]);

  // Update animation settings based on player state and price direction
  useEffect(() => {
    // Base position calculation
    const baseX = chartWidth * 0.8;
    const baseY = chartHeight * 0.5;
    
    // Calculate position based on player state
    let newPosition = { x: baseX, y: baseY };
    let newScale = 1;
    let newRotation = 0;
    let newDragonOpacity = 0.7;
    let newDragonScale = 1;
    let newNarrativeOpacity = 0;
    
    switch (playerState) {
      case 'waiting':
        newPosition = { x: baseX, y: baseY };
        newScale = 1;
        newRotation = 0;
        newDragonOpacity = 0.8;
        newDragonScale = 1;
        break;
      case 'riding':
        newPosition = { x: baseX + 20, y: baseY - 50 };
        newScale = 1.2;
        newRotation = priceDirection === 'up' ? 5 : -5;
        newDragonOpacity = 0.9;
        newDragonScale = 1.2;
        newNarrativeOpacity = 1;
        break;
      case 'fallen':
        newPosition = { x: baseX - 30, y: baseY + 80 };
        newScale = 0.8;
        newRotation = 180;
        newDragonOpacity = 0.5;
        newDragonScale = 0.9;
        newNarrativeOpacity = 1;
        break;
      case 'missed':
        newPosition = { x: baseX - 50, y: baseY + 30 };
        newScale = 0.9;
        newRotation = -15;
        newDragonOpacity = 0.6;
        newDragonScale = 0.8;
        newNarrativeOpacity = 1;
        break;
    }
    
    // Apply dragon intensity
    if (dragonIntensity > 0) {
      newDragonScale += dragonIntensity * 0.05;
      newDragonOpacity += dragonIntensity * 0.02;
    }
    
    // Update animation state
    setAnimation({
      avatarPosition: newPosition,
      avatarScale: newScale,
      avatarRotation: newRotation,
      dragonOpacity: newDragonOpacity,
      dragonScale: newDragonScale,
      narrativeOpacity: newNarrativeOpacity
    });
    
    // Show narrative text
    if (narrativeMessage) {
      setShowNarrative(true);
      const timer = setTimeout(() => {
        setShowNarrative(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [playerState, priceDirection, chartWidth, chartHeight, dragonIntensity, narrativeMessage]);

  // Dragon state class based on price direction
  const dragonState = priceDirection === 'up' ? 'dragon-up' : 
                      priceDirection === 'down' ? 'dragon-down' : 'dragon-neutral';

  return (
    <div className="avatar-animation-container" style={{ width: chartWidth, height: chartHeight }}>
      {/* Dragon silhouette overlay */}
      <motion.div 
        className={`dragon-silhouette ${dragonState}`}
        style={{
          opacity: animation.dragonOpacity,
          backgroundImage: "url('/IMAGE/toruk makto.png')",
          backgroundSize: "contain",
          backgroundRepeat: "no-repeat",
          backgroundPosition: "center"
        }}
        animate={{
          scale: animation.dragonScale,
          rotate: priceDirection === 'up' ? 5 : priceDirection === 'down' ? -5 : 0
        }}
        transition={{ type: "spring", stiffness: 100, damping: 10 }}
      />
      
      {/* Background image for specific states */}
      {backgroundImage && (
        <motion.div
          className="background-image"
          style={{
            backgroundImage: `url('${backgroundImage}')`,
            opacity: 0.7
          }}
          animate={{ opacity: 0.7 }}
          initial={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
        />
      )}
      
      {/* Avatar character */}
      <motion.div
        className={`avatar-character ${playerState}`}
        style={{
          backgroundImage: `url('${avatarImage}')`
        }}
        animate={{
          x: animation.avatarPosition.x,
          y: animation.avatarPosition.y,
          scale: animation.avatarScale,
          rotate: animation.avatarRotation
        }}
        transition={{ type: "spring", stiffness: 100, damping: 10 }}
      />
      
      {/* Narrative text */}
      {showNarrative && narrativeMessage && (
        <motion.div
          className="narrative-text"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: animation.narrativeOpacity, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {narrativeMessage}
        </motion.div>
      )}
    </div>
  );
};

export default AvatarAnimation;
