import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import config from '../config';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';
import ReCAPTCHA from 'react-google-recaptcha';

const SignUp = () => {
    const [step, setStep] = useState(1); // Tracks current step
    const [username, setUsername] = useState('');
    const [age, setAge] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [recaptchaToken, setRecaptchaToken] = useState('');

    const navigate = useNavigate();

    useEffect(() => {
        document.title = "Re:LIFE | Sign Up"; // Set the title for this component
    }, []);

    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    const handleSignup = async (e) => {
        e.preventDefault();
 
        const usernameRegex = /^[a-zA-Z0-9_]+$/;

        if (username.trim() === '' || password.trim() === '') {
            setMessage('Please fill in all required fields.');
            return;
        }

        if (!usernameRegex.test(username)) {
            setMessage('Username can only contain letters, numbers, and underscores.');
            return;
        }

        if (!recaptchaToken) {
            setMessage('Please complete the reCAPTCHA verification.');
            return;
        }

        
        try {
            console.log('Sending signup request...');
            const response = await axios.post(`${config.backendUrl}/auth/signup`, {
                username,
                age,
                email,
                password,
                recaptchaToken,
            });
            console.log('Response:', response); // Log server response
            var user = JSON.stringify(response.data);
            localStorage.setItem('user', user);
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

        const usernameRegex = /^[a-zA-Z0-9_]+$/;

        if (!usernameRegex.test(username)) {
            setMessage('Username can only contain letters, numbers, and underscores.');
            return;
        }
        // if (step === 2 && !age.trim()) {
        //     setMessage('Age is required');
        //     return;
        // }
        // if (step === 3 && !email.trim()) {
        //     setMessage('Email is required');
        //     return;
        // }
        if (step === 4 && !password.trim()) {
            setMessage('Password is required');
            return;
        }
        setMessage(''); // Clear any previous error message
        setStep((prev) => prev + 1);
    };

    const handleRecaptchaChange = (token) => {
        //alert("Received reCAPTCHA token: " + token);
        setRecaptchaToken(token); // Store the reCAPTCHA token
    };
    

    // const nextStep = () => setStep((prev) => prev + 1);
    const prevStep = () => setStep((prev) => prev - 1);

    return (
        <div className="w-screen h-screen flex items-center justify-center relative overflow-hidden p-4">

            {/* Form Container */}
            <form
                onSubmit={handleSignup}
                className="relative z-10 w-full max-w-2xl p-8 rounded-lg backdrop-blur-xl bg-white/10 border border-white/20 shadow-2xl text-white"
            >
                <h1 className="text-3xl font-bold text-center mb-6 tracking-widest">Register</h1>

                {/* Username */}
                <div className="animate-fade-in mb-6">
                <label htmlFor="username" className="block text-md mb-2">
                    Enter Your Username <span className='text-red-400'>*</span>
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
                </div>

                {/* Password */}
                <div className="animate-fade-in mb-6">
                <label htmlFor="password" className="block text-md mb-2">
                    Enter Your Password <span className='text-red-400'>*</span>
                </label>
                <div className="relative">
                    <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full p-3 rounded-md bg-transparent border border-white/30 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 pr-10"
                    placeholder="Password"
                    />
                    <button
                    type="button"
                    onClick={togglePasswordVisibility}
                    className="absolute inset-y-0 right-3 flex items-center text-gray-300 hover:text-white"
                    >
                    {showPassword ? <FontAwesomeIcon icon={faEyeSlash} /> : <FontAwesomeIcon icon={faEye} />}
                    </button>
                </div>
                </div>

                {/* Age */}
                <div className="animate-fade-in mb-6">
                <label htmlFor="age" className="block text-md mb-2">
                    Select Your Age Range (Optional)
                </label>
                <select
                    id="age"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    className="w-full p-3 rounded-md bg-transparent border border-white/30 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                    <option value="" disabled>Select your age range</option>
                    <option value="under_18" className='text-black'>Under 18</option>
                    <option value="18_24" className='text-black'>18-24</option>
                    <option value="25_34" className='text-black'>25-34</option>
                    <option value="35_44" className='text-black'>35-44</option>
                    <option value="45_54" className='text-black'>45-54</option>
                    <option value="55_64" className='text-black'>55-64</option>
                    <option value="65_plus" className='text-black'>65+</option>
                    <option value="prefer_not_to_say" className='text-black'>Prefer not to say</option>
                </select>
                </div>

                {/* Email */}
                <div className="animate-fade-in mb-6">
                <label htmlFor="email" className="block text-md mb-2">
                    Enter Your Email (Optional)
                </label>
                <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full p-3 rounded-md bg-transparent border border-white/30 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Email"
                />

                <ReCAPTCHA
                    className='mt-4'
                    sitekey={process.env.REACT_APP_RECAPTCHA_SITE_KEY}
                    onChange={(token) => handleRecaptchaChange(token)}
                />
                </div>

                {/* Submit Button */}
                <div className="mt-6">
                <button
                    type="submit"
                    className={`w-full py-2 font-semibold rounded-md transition-all ${!recaptchaToken ? "bg-gray-300" : "bg-indigo-600 hover:bg-indigo-500"}`}
                    disabled={!recaptchaToken}
                >
                    Finish!
                </button>
                </div>
                <div>
                    <p className='text-center'>Already have an account? <Link className='underline' to={'/login'}>Sign In</Link></p>
                </div>

                {/* Success/Error Message */}
                {message && (
                <p className="mt-4 text-center text-red-500 animate-fade-in">{message}</p>
                )}
            </form>
        </div>

    );
};

export default SignUp;
