import { useState, useEffect, useRef } from 'react'
import './src-App.css'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine } from 'recharts'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './src-components-ui-dialog'
import { Button } from './src-components-ui-button'

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
  // const [totalGuesses, setTotalGuesses] = useState(0);
  const [guessResult, setGuessResult] = useState({
    guess: '',
    actual: '',
    isCorrect: false,
    nextDayPrice: 0
  });
  const [showResultDialog, setShowResultDialog] = useState(false);
  const [showGameOverDialog, setShowGameOverDialog] = useState(false);
  const timerRef = useRef<number | null>(null);

  // Load data on mount
  useEffect(() => {
    // Load data from the JSON file
    setData(bioconData);
  }, []);

  // Handle playback
  useEffect(() => {
    if (isPlaying && !isPaused && currentIndex < data.length) {
      timerRef.current = window.setTimeout(() => {
        const currentData = data[currentIndex];
        setVisibleData(prev => [...prev, currentData]);
        
        // Check if we've reached the end of data
        if (currentIndex === data.length - 1) {
          setIsPaused(true);
          setShowGameOverDialog(true);
          return;
        }
        
        // Check if close is above PAUSE_PRICE
        if (currentData.close > PAUSE_PRICE) {
          setIsPaused(true);
          setShowGuessDialog(true);
        } else {
          setCurrentIndex(prev => prev + 1);
        }
      }, PLAYBACK_SPEED);
    }

    return () => {
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
      }
    };
  }, [isPlaying, isPaused, currentIndex, data]);

  const handleStart = () => {
    setIsPlaying(true);
    setIsPaused(false);
  };

  const handlePause = () => {
    setIsPaused(true);
  };

  // Reset function removed - using resetGame instead

  const resetGame = () => {
    setIsPlaying(false);
    setIsPaused(false);
    setCurrentIndex(0);
    setVisibleData([]);
    setScore({ correct: 0, total: 0, points: 0 });
    setTotalGuesses(0);
    setShowGameOverDialog(false);
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
      <h1>BIOCON.NS Stock Game</h1>
      
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
      
      <div className="chart-container">
        <LineChart 
          width={1000} 
          height={600} 
          data={visibleData}
          margin={{ top: 20, right: 30, left: 20, bottom: 10 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="date" 
            domain={['dataMin', 'dataMax']} 
            type="category"
            padding={{ right: 50 }}
          />
          <YAxis 
            domain={[(dataMin: number) => Math.floor(dataMin * 0.95), (dataMax: number) => Math.ceil(dataMax * 1.05)]}
            padding={{ top: 20, bottom: 20 }}
          />
          <Tooltip />
          <ReferenceLine y={PAUSE_PRICE} stroke="red" strokeDasharray="3 3" />
          <ReferenceLine y={TARGET_PRICE} stroke="green" strokeDasharray="3 3" label={`Target: ${TARGET_PRICE}`} />
          <Line 
            type="monotone" 
            dataKey="close" 
            stroke="#8884d8" 
            dot={false}
            isAnimationActive={true}
          />
        </LineChart>
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
          onClick={resetGame} 
          className="control-button reset-button"
        >
          <span className="control-icon">⟳</span> Reset
        </Button>
      </div>
      
      <Dialog open={showGuessDialog} onOpenChange={setShowGuessDialog}>
        <DialogContent className="guess-dialog">
          <DialogHeader>
            <DialogTitle>Make Your Prediction</DialogTitle>
            <DialogDescription>
              <div className="price-info">
                <p><strong>Date:</strong> {data[currentIndex]?.date}</p>
                <p><strong>Biocon stock price today is {PAUSE_PRICE}; do you think it will go above {TARGET_PRICE} and sustain there?</strong></p>
                <p>Open: {data[currentIndex]?.open.toFixed(2)}</p>
                <p>High: {data[currentIndex]?.high.toFixed(2)}</p>
                <p>Low: {data[currentIndex]?.low.toFixed(2)}</p>
                <p>Close: {data[currentIndex]?.close.toFixed(2)}</p>
              </div>
            </DialogDescription>
          </DialogHeader>
          <div className="guess-buttons">
            <Button className="guess-button up" onClick={() => checkGuess('up')}>
              <span className="arrow up">↑</span> Yes, Above {TARGET_PRICE}
            </Button>
            <Button className="guess-button down" onClick={() => checkGuess('down')}>
              <span className="arrow down">↓</span> No, Below {TARGET_PRICE}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showResultDialog} onOpenChange={setShowResultDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{guessResult?.isCorrect ? 'Correct!' : 'Incorrect!'}</DialogTitle>
          </DialogHeader>
          <div>
            <p>You guessed: {guessResult?.guess === 'up' ? `Above ${TARGET_PRICE}` : `Below ${TARGET_PRICE}`}</p>
            <p>Actual next day close: {guessResult?.nextDayPrice?.toFixed(2)}</p>
            <p>Result: {guessResult?.actual === 'up' ? `Above ${TARGET_PRICE}` : `Below ${TARGET_PRICE}`}</p>
            <p>Points earned: {guessResult?.actual === 'up' ? '1' : '0'}</p>
          </div>
          <Button onClick={continuePlayback}>Continue</Button>
        </DialogContent>
      </Dialog>

      <Dialog open={showGameOverDialog} onOpenChange={setShowGameOverDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Game Over!</DialogTitle>
          </DialogHeader>
          <div className="game-over-content">
            <p className="final-score">Final Score: {score.correct} / {score.total}</p>
            <p className="final-points">Total Points: {score.points}</p>
            <p className="loser-message">Loser how many more times do you want to lose money? Just wait for it to close decisively above 400 and then it will FLY!</p>
          </div>
          <Button onClick={resetGame}>Play Again</Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default App
