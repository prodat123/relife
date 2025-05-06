import axios from "axios";
import React, { useState, useEffect } from "react";
import config from "../config";
import { FaShieldAlt, FaBrain, FaDumbbell, FaStar } from "react-icons/fa";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBuilding, faPlusCircle, faX } from "@fortawesome/free-solid-svg-icons";
import ItemPopup from "../Inventory/ItemPopup";

const perkMilestones = {
    strength: [20, 60, 150, 300, 1000, 2000],
    intelligence: [20, 60, 150, 300, 1000, 2000],
    endurance: [20, 60, 150, 300, 1000, 2000],
    bravery: [20, 60, 150, 300, 1000, 2000],
};

const statColors = {
    strength: "red-500",
    intelligence: "yellow-500",
    endurance: "green-500",
    bravery: "blue-500",
};

const hoverColors = {
    strength: "red-400",
    intelligence: "yellow-400",
    endurance: "green-400",
    bravery: "blue-400",
};


const PerkUnlockSystem = () => {
    const userId = JSON.parse(localStorage.getItem("user"))?.id;

    const [player, setPlayer] = useState({});
    const [playerPerks, setPlayerPerks] = useState([]);
    const [playerPerkPoints, setPlayerPerkPoints] = useState(0);
    const [allPerks, setAllPerks] = useState([]);
    const [availablePerks, setAvailablePerks] = useState([]);
    const [unlockedMilestones, setUnlockedMilestones] = useState([]);
    const [claimableMilestones, setClaimableMilestones] = useState([]);
    const [perksToChoose, setPerksToChoose] = useState([]);
    const [chosenPerks, setChosenPerks] = useState([]);
    const [claimedMilestones, setClaimedMilestones] = useState([]);

    const [isPerkPopupOpen, setPerkPopupOpen] = useState(false);

    const [popups, setPopups] = useState([]);

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
    
    useEffect(() => {
        const fetchPerks = async () => {
            try {
                const response = await axios.get(`${config.backendUrl}/perks`);
                const fetchedPerks = response.data.map(perk => ({
                    ...perk,
                    activate_criteria: JSON.parse(perk.activate_criteria),
                    effect: JSON.parse(perk.effect),
                }));
    
                setAllPerks(fetchedPerks);
    
                // Ensure playerPerks is parsed from JSON (if stored as a JSON string)
                const userPerks = typeof playerPerks === "string" ? JSON.parse(playerPerks) : playerPerks;
    
                // Filter out perks that the user already has
                const filteredPerks = fetchedPerks.filter(
                    perk => !userPerks.some(playerPerk => playerPerk.perkName === perk.name)
                );

                // console.log("Available perks just got refreshed")
    
                setAvailablePerks(filteredPerks);
            } catch (error) {
                console.error("Error fetching perks:", error);
            }
        };

        
        fetchPerks();
    }, [playerPerks]); // Re-run when playerPerks updates
    
    const fetchAccountData = async () => {
        try {
            const response = await axios.get(`${config.backendUrl}/account`, {
                params: { userId },
            });

            if(calculateLevel(response.data.experience).level < 11){
                window.location.href = '/dashboard';
            }
            setPlayer(response.data.stats);
            const playerPerks = JSON.parse(response.data.perks);
            setPlayerPerks(playerPerks);
            const playerMilestones = JSON.parse(response.data.claimedMilestones);
            setClaimedMilestones(playerMilestones);
            setPlayerPerkPoints(response.data.perkPoints);
        } catch (error) {
            console.error("Error fetching account data:", error);
        }
    };

    useEffect(() => {
        fetchAccountData();
    }, [userId]);

    useEffect(() => {
        setClaimableMilestones(
            Object.entries(perkMilestones).flatMap(([stat, milestones]) =>
                milestones
                    .filter(milestone => 
                        player[stat] >= milestone &&
                        !(claimedMilestones).some(claimed => claimed.stat === stat && claimed.milestone === milestone) // Check against player.claimedMilestones
                    )
                    .map(milestone => ({ stat, milestone }))
            )
        );
    }, [player, perkMilestones, claimedMilestones]); // Dependencies updated
    
    
    const handleClaimPerk = async (stat, milestone) => {
        // Prevent duplicate claims
        if (claimedMilestones.some(m => m.stat === stat && m.milestone === milestone)) {
            console.warn("Milestone already claimed!");
            return;
        }
    
        try {
            // Increment perk points instead of choosing a perk
            const response = await axios.post(`${config.backendUrl}/claim-perk-point`, {
                userId,
                stat,
                milestone
            });
    
            console.log(response.data.message);
    
            // Update the state to reflect the newly claimed milestone
            setClaimedMilestones(prev => [...prev, { stat, milestone }]);
            setClaimableMilestones(prev => prev.filter(m => !(m.stat === stat && m.milestone === milestone)));
            setPlayerPerkPoints(prev => prev + 1);
        } catch (error) {
            console.error("Error claiming perk point:", error.response?.data?.error || error.message);
        }
    };

    const handleChoosePerk = (perkName) => {
        const selectedPerk = availablePerks.find(p => p.name === perkName);
        if (!selectedPerk) {
            console.warn("Perk not found!");
            setPopups(prev => [
                ...prev,
                { id: Date.now(), name: "Perk not found!", message: "The perk with this name does not exist!", success: false }
            ]);
            return;
        }
    
        if (playerPerks.some(p => p.perkName === selectedPerk.name)) {
            console.warn("Perk already acquired!");
            setPopups(prev => [
                ...prev,
                { id: Date.now(), name: "You already have this perk!", success: false }
            ]);
            return;
        }
    
        if (playerPerkPoints < selectedPerk.pointCost) {
            console.warn("Not enough perk points!");
            setPopups(prev => [
                ...prev,
                { id: Date.now(), name: "You do not have enough perk points!", message: "Gather more perk points by completing quests with specific stat rewards!", success: false }
            ]);
            return;
        }
    
        // Deduct perk points and update player perks locally
        setPlayerPerks(prev => [...prev, selectedPerk]);
        setPlayer(prev => ({ ...prev, perkPoints: prev.perkPoints - selectedPerk.pointCost }));
    
        const newPerkPoints = playerPerkPoints - selectedPerk.pointCost;
    
        // Send update to backend
        axios.post(`${config.backendUrl}/choose-perk`, {
            userId,
            perkName: selectedPerk.name, // Only sending perk name
        })
        .then(res => {
            // Immediately remove the purchased perk from availablePerks
            setPlayerPerkPoints(newPerkPoints);
            fetchAccountData();
            // setAvailablePerks(prev => prev.filter(perk => perk.name !== selectedPerk.name));
            setPopups(prev => [
                ...prev,
                { id: Date.now(), name: `You successfully purchased the ${selectedPerk.name} perk!`, success: true }
            ]);
        })
        .catch(err => console.error("Error updating perk:", err));
    };
    

    const calculateProgress = (stat) => {
        const milestones = perkMilestones[stat];
        const playerStat = player[stat] || 0;

        // Find the current milestone range
        let previousMilestone = 0;
        let nextMilestone = milestones[0]; // First milestone

        for (let i = 0; i < milestones.length; i++) {
        if (playerStat < milestones[i]) {
            nextMilestone = milestones[i];
            break;
        }
        previousMilestone = milestones[i];
        }

        // If the player has surpassed all milestones, use the last milestone
        if (playerStat >= milestones[milestones.length - 1]) {
        previousMilestone = milestones[milestones.length - 1];
        nextMilestone = milestones[milestones.length - 1];
        }

        // Calculate progress within the current milestone range
        const range = nextMilestone - previousMilestone;
        const progress = playerStat - previousMilestone;
        return (progress / range) * 100;
    };

    const calculateMilestonePosition = (stat, milestone) => {
        const milestones = perkMilestones[stat];
        const maxStat = milestones[milestones.length - 1]; // Last milestone is the maximum
        return (milestone / maxStat) * 100;
    };

    const removePerk = async (perk) => {
        const selectedPerk = allPerks.find(p => p.name === perk.perkName);

        try {
            const response = await axios.post(`${config.backendUrl}/remove-perk`, {
                userId,
                perkName: perk.perkName,
                refundPoints: selectedPerk.pointCost, // Adjust based on your refund logic
            });
    
            if (response.data.success) {
                setPlayerPerks(response.data.newPerks); // Update state
                setPlayerPerkPoints(response.data.newPerkPoints); // Update perk points
            }
        } catch (error) {
            console.error("Error removing perk:", error);
        }
    };
    

    return (
        <div className="grid grid-cols-6 p-2">
            <div className="md:col-start-2 lg:col-start-2 lg:col-span-5 col-span-6 p-6 space-y-6 text-white">
                <h1 className="text-4xl font-bold text-center">Player Perks</h1>

                <div className="space-y-8 p-2">
                    {Object.keys(perkMilestones).map(stat => {
                        const progressPercentage = calculateProgress(stat);
                        const milestones = perkMilestones[stat];
                        const playerStat = player[stat] || 0;

                        // Find the current milestone range
                        let previousMilestone = 0;
                        let nextMilestone = milestones[0]; // First milestone

                        for (let i = 0; i < milestones.length; i++) {
                            if (playerStat < milestones[i]) {
                                nextMilestone = milestones[i];
                                break;
                            }
                            previousMilestone = milestones[i];
                        }

                        // If the player has surpassed all milestones, use the last milestone
                        if (playerStat >= milestones[milestones.length - 1]) {
                            previousMilestone = milestones[milestones.length - 1];
                            nextMilestone = milestones[milestones.length - 1];
                        }

                        // Calculate the position of the previous and next milestones
                        const previousMilestonePosition = calculateMilestonePosition(stat, previousMilestone);
                        const nextMilestonePosition = calculateMilestonePosition(stat, nextMilestone);

                        // Calculate the progress bar's left offset and width
                        const progressBarLeft = previousMilestonePosition;
                        const progressBarWidth = nextMilestonePosition - previousMilestonePosition;

                        return (
                            <div key={stat}>
                                <h3 className="text-lg font-semibold mt-4 mb-2">
                                    {stat.charAt(0).toUpperCase() + stat.slice(1)} Milestone Progress
                                </h3>
                                <div className="relative w-full">
                                    {/* Background Bar */}
                                    <div className="h-2 bg-gray-600 rounded-full relative">
                                        {/* Progress Bar */}
                                        <div
                                            className={`bg-${statColors[stat]} h-2 rounded-full absolute`}
                                            style={{
                                                width: `${progressPercentage}%`,
                                            }}
                                        ></div>
                                    </div>

                                    {/* Milestone Labels */}
                                    <div className="absolute top-4 w-full">
                                        {/* Previous milestone label */}
                                        <span
                                            className="text-gray-400 absolute transform -translate-x-1/2"
                                            style={{ left: `0%` }}
                                        >
                                            {previousMilestone}
                                        </span>

                                        {/* Next milestone label (progress-dependent) */}
                                        <span
                                            className="text-gray-400 absolute transform -translate-x-1/2"
                                            style={{ left: `100%` }}
                                        >
                                            {nextMilestone}
                                        </span>
                                    </div>
                                </div>


                                {/* <div className="relative">
                                    
                                    <div className="h-2 bg-gray-600 rounded-full relative">
                                        <div
                                            className={`bg-${statColors[stat]} h-2 rounded-full`}
                                            style={{
                                                width: `${progressBarWidth}%`,
                                            }}
                                        ></div>
                                    </div>

                                    <div className="absolute top-4 left-0 w-full">
                                        {milestones.map((milestone, index) => {
                                            const positionPercentage = calculateMilestonePosition(stat, milestone);

                                            return (
                                                <span
                                                    key={index}
                                                    className="text-gray-400 absolute transform -translate-x-1/2"
                                                    style={{ left: `${positionPercentage}%` }}
                                                >
                                                    {milestone}
                                                </span>
                                            );
                                        })}
                                    </div>
                                </div> */}
                            </div>
                        );
                    })}
                </div>

                <div className="bg-gray-700 p-6 rounded-md shadow-lg">
                    <h2 className="text-2xl font-semibold mb-4">Claimable Perk Points</h2>
                    {claimableMilestones.filter(({ stat, milestone }) =>
                        !(player.claimedMilestones || []).some(
                            claimed => claimed.stat === stat && claimed.milestone === milestone
                        )
                    ).length > 0 ? (
                        claimableMilestones
                            .filter(({ stat, milestone }) =>
                                !(player.claimedMilestones || []).some(
                                    claimed => claimed.stat === stat && claimed.milestone === milestone
                                )
                            )
                            .map(({ stat, milestone }) => (
                                <button
                                    key={`${stat}-${milestone}`}
                                    onClick={() => handleClaimPerk(stat, milestone)}
                                    className={`text-white font-semibold py-2 px-4 rounded-lg m-2 bg-${statColors[stat]} hover:bg-${statColors[stat].replace('500', '400')}`}
                                >
                                    Claim (1) Perk Point
                                </button>
                            ))
                    ) : (
                        <p className="text-gray-400">No perks available to claim.</p>
                    )}
                </div>

                
                <div className="flex justify-center">
                    <button
                        onClick={() => setPerkPopupOpen(true)}
                        className={` text-white font-semibold w-full py-2 px-6 rounded-md ${playerPerks.length < 6 ? "bg-indigo-600 hover:bg-indigo-500 hover:scale-[102%] transition-all duration-200" : "opacity-[0.7] bg-indigo-600 cursor-not-allowed"}`}
                        disabled={playerPerks.length < 6 ? false : true}
                    >
                        {playerPerks.length < 6 ? <><FontAwesomeIcon icon={faPlusCircle} /> Choose Perks</> : <p>You are out of perk slots</p>}
                    </button>
                </div>


                <div className="bg-gray-700 p-6 rounded-md shadow-lg">
                    <h2 className="text-2xl font-semibold mb-4">Chosen Perks ({playerPerks.length}/6 Perks)</h2>
                    {playerPerks.length > 0 ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            {playerPerks.map(perk => {
                            // Find the complete perk details from allPerks array based on perkName.
                            const fullPerk = allPerks.find(p => p.name === perk.perkName);
                            return (
                                <div key={perk.perkName} className="bg-gray-800 p-4 rounded-lg shadow-md flex flex-col items-center justify-center">
                                <span className={`text-${statColors[perk.type]} text-lg font-bold text-center`}>
                                    {perk.perkName}
                                </span>
                                <p className="text-white text-center text-sm">
                                    {fullPerk ? fullPerk.description : "No description available."}
                                </p>
                                <button 
                                    onClick={() => removePerk(perk)} 
                                    className="mt-2 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold px-3 py-1 rounded"
                                >
                                    Remove
                                </button>
                                </div>
                            );
                            })}
                        </div>
                        ) : (
                        <p className="text-gray-400">No perks chosen yet.</p>
                    )}



                </div>
            </div>
            {isPerkPopupOpen && (
                    <div className="fixed inset-0 flex items-center justify-center z-[9999] bg-black bg-opacity-50">
                        <div className="bg-gray-700 p-6 rounded-md shadow-lg max-w-3xl h-3/4 overflow-y-auto w-full">
                            <div className="relative flex flex-col justify-center items-center text-center">
                                <h2 className="text-xl font-semibold text-white">Choose Perks</h2>
                                <p className={`${playerPerks.length < 6 ? "text-white" : "text-red-400"}`}>Slots Left: {6 - playerPerks.length}</p>
                                <h3 className="text-white">Points Left: {playerPerkPoints}</h3>
                                <button
                                    onClick={() => setPerkPopupOpen(false)}
                                    className="absolute right-0 text-gray-300 hover:text-white text-xl"
                                >
                                    <FontAwesomeIcon icon={faX} />
                                </button>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
                                {["strength", "bravery", "endurance", "intelligence"].map((type, id) => {
                                    const filteredPerks = availablePerks.filter((perk) => perk.type === type);

                                    return (
                                        filteredPerks.length > 0 && (
                                            <div key={type} className="space-y-2">
                                                <h3 className="text-lg font-bold text-white text-center">
                                                    {type.charAt(0).toUpperCase() + type.slice(1)}
                                                </h3>
                                                <div className="grid grid-cols-1 gap-2">
                                                    {filteredPerks.map((perk) => (
                                                        <button key={perk.id} className={`p-2 rounded-md shadow-md ${playerPerks.length < 6 ? `bg-${statColors[type]} hover:scale-105 hover:bg-${statColors[type].replace('500', '400')} transition-all duration-200` : `bg-${statColors[type]} opacity-[0.7] cursor-not-allowed`}`} disabled={playerPerks.length < 6 ? false : true} onClick={() => handleChoosePerk(perk.name)}>
                                                           
                                                            <h1 className={`font-semibold text-white text-center`}>{perk.name}</h1>
                                                            <p className="text-xs text-white text-gray-300 mt-1 text-center">{perk.description}</p>
                                                            <p className="text-white text-xs font-semibold text-center">
                                                                Cost: {perk.pointCost} Perk Points
                                                            </p>
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        )
                                    );
                                })}
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

export default PerkUnlockSystem;