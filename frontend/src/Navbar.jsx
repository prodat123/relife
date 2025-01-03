import { faBroadcastTower, faTowerCell, faTowerObservation } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const Navbar = () => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false); // State to toggle the mobile menu
    const user = JSON.parse(localStorage.getItem('user'));
    const userInitial = user?.username?.charAt(0).toUpperCase() || '?'; // Get the first letter of the username

    return (
        <nav className="bg-indigo-600 text-white shadow-md">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Logo Section */}
                    <div className="flex items-center">
                        <Link to="/" className="text-2xl font-bold tracking-wide">
                            Re:LIFE
                        </Link>
                    </div>

                    {/* Desktop Navigation Links */}
                    <div className="hidden md:flex space-x-4 items-center">
                        <Link
                            to="/dashboard"
                            className="px-3 py-2 rounded-md text-sm font-medium hover:bg-indigo-500"
                        >
                            Quests
                        </Link>

                        <Link
                            to="/leaderboard"
                            className="px-3 py-2 rounded-md text-sm font-medium hover:bg-indigo-500"
                        >
                            Leaderboard
                        </Link>

                        <Link
                            to="/shop"
                            className="px-3 py-2 rounded-md text-sm font-medium hover:bg-indigo-500"
                        >
                            Shop
                        </Link>

                        <Link
                            to={`/game`}
                            className="px-3 py-2 rounded-md text-sm font-medium bg-gray-900 hover:bg-gray-800"
                        >
                            <FontAwesomeIcon className='text-indigo-400' icon={faTowerObservation} /> Enter the Tower
                        </Link>

                        <Link
                            to={`/account/${user?.id}`}
                            className="w-10 h-10 flex items-center justify-center rounded-full bg-indigo-800 hover:bg-indigo-700 text-xl font-bold text-white"
                        >
                            {userInitial}
                        </Link>
                    </div>

                    {/* Mobile Menu Button */}
                    <div className="md:hidden flex items-center">
                        <button
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            className="text-white focus:outline-none focus:ring-2 focus:ring-white"
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
                </div>
            </div>

            {/* Mobile Navigation Menu */}
            {isMobileMenuOpen && (
                <div className="md:hidden bg-indigo-700">
                    <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
                        <Link
                            to="/dashboard"
                            className="block px-3 py-2 rounded-md text-base font-medium hover:bg-indigo-500"
                            onClick={() => setIsMobileMenuOpen(false)}
                        >
                            Quests
                        </Link>
                        <Link
                            to="/leaderboard"
                            className="block px-3 py-2 rounded-md text-base font-medium hover:bg-indigo-500"
                            onClick={() => setIsMobileMenuOpen(false)}
                        >
                            Leaderboard
                        </Link>
                        <Link
                            to="/shop"
                            className="block px-3 py-2 rounded-md text-base font-medium hover:bg-indigo-500"
                        >
                            Shop
                        </Link>
                        <Link
                            to={`/account/${user?.id}`}
                            className="block px-3 py-2 rounded-md text-base font-medium hover:bg-indigo-500"
                            onClick={() => setIsMobileMenuOpen(false)}
                        >
                            Account
                        </Link>
                        <Link
                            to={`/game`}
                            className="block px-3 py-2 rounded-md text-base font-medium bg-gray-900 hover:bg-gray-800"
                            onClick={() => setIsMobileMenuOpen(false)}
                        >
                            ✨ Enter the Tower
                        </Link>
                    </div>
                </div>
            )}
        </nav>
    );
};

export default Navbar;
