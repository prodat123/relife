import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Enchantment = ({ userId }) => {
    const [userItems, setUserItems] = useState([]);
    const [braveryStat, setBraveryStat] = useState(0);
    const [gold, setGold] = useState(0);
    const [combinedItem, setCombinedItem] = useState(null);
    const [error, setError] = useState(null);

    // Fetch account data (user's inventory, gold, and bravery)
    const fetchAccountData = async () => {
        try {
            const response = await axios.get("http://localhost:3001/account", {
                params: { userId },
            });

            setGold(response.data.currency);  // User's gold
            setBraveryStat(response.data.stats.bravery || 0);  // Bravery stat
            setUserItems(response.data.inventory || []);  // Inventory items
        } catch (error) {
            console.error("Error fetching account data:", error);
        }
    };

    useEffect(() => {
        fetchAccountData();
    }, [userId]);  // Refetch data when userId changes

    // Combine items and improve stats based on bravery
    const combineItems = async (item) => {
        try {
            const requestData = {
                itemId: item.id,
                userId,
                braveryStat,  // Pass bravery stat from frontend
            };

            console.log('Request Data:', requestData); // Log the data to check its contents

            const response = await axios.post('http://localhost:3001/level-up-item', requestData);
            setCombinedItem(response.data.newItem);  // Set the new leveled-up item
            setUserItems(response.data.updatedInventory);  // Update the user's inventory with the new item
            setError(null);
        } catch (error) {
            console.error('Error combining items:', error);
            setError('Error combining items. Please try again.');
        }
    };

    // Group items by name and count the duplicates
    const groupItemsByName = (items) => {
        const groupedItems = {};
        items.forEach((item) => {
            if (groupedItems[item.name]) {
                groupedItems[item.name].count += 1;
            } else {
                groupedItems[item.name] = { ...item, count: 1 };
            }
        });
        return groupedItems;
    };

    const groupedUserItems = groupItemsByName(userItems);

    return (
        <div className="container mx-auto p-6">
            <h3 className="text-3xl font-bold text-center mb-6 text-white">Item Combination</h3>
            <div className="mb-3 text-center text-white">
                <p><strong>Bravery Stat:</strong> {braveryStat}</p>
            </div>
            {/* Error message display */}
            {error && (
                <div className="bg-red-500 text-white p-4 mb-4 rounded-md text-center">
                    {error}
                </div>
            )}

            {/* User's inventory and item combination */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {Object.keys(groupedUserItems).map((key) => {
                    const item = groupedUserItems[key];
                    console.log(item);
                    const stats = JSON.parse(item.stats); // Assuming stats are stored as a JSON string

                    return (
                        <div key={item.name} className="bg-white shadow-md rounded-lg p-4">
                            <h4 className="text-lg font-semibold text-gray-800">{item.name}</h4>
                            <div className="text-sm text-gray-500">
                                {stats.physical_strength && (
                                    <p>Physical Strength: {stats.physical_strength}</p>
                                )}
                                {stats.stamina && (
                                    <p>Stamina: {stats.stamina}</p>
                                )}
                                {stats.intelligence && (
                                    <p>Intelligence: {stats.intelligence}</p>
                                )}
                            </div>
                            <p className="text-sm text-gray-500">Quantity: {item.count}</p>

                            {/* Combine item button */}
                            <button
                                onClick={() => combineItems(item)}
                                disabled={item.count < 2}
                                className={`mt-4 w-full py-2 rounded-md text-white font-semibold 
                                    ${item.count >= 2 ? "bg-blue-600 hover:bg-blue-500" : "bg-gray-400 cursor-not-allowed"}`}
                            >
                                {item.count >= 2 ? 'Combine Items' : 'Need 2 of the Same Item'}
                            </button>
                        </div>
                    );
                })}
            </div>

            {/* Display combined item */}
            {combinedItem && (
                <div className="bg-white shadow-md rounded-lg p-6 mt-8">
                    <h4 className="text-xl font-semibold text-gray-800 mb-4">Combined Item: {combinedItem.name}</h4>
                    <div className="text-gray-800">
                        {combinedItem.stats.physical_strength && (
                            <p><strong>Physical Strength:</strong> {combinedItem.stats.physical_strength}</p>
                        )}
                        {combinedItem.stats.stamina && (
                            <p><strong>Stamina:</strong> {combinedItem.stats.stamina}</p>
                        )}
                        {combinedItem.stats.intelligence !== undefined && (
                            <p><strong>Intelligence:</strong> {combinedItem.stats.intelligence}</p>
                        )}
                    </div>
                </div>
            )}

        </div>
    );
};

export default Enchantment;
