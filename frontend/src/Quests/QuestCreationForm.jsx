import {
  faAward,
  faBolt,
  faBrain,
  faCalendar,
  faCalendarAlt,
  faCertificate,
  faChartLine,
  faCheckCircle,
  faClockRotateLeft,
  faDumbbell,
  faEye,
  faGem,
  faHeart,
  faPaperPlane,
  faPen,
  faPenAlt,
  faRunning,
  faScroll,
  faStar,
  faThumbTack,
  faTimes,
  faTimesCircle,
  faUserShield,
  faWandMagicSparkles,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import axios from "axios";
import React, { useContext, useEffect, useState } from "react";
import { FaBrain, FaMapPin } from "react-icons/fa";
import { UserContext } from "../Account/UserContext";
import config from "../config";
import { motion } from "framer-motion";
import ReactDOM from "react-dom";
import {
  addDays,
  addWeeks,
  addMonths,
  addYears,
  format,
  parse,
} from "date-fns";
import * as chrono from "chrono-node";

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

function QuestCreationForm({ onClose, onUpdate }) {
  const [step, setStep] = useState(1);
  const userId = JSON.parse(localStorage.getItem("user"))?.id;
  const [userQuests, setUserQuests] = useState([]);
  const { accountDataRef, fetchAccountData } = useContext(UserContext);
  const isPremium = accountDataRef.current?.premium === 1;

  const [selectedTags, setSelectedTags] = useState([]);
  const [selectedQuest, setSelectedQuest] = useState(null);
  const [recommendedQuests, setRecommendedQuests] = useState([]);
  const [inputText, setInputText] = useState("");
  const [parsedQuest, setParsedQuest] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [highlightedKeywords, setHighlightedKeywords] = useState([]);

  // --- MODIFIED STATE ---
  // Replaced 'days' with a more detailed 'schedule' object
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    schedule: {
      type: "weekly", // 'weekly', 'daily', 'specific'
      days: [], // For weekly
      time: "12:00",
      startDate: new Date().toISOString().split("T")[0],
      endDate: null,
    },
  });

  const [accountData, setAccountData] = useState({});
  const [loading, setLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const [mainGoal, setMainGoal] = useState("");
  const [goalInput, setGoalInput] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [questDays, setQuestDays] = useState({});
  const [scheduling, setScheduling] = useState(false);
  const [scheduledQuests, setScheduledQuests] = useState([]);

  const handleUseMainGoal = () => {
    setGoalInput(mainGoal);
  };

  const handleGenerateQuests = async () => {
    setLoading(true);
    const quests = await fetchUserQuests();

    try {
      const response = await axios.post(
        `${config.backendUrl}/generate-quest-suggestions`,
        {
          goal: goalInput || mainGoal,
          created_by: userId,
          current_quests: quests,
        }
      );

      if (response.data.success) {
        const suggestionsData = response.data.suggestions;

        // Expecting each suggestion as: { name, description, stat }
        setSuggestions(suggestionsData);

        // Initialize day selections for each quest
        const initialDays = {};
        suggestionsData.forEach((quest) => {
          initialDays[quest.name] = "Monday"; // Default to Monday
        });
        setQuestDays(initialDays);
      } else {
        console.error(
          "Failed to generate quest suggestions:",
          response.data.error
        );
      }
    } catch (err) {
      console.error("Failed to get AI response:", err);
    }

    setStep("system-confirm");
    setLoading(false);
  };

  // useEffect(() => {
  //   axios
  //     .get(`${config.backendUrl}/user-goal`, { params: { userId } })
  //     .then((res) => {
  //       setMainGoal(res.data.goal || "");
  //       // if (!res.data.goal) setShowGoalModal(true);
  //     });
  // }, [userId]);

  const rankColors = {
    F: "text-gray-400",
    "F+": "text-gray-300",
    D: "text-red-400",
    "D+": "text-red-300",
    C: "text-yellow-500",
    "C+": "text-yellow-400",
    B: "text-blue-400",
    "B+": "text-blue-300",
    A: "text-green-400",
    "A+": "text-green-300",
  };

  const statIcons = {
    strength: faDumbbell,
    intelligence: faBrain,
    endurance: faHeart,
    bravery: faRunning,
  };

  function calculateLevel(experience) {
    let level = 1;
    let xpForNextLevel = 10;

    while (experience >= xpForNextLevel) {
      level++;
      experience -= xpForNextLevel;
      xpForNextLevel = xpForNextLevel = 10 * Math.pow(1.05, level - 1);
    }

    return { level, remainingXP: experience, xpForNextLevel };
  }

  useEffect(() => {
    fetchAccountData(userId);
    const interval = setInterval(() => {
      if (accountDataRef.current) {
        setAccountData(accountDataRef.current);
      }
    }, 300); // Small interval to wait for dataRef update

    return () => clearInterval(interval);
  }, [accountDataRef]);

  const fetchDailyQuests = async () => {
    setLoading(true);
    try {
      if (!userId) {
        console.error("User or user level is not available.");
        return [];
      }

      const response = await axios.get(`${config.backendUrl}/quests`, {
        params: { userId },
      });

      const level = calculateLevel(accountData.experience).level;
      let allowedDifficulties = [];

      if (level >= 1) allowedDifficulties = [1];
      if (level >= 21) allowedDifficulties = [1, 2];
      if (level >= 41) allowedDifficulties = [1, 2, 3];
      if (level >= 51) allowedDifficulties = [1, 2, 3, 4];
      if (level >= 71) allowedDifficulties = [1, 2, 3, 4, 5];
      if (level >= 81) allowedDifficulties = [1, 2, 3, 4, 5, 6];
      if (level >= 101) allowedDifficulties = [1, 2, 3, 4, 5, 6, 7];
      if (level >= 111) allowedDifficulties = [1, 2, 3, 4, 5, 6, 7, 8];
      if (level >= 131) allowedDifficulties = [1, 2, 3, 4, 5, 6, 7, 8, 9];
      if (level >= 141) allowedDifficulties = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

      const filteredQuests = response.data.filter((quest) =>
        allowedDifficulties.includes(quest.difficulty)
      );

      const questsWithParsedStats = filteredQuests.map((quest) => {
        let parsedStatReward = null;
        let parsedTags = [];

        try {
          parsedStatReward = quest.stat_reward
            ? JSON.parse(quest.stat_reward)
            : null;
        } catch (error) {
          console.error("Error parsing stat_reward for quest", quest.id, error);
        }

        try {
          if (typeof quest.tags === "string") {
            parsedTags = JSON.parse(quest.tags);
            if (!Array.isArray(parsedTags)) {
              throw new Error("Parsed tags is not an array");
            }
          } else if (Array.isArray(quest.tags)) {
            parsedTags = quest.tags;
          }
        } catch (error) {
          console.error("Error parsing tags for quest", quest.id, error);
          parsedTags = [];
        }

        setLoading(false);

        return { ...quest, stat_reward: parsedStatReward, tags: parsedTags };
      });

      return questsWithParsedStats;
    } catch (err) {
      console.error("Error fetching daily quests:", err);
      return [];
    }
  };

  useEffect(() => {
    const loadQuests = async () => {
      const quests = await fetchDailyQuests();
      setRecommendedQuests(quests);
    };

    if (step === 2) {
      loadQuests();
    }
  }, [step]);

  const fetchUserQuests = async () => {
    setLoading(true);
    try {
      if (!userId) {
        console.error("User or user level is not available.");
        return [];
      }

      const response = await axios.get(`${config.backendUrl}/quests/${userId}`);

      const level = calculateLevel(accountData.experience).level;
      let allowedDifficulties = [];

      if (level >= 1) allowedDifficulties = [1];
      if (level >= 21) allowedDifficulties = [1, 2];
      if (level >= 41) allowedDifficulties = [1, 2, 3];
      if (level >= 51) allowedDifficulties = [1, 2, 3, 4];
      if (level >= 71) allowedDifficulties = [1, 2, 3, 4, 5];
      if (level >= 81) allowedDifficulties = [1, 2, 3, 4, 5, 6];
      if (level >= 101) allowedDifficulties = [1, 2, 3, 4, 5, 6, 7];
      if (level >= 111) allowedDifficulties = [1, 2, 3, 4, 5, 6, 7, 8];
      if (level >= 131) allowedDifficulties = [1, 2, 3, 4, 5, 6, 7, 8, 9];
      if (level >= 141) allowedDifficulties = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

      const filteredQuests = response.data.filter((quest) =>
        allowedDifficulties.includes(quest.difficulty)
      );

      const questsWithParsedStats = filteredQuests.map((quest) => {
        let parsedStatReward = null;
        try {
          parsedStatReward = quest.stat_reward
            ? JSON.parse(quest.stat_reward)
            : null;
        } catch (error) {
          console.error("Error parsing stat_reward for quest", quest.id, error);
          parsedStatReward = null;
        }

        return { ...quest, stat_reward: parsedStatReward };
      });

      return questsWithParsedStats;
      setLoading(false);
    } catch (err) {
      console.error("Error fetching daily quests:", err);
      return [];
    }
  };

  useEffect(() => {
    const loadUserQuests = async () => {
      const quests = await fetchUserQuests();
      setUserQuests(quests);
    };

    if (step === 1 && userId) {
      loadUserQuests();
    }
  }, []);

  useEffect(() => {
    const handler = setTimeout(() => {
      if (inputText.trim()) {
        const result = parseQuestText(inputText);
        setParsedQuest(result);
      } else {
        setParsedQuest(null);
      }
    }, 500);

    return () => clearTimeout(handler);
  }, [inputText]);

  useEffect(() => {
    // When the success toast is shown...
    if (showSuccessModal) {
      // ...set a timer to hide it after 5 seconds.
      const timer = setTimeout(() => {
        setShowSuccessModal(false);
        localStorage.setItem("inputText", "");
        onUpdate();
      }, 1000);

      // Clean up the timer if the component unmounts
      return () => clearTimeout(timer);
    }
  }, [showSuccessModal]); // This effect runs whenever `showSuccessModal` changes

  function getDifficultyAndRewards(stat = "strength") {
    const level = calculateLevel(accountData.experience)?.level || 0; // Use user's rank (fallback to "F")

    let difficulty = 1;
    if (level >= 21) difficulty = 2;
    if (level >= 41) difficulty = 3;
    if (level >= 51) difficulty = 4;
    if (level >= 71) difficulty = 5;
    if (level >= 81) difficulty = 6;
    if (level >= 101) difficulty = 7;
    if (level >= 111) difficulty = 8;
    if (level >= 131) difficulty = 9;
    if (level >= 141) difficulty = 10;

    let rewards = { experience_reward: 17, stat_reward: { [stat]: 1 } };

    switch (difficulty) {
      case 1:
        rewards = { experience_reward: 17, stat_reward: { [stat]: 1 } };
        break;
      case 2:
        rewards = { experience_reward: 21, stat_reward: { [stat]: 2 } };
        break;
      case 3:
        rewards = { experience_reward: 27, stat_reward: { [stat]: 3 } };
        break;
      case 4:
        rewards = { experience_reward: 37, stat_reward: { [stat]: 4 } };
        break;
      case 5:
        rewards = { experience_reward: 47, stat_reward: { [stat]: 5 } };
        break;
      case 6:
        rewards = { experience_reward: 61, stat_reward: { [stat]: 6 } };
        break;
      case 7:
        rewards = { experience_reward: 75, stat_reward: { [stat]: 7 } };
        break;
      case 8:
        rewards = { experience_reward: 91, stat_reward: { [stat]: 8 } };
        break;
      case 9:
        rewards = { experience_reward: 107, stat_reward: { [stat]: 9 } };
        break;
      case 10:
        rewards = { experience_reward: 127, stat_reward: { [stat]: 10 } };
        break;
      default:
        rewards = { experience_reward: 17, stat_reward: { [stat]: 1 } };
        break;
    }

    return { difficulty, ...rewards };
  }

  // --- MODIFIED SUBMISSION LOGIC ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      let questId;
      const primaryStat = determineStat(inputText);

      // This function now sends the entire schedule object to the backend
      const { difficulty, experience_reward, stat_reward } =
        getDifficultyAndRewards(primaryStat);

      // 🧠 Check if the quest is pre-existing (selected from the library)
      if (selectedQuest && userQuests.some((q) => q.id === selectedQuest.id)) {
        questId = selectedQuest.id;
        console.log("📌 Using existing quest with ID:", questId);
      } else {
        // 🆕 Create a new quest
        const finalQuest = {
          name: inputText,
          description: parsedQuest.description,
          difficulty: difficulty,
          experience_reward: experience_reward,
          stat_reward: stat_reward,
          tags: parsedQuest.tags,
          created_by: userId || "anonymous",
          created_at: new Date().toISOString(),
        };

        const questRes = await axios.post(
          `${config.backendUrl}/quest`,
          finalQuest
        );
        const createdQuest = questRes.data;

        console.log("✅ Quest created:", createdQuest);
        questId = createdQuest.questId;

        if (!questId) {
          console.error("❌ Quest ID missing in response");
          return;
        }
      }

      // ✅ Schedule the quest
      const scheduleRes = await axios.post(
        `${config.backendUrl}/schedule-quest`,
        {
          quest_id: questId,
          user_id: userId || "anonymous",
          schedule: parsedQuest.schedule, // Pass the whole schedule object
        },
        {
          withCredentials: true,
        }
      );

      console.log("📆 Quest scheduled:", scheduleRes.data);
      setShowSuccessModal(true);
      localStorage.setItem("inputText", inputText);
      setInputText("");
    } catch (err) {
      console.error("❌ Error creating or scheduling quest:", err);

      if (
        err.response?.status === 403 &&
        err.response?.data?.message?.includes("limit")
      ) {
        alert(
          "⚠️ You’ve reached the maximum number of quests you can create (10). Complete or delete some to make room!"
        );
      } else {
        alert("Something went wrong. Try again.");
      }
    }
  };

  const STAT_KEYWORDS = {
    strength: {
      keywords: [
        "gym",
        "workout",
        "lift",
        "lifting",
        "weights",
        "exercise",
        "fitness",
        "training",
        "muscle",
        "resistance",
        "strength training",
        "weight training",
        "bodybuilding",
        "powerlifting",
        "pushup",
        "pull-up",
        "pullup",
        "chin-up",
        "chinup",
        "squat",
        "lunge",
        "deadlift",
        "bench press",
        "curl",
        "plank",
        "crunch",
        "burpee",
        "dip",
        "row",
        "press",
        "dumbbell",
        "barbell",
        "kettlebell",
        "HIIT",
        "build muscle",
        "gains",
      ],
    },
    intelligence: {
      keywords: [
        "read",
        "study",
        "learn",
        "code",
        "book",
        "course",
        "research",
        "analyze",
        "problem-solving",
        "critical thinking",
        "documentary",
        "lecture",
        "puzzle",
        "chess",
        "language",
        "write",
        "journal",
        "project",
        "skill",
        "develop",
        "build",
        "create",
        "design",
        "review",
        "memorize",
        "practice",
        "instrument",
        "science",
        "math",
        "history",
        "seminar",
        "workshop",
        "webinar",
        "museum",
        "plan",
      ],
    },
    endurance: {
      keywords: [
        "run",
        "cardio",
        "hike",
        "swim",
        "cycle",
        "jog",
        "walk",
        "marathon",
        "triathlon",
        "stamina",
        "aerobic",
        "rowing",
        "jumprope",
        "cycling",
        "biking",
        "treadmill",
        "elliptical",
        "stairmaster",
        "hiking",
        "backpacking",
        "sports",
        "soccer",
        "basketball",
        "tennis",
        "zumba",
        "dance",
        "interval training",
        "long-distance",
        "track",
        "trail run",
        "brisk walk",
        "swimming laps",
        "jump rope",
      ],
    },
    bravery: {
      keywords: [
        "public speaking",
        "social",
        "cold shower",
        "present",
        "presentation",
        "new experience",
        "challenge",
        "uncomfortable",
        "face fear",
        "ask out",
        "date",
        "risk",
        "bravely",
        "network",
        "meet new people",
        "conversation",
        "volunteer",
        "ask for help",
        "set boundary",
        "negotiate",
        "try something new",
        "explore",
        "improv",
        "open mic",
        "debate",
        "speak up",
        "leadership",
        "take initiative",
        "cold approach",
        "rejection therapy",
        "pitch idea",
        "performance",
        "interview",
        "travel solo",
        "assertiveness",
      ],
    },
  };

  function determineStat(text) {
    const lowerText = text.toLowerCase();
    for (const stat in STAT_KEYWORDS) {
      for (const keyword of STAT_KEYWORDS[stat].keywords) {
        if (lowerText.includes(keyword)) {
          return stat; // Return the first stat that matches a keyword.
        }
      }
    }
    return "intelligence"; // Default fallback if no keywords are found.
  }

  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const date = `${year}-${month}-${day}`;

  // --- HELPER UTILITIES ---
  const wordToNumber = {
    one: 1,
    two: 2,
    three: 3,
    four: 4,
    five: 5,
    six: 6,
    seven: 7,
    eight: 8,
    nine: 9,
    ten: 10,
  };

  const dayMap = {
    sunday: "Sun",
    sun: "Sun",
    monday: "Mon",
    mon: "Mon",
    tuesday: "Tue",
    tues: "Tue",
    wednesday: "Wed",
    wed: "Wed",
    thursday: "Thu",
    thur: "Thu",
    thurs: "Thurs",
    friday: "Fri",
    fri: "Fri",
    saturday: "Sat",
    sat: "Sat",
  };

  const allDaysRegex = new RegExp(
    `\\b(${Object.keys(dayMap).join("|")})\\b`,
    "gi"
  );

  const timeParser = {
    pattern: () => /\b(at\s*)?(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\b/i,
    extract: (context, match) => {
      const result = context.createParsingResult(match.index, match[0]);

      let hour = parseInt(match[2], 10);
      const minute = match[3] ? parseInt(match[3], 10) : 0;
      const ampm = match[4]?.toLowerCase();

      if (ampm === "pm" && hour < 12) hour += 12;
      if (ampm === "am" && hour === 12) hour = 0; // Midnight case

      result.start.assign("hour", hour);
      result.start.assign("minute", minute);
      return result;
    },
  };

  // --- Create a custom parser for the MM-DD format ---
  const mmddParser = {
    pattern: () => /\b(\d{1,2})-(\d{1,2})\b/,
    extract: (context, match) => {
      const month = parseInt(match[1]);
      const day = parseInt(match[2]);
      if (month < 1 || month > 12 || day < 1 || day > 31) return null;

      const result = context.createParsingResult(match.index, match[0]);
      result.start.assign("month", month);
      result.start.assign("day", day);
      return result;
    },
  };

  const relativeTimeParser = {
    pattern: () =>
      /\b(morning|afternoon|evening|tonight|night|afternoon|noon|midnight)\b/i,
    extract: (context, match) => {
      const timeOfDay = match[1].toLowerCase();
      const result = context.createParsingResult(match.index, match[0]);

      result.start.imply("year", context.refDate.getFullYear());
      result.start.imply("month", context.refDate.getMonth() + 1);
      result.start.imply("day", context.refDate.getDate());

      switch (timeOfDay) {
        case "morning":
          result.start.assign("hour", 9);
          break;
        case "afternoon":
          result.start.assign("hour", 15);
          break;
        case "evening":
          result.start.assign("hour", 18);
          break;
        case "tonight":
          result.start.assign("hour", 20);
          break;
        case "night":
          result.start.assign("hour", 20);
          break;
        case "afternoon":
          result.start.assign("hour", 13);
        case "noon":
          result.start.assign("hour", 12);
        case "midnight":
          result.start.assign("hour", 0);
      }
      return result;
    },
  };

  // --- Create a custom Chrono instance and add your new parser ---
  const customChrono = new chrono.Chrono();
  customChrono.parsers.push(timeParser);
  customChrono.parsers.push(mmddParser);
  customChrono.parsers.push(relativeTimeParser);

  // This small array is all you need for recurring logic
  const recurringPatterns = [
    {
      regex: /\b(every day|everyday|daily)\b/i,
      action: (s) => {
        s.type = "daily";
        s.days = [];
      },
    },
    {
      regex: /\b(every weekday|weekdays)\b/i,
      action: (s) => {
        s.type = "weekly";
        s.days = ["Mon", "Tue", "Wed", "Thu", "Fri"];
      },
    },
    // Add this new pattern to handle "weekly".
    {
      regex: /\b(weekly)\b/i,
      action: (s) => {
        // This logic sets the task to repeat every week on the current day.
        s.type = "weekly";
        const dayAbbreviations = [
          "Sun",
          "Mon",
          "Tue",
          "Wed",
          "Thu",
          "Fri",
          "Sat",
        ];
        const currentDay = new Date().getDay(); // 0 for Sunday, 1 for Monday, etc.
        s.days = [dayAbbreviations[currentDay]];
      },
    },
    ...Object.keys(dayMap).map((day) => ({
      regex: new RegExp(`\\b(every ${day}|${day}s)\\b`, "i"),
      action: (s) => {
        s.type = "weekly";
        s.days = Array.from(new Set([...s.days, dayMap[day]]));
      },
    })),
  ];

  // THE NEW, CONSOLIDATED MAIN FUNCTION
  function parseScheduleAndName(text) {
    // Create a custom Chrono instance with our parsers
    const customChrono = new chrono.Chrono();
    customChrono.parsers.push(timeParser, mmddParser, relativeTimeParser);

    let schedule = {
      type: "specific",
      days: [],
      time: null,
      startDate: format(new Date(), "yyyy-MM-dd"),
    };

    let keywords = [];

    // --- Pass 1: Handle broad patterns like "daily" or "weekdays" ---
    recurringPatterns.forEach((pattern) => {
      const match = text.match(pattern.regex);
      if (match) {
        pattern.action(schedule);
        keywords.push(match[0]);
      }
    });

    // --- Pass 2: Find ALL specified days (e.g., "monday, tues") ---
    const dayMatches = text.match(allDaysRegex);
    if (dayMatches) {
      schedule.type = "weekly";
      const matchedDays = dayMatches.map((day) => dayMap[day.toLowerCase()]);
      schedule.days = Array.from(new Set(matchedDays));
      keywords.push(...dayMatches);
    }

    // --- Pass 3: Use Chrono to parse specific dates AND times ---
    const chronoResults = customChrono.parse(text);

    // **THE FIX IS HERE:** Instead of just checking the first result, we now find
    // the BEST result that contains a specific time.
    const resultWithTime = chronoResults.find((r) => r.start.isCertain("hour"));

    if (resultWithTime) {
      schedule.time = format(resultWithTime.start.date(), "HH:mm");
      // Add the text of the result that gave us the time (e.g., "tuesday at 3pm") to the keywords
      keywords.push(resultWithTime.text);
    }

    // ONLY set the start date if the task is NOT recurring.
    // We use the first overall result for the date, as it's the most likely interpretation.
    if (schedule.type === "specific" && chronoResults.length > 0) {
      schedule.startDate = format(chronoResults[0].start.date(), "yyyy-MM-dd");
      keywords.push(chronoResults[0].text);
    }

    // --- Finalize the time: If none was found, default to the current time ---
    if (!schedule.time) {
      schedule.time = format(new Date(), "HH:mm");
    }

    // --- Clean the task name ---
    let cleanedName = text;
    const uniqueKeywords = Array.from(new Set(keywords));
    // Sort by length to remove longer phrases (like "tomorrow morning") before shorter ones ("tomorrow")
    uniqueKeywords.sort((a, b) => b.length - a.length);

    uniqueKeywords.forEach((keyword) => {
      cleanedName = cleanedName.replace(
        new RegExp(`\\b${keyword}\\b`, "i"),
        ""
      );
    });

    cleanedName = cleanedName
      .replace(stickyKeywordRegex, "")
      .replace(/\s\s+/g, " ")
      .trim();

    if (cleanedName) {
      cleanedName = cleanedName.charAt(0).toUpperCase() + cleanedName.slice(1);
    }

    return {
      schedule,
      name: cleanedName || "Unnamed Task",
      keywords: uniqueKeywords,
    };
  }

  function parseQuestText(text, level) {
    // 1. Basic validation
    if (!text || !text.trim()) {
      return null;
    }

    // 2. Extract the name and schedule from the text
    const { schedule, name } = parseScheduleAndName(text);

    // 3. Determine the primary stat based on keywords (e.g., 'strength')
    const primaryStat = determineStat(text);

    // 4. Calculate difficulty and rewards based on the user's level and the determined stat
    const { difficulty, experience_reward, stat_reward } =
      getDifficultyAndRewards(primaryStat);

    // 5. Assemble and return the final quest object
    return {
      name,
      description: text, // Use the full text as the description
      stat_reward, // The calculated stat reward object (e.g., { strength: 4 })
      experience_reward, // The calculated XP reward
      difficulty, // The calculated difficulty rank (e.g., 4)
      tags: [], // Default empty tags array
      schedule, // The parsed schedule object
    };
  }

  // Helper function to generate the schedule text for the preview pills
  const renderScheduleText = (parsedQuest) => {
    if (!parsedQuest) return null;
    const { type, days, frequency, startDate, time } = parsedQuest.schedule;
    let text =
      type === "daily"
        ? "Daily"
        : type === "weekly"
        ? days.length > 0
          ? `on ${days.sort().join(", ")}`
          : frequency
          ? `${frequency}x a week`
          : "Weekly"
        : `on ${startDate}`;
    if (time) text += ` at ${time}`;
    return text;
  };

  const handleInputChange = (e) => {
    const newText = e.target.value;
    setInputText(newText);

    // --- 1. "PERMANENT" UNDERLINING LOGIC ---
    // Find all words from our dictionary that are in the current text.
    const stickyMatches = newText.match(stickyKeywordRegex) || [];
    // Use a Set to store unique keywords and update our dedicated state.
    setHighlightedKeywords([...new Set(stickyMatches)]);

    // --- 2. "SMART" SCHEDULING LOGIC ---
    // Run the full parser to figure out the actual, valid schedule.
    if (newText.trim()) {
      const result = parseScheduleAndName(newText); // Your full parser
      setParsedQuest(result);
    } else {
      // If the input is empty, clear everything.
      setParsedQuest(null);
    }
  };

  // const statKey = parsedQuest ? Object.keys(parsedQuest.stat_reward)[0] : null;
  const statKey = Object.keys(parsedQuest?.stat_reward || {})[0];

  const StatIcon = statKey ? statIcons[statKey] : null;

  // A lexicon of common date/time words for "sticky" underlining.
  const DATE_TIME_LEXICON = [
    // NEW: Specifically match times like "7pm", "10:30am", etc.
    // This needs to come BEFORE the general number match.
    "\\d{1,2}(:\\d{2})?(am|pm)",

    // --- Existing Lexicon ---
    "today",
    "tomorrow",
    "tonight",
    "yesterday",
    "morning",
    "noon",
    "afternoon",
    "evening",
    "night",
    "midnight",
    "next",
    "last",
    "this",
    "on",
    "at",
    "in",
    "from",
    "every",
    "and",
    "the",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
    "sunday",
    "mon",
    "tue",
    "wed",
    "thu",
    "fri",
    "sat",
    "sun",
    "january",
    "february",
    "march",
    "april",
    "may",
    "june",
    "july",
    "august",
    "september",
    "october",
    "november",
    "december",
    "jan",
    "feb",
    "mar",
    "apr",
    "jun",
    "jul",
    "aug",
    "sep",
    "sept",
    "oct",
    "nov",
    "dec",
    // Note: We leave 'am' and 'pm' here for cases like "at 5 pm" (with a space)
    "am",
    "pm",
    // The general number match for dates like "the 21st"
    "\\d{1,4}(st|nd|rd|th)?",
  ];

  // This regex builder does not need to change.
  const stickyKeywordRegex = new RegExp(
    `\\b(${DATE_TIME_LEXICON.join("|")})\\b`,
    "gi"
  );

  // A new helper component to render the text with underlines
  const UnderlinedText = ({ text, keywords }) => {
    if (!keywords || keywords.length === 0) {
      return <span>{text}</span>;
    }

    // Create a regex to split the string by the keywords, but keep the keywords
    const regex = new RegExp(`(${keywords.join("|")})`, "gi");
    const parts = text.split(regex);

    return (
      <span>
        {parts.map((part, index) => {
          const isKeyword = keywords.some(
            (kw) => part.toLowerCase() === kw.toLowerCase()
          );
          return isKeyword ? (
            <u key={index} className="decoration-blue-500 decoration-2">
              {part}
            </u>
          ) : (
            <span key={index}>{part}</span>
          );
        })}
      </span>
    );
  };

  return (
    <div className="fixed md:relative md:bottom-0 bottom-16 w-full">
      {/* NEW: Frosted glass container for visual separation */}
      <div className="relative bg-gray-800/50 backdrop-blur-lg border border-gray-700 rounded-xl p-4 shadow-lg shadow-black/30">
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <div className="relative w-full">
            {/* 1. The background DIV that shows the styled text. */}
            {/* It's positioned absolutely to sit behind the input. */}
            {/* It has the SAME styling as the input, but a solid background. */}
            <div
              className="w-full h-full px-4 py-3 bg-gray-900/70 text-transparent border border-gray-600 rounded-lg shadow-inner shadow-black/20 pointer-events-none absolute top-0 left-0"
              aria-hidden="true"
            >
              <UnderlinedText text={inputText} keywords={highlightedKeywords} />
            </div>

            {/* 2. The REAL input. It's transparent so you see the div behind it. */}
            <input
              type="text"
              value={inputText}
              onChange={handleInputChange} // Use the new handler
              placeholder={`Create a quest (e.g., Go to the gym every ${currentDay} at 6pm)`}
              className="relative w-full px-4 py-3 bg-transparent text-gray-200 border border-gray-600 rounded-lg shadow-inner shadow-black/20 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder-gray-500"
              disabled={isSubmitting}
            />
          </div>
          <button
            type="submit"
            disabled={
              isSubmitting ||
              !parsedQuest ||
              !parsedQuest.experience_reward ||
              !parsedQuest.stat_reward
            }
            className="p-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-500 transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed flex-shrink-0"
          >
            {isSubmitting ? "..." : <FontAwesomeIcon icon={faPaperPlane} />}
          </button>
        </form>

        {parsedQuest && (
          <div className="flex flex-wrap items-center gap-2 mt-3 animate-fade-in text-xs text-gray-400">
            <span className="flex items-center bg-gray-900/50 px-2 py-1 rounded-md border border-gray-700">
              <FontAwesomeIcon icon={faCalendar} className="mr-2" />
              {renderScheduleText(parsedQuest)}
            </span>
            {statKey && statIcons[statKey] && (
              <span className="flex items-center bg-gray-900/50 px-2 py-1 rounded-md capitalize border border-gray-700">
                <FontAwesomeIcon className="mr-2" icon={statIcons[statKey]} />{" "}
                {statKey} +{parsedQuest.stat_reward[statKey]}
              </span>
            )}
            <span className="flex items-center bg-gray-900/50 px-2 py-1 rounded-md border border-gray-700">
              <FontAwesomeIcon icon={faAward} className="mr-2" />
              {parsedQuest.experience_reward} XP
            </span>
          </div>
        )}
      </div>

      {showSuccessModal &&
        ReactDOM.createPortal(
          // This container positions the toast in the top-right corner.

          <div className="fixed top-4 right-4 z-[9999999] font-solo">
            <motion.div
              layout
              initial={{ opacity: 0, y: -50, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{
                opacity: 0,

                x: 100,

                scale: 0.8,

                transition: { duration: 0.2 },
              }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="relative w-80 max-w-sm overflow-hidden rounded-xl border border-green-500 bg-gradient-to-br from-gray-900 to-black p-4 shadow-lg shadow-green-500/30"
            >
              <div className="flex items-start gap-3">
                <FontAwesomeIcon
                  icon={faCheckCircle}
                  className="mt-1 flex-shrink-0 text-2xl text-green-400"
                />
                <div className="flex-1">
                  <h3 className="font-bold tracking-wide text-white">
                    Quest Scheduled!
                  </h3>

                  <p className="text-sm text-gray-300">
                    Your new quest, "
                    <em>
                      {localStorage.getItem("inputText") || "Unnamed Quest"}
                    </em>
                    ", has been created.
                  </p>
                </div>
              </div>
              <motion.div
                className="absolute bottom-0 left-0 h-1 bg-green-500"
                initial={{ width: "100%" }}
                animate={{ width: "0%" }}
                transition={{ duration: 1, ease: "linear" }}
              />{" "}
            </motion.div>
          </div>,

          document.body
        )}
    </div>
  );
}

export default QuestCreationForm;
