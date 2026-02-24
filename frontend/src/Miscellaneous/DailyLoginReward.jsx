import React, { useState, useEffect, useMemo, useContext } from "react";
import ReactDOM from "react-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faXmark,
  faGem,
  faAward,
  faCheck,
  faStar,
  faCoins,
} from "@fortawesome/free-solid-svg-icons";
import Confetti from "react-confetti";
import { useSpring, animated } from "@react-spring/web";
import axios from "axios";
import config from "../config";
import { UserContext } from "../Account/UserContext";

const rarityStyles = {
  Common: { border: "border-gray-600", text: "text-gray-300" },
  Uncommon: { border: "border-green-500", text: "text-green-400" },
  Rare: { border: "border-blue-500", text: "text-blue-400" },
  Legendary: {
    border: "border-yellow-400",
    text: "text-yellow-400",
    glow: "shadow-yellow-400/20",
  },
};

const iconComponentMap = {
  award: faAward,
  gem: faGem,
  coins: faCoins,
  star: faStar,
};

const now = new Date();
const year = now.getFullYear();
const month = String(now.getMonth() + 1).padStart(2, "0");
const day = String(now.getDate()).padStart(2, "0");
const date = `${year}-${month}-${day}`;

function DailyLoginReward({ isOpen, onClose, userId }) {
  const [loginData, setLoginData] = useState({ streak: 0, lastLoginDate: "" });
  const [canClaim, setCanClaim] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [claimedReward, setClaimedReward] = useState(null);
  const [rewards, setRewards] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [accountData, setAccountData] = useState({});
  const { fetchAccountData, accountDataRef } = useContext(UserContext);
  const [dataLoaded, setDataLoaded] = useState(false);

  const modalSpring = useSpring({
    opacity: isOpen ? 1 : 0,
    transform: isOpen ? "scale(1)" : "scale(0.9)",
    config: { tension: 280, friction: 25 },
  });

  useEffect(() => {
    fetchAccountData(userId);
    const interval = setInterval(() => {
      if (accountDataRef.current && !dataLoaded) {
        setAccountData(accountDataRef.current);
        setDataLoaded(true);
      }
    }, 300); // Small interval to wait for dataRef update

    return () => clearInterval(interval);
  }, [accountDataRef, dataLoaded]);

  useEffect(() => {
    if (!isOpen || !userId || !canClaim) return;

    const fetchDailyRewardStatus = async () => {
      setIsLoading(true);
      console.log(userId);
      try {
        const response = await axios.get(
          `${config.backendUrl}/rewards/daily-status/${userId}`,
          {
            withCredentials: true,
          }
        );

        if (response.data.success) {
          console.log(response.data);
          const { rewards, streak, canClaimToday } = response.data;

          // Add rarity to the fetched rewards for styling
          const rewardsWithRarity = rewards.map((r) => {
            const rarityMap = {
              1: "Common",
              2: "Common",
              3: "Uncommon",
              4: "Uncommon",
              5: "Rare",
              6: "Rare",
              7: "Rare",
              8: "Common",
              9: "Common",
              10: "Uncommon",
              11: "Uncommon",
              12: "Rare",
              13: "Rare",
              14: "Legendary",
            };
            const iconMap = { gold: faCoins, xp: faAward };
            return {
              ...r,
              rarity: rarityMap[r.day],
              icon: iconMap[r.reward_type],
            };
          });

          console.log(rewardsWithRarity);
          setRewards(rewardsWithRarity);
          setLoginData({ streak });
          setCanClaim(canClaimToday);
        }
      } catch (error) {
        console.error("Failed to fetch daily reward status:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDailyRewardStatus();
  }, [isOpen, userId]);

  const handleClaimReward = async () => {
    // 1. Initial check to prevent multiple clicks
    if (!canClaim) return;

    try {
      // 2. Call the backend endpoint with the userId
      const response = await axios.post(
        `${config.backendUrl}/rewards/daily-claim`,
        { userId },
        { withCredentials: true } // Important for using sessions
      );

      // 3. If the backend confirms success, update the UI
      if (response.data.success) {
        const { newStreak, claimedReward } = response.data;

        const todayStr = date;

        // Update the component's state based on the response from the server
        setCanClaim(false);
        setLoginData({ streak: newStreak, lastLoginDate: todayStr });
        setClaimedReward(claimedReward);

        // Trigger visual feedback
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 5000);

        console.log(response.data.message);

        // Optional: You could call a function here to refresh the main user data
        // in the parent component, so their new currency/XP is shown everywhere.
      }
    } catch (error) {
      // 4. Handle any errors from the backend
      console.error("Failed to claim daily reward:", error.response || error);
      const errorMessage =
        error.response?.data?.error || "An unknown error occurred.";
      alert(`Claim Failed: ${errorMessage}`);
    }
  };

  if (!isOpen) return null;

  if (!canClaim) {
    return;
  }

  const isAlreadyClaimedToday = loginData.lastLoginDate === date;

  return ReactDOM.createPortal(
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[99999] flex items-center justify-center p-4"
      onClick={onClose}
    >
      {showConfetti && (
        <Confetti
          recycle={false}
          numberOfPieces={300}
          colors={["#60a5fa", "#3b82f6", "#1e40af", "#ffffff"]}
        />
      )}
      <animated.div
        style={modalSpring}
        className="bg-[#0e0e1a] border border-blue-800/50 rounded-2xl w-full max-w-xl flex flex-col h-[90vh] max-h-[700px] overflow-hidden shadow-2xl shadow-blue-900/40" // Adjusted max-width
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header (no changes needed) */}
        <div className="p-5 border-b-2 border-blue-700/50 text-center relative bg-black/20 flex-shrink-0">
          <h2 className="text-3xl font-extrabold font-solo text-white tracking-wider drop-shadow-[0_0_10px_rgba(59,130,246,0.5)]">
            Daily Login Bonus
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white absolute top-4 right-4 text-2xl"
          >
            <FontAwesomeIcon icon={faXmark} />
          </button>
        </div>

        {/* --- Scrollable Content Area --- */}
        <div className="flex-grow overflow-y-auto">
          {/* --- Responsive Reward Grid --- */}

          <div className="p-4 grid grid-cols-4 md:grid-cols-7 gap-3">
            {rewards?.map((reward, index) => {
              const dayIndex = index + 1;
              const isCurrentDay = dayIndex === loginData.streak;

              // --- THE FIX IS HERE ---
              // A day is considered "claimed" if:
              // 1. It's a day before the current streak number AND the user can still claim today.
              //    (e.g., if streak is 5 and they can claim, days 1-4 are past)
              // 2. The user has ALREADY claimed today. In this case, ALL days up to the current streak are considered claimed.
              //    (e.g., if streak is 5 and they have claimed, days 1-5 are now past/claimed)
              const isPastOrClaimed = !canClaim
                ? dayIndex <= loginData.streak
                : dayIndex < loginData.streak;

              const tileRarity = rarityStyles[reward.rarity];

              const tileClasses = `
      relative flex flex-col items-center justify-center p-2 rounded-xl transition-all duration-300 transform aspect-square
      font-bold text-gray-200 text-shadow-md cursor-pointer bg-black/30 border-2
      ${
        isCurrentDay && canClaim
          ? `border-blue-500 scale-105 shadow-xl shadow-blue-500/40 ring-4 ring-blue-500/30`
          : tileRarity.border
      }
      ${isPastOrClaimed ? "opacity-40 bg-black/50" : ""}
      ${
        !isCurrentDay && !canClaim
          ? "hover:scale-105 hover:border-gray-400"
          : ""
      }
    `;

              return (
                <div key={reward.day} className={tileClasses}>
                  {isPastOrClaimed && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-xl z-10">
                      <FontAwesomeIcon
                        icon={faCheck}
                        className="text-blue-400 text-4xl md:text-5xl drop-shadow-lg"
                      />
                    </div>
                  )}
                  <div className="absolute top-1 right-2 text-xs text-gray-300 drop-shadow-sm font-normal">
                    Day {reward.day}
                  </div>
                  <div
                    className={`text-3xl md:text-4xl my-1 ${tileRarity.text} drop-shadow-lg mt-5`}
                  >
                    <FontAwesomeIcon icon={reward.icon} />
                  </div>
                  <div className="text-xs md:text-sm text-white drop-shadow">
                    {reward.reward_amount} {reward.reward_type}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Claim Button & Footer (no changes needed) */}
        <div className="p-6 border-t-2 border-blue-700/50 bg-black/20 mt-auto flex-shrink-0">
          {claimedReward && (
            <div className="mb-4 text-center">
              <p className="text-gray-300 text-md font-semibold mb-2">
                {canClaim ? "Today's Reward:" : "Claimed Reward:"}
              </p>
              <div
                className={`flex items-center justify-center gap-3 bg-black/30 p-3 rounded-lg border ${
                  rarityStyles[claimedReward.rarity].border
                } shadow-md`}
              >
                <FontAwesomeIcon
                  icon={iconComponentMap[claimedReward.icon]}
                  className={`${
                    rarityStyles[claimedReward.rarity].text
                  } text-4xl`}
                />
                <span className="text-white text-3xl font-extrabold drop-shadow">
                  {claimedReward.amount} {claimedReward.type}
                </span>
                <FontAwesomeIcon
                  icon={faStar}
                  className={`${
                    rarityStyles[claimedReward.rarity].text
                  } text-2xl ml-2`}
                />
              </div>
            </div>
          )}
          <button
            onClick={handleClaimReward}
            disabled={!canClaim}
            className={`w-full py-3 rounded-lg font-bold text-xl transition-all duration-300 transform border-b-4
                ${
                  !canClaim
                    ? "bg-gray-800 text-gray-500 cursor-not-allowed border-gray-900"
                    : ""
                }
                ${
                  canClaim
                    ? "bg-primary text-white shadow-lg shadow-blue-500/20 hover:from-blue-500 hover:to-cyan-500 border-blue-800 active:border-b-0 active:translate-y-1"
                    : ""
                }
             `}
          >
            {isAlreadyClaimedToday ? "COLLECTED TODAY" : "CLAIM"}
          </button>
        </div>
      </animated.div>
    </div>,
    document.getElementById("root")
  );
}

export default DailyLoginReward;
