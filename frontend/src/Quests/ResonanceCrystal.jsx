import React, { useEffect, useMemo, useState } from "react";
import { motion, useAnimation } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBolt,
  faBrain,
  faDumbbell,
  faHeart,
  faMusic,
  faRunning,
} from "@fortawesome/free-solid-svg-icons";

// --- Helper Components ---
// Stationary but animated mote
const statIcons = {
  Strength: faDumbbell,
  Bravery: faRunning,
  Intelligence: faBrain,
  Endurance: faHeart,
};

const FloatingMote = ({ energy, position, boost }) => {
  const boostValue = boost?.[energy?.name?.toLowerCase()] || 0;
  const newTotalValue = (energy?.value || 0) + boostValue;

  // Initialize state with the initial value, which might be 0
  const [displayText, setDisplayText] = useState(energy.value);

  // This useEffect now handles BOTH cases: with and without a boost.
  useEffect(() => {
    if (boostValue > 0) {
      // If there IS a boost, run the two-stage animation
      setDisplayText(`+${boostValue}`);
      const timer = setTimeout(() => {
        setDisplayText(newTotalValue);
      }, 5500); // 1.5 second delay
      return () => clearTimeout(timer); // Cleanup the timer
    } else {
      // THE FIX: If there is NO boost, just set the text to the final value.
      setDisplayText(newTotalValue);
    }
  }, [boostValue, newTotalValue, energy.value]); // Dependencies ensure this runs when data updates

  const intensity = Math.min(newTotalValue / 1000, 1);
  const size = 32 + intensity * 24;
  const icon = statIcons[energy.name] || faBolt;
  const isBoostDisplay =
    typeof displayText === "string" && displayText.startsWith("+");

  return (
    <motion.div
      className="absolute flex items-center justify-center rounded-full z-10"
      style={{
        top: position.top,
        left: position.left,
        width: size,
        height: size,
        boxShadow: `0 0 ${12 + intensity * 16}px ${energy.color.hex}`,
      }}
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, delay: 0.2, type: "spring", stiffness: 150 }}
    >
      {/* ... The rest of your JSX remains exactly the same ... */}
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background: `radial-gradient(circle, ${energy.color.hex}99, transparent 70%)`,
        }}
      />
      <FontAwesomeIcon
        icon={icon}
        className="absolute text-white opacity-40"
        style={{
          fontSize: size * 0.9,
          filter: "blur(2px)",
          color: energy.color.hex,
        }}
      />
      <div className="relative z-10 flex items-center justify-center w-full h-full">
        <motion.span
          key={displayText} // Re-triggers the animation when text changes
          className={`font-extrabold text-white ${
            isBoostDisplay ? "text-3xl text-green-400" : "text-xl"
          }`}
          style={{
            filter: `drop-shadow(0 0 5px ${
              isBoostDisplay ? "#22c55e" : energy.color.hex
            })`,
          }}
          initial={{ y: 10, opacity: 0, scale: 0.8 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        >
          {displayText}
        </motion.span>
      </div>
    </motion.div>
  );
};

