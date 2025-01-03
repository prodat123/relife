import React, { useState, useEffect, useRef } from "react";

const SkipFloorPopup = ({ show, bravery, maxFloors, onSkip, onCancel }) => {
    // Calculate max floors the user can skip based on bravery
    const maxSkippableFloors = Math.floor(bravery / 8); 
    const [floorsToSkip, setFloorsToSkip] = useState(0);

    const inputRef = useRef(null);

    useEffect(() => {
        if (show) {
            // Focus on the input when the popup opens
            inputRef.current?.focus();
        }
        // Reset the value when the popup opens
        setFloorsToSkip(0);
    }, [show]);

    const handleSkip = () => {
        onSkip(floorsToSkip);
    };

    const handleInputChange = (e) => {
        // Parse the input value and constrain it between 0 and maxSkippableFloors
        const value = parseInt(e.target.value, 10);
        setFloorsToSkip(Math.min(Math.max(0, value), maxSkippableFloors));
    };

    if (!show) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white text-black p-6 rounded-lg shadow-lg text-center">
                <h2 className="text-xl font-bold mb-4">Skip Floors</h2>
                <p className="mb-4">
                    Your bravery is <strong className="text-blue-500">{bravery}</strong>. You can skip up to{" "}
                    <strong>{maxSkippableFloors}</strong> floors.
                </p>
                <input
                    ref={inputRef}
                    type="number"
                    value={floorsToSkip}
                    onChange={handleInputChange}
                    min="0"
                    max={maxSkippableFloors}
                    step="1"
                    className="border rounded px-2 py-1 w-full mb-4 text-center"
                    placeholder="Enter number of floors to skip"
                />
                <small className="text-gray-500 mb-4 block">
                    (You can skip a maximum of {maxSkippableFloors} floors)
                </small>
                <button
                    onClick={handleSkip}
                    disabled={floorsToSkip <= 0}
                    className={`${
                        floorsToSkip > 0 ? "bg-green-500 hover:bg-green-600" : "bg-gray-400"
                    } text-white px-4 py-2 rounded mr-2 transition`}
                >
                    Skip Floors
                </button>
                <button
                    onClick={onCancel}
                    className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded transition"
                >
                    Cancel
                </button>
            </div>
        </div>
    );
};

export default SkipFloorPopup;
