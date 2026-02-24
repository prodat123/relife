import React, { useState, useEffect } from "react";
import axios from "axios";
import config from "../config";

function DeleteAccount({ onClose }) {
  const [username, setUsername] = useState("");
  const [storedUsername, setStoredUsername] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const savedUsername = JSON.parse(localStorage.getItem("user"))?.username;
    if (savedUsername) {
      setStoredUsername(savedUsername);
    }
  }, []);

  const handleDelete = async () => {
    setError("");
    setSuccess("");

    if (username !== storedUsername) {
      setError("Username does not match the stored account.");
      return;
    }

    try {
      const response = await axios.post(
        `${config.backendUrl}/auth/delete-account`,
        { username },
        { withCredentials: true }
      );

      if (response.status === 200) {
        localStorage.removeItem("username");
        setSuccess("Your account has been deleted successfully.");
      }
    } catch (err) {
      if (err.response) {
        setError(err.response.data.message || "Error deleting account.");
      } else {
        setError("Network error. Please try again.");
      }
    }
  };

  return (
    // Overlay
    <div className="fixed inset-0 flex items-center justify-center bg-background z-50">
      {/* Modal */}
      <div className="max-w-md w-full p-8 rounded-2xl shadow-[0_0_30px_rgba(59,130,246,0.7)] bg-gray-900 border border-blue-500 relative">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-400 hover:text-white"
        >
          ✕
        </button>

        <h2 className="text-2xl font-extrabold text-blue-400 text-center mb-6 tracking-wide">
          Delete Account
        </h2>

        <p className="text-sm text-gray-300 mb-6 text-center">
          Type your username <br />(
          <span className="font-semibold text-blue-300">{storedUsername}</span>)
          to confirm deletion.
        </p>

        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Enter your username"
          className="w-full p-3 border border-blue-500 bg-gray-800 text-white rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-blue-400 shadow-inner"
        />

        {error && (
          <p className="text-red-500 text-sm mb-3 text-center">{error}</p>
        )}
        {success && (
          <p className="text-green-400 text-sm mb-3 text-center">{success}</p>
        )}

        <button
          onClick={handleDelete}
          className="w-full text-text py-3 px-4 rounded-lg bg-red-600 hover:bg-red-700 transition shadow-[0_0_15px_rgba(220,38,38,0.8)] font-bold tracking-wide"
        >
          Delete Account
        </button>
      </div>
    </div>
  );
}

export default DeleteAccount;
