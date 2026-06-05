import React, { useRef, useEffect, useCallback, useState } from "react";
import { Link } from "react-router-dom";
import { Folder, Tag, Pin, Bookmark, Flame } from "lucide-react";
import { gsap } from "gsap";

import HoneyBee from "../assets/HoneyBee.png";
import HoneyBee2 from "../assets/HoneyBee2.png";
import HoneyBee3 from "../assets/HoneyBee3.png";
import Hive from "../assets/Hive.png";
import Logo from "../assets/Logo.png";
import Files from "../assets/Files.png";
import Melody from "../assets/Fonts/Melody.ttf";
import Maples from "../assets/Fonts/Maples.ttf";

// ==========================================
// 0. CURSOR FOLLOWING BEE
// ==========================================
const MouseBee = () => {
  const beeRef = useRef(null);

  useEffect(() => {
    const bee = beeRef.current;

    // Quick setters for better performance than standard gsap.to in mousemove
    const xSet = gsap.quickSetter(bee, "x", "px");
    const ySet = gsap.quickSetter(bee, "y", "px");
    const rSet = gsap.quickSetter(bee, "rotation", "deg");

    const handleMouseMove = (e) => {
      const { clientX, clientY } = e;

      // Get current position of the bee
      const rect = bee.getBoundingClientRect();
      const beeX = rect.left + rect.width / 2;
      const beeY = rect.top + rect.height / 2;

      // Calculate angle between bee and cursor
      // Math.atan2 returns radians, we convert to degrees
      const angle =
        Math.atan2(clientY - beeY, clientX - beeX) * (180 / Math.PI);

      // Move the bee
      gsap.to(bee, {
        x: clientX,
        y: clientY,
        duration: 0.8, // Adjust for "laziness" of the bee
        ease: "power2.out",
        overwrite: "auto",
        onUpdate: () => {
          // Update rotation to face the cursor
          // We add 90 or 180 depending on the image's natural orientation
          rSet(angle);
        },
      });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <div
      ref={beeRef}
      className="fixed top-0 left-0 z-[9999] pointer-events-none w-15 h-15 -ml-6 -mt-6 flex items-center justify-center"
    >
      <img
        src={HoneyBee3}
        alt="Following Bee"
        className="w-full h-full object-contain"
        style={{ transform: "rotate(180deg)" }} // Adjust this if the bee isn't facing "forward" by default
      />
    </div>
  );
};

// ==========================================
// 0.1. FLYING BEE
// ==========================================
const FloatingBee = ({ children, delay = 0, duration = 3, yDistance = 20 }) => {
  const beeRef = useRef(null);

  useEffect(() => {
    const element = beeRef.current;

    // Create the floating effect
    gsap.to(element, {
      y: `+=${yDistance}`, // Moves down
      rotation: 5, // Slight tilt
      duration: duration,
      ease: "sine.inOut",
      repeat: -1,
      yoyo: true, // Reverses the animation
      delay: delay,
    });

    // Subtler side-to-side drift
    gsap.to(element, {
      x: `+=${yDistance}`,
      duration: duration * 1.5,
      ease: "sine.inOut",
      repeat: -1,
      yoyo: true,
    });
  }, [delay, duration, yDistance]);

  return (
    <div ref={beeRef} className="absolute z-20 pointer-events-none">
      {children}
    </div>
  );
};

// ==========================================
// 1. SCROLL REVEAL COMPONENT (Fixed & Supercharged)
// ==========================================
const ScrollReveal = ({ children }) => {
  const ref = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        // If the section comes into view, show it
        if (entry.isIntersecting) {
          setIsVisible(true);
        } else {
          // If you scroll past it, hide it again so it re-animates next time!
          // (Remove this 'else' block later if you only want it to animate ONCE)
          setIsVisible(false);
        }
      },
      // Increased threshold to 0.25 (25% of the section must be visible before it triggers)
      { threshold: 0.25 },
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      // Used standard duration-1000 and increased the drop distance to translate-y-32
      className={`transition-all duration-1000 ease-out ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-32"
      }`}
    >
      {children}
    </div>
  );
};

