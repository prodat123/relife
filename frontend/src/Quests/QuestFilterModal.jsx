import React, { useRef, useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faAward,
  faBrain,
  faCalendar,
  faCalendarDay,
  faDiamond,
  faDumbbell,
  faHeart,
  faMapMarkedAlt,
  faRunning,
  faThumbTack,
} from "@fortawesome/free-solid-svg-icons";
import { BeatLoader } from "react-spinners";
import DaySelector from "./DaySelector"; // adjust path accordingly

export default function QuestFilterModal({
  isOpen,
  onClose,
  tags,
  selectedTags,
  setSelectedTags,
  selectedDifficulty,
  setSelectedDifficulty,
  selectedStat,
  setSelectedStat,
  maxDifficulty,
  getDifficultyGrade,
  quests = [],
  selectedQuests = [],
  completedQuests = [],
  activeQuests = [],
  extraSlots = 0,
  openDaySelector = () => {},
  xpBoost = 0,
  daySelectorOpen = {},
  scheduledDays = {},
  updateScheduledQuests = () => {},
}) {
  const modalRef = useRef();
  const dropdownRef = useRef();

  const [searchTerm, setSearchTerm] = useState("");
  const [openTags, setOpenTags] = useState(false);
  const [loading, setLoading] = useState(false);

  const toggleTag = (tag) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const getFilteredQuests = () => {
    return quests.filter((quest) => {
      const matchesTags =
        selectedTags.length === 0 ||
        selectedTags.every((tag) => quest.tags.includes(tag));
      const matchesDifficulty =
        !selectedDifficulty || quest.difficulty === selectedDifficulty;
      const matchesStat = !selectedStat || quest.stat === selectedStat;
      const matchesSearch =
        searchTerm === "" ||
        quest.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        quest.description.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesTags && matchesDifficulty && matchesStat && matchesSearch;
    });
  };

  const filteredQuests = getFilteredQuests();
  const visibleQuests = filteredQuests; // you can add pagination or other logic here

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        modalRef.current &&
        !modalRef.current.contains(event.target) &&
        (!dropdownRef.current || !dropdownRef.current.contains(event.target))
      ) {
        onClose();
      }
    };
    if (isOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div
        ref={modalRef}
        className="bg-gray-800 text-white p-6 rounded-lg max-w-6xl w-full overflow-y-auto max-h-[90vh]"
      >
        <h1 className="text-2xl font-bold mb-4">
          <FontAwesomeIcon icon={faThumbTack} /> Recommended Quests
        </h1>
        <p className="mb-4 text-gray-300">
          Search up the type of quests you need and unlock higher difficulties
          as you level up!
        </p>

        <div className="mb-4">
          <input
            type="text"
            placeholder="Search quests..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 rounded-md bg-gray-700 text-white focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-4 mb-4 flex-wrap">
          <div className="relative inline-block text-left">
            <button
              onClick={() => setOpenTags(!openTags)}
              className="bg-gray-700 text-white rounded px-4 py-2"
            >
              {selectedTags.length > 0
                ? selectedTags.join(", ").slice(0, 10) +
                  (selectedTags.join(", ").length > 10 ? "…" : "")
                : "Filter by Tags"}
            </button>

            {openTags && (
              <div
                ref={dropdownRef}
                className="absolute z-10 mt-2 w-[500px] bg-gray-600 rounded-md shadow-lg p-4 max-h-60 overflow-y-auto"
              >
                <label className="flex items-center space-x-3 mb-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedTags.length === 0}
                    onChange={() => setSelectedTags([])}
                    className="w-5 h-5"
                  />
                  <span className="text-white text-sm font-semibold">
                    Clear All Filters
                  </span>
                </label>

                <div className="grid grid-cols-4 gap-2">
                  {[...tags]
                    .sort((a, b) => a.localeCompare(b))
                    .map((tag) => (
                      <label
                        key={tag}
                        className="flex items-center space-x-2 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={selectedTags.includes(tag)}
                          onChange={() => toggleTag(tag)}
                          className="w-4 h-4"
                        />
                        <span className="text-white text-xs">{tag}</span>
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
              const value = e.target.value ? parseInt(e.target.value) : null;
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
              (stat) => (
                <option key={stat} value={stat}>
                  {stat.charAt(0).toUpperCase() + stat.slice(1)}
                </option>
              )
            )}
          </select>
        </div>

        <div className="max-w-full mx-auto">
          {loading ? (
            <BeatLoader
              color="#36d7b7"
              loading={loading}
              size={10}
              margin={2}
            />
          ) : (
            <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {visibleQuests.map((quest) => {
                const isActive = selectedQuests.includes(quest.id);
                const isCompleted = completedQuests.includes(quest.id);
                const disabled =
                  isCompleted ||
                  (activeQuests.length >= 4 + extraSlots && !isActive);

                return (
                  <li
                    key={`quest-${quest.id}`}
                    className={`
                                            relative text-white border-2 shadow-md rounded-md bg-gray-700 cursor-pointer 
                                            transition-all overflow-hidden p-5
                                            ${
                                              disabled
                                                ? "cursor-not-allowed opacity-60"
                                                : "hover:shadow-xl"
                                            }
                                            ${
                                              quest.difficulty === 1
                                                ? "border-green-500"
                                                : quest.difficulty === 2
                                                ? "border-teal-500"
                                                : quest.difficulty === 3
                                                ? "border-blue-500"
                                                : quest.difficulty === 4
                                                ? "border-indigo-500"
                                                : quest.difficulty === 5
                                                ? "border-purple-500"
                                                : quest.difficulty === 6
                                                ? "border-pink-500"
                                                : quest.difficulty === 7
                                                ? "border-orange-500"
                                                : quest.difficulty === 8
                                                ? "border-amber-600"
                                                : quest.difficulty === 9
                                                ? "border-red-600"
                                                : quest.difficulty === 10
                                                ? "border-red-800"
                                                : "border-gray-400"
                                            }
                                        `}
                    onClick={() => !disabled && openDaySelector(quest.id)}
                  >
                    <h3 className="text-lg font-bold mb-2">
                      {quest.name}{" "}
                      <FontAwesomeIcon
                        icon={
                          quest.type === "daily"
                            ? faCalendarDay
                            : faMapMarkedAlt
                        }
                      />
                    </h3>
                    <p className="text-sm">{quest.description}</p>

                    <div className="flex gap-2 flex-wrap mt-2">
                      {JSON.parse(quest.tags).map((tag) => (
                        <span
                          key={tag}
                          className="px-3 py-1 bg-indigo-600 rounded-full text-xs"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>

                    {quest.type === "journey" && (
                      <div className="mt-4 inline-flex items-center gap-2 text-green-300 font-medium text-md">
                        <FontAwesomeIcon icon={faCalendar} />
                        <span>Period: {quest.period} days</span>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
