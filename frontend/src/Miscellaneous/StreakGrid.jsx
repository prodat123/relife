import React, { useState, useEffect } from "react";
import config from "../config";
import { useTooltip } from "./TooltipProvider";

// --- A robust, timezone-safe helper function ---
const formatDateToYYYYMMDD = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const StreakGrid = ({ userId }) => {
  const [activityData, setActivityData] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const { showTooltip, hideTooltip } = useTooltip();

  const statColors = {
    strength: "bg-rose-500",
    endurance: "bg-emerald-500",
    bravery: "bg-sky-500",
    intelligence: "bg-amber-500",
    default: "bg-gray-500",
  };

  useEffect(() => {
    // Make sure the userId prop is being passed correctly!
    if (!userId) {
      console.log("No userId provided, skipping fetch.");
      setIsLoading(false);
      return;
    }

    const fetchHistory = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(
          `${config.backendUrl}/quests/completion-history?userId=${userId}`
        );
        if (!response.ok) {
          throw new Error(
            `Network response was not ok. Status: ${response.status}`
          );
        }
        const data = await response.json();
        setActivityData(data);
        // Log the data when it's received to confirm it's correct
        console.log("Data successfully received from backend:", data);
      } catch (error) {
        console.error("Failed to fetch streak data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchHistory();
  }, [userId]);

  const generateGrid = () => {
    const grid = [];
    const today = new Date();

    for (let i = 365; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);

      // Use the robust helper function here to avoid timezone errors
      const dateString = formatDateToYYYYMMDD(date);

      const dayData = activityData[dateString];
      const colorClass = dayData
        ? statColors[dayData.dominant_stat] || statColors.default
        : "bg-gray-800";

      // NEW: Create a content object for the tooltip
      let tooltipContent;
      if (dayData) {
        tooltipContent = {
          name: dateString, // The date will be the title
          type: `Dominant Stat: ${dayData.dominant_stat}`, // Use 'type' for the stat
          description: `Completed ${dayData.quest_count} quest(s).`,
        };
      } else {
        tooltipContent = {
          name: dateString,
          description: "No quests completed.",
        };
      }

      grid.push(
        <div
          key={dateString}
          className={`w-5 h-5 rounded-md transition-transform hover:scale-125 ${colorClass}`}
          // title={tooltipText}
          onMouseEnter={(e) => showTooltip(tooltipContent, e)}
          onMouseLeave={hideTooltip}
        />
      );
    }
    return grid;
  };

  // ... (rest of the component is the same)
  if (isLoading) {
    return (
      <div className="bg-gray-900 p-4 rounded-lg text-center text-gray-400">
        Loading activity...
      </div>
    );
  }

  return (
    <div className="bg-gray-900 p-4 rounded-md border border-gray-700">
      <h3 className="text-white font-solo tracking-widest font-bold mb-4">
        Quest Streak
      </h3>
      <div className="flex flex-wrap gap-2">{generateGrid()}</div>
    </div>
  );
};

export default StreakGrid;
