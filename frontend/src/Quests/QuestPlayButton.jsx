import { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheck, faPlay, faTimes } from "@fortawesome/free-solid-svg-icons";
import ReactDOM from "react-dom";
import { motion, AnimatePresence } from "framer-motion";

export default function QuestPlayButton({
  quest,
  completedQuests,
  loadingQuests,
  finishQuest,
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes default
  const [isRunning, setIsRunning] = useState(false);

  const openTimerModal = () => {
    setTimeLeft(300); // reset timer
    setIsModalOpen(true);
    setIsRunning(true);
  };

  const closeTimerModal = () => {
    setIsModalOpen(false);
    setIsRunning(false);
  };

  // countdown effect
  useEffect(() => {
    let timer;
    if (isRunning && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isRunning, timeLeft]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const modalVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: { type: "spring", stiffness: 120, damping: 15 },
    },
    exit: { opacity: 0, scale: 0.8, transition: { duration: 0.2 } },
  };

  return (
    <>
      {/* Play Button */}
      <button
        onClick={finishQuest}
        disabled={
          completedQuests.includes(quest.id) || loadingQuests.length > 0
        }
        className={`
          w-16 h-16 flex items-center justify-center border-2 rounded-full bg-primary transition-all duration-200
          ${
            completedQuests.includes(quest.id) || loadingQuests.length > 0
              ? "bg-gray-600 border-primary cursor-not-allowed"
              : "border-blue-500 bg-blue-500/70 hover:bg-blue-600 hover:border-blue-500 cursor-pointer"
          }
        `}
      >
        <FontAwesomeIcon
          icon={faCheck}
          className={`w-6 h-6 ${
            completedQuests.includes(quest.id) || loadingQuests.length > 0
              ? "text-gray-600"
              : "text-text"
          }`}
        />
      </button>

      {/* Timer Modal */}
      {/* {isModalOpen &&
        ReactDOM.createPortal(
          <AnimatePresence>
            {isModalOpen && (
              <motion.div
                key="quest-timer"
                className="fixed inset-0 bg-background flex flex-col items-center justify-center z-50"
                variants={modalVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
              >
                <div className="flex flex-col items-center justify-center h-full w-full text-center">
                  <h2 className="text-3xl font-bold text-white mb-8">
                    Quest Timer
                  </h2>
                  <div className="text-8xl font-solo font-extrabold text-text mb-12">
                    {formatTime(timeLeft)}
                  </div>
                </div>

                <div className="absolute flex flex-row items-center justify-center gap-3 top-3/4">
                  <button
                    onClick={closeTimerModal}
                    className="bg-red-500 text-white px-4 py-2 rounded-md font-bold"
                  >
                    End
                  </button>
                  <button
                    onClick={finishQuest}
                    className="bg-primary text-white px-4 py-2 rounded-md font-bold"
                  >
                    Complete
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body // mount modal at <body>, not inside parent
        )} */}
    </>
  );
}
