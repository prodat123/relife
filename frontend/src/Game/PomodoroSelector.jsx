import { faChessRook } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React from 'react';

const PomodoroSelector = ({ onSelectDuration }) => {
  const durations = [
    { label: '1 Minute', value: 1 },
    { label: '5 Minutes', value: 5 },
    { label: '10 Minutes', value: 10 },
    { label: '15 Minutes', value: 15 },
    { label: '20 Minutes', value: 20 },
    { label: '25 Minutes', value: 25 },
    { label: '30 Minutes', value: 30 },

  ];

  const selectDuration = (duration) =>{
    localStorage.setItem("timeLeft", duration.value * 60);
    onSelectDuration(duration.value)
  }

  return (
    <div className="grid md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 h-screen">
        <div className='col-span-5 col-start-2 text-white flex items-center justify-center flex-col'>
            <FontAwesomeIcon icon={faChessRook} className='text-4xl'/>
            <h1 className="text-4xl font-bold mb-4 text-center">Time to Conquer the Tower</h1>
            <p className="text-lg text-center text-gray-300 w-[70%] text-break">
              Select your session length to start the climb. Stay focused and conquer each quest on your way up the tower!            
            </p>
            <p className="text-md mb-8 text-center text-red-400 w-[70%] text-break">
              (This feature is inspired by the Pomodoro technique to boost focus and productivity. Your screen will be maximized to help minimize distractions)           
            </p>

            <div className="flex gap-3 items-center justify-center flex-wrap">
                {durations.map((duration) => (
                <button
                    key={duration.value}
                    onClick={() => selectDuration(duration)}
                    className="px-6 py-3 bg-indigo-600 hover:scale-105 hover:bg-indigo-500 text-white text-lg font-semibold rounded-lg shadow-lg transition-all duration-200"
                >
                    {duration.label}
                </button>
                ))}
            </div>
      </div>
    </div>
  );
};

export default PomodoroSelector;
