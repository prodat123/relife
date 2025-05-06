import { faBroadcastTower, faTowerCell, faTowerObservation, faLock, faCoins, faPerson, faUser, faQuestionCircle, faExclamation, faScroll, faHandshake, faTrophy, faShoppingCart, faBox, faChartLine, faLineChart, faDungeon, faBlog, faHandPaper, faPen, faGlasses, faBagShopping, faSuitcase, faMagic, faWandMagic, faWandSparkles, faWandMagicSparkles, faI, faIcicles, faInfoCircle, faSprout, faGem, faCogs, faBoxes, faCircle, faCircleNodes, faCheckCircle, faFlag, faFireAlt, faChessRook, faMedal, faAward, faCertificate, faRoad, faCodeBranch, faArrowUpRightDots, faDiamond } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React, { useState, useEffect, useContext, useMemo } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import config from '../config';
import { Tooltip } from 'react-tooltip'; // Corrected import for Tooltip
import LevelProgressBar from '../Account/LevelProgressBar';
import { FaDiscord, FaMedal, FaReadme } from 'react-icons/fa';
import { UserContext } from '../Account/UserContext';
import GoldDisplay from './GoldDisplay';
import ExperienceDisplay from './ExperienceDisplay';
import SpiritDisplay from './SpiritDisplay';

