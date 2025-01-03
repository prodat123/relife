import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import QuestDashboard from './QuestDashboard';
import Login from './Login';
import Signup from './SignUp';
import QuestList from './QuestList';
import AccountPage from './AccountPage';
import Navbar from './Navbar';
import IdleGame from './IdleGame';
import Leaderboard from './Leaderboard';
import Shop from './Shop';
import Enchantment from './Enchantment';
import HomePage from './HomePage';
import { useNavigate } from 'react-router-dom';

const App = () => {
    
    let user = null;

    // Safely parse user data from localStorage
    try {
        const storedUser = localStorage.getItem('user');
        user = storedUser ? JSON.parse(storedUser) : null;
    } catch (error) {
        console.warn('Failed to parse user data from localStorage:', error);
        user = null;
    }

    // Wrapper for protected routes
    const RequireAuth = ({ children }) => {
        return user ? children : <Navigate to="/login" />;
    };
    
    
    

    return (
        <div className="bg-gradient-to-b from-gray-900 to-gray-800 min-h-screen">
            <Router>
                {/* Navbar is visible only if the user is authenticated */}
                {user && <Navbar />}

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
                    <Route
                        path="/account/:userId"
                        element={
                            <RequireAuth>
                                <AccountPage id={user?.id} />
                            </RequireAuth>
                        }
                    />
                    <Route
                        path="/game"
                        element={
                            <RequireAuth>
                                <IdleGame />
                            </RequireAuth>
                        }
                    />
                    <Route
                        path="/leaderboard"
                        element={
                            <RequireAuth>
                                <Leaderboard />
                            </RequireAuth>
                        }
                    />
                    <Route
                        path="/shop"
                        element={
                            <RequireAuth>
                                <Shop />
                            </RequireAuth>
                        }
                    />

                    {/* Default Fallback Route */}
                    <Route
                        path="*"
                        element={<Navigate to={user ? '/dashboard' : '/login'} />}
                    />
                </Routes>
            </Router>
        </div>
    );
};

export default App;
