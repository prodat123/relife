// import React, { useState, useEffect, useContext, useRef, useMemo } from "react";
// import axios from "axios";
// import config from "../config";
// import { UserContext } from "../Account/UserContext";
// import {
//   faDumbbell,
//   faBrain,
//   faShieldAlt,
//   faRunning,
//   faShield,
//   faFire,
//   faHeart,
//   faFistRaised,
//   faChessRook,
//   faCoins,
// } from "@fortawesome/free-solid-svg-icons";
// import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
// // import BossBattleModal from "./BossBattleModal"; // You can remove this import if it's no longer necessary
// import StatCircle from "./StatCircle";
// import { motion } from "framer-motion";
// import ResonanceCrystal from "./ResonanceCrystal";
// import { icon } from "@fortawesome/fontawesome-svg-core";

// const LevelUpScreen = ({
//   userId,
//   questCompleted,
//   vowCompleted,
//   onClose,
//   difficulty,
//   experienceReward,
//   statReward,
//   streak,
//   currencyReward,
// }) => {
//   const [visible, setVisible] = useState(true);
//   const [accountData, setAccountData] = useState([]);
//   const [dataLoaded, setDataLoaded] = useState(false);
//   const [currentPage, setCurrentPage] = useState(0); // Track the current page or section
//   const maxPages = 1; // Now there are two pages: one for level up, and one for the boss battle
//   const [damage, setDamage] = useState(0);
//   const { accountDataRef, fetchAccountData } = useContext(UserContext);
//   const timerRef = useRef(null);
//   const [levelUpTriggered, setLevelUpTriggered] = useState(false);
//   const [currentLevel, setCurrentLevel] = useState(0);
//   const [impactTrigger, setImpactTrigger] = useState(0);
//   // const [newLevel, setNewLevel] = useState(0);

//   const statInfoMap = {
//     strength: { icon: faDumbbell, color: "text-red-500" },
//     endurance: { icon: faHeart, color: "text-green-500" },
//     bravery: { icon: faRunning, color: "text-blue-500" },
//     intelligence: { icon: faBrain, color: "text-yellow-500" },
//   };

//   const statIcons = {
//     strength: <FontAwesomeIcon icon={faDumbbell} className="text-red-400" />,
//     intelligence: (
//       <FontAwesomeIcon icon={faBrain} className="text-yellow-300" />
//     ),
//     endurance: <FontAwesomeIcon icon={faHeart} className="text-green-400" />,
//     bravery: <FontAwesomeIcon icon={faRunning} className="text-blue-400" />,
//   };

//   useEffect(() => {
//     const interval = setInterval(() => {
//       if (accountDataRef.current && !dataLoaded) {
//         const playerData = accountDataRef.current;
//         const previousLevel = calculateLevel(playerData.experience).level;
//         const newLevel = calculateLevel(
//           playerData.experience + experienceReward
//         ).level;

//         const tempDamage = Math.round(
//           Math.pow(
//             1 * playerData.stats.strength +
//               1 * playerData.stats.endurance +
//               1 * playerData.stats.bravery +
//               1 * playerData.stats.intelligence,
//             0.9
//           )
//         );
//         setDamage(tempDamage);
//         console.log(playerData);
//         setAccountData(playerData);
//         setDataLoaded(true);

//         // setNewLevel(newLevel);
//         setCurrentLevel(previousLevel);

//         if (newLevel > previousLevel) {
//           setLevelUpTriggered(true);
//           setTimeout(() => {
//             setLevelUpTriggered(false);
//             setCurrentPage(1); // Show quest/stats panel after level-up animation
//           }, 7000); // Show animation for 3 seconds
//         } else {
//           setCurrentPage(1);
//         }
//       }
//     }, 100);
//     return () => clearInterval(interval);
//   }, [accountDataRef, dataLoaded, experienceReward]);

//   const handleClose = () => {
//     if (currentPage === maxPages) {
//       setVisible(false);
//       fetchAccountData(userId);
//       if (onClose) onClose();
//     }
//   };

//   const calculateLevel = (experience) => {
//     let level = 1;
//     let xpForNextLevel = 100;

//     while (experience >= xpForNextLevel) {
//       level++;
//       experience -= xpForNextLevel;
//       xpForNextLevel = 100 * Math.pow(1.05, level - 1);
//     }

//     return { level, remainingXP: experience, xpForNextLevel };
//   };

//   const statColors = {
//     strength: "text-red-500",
//     bravery: "text-blue-500",
//     intelligence: "text-yellow-400",
//     endurance: "text-green-500",
//   };

