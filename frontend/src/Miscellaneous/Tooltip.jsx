import React, { forwardRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

const Tooltip = forwardRef(
  ({ isOpen, content, style, cursorX, cursorY }, ref) => {
    if (!isOpen || !content || !style) {
      return null;
    }

    const { transform, ...restOfStyle } = style || {};

    return (
      <AnimatePresence>
        <motion.div
          ref={ref}
          // 2. Apply the static styles (position, top, left) here
          style={restOfStyle}
          // 3. Give the transform directly to Framer Motion to animate
          //    This combines positioning with your other animations (opacity, scale).
          animate={{
            opacity: 1,
            scale: 1,
            transform: transform, // Use the transform from the positioning library
          }}
          initial={{
            opacity: 0,
            scale: 0.9,
            transform: `translate(${cursorX - 120}, ${cursorY - 120})`, // <-- ADD THIS LINE
          }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ duration: 0.18, ease: "easeOut" }}
          className="fixed pointer-events-none bg-slate-900 border border-slate-700 rounded-lg p-4 w-64 text-sm text-slate-300 shadow-lg z-[9999]"
        >
          {React.isValidElement(content) ? (
            // If content is a custom component/JSX, render it directly
            content
          ) : (
            <>
              {/* Title with rarity color */}
              <h3
                className={`font-bold text-lg mb-2 ${getRarityColor(
                  content.rarity
                )}`}
              >
                {content.name}
              </h3>

              {/* Type / Description */}
              {content.type && (
                <p className="italic text-slate-400 mb-2">{content.type}</p>
              )}
              {content.description && <p>{content.description}</p>}

              {/* Stats */}
              {content.stats && (
                <div className="border-t border-slate-700 mt-3 pt-3">
                  {Object.entries(content.stats).map(([key, value]) => (
                    <p key={key} className="flex justify-between">
                      <span className="capitalize text-slate-400">{key}:</span>
                      <span className="font-semibold text-green-400">
                        +{value}
                      </span>
                    </p>
                  ))}
                </div>
              )}

              {/* Flavor text */}
              {content.flavorText && (
                <p className="italic text-slate-500 mt-3 pt-3 border-t border-slate-700">
                  "{content.flavorText}"
                </p>
              )}
            </>
          )}
        </motion.div>
      </AnimatePresence>
    );
  }
);

// Helper: rarity → color (This function is correct and needs no changes)
const getRarityColor = (rarity) => {
  switch (rarity) {
    case "Common":
      return "text-white";
    case "Uncommon":
      return "text-green-400";
    case "Rare":
      return "text-blue-400";
    case "Epic":
      return "text-purple-400";
    case "Legendary":
      return "text-orange-400";
    default:
      return "text-slate-300";
  }
};

export default Tooltip;
