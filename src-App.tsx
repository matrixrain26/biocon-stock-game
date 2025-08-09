import { useState, useEffect, useRef } from 'react'
import './src-App.css';
import './src-avatar-animation.css';
import './src-sound-control.css';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine } from 'recharts'
// Dialog components are imported in AvatarDialog component
// import { Dialog, DialogContent, DialogHeader, DialogTitle } from './src-components-ui-dialog'
// Button component is used in the controls section
import { Button } from './src-components-ui-button'
import { motion } from 'framer-motion'
import SoundControl from './src-sound-control';
import { playSound, stopSound } from './src-sound-utils';
import { getStockData } from './src-stock-data';

// Import Avatar-themed game components
import { AvatarAnimation } from './src-avatar-animation'
import { AvatarDialog } from './src-avatar-dialog'
import { avatarGameLogic, initialAvatarGameState } from './src-avatar-game-logic'
// Import types from avatar components

// Import BIOCON.NS data
import bioconData from './biocon-data.json'

const PAUSE_PRICE = 390;
const TARGET_PRICE = 400;
const PLAYBACK_SPEED = 300; // ms per day

// Define StockData type
type StockData = {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

function App() {
  const [data, setData] = useState<StockData[]>([]);
  const [visibleData, setVisibleData] = useState<StockData[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [showGuessDialog, setShowGuessDialog] = useState(false);
  const [score, setScore] = useState({ correct: 0, total: 0, points: 0 });
  const [guessResult, setGuessResult] = useState({
    guess: '',
    actual: '',
    isCorrect: false,
    nextDayPrice: 0
  });
  const [showResultDialog, setShowResultDialog] = useState(false);
  const [showGameOverDialog, setShowGameOverDialog] = useState(false);
  const timerRef = useRef<number | null>(null);
  
  // Avatar-themed game state
  const [avatarGame, setAvatarGame] = useState(initialAvatarGameState);
  const [previousPrice, setPreviousPrice] = useState<number | null>(null);
  const chartRef = useRef<HTMLDivElement>(null);

  // Load data on mount and start soundtrack
  useEffect(() => {
        // Set initial data from local file to ensure the UI renders immediately
    setData(bioconData);
    
    // Then try to load the latest data asynchronously
    const loadData = async () => {
      try {
        console.log('Fetching latest BIOCON.NS data...');
        const latestData = await getStockData();
        console.log(`Loaded ${latestData.length} days of BIOCON.NS data`);
        setData(latestData);
      } catch (error) {
        console.error('Failed to load stock data:', error);
        // We already set the fallback data above, so no need to do it again
      }
    };
    
    // Load latest data
    loadData();
    
    // Play the Avatar soundtrack in a loop with lower volume
    playSound('soundtrack', 0.3, true);
    
    // Cleanup function to stop soundtrack when component unmounts
    return () => {
      stopSound('soundtrack');
    };
  }, []);

  // Handle playback
  useEffect(() => {
    if (isPlaying && !isPaused && currentIndex < data.length) {
      timerRef.current = window.setTimeout(() => {
        const currentData = data[currentIndex];
        setVisibleData(prev => [...prev, currentData]);
        
        // Update previous price for animation
        if (currentIndex > 0) {
          setPreviousPrice(data[currentIndex - 1].close);
        }
        
        // Check if we've reached the end of data
        if (currentIndex >= data.length - 1) {
          setIsPaused(true);
          setShowGameOverDialog(true);
          return;
        }
        
        // Update avatar game state based on price movement
        const updatedAvatarState = avatarGameLogic.updatePlayerState(
          avatarGame,
          currentData.close,
          previousPrice
        );
        setAvatarGame(updatedAvatarState);
        
        // Check if close is above PAUSE_PRICE
        if (currentData.close > PAUSE_PRICE) {
          setIsPaused(true);
          setShowGuessDialog(true);
          // Update avatar state to waiting when paused at decision point
          setAvatarGame(prev => ({ 
            ...prev, 
            playerState: 'waiting',
            backgroundImage: '/IMAGE/jack sully.png',
            narrativeMessage: 'Jake Sully approaches the dragon path...'
          }));
        } else {
          // Only advance to the next day if not paused
          setCurrentIndex(prev => prev + 1);
        }
      }, PLAYBACK_SPEED);
    }

    return () => {
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
      }
    };
  }, [isPlaying, isPaused, currentIndex, data, avatarGame, previousPrice]);

  const handleStart = () => {
    setIsPlaying(true);
    setIsPaused(false);
  };

  const handlePause = () => {
    setIsPaused(true);
  };
  
  const handleResume = () => {
    setIsPaused(false);
  };

  const resetGame = () => {
    setIsPlaying(false);
    setIsPaused(false);
    setCurrentIndex(0);
    setVisibleData([]);
    setScore({ correct: 0, total: 0, points: 0 });
    setShowGameOverDialog(false);
    setAvatarGame(avatarGameLogic.resetGame());
    setPreviousPrice(null);
  };

  const checkGuess = (guess: 'up' | 'down') => {
    if (currentIndex < data.length - 1) {
      const nextDayData = data[currentIndex + 1];
      // Check if next day's close is above TARGET_PRICE (400)
      const isCorrect = (nextDayData.close > TARGET_PRICE && guess === 'up') || 
                        (nextDayData.close <= TARGET_PRICE && guess === 'down');
      
      // Score is 1 if next day's close > TARGET_PRICE (400), else 0
      const pointsEarned = nextDayData.close > TARGET_PRICE ? 1 : 0;
      
      setScore(prevScore => ({
        ...prevScore,
        correct: isCorrect ? prevScore.correct + 1 : prevScore.correct,
        total: prevScore.total + 1,
        points: isCorrect ? prevScore.points + pointsEarned : prevScore.points
      }));
      
      setGuessResult({
        guess,
        actual: nextDayData.close > TARGET_PRICE ? 'up' : 'down',
        isCorrect,
        nextDayPrice: nextDayData.close
      });
      
      // Update avatar game state based on guess
      const updatedAvatarState = avatarGameLogic.processGuess(
        guess,
        currentIndex,
        nextDayData,
        avatarGame
      );
      
      // Show ride image for successful answers
      if (isCorrect) {
        updatedAvatarState.backgroundImage = '/IMAGE/ride.png';
      }
      
      setAvatarGame(updatedAvatarState);
    }
    setShowGuessDialog(false);
    setShowResultDialog(true);
  };

  const continuePlayback = () => {
    setShowResultDialog(false);
    setIsPaused(false);
    // Always advance to the next day after showing the result
    setCurrentIndex(prevIndex => prevIndex + 1);
  };

  return (
    <div className="container">
      <SoundControl className="avatar-mode" />
      <motion.h1 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-4xl font-bold text-blue-500 mb-6 text-center w-full"
        style={{ textShadow: '0 0 10px rgba(0, 150, 255, 0.8)' }}
      >
        Toruk Makto: The BIOCON Dragon
      </motion.h1>
      
      <div className="stats">
        <div className="stat-box">
          <div className="stat-label">Score</div>
          <div className="stat-value">{score.correct} / {score.total}</div>
          <div className="stat-percentage">
            {score.total > 0 ? `${Math.round((score.correct / score.total) * 100)}%` : '0%'}
          </div>
        </div>
        <div className="stat-box">
          <div className="stat-label">Day</div>
          <div className="stat-value">{currentIndex + 1} / {data.length}</div>
          <div className="stat-percentage">
            {data.length > 0 ? `${Math.round(((currentIndex + 1) / data.length) * 100)}%` : '0%'}
          </div>
        </div>
      </div>
      
      <div className="chart-container" ref={chartRef}>
        <motion.div 
          className="chart-wrapper"
          animate={{
            scale: avatarGame.dragonIntensity > 0.7 ? [1, 1.02, 1] : 1,
          }}
          transition={{
            duration: 1,
            repeat: avatarGame.dragonIntensity > 0.7 ? Infinity : 0,
            repeatType: "reverse"
          }}
          style={{ position: 'relative' }}
        >
          <LineChart 
            width={1000} 
            height={600} 
            data={visibleData}
            margin={{ top: 5, right: 120, left: 5, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.7)" />
            <XAxis 
              dataKey="date" 
              tick={{ fill: '#000000', fontSize: 16, fontWeight: 'bold' }}
              tickFormatter={(date) => {
                const d = new Date(date);
                const month = d.getMonth();
                const year = d.getFullYear().toString().slice(-2);
                
                // Determine quarter based on month
                let quarter;
                if (month < 3) quarter = 'Q1';
                else if (month < 6) quarter = 'Q2';
                else if (month < 9) quarter = 'Q3';
                else quarter = 'Q4';
                
                return `${quarter} ${year}`;
              }}
              padding={{ right: 40 }}
              stroke="#000000"
              strokeWidth={2}
              interval={50} // Show only a few ticks
              height={60} // Increase height for X-axis
              label={{ value: 'Time Period', position: 'insideBottomRight', fill: '#000000', fontSize: 16, fontWeight: 'bold', dy: 15 }}
            />
            <YAxis 
              domain={[(dataMin: number) => Math.floor(dataMin * 0.95), (dataMax: number) => Math.ceil(dataMax * 1.05)]}
              padding={{ top: 20, bottom: 20 }}
              tick={{ fill: '#000000', fontSize: 16, fontWeight: 'bold' }}
              axisLine={{ stroke: '#000000', strokeWidth: 2 }}
              tickLine={{ stroke: '#000000', strokeWidth: 2 }}
              width={80}
              tickCount={5}
              tickFormatter={(value) => `₹${Math.round(value)}`}
              label={{ value: 'Price (₹)', angle: -90, position: 'insideLeft', fill: '#000000', fontSize: 16, fontWeight: 'bold' }}
            />
            <Tooltip />
            <ReferenceLine 
              y={PAUSE_PRICE} 
              stroke="#FF0000" 
              strokeWidth={3}
              strokeDasharray="5 5" 
              ifOverflow="extendDomain"
              label={{
                value: 'Dragon Path (₹390)', 
                position: 'insideTopLeft',
                fill: '#FF0000',
                fontSize: 16,
                fontWeight: 'bold',
                dy: -20
              }}
            />
            <ReferenceLine 
              y={TARGET_PRICE} 
              stroke="#00FF00" 
              strokeWidth={3}
              strokeDasharray="5 5" 
              ifOverflow="extendDomain"
              label={{
                value: 'Soaring Height (₹400)', 
                position: 'insideTopLeft',
                fill: '#00FF00',
                fontSize: 16,
                fontWeight: 'bold',
                dy: -20
              }}
            />
            <Line
              type="monotone"
              dataKey="close"
              stroke="#00ccff"
              dot={false}
              activeDot={{ r: 10, fill: '#00ffaa', stroke: '#00ccff', strokeWidth: 2 }}
              strokeWidth={3}
              animationDuration={300}
              isAnimationActive={true}
              animationEasing="ease-in-out"
            />
          </LineChart>
          
          {/* Avatar animation overlay */}
          {visibleData.length > 0 && (
            <AvatarAnimation
              playerState={avatarGame.playerState}
              currentPrice={visibleData[visibleData.length - 1]?.close || 0}
              chartWidth={1000}
              chartHeight={600}
              dragonIntensity={avatarGame.dragonIntensity}
              narrativeMessage={avatarGame.narrativeMessage}
            />
          )}
        </motion.div>
      </div>
      
      <div className="controls">
        <Button 
          onClick={handleStart} 
          disabled={isPlaying} 
          className="control-button start-button"
        >
          <span className="control-icon">▶</span> Start
        </Button>
        <Button 
          onClick={handlePause} 
          disabled={!isPlaying || isPaused} 
          className="control-button pause-button"
        >
          <span className="control-icon">⏸</span> Pause
        </Button>
        <Button 
          onClick={handleResume} 
          disabled={!isPaused || !isPlaying || showGuessDialog || showResultDialog} 
          className="control-button resume-button"
        >
          <span className="control-icon">▶▶</span> Resume
        </Button>
        <Button 
          onClick={resetGame} 
          className="control-button reset-button"
        >
          <span className="control-icon">⟳</span> Reset
        </Button>
      </div>
      
      {/* Avatar-themed Guess Dialog */}
      <AvatarDialog
        isOpen={showGuessDialog}
        onClose={() => setShowGuessDialog(false)}
        title="Ride the Dragon?"
        description={`Toruk Makto approaches! The dragon's path has reached ₹${visibleData[currentIndex]?.close?.toFixed(2) || '0'}. Will it soar above ₹400 or dive below?`}
        type="question"
        onGuessUp={() => checkGuess('up')}
        onGuessDown={() => checkGuess('down')}
        playerState={avatarGame.playerState}
      />

      {/* Avatar-themed Result Dialog */}
      <AvatarDialog
        isOpen={showResultDialog}
        onClose={() => setShowResultDialog(false)}
        title={guessResult.isCorrect ? 'Successful Flight!' : 'Flight Failed!'}
        description={avatarGame.narrativeMessage || `The dragon ${guessResult.actual === 'up' ? 'soared to' : 'dipped to'} ₹${guessResult.nextDayPrice.toFixed(2)}.`}
        type="result"
        onContinue={continuePlayback}
        playerState={avatarGame.playerState}
      />

      {/* Avatar-themed Game Over Dialog */}
      <AvatarDialog
        isOpen={showGameOverDialog}
        onClose={() => setShowGameOverDialog(false)}
        title="Journey Complete!"
        description={`Your journey with Toruk Makto has ended. ${score.total > 0 ? (score.correct / score.total > 0.5 ? 'You have proven yourself worthy of the Great Dragon!' : 'You must train harder to master the skies!') : ''}\n\nLoser how many more times do you want to lose money? Just wait for it to close decisively above 400 and then it will FLY!`}
        type="gameOver"
        onRestart={resetGame}
        playerState={avatarGame.playerState}
        score={score}
      />
    </div>
  );
}

export default App
