import { faAngleDown, faAngleUp, faCalendar, faPlusCircle } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React, { useState, useEffect, useRef, useContext } from 'react';
import config from '../config';
import axios from 'axios';
import { UserContext } from '../Account/UserContext';

function DaySelector({ questId, scheduledDays, updateScheduledQuests }) {
    const userId = JSON.parse(localStorage.getItem('user'))?.id;
    const { fetchAccountData } = useContext(UserContext); 
    const [showDays, setShowDays] = useState(false);
    const [selectedDays, setSelectedDays] = useState([]);
    const [savedScheduledDays, setSavedScheduledDays] = useState(scheduledDays || {});
    // const [scheduledDays, setScheduledDays] = useState([]);
    const [isScheduled, setIsScheduled] = useState(false);
    const [loading, setLoading] = useState(true);
    const dropdownRef = useRef(null);

    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

    const toggleDays = (e) => {
        e.stopPropagation();
        setShowDays(prev => !prev);
    };

    useEffect(() => {
        if (savedScheduledDays[questId]) {
            setIsScheduled(true);
            setSelectedDays(savedScheduledDays[questId]);
        }
    }, [savedScheduledDays, questId]); // This effect will run when either scheduledDays or questId changes
    

    // useEffect(() => {
    //     console.log(scheduledDays[questId]);
    //     // const fetchScheduledQuests = async () => {
    //     //     try {
    //     //         const response = await axios.get(`${config.backendUrl}/scheduled-quests/${userId}`);
    
    //     //         if (!response || response.message === "No scheduled quests found for this user") {
    //     //             setLoading(false);
    //     //             return;
    //     //         }
    
    //     //         const quest = response.data.find(q => q.id === questId);
    //     //         if (quest) {
    //     //             setIsScheduled(true);
    //     //             let parsedDays = [];
    
    //     //             if (Array.isArray(quest.days)) {
    //     //                 parsedDays = quest.days.map(d =>
    //     //                     typeof d === 'string' ? capitalize(d) : capitalize(d.day)
    //     //                 );
    //     //             } else if (typeof quest.days === 'string') {
    //     //                 try {
    //     //                     const parsed = JSON.parse(quest.days);
    //     //                     parsedDays = parsed.map(d =>
    //     //                         typeof d === 'string' ? capitalize(d) : capitalize(d.day)
    //     //                     );
    //     //                 } catch (e) {
    //     //                     console.error('Failed to parse quest.days string:', e);
    //     //                 }
    //     //             }
    
    //     //             setScheduledDays(parsedDays);
    //     //             setSelectedDays(parsedDays);
    //     //         } else {
    //     //             setIsScheduled(false);
    //     //             setScheduledDays([]);
    //     //             setSelectedDays([]);
    //     //         }
    //     //     } catch (err) {
    //     //         setIsScheduled(false);
    //     //         setScheduledDays([]);
    //     //         setSelectedDays([]);
    //     //     } finally {
    //     //         setLoading(false);
    //     //     }
    //     // };
    
    //     // fetchScheduledQuests();
    // }, []);

    const buttonRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target) &&
                buttonRef.current &&
                !buttonRef.current.contains(event.target)
            ) {
                setShowDays(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);


    const scheduleQuest = async (selectedDays) => {
        try {
            const response = await axios.post(`${config.backendUrl}/schedule-quest`, {
                quest_id: questId,
                user_id: userId,
                days: selectedDays
            });
            return response.data;
        } catch (error) {
            console.error('Error scheduling quest:', error);
    
            // Extract backend error message if it exists
            const errorMessage =
                error.response?.data?.error || 'An unexpected error occurred';
    
            // Show it as an alert
            alert(errorMessage);
    
            return { success: false, error: errorMessage };
        }
    };
    

    const handleCheckboxChange = (day) => {
        setSelectedDays(prev =>
            prev.includes(day)
                ? prev.filter(d => d !== day)
                : [...prev, day]
        );
    };

    const handleSubmit = async () => {
        const res = await scheduleQuest(selectedDays);
        if (res.success) {
            updateScheduledQuests();
        }
    };

    return (
        <div className="py-2 relative">
            <button
            onClick={toggleDays}
            ref={buttonRef}
            onMouseDown={(e) => e.stopPropagation()}
            className="text-white rounded text-left transition hover:text-indigo-300"
            >
            <FontAwesomeIcon icon={faCalendar} className="mr-1" />
            {showDays ? (
                <>
                Hide Schedule <FontAwesomeIcon icon={faAngleUp} />
                </>
            ) : isScheduled ? (
                <>
                {savedScheduledDays[questId]?.join(', ')} <FontAwesomeIcon icon={faAngleDown} />
                </>
            ) : (
                <>
                Schedule <FontAwesomeIcon icon={faPlusCircle} />
                </>
            )}
            </button>
        
            {showDays && (
            <div
                ref={dropdownRef}
                className="relative z-50 mt-2 left-0 bg-gray-800 rounded-md shadow-lg p-4 w-full pointer-events-auto border border-indigo-500"
                onClick={(e) => e.stopPropagation()}
            >
                <p className="text-white text-sm font-semibold mb-2">Repeat Every:</p>
                <div className="flex flex-wrap gap-2">
                {days.map(day => {
                    const isSelected = selectedDays.includes(day);
                    return (
                    <label
                        key={day}
                        className={`cursor-pointer px-3 py-1 rounded-full text-sm font-semibold transition duration-200 ${
                        isSelected
                            ? "bg-green-600 text-white hover:bg-green-500"
                            : "bg-gray-700 text-gray-300 hover:bg-indigo-500 hover:text-white"
                        }`}
                    >
                        <input
                        type="checkbox"
                        name="days"
                        value={day}
                        checked={isSelected}
                        onChange={() => handleCheckboxChange(day)}
                        className="hidden"
                        />
                        {day}
                    </label>
                    );
                })}
                </div>
                <button
                className="w-full mt-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-500 hover:scale-[1.02] transition font-bold"
                onClick={handleSubmit}
                >
                Save
                </button>
            </div>
            )}
        </div>
      
    );
}

export default DaySelector;
