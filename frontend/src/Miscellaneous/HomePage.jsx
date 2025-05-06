import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaDiscord } from 'react-icons/fa';
import { faEye } from '@fortawesome/free-solid-svg-icons';
import config from '../config';
import axios from 'axios';

function HomePage() {
    const navigate = useNavigate();
    const [stats, setStats] = useState({ totalUsers: 0, totalParticipants: 0 });


    const handleHeroButtonClick = () => {
        navigate('/signup');
    };

    const handleLogin = () => {
        navigate('/login');
    };

    var user = null;

    try {
        const storedUser = localStorage.getItem('user');
        user = storedUser ? JSON.parse(storedUser) : null;
    } catch (error) {
        console.warn('Failed to parse user data from localStorage:', error);
        user = null;
    }

    useEffect(() => {
        if (user) {
            navigate(`/dashboard`);
        }
    }, [user]);

    const joinDiscord = async () => {
        window.open("https://discord.gg/5Pzp4nMxkF", "_blank", "noopener,noreferrer");
    };

    useEffect(() => {
        const fetchStats = async () => {
          try {
            const response = await axios.get(`${config.backendUrl}/user-stats`); // adjust to your backend URL
            console.log(response.data);
            setStats(response.data);
          } catch (error) {
            console.error("Error fetching stats:", error);
          }
        };
    
        fetchStats();
    }, []);

    const features = [
        {
          title: "IRL Questing",
          image: "/homepage/quest-feature.png",
          description:
            "Select and complete real-life daily quests to gain XP, stats, and get stronger to face foes in the tower.",
        },
        {
          title: "Scheduling Quests",
          image: "/homepage/scheduled-quests.png",
          description:
            "Schedule when you want to do your quests so that they automatically appear on your active quest list.",
        },
        {
          title: "Player Shop",
          image: "/homepage/player-shop.png",
          description:
            "Spend the gold you gain from the Tower to buy new items to progress even further!",
        },
        {
          title: "The Tower",
          image: "/homepage/tower-feature.png",
          description:
            'Test your real-life progress by climbing the "Tower of Rebirth" and face tough monsters and bosses.',
        },
        {
          title: "Leaderboard",
          image: "/homepage/leaderboard.png",
          description:
            "Compete with other players to be the best version of yourselves.",
        },
        {
          title: "Progress Tracker",
          image: "/homepage/player-progress.png",
          description:
            "Track your weekly stat progress and find out if you are on track with the rest of the world.",
        },
        {
          title: "Player Guilds",
          image: "/homepage/guilds.png",
          description:
            "Join groups to progress together with friends and family to keep each other accountable.",
        },
        {
          title: "Player Accountability",
          image: "/homepage/player-info.png",
          description:
            "If you miss multiple productive days in a row, you will be forced to restart your account and start from zero again.",
        },
    ];

    return (
        <>
            <div className="flex flex-col items-center justify-center h-screen bg-cover bg-center relative" style={{ backgroundImage: "url('/homepage/homepage-background.jpg')" }}>
                {/* Overlay */}
                <div className="absolute inset-0 bg-black bg-opacity-70"></div>

                {/* Content */}
                <div className="text-center text-white z-10 p-8 flex items-center flex-col justify-center">
                    <img src={'/sprites/Logo.png'} className="pixel-art w-56 h-56 mb-4" alt="Logo"></img>
                    <h1 className="text-5xl md:text-6xl font-extrabold mb-4 uppercase tracking-widest">
                        Awaken, Player
                    </h1>
                    <p className="text-lg md:text-xl font-light max-w-xl mx-auto font-semibold">
                        Embrace Real Life with ReLIFE
                    </p>
                    <p className="mb-6 text-md font-light max-w-xl mx-auto">
                        Beyond this screen lies an adventure to rebuild your life. Will you rise to the challenge?
                    </p>
                    <div className="flex flex-col items-center w-full justify-center">
                        <button
                            onClick={handleHeroButtonClick}
                            className="px-8 py-3 my-2 bg-gradient-to-r from-purple-700 to-indigo-900 hover:from-purple-500 hover:to-indigo-700 text-white font-bold text-lg rounded-md shadow-lg hover:shadow-2xl transition-transform transform hover:scale-105"
                        >
                            Begin Your Journey
                        </button>
                        <p>- or -</p>
                        <button
                            onClick={handleLogin}
                            className="px-8 py-3 my-2 bg-gradient-to-r from-purple-700 to-indigo-900 hover:from-purple-500 hover:to-indigo-700 text-white font-bold text-lg rounded-md shadow-lg hover:shadow-2xl transition-transform transform hover:scale-105"
                        >
                            Log In
                        </button>
                        {/* <button
                            onClick={joinDiscord}
                            className="flex items-center justify-center gap-2 px-4 py-2 my-2 bg-[#5865F2] text-white font-medium text-lg rounded-md shadow-md hover:shadow-lg transition-transform transform hover:scale-105"
                        >
                            <FaDiscord size={24} />
                            Join Our Community
                        </button> */}
                    </div>
                </div>
            </div>

            <div className="w-full h-screen flex items-center bg-gradient-to-b from-black via-gray-900 to-gray-950 py-16 px-6 text-center relative overflow-hidden">
                {/* Magical purple glow in the background */}
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-[500px] h-[500px] bg-purple-600 opacity-20 rounded-full blur-3xl z-0" />

                <div className="relative z-10 max-w-4xl mx-auto">
                    <h2 className="text-3xl md:text-6xl font-bold text-purple-400 mb-4 drop-shadow-md">
                    {stats.totalUsers?.toLocaleString()}
                    </h2>
                    <h3 className="text-lg md:text-2xl text-white mb-4">
                    Adventurers Have Joined!
                    </h3>
                    <p className="text-gray-300 text-lg max-w-xl mx-auto">
                    The realm is alive! Join the journey and level up with the community.
                    </p>

                    <div className="mt-10 flex justify-center gap-6 flex-wrap">
                    <div className="bg-gray-800/80 backdrop-blur-md p-6 rounded-xl shadow-lg transition transform">
                        <p className="text-4xl font-bold text-green-400">
                        {(stats.totalParticipants + 20000)?.toLocaleString()}
                        </p>
                        <p className="text-sm text-gray-400 mt-1">Total Quests Completed</p>
                    </div>
                    </div>
                </div>
            </div>



            <div className="relative w-full h-screen bg-gray-950 overflow-hidden">
                {/* Subtle background glow orb */}
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-purple-800 opacity-10 blur-2xl rounded-full z-0" />

                {/* Background image */}
                <div
                    className="absolute inset-0 w-full h-full z-0"
                    style={{
                    backgroundImage: "url('/sprites/ourvision.png')",
                    backgroundRepeat: "no-repeat",
                    backgroundSize: "contain", // ← ensures the whole image fits without being cropped
                    backgroundPosition: "center",
                    opacity: 0.1,
                    }}
                ></div>

                {/* Content on top */}
                <div className="relative z-10 text-center text-white py-16 px-6 h-full flex flex-col justify-center">
                    <div className="container mx-auto">
                    <h2 className="text-3xl md:text-5xl font-semibold mb-6 tracking-wider text-purple-200">
                        Our Vision
                    </h2>

                    <div className="max-w-2xl mx-auto text-lg md:text-xl font-light leading-relaxed text-gray-300">
                        <p>
                        We envision a world where games do more than entertain — where they{" "}
                        <span className="text-white font-medium">inspire growth</span>,{" "}
                        <span className="text-white font-medium">encourage better habits</span>, and{" "}
                        <span className="text-white font-medium">empower communities</span>.
                        </p>
                    </div>
                    </div>
                </div>
            </div>



            {/* About Us Section */}
            <section className="py-12 w-full flex items-center bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950 py-16 px-6 text-center relative overflow-hidden">
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-purple-800 opacity-10 blur-2xl rounded-full z-0" />

                <div className="container mx-auto px-6">
                    <h2 className="text-3xl md:text-5xl font-semibold text-center text-white mb-6 tracking-wider text-purple-200">
                        Our Features
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-center px-4">
                        {features.map((feature, idx) => (
                        <div
                            key={idx}
                            className="flex flex-col items-center p-4 bg-gray-800 rounded-md shadow-lg transition duration-300"
                        >
                            <img
                            src={feature.image}
                            alt={feature.title}
                            className="w-full h-40 object-cover mb-4 rounded-md"
                            />
                            <h3 className="text-lg font-semibold text-purple-400 mb-2">
                            {feature.title}
                            </h3>
                            <p className="text-sm text-gray-300">{feature.description}</p>
                        </div>
                        ))}
                    </div>
                </div>
            </section>


        </>
    );
}

export default HomePage;
