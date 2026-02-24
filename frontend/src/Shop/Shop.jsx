import React, { useContext, useEffect, useState } from "react";
import axios from "axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBox,
  faBrain,
  faCheckCircle,
  faCircle,
  faCog,
  faCoins,
  faDice,
  faExclamation,
  faExclamationCircle,
  faFaceAngry,
  faFaceGrin,
  faFire,
  faFistRaised,
  faGears,
  faGun,
  faHandFist,
  faLock,
  faMagic,
  faMagicWandSparkles,
  faObjectGroup,
  faPerson,
  faPlus,
  faRandom,
  faShield,
  faShoePrints,
  faShop,
  faShoppingBag,
  faShoppingCart,
  faSprout,
  faSubtract,
  faWandSparkles,
} from "@fortawesome/free-solid-svg-icons";
import config from "../config";
import { FaMailchimp, FaRandom } from "react-icons/fa";
import { UserContext } from "../Account/UserContext";
import ItemPopup from "../Inventory/ItemPopup";
import { AnimatePresence, motion } from "framer-motion";
import { createPortal } from "react-dom";

const Shop = () => {
  const [items, setItems] = useState([]);
  const [spells, setSpells] = useState([]);
  const [seeds, setSeeds] = useState([]);
  const [selectedSeed, setSelectedSeed] = useState(null);
  const [isRolling, setIsRolling] = useState(false);
  const [ownedItems, setOwnedItems] = useState([]);
  const [currency, setCurrency] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [intelligence, setIntelligence] = useState(0); // Player intelligence
  const [level, setLevel] = useState(0);
  const [cooldownTime, setCooldownTime] = useState(0);
  const [showWheel, setShowWheel] = useState(false);
  const [gachaResult, setGachaResult] = useState(null); // Store the result of Gacha spin
  const { accountData, fetchAccountData } = useContext(UserContext);
  const [activeTab, setActiveTab] = useState("items"); // 'items' or 'spells'
  const [popups, setPopups] = useState([]); // Store popup messages
  const [toasts, setToasts] = useState([]);
  const userId = JSON.parse(localStorage.getItem("user"))?.id;

  const gachaPrice = 2000;

  const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  useEffect(() => {
    document.title = "Re:LIFE | Shop"; // Set the title for this component
  }, []);

  const addToast = (toast) => {
    setToasts((prevToasts) => [...prevToasts, { ...toast, id: Date.now() }]);
  };

  // Function to remove a toast by its ID
  const removeToast = (id) => {
    setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id));
  };

  const handlePurchase = async (e, item) => {
    e.preventDefault();

    if (currency >= item.price) {
      try {
        // Send the discounted price to the server
        const response = await axios.post(`${config.backendUrl}/shop/buy`, {
          userId: userId,
          itemId: item.shop_item_id,
          price: item.price, // Include the discounted price
        });

        setCurrency((prev) => prev - item.price); // Deduct the discounted price locally
        // setPopups((prev) => [
        //   ...prev,
        //   { id: Date.now(), name: item.name, message: message, success: true },
        // ]);

        console.log(response.data.success);
        if (response.data.success) {
          // Create a toast with type: 'newItem' and pass the item object
          addToast({
            type: "newItem",
            item: item,
          });
        } else {
          // Example of an error toast
          addToast({
            type: "error",
            title: "Purchase Failed!",
          });
        }
        await delay(3000);
        fetchAccountData(userId);
      } catch (error) {
        console.error("Error purchasing item:", error);
        alert(error.response?.data?.error || "Failed to purchase item.");
        setPopups((prev) => [
          ...prev,
          {
            id: Date.now(),
            name: item.name,
            message: "You failed to buy this item!",
            success: false,
          },
        ]);
      }
    } else {
      alert("Not enough currency!");
    }
  };

  useEffect(() => {
    const fetchAccountData = async () => {
      try {
        const response = await axios.get(`${config.backendUrl}/account`, {
          params: { userId },
        });
        setCurrency(response.data.currency);
        setIntelligence(response.data.stats.intelligence || 0); // Fetch intelligence
        setLevel(calculateLevel(response.data.experience).level);
        setDiscount(response.data.discount || 0);
        setOwnedItems(response.data.inventory || []);
      } catch (error) {
        console.error("Error fetching account data:", error);
      }
    };

    const fetchShopItems = async () => {
      try {
        const response = await axios.get(`${config.backendUrl}/shop/items`);
        const itemsWithStats = response.data.map((item) => ({
          ...item,
          stats: item.stats ? JSON.parse(item.stats) : {},
        }));
        setItems(itemsWithStats);
      } catch (error) {
        console.error("Error fetching shop items:", error);
      }
    };

    const fetchShopSpells = async () => {
      try {
        const response = await axios.get(`${config.backendUrl}/shop/spells`);
        const spellsWithStats = response.data.map((spell) => ({
          ...spell,
          stats: spell.stats ? JSON.parse(spell.stats) : {},
        }));
        setSpells(spellsWithStats);
      } catch (error) {
        console.error("Error fetching shop items:", error);
      }
    };

    const fetchSeeds = async () => {
      try {
        const response = await axios.get(`${config.backendUrl}/seeds`);
        const seeds = response.data;
        console.log(response.data);
        setSeeds(seeds);
      } catch (error) {
        console.error("Error fetching seeds:", error);
      }
    };

    fetchAccountData();
    fetchShopItems();
    fetchShopSpells();
    fetchSeeds();
  }, [userId, currency]);

  function calculateLevel(experience) {
    let level = 1;
    let xpForNextLevel = 10;

    while (experience >= xpForNextLevel) {
      level++;
      experience -= xpForNextLevel;
      xpForNextLevel = 10 * Math.pow(1.05, level - 1);
    }

    return { level, remainingXP: experience, xpForNextLevel };
  }

  return (
    <div className="grid 2xl:grid-cols-6 lg:grid-cols-5 md:grid-cols-3 grid-cols-1 min-h-screen text-white p-6 flex flex-col items-center">
      {/* Header Section */}
      <div className="col-start-1 md:col-start-2 lg:col-start-2 xl:col-start-2 xl:col-span-5 lg:col-span-4 md:col-span-2 col-span-1">
        <div className="shop-header text-center">
          <h1 className="text-4xl font-solo font-extrabold">Game Shop</h1>
        </div>

        <div className="flex flex-row items-center justify-center w-full">
          <img
            src={"/sprites/npcs/shop-keeper.png"}
            className="pixel-art w-[350px]"
          ></img>
        </div>
        {/* Currency Display Section */}
        <div className="currency-display grid gap-6 mb-8 w-full bg-gray-800 rounded-lg p-4 shadow-md text-center">
          <div>
            <p className="text-xl font-medium">
              <FontAwesomeIcon icon={faCoins} /> Gold:
              <span className="font-bold text-yellow-300">
                {" "}
                {currency} gold
              </span>
            </p>
          </div>
        </div>

        {/* Shop Grid Section */}
        <div className="grid 2xl:grid-cols-5 lg:grid-cols-5 md:grid-cols-3 sm:grid-cols-2 grid-cols-1 gap-4 w-full">
          {activeTab === "items"
            ? items.length > 0
              ? items.map((item) => {
                  // const discountedPrice = Math.max(Math.floor(item.price * (1 - discount / 100)), 1);
                  let itemStats = item.stats;

                  if (typeof item.stats === "string") {
                    try {
                      itemStats = JSON.parse(item.stats);
                    } catch (error) {
                      console.error("Error parsing item stats:", error);
                      itemStats = {};
                    }
                  }

                  return (
                    <div
                      key={item.id}
                      className="bg-gray-800 p-4 rounded-lg shadow-lg text-center relative"
                    >
                      {level < item.levelRequired && (
                        <div className="absolute inset-0 bg-black bg-opacity-70 flex items-center justify-center rounded-lg">
                          <span className="text-white p-4">
                            <FontAwesomeIcon
                              className="text-4xl"
                              icon={faLock}
                            />
                            <div className="text-md">
                              <span className="font-semibold">
                                LEVEL {item.levelRequired}
                              </span>
                            </div>
                          </span>
                        </div>
                      )}
                      <img
                        src={item.image_url}
                        alt={item.name}
                        className="w-44 h-44 mx-auto mb-4 rounded-md pixel-art"
                      />
                      {/* <h3 className="text-xl font-bold mb-2">{item.name || "Unnamed Item"}</h3> */}
                      {/* <p className="text-white text-sm">{item.description || "No description available"}</p> */}

                      {itemStats && Object.keys(itemStats).length > 0 && (
                        <ul className="text-center text-sm mt-2">
                          {Object.entries(itemStats).map(([stat, value]) => (
                            <li key={stat} className="text-gray-300">
                              {stat.charAt(0).toUpperCase() + stat.slice(1)}:{" "}
                              {value > 0 && "+"}
                              {value}
                            </li>
                          ))}
                        </ul>
                      )}

                      <p className="mt-2 text-yellow-300 font-bold">
                        <FontAwesomeIcon icon={faCoins} /> {item.price} Gold
                      </p>

                      <button
                        onClick={(e) => handlePurchase(e, item)}
                        className={`mt-4 px-4 py-2 rounded-md font-bold hover:scale-105 transition-all ${
                          currency >= item.price && level >= item.levelRequired
                            ? "bg-green-600 hover:bg-green-500"
                            : "bg-gray-500 cursor-not-allowed"
                        }`}
                      >
                        {currency >= item.price && level >= item.levelRequired
                          ? "Purchase"
                          : "Not Enough Gold"}
                      </button>
                    </div>
                  );
                })
              : noItemsMessage("items")
            : activeTab === "head"
            ? items.length > 0
              ? items
                  .filter((item) => item.type === "head")
                  .map((item) => {
                    // const discountedPrice = Math.max(Math.floor(spell.price * (1 - discount / 100)), 1);
                    let itemStats = item.stats;

                    if (typeof item.stats === "string") {
                      try {
                        itemStats = JSON.parse(item.stats);
                      } catch (error) {
                        console.error("Error parsing item stats:", error);
                        itemStats = {};
                      }
                    }

                    return (
                      <div
                        key={item.id}
                        className="bg-gray-700 p-4 rounded-lg shadow-lg text-center relative"
                      >
                        {level < item.levelRequired && (
                          <div className="absolute inset-0 bg-black bg-opacity-70 flex items-center justify-center rounded-lg">
                            <span className="text-white p-4">
                              <FontAwesomeIcon
                                className="text-4xl"
                                icon={faLock}
                              />
                              <div className="text-md">
                                <span className="font-semibold">
                                  LEVEL {item.levelRequired}
                                </span>
                              </div>
                            </span>
                          </div>
                        )}
                        <img
                          src={`${item.image_url}?v=${new Date().getTime()}`}
                          alt={item.name}
                          className="w-44 h-44 mx-auto mb-4 rounded-md pixel-art"
                        />
                        <h3 className="text-xl font-bold mb-2">
                          {item.name || "Unnamed Item"}
                        </h3>
                        <p className="text-white text-sm">
                          {item.description || "No description available"}
                        </p>

                        {itemStats && Object.keys(itemStats).length > 0 && (
                          <ul className="text-center text-sm mt-2">
                            {Object.entries(itemStats).map(([stat, value]) => (
                              <li key={stat} className="text-gray-300">
                                {stat.charAt(0).toUpperCase() + stat.slice(1)}:{" "}
                                {value > 0 && "+"}
                                {value}
                              </li>
                            ))}
                          </ul>
                        )}

                        <p className="mt-2 text-yellow-300 font-bold">
                          <FontAwesomeIcon icon={faCoins} /> {item.price} Gold
                        </p>

                        <button
                          onClick={(e) => handlePurchase(e, item)}
                          className={`mt-4 px-4 py-2 rounded-md font-bold hover:scale-105 transition-all ${
                            currency >= item.price &&
                            level >= item.levelRequired
                              ? "bg-green-600 hover:bg-green-500"
                              : "bg-gray-500 cursor-not-allowed"
                          }`}
                        >
                          {currency >= item.price && level >= item.levelRequired
                            ? "Purchase"
                            : "Not Enough Gold"}
                        </button>
                      </div>
                    );
                  })
              : noItemsMessage("heads")
            : activeTab === "torso"
            ? items.length > 0
              ? items
                  .filter((item) => item.type === "torso")
                  .map((item) => {
                    // const discountedPrice = Math.max(Math.floor(spell.price * (1 - discount / 100)), 1);
                    let itemStats = item.stats;

                    if (typeof item.stats === "string") {
                      try {
                        itemStats = JSON.parse(item.stats);
                      } catch (error) {
                        console.error("Error parsing item stats:", error);
                        itemStats = {};
                      }
                    }

                    return (
                      <div
                        key={item.id}
                        className="bg-gray-700 p-4 rounded-lg shadow-lg text-center relative"
                      >
                        {level < item.levelRequired && (
                          <div className="absolute inset-0 bg-black bg-opacity-70 flex items-center justify-center rounded-lg">
                            <span className="text-white p-4">
                              <FontAwesomeIcon
                                className="text-4xl"
                                icon={faLock}
                              />
                              <div className="text-md">
                                <span className="font-semibold">
                                  LEVEL {item.levelRequired}
                                </span>
                              </div>
                            </span>
                          </div>
                        )}
                        <img
                          src={`${item.image_url}?v=${new Date().getTime()}`}
                          alt={item.name}
                          className="w-44 h-44 mx-auto mb-4 rounded-md pixel-art"
                        />
                        <h3 className="text-xl font-bold mb-2">
                          {item.name || "Unnamed Item"}
                        </h3>
                        <p className="text-white text-sm">
                          {item.description || "No description available"}
                        </p>

                        {itemStats && Object.keys(itemStats).length > 0 && (
                          <ul className="text-center text-sm mt-2">
                            {Object.entries(itemStats).map(([stat, value]) => (
                              <li key={stat} className="text-gray-300">
                                {stat.charAt(0).toUpperCase() + stat.slice(1)}:{" "}
                                {value > 0 && "+"}
                                {value}
                              </li>
                            ))}
                          </ul>
                        )}

                        <p className="mt-2 text-yellow-300 font-bold">
                          <FontAwesomeIcon icon={faCoins} /> {item.price} Gold
                        </p>

                        <button
                          onClick={(e) => handlePurchase(e, item)}
                          className={`mt-4 px-4 py-2 rounded-md font-bold hover:scale-105 transition-all ${
                            currency >= item.price &&
                            level >= item.levelRequired
                              ? "bg-green-600 hover:bg-green-500"
                              : "bg-gray-500 cursor-not-allowed"
                          }`}
                        >
                          {currency >= item.price && level >= item.levelRequired
                            ? "Purchase"
                            : "Not Enough Gold"}
                        </button>
                      </div>
                    );
                  })
              : noItemsMessage("heads")
            : activeTab === "legs"
            ? items.length > 0
              ? items
                  .filter((item) => item.type === "legs")
                  .map((item) => {
                    // const discountedPrice = Math.max(Math.floor(spell.price * (1 - discount / 100)), 1);
                    let itemStats = item.stats;

                    if (typeof item.stats === "string") {
                      try {
                        itemStats = JSON.parse(item.stats);
                      } catch (error) {
                        console.error("Error parsing item stats:", error);
                        itemStats = {};
                      }
                    }

                    return (
                      <div
                        key={item.id}
                        className="bg-gray-700 p-4 rounded-lg shadow-lg text-center relative"
                      >
                        {level < item.levelRequired && (
                          <div className="absolute inset-0 bg-black bg-opacity-70 flex items-center justify-center rounded-lg">
                            <span className="text-white p-4">
                              <FontAwesomeIcon
                                className="text-4xl"
                                icon={faLock}
                              />
                              <div className="text-md">
                                <span className="font-semibold">
                                  LEVEL {item.levelRequired}
                                </span>
                              </div>
                            </span>
                          </div>
                        )}
                        <img
                          src={`${item.image_url}?v=${new Date().getTime()}`}
                          alt={item.name}
                          className="w-44 h-44 mx-auto mb-4 rounded-md pixel-art"
                        />
                        <h3 className="text-xl font-bold mb-2">
                          {item.name || "Unnamed Item"}
                        </h3>
                        <p className="text-white text-sm">
                          {item.description || "No description available"}
                        </p>

                        {itemStats && Object.keys(itemStats).length > 0 && (
                          <ul className="text-center text-sm mt-2">
                            {Object.entries(itemStats).map(([stat, value]) => (
                              <li key={stat} className="text-gray-300">
                                {stat.charAt(0).toUpperCase() + stat.slice(1)}:{" "}
                                {value > 0 && "+"}
                                {value}
                              </li>
                            ))}
                          </ul>
                        )}

                        <p className="mt-2 text-yellow-300 font-bold">
                          <FontAwesomeIcon icon={faCoins} /> {item.price} Gold
                        </p>

                        <button
                          onClick={(e) => handlePurchase(e, item)}
                          className={`mt-4 px-4 py-2 rounded-md font-bold hover:scale-105 transition-all ${
                            currency >= item.price &&
                            level >= item.levelRequired
                              ? "bg-green-600 hover:bg-green-500"
                              : "bg-gray-500 cursor-not-allowed"
                          }`}
                        >
                          {currency >= item.price && level >= item.levelRequired
                            ? "Purchase"
                            : "Not Enough Gold"}
                        </button>
                      </div>
                    );
                  })
              : noItemsMessage("heads")
            : activeTab === "feet"
            ? items.length > 0
              ? items
                  .filter((item) => item.type === "feet")
                  .map((item) => {
                    // const discountedPrice = Math.max(Math.floor(spell.price * (1 - discount / 100)), 1);
                    let itemStats = item.stats;

                    if (typeof item.stats === "string") {
                      try {
                        itemStats = JSON.parse(item.stats);
                      } catch (error) {
                        console.error("Error parsing item stats:", error);
                        itemStats = {};
                      }
                    }

                    return (
                      <div
                        key={item.id}
                        className="bg-gray-700 p-4 rounded-lg shadow-lg text-center relative"
                      >
                        {level < item.levelRequired && (
                          <div className="absolute inset-0 bg-black bg-opacity-70 flex items-center justify-center rounded-lg">
                            <span className="text-white p-4">
                              <FontAwesomeIcon
                                className="text-4xl"
                                icon={faLock}
                              />
                              <div className="text-md">
                                <span className="font-semibold">
                                  LEVEL {item.levelRequired}
                                </span>
                              </div>
                            </span>
                          </div>
                        )}
                        <img
                          src={`${item.image_url}?v=${new Date().getTime()}`}
                          alt={item.name}
                          className="w-44 h-44 mx-auto mb-4 rounded-md pixel-art"
                        />
                        <h3 className="text-xl font-bold mb-2">
                          {item.name || "Unnamed Item"}
                        </h3>
                        <p className="text-white text-sm">
                          {item.description || "No description available"}
                        </p>

                        {itemStats && Object.keys(itemStats).length > 0 && (
                          <ul className="text-center text-sm mt-2">
                            {Object.entries(itemStats).map(([stat, value]) => (
                              <li key={stat} className="text-gray-300">
                                {stat.charAt(0).toUpperCase() + stat.slice(1)}:{" "}
                                {value > 0 && "+"}
                                {value}
                              </li>
                            ))}
                          </ul>
                        )}

                        <p className="mt-2 text-yellow-300 font-bold">
                          <FontAwesomeIcon icon={faCoins} /> {item.price} Gold
                        </p>

                        <button
                          onClick={(e) => handlePurchase(e, item)}
                          className={`mt-4 px-4 py-2 rounded-md font-bold hover:scale-105 transition-all ${
                            currency >= item.price &&
                            level >= item.levelRequired
                              ? "bg-green-600 hover:bg-green-500"
                              : "bg-gray-500 cursor-not-allowed"
                          }`}
                        >
                          {currency >= item.price && level >= item.levelRequired
                            ? "Purchase"
                            : "Not Enough Gold"}
                        </button>
                      </div>
                    );
                  })
              : noItemsMessage("heads")
            : activeTab === "weapon"
            ? items.length > 0
              ? items
                  .filter((item) => item.type === "weapon")
                  .map((item) => {
                    // const discountedPrice = Math.max(Math.floor(spell.price * (1 - discount / 100)), 1);
                    let itemStats = item.stats;

                    if (typeof item.stats === "string") {
                      try {
                        itemStats = JSON.parse(item.stats);
                      } catch (error) {
                        console.error("Error parsing item stats:", error);
                        itemStats = {};
                      }
                    }

                    return (
                      <div
                        key={item.id}
                        className="bg-gray-700 p-4 rounded-lg shadow-lg text-center relative"
                      >
                        {level < item.levelRequired && (
                          <div className="absolute inset-0 bg-black bg-opacity-70 flex items-center justify-center rounded-lg">
                            <span className="text-white p-4">
                              <FontAwesomeIcon
                                className="text-4xl"
                                icon={faLock}
                              />
                              <div className="text-md">
                                <span className="font-semibold">
                                  LEVEL {item.levelRequired}
                                </span>
                              </div>
                            </span>
                          </div>
                        )}
                        <img
                          src={`${item.image_url}?v=${new Date().getTime()}`}
                          alt={item.name}
                          className="w-44 h-44 mx-auto mb-4 rounded-md pixel-art"
                        />
                        <h3 className="text-xl font-bold mb-2">
                          {item.name || "Unnamed Item"}
                        </h3>
                        <p className="text-white text-sm">
                          {item.description || "No description available"}
                        </p>

                        {itemStats && Object.keys(itemStats).length > 0 && (
                          <ul className="text-center text-sm mt-2">
                            {Object.entries(itemStats).map(([stat, value]) => (
                              <li key={stat} className="text-gray-300">
                                {stat.charAt(0).toUpperCase() + stat.slice(1)}:{" "}
                                {value > 0 && "+"}
                                {value}
                              </li>
                            ))}
                          </ul>
                        )}

                        <p className="mt-2 text-yellow-300 font-bold">
                          <FontAwesomeIcon icon={faCoins} /> {item.price} Gold
                        </p>

                        <button
                          onClick={(e) => handlePurchase(e, item)}
                          className={`mt-4 px-4 py-2 rounded-md font-bold hover:scale-105 transition-all ${
                            currency >= item.price &&
                            level >= item.levelRequired
                              ? "bg-green-600 hover:bg-green-500"
                              : "bg-gray-500 cursor-not-allowed"
                          }`}
                        >
                          {currency >= item.price && level >= item.levelRequired
                            ? "Purchase"
                            : "Not Enough Gold"}
                        </button>
                      </div>
                    );
                  })
              : noItemsMessage("heads")
            : null}
        </div>
      </div>
      <div className="fixed">
        <AnimatePresence>
          {toasts.map((toast) => (
            <SingleToast key={toast.id} toast={toast} onRemove={removeToast} />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};

const noItemsMessage = (type) => (
  <div className="col-span-full text-gray-400 text-center">
    No {type} available in the shop at the moment.
  </div>
);

export default Shop;

// --- Helper Configurations ---
const toastConfig = {
  error: {
    icon: faExclamation,
    styles: "border-l-4 border-red-500",
  },
  success: {
    icon: faCheckCircle,
    styles: "border-l-4 border-green-500",
  },
};

const rarityStyles = {
  Common: { text: "text-gray-300", border: "border-gray-400" },
  Uncommon: { text: "text-green-400", border: "border-green-500" },
  Rare: { text: "text-blue-400", border: "border-blue-500" },
  Epic: { text: "text-purple-400", border: "border-purple-500" },
  Legendary: { text: "text-amber-400", border: "border-amber-500" },
};

// --- The Toast Component ---

const SingleToast = ({ toast, onRemove }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onRemove(toast.id);
    }, 2000);
    return () => clearTimeout(timer);
  }, [toast.id, onRemove]);

  // --- Item Toast Layout ---
  if (toast.type === "newItem" && toast.item) {
    const item = toast.item;
    const rarity = item.rarity || "Common";
    const styles = rarityStyles[rarity];

    // --- FIXED: Call createPortal as a function ---
    return createPortal(
      <motion.div
        layout
        initial={{ opacity: 0, y: 50, scale: 0.8 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, x: -100, scale: 0.8 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        className={`fixed top-5 right-5 z-50 w-80 p-4 bg-slate-800/90 backdrop-blur-sm rounded-lg border-2 ${styles.border} pointer-events-auto shadow-lg`}
      >
        <div className="flex items-center gap-4">
          <div
            className={`w-16 h-16 flex-shrink-0 bg-black/30 rounded-md p-1 border ${styles.border}`}
          >
            <img
              src={item.image_url}
              alt={item.name}
              className="w-full h-full object-contain pixel-art"
            />
          </div>
          <div className="flex-grow">
            <h3 className="font-bold text-slate-300 text-sm">Item Acquired!</h3>
            <p className={`font-bold text-lg ${styles.text}`}>{item.name}</p>
          </div>
        </div>
        <motion.div
          className={`absolute bottom-0 left-0 h-1 bg-current ${styles.text}`}
          initial={{ width: "100%" }}
          animate={{ width: "0%" }}
          transition={{ duration: 2, ease: "linear" }}
        />
      </motion.div>,
      document.body
    );
  }

  // --- Standard Toast Layout ---
  const config = toastConfig[toast.type] || {};
  const iconColorClass = config.styles?.split(" ")[1] || "";

  return createPortal(
    <motion.div
      layout
      initial={{ opacity: 0, y: -50, scale: 0.8 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: 100, scale: 0.8 }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      className={`fixed top-5 right-5 z-50 w-72 p-4 flex items-center gap-4 bg-gray-800/90 backdrop-blur-sm rounded-lg ${config.styles} pointer-events-auto`}
    >
      <FontAwesomeIcon
        icon={config.icon}
        className={`text-2xl ${iconColorClass}`}
      />
      <p className="font-bold text-white text-lg">{toast.title}</p>
    </motion.div>,
    document.body
  );
};
