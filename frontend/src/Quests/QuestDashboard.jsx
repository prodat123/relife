import React, { useCallback, useContext, useEffect, useRef, useState } from 'react';
import axios from 'axios';
import QuestList from './QuestList';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faStar, faStarHalfAlt, faStar as faStarEmpty, faList, faBullseye, faTasks, faX, faRoute, faCalendar, faExclamation, faThumbTack, faThumbtack, faAngleDown, faCodeBranch, faArrowUpRightDots, faBrain, faRunning, faHeart, faDumbbell, faAward, faCalendarDay, faMapMarkedAlt, faScaleBalanced, faTachometerAlt, faTachometer, faGauge, faMountain, faWifi, faSignal, faDragon, faGaugeHigh, faCertificate, faCalendarAlt, faRibbon, faMedal, faShield, faHatWizard, faCircle, faStarOfLife, faDiamond } from '@fortawesome/free-solid-svg-icons';
import config from '../config';
import { ClipLoader, BeatLoader } from 'react-spinners';
import ItemPopup from '../Inventory/ItemPopup';
import Fuse from 'fuse.js';
import { UserContext } from '../Account/UserContext';
import ScheduledQuests from './ScheduledQuests';
import CurrentStepPopup from '../Paths/CurrentStepPopup';
import DaySelector from './DaySelector';
import HabitQuestionModal from '../Miscellaneous/HabitQuestionModal';
import BossBattleModal from './BossBattleModal';
import BossSelectionModal from './BossSelectionModal';
import { FaStripe } from 'react-icons/fa';
import { useLocation } from 'react-router-dom';

function useQuery() {
    return new URLSearchParams(useLocation().search);
}


