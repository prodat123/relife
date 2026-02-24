import React, { useState, useEffect, useRef, useContext } from "react";
import axios from "axios";
import config from "../config";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import CraftingSystem from "./CraftingSystem";
import {
  faCheckCircle,
  faHammer,
  faHelmetSafety,
  faShoePrints,
  faTShirt,
  faX,
} from "@fortawesome/free-solid-svg-icons";
import ItemPopup from "./ItemPopup";
import { AnimatePresence, motion } from "framer-motion";
import { UserContext } from "../Account/UserContext";
import CharacterDisplay from "../Miscellaneous/CharacterDisplay";
import { useTooltip } from "../Miscellaneous/TooltipProvider";

function Inventory() {
  const userId = JSON.parse(localStorage.getItem("user"))?.id;
  const [accountData, setAccountData] = useState(null);
  const { accountDataRef, fetchAccountData } = useContext(UserContext);
  const { showTooltip, hideTooltip } = useTooltip(); // <-- 2. Instantiate hook
  // const [equipment, setEquipment] = useState(null);
  const [inventory, setInventory] = useState([]);
  const [showCrafting, setShowCrafting] = useState(false);
  const dropdownRef = useRef(null); // Reference to the dropdown element
  const [activeDropdown, setActiveDropdown] = useState(null);

  const [baseStats, setBaseStats] = useState({});
  const [upgradedStats, setUpgradedStats] = useState({});

  const [scrappingId, setScrappingId] = useState(null);
  const [popups, setPopups] = useState([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState("loadout");

  const [gateCreation, setGateCreation] = useState(false);
  const [gateKey, setGateKey] = useState("");
  const [successOpen, setSuccessOpen] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);
  const TOTAL_COLLECTIBLE_ITEMS = 84; // Set this based on your actual total

  const handleClosePopup = (popupId) => {
    setPopups((prev) => prev.filter((p) => p.id !== popupId));
  };

  const rarityStyles = {
    peasantly: {
      backgroundColor: "#b76f44",
      color: "#FFFFFF",
    },
    artisan: {
      backgroundColor: "#009688",
      color: "#FFFFFF",
    },
    knightly: {
      backgroundColor: "#cccccc",
      color: "#000000",
    },
    noble: {
      backgroundColor: "#e06666",
      color: "#FFFFFF",
    },
    kingly: {
      backgroundColor: "#ffd966",
      color: "#000000",
    },
    emperor: {
      backgroundColor: "#9900ff",
      color: "#FFFFFF",
    },
  };

  // Rarity border and badge classes
  const rarityBorder = {
    peasantly: "border-[#b76f44]",
    artisan: "border-[#009688]",
    knightly: "border-[#cccccc]",
    noble: "border-[#e06666]",
    kingly: "border-[#ffd966]",
    emperor: "border-[#9900ff]",
    key: "border-[#3d85c6]",
  };
  const rarityBadge = {
    peasantly: "bg-[#b76f44] text-white",
    artisan: "bg-[#009688] text-white",
    knightly: "bg-[#cccccc] text-black",
    noble: "bg-[#e06666] text-white",
    kingly: "bg-[#ffd966] text-black",
    emperor: "bg-[#9900ff] text-white",
    key: "bg-[#3d85c6] text-white",
  };

  const handleScrap = async (itemId) => {
    setScrappingId(itemId);
    try {
      const response = await axios.post(
        `${config.backendUrl}/scrap`,
        {
          userId,
          itemId, // Send the item's ID to uniquely identify it
        },
        {
          withCredentials: true,
        },
      );

      const data = response.data;

      if (data.success) {
        // Remove scrapped item from inventory state
        const newInventory = inventory.filter((item) => item.id !== itemId);

        setInventory(newInventory); // update local state immediately

        // Optionally show reward feedback
        alert(`${data.message} (You now have ${data.totalGold} gold)`);

        // Refresh account data from backend (for updated currency, etc.)
        fetchAccountData();
      } else {
        alert(data.error || "Failed to scrap item.");
      }
    } catch (err) {
      console.error("Scrap failed:", err);
      alert("Something went wrong while scrapping.");
    } finally {
      setScrappingId(null);
    }
  };

  useEffect(() => {
    fetchAccountData(userId);
    const interval = setInterval(() => {
      if (accountDataRef.current && !dataLoaded) {
        setAccountData(accountDataRef?.current);
        setInventory(accountDataRef.current?.inventory);
        setDataLoaded(true);
      }
    }, 300); // Small interval to wait for dataRef update

    return () => clearInterval(interval);
  }, [accountDataRef, dataLoaded, scrappingId]);

  // const fetchAccountData = async () => {
  //   try {
  //     const response = await axios.get(`${config.backendUrl}/account`, {
  //       params: { userId },
  //       withCredentials: true,
  //     });

  //     setAccountData(response.data);
  //     setInventory(response.data.inventory || []);
  //   } catch (error) {
  //     console.error("Error fetching account data:", error);
  //   }
  // };

  useEffect(() => {
    const loadStats = async () => {
      const playerStats = accountData.stats;

      // Calculate base stats (without equipment)
      let basePayload = {
        maxHealth: Math.floor(
          Math.pow(15 * playerStats.endurance + 2 * playerStats.strength, 0.8),
        ),
        maxMana: Math.floor(
          10 * playerStats.intelligence + 2 * playerStats.endurance,
        ),
        manaRegeneration: Math.round(2 * playerStats.intelligence),
        parry:
          8 +
          Math.floor(
            Math.pow(
              0.75 * playerStats.endurance + 0.25 * playerStats.strength,
              0.6,
            ),
          ),
        armor: Math.floor(Math.pow(0.25 * playerStats.endurance, 0.7)),
        hitAbility:
          9 +
          Math.floor(
            Math.pow(
              1.25 * playerStats.strength + 0.5 * playerStats.bravery,
              0.6,
            ),
          ),
        damage: Math.floor(
          Math.pow(
            1 * playerStats.strength + Math.floor(0.25 * playerStats.bravery),
            0.8,
          ),
        ),
        magicPenetration:
          9 +
          Math.round(
            Math.sqrt(playerStats.intelligence + 0.25 * playerStats.strength),
          ),
        magicResistance:
          9 +
          Math.round(
            Math.sqrt(
              0.8 * playerStats.intelligence + 0.25 * playerStats.endurance,
            ),
          ),
        spellEffectMultiplier:
          Math.round(
            Math.pow(
              0.5 * playerStats.intelligence + 0.15 * playerStats.strength,
              1 / 3,
            ) * 100,
          ) / 100,
      };

      let upgradedPayload = { ...basePayload };

      // Fetch and apply equipment bonuses
      const slots = ["head", "torso", "legs", "feet", "weapon"];
      try {
        const responses = await Promise.all(
          slots.map(async (slot) => {
            if (!accountData.equipment[slot]) return null;
            try {
              const response = await axios.get(
                `${config.backendUrl}/items/${accountData.equipment[slot].name}`,
              );
              return response.data ? { slot, data: response.data[0] } : null;
            } catch (error) {
              console.error(`Failed to fetch item stats for ${slot}:`, error);
              return null;
            }
          }),
        );

        responses.forEach((result) => {
          if (!result || !result.data?.stats) return;
          let itemStats;
          try {
            itemStats = JSON.parse(result.data.stats);
          } catch (error) {
            console.error(
              `Failed to parse stats for item in slot ${result.slot}:`,
              result.data.stats,
            );
            return;
          }

          // Apply stat boosts
          Object.keys(itemStats).forEach((stat) => {
            if (typeof itemStats[stat] === "number") {
              upgradedPayload[stat] =
                (upgradedPayload[stat] || 0) + itemStats[stat];
            }
          });
        });
      } catch (error) {
        console.error("Unexpected error in loadStats:", error);
      }

      setBaseStats(basePayload);
      setUpgradedStats(upgradedPayload);
    };

    if (accountData) loadStats();
  }, [accountData]);

  const equipItem = async (slot, itemId) => {
    try {
      // Post request to backend to update equipment
      const response = await axios.post(
        `${config.backendUrl}/update-equipment`,
        {
          userId, // User ID (required for backend)
          slot, // Slot in which the item should be equipped (e.g., head, torso)
          itemId: itemId || null, // ID of the item to equip, or null to de-equip
          inventory, // Current inventory of the user
        },
        {
          withCredentials: true,
        },
      );

      // Check if the backend response is successful
      if (response.status === 200) {
        // Update the account data with the new item equipped
        setAccountData((prev) => {
          let selectedItem;

          if (itemId !== null) {
            // If itemId is not null, find the item in the inventory
            selectedItem = prev.inventory.find((item) => item.id === itemId);

            // If the item is not found, set it to a default value
            if (!selectedItem) {
              console.warn(`Item with id ${itemId} not found in inventory.`);
              selectedItem = { id: "", name: "None", type: slot }; // Default item
            }
          } else {
            // If itemId is null (de-equipping), set selectedItem to default "None"
            selectedItem = { id: "", name: "None", type: slot };
          }

          return {
            ...prev,
            equipment: {
              ...prev.equipment,
              [slot]: selectedItem,
            },
          };
        });

        // Optionally, re-fetch account data (this ensures the state is synchronized with the backend)
        await fetchAccountData(userId);
      } else {
        console.error(
          "Failed to update equipment, backend response:",
          response,
        );
      }
    } catch (error) {
      console.error(
        "Error equipping item:",
        error.response?.data?.error || error.message,
      );
    }
  };

  const equipmentSlots = [
    { slot: "head", top: "15.8%", left: "48.3%", zIndex: 100 },
    { slot: "torso", top: "44%", left: "46.85%", zIndex: 98 },
    { slot: "legs", top: "70%", left: "50%", zIndex: 90 },
    { slot: "feet", top: "90.6%", left: "51.62%", zIndex: 80 },
    { slot: "weapon", top: "50%", left: "50%", zIndex: 99 },
  ];

  const openScrapbox = async (scrapboxId) => {
    try {
      const response = await axios.post(
        `${config.backendUrl}/open-scrapbox`,
        {
          userId,
          scrapboxId,
        },
        {
          withCredentials: true,
        },
      );

      console.log(response.data.error);

      const { rewardedItem, rewardData, remainingScrapboxes } = response.data;
      console.log(`You received: ${rewardedItem}`);

      // 🎉 Show popup with rewarded item
      setPopups((prev) => [
        ...prev,
        {
          id: Date.now(),
          name: rewardedItem,
          message: `You received ${rewardedItem}!`,
          image: rewardData.image_url,
          success: true,
        },
      ]);

      fetchAccountData();

      // 📦 Update local inventory
      // setInventory(prevInventory => {
      //     const updated = { ...prevInventory };

      //     // 1. Add reward item
      //     const rewardKey = Object.keys(updated).find(key => updated[key].name === rewardedItem);
      //     if (rewardKey) {
      //     updated[rewardKey].quantity += 1;
      //     } else {
      //     updated[rewardData.id] = {
      //         name: rewardData.name,
      //         type: rewardData.type,
      //         quantity: 1
      //     };
      //     }

      //     // 2. Update or remove scrapbox
      //     const boxKey = Object.keys(updated).find(key => key === scrapboxId);
      //     if (boxKey) {
      //     if (remainingScrapboxes > 0) {
      //         updated[boxKey].quantity = remainingScrapboxes;
      //     } else {
      //         delete updated[boxKey];
      //     }
      //     }

      //     return updated;
      // });
    } catch (error) {
      console.error("Failed to open scrapbox:", error);
      setPopups((prev) => [
        ...prev,
        {
          id: Date.now(),
          name: "Scrapbox",
          message: "Failed to open scrapbox.",
          success: false,
        },
      ]);
    }
  };

  const openGateCreation = (key) => {
    setGateKey(key);
    setGateCreation(true);
  };

  // if (!accountData) return <p>Loading...</p>;

  const equipment = accountData?.equipment;

  const desiredOrder = [
    "head",
    "torso",
    "legs",
    "feet",
    "material",
    "scrapbox",
  ];

  const ownedUniqueItemIds = new Set(inventory.map((item) => item.id));
  const ownedCount = ownedUniqueItemIds.size;

  // Placeholder icons for empty slots
  const SLOT_ICONS = {
    head: faHelmetSafety,
    torso: faTShirt,
    legs: faShoePrints, // Using a generic icon, could be faMale for pants
    feet: faShoePrints,
    weapon: faHammer,
  };

  return (
    <div className="w-full grid xl:grid-cols-6 lg:grid-cols-5 md:grid-cols-3 grid-cols-1 p-6">
      <div className="relative lg:col-start-2 md:col-start-2 col-start-1 col-span-5 rounded-lg h-full">
        <h1 className="text-5xl tracking-widest font-bold text-center mb-4 font-solo text-text">
          Inventory
        </h1>
        {activeTab === "loadout" && (
          <>
            <div
              className="lg:gap-3 gap-y-2 grid lg:grid-cols-3 grid-cols-1 group relative w-full p-6 mb-3 bg-gray-900 border border-gray-700
                            rounded-md"
            >
              {equipment && <CharacterDisplay equipment={equipment} />}

              {/* Item Select Section */}
              <div className="w-full col-span-2 bg-gray-700 p-8 rounded-md shadow-2xl border border-gray-600">
                <h2 className="text-3xl text-center text-text font-solo font-bold mb-6">
                  Equipment Loadout
                </h2>

                <div className="flex items-center justify-center flex-wrap gap-8">
                  {["head", "torso", "legs", "feet", "weapon"].map((slot) => (
                    <div key={slot} className="text-center">
                      <h4 className="text-lg font-extrabold text-white capitalize">
                        {slot}
                      </h4>

                      {equipment && (
                        <select
                          value={equipment[slot]?.id || ""}
                          onChange={(e) => equipItem(slot, e.target.value)}
                          className="mt-3 w-48 px-4 py-2 rounded-lg bg-gray-900 border-2 border-gray-600 text-white text-sm appearance-none hover:border-primary focus:outline-none focus:ring-2 focus:ring-primary transition-all duration-200"
                        >
                          <option value="">None</option>
                          {Array.isArray(inventory) &&
                            inventory
                              .filter(
                                (item) =>
                                  item.type === slot ||
                                  equipment[slot]?.id === item.id,
                              )
                              .map((item) => (
                                <option
                                  key={item.id}
                                  value={item.id}
                                  className="font-semibold font-solo"
                                  style={rarityStyles[item.rarity]}
                                >
                                  {item.name}
                                </option>
                              ))}
                        </select>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <h1 className="text-3xl w-full font-bold text-center text-white mt-4 mb-2 font-solo drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] tracking-wider">
              Owned Items
            </h1>
            <div className="text-center text-white text-md mb-4">
              Collected:{" "}
              <span className="font-bold text-text">{ownedCount}</span> /{" "}
              {TOTAL_COLLECTIBLE_ITEMS}
            </div>

            {/* Remove the old rarity badge row and insert the new legend above 'Owned Items' */}
            <div className="flex items-center justify-center flex-wrap gap-2 mb-4 text-xs text-text">
              <span className="flex items-center gap-1">
                <span
                  className="inline-block w-3 h-3 rounded-full"
                  style={{ background: "#b76f44" }}
                ></span>{" "}
                Peasantly
              </span>
              <span>{"<"}</span>
              <span className="flex items-center gap-1">
                <span
                  className="inline-block w-3 h-3 rounded-full"
                  style={{ background: "#009688" }}
                ></span>{" "}
                Artisan
              </span>
              <span>{"<"}</span>
              <span className="flex items-center gap-1">
                <span
                  className="inline-block w-3 h-3 rounded-full"
                  style={{ background: "#cccccc" }}
                ></span>{" "}
                Knightly
              </span>
              <span>{"<"}</span>
              <span className="flex items-center gap-1">
                <span
                  className="inline-block w-3 h-3 rounded-full"
                  style={{ background: "#e06666" }}
                ></span>{" "}
                Noble
              </span>
              <span>{"<"}</span>
              <span className="flex items-center gap-1">
                <span
                  className="inline-block w-3 h-3 rounded-full"
                  style={{ background: "#ffd966" }}
                ></span>{" "}
                Kingly
              </span>
              <span>{"<"}</span>
              <span className="flex items-center gap-1">
                <span
                  className="inline-block w-3 h-3 rounded-full"
                  style={{ background: "#9900ff" }}
                ></span>{" "}
                Emperor
              </span>
            </div>

            {inventory.length === 0 && (
              <div className="text-center text-white">
                You have no items right now.
              </div>
            )}

            {inventory.length > 0 &&
              Object.entries(
                inventory.reduce((acc, item) => {
                  acc[item.type] = acc[item.type] || [];
                  acc[item.type].push(item);
                  return acc;
                }, {}),
              )
                .sort(
                  ([a], [b]) =>
                    desiredOrder.indexOf(a) - desiredOrder.indexOf(b),
                )
                .map(([type, items]) => (
                  <div key={type} className="mb-8">
                    <h2 className="text-2xl font-bold text-white capitalize mb-4 font-solo tracking-wider drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]">
                      {type}
                    </h2>
                    {/* --- ITEM GRID --- */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">
                      {items.map((item) => {
                        const isEquipped = Object.values(equipment || {}).some(
                          (eq) => eq?.id === item.id,
                        );

                        return (
                          // --- RPG ITEM SLOT ---
                          <div
                            key={item.id}
                            // 3. Add tooltip event handlers here
                            onMouseEnter={() => showTooltip(item)}
                            onMouseLeave={hideTooltip}
                            className={`relative group aspect-square w-full bg-slate-900/50 rounded-md p-2 flex flex-col items-center justify-center border-2 ${
                              rarityBorder[item.rarity]
                            } shadow-inner shadow-black/50 transition-all duration-200 hover:scale-110 hover:bg-slate-800/80 cursor-pointer ${
                              isEquipped
                                ? "ring-4 ring-offset-2 ring-offset-slate-900 ring-amber-400"
                                : ""
                            }`}
                          >
                            {/* Rarity/Quantity Badges can stay if you like */}

                            {/* Item Image */}
                            {item.image_url && (
                              <img
                                src={item.image_url}
                                alt={item.name}
                                // Make the image larger to fill the slot
                                className="w-32 h-32 object-contain pixel-art transition-transform duration-200 group-hover:scale-105"
                              />
                            )}

                            {/* <h1 className="font-solo text-center text-text">
                              {item.name}
                            </h1> */}

                            {/* Quantity Badge */}
                            {item.quantity > 1 && (
                              <span className="absolute bottom-1 right-1 bg-slate-900 text-white text-xs font-bold px-2 py-0.5 rounded-full shadow-lg">
                                x{item.quantity}
                              </span>
                            )}

                            {/* --- Note: Item name has been removed from the slot --- */}
                            {/* It will now appear in the tooltip for a cleaner UI */}

                            {/* Action buttons can stay, but are often better in a context menu or the tooltip itself */}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}

            <div className="fixed max-w-md bottom-5 right-5 flex flex-col-reverse items-end space-y-reverse space-y-3 z-[99999]">
              {popups.map(({ id, icon, name, quantity, message, success }) => (
                <ItemPopup
                  key={id}
                  icon={icon}
                  name={name}
                  quantity={quantity}
                  message={message}
                  success={success}
                  onClose={() =>
                    setPopups((prev) => prev.filter((p) => p.id !== id))
                  }
                />
              ))}
            </div>
          </>
        )}
        {activeTab === "crafting" && (
          <CraftingSystem
            inventory={inventory}
            updateInventory={fetchAccountData}
          />
        )}
        <GateSuccessModal
          isOpen={successOpen}
          onClose={() => setSuccessOpen(false)}
        />{" "}
      </div>
    </div>
  );
}

export default Inventory;

function GateSuccessModal({ isOpen, onClose }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 bg-black/85 flex items-center justify-center z-[999999]">
          <motion.div
            key="gate-success"
            initial={{ scale: 0.9, opacity: 0, y: 40 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 40 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="bg-gradient-to-br from-gray-900 to-black border border-green-400 rounded-md max-h-3xl shadow-[0_0_30px_rgba(34,197,94,0.7)] p-8 w-full max-w-lg relative text-center"
          >
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute z-50 top-4 right-4 text-gray-400 hover:text-white transition text-xl"
              aria-label="Close success modal"
            >
              <FontAwesomeIcon icon={faX} />
            </button>

            {/* Success Icon */}
            <div className="flex justify-center mb-4">
              <FontAwesomeIcon
                icon={faCheckCircle}
                className="text-green-500 drop-shadow-[0_0_20px_rgba(34,197,94,0.9)]"
                size="4x"
              />
            </div>

            {/* Title */}
            <h2 className="text-3xl font-solo font-extrabold text-green-400 drop-shadow-md mb-2">
              Gate Created!
            </h2>

            {/* Description */}
            <p className="text-gray-300 text-sm max-w-md mx-auto mb-6">
              Your gate has been successfully created and is now live. Other
              players will be able to see and challenge it.
            </p>

            {/* Action button */}
            <button
              onClick={onClose}
              className="px-6 py-2 bg-green-600 hover:bg-green-500 rounded-lg font-bold text-white shadow-lg shadow-green-600/50 transition"
            >
              Awesome!
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
