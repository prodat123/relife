import React from "react";
import { useFont } from "../Miscellaneous/FontProvider";

const FontSelector = () => {
  const { font, setFont, fontOptions } = useFont();

  return (
    <div className="p-4 bg-slate-800 rounded-lg shadow-lg">
      <h3 className="text-lg font-bold text-white mb-3">Display Font</h3>
      <div className="flex flex-wrap gap-2">
        {Object.entries(fontOptions).map(([key, option]) => (
          <button
            key={key}
            onClick={() => setFont(key)}
            className={`px-4 py-2 text-sm rounded-md transition-all duration-200 ${
              font === key
                ? "bg-amber-500 text-white font-bold shadow-md"
                : "bg-slate-600 text-slate-300 hover:bg-slate-500"
            }`}
          >
            {option.name}
          </button>
        ))}
      </div>
    </div>
  );
};

export default FontSelector;
