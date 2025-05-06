import React, { useState, useEffect } from 'react';
import { FaGem, FaCrown } from 'react-icons/fa';
import axios from 'axios';
import config from '../config';

function GuildGemsPage({guild, onUpdate}) {
    const conversionRate = 10000;  // 10000 gold = 1 gem
    const [goldCollected, setGoldCollected] = useState([]);
    const [donationAmount, setDonationAmount] = useState('');
    const userId = JSON.parse(localStorage.getItem('user'))?.id;

    const { name, gold_collected, guild_gems } = guild;

    // Fetch initial donation data
    useEffect(() => {
        const fetchDonations = async () => {
            try {
                setGoldCollected(JSON.parse(gold_collected));
            } catch (error) {
                console.error('Failed to fetch donations:', error);
            }
        };

        fetchDonations();
    }, [onUpdate]);

    // Calculate total gold and gems
    const totalGold = goldCollected && goldCollected.length > 0 
    ? goldCollected.reduce((acc, donation) => acc + donation.gold, 0) 
    : 0;

    const totalGems = guild?.guild_gems;
    const progress = totalGold > 0 
        ? (totalGold % conversionRate) / conversionRate * 100 
        : 0;

    // Handle donation
    const handleDonate = async () => {
        const goldAmount = parseInt(donationAmount, 10);

        if (isNaN(goldAmount) || goldAmount <= 0 || !userId) {
            alert('Please enter a valid donation amount and User ID.');
            return;
        }

        try {
            const response = await axios.post(`${config.backendUrl}/donate-gold`, {
                userId,
                guildName: name,
                amount: goldAmount
            });


            onUpdate();

        } catch (error) {
            console.error('Donation failed:', error);
            alert(error.response?.data?.error || 'Failed to donate gold');
        }

        // Reset input fields
        setDonationAmount('');
    };

    // Sort leaderboard by most gold donated
    const leaderboard = Array.isArray(goldCollected) && goldCollected.length > 0 
    ? [...goldCollected].sort((a, b) => b.gold - a.gold) 
    : [];

    return (
        <div className='flex items-center justify-center flex-col'>

            {/* Total Gems Display */}
            <h1 className="text-3xl font-bold mb-4 flex items-center">
                <FaGem className="text-orange-500 mr-2" /> Total Gems: {totalGems}
            </h1>

            {/* Progress Bar */}
            <div className="w-full max-w-xl bg-gray-600 rounded-lg overflow-hidden mb-4">
                <div
                    className="h-8 transition-all duration-300 bg-gradient-to-r from-yellow-400 to-orange-600"
                    style={{ width: `${progress}%` }}
                />
            </div>


            <p className="text-sm mb-6">
                <span className='text-yellow-400'>{conversionRate - (totalGold % conversionRate)}</span> gold until the next gem!
            </p>

            {/* Donation Section */}
            <div className="flex flex-col lg:flex-row items-center justify-center gap-4 w-full max-w-lg mb-6">
                
                <input
                    type="number"
                    placeholder="Gold amount"
                    value={donationAmount}
                    onChange={(e) => setDonationAmount(e.target.value)}
                    className="p-2 rounded w-full lg:w-auto bg-gray-600 text-white"
                />
                <button
                    onClick={handleDonate}
                    className="bg-green-500 px-4 py-2 rounded hover:bg-green-400 hover:scale-105 duration-200 transition"
                >
                    Donate
                </button>
            </div>

            {/* Conversion Ratio */}
            <p className="text-lg mb-8">Conversion: <span className="text-orange-500">10,000</span> gold = <FaGem className="inline text-orange-500" /> 1 gem</p>

            {/* Leaderboard */}
            <div className="w-full max-w-lg">
                <h2 className="text-2xl font-bold mb-4 text-center">Donors</h2>
                <div className="bg-gray-800 p-4 rounded-lg">
                    {leaderboard.length > 0 ? (
                        leaderboard.map((donor, index) => (
                            <div
                                key={donor.userId}
                                className="flex justify-between items-center py-2 border-b border-gray-700"
                            >
                                <div className="flex items-center">
                                    {index === 0 && <FaCrown className="text-yellow-400 mr-2" />}
                                    <span className="font-bold">{donor.username}</span>
                                </div>
                                <span className="text-yellow-300">{donor.gold} gold</span>
                            </div>
                        ))
                    ) : (
                        <p>No donations yet!</p>
                    )}
                </div>
            </div>
        </div>
    );
}

export default GuildGemsPage;
