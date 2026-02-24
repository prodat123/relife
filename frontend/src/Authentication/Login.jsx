import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import config from "../config";
import { faEye, faEyeSlash } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import ReCAPTCHA from "react-google-recaptcha";
import { useNavigate } from "react-router-dom"; // 1. Import the hook

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [recaptchaToken, setRecaptchaToken] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const recaptchaRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "Re:LIFE | Login"; // Set the title for this component
  }, []);

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleLogin = async (e) => {
    e.preventDefault();

    setIsLoading(true);
    setMessage("");

    try {
      const response = await axios.post(
        `${config.backendUrl}/auth/login`,
        {
          username,
          password,
        },
        {
          withCredentials: true,
        },
      );
      setMessage(response.data.message);

      // Optionally, store the user data in localStorage as a string
      var user = JSON.stringify(response.data);
      localStorage.setItem("user", user);

      // Use the id from response.data directly
      navigate(`/dashboard`); // Redirect to user account page

      // Handle successful login, e.g., save user data or navigate
    } catch (error) {
      setMessage(error.response?.data?.message || "Error logging in");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen z-[999999]">
      {/* <div className="absolute inset-0 bg-black opacity-[0.6] z-0"></div> */}
      <form
        onSubmit={handleLogin}
        className="animate-fade-in backdrop-blur-xl bg-white/10 border border-white/20 shadow-2xl text-white p-6 rounded shadow-md w-96"
      >
        <h1 className="text-3xl font-solo tracking-widest font-extrabold mb-4 text-center">
          Sign In
        </h1>
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
            className="w-full p-3 rounded-md bg-transparent border border-white/30 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="Username"
          />
        </div>
        <div className="mb-4">
          <label htmlFor="password" className="block font-medium mb-2">
            Password
          </label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full p-3 rounded-md bg-transparent border border-white/30 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-primary pr-10"
              placeholder="Password"
            />
            <button
              type="button"
              onClick={togglePasswordVisibility}
              className="absolute inset-y-0 right-3 flex items-center text-gray-300 hover:text-white"
            >
              {showPassword ? (
                <FontAwesomeIcon icon={faEyeSlash} />
              ) : (
                <FontAwesomeIcon icon={faEye} />
              )}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={!username.trim() || !password.trim() || isLoading}
          className={`font-solo font-bold w-full text-white py-2 px-4 rounded transition-all duration-200 ${
            !username.trim() || !password.trim() || isLoading
              ? "bg-gray-500 cursor-not-allowed opacity-50"
              : "bg-primary hover:bg-blue-400"
          }`}
        >
          {isLoading ? (
            <span className="flex items-center justify-center">
              <svg
                className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Signing In...
            </span>
          ) : (
            "Sign In"
          )}
        </button>
        <p className="text-inline text-center">
          Don't have an account?{" "}
          <a
            href="/signup"
            className="text-white font-bold underline font-solo"
          >
            Register
          </a>
        </p>
        {message && <p className="mt-4 text-center text-red-500">{message}</p>}
      </form>
    </div>
  );
};

export default Login;
