import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const SignUp = () => {
    const [step, setStep] = useState(1); // Tracks current step
    const [username, setUsername] = useState('');
    const [age, setAge] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState('');
    const navigate = useNavigate();

    const handleSignup = async (e) => {
        e.preventDefault();
        console.log('Signup button clicked'); // This confirms the event is triggered

        try {
            console.log('Sending signup request...');
            const response = await axios.post('http://localhost:3001/auth/signup', {
                username,
                age,
                email,
                password,
            });
            console.log('Response:', response); // Log server response
            setMessage(response.data.message);
            navigate("/dashboard");
        } catch (error) {
            console.error('Signup error:', error); // Log any errors
            if (error.response) {
                console.error('Error response:', error.response); // Log server error response
            }
            setMessage(error.response?.data?.message || 'Error signing up');
        }
    };

    const nextStep = () => {
        if (step === 1 && !username.trim()) {
            setMessage('Username is required');
            return;
        }
        if (step === 2 && !age.trim()) {
            setMessage('Age is required');
            return;
        }
        if (step === 3 && !email.trim()) {
            setMessage('Email is required');
            return;
        }
        if (step === 4 && !password.trim()) {
            setMessage('Password is required');
            return;
        }
        setMessage(''); // Clear any previous error message
        setStep((prev) => prev + 1);
    };
    

    // const nextStep = () => setStep((prev) => prev + 1);
    const prevStep = () => setStep((prev) => prev - 1);

    return (
        <div className="w-screen h-screen flex items-center bg-gradient-to-b from-gray-900 to-gray-800 justify-center relative overflow-hidden p-4">
            {/* Dark Overlay */}
            <div className="absolute inset-0 bg-black opacity-60 z-0"></div>

            {/* Form Container */}
            <form
                onSubmit={handleSignup}
                className="relative z-10 w-full max-w-2xl p-8 rounded-lg backdrop-blur-xl bg-white/10 border border-white/20 shadow-2xl text-white"
            >
                <h1 className="text-4xl font-bold text-center mb-6 tracking-widest">Register</h1>

                {/* Step 1: Username */}
                {step === 1 && (
                    <div className="animate-fade-in">
                        <label htmlFor="username" className="block text-lg mb-2">
                            Enter Your Username
                        </label>
                        <input
                            type="text"
                            id="username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                            className="w-full p-3 rounded-md bg-transparent border border-white/30 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            placeholder="Username"
                        />
                        <button
                            type="button"
                            onClick={nextStep}
                            className="mt-6 w-full py-2 bg-indigo-600 hover:bg-indigo-500 rounded-md shadow-md transition-all"
                        >
                            Next
                        </button>
                    </div>
                )}

                {/* Step 2: Age */}
                {step === 2 && (
                    <div className="animate-fade-in">
                        <label htmlFor="age" className="block text-lg mb-2">
                            Enter Your Age
                        </label>
                        <input
                            type="number"
                            id="age"
                            value={age}
                            onChange={(e) => setAge(e.target.value)}
                            required
                            className="w-full p-3 rounded-md bg-transparent border border-white/30 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            placeholder="Age"
                        />
                        <div className="flex justify-between mt-6">
                            <button
                                type="button"
                                onClick={prevStep}
                                className="py-2 px-6 bg-gray-600 hover:bg-gray-500 rounded-md transition-all"
                            >
                                Back
                            </button>
                            <button
                                type="button"
                                onClick={nextStep}
                                className="py-2 px-6 bg-indigo-600 hover:bg-indigo-500 rounded-md transition-all"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}

                {/* Step 3: Email */}
                {step === 3 && (
                    <div className="animate-fade-in">
                        <label htmlFor="email" className="block text-lg mb-2">
                            Enter Your Email
                        </label>
                        <input
                            type="email"
                            id="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="w-full p-3 rounded-md bg-transparent border border-white/30 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            placeholder="Email"
                        />
                        <div className="flex justify-between mt-6">
                            <button
                                type="button"
                                onClick={prevStep}
                                className="py-2 px-6 bg-gray-600 hover:bg-gray-500 rounded-md transition-all"
                            >
                                Back
                            </button>
                            <button
                                type="button"
                                onClick={nextStep}
                                className="py-2 px-6 bg-indigo-600 hover:bg-indigo-500 rounded-md transition-all"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}

                {/* Step 4: Password */}
                {step === 4 && (
                    <div className="animate-fade-in">
                        <label htmlFor="password" className="block text-lg mb-2">
                            Enter Your Password
                        </label>
                        <input
                            type="password"
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="w-full p-3 rounded-md bg-transparent border border-white/30 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            placeholder="Password"
                        />
                        <div className="flex justify-between mt-6">
                            <button
                                type="button"
                                onClick={prevStep}
                                className="py-2 px-6 bg-gray-600 hover:bg-gray-500 rounded-md transition-all"
                            >
                                Back
                            </button>
                            <button
                                type="submit"
                                className="py-2 px-6 font-semibold bg-indigo-600 hover:bg-indigo-500 rounded-md transition-all"
                            >
                                Finish!
                            </button>
                        </div>
                    </div>
                )}

                {/* Success/Error Message */}
                {message && (
                    <p className="mt-4 text-center text-red-500 animate-fade-in">{message}</p>
                )}
            </form>
        </div>
    );
};

export default SignUp;
