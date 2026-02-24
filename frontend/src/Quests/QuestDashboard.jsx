import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import axios from "axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faStar as faStarEmpty,
  faX,
  faCalendar,
  faThumbTack,
  faBrain,
  faRunning,
  faHeart,
  faDumbbell,
  faAward,
  faCalendarDay,
  faMapMarkedAlt,
  faQuestionCircle,
  faCoins,
} from "@fortawesome/free-solid-svg-icons";
import config from "../config";
import ItemPopup from "../Inventory/ItemPopup";
import { UserContext } from "../Account/UserContext";
import ScheduledQuests from "./ScheduledQuests";
import DaySelector from "./DaySelector";
import { useLocation } from "react-router-dom";
import QuestCreationForm from "./QuestCreationForm";
import CharacterDisplay from "../Miscellaneous/CharacterDisplay";
import DailyLoginReward from "../Miscellaneous/DailyLoginReward";
import SoloMissions from "./SoloMissions";
import { format } from "date-fns";

const now = new Date();
const year = now.getFullYear();
const month = String(now.getMonth() + 1).padStart(2, "0");
const day = String(now.getDate()).padStart(2, "0");
const date = `${year}-${month}-${day}`;

const weekdays = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const QuestDashboard = () => {
  const userId = JSON.parse(localStorage.getItem("user")).id;
  const { accountDataRef, fetchAccountData } = useContext(UserContext);
  const [dataLoaded, setDataLoaded] = useState(false); // 👈 trigger for updates
  // const [accountDataRef, setAccountData] = useState({});
  const [accountStats, setAccountStats] = useState({});
  const [equipment, setEquipment] = useState({});
  const [selectedType, setSelectedType] = useState("daily");
  const [selectedQuests, setSelectedQuests] = useState([]); // Array for multiple quests
  const [activeQuests, setActiveQuests] = useState([]); // To track quests being worked on
  const [completedQuests, setCompletedQuests] = useState([]); // To track finished quests
  const [itemNames, setItemNames] = useState({}); // State to store item names
  const [isQuestListOpen, setQuestListOpen] = useState(false);
  const [questListUpdated, setQuestListUpdated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState([]);

  const [popups, setPopups] = useState([]);

  const [selectedDifficulty, setSelectedDifficulty] = useState(null);
  const [selectedStat, setSelectedStat] = useState(null);
  const [selectedTags, setSelectedTags] = useState([]);

  const [extraSlots, setExtraSlots] = useState(0);
  const [xpBoost, setXpBoost] = useState(0);

  const [searchTerm, setSearchTerm] = useState("");
  const [openTags, setOpenTags] = useState(false);
  const [visibleCount, setVisibleCount] = useState(8); // or however many you want to start with
  const [updatedScheduledQuests, setUpdatedScheduledQuests] = useState(false);
  const [scheduledDays, setScheduledDays] = useState({});
  const [updatedBoss, setUpdatedBoss] = useState(false);

  const dropdownRef = useRef();
  const bottomRef = useRef(null);

  const [daySelectorOpen, setDaySelectorOpen] = useState([]);
  const [currentDay, setCurrentDay] = useState(weekdays[new Date().getDay()]);
  const [loadingQuests, setLoadingQuests] = useState([]);

  const [openQuestCreation, setOpenQuestCreation] = useState(false);

  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  const [isGateModalOpen, setGateModalOpen] = useState(false);

  const [daysMap, setDaysMap] = useState({
    Monday: [],
    Tuesday: [],
    Wednesday: [],
    Thursday: [],
    Friday: [],
    Saturday: [],
    Sunday: [],
  });

  const [isMissionsOpen, setIsMissionsOpen] = useState(true);

  const isPremium = accountDataRef.current?.premium === 1;

  const [activeView, setActiveView] = useState(
    localStorage.getItem("questView"),
  );

  const tags = [
    "Exercise",
    "Planks",
    "Walking",
    "Jogging",
    "Running",
    "Situps",
    "Squats",
    "Lunges",
    "Stretching",
    "Biking",
    "Burpees",
    "Pullups",
    "Pushups",
    "Swimming",
    "Diet",
    "Reading",
    "Music",
    "Writing",
    "Cooking",
    "Charity",
    "Yoga",
    "Relaxation",
    "Meditation",
    "Community",
    "Chores",
    "Language",
    "Hobbies",
    "Social",
    "Cleaning",
    "Outdoors",
    "Isometrics",
    "Dancing",
    "Helping",
    "Planning",
  ];

  const location = useLocation();

  const dateKey = format(new Date(), "yyyy-MM-dd");

  const dayNameKey = format(new Date(), "EEEE");

  const { newLevel, fillPercent } = useMemo(() => {
    // Your existing calculateLevel logic here or imported
    const { level, remainingXP, xpForNextLevel } = calculateLevel(
      accountDataRef.current?.experience,
    );
    return {
      newLevel: level,
      fillPercent: (remainingXP / xpForNextLevel) * 100,
    };
  }, [accountDataRef?.current?.experience]);

  const fetchScheduledQuests = async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        `${config.backendUrl}/scheduled-quests/${userId}`,
      );
      const questsData = response.data;
      const daysMapTemp = {}; // Start with an empty object to handle date keys

      if (
        !questsData ||
        questsData.message === "No scheduled quests found for this user"
      ) {
        setDaysMap({}); // Set empty map
        return;
      }

      questsData.forEach((quest) => {
        const schedule = quest.schedule_details;
        if (!schedule) return;

        const questForDisplay = {
          id: quest.id,
          name: quest.name,
          description: quest.description,
          experience_reward: quest.experience_reward,
          stat_reward: quest.stat_reward,
          difficulty: quest.difficulty,
          streak: quest.streak,
          time: schedule.time,
          type: schedule.type,
        };

        switch (schedule.type) {
          case "daily":
            [
              "Monday",
              "Tuesday",
              "Wednesday",
              "Thursday",
              "Friday",
              "Saturday",
              "Sunday",
            ].forEach((dayName) => {
              if (!daysMapTemp[dayName]) daysMapTemp[dayName] = [];
              daysMapTemp[dayName].push(questForDisplay);
            });
            break;
          case "weekly":
            schedule.days.forEach((dayShort) => {
              const dayFullName = {
                Mon: "Monday",
                Tue: "Tuesday",
                Wed: "Wednesday",
                Thu: "Thursday",
                Fri: "Friday",
                Sat: "Saturday",
                Sun: "Sunday",
              }[dayShort];
              if (dayFullName) {
                if (!daysMapTemp[dayFullName]) daysMapTemp[dayFullName] = [];
                daysMapTemp[dayFullName].push(questForDisplay);
              }
            });
            break;
          case "specific":
            const dateKey = schedule.startDate;
            if (!daysMapTemp[dateKey]) daysMapTemp[dateKey] = [];
            daysMapTemp[dateKey].push(questForDisplay);
            break;
          default:
            break;
        }
      });
      setDaysMap(daysMapTemp);
    } catch (err) {
      console.error("Error fetching scheduled quests:", err);
      setError("Failed to load quests.");
    } finally {
      setLoading(false);
    }
  };

  const fetchActiveAndCompletedQuests = async () => {
    try {
      const [completedResponse] = await Promise.all([
        axios.get(`${config.backendUrl}/quests/completed`, {
          params: { userId, date },
        }),
      ]);

      // Process completed quests
      const completedQuestIds = completedResponse.data.map(
        (quest) => quest.quest_id,
      );
      setCompletedQuests(completedQuestIds);
    } catch (err) {
      console.error("Error fetching active or completed quests:", err);
    }
  };

  const quests = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const allQuests = [];

    // 1. Get quests on specific dates that are overdue
    Object.keys(daysMap).forEach((key) => {
      if (/^\d{4}-\d{2}-\d{2}$/.test(key)) {
        const specificDate = new Date(`${key}T12:00:00Z`);
        if (specificDate < today) {
          daysMap[key].forEach((quest) => {
            allQuests.push({ ...quest, dueDate: specificDate.toISOString() });
          });
        }
      }
    });

    const weekdays = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];

    // 2. Generate quests for the next 14 days (today and future)
    for (let i = 0; i < 14; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);

      const dateKey = date.toISOString().split("T")[0];
      const dayName = weekdays[date.getDay()];

      const weeklyQuests = daysMap[dayName] || [];
      const specificQuests = daysMap[dateKey] || [];

      weeklyQuests.forEach((q) => {
        allQuests.push({
          ...q,
          // id: `${q.id}`,
          dueDate: date.toISOString(),
        });
      });
      specificQuests.forEach((q) => {
        allQuests.push({ ...q, dueDate: date.toISOString() });
      });
    }

    return allQuests.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
  }, [daysMap]);

  useEffect(() => {
    // Make sure your fetch functions can accept the signal.
    const fetchData = async () => {
      // 2. Pass the signal to your API calls.
      await fetchScheduledQuests();
      await fetchActiveAndCompletedQuests();
    };

    fetchData();
  }, [updatedScheduledQuests]); // Empty array means this runs once on mount and cleans up on unmount.

  useEffect(() => {
    const query = new URLSearchParams(location.search);

    const tagsFromURL = query.getAll("tags"); // handles multiple tags
    const statFromURL = query.get("stats");
    const questFromURL = query.get("quests");

    if (tagsFromURL.length > 0) setSelectedTags(tagsFromURL);
    if (statFromURL) setSelectedStat(statFromURL);
    if (questFromURL) setSearchTerm(questFromURL); // you might be using searchTerm as a keyword filter
  }, []);

  useEffect(() => {
    document.title = "Re:LIFE | Quest Dashboard"; // Set the title for this component
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      if (accountDataRef) {
        // setAccountData(accountDataRef);
        setEquipment(accountDataRef.current?.equipment);
        setAccountStats(accountDataRef.current?.stats);
        setDataLoaded(true);
      }
    }, 300); // Small interval to wait for dataRef update

    return () => clearInterval(interval);
  }, [accountDataRef, dataLoaded, completedQuests]);

  // useEffect(() => {
  //   if (!userId) return;

  //   const todayStr = new Date().toISOString().slice(0, 10);
  //   const storageKey = `daily-reward-${userId}`;
  //   const storedData = localStorage.getItem(storageKey);

  //   let alreadyClaimedToday = false;
  //   if (storedData) {
  //     const parsedData = JSON.parse(storedData);
  //     if (parsedData.lastLoginDate === todayStr) {
  //       alreadyClaimedToday = true;
  //     }
  //   }

  //   // If they haven't claimed today, open the modal automatically
  //   if (!alreadyClaimedToday) {
  //     setIsLoginModalOpen(true);
  //   }
  // }, [userId]); // Run this check once when the component mounts and userId is available

  function calculateLevel(experience) {
    let level = 1;
    let xpForNextLevel = 10;

    while (experience >= xpForNextLevel) {
      level++;
      experience -= xpForNextLevel;
      xpForNextLevel = 10 * Math.pow(1.05, level - 1);
    }
    const progress = (experience / xpForNextLevel) * 100; // Calculate the progress as a percentage

    return { level, remainingXP: experience, xpForNextLevel, progress };
  }

  const toggleQuestList = () => {
    setQuestListOpen(!isQuestListOpen);
  };

  const maxDifficulty = Math.max(...quests.map((q) => q.difficulty), 1);

  const handleQuestUpdate = async () => {
    setQuestListUpdated((prev) => !prev); // Toggle flag to trigger fetching
  };

  const toggleTag = (tag) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  };

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpenTags(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownRef, setOpenTags]);

  useEffect(() => {
    if (visibleCount > 9 && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [visibleCount]);

  const updateScheduledQuests = () => {
    setUpdatedScheduledQuests((prev) => !prev);
  };

  function getDifficultyGrade(score) {
    if (score <= 1) return "F";
    if (score <= 2) return "F+";
    if (score <= 3) return "D";
    if (score <= 4) return "D+";
    if (score <= 5) return "C";
    if (score <= 6) return "C+";
    if (score <= 7) return "B";
    if (score <= 8) return "B+";
    if (score <= 9) return "A";
    if (score <= 10) return "A+";
  }

  const openDaySelector = (questId) => {
    setDaySelectorOpen((prev) => [...prev, questId]);
  };

  const handleDayChange = (day) => {
    setQuestListOpen(!isQuestListOpen);
    setCurrentDay(day);
    console.log("Received from child:", day);
  };

  // const fillPercent = Math.min((totalEnergy / MAX_CAPACITY) * 100, 100);
  // Look up the quests for the specific date
  const questsForDate = daysMap[dateKey] || [];

  // Look up the recurring quests for the day of the week
  const questsForDayName = daysMap[dayNameKey] || [];

  // Combine both arrays into one single list
  const questsToday = [...questsForDate, ...questsForDayName];

  const TabButton = ({ view, label }) => {
    const updateView = () => {
      localStorage.setItem("questView", view);
      setActiveView(view);
    };
    const isActive = activeView === view;

    return (
      <button
        onClick={updateView}
        className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors duration-300
              ${
                isActive
                  ? "bg-blue-600 text-white"
                  : "bg-gray-800 text-gray-400 hover:bg-gray-700"
              }`}
      >
        {label}
      </button>
    );
  };

  return (
    <div className="w-full grid md:grid-cols-4 grid-cols-1 lg:grid-cols-6 text-white">
      <div className="col-span-4 lg:col-start-2 md:col-start-2 col-start-1 col-span-1">
        {/* <BossSelectionModal updatedBoss={updatedBoss} /> */}
        {/* <DashboardGate /> */}
        <div className="relative z-[9999] w-full mb-0 md:my-3 flex justify-center items-center gap-x-4">
          <div className="md:fixed md:top-6">
            <TabButton view="daily" label="Daily Schedule" />
            <TabButton view="todo" label="To-Do List" />
          </div>
        </div>
        {/* Existing Scheduled Quests */}
        <ScheduledQuests
          onScheduledDays={setScheduledDays}
          updated={updatedScheduledQuests}
          activeView={activeView}
          updateDashboard={updateScheduledQuests}
          onUpdateBoss={() => setUpdatedBoss((prev) => !prev)}
          onOpenQuestList={handleDayChange}
          onOpenQuestCreation={setOpenQuestCreation}
        />
        <QuestCreationForm
          // onClose={() => setQuestCreation(false)}
          onUpdate={updateScheduledQuests}
        />
      </div>

      <div className="relative col-span-1 row-start-1 md:col-start-6 max-h-screen h-full p-3">
        {/* <button
          onClick={() => setGateModalOpen(true)}
          className="px-4 py-2 mb-2 w-full bg-primary text-white font-bold rounded-md shadow-lg shadow-primary/30 hover:bg-primary/80 transition-all"
        >
          <FontAwesomeIcon icon={faDungeon} /> Enter the Tower
        </button>

        <GateOptionsModal
          isOpen={isGateModalOpen}
          onClose={() => setGateModalOpen(false)}
        /> */}
        <div className="hidden text-yellow-400 md:flex items-center justify-center bg-gray-900 border border-gray-700 px-4 py-2 rounded-md mb-2">
          <FontAwesomeIcon className="mr-1" icon={faCoins} />
          {accountDataRef?.current?.currency}
        </div>
        <div className="hidden md:flex w-full justify-between mb-2">
          {accountStats !== "" && (
            <>
              {Object.entries(accountStats || {}).map(([key, value]) => {
                const statConfig = {
                  strength: {
                    color: "text-red-500",
                    shadowColor: "rgba(239, 68, 68, 0.3)",
                    icon: faDumbbell,
                  },
                  bravery: {
                    color: "text-blue-500",
                    shadowColor: "rgba(59, 130, 246, 0.3)",
                    icon: faRunning,
                  },
                  intelligence: {
                    color: "text-yellow-500",
                    shadowColor: "rgba(245, 158, 11, 0.3)",
                    icon: faBrain,
                  },
                  endurance: {
                    color: "text-green-500",
                    shadowColor: "rgba(34, 197, 94, 0.3)",
                    icon: faHeart,
                  },
                };

                const config = statConfig[key] || {
                  color: "text-gray-400",
                  shadowColor: "rgba(156, 163, 175, 0.2)",
                  icon: faQuestionCircle,
                };

                return (
                  // 3. Each stat is now a "Card" with its own background, border, and effects
                  <div>
                    <div className="flex items-center">
                      {/* 5. Icon is now in a styled container for more visual weight */}
                      <FontAwesomeIcon
                        icon={config.icon}
                        className={`h-4 w-4 transition-colors duration-300 ${config.color} group-hover:scale-110`}
                      />
                      {/* 6. Improved typography for clarity and style */}
                      {/* <span className="text-slate-400 font-medium text-sm uppercase tracking-wider">
                    {key}
                  </span> */}
                      <span
                        className={`text-md ml-1 font-bold font-solo ${config.color}`}
                      >
                        {value}
                      </span>
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </div>
        <div className="hidden md:flex flex-col items-center justify-center bg-gray-900 border border-gray-700 p-3 rounded-md mb-2">
          <div className="relative">
            {/* Background Image */}
            {/* <img 
                    src={"/sprites/UI/exp number.png"} 
                    alt="Experience Background" 
                    className="pixel-art absolute inset-0 w-full h-full z-0"
                /> */}

            {/* Level Text */}
            <h2 className="text-xl font-semibold relative z-60 font-solo drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] tracking-wider text-center">
              Level {calculateLevel(accountDataRef?.current?.experience)?.level}
            </h2>
          </div>

          <div className="relative w-full max-w-md mx-auto">
            {/* XP Bar Header */}
            {/* <div className="flex justify-between mt-1 px-2">
              <span className="text-sm">XP Progress</span>
              <span className="text-sm">
                {Math.floor(
                  calculateLevel(accountDataRef?.current?.experience)?.progress
                )}
                %
              </span>
            </div> */}

            {/* XP Bar Container */}
            <div className="relative w-full px-2">
              <div className="relative w-full h-8 rounded-md overflow-hidden">
                {/* Progress Bar */}
                <div className="absolute top-0 left-0 w-full rounded-md h-full flex items-center">
                  <div className="relative w-full bg-gray-300 h-4 rounded-md border border-2 overflow-hidden">
                    <div
                      className="bg-gradient-to-r rounded-md from-blue-300 to-blue-500 h-full transition-all duration-300"
                      style={{
                        width: `${
                          calculateLevel(accountDataRef?.current?.experience)
                            ?.progress
                        }%`,
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>

            {/* XP Details */}
            <p className="text-sm text-center text-text px-2">
              XP Left:{" "}
              {Math.floor(
                calculateLevel(accountDataRef?.current?.experience)
                  ?.xpForNextLevel -
                  calculateLevel(accountDataRef?.current?.experience)
                    ?.remainingXP,
              )}
            </p>
          </div>
        </div>
        <div className="row-span-1">
          <SoloMissions
            userLevel={
              calculateLevel(accountDataRef?.current?.experience).level
            }
            isOpen={isMissionsOpen}
            updated={updatedScheduledQuests}
            onClose={() => setIsMissionsOpen(false)}
            allQuests={quests}
            // Pass all quests for today, not just incomplete ones
            questsToday={questsToday || []}
            completedQuestIds={completedQuests}
          />
          {/* {accountDataRef.stats && <DiamondRadarChart stats={accountDataRef.stats} />} */}
        </div>
        <div className="h-1/4 hidden md:block">
          <CharacterDisplay equipment={equipment} />
        </div>
        {/* <ResonanceCrystal
          energyData={accountStats !== "" ? accountStats : energy}
          maxCapacity={MAX_CAPACITY}
          crystalLevel={newLevel}
          fillPercent={fillPercent}
        /> */}
      </div>

      {/* Quest List Modal */}
      {isQuestListOpen && currentDay !== "" && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex justify-center items-center z-50">
          <div
            className={`relative bg-background rounded-md shadow-lg p-6 lg:w-[60%] lg:max-w-screen w-11/12 ${
              window.innerWidth >= 1024
                ? "h-[80%] overflow-y-auto"
                : "max-h-[60vh] overflow-y-auto"
            }`}
          >
            {/* Close Button */}
            <button
              className="absolute top-4 right-4 z-50 text-red-600 hover:text-red-500"
              onClick={toggleQuestList}
            >
              <FontAwesomeIcon icon={faX} />
            </button>

            <h1 className="quest-list-header text-2xl font-bold mb-2 font-solo">
              <FontAwesomeIcon icon={faThumbTack} /> Recommended Quests
            </h1>
            <div className="mb-4">
              <input
                type="text"
                placeholder="Search quests..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 rounded-md bg-gray-700 text-white focus:outline-none"
              />
            </div>

            <div className="flex flex-col mb-4 gap-1">
              <label className="text-white">Tags:</label>
              <div className="relative inline-block text-left">
                <button
                  onClick={() => setOpenTags(!openTags)}
                  className="bg-gray-700 w-full text-left text-white rounded px-4 py-2"
                >
                  {selectedTags.length > 0
                    ? selectedTags.join(", ").slice(0, 10) +
                      (selectedTags.join(", ").length > 10 ? "…" : "")
                    : "Filter by Tags"}
                </button>

                {openTags && (
                  <div
                    ref={dropdownRef}
                    className="absolute z-10 my-2 w-[250px] bg-gray-600 rounded-md shadow-lg p-4 max-h-60 overflow-y-auto"
                  >
                    {/* Clear All Filters checkbox */}
                    <label className="flex items-center space-x-3 mb-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedTags.length === 0}
                        onChange={() => setSelectedTags([])}
                        className="w-5 h-5 text-red-600 bg-white border-2 border-gray-300 rounded-sm focus:ring-red-500 focus:ring-2"
                      />
                      <span className="text-white text-sm font-semibold">
                        Clear All Filters
                      </span>
                    </label>

                    {/* 4-column tag grid */}
                    <div className="grid grid-cols-1 gap-x-4 gap-y-2">
                      {tags.map((tag) => (
                        <label
                          key={tag}
                          className="flex items-center space-x-2 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={selectedTags.includes(tag)}
                            onChange={() => toggleTag(tag)}
                            className="w-5 h-5 text-blue-600 bg-white border-2 border-gray-300 rounded-sm focus:ring-blue-500 focus:ring-2"
                          />
                          <span className="text-white text-sm">{tag}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <label className="text-white">Difficulty:</label>
              <select
                value={selectedDifficulty ?? ""}
                onChange={(e) => {
                  const value = e.target.value
                    ? parseInt(e.target.value)
                    : null;
                  setSelectedDifficulty(value);
                }}
                className="bg-gray-700 text-white rounded px-4 py-2"
              >
                <option value="">All</option>
                {[...Array(maxDifficulty)].map((_, i) => (
                  <option key={i + 1} value={i + 1}>
                    Rank {getDifficultyGrade(i + 1)}
                  </option>
                ))}
              </select>

              <label className="text-white">Stat:</label>
              <select
                value={selectedStat ?? ""}
                onChange={(e) => {
                  const value = e.target.value || null;
                  setSelectedStat(value);
                }}
                className="bg-gray-700 text-white rounded px-4 py-2"
              >
                <option value="">All</option>
                {["strength", "bravery", "intelligence", "endurance"].map(
                  (stat, i) => (
                    <option key={stat} value={stat}>
                      {stat.charAt(0).toUpperCase() + stat.slice(1)}
                    </option>
                  ),
                )}
              </select>
            </div>

            {/* Quest List Content */}
            <div>
              <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4">
                {quests.map((quest) => {
                  const isActive = selectedQuests.includes(quest.id);
                  const isCompleted = completedQuests.includes(quest.id);
                  // const isPath = questsOnPath.includes(quest.name);
                  return (
                    <li
                      key={`mobile-quest-${Date.now()}-${Math.random()}`}
                      // onClick={(e) => {
                      //     e.stopPropagation();
                      //     handleQuestSelection(quest.id);
                      // }}
                      className={`
                                            relative text-white bg-gray-800 p-4 shadow-md rounded-md cursor-pointer
                                            transition-transform transition-all overflow-hidden
                                            active:shadow-md
                                            ${
                                              isCompleted ||
                                              (activeQuests.length >=
                                                4 + extraSlots &&
                                                !isActive)
                                                ? "cursor-not-allowed"
                                                : "transition duration-200 focus:outline-none active:outline-none active:scale-100 will-change-transform select-none hover:shadow-xl"
                                            }

                                            
                                        `}
                      onClick={() => openDaySelector(quest.id)}
                      disabled={
                        isCompleted ||
                        (activeQuests.length >= 4 + extraSlots && !isActive)
                      }
                    >
                      <div className={`rounded-md`}>
                        {/* Main Content */}
                        {/* {isPath && ( 
                                                <div className='absolute py-1 px-2 font-bold text-sm rounded-l-xl rounded-t-none  bg-yellow-400 right-2 top-2 text-gray-700 flex items-center justify-center'>
                                                    <FontAwesomeIcon icon={faArrowUpRightDots} className='mr-1'/> Required
                                                </div>
                                                
                                            )} */}
                        <div>
                          <h3 className="font-solo text-lg font-bold text-white mb-2">
                            {quest.name}{" "}
                            <FontAwesomeIcon
                              icon={
                                quest.type === "daily"
                                  ? faCalendarDay
                                  : faMapMarkedAlt
                              }
                            />
                          </h3>
                          {/* <p className={`mb-2 text-${quest.type === "daily" ? 'indigo-300' : 'green-300'}`}>{"<"+quest.type+">"}</p> */}
                          <p className="text-white text-sm">
                            {quest.description}
                          </p>
                        </div>

                        <div className="flex gap-2 flex-wrap mt-2">
                          {JSON.parse(quest.tags).map((tag) => (
                            <div className="px-4 py-1 bg-primary rounded-md text-xs">
                              {tag}
                            </div>
                          ))}
                        </div>

                        {quest.type === "journey" && (
                          <div className="mt-4 inline-flex items-center gap-2 text-green-300 font-medium text-md">
                            <FontAwesomeIcon icon={faCalendar} />
                            <span>Period: {quest.period} days</span>
                          </div>
                        )}

                        <div className="absolute top-1 right-0 z-10">
                          <span
                            className={`fa-layers fa-fw rounded-full font-bold uppercase tracking-wider text-3xl`}
                          >
                            <span
                              className="fa-layers-text font-extrabold text-primary font-solo italic"
                              data-fa-transform="shrink-8"
                            >
                              {getDifficultyGrade(quest.difficulty)}
                            </span>
                          </span>
                        </div>

                        <div>
                          {/* <h4 className="text-md font-semibold text-white border-b border-indigo-400">Rewards</h4> */}
                          <div className="flex items-center gap-4 mt-4 border-t py-2 border-blue-400">
                            {quest.experience_reward && (
                              <div className="flex items-center">
                                <FontAwesomeIcon
                                  icon={faAward}
                                  className="text-blue-400"
                                />
                                <span className="font-semibold ml-1">
                                  +{quest.experience_reward + xpBoost}XP
                                </span>
                              </div>
                            )}
                            {quest.stat_reward && (
                              <>
                                {quest.stat_reward.strength && (
                                  <div className="flex items-center">
                                    <FontAwesomeIcon
                                      icon={faDumbbell}
                                      className="text-red-500"
                                    />
                                    <span className="font-semibold ml-1">
                                      {" "}
                                      +{quest.stat_reward.strength}
                                    </span>
                                  </div>
                                )}
                                {quest.stat_reward.endurance && (
                                  <div className="flex items-center">
                                    <FontAwesomeIcon
                                      icon={faHeart}
                                      className="text-green-500"
                                    />
                                    <span className="font-semibold ml-1">
                                      {" "}
                                      +{quest.stat_reward.endurance}
                                    </span>
                                  </div>
                                )}
                                {quest.stat_reward.bravery && (
                                  <div className="flex items-center">
                                    <FontAwesomeIcon
                                      icon={faRunning}
                                      className="text-blue-500"
                                    />
                                    <span className="font-semibold ml-1">
                                      {" "}
                                      +{quest.stat_reward.bravery}
                                    </span>
                                  </div>
                                )}
                                {quest.stat_reward.intelligence && (
                                  <div className="flex items-center">
                                    <FontAwesomeIcon
                                      icon={faBrain}
                                      className="text-yellow-500"
                                    />
                                    <span className="font-semibold ml-1">
                                      +{quest.stat_reward.intelligence}
                                    </span>
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        </div>

                        <div>
                          <DaySelector
                            questId={quest.id}
                            scheduledDays={scheduledDays}
                            updateScheduledQuests={updateScheduledQuests}
                            day={currentDay}
                            loadingQuests={loadingQuests}
                            setLoadingQuests={setLoadingQuests}
                          />
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        </div>
      )}

      {popups.map(({ id, name, quantity, message, success }) => (
        <ItemPopup
          key={id}
          name={name}
          quantity={quantity}
          message={message}
          success={success}
          onClose={() =>
            setPopups((prev) => prev.filter((popup) => popup.id !== id))
          }
        />
      ))}

      {/* <button onClick={() => setIsLoginModalOpen(true)}>
        Open Daily Reward
      </button> */}

      <DailyLoginReward
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        userId={userId}
      />
    </div>
  );
};

export default QuestDashboard;
