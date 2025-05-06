import { faFlask } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React from "react";

const ConsumableInventory = ({ inventory, onItemClick }) => {
    // Filter only consumable items
    const consumables = inventory ? inventory.filter(item => item.type === "consumable") : null;

    return (
        <div className="p-4 bg-gray-700 text-white rounded-md shadow-lg w-50">
            <h2 className="text-lg font-bold mb-3"><FontAwesomeIcon icon={faFlask} /> Consumables</h2>
            <div className="space-y-2">
                {consumables.length > 0 ? (
                    consumables.map(item => (
                        <button 
                            key={item.id} 
                            className="text-left p-2 bg-gray-600 hover:bg-gray-500 rounded-md w-full transition"
                            onClick={() => onItemClick(item.name)}
                        >
                            {/* <img src={item.icon} alt={item.name} className="w-10 h-10" /> */}
                            <div>
                                <p className="font-medium">{item.name}</p>
                                <p className="text-sm text-gray-300">x{item.quantity}</p>
                            </div>
                        </button>
                    ))
                ) : (
                    <p className="text-gray-400">No consumables</p>
                )}
            </div>
        </div>
    );
};

export default ConsumableInventory;
