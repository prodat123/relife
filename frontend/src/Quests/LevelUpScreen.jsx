import React, { useState, useEffect, useContext, useRef } from 'react';
import axios from 'axios';
import config from '../config';
import { UserContext } from '../Account/UserContext';
import { faDumbbell, faBrain, faShieldAlt, faRunning, faShield, faFire, faHeart, faFistRaised, faChessRook } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import BossBattleModal from './BossBattleModal'; // You can remove this import if it's no longer necessary

const LevelUpScreen = ({ userId, questCompleted, vowCompleted, onClose, difficulty, experienceReward, statReward, streak }) => {
    const [visible, setVisible] = useState(true);
    const [accountData, setAccountData] = useState([]);
    const [dataLoaded, setDataLoaded] = useState(false);
    const [currentPage, setCurrentPage] = useState(1); // Track the current page or section
    const maxPages = 2; // Now there are two pages: one for level up, and one for the boss battle
    const [damage, setDamage] = useState(0);
    const { accountDataRef, fetchAccountData } = useContext(UserContext);
    const timerRef = useRef(null);

    const statIcons = {
        strength: <FontAwesomeIcon icon={faDumbbell} className="text-red-400 animate-flyUp" />,
        intelligence: <FontAwesomeIcon icon={faBrain} className="text-yellow-300 animate-flyUp" />,
        endurance: <FontAwesomeIcon icon={faHeart} className="text-green-400 animate-flyUp" />,
        bravery: <FontAwesomeIcon icon={faRunning} className="text-blue-400 animate-flyUp" />,
    };

    useEffect(() => {
        const interval = setInterval(() => {
            if (accountDataRef.current && !dataLoaded) {
                setAccountData(accountDataRef.current);
                const playerData = accountDataRef.current;
                const tempDamage =  Math.round(Math.pow(1 * playerData.stats.strength + 1 * playerData.stats.endurance + 1 * playerData.stats.bravery + 1 * playerData.stats.intelligence, 0.9));
                setDamage(tempDamage);
                setDataLoaded(true);
            }
        }, 100);
        return () => clearInterval(interval);
    }, [accountDataRef, dataLoaded]);

    const handleClose = () => {
        if (currentPage === maxPages) {
            setVisible(false);
            fetchAccountData(userId);
            if (onClose) onClose();
        } 
    };

    const calculateLevel = (experience) => {
        let level = 1;
        let xpForNextLevel = 100;

        while (experience >= xpForNextLevel) {
            level++;
            experience -= xpForNextLevel;
            xpForNextLevel = 100 * Math.pow(1.05, level - 1);
        }

        return { level, remainingXP: experience, xpForNextLevel };
    };

    const statColors = {
        strength: 'text-red-500',
        bravery: 'text-blue-500',
        intelligence: 'text-yellow-400',
        endurance: 'text-green-500',
    };

    const openBossBattle = () => {
        setCurrentPage(2); // Set to boss battle page
    };

    return (
        <>
            <div
                className={`fixed inset-0 flex items-center justify-center bg-black bg-opacity-60 transition-opacity duration-300 z-[99999] ${
                    visible ? 'opacity-100' : 'opacity-0 pointer-events-auto'
                }`}
            >
                {visible && (
                    <>
                    {currentPage === 1 && (
                      
                    <div className="relative p-6 w-11/12 max-w-3xl rounded-lg bg-gray-900 text-white shadow-md space-y-6 overflow-y-auto max-h-[80vh]">
                        {/* 🔥 Streak Section */}
                        {streak && (
                            <div className="flex flex-col items-center">
                                <FontAwesomeIcon icon={faFire} className="text-orange-400 text-5xl" />
                                <p className="mt-2 text-orange-300 font-semibold">{streak}-Day Streak</p>
                            </div>
                        )}

                        {/* 🧠 XP and Level Section */}
                        <div className="text-center border-t border-gray-700 pt-4">
                            <h2 className="text-lg font-semibold mb-1">Level Progress</h2>
                            {accountData.experience ? (
                                <>
                                    <p className="text-base">
                                        Level: <span className="font-bold">{calculateLevel(accountData.experience).level}</span>
                                    </p>
                                    <p className="text-green-400 font-semibold mt-1">+{experienceReward} XP</p>
                                </>
                            ) : (
                                <p className="text-gray-400">No XP data available.</p>
                            )}
                        </div>

                        {/* 📊 Stat Upgrades Section */}
                        <div className="border-t border-gray-700 pt-4">
                            <h2 className="text-lg font-semibold text-center mb-3">Stat Upgrades</h2>
                            {accountData.stats && statReward ? (
                                <ul className="space-y-3">
                                    {Object.entries(accountData.stats).map(([stat, value]) => {
                                        const boost = statReward[stat] || 0;
                                        const newValue = value + boost;
                                        const colorClass = statColors[stat] || 'text-white';

                                        return (
                                            <li key={stat} className="flex justify-between items-center px-4 py-2 bg-gray-800 rounded">
                                                <span className={`${colorClass} font-medium capitalize`}>{stat.replace('_', ' ')}</span>
                                                <div className="flex items-center space-x-2">
                                                    <span className={`${colorClass} text-lg`}>{newValue}</span>
                                                    {boost > 0 && (
                                                        <>
                                                            <span className="text-green-400 font-semibold">+{boost}</span>
                                                            {statIcons[stat]}
                                                        </>
                                                    )}
                                                </div>
                                            </li>
                                        );
                                    })}
                                </ul>
                            ) : (
                                <p className="text-center text-gray-400">No stat rewards available.</p>
                            )}
                        </div>

                        <div className="flex justify-center mt-6">
                            <button
                                onClick={openBossBattle}
                                className="px-4 py-2 z-[99999] bg-indigo-600 text-white font-semibold rounded-md cursor-pointer hover:bg-indigo-500 transition"
                            >
                                <FontAwesomeIcon icon={faChessRook} /> Enter the Tower
                            </button>
                        </div>
  
                        </div>
                    )}

                    
                        

                    {/* Boss Battle Page */}
                    {currentPage === 2 && (
                        <BossBattleModal onClose={handleClose} streak={streak} stat={statReward} difficulty={difficulty} attack={damage}/>
                    )}

                    </>
                )}
            </div>
        </>
    );
};

export default LevelUpScreen;
