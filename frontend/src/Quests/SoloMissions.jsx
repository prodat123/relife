import React, { useState, useEffect, useMemo, useContext } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faXmark,
  faDumbbell,
  faBrain,
  faHeart,
  faRunning,
  faTasks,
  faCheckCircle,
  faAward,
  faCoins,
  faChevronDown,
} from "@fortawesome/free-solid-svg-icons";
import axios from "axios";
import config from "../config";
import { UserContext } from "../Account/UserContext";
import LevelUpScreen from "./LevelUpScreen";
import { AnimatePresence, motion } from "framer-motion";
import { createPortal } from "react-dom";

const now = new Date();
const year = now.getFullYear();
const month = String(now.getMonth() + 1).padStart(2, "0");
const day = String(now.getDate()).padStart(2, "0");
const date = `${year}-${month}-${day}`;

const statInfo = {
  strength: {
    icon: faDumbbell,
    color: "text-red-400",
    bg: "bg-red-500/10",
    border: "border-red-500/30",
  },
  intelligence: {
    icon: faBrain,
    color: "text-yellow-400",
    bg: "bg-yellow-500/10",
    border: "border-yellow-500/30",
  },
  endurance: {
    icon: faHeart,
    color: "text-green-400",
    bg: "bg-green-500/10",
    border: "border-green-500/30",
  },
  bravery: {
    icon: faRunning,
    color: "text-blue-400",
    bg: "bg-blue-500/10",
    border: "border-blue-500/30",
  },
  total: {
    icon: faTasks,
    color: "text-gray-400",
    bg: "bg-gray-500/10",
    border: "border-gray-500/30",
  },
};

const generateBounties = (userLevel) => {
  const bountyPools = {
    easy: {
      stat: [
        {
          type: "stat",
          stat: "strength",
          count: 1,
          description: "Complete 1 Strength quest",
        },
        {
          type: "stat",
          stat: "intelligence",
          count: 1,
          description: "Complete 1 Intelligence quest",
        },
        {
          type: "stat",
          stat: "endurance",
          count: 1,
          description: "Complete 1 Endurance quest",
        },
        {
          type: "stat",
          stat: "bravery",
          count: 1,
          description: "Complete 1 Bravery quest",
        },
      ],
      total: [
        { type: "total", count: 2, description: "Complete any 2 quests" },
        { type: "total", count: 3, description: "Complete any 3 quests" },
      ],
    },
    medium: {
      stat: [
        {
          type: "stat",
          stat: "strength",
          count: 2,
          description: "Complete 2 Strength quests",
        },
        {
          type: "stat",
          stat: "intelligence",
          count: 2,
          description: "Complete 2 Intelligence quests",
        },
        {
          type: "stat",
          stat: "endurance",
          count: 2,
          description: "Complete 2 Endurance quests",
        },
      ],
      total: [
        { type: "total", count: 4, description: "Complete any 4 quests" },
        { type: "total", count: 5, description: "Complete any 5 quests" },
      ],
    },
    hard: {
      stat: [
        {
          type: "stat",
          stat: "strength",
          count: 3,
          description: "Complete 3 Strength quests",
        },
        {
          type: "stat",
          stat: "bravery",
          count: 3,
          description: "Complete 3 Bravery quests",
        },
        {
          type: "stat",
          stat: "endurance",
          count: 3,
          description: "Complete 3 Endurance quests",
        },
      ],
      total: [
        { type: "total", count: 6, description: "Complete any 6 quests" },
      ],
    },
  };

  let difficulty = "easy";
  if (userLevel > 50) difficulty = "hard";
  else if (userLevel > 20) difficulty = "medium";

  const shuffledStats = [...bountyPools[difficulty].stat].sort(
    () => 0.5 - Math.random()
  );
  const shuffledTotal = [...bountyPools[difficulty].total].sort(
    () => 0.5 - Math.random()
  );
  const finalBounties = [
    ...shuffledTotal.slice(0, 1),
    ...shuffledStats.slice(0, 2),
  ];
  return {
    difficulty,
    bounties: finalBounties.sort(() => 0.5 - Math.random()),
  };
};

