import React, { useState, useEffect, useRef, useContext, useMemo } from "react";
import { useSpring, animated } from "@react-spring/web";
import axios from "axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowDown, faArrowUp, faBoltLightning, faBroadcastTower, faCircleNodes, faCoins, faCompress, faDungeon, faExpand, faFire, faFistRaised, faLevelUp, faMessage, faPastafarianism, faPerson, faPersonHiking, faShield, faShieldVirus, faStairs, faStop, faTimesRectangle, faTowerBroadcast, faTowerObservation, faTriangleCircleSquare, faTriangleExclamation, faWandSparkles } from "@fortawesome/free-solid-svg-icons";
import config from "../config";
import { FaFistRaised, FaShieldAlt } from "react-icons/fa";
import { easeCubicInOut } from 'd3-ease'; // Optional: You can use D3's cubic bezier function
import { UserContext } from "../Account/UserContext";
import ConsumableInventory from "./ConsumableInventory";
import { v4 as uuidv4 } from 'uuid';
import { useLocation, useParams } from "react-router-dom";
import PomodoroTimer from "./PomodoroTimer";
import PomodoroSelector from "./PomodoroSelector";
import TowerPopup from "./TowerPopup";

// const Popup = ({ show, message, onClose, totalRewards }) => {
//     const user = JSON.parse(localStorage.getItem('user'));    

//     if (!show) return null;

//     const resetGame = async () => {
//         try {
//             const response = await axios.post(`${config.backendUrl}/tower-restart`, {  
//                 userId: user.id   // Send userId in request body
//             });
//             onClose();
//             // window.location.reload();    // Reload the page
//         } catch (error) {
//             console.error('Error during resetGame:', error.response?.data?.error || error.message);
//             alert(`Error: ${error.response?.data?.error || 'An error occurred. Please try again.'}`);
//         }
//     };

    

//     return (
//         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
//             <div className="bg-white text-black p-6 rounded-lg shadow-lg text-center">
//                 <h2 className="text-xl font-bold mb-4">{message.title}</h2>
//                 <p className="mb-4 w-96">{message.body}</p>
//                 {message.currency_rewards !== undefined && (
//                     <div className="mb-4">
//                         <p className="font-bold">
//                             Total Reward: {message.currency_rewards} gold
//                         </p>
//                     </div>
//                 )}
//                 <div className="gap-4 flex flex-row items-center justify-center">
//                 <button
//                     onClick={resetGame}
//                     className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-400"
//                 >
//                     Retry
//                 </button>

//                 {/* <button
//                     onClick={onClose}
//                     className="bg-indigo-700 text-white px-4 py-2 rounded hover:bg-indigo-600"
//                 >
//                     Exit Tower
//                 </button> */}
//                 </div>
//             </div>
//         </div>
//     );
// };

