import { useContext, useEffect, useState } from "react";
import { UserContext } from "../Account/UserContext";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

const ExperienceDisplay = () => {
    const { accountDataRef } = useContext(UserContext);
    const [experience, setExperience] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            if (accountDataRef.current && accountDataRef.current.experience !== undefined) {
                setExperience(accountDataRef.current.experience);
            }
        }, 1000); // You can reduce or increase this as needed

        return () => clearInterval(interval);
    }, []);

    function calculateLevel(experience) {
        let level = 1;
        let xpForNextLevel = 100;

        while (experience >= xpForNextLevel) {
            level++;
            experience -= xpForNextLevel;
            xpForNextLevel = 100 * Math.pow(1.05, (level - 1));
        }

        return { level, remainingXP: experience, xpForNextLevel };
    }

    return (
        <div className="hidden md:flex relative lg:w-[250px] md:w-[150px]">
            <div className="relative lg:w-[250px] md:w-[150px] h-8">
                {/* Progress Bar Overlay */}
                <div className="absolute top-0 left-0 lg:w-[250px] md:w-[150px] h-full flex items-center lg:px-2 md:pr-4 z-10">
                    <div className="w-full bg-gray-200 h-4 overflow-hidden rounded-md border border-1 border-purple-200">
                        <p className="absolute text-xs text-black px-2">XP to level up: {experience ? Math.floor(calculateLevel(experience).xpForNextLevel - calculateLevel(experience).remainingXP) : 0}</p>

                        <div
                            className="bg-gradient-to-r from-blue-300 to-blue-500 h-4 rounded-md"
                            style={{ width: `${(calculateLevel(experience).remainingXP / calculateLevel(experience).xpForNextLevel) * 100}%` }}
                        >

                        </div>

                    </div>

                </div>

            </div>
        </div>
    );
};

export default ExperienceDisplay;