const NavSection = () => {
  const scrollToSection = (id) => {
    const section = document.getElementById(id);
    section?.scrollIntoView({ behavior: "smooth" });
  };
  return (
    <>
      {/* Navigation Bar */}
      <nav className="bg-[#FFE455] flex justify-between items-center px-4 md:px-10 py-3 md:py-0 z-50 relative w-full border-b border-yellow-400">
        <img src={Logo} alt="Mindhive Logo" className="object-contain w-12 md:w-20" />

        <ul className="hidden md:flex list-none gap-16 text-xl font-medium text-gray-700">
          <li
            onClick={() => scrollToSection("home")}
            className="cursor-pointer hover:text-black hover:scale-150 transition-all"
          >
            Home
          </li>
          <li
            onClick={() => scrollToSection("features")}
            className="cursor-pointer hover:text-black hover:scale-150 transition-all"
          >
            Features
          </li>
          <li
            onClick={() => scrollToSection("about")}
            className="cursor-pointer hover:text-black hover:scale-150 transition-all"
          >
            About
          </li>
        </ul>

        <div className="flex gap-2 md:gap-4">
          <Link to={"/signup"}>
            <button className="px-3 md:px-6 py-1.5 md:py-2 text-sm md:text-base bg-[#F7EACD] rounded-full border-2 border-black font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] md:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-1 hover:bg-yellow-50 hover:shadow-none transition-all cursor-pointer">
              Sign Up
            </button>
          </Link>
          <Link to={"/login"}>
            <button className="px-3 md:px-6 py-1.5 md:py-2 text-sm md:text-base bg-[#F7EACD] rounded-full border-2 border-black font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] md:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-1 hover:bg-yellow-50 hover:shadow-none transition-all cursor-pointer">
              Login
            </button>
          </Link>
        </div>
      </nav>
    </>
  );
};

// ==========================================
// 2. HERO SECTION
// ==========================================
const HeroSection = () => {
  return (
    <div
      id="home"
      className="min-h-screen relative font-sans flex flex-col overflow-hidden"
    >
      {/* Main Content Area */}
      <main className="relative grow flex flex-col items-center justify-center w-full z-10">
        {/* Hexagon pushed strictly to top right */}
        <img
          src={Hive}
          alt="Honeycomb background"
          className="absolute right-0 top-10 w-64 md:w-[380px] z-0 opacity-40 pointer-events-none object-contain object-right-top"
        />

        <FloatingBee duration={2.5} yDistance={15}>
          <img
            src={HoneyBee}
            alt="Realistic Bee"
            className="absolute right-10 bottom-20 md:relative md:left-[37rem] md:bottom-60 drop-shadow-xl w-32 md:w-56 md:-mt-8"
          />
        </FloatingBee>

        {/* Cartoon Bee 1 - Size strictly locked to w-[260px] & pinned left */}
        <img
          src={HoneyBee2}
          alt="Cartoon Bee"
          className="absolute left-0 bottom-0 z-20 w-40 md:w-[260px] object-contain object-left-bottom"
        />

        {/* Text container z-index elevated */}
        <div className="text-center z-30 relative flex flex-col items-center mt-20 md:mt-0">
          <h1 className="maples text-[#3B2A1F] text-6xl md:text-8xl font-bold tracking-widest mb-4 md:mb-6 drop-shadow-md">
            MINDHIVE
          </h1>

          <div className="text-4xl sm:text-5xl md:text-9xl text-[#3B2A1F] mb-6 md:mb-10 flex flex-col items-center gap-2 mel text-center">
            <span className="inline-block ">Your knowledge</span>
            <span className="inline-block ">organized.</span>
          </div>

          <p className="text-lg md:text-2xl text-[#3B2A1F] font-semibold max-w-2xl text-center leading-relaxed mt-2 md:mt-4 pop px-4">
            Your second brain for notes, resources, and ideas. <br className="hidden md:block" />
            Designed to help you think clearly.
          </p>
        </div>
      </main>
    </div>
  );
};

