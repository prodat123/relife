import React, { useMemo, useEffect, useState } from "react";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCrown, faStar } from "@fortawesome/free-solid-svg-icons";
import { useTooltip } from "./TooltipProvider";

const RARITY_CONFIG = {
  peasantly: { color: "#b76f44", value: 1, glow: "shadow-[0_0_15px_#b76f44]" },
  artisan: { color: "#009688", value: 2, glow: "shadow-[0_0_20px_#009688]" },
  knightly: { color: "#cccccc", value: 3, glow: "shadow-[0_0_25px_#cccccc]" },
  noble: { color: "#e06666", value: 5, glow: "shadow-[0_0_30px_#e06666]" },
  kingly: { color: "#ffd966", value: 7, glow: "shadow-[0_0_35px_#ffd966]" },
  emperor: { color: "#9900ff", value: 10, glow: "shadow-[0_0_40px_#9900ff]" },
};

const EQUIPMENT_SLOTS = [
  { slot: "head", top: "15.8%", left: "48.3%", zIndex: 100 },
  { slot: "torso", top: "44%", left: "46.85%", zIndex: 98 },
  { slot: "legs", top: "70%", left: "50%", zIndex: 90 },
  { slot: "feet", top: "90.6%", left: "51.62%", zIndex: 80 },
  { slot: "weapon", top: "50%", left: "50%", zIndex: 99 },
];

// Animated counter
const AnimatedCounter = ({ value }) => {
  const count = useMotionValue(0);
  const rounded = useTransform(count, (latest) => Math.round(latest));

  useEffect(() => {
    const controls = animate(count, value, {
      duration: 1,
      ease: "easeOut",
    });
    return controls.stop;
  }, [value]);

  return (
    <motion.span className="font-solo font-bold text-xl text-text justify-center flex items-center gap-1">
      {/* Motion span bound to rounded */}
      <motion.span>{rounded}</motion.span>
    </motion.span>
  );
};

