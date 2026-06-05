import React, { useState, useEffect, useContext } from "react";
import { FaPlay, FaPause, FaStop, FaPlus, FaBook } from "react-icons/fa";
import api from "../api";
import { TimerContext } from "../context/TimerContext";

const Focus = () => {
    const {
        workTime, setWorkTime,
        breakTime, setBreakTime,
        timeLeft,
        isActive,
        isBreak,
        selectedSubject, setSelectedSubject,
        toggleTimer, resetTimer, refreshTrigger
    } = useContext(TimerContext);

    // Subject State
    const [subjects, setSubjects] = useState([]);
    const [newSubjectName, setNewSubjectName] = useState("");

    // Manual Log State
    const [manualDuration, setManualDuration] = useState("");

    // Activity State
    const [activity, setActivity] = useState([]);
    const [filterSubject, setFilterSubject] = useState("");

    useEffect(() => {
        fetchSubjects();
    }, [refreshTrigger]);

    useEffect(() => {
        fetchActivity();
    }, [filterSubject, refreshTrigger]);

    const fetchSubjects = async () => {
        try {
            const subjRes = await api.get("/api/subjects/");
            setSubjects(subjRes.data);
            if (subjRes.data.length > 0 && !selectedSubject) {
                // Ensure default remains empty for "Select Topic" placeholder
            }
        } catch (err) {
            console.error(err);
        }
    };

    const fetchActivity = async () => {
        try {
            let url = "/api/activity/";
            if (filterSubject) {
                url += `?subject_id=${filterSubject}`;
            }
            const actRes = await api.get(url);
            setActivity(actRes.data);
        } catch (err) {
            console.error(err);
        }
    };

    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60).toString().padStart(2, "0");
        const s = (seconds % 60).toString().padStart(2, "0");
        return `${m}:${s}`;
    };

    // Subject Actions
    const handleAddSubject = async () => {
        if (!newSubjectName.trim()) return;
        try {
            const res = await api.post("/api/subjects/", { name: newSubjectName });
            setSubjects([...subjects, res.data]);
            setSelectedSubject("");
            setNewSubjectName("");
        } catch (err) {
            console.error(err);
        }
    };

    const handleManualLog = async () => {
        if (!selectedSubject || !manualDuration) return;
        try {
            await api.post("/api/study-sessions/", {
                subject: selectedSubject,
                duration: parseInt(manualDuration, 10)
            });
            setManualDuration("");
            setSelectedSubject("");
            fetchSubjects();
            fetchActivity();
            alert("Manual time logged!");
        } catch (err) {
            console.error(err);
        }
    };

    // Calendar Helpers
    // Create a 90-day grid
    const today = new Date();
    const calendarDays = Array.from({ length: 90 }, (_, i) => {
        const d = new Date(today);
        d.setDate(d.getDate() - (89 - i));
        const dateStr = d.toISOString().split("T")[0];
        const record = activity.find((a) => a.date === dateStr);
        return {
            date: dateStr,
            minutes: record ? record.total_minutes : 0
        };
    });

    const getOpacity = (minutes) => {
        if (minutes === 0) return "bg-[#3B2A1F]/5";
        if (minutes < 30) return "bg-green-300";
        if (minutes < 60) return "bg-green-400";
        if (minutes < 120) return "bg-green-500";
        return "bg-green-600";
    };

    return (
        <div className="ml-64 min-h-screen bg-[#F7EACD] p-6 font-inter text-[#3B2A1F]">
            <div className="w-full bg-[#FFE455] rounded-[3rem] p-10 border-4 border-white/20 min-h-[calc(100vh-3rem)] shadow-sm">
                <header className="mb-10">
                    <h2 className="text-4xl font-black mb-2 text-[#3B2A1F]">Focus Mode</h2>
                    <p className="text-[#3B2A1F]/70 font-medium">Eliminate distractions and track your study sessions.</p>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                    {/* POMODORO TIMER */}
                    <div className="bg-white/60 p-8 rounded-3xl border-2 border-white shadow-sm flex flex-col items-center">
                    <div className="mb-6 flex gap-4 w-full justify-center">
                        <div className="flex flex-col items-center">
                            <label className="font-bold text-xs mb-1">WORK (MIN)</label>
                            <input
                                type="number"
                                value={workTime}
                                onChange={(e) => setWorkTime(Number(e.target.value))}
                                className="w-20 p-2 text-center border-2 border-black rounded-lg bg-white/60 font-bold"
                                disabled={isActive}
                            />
                        </div>
                        <div className="flex flex-col items-center">
                            <label className="font-bold text-xs mb-1">BREAK (MIN)</label>
                            <input
                                type="number"
                                value={breakTime}
                                onChange={(e) => setBreakTime(Number(e.target.value))}
                                className="w-20 p-2 text-center border-2 border-black rounded-lg bg-white/60 font-bold"
                                disabled={isActive}
                            />
                        </div>
                    </div>

                    <div className="relative w-64 h-64 mb-8">
                        <div className={`absolute inset-0 rounded-full border-[12px] shadow-inner transition-colors duration-500 ${isBreak ? 'border-blue-400' : 'border-[#3B2A1F]'}`}></div>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-6xl font-black tracking-tighter">
                                {formatTime(timeLeft)}
                            </span>
                            <span className="text-sm font-bold uppercase tracking-widest mt-2 opacity-70">
                                {isBreak ? "Break" : "Focus"}
                            </span>
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <button
                            onClick={toggleTimer}
                            className="w-16 h-16 rounded-full bg-black text-white flex items-center justify-center shadow-lg hover:scale-110 transition-transform active:scale-95"
                        >
                            {isActive ? <FaPause size={24} /> : <FaPlay size={24} className="ml-1" />}
                        </button>
                        <button
                            onClick={resetTimer}
                            className="w-16 h-16 rounded-full bg-white border-4 border-black text-black flex items-center justify-center shadow-lg hover:scale-110 transition-transform active:scale-95"
                        >
                            <FaStop size={24} />
                        </button>
                    </div>
                </div>

                <div className="flex flex-col gap-8">
                    {/* SUBJECT ALLOCATION */}
                    <div className="bg-white/60 p-8 rounded-3xl border-2 border-white shadow-sm">
                        <h3 className="text-[#3B2A1F] text-xl font-black mb-4 flex items-center gap-2"><FaBook /> Topic Time Log</h3>

                        <div className="flex flex-col gap-4 mb-6">
                            <select
                                value={selectedSubject}
                                onChange={(e) => setSelectedSubject(e.target.value)}
                                className="w-full p-4 border-2 border-black rounded-xl bg-white font-bold"
                            >
                                <option value="" disabled>Select Topic</option>
                                {subjects.map(s => (
                                    <option key={s.id} value={s.id}>{s.name}</option>
                                ))}
                            </select>

                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    placeholder="New subject name..."
                                    value={newSubjectName}
                                    onChange={(e) => setNewSubjectName(e.target.value)}
                                    className="flex-1 p-3 border-2 border-black rounded-xl bg-white outline-none"
                                />
                                <button onClick={handleAddSubject} className="px-6 bg-[#3B2A1F] text-white rounded-xl font-bold hover:bg-gray-800 transition-colors">
                                    <FaPlus />
                                </button>
                            </div>
                        </div>

                        <hr className="border-black/10 my-4" />

                        <div className="flex items-end gap-2">
                            <div className="flex-1">
                                <label className="text-xs font-bold mb-1 block">MANUAL LOG (MINUTES)</label>
                                <input
                                    type="number"
                                    value={manualDuration}
                                    onChange={(e) => setManualDuration(e.target.value)}
                                    placeholder="e.g. 45"
                                    className="w-full p-3 border-2 border-black rounded-xl bg-white outline-none"
                                />
                            </div>
                            <button onClick={handleManualLog} className="px-6 py-3 bg-[#3B2A1F] text-white rounded-xl font-black hover:-translate-y-1 transition-transform shadow-lg">
                                Log Time
                            </button>
                        </div>
                    </div>

                    {/* ACTIVITY STREAK */}
                    <div className="bg-white/60 p-8 rounded-3xl border-2 border-white shadow-sm flex-1">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-[#3B2A1F] text-xl font-black">Activity Log (Last 90 Days)</h3>
                            <select
                                value={filterSubject}
                                onChange={(e) => setFilterSubject(e.target.value)}
                                className="p-2 border-2 border-black rounded-lg bg-white font-bold text-sm"
                            >
                                <option value="">All Topics</option>
                                {subjects.map(s => (
                                    <option key={s.id} value={s.id}>{s.name} ({s.total_time} mins)</option>
                                ))}
                            </select>
                        </div>
                        <div className="grid grid-cols-[repeat(15,minmax(0,1fr))] gap-2">
                            {calendarDays.map((day, idx) => (
                                <div
                                    key={idx}
                                    className={`aspect-square rounded-md ${getOpacity(day.minutes)} transition-colors duration-300 hover:border-black border-2 border-transparent`}
                                    title={`${day.date}: ${day.minutes} mins`}
                                ></div>
                            ))}
                        </div>
                        <div className="flex items-center gap-2 mt-4 text-xs font-bold opacity-70 justify-end">
                            <span>Less</span>
                            <div className="w-3 h-3 rounded-sm bg-[#3B2A1F]/5"></div>
                            <div className="w-3 h-3 rounded-sm bg-green-300"></div>
                            <div className="w-3 h-3 rounded-sm bg-green-400"></div>
                            <div className="w-3 h-3 rounded-sm bg-green-500"></div>
                            <div className="w-3 h-3 rounded-sm bg-green-600"></div>
                            <span>More</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        </div>
    );
};

export default Focus;
