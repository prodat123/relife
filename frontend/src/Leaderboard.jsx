import { faTrophy } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Leaderboard = () => {
    const [users, setUsers] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchLeaderboard = async () => {
        setIsLoading(true);
        try {
            const response = await fetch(`http://localhost:3001/leaderboard?page=${currentPage}&limit=10`);
            
            if (!response.ok) {
            throw new Error('Failed to fetch leaderboard');
            }
            
            const data = await response.json();
            
            setUsers(data.users);
            setTotalPages(data.totalPages);
            setIsLoading(false);
        } catch (err) {
            setError(err.message);
            setIsLoading(false);
        }
        };

        fetchLeaderboard();
    }, [currentPage]);

    const handleNextPage = () => {
        if (currentPage < totalPages) {
        setCurrentPage(prev => prev + 1);
        }
    };

    const handlePrevPage = () => {
        if (currentPage > 1) {
        setCurrentPage(prev => prev - 1);
        }
    };

    function calculateLevel(experience) {
        let level = 1;
        let xpForNextLevel = 100;

        while (experience >= xpForNextLevel) {
            level++;
            experience -= xpForNextLevel;
            xpForNextLevel = Math.ceil(xpForNextLevel * 1.1);
        }

        return { level, remainingXP: experience, xpForNextLevel };
    }

  if (isLoading) {
    return (
      <div className="w-full max-w-md mx-auto mt-8 p-4 border rounded-lg shadow-md">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Leaderboard</h2>
        </div>
        <div className="text-center text-gray-500">
          Loading leaderboard...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full max-w-md mx-auto mt-8 p-4 border rounded-lg shadow-md border-red-500">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-red-600">Leaderboard</h2>
        </div>
        <div className="text-center text-red-500">
          {error}
        </div>
      </div>
    );
  }

  const handleUserClick = (userId) => {
    navigate(`/account/${userId}`);
  };

  return (
    <div className='bg-gradient-to-b from-gray-900 to-gray-800 h-screen p-8'>
        <div className="w-full max-w-md mx-auto bg-gray-700 p-4 rounded-lg shadow-md ">
        <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white">Leaderboard</h2>
            <span className="text-yellow-500 font-semibold">Top Players</span>
        </div>
        <div className="space-y-4">
            {users.map((user, index) => (
            <div 
                key={user.id} 
                className={`flex items-center justify-between p-3 rounded-lg cursor-pointer ${
                index === 0 ? 'bg-yellow-100' : 'bg-gray-300'
                }`}
                onClick={() => handleUserClick(user.id)}
            >
                <div className="flex items-center space-x-4">
                <span className="font-bold text-xl text-gray-600">
                    {(currentPage - 1) * 10 + index + 1}
                </span>
                <div>
                    <p className="font-semibold">{user.username}</p>
                    <p className="text-sm text-gray-500">
                    Level {calculateLevel(user.experience).level} • {user.experience} XP
                    </p>
                </div>
                </div>
                {index === 0 && (
                <span className="text-yellow-500 font-bold"><FontAwesomeIcon icon={faTrophy} /></span>
                )}
            </div>
            ))}
        </div>
        
        <div className="flex justify-between items-center mt-4">
            <button 
            onClick={handlePrevPage} 
            disabled={currentPage === 1}
            className="flex items-center text-white bg-indigo-600 p-2 rounded disabled:opacity-50"
            >
            ← Previous
            </button>
            <span className="text-sm text-white">
            Page {currentPage} of {totalPages}
            </span>
            <button 
            onClick={handleNextPage} 
            disabled={currentPage === totalPages}
            className="flex items-center text-white bg-indigo-600 p-2 rounded disabled:opacity-50"
            >
            Next →
            </button>
        </div>
        </div>
    </div>
  );
};

export default Leaderboard;