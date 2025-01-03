import React from 'react';

function calculateLevel(experience) {
    let level = 1;
    let xpForNextLevel = 100;

    while (experience >= xpForNextLevel) {
        level++;
        experience -= xpForNextLevel;
        xpForNextLevel = Math.ceil(xpForNextLevel * 1.1);
    }

    return { level, remainingXP: experience, xpForNextLevel };
}

function LevelProgressBar({ experience }) {
    const { level, remainingXP, xpForNextLevel } = calculateLevel(experience);
    const progress = (remainingXP / xpForNextLevel) * 100; // Calculate the progress as a percentage

    return (
        <div className="w-full">
            {/* Level Info */}
            <h2 className="text-xl font-semibold mb-2">Level: {level}</h2>

            {/* Progress Bar */}
            <div className="relative pt-1">
                <div className="flex mb-2 items-center justify-between">
                    <span className="text-sm font-semibold">XP Progress</span>
                    <span className="text-xs">{Math.floor(progress)}%</span>
                </div>
                <div className="flex mb-2">
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div
                            className="bg-indigo-600 h-2.5 rounded-full"
                            style={{ width: `${progress}%` }}
                        ></div>
                    </div>
                </div>
            </div>

            {/* XP Details */}
            <p className="text-sm text-white">XP to next level: {Math.floor(xpForNextLevel - remainingXP)} XP</p>
        </div>
    );
}

export default LevelProgressBar;
