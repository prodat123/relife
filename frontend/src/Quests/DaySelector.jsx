import {
  faAngleDown,
  faAngleUp,
  faCalendar,
  faPlusCircle,
  faSpinner,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React, {
  useState,
  useEffect,
  useRef,
  useContext,
  useCallback,
  useMemo,
} from "react";
import config from "../config";
import axios from "axios";
import { UserContext } from "../Account/UserContext";

// Cache for API responses
const apiCache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

function DaySelector({
  questId,
  scheduledDays,
  updateScheduledQuests,
  day,
  loadingQuests = [],
  setLoadingQuests,
}) {
  const userId = JSON.parse(localStorage.getItem("user"))?.id;
  const { fetchAccountData } = useContext(UserContext);
  const [showDays, setShowDays] = useState(null);
  const [selectedDays, setSelectedDays] = useState([]);
  const [savedScheduledDays, setSavedScheduledDays] = useState(
    scheduledDays || {}
  );
  const [isScheduled, setIsScheduled] = useState(false);
  const [loading, setLoading] = useState(true);
  const dropdownRef = useRef(null);

  // Refs for caching
  const scheduledDaysRef = useRef(null);

  // Memoized days array
  const days = useMemo(
    () => [
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
      "Sunday",
    ],
    []
  );

  // Cached API call function
  const cachedApiCall = useCallback(async (url, data = {}, cacheKey = null) => {
    const key = cacheKey || `${url}${JSON.stringify(data)}`;
    const now = Date.now();

    if (apiCache.has(key)) {
      const cached = apiCache.get(key);
      if (now - cached.timestamp < CACHE_DURATION) {
        return cached.data;
      }
    }

    const response = await axios.post(url, data, { withCredentials: true });
    apiCache.set(key, { data: response.data, timestamp: now });
    return response.data;
  }, []);

  const toggleDays = useCallback((e, questId) => {
    e.stopPropagation();
    setShowDays((prev) => (prev === questId ? null : questId));
  }, []);

  useEffect(() => {
    if (savedScheduledDays[questId]) {
      setIsScheduled(true);
      setSelectedDays(savedScheduledDays[questId]);
    }
  }, [questId, savedScheduledDays]);

  const buttonRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target)
      ) {
        setShowDays(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Optimized quest scheduling
  const scheduleQuest = useCallback(
    async (selectedDays) => {
      const cacheKey = `schedule_quest_${questId}_${userId}`;

      try {
        const response = await cachedApiCall(
          `${config.backendUrl}/schedule-quest`,
          {
            quest_id: questId,
            user_id: userId,
            days: selectedDays,
          },
          cacheKey
        );
        return response;
      } catch (error) {
        console.error("Error scheduling quest:", error);

        const errorMessage =
          error.response?.data?.error || "An unexpected error occurred";

        alert(errorMessage);

        return { success: false, error: errorMessage };
      }
    },
    [questId, userId, cachedApiCall]
  );

  const handleCheckboxChange = useCallback((day) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  }, []);

  const handleSubmit = useCallback(
    async (updatedDays = "") => {
      var daysToSubmit;

      if (updatedDays !== "") {
        daysToSubmit = updatedDays;
      } else {
        daysToSubmit = selectedDays;
      }

      const res = await scheduleQuest(daysToSubmit);

      if (res.success) {
        setShowDays(false);
        updateScheduledQuests();

        // Remove questId after it's done
        setLoadingQuests((prev) => prev.filter((id) => id !== questId));

        // Clear cache since data changed
        scheduledDaysRef.current = null;
      }
    },
    [
      selectedDays,
      scheduleQuest,
      updateScheduledQuests,
      setLoadingQuests,
      questId,
    ]
  );

  const addDay = useCallback(
    async (day) => {
      // Add questId to loading list
      setLoadingQuests((prev) => [...prev, questId]);

      if (!selectedDays.includes(day)) {
        const updatedDays = [...selectedDays, day];
        setSelectedDays(updatedDays);
        await handleSubmit(updatedDays);
      }
    },
    [selectedDays, setLoadingQuests, questId, handleSubmit]
  );

  return (
    <div className="py-2 relative">
      {day ? (
        <>
          {selectedDays.includes(day) ? (
            <p className="font-solo text-primary font-bold">
              {"< " + `Scheduled for ${day}` + " >"}
            </p>
          ) : (
            <button
              onClick={() => addDay(day)}
              disabled={loadingQuests?.includes(questId)}
              className="text-white rounded flex items-center gap-2 text-left transition hover:text-blue-300"
            >
              {console.log(loadingQuests)}
              {loadingQuests?.includes(questId) ? (
                <FontAwesomeIcon
                  icon={faSpinner}
                  spin
                  className="text-blue-400"
                />
              ) : (
                <>
                  <FontAwesomeIcon icon={faCalendar} className="mr-1" />
                  Add {day}
                </>
              )}
            </button>
          )}
        </>
      ) : (
        <>
          <button
            onClick={(e) => {
              // ✅ Conditionally run another function
              toggleDays(e, questId);
            }}
            ref={buttonRef}
            onMouseDown={(e) => e.stopPropagation()}
            className="text-white rounded flex items-center gap-2 text-left transition hover:text-blue-300"
          >
            <FontAwesomeIcon icon={faCalendar} className="mr-1" />
            {showDays === questId ? (
              <>
                Hide Schedule <FontAwesomeIcon icon={faAngleUp} />
              </>
            ) : isScheduled ? (
              <div className="grid grid-cols-7 gap-2">
                {days.map((day) => {
                  const isDayScheduled = selectedDays.includes(day);

                  return (
                    <div
                      key={day}
                      className={`w-4 h-4 lg:w-6 lg:h-6 flex items-center justify-center rounded-sm text-md font-medium ${
                        isDayScheduled
                          ? "bg-primary text-text"
                          : "bg-gray-300 text-black"
                      }`}
                      title={day}
                    >
                      {day[0]} {/* Show first letter (e.g., M for Monday) */}
                    </div>
                  );
                })}
              </div>
            ) : (
              <>
                Schedule <FontAwesomeIcon icon={faPlusCircle} />
              </>
            )}
          </button>

          {showDays && (
            <div
              ref={dropdownRef}
              className="relative z-50 mt-2 left-0 bg-gray-800 rounded-md shadow-lg p-4 w-full pointer-events-auto border border-primary"
              onClick={(e) => e.stopPropagation()}
            >
              <p className="text-white text-sm font-semibold mb-2">
                Repeat Every:
              </p>
              <div className="flex flex-wrap gap-2">
                {days.map((day) => {
                  const isSelected = selectedDays.includes(day);
                  return (
                    <label
                      key={day}
                      className={`cursor-pointer px-3 py-1 rounded-full text-sm font-semibold transition duration-200 ${
                        isSelected
                          ? "bg-primary text-white hover:bg-primary"
                          : "bg-gray-700 text-gray-300 hover:bg-primary hover:text-white"
                      }`}
                    >
                      <input
                        type="checkbox"
                        name="days"
                        value={day}
                        checked={isSelected}
                        onChange={() => handleCheckboxChange(day)}
                        className="hidden"
                      />
                      {day}
                    </label>
                  );
                })}
              </div>
              <button
                className="w-full mt-4 py-2 bg-primary text-white rounded-md hover:bg-blue-400 hover:scale-[1.02] transition font-bold"
                onClick={() => handleSubmit()}
              >
                Save
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default DaySelector;
