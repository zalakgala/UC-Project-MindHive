import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FiEye, FiEyeOff } from "react-icons/fi";
import api from "../api";

import { motion } from "framer-motion";

const swapVariants = {
  initial: (direction) => ({
    x: direction === "right" ? "100%" : "-100%",
    opacity: 0,
    scale: 0.8,
  }),
  animate: {
    x: 0,
    opacity: 1,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 70,
      damping: 20,
    },
  },
  exit: (direction) => ({
    x: direction === "right" ? "-100%" : "100%",
    opacity: 0,
    scale: 0.8,
    transition: { duration: 0.5 },
  }),
};

const cardTransition = {
  type: "spring",
  stiffness: 80,
  damping: 20,
  duration: 0.6,
};

const Signup = () => {
  const [mounted, setMounted] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState({});
  const [successMsg, setSuccessMsg] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    setMounted(true);
  }, []);

  // --- Regex Patterns ---
  const nameRegex = /^[a-zA-Z\s]{2,50}$/;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,}$/;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Name is required.";
    } else if (!nameRegex.test(formData.name)) {
      newErrors.name = "Please enter a valid name (letters only).";
    }

    if (!formData.email) {
      newErrors.email = "Email is required.";
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = "Please enter a valid email address.";
    }

    if (!formData.password) {
      newErrors.password = "Password is required.";
    } else if (!passwordRegex.test(formData.password)) {
      newErrors.password = "Min 8 chars, at least 1 letter & 1 number.";
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password.";
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccessMsg("");
    setErrors({});

    if (validateForm()) {
      try {
        const response = await api.post("/signup/", {
          username: formData.name, // The backend expects username
          email: formData.email,
          password: formData.password,
        });

        setSuccessMsg("Profile generated. Initializing your second brain...");
        setTimeout(() => {
          navigate("/login");
        }, 1500);
      } catch (err) {
        const backendError = err.response?.data?.error;
        if (backendError === "Username already exists") {
          setErrors((prev) => ({ ...prev, name: backendError }));
        } else {
          setErrors((prev) => ({
            ...prev,
            password: backendError || "Signup failed. Please try again.",
          }));
        }
      }
    }
  };

  /* --- HEX GRID MATH --- */
  const HEX_RADIUS = 49;
  const CX = 250;
  const CY = 250;
  const RINGS = 3;

  const getHexPoints = (cx, cy, r) => {
    const points = [];
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 180) * (60 * i - 90);
      points.push(`${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`);
    }
    return points.join(" ");
  };

  const hexGrid = [];
  for (let q = -RINGS; q <= RINGS; q++) {
    for (let r = -RINGS; r <= RINGS; r++) {
      const s = -q - r;
      if (
        Math.abs(q) <= RINGS &&
        Math.abs(r) <= RINGS &&
        Math.abs(s) <= RINGS
      ) {
        const distance = (Math.abs(q) + Math.abs(r) + Math.abs(s)) / 2;
        const x = CX + HEX_RADIUS * Math.sqrt(3) * (q + r / 2);
        const y = CY + HEX_RADIUS * (3 / 2) * r;
        const strokeWidth = Math.max(0.5, 3.5 - distance * 0.8);
        const opacity = Math.max(0.15, 1 - distance * 0.25);
        hexGrid.push({ x, y, distance, strokeWidth, opacity, id: `${q},${r}` });
      }
    }
  }

  /* --- FLYING FILES DATA --- */

  const flyingFiles = [
    {
      id: 1,
      path: "M-100,200 C100,200 300,400 500,500",
      dur: "6s",
      delay: "0s",
      type: "#icon-folder",
    },
    {
      id: 2,
      path: "M-200,800 C100,800 300,600 500,500",
      dur: "7s",
      delay: "2s",
      type: "#icon-pdf",
    },
    {
      id: 3,
      path: "M500,-100 C550,150 450,350 500,500",
      dur: "5.5s",
      delay: "1s",
      type: "#icon-png",
    },
    {
      id: 4,
      path: "M2200,-100 C1600,100 1000,300 500,500",
      dur: "8s",
      delay: "3s",
      type: "#icon-folder",
    },
    {
      id: 5,
      path: "M500,1200 C400,900 600,700 500,500",
      dur: "6.5s",
      delay: "0.5s",
      type: "#icon-pdf",
    },
    {
      id: 6,
      path: "M2200,1100 C1600,900 1000,700 500,500",
      dur: "7.5s",
      delay: "4s",
      type: "#icon-png",
    },
    {
      id: 7,
      path: "M-100,500 C150,450 350,550 500,500",
      dur: "6s",
      delay: "1.5s",
      type: "#icon-folder",
    },
    {
      id: 8,
      path: "M1200,-100 C1000,150 750,300 500,500",
      dur: "5s",
      delay: "2.5s",
      type: "#icon-pdf",
    },
    {
      id: 9,
      path: "M2100,500 C1500,400 1000,600 500,500",
      dur: "6s",
      delay: "0.8s",
      type: "#icon-png",
    },
  ];

  return (
    <>
      <motion.div
        initial="initial"
        animate="animate"
        exit="exit"
        className="relative w-screen h-screen bg-[#F7EACD] flex overflow-hidden font-inter"
      >
        <div className="relative w-screen h-screen bg-[#F7EACD] flex overflow-hidden font-inter">
          {/* --- Flying Files Background --- */}
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none"
            viewBox="0 0 2000 1000"
            preserveAspectRatio="xMidYMid slice"
          >
            <defs>
              <g id="icon-folder" transform="translate(-12, -12) scale(2)">
                <path
                  d="M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z"
                  fill="#fcd34d"
                />
              </g>
              <g id="icon-pdf" transform="translate(-12, -12) scale(2)">
                <path
                  d="M20 2H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-8.5 7.5c0 .83-.67 1.5-1.5 1.5H9v2H7.5V7H10c.83 0 1.5.67 1.5 1.5v1zm5 2c0 .83-.67 1.5-1.5 1.5h-2.5V7H15c.83 0 1.5.67 1.5 1.5v3zm4-3H19v1h1.5V11H19v2h-1.5V7h3v1.5zM9 9.5h1v-1H9v1zM4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm10 5.5h1v-3h-1v3z"
                  fill="#ef4444"
                />
              </g>
              <g id="icon-png" transform="translate(-12, -12) scale(2)">
                <path
                  d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"
                  fill="#38bdf8"
                />
              </g>
              <filter id="icon-glow">
                <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {flyingFiles.map((file) => (
              <g key={file.id} filter="url(#icon-glow)">
                <animateMotion
                  dur={file.dur}
                  begin={file.delay}
                  repeatCount="indefinite"
                  path={file.path}
                />
                <g>
                  <animateTransform
                    attributeName="transform"
                    type="scale"
                    values="1.5;1;0"
                    keyTimes="0;0.8;1"
                    dur={file.dur}
                    begin={file.delay}
                    repeatCount="indefinite"
                  />
                  <animate
                    attributeName="opacity"
                    values="0;0.8;0.8;0"
                    keyTimes="0;0.1;0.8;1"
                    dur={file.dur}
                    begin={file.delay}
                    repeatCount="indefinite"
                  />
                  <use href={file.type} />
                </g>
              </g>
            ))}
          </svg>

          {/* --- LEFT PANEL LOGO (Moved up) --- */}
          <motion.div
            custom="left" // Comes from left
            variants={swapVariants}
            className="flex-1 hidden md:flex items-center justify-center relative z-10"
          >
            <div className="flex-1 hidden md:flex items-center justify-center relative [transform-style:preserve-3d]">
              <div className="perspective-[1200px]">
                <div className="relative w-[500px] h-[500px] animate-[spin3D_10s_cubic-bezier(0.4,0,0.2,1)_infinite]">
                  <svg
                    className="absolute inset-0 drop-shadow-[0_0_12px_rgba(59,42,31,0.7)]"
                    viewBox="0 0 500 500"
                  >
                    {hexGrid.map((hex) => (
                      <polygon
                        key={hex.id}
                        points={getHexPoints(hex.x, hex.y, HEX_RADIUS)}
                        className="stroke-[#705741] fill-transparent"
                        style={{
                          strokeWidth: `${hex.strokeWidth}px`,
                          opacity: hex.opacity,
                        }}
                      />
                    ))}
                  </svg>

                  <div className="absolute inset-0 flex flex-col items-center justify-center text-[#544232] drop-shadow-[0_0_18px_rgba(59,42,31,0.8)]">
                    <h1 className="text-6xl lg:text-7xl font-bold tracking-[0.15em]">
                      MINDHIVE
                    </h1>
                    <p className="text-[#544232] text-lg tracking-wide mt-1">
                      Your Knowledge. Organized.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* --- RIGHT PANEL SIGNUP (Moved down) --- */}
          <motion.div
            custom="right" // Comes from right
            variants={swapVariants}
            className="flex-1 flex items-center justify-center p-4 lg:p-8 z-20"
          >
            <div className="flex-1 flex items-center justify-center p-4 lg:p-8 z-20">
              <main className="w-full max-w-[28rem]">
                <div
                  className={`transition-all duration-700 ${mounted ? "opacity-100 scale-100" : "opacity-0 scale-95"}`}
                >
                  <div className="p-6 rounded-[2.5rem] backdrop-blur-md border border-[#3B2A1F]/70 bg-white/20 shadow-[0_8px_32px_rgba(59,42,31,0.25)]">
                    <div className="text-center mb-5">
                      <h2 className="text-[#F5D739] tracking-[0.2em] uppercase font-bold text-lg">
                        Mindhive
                      </h2>
                      <h1 className="text-4xl font-bold text-[#3B2A1F] mt-2">
                        Join the Hive
                      </h1>
                      <p className="text-[#3B2A1F]/70 text-sm mt-2">
                        Initialize your personal knowledge system today.
                      </p>
                    </div>

                    {successMsg && (
                      <div className="mb-6 text-[#F5D739] bg-[#F5D739]/10 border border-[#F5D739]/30 p-4 rounded-xl text-sm">
                        {successMsg}
                      </div>
                    )}

                    <form
                      onSubmit={handleSubmit}
                      className="flex flex-col gap-3"
                    >
                      {/* NAME */}
                      <div>
                        <label className="text-[#3B2A1F]/70 text-sm font-semibold">
                          Full Name
                        </label>
                        <input
                          name="name"
                          value={formData.name}
                          onChange={handleInputChange}
                          placeholder="Worker Bee"
                          className="mt-2 w-full bg-white/60 border border-[#3B2A1F]/30 rounded-xl px-4 py-3 text-[#3B2A1F] focus:border-[#F5D739] focus:ring-4 focus:ring-[#F5D739]/20 outline-none"
                        />
                        {errors.name && (
                          <p className="text-red-400 text-[11px] mt-1">
                            {errors.name}
                          </p>
                        )}
                      </div>

                      {/* EMAIL */}
                      <div>
                        <label className="text-[#3B2A1F]/70 text-sm font-semibold">
                          Email Address
                        </label>
                        <input
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          placeholder="bee@mindhive.com"
                          className="mt-2 w-full bg-white/60 border border-[#3B2A1F]/30 rounded-xl px-4 py-3 text-[#3B2A1F] focus:border-[#F5D739] focus:ring-4 focus:ring-[#F5D739]/20 outline-none"
                        />
                        {errors.email && (
                          <p className="text-red-400 text-[11px] mt-1">
                            {errors.email}
                          </p>
                        )}
                      </div>

                      {/* PASSWORD */}
                      <div>
                        <label className="text-[#3B2A1F]/70 text-sm font-semibold">
                          Password
                        </label>
                        <div className="relative">
                          <input
                            type={showPassword ? "text" : "password"}
                            name="password"
                            value={formData.password}
                            onChange={handleInputChange}
                            placeholder="Password"
                            className="mt-2 w-full bg-white/60 border border-[#3B2A1F]/30 rounded-xl px-4 py-3 pr-12 text-[#3B2A1F] focus:border-[#F5D739] focus:ring-4 focus:ring-[#F5D739]/20 outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-4 bottom-3 text-[#3B2A1F]/50 hover:text-[#3B2A1F] transition-colors"
                          >
                            {showPassword ? (
                              <FiEyeOff size={18} />
                            ) : (
                              <FiEye size={18} />
                            )}
                          </button>
                        </div>
                        {errors.password && (
                          <p className="text-red-400 text-[11px] mt-1">
                            {errors.password}
                          </p>
                        )}
                      </div>

                      {/* CONFIRM PASSWORD */}
                      <div>
                        <label className="text-[#3B2A1F]/70 text-sm font-semibold">
                          Confirm Password
                        </label>
                        <div className="relative">
                          <input
                            type={showConfirmPassword ? "text" : "password"}
                            name="confirmPassword"
                            value={formData.confirmPassword}
                            onChange={handleInputChange}
                            placeholder="Confirm Password"
                            className="mt-2 w-full bg-white/60 border border-[#3B2A1F]/30 rounded-xl px-4 py-3 pr-12 text-[#3B2A1F] focus:border-[#F5D739] focus:ring-4 focus:ring-[#F5D739]/20 outline-none"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setShowConfirmPassword(!showConfirmPassword)
                            }
                            className="absolute right-4 bottom-3 text-[#3B2A1F]/50 hover:text-[#3B2A1F] transition-colors"
                          >
                            {showConfirmPassword ? (
                              <FiEyeOff size={18} />
                            ) : (
                              <FiEye size={18} />
                            )}
                          </button>
                        </div>
                        {errors.confirmPassword && (
                          <p className="text-red-400 text-[11px] mt-1">
                            {errors.confirmPassword}
                          </p>
                        )}
                      </div>

                      <button
                        type="submit"
                        className="bg-[#F5D739] text-[#3B2A1F] font-bold py-4 rounded-xl hover:-translate-y-1 transition shadow-lg hover:shadow-[#F5D739]/40"
                      >
                        Create Account
                      </button>
                    </form>
                  </div>

                  <p className="text-center text-sm text-[#3B2A1F]/70 mt-4">
                    Already a member?{" "}
                    <Link
                      to="/login"
                      className="text-[#F5D739] hover:text-[#F5D739] font-semibold"
                    >
                      Log in here
                    </Link>
                  </p>
                </div>
              </main>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </>
  );
};

export default Signup;
