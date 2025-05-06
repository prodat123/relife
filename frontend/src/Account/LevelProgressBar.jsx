import { faBars, faFire, faStar, faStarHalfAlt, faStarOfLife } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React from 'react';

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

function LevelProgressBar({ experience }) {
    const { level, remainingXP, xpForNextLevel } = calculateLevel(experience);
    console.log(experience);
    const progress = (remainingXP / xpForNextLevel) * 100; // Calculate the progress as a percentage

    return (
        <div className="w-full">
            {/* Level Info */}
            <div className="relative mt-4 mx-4">
                {/* Background Image */}
                {/* <img 
                    src={"/sprites/UI/exp number.png"} 
                    alt="Experience Background" 
                    className="pixel-art absolute inset-0 w-full h-full z-0"
                /> */}

                {/* Level Text */}
                <h2 className="text-2xl font-semibold relative z-60 text-center">
                    <FontAwesomeIcon icon={faStarOfLife} /> Level: {level} <FontAwesomeIcon icon={faStarOfLife} />
                </h2>
            </div>

            
            

            <div className="relative w-full max-w-md mx-auto">
                {/* XP Bar Header */}
                <div className="flex justify-between mt-1 px-2">
                    <span className="text-sm">XP Progress</span>
                    <span className="text-sm">{Math.floor(progress)}%</span>
                </div>
                
                {/* XP Bar Container */}
                <div className="relative w-full px-2">
                    <div className="relative w-full h-8 rounded-full overflow-hidden">
                        {/* Progress Bar */}
                        <div className="absolute top-0 left-0 w-full rounded-full h-full flex items-center">
                        <div className="relative w-full bg-gray-300 h-4 rounded-full border border-2 overflow-hidden">
                            <div
                            className="bg-gradient-to-r rounded-full from-blue-300 to-blue-500 h-full transition-all duration-300"
                            style={{ width: `${progress}%` }}
                            ></div>
                        </div>
                        </div>
                    </div>
                </div>

                
                {/* XP Details */}
                <p className="text-md text-white mt-2 px-2">XP to next level: {Math.floor(xpForNextLevel - remainingXP)} XP</p>
            </div>





           
        </div>
    );
}

export default LevelProgressBar;