// ==========================================
// 3. CLUTTER SECTION
// ==========================================
const ClutterSection = () => {
  return (
    <div
      id="clutter"
      className="min-h-screen flex items-center justify-center py-20 relative overflow-hidden"
    >
      <div className="flex flex-col md:flex-row w-full max-w-7xl mx-auto items-center justify-between z-10 gap-10 md:gap-0">
        {/* Left Side Images */}
        <div className="flex w-full md:w-1/2 justify-center pt-10 md:pt-20 ml-0 md:ml-10 relative px-4">
          <img src={Files} className="w-full md:w-[700px] " alt="Messy files" />
          <FloatingBee duration={2.5} yDistance={15}>
            <img
              src={HoneyBee}
              alt="Realistic Bee"
              className="hidden md:block absolute right-0 bottom-10 drop-shadow-xl w-56"
            />
          </FloatingBee>
        </div>

        {/* Right Side Text Container */}
        <div className="flex w-full md:w-1/2 flex-col relative px-4 bottom-0 md:bottom-16 items-center z-30">
          <h2 className="text-4xl sm:text-5xl md:text-8xl text-[#3B2A1F] font-normal tracking-wide leading-[1.1] mb-6 md:mb-8 text-center mel">
            Clutter Kills <br /> Focus
          </h2>
          <p className="text-lg md:text-2xl text-[#3B2A1F] font-semibold mb-6 md:mb-8 max-w-content text-center pop leading-relaxed px-4">
            Scattered notes, Endless Tabs Open <br className="hidden md:block" />
            Files lost in folder. Important ideas disappear <br className="hidden md:block" />
            when you need them.
          </p>
          <h3 className="text-4xl md:text-6xl text-[#EAB308] drop-shadow-sm text-center maples">
            There's a better way!
          </h3>
        </div>
      </div>

      {/* Cartoon Bee 2 - Size strictly matched to Slide 1 (w-[260px]) & pinned flush right */}
      <img
        src={HoneyBee3}
        alt="Cartoon Bee"
        className="absolute right-0 bottom-0 z-20 w-40 md:w-[260px] object-contain object-right-bottom drop-shadow-md block"
      />
    </div>
  );
};

// ==========================================
// 4. FEATURES SECTION (Hexagon Grid)
// ==========================================
const DEFAULT_PARTICLE_COUNT = 12;
const DEFAULT_SPOTLIGHT_RADIUS = 350;
const DEFAULT_GLOW_COLOR = "245, 158, 11";
const MOBILE_BREAKPOINT = 768;

const createParticleElement = (x, y, color = DEFAULT_GLOW_COLOR) => {
  const el = document.createElement("div");
  el.className = "particle pointer-events-none absolute z-50 rounded-full";
  el.style.cssText = `width: 4px; height: 4px; background: rgba(${color}, 1); box-shadow: 0 0 8px rgba(${color}, 0.8); left: ${x}px; top: ${y}px;`;
  return el;
};

const calculateSpotlightValues = (radius) => ({
  proximity: radius * 0.5,
  fadeDistance: radius * 0.75,
});

const updateCardGlowProperties = (card, mouseX, mouseY, glow, radius) => {
  const rect = card.getBoundingClientRect();
  const relativeX = ((mouseX - rect.left) / rect.width) * 100;
  const relativeY = ((mouseY - rect.top) / rect.height) * 100;
  card.style.setProperty("--glow-x", `${relativeX}%`);
  card.style.setProperty("--glow-y", `${relativeY}%`);
  card.style.setProperty("--glow-intensity", glow.toString());
  card.style.setProperty("--glow-radius", `${radius}px`);
};

