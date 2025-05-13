import React, { useEffect, useState, useRef } from 'react';
import '../styles/CatchTheBox.css'; // Create this CSS file or embed styles as needed
import { wrapperFetch } from '../../utils/wrapperfetch';

const CatchTheBox = () => {
  const GRID_SIZE = 10; // grid is 10 x 10 = 100 cells
  const TOTAL_CELLS = GRID_SIZE * GRID_SIZE;
  const INITIAL_INTERVAL = 3000; // box appears for 3 seconds
  const MIN_INTERVAL = 500; // minimum interval of 0.5 seconds
  const SCORE_THRESHOLD = 10; // every 10 catches, increase speed

  const [isPlaying, setIsPlaying] = useState(false);
  const [score, setScore] = useState(0);
  const [intervalTime, setIntervalTime] = useState(INITIAL_INTERVAL);
  const [randomIndex, setRandomIndex] = useState(null);
  const [timeLeft, setTimeLeft] = useState(INITIAL_INTERVAL / 1000);
  const [gameOver, setGameOver] = useState(false);
  const [highScore, setHighScore] = useState(() => {
    return Number(localStorage.getItem('ctbHighScore')) || 0;
  });

  const boxIntervalRef = useRef(null);
  const countdownIntervalRef = useRef(null);

  // Generate a new random box index
  const generateRandomBox = () => {
    const random = Math.floor(Math.random() * TOTAL_CELLS);
    setRandomIndex(random);
  };

  // Ends the game (if user misses the box before timer runs out)
  const endGame = () => {
    setIsPlaying(false);
    setGameOver(true);
    clearInterval(boxIntervalRef.current);
    clearInterval(countdownIntervalRef.current);
    // Update high score if needed.
    if (score > highScore) {
      setHighScore(score);
      localStorage.setItem('ctbHighScore', score);
    }
  };

  const startGame = () => {
    setIsPlaying(true);
    setGameOver(false);
    setScore(0);
    setIntervalTime(INITIAL_INTERVAL);
    setTimeLeft(INITIAL_INTERVAL / 1000);
    generateRandomBox();

    // Clear any existing intervals.
    clearInterval(boxIntervalRef.current);
    clearInterval(countdownIntervalRef.current);

    // Start a countdown timer that updates every second.
    countdownIntervalRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          endGame();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Start the interval for new box appearance.
    boxIntervalRef.current = setInterval(() => {
      generateRandomBox();
      // Reset timer to the current interval value (in seconds)
      setTimeLeft(intervalTime / 1000);
    }, INITIAL_INTERVAL);
  };

  const pauseGame = () => {
    setIsPlaying(false);
    clearInterval(boxIntervalRef.current);
    clearInterval(countdownIntervalRef.current);
  };

  const handleCellClick = (index) => {
    if (!isPlaying || gameOver) return;
    if (index === randomIndex) {
      // Increase score if user clicks the active (orange) cell.
      setScore(prev => prev + 1);
      // Every 10 catches, if interval is above MIN_INTERVAL, decrease interval by 500 ms.
      if ((score + 1) % SCORE_THRESHOLD === 0 && intervalTime > MIN_INTERVAL) {
        const newInterval = Math.max(intervalTime - 500, MIN_INTERVAL);
        setIntervalTime(newInterval);
        // Restart the interval with the reduced speed.
        clearInterval(boxIntervalRef.current);
        boxIntervalRef.current = setInterval(() => {
          generateRandomBox();
          setTimeLeft(newInterval / 1000);
        }, newInterval);
      }
      // Generate a new box immediately and reset countdown timer.
      generateRandomBox();
      setTimeLeft(intervalTime / 1000);
    }
  };

  // Clear intervals on component unmount.
  useEffect(() => {
    return () => {
      clearInterval(boxIntervalRef.current);
      clearInterval(countdownIntervalRef.current);
    };
  }, []);

  return (
    <div className="catch-the-box">
      <h2 className="Catchthebox-title-name">Catch The Box</h2>
      <div className="game-info">
        <div className="Catchthebox-score">Score: {score}</div>
        <div className="Catchthebox-tiemleft">{isPlaying ? `Time Left: ${timeLeft}s` : 'Paused'}</div>
        <div className="Catchthebox-time">Speed: {(intervalTime / 1000).toFixed(1)}s</div>
        <div className="Catchthebox-highscore">High Score: {highScore}</div>
      </div>
      <div className="grid-container">
        {Array.from({ length: TOTAL_CELLS }).map((_, index) => (
          <div
            key={index}
            className={`grid-cell ${index === randomIndex ? 'active' : ''}`}
            onClick={() => handleCellClick(index)}
          />
        ))}
      </div>
      <div className="game-controls">
        {gameOver ? (
          <>
            <div className="game-over-message">Game Over! Final Score: {score}</div>
            <button onClick={startGame}>Play Again</button>
          </>
        ) : (
          isPlaying ? (
            <button onClick={pauseGame}>Pause</button>
          ) : (
            <button onClick={startGame}>Play</button>
          )
        )}
      </div>
    </div>
  );
};

export default CatchTheBox;
