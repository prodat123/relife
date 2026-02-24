import { useState, useEffect, useContext } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faKey, faCoins } from "@fortawesome/free-solid-svg-icons";
import config from "../config";
import axios from "axios";
import { UserContext } from "../Account/UserContext";

export default function KeyShop() {
  // Purchased keys
  const [purchasedKeys, setPurchasedKeys] = useState([]);

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
  const userId = JSON.parse(localStorage.getItem("user"))?.id;

  function calculateLevel(experience) {
    let level = 1;
    let xpForNextLevel = 100;

    while (experience >= xpForNextLevel) {
      level++;
      experience -= xpForNextLevel;
      xpForNextLevel = 100 * Math.pow(1.05, level - 1);
    }

    return { level, remainingXP: experience, xpForNextLevel };
  }

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

    fetchAccountData();
    fetchShopItems();
  }, [userId, currency]);

  const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

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
        let message = "You successfully bought " + item.name;
        setPopups((prev) => [
          ...prev,
          { id: Date.now(), name: item.name, message: message, success: true },
        ]);
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

  return (
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-5 lg:grid-cols-6 p-6">
      <div className="md:col-start-2 lg:col-start-2 col-span-5">
        <h1 className="text-3xl font-solo font-extrabold text-white text-center mb-6 drop-shadow-lg">
          <FontAwesomeIcon icon={faKey} /> Key Shop
        </h1>

        {/* User Currency */}
        <div className="flex items-center justify-between bg-gray-800 p-4 rounded-xl shadow-md mb-6">
          <span className="text-gray-300 font-semibold">Your Coins:</span>
          <div className="flex items-center gap-2 text-yellow-400 font-bold text-lg">
            <FontAwesomeIcon icon={faCoins} />
            {currency}
          </div>
        </div>

        {/* Keys */}
        <div className="space-y-4">
          {items.map((key) => (
            <div
              key={key.id}
              className="flex flex-col sm:flex-row items-center justify-between bg-gradient-to-br from-gray-800 to-gray-700 rounded-2xl p-4 shadow-md transition hover:shadow-lg"
            >
              {/* Key Info */}
              <div className="flex lg:flex-row flex-col items-center gap-3 mb-2 sm:mb-0">
                {/* <FontAwesomeIcon
                  icon={faKey}
                  className="text-purple-400 text-2xl"
                /> */}
                <img src={key.image_url} className="pixel-art h-64" />
                <div>
                  <h4 className="text-white text-center lg:text-left font-semibold font-solo text-3xl">
                    {key.name}
                  </h4>
                  <p className="text-gray-400 lg:text-left text-sm text-center">
                    {key.description}
                  </p>
                </div>
              </div>

              {/* Price + Purchase */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1 text-yellow-400 font-semibold">
                  <FontAwesomeIcon icon={faCoins} />
                  {key.price}
                </div>
                <button
                  onClick={(e) => handlePurchase(e, key)}
                  disabled={
                    currency < key.price || purchasedKeys.includes(key.id)
                  }
                  className={`px-4 py-2 rounded-lg font-bold text-white transition ${
                    currency >= key.price && !purchasedKeys.includes(key.id)
                      ? "bg-primary hover:bg-blue-400"
                      : "bg-gray-600 cursor-not-allowed"
                  }`}
                >
                  {purchasedKeys.includes(key.id) ? "Purchased" : "Buy"}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
