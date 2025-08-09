import * as React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './src-components-ui-dialog';
import { Button } from './src-components-ui-button';
import { motion } from 'framer-motion';
import { PlayerState } from './src-avatar-types';

interface AvatarDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description: string;
  type: 'question' | 'result' | 'gameOver';
  onGuessUp?: () => void;
  onGuessDown?: () => void;
  onContinue?: () => void;
  onRestart?: () => void;
  playerState: PlayerState;
  score?: { correct: number; total: number; points: number };
}

export const AvatarDialog: React.FC<AvatarDialogProps> = (props) => {
  const {
    isOpen,
    onClose,
    title,
    description,
    type,
    onGuessUp,
    onGuessDown,
    onContinue,
    onRestart,
    playerState,
    score
  } = props;
  
  // Get dialog background style based on dialog type and player state
  const getBackgroundStyle = () => {
    if (type === 'question') {
      return {
        backgroundColor: 'rgba(0,30,60,0.9)', // Dark background for text visibility
      };
    } else if (type === 'result' && playerState === 'riding') {
      return {
        backgroundColor: 'rgba(0,60,30,0.9)',
      };
    } else {
      return {
        background: 'linear-gradient(135deg, rgba(0,30,60,0.95) 0%, rgba(20,40,100,0.95) 100%)',
      };
    }
  };
  
  // Get image for dialog header based on dialog type
  const getHeaderImage = () => {
    if (type === 'question') {
      return '/IMAGE/jack sully.png';
    } else if (type === 'result' && playerState === 'riding') {
      return '/IMAGE/ride.png';
    }
    return null;
  };
  
  // Button styles based on player state
  const getButtonStyle = (action: 'up' | 'down' | 'continue' | 'restart') => {
    if (action === 'up') {
      return 'bg-blue-600 hover:bg-blue-700 text-white';
    } else if (action === 'down') {
      return 'bg-red-600 hover:bg-red-700 text-white';
    } else if (action === 'continue') {
      return 'bg-purple-600 hover:bg-purple-700 text-white';
    } else {
      return 'bg-green-600 hover:bg-green-700 text-white';
    }
  };

  // Get dialog icon based on dialog type and player state
  const getDialogIcon = () => {
    if (type === 'question') {
      return '🐉'; // Dragon emoji for questions
    } else if (type === 'result') {
      switch (playerState) {
        case 'riding': return '🏆'; // Trophy for successful ride
        case 'fallen': return '💥'; // Explosion for falling
        case 'missed': return '❌'; // X for missing the ride
        default: return '🔍'; // Default icon
      }
    } else { // game over
      return '🎮'; // Game controller for game over
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className="rounded-lg" 
        style={{
          ...getBackgroundStyle(),
          border: '2px solid rgba(100,150,255,0.5)',
          boxShadow: '0 0 20px rgba(100,150,255,0.3)',
          color: '#fff',
          maxWidth: '600px',
          width: '95%',
        }}
      >
        <DialogHeader>
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="text-center mb-2"
          >
            {getHeaderImage() ? (
              <div className="avatar-dialog-image-container mb-4">
                <img 
                  src={getHeaderImage() || ''} 
                  alt="Avatar themed image" 
                  className="avatar-dialog-image rounded-md mx-auto" 
                  style={{ maxHeight: '180px', objectFit: 'contain' }} 
                />
              </div>
            ) : null}
            
            {type === 'question' ? (
              <div className="avatar-dialog-content">
                <div className="text-center text-blue-300 mt-2 font-bold text-xl">
                  You are Jake Sully - The Chosen Toruk Makto
                </div>
                <div className="text-center text-white mt-2">
                  <p>"The Great Leonopteryx has appeared at the sacred price of ₹390."</p>
                  <p>"Will you bond with Toruk and ride to glory beyond ₹400?"</p>
                </div>
              </div>
            ) : playerState === 'riding' ? (
              <div className="avatar-dialog-content">
                <div className="text-center text-green-300 mt-2 font-bold text-xl">
                  Toruk Makto - Dragon of Legend!
                </div>
                <div className="text-center text-white mt-2">
                  <p>"You have successfully bonded with Toruk and soared beyond ₹400!"</p>
                  <p>"The People of Pandora will sing tales of your courage!"</p>
                </div>
              </div>
            ) : (
              <span className="text-4xl">{getDialogIcon()}</span>
            )}
          </motion.div>
          <DialogTitle className="text-xl font-bold text-center text-blue-300">
            {title}
          </DialogTitle>
          <DialogDescription className="text-center text-gray-200 mt-2">
            {description}
          </DialogDescription>
        </DialogHeader>

        <div className="mt-6">
          {type === 'question' && (
            <div className="flex flex-col space-y-3">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button 
                  onClick={onGuessUp} 
                  className={`w-full py-3 ${getButtonStyle('up')}`}
                >
                  <span className="mr-2">⬆️</span> Ride the Dragon Up!
                </Button>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button 
                  onClick={onGuessDown} 
                  className={`w-full py-3 ${getButtonStyle('down')}`}
                >
                  <span className="mr-2">⬇️</span> Stay Grounded
                </Button>
              </motion.div>
            </div>
          )}

          {type === 'result' && (
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex justify-center"
            >
              <Button 
                onClick={onContinue} 
                className={`px-8 py-3 ${getButtonStyle('continue')}`}
              >
                Continue Journey
              </Button>
            </motion.div>
          )}

          {type === 'gameOver' && (
            <div className="space-y-4">
              {score && (
                <div className="bg-gray-800 rounded-lg p-4 text-center">
                  <p className="text-xl font-bold text-blue-300">Final Score</p>
                  <p className="text-2xl font-bold text-white mt-1">{score.correct} / {score.total}</p>
                  <p className="text-sm text-gray-300 mt-1">
                    {score.total > 0 
                      ? `You successfully rode Toruk Makto ${Math.round((score.correct / score.total) * 100)}% of the time!` 
                      : 'You never attempted to ride Toruk Makto!'}
                  </p>
                </div>
              )}
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex justify-center"
              >
                <Button 
                  onClick={onRestart} 
                  className={`px-8 py-3 ${getButtonStyle('restart')}`}
                >
                  Begin New Journey
                </Button>
              </motion.div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
