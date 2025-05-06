import React, { useState, useEffect } from "react";
import axios from "axios";
import config from "../config";
import ItemPopup from "./ItemPopup";
// import XPPopup from "./XPPopup"; // ✅ Added XP Popup import
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faHammer, faTools } from "@fortawesome/free-solid-svg-icons";

const CraftingSystem = ({ inventory, updateInventory }) => {
    const userId = JSON.parse(localStorage.getItem("user")).id;

    const [craftableItems, setCraftableItems] = useState([]);
    const [selectedItems, setSelectedItems] = useState({});
    const [materials, setMaterials] = useState({});
    const [searchQuery, setSearchQuery] = useState(""); 
    const [popups, setPopups] = useState([]);
    const [xp, setXp] = useState(0); // ✅ XP state
    const [xpPopupVisible, setXpPopupVisible] = useState(false); // ✅ Visibility

    useEffect(() => {
        const fetchCraftableItems = async () => {
            try {
                const response = await axios.get(`${config.backendUrl}/craftable-items`);
                setCraftableItems(response.data);
            } catch (error) {
                console.error("Error fetching craftable items:", error);
            }
        };
        fetchCraftableItems();
    }, []);

    useEffect(() => {
        if (!inventory) return;
        const materialItems = Object.values(inventory)
            .filter(item => item && item.type === "material")
            .reduce((acc, item) => {
                acc[item.name] = item.quantity;
                return acc;
            }, {});
        setMaterials(materialItems);
    }, [inventory]);

    const handleSelection = (itemId, quantity) => {
        setSelectedItems((prev) => ({
            ...prev,
            [itemId]: quantity > 0 ? quantity : 0
        }));
    };

    const canCraft = (recipe, quantity) => {
        return Object.entries(recipe).every(([mat, amt]) => {
            return (materials[mat] || 0) >= amt * quantity;
        });
    };

    const craftItems = async () => {
        let newInventory = { ...inventory };
        let totalXpGained = 0;

        for (const item of craftableItems) {
            const quantity = selectedItems[item.id] || 0;
            if (quantity > 0) {
                if (canCraft(item.recipe, quantity)) {
                    try {
                        const response = await axios.post(`${config.backendUrl}/craft`, {
                            userId,
                            itemId: item.id,
                            quantity
                        });

                        console.log(response.data.message);

                        Object.entries(item.recipe).forEach(([mat, qty]) => {
                            const materialKey = Object.keys(newInventory).find(
                                key => newInventory[key].name === mat
                            );

                            if (materialKey) {
                                newInventory[materialKey].quantity -= qty * quantity;
                                if (newInventory[materialKey].quantity <= 0) {
                                    delete newInventory[materialKey];
                                }
                            }
                        });

                        const craftedKey = Object.keys(newInventory).find(
                            key => newInventory[key].name === item.name
                        );

                        if (craftedKey) {
                            newInventory[craftedKey].quantity += quantity;
                        } else {
                            newInventory[item.id] = { name: item.name, type: item.type, quantity };
                        }

                        setPopups((prev) => [
                            ...prev,
                            { id: Date.now(), name: item.name, quantity, success: true }
                        ]);

                        // ✅ Add XP (10 XP per item crafted, adjust if needed)
                        const gained = 10 * quantity;
                        totalXpGained += gained;

                        updateInventory();
                    } catch (error) {
                        console.error(`Error crafting ${item.name}:`, error.response?.data?.error || error.message);
                        setPopups((prev) => [
                            ...prev,
                            { id: Date.now(), name: item.name, message: "Crafting failed!", success: false }
                        ]);
                    }
                } else {
                    setPopups((prev) => [
                        ...prev,
                        { id: Date.now(), name: item.name, message: "Not enough materials!", success: false }
                    ]);
                }
            }
        }

        // ✅ Show XP popup if XP was gained
        if (totalXpGained > 0) {
            setXp(totalXpGained);
            setXpPopupVisible(true);
            setTimeout(() => setXpPopupVisible(false), 3000);
        }

        setSelectedItems({});
    };

    const filteredItems = craftableItems.filter(item =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="max-h-[600px] overflow-y-auto bg-gray-800 text-white rounded-lg p-4 mt-4">
            <h2 className="text-3xl text-center font-bold mb-3">Crafting Space</h2>

            <input
                type="text"
                placeholder="Search for an item..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full p-2 mb-3 rounded bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />

            <div className="space-y-2">
                {filteredItems.length > 0 ? (
                filteredItems.map((item) => (
                    <details key={item.id} className="bg-gray-700 rounded-md p-2 shadow-sm">
                    <summary className="cursor-pointer text-indigo-300 font-semibold text-base">
                        {item.name}
                    </summary>
                    <div className="mt-2 text-sm text-gray-200">
                        <p className="mb-1">{item.description}</p>
                        <p className="text-gray-300">Required Materials:</p>
                        <ul className="mt-1 space-y-1">
                        {Object.entries(item.recipe).map(([mat, qty]) => (
                            <li key={mat} className="flex justify-between bg-gray-800 p-1 rounded">
                            <span>{mat}:</span>
                            <span className={`font-bold ${materials[mat] >= qty ? 'text-green-400' : 'text-red-400'}`}>
                                {qty} (You have: {materials[mat] || 0})
                            </span>
                            </li>
                        ))}
                        </ul>

                        <div className="mt-2">
                        <label className="text-gray-300 text-xs">Number of Items:</label>
                        <input
                            type="number"
                            min="0"
                            value={selectedItems[item.id] || ""}
                            onChange={(e) => handleSelection(item.id, parseInt(e.target.value) || 0)}
                            placeholder="Enter amount"
                            className="w-full p-1 mt-1 bg-gray-800 rounded text-white text-sm focus:ring-2 focus:ring-indigo-500"
                        />

                        {selectedItems[item.id] > 0 && (
                            <div className="mt-2 text-xs text-gray-300">
                            <p>Total Materials Needed:</p>
                            <ul className="space-y-1">
                                {Object.entries(item.recipe).map(([mat, qty]) => {
                                const totalQty = qty * selectedItems[item.id];
                                return (
                                    <li key={mat} className="flex justify-between">
                                    <span>{mat}:</span>
                                    <span>{totalQty}</span>
                                    </li>
                                );
                                })}
                            </ul>
                            </div>
                        )}
                        </div>
                    </div>
                    </details>
                ))
                ) : (
                <p className="text-gray-400 text-center text-sm">🔎 No items found.</p>
                )}
            </div>

            <button 
                onClick={craftItems} 
                className="mt-4 w-full bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded shadow transition disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={Object.values(selectedItems).every(q => q === 0)}
            >
                <FontAwesomeIcon icon={faTools} /> Craft Selected Items
            </button>

            {popups.map(({ id, name, quantity, message, success }) => (
                <ItemPopup
                key={id}
                name={name}
                quantity={quantity}
                message={message}
                success={success}
                onClose={() => setPopups((prev) => prev.filter(p => p.id !== id))}
                />
            ))}

            {/* ✅ XP Popup */}
            {/* {xpPopupVisible && <XPPopup xp={xp} />} */}
            </div>

    );
};

export default CraftingSystem;
