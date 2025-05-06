import axios from 'axios';
import React, { useEffect, useState } from 'react';

function GardenTimer({ id, nextWaterTime, onComplete, status }) {


    // Function to calculate remaining time from now to nextWaterTime
    const calculateRemainingTime = () => {
        const now = Math.floor(Date.now() / 1000); // Get current time in seconds
        const nextWaterTimestamp = Math.floor(new Date(nextWaterTime).getTime() / 1000); // Convert nextWaterTime to seconds
        return Math.max(nextWaterTimestamp - now, 0);
    };

    const [timeLeft, setTimeLeft] = useState(calculateRemainingTime());
    const [hasCompleted, setHasCompleted] = useState(false); // Prevent multiple onComplete calls

    useEffect(() => {
        // if (hasCompleted) return; // Stop timer if wilted or already completed
        // If time is up, call onComplete immediately
        if (timeLeft === 0) {
            onComplete(id);
            setHasCompleted(true);
            return;
        }

        // Start countdown
        const timer = setInterval(() => {
            setTimeLeft(prevTime => {
                const now = Math.floor(Date.now() / 1000);
                const nextWaterTimestamp = Math.floor(new Date(nextWaterTime).getTime() / 1000);
                const remainingTime = Math.max(nextWaterTimestamp - now, 0);

                if (remainingTime === 0) {
                    clearInterval(timer);
                    if (!hasCompleted) {
                        onComplete(id);
                        setHasCompleted(true);
                    }
                }

                return remainingTime;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [timeLeft, id, onComplete, status, hasCompleted, nextWaterTime]);

    return (
        <div className="p-4 bg-gray-800 rounded mt-2">
            <p>Timer: {timeLeft}s</p>
        </div>
    );
}

export default GardenTimer;