//   const containerVariants = {
//     hidden: { opacity: 0 },
//     show: {
//       opacity: 1,
//       transition: {
//         staggerChildren: 0.3, // controls delay between children
//         delayChildren: 0.2,
//       },
//     },
//   };

//   const sectionVariants = {
//     hidden: { opacity: 0, y: 30, scale: 0.95 },
//     show: {
//       opacity: 1,
//       y: 0,
//       scale: 1,
//       transition: { type: "spring", stiffness: 80, damping: 15 },
//     },
//   };

//   const openBossBattle = () => {
//     setCurrentPage(2); // Set to boss battle page
//   };

//   const { newLevel, fillPercent } = useMemo(() => {
//     // Your existing calculateLevel logic here or imported
//     const { level, remainingXP, xpForNextLevel } = calculateLevel(
//       accountData.experience + experienceReward
//     );
//     return {
//       newLevel: level,
//       fillPercent: (remainingXP / xpForNextLevel) * 100,
//     };
//   }, [accountData.experience, experienceReward]);

//   // Framer Motion variants for animations
//   // const containerVariants = {
//   //   hidden: {},
//   //   show: { transition: { staggerChildren: 0.1 } },
//   // };
//   // const sectionVariants = {
//   //   hidden: { opacity: 0, y: 20 },
//   //   show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
//   // };

//   // Place this inside your LevelUpScreen component, before the return statement
//   const particles = useMemo(() => {
//     const newParticles = [];
//     if (!statReward) return [];

//     Object.entries(statReward).forEach(([stat, value]) => {
//       const info = statInfoMap[stat];
//       if (!info) return;

//       for (let i = 0; i < value * 20; i++) {
//         // Generate random starting positions around the crystal
//         const angle = Math.random() * Math.PI * 2;
//         const radius = 120 + Math.random() * 40; // 120-160px away from the center

//         newParticles.push({
//           id: `${stat}-${i}`,
//           color: info.color.replace("text-", "bg-"), // Convert text color to background color
//           initialX: Math.cos(angle) * radius,
//           initialY: Math.sin(angle) * radius,
//           delay: 1.8 + i * 0.05 + Math.random() * 0.1,
//           icon: info.icon,
//         });
//       }
//     });
//     return newParticles;
//   }, [statReward]);

//   useEffect(() => {
//     particles.forEach((particle) => {
//       const hitTime = (particle.delay + 1.5) * 1000; // duration matches particle anim
//       setTimeout(() => {
//         setImpactTrigger((prev) => prev + 1);
//       }, hitTime);
//     });
//   }, [particles]);

//   return (
//     <>
//       <div
//         className={`fixed inset-0 p-4 bg-background flex flex-col items-center justify-center overflow-hidden z-[99999] ${
//           visible ? "bg-opacity-90" : "opacity-0 pointer-events-auto"
//         }`}
//       >
//         {visible && (
//           <>
//             {currentPage === 0 && (
//               <>
//                 {levelUpTriggered && (
//                   <div className="relative flex flex-col items-center justify-center w-full lg:w-1/2 h-96 p-8 bg-gray-800 rounded-xl border border-blue-500 shadow-[0_0_80px_#60a5fa] scale-110 transition-transform duration-500">
//                     {/* 💥 Strong flash ring */}
//                     <div className="absolute w-72 h-72 rounded-full border-[8px] border-blue-400 opacity-60 animate-ping-slow z-0"></div>

//                     {/* 🔥 BOOM Title */}
//                     <h1 className="z-10 text-6xl text-blue-300 font-extrabold font-solo mb-4 tracking-wider animate-popout">
//                       LEVEL UP
//                     </h1>

//                     {/* 🚀 Level Number (punchy) */}
//                     <div className="z-10 text-5xl font-solo text-text font-black mt-2 animate-popout">
//                       {currentLevel} → {newLevel}
//                     </div>

//                     {/* 🧨 Subtext */}
//                     <p className="z-10 text-white font-semibold text-xl mt-4">
//                       You've grown stronger!
//                     </p>
//                   </div>
//                 )}
//               </>
//             )}

//             {currentPage === 1 && (
//               <motion.div
//                 variants={containerVariants}
//                 initial="hidden"
//                 animate="show"
//                 className={`transition-all duration-300 ease-in-out lg:w-1/2 w-full
//       flex-shrink-0 overflow-y-auto hide-scrollbar
//       rounded-md p-6 relative bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f3460] shadow-indigo-500/40
//       shadow-inner shadow-black/40 backdrop-blur-sm`}
//                 style={{
//                   background:
//                     "linear-gradient(to bottom right, #1F2937, #2C3E50, #1A2A35)",
//                   animation: "pulseGlow 3s infinite ease-in-out",
//                   border: "1px solid rgba(59, 130, 246, 0.1)",
//                 }}
//               >
//                 {/* 🔥 Streak Section */}

