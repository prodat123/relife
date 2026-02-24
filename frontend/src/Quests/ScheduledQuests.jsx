import React, {
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import axios from "axios";
import config from "../config"; // Assuming you have a config file for your backend URL
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faStar,
  faStarHalfAlt,
  faStar as faStarEmpty,
  faCalendar,
  faX,
  faAngleDown,
  faAngleUp,
  faCheck,
  faLock,
  faCheckCircle,
  faCheckDouble,
  faScroll,
  faFire,
  faSmile,
  faSmileWink,
  faFireBurner,
  faAward,
  faDumbbell,
  faHeart,
  faRunning,
  faBraille,
  faBrain,
  faDiamond,
  faXmark,
  faSmileBeam,
  faPlus,
  faEllipsisV,
  faTrash,
  faPen,
  faSpinner,
  faReply,
  faRedo,
  faPlay,
  faClock,
  faArrowLeft,
  faChevronLeft,
  faChevronRight,
  faCalendarAlt,
  faTrophy,
  faDungeon,
  faBookJournalWhills,
  faMapSigns,
  faTasks,
  faBook,
  faBullseye,
  faChevronDown,
} from "@fortawesome/free-solid-svg-icons";
import DaySelector from "./DaySelector";
import Confetti from "react-confetti";
import LevelUpScreen from "./LevelUpScreen";
import { UserContext } from "../Account/UserContext";
import { BeatLoader } from "react-spinners";
import QuestPlayButton from "./QuestPlayButton";
import { createPortal } from "react-dom";
import SoloMissions from "./SoloMissions";
import QuestCreationForm from "./QuestCreationForm";
import { QuestEditModal } from "./QuestEditModal";
import { AnimatePresence, motion } from "framer-motion";

const weekdays = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];
const currentDay = weekdays[new Date().getDay()];

const now = new Date();
const year = now.getFullYear();
const month = String(now.getMonth() + 1).padStart(2, "0");
const day = String(now.getDate()).padStart(2, "0");
const date = `${year}-${month}-${day}`;