const Navbar = () => {
    const { accountDataRef } = useContext(UserContext);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false); // State to toggle the mobile menu
    const [accountData, setAccountData] = useState([]);
    const [dataLoaded, setDataLoaded] = useState(false);
    const [claimedMilestones, setClaimedMilestones] = useState([]);
    const [claimableMilestones, setClaimableMilestones] = useState(false);
    const [timeLeft, setTimeLeft] = useState(getTimeUntilNextUTC());
    const questsleft = localStorage.getItem('questsLeft');
    // const user = JSON.parse(localStorage.getItem('user'));
    // const userInitial = user?.username?.charAt(0).toUpperCase() || '?'; // Get the first letter of the username
    // const oldUpdates = localStorage.getItem("updatesData");
    const [newUpdateAvailable, setNewUpdateAvailable] = useState(false);

    const user = useMemo(() => JSON.parse(localStorage.getItem('user')), []);
    const userInitial = useMemo(() => user?.username?.charAt(0).toUpperCase() || '?', [user]);

    const oldUpdates = useMemo(() => localStorage.getItem("updatesData"), []);

    const perkMilestones = {
        strength: [20, 60, 150, 300, 1000, 2000],
        intelligence: [20, 60, 150, 300, 1000, 2000],
        endurance: [20, 60, 150, 300, 1000, 2000],
        bravery: [20, 60, 150, 300, 1000, 2000],
    };

    useEffect(() => {
        
        const interval = setInterval(() => {
            if (accountDataRef.current && !dataLoaded) {
                setAccountData(accountDataRef.current);
                // const playerMilestones = JSON.parse(accountDataRef.current.claimedMilestones) || [];
                // setClaimedMilestones(playerMilestones);
                setDataLoaded(true);
            }
        }, 100); // Small interval to wait for dataRef update
        
        return () => clearInterval(interval);
    }, [accountDataRef, dataLoaded]);

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
    
    
    useEffect(() => {
        const fetchUpdates = async () => {
            try {
                const response = await fetch("https://docs.google.com/spreadsheets/d/e/2PACX-1vQwRovdOlYXUfnyGbl3gajTGp8Z2CdymvwK2SxB7uys6IXi4RhNJ6BF7WyaSClvcCMJKN4elSgVh7o7/pub?gid=0&single=true&output=csv");
                if (!response.ok) {
                    throw new Error("Failed to fetch updates.");
                }
                const text = await response.text();
                const rows = text.split("\n").map((row) => row.split(","));
    
                if (text.length > 1) {
                    var stringText = JSON.stringify(text);
                    if(stringText !== oldUpdates){
                        console.log("It is indeed different");

                        setNewUpdateAvailable(true);
                    } else {
                        setNewUpdateAvailable(false);
                    }  
                    
                } 
            } catch (err) {
                console.error("Error fetching updates:", err);
            }
        };
    
        fetchUpdates();
            
    
    }, [oldUpdates]);
    
    useEffect(() => {
        const interval = setInterval(() => {
          setTimeLeft(getTimeUntilNextUTC());
        }, 1000);
    
        return () => clearInterval(interval);
    }, []);
    
    function getTimeUntilNextUTC() {
        const now = new Date();
        const nextUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 0, 0, 0)); // Next UTC midnight
        const diff = nextUTC - now;
    
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    
        return { hours, minutes, seconds };
    }
    
    const format = (n) => String(n).padStart(2, '0');

    const rank = calculateRank(calculateLevel(accountData?.experience).level);
    

    return (
        <>
            <nav className="bg-indigo-600 lg:bg-[#0d1420] text-white fixed shadow-md w-full z-[99999]">
                <div className="w-full mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        {/* Logo Section */}
                        <div className="lg:hidden md:hidden relative flex items-center hover:scale-105 transition-all duration-200">
                            <Link to="/updates" className="text-xl font-bold">
                                ReLIFE
                                {newUpdateAvailable && (<div className='bg-red-500 w-4 h-4 rounded-full text-sm flex items-center justify-center absolute bottom-0 right-[-20px]'><FontAwesomeIcon icon={faExclamation}/></div> )}

                            </Link>
                            
                        </div>
                        <SpiritDisplay />
                        <p className="text-sm text-cyan-300 font-semibold ml-1">
                            ({format(timeLeft.hours)}:{format(timeLeft.minutes)}:{format(timeLeft.seconds)})
                        </p>

                        {/* <div className='ml-auto text-cyan-300'>
                            <FontAwesomeIcon icon={faFireAlt} />
                            {console.log(accountData)}
                            <label className='font-semibold text-orange-500 ml-1 text-lg'>{spiritHealth}</label>
                        </div> */}
                        <span className={`
                            fa-layers fa-fw rounded-full font-bold uppercase tracking-wider text-3xl mx-4`}>
                                <FontAwesomeIcon
                                    icon={faDiamond}
                                    className={`${
                                        rank === "F-" ? "text-green-500"
                                        : rank === "F" ? "text-lime-500"
                                        : rank === "F+" ? "text-emerald-500"
                                        : rank === "D-" ? "text-teal-500"
                                        : rank === "D" ? "text-cyan-500"
                                        : rank === "D+" ? "text-sky-500"
                                        : rank === "C-" ? "text-blue-500"
                                        : rank === "C" ? "text-indigo-500"
                                        : rank === "C+" ? "text-violet-500"
                                        : rank === "B-" ? "text-purple-500"
                                        : rank === "B" ? "text-fuchsia-500"
                                        : rank === "B+" ? "text-pink-500"
                                        : rank === "A-" ? "text-rose-500"
                                        : rank === "A" ? "text-orange-500"
                                        : rank === "A+" ? "text-amber-500"
                                        : rank === "S-" ? "text-red-500"
                                        : rank === "S" ? "text-red-600"
                                        : rank === "S+" ? "text-red-700"
                                        : rank === "S++" ? "text-red-800"
                                        : rank === "Z" ? "text-black"
                                        : "text-gray-400"
                                    }`}
                                    />

                                <span className="fa-layers-text font-extrabold text-white" data-fa-transform="shrink-8">{calculateRank(calculateLevel(accountData?.experience).level)}</span>
                            </span>
                        {/* <div className='relative mx-2'>
                            <div className='flex items-center justify-center'>
                                <FontAwesomeIcon className='text-3xl text-yellow-400' icon={faCertificate} />
                                <div className='absolute text-indigo-600 font-bold'>{calculateRank(calculateLevel(accountData?.experience).level)}</div>
                            </div>
                        </div> */}
                        <div className='text-yellow-400 font-semibold lg:mr-0 hidden md:flex'>Lvl.{accountData ? calculateLevel(accountData?.experience).level : 0}</div>
                        
                        <ExperienceDisplay />

                        {/* <GoldDisplay /> */}
                        
                        <Link
                            to={`/account/${user?.id}`}
                            className="w-10 h-10 hidden ml-4 lg:flex md:flex items-center justify-center rounded-full bg-indigo-600 hover:bg-indigo-500 text-lg font-bold text-white"
                            data-tip="Your Account"
                        >
                            {userInitial}
                        </Link>

                        {/* Desktop Navigation Links */}
                        <div className="hidden drop-shadow-xl md:flex lg:flex flex-col space-y-4 md:space-y-2 items-start bg-[#0d1420] text-white w-[220px] h-full fixed top-0 left-0 p-4">
                            <Link to="/updates" className="relative text-xl font-bold tracking-wide mb-4 ml-3 w-full hover:scale-105 transition-all duration-200">
                                ReLIFE
                                {newUpdateAvailable && (<div className='bg-red-500 w-4 h-4 rounded-full text-sm flex items-center justify-center absolute bottom-0 right-[-20px]'><FontAwesomeIcon icon={faExclamation}/></div>)}
                            </Link>
                            
                            <Link
                                to="/dashboard"
                                className="relative w-full px-3 py-2 rounded-md text-sm font-medium hover:bg-indigo-600 text-left animate-all duration-200 hover:scale-105"
                                data-tip="Go to Quests"
                            >
                                <FontAwesomeIcon icon={faScroll} className="mr-2" />
                                Quests 
                                {Number(questsleft) > 0 && (
                                    <div className='absolute bottom-2 right-[75px]'>
                                        <div className='bg-red-500 w-[20px] h-[20px] font-bold rounded-full text-sm flex items-center justify-center '>
                                            {questsleft}
                                        </div>
                                    </div>
                                    )}
                            </Link>

                            {/* <Link
                                to="/paths"
                                className="w-full px-3 py-2 rounded-md text-sm font-medium hover:bg-indigo-600 text-left animate-all duration-200 hover:scale-105"
                                data-tip="Go to Paths"
                            >
                                <FontAwesomeIcon icon={faArrowUpRightDots} className="mr-2" />
                                Paths
                            </Link> */}

                            <Link
                                to="/stats"
                                className="w-full px-3 py-2 rounded-md text-sm font-medium hover:bg-indigo-600 text-left animate-all duration-200 hover:scale-105"
                                data-tip="Stats"
                            >
                                <FontAwesomeIcon icon={faChartLine} className="mr-2" />
                                Progress
                            </Link>
                            
                            
                            
                        
                            
                            <Link
                                to="/inventory"
                                className="w-full px-3 py-2 rounded-md text-sm font-medium hover:bg-indigo-600 text-left animate-all duration-200 hover:scale-105"
                                data-tip="Inventory"
                            >
                                <FontAwesomeIcon icon={faBox} className="mr-2" />
                                Inventory
                            </Link>
                            {/* <Link
                                to="/shop"
                                className="w-full px-3 py-2 rounded-md text-sm font-medium hover:bg-indigo-500 text-left animate-all duration-200 hover:scale-105"
                                data-tip="Visit the Shop"
                            >
                                <FontAwesomeIcon icon={faShoppingCart} className="mr-2" />
                                Shop
                            </Link> */}
                            
                            {/* <Link
                                to="/spells"
                                className="w-full px-3 py-2 rounded-md text-sm font-medium hover:bg-indigo-500 text-left animate-all duration-200 hover:scale-105"
                                data-tip="Inventory"
                            >
                                <FontAwesomeIcon icon={faWandSparkles} className="mr-2" />
                                Spells
                            </Link> */}
                            {/* {calculateLevel(accountData?.experience).level < 11 ? 
                                <div
                                    className="relative w-full px-3 py-2 rounded-md text-sm font-medium cursor-not-allowed text-gray-400"
                                    data-tip="F Rank Required"
                                >
                                    <span>Perks</span>
                                    <div className="absolute inset-0 p-2 text-center bg-gray-800 bg-opacity-50 rounded-md">
                                        <FontAwesomeIcon className="text-white text-xl mr-2" icon={faLock} />
                                        <span className="text-white text-sm mt-2">Rank F</span>
                                    </div>
                                </div>
                                :
                                <Link
                                    to="/perks"
                                    className="w-full px-3 py-2 rounded-md text-sm flex font-medium hover:bg-indigo-500 text-left animate-all duration-200 hover:scale-105"
                                    data-tip="Perks"
                                >
                                    <FontAwesomeIcon icon={faCircleNodes} className='mr-2'/>
                                    Perks
                                    {claimableMilestones && (<div className='bg-red-500 w-4 h-4 rounded-full ml-2 text-sm flex items-center justify-center'><FontAwesomeIcon icon={faExclamation}/></div>)}
                                </Link>
                            }

                            {calculateLevel(accountData?.experience).level < 21 ? 
                                <div
                                    className="relative w-full px-3 py-2 rounded-md text-sm font-medium cursor-not-allowed text-gray-400"
                                    data-tip="F+ Rank Required"
                                >
                                    <span>Garden</span>
                                    <div className="absolute inset-0 p-2 text-center bg-gray-800 bg-opacity-50 rounded-md">
                                        <FontAwesomeIcon className="text-white text-xl mr-2" icon={faLock} />
                                        <span className="text-white text-sm mt-2">Rank F+</span>
                                    </div>
                                </div>
                                :
                                <Link
                                    to={`/garden/${user?.id}`}
                                    className="w-full px-3 py-2 rounded-md text-sm font-medium hover:bg-indigo-500 text-left animate-all duration-200 hover:scale-105"
                                    data-tip="Garden"
                                >
                                    <FontAwesomeIcon icon={faSprout} className="mr-2" />
                                    Garden
                                </Link>
                            } */}

                            <Link
                                to="/leaderboard"
                                className="w-full px-3 py-2 rounded-md text-sm font-medium hover:bg-indigo-600 text-left animate-all duration-200 hover:scale-105"
                                data-tip="Leaderboard"
                            >
                                <FontAwesomeIcon icon={faTrophy} className="mr-2" />
                                Leaderboard
                            </Link>

                            {/* {calculateLevel(accountData?.experience).level < 31 ? 
                                <div
                                    className="relative w-full px-3 py-2 rounded-md text-sm font-medium cursor-not-allowed text-gray-400"
                                    data-tip="D- Rank Required"
                                >
                                    <span>Guilds</span>
                                    <div className="absolute inset-0 p-2 text-center bg-gray-800 bg-opacity-50 rounded-md">
                                        <FontAwesomeIcon className="text-white text-xl mr-2" icon={faLock} />
                                        <span className="text-white text-sm mt-2">Rank D-</span>
                                    </div>
                                </div>
                                :
                                <Link
                                    to={`/guilds`}
                                    className="w-full px-3 py-2 rounded-md text-sm font-medium hover:bg-indigo-500 text-left animate-all duration-200 hover:scale-105"
                                    data-tip="Guilds"
                                >
                                    <FontAwesomeIcon icon={faFlag} className="mr-2" />
                                    Guilds
                                </Link>
                        
                            } */}

                            
                            
                            
                            {/* <Link
                                to={`/pomodoro`}
                                className="w-full px-3 py-2 rounded-md text-sm font-medium bg-gray-900 hover:bg-gray-800 text-left animate-all duration-200 hover:scale-105"
                                data-tip="Enter the Tower"
                            >
                                <FontAwesomeIcon icon={faChessRook} /> Enter the Tower
                            </Link> */}
                            <div className="flex-grow"></div>
                           
                            {/* <Link
                                to={`/blogs`}
                                className="w-full px-3 py-2 rounded-md rounded-md hover:bg-indigo-500 text-sm font-medium text-white"
                                data-tip="Your Account"
                            >
                                <FontAwesomeIcon icon={faGlasses} /> Blogs
                            </Link> */}
                            <Link
                                to={`/about`}
                                className="w-full px-3 py-2 rounded-md rounded-md hover:bg-indigo-600 text-sm font-medium text-white animate-all duration-200 hover:scale-105"
                                data-tip="Your Account"
                            >
                                <FontAwesomeIcon icon={faInfoCircle} /> About Us
                            </Link>
                            <Link
                                to={`/help`}
                                className="w-full px-3 py-2 rounded-md rounded-md hover:bg-indigo-600 text-sm font-medium text-white animate-all duration-200 hover:scale-105"
                                data-tip="Your Account"
                            >
                                <FontAwesomeIcon icon={faQuestionCircle} /> Help
                            </Link>
                            <Link
                                to={`/account/${user?.id}`}
                                className="w-full px-3 py-2 rounded-md rounded-md hover:bg-indigo-600 text-sm font-medium text-white animate-all duration-200 hover:scale-105"
                                data-tip="Your Account"
                            >
                                <FontAwesomeIcon icon={faUser} /> {user?.username} 
                            </Link>
                            
                        </div>


                        {/* Mobile Menu Button */}
                        <div className="md:hidden flex items-center">
                            <button
                                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                                className="text-white focus:outline-none focus:ring-2 focus:ring-white"
                                data-tip="Open Mobile Menu" // Tooltip for Mobile Menu Button
                            >
                                <svg
                                    className="h-6 w-6"
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M4 6h16M4 12h16m-7 6h7"
                                    />
                                </svg>
                            </button>
                        </div>

                        {/* Fixed Bottom Navigation Bar */}
                        <div className="md:hidden fixed bottom-0 left-0 z-[9999] w-full bg-gray-900 text-white border-t border-gray-700 grid grid-cols-3 py-2">
                            {/* <Link to="/dashboard" className="flex flex-col items-center justify-center">
                                <FontAwesomeIcon icon={faScroll} className="text-lg" />
                                <span className="text-xs">Quests</span>
                            </Link> */}
                            <Link to="/dashboard" className="flex flex-col items-center justify-center">
                                <FontAwesomeIcon icon={faScroll} className="text-lg" />
                                <span className="text-xs">Quests</span>
                            </Link>
                            {/* <Link
                                to="/paths"
                                className="flex flex-col items-center justify-center"
                                data-tip="Go to Quests"
                            >
                                <FontAwesomeIcon icon={faArrowUpRightDots} className="text-lg" />
                                <span className='text-xs'>Paths</span>
                            </Link> */}
                            <Link to="/stats" className="flex flex-col items-center justify-center">
                                <FontAwesomeIcon icon={faChartLine} className="text-lg" />
                                <span className="text-xs">Stats</span>
                            </Link>
                            {/* <Link
                                to="/leaderboard"
                                className="flex flex-col items-center justify-center"
                            >
                                <FontAwesomeIcon icon={faTrophy} className="text-lg" />
                                <span className='text-xs'>Board</span>
                            </Link> */}
                            
                            
                            <Link to={`/account/${user?.id}`} className="flex flex-col items-center justify-center">
                                <FontAwesomeIcon icon={faUser} className="text-lg" />
                                <span className="text-xs">Account</span>
                            </Link>
                            
                        </div>

                    </div>
                </div>

                {/* Mobile Navigation Menu */}
                {isMobileMenuOpen && (
                    <div className="md:hidden bg-indigo-700">
                    <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
                        
                        {/* Mobile Version of the Leaderboard Link */}
                            <Link
                                to="/leaderboard"
                                className="block px-3 py-2 rounded-md text-base font-medium hover:bg-indigo-500"
                                data-tip="Leaderboard" // Tooltip for Leaderboard
                            >
                                <FontAwesomeIcon icon={faTrophy} className="mr-2" /> Leaderboard
                            </Link>

                            
                        
                            {/* <div
                                className="relative px-3 py-2 rounded-md text-md font-medium cursor-not-allowed text-gray-400"
                                data-tip="Level 3 required" // Tooltip for Level 5 restriction
                            >
                                <span>Leaderboard</span>
                                <div className="absolute inset-0 p-2 bg-gray-800 bg-opacity-50 rounded-md">
                                    <FontAwesomeIcon className="text-white text-xl mr-2" icon={faLock} />
                                    <span className="text-white text-xs mt-2">Level 3</span>
                                </div>
                            </div> */}
                        
                        {/* <Link
                            to={"/spells"}
                            className="block px-3 py-2 rounded-md text-base font-medium hover:bg-indigo-500"
                            data-tip="Spells" // Tooltip for Account
                        >
                            <FontAwesomeIcon icon={faWandSparkles} className="mr-2" /> Spells
                        </Link> */}
                        <Link
                            to={"/inventory"}
                            className="block px-3 py-2 rounded-md text-base font-medium hover:bg-indigo-500"
                            data-tip="Inventory" // Tooltip for Account
                        >
                            <FontAwesomeIcon icon={faBox} className="mr-2" /> Inventory
                        </Link>
                        {/* {calculateLevel(accountData?.experience).level < 11 ? 
                            <div
                                className="relative w-full px-3 py-2 rounded-md text-base font-medium cursor-not-allowed text-gray-400"
                                data-tip="F Rank Required"
                            >
                                <span>Perks</span>
                                <div className="absolute inset-0 p-2 text-center bg-gray-800 bg-opacity-50 rounded-md">
                                    <FontAwesomeIcon className="text-white text-xl mr-2" icon={faLock} />
                                    <span className="text-white text-sm mt-2">Rank F</span>
                                </div>
                            </div>
                            :
                            <Link
                                to="/perks"
                                className="block px-3 py-2 rounded-md text-base font-medium hover:bg-indigo-500"
                                data-tip="Perks"
                            >
                                <FontAwesomeIcon icon={faCircleNodes} className='mr-2'/>
                                Perks
                                {claimableMilestones && (<div className='bg-red-500 w-4 h-4 rounded-full ml-2 text-sm flex items-center justify-center'><FontAwesomeIcon icon={faExclamation}/></div>)}
                            </Link>
                        }

                        {calculateLevel(accountData?.experience).level < 21 ? 
                            <div
                                className="relative w-full px-3 py-2 rounded-md text-base font-medium cursor-not-allowed text-gray-400"
                                data-tip="F+ Rank Required"
                            >
                                <span>Garden</span>
                                <div className="absolute inset-0 p-2 text-center bg-gray-800 bg-opacity-50 rounded-md">
                                    <FontAwesomeIcon className="text-white text-xl mr-2" icon={faLock} />
                                    <span className="text-white text-sm mt-2">Rank F+</span>
                                </div>
                            </div>
                            :
                            <Link
                                to={`/garden/${user?.id}`}
                                className="block px-3 py-2 rounded-md text-base font-medium hover:bg-indigo-500"
                                data-tip="Garden"
                            >
                                <FontAwesomeIcon icon={faSprout} className="mr-2" />
                                Garden
                            </Link>
                        }

                        {calculateLevel(accountData?.experience).level < 31 ? 
                            <div
                                className="relative w-full px-3 py-2 rounded-md text-base font-medium cursor-not-allowed text-gray-400"
                                data-tip="D- Rank Required"
                            >
                                <span>Guilds</span>
                                <div className="absolute inset-0 p-2 text-center bg-gray-800 bg-opacity-50 rounded-md">
                                    <FontAwesomeIcon className="text-white text-xl mr-2" icon={faLock} />
                                    <span className="text-white text-sm mt-2">Rank D-</span>
                                </div>
                            </div>
                            :
                            <Link
                                to={`/guilds`}
                                className="block px-3 py-2 rounded-md text-base font-medium hover:bg-indigo-500"
                                data-tip="Guilds"
                            >
                                <FontAwesomeIcon icon={faFlag} className="mr-2" />
                                Guilds
                            </Link>
                    
                        } */}
                        {/* <Link
                            to={"/blogs"}
                            className="block px-3 py-2 rounded-md text-base font-medium hover:bg-indigo-500"
                            data-tip="Blogs" // Tooltip for Enter the Tower in mobile menu
                        >
                            <FontAwesomeIcon icon={faGlasses} /> Blogs
                        </Link> */}

                        
                        
                        

                        

                        

                        <div className="flex items-center justify-center w-full px-2 grid grid-cols-5">
                            <div className='text-yellow-400 font-semibold'>Lvl.{accountData ? calculateLevel(accountData?.experience).level : 0}</div>

                            <div className="relative col-span-2 h-8">

                                {/* Progress Bar Overlay */}
                                <div className="absolute top-0 left-0 w-full h-full flex items-center z-10">
                                    <div className="w-full bg-gray-200 h-4 overflow-hidden rounded-md border border-1 border-purple-200">
                                        <p className="absolute text-xs text-black px-2">XP Cap: {Math.floor(calculateLevel(accountData?.experience).xpForNextLevel - calculateLevel(accountData.experience).remainingXP)}</p>

                                        <div
                                            className="bg-gradient-to-r from-blue-300 to-blue-500 h-4 rounded-md"
                                            style={{ width: `${(calculateLevel(accountData?.experience).remainingXP / calculateLevel(accountData.experience).xpForNextLevel) * 100}%` }}
                                        >

                                        </div>
                                    </div>
                                </div>

                            </div>
                            
                            <GoldDisplay />

                            <Link className='flex items-center justify-center cursor-pointer text-sm' to={'/help'}><FontAwesomeIcon className='ml-1' icon={faQuestionCircle} /></Link>
                            <Link className='flex items-center justify-center cursor-pointer text-sm' to={'/about'}><FontAwesomeIcon className='ml-1' icon={faInfoCircle} /></Link>
                        </div>
                        
                    </div>
                </div>
                )}


                {/* React Tooltip component */}
                <Tooltip place="top" effect="solid" />
            </nav>
            
        </>
        
    );
};

export default Navbar;
