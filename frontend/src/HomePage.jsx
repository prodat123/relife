import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function HomePage() {
    const navigate = useNavigate();
    const handleHeroButtonClick = () => {
        navigate('/signup');
    };

    const handleLogin = () => {
        navigate('/login');
    }

    var user = null;

    try {
        const storedUser = localStorage.getItem('user');
        user = storedUser ? JSON.parse(storedUser) : null;
    } catch (error) {
        console.warn('Failed to parse user data from localStorage:', error);
        user = null;
    }

    useEffect(() => {
        if(user){
           navigate(`/account/${user.id}`);
        }
    }, [user])

    return (
        <div className="flex items-center justify-center h-screen bg-[url('https://images.unsplash.com/photo-1542831371-29b0f74f9713')] bg-cover bg-center relative">
        {/* Overlay */}
        <div className="absolute inset-0 bg-black bg-opacity-70"></div>
        
        {/* Content */}
        <div className="text-center text-white z-10 p-8">
            <h1 className="text-5xl md:text-6xl font-extrabold mb-4 uppercase tracking-widest">
            Awaken, Player
            </h1>
            <p className="mb-6 text-lg md:text-xl font-light max-w-xl mx-auto">
            Beyond this screen lies an adventure to rebuild your life. Will you rise to the challenge?
            </p>
            <div className='flex flex-col items-center w-full justify-center'>
                <button
                onClick={handleHeroButtonClick}
                className="px-8 py-3 my-2 bg-gradient-to-r from-purple-700 to-indigo-900 hover:from-purple-500 hover:to-indigo-700 text-white font-bold text-lg rounded-lg shadow-lg hover:shadow-2xl transition-transform transform hover:scale-105"
                >
                Begin Your Journey
                </button>
                <p>- or -</p>
                <button
                onClick={handleLogin}
                className="px-8 py-3 my-2 bg-gradient-to-r from-purple-700 to-indigo-900 hover:from-purple-500 hover:to-indigo-700 text-white font-bold text-lg rounded-lg shadow-lg hover:shadow-2xl transition-transform transform hover:scale-105"
                >
                Continue
                </button>
            </div>
        </div>
        </div>
    );
}

export default HomePage;