//                 {streak > 0 && (
//                   <motion.div
//                     variants={sectionVariants}
//                     className="flex flex-col items-center"
//                   >
//                     <FontAwesomeIcon
//                       icon={faFire}
//                       className="text-orange-400 text-5xl"
//                     />
//                     <p className="mt-2 text-orange-300 font-semibold">
//                       {streak}-Day Streak
//                     </p>
//                   </motion.div>
//                 )}

//                 {/* 🧠 XP and Level Section */}
//                 {experienceReward > 0 && (
//                   <motion.div
//                     variants={sectionVariants}
//                     className="text-center border-t border-gray-700 pt-4"
//                   >
//                     <h2 className="text-xl tracking-wider font-semibold mb-1 font-solo">
//                       Level Progress
//                     </h2>
//                     {accountData.experience ? (
//                       <>
//                         <p className="text-base">
//                           Level:{" "}
//                           <span className="font-bold">
//                             {
//                               calculateLevel(
//                                 accountData.experience + experienceReward
//                               ).level
//                             }
//                           </span>
//                         </p>
//                         <p className="text-green-400 font-semibold mt-1">
//                           +{experienceReward} XP
//                         </p>
//                       </>
//                     ) : (
//                       <p className="text-gray-400">No XP data available.</p>
//                     )}
//                   </motion.div>
//                 )}

//                 {currencyReward > 0 && (
//                   <motion.div
//                     variants={sectionVariants}
//                     className="border-t border-gray-700 pt-4"
//                   >
//                     <h2 className="text-xl tracking-wider font-semibold text-center mb-2 font-solo">
//                       Gold Earned
//                     </h2>

//                     {currencyReward ? (
//                       <div className="text-center">
//                         <p className="text-yellow-400 text-xl font-bold">
//                           +{currencyReward} Gold
//                         </p>
//                         <p className="text-yellow-200 text-lg mt-1">
//                           <FontAwesomeIcon icon={faCoins} /> Total:{" "}
//                           {accountData.currency + currencyReward}
//                         </p>
//                       </div>
//                     ) : (
//                       <p className="text-center text-gray-400">
//                         No gold earned.
//                       </p>
//                     )}
//                   </motion.div>
//                 )}

//                 {/* 📊 Stat Upgrades Section */}

//                 {/* Center: Resonance Crystal & Stat Animations */}
//                 <motion.div
//                   variants={sectionVariants}
//                   className="relative flex items-center justify-center"
//                 >
//                   <ResonanceCrystal
//                     energyData={accountData.stats}
//                     crystalLevel={newLevel}
//                     fillPercent={fillPercent}
//                     impactTrigger={impactTrigger}
//                     boost={statReward}
//                   />

//                   <div className="absolute inset-0 flex items-center justify-center">
//                     {particles.map((particle) => (
//                       <motion.div
//                         key={particle.id}
//                         className={`absolute w-5 h-5 ${particle.color} flex items-center justify-center`}
//                         style={{
//                           clipPath:
//                             "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)",
//                         }}
//                         initial={{
//                           x: particle.initialX,
//                           y: particle.initialY,
//                           scale: 1,
//                           opacity: 0.9,
//                         }}
//                         animate={{
//                           // Flight Path (unchanged)
//                           x: [particle.initialX, particle.initialX * 0.3, 0],
//                           y: [particle.initialY, particle.initialY * 0.3, 0],

//                           // Pulse + Absorb (unchanged)
//                           scale: [1, 2, 0.5],
//                           opacity: [0.9, 1, 0],

//                           // --- 1. NEW: Brightness Overload ---
//                           // This makes the particle itself glow intensely during the pulse.
//                           filter: [
//                             "brightness(1)", // Normal brightness
//                             "brightness(3.5)", // Intense flash (overload)
//                             "brightness(1)", // Fade back to normal
//                           ],