// CrystalVisual Component: Renders the new magical orb
const CrystalVisual = ({
  energies,
  crystalLevel,
  fillPercent,
  impactTrigger,
  boost,
}) => {
  const totalEnergy = Object.values(energies).reduce(
    (sum, e) => sum + e.value,
    0
  );

  const dominantColor = useMemo(() => {
    if (totalEnergy === 0) return "rgba(59, 130, 246, 0.5)";
    const sortedEnergies = [...energies];
    const dominant = sortedEnergies.sort((a, b) => b.value - a.value)[0];
    return dominant.color.hex;
  }, [energies, totalEnergy]);

  const motePositions = [
    { top: "10%", left: "43%" }, // above
    { top: "75%", left: "43%" }, // below
    { top: "43%", left: "10%" }, // left
    { top: "43%", left: "75%" }, // right
  ];

  const controls = useAnimation();

  useEffect(() => {
    if (impactTrigger > 0) {
      const sequence = async () => {
        // 1. Initial shake for anticipation
        await controls.start({
          x: [0, -6, 6, -6, 6, 0],
          transition: { duration: 0.4 },
        });

        // 2. Main impact flash and pulse
        await controls.start({
          scale: [1, 1.3, 1], // The crystal itself pulses
          filter: [
            // Normal state
            `brightness(1.1) drop-shadow(0 0 15px ${dominantColor}66)`,
            // Peak of the flash (intense bloom)
            `brightness(3) drop-shadow(0 0 25px ${dominantColor})`,
            // Return to normal state
            `brightness(1.1) drop-shadow(0 0 15px ${dominantColor}66)`,
          ],
          transition: { duration: 0.6, ease: "easeOut" },
        });
      };
      sequence();
    }
  }, [impactTrigger, controls, dominantColor]);

  return (
    <motion.div
      className="relative my-4"
      // fixed square box; change these px values if you want a different size
      style={{ width: 240, height: 240 }}
      animate={controls}
    >
      {/* <motion.div
        className="absolute w-full h-full aspect-square rotate-45 border-2"
        style={{ borderColor: dominantColor }}
        variants={{
          initial: { opacity: 0, scale: 0.8 },
          impact: {
            opacity: [0.7, 0],
            scale: [1, 2.5],
            transition: { duration: 0.7, ease: "easeOut", delay: 0.2 }, // Delay slightly after the pulse
          },
        }}
        initial="initial"
        animate={impactTrigger > 0 ? "impact" : "initial"}
      /> */}
      {/* Orbiting Crystals */}{" "}
      <div className="absolute inset-0 pointer-events-none">
        {" "}
        {energies.map((energy, i) => (
          <FloatingMote
            key={i}
            energy={energy}
            position={motePositions[i % motePositions.length]}
            boost={boost} // Pass the increase value
          />
        ))}{" "}
      </div>
      {/* Diamond (central) — using clip-path to mask a square into a diamond */}
      <div
        className="absolute left-1/2 top-1/2"
        style={{
          width: "100%",
          maxWidth: "100%",
          height: "100%",
          transform: "translate(-50%, -50%)",
        }}
      >
        {/* Diamond base */}
        <div
          style={{
            position: "relative",
            width: "100%",
            height: "100%",
            overflow: "hidden",
            // clip-path makes a diamond out of the square container
            clipPath: "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)",
            background: "#0f1724", // fallback base color
            border: `2px solid ${dominantColor}33`,
            boxShadow: `0 8px 30px -8px ${dominantColor}55, inset 0 0 24px 4px ${dominantColor}33`,
            borderRadius: 8,
          }}
        >
          {/* Unfilled background (bottom-up fill will mask) */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(180deg, rgba(10,12,18,1) 0%, rgba(18,24,32,1) 100%)",
            }}
          />

          {/* Blended color fill — anchored bottom, masked by the diamond */}
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              bottom: 0,
              height: `${Math.max(0, Math.min(100, fillPercent))}%`,
              transition: "height 700ms ease-out",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                position: "absolute",
                inset: 0,
                mixBlendMode: "screen",
              }}
            >
              {energies.map((e) => (
                <div
                  key={e.name}
                  style={{
                    position: "absolute",
                    inset: 0,
                    background: `radial-gradient(circle at ${e.position}, ${e.color.hex}, transparent 60%)`,
                    opacity: Math.min(
                      ((Number(e.value) || 0) / totalEnergy) * 2,
                      1
                    ),
                  }}
                />
              ))}
            </div>
          </div>

          {/* Inner glow and level text */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              pointerEvents: "none",
            }}
          >
            {/* subtle inset glow */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                boxShadow: `inset 0 0 30px 6px ${dominantColor}`,
                opacity: 0.9,
              }}
            />

            {/* Level */}
            <div
              style={{ textAlign: "center", zIndex: 40, color: "#fff" }}
              className="font-solo"
            >
              <div
                style={{
                  fontSize: 36,
                  fontWeight: 800,
                  lineHeight: 1,
                  textShadow: `0 0 14px ${dominantColor}`,
                }}
              >
                {crystalLevel}
              </div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.65)" }}>
                Lvl.
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// --- Main Components ---

// ResonanceCrystal Component: The primary component for the crystal display
const ResonanceCrystal = ({
  energyData,
  maxCapacity,
  crystalLevel,
  fillPercent,
  impactTrigger,
  boost,
}) => {
  const energies = [
    {
      name: "Strength",
      value: energyData.strength,
      color: { hex: "#ef4444" }, // 🔴 red
      position: "50% 20%",
    },
    {
      name: "Bravery",
      value: energyData.bravery,
      color: { hex: "#3b82f6" }, // 🔵 blue
      position: "80% 50%",
    },
    {
      name: "Intelligence",
      value: energyData.intelligence,
      color: { hex: "#facc15" }, // 🟡 yellow
      position: "20% 50%",
    },
    {
      name: "Endurance",
      value: energyData.endurance,
      color: { hex: "#22c55e" }, // 🟢 green
      position: "50% 80%",
    },
  ];

  return (
    <div>
      {/* Crystal in center */}
      <CrystalVisual
        energies={energies}
        crystalLevel={crystalLevel}
        fillPercent={fillPercent}
        impactTrigger={impactTrigger}
        boost={boost}
      />
    </div>
  );
};

export default ResonanceCrystal;
