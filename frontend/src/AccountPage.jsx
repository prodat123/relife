import React, { useState, useEffect } from "react";
import axios from "axios";
import LevelProgressBar from "./LevelProgressBar";
import { useParams } from "react-router-dom";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faAngleLeft, faAngleRight, faBrain, faHandFist, faHeart, faRunning } from '@fortawesome/free-solid-svg-icons';


const AccountPage = ({ id }) => {
    const { userId } = useParams();
    const [accountData, setAccountData] = useState(null);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState("gear");

    const isOwner = id == userId;

    const fetchAccountData = async () => {
        try {
            const response = await axios.get("http://localhost:3001/account", {
                params: { userId: userId ? userId : id },
            });
            setAccountData(response.data);
        } catch (error) {
            console.error("Error fetching account data:", error);
            setError(error.response?.data?.error || "Failed to fetch account data");
        }
    };

    useEffect(() => {
        fetchAccountData();
    }, [userId, id]);

    const equipItem = async (slot, itemId) => {
        try {
            // Post request to backend to update equipment
            const response = await axios.post("http://localhost:3001/update-equipment", {
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
    console.log(accountData);
    const { username, experience, stats, equipment, inventory } = accountData;

    const equipmentSlots = [
        { slot: "head", top: "15.8%", left: "48.3%", zIndex: 99 },
        { slot: "torso", top: "43.7%", left: "48.4%", zIndex: 98 },
        { slot: "legs", top: "70%", left: "50%", zIndex: 1 },
        { slot: "feet", top: "90.6%", left: "51.62%", zIndex: 99 },
        { slot: "weapon", top: "50%", left: "50%", zIndex: 99 },
    ];

    return (
        <div className="bg-gradient-to-b from-gray-900 to-gray-800 text-white flex flex-col items-center py-6">
            {/* Header */}
            <header className="w-full max-w-4xl mb-6">
                <h1 className="text-3xl font-bold text-center">{username}'s Account</h1>
            </header>

            {/* Main Content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 px-4 w-full">

            <div className="p-6 col-span-1 bg-gray-700 rounded-lg shadow-md">
                <LevelProgressBar experience={experience} />
                <h2 className="text-xl font-bold my-4">Stats</h2>

                <ul className="stats space-y-2">
                    {Object.entries(stats).map(([key, value]) => {
                        const statColors = {
                            physical_strength: "text-red-500",
                            bravery: "text-blue-500",
                            intelligence: "text-green-500",
                            stamina: "text-yellow-500",
                        };
                        const statIcons = {
                            physical_strength: faHandFist,
                            bravery: faRunning,
                            intelligence: faBrain,
                            stamina: faHeart
                        }
                        const colorClass = statColors[key] || "text-gray-400";
                        const statIcon = statIcons[key] || "";
                        return (
                            <li key={key} className="flex justify-between py-2">
                                <span className={`${colorClass} font-bold capitalize`}><FontAwesomeIcon icon={statIcon}/> {key.replace("_", " ")}:</span>
                                <span className={`${colorClass}`}>{value}</span>
                            </li>
                        );
                    })}
                </ul>
            </div>

                {/* Character Display */}
                <div className="relative cols-span-1 flex flex-col justify-center items-center h-full bg-blue-400 rounded-lg shadow-md">
                    <img src={"/sprites/relife_frame.png"} className="w-full h-full absolute pixel-art"></img>
                    <div className="character-sprite relative w-3/4 absolute">
                        <img src={"/sprites/player.png"} alt="Base Character" className="w-full pixel-art" />
                        {equipmentSlots.map(({ slot, top, left, zIndex }) => {
                            const equippedItem = equipment[slot];
                            if (!equippedItem || !equippedItem.id) return null;

                            return (
                                equippedItem.image_url && (
                                    <img
                                        key={slot}
                                        src={equippedItem.image_url || "/sprites/equipment/default.png"}
                                        alt={`${equippedItem.name || "None"} Gear`}
                                        style={{
                                            position: "absolute",
                                            top: top,
                                            left: left,
                                            zIndex: zIndex,
                                            transform: "translate(-50%, -50%)",
                                            width: "100%",
                                        }}
                                        className="pixel-art"
                                    />
                                )
                            );
                        })}
                    </div>
                </div>

                <div className="flex-1 space-y-6">
                    {/* Tabs */}
                    {isOwner ? (
                        <div className="p-6 bg-gray-700 rounded-lg shadow-md">
                            {/* Tab System */}
                            <div className="mb-4 flex space-x-4 items-center justify-center">
                                {/* Inventory Tab Button */}
                                <button
                                    className={`px-4 py-2 rounded-md text-lg font-semibold transition-all duration-300 ${
                                        activeTab === "inventory"
                                            ? "bg-indigo-600 text-white shadow-lg"
                                            : "bg-gray-600 text-gray-200 hover:bg-gray-500"
                                    }`}
                                    onClick={() => setActiveTab("inventory")}
                                >
                                    Inventory
                                </button>

                                {/* Gear Tab Button */}
                                <button
                                    className={`px-4 py-2 rounded-md text-lg font-semibold transition-all duration-300 ${
                                        activeTab === "gear"
                                            ? "bg-indigo-600 text-white shadow-lg"
                                            : "bg-gray-600 text-gray-200 hover:bg-gray-500"
                                    }`}
                                    onClick={() => setActiveTab("gear")}
                                >
                                    Gear
                                </button>
                            </div>

                            {/* Inventory Section */}
                            {activeTab === "inventory" && (
                                <div className="max-h-96 overflow-y-auto">
                                    {/* Inventory Items */}
                                    <div className="grid grid-cols-2 gap-4">
                                        {inventory.map((item) => (
                                            <div
                                                key={item.id}
                                                className="bg-gray-500 p-4 rounded shadow-md text-center"
                                            >
                                                <img
                                                    src={item.image_url || "/sprites/items/default.png"}
                                                    alt={item.name}
                                                    className="w-40 h-40 mx-auto mb-2 pixel-art"
                                                />
                                                <p className="font-bold">{item.name}</p>
                                                <p className="text-xs text-gray-200">ID: {item.id}</p>
                                                <p className="text-sm text-white mb-2">
                                                    <FontAwesomeIcon icon={faAngleLeft} />
                                                    {item.type}
                                                    <FontAwesomeIcon icon={faAngleRight} />
                                                </p>

                                                {/* Display parsed stats */}
                                                <ul className="text-xs text-gray-300 mt-2">
                                                    {Object.entries(JSON.parse(item.stats)).map(([statKey, statValue]) => (
                                                        <li key={statKey}>
                                                            <strong className="capitalize">{statKey.replace("_", " ")}:</strong> {statValue}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Gear Section */}
                            {activeTab === "gear" && (
                                <div className="grid grid-cols-2 gap-4 h-96">
                                    {["head", "torso", "legs", "feet", "weapon"].map((slot) => (
                                        <div key={slot} className="text-center">
                                            <h4 className="font-bold">{slot.charAt(0).toUpperCase() + slot.slice(1)}</h4>
                                            <select
                                                value={equipment[slot]?.id || ""}
                                                onChange={(e) => equipItem(slot, e.target.value)}
                                                className="mt-2 block w-full bg-gray-500 p-2 border rounded text-white"
                                            >
                                                <option value="">None</option>
                                                {inventory
                                                    .filter((item) => item.type === slot || equipment[slot]?.id === item.id)
                                                    .map((item) => (
                                                        <option
                                                            key={item.id}
                                                            value={item.id}
                                                        >
                                                            {item.name} (ID: {item.id})
                                                        </option>
                                                    ))}
                                            </select>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ) : (
                        <p className="text-red-500 font-bold text-center">Inventory and selection cannot be accessed.</p>
                    )}






                </div>


            </div>
            <div className="bg-red-500 z-[100] text-white rounded-md px-4 py-2 mt-3 cursor-pointer text-center" onClick={signOut}>Sign Out</div>

            
        </div>
    );
};

export default AccountPage;
