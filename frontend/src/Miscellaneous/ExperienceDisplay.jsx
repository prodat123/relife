import { useContext, useEffect, useState } from "react";
import { UserContext } from "../Account/UserContext";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

const ExperienceDisplay = () => {
  const { accountDataRef } = useContext(UserContext);
  const [experience, setExperience] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      if (
        accountDataRef.current &&
        accountDataRef.current.experience !== undefined
      ) {
        setExperience(accountDataRef.current.experience);
      }
    }, 1000); // You can reduce or increase this as needed

    return () => clearInterval(interval);
  }, []);

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

  return (
    <div className="hidden md:flex items-center space-x-2 mx-3">
      {/* XP Bar Container */}
      <div className="relative lg:w-[250px] md:w-[150px] h-8">
        {/* XP Bar Overlay */}
        <div className="absolute top-0 left-0 w-full h-full flex items-center px-2 z-10">
          <div className="w-full bg-gray-200 h-4 overflow-hidden rounded-md border border-purple-200 relative">
            {/* XP Text */}
            <p className="absolute text-xs text-black px-2 z-20">
              XP to level up:{" "}
              {experience
                ? Math.floor(
                    calculateLevel(experience).xpForNextLevel -
                      calculateLevel(experience).remainingXP
                  ) + 1
                : 0}
            </p>

            {/* XP Fill */}
            <div
              className="bg-gradient-to-r from-blue-300 to-blue-500 h-4 rounded-md transition-all duration-300"
              style={{
                width: experience
                  ? `${
                      (calculateLevel(experience).remainingXP /
                        calculateLevel(experience).xpForNextLevel) *
                      100
                    }%`
                  : "0%",
              }}
            />
          </div>
        </div>
      </div>

      {/* Level Display */}
      <div className="text-yellow-400 font-bold whitespace-nowrap">
        Lvl.{experience ? calculateLevel(experience).level : 0}
      </div>
    </div>
  );
};

export default ExperienceDisplay;
