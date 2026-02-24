import {
  faCaretDown,
  faCertificate,
  faCrown,
  faDiamond,
  faDiamondTurnRight,
  faPeopleGroup,
  faTowerObservation,
  faTrophy,
  faUserGroup,
  faMedal,
  faStar,
  faFire,
  faGem,
  faSearch,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import config from "../config";
import axios from "axios";
import TowerLeaderboard from "./TowerLeaderboard";
import ErrorDisplay from "../Miscellaneous/ErrorDisplay";
import PlayerSprite from "./PlayerSprite";
import CharacterDisplay from "../Miscellaneous/CharacterDisplay";

const Leaderboard = () => {
  const username = JSON.parse(localStorage.getItem("user")).username;
  const userId = JSON.parse(localStorage.getItem("user")).id;
  const [users, setUsers] = useState([]);
  const [accountData, setAccountData] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("levels"); // 'levels' or 'tower'

  // In your Leaderboard component
  const [filters, setFilters] = useState({
    stat: "experience", // 'experience', 'strength', 'intelligence', etc.
    timeframe: "all_time", // 'all_time', 'monthly', 'weekly'
  });

  // Handler to update a specific filter
  const handleFilterChange = (filterType, value) => {
    setFilters((prevFilters) => ({
      ...prevFilters,
      [filterType]: value,
    }));
  };

  // Your useEffect for fetching data would now depend on `filters`
  useEffect(() => {
    fetchLeaderboard(filters);
  }, [filters]);

  const navigate = useNavigate();

  useEffect(() => {
    document.title = "Re:LIFE | Leaderboard";
  }, []);

  const fetchAccountData = async () => {
    try {
      const response = await axios.get(`${config.backendUrl}/account`, {
        params: { userId: userId },
        withCredentials: true,
      });
      const player = response.data;
      setAccountData(player);
    } catch (error) {
      console.error("Error fetching account data:", error);
      setError(error.response?.data?.error || "Failed to fetch account data");
    }
  };

  useEffect(() => {
    fetchAccountData();
  }, [userId]);

  const fetchLeaderboard = async () => {
    setIsLoading(true);
    try {
      // Make the API request with the userId as a query parameter
      const response = await axios.get(`${config.backendUrl}/leaderboard`, {
        params: {
          userId,
          stat: filters.stat,
          timeframe: filters.timeframe,
        }, // Pass userId as a query parameter
        withCredentials: true,
      });

      // Map over the users data and add the rank
      const rankedUsers = response.data.users.map((user, index) => ({
        ...user,
        rank: index + 1,
      }));

      setUsers(rankedUsers);
    } catch (err) {
      setError(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard(filters);
  }, []);

  const calculateLevel = (experience) => {
    let level = 1;
    let xpForNextLevel = 10;

    while (experience >= xpForNextLevel) {
      level++;
      experience -= xpForNextLevel;
      xpForNextLevel = 10 * Math.pow(1.05, level - 1);
    }

    return { level, remainingXP: experience, xpForNextLevel };
  };

  const handleSearch = (term) => {
    setSearchTerm(term);
    if (!term) {
      setSearchResults([]);
      return;
    }
    const filteredResults = users.filter((user) =>
      user.username.toLowerCase().includes(term.toLowerCase())
    );
    setSearchResults(filteredResults);
  };

  function calculateRank(level) {
    if (level >= 1 && level <= 10) return "F-";
    if (level <= 20) return "F";
    if (level <= 30) return "F+";
    if (level <= 40) return "D-";
    if (level <= 50) return "D";
    if (level <= 60) return "D+";
    if (level <= 70) return "C-";
    if (level <= 80) return "C";
    if (level <= 90) return "C+";
    if (level <= 100) return "B-";
    if (level <= 110) return "B";
    if (level <= 120) return "B+";
    if (level <= 130) return "A-";
    if (level <= 140) return "A";
    if (level <= 150) return "A+";
    if (level <= 175) return "S-";
    if (level <= 200) return "S";
    if (level <= 250) return "S+";
    if (level <= 300) return "S++";
    if (level <= 400) return "Z";

    return "??"; // default or unknown rank
  }

  const handleUserClick = (userId) => {
    navigate(`/account/${userId}`);
  };

  if (isLoading) {
    return (
      <div className="w-full grid xl:grid-cols-6 lg:grid-cols-5 md:grid-cols-3 grid-cols-1 p-6">
        <div className="lg:col-start-2 md:col-start-2 col-start-1 col-span-5 max-w-7xl mx-auto">
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-xl text-gray-300 font-solo">
                Loading the champions...
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const ranks = [
    {
      levelRequirement: 1,
      rank: "F-",
      color: "text-green-500",
      description: "Beginner – just getting started.",
    },
    {
      levelRequirement: 11,
      rank: "F",
      color: "text-lime-500",
      description: "Novice explorer of features.",
    },
    {
      levelRequirement: 21,
      rank: "F+",
      color: "text-emerald-500",
      description: "Starting to stand out!",
    },
    {
      levelRequirement: 31,
      rank: "D-",
      color: "text-teal-500",
      description: "Basic engagement level.",
    },
    {
      levelRequirement: 41,
      rank: "D",
      color: "text-cyan-500",
      description: "Slightly more active.",
    },
    {
      levelRequirement: 51,
      rank: "D+",
      color: "text-sky-500",
      description: "Gaining traction.",
    },
    {
      levelRequirement: 61,
      rank: "C-",
      color: "text-blue-500",
      description: "Improved consistency.",
    },
    {
      levelRequirement: 71,
      rank: "C",
      color: "text-indigo-500",
      description: "Intermediate level user.",
    },
    {
      levelRequirement: 81,
      rank: "C+",
      color: "text-violet-500",
      description: "Reliable contributor.",
    },
    {
      levelRequirement: 91,
      rank: "B-",
      color: "text-purple-500",
      description: "Notable activity.",
    },
    {
      levelRequirement: 101,
      rank: "B",
      color: "text-fuchsia-500",
      description: "Advanced and consistent.",
    },
    {
      levelRequirement: 111,
      rank: "B+",
      color: "text-pink-500",
      description: "Power user potential.",
    },
    {
      levelRequirement: 121,
      rank: "A-",
      color: "text-rose-500",
      description: "Highly engaged.",
    },
    {
      levelRequirement: 131,
      rank: "A",
      color: "text-orange-500",
      description: "Elite tier user.",
    },
    {
      levelRequirement: 141,
      rank: "A+",
      color: "text-amber-500",
      description: "Influencer status.",
    },
    {
      levelRequirement: 151,
      rank: "S-",
      color: "text-red-500",
      description: "Expert level.",
    },
    {
      levelRequirement: 176,
      rank: "S",
      color: "text-red-600",
      description: "Mastered the system.",
    },
    {
      levelRequirement: 201,
      rank: "S+",
      color: "text-red-700",
      description: "Legendary contributor.",
    },
    {
      levelRequirement: 251,
      rank: "S++",
      color: "text-red-800",
      description: "Top 1% performer.",
    },
    {
      levelRequirement: 301,
      rank: "Z",
      color: "text-black",
      description: "Mythic status – beyond mastery.",
    },
  ];

  const getRankIcon = (rank) => {
    if (rank === 1) return faCrown;
    if (rank === 2) return faMedal;
    if (rank === 3) return faTrophy;
    if (rank <= 10) return faStar;
    return faGem;
  };

  const getRankColor = (rank) => {
    if (rank === 1) return "text-amber-400";
    if (rank === 2) return "text-gray-300";
    if (rank === 3) return "text-amber-600";
    if (rank <= 10) return "text-blue-400";
    return "text-gray-400";
  };

  const getRankIconColor = (rank) => {
    if (rank === 1) return "text-amber-900"; // dark for gold badge
    if (rank === 2) return "text-blue-700"; // dark for silver badge
    if (rank === 3) return "text-orange-900"; // dark for bronze badge
    if (rank <= 10) return "text-yellow-300"; // bright for blue/purple badge
    return "text-white"; // default for others
  };

  const equipmentSlots = [
    { slot: "head", top: "15.8%", left: "48.3%", zIndex: 100 },
    { slot: "torso", top: "44%", left: "46.85%", zIndex: 98 },
    { slot: "legs", top: "70%", left: "50%", zIndex: 90 },
    { slot: "feet", top: "90.6%", left: "51.62%", zIndex: 80 },
    { slot: "weapon", top: "50%", left: "50%", zIndex: 99 },
  ];

  return (
    <>
      {error ? (
        <ErrorDisplay error={error} />
      ) : (
        <div className="w-full grid xl:grid-cols-6 lg:grid-cols-5 md:grid-cols-3 grid-cols-1 p-6">
          <div className="lg:col-start-2 md:col-start-2 col-start-1 col-span-5 w-full mx-auto">
            {/* Hero Section */}
            <div className="relative overflow-hidden">
              <div className="relative z-10 text-center">
                <h1 className="text-4xl tracking-widest font-bold font-solo text-text drop-shadow-[0_4px_8px_rgba(0,0,0,0.8)] mb-2">
                  Hall of Champions
                </h1>
                <p className="text-xl text-gray-300 font-solo tracking-wide mb-4">
                  Where legends are forged and destinies are written
                </p>
              </div>
            </div>

            <div
              className="w-full p-6 bg-gradient-to-br from-gray-900 via-slate-900 to-gray-800 
             rounded-lg shadow-2xl border border-slate-700 mb-6"
            >
              {/* Stat Filters */}
              <div className="flex flex-wrap justify-center gap-2 mb-4">
                {[
                  "experience",
                  "strength",
                  "intelligence",
                  "bravery",
                  "endurance",
                ].map((stat) => (
                  <button
                    key={stat}
                    onClick={() => handleFilterChange("stat", stat)}
                    className={`px-4 py-2 text-sm font-bold capitalize rounded-md transition-all duration-200 border-2
                    ${
                      filters.stat === stat
                        ? "bg-blue-600 border-blue-400 text-white shadow-lg"
                        : "bg-slate-700/50 border-slate-600 text-slate-300 hover:bg-slate-700 hover:border-slate-500"
                    }`}
                  >
                    {stat === "experience" ? "Overall" : stat}
                  </button>
                ))}
              </div>

              {/* Timeframe & Scope Filters */}
              <div className="flex flex-wrap justify-center gap-2 mb-6">
                {["all_time", "monthly", "weekly"].map((time) => (
                  <button
                    key={time}
                    onClick={() => handleFilterChange("timeframe", time)}
                    className={`px-3 py-1 text-xs font-semibold capitalize rounded-full transition-all duration-200
                    ${
                      filters.timeframe === time
                        ? "bg-amber-500 text-black"
                        : "bg-slate-700/50 text-slate-400 hover:bg-slate-700"
                    }`}
                  >
                    {time.replace("_", " ")}
                  </button>
                ))}
              </div>

              {/* Search Bar */}
              <div className="relative">
                <FontAwesomeIcon
                  icon={faSearch}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
                />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  placeholder="Search for a player..."
                  className="w-full p-3 pl-10 bg-slate-800 border border-slate-600 rounded-lg text-white 
                   focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 transition-all"
                />
              </div>
            </div>

            {/* Epic Tabs */}
            {/* <div className="flex justify-center gap-4 mb-8">
              <button
                className={`px-6 py-3 rounded-lg font-semibold transition-all duration-200
                  ${
                    activeTab === "levels"
                      ? "bg-primary text-white shadow border border-blue-500"
                      : "bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white border border-gray-700"
                  }`}
                onClick={() => setActiveTab("levels")}
              >
                <FontAwesomeIcon icon={faUserGroup} className="mr-2" />
                <span className="font-solo tracking-wide">Champions</span>
              </button>
              <button
                className={`px-6 py-3 rounded-lg font-semibold transition-all duration-200
                  ${
                    activeTab === "tower"
                      ? "bg-primary text-white shadow border border-blue-500"
                      : "bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white border border-gray-700"
                  }`}
                onClick={() => setActiveTab("tower")}
              >
                <FontAwesomeIcon icon={faTowerObservation} className="mr-2" />
                <span className="font-solo tracking-wide">Tower Masters</span>
              </button>
            </div> */}

            {/* Tab Content */}
            {activeTab === "levels" ? (
              <div className="space-y-3">
                {(searchTerm ? searchResults : users).map((user, index) => {
                  // Assume you have the logged-in user's ID
                  const loggedInUserId = JSON.parse(
                    localStorage.getItem("user")
                  )?.id;
                  const isCurrentUser = user.id === loggedInUserId;

                  // Determine the value to display based on the active filter
                  const displayValue = user.leaderboardValue;
                  const topPlayerValue =
                    users[0]?.stats[filters.stat] || users[0]?.experience;

                  return (
                    <div
                      key={user.id}
                      // --- FEATURE 1: HIGHLIGHT THE CURRENT USER ---
                      className={`relative flex flex-wrap cursor-pointer items-center justify-between p-3 rounded-lg transition-all duration-300
                    border-2 ${
                      isCurrentUser
                        ? "bg-blue-900/50 border-blue-500 shadow-lg shadow-blue-500/20"
                        : "bg-slate-800/50 border-slate-700 hover:bg-slate-700/70"
                    }`}
                      onClick={() => handleUserClick(user.id)}
                    >
                      <div className="flex items-center space-x-4">
                        {/* Rank Badge */}
                        <span
                          className="text-lg font-bold w-8 text-center"
                          style={{
                            color:
                              user.rank === 1
                                ? "#FFD700"
                                : user.rank === 2
                                ? "#C0C0C0"
                                : user.rank === 3
                                ? "#CD7F32"
                                : "#A0AEC0",
                          }}
                        >
                          {user.rank}
                        </span>

                        {/* Player Sprite */}
                        <div className="relative w-32 h-32">
                          <CharacterDisplay
                            equipment={user.equipment}
                            showAuraValue={false}
                          />
                          {/* <PlayerSprite
                            equipment={user.equipment}
                            equipmentSlots={equipmentSlots}
                          /> */}
                        </div>

                        {/* Username and details */}
                        <div>
                          <p className="font-bold text-lg text-white font-solo tracking-wider break-all">
                            {user.username}
                          </p>
                          <p className="text-sm text-slate-400">
                            Level {calculateLevel(user.stats.experience).level}
                          </p>
                        </div>
                      </div>

                      {/* --- FEATURE 2: DYNAMIC STAT DISPLAY --- */}
                      <div className="flex flex-col items-end w-48">
                        <p className="text-xl font-bold font-mono text-white">
                          {displayValue.toLocaleString()}
                          <span className="text-xs text-slate-400 uppercase ml-1">
                            {filters.stat === "experience"
                              ? "XP"
                              : filters.stat}
                          </span>
                        </p>
                        {/* Stat Bar for visual comparison */}
                        <div className="w-full bg-slate-700 rounded-full h-1.5 mt-1">
                          <div
                            className="bg-blue-500 h-1.5 rounded-full"
                            style={{
                              width: `${
                                (displayValue / topPlayerValue) * 100
                              }%`,
                            }}
                          ></div>
                        </div>
                      </div>

                      {isCurrentUser && (
                        <div className="absolute top-2 right-2 bg-blue-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                          YOU
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <TowerLeaderboard username={username} />
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default Leaderboard;
