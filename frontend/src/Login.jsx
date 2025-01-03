import React, { useState } from 'react';
import axios from 'axios';

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState('');

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.post('http://localhost:3001/auth/login', {
                username,
                password,
            });
            setMessage(response.data.message);
    
            // Access the user ID directly from the response data
            console.log(response.data.id);  // Correct way to access 'id'
    
            // Optionally, store the user data in localStorage as a string
            var user = JSON.stringify(response.data);
            localStorage.setItem('user', user);
    
            // Use the id from response.data directly
            window.location.href = `/account/${response.data.id}`;  // Redirect to user account page
    
            // Handle successful login, e.g., save user data or navigate
            console.log('User data:', response.data);
        } catch (error) {
            setMessage(error.response?.data?.message || 'Error logging in');
        }
    };
    

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-gray-900 to-gray-800">
            <div className="absolute inset-0 bg-black opacity-60 z-0"></div>
            <form onSubmit={handleLogin} className="animate-fade-in backdrop-blur-xl bg-white/10 border border-white/20 shadow-2xl text-white p-6 rounded shadow-md w-96">
                <h1 className="text-2xl font-bold mb-4 text-center">Log In</h1>
                <div className="mb-4">
                    <label htmlFor="username" className="block font-medium mb-2">
                        Username
                    </label>
                    <input
                        type="text"
                        id="username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                        className="w-full p-3 rounded-md bg-transparent border border-white/30 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                </div>
                <div className="mb-4">
                    <label htmlFor="password" className="block font-medium mb-2">
                        Password
                    </label>
                    <input
                        type="password"
                        id="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="w-full p-3 rounded-md bg-transparent border border-white/30 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                </div>
                <button
                    type="submit"
                    className="bg-indigo-600 w-full text-white py-2 px-4 rounded hover:bg-indigo-500"
                >
                    Log In
                </button>
                <p className='text-inline text-center'>Don't have an account? <a href='/signup' className='text-white font-semibold underline'>Register</a></p>
                {message && <p className="mt-4 text-center text-red-500">{message}</p>}
            </form>
        </div>
    );
};

export default Login;
