import { useContext, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaDAndD, FaLock } from 'react-icons/fa';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowCircleDown, faArrowCircleUp, faArrowDown19, faArrowDownShortWide, faBolt, faBrain, faChessRook, faDragon, faDumbbell, faDungeon, faHeart, faRunning, faShieldAlt, faSkull, faSkullCrossbones, faTowerObservation } from '@fortawesome/free-solid-svg-icons';
import axios from 'axios';
import config from '../config';
import { UserContext } from '../Account/UserContext';

const BossSelectionModal = () => {
    const userId = JSON.parse(localStorage.getItem("user"))?.id;
    const [expanded, setExpanded] = useState(false);
    const [bosses, setBosses] = useState([]);
    const [unlockedFloors, setUnlockedFloors] = useState([]);
    const [currentBoss, setCurrentBoss] = useState('');
    const [remainingBossHealth, setRemainingBossHealth] = useState(0);
    const { accountDataRef } = useContext(UserContext);
    

    useEffect(() => {
        const interval = setInterval(() => {
            if (accountDataRef.current && accountDataRef.current.currency !== undefined) {
                setUnlockedFloors(accountDataRef.current.unlockedFloors);
            }
        }, 100); // You can reduce or increase this as needed

        return () => clearInterval(interval);
    }, []);

    const updateFloor = async (boss) => {
        if (!userId) return;

        try {
            await axios.put(`${config.backendUrl}/tower-floor-update`, {
                userId,
                bossName: boss.name,
                bossHealth: boss.health,
            });

            setCurrentBoss(boss);
        } catch (error) {
            console.error('Failed to update floor:', error);
        }
    };

    useEffect(() => {
        
        const fetchBossData = async() => {

            const floorResponse = await axios.get(`${config.backendUrl}/tower-floor`, {
                params: { userId: userId } // Send userId as a query parameter
            });


            const floor = floorResponse.data.floor > 0 ? floorResponse.data.floor : 1;

            const bossResponse = await axios.get(`${config.backendUrl}/monster`, {
                params: { id: floor },
            });
            
            let monster = bossResponse.data;

            setRemainingBossHealth(floorResponse.data.remainingBossHealth || monster.health);


            setCurrentBoss(monster);

            const response = await axios.get(`${config.backendUrl}/allMonsters`);
            
            let allMonsters = response.data;

            setBosses(allMonsters);
            // setBossResistances(JSON.parse(monsterStats.resistances));
            // setBossWeaknesses(JSON.parse(monsterStats.weaknesses));

            // if(floorResponse.data.bossName !== ''){
            //     setBossName(floorResponse.data.bossName);
            // }else{
            //     setBossName(monsterStats.name);
            // }

            // if(floorResponse.data.remainingBossHealth <= 0){
            //     setBossHealth(monsterStats.health);
            // }else{
            //     setBossHealth(floorResponse.data.remainingBossHealth);
            // }
        }

        fetchBossData();
    }, [])

    
    const rarityStyles = {
        peasantly: {
            backgroundColor: '#b76f44', 
            color: '#FFFFFF',           
        },
        artisan: {
            backgroundColor: '#009688', 
            color: '#FFFFFF',           
        },
        knightly: {
            backgroundColor: '#cccccc', 
            color: '#000000',           
        },
        noble: {
            backgroundColor: '#e06666', 
            color: '#FFFFFF',           
        },
        kingly: {
            backgroundColor: '#ffd966', 
            color: '#000000',           
        },
        emperor: {
            backgroundColor: '#9900ff', 
            color: '#FFFFFF',           
        },
    };

    return (
        <div className="relative w-full">
            {/* Collapsed View (Full Width Gamified Boss Banner) */}
            {!expanded && (
                <div
                    onClick={() => setExpanded(true)}
                    className="hover:scale-[102%] transition relative w-full p-4 mb-4 hover:bg-gray-700 bg-gray-800 rounded-md shadow-2xl cursor-pointer flex items-center flex-wrap justify-between overflow-hidden"
                >
                    {/* Decorative background shimmer */}
                    {/* <motion.div
                        className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-yellow-300/10 to-transparent"
                    /> */}

                    {/* Boss Info */}
                    <div className="flex items-center gap-6 z-10">
                         
                        <FontAwesomeIcon icon={faDungeon} className='text-indigo-400 text-4xl'/> 
                        <div>
                            <h2 className="text-2xl font-extrabold text-white">{currentBoss.name}</h2>
                            <p className="text-md text-red-600">{'<Floor ' + currentBoss.id + '>'}</p>
                            {/* Hint to click */}
                            <div className="z-10">
                                <p className="text-yellow-400 font-bold text-xs">Tap to Change</p>
                            </div>
                            
                        </div>
                        
                    </div>

                    <div className="w-full lg:max-w-md lg:m-0 mt-2">
                        <div className="w-full bg-gray-600 rounded-full h-5 relative overflow-hidden">
                            <div
                            className="absolute top-0 left-0 h-5 bg-red-600 transition-all duration-500 ease-in-out"
                            style={{ width: `${(remainingBossHealth / currentBoss.health) * 100}%` }}
                            />
                            <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white">
                            <FontAwesomeIcon icon={faSkull} className='mr-2'/> {remainingBossHealth} / {currentBoss.health}
                            </div>
                        </div>
                    </div>





                    <div className="flex flex-wrap gap-2 mt-2">
                        {/* Weaknesses */}
                        {currentBoss !== "" && JSON.parse(currentBoss?.weaknesses)?.map((weakness, idx) => (
                            <div
                            key={`weak-${idx}`}
                            className="flex justify-center items-center px-2 py-1 text-white rounded-full text-md font-semibold"
                            >
                            <FontAwesomeIcon icon={faArrowCircleDown} className="mr-1 text-red-600" />
                            Weak:
                            {weakness === "strength" && (
                            <div className="flex items-center ml-2">
                                <FontAwesomeIcon icon={faDumbbell} className="text-red-500" />
                                {/* <span className="font-semibold ml-1"> +{quest.stat_reward.strength}</span> */}
                            </div>
                            )}
                            {weakness === "endurance" && (
                            <div className="flex items-center ml-2">
                                <FontAwesomeIcon icon={faHeart} className="text-green-500" />
                                {/* <span className="font-semibold ml-1"> +{quest.stat_reward.endurance}</span> */}
                            </div>
                            )}
                            {weakness === "bravery" && (
                            <div className="flex items-center ml-2">
                                <FontAwesomeIcon icon={faRunning} className="text-blue-500" />
                                {/* <span className="font-semibold ml-1"> +{quest.stat_reward.bravery}</span> */}
                            </div>
                            )}
                            {weakness === "intelligence" && (
                            <div className="flex items-center ml-2">
                                <FontAwesomeIcon icon={faBrain} className="text-yellow-500" />
                                {/* <span className="font-semibold ml-1">+{quest.stat_reward.intelligence}</span> */}
                            </div>
                            )}
                            </div>
                        ))}

                        {/* Resistances */}
                        {currentBoss !== "" && JSON.parse(currentBoss?.resistances)?.map((resistance, idx) => (
                            <div
                            key={`resist-${idx}`}
                            className="flex items-center px-2 py-1 text-white rounded-full text-md font-semibold"
                            >
                            <FontAwesomeIcon icon={faArrowCircleUp} className="mr-1 text-green-600" />
                            Resist: 
                            {resistance === "strength" && (
                            <div className="flex items-center ml-2">
                                <FontAwesomeIcon icon={faDumbbell} className="text-red-500" />
                                {/* <span className="font-semibold ml-1"> +{quest.stat_reward.strength}</span> */}
                            </div>
                            )}
                            {resistance === "endurance" && (
                            <div className="flex items-center ml-2">
                                <FontAwesomeIcon icon={faHeart} className="text-green-500" />
                                {/* <span className="font-semibold ml-1"> +{quest.stat_reward.endurance}</span> */}
                            </div>
                            )}
                            {resistance === "bravery" && (
                            <div className="flex items-center ml-2">
                                <FontAwesomeIcon icon={faRunning} className="text-blue-500" />
                                {/* <span className="font-semibold ml-1"> +{quest.stat_reward.bravery}</span> */}
                            </div>
                            )}
                            {resistance === "intelligence" && (
                            <div className="flex items-center ml-2">
                                <FontAwesomeIcon icon={faBrain} className="text-yellow-500" />
                                {/* <span className="font-semibold ml-1">+{quest.stat_reward.intelligence}</span> */}
                            </div>
                            )}
                            </div>
                        ))}
                    </div>


                    
                </div>
            )}

            {/* Expanded View */}
            <AnimatePresence>
                {expanded && (
                    <motion.div
                        initial={{ opacity: 0, y: -30 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -30 }}
                        className="fixed inset-0 bg-black bg-opacity-90 flex flex-col items-center justify-center p-8 z-[999999] overflow-y-auto"
                    >
                        <motion.button
                            onClick={() => setExpanded(false)}
                            whileHover={{ scale: 1.1 }}
                            className="mb-8 text-white underline hover:text-gray-300"
                        >
                            Close
                        </motion.button>

                        <h2 className="text-3xl font-extrabold text-center text-yellow-400 mb-10 tracking-wide">
                            Choose Your Floor
                        </h2>

                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6 h-1/2 mb-4">
                        {bosses.map((boss, index) => {
                            const rarityCounts = {};
                            (boss.loot || []).forEach(item => {
                                const rarity = item.rarity;
                                if (rarity) {
                                    rarityCounts[rarity] = (rarityCounts[rarity] || 0) + 1;
                                }
                            });
                            return (
                                <div
                                    key={index}
                                    className={`relative flex items-center justify-center flex-col p-4 rounded-md shadow-lg transition-all duration-300 ease-in-out ${
                                        unlockedFloors.includes(boss.name)
                                            ? 'bg-gray-800 hover:scale-[105%] hover:bg-gray-700 cursor-pointer'
                                            : 'bg-gray-900 opacity-40 cursor-not-allowed'
                                    }`}
                                    onClick={() => {
                                        if (unlockedFloors.includes(boss.name)) {
                                            updateFloor(boss);
                                            setExpanded(false);
                                        }
                                    }}
                                >
                                    <span className='text-red-400 text-center text-xs'>Floor {boss.id}</span>
                                    <p className="text-center text-white font-bold">{boss.name}</p>
                                    <p className='text-sm'>Health: {boss.health}</p>

                                    {/* Rarity display */}
                                    <div className="flex gap-1 mt-2 flex-wrap justify-center">
                                        {Object.entries(rarityCounts).map(([rarity, count]) => (
                                            <span
                                                key={rarity}
                                                className={`px-2 py-1 text-xs rounded-full font-semibold`}
                                                style={rarityStyles[rarity]}
                                            >
                                                {count}
                                            </span>
                                        ))}
                                    </div>

                                    {!unlockedFloors.includes(boss.name) && (
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <FaLock size={32} className="text-red-500" />
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default BossSelectionModal;
