import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faStar, faStarHalfAlt, faStar as faStarEmpty } from '@fortawesome/free-solid-svg-icons';

const QuestList = ({ userId, questIds }) => {
    const [activeQuests, setActiveQuests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [itemNames, setItemNames] = useState({}); // State to store item names
    const [expandedQuestId, setExpandedQuestId] = useState(null); // State for expanded quest
    

    const fetchItemName = async (itemId) => {
        if (itemNames[itemId]) return itemNames[itemId]; // Return cached name if already fetched
        try {
            const response = await axios.get(`http://localhost:3001/items/${itemId}`); // Adjust this URL based on your item data API
            setItemNames((prevNames) => ({
                ...prevNames,
                [itemId]: response.data[0].name, // Cache the item name
            }));
            return response.data[0].name;
        } catch (error) {
            console.error('Error fetching item name:', error);
            return 'Unknown Item'; // Fallback if item fetch fails
        }
    };

    useEffect(() => {
            
        activeQuests.forEach((quest) => {
            if (quest.item_reward && !itemNames[quest.item_reward]) {
                fetchItemName(quest.item_reward); // Fetch item name if not already fetched
            }
        });
            
            
    }, [activeQuests, itemNames]); // Only fetch if quests or itemNames change
        

    // Handle quest removal
    const handleRemoveQuest = async (questId) => {
        const confirm = window.confirm('Are you sure you want to remove this quest?');
        if (!confirm) return;

        try {
            const response = await axios.post(`http://localhost:3001/quests/remove`, {
                questId,
                userId,
            });

            if (response.status === 200) {
                // Remove the quest from the state
                setActiveQuests((prevQuests) =>
                    prevQuests.filter((quest) => quest.quest_id !== questId)
                );

                alert('Quest removed successfully!');
                window.history.go(0);
            }
        } catch (err) {
            console.error('Error removing quest:', err);
            alert(err.response?.data?.error || 'Failed to remove quest');
        }
    };

    const handleFinishQuest = (questId) => {
        axios.post(`http://localhost:3001/quests/finish`, { questId, userId })
            .then(() => {
                alert('Quest completed successfully!');
                window.history.go(0);
            })
            .catch((error) => {
                console.error('Error finishing quest:', error);
                alert(`Failed to complete quest: ${error.response?.data?.error || 'Unknown error'}`);
            });
    };

    // Fetch active quests for the user
    useEffect(() => {
        const fetchActiveQuests = async () => {
            try {
                const response = await axios.get(`http://localhost:3001/quests/active`, {
                    params: { userId }
                });

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

                setActiveQuests(questsWithParsedStats);
            } catch (err) {
                console.error('Error fetching active quests:', err);
                setError('Failed to fetch active quests');
            } finally {
                setLoading(false);
            }
        };

        fetchActiveQuests();
    }, [userId, questIds, handleRemoveQuest, handleFinishQuest]);

    if (loading) {
        return <div>Loading active quests...</div>;
    }

    if (error) {
        return <div className="text-red-600">{error}</div>;
    }

    return (
        <div className="min-h-screen bg-transparent p-2">
            <div className="max-w-4xl mx-auto max-h-screen h-full overflow-auto">
                <h2 className="text-2xl font-bold mb-6">Your Active Quests</h2>

                {activeQuests.length === 0 && <div>You are not currently participating in any quests.</div>}

                <ul className="space-y-1">
                    {activeQuests.map((quest) => (
                        <li
                            key={quest.quest_id}
                            className="bg-gray-700 rounded-lg p-4"
                        >
                            {/* Title */}
                            <div
                                onClick={() => setExpandedQuestId(expandedQuestId === quest.quest_id ? null : quest.quest_id)}
                                className="cursor-pointer flex justify-between items-center"
                            >
                                <h3 className="text-md font-bold text-white">{quest.name}</h3>
                                <span className="text-md text-white">
                                    {expandedQuestId === quest.quest_id ? '-' : '+'}
                                </span>
                            </div>

                            {/* Buttons (Always Visible) */}
                            <div className="flex space-x-2 mt-2">
                                <button
                                    onClick={() => handleFinishQuest(quest.quest_id)}
                                    className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                                >
                                    Finish Quest
                                </button>

                                <button
                                    onClick={() => handleRemoveQuest(quest.quest_id)}
                                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                                >
                                    Remove Quest
                                </button>
                            </div>

                            {/* Quest Details (Hidden or Expanded with Tailwind CSS Animations) */}
                            <div
                                className={`mt-2 space-y-2 transition-all duration-300 ease-in-out overflow-hidden ${expandedQuestId === quest.quest_id ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0'
                                    }`}
                            >
                                <p className="text-white text-sm">{quest.description}</p>

                                <div className="mt-2">
                                    <span className="font-semibold text-white">Difficulty: </span>
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
                                                    ? 'text-yellow-500' // Gold for filled/half-filled
                                                    : 'text-gray-300' // Gray for empty
                                                }`}
                                        />
                                    ))}
                                </div>

                                <div className="mt-4">
                                    <h4 className="text-sm font-semibold text-white">Rewards:</h4>
                                    <ul className="list-disc list-inside text-white text-sm mt-2">
                                        {quest.experience_reward && <li>{quest.experience_reward} XP</li>}
                                        {quest.stat_reward && (
                                            <>
                                                {quest.stat_reward.physical_strength && (
                                                    <li className="text-red-500">
                                                        Physical Strength: {quest.stat_reward.physical_strength}
                                                    </li>
                                                )}
                                                {quest.stat_reward.stamina && (
                                                    <li className="text-yellow-500">Stamina: {quest.stat_reward.stamina}</li>
                                                )}
                                                {quest.stat_reward.bravery && (
                                                    <li className="text-blue-500">Bravery: {quest.stat_reward.bravery}</li>
                                                )}
                                                {quest.stat_reward.intelligence && (
                                                    <li className="text-green-500">Intelligence: {quest.stat_reward.intelligence}</li>
                                                )}
                                            </>
                                        )}
                                        {quest.item_reward && (
                                            <li>{itemNames[quest.item_reward]}</li>
                                        )}
                                    </ul>
                                </div>

                                <p className="text-white text-sm mt-1">
                                    Joined at: {new Date(quest.joined_at).toLocaleDateString()}
                                </p>
                            </div>
                        </li>
                    ))}
                </ul>
            </div>
        </div>

    );
};

export default QuestList;
