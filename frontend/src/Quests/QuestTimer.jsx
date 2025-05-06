import React, { useState, useEffect, useRef } from 'react';

function QuestTimer({ id, endTime, setClaimable, activeQuests }) {
    const [timeLeft, setTimeLeft] = useState(() => calculateRemainingTime(endTime));
    const hasCompletedRef = useRef(false);

    function formatTime(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const remainingSeconds = seconds % 60;

        return `${hours}h ${minutes}m ${remainingSeconds}s`;
    }

    function calculateRemainingTime(end) {
        const now = Math.floor(Date.now() / 1000);
        const questEnd = Math.floor(new Date(end).getTime() / 1000);
        return Math.max(questEnd - now, 0);
    }

    useEffect(() => {
        const interval = setInterval(() => {
            const remaining = calculateRemainingTime(endTime);
            setTimeLeft(remaining);

            if (remaining === 0 && !hasCompletedRef.current) {
                const quest = activeQuests?.find(q => q.quest_id === id);
                const now = Math.floor(Date.now() / 1000);
                const questEndTime = Math.floor(new Date(quest?.expired_at).getTime() / 1000);

                if (now >= questEndTime) {
                    hasCompletedRef.current = true;
                    setClaimable(id);
                    console.log(`✅ Quest ${id} is now truly claimable!`);
                } else {
                    console.log(`⏳ Quest ${id} not yet expired, skipping claim.`);
                }

                clearInterval(interval);
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [endTime, id, activeQuests, setClaimable]);

    return (
        <div>
            <p>{formatTime(timeLeft)}</p>
        </div>
    );
}

export default QuestTimer;
