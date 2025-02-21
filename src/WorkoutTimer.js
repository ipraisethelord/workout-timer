import React, { useState, useEffect, useRef } from 'react';
import './WorkoutTimer.css';

const WorkoutTimer = () => {
  const [count, setCount] = useState(0);
  const [loopCount, setLoopCount] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isBreaking, setIsBreaking] = useState(false); // New state for break
  const [targetCount, setTargetCount] = useState(100); // Default to 100
  const intervalRef = useRef(null);
  const timeoutRef = useRef(null);
  const hasIncrementedRef = useRef(false); // Flag to prevent double increment
  const synthRef = useRef(window.speechSynthesis);

  // Function to play number sound with queue clearing
  const speakNumber = (number) => {
    synthRef.current.cancel();
    const utterance = new SpeechSynthesisUtterance(number.toString());
    synthRef.current.speak(utterance);
  };

  // Handle target count input change
  const handleTargetCountChange = (e) => {
    const value = parseInt(e.target.value, 10);
    if (!isNaN(value) && value > 0) {
      setTargetCount(value);
    } else if (e.target.value === '') {
      setTargetCount(''); // Allow empty input while typing
    }
  };

  // Counting logic
  useEffect(() => {
    if (isRunning && !isPaused && !isBreaking) {
      const synth = synthRef.current;
      intervalRef.current = setInterval(() => {
        setCount((prevCount) => {
          if (prevCount < targetCount) {
            const nextCount = prevCount + 1;
            speakNumber(nextCount);
            return nextCount;
          } else {
            clearInterval(intervalRef.current);
            if (!hasIncrementedRef.current) {
              setLoopCount((prev) => prev + 1); // Increment only once
              hasIncrementedRef.current = true; // Mark as incremented
            }
            setCount(0);
            setIsRunning(false);
            setIsBreaking(true); // Enter break state
            return targetCount;
          }
        });
      }, 1000);

      return () => {
        clearInterval(intervalRef.current);
        synth.cancel();
      };
    }
  }, [isRunning, isPaused, isBreaking, targetCount]);

  // Break and restart logic
  useEffect(() => {
    if (isBreaking) {
      timeoutRef.current = setTimeout(() => {
        setCount(1);
        speakNumber(1);
        setIsBreaking(false);
        setIsRunning(true);
        hasIncrementedRef.current = false; // Reset flag for next loop
      }, 5000);

      return () => clearTimeout(timeoutRef.current);
    }
  }, [isBreaking]);

  // Button handlers
  const handleStart = () => {
    if (!isRunning && !isBreaking && targetCount > 0) {
      setIsRunning(true);
      setIsPaused(false);
      clearTimeout(timeoutRef.current);
      if (count === 0) {
        setCount(1);
        speakNumber(1);
      }
    }
  };

  const handlePauseContinue = () => {
    if (isRunning) {
      if (isPaused) {
        setIsPaused(false);
        setCount((prevCount) => {
          const nextCount = prevCount < targetCount ? prevCount + 1 : prevCount;
          speakNumber(nextCount);
          return nextCount;
        });
      } else {
        setIsPaused(true);
        clearInterval(intervalRef.current);
        synthRef.current.cancel();
      }
    }
  };

  const handleStop = () => {
    if (isRunning || isBreaking) {
      setIsRunning(false);
      setIsPaused(false);
      setIsBreaking(false);
      clearInterval(intervalRef.current);
      clearTimeout(timeoutRef.current);
      synthRef.current.cancel();
      setCount(0);
      hasIncrementedRef.current = false;
    }
  };

  const handleRestart = () => {
    setIsRunning(false);
    setIsPaused(false);
    setIsBreaking(false);
    setCount(0);
    setLoopCount(0);
    clearInterval(intervalRef.current);
    clearTimeout(timeoutRef.current);
    synthRef.current.cancel();
    hasIncrementedRef.current = false;
  };

  return (
    <div className="timer-container">
      <div className="loop-display">Loop: {loopCount}</div>
      <h2 className="counter" style={{ color: 'red' }}>
        {count}
      </h2>
      <div className="input-container">
        <label htmlFor="targetCount">Count to: </label>
        <input
          id="targetCount"
          type="number"
          value={targetCount}
          onChange={handleTargetCountChange}
          min="1"
          disabled={isRunning || isBreaking}
          placeholder="Enter count"
        />
      </div>
      <div className="buttons">
        <button onClick={handleStart} disabled={isRunning || isBreaking}>
          Start
        </button>
        <button onClick={handlePauseContinue} disabled={!isRunning}>
          {isPaused ? 'Continue' : 'Pause'}
        </button>
        <button onClick={handleStop} disabled={!isRunning && !isBreaking}>
          Stop
        </button>
        <button onClick={handleRestart}>Restart</button>
      </div>
    </div>
  );
};

export default WorkoutTimer;