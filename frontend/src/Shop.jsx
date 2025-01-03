import React, { useEffect, useState } from "react";
import axios from "axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBrain, faCircle, faCoins } from "@fortawesome/free-solid-svg-icons";

const Shop = () => {
    const [items, setItems] = useState([]);
    const [ownedItems, setOwnedItems] = useState([]);
    const [currency, setCurrency] = useState(0);
    const [discount, setDiscount] = useState(0);
    const [intelligence, setIntelligence] = useState(0); // Player intelligence
    const [cooldownTime, setCooldownTime] = useState(0);
    const [showWheel, setShowWheel] = useState(false);
    const userId = JSON.parse(localStorage.getItem("user"))?.id;

    const handlePurchase = async (item) => {
        // Calculate the discounted price
        const discountedPrice = Math.max(
            Math.floor(item.price * (1 - discount / 100)), // Discounted price, ensuring a minimum of 1 gold
            1
        );
    
        if (currency >= discountedPrice) {
            try {
                // Send the discounted price to the server
                const response = await axios.post("http://localhost:3001/shop/buy", {
                    userId: userId,
                    itemId: item.shop_item_id,
                    price: discountedPrice, // Include the discounted price
                    discount: discount,
                });
    
                alert(response.data.message);
                setCurrency((prev) => prev - discountedPrice); // Deduct the discounted price locally
            } catch (error) {
                console.error("Error purchasing item:", error);
                alert(error.response?.data?.error || "Failed to purchase item.");
            }
        } else {
            alert("Not enough currency!");
        }
    };

    useEffect(() => {
        const fetchLastSpin = async () => {
            try {
                const response = await axios.get("http://localhost:3001/account", {
                    params: { userId },
                });
                const lastSpin = new Date(response.data.last_spin);
                const now = new Date();
                const timeLeftMs = Math.max(6 * 60 * 60 * 1000 - (now - lastSpin), 0); // 6 hours in ms
                setCooldownTime(timeLeftMs);
                console.log(response.data.last_spin);
            } catch (error) {
                console.error("Error fetching last spin time:", error);
            }
        };
    
        fetchLastSpin();
    }, []);
    
    useEffect(() => {
        // If cooldownTime is greater than 0, we can show the countdown
        const timer = setInterval(() => {
            if (cooldownTime > 0) {
                setCooldownTime(cooldownTime - 1000);
            }
        }, 1000);

        return () => clearInterval(timer); // Cleanup on component unmount
    }, [cooldownTime]);

    const handleSpin = async () => {
        try {
            const response = await axios.post("http://localhost:3001/spin-wheel", {
                userId: userId,
                intelligence: intelligence, // Pass intelligence from the frontend
            });
    
            // Display the discount
            alert(`You received a ${response.data.discount}% discount!`);
            setDiscount(response.data.discount); // Update discount locally
            setShowWheel(false); // Hide wheel


            const cooldownDuration = 5 * 60 * 1000; // 5 minutes cooldown in milliseconds
            setCooldownTime(cooldownDuration);

            // Start a countdown to update the cooldown time
            const interval = setInterval(() => {
                setCooldownTime((prevTime) => {
                    if (prevTime <= 1000) {
                        clearInterval(interval);
                        return 0; // Reset cooldown time once it reaches zero
                    }
                    return prevTime - 1000; // Decrease cooldown time by 1 second
                });
            }, 1000);
        } catch (error) {
            alert(error.response?.data?.error || "Failed to spin the wheel.");
        }
    };


    useEffect(() => {
        const fetchAccountData = async () => {
            try {
                const response = await axios.get("http://localhost:3001/account", {
                    params: { userId },
                });
                setCurrency(response.data.currency);
                setIntelligence(response.data.stats.intelligence || 0); // Fetch intelligence
                setDiscount(response.data.discount || 0);
                setOwnedItems(response.data.inventory || []);
            } catch (error) {
                console.error("Error fetching account data:", error);
            }
        };

        const fetchShopItems = async () => {
            try {
                const response = await axios.get("http://localhost:3001/shop/items");
                const itemsWithStats = response.data.map((item) => ({
                    ...item,
                    stats: item.stats ? JSON.parse(item.stats) : {},
                }));
                setItems(itemsWithStats);
            } catch (error) {
                console.error("Error fetching shop items:", error);
            }
        };

        fetchAccountData();
        fetchShopItems();
    }, [userId, currency]);

    return (
        <div className="bg-gradient-to-b from-gray-900 to-gray-800 lg:h-screen h-full">
            <div className="shop-container bg-gradient-to-b from-gray-900 to-gray-800 text-white p-8 shadow-lg h-full">
                <h2 className="text-3xl font-bold text-center mb-2">Game Shop</h2>
                <h5 className="text-center mb-2">(Enter the tower to earn more gold to buy better equipment)</h5>
                <div className="currency-display mb-6 text-center">
                    <p className="text-xl">
                        <FontAwesomeIcon icon={faCoins} /> Owned Gold:{" "}
                        <span className="font-bold text-yellow-300">{currency} gold</span>
                    </p>
                    <p className="text-xl">
                        <FontAwesomeIcon icon={faBrain} /> Intelligence:{" "}
                        <span className="font-bold text-green-500">{intelligence}</span>
                    </p>
                </div>

                <div className="text-center mb-6">
                    <div>
                        {cooldownTime > 0 ? (
                            <p>Next spin in: {Math.ceil(cooldownTime / (1000 * 60))} minutes</p>
                        ) : (
                            <button
                                className="px-4 py-2 rounded-md bg-blue-600 text-white font-semibold hover:bg-blue-500"
                                onClick={handleSpin}
                            >
                                Use your Intelligence to get a Discount!
                            </button>
                        )}
                    </div>
                    
                    {discount > 0 && cooldownTime !== 0 && (
                        <p className="text-green-300 mt-2">
                            Current Discount: {discount}%
                        </p>
                    )}
                </div>

                <div className="shop-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {items.length > 0 ? (
                        items.map((item) => {
                            const discountedPrice = Math.max(
                                Math.floor(item.price * (1 - discount / 100)),
                                1
                            );

                            return (
                                <div
                                    key={item.id}
                                    className={`item-card bg-gray-700 relative p-4 rounded-lg shadow-md hover:scale-105 transform transition-all text-center`}
                                >
                                    {currency < discountedPrice &&
                                        <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center rounded-lg">
                                            <div className="text-red-500 text-4xl font-bold">🔒</div>
                                        </div>
                                    }
                                    <div className="icon text-4xl mb-3 flex items-center justify-center">
                                        <img
                                            src={item.image_url}
                                            className="pixel-art w-40 h-40"
                                            alt="item"
                                        />
                                    </div>
                                    <h3 className="text-xl font-bold">
                                        {item.name || "Unnamed Item"}
                                    </h3>
                                    <p className="text-sm text-gray-300">
                                        {item.description || "No description available"}
                                    </p>
                                    <ul className="item-stats mt-3 text-left text-sm">
                                        {item.stats?.intelligence && (
                                            <li className="text-green-500">
                                                🔹 Intelligence: +{item.stats.intelligence}
                                            </li>
                                        )}
                                    </ul>
                                    <p className="price mt-2 text-yellow-300 font-semibold">
                                        <FontAwesomeIcon icon={faCoins} /> {discountedPrice} Gold{" "}
                                        <span className="line-through text-red-400">
                                            ({item.price})
                                        </span>
                                    </p>
                                    <button
                                        onClick={() => handlePurchase(item)}
                                        
                                        className={`mt-4 px-4 py-2 rounded-md font-bold ${
                                            currency >= discountedPrice &&
                                            "bg-green-600 hover:bg-green-500 text-white"
                                               
                                        }`}
                                    >
                                        {currency >= discountedPrice ?
                                        
                                        "Buy Now"
                                        
                                        : "Locked"}
                                    </button>
                                </div>
                            );
                        })
                    ) : (
                        <div className="text-center col-span-full text-gray-400">
                            No items available in the shop at the moment.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Shop;