const QuestDashboard = () => {
    const userId = JSON.parse(localStorage.getItem('user')).id;
    const { accountDataRef } = useContext(UserContext);
    const [dataLoaded, setDataLoaded] = useState(false); // 👈 trigger for updates
    
    const [accountData, setAccountData] = useState({});
    const [quests, setQuests] = useState([]);
    const [filteredQuests, setFilteredQuests] = useState(quests);
    const [selectedType, setSelectedType] = useState('daily');
    const [selectedQuests, setSelectedQuests] = useState([]); // Array for multiple quests
    // const [userId, setUserId] = useState(user.id); // Replace with actual user ID from authentication
    const [activeQuests, setActiveQuests] = useState([]); // To track quests being worked on
    const [completedQuests, setCompletedQuests] = useState([]); // To track finished quests
    const [itemNames, setItemNames] = useState({}); // State to store item names
    const [isQuestListOpen, setQuestListOpen] = useState(false);
    const [questListUpdated, setQuestListUpdated] = useState(false);
    const [loading, setLoading] = useState(false);
    const [questLoading, setQuestLoading] = useState(false);
    const [questLoadingId, setQuestLoadingId] = useState(null);
    const [error, setError] = useState([]);

    const [popups, setPopups] = useState([]);

    const [selectedDifficulty, setSelectedDifficulty] = useState(null);
    const [selectedStat, setSelectedStat] = useState(null);
    const [selectedTags, setSelectedTags] = useState([]);
    
    const [extraSlots, setExtraSlots] = useState(0);
    const [xpBoost, setXpBoost] = useState(0);

    const [searchTerm, setSearchTerm] = useState('');
    const [openTags, setOpenTags] = useState(false);
    const [visibleCount, setVisibleCount] = useState(8); // or however many you want to start with
    const [activePaths, setActivePaths] = useState([]);
    const [questsOnPath, setQuestsOnPath] = useState([]);
    const [habitResponse, setHabitResponse] = useState(null);
    const [updatedScheduledQuests, setUpdatedScheduledQuests] = useState(false);

    const dropdownRef = useRef();
    const bottomRef = useRef(null);

    const tags = [
        "Exercise",
        "Planks",
        "Walking",
        "Jogging",
        "Running",
        "Situps",
        "Squats",
        "Lunges",
        "Stretching",
        "Biking",
        "Burpees",
        "Pullups",
        "Pushups",
        "Swimming",
        "Diet",
        "Reading",
        "Music",
        "Writing",
        "Cooking",
        "Charity",
        "Yoga",
        "Relaxation",
        "Meditation",
        "Community",
        "Chores",
        "Language",
        "Hobbies",
        "Social",
        "Cleaning",
        "Outdoors",
        "Isometrics",
        "Dancing",
        "Helping",
        "Planning"
    ];

    const location = useLocation();

    useEffect(() => {
        const query = new URLSearchParams(location.search);
      
        const tagsFromURL = query.getAll('tags'); // handles multiple tags
        const statFromURL = query.get('stats');
        const questFromURL = query.get('quests');
      
        if (tagsFromURL.length > 0) setSelectedTags(tagsFromURL);
        if (statFromURL) setSelectedStat(statFromURL);
        if (questFromURL) setSearchTerm(questFromURL); // you might be using searchTerm as a keyword filter
    }, []);

    useEffect(() => {
        document.title = "Re:LIFE | Quest Dashboard"; // Set the title for this component
    }, []);

    useEffect(() => {
            const interval = setInterval(() => {
              if (accountDataRef.current && !dataLoaded) {
                setAccountData(accountDataRef.current);
                setSelectedTags(JSON.parse(accountDataRef.current.questTags || '[]'))
                setDataLoaded(true);
              }
            }, 300); // Small interval to wait for dataRef update
          
            return () => clearInterval(interval);
    }, [accountDataRef, dataLoaded]);

    useEffect(() => {
        const fetchGuild = async () => {
            if(accountData.guild !== undefined) {
                try {
                    const response = await axios.get(`${config.backendUrl}/user-guild`, {
                        params: { name: accountData.guild, userId: userId }
                    });
        
                    const upgrades = JSON.parse(response.data.guild_upgrades)            
                    setExtraSlots(upgrades.filter(u => u.type === 'extraSlots')[0].level * 2 || 0);
                    setXpBoost(upgrades.filter(u => u.type === 'xpBoost')[0].level * 8 || 0);
        
                } catch (err) {
                    setError("Error fetching guild information");
                }
            }
            
        };
    
        if(accountData.guild !== ''){
            fetchGuild();
        }
        
    }, [accountData]);

    function calculateLevel(experience) {
        let level = 1;
        let xpForNextLevel = 100;
    
        while (experience >= xpForNextLevel) {
            level++;
            experience -= xpForNextLevel;
            xpForNextLevel = xpForNextLevel = 100 * Math.pow(1.05, (level - 1));
        }
    
        return { level, remainingXP: experience, xpForNextLevel };
    }

    const toggleQuestList = () => setQuestListOpen(!isQuestListOpen);

    useEffect(() => {
        const fetchDailyQuests = async () => {
            try {
                setLoading(true);
                const accountResponse = await axios.get(`${config.backendUrl}/account`, {
                    params: { userId: userId },
                });
                var accData = accountResponse.data;
                
                if (!userId) {
                    console.error("User or user level is not available.");
                    return;
                }

    
                // Fetch today's quests from the backend
                const response = await axios.get(`${config.backendUrl}/quests`, {
                    params: { userId: userId },
                });

    
                var level = calculateLevel(accData.experience).level;
                let allowedDifficulties = [];
    
                // Determine allowed difficulties based on level
                if (level >= 1) {
                    allowedDifficulties = [1];
                } 
                if (level >= 21) {
                    allowedDifficulties = [1, 2];
                } 
                if (level >= 41) {
                    allowedDifficulties = [1, 2, 3];
                } 
                if (level >= 51) {
                    allowedDifficulties = [1, 2, 3, 4];
                } 
                if (level >= 71) {
                    allowedDifficulties = [1, 2, 3, 4, 5];
                } 
                if (level >= 81) {
                    allowedDifficulties = [1, 2, 3, 4, 5, 6];
                } 
                if (level >= 101) {
                    allowedDifficulties = [1, 2, 3, 4, 5, 6, 7];
                }
                if (level >= 111) {
                    allowedDifficulties = [1, 2, 3, 4, 5, 6, 7, 8];
                }
                if (level >= 131) {
                    allowedDifficulties = [1, 2, 3, 4, 5, 6, 7, 8, 9];
                }
                if (level >= 141) {
                    allowedDifficulties = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
                }
                
    
                // Filter quests based on allowed difficulties
                const filteredQuests = response.data.filter(quest => 
                    allowedDifficulties.includes(quest.difficulty)
                );
    
                const questsWithParsedStats = filteredQuests.map(quest => {
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
                setLoading(false);
            } catch (err) {
                console.error('Error fetching daily quests:', err);
            }
        };
    
        if (selectedType === 'daily' && userId) {
            fetchDailyQuests();
        }
    }, []);
    
    const maxDifficulty = Math.max(...quests.map(q => q.difficulty), 1);
    
    const handleQuestUpdate = async () => {
        setQuestListUpdated((prev) => !prev); // Toggle flag to trigger fetching
    };

    // const fetchActiveAndCompletedQuests = async () => {
    //     try {
    //         const [activeResponse, completedResponse] = await Promise.all([
    //             axios.get(`${config.backendUrl}/quests/active`, { params: { userId } }),
    //             axios.get(`${config.backendUrl}/quests/completed`, { params: { userId, date } }),
    //         ]);
    
    //         // Process active quests
    //         const activeQuestIds = activeResponse.data.map((quest) => quest.quest_id);
    //         setSelectedQuests(activeQuestIds);
    //         setActiveQuests(activeResponse.data);
    
    //         // Process completed quests
    //         const completedQuestIds = completedResponse.data.map((quest) => quest.quest_id);
    //         setCompletedQuests(completedQuestIds);
    //     } catch (err) {
    //         console.error("Error fetching active or completed quests:", err);
    //     }
    // };
    
    // // Fetch active and completed quests for the user
    // useEffect(() => {
    //     fetchActiveAndCompletedQuests();
    // }, [questListUpdated, updatedScheduledQuests]);


    // const fetchPaths = async () => {
    //     try {
    //         const [activeRes] = await Promise.all([
    //             axios.get(`${config.backendUrl}/paths/active?userId=${userId}`),
    //         ]);

    //         const path = activeRes.data[0];
    //         // console.log(JSON.parse(path.steps));
    //         const steps = JSON.parse(path.steps)
    //         steps.forEach(step => {
    //             let questNamesToAdd = step.requirement.questNames;
    //             setQuestsOnPath(prev => [...prev, ...questNamesToAdd]);
    //         });
            
    //         console.log(questsOnPath);

    //         setActivePaths(activeRes.data);
    //         setLoading(false);
    //     } catch (err) {
    //         console.error('Error fetching paths:', err);
    //         setLoading(false);
    //     }
    // };

    
    // useEffect(() => {
    //     fetchPaths();
    // }, []);

    const handleQuestSelection = async (questId) => {
        if (completedQuests.includes(questId)) {
            alert('This quest has already been completed and cannot be re-selected.');
            return;
        }


        if (selectedQuests.includes(questId)) {
            setQuestLoadingId(questId);
            setQuestLoading(true);
    
            await axios.post(`${config.backendUrl}/quests/remove`, { 
                questId, 
                userId })
                .then(() => {
                    setSelectedQuests((prev) => prev.filter((id) => id !== questId))
                })
                .catch((error) => {
                    console.error('Error removing quest:', error);
                    alert(`Failed to remove quest: ${error.response?.data?.error || 'Unknown error'}`);
                });

            setActiveQuests((prev) => prev.filter((quest) => quest.id !== questId));
            setQuestLoading(false);
            setQuestLoadingId(null);
        } else {
            if (activeQuests.length >= (4 + extraSlots)) {
                setPopups((prevPopups) => [
                    ...prevPopups,
                    { 
                        id: Date.now(), 
                        name: "Your quest slots are full!", 
                        message: "You filled up all your quest slots, wait for the remaining time to select another quest.", 
                        success: false 
                    }
                ]);
                return; // Stop execution to prevent unnecessary state update
            }



            try {
                // Quest not selected, so select it
                setSelectedQuests((prev) => [...prev, questId]);

                
                const response = await axios.post(
                    `${config.backendUrl}/quests/select`, 
                    { userId, questId }, 
                );

                // setSelectedQuests((prev) => [...prev, questId]);
    
                // If successful, add the quest to activeQuests
                const quest = quests.find((q) => q.id === questId);
                if (quest) {
                    // setQuestLoading(false);
                    setQuestListUpdated((prev) => !prev); // Toggle flag to trigger fetching
                    setActiveQuests((prev) => [...prev, { id: questId, ...quest }]);
                    // setQuestLoadingId(null);
                }

    
            } catch (error) {
                console.error('Error selecting quest:', error);
                alert(`Failed to select quest: ${error.response?.data?.error || 'Unknown error'}`);
                // fetchActiveAndCompletedQuests();
                
            }
        }
    }


    const toggleTag = (tag) => {
        setSelectedTags((prev) =>
            prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
        );
    };

    useEffect(() => {
        if (!quests || quests.length === 0) return;
    
        const fuse = new Fuse(quests, {
            keys: ['name', 'description', 'tags', 'type'],
            threshold: 0.8,
        });
    
        let filtered = quests;
    
        // 🔍 Search filtering
        if (searchTerm.trim() !== '') {
            const results = fuse.search(searchTerm.trim());
            filtered = results.map(result => result.item);
        }
    
        // ⭐ Difficulty filtering
        if (selectedDifficulty !== null) {
            filtered = filtered.filter(q => q.difficulty === selectedDifficulty);
        }
    
        // 💪 Stat filtering
        if (selectedStat !== null) {
            filtered = filtered.filter(q => {
                const statValue = q.stat_reward?.[selectedStat];
                return statValue && statValue > 0;
            });
        }

        if (selectedTags.length > 0) {
            filtered = filtered.filter(q => {
                const tags = JSON.parse(q.tags); // assuming q.tags is a JSON string
                return tags.some(tag => selectedTags.includes(tag));
            });
              
        }
    
        setFilteredQuests(filtered);
    }, [searchTerm, selectedDifficulty, selectedStat, selectedTags, quests]);
    
    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setOpenTags(false);
            }
        }

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [dropdownRef, setOpenTags]);

    useEffect(() => {
        if (visibleCount > 8 && bottomRef.current) {
          bottomRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [visibleCount]);

    const handleHabitAnswer = (response) => {
        console.log('User responded:', response);
        setHabitResponse(response);
    };

    const updateScheduledQuests = () => {
        setUpdatedScheduledQuests(prev => !prev);
    }
    
      
    const visibleQuests = filteredQuests.slice(0, visibleCount);

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
      

 

    return (
        <div className="w-full grid md:grid-cols-3 grid-cols-1 lg:grid-cols-5 text-white">
            {/* {new Date().getDay() === 0 && (
                <HabitQuestionModal onAnswer={handleHabitAnswer} />
            )} */}
            {/* Quest List
            <div className="col-span-5 lg:col-start-2 md:col-start-2 col-span-1">
                <QuestList userData={accountData} activeQuestsData={activeQuests} questListUpdated={questListUpdated} onRemove={handleQuestSelection} onQuestUpdate={handleQuestUpdate}/>
            </div> */}

            {/* <CurrentStepPopup updated={activeQuests}/> */}


            <div className="col-span-5 lg:col-start-2 md:col-start-2 col-span-1 p-4">
                <BossSelectionModal />
                <h1 className='text-3xl font-bold'><FontAwesomeIcon icon={faCalendarAlt} /> Scheduled Quests</h1>
                <ScheduledQuests updated={updatedScheduledQuests} updateDashboard={updateScheduledQuests}/>
            </div>

            <div className="lg:block hidden min-h-screen text-white p-6 col-span-1 lg:col-span-4 lg:col-start-2">
                <h1 className='quest-list-header text-2xl font-bold mb-4'><FontAwesomeIcon icon={faThumbTack} /> Recommended Quests</h1>
                {/* <p className='mb-4 text-gray-300'>Search up the type of quests you need and unlock higher difficulties as you level up!</p> */}
                <div className="mb-4">
                    <input
                        type="text"
                        placeholder="Search quests..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full px-4 py-2 rounded-md bg-gray-700 text-white focus:outline-none"
                    />
                </div>

                <div className="flex items-center gap-4 mb-4">
                    <label className="text-white">Filter by Tags:</label>
                    <div className="relative inline-block text-left">
                        <button
                            onClick={() => setOpenTags(!openTags)}
                            className="bg-gray-700 text-white rounded px-4 py-2"
                        >
                            {selectedTags.length > 0 
                                ? selectedTags.join(', ').slice(0, 10) + (selectedTags.join(', ').length > 10 ? '…' : '')
                                : 'Filter by Tags'
                            }
                        </button>

                        {openTags && (
                            <div
                                ref={dropdownRef}
                                className="absolute z-10 mt-2 w-[500px] bg-gray-600 rounded-md shadow-lg p-4 max-h-60 overflow-y-auto"
                            >
                                {/* Clear All Filters checkbox */}
                                <label className="flex items-center space-x-3 mb-3 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={selectedTags.length === 0}
                                        onChange={() => setSelectedTags([])}
                                        className="w-5 h-5 text-red-600 bg-white border-2 border-gray-300 rounded-sm focus:ring-red-500 focus:ring-2"
                                    />
                                    <span className="text-white text-sm font-semibold">Clear All Filters</span>
                                </label>

                                {/* 4-column tag grid */}
                                <div className="grid grid-cols-4 gap-x-4 gap-y-2">
                                    {tags.map((tag) => (
                                        <label key={tag} className="flex items-center space-x-2 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={selectedTags.includes(tag)}
                                                onChange={() => toggleTag(tag)}
                                                className="w-4 h-4 text-indigo-600 bg-white border-2 border-gray-300 rounded-sm focus:ring-indigo-500 focus:ring-2"
                                            />
                                            <span className="text-white text-xs">{tag}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        )}


                    </div>
                    <label className="text-white">Filter by Difficulty:</label>
                    <select
                        value={selectedDifficulty ?? ''}
                        onChange={(e) => {
                            const value = e.target.value ? parseInt(e.target.value) : null;
                            setSelectedDifficulty(value);
                        }}
                        className="bg-gray-700 text-white rounded px-4 py-2"
                    >
                        <option value="">All</option>
                        {[...Array(maxDifficulty)].map((_, i) => (
                            <option key={i + 1} value={i + 1}>
                                Rank {getDifficultyGrade(i + 1)}
                            </option>
                        ))}
                    </select>

                    <label className="text-white">Filter by Stat:</label>
                    <select
                        value={selectedStat ?? ''}
                        onChange={(e) => {
                            const value = e.target.value || null;
                            setSelectedStat(value);
                        }}
                        className="bg-gray-700 text-white rounded px-4 py-2"
                    >
                        <option value="">All</option>
                        {["strength", "bravery", "intelligence", "endurance"].map((stat, i) => (
                            <option key={stat} value={stat}>
                                {stat.charAt(0).toUpperCase() + stat.slice(1)}
                            </option>
                        ))}
                    </select>

                
                </div>
                <div className="max-w-full mx-auto">
                    {loading ? (
                        <BeatLoader
                            color="#36d7b7" // Set your desired color
                            loading={loading}
                            size={10} // Adjusts the size of the bars
                            margin={2} // Adjusts the spacing between bars
                        />
                    ) : 
                    <>
                    <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 overflow-y-auto overflow-visible">
                        {visibleQuests.map((quest) => {
                            const isActive = selectedQuests.includes(quest.id);
                            const isCompleted = completedQuests.includes(quest.id);
                            const isPath = questsOnPath.includes(quest.name);

                            return (
                                <li
                                    key={`desktop-quest-${Date.now()}-${Math.random()}`}
                                    // onClick={(e) => {
                                    //     e.stopPropagation();
                                    //     handleQuestSelection(quest.id);
                                    // }}
                                    className={`
                                        relative text-white border border-2 shadow-md rounded-md 
                                        transition-transform transition-all overflow-hidden
                                        active:shadow-md
                                        ${isCompleted || (activeQuests.length >= (4 + extraSlots) && !isActive) 
                                        ? "cursor-not-allowed"
                                        : "transition duration-200 focus:outline-none active:outline-none active:scale-100 will-change-transform select-none hover:shadow-xl"
                                        }

                                        ${isPath 
                                        ? "rounded-md bg-yellow-400 p-3"
                                        : "bg-gray-700 p-4"
                                        }

                                        ${
                                            quest.difficulty === 1
                                            ? "border-green-500"
                                            : quest.difficulty === 2
                                            ? "border-teal-500"
                                            : quest.difficulty === 3
                                            ? "border-blue-500"
                                            : quest.difficulty === 4
                                            ? "border-indigo-500"
                                            : quest.difficulty === 5
                                            ? "border-purple-500"
                                            : quest.difficulty === 6
                                            ? "border-pink-500"
                                            : quest.difficulty === 7
                                            ? "border-orange-500"
                                            : quest.difficulty === 8
                                            ? "border-amber-600"
                                            : quest.difficulty === 9
                                            ? "border-red-600"
                                            : quest.difficulty === 10
                                            ? "border-red-800"
                                            : "border-gray-400" // fallback for undefined/invalid difficulty
                                        }
                                    `}
                                    disabled={isCompleted || (activeQuests.length >= (4 + extraSlots) && !isActive)}
                                >
                                    <div className={`rounded-md ${isPath ? "bg-gray-700 p-5" : ""}`}>
                                        
                                        {/* Main Content */}
                                        {isPath && ( 
                                            <div className='absolute py-1 px-2 font-bold text-sm rounded-l-xl rounded-t-none  bg-yellow-400 right-2 top-2 text-gray-700 flex items-center justify-center'>
                                                <FontAwesomeIcon icon={faArrowUpRightDots} className='mr-1'/> Required
                                            </div>
                                            
                                        )}
                                        <div>
                                            <h3 className="text-lg font-bold text-white mb-2">{quest.name} <FontAwesomeIcon icon={quest.type === "daily" ? faCalendarDay : faMapMarkedAlt} /></h3>
                                            {/* <p className={`mb-2 text-${quest.type === "daily" ? 'indigo-300' : 'green-300'}`}>{"<"+quest.type+">"}</p> */}
                                            <p className="text-white text-sm">{quest.description}</p>
                                        </div>

                                        
                                        

                                        <div className='flex gap-2 flex-wrap mt-2'>
                                            {JSON.parse(quest.tags).map((tag) => (
                                                <div className='px-4 py-1 bg-indigo-600 rounded-full text-xs'>{tag}</div>
                                            ))}
                                        </div>

                                        {quest.type === "journey" && (
                                            <div className="mt-4 inline-flex items-center gap-2 text-green-300 font-medium text-md">
                                                <FontAwesomeIcon icon={faCalendar} />
                                                <span>Period: {quest.period} days</span>
                                            </div>
                                        )}

                                        <div className="absolute bottom-4 right-4 z-10">
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


                                        <div>
                                            {/* <h4 className="text-md font-semibold text-white border-b border-indigo-400">Rewards</h4> */}
                                            <div className="flex items-center gap-4 mt-4 border-t py-2 border-indigo-400">
                                                {quest.experience_reward && (
                                                <div className="flex items-center">
                                                    <FontAwesomeIcon icon={faAward} className="text-blue-400" />
                                                    <span className="font-semibold ml-1">+{quest.experience_reward + xpBoost}XP</span>
                                                </div>
                                                )}
                                                {quest.stat_reward && (
                                                <>
                                                    {quest.stat_reward.strength && (
                                                    <div className="flex items-center">
                                                        <FontAwesomeIcon icon={faDumbbell} className="text-red-500" />
                                                        <span className="font-semibold ml-1"> +{quest.stat_reward.strength}</span>
                                                    </div>
                                                    )}
                                                    {quest.stat_reward.endurance && (
                                                    <div className="flex items-center">
                                                        <FontAwesomeIcon icon={faHeart} className="text-green-500" />
                                                        <span className="font-semibold ml-1"> +{quest.stat_reward.endurance}</span>
                                                    </div>
                                                    )}
                                                    {quest.stat_reward.bravery && (
                                                    <div className="flex items-center">
                                                        <FontAwesomeIcon icon={faRunning} className="text-blue-500" />
                                                        <span className="font-semibold ml-1"> +{quest.stat_reward.bravery}</span>
                                                    </div>
                                                    )}
                                                    {quest.stat_reward.intelligence && (
                                                    <div className="flex items-center">
                                                        <FontAwesomeIcon icon={faBrain} className="text-yellow-500" />
                                                        <span className="font-semibold ml-1">+{quest.stat_reward.intelligence}</span>
                                                    </div>
                                                    )}
                                                </>
                                                )}
                                            </div>
                                        </div>

                                        <div>
                                            <DaySelector questId={quest.id} updateScheduledQuests={updateScheduledQuests}/>
                                        </div>
                                    </div>
                                </li>
                            );
                        })}

                        

                    </ul>

                    {visibleCount < filteredQuests.length && (
                        <div className="flex col-span-4 justify-center mt-6" ref={bottomRef}>
                            <button
                            onClick={() => setVisibleCount((prev) => prev + 8)} // Load 4 more quests
                            className="px-4 py-2 w-full text-white bg-indigo-600 rounded-md hover:bg-indigo-500 transition"
                            >
                            Load More <FontAwesomeIcon icon={faAngleDown} />
                            </button>
                        </div>
                    )}
                    </>



                }
                
                </div>
            </div>

            {/* Fixed Button on Small Screens */}
            <button
                className="lg:hidden fixed bottom-20 right-4 bg-indigo-600 text-white py-3 px-4 rounded-full shadow-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                onClick={toggleQuestList}
            >
                <FontAwesomeIcon icon={faThumbtack} /> {isQuestListOpen ? "Close Quests" : "Quests"}
            </button>

            {/* Quest List Modal */}
            {isQuestListOpen && (
                <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex justify-center items-center z-50">
                    <div
                        className={`relative bg-gradient-to-b from-gray-900 to-gray-800 rounded-md shadow-lg p-6 w-11/12 max-w-md ${
                            window.innerWidth >= 1024 ? "h-screen overflow-y-auto" : "max-h-[60vh] overflow-y-auto"
                        }`}
                    >
                        {/* Close Button */}
                        <button
                            className="fixed top-28 right-8 z-50 text-red-600 hover:text-red-500"
                            onClick={toggleQuestList}
                        >
                            <FontAwesomeIcon icon={faX} />
                        </button>
                        
                        <h1 className='quest-list-header text-2xl font-bold mb-2'><FontAwesomeIcon icon={faThumbTack} /> Recommended Quests</h1>
                        <div className="mb-4">
                            <input
                                type="text"
                                placeholder="Search quests..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full px-4 py-2 rounded-md bg-gray-700 text-white focus:outline-none"
                            />
                        </div>

                        <div className="flex flex-col mb-4 gap-1">
                            <label className="text-white">Filter by Tags:</label>
                            <div className="relative inline-block text-left">
                                <button
                                    onClick={() => setOpenTags(!openTags)}
                                    className="bg-gray-700 w-full text-left text-white rounded px-4 py-2"
                                >
                                    {selectedTags.length > 0 
                                        ? selectedTags.join(', ').slice(0, 10) + (selectedTags.join(', ').length > 10 ? '…' : '')
                                        : 'Filter by Tags'
                                    }
                                </button>

                                {openTags && (
                                    <div
                                        ref={dropdownRef}
                                        className="absolute z-10 my-2 w-[250px] bg-gray-600 rounded-md shadow-lg p-4 max-h-60 overflow-y-auto"
                                    >
                                        {/* Clear All Filters checkbox */}
                                        <label className="flex items-center space-x-3 mb-3 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={selectedTags.length === 0}
                                                onChange={() => setSelectedTags([])}
                                                className="w-5 h-5 text-red-600 bg-white border-2 border-gray-300 rounded-sm focus:ring-red-500 focus:ring-2"
                                            />
                                            <span className="text-white text-sm font-semibold">Clear All Filters</span>
                                        </label>

                                        {/* 4-column tag grid */}
                                        <div className="grid grid-cols-1 gap-x-4 gap-y-2">
                                            {tags.map((tag) => (
                                                <label key={tag} className="flex items-center space-x-2 cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedTags.includes(tag)}
                                                        onChange={() => toggleTag(tag)}
                                                        className="w-5 h-5 text-indigo-600 bg-white border-2 border-gray-300 rounded-sm focus:ring-indigo-500 focus:ring-2"
                                                    />
                                                    <span className="text-white text-sm">{tag}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                )}


                            </div>
                            <label className="text-white">Filter by Difficulty:</label>
                            <select
                                value={selectedDifficulty ?? ''}
                                onChange={(e) => {
                                    const value = e.target.value ? parseInt(e.target.value) : null;
                                    setSelectedDifficulty(value);
                                }}
                                className="bg-gray-700 text-white rounded px-4 py-2"
                            >
                                <option value="">All</option>
                                {[...Array(maxDifficulty)].map((_, i) => (
                                    <option key={i + 1} value={i + 1}>
                                        
                                        {i + 1} Stars
                                    </option>
                                ))}
                            </select>

                            <label className="text-white">Filter by Stat:</label>
                            <select
                                value={selectedStat ?? ''}
                                onChange={(e) => {
                                    const value = e.target.value || null;
                                    setSelectedStat(value);
                                }}
                                className="bg-gray-700 text-white rounded px-4 py-2"
                            >
                                <option value="">All</option>
                                {["strength", "bravery", "intelligence", "endurance"].map((stat, i) => (
                                    <option key={stat} value={stat}>
                                        {stat.charAt(0).toUpperCase() + stat.slice(1)}
                                    </option>
                                ))}
                            </select>

                            
                        </div>
                    
                        {/* Quest List Content */}
                        <div>
                            <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-6">
                                {visibleQuests.map((quest) => {
                                const isActive = selectedQuests.includes(quest.id);
                                const isCompleted = completedQuests.includes(quest.id);

                                return (
                                    <li
                                        key={`mobile-quest-${Date.now()}-${Math.random()}`}
                                        // onClick={(e) => {
                                        //     e.stopPropagation();
                                        //     handleQuestSelection(quest.id);
                                        // }}
                                        className={`
                                            relative text-white border border-2 p-4 shadow-md rounded-md 
                                            transition-transform transition-all overflow-hidden
                                            active:shadow-md
                                            ${isCompleted || (activeQuests.length >= (4 + extraSlots) && !isActive) 
                                            ? "cursor-not-allowed"
                                            : "transition duration-200 focus:outline-none active:outline-none active:scale-100 will-change-transform select-none hover:shadow-xl"
                                            }

                                            

                                            ${
                                                quest.difficulty === 1
                                                ? "border-green-500"
                                                : quest.difficulty === 2
                                                ? "border-teal-500"
                                                : quest.difficulty === 3
                                                ? "border-blue-500"
                                                : quest.difficulty === 4
                                                ? "border-indigo-500"
                                                : quest.difficulty === 5
                                                ? "border-purple-500"
                                                : quest.difficulty === 6
                                                ? "border-pink-500"
                                                : quest.difficulty === 7
                                                ? "border-orange-500"
                                                : quest.difficulty === 8
                                                ? "border-amber-600"
                                                : quest.difficulty === 9
                                                ? "border-red-600"
                                                : quest.difficulty === 10
                                                ? "border-red-800"
                                                : "border-gray-400" // fallback for undefined/invalid difficulty
                                            }
                                        `}
                                        disabled={isCompleted || (activeQuests.length >= (4 + extraSlots) && !isActive)}
                                    >
                                        <div className={`rounded-md`}>
                                            
                                            {/* Main Content */}
                                            {/* {isPath && ( 
                                                <div className='absolute py-1 px-2 font-bold text-sm rounded-l-xl rounded-t-none  bg-yellow-400 right-2 top-2 text-gray-700 flex items-center justify-center'>
                                                    <FontAwesomeIcon icon={faArrowUpRightDots} className='mr-1'/> Required
                                                </div>
                                                
                                            )} */}
                                            <div>
                                                <h3 className="text-lg font-bold text-white mb-2">{quest.name} <FontAwesomeIcon icon={quest.type === "daily" ? faCalendarDay : faMapMarkedAlt} /></h3>
                                                {/* <p className={`mb-2 text-${quest.type === "daily" ? 'indigo-300' : 'green-300'}`}>{"<"+quest.type+">"}</p> */}
                                                <p className="text-white text-sm">{quest.description}</p>
                                            </div>

                                            
                                            

                                            <div className='flex gap-2 flex-wrap mt-2'>
                                                {JSON.parse(quest.tags).map((tag) => (
                                                    <div className='px-4 py-1 bg-indigo-600 rounded-full text-xs'>{tag}</div>
                                                ))}
                                            </div>

                                            {quest.type === "journey" && (
                                                <div className="mt-4 inline-flex items-center gap-2 text-green-300 font-medium text-md">
                                                    <FontAwesomeIcon icon={faCalendar} />
                                                    <span>Period: {quest.period} days</span>
                                                </div>
                                            )}

                                            <div className="absolute bottom-4 right-4 z-10">
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


                                            <div>
                                                {/* <h4 className="text-md font-semibold text-white border-b border-indigo-400">Rewards</h4> */}
                                                <div className="flex items-center gap-4 mt-4 border-t py-2 border-indigo-400">
                                                    {quest.experience_reward && (
                                                    <div className="flex items-center">
                                                        <FontAwesomeIcon icon={faAward} className="text-blue-400" />
                                                        <span className="font-semibold ml-1">+{quest.experience_reward + xpBoost}XP</span>
                                                    </div>
                                                    )}
                                                    {quest.stat_reward && (
                                                    <>
                                                        {quest.stat_reward.strength && (
                                                        <div className="flex items-center">
                                                            <FontAwesomeIcon icon={faDumbbell} className="text-red-500" />
                                                            <span className="font-semibold ml-1"> +{quest.stat_reward.strength}</span>
                                                        </div>
                                                        )}
                                                        {quest.stat_reward.endurance && (
                                                        <div className="flex items-center">
                                                            <FontAwesomeIcon icon={faHeart} className="text-green-500" />
                                                            <span className="font-semibold ml-1"> +{quest.stat_reward.endurance}</span>
                                                        </div>
                                                        )}
                                                        {quest.stat_reward.bravery && (
                                                        <div className="flex items-center">
                                                            <FontAwesomeIcon icon={faRunning} className="text-blue-500" />
                                                            <span className="font-semibold ml-1"> +{quest.stat_reward.bravery}</span>
                                                        </div>
                                                        )}
                                                        {quest.stat_reward.intelligence && (
                                                        <div className="flex items-center">
                                                            <FontAwesomeIcon icon={faBrain} className="text-yellow-500" />
                                                            <span className="font-semibold ml-1">+{quest.stat_reward.intelligence}</span>
                                                        </div>
                                                        )}
                                                    </>
                                                    )}
                                                </div>
                                            </div>

                                            <div>
                                                <DaySelector questId={quest.id} updateScheduledQuests={updateScheduledQuests}/>
                                            </div>
                                        </div>
                                    </li>
                                );
                                })}
                            </ul>

                            {visibleCount < filteredQuests.length && (
                                <div className="flex col-span-4 justify-center mt-6" ref={bottomRef}>
                                    <button
                                    onClick={() => setVisibleCount((prev) => prev + 8)} // Load 4 more quests
                                    className="px-4 py-2 w-full text-white bg-indigo-600 rounded-md hover:bg-indigo-500 transition"
                                    >
                                    Load More <FontAwesomeIcon icon={faAngleDown} />
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {popups.map(({ id, name, quantity, message, success }) => (
                <ItemPopup
                    key={id}
                    name={name}
                    quantity={quantity}
                    message={message}
                    success={success}
                    onClose={() => setPopups((prev) => prev.filter(popup => popup.id !== id))}
                />
            ))}

        </div>

    );
};

export default QuestDashboard;
