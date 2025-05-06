import React, { useEffect, useState } from 'react';
import axios from 'axios';
import config from '../config';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCrown, faEllipsisV, faTrophy } from '@fortawesome/free-solid-svg-icons';
import { FaDotCircle } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

function TowerLeaderboard({ username }) {
    const [leaderboard, setLeaderboard] = useState([]);
    const [currentUserRank, setCurrentUserRank] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const navigate = useNavigate();
    

    useEffect(() => {
        const fetchLeaderboard = async () => {
            if (!username) return;
            try {
                const response = await axios.get(`${config.backendUrl}/tower-leaderboard`);
                const leaderboardData = response.data;
                setLeaderboard(leaderboardData);

                // Find current user's rank
                const currentUser = leaderboardData.find(user => user.username === username);
                if (currentUser) {
                    setCurrentUserRank(leaderboardData.indexOf(currentUser) + 1);
                }
            } catch (err) {
                setError('Failed to fetch leaderboard data.');
            } finally {
                setLoading(false);
            }
        };

        fetchLeaderboard();
    }, [username]);

    if (loading) return <div>Loading leaderboard...</div>;
    if (error) return <div>{error}</div>;
    if (leaderboard.length === 0) return <div>No leaderboard data available.</div>; // Check for empty leaderboard

    // Get the top 3 users
    const topUsers = leaderboard.slice(0, 3);
  
    // Find the users around the current user's rank
    const currentUserIndex = leaderboard.findIndex(user => user.username === username);
    const surroundingUsers = [
        ...leaderboard.slice(Math.max(0, currentUserIndex - 1), currentUserIndex), // User above
        leaderboard[currentUserIndex], // Current user
        ...leaderboard.slice(currentUserIndex + 1, currentUserIndex + 2), // User below
    ];

    const handleUserClick = (userId) => {
        navigate(`/account/${userId}`);
    };

    return (
        <div className="w-full">
            <div className="w-full mx-auto bg-gray-700 p-4 rounded-md shadow-md">
                {/* <h2 className="text-xl font-bold text-white mb-4">Leaderboard</h2> */}

                {/* Display top 3 users */}
                {topUsers && topUsers.length > 0 && topUsers.map((user, index) => {
                    if (!user) return null; // Add null check for user
                    const isLeader = index === 0;
                    return (
                        <div
                            key={user.id}
                            className={`flex items-center my-2 justify-between p-3 rounded-lg cursor-pointer hover:scale-[102%] transition-all duration-200 bg-gray-800 hover:bg-gray-600`}
                            onClick={() => handleUserClick(user.userId)}
                        >
                            <div className="flex items-center space-x-4">
                                <span className="font-bold text-xl text-gray-600 text-white">{index + 1}</span>
                                <div>
                                    <p className="font-semibold text-white">{user.username}</p>
                                    <p className="text-xs text-gray-200">
                                        Last Floor: {user.floor} Achieved On: {user.date}
                                    </p>
                                </div>
                            </div>
                            {isLeader && <span className="text-amber-400 font-bold"><FontAwesomeIcon icon={faCrown} /></span>}
                        </div>
                    );
                })}

                {/* Display current user's rank */}
                {surroundingUsers.length > 0 && currentUserRank !== null && (
                    <div className="mt-4">
                        <p className="font-bold text-white text-center">
                            <FontAwesomeIcon icon={faEllipsisV} />
                        </p>
                        {surroundingUsers.map((user) => {
                            if (!user) return null; // Add null check for user
                            const isCurrentUser = user.username === username;
                            const actualRank = leaderboard.findIndex(u => u.username === user.username) + 1; // Get 1-based rank

                            return (
                                
                                <div
                                    key={user.id}
                                    className={`flex items-center my-2 justify-between p-3 rounded-lg cursor-pointer hover:scale-[102%] transition-all duration-200  ${
                                        isCurrentUser ? 'bg-blue-600 hover:bg-blue-500' : 'bg-gray-800 hover:bg-gray-600'
                                    }`}
                                    onClick={() => handleUserClick(user.userId)}
                                
                                >
                                    <div className="flex items-center space-x-4">
                                        <span className="font-bold text-xl text-white">
                                            {actualRank}
                                        </span>
                                        <div>
                                            <p className="font-semibold text-white">{user.username}</p>
                                            <p className="text-xs text-gray-200">
                                                Last Floor: {user.floor} Achieved On: {user.date}
                                            </p>
                                        </div>
                                    </div>
                                    {isCurrentUser && <span className="text-blue-300 font-bold">You</span>}
                                </div>
                            );
                        })}
                    </div>
                )}

            </div>
        </div>

    );
}

export default TowerLeaderboard;
