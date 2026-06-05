import React, { createContext, useState, useEffect } from 'react';
import api from '../api';

export const TimerContext = createContext();

export const TimerProvider = ({ children }) => {
  // Helpers for localStorage
  const getStoredNumber = (key, defaultVal) => {
    const val = localStorage.getItem(key);
    return val !== null ? Number(val) : defaultVal;
  };
  const getStoredBool = (key, defaultVal) => {
    const val = localStorage.getItem(key);
    return val !== null ? val === 'true' : defaultVal;
  };

  const [workTime, setWorkTime] = useState(() => getStoredNumber('pomo_work', 25));
  const [breakTime, setBreakTime] = useState(() => getStoredNumber('pomo_break', 5));
  const [timeLeft, setTimeLeft] = useState(() => getStoredNumber('pomo_time', 25 * 60));
  const [isActive, setIsActive] = useState(() => getStoredBool('pomo_active', false));
  const [isBreak, setIsBreak] = useState(() => getStoredBool('pomo_isBreak', false));
  const [selectedSubject, setSelectedSubject] = useState("");
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Sync state across tabs
  useEffect(() => {
    const handleStorage = (e) => {
      if (e.key === 'pomo_work') setWorkTime(Number(e.newValue));
      if (e.key === 'pomo_break') setBreakTime(Number(e.newValue));
      if (e.key === 'pomo_time') setTimeLeft(Number(e.newValue));
      if (e.key === 'pomo_active') setIsActive(e.newValue === 'true');
      if (e.key === 'pomo_isBreak') setIsBreak(e.newValue === 'true');
      if (e.key === 'pomo_refresh') setRefreshTrigger(Number(e.newValue));
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  // Sync setters
  const updateWorkTime = (val) => { setWorkTime(val); localStorage.setItem('pomo_work', val); };
  const updateBreakTime = (val) => { setBreakTime(val); localStorage.setItem('pomo_break', val); };
  const updateTimeLeft = (val) => { setTimeLeft(val); localStorage.setItem('pomo_time', val); };
  const updateIsActive = (val) => { setIsActive(val); localStorage.setItem('pomo_active', val); };
  const updateIsBreak = (val) => { setIsBreak(val); localStorage.setItem('pomo_isBreak', val); };
  const triggerRefresh = () => { 
    setRefreshTrigger(prev => {
      const next = prev + 1;
      localStorage.setItem('pomo_refresh', next);
      return next;
    });
  };

  // We need to make sure only ONE tab handles completion
  // We can do this by setting a completion lock
  async function handleComplete() {
    updateIsActive(false);
    localStorage.removeItem('pomo_target');

    const lockKey = 'pomo_complete_lock';
    const lastComplete = Number(localStorage.getItem(lockKey)) || 0;
    if (Date.now() - lastComplete < 5000) return; // Already handled by another tab within 5 seconds
    localStorage.setItem(lockKey, Date.now().toString());

    if (!isBreak) {
      // Work session finished
      try {
        await api.post("/api/pomodoro/", { duration: workTime });
        if (selectedSubject) {
          await api.post("/api/study-sessions/", {
            subject: selectedSubject,
            duration: workTime
          });
        }
        alert("Work session complete! Time for a break.");
        updateIsBreak(true);
        updateTimeLeft(breakTime * 60);
        setSelectedSubject("");
        triggerRefresh();
      } catch (err) {
        console.error(err);
      }
    } else {
      // Break session finished
      alert("Break complete! Ready to focus?");
      updateIsBreak(false);
      updateTimeLeft(workTime * 60);
    }
  }

  // Timer Logic
  // We use a targetTime in localStorage so all tabs count down consistently without drifting
  useEffect(() => {
    let interval = null;
    if (isActive) {
      let targetTime = Number(localStorage.getItem('pomo_target'));
      if (!targetTime) {
        targetTime = Date.now() + timeLeft * 1000;
        localStorage.setItem('pomo_target', targetTime);
      }

      interval = setInterval(() => {
        const remaining = Math.max(0, Math.ceil((targetTime - Date.now()) / 1000));
        updateTimeLeft(remaining);

        if (remaining <= 0) {
          clearInterval(interval);
          handleComplete();
        }
      }, 500); // 500ms for more responsive UI update
    } else {
      localStorage.removeItem('pomo_target');
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft]);

  // Update time left when settings change (if not active)
  useEffect(() => {
    if (!isActive) {
      updateTimeLeft(isBreak ? breakTime * 60 : workTime * 60);
    }
  }, [workTime, breakTime, isBreak]);

  const toggleTimer = () => {
    if (!isActive) {
      // Starting: set new target time
      localStorage.setItem('pomo_target', Date.now() + timeLeft * 1000);
    }
    updateIsActive(!isActive);
  };

  const resetTimer = () => {
    updateIsActive(false);
    updateIsBreak(false);
    updateTimeLeft(workTime * 60);
    localStorage.removeItem('pomo_target');
  };

  const value = {
    workTime, setWorkTime: updateWorkTime,
    breakTime, setBreakTime: updateBreakTime,
    timeLeft, setTimeLeft: updateTimeLeft,
    isActive, setIsActive: updateIsActive,
    isBreak, setIsBreak: updateIsBreak,
    selectedSubject, setSelectedSubject,
    toggleTimer, resetTimer, refreshTrigger
  };

  return (
    <TimerContext.Provider value={value}>
      {children}
    </TimerContext.Provider>
  );
};