//                           // --- 2. ENHANCED: Bloom Glow ---
//                           // The boxShadow is now more intense during the flash.
//                           boxShadow: [
//                             `0 0 8px ${particle.hexColor}, 0 0 15px ${particle.hexColor}70`,
//                             `0 0 20px #fff, 0 0 35px ${particle.hexColor}, 0 0 50px ${particle.hexColor}`, // White hot core + bigger colored glow
//                             `0 0 5px ${particle.hexColor}40`,
//                           ],
//                         }}
//                         transition={{
//                           duration: 1.5,
//                           ease: "easeInOut",
//                           delay: particle.delay,
//                           times: [0, 0.7, 1], // Timing remains the same
//                         }}
//                       >
//                         <FontAwesomeIcon
//                           icon={particle.icon}
//                           className={`${particle.iconColor} text-xs`}
//                           style={{ filter: `drop-shadow(0 0 4px #00000080)` }}
//                         />
//                       </motion.div>
//                     ))}
//                   </div>
//                 </motion.div>

//                 {/* <motion.div
//                   variants={sectionVariants}
//                   className="border-t border-gray-700 pt-4"
//                 >
//                   <h2 className="text-xl tracking-wider font-semibold text-center mb-3 font-solo">
//                     Stat Upgrades
//                   </h2>
//                   {accountData.stats && statReward ? (
//                     <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 justify-items-center">
//                       {Object.entries(accountData.stats).map(
//                         ([stat, value]) => (
//                           <StatCircle
//                             key={stat}
//                             stat={stat}
//                             value={value}
//                             boost={statReward[stat] || 0}
//                             icon={statIcons[stat]}
//                           />
//                         )
//                       )}
//                     </div>
//                   ) : (
//                     <p className="text-center text-gray-400">
//                       No stat rewards available.
//                     </p>
//                   )}
//                 </motion.div> */}

//                 {/* ✅ Done Button */}
//                 <motion.div
//                   variants={sectionVariants}
//                   className="flex justify-center mt-6"
//                 >
//                   <button
//                     className="bg-primary hover:bg-blue-400 rounded-md font-solo text-2xl px-4 py-2 font-bold"
//                     onClick={handleClose}
//                   >
//                     Done!
//                   </button>
//                 </motion.div>
//               </motion.div>
//             )}
//           </>
//         )}
//       </div>
//     </>
//   );
// };

// export default LevelUpScreen;

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faFire,
  faStar,
  faCoins,
  faShieldAlt,
  faTimes,
  faDumbbell,
  faHeart,
  faRunning,
  faBrain,
} from "@fortawesome/free-solid-svg-icons";

// Helper function to add a delay
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// A map for toast icons and styles, making it easy to configure
const toastConfig = {
  levelUp: {
    icon: faStar, // You can choose a specific icon for level up
    styles: "border-blue-500 shadow-[0_0_20px_#60a5fa]",
  },
  streak: {
    icon: faFire,
    styles: "border-orange-500 text-orange-300",
  },
  xp: {
    icon: faStar,
    styles: "border-green-500 text-green-300",
  },
  gold: {
    icon: faCoins,
    styles: "border-yellow-500 text-yellow-300",
  },
  stats: {
    icon: faShieldAlt,
    styles: "border-purple-500 text-purple-300",
  },
};

