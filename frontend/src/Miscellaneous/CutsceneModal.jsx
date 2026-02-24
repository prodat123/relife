import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function CutsceneModal({ scenes, onClose, delay = 10000 }) {
  const [currentScene, setCurrentScene] = useState(0);
  const [showFinalScene, setShowFinalScene] = useState(false);

  useEffect(() => {
    if (showFinalScene) {
      const finalTimer = setTimeout(() => {
        onClose();
        window.location.href = "/dashboard";
      }, 6000);
      return () => clearTimeout(finalTimer);
    }

    const currentDelay = scenes[currentScene]?.delay || 5000;

    const timer = setTimeout(() => {
      const nextScene = currentScene + 1;

      if (nextScene >= scenes.length) {
        setShowFinalScene(true);
      } else {
        setCurrentScene(nextScene);
      }
    }, currentDelay);

    return () => clearTimeout(timer);
  }, [currentScene, scenes, showFinalScene, onClose]);

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.3 },
    },
  };

  const systemNoticeVariants = {
    hidden: { opacity: 0, y: -20 },
    show: {
      opacity: 1,
      y: 0,
      transition: { duration: 1 },
    },
  };

  const wordVariants = {
    hidden: { opacity: 0, y: 20 },
    show: (i) => ({
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.8,
        delay: 2 + i * 0.5, // wait 2s after system notice appears
      },
    }),
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center">
      <div className="relative w-full max-w-4xl h-[80%] flex flex-col items-center justify-center text-center text-white p-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentScene}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            transition={{ duration: 1 }}
            className="flex flex-col items-center"
          >
            {showFinalScene ? (
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="show"
                className="flex flex-col items-center space-y-8"
              >
                {/* System Notice in gold */}
                <motion.div
                  variants={systemNoticeVariants}
                  initial="hidden"
                  animate="show"
                  className="px-8 py-4 bg-black/90 rounded-lg shadow-lg"
                >
                  <h1 className="lg:text-4xl text-[1rem] font-solo tracking-wide text-yellow-400 drop-shadow-[0_0_12px_rgba(255,215,0,0.9)]">
                    [System Notice]
                  </h1>
                </motion.div>

                {/* Animated welcome text */}
                <motion.div
                  variants={containerVariants}
                  initial="hidden"
                  animate="show"
                  className="flex flex-col items-center justify-center gap-6"
                >
                  {["Welcome", "to", "ReLIFE", "Habits"].map((word, i) => (
                    <motion.h1
                      key={i}
                      custom={i}
                      variants={wordVariants}
                      className={`lg:text-[5rem] text-5xl font-extrabold font-solo tracking-[0.15em] ${
                        word === "ReLIFE"
                          ? "text-blue-400 drop-shadow-[0_0_20px_rgba(0,150,255,0.9)]"
                          : "text-white"
                      }`}
                    >
                      {word}
                    </motion.h1>
                  ))}
                </motion.div>
              </motion.div>
            ) : (
              <>
                {/* <img
                  src={scenes[currentScene].image}
                  alt=""
                  className="max-h-80 mb-6 rounded shadow-lg"
                /> */}
                <p className="text-3xl font-solo max-w-2xl">
                  {scenes[currentScene].text}
                </p>
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
