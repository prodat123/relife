import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faHammer,
  faShieldAlt,
  faDragon,
  faDumbbell,
  faFeatherAlt,
  faCrown,
  faBook,
  faBrain,
  faHatWizard,
  faFlask,
  faLeaf,
  faTree,
  faMountain,
  faGem,
  faHandFist,
} from "@fortawesome/free-solid-svg-icons";

// ✅ Colors for each stat ring
const statColors = {
  strength: "#ef4444", // red-500
  bravery: "#3b82f6", // blue-500
  intelligence: "#facc15", // yellow-400
  endurance: "#22c55e", // green-500
};

// ✅ Define unique icon paths for each stat
const statIconsByStage = {
  strength: [faHammer, faHandFist, faShieldAlt, faDragon],
  bravery: [faFeatherAlt, faShieldAlt, faDumbbell, faCrown],
  intelligence: [faBook, faBrain, faHatWizard, faFlask],
  endurance: [faLeaf, faTree, faMountain, faGem],
};

// ✅ dynamic thresholds (every N points)
const STEP = 20;
const getNextThreshold = (val) => Math.ceil(val / STEP) * STEP;

const StatCircle = ({ stat, value, boost }) => {
  const [currentValue, setCurrentValue] = useState(value);
  const [progress, setProgress] = useState(0);
  const [animateNow, setAnimateNow] = useState(false);

  const size = 64;
  const stroke = 6;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;

  // ✅ boosted value (no cap)
  const boostedValue = value + boost;

  // ✅ thresholds
  const nextStage = getNextThreshold(boostedValue);
  const newValue = Math.min(boostedValue, nextStage);

  // ✅ Animate stat increase counter
  useEffect(() => {
    const delay = 500;
    const stepTime = 25;
    let val = value;

    const startTimer = setTimeout(() => {
      const interval = setInterval(() => {
        if (val < newValue) {
          val += 1;
          setCurrentValue(val);
          setProgress((val / nextStage) * 100);
        } else {
          clearInterval(interval);
        }
      }, stepTime);
    }, delay);

    return () => clearTimeout(startTimer);
  }, [value, newValue, nextStage]);

  // ✅ Trigger stroke animation only after mount
  useEffect(() => {
    const timer = setTimeout(() => setAnimateNow(true), 2200); // wait a bit
    return () => clearTimeout(timer);
  }, []);

  // ✅ Pick icon (loops through stages endlessly)
  const statStages = statIconsByStage[stat] || [];
  const stageIndex = Math.floor(currentValue / STEP) % statStages.length;
  const stageIcon = statStages[stageIndex] || faGem;

  return (
    <div className="flex flex-col items-center space-y-1">
      <div className="relative w-16 h-16">
        <svg
          className="absolute top-0 left-0 w-full h-full"
          width={size}
          height={size}
        >
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.1)"
            strokeWidth={stroke}
          />

          {/* White preload stroke */}
          {animateNow && (
            <motion.circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke="white"
              strokeWidth={stroke}
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{
                strokeDashoffset: circumference * (1 - progress / 100),
              }}
              transition={{ duration: 0.6, ease: "easeInOut" }}
              strokeLinecap="round"
              transform={`rotate(-90 ${size / 2} ${size / 2})`}
            />
          )}

          {/* Actual stat color stroke */}
          {animateNow && (
            <motion.circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={statColors[stat] || "#ffffff"}
              strokeWidth={stroke}
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{
                strokeDashoffset: circumference * (1 - progress / 100),
              }}
              transition={{ duration: 0.8, ease: "easeOut", delay: 0.6 }}
              strokeLinecap="round"
              transform={`rotate(-90 ${size / 2} ${size / 2})`}
            />
          )}
        </svg>

        {/* Center FontAwesome icon */}
        <motion.div
          className="absolute inset-0 flex items-center justify-center text-xl"
          style={{ color: statColors[stat] }}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.6 }}
        >
          <FontAwesomeIcon icon={stageIcon} />
        </motion.div>
      </div>

      {/* Stat label */}
      <div className="text-sm font-medium text-white capitalize">
        {stat.replace("_", " ")}
      </div>

      {/* Stat value + boost */}
      <div className="flex items-center text-sm space-x-1">
        <span className="text-white">{currentValue}</span>
        {boost > 0 && (
          <span className="text-green-400 font-bold">+{boost}</span>
        )}
      </div>
    </div>
  );
};

export default StatCircle;