const GlobalSpotlight = ({
  gridRef,
  disableAnimations,
  enabled,
  spotlightRadius,
  glowColor,
}) => {
  const spotlightRef = useRef(null);

  useEffect(() => {
    if (disableAnimations || !gridRef?.current || !enabled) return;

    const spotlight = document.createElement("div");
    spotlight.style.cssText = `
      position: fixed; width: 800px; height: 800px; border-radius: 50%; pointer-events: none;
      background: radial-gradient(circle, rgba(${glowColor}, 0.15) 0%, rgba(${glowColor}, 0.08) 15%, rgba(${glowColor}, 0.04) 25%, rgba(${glowColor}, 0.02) 40%, rgba(${glowColor}, 0.01) 65%, transparent 70%);
      z-index: 50; opacity: 0; transform: translate(-50%, -50%); mix-blend-mode: screen;
    `;
    document.body.appendChild(spotlight);
    spotlightRef.current = spotlight;

    const handleMouseMove = (e) => {
      if (!spotlightRef.current || !gridRef.current) return;
      const section = gridRef.current;
      const rect = section?.getBoundingClientRect();
      const mouseInside =
        rect &&
        e.clientX >= rect.left &&
        e.clientX <= rect.right &&
        e.clientY >= rect.top &&
        e.clientY <= rect.bottom;
      const cards = gridRef.current.querySelectorAll(".hexagon-card");

      if (!mouseInside) {
        gsap.to(spotlightRef.current, {
          opacity: 0,
          duration: 0.3,
          ease: "power2.out",
        });
        cards.forEach((card) =>
          card.style.setProperty("--glow-intensity", "0"),
        );
        return;
      }

      const { proximity, fadeDistance } =
        calculateSpotlightValues(spotlightRadius);
      let minDistance = Infinity;

      cards.forEach((card) => {
        const cardRect = card.getBoundingClientRect();
        const centerX = cardRect.left + cardRect.width / 2;
        const centerY = cardRect.top + cardRect.height / 2;
        const distance =
          Math.hypot(e.clientX - centerX, e.clientY - centerY) -
          Math.max(cardRect.width, cardRect.height) / 2;
        const effectiveDistance = Math.max(0, distance);
        minDistance = Math.min(minDistance, effectiveDistance);

        let glowIntensity = 0;
        if (effectiveDistance <= proximity) glowIntensity = 1;
        else if (effectiveDistance <= fadeDistance)
          glowIntensity =
            (fadeDistance - effectiveDistance) / (fadeDistance - proximity);

        updateCardGlowProperties(
          card,
          e.clientX,
          e.clientY,
          glowIntensity,
          spotlightRadius,
        );
      });

      gsap.to(spotlightRef.current, {
        left: e.clientX,
        top: e.clientY,
        duration: 0.1,
        ease: "power2.out",
      });
      const targetOpacity =
        minDistance <= proximity
          ? 0.8
          : minDistance <= fadeDistance
            ? ((fadeDistance - minDistance) / (fadeDistance - proximity)) * 0.8
            : 0;
      gsap.to(spotlightRef.current, {
        opacity: targetOpacity,
        duration: targetOpacity > 0 ? 0.2 : 0.5,
        ease: "power2.out",
      });
    };

    const handleMouseLeave = () => {
      gridRef.current
        ?.querySelectorAll(".hexagon-card")
        .forEach((card) => card.style.setProperty("--glow-intensity", "0"));
      if (spotlightRef.current)
        gsap.to(spotlightRef.current, {
          opacity: 0,
          duration: 0.3,
          ease: "power2.out",
        });
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseleave", handleMouseLeave);
      spotlightRef.current?.parentNode?.removeChild(spotlightRef.current);
    };
  }, [gridRef, disableAnimations, enabled, spotlightRadius, glowColor]);

  return null;
};

