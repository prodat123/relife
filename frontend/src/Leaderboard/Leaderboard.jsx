import { faCaretDown, faCertificate, faCrown, faDiamond, faDiamondTurnRight, faPeopleGroup, faTowerObservation, faTrophy, faUserGroup } from '@fortawesome/free-solid-svg-icons';
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

  const ranks = [
    { levelRequirement: 1, rank: "F-", color: "text-green-500", description: "Beginner – just getting started." },
    { levelRequirement: 11, rank: "F", color: "text-lime-500", description: "Novice explorer of features." },
    { levelRequirement: 21, rank: "F+", color: "text-emerald-500", description: "Starting to stand out!" },
    { levelRequirement: 31, rank: "D-", color: "text-teal-500", description: "Basic engagement level." },
    { levelRequirement: 41, rank: "D", color: "text-cyan-500", description: "Slightly more active." },
    { levelRequirement: 51, rank: "D+", color: "text-sky-500", description: "Gaining traction." },
    { levelRequirement: 61, rank: "C-", color: "text-blue-500", description: "Improved consistency." },
    { levelRequirement: 71, rank: "C", color: "text-indigo-500", description: "Intermediate level user." },
    { levelRequirement: 81, rank: "C+", color: "text-violet-500", description: "Reliable contributor." },
    { levelRequirement: 91, rank: "B-", color: "text-purple-500", description: "Notable activity." },
    { levelRequirement: 101, rank: "B", color: "text-fuchsia-500", description: "Advanced and consistent." },
    { levelRequirement: 111, rank: "B+", color: "text-pink-500", description: "Power user potential." },
    { levelRequirement: 121, rank: "A-", color: "text-rose-500", description: "Highly engaged." },
    { levelRequirement: 131, rank: "A", color: "text-orange-500", description: "Elite tier user." },
    { levelRequirement: 141, rank: "A+", color: "text-amber-500", description: "Influencer status." },
    { levelRequirement: 151, rank: "S-", color: "text-red-500", description: "Expert level." },
    { levelRequirement: 176, rank: "S", color: "text-red-600", description: "Mastered the system." },
    { levelRequirement: 201, rank: "S+", color: "text-red-700", description: "Legendary contributor." },
    { levelRequirement: 251, rank: "S++", color: "text-red-800", description: "Top 1% performer." },
    { levelRequirement: 301, rank: "Z", color: "text-black", description: "Mythic status – beyond mastery." }
  ];

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
            {(searchTerm ? searchResults : users.slice(0, 10)).map((user) => {
              const currentLevel = calculateLevel(user.experience)?.level;

              // Find the latest rank where levelRequirement is <= currentLevel
              const currentRank = ranks.findLast(rank => currentLevel >= rank.levelRequirement) || ranks[0];
              
              return(
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
                  
                  <span className={`
                    fa-layers fa-fw rounded-full font-bold uppercase tracking-wider text-3xl`}>
                        <FontAwesomeIcon
                            icon={faDiamond}
                            className={`${currentRank.color}`}
                        />

                    <span className="fa-layers-text font-extrabold text-white" data-fa-transform="shrink-8">{currentRank.rank}</span>
                  </span>
                  {/* <p className="relative">
                    <div className='flex items-center justify-center'>
                      
                      <FontAwesomeIcon className='text-5xl text-yellow-400' icon={faCertificate} />
                      <div className='absolute text-xl text-indigo-600 font-bold'>{calculateRank(calculateLevel(user.experience).level)}</div>
                    </div>
                  </p> */}
                  
                </div>
              )
            })}
          </div>
        ) : (
          <TowerLeaderboard username={username} />
        )}
      </div>
    </div>
  );
};

export default Leaderboard;
