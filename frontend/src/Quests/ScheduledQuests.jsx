import React, { useContext, useEffect, useRef, useState } from 'react';
import axios from 'axios';
import config from '../config';  // Assuming you have a config file for your backend URL
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faStar, faStarHalfAlt, faStar as faStarEmpty, faCalendar, faX, faAngleDown, faAngleUp, faCheck, faLock, faCheckCircle, faCheckDouble, faScroll, faFire, faSmile, faSmileWink, faFireBurner, faAward, faDumbbell, faHeart, faRunning, faBraille, faBrain, faDiamond, faXmark } from '@fortawesome/free-solid-svg-icons';
import DaySelector from './DaySelector';
import Confetti from 'react-confetti';
import LevelUpScreen from './LevelUpScreen';
import { UserContext } from '../Account/UserContext';
import CurrentStepPopup from '../Paths/CurrentStepPopup';

const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const currentDay = new Date().toLocaleDateString(undefined, { weekday: "long" });
const now = new Date();
const year = now.getFullYear();
const month = String(now.getMonth() + 1).padStart(2, '0');
const day = String(now.getDate()).padStart(2, '0');
const date = `${year}-${month}-${day}`;

function ScheduledQuests({ updated, updateDashboard }) {
    const userId = JSON.parse(localStorage.getItem("user"))?.id
    const {accountDataRef} = useContext(UserContext);
    const [accountData, setAccountData] = useState({});
    const [scheduledQuests, setScheduledQuests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [expandedQuestId, setExpandedQuestId] = useState(null); // State for expanded quest
    const [removedQuest, setRemovedQuest] = useState(0);
    const [showSchedule, setShowSchedule] = useState(true);  
    const [statBoosts, setStatBoosts] = useState({});
    const [showConfetti, setShowConfetti] = useState(false);
    const [claimableQuests, setClaimableQuests] = useState([]);
    const [questCompleted, setQuestCompleted] = useState(null);
    const [streak, setStreak] = useState(0);
    const [experienceReward, setExperienceReward] = useState(0);
    const [difficulty, setDifficulty] = useState(0);
    const [completedQuests, setCompletedQuests] = useState([]);
    const [ updatedScheduledQuests, setUpdatedScheduledQuests] = useState(false);
    
    const containerRef = useRef(null);
    const dayRefs = useRef({});

    const [daysMap, setDaysMap] = useState({
        Monday: [],
        Tuesday: [],
        Wednesday: [],
        Thursday: [],
        Friday: [],
        Saturday: [],
        Sunday: []
    });

    useEffect(() => {
        const interval = setInterval(() => {
            if (accountDataRef.current && accountDataRef.current.currency !== undefined) {
                setAccountData(accountDataRef.current);
            }
        }, 100); // You can reduce or increase this as needed

        return () => clearInterval(interval);
    }, []);


    useEffect(() => {
        if (containerRef.current && dayRefs.current[currentDay]) {
        const container = containerRef.current;
        const currentDayElement = dayRefs.current[currentDay];

        const containerCenter = container.offsetWidth / 2;
        const elementOffset = currentDayElement.offsetLeft + currentDayElement.offsetWidth * 0.5;
        const scrollPosition = elementOffset - containerCenter;

        container.scrollTo({ left: scrollPosition, behavior: "smooth" });
        }
    }, [scheduledQuests]);

    const fetchScheduledQuests = async () => {
        try {
            const response = await axios.get(`${config.backendUrl}/scheduled-quests/${userId}`);
            const data = response.data;    

            console.log(data);

            

            const daysMapTemp = {
                Monday: [],
                Tuesday: [],
                Wednesday: [],
                Thursday: [],
                Friday: [],
                Saturday: [],
                Sunday: []
            };

            if (!data || data.message === "No scheduled quests found for this user") {
                setDaysMap(daysMapTemp); // optionally clear state
                setLoading(false);
                return;
            }

            data.forEach(quest => {
                if (Array.isArray(quest.days) && quest.days.length > 0) {
                    quest.days.forEach(dayObj => {
                        const day = dayObj.day.charAt(0).toUpperCase() + dayObj.day.slice(1).toLowerCase();
                        if (daysMapTemp[day]) {
                            const updatedQuest = {
                                id: quest.id,
                                name: quest.name,
                                description: quest.description,
                                experience_reward: quest.experience_reward,
                                item_reward: quest.item_reward,
                                stat_reward: quest.stat_reward,
                                difficulty: quest.difficulty,
                                tags: quest.tags,
                                type: quest.type,
                                streak: dayObj.streak,
                                completionDay: dayObj.last_complated_date,
                                period: quest.period,
                                period_completed: quest.period_completed,
                            };

                            daysMapTemp[day].push(updatedQuest);
                        }
                    });
                }
            });

            // ✅ Update the daysMap after building it
            setDaysMap(daysMapTemp);
            setLoading(false);    
        } catch (err) {
            console.error("Error fetching scheduled quests:", err);
        }
    };

    useEffect(() => {
        fetchScheduledQuests();
        fetchActiveAndCompletedQuests();
    }, [removedQuest, updated, claimableQuests, updatedScheduledQuests]);

    useEffect(() => {
        if (daysMap[currentDay]) {
            const questsLeft = daysMap[currentDay].filter(
                quest => !completedQuests.includes(quest.id)
            ).length;
            localStorage.setItem('questsLeft', questsLeft);
        } else {
            // Optional: handle the case where currentDay doesn't exist in daysMap
            localStorage.setItem('questsLeft', 0);
        }
    }, [daysMap, completedQuests, currentDay]);
    
    

    const fetchActiveAndCompletedQuests = async () => {
        try {
            const [completedResponse] = await Promise.all([
                axios.get(`${config.backendUrl}/quests/completed`, { params: { userId, date } }),
            ]);
        

            // Process completed quests
            const completedQuestIds = completedResponse.data.map((quest) => quest.quest_id);
            setCompletedQuests(completedQuestIds);
            
        } catch (err) {
            console.error("Error fetching active or completed quests:", err);
        }
    };

    const handleRemoveQuest = async (questId, day) => {
        
        await axios.post(`${config.backendUrl}/scheduled-quests/remove`, { 
            questId, 
            userId,
            dayToRemove: day
        })
            .then(() => {
                setRemovedQuest(questId + day);
                updateDashboard();
            })
            .catch((error) => {
                console.error('Error removing quest:', error);
                alert(`Failed to remove quest: ${error.response?.data?.error || 'Unknown error'}`);
            });
    }

    const handleCloseModal = () => {
        setQuestCompleted(null); // Reset questCompleted to null when the modal is closed
    }

    const fireConfetti = () => {
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 8000);
    };
    

    const showStatUpdates = (questId) => {
        setQuestCompleted(questId); // Set the quest ID to trigger the component render
    }

    

    const handleFinishQuest = async (questId) => {

        // const now = new Date();

        await axios.post(`${config.backendUrl}/quests/finish`, { 
            questId, 
            userId,
            date: date,
            currentDay: currentDay
        })
            .then((response) => {
                const { statsIncreased, streak, experienceReward, difficulty } = response.data;
                setStatBoosts(statsIncreased);
                setStreak(streak);
                setExperienceReward(experienceReward);
                setDifficulty(difficulty)
                showStatUpdates(questId);
                fireConfetti();
                setClaimableQuests(prevQuests => prevQuests.filter(id => id !== questId));
            })
            .catch((error) => {
                console.error('Error finishing quest:', error);
                alert(`Failed to complete quest: ${error.response?.data?.error || 'Unknown error'}`);
            });
    };

    if (loading) {
        return <div>Loading...</div>;
    }

    if (error) {
        return <div>{error}</div>;
    }

    const updateScheduledQuests = () => {
        setUpdatedScheduledQuests(prev => !prev);
    }

    function getDifficultyGrade(score) {
        if (score <= 1) return "F";
        if (score <= 2) return "F+";
        if (score <= 3) return "D";
        if (score <= 4) return "D+";
        if (score <= 5) return "C";
        if (score <= 6) return "C+";
        if (score <= 7) return "B";
        if (score <= 8) return "B+";
        if (score <= 9) return "A";
        if (score <= 10) return "A+";
    }

    const statIcons = {
        strength: { icon: faDumbbell, color: 'red-600' },
        endurance: { icon: faHeart, color: 'green-500' },
        bravery: { icon: faRunning, color: 'blue-500' },
        intelligence: { icon: faBrain, color: 'yellow-400' },
    };

    const getQuestColor = (stat_reward = {}) => {
        for (const [key, { color }] of Object.entries(statIcons)) {
            if (stat_reward[key]) {
                return color; // first matching stat color
            }
        }
        return ""; // default fallback if no stat reward matches
    };

    return (
        <div
            ref={containerRef}
            className={`flex gap-4 mt-4 overflow-x-auto transition-all duration-300 ease-in-out ${
                showSchedule ? "max-h-[500px] lg:max-h-[600px] opacity-100" : "max-h-0 opacity-0"
            }`}
        >

            
            {Object.keys(daysMap).map((day) => {
                const isToday = day === new Date().toLocaleDateString(undefined, { weekday: "long" });
                
                return(
                    
                    <div
                        key={day}
                        ref={el => (dayRefs.current[day] = el)}
                        className={`w-[90%] lg:w-[40%] transition-all duration-300 ease-in-out rounded-lg shadow-lg p-4 overflow-y-auto hide-scrollbar flex-shrink-0 ${
                            isToday ? "bg-indigo-900 border-4 border-indigo-500 opacity-100" : "bg-gray-800 opacity-70"
                        }`}
                    >
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-white text-xl font-bold">
                            {day}
                            </h3>
                            <span className="bg-indigo-600 text-white text-sm font-semibold px-3 py-1 rounded-full">
                            {daysMap[day].length} Quest{daysMap[day].length !== 1 && "s"}
                            </span>
                        </div>

                        {daysMap[day].length === 0 ? (
                            <p className="text-gray-400 ml-4">No quests for this day.</p>
                        ) : (
                            <ul className="space-y-4">
                            {daysMap[day].map(quest => (
                                <div
                                key={`scheduled-quest-${quest.id}`}
                                className={`border-l-8 border-${getQuestColor(quest.stat_reward)} bg-gray-700 rounded-lg p-4 relative group hover:shadow-xl transition`}
                                >
                                {/* Remove Button */}
                                <button
                                    onClick={() => handleRemoveQuest(quest.id, day)}
                                    className="absolute top-2 right-2 font-bold text-white text-xl hover:text-gray-200"
                                >
                                    <FontAwesomeIcon icon={faXmark} />
                                </button>

                                <DaySelector questId={quest.id} updateScheduledQuests={updateScheduledQuests} />

                                <div className="flex items-center justify-between">
                                    <div className="text-white text-lg font-bold flex gap-3">
                                    {quest.name}
                                    {Object.entries(statIcons).map(([key, { icon, color }]) => {
                                        const value = quest?.stat_reward?.[key];
                                        if (!value) return null;

                                        return (
                                            <div key={key} className={`flex text-md items-center text-${color}`}>
                                                <FontAwesomeIcon icon={icon} />
                                            </div>
                                        );
                                    })}
                                    </div>
                                    
                                    <div className="flex items-center gap-1 text-orange-400 font-semibold">
                                    <FontAwesomeIcon icon={faFire} />
                                    {quest.streak || 0}
                                    </div>
                                </div>

                                {/* Journey Progress */}
                                {quest.type === "journey" && (
                                    <div className="mt-2 text-sm text-gray-300">
                                    Progress:
                                    <div className="flex flex-wrap gap-1 mt-1">
                                        {[...Array(quest.period)].map((_, index) => (
                                        <div
                                            key={index}
                                            className={`w-3 h-3 rounded-full ${
                                            index < quest.period_completed ? "bg-green-400" : "bg-gray-500"
                                            }`}
                                        />
                                        ))}
                                    </div>
                                    </div>
                                )}

                                

                                {/* Expandable Content */}
                                <div
                                    className={`mt-3 space-y-2 overflow-hidden transition-all duration-300 ease-in-out ${
                                    expandedQuestId === quest.id + day ? "max-h-screen opacity-100" : "max-h-0 opacity-0"
                                    }`}
                                >
                                    <p className="text-white text-sm">{quest.description}</p>

                                    {/* Difficulty */}
                                    <div className="z-10">
                                    <span className={`
                                    fa-layers fa-fw rounded-full font-bold uppercase tracking-wider text-3xl`}>
                                        <FontAwesomeIcon icon={faDiamond} className={`${
                                            quest.difficulty === 1
                                            ? "text-green-500"
                                            : quest.difficulty === 2
                                            ? "text-teal-500"
                                            : quest.difficulty === 3
                                            ? "text-blue-500"
                                            : quest.difficulty === 4
                                            ? "text-indigo-500"
                                            : quest.difficulty === 5
                                            ? "text-purple-500"
                                            : quest.difficulty === 6
                                            ? "text-pink-500"
                                            : quest.difficulty === 7
                                            ? "text-orange-500"
                                            : quest.difficulty === 8
                                            ? "text-amber-600"
                                            : quest.difficulty === 9
                                            ? "text-red-600"
                                            : quest.difficulty === 10
                                            ? "text-red-800"
                                            : "text-gray-400" // fallback for undefined/invalid difficulty
                                        }`} />
                                        <span className="fa-layers-text font-extrabold text-white" data-fa-transform="shrink-8">{getDifficultyGrade(quest.difficulty)}</span>
                                    </span>

                                    
                                
                                    
                                
                                </div>

                                    {/* Rewards */}
                                    <div className="flex flex-wrap gap-4 mt-2 border-t pt-2 border-indigo-400 text-sm text-white">
                                    {quest.experience_reward && (
                                        <div className="flex items-center">
                                        <FontAwesomeIcon icon={faAward} className="text-blue-400" />
                                        <span className="ml-1 font-semibold">+{quest.experience_reward}XP</span>
                                        </div>
                                    )}
                                    {quest.stat_reward?.strength && (
                                        <div className="flex items-center">
                                        <FontAwesomeIcon icon={faDumbbell} className="text-red-500" />
                                        <span className="ml-1 font-semibold">+{quest.stat_reward.strength}</span>
                                        </div>
                                    )}
                                    {quest.stat_reward?.endurance && (
                                        <div className="flex items-center">
                                        <FontAwesomeIcon icon={faHeart} className="text-green-500" />
                                        <span className="ml-1 font-semibold">+{quest.stat_reward.endurance}</span>
                                        </div>
                                    )}
                                    {quest.stat_reward?.bravery && (
                                        <div className="flex items-center">
                                        <FontAwesomeIcon icon={faRunning} className="text-blue-500" />
                                        <span className="ml-1 font-semibold">+{quest.stat_reward.bravery}</span>
                                        </div>
                                    )}
                                    {quest.stat_reward?.intelligence && (
                                        <div className="flex items-center">
                                        <FontAwesomeIcon icon={faBrain} className="text-yellow-400" />
                                        <span className="ml-1 font-semibold">+{quest.stat_reward.intelligence}</span>
                                        </div>
                                    )}
                                    </div>
                                </div>

                                {/* Toggle & Completion */}
                                <div className="mt-4 text-white flex flex-col gap-3">
                                    <button
                                    onClick={() =>
                                        setExpandedQuestId(expandedQuestId === quest.id + day ? null : quest.id + day)
                                    }
                                    className="text-sm hover:underline self-start"
                                    >
                                    {expandedQuestId === quest.id + day ? (
                                        <>
                                        Show Less <FontAwesomeIcon icon={faAngleUp} />
                                        </>
                                    ) : (
                                        <>
                                        Show More <FontAwesomeIcon icon={faAngleDown} />
                                        </>
                                    )}
                                    </button>

                                    {isToday && (
                                    <button
                                        onClick={() => handleFinishQuest(quest.id)}
                                        disabled={completedQuests.includes(quest.id)}
                                        className={`w-full py-3 text-center rounded-md font-semibold transition-all duration-200 ${
                                        completedQuests.includes(quest.id)
                                            ? "bg-transparent border border-green-400 text-green-400 cursor-not-allowed"
                                            : "bg-green-600 hover:bg-green-500 text-white hover:scale-105"
                                        }`}
                                    >
                                        {completedQuests.includes(quest.id) ? (
                                        <>
                                            Completed
                                        </>
                                        ) : quest.type === "journey" ? (
                                        <>
                                            Progress <FontAwesomeIcon icon={faCheck} />
                                        </>
                                        ) : (
                                        <>
                                            Finish <FontAwesomeIcon icon={faCheck} />
                                        </>
                                        )}
                                    </button>
                                    )}
                                </div>
                                </div>
                            ))}
                            </ul>
                        )}
                    </div>

                );
            })}



            {showConfetti && (
                <Confetti
                    numberOfPieces={900} // Increase the number of particles
                    gravity={0.1} // Adjust the gravity to control how fast the confetti falls
                    recycle={false} // Prevent the confetti from restarting once it finishes
                    tweenDuration={8000}
                    colors={['#ffcc00', '#ff6600', '#ff3300']}
                    className="absolute top-0 left-0 h-full z-[999999]" // Ensures full-screen absolute positioning
                />
            )}
            {questCompleted !== null && <LevelUpScreen prevAccountData={accountData} userId={userId} questCompleted={questCompleted} onClose={handleCloseModal} difficulty={difficulty} experienceReward={experienceReward} statReward={statBoosts} streak={streak} />}

        </div>

    );
}

export default ScheduledQuests;