const CharacterDisplay = ({ equipment, showAuraValue = true }) => {
  const { showTooltip, hideTooltip } = useTooltip(); // <-- 2. Instantiate the hook
  const availableFrames = ["frame1", "frame2", "frame3", "frame4"]; // Add all your frame names here
  const [selectedFrame, setSelectedFrame] = useState(availableFrames[0]);
  const [showFrameSelector, setShowFrameSelector] = useState(false);

  const prestigeScore = useMemo(() => {
    // If 'equipment' is null or undefined, use an empty object {} instead.
    // This prevents the app from crashing.
    return Object.values(equipment || {})
      .filter((item) => item && item.rarity)
      .reduce((sum, item) => sum + (RARITY_CONFIG[item.rarity]?.value || 0), 0);
  }, [equipment]);

  // Prestige tier logic
  const prestigeTier =
    prestigeScore >= 30
      ? "emperor"
      : prestigeScore >= 20
      ? "kingly"
      : prestigeScore >= 12
      ? "noble"
      : prestigeScore >= 6
      ? "knightly"
      : prestigeScore >= 3
      ? "artisan"
      : "peasantly";

  const { color, glow } = RARITY_CONFIG[prestigeTier];

  const rarityStyles = {
    peasantly: {
      color: "#b76f44",
    },
    artisan: {
      color: "#009688",
    },
    knightly: {
      color: "#cccccc",
    },
    noble: {
      color: "#e06666",
    },
    kingly: {
      color: "#ffd966",
    },
    emperor: {
      color: "#9900ff",
    },
  };

  const handleShowEquipmentTooltip = () => {
    // 1. Get an array of all valid equipped items
    const equippedItems = Object.values(equipment).filter(Boolean);

    // 2. Call showTooltip with custom JSX as the content
    showTooltip(
      <div className="flex flex-col gap-3 text-left">
        <h3 className="font-bold text-lg text-amber-300 border-b border-slate-700 pb-2">
          Equipped Gear
        </h3>

        {equippedItems.length > 0 ? (
          <>
            {equippedItems.map((item) => (
              <div key={item.id}>
                <p
                  className={`font-semibold`}
                  style={{ color: rarityStyles[item.rarity]?.color }}
                >
                  {item.type}: {item.name}
                </p>
                <p className="text-xs italic text-slate-400 mt-1">
                  {item.description}
                </p>
              </div>
            ))}
          </>
        ) : (
          <h3 className="text-text">No Gear Equipped</h3>
        )}
      </div>
    );
  };

  return (
    <div
      className={`relative h-full w-full h-60 rounded-md border overflow-hidden flex items-center justify-center p-4 transition-all duration-500`}
      onMouseEnter={() => {
        // Only call the tooltip function if the frame selector is NOT visible
        if (!showFrameSelector) {
          handleShowEquipmentTooltip();
        }
      }}
      onMouseLeave={hideTooltip}
      style={{
        borderColor: color,
        boxShadow: `0 0 30px ${color}55`,
        background: `linear-gradient(135deg, ${color}22, #1A1C2C 70%)`,
      }}
      // onClick={() => setShowFrameSelector(true)}
    >
      {/* <img
        className="absolute w-full h-full top-0 left-0 pixel-art"
        src={`/sprites/banner/${selectedFrame}.png`}
        alt="Selected character frame"
      /> */}
      {/* Prestige aura */}
      <EpicCartoonFlame color={color} yOffset={-35} />

      {/* Character sprite */}
      <div className="relative w-4/5 z-10">
        <img
          src={"/sprites/player.png"}
          alt="Character"
          className="w-full drop-shadow-[0_0_12px_rgba(255,255,255,0.6)] pixel-art"
        />
        {EQUIPMENT_SLOTS.map(({ slot, top, left, zIndex }) => {
          return (
            <div
              key={slot}
              style={{
                position: "absolute",
                top,
                left,
                transform: "translate(-50%, -50%)",
                zIndex,
                width: "100%",
              }}
            >
              {equipment && equipment[slot]?.image_url && (
                <img
                  src={`${equipment[slot].image_url}?v=${new Date().getTime()}`}
                  alt={`${equipment[slot].name || "None"} Gear`}
                  className="w-full h-full object-fill pointer-events-none pixel-art"
                />
              )}
            </div>
          );
        })}
      </div>

      {/* {showFrameSelector && (
        <div
          className="absolute inset-0 bg-black/70 backdrop-blur-sm z-20 flex flex-col items-center justify-center p-4"
          // This allows closing the selector by clicking the background
          onClick={(e) => {
            e.stopPropagation();
            setShowFrameSelector(false);
          }}
        >
          <h3 className="text-white font-bold text-lg mb-4">Select a Frame</h3>
          <div className="grid grid-cols-2 gap-4">
            {availableFrames.map((frame) => (
              <div
                key={frame}
                className={`w-24 h-24 bg-slate-800 rounded-md overflow-hidden border-2 transition-all ${
                  selectedFrame === frame
                    ? "border-amber-400 scale-105"
                    : "border-slate-600"
                }`}
                // This updates the frame and closes the selector
                // onClick={(e) => {
                //   e.stopPropagation(); // Prevents the background click from also firing
                //   setSelectedFrame(frame);
                //   setShowFrameSelector(false);
                // }}
              >
                <img
                  src={`/sprites/banner/${frame}.png`}
                  alt={`Preview of ${frame}`}
                  className="w-full pixel-art h-full object-cover"
                />
              </div>
            ))}
          </div>
        </div>
      )} */}

      {/* Prestige Score + Title */}
      {showAuraValue && (
        <div className="absolute bottom-0 right-0 flex flex-col items-center p-2">
          {/* Diamond container */}
          <div
            className="w-8 h-8 flex items-center justify-center transform rotate-45"
            style={{
              border: `2px solid ${color}`,
              backgroundColor: `${color}33`,
            }}
          >
            {/* Rotate contents back so they’re upright */}
            <div className="transform -rotate-45 flex flex-col items-center">
              <div
                className="text-lg font-bold tracking-wide"
                style={{ color }}
              >
                <AnimatedCounter value={prestigeScore} />
              </div>
            </div>
          </div>

          {/* Prestige tier below diamond */}
          <div
            className="text-xs uppercase opacity-80 mt-2 font-semibold"
            style={{ color }}
          >
            {prestigeTier}
          </div>
        </div>
      )}
    </div>
  );
};

