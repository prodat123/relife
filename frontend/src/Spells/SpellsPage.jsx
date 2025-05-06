import React, { useEffect, useState } from 'react';
import axios from 'axios';
import config from '../config';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCoins, faLock } from '@fortawesome/free-solid-svg-icons';
import ItemPopup from '../Inventory/ItemPopup';

function SpellCard({ spell, selectSpell, playerIntelligence }) {
    const isLocked = playerIntelligence < spell.intelligenceRequired;  // Check if the player lacks enough intelligence
    console.log("Spell is locked: " + playerIntelligence);

    return (
        <div className={`relative p-4 bg-gray-700 rounded-md shadow-md text-white hover:scale-105 transition duration-200  ${isLocked ? "cursor-not-allowed" : "cursor-pointer hover:bg-gray-600"}`} onClick={() => !isLocked && selectSpell(spell)}>
            {/* Lock overlay */}
            {isLocked && (
                <div className="absolute flex items-center justify-center flex-col rounded-md p-4 inset-0 bg-black opacity-80 flex justify-center items-center z-10">
                    <FontAwesomeIcon icon={faLock} className="text-4xl text-white" />
                    <p className="text-white text-center mt-2">You need {spell.intelligenceRequired} Intelligence to use this spell</p>
                </div>
            )}

            {/* Spell card details */}
            <h2 className="text-xl font-semibold">{spell.name}</h2>
            <p>Type: {spell.type}</p>
            <p>Stat: {spell.stat}</p>
            <p>Mana Cost: {spell.mana_cost} mana</p>
            <p>Cooldown: {spell.cooldown} rounds</p>
            <p>Intelligence Required: {spell.intelligenceRequired}</p>
        </div>
    );
}

function SpellSlot({ order, spell, placeSpellInSlot, removeSpell, selectSpell, selectedSpell, saveSpell }) {
    return (
        <div className="mb-4">
            <h2 className="text-xl text-white font-bold mb-2">{order}</h2>
            <div
                onClick={() => {
                    
                
                    // If spell is not null, check if selectedSpell is null
                    if (selectedSpell !== null) {
                        placeSpellInSlot(order);
                    } else {
                        if (spell === null) {
                            return;
                        }
                        selectSpell(spell);
                    }
                }}
                className={`p-2 rounded-md flex justify-between items-center text-white cursor-pointer ${
                    spell ? 'bg-gray-600' : 'bg-gray-500'
                }`}
            >
                {spell ? (
                    // Check if the spell is an object with the "name" property
                    typeof spell === 'object' && spell !== null && spell.hasOwnProperty('name') ? (
                        <>
                            <span>{spell.name}</span>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    removeSpell(order);
                                }}
                                className="bg-red-500 text-white px-2 py-1 rounded-md ml-2 hover:bg-red-700"
                            >
                                Remove
                            </button>
                        </>
                    ) : (
                        // If it's not an object with a "name" property, output the raw spell value
                        <>
                            <span>{spell}</span>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    removeSpell(order);
                                }}
                                className="bg-red-500 text-white px-2 py-1 rounded-md ml-2 hover:bg-red-700"
                            >
                                Remove
                            </button>
                        </>
                    )
                ) : (
                    <span>No spell selected</span>
                )}
            </div>
        </div>
    );
}
    

