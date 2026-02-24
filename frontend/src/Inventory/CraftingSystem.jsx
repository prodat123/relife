import React, { useState, useEffect } from "react";
import axios from "axios";
import config from "../config";
import ItemPopup from "./ItemPopup";
// import XPPopup from "./XPPopup";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faAngleDown, faBox, faBoxOpen } from "@fortawesome/free-solid-svg-icons";


const CraftingSystem = ({ inventory, updateInventory }) => {
    const userId = JSON.parse(localStorage.getItem("user")).id;

    const [scrapboxes, setScrapboxes] = useState([]);
    const [selectedItems, setSelectedItems] = useState({});
    const [scrapAvailable, setScrapAvailable] = useState({});
    const [searchQuery, setSearchQuery] = useState("");
    const [popups, setPopups] = useState([]);
    const [xp, setXp] = useState(0);
    const [xpPopupVisible, setXpPopupVisible] = useState(false);

    useEffect(() => {
        const fetchScrapboxes = async () => {
        try {
            const response = await axios.get(`${config.backendUrl}/craftable-scrapboxes`);
            setScrapboxes(response.data);
        } catch (error) {
            console.error("Error fetching scrapboxes:", error);
        }
        };
        fetchScrapboxes();
    }, []);

    useEffect(() => {
        if (inventory) {
            const newScrapAvailable = {};
    
            for (const item of Object.values(inventory)) {
                const nameParts = item.name.toLowerCase().split(" ");
                if (nameParts[1] === "scrap") {
                    const rarity = nameParts[0]; // peasantly, knightly, etc.
    
                    if (!newScrapAvailable[rarity]) {
                        newScrapAvailable[rarity] = {
                            quantity: 0,
                            imageUrl: item.image_url || "", // fallback if no URL exists
                        };
                    }
    
                    newScrapAvailable[rarity].quantity += item.quantity;
                }
            }
    
            console.log(newScrapAvailable);
            setScrapAvailable(newScrapAvailable); 
            // e.g., { peasantly: { quantity: 5, imageUrl: "..." }, knightly: { quantity: 2, imageUrl: "..." } }
        }
    }, [inventory]);
    

    const handleSelection = (id, quantity) => {
        setSelectedItems(prev => ({
        ...prev,
        [id]: quantity > 0 ? quantity : 0,
        }));
    };

    const craftItems = async () => {
        let updatedInventory = { ...inventory };
        let totalXpGained = 0;
      
        for (const box of scrapboxes) {
          const quantity = selectedItems[box.id] || 0;
          const rarity = box.rarity.toLowerCase();
          const costPerBox = box.scrap_cost || 0;
          const totalCost = quantity * costPerBox;
      
          if (quantity > 0 && scrapAvailable[rarity].quantity >= totalCost) {
            try {
              const response = await axios.post(`${config.backendUrl}/craft-scrapbox`, {
                userId,
                scrapboxId: box.id,
                quantity,
              }, {
                withCredentials: true
              });
      
              console.log(response.data.message);
      
              // Deduct scrap from the correct rarity
              const scrapKey = Object.keys(updatedInventory).find(
                key =>
                  updatedInventory[key].name.toLowerCase() === `${rarity.toLowerCase()} scrap`
              );
      
              if (scrapKey) {
                updatedInventory[scrapKey].quantity -= totalCost;
                if (updatedInventory[scrapKey].quantity <= 0) {
                  delete updatedInventory[scrapKey];
                }
              }
      
              // Add crafted box to inventory
              const boxKey = Object.keys(updatedInventory).find(
                key => updatedInventory[key].name === box.name
              );
      
              if (boxKey) {
                updatedInventory[boxKey].quantity += quantity;
              } else {
                updatedInventory[box.id] = {
                  name: box.name,
                  type: box.type,
                  quantity,
                };
              }
      
              setPopups(prev => [
                ...prev,
                { id: Date.now(), icon: box.image, name: box.name, quantity, success: true },
              ]);
      
              totalXpGained += 10 * quantity;
      
            } catch (err) {
              console.error(`Crafting ${box.name} failed:`, err);
              setPopups(prev => [
                ...prev,
                { id: Date.now(), name: box.name, message: "Crafting failed!", success: false },
              ]);
            }
      
            } else if (quantity > 0) {
                setPopups(prev => [
                ...prev,
                { id: Date.now(), name: box.name, message: "Not enough scrap!", success: false },
                ]);
            }
        }
      
        if (totalXpGained > 0) {
          setXp(totalXpGained);
          setXpPopupVisible(true);
          setTimeout(() => setXpPopupVisible(false), 3000);
        }
      
        setSelectedItems({});
        updateInventory();
    };
      
    const filteredScrapboxes = scrapboxes.filter(box =>
        box.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

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

    const openScrapbox = async (scrapboxId) => {
        try {
            const response = await axios.post(`${config.backendUrl}/open-scrapbox`, {
                userId,
                scrapboxId
            }, {
                withCredentials: true
            });

            console.log(response.data.error);
            console.log(response.data);
            const { rewardedItem, rewardData, remainingScrapboxes } = response.data;
            console.log(`You received: ${rewardedItem}`);
        
            // 🎉 Show popup with rewarded item
            setPopups(prev => [
                ...prev,
                {
                    rarity: rewardData.rarity,
                    id: Date.now(),
                    name: rewardedItem,
                    message: `You received ${rewardedItem}!`,
                    image: rewardData.image_url,
                    success: true
                }
            ]);

            updateInventory();
      
        } catch (error) {
            console.error("Failed to open scrapbox:", error);
            setPopups(prev => [
                ...prev,
                {
                id: Date.now(),
                name: "Scrapbox",
                message: "Failed to open scrapbox.",
                success: false
                }
            ]);
        }
    };

    const desiredOrder = ["scrapbox"]

    return (
        <div className="bg-gray-800 text-white rounded-lg p-4 overflow-y-auto mt-4">
            <h2 className="text-3xl text-center font-bold mb-4 font-solo tracking-wider"><FontAwesomeIcon icon={faBoxOpen} /> Scrapbox Crafter</h2>
            {inventory.length > 0 && (
                Object.entries(
                    inventory.reduce((acc, item) => {
                        acc[item.type] = acc[item.type] || [];
                        acc[item.type].push(item);
                        return acc;
                    }, {})
                )
                .filter(([type]) => type === "scrapbox") // ✅ Only keep "scrapbox"
                .sort(([a], [b]) => desiredOrder.indexOf(a) - desiredOrder.indexOf(b))
                .map(([type, items]) => (
                    <div key={type}>
                        <div className="grid lg:grid-cols-5 md:grid-cols-3 grid-cols-2 gap-2 hide-scrollbar">
                        {items.map((item) =>
                            Array.from({ length: item.quantity || 1 }).map((_, index) => (
                                <div
                                    key={`${item.id}-${index}`}
                                    onClick={() => openScrapbox(item.id)}
                                    className="cursor-pointer bg-gradient-to-br from-yellow-400 to-orange-500 text-white p-4 rounded-md shadow-xl text-center transform transition-transform duration-200 hover:scale-105 hover:shadow-2xl border-2 border-yellow-600"
                                >
                                    <div className="mb-2">
                                        <p className="font-bold text-lg">
                                        {item.name.charAt(0).toUpperCase() + item.name.slice(1)}
                                        </p>
                                    </div>

                                    <div className="text-sm italic opacity-80">
                                        Click to open
                                    </div>
                                </div>
                            ))
                        )}


                        </div>
                    </div>
                ))
            )}

            {/* <p className="text-sm text-gray-300 text-center mb-3">
                Available Scrap: <span className="font-bold text-green-400">{scrapAvailable}</span>
            </p> */}
            <div className="p-2 flex w-full flex-wrap justify-center gap-6 text-gray-300 text-center my-3">
                {Object.entries(scrapAvailable).map(([rarity, data]) => (
                    <div key={rarity} className="text-md text-text flex flex-col items-center border border-gray-600 p-4 rounded-md">
                        <img src={data.imageUrl} alt={`${rarity} scrap`} className="w-40 h-40 mb-1 pixel-art" />
                        <div className="text-3xl font-bold text-text font-solo tracking-wider">
                            {data.quantity}
                        </div>
                    </div>
                ))}
            </div>


            <input
                type="text"
                placeholder="Search scrapboxes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full p-2 mb-3 rounded bg-gray-700 text-white placeholder-gray-400"
            />

            <div className="space-y-4">
            {filteredScrapboxes.length > 0 ? (
                filteredScrapboxes.map((box) => {
                const cost = box.scrap_cost || 0;
                const selectedQty = selectedItems[box.id] || 0;
                const totalCost = selectedQty * cost;

                return (
                    <div key={box.id} className="bg-gray-700 p-4 rounded shadow-md">
                    <h3 className="text-lg font-semibold text-indigo-300">{box.name}</h3>
                    <p className="text-sm text-gray-300 mb-1">{box.description}</p>
                    <p className="text-sm text-gray-400 mb-2">
                        Rarity: <span className="capitalize">{box.rarity}</span> | Scrap Cost: <strong>{cost}</strong>
                    </p>

                    {box.loot_table && Object.keys(box.loot_table).length > 0 && (
                        <div className="my-3">
                            <h4 className="text-sm text-white font-semibold mb-2">Loot Table:</h4>
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                            {(() => {
                                const totalWeight = Object.values(box.loot_table).reduce((sum, val) => sum + val, 0);
                                return Object.entries(box.loot_table).map(([itemName, weight], index) => {
                                const percent = ((weight / totalWeight) * 100).toFixed(2);
                                return (
                                    <div
                                    key={index}
                                    className="p-2 rounded text-white text-xs text-center shadow"
                                    style={rarityStyles[itemName]}
                                    >
                                    <p className="font-semibold capitalize">{itemName}</p>
                                    <p>{percent}% chance</p>
                                    </div>
                                );
                                });
                            })()}
                            </div>
                        </div>
                    )}


                    <input
                        type="number"
                        min="0"
                        value={selectedQty}
                        onChange={(e) => handleSelection(box.id, parseInt(e.target.value) || 0)}
                        className="w-full p-1 mb-2 bg-gray-800 rounded text-white text-sm"
                    />
                    {selectedQty > 0 && (
                        <p className="text-xs text-gray-300 mb-2">
                        Total Scrap Needed: <strong>{totalCost}</strong>
                        </p>
                    )}

                    

                    </div>
                );
                })
            ) : (
                <p className="text-gray-400 text-center">No scrapboxes found.</p>
            )}
            </div>


            <button
                onClick={craftItems}
                className="mt-4 w-full bg-primary hover:bg-indigo-500 text-white px-4 py-2 rounded shadow"
                disabled={Object.values(selectedItems).every(q => q === 0)}
            >
                <FontAwesomeIcon icon={faBoxOpen} /> Craft Scrapboxes
            </button>

            <div className="fixed max-w-md bottom-5 right-5 flex flex-col-reverse items-end space-y-reverse space-y-3 z-[99999]">
                {popups.map(({ id, icon, rarity, name, quantity, message, success }) => (
                    <ItemPopup
                    rarity={rarity}
                    key={id}
                    icon={icon}
                    name={name}
                    quantity={quantity}
                    message={message}
                    success={success}
                    onClose={() =>
                        setPopups((prev) => prev.filter((p) => p.id !== id))
                    }
                    />
                ))}
            </div>

        {/* {xpPopupVisible && <XPPopup xp={xp} />} */}
        </div>

    );
};

export default CraftingSystem;
