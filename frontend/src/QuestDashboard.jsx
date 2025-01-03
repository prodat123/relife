import React, { useEffect, useState } from 'react';
import axios from 'axios';
import QuestList from './QuestList';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faStar, faStarHalfAlt, faStar as faStarEmpty, faList, faBullseye, faTasks } from '@fortawesome/free-solid-svg-icons';

const QuestDashboard = () => {
    const user = JSON.parse(localStorage.getItem('user'));
    const [quests, setQuests] = useState([]);
    const [selectedType, setSelectedType] = useState('daily');
    const [selectedQuests, setSelectedQuests] = useState([]); // Array for multiple quests
    const [userId, setUserId] = useState(user.id); // Replace with actual user ID from authentication
    const [activeQuests, setActiveQuests] = useState([]); // To track quests being worked on
    const [completedQuests, setCompletedQuests] = useState([]); // To track finished quests
    const [itemNames, setItemNames] = useState({}); // State to store item names
    const [isQuestListOpen, setQuestListOpen] = useState(false);

    const toggleQuestList = () => setQuestListOpen(!isQuestListOpen);

    useEffect(() => {
        const fetchDailyQuests = async () => {
            try {
                // Fetch today's quests from the backend
                const response = await axios.get(`http://localhost:3001/quests/daily`, { params: { userId } });
                const questsWithParsedStats = response.data.map(quest => {
                    let parsedStatReward = null;
                    try {
                        parsedStatReward = quest.stat_reward ? JSON.parse(quest.stat_reward) : null;
                    } catch (error) {
                        console.error("Error parsing stat_reward for quest", quest.id, error);
                        parsedStatReward = null; // If JSON is invalid, set to null
                    }
                    
                    return { ...quest, stat_reward: parsedStatReward };
                });
        
                setQuests(questsWithParsedStats); // Set the quests with parsed stat_rewards
                // const shuffledQuests = dailyQuests.sort(() => 0.5 - Math.random());
                // const limitedQuests = shuffledQuests.slice(0, 10);

                // setQuests(dailyQuests); // Store the 10 random quests
            } catch (err) {
                console.error('Error fetching daily quests:', err);
            }
        };

        if (selectedType === 'daily') {
            fetchDailyQuests();
        }
    }, [userId, selectedType]); 
    
    // Fetch active and completed quests for the user
    useEffect(() => {
        const fetchActiveAndCompletedQuests = async () => {
            try {
                const activeResponse = await axios.get(`http://localhost:3001/quests/active`, { params: { userId } });
                const activeQuestIds = activeResponse.data.map((quest) => quest.quest_id);
                setSelectedQuests(activeQuestIds);
                setActiveQuests(activeResponse.data);

                const completedResponse = await axios.get(`http://localhost:3001/quests/completed`, { params: { userId } });
                const completedQuestIds = completedResponse.data.map((quest) => quest.quest_id);
                setCompletedQuests(completedQuestIds);
            } catch (err) {
                console.error('Error fetching active or completed quests:', err);
            }
        };

        fetchActiveAndCompletedQuests();
    }, [userId]);

    // Fetch item name by ID and update itemNames state
    const fetchItemName = async (itemId) => {
        try {
            const response = await axios.get(`http://localhost:3001/items/${itemId}`);
            setItemNames((prev) => ({
                ...prev,
                [itemId]: response.data[0].name // Store the item name by its ID
            }));
        } catch (error) {
            console.error('Error fetching item name:', error);
            setItemNames((prev) => ({
                ...prev,
                [itemId]: 'Unknown Item' // Fallback if item fetch fails
            }));
        }
    };
    
    
    // Trigger the fetch for item names inside useEffect, ensure this only occurs when needed
    useEffect(() => {
        
        quests.forEach((quest) => {
            if (quest.item_reward && !itemNames[quest.item_reward]) {
                fetchItemName(quest.item_reward); // Fetch item name if not already fetched
            }
        });
        
        
    }, [quests, itemNames]); // Only fetch if quests or itemNames change
    


    const handleQuestSelection = (questId) => {
        if (completedQuests.includes(questId)) {
            alert('This quest has already been completed and cannot be re-selected.');
            return;
        }

        if (selectedQuests.includes(questId)) {
            // Quest already selected, so remove it
            axios.post(`http://localhost:3001/quests/remove`, { questId, userId })
                .then(() => {
                    alert('Quest removed successfully!');
                    setSelectedQuests((prev) => prev.filter((id) => id !== questId));
                    setActiveQuests((prev) => prev.filter((quest) => quest.quest_id !== questId));
                })
                .catch((error) => {
                    console.error('Error removing quest:', error);
                    alert(`Failed to remove quest: ${error.response?.data?.error || 'Unknown error'}`);
                });
        } else {
            // Quest not selected, so select it
            axios.post(`http://localhost:3001/quests/select`, { questId, userId })
                .then(() => {
                    alert('Quest selected successfully!');
                    setSelectedQuests((prev) => [...prev, questId]);

                    // Immediately mark it as being done
                    const quest = quests.find((q) => q.id === questId);
                    if (quest) {
                        setActiveQuests((prev) => [...prev, { quest_id: questId, ...quest }]);
                    }
                })
                .catch((error) => {
                    console.error('Error selecting quest:', error);
                    alert(`Failed to select quest: ${error.response?.data?.error || 'Unknown error'}`);
                });
        }
    };

    const handleFinishQuest = (questId) => {
        if (completedQuests.includes(questId)) {
            alert('This quest has already been completed.');
            return;
        }

        axios.post(`http://localhost:3001/quests/finish`, { questId, userId })
            .then(() => {
                alert('Quest completed successfully!');
                setActiveQuests((prev) => prev.filter((quest) => quest.quest_id !== questId));
                setSelectedQuests((prev) => prev.filter((id) => id !== questId));
                setCompletedQuests((prev) => [...prev, questId]); // Add to completed list
            })
            .catch((error) => {
                console.error('Error finishing quest:', error);
                alert(`Failed to complete quest: ${error.response?.data?.error || 'Unknown error'}`);
            });
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-5 bg-gradient-to-b from-gray-900 to-gray-800 text-white">
        {/* Main Content */}
        
        <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white p-3 col-span-3 lg:col-span-4">
            <h1 className='text-3xl font-bold mb-4'><FontAwesomeIcon icon={faTasks} /> Pick your Daily Quests</h1>
            <div className="max-w-full mx-auto">
            {/* Quest Cards */}
            <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {quests.map((quest) => {
                const isActive = selectedQuests.includes(quest.id);
                const isCompleted = completedQuests.includes(quest.id);

                return (
                    <li
                    key={quest.id}
                    className={`text-white rounded-lg bg-gray-700 shadow-md p-6 hover:shadow-lg transition-shadow ${
                        isCompleted ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                    >
                    <div className="flex justify-between items-start">
                        <div>
                        <h3 className="text-lg font-bold text-white">
                            {quest.name}
                        </h3>
                        <p className="text-white text-sm mt-2">
                            {quest.description}
                        </p>
                        </div>
                    </div>

                    {/* Difficulty */}
                    <div className="mt-4">
                        <h4 className="text-sm font-semibold text-white">
                        Difficulty:
                        </h4>
                        <div className="mt-1 flex">
                        {Array.from({ length: 5 }, (_, i) => (
                            <FontAwesomeIcon
                            key={i}
                            icon={
                                i < Math.floor(quest.difficulty)
                                ? faStar
                                : i < quest.difficulty
                                ? faStarHalfAlt
                                : faStarEmpty
                            }
                            className={`${
                                i < quest.difficulty
                                ? "text-yellow-500"
                                : "text-gray-300"
                            }`}
                            />
                        ))}
                        </div>
                    </div>

                    {/* Rewards */}
                    <div className="mt-4">
                        <h4 className="text-sm font-semibold text-white">
                        Rewards:
                        </h4>
                        <ul className="list-disc list-inside text-white text-sm mt-2">
                        {quest.experience_reward && (
                            <li>{quest.experience_reward} XP</li>
                        )}
                        {quest.stat_reward && (
                            <>
                            {quest.stat_reward.physical_strength && (
                                <li className="text-red-500">
                                Physical Strength:{" "}
                                +{quest.stat_reward.physical_strength}
                                </li>
                            )}
                            {quest.stat_reward.stamina && (
                                <li className="text-yellow-500">
                                Stamina: +{quest.stat_reward.stamina}
                                </li>
                            )}
                            {quest.stat_reward.bravery && (
                                <li className="text-blue-500">
                                Bravery: +{quest.stat_reward.bravery}
                                </li>
                            )}
                            {quest.stat_reward.intelligence && (
                                <li className="text-green-500">
                                Intelligence: +{quest.stat_reward.intelligence}
                                </li>
                            )}
                            </>
                        )}
                        {console.log(itemNames)}
                        {quest.item_reward && (
                            <li>{itemNames[quest.item_reward]}</li>
                        )}
                        {/* <p className="text-white text-sm mt-2">{itemNames[quest.item_reward] || 'Loading Item...'}
                        </p> */}
                        
                        </ul>
                    </div>

                    {/* Select/Remove Button */}
                    <div className="mt-6">
                        {!isCompleted && (
                        <button
                            onClick={() => handleQuestSelection(quest.id)}
                            className={`w-full py-2 text-sm font-medium text-white rounded-md ${
                            isActive
                                ? "bg-red-600 hover:bg-red-700 focus:ring-red-500"
                                : "bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500"
                            }`}
                        >
                            {isActive ? "Remove Quest" : "Select Quest"}
                        </button>
                        )}
                    </div>
                    </li>
                );
                })}
            </ul>
            </div>
        </div>

        {/* Quest List */}
        <div className="hidden lg:block col-span-1">
            <QuestList userId={userId} questIds={selectedQuests} />
        </div>

        {/* Fixed Button on Small Screens */}
        <button
            className="lg:hidden fixed bottom-4 right-4 bg-indigo-600 text-white py-3 px-4 rounded-full shadow-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            onClick={toggleQuestList}
        >
            {isQuestListOpen ? "Close Quests" : "View Quests"}
        </button>

        {/* Quest List Modal */}
        {isQuestListOpen && (
            <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex justify-center items-center z-50">
                <div
                className={`relative bg-gradient-to-b from-gray-900 to-gray-800 rounded-lg shadow-lg p-6 w-11/12 max-w-md ${
                    window.innerWidth >= 1024 ? "h-screen overflow-y-auto" : "max-h-[70vh] overflow-y-auto"
                }`}
                >
                {/* Close Button */}
                <button
                    className="absolute top-4 right-4 text-gray-600 hover:text-gray-900"
                    onClick={toggleQuestList}
                >
                    ✖
                </button>
                
                
                {/* Quest List Content */}
                <div>
                    <QuestList userId={userId} questIds={selectedQuests} />
                </div>
                </div>
            </div>
        )}

    </div>

    );
};

export default QuestDashboard;
