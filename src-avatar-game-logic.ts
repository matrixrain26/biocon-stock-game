import { PlayerState, GameEvent } from './src-avatar-types';
import { playSound, stopSound } from './src-sound-utils';

// Constants
const PAUSE_PRICE = 390;
const TARGET_PRICE = 400;

export interface AvatarGameState {
  playerState: PlayerState;
  rideStartIndex: number | null;
  rideEndIndex: number | null;
  gameEvents: GameEvent[];
  narrativeMessage: string;
  dragonIntensity: number; // 0-1 scale for dragon animation intensity
  backgroundImage?: string; // Path to background image for cinematic moments
}

// Initial game state
export const initialAvatarGameState: AvatarGameState = {
  playerState: 'waiting',
  rideStartIndex: null,
  rideEndIndex: null,
  gameEvents: [],
  narrativeMessage: '',
  dragonIntensity: 0.5,
  backgroundImage: '',
};

// Game logic functions
export const avatarGameLogic = {
  // Check if player should wait at current price point
  shouldWaitAtPrice: (currentPrice: number): boolean => {
    return currentPrice >= PAUSE_PRICE;
  },

  // Process player's guess
  processGuess: (
    guess: 'up' | 'down',
    currentIndex: number,
    nextDayData: { close: number },
    currentState: AvatarGameState
  ): AvatarGameState => {
    // Check if next day's close is above TARGET_PRICE
    const nextDayAboveTarget = nextDayData.close > TARGET_PRICE;
    
    // Determine if guess was correct
    const isCorrect = (nextDayAboveTarget && guess === 'up') || 
                      (!nextDayAboveTarget && guess === 'down');
    
    // Determine new player state based on guess and outcome
    let newPlayerState: PlayerState = 'waiting';
    let narrativeMessage = '';
    
    if (guess === 'up') {
      if (nextDayAboveTarget) {
        // Correct "up" guess - player rides the dragon
        newPlayerState = 'riding';
        narrativeMessage = 'You successfully mounted Toruk Makto! The dragon soars above ₹400!';
        // Play success sound
        playSound('success', 0.6);
        // Start riding sound
        playSound('riding', 0.4, true);
      } else {
        // Incorrect "up" guess - player falls
        newPlayerState = 'fallen';
        narrativeMessage = 'The dragon shakes you off mid-flight! You fall as the price stays below ₹400.';
        // Play failure sound
        playSound('fallen', 0.6);
      }
    } else { // guess === 'down'
      if (!nextDayAboveTarget) {
        // Correct "down" guess - player avoids the dragon
        newPlayerState = 'waiting';
        narrativeMessage = 'You smugly walk away as the dragon dips below ₹400. Wise choice!';
        // Play success sound
        playSound('success', 0.6);
      } else {
        // Incorrect "down" guess - player misses the dragon
        newPlayerState = 'missed';
        narrativeMessage = 'The dragon soars past ₹400 while you watch from below. You missed your chance!';
      }
    }
    
    // Create a new game event
    const newEvent: GameEvent = {
      type: isCorrect ? (guess === 'up' ? 'mount' : 'success') : (guess === 'up' ? 'fall' : 'miss'),
      timestamp: Date.now(),
      position: { x: currentIndex, y: nextDayData.close }
    };
    
    // Update ride tracking
    let rideStartIndex = currentState.rideStartIndex;
    let rideEndIndex = currentState.rideEndIndex;
    
    if (newPlayerState === 'riding' && currentState.playerState !== 'riding') {
      // Starting a new ride
      rideStartIndex = currentIndex;
      rideEndIndex = null;
    } else if (newPlayerState !== 'riding' && currentState.playerState === 'riding') {
      // Ending a ride
      rideEndIndex = currentIndex;
    }
    
    // Calculate dragon intensity based on price volatility
    const dragonIntensity = Math.min(1, Math.abs(nextDayData.close - PAUSE_PRICE) / 50);
    
    return {
      ...currentState,
      playerState: newPlayerState,
      rideStartIndex,
      rideEndIndex,
      gameEvents: [...currentState.gameEvents, newEvent],
      narrativeMessage,
      dragonIntensity: dragonIntensity || 0.5, // Default to 0.5 if calculation is 0
    };
  },
  
  // Update player state based on price movement (for continuous animation)
  updatePlayerState: (
    currentState: AvatarGameState,
    currentPrice: number,
    previousPrice: number | null
  ): AvatarGameState => {
    // If player is riding and price drops below target, they fall
    if (currentState.playerState === 'riding' && currentPrice < TARGET_PRICE) {
      return {
        ...currentState,
        playerState: 'fallen',
        narrativeMessage: 'The dragon dives below ₹400! You lose your grip and fall!',
        gameEvents: [
          ...currentState.gameEvents,
          {
            type: 'fall',
            timestamp: Date.now(),
            position: { x: currentState.gameEvents.length, y: currentPrice }
          }
        ]
      };
    }
    
    // If player is waiting and price goes above target without guessing, they miss the ride
    if (currentState.playerState === 'waiting' && 
        previousPrice !== null && 
        previousPrice < TARGET_PRICE && 
        currentPrice > TARGET_PRICE) {
      return {
        ...currentState,
        playerState: 'missed',
        narrativeMessage: 'The dragon soars above ₹400 without you!',
        gameEvents: [
          ...currentState.gameEvents,
          {
            type: 'miss',
            timestamp: Date.now(),
            position: { x: currentState.gameEvents.length, y: currentPrice }
          }
        ]
      };
    }
    
    // Calculate dragon intensity based on price volatility
    let dragonIntensity = currentState.dragonIntensity;
    if (previousPrice !== null) {
      dragonIntensity = Math.min(1, Math.abs(currentPrice - previousPrice) / 10);
      if (dragonIntensity < 0.3) dragonIntensity = 0.3; // Minimum intensity
    }
    
    return {
      ...currentState,
      dragonIntensity
    };
  },
  
  // Reset game state
  resetGame: () => {
    // Stop all sounds when resetting the game
    stopSound('waiting');
    stopSound('riding');
    stopSound('fallen');
    stopSound('missed');
    stopSound('success');
    stopSound('failure');
    
    return initialAvatarGameState;
  }
};
