// ShadowRealmPopup.js
import React, { useState } from 'react';
import axios from 'axios';
import config from '../config';

const ShadowRealmPopup = ({ userId, onClose }) => {
    const [newUsername, setNewUsername] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    const handleUsernameChange = async () => {
        if (!newUsername.trim()) return;

        try {
            setLoading(true);
            const res = await axios.post(`${config.backendUrl}/change-username`, {
                userId,
                newUsername,
            });

            setMessage('Username changed successfully!');
            setLoading(false);
            setTimeout(() => {
                onClose(); // Close popup after success
                window.location.reload(); // Optional: refresh user info
            }, 1500);
        } catch (err) {
            setMessage('Error changing username.');
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black flex items-center justify-center z-[999999]">
            <div className="bg-white p-8 rounded-lg max-w-sm w-full text-center shadow-xl">
                <h2 className="text-xl font-bold mb-4 text-red-700">You've been banished to the Shadow Realm...</h2>
                <p className="mb-4">Your spirit reached 0 because of your inconsistency towards quests and building habits. Begin a new life under a new name.</p>
                <input
                    type="text"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    placeholder="Enter new username"
                    className="border rounded px-3 py-2 w-full mb-4"
                />
                <button
                    onClick={handleUsernameChange}
                    disabled={loading}
                    className="bg-red-600 hover:bg-red-500 hover:shadow-[0_0_10px_rgba(220,38,38,0.8)] transition-all duration-200 text-white px-4 py-2 rounded w-full"
                >
                    {loading ? 'Changing...' : 'Change Username'}
                </button>
                {message && <p className="mt-2 text-sm text-gray-600">{message}</p>}
            </div>
        </div>
    );
};

export default ShadowRealmPopup;
