// Sound utilities for Avatar-themed BIOCON stock game

// Define sound types
type SoundType = 'waiting' | 'riding' | 'fallen' | 'missed' | 'success' | 'failure' | 'gameOver' | 'soundtrack';

// Sound file mapping
const soundFiles: Record<SoundType, string> = {
  waiting: '/sounds/waiting.mp3',
  riding: '/sounds/riding.mp3',
  fallen: '/sounds/fallen.mp3',
  missed: '/sounds/missed.mp3',
  success: '/sounds/success.mp3',
  failure: '/sounds/failure.mp3',
  gameOver: '/sounds/game-over.mp3',
  soundtrack: '/sounds/redventdigitalmedia.co.za - Avatar Fire and Ash Official Trailer (320 KBps) (1).mp3'
};

// Audio instances cache
const audioInstances: Record<string, HTMLAudioElement> = {};

// Track if user has interacted with the page
let userHasInteracted = false;

// Queue of sounds to play after user interaction
const soundQueue: Array<{type: SoundType, volume: number, loop: boolean}> = [];

// Set user interaction flag when user interacts with the page
document.addEventListener('click', handleUserInteraction);
document.addEventListener('keydown', handleUserInteraction);

/**
 * Handle user interaction to enable audio
 */
function handleUserInteraction() {
  userHasInteracted = true;
  
  // Play any queued sounds
  while (soundQueue.length > 0) {
    const sound = soundQueue.shift();
    if (sound) {
      playQueuedSound(sound.type, sound.volume, sound.loop);
    }
  }
}

/**
 * Play a queued sound (internal use only)
 */
function playQueuedSound(type: SoundType, volume = 0.5, loop = false): HTMLAudioElement | undefined {
  try {
    const soundFile = soundFiles[type];
    
    // Create or reuse audio instance
    if (!audioInstances[type]) {
      const audio = new Audio(soundFile);
      audio.volume = volume;
      audio.loop = loop;
      audioInstances[type] = audio;
    } else {
      // Reset existing audio
      audioInstances[type].currentTime = 0;
      audioInstances[type].volume = volume;
      audioInstances[type].loop = loop;
    }
    
    // Play the sound
    const playPromise = audioInstances[type].play();
    
    // Handle play promise (required for modern browsers)
    if (playPromise !== undefined) {
      playPromise.catch((error) => {
        console.error(`Sound playback failed for ${type}:`, error);
      });
    }
    
    return audioInstances[type];
  } catch (error) {
    console.error(`Error playing sound ${type}:`, error);
    return undefined;
  }
}

/**
 * Play a sound effect
 * @param type Sound type to play
 * @param volume Volume level (0-1)
 * @param loop Whether to loop the sound
 * @returns The audio element instance
 */
export const playSound = (type: SoundType, volume = 0.5, loop = false): HTMLAudioElement | undefined => {
  try {
    // Check if sound is enabled in localStorage
    const soundEnabled = localStorage.getItem('biocon-sound-enabled') !== 'false';
    if (!soundEnabled) return undefined;
    
    // If user hasn't interacted yet, queue the sound for later
    if (!userHasInteracted) {
      console.log(`Queueing sound ${type} for after user interaction`);
      soundQueue.push({ type, volume, loop });
      return undefined;
    }
    
    // User has interacted, play sound directly
    return playQueuedSound(type, volume, loop);
  } catch (error) {
    console.error('Error playing sound:', error);
    return undefined;
  }
};

/**
 * Stop a playing sound
 * @param type Sound type to stop
 */
export const stopSound = (type: SoundType): void => {
  if (audioInstances[type]) {
    audioInstances[type].pause();
    audioInstances[type].currentTime = 0;
  }
};

/**
 * Stop all playing sounds
 */
export const stopAllSounds = (): void => {
  Object.values(audioInstances).forEach(audio => {
    audio.pause();
    audio.currentTime = 0;
  });
};

/**
 * Toggle sound on/off
 * @param enabled Whether sound should be enabled
 * @returns The new sound enabled state
 */
export const toggleSound = (enabled?: boolean): boolean => {
  const currentState = localStorage.getItem('biocon-sound-enabled') !== 'false';
  const newState = enabled !== undefined ? enabled : !currentState;
  
  localStorage.setItem('biocon-sound-enabled', newState.toString());
  
  // If disabling sound, stop all playing sounds
  if (!newState) {
    stopAllSounds();
  }
  
  return newState;
};

/**
 * Check if sound is enabled
 * @returns Whether sound is currently enabled
 */
export const isSoundEnabled = (): boolean => {
  return localStorage.getItem('biocon-sound-enabled') !== 'false';
};

// Initialize sound setting if not already set
if (localStorage.getItem('biocon-sound-enabled') === null) {
  localStorage.setItem('biocon-sound-enabled', 'true');
}
