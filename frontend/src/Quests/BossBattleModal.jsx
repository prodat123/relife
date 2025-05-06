import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBolt, faCross, faDroplet, faFire, faFistRaised, faGavel, faGun, faStar, faWater, faWind, faX } from "@fortawesome/free-solid-svg-icons";
import config from "../config";
import axios from "axios";
import { faSword } from '@fortawesome/free-solid-svg-icons';

export default function BossBattleModal({ streak, stat, attack, difficulty, onClose }) {
    const userId = JSON.parse(localStorage.getItem('user'))?.id;
    // const [bossId, setBossId] = useState(1);
    const [boss, setBoss] = useState({});
    const [bossName, setBossName] = useState('Goblin King');
    const [bossHealth, setBossHealth] = useState(100);
    const [bossResistances, setBossResistances] = useState([]);
    const [bossWeaknesses, setBossWeaknesses ] = useState([]);
    const [isDamaged, setIsDamaged] = useState(false);
    const [ripples, setRipples] = useState([]);
    const [isVictory, setIsVictory] = useState(false); // State to check if player wins
    const [countdown, setCountdown] = useState(3); // State for countdown timer
    const healthbarRef = useRef(null);
    const [finalDamage, setFinalDamage] = useState(0);
    const [elementalFactor, setElementalFactor] = useState(1);
    const [dealtDamage, setDealtDamage] = useState(false);
    const [itemRewards, setItemRewards] = useState([]);
    var bossId = 1;

    const [showParts, setShowParts] = useState({
        attack: false,
        streak: false,
        elementalFactor: false,
        difficulty: false,
        equal: false,
        finalDamage: false,
    });

    const rarities = [
        { rarity: "Peasantly", weight: 100 },
        { rarity: "Artisan", weight: 33 },
        { rarity: "Knightly", weight: 10 },
        { rarity: "Noble", weight: 3 },
        { rarity: "Kingly", weight: 1 },
        { rarity: "Emperor", weight: 0.1 },
    ];

    useEffect(() => {
        const fetchBossData = async() => {
            const floorResponse = await axios.get(`${config.backendUrl}/tower-floor`, {
                params: { userId: userId } // Send userId as a query parameter
            });

            const floor = floorResponse.data.floor > 0 ? floorResponse.data.floor : 1;
            bossId = floor;

            const response = await axios.get(`${config.backendUrl}/monster`, {
                params: { id: floor },
            });
            
            let monsterStats = response.data;

            console.log(monsterStats);

            setBoss(monsterStats);
            setBossResistances(JSON.parse(monsterStats.resistances));
            setBossWeaknesses(JSON.parse(monsterStats.weaknesses));

            if(floorResponse.data.bossName !== ''){
                setBossName(floorResponse.data.bossName);
            }else{
                setBossName(monsterStats.name);
            }

            if(floorResponse.data.remainingBossHealth <= 0){
                setBossHealth(monsterStats.health);
            }else{
                setBossHealth(floorResponse.data.remainingBossHealth);
            }
        }

        fetchBossData();
    }, [])
    

    const handleDamage = async() => {
        if (bossHealth <= 0) return;

        const response = await axios.get(`${config.backendUrl}/monster`, {
            params: { id: bossId },
        });
        
        let monsterStats = response.data;

        const bossResistancesTemp = JSON.parse(monsterStats.resistances);
        const bossWeaknessesTemp = JSON.parse(monsterStats.weaknesses);

        const statKey = Object.keys(stat)[0];


        let elementalFactor = 1; // Default

        if (bossWeaknessesTemp.includes(statKey)) {
            elementalFactor = 1.5;
        } else if (bossResistancesTemp.includes(statKey)) {
            elementalFactor = 0.5;
        }

        setElementalFactor(elementalFactor);

        var tempFinalDamage = Math.ceil(attack * streak * elementalFactor * Math.sqrt(difficulty));
        setFinalDamage(tempFinalDamage);

        // Reduce bossHealth by 10 or until it reaches 0
        setBossHealth(prev => Math.max(prev - tempFinalDamage, 0));
        
        setIsDamaged(true);

        // Generate a ripple effect
        const rippleId = Math.random();
        setRipples(prev => [...prev, rippleId]);

        setTimeout(() => {
            setIsDamaged(false);
        }, 500);

        setTimeout(() => {
            setRipples(prev => prev.filter(id => id !== rippleId));
        }, 800); // ripple lasts a bit longer

        // Check for victory condition
        if (bossHealth <= 0) {
            setIsVictory(true);
        }
    };

    const updateFloor = async () => {
        if (!userId) return;
        try {
            const response = await axios.put(`${config.backendUrl}/tower-floor-update`, {
                userId,
                bossName: bossName,
                bossHealth: bossHealth,
            });
            setItemRewards(response.data.items || []);
        } catch (error) {
            console.error('Failed to update floor:', error);
        }
    };

    useEffect(() => {
        if(isDamaged){
            updateFloor();
        }
    }, [isDamaged]);

    const handleClose = () => {
        if (onClose) onClose(); // Close the modal after battle ends
    };

    // useEffect(() => {
    //     if (isVictory) {
    //         // Automatically close the modal after a short delay once the battle is won
    //         setTimeout(() => {
    //             handleClose();
    //         }, 2000); // 2 seconds delay for victory
    //     }
    // }, [isVictory]);

    useEffect(() => {
        const timers = [
            setTimeout(() => setShowParts((p) => ({ ...p, attack: true })), 300),
            setTimeout(() => setShowParts((p) => ({ ...p, streak: true })), 600),
            setTimeout(() => setShowParts((p) => ({ ...p, elementalFactor: true })), 900),
            setTimeout(() => setShowParts((p) => ({ ...p, difficulty: true })), 1200),
            setTimeout(() => setShowParts((p) => ({ ...p, equal: true })), 1500),
            setTimeout(() => setShowParts((p) => ({ ...p, finalDamage: true })), 1800),
            setTimeout(() => {
                handleDamage(); // ✅ CALL handleDamage after showing finalDamage!
                setDealtDamage(true);
            }, 2400),
        ];
    
        return () => timers.forEach(clearTimeout); // Clean up on unmount
    }, []);
    

    // useEffect(() => {
    //     // Start countdown after component mounts
    //     if (countdown > 0) {
    //         const timer = setInterval(() => {
    //             setCountdown((prev) => prev - 1); // Decrement countdown
    //         }, 1000); // Update every second

    //         return () => clearInterval(timer); // Clear timer on cleanup
    //     } else {
    //         // Once countdown reaches 0, apply damage
    //         handleDamage();
    //     }
    // }, [countdown]);

    
    // function getRandomRarity() {
    //     const totalWeight = rarities.reduce((sum, r) => sum + r.weight, 0);
    //     const randomNum = Math.random() * totalWeight;
    
    //     let cumulativeWeight = 0;
    //     for (const rarity of rarities) {
    //         cumulativeWeight += rarity.weight;
    //         if (randomNum <= cumulativeWeight) {
    //             return rarity.rarity;
    //         }
    //     }
    // }
    

    const rarityStyles = {
        peasantly: {
            backgroundColor: '#b76f44', 
            color: '#1F2937',           
        },
        artisan: {
            backgroundColor: '#009688', 
            color: '#FFFFFF',           
        },
        knightly: {
            backgroundColor: '#cccccc', 
            color: '#FFFFFF',           
        },
        noble: {
            backgroundColor: '#e06666', 
            color: '#000000',           
        },
        kingly: {
            backgroundColor: '#ffd966', 
            color: '#000000',           
        },
        emperor: {
            backgroundColor: '#9900ff', 
            color: '#000000',           
        },
    };

    // function getRandomItem(index) {
    //     const rarity = getRandomRarity();
    //     return {
    //         name: `Item ${index + 1}`,
    //         rarity,
    //     };
    // }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex flex-col items-center justify-center z-50 overflow-hidden">

            <div className="p-4 bg-gray-800 w-11/12 max-w-3xl rounded-md">
                <p className="text-center text-red-600 font-semibold">{"<Floor " + bossId + ">"}</p>
                <h1 className="text-3xl text-center font-bold mb-2">{bossName}</h1>
                {/* Healthbar Container */}
                <div className="relative flex justify-center items-center">
                    {/* Healthbar */}
                    <motion.div
                        ref={healthbarRef}
                        animate={isDamaged ? { x: [-5, 5, -5, 5, 0] } : {}}
                        transition={{ duration: 0.4 }}
                        className="w-full h-8 bg-gray-700 rounded-full overflow-hidden relative z-10"
                    >
                        <span className="absolute right-1/2 top-1">{bossHealth}/{boss.health}</span>
                        {/* Inner Health */}
                        <motion.div
                            className="h-full bg-red-500"
                            style={{ width: `${(bossHealth/boss.health) * 100}%` }}
                            animate={isDamaged ? { backgroundColor: ["#fb2c36", "#ffffff", "#fb2c36"] } : {}}
                            transition={{ duration: 0.4 }}
                        />
                    </motion.div>

                    {/* Ripples */}
                    {ripples.map((id) => (
                        <motion.div
                            key={id}
                            initial={{ scale: 0, opacity: 1 }}
                            animate={{ scale: 2, opacity: 0 }}
                            transition={{ duration: 0.8, ease: "easeOut" }}
                            className="absolute w-72 h-8 border-2 border-blue-600 rounded-full"
                            style={{ zIndex: 5 }}
                        />
                    ))}
                </div>

                {/* Boss */}
                {/* <div className="flex items-center justify-center">
                <img
                    src="/sprites/bosses/Orc-Idle.gif"
                    alt="Boss"
                    className="w-[260px] h-[260px] object-contain mt-10 pixel-art"
                />
                </div> */}

                    

                <div className="p-4 flex flex-wrap items-center justify-center text-white bg-gray-800 rounded-lg">
                    {/* Attack */}
                    {showParts.attack && (
                        <span className="flex text-red-400 items-center animate-fade-in">
                        <FontAwesomeIcon icon={faBolt} />
                        <span className="text-red-400 text-xl font-bold ml-1">{attack}</span>
                        <FontAwesomeIcon icon={faX} className="text-gray-400 mx-2" />
                        </span>
                    )}

                    {/* Streak */}
                    {showParts.streak && (
                        <span className="flex items-center animate-fade-in">
                        <FontAwesomeIcon icon={faFire} className="text-orange-400 text-xl" />
                        <span className="text-orange-300 text-xl font-bold ml-1">{streak}</span>
                        <FontAwesomeIcon icon={faX} className="text-gray-400 mx-2" />
                        </span>
                    )}

                    {/* Elemental Factor */}
                    {showParts.elementalFactor && (
                        <span className="flex items-center animate-fade-in">
                        <FontAwesomeIcon icon={faDroplet} className="text-green-300 text-xl" />
                        <span className="text-green-300 text-xl font-bold ml-1">{elementalFactor}</span>
                        <FontAwesomeIcon icon={faX} className="text-gray-400 mx-2" />
                        </span>
                    )}

                    {/* Difficulty */}
                    {showParts.difficulty && (
                        <span className="flex items-center animate-fade-in">
                        <FontAwesomeIcon icon={faStar} className="text-purple-300 text-xl" />
                        <span className="text-purple-300 text-xl font-bold ml-1">{Math.sqrt(difficulty).toFixed(2)}</span>
                        </span>
                    )}

                    {/* Equal Sign */}
                    {showParts.equal && (
                        <span className="text-gray-400 font-bold mx-2 animate-fade-in">=</span>
                    )}

                    {/* Final Damage */}
                    {showParts.finalDamage && (
                        <span className="text-yellow-400 text-3xl font-extrabold animate-fade-in">{finalDamage}</span>
                    )}
                </div>


                

                {/* Victory or Defeat Message */}

                {bossHealth <= 0 && (
                    <div className="mt-6 text-center text-green-400 font-bold">
                        <p className="text-2xl">Victory!</p>
                        <p className="text-xl">You've defeated the boss!</p>
                        <div className="border-t border-gray-700 mt-2">
                            <h3 className="mt-2 text-xl text-yellow-400 font-semibold">Rewards</h3>
                            
                            {itemRewards.length > 0 && (
                            <div className="mt-2 grid grid-cols-3 gap-4">
                                
                                {itemRewards.map((item, index) => (
                                    <motion.div
                                        key={item.id || index}
                                        className="bg-gray-800 p-6 rounded-lg shadow-lg"
                                        style={{
                                            ...rarityStyles[item.rarity],
                                        }}
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: index * 0.2, duration: 0.5, ease: 'easeOut' }}
                                        onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                                        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                                    >
                                        <div className="flex flex-col items-center">
                                            <img src={item.image} className="w-full pixel-art"></img>
                                            <p className="text-lg font-semibold text-white">{item.name}</p>
                                            <p className="text-sm text-white italic">{item.rarity}</p>
                                        </div>
                                    </motion.div>
                                ))}

                            </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Close Button */}
                {dealtDamage && (
                    <div className="flex items-center justify-center">
                        <button
                            onClick={handleClose}
                            className="mt-4 px-6 py-2 bg-gray-500 text-white font-bold rounded-md hover:bg-gray-600 transition"
                        >
                            Exit Tower
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