const generateReward = (difficulty) => {
  const rewardPools = {
    easy: [
      {
        type: "gold",
        min: 50,
        max: 100,
        icon: faCoins,
        color: "text-yellow-400",
      },
      { type: "xp", min: 300, max: 600, icon: faAward, color: "text-blue-400" },
    ],
    medium: [
      {
        type: "gold",
        min: 150,
        max: 300,
        icon: faCoins,
        color: "text-yellow-400",
      },
      {
        type: "xp",
        min: 700,
        max: 1200,
        icon: faAward,
        color: "text-blue-400",
      },
    ],
    hard: [
      {
        type: "gold",
        min: 400,
        max: 700,
        icon: faCoins,
        color: "text-yellow-400",
      },
      {
        type: "xp",
        min: 1500,
        max: 2500,
        icon: faAward,
        color: "text-blue-400",
      },
    ],
  };

  const pool = rewardPools[difficulty];
  const chosen = pool[Math.floor(Math.random() * pool.length)];
  const amount =
    Math.floor(Math.random() * (chosen.max - chosen.min + 1)) + chosen.min;
  return { ...chosen, amount };
};

function SoloMissions({
  userLevel,
  onClose,
  questsToday,
  allQuests,
  completedQuestIds,
  updated,
}) {
  const { fetchAccountData, accountDataRef } = useContext(UserContext);
  const userId = JSON.parse(localStorage.getItem("user"))?.id;
  const [rewardedItem, setRewardedItem] = useState(null);

  const [accountData, setAccountData] = useState({});
  const [bounties, setBounties] = useState([]);
  const [dailyReward, setDailyReward] = useState(null);
  const [difficulty, setDifficulty] = useState("easy");
  const [isRewardClaimed, setIsRewardClaimed] = useState(false);
  const [isChestOpen, setIsChestOpen] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [isOpen, setIsOpen] = useState(true);

  // 🧠 Fetch account data
  useEffect(() => {
    fetchAccountData(userId);
    const interval = setInterval(() => {
      if (accountDataRef.current && !dataLoaded) {
        setAccountData(accountDataRef.current);
        setDataLoaded(true);
      }
    }, 300);
    return () => clearInterval(interval);
  }, [accountDataRef, dataLoaded, updated, bounties]);

  // 🗓️ Fetch or generate daily missions from backend
  useEffect(() => {
    console.log(accountData);
    if (!userId || !accountData) return;

    const fetchMissions = async () => {
      try {
        let todaysBounties =
          accountData.dailyMissions !== null
            ? JSON.parse(accountData.dailyMissions)
            : [];
        // 2️⃣ If no missions exist for today, generate and save new ones
        // console.log(accountData.dailyMissions[date]);
        if (todaysBounties === null || todaysBounties[date] === undefined) {
          const { difficulty, bounties } = generateBounties(userLevel);
          const reward = generateReward(difficulty);

          // todaysBounties = generateBounties(userLevel);
          todaysBounties = bounties;
          setDailyReward(reward);

          await axios.post(
            `${config.backendUrl}/missions/update`,
            { userId, missions: todaysBounties, date, reward, difficulty },
            { withCredentials: true }
          );

          setBounties(todaysBounties || []);
          setDailyReward(reward || null);
        } else {
          const todayData = todaysBounties[date];
          setDifficulty(todayData.difficulty || "easy");
          setBounties(todayData.missions || []);
          setDailyReward(todayData.reward || null);
        }

        // Check reward claim status
        if (accountData.missionRewardClaimed === date) {
          setIsRewardClaimed(true);
          setIsChestOpen(true);
        }
      } catch (err) {
        console.error("Failed to fetch missions:", err);
      }
    };

    fetchMissions();
  }, [userId, accountData, userLevel, updated]);

  // 🧮 Calculate bounty progress
  const bountiesWithProgress = useMemo(() => {
    console.log(completedQuestIds);
    const completedQuestsDetails = allQuests.filter((quest) =>
      completedQuestIds.includes(quest.id)
    );

    return bounties?.map((bounty) => {
      let currentProgress = 0;
      if (bounty.type === "stat") {
        currentProgress = completedQuestsDetails.filter(
          (quest) => quest.stat_reward && quest.stat_reward[bounty.stat]
        ).length;
      } else if (bounty.type === "total") {
        currentProgress = completedQuestsDetails.length;
      }

      const isComplete = currentProgress >= bounty.count;
      const progressPercent = Math.min(
        (currentProgress / bounty.count) * 100,
        100
      );

      return { ...bounty, currentProgress, isComplete, progressPercent };
    });
  }, [bounties, questsToday, completedQuestIds, updated]);

  const areAllBountiesComplete = useMemo(
    () => bountiesWithProgress?.every((b) => b.isComplete),
    [bountiesWithProgress, updated]
  );

  const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  // 💰 Claim reward
  const handleClaimReward = async () => {
    if (!areAllBountiesComplete || isRewardClaimed) return;
    console.log(bounties);
    try {
      const response = await axios.post(
        `${config.backendUrl}/missions/claim`,
        // Send difficulty instead of the old reward object
        { userId, difficulty, date },
        { withCredentials: true }
      );
      if (response.data.success) {
        setIsChestOpen(true);
        // Set the rewarded item in state to display it
        setRewardedItem(response.data.rewardedItem);
        await delay(1200); // Pauses the function here for 800ms
        setIsRewardClaimed(true);
      }
    } catch (error) {
      console.error("Failed to claim reward:", error.response || error);
      alert(`Claim Failed: ${error.response?.data?.error || "Unknown error"}`);
    }
  };

  const handleSequenceCompleteWithDelay = async () => {
    fetchAccountData(userId);
    await new Promise((resolve) => setTimeout(resolve, 1800));
    setIsRewardClaimed(true);
    // Reset the item display
    setRewardedItem(null);
  };

  // 🎨 UI remains same
  return (
    <div className="bg-gray-900/95 border border-gray-700 mb-3 rounded-md w-full flex flex-col overflow-hidden">
      {isRewardClaimed ? (
        <div className="relative p-5 rounded-md flex items-center flex-col border border-gray-400 overflow-hidden text-center bg-gray-800/70 cursor-not-allowed">
          <div className="absolute inset-0 bg-gray-700/70" />
          <div className="relative z-10 flex flex-col items-center opacity-70">
            <img
              src="/sprites/OpenChest.png"
              alt="Treasure Chest Opened"
              className="w-20 sm:w-24 pixel-art"
            />
            <p className="mt-3 text-sm sm:text-base font-bold uppercase text-gray-300">
              Rewards Claimed
            </p>
          </div>
        </div>
      ) : (
        <>
          {areAllBountiesComplete && bounties.length > 0 ? (
            <div
              className="relative p-5 rounded-md flex items-center flex-col border border-yellow-300 overflow-hidden text-center cursor-pointer"
              onClick={handleClaimReward}
            >
              <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(255,255,0,0.25)_25%,transparent_25%,transparent_50%,rgba(255,255,0,0.25)_50%,rgba(255,255,0,0.25)_75%,transparent_75%,transparent)] bg-[length:40px_40px] animate-stripes" />
              <div className="absolute inset-0 bg-yellow-500 mix-blend-color opacity-70" />
              <div className="relative z-10 flex flex-col items-center">
                <img
                  src={
                    !isChestOpen
                      ? "/sprites/ClosedChest.png"
                      : "/sprites/OpenChest.png"
                  }
                  alt="Treasure Chest"
                  className="w-20 sm:w-24 pixel-art animate-shake"
                />
                <p className="mt-3 text-sm sm:text-base font-bold uppercase tracking-widest text-yellow-50">
                  Claim Rewards
                </p>
              </div>
            </div>
          ) : (
            <>
              <div
                className="flex justify-between items-center p-4 border-b border-gray-700"
                onClick={() => setIsOpen(!isOpen)}
              >
                <h2 className="text-lg font-solo font-bold text-white">
                  Today's Missions
                </h2>
                <FontAwesomeIcon
                  className={`h-6 w-6 text-gray-400 transition-transform ${
                    isOpen ? "rotate-180" : ""
                  }`}
                  icon={faChevronDown}
                />
              </div>

              <div
                className={`transition-all ${
                  isOpen ? "max-h-[1000px] p-2" : "max-h-0 overflow-hidden"
                }`}
              >
                {bountiesWithProgress?.map((bounty, i) => (
                  <div
                    key={i}
                    className={`p-4 rounded-lg border ${
                      statInfo[bounty.stat || "total"].bg
                    } ${statInfo[bounty.stat || "total"].border}`}
                  >
                    <div className="flex items-center justify-between flex-wrap">
                      <div className="flex items-center gap-3">
                        <FontAwesomeIcon
                          icon={statInfo[bounty.stat || "total"].icon}
                          className={statInfo[bounty.stat || "total"].color}
                        />
                        <span className="font-semibold text-sm text-gray-200">
                          {bounty.description}
                        </span>
                      </div>
                      <div
                        className={`font-bold text-sm ${
                          bounty.isComplete ? "text-green-400" : "text-gray-400"
                        }`}
                      >
                        {bounty.isComplete ? (
                          <FontAwesomeIcon icon={faCheckCircle} />
                        ) : (
                          `${bounty.currentProgress} / ${bounty.count}`
                        )}
                      </div>
                    </div>
                    <div className="mt-3 bg-gray-700 rounded-full h-2.5">
                      <div
                        className="bg-blue-500 h-2.5 rounded-full transition-all duration-500"
                        style={{ width: `${bounty.progressPercent}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}

      <div className="text-center">
        {dailyReward && !isRewardClaimed && isChestOpen && (
          <AnimatePresence>
            {rewardedItem && (
              <ItemRewardToast
                item={rewardedItem}
                onDismiss={() => setRewardedItem(null)}
              />
            )}
          </AnimatePresence>
        )}
        {/* // (dailyReward.type === "xp" ? (
          //   <LevelUpScreen
          //     prevAccountData={accountData}
          //     experienceReward={dailyReward.amount}
          //     onSequenceComplete={handleSequenceCompleteWithDelay}
          //   />
          // ) : (
          //   <LevelUpScreen
          //     prevAccountData={accountData}
          //     currencyReward={dailyReward.amount}
          //     onSequenceComplete={handleSequenceCompleteWithDelay}
          //   />
          // ))} */}
      </div>
    </div>
  );
}

const rarityStyles = {
  peasantly: {
    border: "border-amber-700",
    text: "text-amber-700",
  },
  artisan: {
    border: "border-teal-600",
    text: "text-teal-600",
  },
  knightly: {
    border: "border-gray-300",
    text: "text-gray-300",
  },
  noble: {
    border: "border-red-400",
    text: "text-red-400",
  },
  kingly: {
    border: "border-amber-300",
    text: "text-amber-300",
  },
  emperor: {
    border: "border-purple-600",
    text: "text-purple-600",
  },
};

const ItemRewardToast = ({ item, onDismiss }) => {
  // This effect sets a timer to automatically dismiss the toast
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss();
    }, 4000); // The toast will disappear after 4 seconds

    // Cleanup function to clear the timer if the component unmounts early
    return () => {
      clearTimeout(timer);
    };
  }, [onDismiss]);

  const styles = rarityStyles[item.rarity] || rarityStyles.common;

  // Use createPortal to render the toast in the document body
  return createPortal(
    <motion.div
      layout
      initial={{ opacity: 0, y: 50, scale: 0.8 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: -100, scale: 0.8 }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
      className={`fixed top-5 right-5 z-50 w-80 p-4 bg-slate-800/90 backdrop-blur-sm rounded-lg border-2 ${styles.border} pointer-events-auto shadow-lg`}
    >
      <div className="flex items-center gap-4">
        <div
          className={`w-16 h-16 flex-shrink-0 bg-black/30 rounded-md p-1 border ${styles.border}`}
        >
          <img
            src={item.image_url || "/sprites/DefaultItem.png"}
            alt={item.name}
            className="w-full h-full object-contain pixel-art"
          />
        </div>
        <div className="flex-grow">
          <h3 className="font-bold text-slate-300 text-sm">Item Acquired!</h3>
          <p className={`font-bold text-lg ${styles.text}`}>{item.name}</p>
        </div>
      </div>
      <motion.div
        className={`absolute bottom-0 left-0 h-1 ${styles.text}`}
        initial={{ width: "100%" }}
        animate={{ width: "0%" }}
        transition={{ duration: 4, ease: "linear" }}
      />
    </motion.div>,
    document.body
  );
};

export default SoloMissions;
