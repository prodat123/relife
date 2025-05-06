import React, { useContext, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faStar, faStarHalfAlt, faStar as faStarEmpty, faList, faListCheck, faCross, faX, faAngleDown, faAngleUp, faCheck, faLock, faCheckCircle, faCheckDouble, faScroll } from '@fortawesome/free-solid-svg-icons';
import config from '../config';
import Confetti from 'react-confetti';
import LevelUpScreen from './LevelUpScreen';
import { BeatLoader, ClipLoader } from 'react-spinners';
import { UserContext } from '../Account/UserContext';
import QuestTimer from './QuestTimer';
import DaySelector from './DaySelector';
import CurrentStepPopup from '../Paths/CurrentStepPopup';

const QuestList = ({ userData, activeQuestsData, onRemove, onQuestUpdate }) => {
    const userId = JSON.parse(localStorage.getItem("user"))?.id
    const { accountDataRef } = useContext(UserContext);
    const [accountData, setAccountData] = useState({});
    const [userGuild, setUserGuild] = useState("");
    const [activeQuests, setActiveQuests] = useState([]);
    // const [completedQuests, setCompletedQuests] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [itemNames, setItemNames] = useState({}); // State to store item names
    const [expandedQuestId, setExpandedQuestId] = useState(null); // State for expanded quest
    const [showConfetti, setShowConfetti] = useState(false);
    const [questCompleted, setQuestCompleted] = useState(null); // State to track which quest was completed
    const [fadingQuestId, setFadingQuestId] = useState(null);
    const [claimableQuests, setClaimableQuests] = useState([]);
    const [statBoosts, setStatBoosts] = useState({});

    const date = new Date();  // 'YYYY-MM-DD'

    const [guildUpgrades, setGuildUpgrades] = useState([]);
    const [extraSlots, setExtraSlots] = useState([]);
    const [xpBoost, setXpBoost] = useState([]);
    const [questTimerBuff, setQuestTimerBuff] = useState([]);

    const [dataLoaded, setDataLoaded] = useState(false); // 👈 trigger for updates

    useEffect(() => {
        const interval = setInterval(() => {
            if (accountDataRef.current && !dataLoaded) {
            setAccountData(accountDataRef.current);
            setDataLoaded(true);
            setUserGuild(accountDataRef.current.guild);
            }
        }, 300); // Small interval to wait for dataRef update
        
        return () => clearInterval(interval);
    }, [accountDataRef, dataLoaded]);
    

    const fireConfetti = () => {
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 8000);
    };

    useEffect(() => {
        const fetchGuild = async () => {
            console.log(accountData);
            if (userGuild !== '') {
                try {
                    let guild = accountData.guild;
                    const response = await axios.get(`${config.backendUrl}/user-guild`, {
                        params: { name: guild, userId },
                    });
            
                    const upgrades = JSON.parse(response.data.guild_upgrades);
                    console.log(upgrades);
                    setGuildUpgrades(upgrades);
                    setExtraSlots(upgrades.filter(u => u.type === "extraSlots") || []);
                    setXpBoost(upgrades.filter(u => u.type === "xpBoost") || []);
                    setQuestTimerBuff(upgrades.filter(u => u.type === "questTimerBuff") || []);
                } catch (err) {
                    setError("Error fetching guild information");
                }
            }
        };
      
        if (userGuild !== '') {
          fetchGuild();
        }
    }, [userGuild]);

    // useEffect(() => {
            
    //     activeQuests.forEach((quest) => {
    //         if (quest.item_reward && !itemNames[quest.item_reward]) {
    //             fetchItemName(quest.item_reward); // Fetch item name if not already fetched
    //         }
    //     });
            
            
    // }, [activeQuests, itemNames]); // Only fetch if quests or itemNames change
        

    // Handle quest removal
    const handleRemoveQuest = async (questId) => {
        setFadingQuestId(questId); // Triggers the fade-out class/animation
    
        // Wait for the duration of your fade-out animation
        // await new Promise(resolve => setTimeout(resolve, 300)); // e.g., 300ms
    
        await onRemove(questId); // Actually remove it from state/API
        setFadingQuestId(null); // Reset fade state
    };
    
    const showStatUpdates = (questId) => {
        setQuestCompleted(questId); // Set the quest ID to trigger the component render
    }

    const handleFinishQuest = async (questId) => {

        const now = new Date();

        const localDate = now.getFullYear() + '-' +
            String(now.getMonth() + 1).padStart(2, '0') + '-' +
            String(now.getDate()).padStart(2, '0');

        await axios.post(`${config.backendUrl}/quests/finish`, { 
            questId, 
            userId,
        })
            .then((response) => {
                const { statsIncreased } = response.data;

                // alert('Quest completed successfully!');
                
                // console.log("Showing the popup now");
                // showStatPopup = true;
                // console.log(showStatPopup);\
                onQuestUpdate(questId);
                setStatBoosts(statsIncreased);
                showStatUpdates(questId);
                fireConfetti();
                setClaimableQuests(prevQuests => prevQuests.filter(id => id !== questId));
                
            })
            .catch((error) => {
                console.error('Error finishing quest:', error);
                alert(`Failed to complete quest: ${error.response?.data?.error || 'Unknown error'}`);
            });
    };

    const fetchActiveQuests = async () => {
        try {
            const response = await axios.get(`${config.backendUrl}/quests/active`, {
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

    // Fetch active quests for the user
    useEffect(() => {
        // fetchCompletedQuests();
        fetchActiveQuests();
    }, [activeQuestsData, accountData, fadingQuestId, claimableQuests]);
    

    const updateClaimableQuests = async (questId) => {
        // Assuming you have access to the quest object or can fetch it
        const quest = activeQuests.find(q => q.quest_id === questId); // or however you're storing quests
    
        if (!quest) return;
    
        const now = Math.floor(Date.now() / 1000);
        const questEndTime = Math.floor(new Date(quest.expired_at).getTime() / 1000);
    
        if (now >= questEndTime) {
            setClaimableQuests(prevQuests => {
                if (!prevQuests.includes(questId)) {
                    return [...prevQuests, questId];
                }
                return prevQuests;
            });
    
            console.log(`updateClaimableQuests: Quest ${questId} is now valid and added.`);
        } else {
            console.log(`updateClaimableQuests: Quest ${questId} is NOT yet ready!`);
        }
    };
    


    if (loading) {
        return (
            <BeatLoader
                color="#36d7b7" // Set your desired color
                loading={loading}
                size={10} // Adjusts the size of the bars
                margin={2} // Adjusts the spacing between bars;
            />
        )
        
    }

    if (error) {
        return <div className="text-red-600">{error}</div>;
    }
    
    const handleCloseModal = () => {
        setQuestCompleted(null); // Reset questCompleted to null when the modal is closed
    }
    
      
    return (
        <div className="h-auto bg-transparent p-6">
            <div className="mx-auto h-full overflow-auto">
                <h2 className="text-4xl font-bold mb-3"><FontAwesomeIcon icon={faScroll} /> Your Active Quests ({activeQuests.length}/{4 + ((extraSlots[0]?.level * 2) || 0)})</h2>

                {activeQuests.length === 0 ? 
                    <div className='text-gray-300'>You can pick out quests to start doing in real life.</div>
                :
                    <div className='mb-2 text-gray-300'>Do your quests in real life while waiting for the timer to run out.</div>
                }
                <BeatLoader
                    color="#36d7b7" // Set your desired color
                    loading={loading}
                    size={10} // Adjusts the size of the bars
                    margin={2} // Adjusts the spacing between bars 
                />

                <CurrentStepPopup updated={activeQuests}/>


                <div className="grid grid-cols-1 gap-4 md:grid-cols-1 lg:grid-cols-4 overflow-hidden p-3">
                {activeQuests.map((quest) => {
                    return (
                        <div
                            key={`quest-${quest.quest_id}`}
                            className={`bg-gray-700 rounded-md p-4 relative`}
                        >  
                            <>
                                {/* Remove Button */}
                                <button
                                    onClick={() => handleRemoveQuest(quest.quest_id)}
                                    className="absolute font-semibold top-0 right-0 text-md p-2 text-red-600 rounded-md hover:text-red-700"
                                >
                                    {fadingQuestId === quest.quest_id ? 
                                    <ClipLoader
                                        color="#e7000b"  // Set your desired color
                                        loading={true}    // Make sure it's always showing when loading
                                        size={20}         // Adjust the size of the spinner
                                        speedMultiplier={0.8}  // Speed of the spinner
                                    />
                                    :
                                    <FontAwesomeIcon icon={faX} />
                                    }
                                </button>
                                <div
                                    onClick={() => setExpandedQuestId(expandedQuestId === quest.quest_id ? null : quest.quest_id)}
                                    className="cursor-pointer mt-2"
                                >
                                    <DaySelector questId={quest.quest_id}/>

                                    <div className="text-2xl w-full text-left font-bold text-white">{quest.name}</div>
                                    <p className={`mb-2 w-full text-${quest.type === "daily" ? 'indigo-300' : 'green-300'}`}>{"<"+quest.type+">"}</p>
                                    {quest.type === "journey" && (
                                        <div className="flex items-center gap-1 mt-1">
                                            Progress: 
                                            <div className='flex flex-wrap gap-1'>
                                            {[...Array(quest.period)].map((_, index) => (
                                                <div
                                                key={index}
                                                className={`w-3 h-3 rounded-full ${
                                                    index < quest.period_completed ? 'bg-green-400' : 'bg-gray-500'
                                                }`}
                                                />
                                            ))}
                                            </div>
                                        </div>
                                    )}

                                </div>

                                {/* Quest Details */}
                                <div
                                    className={`mt-2 space-y-2 flex flex-col text-left transition-all duration-300 ease-in-out overflow-hidden ${
                                        expandedQuestId === quest.quest_id ? "max-h-screen opacity-100" : "max-h-0 opacity-0"
                                    }`}
                                >
                                    <p className="text-white text-md">{quest.description}</p>

                                    {/* Difficulty */}
                                    <div className="mt-2">
                                        <span className="font-semibold text-md text-white">Difficulty: </span>
                                        {Array.from({ length: 10 }, (_, i) => (
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
                                                    i < quest.difficulty ? "text-yellow-500" : "text-gray-300"
                                                }`}
                                            />
                                        ))}
                                    </div>

                                    {/* Rewards */}
                                    <div className="mt-4">
                                        <h4 className="text-md font-semibold text-white">Rewards:</h4>
                                        <ul className="list-disc list-inside text-white text-md">
                                            {quest.experience_reward && <li>{quest.experience_reward} XP</li>}
                                            {quest.stat_reward && (
                                                <>
                                                    {quest.stat_reward.strength && (
                                                        <li className="text-red-500">
                                                            Strength: <span className="font-semibold">+{quest.stat_reward.strength}</span>
                                                        </li>
                                                    )}
                                                    {quest.stat_reward.endurance && (
                                                        <li className="text-green-500">
                                                            Endurance: <span className="font-semibold">+{quest.stat_reward.endurance}</span>
                                                        </li>
                                                    )}
                                                    {quest.stat_reward.bravery && (
                                                        <li className="text-blue-500">
                                                            Bravery: <span className="font-semibold">+{quest.stat_reward.bravery}</span>
                                                        </li>
                                                    )}
                                                    {quest.stat_reward.intelligence && (
                                                        <li className="text-yellow-500">
                                                            Intelligence: <span className="font-semibold">+{quest.stat_reward.intelligence}</span>
                                                        </li>
                                                    )}
                                                </>
                                            )}
                                            {/* {quest.item_reward && <li>{itemNames[quest.item_reward]} (30% Chance)</li>} */}
                                        </ul>
                                    </div>

                                    {/* Joined At */}
                                    {/* <p className="text-white text-sm mt-1">Joined at: {quest.joined_at}</p> */}
                                </div>

                                {/* Expand/Collapse Toggle */}
                                <div
                                    className="text-md text-white cursor-pointer"
                                    onClick={() => setExpandedQuestId(expandedQuestId === quest.quest_id ? null : quest.quest_id)}
                                >
                                    {expandedQuestId === quest.quest_id ? (
                                        <div>
                                            Show Less <FontAwesomeIcon icon={faAngleUp} />
                                        </div>
                                    ) : (
                                        <div>
                                            Show More <FontAwesomeIcon icon={faAngleDown} />
                                        </div>
                                    )}
                                </div>

                                {/* Finish Quest Button */}
                                <button
                                    onClick={() => handleFinishQuest(quest.quest_id)}
                                    className={`w-full py-4 px-3 rounded-md focus:ring-2 focus:ring-offset-2 mt-4
                                        ${claimableQuests.includes(quest.quest_id) 
                                            ? "text-xl bg-green-600 hover:bg-green-500 text-white focus:ring-green-500 hover:scale-105 transition duration-200" 
                                            : "text-lg bg-gray-500 text-gray-300 cursor-not-allowed"
                                        }`}
                                    disabled={!claimableQuests.includes(quest.quest_id)} // Disable button if not claimable

                                
                                >
                                    {claimableQuests.includes(quest.quest_id) ? (
                                        <>
                                            {quest.type === "journey" ? (
                                                <>Progress <FontAwesomeIcon icon={faCheck} /></>
                                            ) : (
                                                <>Finish <FontAwesomeIcon icon={faCheck} /></>
                                            )}
                                        </>
                                    ) : (
                                        <>Claim in: <QuestTimer activeQuests={activeQuests} id={quest.quest_id} endTime={quest.expired_at} setClaimable={updateClaimableQuests} /></>
                                    )}

                                </button>

                            </>
                            
                        </div>
                    );
                })}

                </div>
            </div>
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
            {questCompleted !== null && <LevelUpScreen prevAccountData={accountData} userId={userId} questCompleted={questCompleted} onClose={handleCloseModal} statReward={statBoosts} />}


        </div>

    );
};

export default QuestList;
