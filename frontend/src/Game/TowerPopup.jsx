import { faCoins } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React from "react";

const TowerPopup = ({ attempts, gold, onClose }) => {
    return (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
            <div className="bg-gray-800 rounded-md shadow-xl p-6 max-w-sm w-full animate-popout">
                <h2 className="text-xl font-bold text-center mb-1 text-white">Tower Rewards</h2>
                <h2 className="text-md text-center mb-4 text-white">
                    Great effort, {JSON.parse(localStorage.getItem('user'))?.username}! You’ve come far — do more quests to get one step closer to conquering the tower.
                </h2>


                <div className="text-center mb-4">
                <p className="text-lg text-white">Attempts: <span className="font-semibold">{attempts}</span></p>
                <p className="text-lg text-yellow-400">Gold Earned: <span className="font-semibold">{Math.round(gold)}</span> <FontAwesomeIcon icon={faCoins} /></p>
                </div>

                <button
                onClick={onClose}
                className="mt-4 w-full bg-indigo-600 text-white py-2 rounded-md hover:bg-indigo-700 transition"
                >
                Back to Dashboard
                </button>
            </div>
        </div>
    );
};

export default TowerPopup;
