import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes, faCalendar } from "@fortawesome/free-solid-svg-icons";
import config from "../config";
import axios from "axios";
import { createPortal } from "react-dom";

export const QuestEditModal = ({ isOpen, onClose, quest, onUpdate }) => {
  const [formData, setFormData] = useState(null);
  const [initialFormData, setInitialFormData] = useState(null);
  const userId = JSON.parse(localStorage.getItem("user"))?.id;

  // This effect now cleans up the data when a quest is selected,
  // creating a single source of truth for the schedule.
  useEffect(() => {
    if (quest) {
      const cleanSchedule = quest.schedule || {
        type: quest.type || "specific",
        days: [],
        time: quest.time || "12:00",
        startDate: new Date().toISOString().split("T")[0],
      };

      const initialData = {
        ...quest,
        schedule: cleanSchedule,
      };
      setFormData(initialData);
      setInitialFormData(initialData);
    }
  }, [quest]);

  // A single, smart handler for all form inputs
  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.includes(".")) {
      const [parentKey, childKey] = name.split(".");
      setFormData((prev) => ({
        ...prev,
        [parentKey]: { ...prev[parentKey], [childKey]: value },
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const toggleWeeklyDay = (day) => {
    setFormData((prev) => {
      const currentDays = prev.schedule.days || [];
      const newDays = currentDays.includes(day)
        ? currentDays.filter((d) => d !== day)
        : [...currentDays, day];
      return { ...prev, schedule: { ...prev.schedule, days: newDays } };
    });
  };

  const handleUpdateQuest = async () => {
    try {
      // The payload now correctly uses the cleaned formData
      const payload = {
        name: formData.name,
        description: formData.description,
        schedule: formData.schedule, // Send the clean, nested schedule object
      };

      await axios.put(`${config.backendUrl}/quest/${formData.id}`, payload, {
        withCredentials: true,
      });

      if (onUpdate) onUpdate();
      onClose();
    } catch (err) {
      console.error("Error updating quest:", err);
      alert("Something went wrong while saving your changes.");
    }
  };

  const deleteQuest = async (questId) => {
    try {
      await axios.delete(`${config.backendUrl}/quests/${questId}`, {
        withCredentials: true,
      });
      onUpdate();
      onClose();
      // Add logic to refresh your quest list here
    } catch (error) {
      console.error("Failed to delete quest:", error);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    handleUpdateQuest();
  };

  useEffect(() => {
    // This function will be our event handler
    const handleKeyDown = (event) => {
      // Check if the modal is not open
      if (!isOpen) return;

      // Check which key was pressed
      const isDeleteKey = event.key === "Delete";
      const isBackspaceKey = event.key === "Backspace";

      if (isDeleteKey || isBackspaceKey) {
        // IMPORTANT: Check if the user is currently focused on an input,
        // select, or textarea. If so, we don't want to delete the quest.
        const activeElement = document.activeElement;
        const isTyping = ["INPUT", "SELECT", "TEXTAREA"].includes(
          activeElement.tagName
        );

        if (!isTyping) {
          // If not typing, prevent default browser action (like navigating back)
          event.preventDefault();
          // and delete the quest.
          deleteQuest(formData.id);
        }
      }
    };

    // Add the event listener to the whole document
    document.addEventListener("keydown", handleKeyDown);

    // This is the cleanup function. It runs when the component unmounts
    // or before the effect runs again. It's crucial for preventing memory leaks.
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, formData, deleteQuest]); // Rerun the effect if these dependencies change

  if (!isOpen || !formData) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[999999] flex justify-end">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={(e) => {
              e.stopPropagation();
              const hasChanges =
                JSON.stringify(formData) !== JSON.stringify(initialFormData);

              if (hasChanges) {
                // 2. If there are changes, save them
                handleUpdateQuest(); // This function already calls onClose on success
              } else {
                // 3. If no changes, just close the modal without saving
                onClose();
              }
            }}
            className="absolute inset-0 bg-black bg-opacity-60"
          />
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="relative w-full max-w-sm h-full bg-[#1e1e2f] border-l border-gray-700 shadow-lg p-6 flex flex-col"
          >
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-700">
              <h2 className="text-2xl font-bold font-solo text-white">
                Edit Quest
              </h2>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onClose();
                }}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <FontAwesomeIcon icon={faTimes} size="lg" />
              </button>
            </div>
            <form
              onSubmit={handleSubmit}
              className="flex-grow flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex-grow space-y-6 overflow-y-auto pr-2">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Quest Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name || ""}
                    onChange={handleChange}
                    className="w-full bg-gray-800 border border-gray-600 rounded-md p-2 text-white"
                  />
                </div>
                <div className="space-y-4">
                  <h3 className="text-lg font-bold font-solo text-gray-200">
                    <FontAwesomeIcon icon={faCalendar} className="mr-2" />
                    Schedule
                  </h3>
                  <div className="flex items-center gap-4">
                    {/* <label
                      htmlFor="scheduleType"
                      className="font-semibold text-gray-300"
                    >
                      Repeats:
                    </label> */}
                    <select
                      id="scheduleType"
                      name="schedule.type"
                      value={formData.schedule.type}
                      onChange={handleChange}
                      className="flex-1 p-2 border rounded bg-gray-800 border-gray-600 text-white"
                    >
                      <option value="weekly">Weekly</option>
                      <option value="daily">Daily</option>
                      <option value="specific">On a specific date</option>
                    </select>
                  </div>
                  {formData.schedule.type === "weekly" && (
                    <div>
                      <p className="font-semibold text-gray-300 mb-2">
                        On these days:
                      </p>
                      <div className="grid grid-cols-4 gap-2">
                        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(
                          (day) => (
                            <button
                              type="button"
                              key={day}
                              onClick={() => toggleWeeklyDay(day)}
                              className={`py-2 px-3 rounded transition-colors border ${
                                formData.schedule.days.includes(day)
                                  ? "bg-blue-600 text-white border-blue-500"
                                  : "bg-gray-800 text-gray-300 border-gray-600 hover:border-gray-500"
                              }`}
                            >
                              {day}
                            </button>
                          )
                        )}
                      </div>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label
                        htmlFor="time"
                        className="block text-gray-300 font-semibold mb-1"
                      >
                        Time:
                      </label>
                      <input
                        type="time"
                        id="time"
                        name="schedule.time"
                        value={formData.schedule.time || ""}
                        onChange={handleChange}
                        className="w-full p-2 border rounded bg-gray-800 border-gray-600 text-white"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="startDate"
                        className="block text-gray-300 font-semibold mb-1"
                      >
                        Starting On:
                      </label>
                      <input
                        type="date"
                        id="startDate"
                        name="schedule.startDate"
                        value={formData.schedule.startDate || ""}
                        onChange={handleChange}
                        className="w-full p-2 border rounded bg-gray-800 border-gray-600 text-white"
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-6 pt-4 border-t border-gray-700 flex justify-between">
                <button
                  type="button"
                  className="text-red-500 hover:text-red-400 font-semibold"
                  onClick={() => deleteQuest(formData.id)}
                >
                  Delete Quest
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
};
