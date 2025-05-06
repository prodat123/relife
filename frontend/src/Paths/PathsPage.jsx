import React, { useContext, useEffect, useState } from 'react';
import axios from 'axios';
import config from '../config';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowUpRightDots, faChartBar, faCodeBranch, faCoins, faCompass, faDna, faExclamation, faFlag, faGift, faLocation, faLocationArrow, faLock, faMap, faMapMarkedAlt, faQuestionCircle, faRoute, faScroll, faStar, faStepForward, faTags } from '@fortawesome/free-solid-svg-icons';
import CurrentStepPopup from './CurrentStepPopup';
import { UserContext } from '../Account/UserContext';
import { Link } from 'react-router-dom';

const now = new Date();
const year = now.getFullYear();
const month = String(now.getMonth() + 1).padStart(2, '0');
const day = String(now.getDate()).padStart(2, '0');
const date = `${year}-${month}-${day}`;

function PathsPage() {
  const userId = JSON.parse(localStorage.getItem("user"))?.id;
  const { accountDataRef } = useContext(UserContext);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [accountData, setAccountData] = useState({});
  const [activePaths, setActivePaths] = useState([]);
  const [availablePaths, setAvailablePaths] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      if (accountDataRef.current && !dataLoaded) {
        setAccountData(accountDataRef.current);
        setDataLoaded(true);
      }
    }, 300); // Small interval to wait for dataRef update
  
    return () => clearInterval(interval);
  }, [accountDataRef, dataLoaded]);

  useEffect(() => {
    fetchPaths();
  }, [userId]);

  const fetchPaths = async () => {
    try {
      const [activeRes, availableRes] = await Promise.all([
        axios.get(`${config.backendUrl}/paths/active?userId=${userId}`),
        axios.get(`${config.backendUrl}/paths/free`)
      ]);
  
      setActivePaths(activeRes.data);
      setAvailablePaths(availableRes.data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching paths:', err);
      setLoading(false);
    }
  };
  

  const handleSelectPath = async (pathId) => {
    try {
  
      const response = await axios.post(`${config.backendUrl}/paths/select`, {
        userId,
        pathId,
        date
      });
  
      fetchPaths(); // refresh state
    } catch (err) {
      console.log(err);
      alert('Error selecting path:', err);
    }
  };
  

  const handleRemovePath = async (pathId) => {
    try {
      const response = await axios.post(`${config.backendUrl}/path/remove`, {
        userId,
        pathId
      });
      fetchPaths(); // refresh state
    } catch (err) {
      console.log(err);
      alert('Error selecting path:', err);
    }
  };

  
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

  function calculateRank(level) {
    if (level >= 1 && level <= 10) return "F-";
    if (level <= 20) return "F";
    if (level <= 30) return "F+";
    if (level <= 40) return "D-";
    if (level <= 50) return "D";
    if (level <= 60) return "D+";
    if (level <= 70) return "C-";
    if (level <= 80) return "C";
    if (level <= 90) return "C+";
    if (level <= 100) return "B-";
    if (level <= 110) return "B";
    if (level <= 120) return "B+";
    if (level <= 130) return "A-";
    if (level <= 140) return "A";
    if (level <= 150) return "A+";
    if (level <= 175) return "S-";
    if (level <= 200) return "S";
    if (level <= 250) return "S+";
    if (level <= 300) return "S++";
    if (level <= 400) return "Z";
    
    return "??"; // default or unknown rank
  }

  const userRank = calculateRank(calculateLevel(accountData.experience).level);

  const rankOrder = [
    "F-", "F", "F+", "D-", "D", "D+",
    "C-", "C", "C+", "B-", "B", "B+",
    "A-", "A", "A+", "S-", "S", "S+", "S++", "Z"
  ];
  
  const getVisiblePaths = (paths, userRank) => {
    const userIndex = rankOrder.indexOf(userRank);
  
    return paths
      .filter((path) => {
        const requiredIndex = rankOrder.indexOf(path.rankRequirement);
        return requiredIndex !== -1 && requiredIndex <= userIndex + 1; // include current + next rank
      })
      .sort((a, b) => {
        const rankA = rankOrder.indexOf(a.rankRequirement);
        const rankB = rankOrder.indexOf(b.rankRequirement);
        return rankA - rankB; // lower rank first
      });
  };
  

  const visiblePaths = getVisiblePaths(availablePaths, userRank);

  


  if (loading) {
    return <div className="text-center text-gray-500 mt-10">Loading paths...</div>;
  }

  return (
    <div className="w-full grid md:grid-cols-3 grid-cols-1 lg:grid-cols-5 text-white">
      <div className="col-span-5 lg:col-start-2 md:col-start-2 p-6">

      <h2 className="text-4xl font-bold mb-4"><FontAwesomeIcon icon={faArrowUpRightDots} /> Active Paths ({activePaths.length}/1)</h2>
      {activePaths.length === 0 ? (
        <p className="text-gray-500 mb-6">You haven't joined any paths yet.</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 mb-10 w-full">
          {activePaths.map((path) => (
            <div key={path.id} className="rounded-md p-4 shadow-md bg-gray-800 relative">
              <button onClick={() => handleRemovePath(path.id)} className="bg-red-500 px-2 py-1 text-sm rounded-md absolute top-2 right-2">Quit</button>
              <h3 className="text-xl font-semibold text-white">{path.name}</h3>
              <p className="text-sm text-gray-300">Focus: {path.statFocus}</p>
              <p className="text-sm text-gray-300">Difficulty: {path.difficulty}</p>
              <p className="text-sm text-gray-300">Rank Req: {path.rankRequirement}</p>
              <p className="text-sm text-gray-300">Gold Req: {path.goldRequirement}</p>
              <p className="text-sm text-green-400 mt-2">Progress: Step {path.progress + 1} / {JSON.parse(path.steps)?.length}</p>

              {path.resumeTime && (
                <p className="text-sm text-yellow-400">Resume At: {new Date(path.resumeTime).toLocaleString()}</p>
              )}

              {path.completed_at && (
                <p className="text-sm text-blue-400">Completed At: {new Date(path.completed_at).toLocaleString()}</p>
              )}

              {/* Visual Progress Bar */}
              <div className="mt-4">
                <h4 className="text-md font-bold text-white mb-2">Progress:</h4>
                <div className="overflow-x-auto">
                  <div className="flex items-center px-4 py-4 min-w-max space-x-4">
                    {JSON.parse(path.steps)?.map((step, idx) => {
                      const reward = JSON.parse(path.rewards)?.find(r => r.progress === idx + 1);
                      const isCompleted = idx < path.progress;
                      const isCurrent = idx === path.progress;
                      const isLast = idx === JSON.parse(path.steps).length - 1;

                      return (
                        <React.Fragment key={idx}>
                          {/* Step + reward */}
                          <div className="flex flex-col items-center min-w-[64px]">
                            {isCurrent && <p className="text-sm mb-2 text-yellow-400">You're Here</p>}

                            {/* Step Circle */}
                            <div
                              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${isCompleted ? 'bg-green-500 text-white' : isCurrent ? 'bg-yellow-400 text-black' : 'bg-gray-600 text-white'}`}
                            >
                              {idx + 1}
                            </div>

                            {/* Reward Info */}
                            {reward && (
                              <div className="text-xs mt-2 text-center text-gray-300 space-y-1">
                                {reward.itemReward && <p><FontAwesomeIcon icon={faGift} /> {reward.itemReward}</p>}
                                {reward.xpReward && <p><FontAwesomeIcon icon={faDna} /> {reward.xpReward} XP</p>}
                                {reward.goldReward && <p><FontAwesomeIcon icon={faCoins} /> {reward.goldReward}</p>}
                              </div>
                            )}
                          </div>

                          {/* Connector Line */}
                          {!isLast && (
                            <div className="flex-1 h-1 bg-gray-700 relative">
                              <div className={`absolute top-0 left-0 h-full ${isCompleted ? 'bg-green-500 w-full' : isCurrent ? 'bg-yellow-400 w-1/2' : 'bg-gray-500 w-0'}`} />
                            </div>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Steps */}
              <div className="mt-4">
                <h4 className="text-md font-bold text-white mb-1">Steps:</h4>
                <ul className="space-y-2">
                  {JSON.parse(path.steps)?.map((step, idx) => {
                    const isCurrent = idx === path.progress;
                    const tags = step.requirement?.questTags || [];
                    const quests = step.requirement?.questNames || [];
                    const stats = step.requirement?.questStats || [];


                    return (
                      <li
                        key={idx}
                        className={`p-4 border rounded-md shadow-sm transition-all duration-300 ${
                          isCurrent
                            ? 'bg-gray-800 border-yellow-400 hover:scale-[101%]'
                            : 'bg-gray-800 border-gray-600'
                        }`}
                      >
                        {/* Step Header */}
                        <div className="flex items-center mb-2">
                          <div
                            className={`h-8 w-8 rounded-full text-sm font-bold flex items-center justify-center mr-3 ${
                              isCurrent ? 'bg-yellow-400 text-black' : 'bg-gray-600 text-white'
                            }`}
                          >
                            {step.order}
                          </div>
                          <p className={`text-lg font-semibold ${
                            isCurrent ? 'text-yellow-400' : 'text-white'
                          }`}>{step.head}</p>
                        </div>

                        {/* Description */}
                        <p className={`text-sm mb-3 text-gray-300`}>
                          {step.description}
                        </p>

                        {/* Requirements */}
                        <div className="space-y-2 text-sm">
                          {/* Quests */}
                          <div>
                            <p className="font-bold text-white flex items-center mb-1">
                              <FontAwesomeIcon icon={faFlag} className="mr-2" />
                              Required Quests: {step.requirement?.numOfQuests}
                            </p>
                          </div>

                          {/* Tags */}
                          {step.requirement?.questTags?.length > 0 && (
                            <div>
                              <p className="text-gray-400 font-semibold mb-1"><FontAwesomeIcon icon={faTags} className="mr-2" />
                              Tags</p>
                              <div className="flex flex-wrap gap-2">
                                {step.requirement.questTags.map((tag, idx) => (
                                  <span
                                    key={idx}
                                    className="bg-indigo-600 text-white px-3 py-1 rounded-full text-xs"
                                  >
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Quest Names */}
                          {step.requirement?.questNames?.length > 0 && (
                            <div>
                              <p className="text-gray-400 font-semibold mb-1"><FontAwesomeIcon icon={faScroll} className="mr-2" />
                              Quests</p>
                              {step.requirement.questNames.map((quest, idx) => (
                                <div key={idx} className="flex items-center text-white">
                                  {quest}
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Stats */}
                          {step.requirement?.questStats?.length > 0 && (
                            <div>
                              <p className="text-gray-400 font-semibold mb-1"><FontAwesomeIcon icon={faChartBar} className="mr-2" />Stats</p>
                              {step.requirement.questStats.map((stat, idx) => (
                                <div key={idx} className="flex items-center text-white">
                                  {stat}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {isCurrent && (
                          <Link
                            to={`/dashboard?tags=${encodeURIComponent(tags.join(','))}&quests=${encodeURIComponent(quests.join(','))}&stats=${encodeURIComponent(stats.join(','))}`}
                          >
                            <button className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-500 transition">
                              <FontAwesomeIcon icon={faScroll} /> Adjust Quests
                            </button>
                          </Link>
                        )}
                      </li>

                    );
                  })}
                </ul>
              </div>
            </div>
          ))}
        </div>


      )}

      <div className="mb-12">
          <h3 className="text-3xl font-extrabold text-white mb-4 border-b border-indigo-600 pb-2">
            Available Paths
          </h3>

          <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {availablePaths.map((path) => {
              const isLocked = rankOrder.indexOf(userRank) < rankOrder.indexOf(path.rankRequirement);

              return (
                <div
                  key={path.id}
                  className={`relative bg-gray-800 rounded-md p-5 shadow-lg transition duration-200
                   
                  `}
                >
                  {/* Overlay for Locked Paths */}
                  {isLocked && (
                    <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center z-10 rounded-md">
                      <div className="text-red-400 text-md font-semibold">
                        <FontAwesomeIcon icon={faLock} className="mr-1" />
                        Rank {path.rankRequirement}
                      </div>
                    </div>
                  )}

                  {/* Content underneath (will be dimmed if locked) */}
                  <div className={`${isLocked ? 'opacity-40 pointer-events-none' : ''}`}>
                    <h4 className="text-xl font-bold text-white mb-1">{path.name}</h4>
                    <p className="text-sm text-gray-300 mb-1">Stat Focus: {path.statFocus}</p>
                    <p className="text-sm text-gray-300 mb-1">Difficulty: {path.difficulty}</p>
                    <p className="text-sm text-gray-300 mb-1">Gold: {path.goldRequirement}</p>
                    <p className="text-sm text-gray-300 mb-3">Required Rank: {path.rankRequirement}</p>

                    <button
                      disabled={isLocked}
                      className={`w-full px-4 py-2 rounded-md font-medium transition
                        ${isLocked
                          ? 'bg-gray-600 text-gray-300 cursor-not-allowed'
                          : 'bg-indigo-600 text-white hover:bg-indigo-500'}
                      `}
                      onClick={() => handleSelectPath(path.id)}
                    >
                      {isLocked ? 'Locked' : 'Start Path'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>


        </div>

      </div>
    </div>
  );
}

export default PathsPage;