function ScheduledQuests({
  onScheduledDays,
  updated,
  activeView,
  updateDashboard,
  onUpdateBoss,
  onOpenQuestList,
  onOpenQuestCreation,
}) {
  const userId = JSON.parse(localStorage.getItem("user"))?.id;
  const { accountDataRef } = useContext(UserContext);
  const [accountData, setAccountData] = useState({});
  const [scheduledQuests, setScheduledQuests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedQuestId, setExpandedQuestId] = useState(null); // State for expanded quest
  const [removedQuest, setRemovedQuest] = useState(0);
  const [showSchedule, setShowSchedule] = useState(true);
  const [statBoosts, setStatBoosts] = useState({});
  const [showConfetti, setShowConfetti] = useState(false);
  const [claimableQuests, setClaimableQuests] = useState([]);
  const [questCompleted, setQuestCompleted] = useState(null);
  const [streak, setStreak] = useState(0);
  const [experienceReward, setExperienceReward] = useState(0);
  const [difficulty, setDifficulty] = useState(0);
  const [completedQuests, setCompletedQuests] = useState([]);
  const [updatedScheduledQuests, setUpdatedScheduledQuests] = useState(false);
  const [showCompleted, setShowCompleted] = useState(false);
  const [menuOpenId, setMenuOpenId] = useState("");
  const [openEdit, setOpenEdit] = useState("");
  const [loadingQuests, setLoadingQuests] = useState([]);
  const [currencyReward, setCurrencyReward] = useState(0);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [completedTodoQuests, setCompletedTodoQuests] = useState([]);
  const [focusedDate, setFocusedDate] = useState(null);
  const scrollContainerRef = useRef(null);

  const menuRef = useRef(null);

  const containerRef = useRef(null);
  const dayRefs = useRef({});

  const [daysMap, setDaysMap] = useState({
    Monday: [],
    Tuesday: [],
    Wednesday: [],
    Thursday: [],
    Friday: [],
    Saturday: [],
    Sunday: [],
  });

  const dayKeys = Object.keys(daysMap);

  const [scheduledDays, setScheduledDays] = useState({}); // Days the current quest is scheduled for
  const [isMissionsOpen, setIsMissionsOpen] = useState(false);

  function calculateLevel(experience) {
    let level = 1;
    let xpForNextLevel = 10;

    while (experience >= xpForNextLevel) {
      level++;
      experience -= xpForNextLevel;
      xpForNextLevel = 10 * Math.pow(1.05, level - 1);
    }

    return { level, remainingXP: experience, xpForNextLevel };
  }

  useEffect(() => {
    const interval = setInterval(() => {
      if (
        accountDataRef.current &&
        accountDataRef.current.currency !== undefined
      ) {
        setAccountData(accountDataRef.current);
      }
    }, 100); // You can reduce or increase this as needed

    return () => clearInterval(interval);
  }, []);

  useLayoutEffect(() => {
    if (containerRef.current && dayRefs.current[currentDay]) {
      const container = containerRef.current;
      const currentDayElement = dayRefs.current[currentDay];

      const containerCenter = container.offsetWidth / 2;
      const elementOffset =
        currentDayElement.offsetLeft + currentDayElement.offsetWidth * 0.5;
      const scrollPosition = elementOffset - containerCenter;

      container.scrollTo({ left: scrollPosition, behavior: "smooth" });
    }
  }, [daysMap, currentDay]);

  const capitalize = (str) =>
    str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();

  // const completedQuestsList = useMemo(() => {
  //   // First, create a single flat array of all quest objects from the time groups
  //   const allItems = Object.values(questsByTime).flat();

  //   // Then, filter that list to get only the completed items
  //   return allItems.filter((item) => completedQuests.includes(item.id));
  // }, [questsByTime, completedQuests]);

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

  const processedDays = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const weekdays = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];

    const dateRange = [];

    // 1. Generate a consecutive 14-day range
    for (let i = -6; i <= 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dateRange.push(date);
    }

    // 2. THIS ENTIRE BLOCK WAS REMOVED.
    // The .map() function below already handles finding quests for the dates in your range.

    // 3. Process each day in the consecutive dateRange
    return dateRange.map((date) => {
      const dateKey = date.toISOString().split("T")[0];
      const dayName = weekdays[date.getDay()];

      // This logic correctly pulls quests for the date being processed
      const weeklyQuests = daysMap[dayName] || [];
      const specificQuests = daysMap[dateKey] || [];
      const allQuestsForDay = [...weeklyQuests, ...specificQuests];

      const isToday = date.getTime() === today.getTime();

      const displayTitle = date.toLocaleDateString("en-US", {
        weekday: "long",
        month: "short",
        day: "numeric",
      });

      return {
        key: dateKey,
        quests: allQuestsForDay,
        date: date,
        isToday: isToday,
        displayTitle: displayTitle,
      };
    });
    // The .sort() is no longer needed since the dateRange is already sorted
    // .sort((a, b) => a.date - b.date);
  }, [daysMap]);

  const todayKey = processedDays.find((day) => day.isToday)?.key;

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        // Find the first entry that is currently intersecting our center "zone"
        const intersectingEntry = entries.find((entry) => entry.isIntersecting);
        if (intersectingEntry) {
          // The 'dayKey' is read from the element's data attribute
          setActiveDayKey(intersectingEntry.target.dataset.dayKey);
        }
      },
      {
        root: container,
        // Narrows the observation area to a 4% vertical strip in the center
        rootMargin: "0px -48% 0px -48%",
        threshold: 0.02, // Trigger as soon as any part enters the zone
      },
    );
    const dayElements = Object.values(dayRefs.current);
    dayElements.forEach((el) => el && observer.observe(el));

    return () => {
      dayElements.forEach((el) => el && observer.unobserve(el));
    };
  }, [processedDays, activeView]);

  const [activeDayKey, setActiveDayKey] = useState(todayKey);

  const hasScrolledRef = useRef(false); // 2. Create the ref, initialized to false

  // Add this useEffect to your component to set the initial scroll position
  useLayoutEffect(() => {
    const todayKey = processedDays.find((day) => day.isToday)?.key;
    if (todayKey && !hasScrolledRef.current) {
      const todayElement = dayRefs.current[todayKey];
      if (todayElement) {
        todayElement.scrollIntoView({ behavior: "auto", inline: "center" });
        // hasScrolledRef.current = true;
      }
    }
  }, [processedDays, activeView]);

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

  const getDayOfWeekFromDate = (dateString) => {
    const days = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];
    // Note: The Date constructor can be tricky with timezones if just a date string is provided.
    // Appending 'T00:00:00' helps standardize it to the local timezone.
    const date = new Date(`${dateString}T00:00:00`);
    return days[date.getDay()];
  };

  // close on outside click
  useEffect(() => {
    const onClickOutside = (e) => {
      if (
        !e.target.closest(".menu-toggle") &&
        !e.target.closest(".menu-dropdown") &&
        !e.target.closest("button")
      ) {
        setMenuOpenId(null);
      }
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  useEffect(() => {
    fetchScheduledQuests();
    fetchActiveAndCompletedQuests();
    fetchActiveAndCompletedQuestsForTodo();
  }, [updated, claimableQuests]);

  useEffect(() => {
    if (daysMap[currentDay]) {
      const questsLeft = daysMap[currentDay].filter(
        (quest) => !completedQuests.includes(quest.id),
      ).length;
      localStorage.setItem("questsLeft", questsLeft);
    } else {
      // Optional: handle the case where currentDay doesn't exist in daysMap
      localStorage.setItem("questsLeft", 0);
    }
  }, [daysMap, completedQuests, currentDay]);

  //todo-completed

  const fetchActiveAndCompletedQuestsForTodo = async () => {
    try {
      const [completedResponse] = await Promise.all([
        axios.get(`${config.backendUrl}/quests/todo-completed`, {
          params: { userId, date },
        }),
      ]);

      // Process completed quests
      const completedQuestIds = completedResponse.data.map(
        (quest) => quest.quest_id,
      );
      setCompletedTodoQuests(completedQuestIds);
      setOpenEdit(null);
    } catch (err) {
      console.error("Error fetching active or completed quests:", err);
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
      setOpenEdit(null);
    } catch (err) {
      console.error("Error fetching active or completed quests:", err);
    }
  };

  const handleRemoveQuest = async (questId, day) => {
    await axios
      .post(
        `${config.backendUrl}/scheduled-quests/remove`,
        {
          questId,
          userId,
          dayToRemove: day,
        },
        {
          withCredentials: true,
        },
      )
      .then(() => {
        setRemovedQuest(questId + day);
        updateDashboard();
      })
      .catch((error) => {
        console.error("Error removing quest:", error);
        alert(
          `Failed to remove quest: ${
            error.response?.data?.error || "Unknown error"
          }`,
        );
      });
  };

  const handleCloseModal = () => {
    setQuestCompleted(null); // Reset questCompleted to null when the modal is closed
    onUpdateBoss();
  };

  const fireConfetti = () => {
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 8000);
  };

  const showStatUpdates = (questId) => {
    setQuestCompleted(questId); // Set the quest ID to trigger the component render
  };

  const handleFinishQuest = async (questId) => {
    setLoadingQuests((prev) => [...prev, questId]); // Start loading

    try {
      const response = await axios.post(
        `${config.backendUrl}/quests/finish`,
        {
          questId,
          userId,
          date: date,
          currentDay: currentDay,
        },
        {
          withCredentials: true,
        },
      );

      const {
        statsIncreased,
        streak,
        experienceReward,
        difficulty,
        currencyReward,
      } = response.data;
      setStatBoosts(statsIncreased);
      setStreak(streak);
      setExperienceReward(experienceReward);
      setCurrencyReward(currencyReward);
      setDifficulty(difficulty);
      showStatUpdates(questId);
      fireConfetti();
      setClaimableQuests((prevQuests) =>
        prevQuests.filter((id) => id !== questId),
      );
      updateDashboard();
    } catch (error) {
      console.error("Error finishing quest:", error);
      alert(
        `Failed to complete quest: ${
          error.response?.data?.error || "Unknown error"
        }`,
      );
    } finally {
      setLoadingQuests((prev) => prev.filter((id) => id !== questId)); // Stop loading
    }
  };

  // const handleUndoQuest = async (questId) => {
  //   setLoadingQuests((prev) => [...prev, questId]); // Start loading

  //   try {
  //     const response = await axios.post(
  //       `${config.backendUrl}/quests/undo`, // change endpoint to match backend
  //       {
  //         questId,
  //         userId,
  //         date: date,
  //         currentDay: currentDay,
  //       },
  //       {
  //         withCredentials: true,
  //       }
  //     );

  //     // You may want to reverse stats or update UI here
  //     const { statsDecreased, streak, experienceRemoved, difficulty } =
  //       response.data;
  //     setStatBoosts(statsDecreased);
  //     setStreak(streak);
  //     setExperienceReward(experienceRemoved);
  //     setDifficulty(difficulty);

  //     // Remove from finished list or put back into claimable
  //     setClaimableQuests((prevQuests) => [...prevQuests, questId]);
  //   } catch (error) {
  //     console.error("Error undoing quest:", error);
  //     alert(
  //       `Failed to undo quest: ${
  //         error.response?.data?.error || "Unknown error"
  //       }`
  //     );
  //   } finally {
  //     setLoadingQuests((prev) => prev.filter((id) => id !== questId)); // Stop loading
  //   }
  // };

  if (loading) {
    return (
      <BeatLoader
        color="#36d7b7" // Set your desired color
        loading={loading}
        size={10} // Adjusts the size of the bars
        margin={2} // Adjusts the spacing between bars;
      />
    );
  }

  if (error) {
    return <div>{error}</div>;
  }

  const statIcons = {
    strength: { icon: faDumbbell, color: "red-500" },
    endurance: { icon: faHeart, color: "green-500" },
    bravery: { icon: faRunning, color: "blue-500" },
    intelligence: { icon: faBrain, color: "yellow-400" },
  };

  const formatTime = (timeString) => {
    if (!timeString) return "";
    const [hour, minute] = timeString.split(":");
    const hourInt = parseInt(hour, 10);
    const ampm = hourInt >= 12 ? "PM" : "AM";
    const formattedHour = hourInt % 12 || 12; // Convert 0 to 12 for 12 AM
    return `${formattedHour}:${minute} ${ampm}`;
  };

  const handleToastSequenceComplete = () => {
    setStreak(0);
    setExperienceReward(0);
    setCurrencyReward(0);
    setStatBoosts(null);
    // ... reset other values as needed
  };

  return (
    <div
      // ref={containerRef}
      ref={scrollContainerRef}
      className={`relative flex flex-col overflow-y-auto lg:p-0 p-3 h-screen scroll-smooth ${
        showSchedule ? "lg:max-h-[600px] opacity-100" : "max-h-0 opacity-0"
      }`}
    >
      <div className="h-[75vh] w-full">
        {activeView === "daily" ? (
          <>
            {processedDays.map((dayData) => {
              const { key, quests, isToday, displayTitle } = dayData;
              const isActive = activeDayKey === key;

              const questsByTime = quests
                .sort((a, b) =>
                  (a.time || "00:00").localeCompare(b.time || "00:00"),
                )
                .reduce((acc, quest) => {
                  const time = quest.time || "Unscheduled";
                  acc[time] = acc[time] || [];
                  acc[time].push(quest);
                  return acc;
                }, {});

              const completedQuestsForDay = quests.filter((q) =>
                completedQuests.includes(q.id),
              );

              return (
                <div
                  key={key}
                  ref={(el) => (dayRefs.current[key] = el)}
                  className={`snap-center h-full w-full transition-all duration-300 ease-in-out 
              flex-shrink-0 overflow-y-auto hide-scrollbar rounded-md p-4 md:p-6 relative
              ${
                isToday
                  ? "bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f3460]"
                  : // REMOVED opacity-60 from here to let the active state control it
                    "bg-gradient-to-br from-[#1e1e2f] via-[#2b2b3c] to-[#1b1b2f] border border-gray-700"
              }
              ${
                // This is the new logic for the focus effect
                isActive ? "opacity-100 scale-100" : "opacity-40 scale-90" // Faded-out and slightly smaller
              }`}
                  data-day-key={key} // <-- Attribute for the observer
                >
                  {/* HEADER */}
                  <div className="flex items-center justify-between mb-4 sticky top-0 bg-inherit/80 backdrop-blur-sm pt-2 z-10">
                    <div className="flex gap-x-3 items-center">
                      <button
                        onClick={() => setIsCalendarOpen(true)}
                        className="text-gray-400 hover:text-white transition-colors"
                        title="Open Calendar"
                      >
                        <FontAwesomeIcon icon={faCalendarAlt} size="lg" />
                      </button>
                      <h3 className="text-text font-solo text-xl font-bold">
                        {displayTitle}
                      </h3>
                    </div>
                    {isToday && quests.length > 0 && (
                      <ProgressRing
                        progress={
                          (completedQuestsForDay.length / quests.length) * 100
                        }
                        done={completedQuestsForDay.length}
                        total={quests.length}
                      />
                    )}
                  </div>

                  {/* QUEST LIST */}
                  {quests.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-[50vh] text-center">
                      <p className="text-gray-400">
                        No quests scheduled for this day.
                      </p>
                    </div>
                  ) : (
                    <>
                      <ul className="space-y-6">
                        {Object.entries(questsByTime).map(
                          ([time, questsAtTime]) => {
                            const completedGroup = questsAtTime.filter(
                              (q) => isToday && completedQuests.includes(q.id),
                            );
                            const incompleteGroup = questsAtTime.filter(
                              (q) =>
                                !isToday || !completedQuests.includes(q.id),
                            );

                            // If no active quests are in this time block, don't render it
                            if (incompleteGroup.length === 0) {
                              return null;
                            }
                            return (
                              <li key={time}>
                                <div className="text-lg font-bold text-gray-400 mb-2">
                                  {time === "Unscheduled"
                                    ? time
                                    : formatTime(time)}
                                </div>
                                <div className="space-y-2">
                                  {incompleteGroup.map((quest) => (
                                    <QuestCard
                                      key={quest.id}
                                      completedQuests={completedGroup}
                                      loadingQuests={loadingQuests}
                                      quest={quest}
                                      isToday={isToday}
                                      isCompleted={false}
                                      handleFinishQuest={() =>
                                        handleFinishQuest(quest.id)
                                      }
                                      updateQuests={fetchScheduledQuests}
                                    />
                                  ))}
                                </div>
                              </li>
                            );
                          },
                        )}
                      </ul>

                      {/* <div className="my-8 text-center">
                  <h3 className="text-xl font-bold text-gray-500">Completed</h3>
                  <div className="w-24 h-px bg-gray-600 mx-auto mt-2"></div>
                </div> */}

                      {completedQuests.length > 0 && isToday && (
                        <div className="mt-8 pt-4 border-t border-gray-700">
                          {/* Clickable Header */}
                          <button
                            onClick={() => setShowCompleted(!showCompleted)}
                            className="w-full flex justify-between items-center p-2 rounded-md hover:bg-gray-800/50 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <h3 className="text-lg font-bold text-gray-400">
                                Completed
                              </h3>
                              <span className="text-sm font-semibold text-gray-500 bg-gray-700 px-2 py-0.5 rounded-full">
                                {completedQuests.length}
                              </span>
                            </div>
                            <motion.div
                              animate={{ rotate: showCompleted ? 180 : 0 }}
                            >
                              <FontAwesomeIcon
                                icon={faChevronDown}
                                className="text-gray-500"
                              />
                            </motion.div>
                          </button>

                          {/* Animated List Container */}
                          <AnimatePresence>
                            {showCompleted && (
                              <motion.ul
                                key="completed-list"
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{
                                  duration: 0.3,
                                  ease: "easeInOut",
                                }}
                                className="space-y-2 mt-2 overflow-hidden" // overflow-hidden is crucial for the animation
                              >
                                {/* Your existing logic for mapping completed quests fits right here */}
                                {Object.entries(questsByTime)
                                  .flatMap(([_, questsAtTime]) =>
                                    questsAtTime.filter((q) =>
                                      completedQuests.includes(q.id),
                                    ),
                                  )
                                  .map((quest) => (
                                    <motion.li key={quest.id} layout>
                                      <QuestCard
                                        quest={quest}
                                        isCompleted={true}
                                        // ... your other props
                                      />
                                    </motion.li>
                                  ))}
                              </motion.ul>
                            )}
                          </AnimatePresence>
                        </div>
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </>
        ) : (
          <QuestTodoList
            quests={quests}
            completedQuests={completedTodoQuests}
            loadingQuests={loadingQuests}
            handleFinishQuest={handleFinishQuest}
            updateQuests={updateDashboard}
            handleOpenCalendar={() => setIsCalendarOpen(true)}
          />
        )}
      </div>

      {isCalendarOpen && (
        <CalendarView
          focusedDate={focusedDate}
          setFocusedDate={setFocusedDate}
          daysMap={daysMap}
          allQuests={scheduledQuests} // Pass the raw list here
          currentDay={currentDay} // Pass the current day string
          completedQuests={completedQuests}
          onClose={() => setIsCalendarOpen(false)}
          updateQuests={updateDashboard}
        />
      )}

      {/* {showConfetti && (
        <Confetti
          numberOfPieces={900} // Increase the number of particles
          gravity={0.1} // Adjust the gravity to control how fast the confetti falls
          recycle={false} // Prevent the confetti from restarting once it finishes
          tweenDuration={8000}
          colors={["#ffcc00", "#ff6600", "#ff3300"]}
          className="absolute top-0 left-0 h-full z-[999999]" // Ensures full-screen absolute positioning
        />
      )} */}
      {questCompleted !== null && (
        <LevelUpScreen
          prevAccountData={accountData}
          userId={userId}
          questCompleted={questCompleted}
          onClose={handleCloseModal}
          difficulty={difficulty}
          experienceReward={experienceReward}
          currencyReward={currencyReward}
          statReward={statBoosts}
          streak={streak}
          onSequenceComplete={handleToastSequenceComplete}
          levelUpTriggered={
            calculateLevel(accountData?.experience).level >
            calculateLevel(accountData?.experience - experienceReward).level
          }
          currentLevel={
            calculateLevel(accountData?.experience - experienceReward).level
          }
          newLevel={calculateLevel(accountData?.experience).level}
        />
      )}

      {isMissionsOpen && (
        <SoloMissions
          userLevel={calculateLevel(accountData?.experience).level}
          isOpen={isMissionsOpen}
          onClose={() => setIsMissionsOpen(false)}
          // Pass all quests for today, not just incomplete ones
          questsToday={daysMap[currentDay] || []}
          completedQuestIds={completedQuests}
        />
      )}
    </div>
  );
}
const TickLoader = ({
  loading,
  size = 42, // Default size is now 48px
  color = "#3B82F6", // Default color is a nice green (Tailwind's green-500)
}) => {
  if (!loading) return null;

  return (
    <div className="flex items-center justify-center">
      <svg
        width={size} // Use the size prop for width
        height={size} // Use the size prop for height
        viewBox="0 0 52 52"
        xmlns="http://www.w3.org/2000/svg"
      >
        <motion.circle
          cx="26"
          cy="26"
          r="24"
          fill="transparent"
          stroke={color} // Use the color prop
          strokeWidth="4"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.5, ease: "circOut" }}
        />
        <motion.path
          d="M14 27l5 5 16-16"
          fill="transparent"
          stroke={color} // Use the color prop
          strokeWidth="5"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{
            delay: 0.2,
            duration: 0.3,
            ease: "circOut",
          }}
        />
      </svg>
    </div>
  );
};

const QuestCard = ({
  completedQuests,
  loadingQuests,
  isToday,
  quest,
  day,
  isCompleted,
  handleFinishQuest,
  updateQuests,
}) => {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedQuest, setSelectedQuest] = useState(null);
  // Hooks and handlers would be passed down as props from the parent if needed,
  // or managed with a global state (Context/Redux). For this example, we assume
  // functions like `setMenuOpenId` are available or passed as props.

  const handleOpenEditModal = (questToEdit) => {
    setSelectedQuest(questToEdit);
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    // It's good practice to clear the selected quest after a delay
    // to allow the closing animation to finish smoothly.
    setTimeout(() => {
      setSelectedQuest(null);
    }, 300);
  };

  function getTailwindColor(twColor) {
    const questColorHexMap = {
      "red-500": "#ef4444", // red-500
      "green-500": "#22c55e", // green-500
      "blue-500": "#3b82f6", // blue-500
      "yellow-400": "#facc15", // yellow-400
    };
    return questColorHexMap[twColor] || "#ffffff";
  }

  const statIcons = {
    strength: { icon: faDumbbell, color: "red-500" },
    endurance: { icon: faHeart, color: "green-500" },
    bravery: { icon: faRunning, color: "blue-500" },
    intelligence: { icon: faBrain, color: "yellow-400" },
  };

  const getQuestColor = (stat_reward = {}) => {
    for (const [key, { color }] of Object.entries(statIcons)) {
      if (stat_reward[key]) {
        return color; // first matching stat color
      }
    }
    return ""; // default fallback if no stat reward matches
  };

  // A helper to format time from "HH:mm" to "h:mm AM/PM"

  const scheduleTypeStyles = {
    daily: "bg-green-500/20 text-green-300 border-green-500/30",
    weekly: "bg-blue-500/20 text-blue-300 border-blue-500/30",
    specific: "bg-purple-500/20 text-purple-300 border-purple-500/30",
  };

  return (
    <>
      <div
        className={`flex items-center cursor-pointer gap-4 border-2 ${
          isCompleted
            ? "border-gray-600"
            : `border-${getQuestColor(quest.stat_reward)}`
        } text-text rounded-lg p-4 relative group transition`}
        style={{
          boxShadow: isCompleted
            ? "none"
            : `0 2px 20px ${getTailwindColor(
                getQuestColor(quest.stat_reward),
              )}`,
        }}
        onClick={() => handleOpenEditModal(quest)}
      >
        {/* --- Left Column: All Quest Info --- */}
        <div className="flex-grow flex flex-col">
          {/* Top section: Combined for compactness */}
          <div className="flex justify-between items-center mb-1">
            <div className="flex items-center gap-3">
              {/* Streak */}
              <div className="flex items-center gap-1.5 text-orange-400 font-semibold text-sm">
                <FontAwesomeIcon icon={faFire} /> {quest.streak || 0}
              </div>
              {/* Quest Type */}
              <span
                className={`px-2 py-0.5 text-xs font-bold rounded-full border ${
                  scheduleTypeStyles[quest.type] || ""
                }`}
              >
                {quest.type === "specific"
                  ? "One-time"
                  : quest.type.charAt(0).toUpperCase() + quest.type.slice(1)}
              </span>
            </div>
          </div>

          {/* Quest Name */}
          <h4 className="font-solo font-bold text-lg leading-tight mb-2 text-wrap">
            {quest.name}
          </h4>

          {/* Rewards */}
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-text drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]">
            {quest.experience_reward && (
              <div className="flex items-center">
                <FontAwesomeIcon icon={faAward} className="text-blue-400" />
                <span className="ml-1.5 font-semibold">
                  +{quest.experience_reward}XP
                </span>
              </div>
            )}
            {quest.stat_reward?.strength && (
              <div className="flex items-center">
                <FontAwesomeIcon icon={faDumbbell} className="text-red-500" />
                <span className="ml-1.5 font-semibold">
                  +{quest.stat_reward.strength}
                </span>
              </div>
            )}
            {quest.stat_reward?.endurance && (
              <div className="flex items-center">
                <FontAwesomeIcon icon={faHeart} className="text-green-500" />
                <span className="ml-1.5 font-semibold">
                  +{quest.stat_reward.endurance}
                </span>
              </div>
            )}
            {quest.stat_reward?.bravery && (
              <div className="flex items-center">
                <FontAwesomeIcon icon={faRunning} className="text-blue-500" />
                <span className="ml-1.5 font-semibold">
                  +{quest.stat_reward.bravery}
                </span>
              </div>
            )}
            {quest.stat_reward?.intelligence && (
              <div className="flex items-center">
                <FontAwesomeIcon icon={faBrain} className="text-yellow-400" />
                <span className="ml-1.5 font-semibold">
                  +{quest.stat_reward.intelligence}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* --- Right Column: Completion Checkbox --- */}
        <div className="flex-shrink-0">
          {isToday && !isCompleted && (
            <label className="flex items-center cursor-pointer">
              <div className="relative hover-group">
                {loadingQuests?.includes(quest.id) ? (
                  // Spinner
                  <div className="w-12 h-12 flex items-center justify-center border-4 border-blue-500 rounded-md bg-gray-800">
                    <TickLoader loading={loadingQuests.length > 0} />
                    {/* <FontAwesomeIcon
                      icon={faSpinner}
                      spin
                      className="text-blue-400 text-2xl"
                    /> */}
                  </div>
                ) : (
                  // Checkbox
                  <>
                    <input
                      type="checkbox"
                      checked={completedQuests.includes(quest.id)}
                      // This handler correctly runs your logic when the state changes
                      onChange={() => handleFinishQuest(quest.id)}
                      // ADD THIS LINE: This stops the CLICK event from bubbling to the parent
                      onClick={(e) => e.stopPropagation()}
                      disabled={completedQuests.includes(quest.id)}
                      className={`
    cursor-pointer appearance-none w-12 h-12 z-50 border-4 rounded-md transition-all duration-200
    ${
      completedQuests.includes(quest.id)
        ? "bg-gray-800 border-primary cursor-not-allowed"
        : "border-gray-400 bg-gray-800 hover:bg-gray-800 hover:border-blue-500"
    }
    peer
  `}
                    />
                    <div
                      className={`
                  pointer-events-none absolute inset-0 flex items-center font-semibold justify-center text-4xl text-primary italic
                  ${
                    completedQuests.includes(quest.id)
                      ? "opacity-100"
                      : "opacity-0 peer-hover:opacity-100"
                  }
                  transition-opacity duration-200
                `}
                    >
                      <FontAwesomeIcon icon={faCheck} />
                    </div>
                  </>
                )}
              </div>
            </label>
          )}
        </div>
      </div>

      <QuestEditModal
        isOpen={isEditModalOpen}
        onClose={handleCloseEditModal}
        quest={selectedQuest}
        onUpdate={updateQuests}
      />
    </>
  );
};

const ProgressRing = ({ progress = 0, size = 65, done = 0, total = 0 }) => {
  const radius = (size - 8) / 2;
  const circumference = 2 * Math.PI * radius;

  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className="relative w-[65px] h-[65px]">
      <svg width={size} height={size}>
        <defs>
          {/* Blue glow filter */}
          <filter id="glow">
            <feDropShadow
              dx="0"
              dy="0"
              stdDeviation="3"
              floodColor="#00bfff"
              floodOpacity="0.3"
            />
            {/* <feDropShadow dx="0" dy="0" stdDeviation="6" floodColor="#00bfff" floodOpacity="0.8" /> */}
          </filter>
        </defs>

        {/* Background circle */}
        <circle
          stroke="#1f2937"
          fill="transparent"
          strokeWidth="8"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />

        {/* Progress circle with glow */}
        <circle
          stroke="#3B82F6"
          fill="transparent"
          strokeWidth="8"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          r={radius}
          cx={size / 2}
          cy={size / 2}
          className="transition-all duration-700"
          style={{
            transform: "rotate(90deg) scale(-1, 1)",
            transformOrigin: "50% 50%",
            filter: "url(#glow)",
          }}
        />
      </svg>

      {/* Blur glow behind circle (optional for extra aura) */}
      <div className="absolute inset-0 rounded-full blur-[6px] bg-blue-400 opacity-30 pointer-events-none z-[-1]"></div>

      {/* Text in the center */}
      <div className="font-solo absolute inset-0 flex items-center justify-center text-white font-bold text-md">
        {done === total ? (
          <FontAwesomeIcon
            className="text-2xl text-blue-300 drop-shadow-[0_0_8px_rgba(0,191,255,0.6)]"
            icon={faCheck}
          />
        ) : (
          `${done}/${total}`
        )}
      </div>
    </div>
  );
};

const CalendarView = ({
  focusedDate,
  setFocusedDate,
  daysMap,
  allQuests,
  currentDay,
  completedQuests,
  onClose,
  updateQuests,
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  // const [focusedDate, setFocusedDate] = useState(null);

  const statLabels = {
    strength: "STR",
    endurance: "END",
    bravery: "BRV",
    intelligence: "INT",
  };

  const statColors = {
    strength: "border-rose-700 text-rose-400",
    endurance: "border-emerald-700 text-emerald-400",
    bravery: "border-sky-700 text-sky-400",
    intelligence: "border-amber-700 text-amber-400",
  };

  // --- CALENDAR GRID ---
  const calendarGrid = useMemo(() => {
    const year = currentDate?.getFullYear();
    const month = currentDate?.getMonth();
    const startDate = new Date(year, month, 1);
    startDate.setDate(startDate.getDate() - startDate.getDay());
    const grid = [];
    for (let i = 0; i < 42; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      grid.push(date);
    }
    return grid;
  }, [currentDate]);

  const questsByDate = useMemo(() => {
    const map = new Map();
    if (!daysMap) return map;

    calendarGrid.forEach((date) => {
      const dateString = formatDateToYYYYMMDD(date);
      const dayName = date.toLocaleDateString("en-US", { weekday: "long" });

      let questsForDay = [];

      // --- Weekly/daily quests ---
      if (daysMap[dayName]) {
        questsForDay = [...daysMap[dayName]];
      }

      // --- Specific quests (keyed by exact YYYY-MM-DD date) ---
      if (daysMap[dateString]) {
        questsForDay = [...questsForDay, ...daysMap[dateString]];
      }

      map.set(dateString, questsForDay);
    });

    return map;
  }, [daysMap, calendarGrid]);

  const changeMonth = (offset) => {
    setCurrentDate((prev) => {
      const newDate = new Date(prev);
      newDate.setMonth(newDate.getMonth() + offset);
      return newDate;
    });
  };

  return createPortal(
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[999999] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-gray-900/95 border border-gray-700 rounded-2xl w-full max-w-6xl h-[90vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER */}
        <div className="flex justify-between items-center p-4 border-b border-gray-700">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-bold font-solo text-white">
              {currentDate.toLocaleDateString("en-US", {
                month: "long",
                year: "numeric",
              })}
            </h2>
            <div className="flex gap-2">
              <button
                onClick={() => changeMonth(-1)}
                className="text-gray-400 hover:text-white"
              >
                <FontAwesomeIcon icon={faChevronLeft} />
              </button>
              <button
                onClick={() => setCurrentDate(new Date())}
                className="text-sm font-semibold text-gray-400 hover:text-white"
              >
                Today
              </button>
              <button
                onClick={() => changeMonth(1)}
                className="text-gray-400 hover:text-white"
              >
                <FontAwesomeIcon icon={faChevronRight} />
              </button>
            </div>
            <input
              type="date"
              value={formatDateToYYYYMMDD(currentDate)}
              onChange={(e) =>
                setCurrentDate(new Date(`${e.target.value}T00:00:00`))
              }
              className="bg-gray-800 border border-gray-700 rounded-md p-1 text-sm text-white"
            />
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <FontAwesomeIcon icon={faXmark} size="lg" />
          </button>
        </div>

        {/* CALENDAR */}
        <div className="grid grid-cols-7 flex-grow">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div
              key={day}
              className="text-center font-bold p-2 border-b border-r border-gray-800 text-xs text-gray-500"
            >
              {day}
            </div>
          ))}

          {calendarGrid.map((date, index) => {
            const todayString = formatDateToYYYYMMDD(new Date());
            const dateString = formatDateToYYYYMMDD(date);

            const quests = questsByDate.get(dateString) || [];
            const isCurrentMonth = date.getMonth() === currentDate.getMonth();
            const isToday = dateString === todayString;

            // Count stats
            const statTotals = {};
            quests.forEach((quest) => {
              for (const [stat, val] of Object.entries(
                quest.stat_reward || {},
              )) {
                statTotals[stat] = (statTotals[stat] || 0) + val;
              }
            });

            return (
              <div
                key={index}
                onClick={() => setFocusedDate(date)}
                className={`border-b border-r border-gray-800 p-2 flex flex-col cursor-pointer hover:bg-gray-800/50 ${
                  !isCurrentMonth ? "text-gray-600" : "text-gray-200"
                }`}
              >
                {/* Date number */}
                <span
                  className={`font-semibold self-end ${
                    isToday ? "bg-primary p-1 rounded-full" : ""
                  }`}
                >
                  {date.getDate()}
                </span>

                {/* Quest count */}
                {quests.length > 0 && (
                  <div className="mt-1 text-xs text-gray-300">
                    {quests.length} Quests
                  </div>
                )}

                {/* Stat rewards */}
                <div className="flex flex-wrap gap-1 mt-1 text-[0.65rem]">
                  {Object.entries(statTotals).map(([stat, val]) => (
                    <span
                      key={stat}
                      className={`px-1 rounded-md text-xs font-semibold bg-gray-900/50 border ${
                        statColors[stat] || "border-gray-600 text-gray-400"
                      }`}
                    >
                      +{val} {statLabels[stat] || stat}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* DAY DETAIL */}
      {focusedDate && (
        <DailyTimelineView
          date={focusedDate}
          quests={questsByDate.get(formatDateToYYYYMMDD(focusedDate)) || []}
          completedQuests={completedQuests}
          onClose={(e) => {
            setFocusedDate(null);
          }}
          updateQuests={updateQuests}
        />
      )}
    </div>,
    document.getElementById("root"),
  );
};

// --- Daily Timeline Modal Component ---
const DailyTimelineView = ({
  date,
  quests,
  completedQuests,
  onClose,
  updateQuests,
}) => {
  // color mapping
  const statColors = {
    strength: "bg-red-500",
    endurance: "bg-green-500",
    bravery: "bg-blue-500",
    intelligence: "bg-yellow-400 text-black",
  };

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedQuest, setSelectedQuest] = useState(null);
  // Hooks and handlers would be passed down as props from the parent if needed,
  // or managed with a global state (Context/Redux). For this example, we assume
  // functions like `setMenuOpenId` are available or passed as props.

  const handleOpenEditModal = (questToEdit) => {
    setSelectedQuest(questToEdit);
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    // It's good practice to clear the selected quest after a delay
    // to allow the closing animation to finish smoothly.
    setTimeout(() => {
      setSelectedQuest(null);
    }, 300);
  };

  const formatTime = (timeString, short = false) => {
    if (!timeString) return "";
    const [hour, minute] = timeString.split(":");
    const hourInt = parseInt(hour, 10);
    const ampm = hourInt >= 12 ? "PM" : "AM";
    let formattedHour = hourInt % 12 || 12;
    if (short)
      return minute === "00"
        ? `${formattedHour}${ampm}`
        : `${formattedHour}:${minute}${ampm}`;
    return `${formattedHour}:${minute} ${ampm}`;
  };

  // Group quests by exact time
  const questsByTime = quests.reduce((acc, quest) => {
    acc[quest.time] = acc[quest.time] || [];
    acc[quest.time].push(quest);
    return acc;
  }, {});

  // Sort times
  const sortedTimes = Object.keys(questsByTime).sort((a, b) => {
    const [ha, ma] = a.split(":").map(Number);
    const [hb, mb] = b.split(":").map(Number);
    return ha * 60 + ma - (hb * 60 + mb);
  });

  return (
    <div
      className="fixed inset-0 bg-black/50 text-text z-[9999999] flex items-center justify-center p-4"
      onClick={(e) => {
        e.stopPropagation();
        onClose();
      }}
    >
      <div
        className="bg-gray-900 border border-blue-500/50 rounded-lg w-full max-w-md h-[70vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER */}
        <h3 className="p-4 font-bold text-lg border-b border-gray-700">
          {date.toLocaleDateString("en-US", {
            weekday: "long",
            month: "long",
            day: "numeric",
          })}
        </h3>

        {/* TIMELINE */}
        <div className="flex-grow overflow-y-auto">
          {sortedTimes.map((time) => (
            <div
              key={time}
              className="flex items-start border-b border-gray-800/50 p-2"
            >
              {/* Time label */}
              <div className="w-16 text-right pr-2">
                <span className="text-xs text-gray-400">
                  {formatTime(time, true)}
                </span>
              </div>

              {/* Quests at this time */}
              <div className="flex-1 space-y-1">
                {questsByTime[time].map((quest) => {
                  const statKey = Object.keys(quest.stat_reward || {})[0];
                  const questColor =
                    statColors[statKey] || "bg-gray-700 text-white";

                  return (
                    <div
                      key={quest.id}
                      className={`rounded p-1.5 text-xs font-bold truncate cursor-pointer ${questColor} ${
                        completedQuests.includes(quest.id) ? "opacity-40" : ""
                      }`}
                      onClick={() => handleOpenEditModal(quest)}
                    >
                      <p className="truncate">{quest.name}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
      <QuestEditModal
        isOpen={isEditModalOpen}
        onClose={handleCloseEditModal}
        quest={selectedQuest}
        onUpdate={updateQuests}
      />
    </div>
  );
};

const TodoQuestCard = ({
  quest,
  isCompleted,
  handleFinishQuest,
  updateQuests,
}) => {
  const [isCompleting, setIsCompleting] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedQuest, setSelectedQuest] = useState(null);
  // Hooks and handlers would be passed down as props from the parent if needed,
  // or managed with a global state (Context/Redux). For this example, we assume
  // functions like `setMenuOpenId` are available or passed as props.

  const handleOpenEditModal = (questToEdit) => {
    setSelectedQuest(questToEdit);
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    // It's good practice to clear the selected quest after a delay
    // to allow the closing animation to finish smoothly.
    setTimeout(() => {
      setSelectedQuest(null);
    }, 300);
  };

  const dueDate = new Date(quest.dueDate);
  // const isQuestNow = !isCompleted && isNow(dueDate);
  const isQuestOverdue = !isCompleted && isOverdue(dueDate);

  const statColors = {
    strength: "border-red-500",
    endurance: "border-green-500",
    bravery: "border-blue-500",
    intelligence: "border-yellow-400 text-black",
  };

  let dateText = "";
  let dateColor = "text-gray-400";

  let questDateTime = new Date(dueDate);

  // 2. If quest.time exists, override the time portion of our new Date object.
  if (quest.time) {
    const [hours, minutes] = quest.time.split(":");
    questDateTime.setHours(hours, minutes, 0, 0); // Set H, M, and reset S, MS
  }

  // 3. Now, use this single `questDateTime` for ALL subsequent checks.
  // The `isQuestNow` function must also use this new variable.
  const now = new Date();
  const isQuestNow = questDateTime <= now;
  // isToday and isTomorrow should also use questDateTime

  if (isQuestNow) {
    dateText = questDateTime.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
    dateColor = "text-red-400 font-semibold";
  } else if (isToday(questDateTime)) {
    dateText = questDateTime.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  } else {
    const datePart = isTomorrow(questDateTime)
      ? "Tomorrow"
      : questDateTime.toLocaleDateString([], {
          month: "short",
          day: "numeric",
        });

    const isMidnight =
      questDateTime.getHours() === 0 && questDateTime.getMinutes() === 0;

    if (isMidnight) {
      dateText = datePart;
    } else {
      const timePart = questDateTime.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
      dateText = `${datePart} at ${timePart}`;
    }
  }

  let borderColor = statColors[Object.keys(quest.stat_reward)[0]];
  // else if (isToday(dueDate)) borderColor = "border-blue-500";

  const scheduleTypeStyles = {
    daily: "bg-green-500/20 text-green-300 border-green-500/30",
    weekly: "bg-blue-500/20 text-blue-300 border-blue-500/30",
    specific: "bg-purple-500/20 text-purple-300 border-purple-500/30",
  };

  const playAnimationAndFinish = () => {
    // 1. Immediately set the state to true to start the animation
    setIsCompleting(true);

    setTimeout(() => {
      handleFinishQuest(quest.id);
    }, 300);
  };

  // Add this inside your component, before the return statement
  const statInfo = {
    strength: { icon: faDumbbell, color: "text-red-400" },
    intelligence: { icon: faBrain, color: "text-yellow-400" },
    endurance: { icon: faHeart, color: "text-green-400" },
    bravery: { icon: faRunning, color: "text-blue-400" },
  };

  return (
    <li
      className={`flex cursor-pointer items-center gap-4 bg-gray-800/50 p-3 rounded-lg border-l-4 transition-all ${
        isCompleted ? "border-gray-700 opacity-60" : borderColor
      }`}
      onClick={() => handleOpenEditModal(quest)}
    >
      <button // Call your new wrapper function
        onClick={(e) => {
          e.stopPropagation();
          playAnimationAndFinish();
        }} // Disable the button while completing to prevent double-clicks
        disabled={isCompleting}
        className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${
          // Show the green check if it's already completed OR if it's currently animating

          isCompleted || isCompleting
            ? "bg-primary border-primary"
            : "border-gray-500 hover:border-primary"
        }`}
      >
        {/* Also show the icon if it's completed OR animating */}
        {(isCompleted || isCompleting) && (
          <FontAwesomeIcon icon={faCheck} className="text-white" />
        )}
      </button>

      <div className="flex-grow">
        {/* Quest Name */}
        <p
          className={`text-white font-solo ${
            isCompleted ? "line-through text-gray-400" : ""
          }`}
        >
          {quest.name}
        </p>

        {/* --- REWARDS SECTION --- */}
        <div className="flex items-center gap-4 mt-2 text-xs font-semibold">
          {/* Experience Reward */}
          {quest.experience_reward > 0 && (
            <div className="flex items-center gap-1.5">
              <FontAwesomeIcon className="text-blue-400" icon={faAward} />
              <span className="text-text">{quest.experience_reward} XP</span>
            </div>
          )}

          {/* Stat Reward */}
          {(() => {
            // Extract the stat key (e.g., "strength") and value from the object
            const statKey = Object.keys(quest.stat_reward || {})[0];
            if (!statKey) return null; // Render nothing if there's no stat reward

            const statValue = quest.stat_reward[statKey];
            const statDetails = statInfo[statKey];

            return (
              <div className={`flex items-center gap-1.5 ${statDetails.color}`}>
                <FontAwesomeIcon icon={statDetails.icon} />
                <span>
                  +{statValue} {statKey.substring(0, 3).toUpperCase()}
                </span>
              </div>
            );
          })()}
        </div>
      </div>

      {/* --- DUE DATE (No changes needed here) --- */}
      <div className={`flex-shrink-0 text-sm font-medium ${dateColor}`}>
        {dateText}
      </div>

      {/* The Edit Modal is not part of the visual design, so no changes */}
      <QuestEditModal
        isOpen={isEditModalOpen}
        onClose={handleCloseEditModal}
        quest={selectedQuest}
        onUpdate={updateQuests}
      />
    </li>
  );
};

const QuestTodoList = ({
  quests,
  completedQuests,
  handleFinishQuest,
  updateQuests,
  handleOpenCalendar,
}) => {
  const [showCompleted, setShowCompleted] = useState(false);
  const { incomplete, completed } = useMemo(() => {
    // This now includes quests of all types
    const incompleteList = quests.filter(
      (q) => !completedQuests.includes(q.id),
    );
    const completedList = quests.filter((q) => completedQuests.includes(q.id));

    return { incomplete: incompleteList, completed: completedList };
  }, [quests, completedQuests]);

  const groupedQuests = useMemo(() => {
    const groups = {
      Now: [],
      // Overdue: [],
      Today: [],
      Tomorrow: [],
      Upcoming: [],
    };
    incomplete.forEach((quest) => {
      const dueDate = new Date(quest.dueDate);
      if (isNow(dueDate)) groups.Now.push(quest);
      // else if (isOverdue(dueDate)) groups.Overdue.push(quest);
      else if (isToday(dueDate)) groups.Today.push(quest);
      else if (isTomorrow(dueDate)) groups.Tomorrow.push(quest);
      else groups.Upcoming.push(quest);
    });
    for (const group of Object.values(groups)) {
      group.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
    }
    return groups;
  }, [incomplete]);

  const QuestSection = ({ title, quests: sectionQuests }) => {
    if (!sectionQuests || sectionQuests.length === 0) return null;
    return (
      <div className="mb-6">
        <h3
          className={`px-2 text-lg font-bold mb-3 ${
            title === "Now" || title === "Overdue"
              ? "text-red-400"
              : "text-gray-400"
          }`}
        >
          {title}
        </h3>
        <ul className="space-y-2">
          {sectionQuests.map((quest) => (
            <TodoQuestCard
              key={`${quest.id}${Math.random()}`}
              quest={quest}
              isCompleted={false}
              handleFinishQuest={handleFinishQuest}
              updateQuests={updateQuests}
            />
          ))}
        </ul>
      </div>
    );
  };

  return (
    <div className="h-full w-full overflow-y-auto hide-scrollbar rounded-md p-4 md:p-6 bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f3460]">
      {/* {isCalendarOpen && (
        <CalendarView
          daysMap={daysMap}
          allQuests={scheduledQuests} // Pass the raw list here
          currentDay={currentDay} // Pass the current day string
          completedQuests={completedQuests}
          onClose={() => setIsCalendarOpen(false)}
        />
      )} */}
      <header className="mb-6 sticky top-0 bg-inherit/80 backdrop-blur-sm pt-2 z-10">
        <h2 className="text-white text-xl font-solo font-bold">
          <button
            onClick={handleOpenCalendar}
            className="text-gray-400 mr-2 hover:text-white transition-colors"
            title="Open Calendar"
          >
            <FontAwesomeIcon icon={faCalendarAlt} size="lg" />
          </button>
          My Quest Todos
        </h2>
      </header>
      {incomplete.length === 0 && completed.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-[50vh] text-center">
          <p className="text-gray-400">No active quests.</p>
        </div>
      ) : (
        <>
          <QuestSection title="Now" quests={groupedQuests.Now} />
          <QuestSection title="Overdue" quests={groupedQuests.Overdue} />
          <QuestSection title="Today" quests={groupedQuests.Today} />
          <QuestSection title="Tomorrow" quests={groupedQuests.Tomorrow} />
          <QuestSection title="Upcoming" quests={groupedQuests.Upcoming} />

          {completed.length > 0 && (
            <div className="mt-8 pt-4 border-t border-gray-700">
              <button
                onClick={() => setShowCompleted(!showCompleted)}
                className="w-full flex justify-between items-center p-2 rounded-md hover:bg-gray-800/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <h3 className="text-lg font-bold text-gray-400">Completed</h3>
                  <span className="text-sm font-semibold text-gray-500 bg-gray-700 px-2 py-0.5 rounded-full">
                    {completed.length}
                  </span>
                </div>
                <motion.div animate={{ rotate: showCompleted ? 180 : 0 }}>
                  <FontAwesomeIcon
                    icon={faChevronDown}
                    className="text-gray-500"
                  />
                </motion.div>
              </button>
              <AnimatePresence>
                {showCompleted && (
                  <motion.ul
                    key="completed-list"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="space-y-2 mt-2 overflow-hidden"
                  >
                    {completed.map((quest) => (
                      <TodoQuestCard
                        key={`${quest.id}${Math.random()}`}
                        quest={quest}
                        isCompleted={true}
                        handleFinishQuest={handleFinishQuest}
                        updateQuests={updateQuests}
                      />
                    ))}
                  </motion.ul>
                )}
              </AnimatePresence>
            </div>
          )}
        </>
      )}
    </div>
  );
};

const formatDateToYYYYMMDD = (dateObj) => {
  if (!dateObj) return null;
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, "0");
  const day = String(dateObj.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const isToday = (date) => {
  const todayStr = formatDateToYYYYMMDD(new Date());
  const dateStr = formatDateToYYYYMMDD(date);
  return dateStr === todayStr;
};
const isTomorrow = (date) => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  const tomorrowStr = formatDateToYYYYMMDD(tomorrow);
  const dateStr = formatDateToYYYYMMDD(date);
  return dateStr === tomorrowStr;
};
const isOverdue = (date) => {
  const todayStr = formatDateToYYYYMMDD(new Date());
  const dateStr = formatDateToYYYYMMDD(date);
  // Comparing 'YYYY-MM-DD' strings works for checking if a date is in the past
  return dateStr < todayStr;
};
// NEW: Checks if a quest's due time has passed today
const isNow = (date) => {
  // It's "now" if the due time is in the past AND the quest is for today.
  return date < new Date() && isToday(date);
};

export default ScheduledQuests;