const IdleGame = () => {
    const user = JSON.parse(localStorage.getItem('user'));
    const { duration } = useParams();
    
    
    const [player, setPlayer] = useState(null);
    const [inventory, setInventory] = useState([]);
    const [playerHitAbility, setPlayerHitAbility] = useState(0);
    const [monsterHitAbility, setMonsterHitAbility] = useState(0);
    const [playerParry, setPlayerParry] = useState(0);
    const [monsterParry, setMonsterParry] = useState(0);
    const [playerDamage, setPlayerDamage] = useState(0);
    const [monsterDamage, setMonsterDamage] = useState(0);
    const [playerArmor, setPlayerArmor] = useState(0);
    const [monsterArmor, setMonsterArmor] = useState(0);
    const [playerMagicPenetration, setPlayerMagicPenetration] = useState(0);
    const [monsterMagicPenetration, setMonsterMagicPenetration] = useState(0);
    const [playerMagicResistance, setPlayerMagicResistance] = useState(0);
    const [monsterMagicResistance, setMonsterMagicResistance] = useState(0);
    
    const [monster, setMonster] = useState(null); // Load dynamically
    const [stages, setStages] = useState([]);
    const [stageName, setStageName] = useState('');
    const [currentStageIndex, setCurrentStageIndex] = useState(0);
    const [logs, setLogs] = useState([]);
    const [gameOver, setGameOver] = useState(false); // Track game state
    const [isAttacking, setIsAttacking] = useState(false); // Prevent double execution
    const [showPopup, setShowPopup] = useState(false);
    const [popupContent, setPopupContent] = useState({ title: "", body: "" });

    const [defeatedMonster, setDefeatedMonster] = useState(null); // State for defeated monster
    const [dialogue, setDialogue] = useState("");
    const [isTransitioning, setIsTransitioning] = useState(false); // Prevent actions during transition
    const [showSkipPopup, setShowSkipPopup] = useState(false);

    const [enemyNum, setEnemyNum] = useState(1);
    const [combatSpeed, setCombatSpeed] = useState(1000);

    const [totalRewards, setTotalRewards] = useState(Number(localStorage.getItem("goldEarned")) || 0);
    const [floorsToSkip, setFloorsToSkip] = useState(0); // Add floorsToSkip state
    const [maxFloorsToSkip, setMaxFloorsToSkip] = useState(0);

    const [roundsNum, setRoundsNum] = useState(0);
    const [showFloorTagline, setShowFloorTagline] = useState(false);

    const [savedSpells, setSavedSpells] = useState([]);

    const [perks, setPerks] = useState([]);
    const [edrIncrementState, setEdrIncrementState] = useState(0);

    const stageRefs = useRef([]); // Array of refs for all stages

    const [allEnemies, setAllEnemies] = useState({});
    const [loadingEnemies, setLoadingEnemies] = useState(true);   

    const [activatedPerks, setActivatedPerks] = useState([]);

    const [isFullscreen, setIsFullscreen] = useState(false);

    const [showPrompt, setShowPrompt] = useState(false);
    const [attempts, setAttempts] = useState(Number(localStorage.getItem("attempts")) || 0);
    const [finishTimer, setFinishTimer] = useState(false);
    const [goldMultiplier, setGoldMultiplier] = useState(0);


    const location = useLocation();



         
    useEffect(() => {
        document.title = "Re:LIFE | Idle Game"; // Set the title for this component
    }, []);


    const toggleFullscreen = async () => {
        try {
        if (!document.fullscreenElement) {
            await document.documentElement.requestFullscreen();
            localStorage.setItem("fullscreen", "true");
        } else {
            await document.exitFullscreen();
            localStorage.removeItem("fullscreen");
        }
        } catch (err) {
        console.error("Fullscreen toggle error:", err);
        }
    };

    useEffect(() => {
        const handleChange = () => {
            const currentlyFullscreen = !!document.fullscreenElement;
            setIsFullscreen(currentlyFullscreen);
        };

        document.addEventListener("fullscreenchange", handleChange);

        return () => {
            document.removeEventListener("fullscreenchange", handleChange);
        };
    }, []);
         

    
    const updateFloor = async (stageIndex) => {
        if (!user.id) return;
        try {
            await axios.put(`${config.backendUrl}/tower-floor-update`, {
                userId: user.id,
                floor: stageIndex
            });
        } catch (error) {
            console.error('Failed to update floor:', error);
        }
    };

    useEffect(() => {
      // Scroll to the current stage when it changes
      if (stageRefs.current[currentStageIndex]) {
        stageRefs.current[currentStageIndex].scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }
    }, [currentStageIndex]); // Runs whenever currentStageIndex changes

    useEffect(() => {
        const fetchAllEnemies = async () => {
            try {
                const response = await axios.get(`${config.backendUrl}/allMonsters`);
    
                if (!Array.isArray(response.data)) {
                    console.error("Unexpected response format:", response.data);
                    return;
                }
    
                const enemyData = response.data.reduce((acc, monster) => {
                    acc[monster.name] = monster;
                    return acc;
                }, {}); // Convert array to object with monster names as keys
    
                setAllEnemies(enemyData);
                setLoadingEnemies(false);
            } catch (error) {
                console.error("Error fetching all enemies:", error);
            }
        };
    
        fetchAllEnemies();
    }, []);

    const applyPerks = (timing) => {
        if(perks !== ""){
            perks.forEach(perk => {
                try {
                    // Only process perks that match the correct timing
                    if (perk.activate_time !== timing) return;

                    // console.log(perk.activate_criteria);
                    const sanitizedCriteria = perk.activate_criteria.replace(/[^a-zA-Z0-9_.<=>!&|()+\-*/]/g, '');
                    // let activateCriteriaTest = JSON.stringify(perk.activate_criteria);

                    const conditionFunction = new Function("player", "monster", `return ${sanitizedCriteria};`);
                    const evaluateCriteria = conditionFunction(player, monster);

                    // console.log(Boolean(evaluateCriteria));
                    // Evaluate the activation condition
                    if (evaluateCriteria === true) {
                        
                        let effectDescription;
                        // Apply the effects
                        const effectDescriptions = [];  // Store multiple effect descriptions

                        Object.entries(JSON.parse(perk.effect)).forEach(([key, value]) => {
                            if (key.startsWith("edr_")) {
                                const edrKey = key.split("_")[1];
                        
                                effectDescriptions.push(`Add ${value} extra ${edrKey} EDR`);
                                
                                // Increment the corresponding EDR state
                                setEdrIncrementState(prevState => ({
                                    ...prevState,
                                    [edrKey]: (prevState[edrKey] || 0) + value,
                                    duration: perk.duration,
                                }));
                                
                            } else if (key.startsWith("percentage_")) {
                                const stat = key.split("_")[1];
                        
                                effectDescriptions.push(`Decrease monster ${stat} by ${value * 100}%`);
                        
                                if (monster.hasOwnProperty(stat)) {
                                    monster[stat] -= value;  // Apply percentage effect
                                }
                            }
                        });

                        if (!activatedPerks.some((p) => p.id === perk.id)) {
                            setActivatedPerks([...activatedPerks, {...perk, effectDescriptions}]);
                        }

                        setLogs((prevLogs) => [
                            `${perk.name} (${perk.activate_criteria}) is activated.`,
                            ...prevLogs,
                        ]);

                    }
                } catch (error) {
                    console.error(`Error evaluating perk ${perk.name}:`, error);
                }
            });
        }
        
    };

    useEffect(() => {
        if (defeatedMonster) {
            setIsTransitioning(true);

            setDialogue(displayDialogue(monster.dialogue));

            // Display defeated monster for 2 seconds
            const timeout = setTimeout(() => {
                setEnemyNum(prev => prev + 1);
                setDefeatedMonster(null); // Clear defeated monster state
                handleNextEnemyOrStage(); // Proceed to the next monster or stage
                setIsTransitioning(false);
            }, 1000);

            return () => clearTimeout(timeout);
        }
    }, [defeatedMonster]);

    // let towerId = useMemo(() => uuidv4(), []);    

    const joinTower = async (userId) => {
        let uniqueTowerId = uuidv4();
        
        try {
            const response = await axios.post(`${config.backendUrl}/tower-join`, {
                id: uniqueTowerId,
                userId: userId,  // userId passed from the logged-in user's data
            });            
            
            // Handling the successful response
        } catch (error) {
            // Handling any errors
            if (error.response) {
                // Request was made and the server responded with an error status code
                console.error('Error joining tower:', error.response.data.error);
            } else {
                // Something went wrong while setting up the request
                console.error('An error occurred while joining tower:', error.message);
            }
        }
    };

    const fetchAccountData = async () => {
        try {
            const response = await axios.get(`${config.backendUrl}/account`, {
                params: { userId: user.id },
            });

            const player = response.data;
            setInventory(player.inventory);

            let playerStats = player.stats;

            let payload = {
                name: player.username,
                maxHealth: Math.floor(Math.pow(((15 * playerStats.endurance) + (2 * playerStats.strength)), 0.8)),
                maxMana: Math.floor((10 * playerStats.intelligence) + (2 * playerStats.endurance)),
                health: Math.floor(Math.pow(((15 * playerStats.endurance) + (2 * playerStats.strength)), 0.8)),
                mana: Math.floor((10 * playerStats.intelligence) + (2 * playerStats.endurance)),
                manaRegeneration: Math.round(2 * playerStats.intelligence),
                originalParry: 8 + Math.floor(Math.pow((0.75 * playerStats.endurance + 0.5 * playerStats.strength), 0.6)),
                parry: 8 + Math.floor(Math.pow((0.75 * playerStats.endurance + 0.25 * playerStats.strength), 0.6)),
                originalArmor: Math.floor(Math.pow(0.25 * playerStats.endurance, 0.7)),
                armor: Math.floor(Math.pow(0.25 * playerStats.endurance, 0.7)),
                originalHitAbility: 9 + Math.floor(Math.pow((1.25 * playerStats.strength + 0.5 * playerStats.bravery), 0.6)),
                hitAbility: 9 + Math.floor(Math.pow((1.25 * playerStats.strength + 0.5 * playerStats.bravery), 0.6)),
                originalDamage: Math.floor(Math.pow((1 * playerStats.strength + (0.25 * playerStats.bravery)), 0.8)),
                damage: Math.floor(Math.pow((1 * playerStats.strength + (0.25 * playerStats.bravery)), 0.8)),
                originalMagicPenetration: 9 + Math.round(Math.sqrt(playerStats.intelligence + (0.25 * playerStats.strength))),
                magicPenetration: 9 + Math.round(Math.sqrt(playerStats.intelligence + (0.25 * playerStats.strength))),
                originalMagicResistance: 9 + Math.round(Math.sqrt(0.8 * playerStats.intelligence + 0.25 * playerStats.endurance)),
                magicResistance: 9 + Math.round(Math.sqrt(0.8 * playerStats.intelligence + 0.25 * playerStats.endurance)),
                spellEffectMultiplier: Math.pow(0.5 * playerStats.intelligence + 0.15 * playerStats.strength, 1/3),
                bravery: playerStats.bravery, // Store bravery
                floorsToSkip, // Store skip count
                spells: response.data.spells ? JSON.parse(response.data.spells) : [],
                spellEffects: [],
                head: player.equipment.head,
                torso: player.equipment.torso,
                legs: player.equipment.legs,
                feet: player.equipment.feet,
                weapon: player.equipment.weapon,
                inventory: player.inventory,
                perks: JSON.parse(player.perks),
            }

            const slots = ["head", "torso", "legs", "feet", "weapon"];

            try {
                const responses = await Promise.all(slots.map(async (slot) => {
                    if (payload[slot] === '') return null; // Skip if no item equipped in this slot
        
                    try {
                        const response = await axios.get(`${config.backendUrl}/items/${payload[slot].name}`);
                        if (!response.data) {
                            console.error(`No data received for item in slot ${slot}`);
                            return null;
                        }
                        return { slot, data: response.data[0] };
                    } catch (error) {
                        console.error(`Failed to fetch item stats for ${slot}:`, error);
                        return null;
                    }
                }));
        
                // Process responses
                for (const result of responses) {
                    if (!result || !result.data) continue; // Ensure the data exists before proceeding
        
                    const { slot, data: item } = result;
                    
                    if (!item.stats) {
                        console.error(`Missing 'stats' field for item in slot ${slot}`, item);
                        continue;
                    }
        
                    let itemStats;
                    try {
                        itemStats = JSON.parse(item.stats);
                    } catch (error) {
                        console.error(`Failed to parse stats for item in slot ${slot}:`, item.stats);
                        continue;
                    }
        
                    // Apply stat boosts
                    for (let stat in itemStats) {
                        if (typeof itemStats[stat] === "number") {
                            payload[stat] = (payload[stat] || 0) + itemStats[stat];
                        }
                    }
                }
            } catch (error) {
                console.error("Unexpected error in updateStats:", error);
            }

            if (payload.perks && payload.perks.length > 0) {
                // For each perk in payload.perks, fetch its full data from the backend.
                const detailedPerks = await Promise.all(
                    payload.perks.map(async (perk) => {
                        try {
                            // Assuming you have an endpoint that returns full perk data by perkName:
                            const res = await axios.get(`${config.backendUrl}/perks/${perk.perkName}`);
                            return res.data; // full perk object (including description, etc.)
                        } catch (error) {
                            console.error(`Error fetching perk ${perk.perkName}:`, error);
                            return perk; // Fallback to the basic perk data if error occurs.
                        }
                    })
                );
                // Replace payload.perks with the detailed perks
                payload.perks = detailedPerks;
            }

            setPlayer(payload);
            setPlayerHitAbility(payload.hitAbility);
            setPlayerArmor(payload.armor);
            setPlayerDamage(payload.damage);
            setPlayerMagicPenetration(payload.magicPenetration);
            setPlayerMagicResistance(payload.magicResistance);
            setPlayerParry(payload.parry);
            setPerks(payload.perks);

            joinTower(user.id);
        } catch (error) {
            console.error("Error fetching account data:", error);
        }
    };

    useEffect(() => {
        fetchAccountData();
    }, [gameOver]);

    const castSpells = async (caster, type) => {

        if(!caster.spells){
            return;
        }

        let spells;

        if (typeof caster.spells === "string") {
            try {
                spells = JSON.parse(caster.spells);
            } catch (error) {
                console.error("Error parsing spells JSON:", error);
                spells = {}; // Fallback to an empty object if parsing fails
            }
        } else {
            spells = caster.spells; // Use as is if already an object
        }

        // Iterate through the spell slots in order
        for (let i = 0; i < 4; i++) {
            const spellName = spells[i]; 

            if (spellName !== null){
                if (!spellName) {
                    // console.error(`No spell selected in the slot ${i + 1}`);
                    continue; // If no spell is present, skip to the next slot
                }
        
                try {
                    let spellData;

                    // Check if the spell is already saved
                    const existingSpell = savedSpells.find((spell) => spell.name === spellName);
                    if (existingSpell) {
                        spellData = existingSpell; // Use the already saved spell data
                    } else {
                        try {
                            // Fetch spell data from API if not already saved
                            const response = await axios.post(`${config.backendUrl}/getSpellData`, {
                                spellName: spellName
                            });

                            spellData = response.data;

                            // Update the state with the new spell
                            setSavedSpells((prevSpells) => [...prevSpells, spellData]);
                        } catch (error) {
                            console.error("Error fetching spell data:", error);
                            return;
                        }
                    }
                    
                    if(roundsNum % spellData.cooldown !== 0 || roundsNum === 0){
                        setLogs((prevLogs) => [
                            `${spellData.name} is still on cooldown.`,
                            ...prevLogs,
                        ]);
                        continue;
                    }

                    
        
                    
                    let finalPlayerMagicPenetration = 0;
                    let finalPlayerMagicResistance = 0;
                    let finalMonsterMagicPenetration = 0;
                    let finalMonsterMagicResistance = 0;


                    if(type === "player"){
                        const edrMagicPenetrationBonus = edrIncrementState.magicPenetration || 0;
                        finalPlayerMagicPenetration = player.magicPenetration + explosiveRoll(2 + edrMagicPenetrationBonus);
                        finalMonsterMagicResistance = monster.magicResistance + explosiveRoll(2);
                        setPlayerMagicPenetration(finalPlayerMagicPenetration);
                        setMonsterMagicResistance(finalMonsterMagicResistance);

                        setLogs((prevLogs) => [
                            `Trying to cast ${spellData.name}...`,
                            ...prevLogs,
                        ]);

                        setLogs((prevLogs) => [
                            `Player rolled Magic Penetration of ${finalPlayerMagicPenetration - player.magicPenetration}, Current Magic Penetration value: ${finalPlayerMagicPenetration}`,
                            ...prevLogs,
                        ]);
            
                        setLogs((prevLogs) => [
                            `${monster.name} rolled Magic Resistance of ${finalMonsterMagicResistance - monster.magicResistance}, Current Magic Resistance value: ${finalMonsterMagicResistance}`,
                            ...prevLogs,
                        ]);

                        
                    }else{
                        const edrMagicResistanceBonus = edrIncrementState.magicResistance || 0;
                        finalMonsterMagicPenetration = monster.magicPenetration + explosiveRoll(2);
                        finalPlayerMagicResistance = player.magicResistance + explosiveRoll(2 + edrMagicResistanceBonus);

                        setMonsterMagicPenetration(finalMonsterMagicPenetration);
                        setPlayerMagicResistance(finalPlayerMagicResistance);

                        setLogs((prevLogs) => [
                            `${monster.name} rolled Magic Penetration of ${finalMonsterMagicPenetration - monster.magicPenetration}, Current Magic Penetration value: ${finalMonsterMagicPenetration}`,
                            ...prevLogs,
                        ]);
            
                        setLogs((prevLogs) => [
                            `Player rolled Magic Resistance of ${finalPlayerMagicResistance - player.magicResistance}, Current Magic Resistance value: ${finalMonsterMagicResistance}`,
                            ...prevLogs,
                        ]);
                        
                    }
                    
                    setLogs((prevLogs) => [
                        `${caster.name} Casting ${spellData.name}...`,
                        ...prevLogs,
                    ]);

                    if (spellData.type === "HealthAdd") {
                        let healAmount = spellData.stat || 0; // Assuming spellData contains a stat value for healing
                        if (caster.health !== caster.maxHealth && caster.health !== 0) {
                            if(type === "player"){
                                healAmount = Math.floor(healAmount * player.spellEffectMultiplier);
                                setPlayer((prev) => ({
                                    ...prev,
                                    health: Math.min(caster.health + healAmount, caster.maxHealth),
                                }));
                            }
                            else {
                                setMonster((prev) => ({
                                    ...prev,
                                    health: Math.min(caster.health + healAmount, caster.maxHealth),
                                }));
                            }
                        }
                    }

                    
                    // ArmorAdd
                    if (spellData.type === "ArmorAdd") {
                        let armorAmount = spellData.stat || 0;
                        if (type === "player") {
                          armorAmount = Math.floor(armorAmount * player.spellEffectMultiplier);
                        }
                        await addSpellEffect(type, "add", spellData.name, "armor", armorAmount, spellData.duration);
                    }

                    
                    // HitAbilityAdd
                    if (spellData.type === "HitAbilityAdd") {
                        let hitAbilityAmount = spellData.stat || 0;
                        if (type === "player") {
                          hitAbilityAmount = Math.floor(hitAbilityAmount * player.spellEffectMultiplier);
                        }
                        await addSpellEffect(type, "add", spellData.name, "hitAbility", hitAbilityAmount, spellData.duration);
                    }
                    
                    
                    // ParryAdd
                    if (spellData.type === "ParryAdd") {
                        let parryAmount = spellData.stat || 0;
                        if (type === "player") {
                          parryAmount = Math.floor(parryAmount * player.spellEffectMultiplier);
                        }
                        await addSpellEffect(type, "add", spellData.name, "parry", parryAmount, spellData.duration);
                    }
                    
                    
                    
                    // MagicResAdd
                    if (spellData.type === "MagicResAdd") {
                        let magicResAmount = spellData.stat || 0;
                        if (type === "player") {
                          magicResAmount = Math.floor(magicResAmount * player.spellEffectMultiplier);
                        }
                        await addSpellEffect(type, "add", spellData.name, "magicResistance", magicResAmount, spellData.duration);
                    }
                    
                    
                
                    // MagicPenAdd
                    if (spellData.type === "MagicPenAdd") {
                        let magicPenetrationAmount = spellData.stat || 0;
                        if (type === "player") {
                          magicPenetrationAmount = Math.floor(magicPenetrationAmount * player.spellEffectMultiplier);
                        }
                        await addSpellEffect(type, "add", spellData.name, "magicPenetration", magicPenetrationAmount, spellData.duration);
                    }
                    
                    

                    if (spellData.type === "HealthSub") {
                        let healAmount = spellData.stat || 0;
                        if (player.health !== 0 && monster.health !== 0) {
                            healAmount = Math.floor(healAmount * player.spellEffectMultiplier);
                            
                            if (finalPlayerMagicPenetration >= finalMonsterMagicResistance && type === "player") {
                                setMonster((prev) => ({
                                    ...prev,
                                    health: Math.max(0, prev.health - healAmount)
                                }));
                            }
                            if (finalMonsterMagicPenetration >= finalPlayerMagicResistance && type === "monster") {
                                setPlayer((prev) => ({
                                    ...prev,
                                    health: Math.max(0, prev.health - healAmount)
                                }));
                            }
                        }
                    }

                    if (spellData.type === "ArmorSub") {
                        let armorAmount = spellData.stat || 0;
                        if (player.armor !== 0 && monster.armor !== 0) {
                            armorAmount = Math.floor(armorAmount * player.spellEffectMultiplier);
                            if (finalPlayerMagicPenetration >= finalMonsterMagicResistance && type === "player") {
                                await addSpellEffect("player", "sub", spellData.name, "armor", armorAmount, spellData.duration);
                            }
                            if (finalMonsterMagicPenetration >= finalPlayerMagicResistance && type === "monster") {
                                await addSpellEffect("monster", "sub", spellData.name, "armor", armorAmount, spellData.duration);
                            }
                        }
                    }

                    if (spellData.type === "HitAbilitySub") {
                        let hitAbilityAmount = spellData.stat || 0;
                        if (player.hitAbility !== 0 && monster.hitAbility !== 0) {
                            hitAbilityAmount = Math.floor(hitAbilityAmount * player.spellEffectMultiplier);
                            if (finalPlayerMagicPenetration >= finalMonsterMagicResistance && type === "player") {
                                await addSpellEffect("player", "sub", spellData.name, "hitAbility", hitAbilityAmount, spellData.duration);
                            }
                            if (finalMonsterMagicPenetration >= finalPlayerMagicResistance && type === "monster") {
                                await addSpellEffect("monster", "sub", spellData.name, "hitAbility", hitAbilityAmount, spellData.duration);
                            }
                        }
                    }

                    if (spellData.type === "ParrySub") {
                        let parryAmount = spellData.stat || 0;
                        if (player.parry !== 0 && monster.parry !== 0) {
                            parryAmount = Math.floor(parryAmount * player.spellEffectMultiplier);
                            if (finalPlayerMagicPenetration >= finalMonsterMagicResistance && type === "player") {
                                await addSpellEffect("player", "sub", spellData.name, "parry", parryAmount, spellData.duration);
                            }
                            if (finalMonsterMagicPenetration >= finalPlayerMagicResistance && type === "monster") {
                                await addSpellEffect("monster", "sub", spellData.name, "parry", parryAmount, spellData.duration);
                            }
                        }
                    }

                    if (spellData.type === "MagicResSub") {
                        let magicResAmount = spellData.stat || 0;
                        if (player.magicResistance !== 0 && monster.magicResistance !== 0) {
                            magicResAmount = Math.floor(magicResAmount * player.spellEffectMultiplier);
                            if (finalPlayerMagicPenetration >= finalMonsterMagicResistance && type === "player") {
                                await addSpellEffect("player", "sub", spellData.name, "magicResistance", magicResAmount, spellData.duration);
                            }
                            if (finalMonsterMagicPenetration >= finalPlayerMagicResistance && type === "monster") {
                                await addSpellEffect("monster", "sub", spellData.name, "magicResistance", magicResAmount, spellData.duration);
                            }
                        }
                    }

                    if (spellData.type === "MagicPenSub") {
                        let magicPenetrationAmount = spellData.stat || 0;
                        if (player.magicPenetration !== 0 && monster.magicPenetration !== 0) {
                            magicPenetrationAmount = Math.floor(magicPenetrationAmount * player.spellEffectMultiplier);
                            if (finalPlayerMagicPenetration >= finalMonsterMagicResistance && type === "player") {
                                await addSpellEffect("player", "sub", spellData.name, "magicPenetration", magicPenetrationAmount, spellData.duration);
                            }
                            if (finalMonsterMagicPenetration >= finalPlayerMagicResistance && type === "monster") {
                                await addSpellEffect("monster", "sub", spellData.name, "magicPenetration", magicPenetrationAmount, spellData.duration);
                            }
                        }
                    }

                    
                    if(type === "player"){
                        if (player.mana <= spellData.mana_cost) {
                            setLogs((prevLogs) => [
                                `Not enough mana to cast ${spellData.name}.`,
                                ...prevLogs,
                            ]);
                            continue; 
                        }else{
                            console.log("Mana is being spent");
                            setPlayer((prev) => ({
                                ...prev,
                                mana: prev.mana - spellData.mana_cost,
                            }));
                        }
                    }
                } catch (error) {
                    console.error(`Error casting spell from slot ${i + 1}:`, error.response?.data?.message || error.message);
                }
            }
        }
    };

    const addSpellEffect = (caster, type, spellName, affectedStat, effectStat, duration) => {
        if (caster === "player") {
            if(type === "add"){
                setPlayer((prev) => {
                    const existingEffect = prev.spellEffects.find(effect => effect.effectName === spellName);
        
                    // If the effect already exists, reset its duration
                    if (existingEffect) {
                        return {
                            ...prev,
                            spellEffects: prev.spellEffects.map(effect =>
                                effect.effectName === spellName
                                    ? { ...effect, remainingRounds: duration }
                                    : effect
                            ),
                            // Apply the stat change (add or subtract)
                            [affectedStat]: prev[affectedStat] + effectStat,
                        };
                    }
        
                    // Otherwise, add a new effect and apply the stat change (add or subtract)
                    return {
                        ...prev,
                        spellEffects: [
                            ...prev.spellEffects,
                            { effectName: spellName, type, affectedStat, effectStat, duration, remainingRounds: duration },
                        ],
                        // Apply the stat change (add or subtract)
                        [affectedStat]: prev[affectedStat] + effectStat,
                    };
                });
            }
            else if(type === "sub"){
                setMonster((prev) => {
                    const existingEffect = prev.spellEffects.find(effect => effect.effectName === spellName);
        
                    // If the effect already exists, reset its duration
                    if (existingEffect) {
                        return {
                            ...prev,
                            spellEffects: prev.spellEffects.map(effect =>
                                effect.effectName === spellName
                                    ? { ...effect, remainingRounds: duration }
                                    : effect
                            ),
                            // Apply the stat change (add or subtract)
                            [affectedStat]: prev[affectedStat] - effectStat,
                        };
                    }
        
                    // Otherwise, add a new effect and apply the stat change (add or subtract)
                    return {
                        ...prev,
                        spellEffects: [
                            ...prev.spellEffects,
                            { effectName: spellName, type, affectedStat, effectStat, duration, remainingRounds: duration },
                        ],
                        // Apply the stat change (add or subtract)
                        [affectedStat]: prev[affectedStat] - effectStat,
                    };
                });
            }
        } else if (caster === "monster") {
            if(type === "add"){
                setMonster((prev) => {
                    const existingEffect = prev.spellEffects.find(effect => effect.effectName === spellName);
        
                    // If the effect already exists, reset its duration
                    if (existingEffect) {
                        return {
                            ...prev,
                            spellEffects: prev.spellEffects.map(effect =>
                                effect.effectName === spellName
                                    ? { ...effect, remainingRounds: duration }
                                    : effect
                            ),
                            // Apply the stat change (add or subtract)
                            [affectedStat]: prev[affectedStat] + effectStat,
                        };
                    }
        
                    // Otherwise, add a new effect and apply the stat change (add or subtract)
                    return {
                        ...prev,
                        spellEffects: [
                            ...prev.spellEffects,
                            { effectName: spellName, type, affectedStat, effectStat, duration, remainingRounds: duration },
                        ],
                        // Apply the stat change (add or subtract)
                        [affectedStat]: prev[affectedStat] + effectStat,
                    };
                });
            }else{
                setPlayer((prev) => {
                    const existingEffect = prev.spellEffects.find(effect => effect.effectName === spellName);
        
                    // If the effect already exists, reset its duration
                    if (existingEffect) {
                        return {
                            ...prev,
                            spellEffects: prev.spellEffects.map(effect =>
                                effect.effectName === spellName
                                    ? { ...effect, remainingRounds: duration }
                                    : effect
                            ),
                            // Apply the stat change (add or subtract)
                            [affectedStat]: prev[affectedStat] - effectStat,
                        };
                    }
        
                    // Otherwise, add a new effect and apply the stat change (add or subtract)
                    return {
                        ...prev,
                        spellEffects: [
                            ...prev.spellEffects,
                            { effectName: spellName, type, affectedStat, effectStat, duration, remainingRounds: duration },
                        ],
                        // Apply the stat change (add or subtract)
                        [affectedStat]: prev[affectedStat] - effectStat,
                    };
                });
            }
            
        }

    };
    
    useEffect(() => {
        if (roundsNum === 0) return;
    
        let tempPlayerStats = {
            hitAbility: Math.max(0, player.hitAbility),
            armor: Math.max(0, player.armor),
            damage: Math.max(0, player.damage),
            magicPenetration: Math.max(0, player.magicPenetration),
            magicResistance: Math.max(0, player.magicResistance),
            parry: Math.max(0, player.parry),
        };
    
        let tempMonsterStats = {
            hitAbility: Math.max(0, monster.hitAbility),
            armor: Math.max(0, monster.armor),
            damage: Math.max(0, monster.damage),
            magicPenetration: Math.max(0, monster.magicPenetration),
            magicResistance: Math.max(0, monster.magicResistance),
            parry: Math.max(0, monster.parry),
        };
    
        // ✅ Handle Perk Effects
        const updatedEdrState = {};
        
        Object.keys(edrIncrementState).forEach((perk) => {
            const { value, duration } = edrIncrementState[perk];
    
            // ✅ Always apply effect before decrementing duration
            if (perk === "edr_hitAbility") tempPlayerStats.hitAbility += value;
            if (perk === "edr_armor") tempPlayerStats.armor += value;
            if (perk === "edr_damage") tempPlayerStats.damage += value;
            if (perk === "edr_magicPenetration") tempPlayerStats.magicPenetration += value;
            if (perk === "edr_magicResistance") tempPlayerStats.magicResistance += value;
            if (perk === "edr_parry") tempPlayerStats.parry += value;
    
            // ✅ Reduce duration and keep active perks (even 1-round perks apply before removal)
            if (duration > 1) {
                updatedEdrState[perk] = { value, duration: duration - 1 };
            }
        });
    
        setEdrIncrementState(updatedEdrState); // Update state with active perks only
    
        // ✅ Handle Player Spell Effects
        const updatedPlayerEffects = player.spellEffects
            .map((effect) => {
                const updatedEffect = {
                    ...effect,
                    remainingRounds: effect.remainingRounds - 1,
                };
    
                if (updatedEffect.remainingRounds <= 0) {
                    tempPlayerStats[effect.affectedStat] = Math.max(
                        0,
                        player["original" + effect.affectedStat.charAt(0).toUpperCase() + effect.affectedStat.slice(1)]
                    );
                }
    
                return updatedEffect;
            })
            .filter((effect) => effect.remainingRounds > 0);
    
        // ✅ Handle Monster Spell Effects
        const updatedMonsterEffects = monster.spellEffects
            .map((effect) => {
                const updatedEffect = {
                    ...effect,
                    remainingRounds: effect.remainingRounds - 1,
                };
    
                if (updatedEffect.remainingRounds <= 0) {
                    if (effect.type === "add") {
                        tempMonsterStats[effect.affectedStat] = Math.max(
                            0,
                            tempMonsterStats[effect.affectedStat] - effect.effectStat
                        );
                    } else {
                        tempMonsterStats[effect.affectedStat] = Math.max(
                            0,
                            tempMonsterStats[effect.affectedStat] + effect.effectStat
                        );
                    }
                }
    
                return updatedEffect;
            })
            .filter((effect) => effect.remainingRounds > 0);
    
        // ✅ Batch Update All State
        setPlayer((prev) => ({
            ...prev,
            ...tempPlayerStats,
            spellEffects: updatedPlayerEffects,
        }));
    
        setMonster((prev) => ({
            ...prev,
            ...tempMonsterStats,
            spellEffects: updatedMonsterEffects,
        }));
    
        setPlayerHitAbility(tempPlayerStats.hitAbility);
        setPlayerArmor(tempPlayerStats.armor);
        setPlayerDamage(tempPlayerStats.damage);
        setPlayerMagicPenetration(tempPlayerStats.magicPenetration);
        setPlayerMagicResistance(tempPlayerStats.magicResistance);
        setPlayerParry(tempPlayerStats.parry);
    
    }, [roundsNum]); 

    const playerHealthAnimation = useSpring({
        width:
            player && player.maxHealth > 0
                ? `${(player.health / player.maxHealth) * 100}%`
                : "0%",
            config: { 
                tension: 170, // Adjust tension for spring dynamics
                friction: 26,  // Adjust friction for smoother animation
                easing: easeCubicInOut,
            },
    });

    const playerManaAnimation = useSpring({
        width:
            player && player.maxMana > 0
                ? `${(player.mana / player.maxMana) * 100}%`
                : "0%",
        config: { 
            tension: 170, // Adjust tension for spring dynamics
            friction: 26,  // Adjust friction for smoother animation
            easing: easeCubicInOut,
        },
    });

    const monsterHealthAnimation = useSpring({
        width:
            monster && monster.maxHealth > 0
                ? `${(monster.health / monster.maxHealth) * 100}%`
                : "0%",
            config: { 
                tension: 170, // Adjust tension for spring dynamics
                friction: 26,  // Adjust friction for smoother animation
                easing: easeCubicInOut,
            },
    });

    
    const resetGame = async () => {
        try {
            const currencyResponse = await axios.post(`${config.backendUrl}/add-currency`, {
                id: user.id                  
            });
    
            let gold;
    
            if(currencyResponse.status === 200){
                const reward = Number(currencyResponse.data.reward);

                if (!isNaN(reward)) {
                    const gold = reward * goldMultiplier;
                    console.log(gold);
                
                    setTotalRewards(prev => Number(prev) + Number(gold));
                
                    const previousGold = Number(localStorage.getItem("goldEarned") || 0);
                    localStorage.setItem("goldEarned", previousGold + gold);

                    setAttempts(prev => {
                        const updatedAttempts = Number(prev) + 1;
                        localStorage.setItem("attempts", updatedAttempts);
                        return updatedAttempts;
                    });
                } 
            }

            // await axios.post(`${config.backendUrl}/tower-restart`, {  
            //     userId: user.id
            // });

            setPlayerHitAbility(0);
            setMonsterHitAbility(0);
            setPlayerParry(0);
            setMonsterParry(0);
            setPlayerDamage(0);
            setMonsterDamage(0);
            setPlayerArmor(0);
            setMonsterArmor(0);
            setPlayerMagicPenetration(0);
            setMonsterMagicPenetration(0);
            setPlayerMagicResistance(0);
            setMonsterMagicResistance(0);
            setStageName('');
            setCurrentStageIndex(0);
            setLogs([]);
            setIsAttacking(false);
            setShowPopup(false);
            setPopupContent({ title: "", body: "" });
            setDefeatedMonster(null);
            setDialogue("");
            setIsTransitioning(false);
            setShowSkipPopup(false);
            setEnemyNum(1);
            setCombatSpeed(1000);
            setFloorsToSkip(0);
            setMaxFloorsToSkip(0);
            setRoundsNum(0);
            setShowFloorTagline(false);
            setSavedSpells([]);
            setPerks([]);
            setEdrIncrementState(0);
            setActivatedPerks([]);
            setShowPrompt(false);
            
            setGameOver(false);
    
        } catch (error) {
            console.error('Error during resetGame:', error.response?.data?.error || error.message);
            alert(`Error: ${error.response?.data?.error || 'An error occurred. Please try again.'}`);
        }
    };
    
    
    const fetchStages = async () => {
        try {
            const stageResponse = await axios.get(`${config.backendUrl}/stages`);
            const data = stageResponse.data;

            setStages(data);

            let currentStageIndex = 0;

            // Make the GET request using axios
            const floorResponse = await axios.get(`${config.backendUrl}/tower-floor`, {
                params: { userId: user.id } // Send userId as a query parameter
            });

            currentStageIndex = floorResponse.data.floor;

            setGoldMultiplier(3 / (1 + (0.3 * floorResponse.data.numOfRuns)));
            
            setCurrentStageIndex(currentStageIndex);

            if (data.length > 0) {
                const currentStageData = data[currentStageIndex];
                if(currentStageData){
                    const firstStageEnemies = JSON.parse(currentStageData.enemyTypes);

                    const response = await axios.get(`${config.backendUrl}/monster`, {
                        params: { monsterName: firstStageEnemies[0] },
                    });
                    
                    let monsterStats = response.data;

                    const firstMonster = monsterStats;

                    setDialogue(displayDialogue(firstMonster.dialogue));

                    setMonster({
                        ...firstMonster,
                        maxHealth: firstMonster.health,
                        health: firstMonster.health,
                        damage: firstMonster.damage,
                        hitAbility: firstMonster.melee_hit,
                        parry: firstMonster.melee_parry,
                        armor: firstMonster.armor,
                        magicPenetration: firstMonster.magic_penetration,
                        magicResistance: firstMonster.magic_resistance,
                        spellEffects: [],
                    });


                }
                
            }
            
                // You can now use this floor value in your application, like setting state
                // setFloor(response.data.floor);  // Example of setting the floor state
            
            // setShowSkipPopup(true);
            
            // setIsTransitioning(true);
            
        } catch (error) {
            console.error("Failed to fetch stages:", error);
        }
    };

    useEffect(() => {
        fetchStages();
    }, [gameOver]);

    useEffect(() => {
        const gameOverCheck = async() => {
            if(player !== null){
                if (gameOver) {
                    addUserToLeaderboard();     
                    // setShowPopup(true);
                    await resetGame();
                }
            }
            
        }

        gameOverCheck();
    }, [gameOver])
    
    useEffect(() => {
        if (
            !monster ||
            gameOver || 
            isAttacking ||
            !player ||
            finishTimer 
        )
            return;
        
        const combatSequence = async () => {
            if (isTransitioning) return;
            setRoundsNum((prev) => prev + 1);

            applyPerks("before_round");
    
            setIsAttacking(true);
            await castSpells(player, "player");
            // 🎯 Player Attacks First
            await playerHitAbility();
            if (monster.health > 0) {
                await monsterAttack();
            }
        
            // 🐉 Monster Attacks First
            await monsterAttack();
            await castSpells(monster, "monster");
            if (player.health > 0 && monster.health > 0) {
                await playerHitAbility();
            }

            applyPerks("after_round");
            setIsAttacking(false);
        };
    
        const playerHitAbility = async () => {
            await new Promise((resolve) => setTimeout(resolve, combatSpeed));

            if(player.health <= 0) {
                setGameOver(true);
                return;
            }

            let finalPlayerHit = 0;
            if(player.hitAbility !== null){
                const edrHitAbilityBonus = edrIncrementState.hitAbility || 0;
                finalPlayerHit =  player.hitAbility + explosiveRoll(2 + edrHitAbilityBonus);
            }
            setPlayerHitAbility(finalPlayerHit);
            let finalMonsterParry =  monster?.parry + explosiveRoll(2);
            setMonsterParry(finalMonsterParry);
            setLogs((prevLogs) => [
                `Player rolled Melee Hit Ability of ${finalPlayerHit - player.hitAbility}, Current Melee Hit Ability value: ${finalPlayerHit}`,
                ...prevLogs,
            ]);

            setLogs((prevLogs) => [
                `${monster.name} rolled Physical Parry of ${finalMonsterParry - monster.parry}, Current Physical Parry value: ${finalMonsterParry}`,
                ...prevLogs,
            ]);
            if (finalPlayerHit > finalMonsterParry){
                // finalplayerHitAbility = playerHitAbility - finalMonsterParry;
                const edrDamageBonus = edrIncrementState.damage || 0;
                // (base damage + edr) * [1 / (1 + ((armor + edr) / (base damage + edr))]

                let playerDamage = player.damage + explosiveRoll(2 + edrDamageBonus);
                let monsterArmor = monster.armor + explosiveRoll(2);

                let finalPlayerDamage = Math.floor((playerDamage) * [1 / (1 + (monsterArmor / playerDamage))]);
                setPlayerDamage(playerDamage);
                setMonsterArmor(monsterArmor);
                setMonster((prev) => {
                    const newHealth = prev.health - Math.max(finalPlayerDamage, 0);
                    setLogs((prevLogs) => [
                        `Monster rolled ${monsterArmor} armor!`,
                        ...prevLogs,
                    ]);
                    
                    setLogs((prevLogs) => [
                        `Player dealt ${Math.max(finalPlayerDamage, 0)} damage to ${monster.name}!`,
                        ...prevLogs,
                    ]);
                    
                    if (newHealth <= 0) {                        
                        setDefeatedMonster(monster); // Preserve monster defeat logic

                        setLogs((prevLogs) => [
                            `Monster ${monster.name} has been defeated!`,
                            ...prevLogs,
                        ]);
                        // Move on to the next monster *after* the combat ends
                        // setEnemyNum((prev) => prev + 1); // Increment enemy number to indicate the next monster
                        return { ...prev, health: 0 }; // Ensure health is set to 0 after defeat
                    }
        
                    return { ...prev, health: newHealth };
                });
            }

            
        };
    
        const monsterAttack = async () => {
            await new Promise((resolve) => setTimeout(resolve, combatSpeed));
    
            if (!showPopup && monster.health > 0) {
                // let finalMonsterAttack = 0;
                let finalMonsterHitAbility;
                let monsterHitRoll;
                let finalPlayerParry;
                if(monster.damage !== null && player.parry !== null){
                    finalMonsterHitAbility = monster.hitAbility + explosiveRoll(2);; 
                    const edrParryBonus = edrIncrementState.parry || 0;
                    finalPlayerParry = player.parry + explosiveRoll(2 + edrParryBonus);
                    setMonsterHitAbility(finalMonsterHitAbility);
                    setPlayerParry(finalPlayerParry);
                }

                setLogs((prevLogs) => [
                    `${monster.name} rolled Melee Hit Ability of ${monsterHitAbility - monster.hitAbility}, Current Melee Hit Ability value: ${monsterHitAbility}`,
                    ...prevLogs,
                ]);

                setLogs((prevLogs) => [
                    `Player rolled Physical Parry of ${finalPlayerParry - player.parry}, Current Physical Parry value: ${finalPlayerParry}`,
                    ...prevLogs,
                ]);

                if (finalMonsterHitAbility > finalPlayerParry){
                    const edrArmorBonus = edrIncrementState.armor || 0;
                    // (base damage + edr) * [1 / (1 + ((armor + edr) / (base damage + edr))]

                    let monsterDamage = monster.damage + explosiveRoll(2);
                    let playerArmor = player?.armor + explosiveRoll(2 + edrArmorBonus);
                    
                    let finalMonsterDamage = Math.floor((monsterDamage) * [1 / (1 + (playerArmor / monsterDamage))])
                    setMonsterDamage(monsterDamage);
                    setPlayerArmor(playerArmor);
                    // finalMonsterAttack = monsterAttack - finalPlayerParry;
                    
                    setPlayer((prev) => ({
                        ...prev,
                        health: prev.health - Math.max(finalMonsterDamage, 0),
                    }));

                    setLogs((prevLogs) => [
                        `Monster rolled ${monsterDamage} attack!`,
                        ...prevLogs,
                    ]);
                    
                    setLogs((prevLogs) => [
                        `Monster dealt ${Math.max(finalMonsterDamage, 0)} damage to player!`,
                        ...prevLogs,
                    ]);
        
                    // If player dies, show game over message and stop combat
                    if (player.health <= 0) {
                        setLogs((prevLogs) => [
                            `You have been defeated by ${monster.name}!`,
                            ...prevLogs,
                        ]);

                        setGameOver(true);

                        setPopupContent({
                            title: "You Died!",
                            body: "You have been defeated. Do some quests or buy items to get stronger!",
                        });
                        // setShowPopup(true);
                        // resetGame();
                    }

                    

                    setLogs((prevLogs) => [
                        `Player rolled ${playerArmor} armor!`,
                        ...prevLogs,
                    ]);

                    setLogs((prev) => [
                        `${monster.name} dealt ${Math.max(finalMonsterDamage, 0)} damage to Player!`,
                        ...prev,
                    ]);

                    
                }
                
            }

           
        };

        setActivatedPerks([]);    
        combatSequence();
    }, [player, monster, gameOver, isAttacking, finishTimer]);
    
    useEffect(() => {
        if(player !== null){
            const newMana = player.mana + player.manaRegeneration;
            if(newMana >= player.maxMana){
                setPlayer((prev) => ({
                    ...prev,
                    mana: player.maxMana,
                }));
                
            }else{
                setPlayer((prev) => ({
                    ...prev,
                    mana: prev.mana + player.manaRegeneration,
                }));
            }
            
        }

        // Cleanup interval when the component unmounts
    }, [roundsNum]);

    useEffect(() => {
        setShowFloorTagline(false); // Temporarily hide the element
        const timeout = setTimeout(() => setShowFloorTagline(true), 1000); // Small delay before showing it again
    
        return () => clearTimeout(timeout);
    }, [currentStageIndex]);
    

    const explosiveRoll = (rolls, sum = 0) => {
        if (rolls <= 0) return sum; // Stop when rolls are finished
    
        const diceRoll = Math.floor(Math.random() * 6) + 1; // Random number between 1 and 6
        sum += diceRoll;
    
        if (diceRoll === 6) {
            // If 6 is rolled, roll again but without decreasing the roll count
            return explosiveRoll(rolls, sum);
        }
    
        // Continue rolling, decreasing the roll count
        return explosiveRoll(rolls - 1, sum);
    };
    

    const handleNextEnemyOrStage = async () => {
        if (loadingEnemies) return;
    
        const currentStageEnemies = JSON.parse(stages[currentStageIndex].enemyTypes);
        const boss = stages[currentStageIndex]?.boss;
        const numberOfEnemies = stages[currentStageIndex].numberOfEnemies - 1;
    
        if (numberOfEnemies > 0) {
            const randomEnemy = currentStageEnemies[Math.floor(Math.random() * currentStageEnemies.length)];
            const monsterStats = allEnemies[randomEnemy];
    
            setMonster({
                ...monsterStats,
                maxHealth: monsterStats.health,
                health: monsterStats.health,
                hitAbility: monsterStats.melee_hit,
                parry: monsterStats.melee_parry,
                damage: monsterStats.damage,
                armor: monsterStats.armor,
                magicPenetration: monsterStats.magic_penetration,
                magicResistance: monsterStats.magic_resistance,
                spellEffects: [],
            });
    
            const updatedStages = [...stages];
            updatedStages[currentStageIndex].numberOfEnemies -= 1;
            setStages(updatedStages);
            setStageName(updatedStages[currentStageIndex].name);
    
            setLogs((prev) => [`New enemy appeared: ${randomEnemy}!`, ...prev]);
        } else if (boss && monster.name !== boss) {
            if (player.bravery >= stages[currentStageIndex].bravery_required) {
                const bossStats = allEnemies[boss];
    
                setMonster({
                    ...bossStats,
                    maxHealth: bossStats.health,
                    health: bossStats.health,
                    hitAbility: bossStats.melee_hit,
                    parry: bossStats.melee_parry,
                    damage: bossStats.damage,
                    armor: bossStats.armor,
                    magicPenetration: bossStats.magic_penetration,
                    magicResistance: bossStats.magic_resistance,
                    spellEffects: [],
                });
    
                updateFloor(currentStageIndex + 1);
                setLogs((prev) => [`The boss ${boss} has appeared!`, ...prev]);
            } else {    
                setLogs((prev) => [
                    `You need at least ${stages[currentStageIndex].bravery_required} bravery to face the ${boss}.`,
                    ...prev,
                ]);
    
                addUserToLeaderboard();
    
                try {

                    console.log("Not brave enough!");
    
                    setPopupContent({
                        title: "Not Brave Enough!",
                        body: `You need at least ${stages[currentStageIndex].bravery_required} bravery to face the ${boss}. Do more quests related to bravery.`,
                        currency_rewards: totalRewards,
                    });

                    setGameOver(true);
                } catch (error) {
                    console.error("Error adding currency:", error);
                }
    
            }
        } else {
            const nextStageIndex = currentStageIndex + 1;
            updateFloor(nextStageIndex);
    
            if (nextStageIndex < stages.length && stages[nextStageIndex]) {
                const updatedStages = [...stages];
                const nextStageEnemies = JSON.parse(stages[nextStageIndex].enemyTypes || "[]");
    
                if (updatedStages[nextStageIndex].numberOfEnemies === undefined) {
                    updatedStages[nextStageIndex].numberOfEnemies = nextStageEnemies.length;
                }
    
                setStages(updatedStages);
                setCurrentStageIndex(nextStageIndex);
    
                if (nextStageEnemies.length > 0) {
                    const firstMonster = allEnemies[nextStageEnemies[0]];
    
                    setMonster({
                        ...firstMonster,
                        maxHealth: firstMonster.health,
                        health: firstMonster.health,
                        hitAbility: firstMonster.melee_hit,
                        parry: firstMonster.melee_parry,
                        damage: firstMonster.damage,
                        armor: firstMonster.armor,
                        magicPenetration: firstMonster.magic_penetration,
                        magicResistance: firstMonster.magic_resistance,
                        spellEffects: [],
                    });
                }
    
                setEnemyNum(1);
                setLogs((prev) => [`Welcome to ${updatedStages[nextStageIndex].name}!`, ...prev]);
            } else {    
                addUserToLeaderboard();
    
                try {
                    setPopupContent({
                        title: "Victory!",
                        body: "You've defeated all enemies and completed the game!",
                        currency_rewards: totalRewards,
                    });

                    localStorage.setItem('goldEarned', totalRewards);

                    setGameOver(true);

                } catch (error) {
                    console.error("Error adding currency:", error);
                    setPopupContent({
                        title: "Error",
                        body: "An error occurred while saving your rewards.",
                    });
                }
    
                setEnemyNum(1);
            }
        }
    };

    const addUserToLeaderboard = async() => {
        const userId = user.id;
        const achievedAt = new Date().toLocaleDateString('en-CA');    
    
        const payload = {
            username: user.username,
            userId,
            achievedAt,
        };
    
        // Send POST request to the backend to add the user to the leaderboard
        await axios.post(`${config.backendUrl}/add-to-tower-leaderboard`, payload)
            .then((response) => {
                // Check the response message to determine if the update was successful
                if (response.data.message === 'Leaderboard updated') {
                    console.log('Leaderboard entry updated');
                } else if (response.data.message === 'Leaderboard entry added') {
                    console.log('Leaderboard entry added');
                }
    
                // Redirect to the dashboard after the operation is successful
                console.log('Response from backend:', response.data);
            })
            .catch((err) => {
                console.error('Error adding to leaderboard:', err);
            });
    };
    
    const increaseCombatSpeed = () => {
        
        if((1000 / combatSpeed) < 4){
            let newCombatSpeed = combatSpeed / 2 
            setCombatSpeed(newCombatSpeed);
            localStorage.setItem("combatSpeed", newCombatSpeed);
        }
            
    }

    const decreaseCombatSpeed = () => {
        if(combatSpeed <= 1000){
            let newCombatSpeed = combatSpeed * 2 
            setCombatSpeed(combatSpeed * 2);
            localStorage.setItem("combatSpeed", newCombatSpeed);
        }
       
    }

    const consumeItem = async (itemName, inventory, userId) => {
        const item = inventory.find(i => i.name === itemName);
    
        if (!item || item.quantity <= 0) {
            console.error("Item cannot be consumed");
            return;
        }
    
        try {
            const response = await axios.post(`${config.backendUrl}/consume`, {
                userId,
                itemId: item.name,
                quantity: 1
            });
        
            console.log("Successfully consumed item:", response.data.message);
            console.log("Stats gained:", response.data.stats);
        
            // Update player stats and inventory in state
            setPlayer(prevStats => {
                const updatedStats = { ...prevStats };
        
                // Update stats
                for (const [statKey, statValue] of Object.entries(response.data.stats)) {
                    if (updatedStats[statKey]) {
                        if (statKey === "health") {
                            // Cap health at maxHealth (assuming maxHealth is part of prevStats)
                            updatedStats[statKey] = Math.min(updatedStats[statKey] + statValue, updatedStats.maxHealth);
                        } else {
                            // For other stats, just increment
                            updatedStats[statKey] += statValue;
                        }
                    } else {
                        // If the stat doesn't exist, add it
                        if (statKey === "health") {
                            // Ensure health is capped at maxHealth when first set
                            updatedStats[statKey] = Math.min(statValue, updatedStats.maxHealth);
                        } else {
                            updatedStats[statKey] = statValue;
                        }
                    }
                }
        
                // Update inventory
                const updatedInventory = [...prevStats.inventory];
                const itemIndex = updatedInventory.findIndex(i => i.name === item.name);
        
                if (itemIndex !== -1) {
                    updatedInventory[itemIndex].quantity -= 1;
                }
        
                // Ensure the inventory is updated correctly
                return { ...updatedStats, inventory: updatedInventory };
            });
        
        } catch (error) {
            console.error("Failed to consume item:", error.response?.data?.error || error.message);
        }
    }  
    
    const displayDialogue = (dialogue) => {
        if (!dialogue) return;
        let parsedDialogue = JSON.parse(dialogue); // Parse the JSON string into an array
        let randomIndex = Math.floor(Math.random() * parsedDialogue.length); // Select a random index
        return parsedDialogue[randomIndex]; // Return the selected dialogue
    };

    const backToDashboard = async() => {

        const response = await axios.post(`${config.backendUrl}/tower-restart`, {  
            userId: user.id   // Send userId in request body
        });

        localStorage.removeItem('attempts');
        localStorage.removeItem('goldEarned');
        window.location.href = "/dashboard";
    }

    const openGameOverPopup = async() => {
        const currencyResponse = await axios.post(`${config.backendUrl}/add-currency`, {
            id: user.id                  
        });

        let gold;

        if(currencyResponse.status === 200){
            if(currencyResponse.status === 200){
                const reward = Number(currencyResponse.data.reward);

                if (!isNaN(reward)) {
                    const gold = reward * goldMultiplier;
                    console.log(gold);
                
                    setTotalRewards(prev => Number(prev) + Number(gold));
                
                    const previousGold = Number(localStorage.getItem("goldEarned") || 0);
                    localStorage.setItem("goldEarned", previousGold + gold);
                    setFinishTimer(true);

                } 
            }
        }
    }
    
      
    

    return (
        <>
            <div className="min-h-screen grid lg:grid-cols-5 xl:grid-cols-6 md:grid-cols-4 grid-cols-1 text-white"
                style={{
                    backgroundImage: "url('/sprites/tower-background.jpg')",
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                }}
            >
                {/* <div className="col-span-5 md:col-span-3 lg:col-span-1 md:col-start-2 lg:col-start-2 order-last lg:order-none"> */}
                <div className="col-start-3 col-span-2 rounded-md">
                    </div>  
                <div className="col-span-6 p-5">
                    <PomodoroTimer initialMinutes={duration} finishTime={() => openGameOverPopup()}/>                
                    <div className="flex items-center justify-center w-full my-3 gap-2">
                    <button
                        className={`px-4 py-2 rounded-md transition text-white ${
                        isFullscreen ? "bg-red-600 hover:bg-red-500" : "bg-green-600 hover:bg-green-500"
                        }`}
                        onClick={toggleFullscreen}
                    >
                        <FontAwesomeIcon icon={isFullscreen ? faCompress : faExpand} className="mr-2" />
                        {isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
                    </button>
                    <button
                        className={`px-4 py-2 bg-red-600 hover:bg-red-500 rounded-md transition text-white`}
                        onClick={backToDashboard}
                    >
                        <FontAwesomeIcon icon={faStop} className="mr-2" />
                        Stop
                    </button>
               
                    </div>
                    {/* <div className="flex gap-3 items-center justify-center">
                        <button className="px-4 py-2 bg-indigo-600 rounded-md mb-4" onClick={decreaseCombatSpeed}>
                        Decrease speed <FontAwesomeIcon icon={faArrowDown} />
                        </button>
                        <div>Current Speed: {(1000 / combatSpeed)}x</div>
                        <button className="px-4 py-2 bg-indigo-600 rounded-md mb-4" onClick={increaseCombatSpeed}>
                        Increase speed <FontAwesomeIcon icon={faArrowUp} />
                        </button>
                    </div> */}

                    {/* Main Content */}
                    <div className="w-full lg:grid flex flex-col lg:grid-cols-5 gap-3 lg:col-span-4 lg:col-start-4">
                        <div className="col-span-1 lg:order-first order-last">
                            <ConsumableInventory inventory={inventory} onItemClick={(itemName) => consumeItem(itemName, inventory, user.id)} />  

                            <div className="bg-gray-700 rounded-md p-4 mt-2">
                                <h1 className="font-semibold text-lg mb-2"><FontAwesomeIcon icon={faWandSparkles} /> Spells</h1>
                                {player?.spells?.some(spell => spell !== null) ?
                                    <> 
                                    {player?.spells.map((spell) => {
                                        const savedSpell = savedSpells.find((s) => s.name === spell);  // Find the matching spell

                                        if (!savedSpell) return null;

                                        const remainingRounds = ((savedSpell.cooldown - (roundsNum - 1)) % savedSpell.cooldown + savedSpell.cooldown) % savedSpell.cooldown;
                                                                
                                        return (
                                            <div key={spell} className={`bg-gray-600 rounded-md mb-2 px-4 py-2 ${remainingRounds === 0 && (roundsNum - 1 !== 0) && 'animate-popout'}`}>
                                                <p>{spell}</p> 
                                                {remainingRounds === 0 && (roundsNum - 1 !== 0) ? (
                                                    <p className="text-green-400 font-bold">Casted!</p>
                                                ) : (
                                                    <p>CD: {remainingRounds !== 0 ? remainingRounds : savedSpell.cooldown} rounds</p>
                                                )}
                                            </div>
                                        );
                                    })}
                                    </>

                                    :

                                    <p>You have no spells.</p>
                                }

                            </div>

                            <div className="bg-gray-700 rounded-md p-4 mt-2">
                                <h1 className="font-semibold text-lg mb-2"><FontAwesomeIcon icon={faCircleNodes} /> Active Perks</h1>

                                {activatedPerks.length > 0 ? (
                                    <>
                                        {activatedPerks.map((perk) => {
                                            let textColor = "text-white"; // Default color

                                            // Set color based on perk type
                                            if (perk.type === "strength") textColor = "text-red-500";
                                            else if (perk.type === "bravery") textColor = "text-blue-500";
                                            else if (perk.type === "intelligence") textColor = "text-yellow-500";
                                            else if (perk.type === "endurance") textColor = "text-green-500";

                                            return (
                                                <div 
                                                    key={perk.id} 
                                                    className="bg-gray-800 rounded-md mb-2 px-4 py-2 animate-popout"
                                                >
                                                    <p className={`${textColor} text-md font-semibold`}>{perk.name}</p>
                                                    <p className="text-sm">{perk.effectDescriptions.join(" and ")}</p>
                                                </div>
                                            );
                                        })}
                                    </>
                                ) : (
                                    <p>No perks activated yet.</p>
                                )}
                            </div>
                        </div>
                        {/* Tower Layout */}
                        <div className="w-full col-span-3 col-start-2">
                        <div className="p-4 bg-gray-800 rounded text-center">
                            <h1 className="text-3xl mb-2 text-yellow-400 drop-shadow-md shadow-yellow-300 text-center font-bold">
                                The Tower of Rebirth
                            </h1>
                            <h2 className="text-2xl font-bold">
                            Floor {currentStageIndex + 1}: {stages && stages[currentStageIndex] ? stages[currentStageIndex].name : ''}
                            </h2>
                            {showFloorTagline ? (
                                <p className="animate-fade-in-longer">{stages[currentStageIndex]?.tagline}</p>
                            ) : 
                                <p>...</p>
                            }
                        </div>

                        <div className="w-full py-4 px-10 flex justify-between items-center bg-gray-800 rounded-md my-2">
                            <div className="text-center font-semibold text-lg text-yellow-400"><FontAwesomeIcon icon={faCoins} /> Gold: x{goldMultiplier.toFixed(2)}</div>
                            <div className="text-center text-white font-semibold text-lg"><FontAwesomeIcon icon={faPersonHiking} /> Attempt: {attempts + 1}</div>

                        </div>

                        <div className="grid grid-cols-1 gap-6 rounded-md bg-gray-800">
                            <div className="p-4 rounded flex flex-col items-center">
                                {player?.spellEffects.length > 0 ? (
                                    <ul>
                                        {player.spellEffects.map((effect, index) => (
                                            <li key={index}>
                                                {effect.effectName}: {effect.remainingRounds} round(s) remaining
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <></>
                                )}
                                <h2 className="text-2xl font-bold mb-2">{user.username}</h2>
                                <div className="relative w-full h-6 bg-gray-600 rounded-full">
                                    <animated.div
                                    className="absolute h-full bg-green-500 rounded-full"
                                    style={playerHealthAnimation}
                                    />
                                    <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-white">
                                    Health: {player?.health}/{player?.maxHealth}
                                    </span>
                                </div>
                                <div className="relative w-full h-6 bg-gray-600 rounded-full mt-1">
                                    <animated.div
                                    className="absolute h-full bg-blue-500 rounded-full"
                                    style={playerManaAnimation}
                                    />
                                    <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-white">
                                    Mana: {player?.mana}/{player?.maxMana}
                                    </span>
                                </div>
                                <div className="flex w-full flex-wrap items-center flex-row justify-center mt-2">
                                    <FaFistRaised />MHA: 
                                    <div className="mr-2">
                                        {playerHitAbility}
                                        {player?.spellEffects
                                            .filter(effect => effect.affectedStat === "hitAbility")
                                            .map((effect, index) => (
                                                <span key={index} className={`ml-1 ${effect.type === "add" ? 'text-green-500' : 'text-red-500'}`}>
                                                    {effect.type === "add" ? `+${effect.effectStat}` : `-${effect.effectStat}`}
                                                </span>
                                            ))}
                                    </div>

                                    <FaShieldAlt />PP: 
                                    <div className="mr-2">
                                        {playerParry}
                                        {player?.spellEffects
                                            .filter(effect => effect.affectedStat === "parry")
                                            .map((effect, index) => (
                                                <span key={index} className={`ml-1 ${effect.type === "add" ? 'text-green-500' : 'text-red-500'}`}>
                                                    {effect.type === "add" ? `+${effect.effectStat}` : `-${effect.effectStat}`}
                                                </span>
                                            ))}
                                    </div>

                                    <FontAwesomeIcon icon={faBoltLightning} />MP: 
                                    <div className="mr-2">
                                        {playerMagicPenetration}
                                        {player?.spellEffects
                                            .filter(effect => effect.affectedStat === "magicPenetration")
                                            .map((effect, index) => (
                                                <span key={index} className={`ml-1 ${effect.type === "add" ? 'text-green-500' : 'text-red-500'}`}>
                                                    {effect.type === "add" ? `+${effect.effectStat}` : `-${effect.effectStat}`}
                                                </span>
                                            ))}
                                    </div>

                                    <FontAwesomeIcon icon={faShieldVirus} />MR: 
                                    <div className="mr-2">
                                        {playerMagicResistance}
                                        {player?.spellEffects
                                            .filter(effect => effect.affectedStat === "magicResistance")
                                            .map((effect, index) => (
                                                <span key={index} className={`ml-1 ${effect.type === "add" ? 'text-green-500' : 'text-red-500'}`}>
                                                    {effect.type === "add" ? `+${effect.effectStat}` : `-${effect.effectStat}`}
                                                </span>
                                            ))}
                                    </div>

                                    <FontAwesomeIcon className="lg:ml-auto" icon={faFire} /> 
                                    <div className="mr-2">DMG: {playerDamage}
                                        {player?.spellEffects
                                            .filter(effect => effect.affectedStat === "damage")
                                            .map((effect, index) => (
                                                <span key={index} className={`ml-1 ${effect.type === "add" ? 'text-green-500' : 'text-red-500'}`}>
                                                    {effect.type === "add" ? `+${effect.effectStat}` : `-${effect.effectStat}`}
                                                </span>
                                            ))}
                                    </div>

                                    <FontAwesomeIcon icon={faShield} /> 
                                    <div className="mr-2">ARM: {playerArmor}
                                        {player?.spellEffects
                                            .filter(effect => effect.affectedStat === "armor")
                                            .map((effect, index) => (
                                                <span key={index} className={`ml-1 ${effect.type === "add" ? 'text-green-500' : 'text-red-500'}`}>
                                                    {effect.type === "add" ? `+${effect.effectStat}` : `-${effect.effectStat}`}
                                                </span>
                                            ))}
                                    </div>
                                </div>

                            </div>

                            <div className="italic text-lg text-center font-bold">- VS -</div>

                            {monster && (
                            <div className="p-4 rounded flex flex-col items-center">
                                
                                {/* <div className="relative max-w-xs bg-white text-black border-2 border-black rounded-lg p-4 shadow-lg">
                                    {dialogue ? dialogue : "..."}
                                    <div className="absolute -bottom-2 left-6 w-0 h-0 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-black"></div>
                                    <div className="absolute -bottom-2 left-6 w-0 h-0 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-white"></div>
                                </div> */}
                                
                                {monster.spellEffects.length > 0 ? (
                                    <ul>
                                        {monster.spellEffects.map((effect, index) => (
                                            <li key={index}>
                                                {effect.effectName}: {effect.remainingRounds} round(s) remaining
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <></>
                                )}
                                <h2 className="text-2xl font-bold mb-2">
                                {enemyNum}. {monster.name}
                                </h2>
                                <div className="relative w-full h-6 bg-gray-600 rounded-full">
                                <animated.div
                                    className="absolute h-full bg-red-500 rounded-full"
                                    style={monsterHealthAnimation}
                                />
                                <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-white">
                                    Health: {monster.health}/{monster.maxHealth}
                                </span>
                                
                                </div>
                                <div className="flex w-full flex-wrap items-center flex-row justify-center mt-2">
                                    <FaFistRaised />MHA: 
                                    <div className="mr-2">
                                        {monsterHitAbility}
                                        {monster?.spellEffects
                                            .filter(effect => effect.affectedStat === "hitAbility")
                                            .map((effect, index) => (
                                                <span key={index} className={`ml-1 ${effect.type === "add" ? 'text-green-500' : 'text-red-500'}`}>
                                                    {effect.type === "add" ? `+${effect.effectStat}` : `-${effect.effectStat}`}
                                                </span>
                                            ))}
                                    </div>

                                    <FaShieldAlt />PP: 
                                    <div className="mr-2">
                                        {monsterParry}
                                        {monster?.spellEffects
                                            .filter(effect => effect.affectedStat === "parry")
                                            .map((effect, index) => (
                                                <span key={index} className={`ml-1 ${effect.type === "add" ? 'text-green-500' : 'text-red-500'}`}>
                                                    {effect.type === "add" ? `+${effect.effectStat}` : `-${effect.effectStat}`}
                                                </span>
                                            ))}
                                    </div>

                                    <FontAwesomeIcon icon={faBoltLightning} />MP: 
                                    <div className="mr-2">
                                        {monsterMagicPenetration}
                                        {monster?.spellEffects
                                            .filter(effect => effect.affectedStat === "magicPenetration")
                                            .map((effect, index) => (
                                                <span key={index} className={`ml-1 ${effect.type === "add" ? 'text-green-500' : 'text-red-500'}`}>
                                                    {effect.type === "add" ? `+${effect.effectStat}` : `-${effect.effectStat}`}
                                                </span>
                                            ))}
                                    </div>

                                    <FontAwesomeIcon icon={faShieldVirus} />MR: 
                                    <div className="mr-2">
                                        {monsterMagicResistance}
                                        {monster?.spellEffects
                                            .filter(effect => effect.affectedStat === "magicResistance")
                                            .map((effect, index) => (
                                                <span key={index} className={`ml-1 ${effect.type === "add" ? 'text-green-500' : 'text-red-500'}`}>
                                                    {effect.type === "add" ? `+${effect.effectStat}` : `-${effect.effectStat}`}
                                                </span>
                                            ))}
                                    </div>

                                    <FontAwesomeIcon className="lg:ml-auto" icon={faFire} /> 
                                    <div className="mr-2">DMG: {monsterDamage}
                                        {monster?.spellEffects
                                            .filter(effect => effect.affectedStat === "damage")
                                            .map((effect, index) => (
                                                <span key={index} className={`ml-1 ${effect.type === "add" ? 'text-green-500' : 'text-red-500'}`}>
                                                    {effect.type === "add" ? `+${effect.effectStat}` : `-${effect.effectStat}`}
                                                </span>
                                            ))}
                                    </div>

                                    <FontAwesomeIcon icon={faShield} /> 
                                    <div className="mr-2">ARM: {monsterArmor}
                                        {monster?.spellEffects
                                            .filter(effect => effect.affectedStat === "armor")
                                            .map((effect, index) => (
                                                <span key={index} className={`ml-1 ${effect.type === "add" ? 'text-green-500' : 'text-red-500'}`}>
                                                    {effect.type === "add" ? `+${effect.effectStat}` : `-${effect.effectStat}`}
                                                </span>
                                            ))}
                                    </div>
                                </div>

                            </div>
                            )}
                        </div>

                        <div className="flex gap-3 mt-4">
                            <button
                            className="w-full bg-red-500 text-white px-4 py-2 rounded font-bold hover:bg-red-600 transition"
                            onClick={() => setGameOver(true)}
                            >
                            Retry Tower
                            </button>
                        </div>

                        {/* <div className="h-96 p-4 bg-gray-700 mt-4 rounded">
                            <h3 className="text-xl font-bold mb-2 text-yellow-200">Combat Logs</h3>
                            <div className="overflow-y-scroll h-[300px] bg-gray-600 p-2 rounded">
                            {logs.slice(0, 20).reverse().map((log, index) => (  // Reverse the order to show the newest on top
                                <p key={index} className="text-sm text-gray-300">
                                    {log.split(/(\d+|Player|Monster|Boss|Casting)/gi).map((chunk, i) => {
                                        if (/^\d+$/.test(chunk)) {
                                            return (
                                                <span key={i} className="text-red-300 font-bold">
                                                    {chunk}
                                                </span>
                                            );
                                        }
                                        if (chunk.toLowerCase() === "casting") {
                                            return (
                                                <span key={i} className="text-pink-400 font-bold">
                                                    {chunk}
                                                </span>
                                            );
                                        }
                                        if (chunk.toLowerCase() === "player") {
                                            return (
                                                <span key={i} className="text-blue-400 font-bold">
                                                    {chunk}
                                                </span>
                                            );
                                        }
                                        if (chunk.toLowerCase() === "monster") {
                                            return (
                                                <span key={i} className="text-red-500 font-bold">
                                                    {chunk}
                                                </span>
                                            );
                                        }
                                        if (chunk.toLowerCase() === "boss") {
                                            return (
                                                <span key={i} className="text-red-200 font-bold">
                                                    {chunk}
                                                </span>
                                            );
                                        }
                                        return <span key={i}>{chunk}</span>;
                                    })}
                                </p>
                            ))}
                            </div>
                        </div> */}


                        </div>

                        {/* Responsive Progress Bar */}
                        <div
                        className="w-full lg:col-span-1 order-first flex flex-col lg:flex-col lg:items-center rounded ml-0 overflow-y-auto overflow-x-auto hide-scrollbar lg:order-none"
                        >
                        <div className="w-full p-4 flex flex-col items-center bg-gray-700 rounded-md">
                            
                            <h3 className="text-xl font-bold text-white"><FontAwesomeIcon icon={faStairs} /> Floors</h3>
                            <br />
                            <div className="flex flex-row items-center justify-center gap-6 max-w-full overflow-auto hide-scrollbar">
                                {stages.map((stage, index) => {
                                    if (
                                        index === currentStageIndex - 1 ||  // Previous floor
                                        index === currentStageIndex ||      // Current floor
                                        index === currentStageIndex + 1     // Next floor
                                    ) {
                                        const stageColor =
                                            index < currentStageIndex
                                                ? "bg-green-500"          // Completed
                                                : index === currentStageIndex
                                                ? "bg-yellow-500 p-6"     // Current
                                                : "bg-gray-800";          // Locked

                                        return (
                                            <div
                                                key={index}
                                                className={`w-12 h-12 rounded-full ${stageColor} flex items-center justify-center text-sm font-bold shrink-0`}
                                            >
                                                {index + 1}
                                            </div>
                                        );
                                    }
                                    return null;  // Only render the current, previous, and next floors
                                })}
                            </div>
                        </div>

                        <div className="w-full p-4 flex flex-col items-center bg-gray-700 rounded-md mt-2">
                            <h1 className="text-lg font-semibold"><FontAwesomeIcon icon={faMessage} /> Dialogue</h1>
                            <div className="bg-gray-800 p-3 rounded-md mt-2">
                            <span className="font-semibold text-red-600">{monster?.name}</span>: {dialogue}
                            </div>
                        </div>

                        </div>

                        
                    </div>

                    {/* <Popup show={showPopup} message={popupContent} onClose={resetGame} /> */}

                    {finishTimer && (
                        <TowerPopup attempts={attempts + 1} gold={Number(localStorage.getItem('goldEarned'))} onClose={backToDashboard}/>
                    )}
                </div>
            

            </div>
       
        
        
        </>

    );
};

export default IdleGame;
