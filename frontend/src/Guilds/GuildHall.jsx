import { faArrowUp91, faArrowUpRightFromSquare, faCircle, faGem, faHouse, faLevelUpAlt, faLongArrowAltUp, faStar } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import axios from 'axios';
import React, { useEffect, useState } from 'react'
import config from '../config';
import { FaArrowCircleUp } from 'react-icons/fa';

function GuildHall({ guild, onUpdate }) {
  const { members, name, guild_upgrades, guild_gems } = guild;
  const [membersData, setMembersData] = useState([]);
  const [error, setError] = useState([]);
  const [positions, setPositions] = useState([]);
  const [directions, setDirections] = useState([]);
  const userId = JSON.parse(localStorage.getItem('user'))?.id

  const upgradeList = [
    { type: "extraSlots", name: "Gain more Quest Slots", cost: 25, description: "Increase your maximum quest slots." },
    { type: "xpBoost", name: "Boost your XP", cost: 25, description: "Increase XP gained by all members." },
    { type: "questTimerBuff", name: "Reduced Quest Slot Timers", cost: 25, description: "Reduce the quest slot timer." }
  ]




  const getUpgradeLevel = (type) => {
    const upgrades = JSON.parse(guild_upgrades);
    if(upgrades){
      const upgrade = upgrades.find(u => u.type === type);
      return upgrade ? upgrade.level : 0;  // Return 0 if the upgrade doesn't exist
    }
  };

  const fetchAllMembersData = async () => {
    let arrayMembers;
    try {
        if (!Array.isArray(members)) {
            arrayMembers = JSON.parse(members)
        }

        const promises = arrayMembers.map(member => 
            axios.get(`${config.backendUrl}/account`, {
                params: { userId: member.userId }
            })
        );

        const responses = await Promise.all(promises);
        const accounts = responses.map(res => res.data);
        setMembersData(accounts);
    } catch (error) {
        console.error("Error fetching members' account data:", error);
        setError(error.response?.data?.error || "Failed to fetch members' data");
    }
  };


  useEffect(() => {
    if (members && members.length > 0) {
        fetchAllMembersData();
    }
  }, [members]);

  const equipmentSlots = [
    { slot: "head", top: "15.8%", left: "48.3%", zIndex: 100 },
    { slot: "torso", top: "44%", left: "46.85%", zIndex: 98 },
    { slot: "legs", top: "70%", left: "50%", zIndex: 90 },
    { slot: "feet", top: "90.6%", left: "51.62%", zIndex: 80 },
    { slot: "weapon", top: "50%", left: "50%", zIndex: 99 },
  ];

  const handleUpgrade = async (upgradeType, cost) => {
    if (!name || !upgradeType || !userId || !cost) {
        // setMessage("Please fill all fields");
        return;
    }

    console.log(upgradeType);
    // setLoading(true);

    try {
        const response = await axios.post(`${config.backendUrl}/guild-upgrade`, {
            guildName: name,
            upgradeType: upgradeType,
            cost: parseInt(cost),
            userId
        });
        onUpdate();
    } catch (error) {
        // setMessage(error.response?.data?.message || "An error occurred");
    }

    // setLoading(false);
  };


  // Initialize random movement ranges

  useEffect(() => {
      // Initialize with random directions (1 = right, -1 = left)
      const initialDirections = membersData.map(() => (Math.random() < 0.5 ? 1 : -1));
      setDirections(initialDirections);

      const interval = setInterval(() => {
          setDirections((prevDirections) =>
              prevDirections.map(() => (Math.random() < 0.5 ? 1 : -1))
          );
      }, 10000); // Random flip every 3 seconds

      return () => clearInterval(interval);
  }, [membersData]);


  const currentUser = JSON.parse(members)?.find((member) => member.userId === userId);
  const isAdmin = currentUser?.role === "admin";


  return (
    <div>
      <h1 className='text-2xl font-semibold mb-4 text-center'><FontAwesomeIcon icon={faHouse} /> Guild Hall <FontAwesomeIcon icon={faHouse} /></h1>
      <div 
          className="relative w-full h-96 rounded-md bg-cover bg-center bg-blue-400 overflow-hidden"
          style={{ backgroundImage: "url('/sprites/background.png')" }}
      >
          {membersData.map((member, index) => {
              const row = Math.floor(index / 4); // Calculate the row
              const col = index % 4; // Calculate the column
              
              // Generate a random X position (0 to 100%)
              const randomX = 5 + Math.random() * 65;  // Random percentage between 0 and 100
              const baseX = randomX;  // Apply the random X position

              const baseY = 280;  // Position all at the bottom (80% of the height)
              const direction = directions[index] || 1;

              return (
                  <div 
                      key={member.userId}
                      className="absolute flex flex-col justify-center items-center p-4"
                      style={{
                          top: `${baseY}px`,  // Use percentage for top position
                          left: `${baseX}%`, // Apply the random left position
                          width: `200px`,      // Use percentage for width to scale with screen size
                          height: "25%",     // Use percentage for height to scale with screen size
                          transition: "transform 0.5s ease", 
                          transform: "translate(-50%, -50%)", // Center elements
                      }}
                  >
                      <h2 className="text-white text-sm text-center font-bold mb-2">{member.username}</h2>

                      {/* Player Sprite with Random Rotation */}
                      <div 
                          className="character-sprite relative w-3/4"
                          style={{
                              transform: `scaleX(${direction})`,  // Flip sprite
                              transition: "transform 0.5s ease",
                          }}
                      >
                          <img src={"/sprites/player.png"} alt="Base Character" className="w-full pixel-art" />

                          {/* Equipment Sprites */}
                          {equipmentSlots.map(({ slot, top, left, zIndex }) => (
                              <div
                                  key={slot}
                                  style={{
                                      width: "100%",
                                      position: "absolute",
                                      top: top,
                                      left: left,
                                      zIndex: zIndex,
                                      transform: "translate(-50%, -50%)",
                                  }}
                              >
                                  {member.equipment[slot]?.image_url && (
                                      <img
                                          src={`${member.equipment[slot].image_url}?v=${new Date().getTime()}` || "/sprites/equipment/default.png"}
                                          alt={`${member.equipment[slot].name || "None"} Gear`}
                                          className="pixel-art"
                                          style={{
                                              width: "100%",
                                              height: "100%",
                                              objectFit: "fill",
                                              zIndex: 1,
                                              pointerEvents: "none",
                                          }}
                                      />
                                  )}
                              </div>
                          ))}
                      </div>
                  </div>
              );
          })}
      </div>



      <h1 className='text-2xl font-semibold my-4 text-center text-center flex items-center justify-center'><FaArrowCircleUp className='mr-2'/> Guild Upgrades</h1>
      <div className='grid md:grid-cols-1 lg:grid-cols-3 gap-4'>
      {upgradeList.map((upgrade) => {
        const level = getUpgradeLevel(upgrade.type);

        return (
            <div 
                key={upgrade.type} 
                className='col-span-1 bg-gray-800 w-full p-4 rounded-md shadow-lg'
            >
                <h5 className='text-lg font-bold text-white'>{upgrade.name}</h5>
                <h6 className='text-sm text-gray-400'>{upgrade.description}</h6>

                <p className='text-orange-500 text-sm'>
                    Cost: <FontAwesomeIcon icon={faGem} /> {upgrade.cost} Guild Gems
                </p>

                <div className='flex items-center mt-4'>
                    <span className='text-yellow-400 mr-2'>Level:</span>

                    <div className='flex items-center'>
                      {[...Array(5)].map((_, index) => {
                        let circleColorClass = "text-gray-500"; // Default to gray color for unleveled

                        // Determine color based on level
                        if (index < level) {
                            // For levels < current level, make them progressively more green -> red
                            if (index < 1) {
                              circleColorClass = "text-red-500"; // Low levels are green
                            } else if (index < 2) {
                              circleColorClass = "text-orange-500"; // Medium levels are yellow
                            }else if (index < 3) {
                              circleColorClass = "text-yellow-500"; // Medium levels are yellow
                            }else if (index < 4) {
                              circleColorClass = "text-green-500"; // Medium levels are yellow
                            } else {
                              circleColorClass = "text-blue-500"; // Highest level is red
                            }
                        }

                        if(level === 5){
                          circleColorClass = "text-blue-500"
                        }

                        return (
                          <FontAwesomeIcon
                              key={index}
                              icon={faCircle}
                              className={`text-lg mx-1 ${circleColorClass}`}
                          />
                        );
                      })}
                    </div>

                    <span className='ml-2 text-sm text-gray-300'>{level} / 5</span>
                </div>
                {isAdmin && (
                  <>
                  {upgrade.cost <= guild_gems ? 
                  <button 
                      className='bg-green-600 w-full px-4 py-2 rounded-md mt-2 hover:scale-105 transition-all hover:bg-green-500' 
                      onClick={() => handleUpgrade(upgrade.type, upgrade.cost)}
                  >
                      Purchase
                  </button>
                  :
                  <div className='bg-gray-500 rounded-md px-4 py-2 text-center mt-2'>Not Enough Gems</div>
                  }
                  </>
                )}
            </div>
        );
      })}
      </div>
    </div>
  )
}

export default GuildHall