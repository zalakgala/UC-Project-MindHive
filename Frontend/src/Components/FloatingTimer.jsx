import React, { useContext, useState } from "react";
import { FaPlay, FaPause, FaStop, FaMinus, FaGripHorizontal } from "react-icons/fa";
import { TimerContext } from "../context/TimerContext";
import { motion } from "framer-motion";
import { useLocation } from "react-router-dom";

const FloatingTimer = () => {
  const location = useLocation();
  const {
    workTime, timeLeft, isActive, isBreak,
    toggleTimer, resetTimer
  } = useContext(TimerContext);

  const [isMinimized, setIsMinimized] = useState(false);

  // Only show the widget if it's not on the focus page AND the timer is actually running or paused (not reset)
  const isInitialState = !isActive && !isBreak && timeLeft === workTime * 60;
  if (location.pathname === "/focus" || location.pathname === "/viewer" || isInitialState) return null;

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  return (
    <motion.div
      drag
      dragMomentum={false}
      className="fixed bottom-8 right-8 z-[100] bg-[#FFE455] p-4 rounded-2xl shadow-[8px_8px_0px_0px_rgba(59,42,31,0.2)] border-4 border-[#3B2A1F] flex flex-col cursor-move"
      style={{ touchAction: "none" }}
    >
      <div className="flex justify-between items-center mb-2 border-b-2 border-[#3B2A1F]/20 pb-2">
        <div className="flex items-center gap-2">
          <FaGripHorizontal className="text-[#3B2A1F]/50" />
          <span className="font-black text-[#3B2A1F] text-sm uppercase tracking-wider">
            {isBreak ? "Break" : "Focus"}
          </span>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setIsMinimized(!isMinimized)} className="text-[#3B2A1F] hover:scale-110 transition-transform">
            <FaMinus />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <div className="flex flex-col items-center">
          <span className="text-4xl font-black tracking-tighter text-[#3B2A1F] my-2">
            {formatTime(timeLeft)}
          </span>
          <div className="flex gap-3 mt-2">
            <button
              onClick={toggleTimer}
              className="w-10 h-10 rounded-full bg-[#3B2A1F] text-white flex items-center justify-center shadow-md hover:scale-110 transition-transform active:scale-95"
            >
              {isActive ? <FaPause size={14} /> : <FaPlay size={14} className="ml-1" />}
            </button>
            <button
              onClick={resetTimer}
              className="w-10 h-10 rounded-full bg-white border-2 border-[#3B2A1F] text-[#3B2A1F] flex items-center justify-center shadow-md hover:scale-110 transition-transform active:scale-95"
            >
              <FaStop size={14} />
            </button>
          </div>
        </div>
      )}

      {isMinimized && (
        <div className="flex justify-center mt-1">
          <span className="text-xl font-black tracking-tighter text-[#3B2A1F]">
            {formatTime(timeLeft)}
          </span>
        </div>
      )}
    </motion.div>
  );
};

export default FloatingTimer;