export default CharacterDisplay;

// Accept a new prop `yOffset` with a default value of 0
const EpicCartoonFlame = ({ color, yOffset = 0 }) => {
  const flameCoreColor = "rgba(255, 255, 255, 1)";
  const flameMidColor = "rgba(255, 235, 150, 1)";

  return (
    <div className="pixelated-flame absolute inset-0 z-0 flex items-center justify-center">
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 200 200"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <filter id="cartoon-flame-filter">
            <feTurbulence
              baseFrequency="0.03 0.04"
              numOctaves="1"
              type="fractalNoise"
              seed="0"
            >
              <animate
                attributeName="baseFrequency"
                dur="2s"
                values="0.03 0.04; 0.04 0.05; 0.03 0.04"
                repeatCount="indefinite"
              />
            </feTurbulence>
            <feDisplacementMap
              in="SourceGraphic"
              in2="flame-turbulence"
              scale="20"
            />
          </filter>
        </defs>

        <g transform={`translate(0, ${yOffset})`}>
          <g filter="url(#cartoon-flame-filter)">
            {/* Layer 1: The Outer Flame (base color) */}
            <motion.ellipse
              cx="100"
              cy="130"
              rx="60"
              ry="80"
              fill={color}
              // Animate `ry` and `rx` independently with complex keyframes
              animate={{
                ry: [80, 70, 85, 75, 80], // More varied keyframes
                rx: [60, 65, 58, 62, 60],
              }}
              transition={{
                duration: 4, // Use a single duration for the element
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />

            {/* Layer 2: The Mid Flame (yellow) */}
            <motion.ellipse
              cx="100"
              cy="140"
              rx="40"
              ry="60"
              fill={flameMidColor}
              animate={{
                ry: [60, 70, 55, 65, 60],
                y: [0, -10, 5, -5, 0], // More complex vertical movement
              }}
              transition={{
                duration: 3, // Different duration to de-sync from the outer layer
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />

            {/* Layer 3: The Core Flame (white) */}
            <motion.ellipse
              cx="100"
              cy="150"
              rx="20"
              ry="40"
              fill={flameCoreColor}
              animate={{
                scale: [1, 1.2, 0.9, 1.15, 1], // More "bouncy" and less symmetrical
                y: [0, -15, -5, -10, 0],
              }}
              transition={{
                duration: 2.2, // A third, different duration
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          </g>

          {/* <Sparks color={color} /> */}
        </g>
      </svg>
    </div>
  );
};

// A helper function to generate random values within a range
const random = (min, max) => Math.random() * (max - min) + min;

const Sparks = ({ count = 20, color }) => {
  // useMemo will create the sparks array once and memoize it,
  // preventing it from being recalculated on every render.
  const sparks = useMemo(() => {
    return Array.from({ length: count }).map(() => ({
      id: Math.random(),
      // Start position (spread across the bottom)
      x: random(40, 160),
      y: random(10, 100),
      // Random size
      scale: random(0.5, 1.5),
      // Random animation duration and delay for a chaotic effect
      duration: random(1, 2.5),
      delay: random(0, 2),
    }));
  }, [count]);

  return (
    // We use a key on the group to force a re-render if the color changes
    <g key={color}>
      {sparks.map(({ id, x, y, scale, duration, delay }) => (
        <motion.circle
          key={id}
          cx={x}
          cy={y}
          r={scale * 2} // Radius of the spark
          fill={color}
          initial={{ opacity: 1, y: y }}
          animate={{
            y: y - 140, // Animate upwards
            opacity: [1, 0.5, 0], // Fade out
            scale: [scale, scale * 0.5], // Shrink
          }}
          transition={{
            duration,
            delay,
            repeat: Infinity,
            ease: "linear",
          }}
        />
      ))}
    </g>
  );
};
