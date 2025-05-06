import React, { useState, useEffect } from "react";
import axios from "axios";
import config from "../config";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUsers, faTasks, faSignOutAlt, faUserPlus, faGem, faScroll, faPlus, faMinus, faCoins, faHouse } from "@fortawesome/free-solid-svg-icons";
import { useNavigate } from "react-router-dom";
import { FaGem } from "react-icons/fa";
import { use } from "react";
import GuildHall from "./GuildHall";
import GuildGemsPage from "./GuildGemsPage";

const UserGuildPage = ({ guildName }) => {
  const userId = JSON.parse(localStorage.getItem("user"))?.id;
  const [guild, setGuild] = useState(null);
  const [guildQuests, setGuildQuests] = useState([]);
  const [members, setMembers] = useState([]);
  const [groupQuests, setGroupQuests] = useState([]);
  const [requestList, setRequestList] = useState([]); // State for request_list
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("quests");
  const [guildQuestProgress, setGuildQuestProgress] = useState([]);
  const navigate = useNavigate();

  const [isOpen, setIsOpen] = useState(false);

  // Function to toggle the accordion
  const toggleAccordion = () => setIsOpen(!isOpen);

  const fetchGuild = async () => {
    try {
      const response = await axios.get(`${config.backendUrl}/user-guild`, {
        params: { name: guildName, userId: userId }
      });

      setGuild(response.data);
      setMembers(JSON.parse(response.data.members));
      setGroupQuests(JSON.parse(response.data.group_quests));
      setRequestList(JSON.parse(response.data.request_list || "[]")); // Parse request_list safely
    } catch (err) {
      setError("Error fetching guild information");
    }
  };

  useEffect(() => {
    fetchGuild();
  }, [userId, guildName]);

  const fetchGuildQuests = async () => {
    try {
      const response = await axios.get(`${config.backendUrl}/guild-quests`);
      
      const parsedQuests = response.data.map(quest => ({
        id: quest.id,
        name: quest.name,
        description: quest.description,
        difficulty: quest.difficulty,
        reward: quest.reward,
        price: quest.price,
        completion_criteria: JSON.parse(quest.completion_criteria || '{}'),
        stat_reward: JSON.parse(quest.stat_reward || '{}'),
        item_reward: JSON.parse(quest.item_reward || '{}'),
        currency_reward: quest.currency_reward,
    }));

      setGuildQuests(parsedQuests);
    } catch (err) {
      setError("Error fetching guild information");
    }
  };

  

  const leaveGuild = async () => {
    try {
      await axios.post(`${config.backendUrl}/leave-guild`, { name: guildName, userId: userId });
      alert("You have left the guild.");
      window.location.href = "/guilds";
    } catch (err) {
      alert("Error leaving the guild.");
    }
  };

  const handleUserClick = (userId) => {
    navigate(`/account/${userId}`);
  };

  const handleGuildRequest = async (userId, username, action) => {
    try {
      const response = await axios.post(`${config.backendUrl}/handle-guild-request`, {
        name: guildName, // Ensure you have this value
        userId,
        username,
        action,
      });
  
      alert(response.data.message); // Show success message
      fetchGuild();
      // setRequestList(requestList.filter(id => id !== userId)); // Update UI
    } catch (error) {
      alert(error.response?.data?.error || "Failed to process request");
      console.error("Error processing request:", error);
    }
  };

  const selectGuildQuest = async (questId, userId, guildName) => {
    try {
      const response = await axios.post(`${config.backendUrl}/select-guild-quest`, {
        questId,
        userId,
        guildName,
      });
      // console.log('Quest successfully added:', response.data);
      setGroupQuests(response.data);
      fetchGuild();
    } catch (error) {
      console.error('Error adding quest to guild:', error.response ? error.response.data : error.message);
      return { error: error.response ? error.response.data : error.message };
    }
  };

  const fetchAllQuestProgress = async () => {    
    try {
        const progressPromises = groupQuests.map(async (quest) => {
            try {
                const response = await axios.post(`${config.backendUrl}/calculate-total-completions`, {
                    groupQuestId: quest.id,
                    guildName: guildName
                });
                return { questId: quest.id, completedCount: response.data.completedCount };
            } catch (error) {
                console.error(`Error fetching progress for quest ${quest.id}:`, error.response ? error.response.data : error.message);
                return { questId: quest.id, completedCount: 0 };  // Return 0 on error
            }
        });

        const results = await Promise.all(progressPromises);

        console.log(results);
        setGuildQuestProgress(results);

    } catch (error) {
        console.error('Error fetching all quest progress:', error);
    }
  };

  const finishGroupQuest = async (questId, userId, guildName) => {
    await axios.post(`${config.backendUrl}/finish-guild-quest`, { 
      questId, 
      userId,
      guildName,
    })
      .then(() => {
          // alert('Quest completed successfully!');
          
          // console.log("Showing the popup now");
          // showStatPopup = true;
          // console.log(showStatPopup);\
          fetchGuild();          
      })
      .catch((error) => {
          console.error('Error finishing quest:', error);
          alert(`Failed to complete quest: ${error.response?.data?.error || 'Unknown error'}`);
      });
  }


  useEffect(() => {
    fetchGuildQuests();
    fetchAllQuestProgress();
  }, [userId, guildName, groupQuests])
  


  if (error) return <div className="text-red-500 text-center mt-6">{error}</div>;
  if (!guild) return <div className="text-white text-center mt-6">Loading...</div>;

  // Check if the logged-in user is an admin
  const currentUser = members.find((member) => member.userId === userId);
  const isAdmin = currentUser?.role === "admin";

  return (
    <div className="grid 2xl:grid-cols-6 lg:grid-cols-5 md:grid-cols-3 grid-cols-1 min-h-screen text-white p-6">
      <div className="col-span-4 col-start-1 md:col-start-2 lg:col-start-2 text-white">
        <h1 className="text-4xl font-bold text-center">{guild.name}</h1>
        <p className="text-center text-gray-300">{guild.description}</p>
        <p className="text-center text-orange-500 mb-4 text-md flex items-center justify-center"><FaGem className="mr-2"/> Guild Gems: {guild.guild_gems}</p>


        {/* Tabs Navigation */}
        <div className="flex gap-2 justify-center mb-4 flex-wrap">
          <button
            className={`px-6 py-2 font-bold rounded-md ${
              activeTab === "quests" ? "bg-indigo-600 text-white" : "bg-gray-600 hover:bg-gray-500 text-white"
            }`}
            onClick={() => setActiveTab("quests")}
          >
            {/* <FontAwesomeIcon icon={faTasks} className="mr-2" /> */}
            Quests
          </button>
          <button
            className={`px-6 py-2 font-bold rounded-md ${
              activeTab === "guild hall" ? "bg-indigo-600 text-white" : "bg-gray-600 hover:bg-gray-500 text-white"
            }`}
            onClick={() => setActiveTab("guild hall")}
          >
            {/* <FontAwesomeIcon icon={faHouse} className="mr-2" /> */}
            Hall
          </button>
          <button
            className={`px-6 py-2 font-bold rounded-md ${
              activeTab === "members" ? "bg-indigo-600 text-white" : "bg-gray-600 hover:bg-gray-500 text-white"
            }`}
            onClick={() => setActiveTab("members")}
          >
            {/* <FontAwesomeIcon icon={faUsers} className="mr-2" /> */}
            Members
          </button>
          <button
            className={`px-6 py-2 font-bold rounded-md ${
              activeTab === "gems" ? "bg-indigo-600 text-white" : "bg-gray-600 hover:bg-gray-500 text-white"
            }`}
            onClick={() => setActiveTab("gems")}
          >
            {/* <FontAwesomeIcon icon={faUsers} className="mr-2" /> */}
            Gems
          </button>
        </div>

        {/* Tab Content */}
        <div className="bg-gray-700 p-6 rounded-lg shadow-lg">
          {activeTab === "members" && (
            <>
              <h2 className="text-2xl font-semibold mb-4 text-center">
                <FontAwesomeIcon icon={faUsers} className="mr-2" />
                Members ({members.length})
              </h2>
              <ul className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {members.map((member) => (
                  <li
                    key={member.id}
                    className="bg-gray-800 p-4 rounded-lg text-center cursor-pointer hover:scale-105 duration-200 transition-all hover:bg-gray-600"
                    onClick={() => handleUserClick(member.userId)}
                  >
                    <p className="font-semibold">{member.username}</p>
                    <p className={`ml-auto ${member.role === 'admin' ? 'text-yellow-300' : 'text-white'}`}>- {member.role} -</p>
                  </li>
                ))}
              </ul>

              {/* Admin Section: Display Pending Requests */}
              {isAdmin && (
                <div className="mt-6 w-full">
                  <h2 className="text-2xl font-semibold mb-4 text-center">
                    <FontAwesomeIcon icon={faUserPlus} className="mr-2" />
                    Pending Requests ({requestList.length})
                  </h2>
                  <div>
                  {requestList.length > 0 ? (
                    <ul className="bg-gray-800 p-4 rounded-lg">
                      {requestList.map((request) => (
                        <li
                          key={request.userId}
                          className="text-white p-2 border-b border-gray-600 flex items-center justify-between"
                        >
                          <span>
                            {request.username}
                          </span>
                          <div className="flex gap-2">
                            <button className="bg-indigo-600 px-3 py-1 rounded-md hover:bg-indigo-500 transition" onClick={() => handleUserClick(request.userId)}>
                              View
                            </button>
                            <button 
                              onClick={() => handleGuildRequest(request.userId, request.username, "accept")} 
                              className="bg-green-600 px-3 py-1 rounded-md hover:bg-green-500 transition"
                            >
                              Accept
                            </button>
                            <button 
                              onClick={() => handleGuildRequest(request.userId, request.username, "reject")} 
                              className="bg-red-600 px-3 py-1 rounded-md hover:bg-red-500 transition"
                            >
                              Decline
                            </button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-gray-300 text-center">No pending requests.</p>
                  )}
                  </div>

                </div>
              )}
            </>
          )}

          {activeTab === "quests" && (
            <>
              
              <h2 className="text-2xl font-semibold mb-4 text-center">
                <FontAwesomeIcon icon={faTasks} className="mr-2" />
                Guild Quests
              </h2>
              
              <div>
              {groupQuests.length > 0 ? (
                <ul className="space-y-4">
                  {groupQuests.map((quest) => {
                    // Find the quest details by matching the quest.id with guildQuests
                    const questDetails = guildQuests.find((q) => q.id === quest.id);
                    
                    return questDetails ? (
                      <li key={quest.id} className="bg-gray-800 p-4 rounded-lg">
                        <h3 className="font-semibold">{questDetails.name}</h3>
                        <p className="text-gray-300">{questDetails.description}</p>
                        <div className="flex flex-col mt-2">
                          {/* Stat Reward */}
                          <h3 className="text-md font-semibold text-gray-300 flex items-center">
                            Stat Reward:
                          </h3>
                          <p className="text-sm text-blue-400">
                            {questDetails.stat_reward && (
                              <>
                              {questDetails.stat_reward.strength && (
                                  <li className="text-red-500">
                                  Strength:{" "}
                                  +{questDetails.stat_reward.strength}
                                  </li>
                              )}
                              {questDetails.stat_reward.endurance && (
                                  <li className="text-green-500">
                                  Endurance: +{questDetails.stat_reward.endurance}
                                  </li>
                              )}
                              {questDetails.stat_reward.bravery && (
                                  <li className="text-blue-500">
                                  Bravery: +{questDetails.stat_reward.bravery}
                                  </li>
                              )}
                              {questDetails.stat_reward.intelligence && (
                                  <li className="text-yellow-500">
                                  Intelligence: +{questDetails.stat_reward.intelligence}
                                  </li>
                              )}
                              </>
                            )}
                          </p>
                        </div>
                        <div className="flex flex-col mt-2">
                          <h3 className="text-md font-semibold text-gray-300 flex items-center">
                            Gem Reward:
                          </h3>
                          <p className="text-sm text-orange-500 flex items-center"><FaGem className="mr-2"/> {questDetails.currency_reward} Guild Gems</p>
                        </div>
                        <p className="text-sm text-gray-500">
                          Selected on: {new Date(quest.selectedDate).toLocaleString()}
                        </p>
                        <div className="space-y-3 mt-2">
                        {console.log(quest.claimedMembers.includes(Number(userId)))}

                        {((guildQuestProgress?.find((q) => q.questId === quest.id)?.completedCount ?? 0) / questDetails.completion_criteria.quantity) * 100 >= 100 ? (
                          // Check if user has already claimed the reward
                          (quest.claimedMembers || []).includes(userId) ? (
                            <>
                            <p className="bg-gray-500 text-white font-bold py-2 px-4 rounded w-full transition duration-300 text-sm font-medium text-white text-center">Already claimed</p>
                            {console.log(quest.claimedMembers.includes(userId))}
                            
                            </>
                          ) : (
                            <button 
                              className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded w-full transition duration-300"
                              onClick={() => finishGroupQuest(quest.id, userId, guildName)}
                            >
                              Claim Reward    
                              {console.log(quest.id)}                        
                            </button>
                          )
                        ) : (
                          // Show the progress bar otherwise
                          <>
                            <div className="w-full bg-gray-300 rounded-full h-4">
                              <div
                                className="bg-gradient-to-r relative from-indigo-600 to-indigo-400 h-4 rounded-full transition-all duration-300 ease-in-out"
                                style={{
                                  width: `${((guildQuestProgress?.find((q) => q.questId === quest.id)?.completedCount ?? 0) / questDetails.completion_criteria.quantity) * 100}%`,
                                }}
                              />
                            </div>

                            <div className="flex justify-between text-xs font-semibold text-blueGray-600">
                              <span>
                                {((guildQuestProgress?.find((q) => q.questId === quest.id)?.completedCount ?? 0) / questDetails.completion_criteria.quantity) * 100}%
                              </span>
                              <p className="text-sm font-medium w-64 text-white text-center">
                                {guildQuestProgress?.find((q) => q.questId === quest.id)?.completedCount ?? 0} / {questDetails.completion_criteria.quantity}
                              </p>
                              <span>Progress</span>
                            </div>
                          </>
                        )
                      }

                        </div>


                      
                      </li>
                    ) : null; // If quest not found, return null (can handle errors if needed)
                  })}
                </ul>
              ) : (
                <p className="text-gray-300">No quests available.</p>
              )}
              </div>

              {isAdmin && (
                <div className="mt-4">
                  <h2 className="text-2xl font-semibold mb-4 cursor-pointer text-center" onClick={toggleAccordion} >
                    <FontAwesomeIcon icon={faScroll} className="mr-2" />
                    Initiate Quests
                    <FontAwesomeIcon className="ml-2" icon={isOpen ? faMinus : faPlus} />
                  </h2>
                  {isOpen && (
                    <>
                    {guildQuests.length > 0 ? (
                      <div className="rounded-lg grid lg:grid-cols-2 grid-cols-1 gap-4">
                        
                        {guildQuests.map((quest, index) => {
                          // State to manage whether a quest is expanded or not

                          return (
                            <div
                              key={index}
                              className="bg-gray-800 p-6 rounded-xl shadow-lg text-white transition-all hover:shadow-2xl"
                            >
                              {/* Quest Name - clickable to toggle details */}
                              <div>
                                <h2 className="text-3xl font-bold mb-4 text-center">{quest.name}</h2>
                                <p className="text-gray-300 mb-4 text-center">{quest.description || "No description available"}</p>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                <div className="flex flex-col">
                                  {/* Completion Criteria */}
                                  <h3 className="text-lg font-semibold text-gray-300 flex items-center">
                                    Completion Criteria:
                                  </h3>
                                  <p className="text-sm mt-2 text-gray-400">
                                    {quest.completion_criteria
                                      ? `Guild needs to complete ${quest.completion_criteria.quantity} ${quest.completion_criteria.stat} quests.`
                                      : "No criteria specified"}
                                  </p>
                                </div>

                                <div className="flex flex-col">
                                  <h3 className="text-lg font-semibold text-gray-300 flex items-center">
                                    Gems Reward:
                                  </h3>
                                  <p className="text-sm mt-2 text-orange-500 flex items-center"><FaGem className="mr-2"/> {quest.currency_reward} Guild Gems</p>
                                </div>

                                <div className="flex flex-col">
                                  {/* Stat Reward */}
                                  <h3 className="text-lg font-semibold text-gray-300 flex items-center">
                                    Stat Reward:
                                  </h3>
                                  <p className="text-sm mt-2 text-blue-400">
                                    {quest.stat_reward && (
                                      <>
                                      {quest.stat_reward.strength && (
                                          <li className="text-red-500">
                                          Strength:{" "}
                                          +{quest.stat_reward.strength}
                                          </li>
                                      )}
                                      {quest.stat_reward.endurance && (
                                          <li className="text-green-500">
                                          Endurance: +{quest.stat_reward.endurance}
                                          </li>
                                      )}
                                      {quest.stat_reward.bravery && (
                                          <li className="text-blue-500">
                                          Bravery: +{quest.stat_reward.bravery}
                                          </li>
                                      )}
                                      {quest.stat_reward.intelligence && (
                                          <li className="text-yellow-500">
                                          Intelligence: +{quest.stat_reward.intelligence}
                                          </li>
                                      )}
                                      </>
                                    )}
                                  </p>
                                </div>

                                {/* <div className="flex flex-col">
                                  <h3 className="text-lg font-semibold text-gray-300 flex items-center">
                                    Item Reward:
                                  </h3>
                                  <p className="text-sm mt-2 text-yellow-400">
                                    {Object.keys(quest.item_reward).length > 0
                                      ? Object.entries(quest.item_reward)
                                          .map(([key, value]) => `${key}: ${value}`)
                                          .join(", ")
                                      : "No item reward"}
                                  </p>
                                </div> */}

                                <div className="flex flex-col">
                                  {/* Price */}
                                  <h3 className="text-lg font-semibold text-gray-300 flex items-center">
                                    Cost:
                                  </h3>
                                  <p className="text-sm mt-2 text-orange-500 flex items-center"><FaGem className="mr-2"/>  {quest.price || 0} Guild Gems</p>
                                </div>

                                {/* <div className="flex flex-col">
                                  <h3 className="text-lg font-semibold text-gray-300 flex items-center">
                                    Difficulty:
                                  </h3>
                                  <p className="text-sm mt-2 text-purple-400">{quest.difficulty || "Unknown"}</p>
                                </div> */}
                              </div>
                              <button className={`w-full bg-indigo-600 px-4 py-2 rounded-md transition-all duration-200 
                                ${Array.isArray(groupQuests) && !groupQuests.some(guildQuest => guildQuest.id === quest.id) && guild.guild_gems > quest.price 
                                  ? 'bg-indigo-600 hover:scale-[102%] hover:bg-indigo-500' 
                                  : 'bg-gray-400'}`} 
                                  onClick={() => selectGuildQuest(quest.id, userId, guildName)}>
                                  {Array.isArray(groupQuests) && !groupQuests.some(guildQuest => guildQuest.id === quest.id) 
                                    ? "Select Quest" 
                                    : "This quest is already selected"}
                              </button>

                            
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-gray-300">No pending requests.</p>
                    )}
                    </>
                  )}
                </div>
              )}
            </>
          )}

          {activeTab === "guild hall" && (
            <GuildHall guild={guild} onUpdate={fetchGuild}/>
          )}

          {activeTab === "gems" && (
            <GuildGemsPage guild={guild} onUpdate={fetchGuild}/>
          )}
        </div>

        {/* Leave Guild Button */}
        <button
          onClick={leaveGuild}
          className="w-full mt-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-500 transition duration-200 flex items-center justify-center"
        >
          <FontAwesomeIcon icon={faSignOutAlt} className="mr-2" />
          Leave Guild
        </button>
      </div>
    </div>
  );
};

export default UserGuildPage;
