import React, { useState, useEffect, useRef } from 'react';
import './WorkoutTimer.css';

const WorkoutTimer = () => {
  const [count, setCount] = useState(0);
  const [loopCount, setLoopCount] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isBreaking, setIsBreaking] = useState(false);
  const [targetCount, setTargetCount] = useState(10);
  const [progress, setProgress] = useState(0);
  const intervalRef = useRef(null);
  const timeoutRef = useRef(null);
  const progressRef = useRef(null);
  const hasIncrementedRef = useRef(false);
  const synthRef = useRef(window.speechSynthesis);
  const [isSpeechSupported, setIsSpeechSupported] = useState('speechSynthesis' in window);

  // Load voices and ensure availability
  useEffect(() => {
    if (isSpeechSupported) {
      const loadVoices = () => {
        const voices = synthRef.current.getVoices();
        if (voices.length > 0) {
          console.log('Voices available:', voices);
        } else {
          console.warn('No voices available yet; waiting for voiceschanged event');
        }
      };
      synthRef.current.onvoiceschanged = loadVoices;
      loadVoices(); // Initial check
    } else {
      console.warn('Speech synthesis not supported in this browser');
    }
  }, [isSpeechSupported]);

  // Speak number with minimal interference
  const speakNumber = (number) => {
    if (!isSpeechSupported) {
      console.log('Speech synthesis not supported, skipping audio');
      return;
    }
    try {
      const voices = synthRef.current.getVoices();
      if (voices.length === 0) {
        console.warn('No voices available for speech synthesis');
        return;
      }
      synthRef.current.cancel(); // Clear only before speaking
      const utterance = new SpeechSynthesisUtterance(number.toString());
      // Set an English voice if available, fallback to first voice
      utterance.voice = voices.find((voice) => voice.lang.includes('en')) || voices[0];
      utterance.onerror = (event) => {
        console.error('Speech synthesis error:', event.error);
      };
      synthRef.current.speak(utterance);
    } catch (error) {
      console.error('Error in speakNumber:', error);
    }
  };

  // Handle target count input change
  const handleTargetCountChange = (e) => {
    const value = parseInt(e.target.value, 10);
    if (!isNaN(value) && value > 0) {
      setTargetCount(value);
    } else if (e.target.value === '') {
      setTargetCount('');
    }
  };

  // Counting logic
  useEffect(() => {
    if (isRunning && !isPaused && !isBreaking) {
      intervalRef.current = setInterval(() => {
        setCount((prevCount) => {
          if (prevCount < targetCount) {
            const nextCount = prevCount + 1;
            speakNumber(nextCount);
            return nextCount;
          } else {
            clearInterval(intervalRef.current);
            if (!hasIncrementedRef.current) {
              setLoopCount((prev) => prev + 1);
              hasIncrementedRef.current = true;
            }
            setCount(0);
            setProgress(0);
            setIsRunning(false);
            setIsBreaking(true);
            return targetCount;
          }
        });
      }, 1000);

      return () => {
        clearInterval(intervalRef.current);
        synthRef.current.cancel();
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
        hasIncrementedRef.current = false;
      }, 5000);

      return () => clearTimeout(timeoutRef.current);
    }
  }, [isBreaking]);

  // Smooth progress animation with adaptive steps
  useEffect(() => {
    if (isRunning && !isPaused && !isBreaking) {
      const startProgress = (count - 1) / targetCount * 100;
      const endProgress = count / targetCount * 100;
      // Reduce steps for Bing Android to prevent crash
      const isBingAndroid = /Android.*Bing/i.test(navigator.userAgent);
      const steps = isBingAndroid ? 20 : 200; // 20 steps (50ms) for Bing Android, 200 (5ms) elsewhere
      const stepDuration = 1000 / steps;

      progressRef.current = setInterval(() => {
        setProgress((prevProgress) => {
          if (prevProgress < endProgress) {
            const increment = (endProgress - startProgress) / steps;
            return Math.min(prevProgress + increment, endProgress);
          }
          clearInterval(progressRef.current);
          return prevProgress;
        });
      }, stepDuration);

      return () => clearInterval(progressRef.current);
    }
  }, [count, isRunning, isPaused, isBreaking, targetCount]);

  // Button handlers
  const handleStart = () => {
    if (!isRunning && !isBreaking && targetCount > 0) {
      setIsRunning(true);
      setIsPaused(false);
      clearTimeout(timeoutRef.current);
      if (count === 0) {
        setCount(1);
        setProgress(1 / targetCount * 100);
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
        clearInterval(progressRef.current);
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
      clearInterval(progressRef.current);
      clearTimeout(timeoutRef.current);
      synthRef.current.cancel();
      setCount(0);
      setProgress(0);
      hasIncrementedRef.current = false;
    }
  };

  const handleRestart = () => {
    setIsRunning(false);
    setIsPaused(false);
    setIsBreaking(false);
    setCount(0);
    setProgress(0);
    setLoopCount(0);
    clearInterval(intervalRef.current);
    clearInterval(progressRef.current);
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
      <div className="progress-bar">
        <div className="progress-fill" style={{ width: `${progress}%` }}></div>
      </div>
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