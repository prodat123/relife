import { useContext, useEffect, useState } from "react";
import { UserContext } from "../Account/UserContext";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

const LevelDisplay = () => {
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
        <>
            <div className='text-yellow-400 font-bold ml-3 hidden md:flex'>Lvl.{experience ? calculateLevel(experience).level : 0}</div>

        </>
    );
};

export default LevelDisplay;
