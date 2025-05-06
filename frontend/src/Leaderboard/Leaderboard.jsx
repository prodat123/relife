import { faCaretDown, faCertificate, faCrown, faPeopleGroup, faTowerObservation, faTrophy, faUserGroup } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import config from '../config';
import axios from 'axios';
import TowerLeaderboard from './TowerLeaderboard';

const Leaderboard = () => {
  const username = JSON.parse(localStorage.getItem('user')).username;
  const userId = JSON.parse(localStorage.getItem('user')).id;
  const [users, setUsers] = useState([]);
  const [accountData, setAccountData] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('levels'); // 'levels' or 'tower'

  const navigate = useNavigate();

  useEffect(() => {
    document.title = "Re:LIFE | Leaderboard";
  }, []);


  const fetchAccountData = async () => {
    try {
        const response = await axios.get(`${config.backendUrl}/account`, {
            params: { userId: userId },
        });
        const player = response.data
        setAccountData(player);
    } catch (error) {
        console.error("Error fetching account data:", error);
        setError(error.response?.data?.error || "Failed to fetch account data");
    }
  };

  useEffect(() => {
    fetchAccountData();
  }, [userId]);
  

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setIsLoading(true);
      try {  
        // Make the API request with the userId as a query parameter
        const response = await axios.get(`${config.backendUrl}/leaderboard`, {
          params: { userId } // Pass userId as a query parameter
        });
  
        // Map over the users data and add the rank
        const rankedUsers = response.data.users.map((user, index) => ({
          ...user,
          rank: index + 1,
        }));
        
        setUsers(rankedUsers);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
  
    fetchLeaderboard();
  }, []);
  

  const calculateLevel = (experience) => {
    let level = 1;
    let xpForNextLevel = 100;

    while (experience >= xpForNextLevel) {
      level++;
      experience -= xpForNextLevel;
      xpForNextLevel = 100 * Math.pow(1.05, (level - 1));
    }

    return { level, remainingXP: experience, xpForNextLevel };
  };

  const handleSearch = (term) => {
    setSearchTerm(term);
    if (!term) {
      setSearchResults([]);
      return;
    }
    const filteredResults = users.filter((user) =>
      user.username.toLowerCase().includes(term.toLowerCase())
    );
    setSearchResults(filteredResults);
  };

  function calculateRank(level) {
    if (level >= 1 && level <= 10) return "F-";
    if (level <= 20) return "F";
    if (level <= 30) return "F+";
    if (level <= 40) return "D-";
    if (level <= 50) return "D";
    if (level <= 60) return "D+";
    if (level <= 70) return "C-";
    if (level <= 80) return "C";
    if (level <= 90) return "C+";
    if (level <= 100) return "B-";
    if (level <= 110) return "B";
    if (level <= 120) return "B+";
    if (level <= 130) return "A-";
    if (level <= 140) return "A";
    if (level <= 150) return "A+";
    if (level <= 175) return "S-";
    if (level <= 200) return "S";
    if (level <= 250) return "S+";
    if (level <= 300) return "S++";
    if (level <= 400) return "Z";
    
    return "??"; // default or unknown rank
  }

  const handleUserClick = (userId) => {
    navigate(`/account/${userId}`);
  };

  if (isLoading) {
    return <div>Loading leaderboard...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div className="p-6 grid xl:grid-cols-6 grid-cols-5">
      <div className="lg:col-span-5 md:col-span-4 md:col-start-2 col-span-5 lg:col-start-2">
        <h2 className="text-4xl font-bold text-center text-white mb-4">Leaderboard</h2>

        {/* Tabs */}
        <div className="flex justify-center gap-4 mb-4">
          <button
            className={`px-4 py-2 rounded-md font-semibold ${
              activeTab === 'levels' ? 'bg-indigo-600 text-white' : 'bg-gray-500 text-white'
            }`}
            onClick={() => setActiveTab('levels')}
          >
            <FontAwesomeIcon icon={faUserGroup} /> Players
          </button>
          <button
            className={`px-4 py-2 rounded-md font-semibold ${
              activeTab === 'tower' ? 'bg-indigo-600 text-white' : 'bg-gray-500 text-white'
            }`}
            onClick={() => setActiveTab('tower')}
          >
            <FontAwesomeIcon icon={faTowerObservation} /> Tower
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'levels' ? (
          <div className="w-full mx-auto p-4 rounded-md bg-gray-700">
            {/* Search Bar */}
            <div className="flex space-x-2 mb-4">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="Search by username..."
                className="flex-grow p-2 bg-gray-500 rounded text-white"
              />
            </div>

            {/* Leaderboard List */}
            {(searchTerm ? searchResults : users.slice(0, 10)).map((user) => (
              <div
                key={user.id}
                className={`flex items-center my-2 justify-between p-3 rounded-md cursor-pointer hover:scale-[102%] transition-all duration-200
                  bg-gray-800 hover:bg-gray-600
                }`}
                onClick={() => handleUserClick(user.id)}
              >
                <div className="flex items-center justify-between space-x-4">
                  <span className="font-bold text-xl text-white">{user.rank}</span>
                  <div>
                    <div className="flex gap-3 items-center justify-centerfont-semibold text-white">{user.username}

                    {user.rank === 1 && (
                      <span className="text-amber-400 font-bold">
                        <FontAwesomeIcon icon={faCrown} />
                      </span>
                    )}
                    
                    </div>
                    <p className="text-sm text-gray-200">
                      Level {calculateLevel(user.experience).level} • {user.experience} XP
                    </p>

                    
                    
                  </div>
                  
                </div>
                <p className="relative">
                  <div className='flex items-center justify-center'>
                    <FontAwesomeIcon className='text-5xl text-yellow-400' icon={faCertificate} />
                    <div className='absolute text-xl text-indigo-600 font-bold'>{calculateRank(calculateLevel(user.experience).level)}</div>
                  </div>
                </p>
                
              </div>
            ))}
          </div>
        ) : (
          <TowerLeaderboard username={username} />
        )}
      </div>
    </div>
  );
};

export default Leaderboard;
