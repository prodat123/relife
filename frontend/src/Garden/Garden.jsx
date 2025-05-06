import axios from 'axios';
import React, { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import config from '../config';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDroplet, faLeaf, faScissors, faSeedling } from '@fortawesome/free-solid-svg-icons';
import GardenTimer from './GardenTimer';
import ItemPopup from '../Inventory/ItemPopup';

function Garden({ id }) {
    const { userId } = useParams();
    const [inventory, setInventory] = useState(null);
    const [garden, setGarden] = useState([]);
    const [error, setError] = useState(null);
    const [seeds, setSeeds] = useState([]);
    const [popups, setPopups] = useState([]);
    const [currentTime, setCurrentTime] = useState(new Date());
    const isOwner = id === userId;

    const inProgressRequestsRef = useRef(new Set()); // Persistent tracking

    function calculateLevel(experience) {
        let level = 1;
        let xpForNextLevel = 100;

        while (experience >= xpForNextLevel) {
            level++;
            experience -= xpForNextLevel;
            xpForNextLevel = 100 * Math.pow(1.05, (level - 1));
        }

        return { level, remainingXP: experience, xpForNextLevel };
    }
    

    const fetchAccountData = async () => {
        try {
            const response = await axios.get(`${config.backendUrl}/account`, {
                params: { userId: userId ? userId : id },
            });
            const player = response.data;  
            
            if(calculateLevel(player.experience).level < 21){
                window.location.href = '/dashboard';
            }

            setInventory(player.inventory);
            const filteredSeeds = player.inventory.filter(item => item.type === 'seed');
            setSeeds(filteredSeeds);
        } catch (error) {
            console.error("Error fetching account data:", error);
            setError(error.response?.data?.error || "Failed to fetch account data");
        }
    };

    const fetchGardenData = async () => {
        try {
            const response = await axios.get(`${config.backendUrl}/garden`, {
                params: { userId: userId ? userId : id },
            });
            setGarden(response.data);
            console.log(response.data);
        } catch (error) {
            console.error("Error fetching garden data:", error);
            setError(error.response?.data?.error || "Failed to fetch garden data");
        }
    };

    const plantSeed = async (seedId) => {
        try {
            const response = await axios.post(`${config.backendUrl}/garden/plant`, {
                userId: userId ? userId : id,
                seedId,
            });
            fetchAccountData();
            fetchGardenData();
        } catch (error) {
            console.error("Error planting seed:", error);
            setError(error.response?.data?.error || "Failed to plant seed");
        }
    };

    const waterPlant = async (gardenId) => {
        const lastWateredAt = new Date().toISOString();  // Ensure it's a valid ISO string
        try {
            const response = await axios.post(`${config.backendUrl}/garden/water`, {
                userId,
                gardenId,
                lastWateredAt,  // Ensure it's a properly formatted ISO string
            });
            console.log(response.data.message);
            fetchGardenData();
        } catch (error) {
            console.error("Error watering plant:", error);
            setError(error.response?.data?.error || "Failed to water plant");
        }
    };
    
    const harvestPlant = async (gardenId) => {
        try {
            const response = await axios.post(`${config.backendUrl}/garden/harvest`, {
                userId,
                gardenId,
            });

            console.log(response);
            const message = response.data.message;

            setPopups((prev) => [
                ...prev,
                { id: Date.now(), message: message, success: true }
            ]);
            fetchAccountData();
            fetchGardenData();
        } catch (error) {
            console.error("Error harvesting plant:", error);
            setError(error.response?.data?.error || "Failed to harvest plant");
        }
    };

    const formatTime = (seconds) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        return `${h > 0 ? h + 'h ' : ''}${m > 0 ? m + 'm ' : ''}${s}s`;
    };

    useEffect(() => {
        fetchAccountData();
        fetchGardenData();

        // const interval = setInterval(fetchGardenData, 1000);
        // return () => clearInterval(interval);
    }, []);

    const handleTimerComplete = async (id) => {
        if (inProgressRequestsRef.current.has(id)) {
            console.log(`Skipping duplicate request for plant ID: ${id}`);
            return;
        }
        inProgressRequestsRef.current.add(id); // Mark as in progress
        console.log(`Timer ${id} completed! Fetching plant data...`);
    
        try {
            const response = await axios.get(`${config.backendUrl}/plant`, {
                params: { 
                    userId: userId ? userId : id,
                    plantId: id,
                },
            });
    
            if (response.status !== 200) {
                throw new Error('Failed to fetch plant data');
            }
    
            const plant = response.data;
            console.log('Fetched plant data:', plant);
            fetchGardenData();
        } catch (error) {
            console.error('Error fetching plant data:', error);
        } finally {
            setTimeout(() => {
                inProgressRequestsRef.current.delete(id); // Remove after some delay
            }, 800); // Small delay to avoid race conditions
        }
    };
    

    return (
        <div className='grid 2xl:grid-cols-6 lg:grid-cols-5 md:grid-cols-3 grid-cols-1 min-h-screen text-white p-6'>
            <div className='lg:col-start-2 xl:col-start-2 xl:col-span-5 col-span-4'>
                <h1 className='text-4xl text-white text-center font-bold'>Garden</h1>

                <div className='grid lg:grid-cols-3 grid-cols-2 gap-4 mt-8'>
                {garden.length > 0 ? (
                    garden.map((plant, index) => {
                        const wateredAt = new Date(plant.last_watered_at); // Original plantedAt
                        const plantedAtCopy = new Date(wateredAt); // Create a copy of plantedAt
                        const predictedWiltTime = plantedAtCopy.setSeconds(plantedAtCopy.getSeconds() + plant.wilt_time);                        
                        let duration = plant.growth_time - plant.total_progress;

                        if (plant.total_progress < plant.wilt_time) {
                            duration = plant.wilt_time;
                            console.log(duration);

                        }

                        
                        return (
                            <div key={index} className="p-4 rounded-md bg-gray-700">
                            <h3 className="text-xl text-center font-bold">{plant.name}</h3>
                            <p className="text-center">
                                {`Planted: ${plant.planted_at.toLocaleString()}`}
                            </p>
                            <p className="text-center">
                                {`Growth: ${formatTime(plant.growth_time)}`}
                            </p>
                            <p className="text-center">{`Status: ${plant.status}`}</p>

                            {/* Display countdown for growing plants */}
                            {plant.status === "growing" && (
                                <p className="text-center">
                                <GardenTimer key={plant.id} id={plant.id} startTime={wateredAt} nextWaterTime={plant.next_water_time} status={plant.status} onComplete={handleTimerComplete} />
                                </p>
                            )}

                            {/* Display alternative message if wilted */}
                            {plant.status === "wilted" && (
                                <p className="text-center">Growth halted due to wilting</p>
                            )}

                            {plant.status === "wilted" && (
                                <button
                                onClick={() => waterPlant(plant.id)}
                                className="mt-2 px-4 py-2 rounded w-full bg-blue-400 text-white hover:scale-105 transition-all duration-200"
                                >
                                <FontAwesomeIcon icon={faDroplet} /> Water
                                </button>
                            )}

                            {/* Show harvest button only if plant is harvestable */}
                            {plant.status === "harvestable" && (
                                <button
                                onClick={() => harvestPlant(plant.id)}
                                className="mt-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded w-full hover:scale-105 transition-all duration-200"
                                >
                                <FontAwesomeIcon icon={faScissors} /> Harvest
                                </button>
                            )}
                            </div>
                        );
                    })
                ) : (
                    <p className='text-center col-span-3'>No plants in your garden yet.</p>
                )}

                </div>

                <h2 className="text-2xl mt-8 text-center">Plant a Seed</h2>
                <div className='grid lg:grid-cols-3 grid-cols-2 gap-4 mt-8'>
                {seeds.length > 0 ? (
                    seeds.map((seed, index) => (
                        <div key={index} className="p-4 rounded-md bg-gray-700">
                            {/* <img src={seed.image_url || '/default-image.png'} alt={seed.name} className="w-full h-32 object-cover mb-4" /> */}
                            <h3 className="text-xl text-center">{seed.name}</h3>
                            <p className="text-center text-sm text-gray-300">Quantity: {seed.quantity}</p> {/* Display quantity */}
                            <button onClick={() => plantSeed(seed.id)} className="mt-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded w-full hover:scale-105 transition-all duration-200"><FontAwesomeIcon icon={faLeaf} /> Plant</button>
                        </div>
                    ))
                ) : (
                    <p className='col-span-3 text-center'>No seeds available to plant. Go to the shop to purchase seeds!</p>
                )}
                </div>
            </div>

            {popups.map(({ id, name, quantity, message, success }) => (
                <ItemPopup
                    key={id}
                    name={name}
                    quantity={quantity}
                    message={message}
                    success={success}
                    onClose={() => setPopups((prev) => prev.filter(popup => popup.id !== id))}
                />
            ))}
        </div>
    );
}

export default Garden;