const AnimatedHexagonCard = ({
  icon: Icon,
  title,
  description,
  disableAnimations = false,
  particleCount = DEFAULT_PARTICLE_COUNT,
  glowColor = DEFAULT_GLOW_COLOR,
  enableTilt = true,
  clickEffect = true,
  enableMagnetism = true,
}) => {
  const cardRef = useRef(null);
  const particlesRef = useRef([]);
  const timeoutsRef = useRef([]);
  const isHoveredRef = useRef(false);
  const memoizedParticles = useRef([]);
  const particlesInitialized = useRef(false);
  const magnetismAnimationRef = useRef(null);

  const initializeParticles = useCallback(() => {
    if (particlesInitialized.current || !cardRef.current) return;
    const { width, height } = cardRef.current.getBoundingClientRect();
    memoizedParticles.current = Array.from({ length: particleCount }, () =>
      createParticleElement(
        Math.random() * width,
        Math.random() * height,
        glowColor,
      ),
    );
    particlesInitialized.current = true;
  }, [particleCount, glowColor]);

  const clearAllParticles = useCallback(() => {
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];
    magnetismAnimationRef.current?.kill();

    particlesRef.current.forEach((particle) => {
      gsap.to(particle, {
        scale: 0,
        opacity: 0,
        duration: 0.3,
        ease: "back.in(1.7)",
        onComplete: () => particle.parentNode?.removeChild(particle),
      });
    });
    particlesRef.current = [];
  }, []);

  const animateParticles = useCallback(() => {
    if (!cardRef.current || !isHoveredRef.current) return;
    if (!particlesInitialized.current) initializeParticles();

    memoizedParticles.current.forEach((particle, index) => {
      const timeoutId = setTimeout(() => {
        if (!isHoveredRef.current || !cardRef.current) return;
        const clone = particle.cloneNode(true);
        cardRef.current.appendChild(clone);
        particlesRef.current.push(clone);

        gsap.fromTo(
          clone,
          { scale: 0, opacity: 0 },
          { scale: 1, opacity: 1, duration: 0.3, ease: "back.out(1.7)" },
        );
        gsap.to(clone, {
          x: (Math.random() - 0.5) * 100,
          y: (Math.random() - 0.5) * 100,
          rotation: Math.random() * 360,
          duration: 2 + Math.random() * 2,
          ease: "none",
          repeat: -1,
          yoyo: true,
        });
        gsap.to(clone, {
          opacity: 0.3,
          duration: 1.5,
          ease: "power2.inOut",
          repeat: -1,
          yoyo: true,
        });
      }, index * 100);
      timeoutsRef.current.push(timeoutId);
    });
  }, [initializeParticles]);

  useEffect(() => {
    if (disableAnimations || !cardRef.current) return;
    const element = cardRef.current;

    const handleMouseEnter = () => {
      isHoveredRef.current = true;
      element.style.zIndex = "100";
      animateParticles();
      if (enableTilt)
        gsap.to(element, {
          rotateX: 5,
          rotateY: 5,
          scale: 1.2,
          duration: 0.3,
          ease: "power2.out",
          transformPerspective: 1000,
        });
    };
    const handleMouseLeave = () => {
      isHoveredRef.current = false;
      element.style.zIndex = "";
      clearAllParticles();
      if (enableTilt)
        gsap.to(element, {
          rotateX: 0,
          rotateY: 0,
          scale: 1,
          duration: 0.3,
          ease: "power2.out",
        });
      if (enableMagnetism)
        gsap.to(element, { x: 0, y: 0, duration: 0.3, ease: "power2.out" });
    };
    const handleMouseMove = (e) => {
      if (!enableTilt && !enableMagnetism) return;
      const rect = element.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      if (enableTilt) {
        const rotateX = ((y - centerY) / centerY) * -10;
        const rotateY = ((x - centerX) / centerX) * 10;
        gsap.to(element, {
          rotateX,
          rotateY,
          duration: 0.1,
          ease: "power2.out",
          transformPerspective: 1000,
        });
      }
      if (enableMagnetism) {
        const magnetX = (x - centerX) * 0.05;
        const magnetY = (y - centerY) * 0.05;
        magnetismAnimationRef.current = gsap.to(element, {
          x: magnetX,
          y: magnetY,
          duration: 0.3,
          ease: "power2.out",
        });
      }
    };
    const handleClick = (e) => {
      if (!clickEffect) return;
      const rect = element.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const maxDistance = Math.max(
        Math.hypot(x, y),
        Math.hypot(x - rect.width, y),
        Math.hypot(x, y - rect.height),
        Math.hypot(x - rect.width, y - rect.height),
      );

      const ripple = document.createElement("div");
      ripple.style.cssText = `position: absolute; width: ${maxDistance * 2}px; height: ${maxDistance * 2}px; border-radius: 50%; background: radial-gradient(circle, rgba(${glowColor}, 0.5) 0%, rgba(${glowColor}, 0.2) 30%, transparent 70%); left: ${x - maxDistance}px; top: ${y - maxDistance}px; pointer-events: none; z-index: 100;`;
      element.appendChild(ripple);
      gsap.fromTo(
        ripple,
        { scale: 0, opacity: 1 },
        {
          scale: 1,
          opacity: 0,
          duration: 0.8,
          ease: "power2.out",
          onComplete: () => ripple.remove(),
        },
      );
    };

    element.addEventListener("mouseenter", handleMouseEnter);
    element.addEventListener("mouseleave", handleMouseLeave);
    element.addEventListener("mousemove", handleMouseMove);
    element.addEventListener("click", handleClick);

    return () => {
      isHoveredRef.current = false;
      element.removeEventListener("mouseenter", handleMouseEnter);
      element.removeEventListener("mouseleave", handleMouseLeave);
      element.removeEventListener("mousemove", handleMouseMove);
      element.removeEventListener("click", handleClick);
      clearAllParticles();
    };
  }, [
    animateParticles,
    clearAllParticles,
    disableAnimations,
    enableTilt,
    enableMagnetism,
    clickEffect,
    glowColor,
  ]);

  return (
    <div
      ref={cardRef}
      className="hexagon-card relative flex items-center justify-center w-[270px] h-[300px] [clip-path:polygon(50%_0%,100%_25%,100%_75%,50%_100%,0%_75%,0%_25%)] cursor-pointer transition-shadow"
      style={{
        background: `radial-gradient(var(--glow-radius, 200px) circle at var(--glow-x, 50%) var(--glow-y, 50%), rgba(${glowColor}, calc(var(--glow-intensity, 0) * 1)), #FDE047 60%)`,
        backgroundColor: "#FDE047",
      }}
    >
      <div className="relative w-[262px] h-[292px] bg-[#F6EDD9] [clip-path:polygon(50%_0%,100%_25%,100%_75%,50%_100%,0%_75%,0%_25%)] flex flex-col items-center justify-center p-6 text-center z-10 pointer-events-none">
        <div className="flex items-center gap-3 w-full justify-center mb-3">
          <div className="bg-[#FDE047] w-10 h-10 rounded-lg flex items-center justify-center border border-[#0A0A0A]">
            <Icon size={22} strokeWidth={2.5} color="#0A0A0A" />
          </div>
          <h3 className="pop font-bold text-[22px] leading-tight text-left text-[#0A0A0A]">
            {title.split("\n").map((line, i) => (
              <React.Fragment key={i}>
                {line}
                <br />
              </React.Fragment>
            ))}
          </h3>
        </div>
        <p className="pop text-[15px] leading-relaxed mt-2 text-[#0A0A0A]">
          {description.split("\n").map((line, i) => (
            <React.Fragment key={i}>
              {line}
              <br />
            </React.Fragment>
          ))}
        </p>
      </div>
    </div>
  );
};