const LevelUpScreen = ({
  // Pass all your reward data as props
  levelUpTriggered,
  currentLevel,
  newLevel,
  streak,
  experienceReward,
  currencyReward,
  statReward, // Assuming this is an object like { str: 1 }
  onSequenceComplete,
}) => {
  const [activeToasts, setActiveToasts] = useState([]);

  // This effect listens for the reward props and builds the toast sequence
  useEffect(() => {
    // This function will run when the component receives new reward data
    const showRewardSequence = async () => {
      const toastsToAdd = [];

      if (levelUpTriggered) {
        toastsToAdd.push({
          id: `levelup-${Date.now()}`,
          type: "levelUp",
          title: "LEVEL UP",
          message: `${currentLevel} → ${newLevel}`,
        });
      }
      if (streak > 0) {
        toastsToAdd.push({
          id: `streak-${Date.now()}`,
          type: "streak",
          title: `${streak}-Day Streak`,
        });
      }
      if (experienceReward > 0) {
        toastsToAdd.push({
          id: `xp-${Date.now()}`,
          type: "xp",
          title: `+${experienceReward} XP`,
        });
      }
      if (currencyReward > 0) {
        toastsToAdd.push({
          id: `gold-${Date.now()}`,
          type: "gold",
          title: `+${currencyReward} Gold`,
          icon: faCoins,
        });
      }
      if (statReward) {
        for (const [stat, value] of Object.entries(statReward)) {
          // Only create a toast if the stat was actually increased
          if (value > 0) {
            // Capitalize the stat name for better display (e.g., "strength" -> "Strength")
            const capitalizedStat =
              stat.charAt(0).toUpperCase() + stat.slice(1);

            toastsToAdd.push({
              id: `stat-${stat}-${Date.now()}`, // Create a unique ID for each stat toast
              type: "stats",
              title: `+${value} ${capitalizedStat}`, // e.g., "+1 Strength"
              statName: stat,
            });
          }
        }
      }

      // Add each toast to the state with a delay for a staggered effect
      for (const toast of toastsToAdd) {
        setActiveToasts((prev) => [...prev, toast]);
        await sleep(500); // 0.5 second delay between each toast
      }

      onSequenceComplete();
    };

    // We only run the sequence if at least one reward is present
    if (
      levelUpTriggered ||
      streak > 0 ||
      experienceReward > 0 ||
      currencyReward > 0
    ) {
      showRewardSequence();
    }
    // Note: Adjust dependency array based on how you trigger rewards.
    // If they all come in one object, you can just use that object.
  }, [
    levelUpTriggered,
    newLevel,
    streak,
    experienceReward,
    currencyReward,
    statReward,
  ]);

  const removeToast = (id) => {
    setActiveToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  // The main container is now positioned in the top right
  return (
    <div className="fixed top-4 right-4 z-[99999] flex flex-col items-end gap-3 pointer-events-none">
      <AnimatePresence>
        {activeToasts.map((toast) => (
          <SingleToast key={toast.id} toast={toast} onRemove={removeToast} />
        ))}
      </AnimatePresence>
    </div>
  );
};

export default LevelUpScreen;

// Sub-component for rendering each individual toast
// You can keep this in the same file or move it out if you prefer
const SingleToast = ({ toast, onRemove }) => {
  const statInfoMap = {
    strength: { icon: faDumbbell, styles: "border-red-400 text-red-500" },
    endurance: { icon: faHeart, styles: "border-green-400 text-green-500" },
    bravery: { icon: faRunning, styles: "border-blue-400 text-blue-500" },
    intelligence: {
      icon: faBrain,
      styles: "border-yellow-500 text-yellow-400",
    },
  };
  // Automatically remove the toast after 5 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      onRemove(toast.id);
    }, 2000);
    return () => clearTimeout(timer);
  }, [toast.id, onRemove]);

  let config = toastConfig[toast.type];

  // The LEVEL UP toast gets a special, more impactful layout
  if (toast.type === "levelUp") {
    return (
      <motion.div
        layout
        initial={{ opacity: 0, y: -50, scale: 0.8 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, x: 100, scale: 0.8 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        className={`relative w-80 p-6 bg-gray-800 rounded-xl border ${config.styles} pointer-events-auto`}
      >
        <div className="text-center">
          <h1 className="text-4xl text-blue-300 font-extrabold font-solo mb-2 tracking-wider">
            {toast.title}
          </h1>
          <div className="text-3xl text-white font-black font-solo">
            {toast.message}
          </div>
        </div>
        <button
          onClick={() => onRemove(toast.id)}
          className="absolute top-2 right-2 text-gray-400 hover:text-white"
        >
          <FontAwesomeIcon icon={faTimes} />
        </button>
      </motion.div>
    );
  }

  // let config;
  if (toast.type === "stats" && toast.statName && statInfoMap[toast.statName]) {
    // If it's a stat toast with a known stat, use the specific map
    config = statInfoMap[toast.statName];
  } else {
    // Otherwise, use the default from the main toastConfig
    config = toastConfig[toast.type];
  }

  // The rest of the component now uses the dynamically chosen 'config' object
  const iconColorClass = config.styles.split(" ")[1] || ""; // e.g., "text-red-400"

  // Standard layout for all other toasts
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -50, scale: 0.8 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: 100, scale: 0.8 }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      className={`relative w-72 p-4 flex items-center gap-4 bg-gray-800/90 backdrop-blur-sm rounded-lg border-l-4 ${config.styles} pointer-events-auto`}
    >
      <FontAwesomeIcon
        icon={config.icon}
        className={`text-2xl ${iconColorClass}`}
      />

      <p className="font-bold text-white text-lg font-solo tracking-wide">
        {toast.title}
      </p>
      <motion.div
        className="absolute bottom-0 left-0 h-1 bg-current"
        initial={{ width: "100%" }}
        animate={{ width: "0%" }}
        transition={{ duration: 2, ease: "linear" }}
        onAnimationComplete={() => onRemove(toast.id)}
      />
    </motion.div>
  );
};
