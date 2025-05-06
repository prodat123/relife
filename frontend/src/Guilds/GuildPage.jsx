import React, { useState, useEffect } from 'react';
import axios from 'axios';
import config from '../config';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCoins, faPeopleGroup, faPlusCircle, faX } from '@fortawesome/free-solid-svg-icons';
import { useNavigate } from 'react-router-dom';
import UserGuildPage from './UserGuildPage'; // Import the UserGuildPage

const GuildPage = () => { 
    const userId = JSON.parse(localStorage.getItem("user"))?.id;
    const navigate = useNavigate();
    const [guilds, setGuilds] = useState([]);
    const [joinedGuild, setJoinedGuild] = useState(false);
    const [guildName, setGuildName] = useState('');
    const [guildDescription, setGuildDescription] = useState('');
    const [privacy, setPrivacy] = useState('public');
    const [isCreating, setIsCreating] = useState(false);
    const [error, setError] = useState(null);
    const [player, setPlayer] = useState(null);
    const [requestedGuilds, setRequestedGuilds] = useState([]); // Track requested guilds

    function calculateLevel(experience) {
        let level = 1;
        let xpForNextLevel = 100;

        while (experience >= xpForNextLevel) {
            level++;
            experience -= xpForNextLevel;
            xpForNextLevel = 100 * Math.pow(1.05, (level - 1));
        }

        return { level, remainingXP: experience, xpForNextLevel };
    }

    const fetchAccountData = async () => {
        try {
            const response = await axios.get(`${config.backendUrl}/account`, {
                params: { userId: userId },
            });
            const user = response.data;
            setPlayer(user);

            if(calculateLevel(user.experience).level < 31){
                window.location.href = '/dashboard';
            }
            if (user.guild !== '') {
                setJoinedGuild(true); // User is in a guild
            }
        } catch (error) {
            console.error("Error fetching account data:", error);
            setError(error.response?.data?.error || "Failed to fetch account data");
        }
    };

    useEffect(() => {
        fetchAccountData();
    }, [userId]);

    useEffect(() => {
        const fetchGuilds = async () => {
            try {
                const response = await axios.get(`${config.backendUrl}/guilds`);
                const allGuilds = response.data;
        
                // Check if the user has requested to join any guilds
                const userRequestedGuilds = allGuilds.filter((guild) => {
                    // Check if the request_list contains an object with the userId
                    const requestList = JSON.parse(guild.request_list); // Assuming request_list is stored as a JSON string
                    return requestList.some((request) => request.userId === userId); // Check if the userId exists in request_list
                });
        
                setGuilds(allGuilds);
                setRequestedGuilds(userRequestedGuilds.map((guild) => guild.name)); // Store names of requested guilds
            } catch (err) {
                setError('Error fetching guilds');
            }
        };

        fetchGuilds();
    }, []);

    const joinGuild = async (guildName) => {
        if (requestedGuilds.includes(guildName)) {
            alert("You have already requested to join this guild.");
            return;
        }

        try {
            const response = await axios.post(`${config.backendUrl}/join-guild`, { name: guildName, username: player?.username, userId });
            alert(response.data.message);
            
            window.location.reload();
        } catch (err) {
            alert('Error joining the guild');
        }
    };

    const createGuild = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.post(`${config.backendUrl}/create-guild`, {
                name: guildName,
                username: player?.username,
                description: guildDescription,
                privacy,
                created_by: userId,
            });
            alert(response.data.message);
            setIsCreating(false);
            window.location.reload();
        } catch (err) {
            setError('Error creating guild');
        }
    };

    // If user is already in a guild, show UserGuildPage
    if (joinedGuild) {
        // console.log(player?.guild);
        return <UserGuildPage guildName={player?.guild}/>;
    }

    return (
        <div className="grid 2xl:grid-cols-6 lg:grid-cols-5 md:grid-cols-3 grid-cols-1 min-h-screen text-white p-6">
            <div className='col-span-4 col-start-1 md:col-start-2 lg:col-start-2 text-white'>
                <h1 className="text-4xl font-bold text-center mb-6">Guilds</h1>
                {player?.currency >= 50000 ?
                <button className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 w-full hover:scale-[102%] transition-all duration-200"
                    onClick={() => setIsCreating(!isCreating)}>
                    <FontAwesomeIcon icon={faPlusCircle} /> Create New Guild <span className='text-yellow-300'>(<FontAwesomeIcon icon={faCoins} /> 50000 Gold)</span>
                </button>
                :
                <div className='p-2 bg-gray-500 text-center text-white rounded-lg cursor-not-allowed w-full'>You need <span className='text-yellow-300'>(<FontAwesomeIcon icon={faCoins} /> 50000 Gold)</span> to Create a Guild</div>
                }

                {isCreating && player?.currency >= 50000 && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
                        <div className="bg-gray-700 p-8 rounded-lg shadow-lg w-full max-w-lg text-white relative">
                            <button className="absolute my-4 p-2 text-red-600 rounded-lg hover:text-red-500 right-4 top-0"
                                onClick={() => setIsCreating(false)}>
                                <FontAwesomeIcon icon={faX} />
                            </button>
                            <h2 className="text-2xl font-semibold text-center mb-4">Create a New Guild</h2>
                            {error && <div className="text-red-500 mb-4">{error}</div>}
                            <form onSubmit={createGuild} className="space-y-4">
                                <div>
                                    <label className="block text-lg font-medium mb-1">Guild Name:</label>
                                    <input type="text" value={guildName} onChange={(e) => setGuildName(e.target.value)} required
                                        className="w-full p-3 bg-gray-800 text-white border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                                </div>
                                <div>
                                    <label className="block text-lg font-medium mb-1">Guild Description:</label>
                                    <textarea value={guildDescription} onChange={(e) => setGuildDescription(e.target.value)} required
                                        className="w-full p-3 bg-gray-800 text-white border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"></textarea>
                                </div>
                                <div>
                                    <label className="block text-lg font-medium mb-1">Privacy:</label>
                                    <select value={privacy} onChange={(e) => setPrivacy(e.target.value)} required
                                        className="w-full p-3 bg-gray-800 text-white border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500">
                                        <option value="public">Public</option>
                                        <option value="private">Private</option>
                                    </select>
                                </div>
                                <div className="flex justify-center">
                                    <button type="submit"
                                        className="w-full py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 hover:scale-105 transition duration-200">
                                        Create Guild
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                <h2 className="text-2xl font-semibold my-6">All Guilds</h2>
                {error && <div className="text-red-500 mb-4">{error}</div>}
                <ul className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {guilds.map((guild) => (
                        <li key={guild.name} className="guild-item bg-gray-700 p-6 rounded-lg shadow-md hover:shadow-lg transition duration-200">
                            <h3 className="text-xl font-semibold">{guild.name}</h3>
                            <p className="text-gray-300">{guild.description}</p>
                            <p className="text-purple-400 mb-3">({guild.privacy})</p>
                            <p><FontAwesomeIcon icon={faPeopleGroup} /> {JSON.parse(guild.members).length}/50 players</p>

                            {JSON.parse(guild.members).length >= 50 ? 
                            <div className='w-full mt-4 py-2 px-4 rounded-lg bg-gray-500 cursor-not-allowed text-center'>
                                This guild is full        
                            </div>
                            :
                            <button 
                                onClick={() => joinGuild(guild.name)} 
                                className={`w-full mt-4 py-2 px-4 rounded-lg transition duration-200 ${
                                    requestedGuilds.includes(guild.name) ? 'bg-gray-500 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-500 hover:scale-105 text-white'
                                }`}
                                disabled={requestedGuilds.includes(guild.name)}
                            >
                                {requestedGuilds.includes(guild.name) ? "Requested" : "Join Guild"}
                            </button>
                            }
                        </li>
                    ))}
                </ul>

            </div>
        </div>
    );
};

export default GuildPage;
