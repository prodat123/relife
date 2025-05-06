import React, { useContext, useEffect, useState } from 'react';
import { Routes, Route, Navigate, useLocation, matchPath } from 'react-router-dom';
import QuestDashboard from './Quests/QuestDashboard';
import Login from './Authentication/Login';
import Signup from './Authentication/SignUp';
import AccountPage from './Account/AccountPage';
import Navbar from './Miscellaneous/Navbar';
import IdleGame from './Game/IdleGame';
import Leaderboard from './Leaderboard/Leaderboard';
import Shop from './Shop/Shop';
import HomePage from './Miscellaneous/HomePage';
import axios from 'axios';
import config from './config';
import Inventory from './Inventory/Inventory';
import HelpPage from './Miscellaneous/HelpPage';
import UpdatesPage from './Miscellaneous/UpdatesPage';
import VowPage from './Goals/GoalsPage';
import StatsPage from './Account/StatsPage';
import BlogsPage from './Miscellaneous/BlogsPage';
import SpellsPage from './Spells/SpellsPage';
import { UserContext } from './Account/UserContext';
import AboutUs from './Miscellaneous/AboutUs';
import Garden from './Garden/Garden';
import PerkUnlockSystem from './Account/PerkUnlockSystem';
import GuildPage from './Guilds/GuildPage';
import ShadowRealmPopup from './Miscellaneous/ShadowRealmPopup';
import PomodoroSystem from './Game/PomodoroSystem';
import PathsPage from './Paths/PathsPage';

const App = () => {
    const { accountDataRef, fetchAccountData } = useContext(UserContext);
    const [dataLoaded, setDataLoaded] = useState(false); 
    const [accountData, setAccountData] = useState({});

    const [level, setlevel] = useState(null);
    const userId = JSON.parse(localStorage.getItem('user'))?.id;
    const [user, setUser] = useState([]);
    const [isSessionChecked, setIsSessionChecked] = useState(false);  // Prevent infinite loop
    const [stage, setStage] = useState(0);
    const towerId = localStorage.getItem('towerId');

    const location = useLocation();

    const hiddenNavbarRoutes = ['/', '/login', '/signup', '/tower/:duration'];


    const [showShadowPopup, setShowShadowPopup] = useState(false);

    useEffect(() => {
        fetchAccountData(userId);
    }, [userId]);

    useEffect(() => {
        const interval = setInterval(() => {
            if (accountDataRef.current && !dataLoaded) {
            setAccountData(accountDataRef.current);
            setDataLoaded(true);
            }
        }, 300); // Small interval to wait for dataRef update
        
        return () => clearInterval(interval);
    }, [accountDataRef, dataLoaded]);

    // Function to calculate user level based on experience
    useEffect(() => {
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
        setlevel(calculateLevel(accountData?.experience).level);
    }, [accountData])
    


    

    // Wrapper for protected routes
    const RequireAuth = ({ children }) => {
        return userId ? children : <Navigate to="/login" />;
    };

    useEffect(() => {
        if (accountData && accountData.spiritHealth === 0) {
            setShowShadowPopup(true);
        }
    }, [accountData]);
    

    const isHidden = hiddenNavbarRoutes.some((route) =>
        matchPath({ path: route, end: true }, location.pathname)
    );
    
    // Notification.requestPermission().then(permission => {
    //     if (permission === "granted") {
    //       new Notification("Title", {
    //         body: "Here's a push notification!",
    //         icon: "/icon.png"
    //       });
    //     }
    // });
      

    
    

    return (
        <div className="bg-gray-900 min-h-screen">
                {/* Navbar is visible only if the user is authenticated */}

                {!isHidden && accountData && <Navbar />}

                {showShadowPopup && (
                    <ShadowRealmPopup
                        userId={userId}
                        onClose={() => setShowShadowPopup(false)}
                    />
                )}

                {/* {location.pathname !== "/game" && (<IdleGame isPersistent={true} stage={stage} />)} */}
               
                <div className={`${!isHidden && 'py-16 pb-32'}`}>
                    <Routes>
                        {/* Public Routes */}
                        <Route path="/" element={<HomePage />} />
                        <Route path="/login" element={<Login />} />
                        <Route path="/signup" element={<Signup />} />


                        {/* Protected Routes */}
                        <Route
                            path="/dashboard"
                            element={
                                <RequireAuth>
                                    <QuestDashboard />
                                </RequireAuth>
                            }
                        />
                        {/* <Route
                            path="/vows"
                            element={
                                <RequireAuth>
                                    <VowPage />
                                </RequireAuth>
                            }
                        /> */}
                        <Route
                            path="/account/:userId"
                            element={
                                <RequireAuth>
                                    <AccountPage id={userId} />
                                </RequireAuth>
                            }
                        />
                        {/* <Route
                            path="/garden/:userId"
                            element={
                                <RequireAuth>
                                    <Garden id={userId} />
                                </RequireAuth>
                            }
                        />
                        <Route
                            path="/pomodoro"
                            element={
                                <RequireAuth>
                                    <PomodoroSystem />
                                </RequireAuth>
                            }
                        />
                        
                        <Route
                            path="/tower/:duration"
                            element={
                                <RequireAuth>
                                    <IdleGame />
                                </RequireAuth>
                            }
                        /> */}
                        <Route
                            path="/leaderboard"
                            element={
                                
                                <RequireAuth>
                                    <Leaderboard userId={userId}/>
                                </RequireAuth>
                                
                            }
                        />
                        {/* <Route
                            path="/shop"
                            element={
                                <RequireAuth>
                                    <Shop />
                                </RequireAuth>
                            }
                        /> */}

                        <Route
                            path="/inventory"
                            element={
                                <RequireAuth>
                                    <Inventory userId={userId}/>
                                </RequireAuth>
                            }
                        />

                        <Route
                            path="/stats"
                            element={
                                <RequireAuth>
                                    <StatsPage userId={userId}/>
                                </RequireAuth>
                            }
                        />
{/* 
                        <Route
                            path="/perks"
                            element={
                                <RequireAuth>
                                    <PerkUnlockSystem />
                                </RequireAuth>
                            }
                        /> */}

                        <Route
                            path="/help"
                            element={
                                <RequireAuth>
                                    <HelpPage />
                                </RequireAuth>
                            }
                        />
                        <Route
                            path="/updates"
                            element={
                                <RequireAuth>
                                    <UpdatesPage />
                                </RequireAuth>
                            }
                        />
{/* 
                        <Route
                            path="/blogs"
                            element={
                                <RequireAuth>
                                    <BlogsPage />
                                </RequireAuth>
                            }
                        /> */}

                        <Route
                            path="/about"
                            element={
                                <RequireAuth>
                                    <AboutUs />
                                </RequireAuth>
                            }
                        />

                        {/* <Route
                            path="/spells"
                            element={
                                <RequireAuth>
                                    <SpellsPage />
                                </RequireAuth>
                            }
                        /> */}

                        <Route
                            path="/guilds"
                            element={
                                <RequireAuth>
                                    <GuildPage />
                                </RequireAuth>
                            }
                        />

                        <Route
                            path="/paths"
                            element={
                                <RequireAuth>
                                    <PathsPage />
                                </RequireAuth>
                            }
                        />

                        
                        {/* Default Fallback Route */}
                        <Route
                            path="*"
                            element={<Navigate to={accountData ? '/dashboard' : '/login'} />}
                        />
                    </Routes>
                </div>
        </div>
    );
};

export default App;
