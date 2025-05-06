import { faHandPaper, faStarHalfAlt, faStar as faStarEmpty, faStar, faCheck, faList, faList12, faListNumeric } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React, { useState, useEffect, useContext } from 'react';
import config from '../config';
import axios from 'axios';
import Confetti from 'react-confetti';
import { BeatLoader } from 'react-spinners';
import LevelUpScreen from '../Quests/LevelUpScreen';
import { UserContext } from '../Account/UserContext';

function VowPage() {
    const userId = JSON.parse(localStorage.getItem("user"))?.id;
    const { accountData, fetchAccountData} = useContext(UserContext);
    // const [accountData, setAccountData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showConfetti, setShowConfetti] = useState(false);
    const [vowCompleted, setVowCompleted] = useState(null);
    const [formData, setFormData] = useState({
        name: "",
        description: "",
        selectedStats: [],
        difficulty: 1,
        completed_at: "",
    });

    const [goals, setGoals] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const statOptions = ["strength", "intelligence", "bravery", "endurance"];
    const [message, setMessage] = useState("");
    const [isDisabled, setIsDisabled] = useState(false);


    const fireConfetti = () => {
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 8000);
    };

    const levelLock = async () => {
        try {
            if(calculateLevel(accountData.experience).level < 5){
              window.history.go(-1);
            }       
        } catch (error) {
            console.error("Error fetching account data:", error);
            setError(error.response?.data?.error || "Failed to fetch account data");
        }
    };
    
    useEffect(() => {
        levelLock();
    }, [accountData]);

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

    const fetchGoals = async () => {
        try {
            const response = await fetch(`${config.backendUrl}/vows?userId=${userId}`);
            const data = await response.json();

            const goalsWithParsedStats = data.map(vow => {
                let parsedStatReward = null;
                try {
                    parsedStatReward = vow.stat_reward ? JSON.parse(vow.stat_reward) : null;
                } catch (error) {
                    console.error("Error parsing stat_reward for vow", vow.id, error);
                    parsedStatReward = null; // If JSON is invalid, set to null
                }
                setLoading(false);
                return { ...vow, stat_reward: parsedStatReward };
            });

            setLoading(false);

            setGoals(goalsWithParsedStats);
        } catch (error) {
            
            console.error("Error fetching goals:", error);
        }
    };
    // Fetch existing goals
    useEffect(() => {
        fetchGoals();
    }, []);


    useEffect(() => {
        const today = new Date().toISOString().split("T")[0]; // Format yyyy-mm-dd
        const todayCount = goals.filter(record => record.created_at.startsWith(today)).length;
        
        console.log(todayCount);

        if (todayCount == 3) {
            setIsDisabled(true);
        }
    }, [goals]);

    // Handle changes in input fields
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value,
        });
    };

    // Handle stat selection
    const handleStatSelection = (stat) => {
        setFormData((prev) => ({
            ...prev,
            selectedStats: prev.selectedStats.includes(stat)
                ? prev.selectedStats.filter((s) => s !== stat)
                : [...prev.selectedStats, stat],
        }));
    };

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();
    
        if (formData.selectedStats.length === 0) {
            setMessage("Select at least one stat reward.");
            return;
        }
    
        const payload = {
            name: formData.name,
            description: formData.description,
            selectedStats: formData.selectedStats,
            difficulty: formData.difficulty,
            created_by: userId,
            deadline: formData.completed_at,
        };
    
        try {
            const response = await fetch(`${config.backendUrl}/vows`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
            });
    
            if (response.ok) {
                setFormData({
                    name: "",
                    description: "",
                    selectedStats: [],
                    difficulty: 1,
                    completed_at: "",
                });
                setIsModalOpen(false);
                fetchGoals();
                // fetchAccountData(userId);
            } else {
                alert("Failed to add vow");
            }
        } catch (error) {
            console.error("Error:", error);
        }
    };
    

    const handleFinishVow = async (vowId) => {

        const now = new Date();

        const localDate = now.getFullYear() + '-' +
            String(now.getMonth() + 1).padStart(2, '0') + '-' +
            String(now.getDate()).padStart(2, '0');

        await axios.post(`${config.backendUrl}/vows/finish`, { 
            vowId, 
            userId,
            completedDate: localDate 
        })
            .then(() => {
                // alert('Quest completed successfully!');
                
                // console.log("Showing the popup now");
                // showStatPopup = true;
                // console.log(showStatPopup);
                setLoading(true);
                fetchGoals();
                // onQuestUpdate(questId);
                showStatUpdates(vowId);
                fireConfetti();
                setLoading(false);
                // fetchAccountData(userId);
            })
            .catch((error) => {
                console.error('Error finishing quest:', error);
                alert(`Failed to complete quest: ${error.response?.data?.error || 'Unknown error'}`);
            });
    };

    const showStatUpdates = (vowId) => {
        setVowCompleted(vowId); // Set the quest ID to trigger the component render
    }

    const handleCloseModal = () => {
        setVowCompleted(null); // Reset questCompleted to null when the modal is closed
    }

    const statColors = {
        "strength": "red-500",
        "intelligence": "yellow-500",
        "bravery": "blue-500",
        "endurance": "green-500",
    };

    const activegoals = goals.filter(vow => vow.status === 'active');
   
    function getStatColor(stat) {
        switch (stat) {
          case "strength":
            return "rgb(239, 68, 68)"; // Red for strength
          case "endurance":
            return "rgb(34, 197, 94)"; // Green for intelligence
          case "intelligence":
            return "rgb(234, 179, 8)"; // Yellow for endurance
          case "bravery":
            return "rgb(59, 130, 246)"; // Blue for bravery
          default:
            return "rgb(156, 163, 175)"; // Gray for unknown stats
        }
    }

    return (
        <div className='w-full text-white p-6 grid lg:grid-cols-5 md:grid-cols-4'>
            {/* Add Vow Button */}
            <button
                onClick={() => setIsModalOpen(true)}
                className={`text-white p-3 rounded-full fixed bottom-20 right-8 z-50 text-md ${isDisabled ? 'bg-gray-600 opacity-[0.7]' : 'bg-indigo-600'}`}
                disabled={isDisabled}
            >
                {isDisabled ? 
                <>
                Maximum of 3 Daily goals
                </>
                :
                <>
                Set a Goal <FontAwesomeIcon icon={faHandPaper} />
                </>
                }
            </button>

            {/* Vow List */}
            <div className="grid md:grid-cols-3 col-span-4 col-start-2 md:col-start-2 grid-cols-1 lg:grid-cols-3 gap-4">
            <h1 className='text-4xl col-span-5 lg:col-span-3 font-bold text-center'>My Goals</h1>
            <p className='text-center col-span-5 font-semibold'>Goals grant GREAT rewards, but DIRE consequences if not finished before the deadline.</p>

            {goals.length === 0 && (
                <p className="col-span-4 text-center">No goals yet.</p>
            )}
            <div className="absolute flex flex-row justify-center items-center">
                <BeatLoader
                    color="#36d7b7" // Set your desired color
                    loading={loading}
                    size={10} // Adjusts the size of the bars
                    margin={2} // Adjusts the spacing between bars
                />
            </div>

            
            

            <div className='grid lg:grid-cols-3 md:grid-cols-2 col-span-5 lg:col-span-3 gap-4'>
            {goals.length > 0 && (
                goals.map((vow, index) => (
                    
                    <div
                        key={index}
                        className={`relative p-4 rounded-md bg-gray-700 w-full shadow ${
                            vow.status === 'incomplete'
                            ? 'bg-gray-900 text-red-700'
                            : vow.status === 'completed'
                            ? 'bg-green-900 text-green-700'
                            : 'bg-gray-700'
                        }`}
                        style={{
                            // For a single stat, set a direct border color
                            borderColor:
                            vow.status === 'completed' &&
                            vow.stat_reward &&
                            Object.keys(vow.stat_reward).length === 1
                                ? getStatColor(Object.keys(vow.stat_reward)[0])
                                : undefined,

                            // For multiple stats, use gradient border image
                            borderImage:
                            vow.status === 'completed' &&
                            vow.stat_reward &&
                            Object.keys(vow.stat_reward).length > 1
                                ? `linear-gradient(135deg, ${
                                    Object.keys(vow.stat_reward)
                                    .map((stat) => getStatColor(stat))
                                    .join(", ")
                                }) 1`
                                : undefined,

                            position: "relative",
                            zIndex: 1,
                            // border: "1px solid transparent",
                            borderRadius: "10px",
                            backgroundClip: "padding-box",
                            
                        }}
                    >
                        {vow.status === 'completed' && (
                            <div
                                style={{
                                    content: '""',
                                    position: "absolute",
                                    top: "-3px",
                                    bottom: "-3px",
                                    left: "-3px",
                                    right: "-3px",
                                    background: vow.stat_reward
                                        ? Object.keys(vow.stat_reward).length === 1
                                            ? getStatColor(Object.keys(vow.stat_reward)[0])
                                            : `linear-gradient(135deg, ${Object.keys(vow.stat_reward)
                                                .map((stat) => getStatColor(stat))
                                                .join(", ")})`
                                        : undefined,
                                    zIndex: -1,
                                    borderRadius: "10px",
                                }}
                            />
                        )}


                        {vow.status === 'incomplete' && (
                            <div className="absolute inset-0 flex justify-center items-center bg-black bg-opacity-80">
                                <span className="text-3xl font-extrabold text-red-700 tracking-widest uppercase leading-none text-center shadow-2xl">
                                    FAILED
                                </span>
                            </div>
                        )}

                        {vow.status === 'completed' && (
                            <div className="absolute rounded-md inset-0 flex justify-center items-center bg-black bg-opacity-80">
                                <span 
                                    className="text-3xl font-extrabold tracking-widest uppercase leading-none text-center shadow-2xl bg-clip-text text-transparent"
                                    style={{
                                        backgroundImage: Object.keys(vow.stat_reward).length === 1
                                        ? getStatColor(Object.keys(vow.stat_reward)[0]) // Direct color
                                        : `linear-gradient(135deg, ${
                                            Object.keys(vow.stat_reward).map((stat) => getStatColor(stat)).join(", ")
                                        })`,
                                    backgroundColor: Object.keys(vow.stat_reward).length === 1
                                        ? getStatColor(Object.keys(vow.stat_reward)[0])
                                        : 'transparent',
                                    }}
                                >
                                    COMPLETED
                                </span>
                            </div>
                        )}
                        <h3 className="text-lg font-bold">{vow.name}</h3>
                        <p>{vow.description}</p>

                        <p>
                            <strong>Difficulty:</strong>
                            {Array.from({ length: 5 }, (_, i) => (
                                <FontAwesomeIcon
                                    key={vow + i}
                                    icon={
                                        i < Math.floor(vow.difficulty)
                                            ? faStar
                                            : i < vow.difficulty
                                            ? faStarHalfAlt
                                            : faStarEmpty
                                    }
                                    className={`${
                                        i < vow.difficulty ? "text-yellow-500" : "text-gray-300"
                                    }`}
                                />
                            ))} 
                        </p>

                        <p>
                            <strong>Deadline:</strong> {vow.deadline}

                        </p>

                        {/* Displaying stat rewards with colors */}
                        {vow.stat_reward && Object.keys(vow.stat_reward).length > 0 ? ( 
                            <div className="mt-2">
                                <strong>Rewards:</strong>
                                <ul className="mt-1 list-disc list-inside">
                                    <li>
                                        <span className='font-semibold'>{vow.experience_reward}</span> XP
                                    </li>
                                    {Object.entries(vow.stat_reward).map(([stat, value]) => (
                                        <li key={stat} className={`${"text-"+statColors[stat] || "text-white"}`}>
                                            {stat.includes("_") 
                                                ? stat.split("_").slice(1).join(" ").charAt(0).toUpperCase() + stat.split("_").slice(1).join(" ").slice(1)
                                                : stat.charAt(0).toUpperCase() + stat.slice(1)}: 
                                            <span className="ml-1 font-semibold">+{value}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ) : (
                            <p className="mt-2 text-gray-400">No stat rewards</p>
                        )}

                        {vow.stat_reward && Object.keys(vow.stat_reward).length > 0 ? ( 
                            <div className="mt-2">
                                <strong>Consequences:</strong>
                                <ul className="mt-1 list-disc list-inside">
                                    <li>
                                        <span className='font-semibold'>0</span> XP
                                    </li>
                                    {Object.entries(vow.stat_reward).map(([stat, value]) => (
                                        <li key={stat} className={`${"text-"+statColors[stat] || "text-white"}`}>
                                            {stat.includes("_") 
                                                ? stat.split("_").slice(1).join(" ").charAt(0).toUpperCase() + stat.split("_").slice(1).join(" ").slice(1)
                                                : stat.charAt(0).toUpperCase() + stat.slice(1)}: 
                                            <span className="ml-1 font-semibold">-{value * 2}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ) : (
                            <p className="mt-2 text-gray-400">No stat rewards</p>
                        )}
                        
                        {vow.status === 'active' && (
                            <button
                                onClick={() => handleFinishVow(vow.id)}
                                className="text-3xl w-full py-4 px-3 bg-green-600 hover:bg-green-700 text-white rounded-md focus:ring-2 focus:ring-offset-2 focus:ring-green-500 mt-4"
                            >
                                Finish Goal <FontAwesomeIcon icon={faCheck} />
                            </button>
                        )}
                        
                    </div>
                ))
            )}

            </div>
            
           
            
            </div>

            {showConfetti && (
                <Confetti
                    numberOfPieces={900} // Increase the number of particles
                    gravity={0.1} // Adjust the gravity to control how fast the confetti falls
                    recycle={false} // Prevent the confetti from restarting once it finishes
                    tweenDuration={8000}
                    colors={['#ffcc00', '#ff6600', '#ff3300']}
                    className="absolute top-0 left-0 h-full z-50" // Ensures full-screen absolute positioning
                />
            )}

            {/* Modal for adding a vow */}
            {isModalOpen && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
                    <div className="bg-gray-700 p-6 rounded-lg shadow-lg w-full max-w-lg">
                        <h2 className="text-xl font-bold mb-4 text-center">Set a New Goal</h2>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block font-medium">Title</label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    className="w-full bg-gray-600 p-2 rounded text-white"
                                    placeholder='Enter your vow'
                                    required
                                />
                            </div>

                            <div>
                                <label className="block font-medium">Description</label>
                                <textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleChange}
                                    className="w-full bg-gray-600 p-2 rounded text-white"
                                    placeholder='Enter a description'
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-lg font-semibold mb-2 text-white">Choose Stats</label>
                                <div className="grid grid-cols-2 gap-4">
                                {statOptions.map((stat, index) => {
                                    const isSelected = formData.selectedStats.includes(stat);
                                    const colors = [
                                    "bg-red-500",    // Physical Strength
                                    "bg-yellow-500",   // Intelligence
                                    "bg-blue-500",  // Bravery
                                    "bg-green-500"  // endurance
                                    ];
                                    
                                    return (
                                    <label
                                        key={stat}
                                        className={`flex items-center space-x-3 cursor-pointer p-3 rounded-md shadow-md transition duration-200 ${
                                        isSelected ? colors[index % colors.length] : "bg-gray-800 hover:bg-gray-600"
                                        }`}
                                    >
                                        <input
                                        type="checkbox"
                                        checked={isSelected}
                                        onChange={() => handleStatSelection(stat)}
                                        className="hidden"
                                        />
                                        {/* <div
                                        className={`w-6 h-6 flex justify-center items-center border-2 rounded-md ${
                                            isSelected ? 'border-white bg-white' : 'border-gray-400 bg-gray-900'
                                        }`}
                                        >
                                        {isSelected && <svg className="w-4 h-4 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                        </svg>}
                                        </div> */}
                                        <span className="text-white text-base break-all">
                                            {stat.includes("_") 
                                                ? stat.split("_").slice(1).join(" ").charAt(0).toUpperCase() + stat.split("_").slice(1).join(" ").slice(1)
                                                : stat.charAt(0).toUpperCase() + stat.slice(1)}



                                        </span>
                                    </label>
                                    );
                                })}
                                </div>



                            </div>

                            <div>
                                <label className="block font-medium">Difficulty</label>
                                <div className="flex space-x-2">
                                    {[1, 2, 3, 4, 5].map((level) => (
                                        <button
                                            key={level}
                                            type="button"
                                            className={`p-2 rounded ${formData.difficulty === level ? "bg-indigo-600 text-white" : "bg-gray-600"}`}
                                            onClick={() => setFormData({ ...formData, difficulty: level })}
                                        >
                                            {level} <FontAwesomeIcon icon={faStar} className='text-yellow-500'/>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block font-medium">Completion Date</label>
                                <input
                                    type="date"
                                    name="completed_at"
                                    value={formData.completed_at}
                                    onChange={handleChange}
                                    className="w-full bg-gray-600 p-2 rounded text-white"
                                    required
                                    min={new Date().toISOString().split("T")[0]} // Set minimum date to today
                                />

                            </div>

                            <div className="flex justify-between">
                                <button type="submit" className="bg-indigo-600 text-white p-2 rounded w-full">
                                    Add Goal
                                </button>
                                <button
                                    type="button"
                                    className="bg-red-500 text-white p-2 rounded ml-4"
                                    onClick={() => setIsModalOpen(false)}
                                >
                                    Cancel
                                </button>
                            </div>
                            <div className='flex items-center justify-center w-full'>
                            {message !== "" && <span className='text-red-500 text-center w-full'>{message}</span>}
                            </div>

                        </form>
                    </div>
                </div>
            )}
            
            {vowCompleted !== null && <LevelUpScreen prevAccountData={accountData} userId={userId} vowCompleted={vowCompleted} onClose={handleCloseModal}/>}
        </div>
    );
}

export default VowPage;
