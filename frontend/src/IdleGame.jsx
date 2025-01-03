import React, { useState, useEffect } from "react";
import { useSpring, animated } from "@react-spring/web";
import axios from "axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowDown, faArrowUp } from "@fortawesome/free-solid-svg-icons";
import SkipFloorPopup from "./SkipFloorPopup";

const Popup = ({ show, message, onClose }) => {
    if (!show) return null;
    

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white text-black p-6 rounded-lg shadow-lg text-center">
                <h2 className="text-xl font-bold mb-4">{message.title}</h2>
                <p className="mb-4 w-96">{message.body}</p>
                {console.log(message.currency_rewards)}
                {message.currency_rewards !== undefined && (
                    <div className="mb-4">
                        <p className="font-bold">
                            Total Reward: {message.currency_rewards} gold
                        </p>
                    </div>
                )}
                
                
                <button
                    onClick={onClose}
                    className="bg-indigo-700 text-white px-4 py-2 rounded hover:bg-indigo-600"
                >
                    Continue
                </button>
            </div>
        </div>
    );
};

const IdleGame = () => {
    const user = JSON.parse(localStorage.getItem('user'));
    const [accountData, setAccountData] = useState(null);
    const [player, setPlayer] = useState(null);
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
    const [isTransitioning, setIsTransitioning] = useState(false); // Prevent actions during transition
    const [showSkipPopup, setShowSkipPopup] = useState(false);

    const [enemyNum, setEnemyNum] = useState(1);
    const [combatSpeed, setCombatSpeed] = useState(1000);

    const [totalRewards, setTotalRewards] = useState(0);
    const [floorsToSkip, setFloorsToSkip] = useState(0); // Add floorsToSkip state



    useEffect(() => {
        if (defeatedMonster) {
            setIsTransitioning(true);

            // Display defeated monster for 2 seconds
            const timeout = setTimeout(() => {
                setEnemyNum(enemyNum + 1);
                setDefeatedMonster(null); // Clear defeated monster state
                handleNextEnemyOrStage(); // Proceed to the next monster or stage
                setIsTransitioning(false);
            }, 2000);

            return () => clearTimeout(timeout);
        }
    }, [defeatedMonster]);

    useEffect(() => {
        const fetchAccountData = async () => {
            try {
                const response = await axios.get("http://localhost:3001/account", {
                    params: { userId: user.id },
                });
                const bravery = response.data.stats.bravery || 0; // Add bravery stat
                const floorsToSkip = Math.floor(bravery / 10); // Example: 10 bravery = 1 floor skip
    
                setPlayer({
                    maxHealth: Math.round(100 * (response.data.stats.stamina * 0.1)),
                    health: Math.round(100 * (response.data.stats.stamina * 0.1)),
                    attack: Math.round(response.data.stats.physical_strength),
                    bravery, // Store bravery
                    floorsToSkip, // Store skip count
                });
            } catch (error) {
                console.error("Error fetching account data:", error);
            }
        };
    
        fetchAccountData();
    }, []);
    

    const playerHealthAnimation = useSpring({
        width:
            player && player.maxHealth > 0
                ? `${(player.health / player.maxHealth) * 100}%`
                : "0%",
        config: { duration: 500 },
    });

    const monsterHealthAnimation = useSpring({
        width:
            monster && monster.maxHealth > 0
                ? `${(monster.health / monster.maxHealth) * 100}%`
                : "0%",
        config: { duration: 500 },
    });

    const resetGame = () => {
        window.location.reload();
    };

    useEffect(() => {
        const fetchStages = async () => {
            try {
                const response = await axios.get("http://localhost:3001/stages");
                const data = response.data;

                setStages(data);

                
                setShowSkipPopup(true);
                
                // setIsTransitioning(true);
                if (data.length > 0) {
                    const firstStageEnemies = JSON.parse(data[0].enemyTypes);
                    const firstMonster = firstStageEnemies[0];

                    setMonster({
                        ...firstMonster,
                        maxHealth: firstMonster.health,
                        health: firstMonster.health,
                    });
                }
            } catch (error) {
                console.error("Failed to fetch stages:", error);
            }
        };

        fetchStages();
    }, []);

    useEffect(() => {
        if (
            gameOver ||
            !monster ||
            isAttacking ||
            showPopup ||
            player === null ||
            showSkipPopup
        )
            return;

        const combatSequence = async () => {
            if (isTransitioning) return;

            if (player.health <= 0 && !showPopup) {
                setGameOver(true);
                
                const response = await axios.post("http://localhost:3001/add-currency", {
                    uid: user.id,
                    reward: totalRewards,
                });
                
                setPopupContent({
                    title: "Game Over!",
                    body: "You have been defeated. Do some quests or buy items from the shop to get stronger!",
                    currency_rewards: totalRewards,
                });
                setShowPopup(true);
                setEnemyNum(1);
                return;
            }
    
            setIsAttacking(true);
    
            // Simulate combat sequence
            await new Promise((resolve) => setTimeout(resolve, combatSpeed));
    
            if (monster.health > 0) {
                setMonster((prev) => ({
                    ...prev,
                    health: prev.health - player.attack,
                }));
                setLogs((prev) => [
                    `Player dealt ${player.attack} damage to ${monster.name}!`,
                    ...prev,
                ]);
    
                await new Promise((resolve) => setTimeout(resolve, combatSpeed));
    
                if (!showPopup && monster.health > player.attack) {
                    setPlayer((prev) => ({
                        ...prev,
                        health: prev.health - monster.attack,
                    }));
                    setLogs((prev) => [
                        `${monster.name} ${enemyNum} dealt ${monster.attack} damage to Player!`,
                        ...prev,
                    ]);
                }
            } else {
                setLogs((prev) => [
                    `Monster ${monster.name} has been defeated!`,
                    ...prev,
                ]);
                setDefeatedMonster(monster); // Set the defeated monster
                
            }
    
            
    
            setIsAttacking(false);
        };

        combatSequence();
    }, [player, monster, gameOver, isAttacking, showPopup, showSkipPopup]);
    

    const handleNextEnemyOrStage = async () => {
        const currentStageEnemies = JSON.parse(stages[currentStageIndex].enemyTypes);
        const boss = stages[currentStageIndex]?.boss
            ? JSON.parse(stages[currentStageIndex].boss)
            : null;
        const numberOfEnemies = stages[currentStageIndex].numberOfEnemies - 1;
    
        if (numberOfEnemies > 0) {
            // Spawn a random enemy
            const randomEnemy =
                currentStageEnemies[Math.floor(Math.random() * currentStageEnemies.length)];
    
            setMonster({
                ...randomEnemy,
                maxHealth: randomEnemy.health,
                health: randomEnemy.health,
            });
    
            const updatedStages = [...stages];
            updatedStages[currentStageIndex].numberOfEnemies -= 1;
            setStages(updatedStages);
            setStageName(updatedStages[currentStageIndex].name);
    
            setLogs((prev) => [
                `New enemy appeared: ${randomEnemy.name}!`,
                ...prev,
            ]);
        } else if (boss && monster.name !== boss.name) {
            // Spawn the boss
            setMonster({
                ...boss,
                maxHealth: boss.health,
                health: boss.health,
            });
            setLogs((prev) => [
                `The boss ${boss.name} has appeared!`,
                ...prev,
            ]);
        } else {
            // Floor completed: Increment gold and show continue popup
            const goldReward = stages[currentStageIndex]?.currency_reward || 0;
            
    
            // Show popup to continue to next floor
            const nextStageIndex = currentStageIndex + 1;
    
            if (nextStageIndex < stages.length && stages[nextStageIndex]) {
                try {
                    // Safely parse the enemies for the next stage
                    const nextStageEnemies = JSON.parse(stages[nextStageIndex].enemyTypes || "[]");
                    const firstEnemy = nextStageEnemies.length > 0 ? nextStageEnemies[0] : null;
    
                    // Update the current stage index
                    setCurrentStageIndex(nextStageIndex);
    
                    // Initialize the next stage's enemy count if missing
                    const updatedStages = [...stages];
                    if (updatedStages[nextStageIndex].numberOfEnemies === undefined) {
                        updatedStages[nextStageIndex].numberOfEnemies = nextStageEnemies.length;
                    }
                    setStages(updatedStages);
    
                    // Set the first enemy for the next stage
                    setMonster(
                        firstEnemy
                            ? {
                                  ...firstEnemy,
                                  maxHealth: firstEnemy.health,
                                  health: firstEnemy.health,
                              }
                            : null
                    );
    
                    setEnemyNum(1); // Reset enemy count for the new stage
    
                    setLogs((prev) => [
                        `Welcome to ${updatedStages[nextStageIndex].name}!`,
                        ...prev,
                    ]);

                    setTotalRewards(totalRewards + goldReward); // Increment gold
    
                    // Show popup content for next floor continuation
                    setPopupContent({
                        title: `Floor ${currentStageIndex + 1} Complete!`,
                        body: `You've earned ${goldReward} gold! Click to continue to the next floor.`,
                        nextStageIndex,
                    });

                    setShowPopup(true); // Show popup to continue
    
                } catch (error) {
                    console.error("Error parsing enemyTypes JSON:", error);
                    setPopupContent({
                        title: "Error",
                        body: "An error occurred while advancing to the next stage.",
                    });
                    setShowPopup(true);
                }
            } else {
                // End of game logic
                setGameOver(true);
                try {
                    await axios.post("http://localhost:3001/add-currency", {
                        uid: user.id,
                        reward: stages[currentStageIndex]?.currency_reward || 0,
                    });
                    setPopupContent({
                        title: "Victory!",
                        body: "You've defeated all enemies and completed the game!",
                        currency_rewards: stages[currentStageIndex]?.currency_reward || 0,
                    });
                    setEnemyNum(1);
                    setShowPopup(true);
                } catch (error) {
                    console.error("Error adding currency:", error);
                    setPopupContent({
                        title: "Error",
                        body: "An error occurred while saving your rewards.",
                    });
                    setShowPopup(true);
                }
            }
        }
    };
    
    
    
    
    
    const handleContinue = () => {
        const { nextStageIndex, nextEnemy } = popupContent;
    
        if (nextStageIndex !== undefined && nextEnemy) {
            setCurrentStageIndex(nextStageIndex); // Update to the skipped stage
            setMonster(nextEnemy); // Set the first enemy for the skipped stage
    
            setPopupContent(null);
        }
        setEnemyNum(1);
        setShowPopup(false); // Hide the popup
    };
    
    const increaseCombatSpeed = () => {
        setCombatSpeed(combatSpeed / 2);
    }

    const decreaseCombatSpeed = () => {
        setCombatSpeed(combatSpeed * 2);
    }

    const handleSkipFloors = (floorsToSkip) => {
        const newIndex = Math.min(currentStageIndex + floorsToSkip, stages.length - 1);
        setFloorsToSkip(floorsToSkip);
        setCurrentStageIndex(newIndex);

        // Set the monster for the new stage
        const nextStageEnemies = JSON.parse(stages[newIndex].enemyTypes);
        const firstMonster = nextStageEnemies[0];
        setMonster({
            ...firstMonster,
            maxHealth: firstMonster.health,
            health: firstMonster.health,
        });

        setLogs((prev) => [
            `Skipped ${floorsToSkip} floors. Now at stage ${stages[newIndex].name}.`,
            ...prev,
        ]);
        setShowSkipPopup(false); // Hide popup
        // setIsTransitioning(false);    
    };

    const handleCancelSkip = () => {
        setShowSkipPopup(false);
        // setIsTransitioning(false); // Start combat if skipping is canceled
    };
    

    return (
        <div className="bg-gradient-to-b from-gray-900 to-gray-700 min-h-screen text-white p-5 font-mono flex flex-col items-center">
            <h1 className="text-4xl mb-6 text-yellow-300 text-center font-bold">
                The Tower of Rebirth
            </h1>
            <div className="flex gap-3 justify-between items-center justify-center">
            <button className="px-4 py-2 bg-indigo-600 rounded-md mb-4" onClick={decreaseCombatSpeed}>Decrease speed <FontAwesomeIcon icon={faArrowDown} /></button>
            <div>Current Speed: {(1000/combatSpeed)}x</div>
            <button className="px-4 py-2 bg-indigo-600 rounded-md mb-4" onClick={increaseCombatSpeed}>Increase speed <FontAwesomeIcon icon={faArrowUp} /></button>
            </div>
            {/* Tower Layout */}
            <div className="w-full max-w-2xl">
                {/* Floor Indicator */}
                <div className="p-4 bg-gray-800 rounded text-center mb-6">
                    <h2 className="text-2xl font-bold">
                        {stages && stages[currentStageIndex] ? stages[currentStageIndex].name : ''}
                    </h2>
                </div>

                {/* Player and Monster Stats */}
                <div className="grid grid-cols-1 gap-6">
                    {/* Player Stats */}
                    <div className="p-4 bg-gray-800 rounded flex flex-col items-center">
                        <h2 className="text-2xl font-bold mb-2">{user.username}</h2>
                        <div className="relative w-full h-6 bg-gray-600 rounded-full">
                            <animated.div
                                className="absolute h-full bg-green-500 rounded-full"
                                style={playerHealthAnimation}
                            />
                            <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-white">
                                {player?.health}/{player?.maxHealth}
                            </span>
                        </div>
                        <p className="text-sm mt-2">Health: {player?.health}</p>
                        <p className="text-sm">Attack: {player?.attack}</p>
                    </div>

                    <div className="italic text-lg text-center font-bold">VS</div>

                    {/* Monster Stats */}
                    {monster && (
                        <div className="p-4 bg-gray-800 rounded flex flex-col items-center">
                            <h2 className="text-2xl font-bold mb-2">{enemyNum}. {monster.name}</h2>
                            <div className="relative w-full h-6 bg-gray-600 rounded-full">
                                <animated.div
                                    className="absolute h-full bg-red-500 rounded-full"
                                    style={monsterHealthAnimation}
                                />
                                <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-white">
                                    {monster.health}/{monster.maxHealth}
                                </span>
                            </div>
                            <p className="text-sm mt-2">Health: {monster.health}</p>
                            <p className="text-sm">Attack: {monster.attack}</p>
                        </div>
                    )}
                </div>

                <button
                    className="mt-6 w-full bg-red-500 text-white px-4 py-2 rounded font-bold hover:bg-red-600 transition"
                    onClick={resetGame}
                >
                    Retry Tower
                </button>

                {/* Combat Logs */}
                <div className="mt-6 p-4 bg-gray-700 rounded">
                    <h3 className="text-xl font-bold mb-2 text-yellow-200">Combat Logs</h3>
                    <div className="overflow-y-scroll h-40 bg-gray-600 p-2 rounded">
                        {logs.map((log, index) => (
                            <p key={index} className="text-sm text-gray-300">
                                {log}
                            </p>
                        ))}
                    </div>
                </div>
            </div>
            
            <SkipFloorPopup
                show={showSkipPopup}
                bravery={player?.bravery || 0}  // Pass bravery points to the popup
                maxFloors={stages.length - currentStageIndex} // Set max floors to skip
                onSkip={handleSkipFloors}
                onCancel={handleCancelSkip}
            />

            <Popup show={showPopup} message={popupContent} onClose={handleContinue} />
        </div>
    );
};

export default IdleGame;
