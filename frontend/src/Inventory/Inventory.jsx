import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import config from '../config';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import CraftingSystem from './CraftingSystem';
import { Shield, Sword, HardHat, Boot, Pants, StretchVertical, Footprints } from 'lucide-react';
import { faArrowRight, faCog, faHelmetSafety, faPerson, faShield, faTrash } from '@fortawesome/free-solid-svg-icons';
import ScrapboxOpener from './ScrapboxOpener';

function Inventory() {
    const userId = JSON.parse(localStorage.getItem('user'))?.id;
    const [accountData, setAccountData] = useState(null);
    // const [equipment, setEquipment] = useState(null);
    const [inventory, setInventory] = useState([]);
    const [showCrafting, setShowCrafting] = useState(false);
    const dropdownRef = useRef(null); // Reference to the dropdown element
    const [activeDropdown, setActiveDropdown] = useState(null);

    const [baseStats, setBaseStats] = useState({});
    const [upgradedStats, setUpgradedStats] = useState({});

    const [scrappingId, setScrappingId] = useState(null);

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

    const handleScrap = async (itemId) => {
        setScrappingId(itemId);
        try {
            const response = await axios.post(`${config.backendUrl}/scrap`, {
                userId,
                itemId,  // Send the item's ID to uniquely identify it
            });

            const data = response.data;

            if (data.success) {
                // Remove old item and add new scrap to state
                const newInventory = inventory
                    .filter((item) => item.id !== itemId || item.id !== data.scrap.id) // remove scrapped item
                    .concat(data.scrap); // add scrap item
                fetchAccountData();
            } else {
                alert(data.error || 'Failed to scrap item.');
            }
        } catch (err) {
            console.error('Scrap failed:', err);
            alert('Something went wrong while scrapping.');
        } finally {
            setScrappingId(null);
        }
    };


    const fetchAccountData = async () => {
        try {
            const response = await axios.get(`${config.backendUrl}/account`, {
                params: { userId },
            });
            
            setAccountData(response.data);
            setInventory(response.data.inventory || []);
        } catch (error) {
            console.error("Error fetching account data:", error);
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

    const equipmentSlots = [
        { slot: "head", top: "15.8%", left: "48.3%", zIndex: 100 },
        { slot: "torso", top: "44%", left: "46.85%", zIndex: 98 },
        { slot: "legs", top: "70%", left: "50%", zIndex: 90 },
        { slot: "feet", top: "90.6%", left: "51.62%", zIndex: 80 },
        { slot: "weapon", top: "50%", left: "50%", zIndex: 99 },
    ];
      

    // if (!accountData) return <p>Loading...</p>;

    const equipment = accountData?.equipment;

    return (
        <div className="w-full grid xl:grid-cols-6 lg:grid-cols-5 md:grid-cols-3 grid-cols-1 p-6">
            <div className="relative lg:col-start-2 md:col-start-2 col-start-1 col-span-5 rounded-lg h-full">
                <h1 className="text-4xl w-full font-bold text-center text-white mb-3">Inventory</h1>

                <div className="grid lg:grid-cols-3 grid-cols-1 p-6 bg-gray-800 rounded-lg shadow-lg lg:gap-3 gap-y-2">
            
                    {/* Avatar and Equipment Section */}
                    <div className="relative order-first flex-1 lg:col-span-1 md:col-span-1 flex flex-col justify-center items-center h-full rounded-md shadow-md bg-indigo-600">
                        {/* Player Sprite */}
                        <div className="character-sprite relative w-3/4">
                            <img src={"/sprites/player.png"} alt="Base Character" className="w-full pixel-art" />

                            {/* Equipped Items */}
                            {equipmentSlots.map(({ slot, top, left, zIndex }) => (
                                <div
                                    key={slot}
                                    style={{
                                        width: "100%",
                                        position: "absolute",
                                        top: top,
                                        left: left,
                                        zIndex: zIndex,
                                        transform: "translate(-50%, -50%)",
                                    }}
                                >
                                    {/* Equipped Item Sprite */}
                                    {equipment && (
                                        <>
                                        {equipment[slot]?.image_url && (
                                            <img
                                                src={`${equipment[slot].image_url}?v=${new Date().getTime()}` || "/sprites/equipment/default.png"}
                                                alt={`${equipment[slot].name || "None"} Gear`}
                                                className="pixel-art"
                                                style={{
                                                    width: "100%",
                                                    height: "100%",
                                                    objectFit: "fill",
                                                    zIndex: 1,
                                                    pointerEvents: "none",
                                                }}
                                            />
                                        )}
                                        </>
                                    )}
                                    
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Item Select Section */}
                    <div className="w-full col-span-2 bg-gradient-to-br from-gray-800 to-gray-700 p-8 rounded-md shadow-2xl border border-gray-600">
                        <h2 className="text-3xl text-center text-yellow-300 font-bold mb-6"><FontAwesomeIcon icon={faPerson} /> Equipment Loadout</h2>

                        <div className="flex items-center justify-center flex-wrap gap-8">
                            {["head", "torso", "legs", "feet", "weapon"].map((slot) => (
                            <div key={slot} className="text-center">
                                <h4 className="text-lg font-extrabold text-white capitalize">{slot}</h4>

                                {equipment && (
                                <select
                                    value={equipment[slot]?.id || ""}
                                    onChange={(e) => equipItem(slot, e.target.value)}
                                    className="mt-3 w-48 px-4 py-2 rounded-lg bg-gray-900 border-2 border-gray-600 text-white text-sm appearance-none hover:border-yellow-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 transition-all duration-200"
                                >
                                    <option value="">None</option>
                                    {inventory
                                    .filter(
                                        (item) => item.type === slot || equipment[slot]?.id === item.id
                                    )
                                    .map((item) => (
                                        <option
                                            key={item.id}
                                            value={item.id}
                                            className={`font-semibold`}
                                            style={rarityStyles[item.rarity]}
                                        >
                                        {item.name}
                                        </option>
                                    ))}
                                </select>
                                )}
                            </div>
                            ))}
                        </div>
                        </div>

                    <div className="lg:col-span-3 md:col-span-2 flex-1 relative rounded-lg shadow-md bg-gray-700">


                        {/* <div className="lg:px-6 py-6 px-6 text-white">
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

                        
                        </div> */}


                        </div>
                </div>

               
                {/* <div className="flex justify-center mt-4">
                    <button
                        onClick={() => setShowCrafting(true)}
                        className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 px-6 rounded-md shadow-md flex items-center justify-center gap-2 hover:scale-[102%] transition-all duration-200"
                    >
                        <FontAwesomeIcon icon={faTools} /> Open Crafting
                    </button>
                </div> */}
                {/* <CraftingSystem inventory={inventory} updateInventory={fetchAccountData}/> */}

                <ScrapboxOpener
                    scrapboxName="Refined Peasantly Scrapbox"
                    lootTable={{ artisan: 50, knight: 10, noble: 1 }}
                />
                <div className='mt-4'>
                    <h3 className='text-2xl text-center text-white font-bold mb-3'>Rarities</h3>
                    <div className='flex items-center gap-3 flex-wrap justify-center'>
                    <div 
                        className='px-4 py-2 rounded-full text-white font-semibold' 
                        style={{
                            ...rarityStyles['peasantly'],
                        }}
                    >Peasantly</div>
                    <FontAwesomeIcon className='text-white' icon={faArrowRight} />
                    <div 
                        className='px-4 py-2 rounded-full text-white font-semibold' 
                        style={{
                            ...rarityStyles['artisan'],
                        }}
                    >Artisan</div>
                    <FontAwesomeIcon className='text-white' icon={faArrowRight} />
                    <div 
                        className='px-4 py-2 rounded-full text-white font-semibold' 
                        style={{
                            ...rarityStyles['knightly'],
                        }}
                    >Knightly</div>
                    <FontAwesomeIcon className='text-white' icon={faArrowRight} />
                    <div 
                        className='px-4 py-2 rounded-full text-white font-semibold' 
                        style={{
                            ...rarityStyles['noble'],
                        }}
                    >Noble</div>
                    <FontAwesomeIcon className='text-white' icon={faArrowRight} />
                    <div 
                        className='px-4 py-2 rounded-full text-white font-semibold' 
                        style={{
                            ...rarityStyles['kingly'],
                        }}
                    >Kingly</div>
                    <FontAwesomeIcon className='text-white' icon={faArrowRight} />
                    <div 
                        className='px-4 py-2 rounded-full text-white font-semibold' 
                        style={{
                            ...rarityStyles['emperor'],
                        }}
                    >Emperor</div>
                    </div>
                </div>

                <h1 className='text-3xl w-full font-bold text-center text-white mt-4 mb-2'>Owned Items</h1>
                {inventory.length === 0 && <div className="text-center text-white">You have no items right now.</div>}

                <div className="relative z-10">
                    <div className="h-full overflow-y-auto mt-4 hide-scrollbar">
                        {inventory.length > 0 && (
                            Object.entries(
                                inventory.reduce((acc, item) => {
                                    acc[item.type] = acc[item.type] || [];
                                    acc[item.type].push(item);
                                    return acc;
                                }, {})
                            ).map(([type, items]) => (
                                <div key={type}>
                                    <h2 className="text-xl p-0 py-2 font-bold text-white capitalize">{type}</h2>
                                    <div className="grid lg:grid-cols-6 md:grid-cols-3 grid-cols-2 gap-2 hide-scrollbar">
                                        {items.map((item) => (
                                            <div
                                                key={item.id}
                                                className="bg-gray-600 text-white p-2 max-w-64 rounded shadow-md text-center"
                                                style={{
                                                    ...rarityStyles[item.rarity],
                                                }}
                                            >
                                                {item.image_url && (
                                                    <img
                                                        src={`${item.image_url}?v=${new Date().getTime()}`}
                                                        alt={item.name}
                                                        className="w-44 h-44 mx-auto mb-2 pixel-art"
                                                    />
                                                )}
                                                
                                                <p className="font-bold">
                                                    {item.name.charAt(0).toUpperCase() + item.name.slice(1)}
                                                </p>
                                                {/* <p className="text-xs text-gray-200">{item.id ? `ID: ${item.id}` : <></>}</p> */}
                                                {/* <p className="text-sm text-white mb-2">
                                                    {'<' + item.type + '>'}
                                                </p> */}

                                                {item.type === "material" && (<p className='text-white text-xs'>Quantity: {item.quantity || 0}</p>)}

                                                {item.type !== "material" && (
                                                    <button
                                                        onClick={() => handleScrap(item.id)}
                                                        disabled={scrappingId === item.id}
                                                        className="mt-2 px-3 py-1 bg-red-600 hover:bg-red-500 text-white rounded text-sm"
                                                    >
                                                        {scrappingId === item.id ? 'Scrapping...' : <><FontAwesomeIcon icon={faTrash} /> Scrap</>}
                                                    </button>
                                                )}

                                                {/* {item.stats && Object.keys(item.stats).length > 0 ? (
                                                    <ul className="text-xs text-gray-300 mt-2">
                                                        {Object.entries(item.stats).map(([statKey, statValue]) => (
                                                            <li key={statKey}>
                                                                <strong className="capitalize">{statKey.replace("_", " ")}:</strong> {statValue > 0 ? `${'+' + statValue}` : `${statValue}`}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                ) : (
                                                    <p className="text-xs text-gray-400 italic">No stats available</p>
                                                )}

                                                {item.quantity && (
                                                    <p className="text-xs text-gray-400 italic">Quantity: {item.quantity}</p>
                                                )} */}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
                

                

                {/* Crafting Popup */}
                {/* {showCrafting && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-[99999]">
                        <div className="bg-gray-800 p-6 rounded-lg shadow-lg max-w-lg w-full h-3/4 overflow-y-auto relative">
                            <button
                                onClick={() => setShowCrafting(false)}
                                className="absolute top-3 right-3 text-gray-400 hover:text-white"
                            >
                                <FontAwesomeIcon icon={faX} />
                            </button>

                            <CraftingSystem inventory={inventory} updateInventory={fetchAccountData}/>
                        </div>
                    </div>
                )} */}
            </div>
        </div>
    );
}

export default Inventory;
