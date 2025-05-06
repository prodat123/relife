import React, { useEffect, useState } from 'react';

const PomodoroTimer = ({ initialMinutes, finishTime }) => {
    const storedTimeLeft = localStorage.getItem("timeLeft");
    const timeToUse = storedTimeLeft > 0 ? storedTimeLeft : initialMinutes * 60;
    const [timeLeft, setTimeLeft] = useState(timeToUse);

    useEffect(() => {
        const timer = setInterval(() => {
            setTimeLeft(prev => (prev > 0 ? prev - 1 : 0));
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        localStorage.setItem("timeLeft", timeLeft);

        if (timeLeft === 0) {
            finishTime(); // ✅ Run when timer hits 0
        }
    }, [timeLeft]);

    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;

    return (
        <div className="text-center text-yellow-400 mt-10">
            <h2 className="text-7xl font-bold">
                {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
            </h2>
        </div>
    );
};

export default PomodoroTimer;
