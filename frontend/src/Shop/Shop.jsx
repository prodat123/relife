import React, { useContext, useEffect, useState } from "react";
import axios from "axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBox, faBrain, faCircle, faCog, faCoins, faDice, faFaceAngry, faFaceGrin, faFire, faFistRaised, faGears, faGun, faHandFist, faLock, faMagic, faMagicWandSparkles, faObjectGroup, faPerson, faPlus, faRandom, faShield, faShoePrints, faShop, faShoppingBag, faShoppingCart, faSprout, faSubtract, faWandSparkles } from "@fortawesome/free-solid-svg-icons";
import config from "../config";
import { FaMailchimp, FaRandom } from "react-icons/fa";
import { UserContext } from "../Account/UserContext";
import ItemPopup from "../Inventory/ItemPopup";

const Shop = () => {
    const [items, setItems] = useState([]);
    const [spells, setSpells] = useState([]);
    const [seeds, setSeeds] = useState([]);
    const [selectedSeed, setSelectedSeed] = useState(null);
    const [isRolling, setIsRolling] = useState(false);
    const [ownedItems, setOwnedItems] = useState([]);
    const [currency, setCurrency] = useState(0);
    const [discount, setDiscount] = useState(0);
    const [intelligence, setIntelligence] = useState(0); // Player intelligence
    const [level, setLevel] = useState(0);
    const [cooldownTime, setCooldownTime] = useState(0);
    const [showWheel, setShowWheel] = useState(false);
    const [gachaResult, setGachaResult] = useState(null); // Store the result of Gacha spin
    const { accountData, fetchAccountData } = useContext(UserContext);
    const [activeTab, setActiveTab] = useState("items"); // 'items' or 'spells'
    const [popups, setPopups] = useState([]); // Store popup messages
    const userId = JSON.parse(localStorage.getItem("user"))?.id;

    const gachaPrice = 2000;

    const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    useEffect(() => {
        document.title = "Re:LIFE | Shop"; // Set the title for this component
    }, []);

    const handlePurchase = async (e, item) => {
        e.preventDefault();
        
        if (currency >= item.price) {
            try {
                // Send the discounted price to the server
                const response = await axios.post(`${config.backendUrl}/shop/buy`, {
                    userId: userId,
                    itemId: item.shop_item_id,
                    price: item.price, // Include the discounted price
                });
                
                setCurrency((prev) => prev - item.price); // Deduct the discounted price locally
                let message = "You successfully bought " + item.name;
                setPopups((prev) => [
                    ...prev,
                    { id: Date.now(), name: item.name, message: message, success: true }
                ]);
                await delay(3000);
                fetchAccountData(userId);
            } catch (error) {
                console.error("Error purchasing item:", error);
                alert(error.response?.data?.error || "Failed to purchase item.");
                setPopups((prev) => [
                    ...prev,
                    { id: Date.now(), name: item.name, message: "You failed to buy this item!", success: false }
                ]);
            }
        } else {
            alert("Not enough currency!");
        }
    };

    const handleSpellPurchase = async (spell) => {
        if (currency >= spell.price) {
            try {
                // Send the discounted price to the server
                const response = await axios.post(`${config.backendUrl}/spell-shop/buy`, {
                    userId: userId,
                    spellId: spell.shop_spell_id,
                    price: spell.price, // Include the discounted price
                    discount: discount,
                });
                
                setCurrency((prev) => prev - spell.price); // Deduct the discounted price locally
                let message = "You successfully bought " + spell.name;
                setPopups((prev) => [
                    ...prev,
                    { id: Date.now(), name: spell.name, message: message, success: true }
                ]);
                await delay(3000);
                await fetchAccountData(userId);
            } catch (error) {
                console.error("Error purchasing item:", error);
                // alert(error.response?.data?.error || "Failed to purchase item.");
                setPopups((prev) => [
                    ...prev,
                    { id: Date.now(), name: spell.name, message: "You failed to purchase this item!", success: false }
                ]);
            }
        } else {
            
            setPopups((prev) => [
                ...prev,
                { id: Date.now(), name: spell.name, message: "You do not have enough gold to buy this item!", success: false }
            ]);
        }
    }

    const pickRandomSeed = async() => {
        if (seeds.length === 0) return;
    
        const randomIndex = Math.floor(Math.random() * seeds.length);
        const selectedSeed = seeds[randomIndex];
        try {
            const response = await axios.post(`${config.backendUrl}/shop/gacha`, {
                userId: userId,
                seedId: selectedSeed.id, // Use the randomly selected seed's ID
                gachaCost: gachaPrice, // Ensure this is defined
            });
    
            setCurrency((prev) => prev - gachaPrice); // Deduct price locally
            let message = `You successfully bought ${selectedSeed.name}`;
            
            setPopups((prev) => [
                ...prev,
                { id: Date.now(), name: selectedSeed.name, message: message, success: true }
            ]);
    
            await delay(3000);
            fetchAccountData(userId);
        } catch (error) {
            console.error("Purchase failed:", error);
        }
    }

    useEffect(() => {
        const fetchAccountData = async () => {
            try {
                const response = await axios.get(`${config.backendUrl}/account`, {
                    params: { userId },
                });
                setCurrency(response.data.currency);
                setIntelligence(response.data.stats.intelligence || 0); // Fetch intelligence
                setLevel(calculateLevel(response.data.experience).level);
                setDiscount(response.data.discount || 0);
                setOwnedItems(response.data.inventory || []);
            } catch (error) {
                console.error("Error fetching account data:", error);
            }
        };

        const fetchShopItems = async () => {
            try {
                const response = await axios.get(`${config.backendUrl}/shop/items`);
                const itemsWithStats = response.data.map((item) => ({
                    ...item,
                    stats: item.stats ? JSON.parse(item.stats) : {},
                }));
                setItems(itemsWithStats);
            } catch (error) {
                console.error("Error fetching shop items:", error);
            }
        };

        const fetchShopSpells = async () => {
            try {
                const response = await axios.get(`${config.backendUrl}/shop/spells`);
                const spellsWithStats = response.data.map((spell) => ({
                    ...spell,
                    stats: spell.stats ? JSON.parse(spell.stats) : {},
                }));
                setSpells(spellsWithStats);
            } catch (error) {
                console.error("Error fetching shop items:", error);
            }
        };

        const fetchSeeds = async() => {
            try {
                const response = await axios.get(`${config.backendUrl}/seeds`);
                const seeds = response.data;
                console.log(response.data);
                setSeeds(seeds);
            } catch (error) {
                console.error("Error fetching seeds:", error);
            }
        }

        fetchAccountData();
        fetchShopItems();
        fetchShopSpells();
        fetchSeeds();
    }, [userId, currency]);

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

    return (
        <div className="grid 2xl:grid-cols-6 lg:grid-cols-5 md:grid-cols-3 grid-cols-1 min-h-screen text-white p-6 flex flex-col items-center">
            {/* Header Section */}
            <div className="col-start-2 xl:col-start-2 xl:col-span-5 col-span-4">
                <div className="shop-header text-center">
                    <h1 className="text-4xl font-extrabold">Game Shop</h1>
                    <p className="text-lg mt-2 text-gray-300">(Enter the tower to earn more gold and upgrade your gear!)</p>
                </div>

                <div className="flex flex-row items-center justify-center w-full">
                    <img src={'/sprites/npcs/shop-keeper.png'} className="pixel-art w-[350px]"></img>
                </div>
                {/* Currency Display Section */}
                <div className="currency-display grid gap-6 mb-8 w-full bg-gray-700 rounded-lg p-4 shadow-md text-center">
                    <div>
                        <p className="text-xl font-medium">
                            <FontAwesomeIcon icon={faCoins} /> Gold: 
                            <span className="font-bold text-yellow-300"> {currency} gold</span>
                        </p>
                    </div>
                </div>

                <div className="flex w-full flex-wrap lg:space-y-0 gap-2 mb-6 items-center justify-center">
                    <button
                    onClick={() => setActiveTab("items")}
                    className={`px-4 py-2 rounded-md font-bold ${
                        activeTab === "items"
                        ? "bg-indigo-600 text-white"
                        : "bg-gray-600 hover:bg-gray-500"
                    }`}
                    >
                    Gear
                    </button>
                    <button
                    onClick={() => setActiveTab("head")}
                    className={`px-4 py-2 rounded-md font-bold ${
                        activeTab === "head"
                        ? "bg-indigo-600 text-white"
                        : "bg-gray-600 hover:bg-gray-500"
                    }`}
                    >
                    Head
                    </button>
                    <button
                    onClick={() => setActiveTab("torso")}
                    className={`px-4 py-2 rounded-md font-bold ${
                        activeTab === "torso"
                        ? "bg-indigo-600 text-white"
                        : "bg-gray-600 hover:bg-gray-500"
                    }`}
                    >
                    Torso
                    </button>
                    <button
                    onClick={() => setActiveTab("legs")}
                    className={`px-4 py-2 rounded-md font-bold ${
                        activeTab === "legs"
                        ? "bg-indigo-600 text-white"
                        : "bg-gray-600 hover:bg-gray-500"
                    }`}
                    >
                    Legs
                    </button>
                    <button
                    onClick={() => setActiveTab("feet")}
                    className={`px-4 py-2 rounded-md font-bold ${
                        activeTab === "feet"
                        ? "bg-indigo-600 text-white"
                        : "bg-gray-600 hover:bg-gray-500"
                    }`}
                    >
                    Feet
                    </button>
                    <button
                    onClick={() => setActiveTab("weapon")}
                    className={`px-4 py-2 rounded-md font-bold ${
                        activeTab === "weapon"
                        ? "bg-indigo-600 text-white"
                        : "bg-gray-600 hover:bg-gray-500"
                    }`}
                    >
                    Weapons
                    </button>
                    {/* <button
                    onClick={() => setActiveTab("spells")}
                    className={`px-4 py-2 rounded-md font-bold ${
                        activeTab === "spells"
                        ? "bg-indigo-600 text-white"
                        : "bg-gray-600 hover:bg-gray-500"
                    }`}
                    >
                    Spells
                    </button> */}
                    <button
                    onClick={() => setActiveTab("seeds")}
                    className={`px-4 py-2 rounded-md font-bold ${
                        activeTab === "seeds"
                        ? "bg-indigo-600 text-white"
                        : "bg-gray-600 hover:bg-gray-500"
                    }`}
                    >
                    Seeds
                    </button>
                    
                </div>
            
                {/* Shop Grid Section */}
                <div className="grid 2xl:grid-cols-5 lg:grid-cols-4 md:grid-cols-3 sm:grid-cols-2 grid-cols-1 gap-4 w-full">
                    {activeTab === "items"
                        ? items.length > 0
                            ? items.map((item) => {
                                // const discountedPrice = Math.max(Math.floor(item.price * (1 - discount / 100)), 1);
                                let itemStats = item.stats;

                                if (typeof item.stats === "string") {
                                    try {
                                        itemStats = JSON.parse(item.stats);
                                    } catch (error) {
                                        console.error("Error parsing item stats:", error);
                                        itemStats = {};
                                    }
                                }

                                return (
                                    <div key={item.id} className="bg-gray-700 p-4 rounded-lg shadow-lg text-center relative">
                                        {level < item.levelRequired && (
                                            <div className="absolute inset-0 bg-black bg-opacity-70 flex items-center justify-center rounded-lg">
                                                <span className="text-white p-4">
                                                    <FontAwesomeIcon className="text-4xl" icon={faLock} />
                                                    <div className="text-md"><span className="font-semibold">LEVEL {item.levelRequired}</span></div>
                                                </span>
                                            </div>
                                        )}
                                        <img src={`${item.image_url}?v=${new Date().getTime()}`} alt={item.name} className="w-44 h-44 mx-auto mb-4 rounded-md pixel-art" />
                                        <h3 className="text-xl font-bold mb-2">{item.name || "Unnamed Item"}</h3>
                                        <p className="text-white text-sm">{item.description || "No description available"}</p>

                                        {itemStats && Object.keys(itemStats).length > 0 && (
                                            <ul className="text-center text-sm mt-2">
                                                {Object.entries(itemStats).map(([stat, value]) => (
                                                    <li key={stat} className="text-gray-300">
                                                        {stat.charAt(0).toUpperCase() + stat.slice(1)}: {value > 0 && "+"}{value}
                                                    </li>
                                                ))}
                                            </ul>
                                        )}

                                        <p className="mt-2 text-yellow-300 font-bold">
                                            <FontAwesomeIcon icon={faCoins} /> {item.price} Gold
                                        </p>

                                        <button
                                            onClick={(e) => handlePurchase(e, item)}
                                            className={`mt-4 px-4 py-2 rounded-md font-bold hover:scale-105 transition-all ${
                                                currency >= item.price && level >= item.levelRequired
                                                    ? "bg-green-600 hover:bg-green-500"
                                                    : "bg-gray-500 cursor-not-allowed"
                                            }`}
                                        >
                                            {(currency >= item.price && level >= item.levelRequired) ? "Purchase" : "Not Enough Gold"}
                                        </button>
                                    </div>
                                );
                            })
                            : noItemsMessage("items")
                        : activeTab === "head"
                            ? items.length > 0
                                ? items.filter((item) => item.type === "head").map((item) => {
                                    // const discountedPrice = Math.max(Math.floor(spell.price * (1 - discount / 100)), 1);
                                    let itemStats = item.stats;

                                    if (typeof item.stats === "string") {
                                        try {
                                            itemStats = JSON.parse(item.stats);
                                        } catch (error) {
                                            console.error("Error parsing item stats:", error);
                                            itemStats = {};
                                        }
                                    }
    
                                    return (
                                        <div key={item.id} className="bg-gray-700 p-4 rounded-lg shadow-lg text-center relative">
                                            {level < item.levelRequired && (
                                                <div className="absolute inset-0 bg-black bg-opacity-70 flex items-center justify-center rounded-lg">
                                                    <span className="text-white p-4">
                                                        <FontAwesomeIcon className="text-4xl" icon={faLock} />
                                                        <div className="text-md"><span className="font-semibold">LEVEL {item.levelRequired}</span></div>
                                                    </span>
                                                </div>
                                            )}
                                            <img src={`${item.image_url}?v=${new Date().getTime()}`} alt={item.name} className="w-44 h-44 mx-auto mb-4 rounded-md pixel-art" />
                                            <h3 className="text-xl font-bold mb-2">{item.name || "Unnamed Item"}</h3>
                                            <p className="text-white text-sm">{item.description || "No description available"}</p>
    
                                            {itemStats && Object.keys(itemStats).length > 0 && (
                                                <ul className="text-center text-sm mt-2">
                                                    {Object.entries(itemStats).map(([stat, value]) => (
                                                        <li key={stat} className="text-gray-300">
                                                            {stat.charAt(0).toUpperCase() + stat.slice(1)}: {value > 0 && "+"}{value}
                                                        </li>
                                                    ))}
                                                </ul>
                                            )}
    
                                            <p className="mt-2 text-yellow-300 font-bold">
                                                <FontAwesomeIcon icon={faCoins} /> {item.price} Gold
                                            </p>
    
                                            <button
                                                onClick={(e) => handlePurchase(e, item)}
                                                className={`mt-4 px-4 py-2 rounded-md font-bold hover:scale-105 transition-all ${
                                                    currency >= item.price && level >= item.levelRequired
                                                        ? "bg-green-600 hover:bg-green-500"
                                                        : "bg-gray-500 cursor-not-allowed"
                                                }`}
                                            >
                                                {(currency >= item.price && level >= item.levelRequired) ? "Purchase" : "Not Enough Gold"}
                                            </button>
                                        </div>
                                    );
                                })
                                : noItemsMessage("heads")
                        : activeTab === "torso"
                        ? items.length > 0
                            ? items.filter((item) => item.type === "torso").map((item) => {
                                // const discountedPrice = Math.max(Math.floor(spell.price * (1 - discount / 100)), 1);
                                let itemStats = item.stats;

                                if (typeof item.stats === "string") {
                                    try {
                                        itemStats = JSON.parse(item.stats);
                                    } catch (error) {
                                        console.error("Error parsing item stats:", error);
                                        itemStats = {};
                                    }
                                }

                                return (
                                    <div key={item.id} className="bg-gray-700 p-4 rounded-lg shadow-lg text-center relative">
                                        {level < item.levelRequired && (
                                            <div className="absolute inset-0 bg-black bg-opacity-70 flex items-center justify-center rounded-lg">
                                                <span className="text-white p-4">
                                                    <FontAwesomeIcon className="text-4xl" icon={faLock} />
                                                    <div className="text-md"><span className="font-semibold">LEVEL {item.levelRequired}</span></div>
                                                </span>
                                            </div>
                                        )}
                                        <img src={`${item.image_url}?v=${new Date().getTime()}`} alt={item.name} className="w-44 h-44 mx-auto mb-4 rounded-md pixel-art" />
                                        <h3 className="text-xl font-bold mb-2">{item.name || "Unnamed Item"}</h3>
                                        <p className="text-white text-sm">{item.description || "No description available"}</p>

                                        {itemStats && Object.keys(itemStats).length > 0 && (
                                            <ul className="text-center text-sm mt-2">
                                                {Object.entries(itemStats).map(([stat, value]) => (
                                                    <li key={stat} className="text-gray-300">
                                                        {stat.charAt(0).toUpperCase() + stat.slice(1)}: {value > 0 && "+"}{value}
                                                    </li>
                                                ))}
                                            </ul>
                                        )}

                                        <p className="mt-2 text-yellow-300 font-bold">
                                            <FontAwesomeIcon icon={faCoins} /> {item.price} Gold
                                        </p>

                                        <button
                                            onClick={(e) => handlePurchase(e, item)}
                                            className={`mt-4 px-4 py-2 rounded-md font-bold hover:scale-105 transition-all ${
                                                currency >= item.price && level >= item.levelRequired
                                                    ? "bg-green-600 hover:bg-green-500"
                                                    : "bg-gray-500 cursor-not-allowed"
                                            }`}
                                        >
                                            {(currency >= item.price && level >= item.levelRequired) ? "Purchase" : "Not Enough Gold"}
                                        </button>
                                    </div>
                                );
                            })
                            : noItemsMessage("heads")
                        : activeTab === "legs"
                        ? items.length > 0
                            ? items.filter((item) => item.type === "legs").map((item) => {
                                // const discountedPrice = Math.max(Math.floor(spell.price * (1 - discount / 100)), 1);
                                let itemStats = item.stats;

                                if (typeof item.stats === "string") {
                                    try {
                                        itemStats = JSON.parse(item.stats);
                                    } catch (error) {
                                        console.error("Error parsing item stats:", error);
                                        itemStats = {};
                                    }
                                }

                                return (
                                    <div key={item.id} className="bg-gray-700 p-4 rounded-lg shadow-lg text-center relative">
                                        {level < item.levelRequired && (
                                            <div className="absolute inset-0 bg-black bg-opacity-70 flex items-center justify-center rounded-lg">
                                                <span className="text-white p-4">
                                                    <FontAwesomeIcon className="text-4xl" icon={faLock} />
                                                    <div className="text-md"><span className="font-semibold">LEVEL {item.levelRequired}</span></div>
                                                </span>
                                            </div>
                                        )}
                                        <img src={`${item.image_url}?v=${new Date().getTime()}`} alt={item.name} className="w-44 h-44 mx-auto mb-4 rounded-md pixel-art" />
                                        <h3 className="text-xl font-bold mb-2">{item.name || "Unnamed Item"}</h3>
                                        <p className="text-white text-sm">{item.description || "No description available"}</p>

                                        {itemStats && Object.keys(itemStats).length > 0 && (
                                            <ul className="text-center text-sm mt-2">
                                                {Object.entries(itemStats).map(([stat, value]) => (
                                                    <li key={stat} className="text-gray-300">
                                                        {stat.charAt(0).toUpperCase() + stat.slice(1)}: {value > 0 && "+"}{value}
                                                    </li>
                                                ))}
                                            </ul>
                                        )}

                                        <p className="mt-2 text-yellow-300 font-bold">
                                            <FontAwesomeIcon icon={faCoins} /> {item.price} Gold
                                        </p>

                                        <button
                                            onClick={(e) => handlePurchase(e, item)}
                                            className={`mt-4 px-4 py-2 rounded-md font-bold hover:scale-105 transition-all ${
                                                currency >= item.price && level >= item.levelRequired
                                                    ? "bg-green-600 hover:bg-green-500"
                                                    : "bg-gray-500 cursor-not-allowed"
                                            }`}
                                        >
                                            {(currency >= item.price && level >= item.levelRequired) ? "Purchase" : "Not Enough Gold"}
                                        </button>
                                    </div>
                                );
                            })
                            : noItemsMessage("heads")
                        : activeTab === "feet"
                        ? items.length > 0
                            ? items.filter((item) => item.type === "feet").map((item) => {
                                // const discountedPrice = Math.max(Math.floor(spell.price * (1 - discount / 100)), 1);
                                let itemStats = item.stats;

                                if (typeof item.stats === "string") {
                                    try {
                                        itemStats = JSON.parse(item.stats);
                                    } catch (error) {
                                        console.error("Error parsing item stats:", error);
                                        itemStats = {};
                                    }
                                }

                                return (
                                    <div key={item.id} className="bg-gray-700 p-4 rounded-lg shadow-lg text-center relative">
                                        {level < item.levelRequired && (
                                            <div className="absolute inset-0 bg-black bg-opacity-70 flex items-center justify-center rounded-lg">
                                                <span className="text-white p-4">
                                                    <FontAwesomeIcon className="text-4xl" icon={faLock} />
                                                    <div className="text-md"><span className="font-semibold">LEVEL {item.levelRequired}</span></div>
                                                </span>
                                            </div>
                                        )}
                                        <img src={`${item.image_url}?v=${new Date().getTime()}`} alt={item.name} className="w-44 h-44 mx-auto mb-4 rounded-md pixel-art" />
                                        <h3 className="text-xl font-bold mb-2">{item.name || "Unnamed Item"}</h3>
                                        <p className="text-white text-sm">{item.description || "No description available"}</p>

                                        {itemStats && Object.keys(itemStats).length > 0 && (
                                            <ul className="text-center text-sm mt-2">
                                                {Object.entries(itemStats).map(([stat, value]) => (
                                                    <li key={stat} className="text-gray-300">
                                                        {stat.charAt(0).toUpperCase() + stat.slice(1)}: {value > 0 && "+"}{value}
                                                    </li>
                                                ))}
                                            </ul>
                                        )}

                                        <p className="mt-2 text-yellow-300 font-bold">
                                            <FontAwesomeIcon icon={faCoins} /> {item.price} Gold
                                        </p>

                                        <button
                                            onClick={(e) => handlePurchase(e, item)}
                                            className={`mt-4 px-4 py-2 rounded-md font-bold hover:scale-105 transition-all ${
                                                currency >= item.price && level >= item.levelRequired
                                                    ? "bg-green-600 hover:bg-green-500"
                                                    : "bg-gray-500 cursor-not-allowed"
                                            }`}
                                        >
                                            {(currency >= item.price && level >= item.levelRequired) ? "Purchase" : "Not Enough Gold"}
                                        </button>
                                    </div>
                                );
                            })
                            : noItemsMessage("heads")
                        : activeTab === "weapon"
                        ? items.length > 0
                            ? items.filter((item) => item.type === "weapon").map((item) => {
                                // const discountedPrice = Math.max(Math.floor(spell.price * (1 - discount / 100)), 1);
                                let itemStats = item.stats;

                                if (typeof item.stats === "string") {
                                    try {
                                        itemStats = JSON.parse(item.stats);
                                    } catch (error) {
                                        console.error("Error parsing item stats:", error);
                                        itemStats = {};
                                    }
                                }

                                return (
                                    <div key={item.id} className="bg-gray-700 p-4 rounded-lg shadow-lg text-center relative">
                                        {level < item.levelRequired && (
                                            <div className="absolute inset-0 bg-black bg-opacity-70 flex items-center justify-center rounded-lg">
                                                <span className="text-white p-4">
                                                    <FontAwesomeIcon className="text-4xl" icon={faLock} />
                                                    <div className="text-md"><span className="font-semibold">LEVEL {item.levelRequired}</span></div>
                                                </span>
                                            </div>
                                        )}
                                        <img src={`${item.image_url}?v=${new Date().getTime()}`} alt={item.name} className="w-44 h-44 mx-auto mb-4 rounded-md pixel-art" />
                                        <h3 className="text-xl font-bold mb-2">{item.name || "Unnamed Item"}</h3>
                                        <p className="text-white text-sm">{item.description || "No description available"}</p>

                                        {itemStats && Object.keys(itemStats).length > 0 && (
                                            <ul className="text-center text-sm mt-2">
                                                {Object.entries(itemStats).map(([stat, value]) => (
                                                    <li key={stat} className="text-gray-300">
                                                        {stat.charAt(0).toUpperCase() + stat.slice(1)}: {value > 0 && "+"}{value}
                                                    </li>
                                                ))}
                                            </ul>
                                        )}

                                        <p className="mt-2 text-yellow-300 font-bold">
                                            <FontAwesomeIcon icon={faCoins} /> {item.price} Gold
                                        </p>

                                        <button
                                            onClick={(e) => handlePurchase(e, item)}
                                            className={`mt-4 px-4 py-2 rounded-md font-bold hover:scale-105 transition-all ${
                                                currency >= item.price && level >= item.levelRequired
                                                    ? "bg-green-600 hover:bg-green-500"
                                                    : "bg-gray-500 cursor-not-allowed"
                                            }`}
                                        >
                                            {(currency >= item.price && level >= item.levelRequired) ? "Purchase" : "Not Enough Gold"}
                                        </button>
                                    </div>
                                );
                            })
                            : noItemsMessage("heads")
                        // : activeTab === "spells"
                        // ? spells.length > 0
                        //     ? spells.map((spell) => {
                        //         // const discountedPrice = Math.max(Math.floor(spell.price * (1 - discount / 100)), 1);
                        //         return (
                        //             <div key={spell.id} className="bg-gray-700 p-4 rounded-lg shadow-lg text-center relative">
                        //                 {intelligence < spell.intelligenceRequired && (
                        //                     <div className="absolute inset-0 bg-black bg-opacity-70 flex items-center justify-center rounded-lg">
                        //                         <span className="text-white p-4">
                        //                             <FontAwesomeIcon className="text-4xl" icon={faLock} />
                        //                             <div className="text-md"><span className="font-bold">{spell.intelligenceRequired}</span> INTELLIGENCE</div>
                        //                         </span>
                        //                     </div>
                        //                 )}
                                        
                        //                 <h3 className="text-xl font-bold mb-2">{spell.name || "Unnamed Spell"}</h3>

                        //                 <ul className="text-center text-sm mt-2">
                        //                     <li key={spell.stat} className="text-gray-300">
                        //                         {spell.type.slice(0, -3).charAt(0).toUpperCase() + spell.type.slice(1, -3)}:{" "}
                        //                         {spell.type.slice(-3) === "Add" ? `+${spell.stat} to Player` : `-${spell.stat} to Enemies`}
                        //                     </li>
                        //                     <li className="text-gray-300">Mana cost: {spell.mana_cost}</li>
                        //                     <li className="text-gray-300">Duration: {spell.duration} rounds</li>
                        //                     <li className="text-gray-300">Intelligence Required: {spell.intelligenceRequired}</li>
                        //                 </ul>

                        //                 <p className="mt-2 text-yellow-300 font-bold">
                        //                     <FontAwesomeIcon icon={faCoins} /> {spell.price} Gold
                        //                 </p>

                        //                 <button
                        //                     onClick={() => handleSpellPurchase(spell)}
                        //                     className={`mt-4 px-4 py-2 rounded-md font-bold hover:scale-105 transition-all ${
                        //                         currency >= spell.price
                        //                             ? "bg-green-600 hover:bg-green-500"
                        //                             : "bg-gray-500 cursor-not-allowed"
                        //                     }`}
                        //                 >
                        //                     {currency >= spell.price ? "Purchase" : "Not Enough Gold"}
                        //                 </button>
                        //             </div>
                        //         );
                        //     })
                        //     : noItemsMessage("spells")
                        : activeTab === "seeds"
                        ? seeds.length > 0
                            ? 
                            <div className="col-span-5 flex flex-col items-center justify-center mt-6">
                                <button
                                    onClick={pickRandomSeed}
                                    className={`px-6 py-3 bg-green-600 hover:bg-green-500 text-white font-bold text-lg rounded-lg shadow-md hover:from-green-600 hover:to-green-800 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed`}
                                    disabled={isRolling || currency < gachaPrice}
                                >
                                    {!isRolling ? 
                                        <div>
                                        {currency < gachaPrice ? 
                                            <><FontAwesomeIcon icon={faLock} /> You need 2000 gold to pick a seed</>
                                        :
                                            <> <FontAwesomeIcon icon={faDice} /> Pick from Bag (2000 gold)</>
                                        }
                                        </div>
                                        :
                                        "Picking random seed from the bag..."
                                    }
                                </button>
                            </div>
                        
                            : noItemsMessage("seeds")
                        : null}
                </div>

        
            </div>
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

const noItemsMessage = (type) => (
    <div className="col-span-full text-gray-400 text-center">
        No {type} available in the shop at the moment.
    </div>
);

export default Shop;