function SpellsPage() {
    const [spells, setSpells] = useState([]);
    const [playerSpells, setPlayerSpells] = useState([]);
    const [currency, setCurrency] = useState(0);
    const [error, setError] = useState(null);
    const [selectedSpell, setSelectedSpell] = useState(null);
    const [spellSlots, setSpellSlots] = useState({
        first: null,
        second: null,
        third: null,
        fourth: null,
    });
    const userId = JSON.parse(localStorage.getItem("user"))?.id;
    const [accountData, setAccountData] = useState([]);
    const [playerIntelligence, setPlayerIntelligence] = useState([]);
    const [parsedSpells, setParsedSpells] = useState([]);
    const [savedSpells, setSavedSpells] = useState(false);
    const [popups, setPopups] = useState([]);

    const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    const fetchAccountData = async () => {
        try {
            const response = await axios.get(`${config.backendUrl}/account`, {
                params: { userId: userId },
            });

            setAccountData(response.data);
            setCurrency(response.data.currency);
            setPlayerSpells(JSON.parse(response.data.ownedSpells || "[]"));
            const intelligence = response.data.stats.intelligence;
            setPlayerIntelligence(intelligence);
            if (response.data?.spells) {
                try {
                    const spells = JSON.parse(response.data.spells); // Parsing JSON
                    console.log(spells);
                    // Map spells to spell slots
                    const updatedSpellSlots = {
                        first: spells[0] || null,
                        second: spells[1] || null,
                        third: spells[2] || null,
                        fourth: spells[3] || null,
                    };
                    setSpellSlots(updatedSpellSlots);
                } catch (error) {
                  console.error("Failed to parse spells:", error);
                }
            }
        } catch (error) {
            console.error("Error fetching account data:", error);
            setError(error.response?.data?.error || "Failed to fetch account data");
        }
    };

    const fetchAllSpells = async () => {
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

    useEffect(() => {
        fetchAllSpells();
        fetchAccountData();
    }, [userId]);

    const selectSpell = (spell) => {
        console.log(`Selected spell: ${spell.hasOwnProperty('name') ? spell.name : spell}`);
        setSelectedSpell(spell.hasOwnProperty('name') ? spell.name : spell);
    };

    const placeSpellInSlot = async(slot) => {
        if (selectedSpell) {

            const normalizedSlot = slot.toLowerCase();
    
            // Clone existing slots
            const updatedSlots = { ...spellSlots };
    
            // Find the current slot of the selected spell
            let previousSlot = null;
            for (const key in updatedSlots) {
                if(updatedSlots[key]){
                    if (
                        (typeof updatedSlots[key] === "object" && updatedSlots[key]?.name === selectedSpell.name) ||
                        (typeof updatedSlots[key] === "string" && updatedSlots[key] === selectedSpell)
                    ) {
                        previousSlot = key;
                        console.log(previousSlot);
                        break;
                    }
                }
                
            }
    
            if (normalizedSlot) {
                if (updatedSlots[normalizedSlot]) {
                    // Swap spells if target slot is occupied
                    const targetSpell = updatedSlots[normalizedSlot];
                    updatedSlots[normalizedSlot] = selectedSpell;
    
                    // Place target spell in the previous slot if it exists
                    if (previousSlot !== null) {
                        updatedSlots[previousSlot] = targetSpell;
                    }
                } else {
                    // Clear previous slot if target slot is empty
                    if (previousSlot !== null) {
                        updatedSlots[previousSlot] = null;
                    }
    
                    // Place the selected spell in the target slot
                    updatedSlots[normalizedSlot] =
                        typeof selectedSpell === "object" ? selectedSpell : selectedSpell;
                }
            }
    
            setSpellSlots(updatedSlots);
            console.log("Updated Slots:", updatedSlots);
            // Clear the selected spell
            setSelectedSpell(null);
        }
    };

    const removeSpell = async(slot) => {
        const normalizedSlot = slot.toLowerCase(); // Ensure consistent key format
        if (spellSlots[normalizedSlot]) {
            console.log(`Removing spell from ${normalizedSlot} slot`);
            setSpellSlots((prev) => ({
            ...prev,
            [normalizedSlot]: null,
            }));
        } else {
            console.log(`No spell to remove from ${normalizedSlot} slot`);
        }
    };

    const saveSpellsToBackend = async () => {
        const payload = {
            userId: userId,
            spellSlots: spellSlots
        };        
        try {
            await axios.post(`${config.backendUrl}/updateSpells`, payload);
            setSavedSpells(true);

            setTimeout(() => {
                setSavedSpells(false);
            }, 2000);

        } catch (error) {
            console.error('Error saving spells:', error);
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
    
    

    return (
        <div className="grid xl:grid-cols-6 lg:grid-cols-5 md:grid-cols-4 gap-4 p-4">
        <div className="xl:col-start-2 lg:col-start-2 md:col-start-2 md:col-span-3 lg:col-span-3 xl:col-span-4">
            <h1 className="text-4xl text-white font-bold text-center">Available Spells</h1>
            <p className='text-white mb-4 text-center'>(Purchase a spell from the shop, click on your spell, and select the slot)</p>
            <div className='grid lg:grid-cols-2 grid-cols-1 gap-4'>
                {playerSpells.length === 0 && (
                    <div className='col-span-2 text-white w-full'>
                    <p className='text-center text-red-400'>You have no spells right now.</p>
                    </div>
                )}

                {/* Unified Shop/Owned Grid */}
                <div className='grid grid-cols-2 col-span-2 text-white gap-4'>
                    {[...spells]
                    .sort((a, b) => a.intelligenceRequired - b.intelligenceRequired)
                    .map((spell) => {
                        const isOwned = playerSpells.some((owned) => owned.name === spell.name);

                        // Replace with SpellCard if owned
                        if (isOwned) {
                        return (
                            <SpellCard
                            key={spell.id}
                            spell={spell}
                            selectSpell={selectSpell}
                            playerIntelligence={playerIntelligence}
                            />
                        );
                        }

                        // Show Shop Spell if not owned
                        return (
                        <div key={spell.id} className="bg-gray-700 p-4 rounded-md shadow-lg text-center relative">
                            {playerIntelligence < spell.intelligenceRequired && (
                            <div className="absolute inset-0 bg-black bg-opacity-70 flex items-center justify-center rounded-md">
                                <span className="text-white p-4">
                                <FontAwesomeIcon className="text-4xl" icon={faLock} />
                                <div className="text-md">
                                    <span className="font-bold">{spell.intelligenceRequired}</span> INTELLIGENCE
                                </div>
                                </span>
                            </div>
                            )}

                            <h3 className="text-xl font-bold mb-2">{spell.name || "Unnamed Spell"}</h3>

                            <ul className="text-center text-sm mt-2">
                            <li key={spell.stat} className="text-gray-300">
                                {spell.type.slice(0, -3).charAt(0).toUpperCase() + spell.type.slice(1, -3)}:{" "}
                                {spell.type.slice(-3) === "Add"
                                ? `+${spell.stat} to Player`
                                : `-${spell.stat} to Enemies`}
                            </li>
                            <li className="text-gray-300">Mana cost: {spell.mana_cost}</li>
                            <li className="text-gray-300">Duration: {spell.duration} rounds</li>
                            <li className="text-gray-300">Intelligence Required: {spell.intelligenceRequired}</li>
                            </ul>

                            <p className="mt-2 text-yellow-300 font-bold">
                            <FontAwesomeIcon icon={faCoins} /> {spell.price} Gold
                            </p>

                            <button
                            onClick={() => handleSpellPurchase(spell)}
                            className={`mt-4 px-4 py-2 rounded-md font-bold hover:scale-105 transition-all ${
                                currency >= spell.price
                                ? "bg-green-600 hover:bg-green-500"
                                : "bg-gray-500 cursor-not-allowed"
                            }`}
                            >
                            {currency >= spell.price ? "Purchase" : "Not Enough Gold"}
                            </button>
                        </div>
                        );
                    })}
                </div>
            </div>


        </div>

        <div className="lg:col-span-1 md:col-start-2 md:col-span-3 ">
            <h2 className="text-2xl text-white mb-4 font-semibold">Select Spell Order</h2>
            <div className="space-y-4">
                <SpellSlot
                    order="First"
                    spell={spellSlots?.first}
                    placeSpellInSlot={placeSpellInSlot}
                    removeSpell={removeSpell}
                    selectSpell={selectSpell}
                    // saveSpell={saveSpellsToBackend}
                    selectedSpell={selectedSpell}
                />
                <SpellSlot
                    order="Second"
                    spell={spellSlots?.second}
                    placeSpellInSlot={placeSpellInSlot}
                    removeSpell={removeSpell}
                    selectSpell={selectSpell}
                    // saveSpell={saveSpellsToBackend}
                    selectedSpell={selectedSpell}

                />
                <SpellSlot
                    order="Third"
                    spell={spellSlots?.third}
                    placeSpellInSlot={placeSpellInSlot}
                    removeSpell={removeSpell}
                    selectSpell={selectSpell}
                    // saveSpell={saveSpellsToBackend}
                    selectedSpell={selectedSpell}

                />
                
                <SpellSlot
                    order="Fourth"
                    spell={spellSlots?.fourth}
                    placeSpellInSlot={placeSpellInSlot}
                    removeSpell={removeSpell}
                    selectSpell={selectSpell}
                    // saveSpell={saveSpellsToBackend}
                    selectedSpell={selectedSpell}

                />

                <button
                    onClick={saveSpellsToBackend}
                    className="mt-4 w-full bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
                >
                    {!savedSpells ? 'Update Spells' : 'Saved!'}
                </button>
            </div>
        </div>

        {selectedSpell && (
            <div className="fixed bottom-4 left-4 bg-gray-800 text-white p-4 z-[999999] rounded-md">
            <p>Selected Spell: {selectedSpell.hasOwnProperty('name') ? selectedSpell.name : selectedSpell}</p>
            </div>
        )}

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
}

export default SpellsPage;