const FeaturesGrid = () => {
  const gridRef = useRef(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () =>
      setIsMobile(window.innerWidth <= MOBILE_BREAKPOINT);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  return (
    <div
      id="features"
      className="min-h-screen text-[#0A0A0A] flex flex-col items-center justify-center py-16 px-4 relative"
    >
      {/* Backgrounds - Strictly forced to edges & kept small enough to avoid heading */}
      <div
        className="absolute top-0 right-0 w-[450px] h-[450px] pointer-events-none z-0 opacity-60"
        style={{
          backgroundImage: `url(${Hive})`,
          backgroundSize: "contain",
          backgroundRepeat: "no-repeat",
          backgroundPosition: "top right",
          WebkitMaskImage:
            "radial-gradient(circle at 100% 0%, black 40%, transparent 80%)",
        }}
      />
      <div
        className="absolute bottom-0 left-0 w-[450px] h-[450px] pointer-events-none z-0 opacity-60"
        style={{
          backgroundImage: `url(${Hive})`,
          backgroundSize: "contain",
          backgroundRepeat: "no-repeat",
          backgroundPosition: "bottom left",
          WebkitMaskImage:
            "radial-gradient(circle at 0% 100%, black 40%, transparent 80%)",
        }}
      />

      <GlobalSpotlight
        gridRef={gridRef}
        disableAnimations={isMobile}
        enabled={true}
        spotlightRadius={DEFAULT_SPOTLIGHT_RADIUS}
        glowColor={DEFAULT_GLOW_COLOR}
      />

      {/* Header Container - Z-index elevated to z-30 */}
      <header className="text-center mb-10 md:mb-16 z-30 relative pointer-events-none mt-10 md:mt-0">
        <h1 className="text-5xl md:text-[7rem] font-bold tracking-tight mb-4 mel px-2">
          Turn chaos into clarity
        </h1>
        <p className="text-xl md:text-2xl leading-relaxed pop">
          MindHive helps to save smarter, find faster and
          <br className="hidden md:block" /> track your progress
        </p>
      </header>

      <main ref={gridRef} className="flex flex-col items-center z-30 relative">
        <div className="flex flex-col md:flex-row gap-4 md:gap-5 justify-center pop">
          <AnimatedHexagonCard
            icon={Folder}
            title="Save all"
            description="Save notes, links, files,or ideas instantlyall in one place."
            disableAnimations={isMobile}
          />
          <AnimatedHexagonCard
            icon={Tag}
            title="Smart Tags"
            description="Organize everything with tags, so younever lose what matters."
            disableAnimations={isMobile}
          />
          <AnimatedHexagonCard
            icon={Pin}
            title="Pin Resources"
            description="Keep important notes and files right at the topfor quick access anytime."
            disableAnimations={isMobile}
          />
        </div>
        <div className="flex flex-col md:flex-row gap-4 md:gap-5 justify-center mt-4 md:-mt-[68px]">
          <AnimatedHexagonCard
            icon={Bookmark}
            title="Save Later"
            description="Bookmark and come back when you're ready."
            disableAnimations={isMobile}
          />
          <AnimatedHexagonCard
            icon={Flame}
            title="Streaks"
            description="Build daily learning streaks and stay consistent"
            disableAnimations={isMobile}
          />
        </div>
      </main>
    </div>
  );
};

// ==========================================
// 5. ABOUT US
// ==========================================

const Aboutus = () => {
  return (
    <div id="about" className="min-h-screen font-sans">
      <section className="bg-[#F7EACD] py-16 px-6 md:px-20 flex flex-col md:flex-row items-center justify-center gap-12 md:gap-48 relative overflow-hidden">
        <div className="flex flex-col items-center">
          <div className="relative">
            <img
              src={Logo}
              alt="Mindhive Brain"
              className="relative top-10 w-96 h-auto"
            />
          </div>
          <h1 className="text-[#3B2A1F] text-8xl tracking-tighter drop-shadow-2xl maples">
            MINDHIVE
          </h1>
        </div>

        {/* Right Side: Hand-drawn Yellow Card */}
        <div className="relative max-w-2xl">
          {/* Big Bee in corner */}
          <div className="relative top-25 left-140 z-10">
            <img src={HoneyBee} className="w-56"></img>
          </div>

          <div className="bg-[#FFE455] p-8 text-center relative border-2 border-black rounded-2xl">
            <h2 className="text-5xl font-semibold mb-6 border-b-2 pb-4 mel">
              About us
            </h2>

            <div className="space-y-6 text-[#1A1A1A] font-medium leading-relaxed">
              <p>
                MindHive is a personal knowledge space designed for curious
                minds.
              </p>
              <p>
                We believe learning should feel organized, calm, and effortless.
              </p>
              <p>
                Notes, links, and files often get scattered across different
                apps, making it harder to focus on what truly matters.
              </p>
              <p>
                We built MindHive to bring everything together in one simple
                place, so your ideas stay safe and your progress stays
                consistent.
              </p>
              <p className="pt-4 italic font-semibold border-t border-black/50 inline-block">
                Because when your workspace is clear, your mind is too.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

// ==========================================
// 6. COMPACT FOOTER COMPONENT
// ==========================================
const Footer = () => {
  return (
    <footer className="w-full bg-[#3B2A1F] text-[#FFFBEA] py-12 px-10 z-40 relative mt-10">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
        {/* Footer Brand Info */}
        <div className="flex flex-col items-center md:items-start text-center md:text-left">
          <h4 className="text-2xl font-black text-[#F5D739] tracking-widest pop mb-2">
            MINDHIVE
          </h4>
          <p className="text-sm pop max-w-sm">
            Your second brain for notes, resources, and ideas. Designed to help
            you think clearly and organize your digital life.
          </p>
        </div>

        {/* Dummy Links */}
        <div className="flex gap-12 pop text-sm font-medium">
          <div className="flex flex-col gap-2">
            <h5 className="text-[#F5D739] font-bold mb-1">Product</h5>
            <a href="#" className="hover:text-white transition-colors">
              Features
            </a>
            <a href="#" className="hover:text-white transition-colors">
              Pricing
            </a>
            <a href="#" className="hover:text-white transition-colors">
              Download
            </a>
          </div>
          <div className="flex flex-col gap-2">
            <h5 className="text-[#F5D739] font-bold mb-1">Company</h5>
            <a href="#" className="hover:text-white transition-colors">
              About Us
            </a>
            <a href="#" className="hover:text-white transition-colors">
              Careers
            </a>
            <a href="#" className="hover:text-white transition-colors">
              Contact
            </a>
          </div>
        </div>
      </div>

      {/* Copyright */}
      <div className="mt-12 pt-6 border-t border-gray-600 text-center">
        <p className="pop text-gray-400 text-xs">
          © {new Date().getFullYear()} MindHive. All rights reserved. | Privacy
          Policy | Terms of Service
        </p>
      </div>
    </footer>
  );
};

// ==========================================
// 7. MASTER COMPONENT EXPORT (Landing)
// ==========================================
export default function Landing() {
  return (
    <>
      {/* GLOBAL STYLES */}
      <style>{`
        @font-face {
          font-family: 'Melody'; 
          src: url(${Melody}) format('truetype');
        }
        @font-face {
          font-family: 'Maples'; 
          src: url(${Maples}) format('truetype');
        }

        
        @import url('https://fonts.googleapis.com/css2?family=Baloo+Bhai+2:wght@400..800&family=Bebas+Neue&family=Bungee+Shade&family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&family=Monofett&family=Oswald:wght@200..700&family=Poppins:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&family=Roboto:ital,wght@0,100..900;1,100..900&family=Source+Sans+3:ital,wght@0,200..900;1,200..900&display=swap');
        
        @keyframes animation-gradient{
          0%{background-position:0% 50%;}
          50%{background-position:100% 50%;}
          100%{background-position:0% 50%;}
        }
        .animation{
          background:linear-gradient(-45deg, #1e1b4b, #312e81, #4f46e5, #0ea5e9);
          background-size:400% 400%;
          animation:animation-gradient 15s ease infinite;
        }
        .mel {
          font-family: "Melody", sans-serif;
        }
        .maples {
          font-family: "Maples", sans-serif;
        }
        .pop {
          font-family: "Poppins", sans-serif;
        }

      `}</style>

      {/* WRAPPER FOR ENTIRE PAGE */}
      <div className="w-full overflow-hidden font-sans bg-[#F7EACD]">
        <MouseBee />

        <NavSection />

        <ScrollReveal>
          <HeroSection />
        </ScrollReveal>

        <ScrollReveal>
          <ClutterSection />
        </ScrollReveal>

        <ScrollReveal>
          <FeaturesGrid />
        </ScrollReveal>

        <ScrollReveal>
          <Aboutus />
        </ScrollReveal>

        <ScrollReveal>
          <Footer />
        </ScrollReveal>
      </div>
    </>
  );
}
