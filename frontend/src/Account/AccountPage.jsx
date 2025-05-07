import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import LevelProgressBar from "./LevelProgressBar";
import { useParams } from "react-router-dom";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faAngleLeft, faAngleRight, faArrowRight, faBrain, faCertificate, faDiamond, faDumbbell, faFire, faFireAlt, faHandFist, faHeart, faMedal, faRunning } from '@fortawesome/free-solid-svg-icons';
import config from "../config";

const AccountPage = ({ id }) => {
    const { userId } = useParams();
    const [accountData, setAccountData] = useState(null);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState("gear");
    const [activeDropdown, setActiveDropdown] = useState(null);
    const dropdownRef = useRef(null); // Reference to the dropdown element
    const [badges, setBadges] = useState([]);

    const [baseStats, setBaseStats] = useState({});
    const [upgradedStats, setUpgradedStats] = useState({});

    const toggleDropdown = (slot) => {
        setActiveDropdown((prev) => (prev === slot ? null : slot));
    };

    useEffect(() => {
        document.title = "Re:LIFE | Account Page"; // Set the title for this component
    }, []);

    const isOwner = id == userId;

    
    const ranks = [
        { levelRequirement: 1, rank: "F-", color: "text-green-500", description: "Beginner – just getting started." },
        { levelRequirement: 11, rank: "F", color: "text-lime-500", description: "Novice explorer of features." },
        { levelRequirement: 21, rank: "F+", color: "text-emerald-500", description: "Starting to stand out!" },
        { levelRequirement: 31, rank: "D-", color: "text-teal-500", description: "Basic engagement level." },
        { levelRequirement: 41, rank: "D", color: "text-cyan-500", description: "Slightly more active." },
        { levelRequirement: 51, rank: "D+", color: "text-sky-500", description: "Gaining traction." },
        { levelRequirement: 61, rank: "C-", color: "text-blue-500", description: "Improved consistency." },
        { levelRequirement: 71, rank: "C", color: "text-indigo-500", description: "Intermediate level user." },
        { levelRequirement: 81, rank: "C+", color: "text-violet-500", description: "Reliable contributor." },
        { levelRequirement: 91, rank: "B-", color: "text-purple-500", description: "Notable activity." },
        { levelRequirement: 101, rank: "B", color: "text-fuchsia-500", description: "Advanced and consistent." },
        { levelRequirement: 111, rank: "B+", color: "text-pink-500", description: "Power user potential." },
        { levelRequirement: 121, rank: "A-", color: "text-rose-500", description: "Highly engaged." },
        { levelRequirement: 131, rank: "A", color: "text-orange-500", description: "Elite tier user." },
        { levelRequirement: 141, rank: "A+", color: "text-amber-500", description: "Influencer status." },
        { levelRequirement: 151, rank: "S-", color: "text-red-500", description: "Expert level." },
        { levelRequirement: 176, rank: "S", color: "text-red-600", description: "Mastered the system." },
        { levelRequirement: 201, rank: "S+", color: "text-red-700", description: "Legendary contributor." },
        { levelRequirement: 251, rank: "S++", color: "text-red-800", description: "Top 1% performer." },
        { levelRequirement: 301, rank: "Z", color: "text-black", description: "Mythic status – beyond mastery." }
    ];
      

    const fetchAccountData = async () => {
        try {
            const response = await axios.get(`${config.backendUrl}/account`, {
                params: { userId: userId ? userId : id },
            });
            const player = response.data
            setAccountData(response.data);
            setBadges(JSON.parse(player.badges));
        } catch (error) {
            console.error("Error fetching account data:", error);
            setError(error.response?.data?.error || "Failed to fetch account data");
        }
    };

    useEffect(() => {
        fetchAccountData();
    }, [userId]);

    useEffect(() => {
        const loadStats = async () => {
            const playerStats = accountData.stats;
            
            // Calculate base stats (without equipment)
            let basePayload = {
                maxHealth: Math.floor(Math.pow(((15 * playerStats.endurance) + (2 * playerStats.strength)), 0.8)),
                maxMana: Math.floor((10 * playerStats.intelligence) + (2 * playerStats.endurance)),
                manaRegeneration: Math.round(2 * playerStats.intelligence),
                parry: 8 + Math.floor(Math.pow((0.75 * playerStats.endurance + 0.25 * playerStats.strength), 0.6)),
                armor: Math.floor(Math.pow(0.25 * playerStats.endurance, 0.7)),
                hitAbility: 9 + Math.floor(Math.pow((1.25 * playerStats.strength + 0.5 * playerStats.bravery), 0.6)),
                damage: Math.floor(Math.pow((1 * playerStats.strength + Math.floor(0.25 * playerStats.bravery)), 0.8)),
                magicPenetration: 9 + Math.round(Math.sqrt(playerStats.intelligence + (0.25 * playerStats.strength))),
                magicResistance: 9 + Math.round(Math.sqrt(0.8 * playerStats.intelligence + 0.25 * playerStats.endurance)),
                spellEffectMultiplier: Math.round(Math.pow(0.5 * playerStats.intelligence + 0.15 * playerStats.strength, 1/3) * 100) / 100,
            };
    
            let upgradedPayload = { ...basePayload };
    
            // Fetch and apply equipment bonuses
            const slots = ["head", "torso", "legs", "feet", "weapon"];
            try {
                const responses = await Promise.all(slots.map(async (slot) => {
                    if (!accountData.equipment[slot]) return null;
                    try {
                        const response = await axios.get(`${config.backendUrl}/items/${accountData.equipment[slot].name}`);
                        return response.data ? { slot, data: response.data[0] } : null;
                    } catch (error) {
                        console.error(`Failed to fetch item stats for ${slot}:`, error);
                        return null;
                    }
                }));
    
                responses.forEach(result => {
                    if (!result || !result.data?.stats) return;
                    let itemStats;
                    try {
                        itemStats = JSON.parse(result.data.stats);
                    } catch (error) {
                        console.error(`Failed to parse stats for item in slot ${result.slot}:`, result.data.stats);
                        return;
                    }
    
                    // Apply stat boosts
                    Object.keys(itemStats).forEach(stat => {
                        if (typeof itemStats[stat] === "number") {
                            upgradedPayload[stat] = (upgradedPayload[stat] || 0) + itemStats[stat];
                        }
                    });
                });
            } catch (error) {
                console.error("Unexpected error in loadStats:", error);
            }
    
            setBaseStats(basePayload);
            setUpgradedStats(upgradedPayload);
        };
    
        if (accountData) loadStats();
    }, [accountData]);

    const handleClickOutside = (event) => {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
            setActiveDropdown(null); // Close the dropdown if clicked outside
        }
    };

    useEffect(() => {
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const equipItem = async (slot, itemId) => {
        try {
            // Post request to backend to update equipment
            const response = await axios.post(`${config.backendUrl}/update-equipment`, {
                userId,        // User ID (required for backend)
                slot,          // Slot in which the item should be equipped (e.g., head, torso)
                itemId: itemId || null,  // ID of the item to equip, or null to de-equip
                inventory      // Current inventory of the user
            });
    
            // Check if the backend response is successful
            if (response.status === 200) {
                // Update the account data with the new item equipped
                setAccountData((prev) => {
                    console.log(prev);
                    let selectedItem;
    
                    if (itemId !== null) {
                        // If itemId is not null, find the item in the inventory
                        selectedItem = prev.inventory.find((item) => item.id === itemId);
    
                        // If the item is not found, set it to a default value
                        if (!selectedItem) {
                            console.warn(`Item with id ${itemId} not found in inventory.`);
                            selectedItem = { id: "", name: "None", type: slot };  // Default item
                        }
                    } else {
                        // If itemId is null (de-equipping), set selectedItem to default "None"
                        selectedItem = { id: "", name: "None", type: slot };
                    }
    
                    return {
                        ...prev,
                        equipment: {
                            ...prev.equipment,
                            [slot]: selectedItem,
                        },
                    };
                });
    
                // Optionally, re-fetch account data (this ensures the state is synchronized with the backend)
                await fetchAccountData();
            } else {
                console.error("Failed to update equipment, backend response:", response);
            }
        } catch (error) {
            console.error("Error equipping item:", error.response?.data?.error || error.message);
        }
    };

    
    
    
    const signOut = async() => {
        localStorage.setItem("user", null);
        window.location.reload();
    }
    
    
    if (error) return <p>{error}</p>;
    if (!accountData) return <p>Loading...</p>;
    const { username, experience, stats, equipment, inventory } = accountData;

    

    const equipmentSlots = [
        { slot: "head", top: "15.8%", left: "48.3%", zIndex: 100 },
        { slot: "torso", top: "44%", left: "46.85%", zIndex: 98 },
        { slot: "legs", top: "70%", left: "50%", zIndex: 90 },
        { slot: "feet", top: "90.6%", left: "51.62%", zIndex: 80 },
        { slot: "weapon", top: "50%", left: "50%", zIndex: 99 },
    ];

    const spiritQuotes = [
        "Your light begins to fade...",
        "You sense a burning hole in your soul...",
        "Your body feels frail...",
        "A subtle disturbance perturbs you...",
        "You feel fine.",
        "You're in good spirits.",
        "You feel animated and well.",
        "A wave of power washes over you...",
        "You feel ready to do anything...",
    ];

    const spiritHealth = accountData.spiritHealth ?? 0;
    const maxSpiritHealth = accountData.maxSpiritHealth ?? 0;
    const percentage = (spiritHealth / maxSpiritHealth) * 100;

    let quoteIndex = Math.floor(percentage / 10);
    quoteIndex = Math.min(quoteIndex, spiritQuotes.length - 1); // cap at last index
    // If health is 0 or below 5%, use the lowest quote
    if (percentage <= 5) {
        quoteIndex = 0;
    }

    const selectedQuote = spiritQuotes[quoteIndex];

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

    function calculateRank(level) {
        if (level >= 1 && level <= 10) return "F-";
        if (level <= 20) return "F";
        if (level <= 30) return "F+";
        if (level <= 40) return "D-";
        if (level <= 50) return "D";
        if (level <= 60) return "D+";
        if (level <= 70) return "C-";
        if (level <= 80) return "C";
        if (level <= 90) return "C+";
        if (level <= 100) return "B-";
        if (level <= 110) return "B";
        if (level <= 120) return "B+";
        if (level <= 130) return "A-";
        if (level <= 140) return "A";
        if (level <= 150) return "A+";
        if (level <= 175) return "S-";
        if (level <= 200) return "S";
        if (level <= 250) return "S+";
        if (level <= 300) return "S++";
        if (level <= 400) return "Z";
        
        return "??"; // default or unknown rank
    }

    
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

      
    const currentLevel = calculateLevel(experience)?.level;

    // Find the latest rank where levelRequirement is <= currentLevel
    const currentRank = ranks.findLast(rank => currentLevel >= rank.levelRequirement) || ranks[0];


    return (
        <div className="w-full text-white grid 2xl:grid-cols-6 lg:grid-cols-5 md:grid-cols-3 grid-cols-1 gap-4 min-h-screen h-full p-4">
            {/* Header */}
            <div className="lg:col-start-2 md:col-start-2 lg:col-span-4 col-span-5 flex flex-col items-center justify-center">
                <h1 className="text-3xl font-bold text-center">{username}</h1>
                <div className="flex flex-wrap gap-2">
                {badges.map((badge, index) => (
                    <span
                    key={index}
                    className="px-3 mt-2 py-1 text-xs font-medium bg-gray-700 text-gray-200 rounded-full"
                    >
                    {badge}
                    </span>
                ))}
                </div>
            </div>

            {/* Main Content */}
            <div className="w-full grid lg:grid-cols-4 md:grid-cols-1 grid-cols-1 lg:col-span-4 md:col-span-4 w-full lg:col-start-2 md:col-start-2 gap-2 col-span-5">

                <div className="lg:col-span-2 md:col-span-2 flex-1 relative rounded-lg shadow-md bg-gray-800">


                    <div className="lg:px-6 py-6 px-6">
                        <div className="text-4xl font-bold z-0 relative text-center">BASE STATS</div>

                        <LevelProgressBar experience={experience} />

                        <div className="grid lg:grid-cols-2 grid-cols-1 gap-4">
                            {Object.entries(stats).map(([key, value]) => {
                                const statColors = {
                                    strength: "text-red-500",
                                    bravery: "text-blue-500",
                                    intelligence: "text-yellow-500",
                                    endurance: "text-green-500",
                                };
                                
                                const statIcons = {
                                    strength: faDumbbell,
                                    bravery: faRunning,
                                    intelligence: faBrain,
                                    endurance: faHeart,
                                }
                                const colorClass = statColors[key] || "text-gray-400";
                                const statIcon = statIcons[key] || "";
                                return (
                                    <div key={key} className="flex justify-between items-center py-2">
                                        <div className="flex items-center space-x-4">
                                        
                                            <FontAwesomeIcon icon={statIcon} className={`w-12 h-12 object-contain z-50 ${colorClass}`}/>
                                            {/* Text container */}
                                            <div className="flex flex-col">
                                                <span className={`${colorClass} font-bold text-md capitalize z-50`}>
                                                {key.includes("_") ? key.split("_")[1] : key}
                                                </span>
                                                <span className={`${colorClass} text-5xl font-bold z-50`}>{value}</span>
                                            </div>
                                        </div>

                                    </div>

                                );
                            })}

                            {/* <div className="relative flex flex-col items-center justify-center">
                                <div className="absolute w-[280px] h-[280px] rounded-full bg-cyan-300 opacity-20 blur-3xl z-0"></div>

                                <div className="absolute w-[220px] h-[220px] rounded-full bg-cyan-500 opacity-30 blur-xl z-0"></div>

                                <FontAwesomeIcon 
                                    icon={faFireAlt} 
                                    style={{ fontSize: 200 }} 
                                    className="text-cyan-300 drop-shadow-lg z-10" 
                                /> 

                                <div className="text-cyan-300 text-xl z-20">
                                    <p className="text-3xl font-bold">{accountData.spiritHealth}/{accountData.maxSpiritHealth}</p>
                                </div>
                                <p className="italic text-sm text-center">"{selectedQuote}"</p>

                            </div> */}




                        </div>
                    </div>


                </div>

                {/* Character Display */}
                <div className="relative order-first flex-1 lg:col-span-2 md:col-span-2  flex flex-col justify-center items-center h-full rounded-lg shadow-md bg-indigo-600">
                    {/* <img src={"/sprites/UI/Character frame.png"} className="w-full h-full absolute pixel-art" /> */}
                    <div className="absolute top-0 right-0 m-4">
                        <span className={`
                            fa-layers fa-fw rounded-full font-bold uppercase tracking-wider text-5xl mb-3`}>
                                <FontAwesomeIcon
                                    icon={faDiamond}
                                    className={`${currentRank.color}`}
                                />

                            <span className="fa-layers-text font-extrabold text-white" data-fa-transform="shrink-8">{currentRank.rank}</span>
                        </span>
                    </div>
                    {/* Player Sprite */}
                    <div className="character-sprite relative w-3/4">
                        <img src={"/sprites/player.png"} alt="Base Character" className="w-full pixel-art" />
                        {isOwner && (
                            <>
                            {equipmentSlots.map(({ slot, top, left, zIndex }) => (
                                
                                <div
                                    key={slot}
                                    style={{
                                        width: "100%",
                                        position: "absolute",
                                        top: top,
                                        left: left,
                                        zIndex: 9999, // Default zIndex for sprites
                                        transform: "translate(-50%, -50%)",
                                    }}
                                >
                                    {/* Clickable Area for Select Button */}
                                    <div
                                        onClick={() => toggleDropdown(slot)}
                                        className={`w-12 h-12 bg-transparent cursor-pointer ${
                                            activeDropdown === slot ? "bg-blue-300" : "hover:bg-red-300"
                                        }`}
                                        style={{
                                            position: "absolute",
                                            top: slot === "weapon" ? "60px" : "50%",
                                            left: slot === "weapon" ? "35%" : "50%",
                                            transform: "translate(-50%, -50%)",
                                            zIndex: 9999, // Ensure select button stays above everything else
                                            borderRadius: "50%",
                                        }}
                                    ></div>

                                    {/* Dropdown */}
                                    {activeDropdown === slot && (
                                        
                                        <div
                                            ref={dropdownRef}
                                            className="absolute bg-gray-700 p-2 rounded shadow-lg"
                                            style={{
                                                minWidth: "200px",
                                                fontSize: "1rem",
                                                zIndex: 9999, // Ensure dropdown stays on top
                                                top: "24px", // Custom position for weapon slot
                                                left: "0px", // Adjust horizontal position for weapon slot
                                            }}
                                        >
                                            <select
                                                value={equipment[slot]?.id || ""}
                                                onChange={(e) => {
                                                    equipItem(slot, e.target.value);
                                                    toggleDropdown(null); // Close dropdown on selection
                                                }}
                                                className="block w-full bg-gray-800 p-3 rounded text-white"
                                                style={{
                                                    fontSize: "1rem",
                                                    padding: "0.5rem",
                                                }}
                                            >
                                                <option value="">None({slot})</option>
                                                {inventory
                                                    .filter((item) => item.type === slot || equipment[slot]?.id === item.id)
                                                    .map((item) => (
                                                        <option key={item.id} value={item.id}>
                                                            {item.name}
                                                        </option>
                                                    ))}
                                            </select>
                                        </div>
                                    )}
                                </div>
                            ))}
                            </>
                        )}

                        {equipmentSlots.map(({ slot, top, left, zIndex }) => (
                            <div
                                key={slot}
                                style={{
                                    width: "100%",
                                    position: "absolute",
                                    top: top,
                                    left: left,
                                    zIndex: zIndex, // Keep equipment sprites behind the select buttons
                                    transform: "translate(-50%, -50%)",
                                }}
                            >
                                
                                {/* Equipped Item - Equipment Sprite */}
                                {equipment[slot]?.image_url && (
                                    <img
                                        src={`${equipment[slot].image_url}?v=${new Date().getTime()}` || "/sprites/equipment/default.png"}
                                        alt={`${equipment[slot].name || "None"} Gear`}
                                        className="pixel-art"
                                        style={{
                                            width: "100%",
                                            height: "100%",
                                            objectFit: "fill",
                                            zIndex: 1, // Keep equipment sprite behind the select button
                                            pointerEvents: "none", // Prevent the sprite from blocking interactions
                                        }}
                                    />
                                )}
                               
                            </div>
                        ))}
                         



                    </div>
                </div>

                {/* <div className="lg:col-span-4 md:col-span-2 flex-1 relative rounded-lg shadow-md bg-gray-700">


                    <div className="lg:px-6 py-6 px-6">
                        <div className="text-4xl font-bold z-0 relative text-center mb-4">COMBAT STATS</div>
                        <div className="grid grid-cols-2">
                        <div>
                            <ul>
                                {Object.entries(baseStats).map(([stat, value]) => (
                                    ["maxHealth", "damage", "armor", "maxMana", "manaRegeneration"].includes(stat) && (
                                        <li key={stat} className="lg:text-xl text-md my-2">
                                            {stat.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}: {value}
                                            
                                            {upgradedStats[stat] !== value && (
                                                <>
                                                    {"  →  "} 
                                                    <span className={upgradedStats[stat] > value ? "text-green-500" : "text-red-500"}>
                                                        {upgradedStats[stat]}
                                                    </span> 
                                                    {"  ("}
                                                    {upgradedStats[stat] - value > 0 ? `+${(upgradedStats[stat] - value).toFixed(2)}` : (upgradedStats[stat] - value).toFixed(2)}
                                                    {")"}
                                                </>
                                            )}
                                        </li>
                                    )
                                ))}
                            </ul>
                        </div>

                        <div>
                            <ul>
                                {Object.entries(baseStats).map(([stat, value]) => (
                                    ["hitAbility", "parry", "magicPenetration", "magicResistance", "spellEffectMultiplier"].includes(stat) && (
                                        <li key={stat} className="lg:text-xl text-md my-2">
                                            {stat.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}: {value}
                                            
                                            {upgradedStats[stat] !== value && (
                                                <>
                                                    {"  →  "} 
                                                    <span className={upgradedStats[stat] > value ? "text-green-500" : "text-red-500"}>
                                                        {upgradedStats[stat]}
                                                    </span> 
                                                    {"  ("}
                                                    {upgradedStats[stat] - value > 0 ? `+${(upgradedStats[stat] - value).toFixed(2)}` : (upgradedStats[stat] - value).toFixed(2)}
                                                    {")"}
                                                </>
                                            )}
                                        </li>
                                    )
                                ))}
                            </ul>
                        </div>




                        </div>
                        {/* <LevelProgressBar experience={experience} /> 

                       
                    </div>


                </div> */}

                <div className="p-6 col-span-1 lg:col-span-4 bg-gray-800 rounded-lg shadow-lg">
                    <h1 className="text-3xl font-bold text-center text-yellow-400 mb-6"><FontAwesomeIcon icon={faMedal} /> RANK PROGRESSION</h1>

                    <div className="flex gap-4 overflow-x-auto pb-2">
                        {ranks.map((rank, index) => {
                        const currentLevel = calculateLevel(experience)?.level;
                        console.log(currentLevel);
                        const isAchieved = currentLevel >= rank.levelRequirement;
                        const isCurrent =
                            currentLevel < rank.levelRequirement &&
                            (index === 0 || currentLevel >= ranks[index - 1].levelRequirement);

                        const progressPercent = isCurrent
                            ? Math.min((currentLevel / rank.levelRequirement) * 100, 100)
                            : isAchieved
                            ? 100
                            : 0;

                        return (
                            <div
                            key={index}
                            className={`min-w-[200px] bg-gray-700 p-4 rounded-xl shadow-md flex flex-col justify-between border-l-4
                                ${
                                isAchieved
                                    ? 'border-yellow-400'
                                    : isCurrent
                                    ? 'border-yellow-300'
                                    : 'border-gray-500'
                                }`}
                            >
                                <span className={`
                                    fa-layers fa-fw rounded-full font-bold uppercase tracking-wider text-3xl mb-3`}>
                                        <FontAwesomeIcon
                                            icon={faDiamond}
                                            className={`${rank.color}`}
                                            
                                        />
        
                                    <span className="fa-layers-text font-extrabold text-white" data-fa-transform="shrink-8">{rank.rank}</span>
                                </span>
                            {/* <div className="flex items-center gap-2 mb-2">
                                <FontAwesomeIcon
                                icon={faDiamond}
                                className={`text-xl ${
                                    isAchieved ? `${rank.color}` : isCurrent ? 'text-yellow-300' : 'text-gray-400'
                                }`}
                                />
                                <span
                                className={`font-bold text-lg ${
                                    isAchieved || isCurrent ? 'text-white' : 'text-gray-400'
                                }`}
                                >
                                {rank.rank}
                                </span>
                            </div> */}

                            <div className="text-sm text-gray-300 mb-1">Unlocks at Level {rank.levelRequirement}</div>

                            <p className="text-xs italic text-gray-400 mb-3">{rank.description}</p>

                            <div className="w-full h-2 bg-gray-600 rounded overflow-hidden">
                                <div
                                className={`h-full ${
                                    isAchieved
                                    ? 'bg-yellow-400'
                                    : isCurrent
                                    ? 'bg-yellow-300 animate-pulse'
                                    : 'bg-gray-500'
                                }`}
                                style={{ width: `${progressPercent}%` }}
                                ></div>
                            </div>

                            <div className="text-right text-xs text-gray-400 mt-1">
                                {progressPercent.toFixed(0)}%
                            </div>
                            </div>
                        );
                        })}
                    </div>
                </div>



                

            </div>
            {isOwner && (<div className="bg-red-500 z-[100] text-white rounded-md px-4 py-2 mt-3 cursor-pointer text-center lg:col-start-3 md:col-start-2 lg:col-span-2 md:col-span-4 col-span-5 h-10 w-full" onClick={signOut}>Sign Out</div>)}

            
        </div>
    );
};

export default AccountPage;
