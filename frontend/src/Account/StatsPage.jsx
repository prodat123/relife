import React, { useState, useEffect, useContext } from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import config from "../config";
import DiamondRadarChart from "./DiamondRadarChart";
import axios from "axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faDownload,
  faBrain,
  faChartLine,
  faLightbulb,
  faExclamationTriangle,
  faCheckCircle,
  faArrowUp,
  faArrowDown,
  faMinus,
  faSpinner,
  faCalendarAlt,
  faTrophy,
  faFire,
  faStar,
  faRocket,
  faBullseye,
  faShieldAlt,
  faGraduationCap,
  faDumbbell as faStrength,
  faHeartbeat,
  faBrain as faIntelligence,
  faRunning as faBravery,
  faArrowRight,
} from "@fortawesome/free-solid-svg-icons";
import TotalStatsChart from "./TotalStatsChart";
import { UserContext } from "./UserContext";
import StreakGrid from "../Miscellaneous/StreakGrid";
import { useTooltip } from "../Miscellaneous/TooltipProvider";

ChartJS.register(
  CategoryScale,
  LinearScale,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  Filler,
);

const StatsPage = () => {
  const [data, setData] = useState({
    strength: { labels: [], data: [] },
    intelligence: { labels: [], data: [] },
    bravery: { labels: [], data: [] },
    endurance: { labels: [], data: [] },
  });

  const [totalData, setTotalData] = useState({
    strength: { labels: [], data: [] },
    intelligence: { labels: [], data: [] },
    bravery: { labels: [], data: [] },
    endurance: { labels: [], data: [] },
  });

  const [tags, setTags] = useState({}); // Store tag frequencies
  const [accountData, setAccountData] = useState({});
  const [loading, setLoading] = useState(true);
  const [daysRange, setDaysRange] = useState(7);

  // AI Insights state
  const [insights, setInsights] = useState(null);
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [insightsError, setInsightsError] = useState(null);
  const [activeTab, setActiveTab] = useState("stats"); // 'stats' or 'insights'
  const { accountDataRef } = useContext(UserContext);
  const isLoaded = !!accountDataRef.current;
  const isPremium = accountDataRef.current?.premium === 1;

  const [showPremiumModal, setShowPremiumModal] = useState(false);

  const userId = JSON.parse(localStorage.getItem("user"))?.id;

  const [visibleStats, setVisibleStats] = useState({
    Strength: true,
    Intelligence: true,
    Bravery: true,
    Endurance: true,
  });

  const handleStatVisibilityChange = (statName) => {
    setVisibleStats((prev) => ({
      ...prev,
      [statName]: !prev[statName],
    }));
  };

  useEffect(() => {
    document.title = "Re:LIFE | Stats";
    fetchAccountData();
    fetchStatsData();
    fetchTotalStatsData();
  }, [daysRange, userId]);

  // AI Insights useEffect
  useEffect(() => {
    const interval = setInterval(() => {
      if (accountDataRef.current) {
        setAccountData(accountDataRef.current);
      }
    }, 300);
    return () => clearInterval(interval);
  }, [accountDataRef]);

  const fetchInsights = async () => {
    if (!userId) return;

    setInsightsLoading(true);
    setInsightsError(null);

    try {
      const response = await axios.post(
        `${config.backendUrl}/progress-insights`,
        {
          userId,
          daysRange,
        },
        {
          withCredentials: true,
        },
      );

      setInsights(response.data);
    } catch (err) {
      console.error("Error fetching insights:", err);
      setInsightsError("Failed to load progress insights");
    } finally {
      setInsightsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "insights") {
      fetchInsights();
    }
  }, [daysRange, userId, activeTab]);

  const fetchAccountData = async () => {
    try {
      const response = await axios.get(`${config.backendUrl}/account`, {
        params: { userId: userId },
        withCredentials: true,
      });
      setAccountData(response.data);
    } catch (error) {
      console.error("Error fetching account data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStatsData = async () => {
    try {
      const response = await axios.get(
        `${config.backendUrl}/completed-quests-stats`,
        {
          params: {
            userId: userId,
            daysRange: daysRange,
          },
        },
      );

      const result = response.data;

      const stats = {
        strength: { labels: [], data: [] },
        intelligence: { labels: [], data: [] },
        bravery: { labels: [], data: [] },
        endurance: { labels: [], data: [] },
      };

      const tagCount = {}; // To track the frequency of each tag

      result.forEach(({ date, stats: s, tags }) => {
        // Add stats data
        stats.strength.labels.push(date);
        stats.strength.data.push(s.strength);
        stats.intelligence.labels.push(date);
        stats.intelligence.data.push(s.intelligence);
        stats.bravery.labels.push(date);
        stats.bravery.data.push(s.bravery);
        stats.endurance.labels.push(date);
        stats.endurance.data.push(s.endurance);

        // Loop through the tags array and count the occurrences
        tags.forEach((tag) => {
          tagCount[tag] = tagCount[tag] ? tagCount[tag] + 1 : 1;
        });
      });

      setTags(tagCount); // Update the state with the tag frequencies
      setData(stats);
    } catch (err) {
      console.error("Error fetching stats data:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTotalStatsData = async () => {
    try {
      const response = await axios.get(
        `${config.backendUrl}/total-completed-quests-stats`,
        {
          params: { userId },
        },
      );

      const result = response.data;

      const stats = {
        Strength: { labels: ["Total"], data: [result.stats.strength] },
        Intelligence: { labels: ["Total"], data: [result.stats.intelligence] },
        Bravery: { labels: ["Total"], data: [result.stats.bravery] },
        Endurance: { labels: ["Total"], data: [result.stats.endurance] },
      };

      setTotalData(stats);
    } catch (err) {
      console.error("Error fetching total stats:", err);
    }
  };

  const getWeeklyGain = (arr) => {
    if (!arr.length) return 0;
    return arr.slice(-7).reduce((acc, val) => acc + val, 0);
  };

  const statColors = {
    Strength: {
      borderColor: "rgb(239, 68, 68)",
      backgroundColor: "rgba(239, 68, 68, 0.2)",
    },
    Endurance: {
      borderColor: "rgb(34, 197, 94)",
      backgroundColor: "rgba(34, 197, 94, 0.2)",
    },
    Bravery: {
      borderColor: "rgb(59, 130, 246)",
      backgroundColor: "rgba(59, 130, 246, 0.2)",
    },
    Intelligence: {
      borderColor: "rgb(245, 158, 11)",
      backgroundColor: "rgba(245, 158, 11, 0.2)",
    },
  };

  // AI Insights helper functions
  const getStatIcon = (stat) => {
    const icons = {
      strength: faStrength,
      endurance: faHeartbeat,
      bravery: faBravery,
      intelligence: faIntelligence,
    };
    return icons[stat] || faChartLine;
  };

  const getStatColor = (stat) => {
    const colors = {
      strength: "text-red-500",
      endurance: "text-green-500",
      bravery: "text-blue-500",
      intelligence: "text-yellow-500",
    };
    return colors[stat] || "text-gray-500";
  };

  const getTrendIcon = (trend) => {
    switch (trend) {
      case "improving":
        return <FontAwesomeIcon icon={faArrowUp} className="text-green-500" />;
      case "declining":
        return <FontAwesomeIcon icon={faArrowDown} className="text-red-500" />;
      default:
        return <FontAwesomeIcon icon={faMinus} className="text-gray-500" />;
    }
  };

  const getDifficultyColor = (difficulty) => {
    if (difficulty >= 7) return "text-purple-500";
    if (difficulty >= 5) return "text-red-500";
    if (difficulty >= 3) return "text-yellow-500";
    return "text-green-500";
  };

  const downloadReport = () => {
    if (!insights) return;

    const report = `
Re:LIFE Progress Insights Report
Generated: ${new Date().toLocaleDateString()}
Period: ${insights.summary.period}

SUMMARY:
- Total Quests Completed: ${insights.summary.totalQuests}
- Average Difficulty: ${insights.summary.averageDifficulty.toFixed(1)}
- Unique Activity Types: ${insights.summary.uniqueTags}
- Current Level: ${insights.summary.level}

IMPROVEMENTS:
${Object.entries(insights.improvements)
  .map(
    ([stat, data]) =>
      `- ${stat.charAt(0).toUpperCase() + stat.slice(1)}: ${
        data.improvement > 0 ? "+" : ""
      }${data.improvement} points (${data.improvementPercent.toFixed(1)}%)`,
  )
  .join("\n")}

STRENGTHS:
${insights.strengths.map((s) => `- ${s.message}`).join("\n")}

AREAS FOR IMPROVEMENT:
${insights.weaknesses.map((w) => `- ${w.message}`).join("\n")}

RECOMMENDATIONS:
${insights.recommendations
  .map((r) => `- ${r.message || r.suggestions.join(", ")}`)
  .join("\n")}

AI INSIGHTS:
${insights.aiInsights.join("\n")}
    `;

    const blob = new Blob([report], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `relife-progress-report-${
      new Date().toISOString().split("T")[0]
    }.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const chartOptions = {
    responsive: true,
    animation: {
      duration: 1000,
      easing: "easeOutQuart",
    },
    plugins: {
      legend: {
        position: "top",
        labels: {
          color: "white",
          font: { family: "Space Mono, sans-serif", size: 14, weight: "bold" },
        },
      },
    },
    scales: {
      x: {
        type: "category",
        title: {
          display: true,
          text: "Date",
          color: "white",
          font: {
            family: "Space Mono, sans-serif",
            size: 14,
            weight: "semibold",
          },
        },
        ticks: {
          color: "white",
          font: { family: "Space Mono, sans-serif", size: 12 },
        },
      },
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: "Stat Value",
          color: "white",
          font: { family: "Space Mono, sans-serif", size: 14, weight: "bold" },
        },
        ticks: {
          color: "white",
          font: { family: "Space Mono, sans-serif", size: 12 },
        },
      },
    },
  };

  const downloadChart = (canvasId, name) => {
    const canvas = document.querySelector(`${canvasId} canvas`);
    const link = document.createElement("a");
    link.download = `${name}-stats.png`;
    link.href = canvas.toDataURL();
    link.click();
  };

  const renderStatChart = (name, statData) => {
    const weeklyGain = getWeeklyGain(statData.data);
    const worldAvg = totalData[name]?.data?.[0]?.toFixed(2) ?? "N/A";

    const id = `${name.toLowerCase()}-chart`;

    return (
      <div
        key={name}
        id={id}
        className="group relative w-full p-6 mb-3 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-700 
            rounded-md shadow-[0_0_30px_rgba(0,0,0,0.6)] cursor-pointer transition-all 
            border border-blue-500/20 overflow-hidden 
            hover:shadow-[0_0_50px_rgba(59,130,246,0.7)]"
        style={{
          animation: "pulseGlow 3s infinite ease-in-out",
        }}
      >
        <h3 className="text-xl text-white mb-2 font-solo drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] tracking-wider font-extrabold">
          {name}
        </h3>
        <p className="text-sm text-white">
          <strong>Your {daysRange}-Day Stat:</strong> {weeklyGain}
        </p>
        <p className="text-sm text-white mb-4">
          <strong>World Median:</strong> {worldAvg}
        </p>
        <Line
          data={{
            labels: statData.labels,
            datasets: [
              {
                label: name,
                data: statData.data,
                borderColor: statColors[name]?.borderColor || "#fff",
                backgroundColor:
                  statColors[name]?.backgroundColor || "rgba(255,255,255,0.2)",
                fill: true,
                tension: 0.4,
              },
            ],
          }}
          options={chartOptions}
        />
        <button
          className="mt-3 bg-primary drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] hover:bg-blue-400 text-white text-xs py-1 px-2 rounded"
          onClick={() => downloadChart(`#${id}`, name)}
        >
          <FontAwesomeIcon icon={faDownload} /> Download Chart
        </button>
      </div>
    );
  };

  const renderCombinedStatChart = (statNames, allStatData) => {
    const combinedName = statNames.join(" + ");
    const id = `combined-chart`;

    const labels = allStatData[statNames[0]]?.labels || [];

    // Sum values at each index across all selected stats
    const combinedData = labels.map((_, index) => {
      return statNames.reduce((sum, name) => {
        const statValues = allStatData[name]?.data || [];
        return sum + (statValues[index] || 0);
      }, 0);
    });

    // Optional: calculate weekly gain for the combined stat
    const weeklyGain = getWeeklyGain(combinedData);

    // Optional: average of world medians for combined stats
    const worldAvg = (
      statNames.reduce(
        (sum, name) => sum + (parseFloat(totalData[name]?.data?.[0]) || 0),
        0,
      ) / statNames.length
    ).toFixed(2);

    return (
      <div
        key={combinedName}
        id={id}
        className="mb-4 p-6 bg-gray-800 rounded-lg"
      >
        <h3 className="text-xl font-bold text-white mb-2">Combined Stats</h3>
        <p className="text-sm text-white">
          <strong>Your {daysRange}-Day Stat:</strong> {weeklyGain}
        </p>

        <Line
          data={{
            labels,
            datasets: [
              {
                label: combinedName,
                data: combinedData,
                borderColor: "#4ade80", // green-400
                backgroundColor: "rgba(74, 222, 128, 0.2)",
                fill: true,
                tension: 0.4,
              },
            ],
          }}
          options={chartOptions}
        />
        <button
          className="mt-3 bg-primary hover:bg-blue-400 text-white text-xs py-1 px-2 rounded"
          onClick={() => downloadChart(`#${id}`, "Combined Stats")}
        >
          <FontAwesomeIcon icon={faDownload} /> Download Chart
        </button>
      </div>
    );
  };

  return (
    <div className="w-full grid xl:grid-cols-6 lg:grid-cols-5 md:grid-cols-3 grid-cols-1 p-6">
      <div className="lg:col-start-2 md:col-start-2 col-start-1 col-span-5 max-w-7xl mx-auto">
        <div className="text-white">
          <h1 className="text-4xl font-bold mb-6 font-solo text-center">
            Player Progress
          </h1>

          <div className="flex justify-center mb-6">
            <select
              className="bg-gray-800 text-white px-4 py-2 rounded border border-gray-600"
              value={daysRange}
              onChange={(e) => setDaysRange(Number(e.target.value))}
            >
              <option value={7}>Last 7 Days</option>
              <option value={14}>Last 14 Days</option>
              <option value={30}>Last 30 Days</option>
            </select>
          </div>

          {activeTab === "stats" ? (
            // Statistics Tab
            <>
              {loading ? (
                <div className="text-center py-20">
                  <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
                  <p className="text-xl text-gray-300">Loading...</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                  {/* Left Column - Radar Chart & Tags */}
                  {/* <div className="xl:col-span-1 space-y-6">
                    {accountData && (
                      <>
                        <div
                          className="group relative w-full p-6 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-700 
                            rounded-md shadow-[0_0_30px_rgba(0,0,0,0.6)] transition-all 
                            border border-blue-500/20 overflow-hidden 
                            hover:shadow-[0_0_50px_rgba(59,130,246,0.7)]"
                          style={{
                            animation: "pulseGlow 3s infinite ease-in-out",
                          }}
                        >
                          <h3 className="text-2xl font-bold font-solo text-white mb-4 text-center tracking-wider">
                            Stat Overview
                          </h3>
                          <DiamondRadarChart
                            stats={{
                              strength: accountData.stats?.strength,
                              intelligence: accountData.stats?.intelligence,
                              bravery: accountData.stats?.bravery,
                              endurance: accountData.stats?.endurance,
                            }}
                          />
                        </div>

                      </>
                    )}
                  </div> */}

                  {/* Right Column - Charts */}
                  <div className="xl:col-span-3 grid grid-cols-2 space-y-6">
                    <div className="col-span-2">
                      <InteractiveStatChart
                        allStats={data}
                        visibleStats={visibleStats}
                        onVisibilityChange={handleStatVisibilityChange}
                        statColors={statColors}
                        chartOptions={chartOptions}
                        onDownload={downloadChart}
                      />
                    </div>

                    <div className="md:col-span-1 col-span-2">
                      <StreakGrid userId={userId} />
                    </div>
                    <div className="md:col-span-1 col-span-2">
                      <DiamondRadarChart
                        stats={{
                          strength: accountData.stats?.strength,
                          intelligence: accountData.stats?.intelligence,
                          bravery: accountData.stats?.bravery,
                          endurance: accountData.stats?.endurance,
                        }}
                      />
                    </div>
                    <div className="col-span-2">
                      <TotalStatsChart daysRange={daysRange} />
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            // AI Insights Tab
            <>
              {insightsLoading ? (
                <div className="text-center py-20">
                  <FontAwesomeIcon
                    icon={faSpinner}
                    className="text-4xl text-blue-500 animate-spin mb-4"
                  />
                  <p className="text-xl text-gray-300">
                    Analyzing your progress...
                  </p>
                </div>
              ) : insightsError ? (
                <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-6 text-center">
                  <FontAwesomeIcon
                    icon={faExclamationTriangle}
                    className="text-4xl text-red-500 mb-4"
                  />
                  <p className="text-white text-lg">{insightsError}</p>
                </div>
              ) : insights ? (
                <div className="space-y-6">
                  {/* Summary Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-gradient-to-br from-blue-900/50 to-blue-800/30 border border-blue-500/30 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-blue-300 text-sm">Total Quests</p>
                          <p className="text-2xl font-bold text-white">
                            {insights.summary.totalQuests}
                          </p>
                        </div>
                        <FontAwesomeIcon
                          icon={faTrophy}
                          className="text-2xl text-blue-400"
                        />
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-green-900/50 to-green-800/30 border border-green-500/30 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-green-300 text-sm">
                            Avg Difficulty
                          </p>
                          <p className="text-2xl font-bold text-white">
                            {insights.summary.averageDifficulty.toFixed(1)}
                          </p>
                        </div>
                        <FontAwesomeIcon
                          icon={faFire}
                          className="text-2xl text-green-400"
                        />
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-purple-900/50 to-purple-800/30 border border-purple-500/30 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-purple-300 text-sm">
                            Activity Types
                          </p>
                          <p className="text-2xl font-bold text-white">
                            {insights.summary.uniqueTags}
                          </p>
                        </div>
                        <FontAwesomeIcon
                          icon={faStar}
                          className="text-2xl text-purple-400"
                        />
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-yellow-900/50 to-yellow-800/30 border border-yellow-500/30 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-yellow-300 text-sm">
                            Current Level
                          </p>
                          <p className="text-2xl font-bold text-white">
                            {insights.summary.level}
                          </p>
                        </div>
                        <FontAwesomeIcon
                          icon={faRocket}
                          className="text-2xl text-yellow-400"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Improvements Section */}
                  <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-700 rounded-lg p-6 border border-blue-500/20">
                    <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                      <FontAwesomeIcon
                        icon={faArrowUp}
                        className="text-green-500 mr-2"
                      />
                      Stat Improvements
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      {Object.entries(insights.improvements).map(
                        ([stat, data]) => (
                          <div
                            key={stat}
                            className="bg-gray-800/50 rounded-lg p-4 border border-gray-600"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <FontAwesomeIcon
                                icon={getStatIcon(stat)}
                                className={`text-xl ${getStatColor(stat)}`}
                              />
                              <span className="text-sm text-gray-400 capitalize">
                                {stat}
                              </span>
                            </div>
                            <p className="text-2xl font-bold text-white">
                              {data.improvement > 0 ? "+" : ""}
                              {data.improvement}
                            </p>
                            <p className="text-sm text-gray-400">
                              {data.improvementPercent > 0 ? "+" : ""}
                              {data.improvementPercent.toFixed(1)}%
                            </p>
                          </div>
                        ),
                      )}
                    </div>
                  </div>

                  {/* AI Insights */}
                  <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-700 rounded-lg p-6 border border-purple-500/20 relative">
                    {!isLoaded || !isPremium ? (
                      <div className="absolute inset-0 bg-black bg-opacity-60 flex flex-col items-center justify-center z-20 rounded-lg">
                        <button
                          className="bg-yellow-400 hover:bg-yellow-500 text-black font-bold py-2 px-4 rounded shadow-lg border border-yellow-600 mb-2"
                          onClick={() => setShowPremiumModal(true)}
                        >
                          Unlock AI Insights
                        </button>
                        <span className="text-white text-sm">
                          Premium required
                        </span>
                      </div>
                    ) : null}
                    <div className="space-y-6">
                      {insights.aiInsights.map((insight, index) => {
                        // Parse the insight text to extract structure
                        const lines = insight
                          .split("\n")
                          .filter((line) => line.trim());
                        const sections = [];
                        let currentSection = null;

                        lines.forEach((line) => {
                          const trimmedLine = line.trim();

                          // Check for headers (text between **)
                          const headerMatch =
                            trimmedLine.match(/\*\*(.*?)\*\*/);
                          if (headerMatch) {
                            if (currentSection) {
                              sections.push(currentSection);
                            }
                            currentSection = {
                              type: "header",
                              content: headerMatch[1],
                              subsections: [],
                            };
                            return;
                          }

                          // Check for numbered sections (1., 2., etc.)
                          const numberMatch =
                            trimmedLine.match(/^(\d+)\.\s*(.*)/);
                          if (numberMatch) {
                            if (
                              currentSection &&
                              currentSection.type === "header"
                            ) {
                              currentSection.subsections.push({
                                type: "numbered",
                                number: numberMatch[1],
                                content: numberMatch[2],
                                bullets: [],
                              });
                            } else {
                              if (currentSection) {
                                sections.push(currentSection);
                              }
                              currentSection = {
                                type: "numbered",
                                number: numberMatch[1],
                                content: numberMatch[2],
                                bullets: [],
                              };
                            }
                            return;
                          }

                          // Check for bullet points (starting with -)
                          const bulletMatch = trimmedLine.match(/^-\s*(.*)/);
                          if (bulletMatch) {
                            if (
                              currentSection &&
                              currentSection.subsections.length > 0
                            ) {
                              // Add to the last numbered subsection
                              const lastSubsection =
                                currentSection.subsections[
                                  currentSection.subsections.length - 1
                                ];
                              if (lastSubsection.type === "numbered") {
                                lastSubsection.bullets.push(bulletMatch[1]);
                              }
                            } else if (
                              currentSection &&
                              currentSection.type === "numbered"
                            ) {
                              currentSection.bullets.push(bulletMatch[1]);
                            } else {
                              // Standalone bullet point
                              if (currentSection) {
                                sections.push(currentSection);
                              }
                              currentSection = {
                                type: "bullet",
                                content: bulletMatch[1],
                              };
                            }
                            return;
                          }

                          // Regular text content
                          if (trimmedLine) {
                            if (
                              currentSection &&
                              currentSection.type === "header"
                            ) {
                              currentSection.subsections.push({
                                type: "text",
                                content: trimmedLine,
                              });
                            } else if (
                              currentSection &&
                              currentSection.type === "numbered"
                            ) {
                              currentSection.content += " " + trimmedLine;
                            } else {
                              if (currentSection) {
                                sections.push(currentSection);
                              }
                              currentSection = {
                                type: "text",
                                content: trimmedLine,
                              };
                            }
                          }
                        });

                        // Add the last section
                        if (currentSection) {
                          sections.push(currentSection);
                        }

                        return (
                          <div
                            key={index}
                            className="bg-gray-800/50 rounded-lg p-4 border-l-4 border-purple-500 hover:bg-gray-700/70 transition-colors"
                          >
                            <div className="space-y-4">
                              {sections.length === 0 ? (
                                // Fallback for unstructured content
                                <div className="flex items-start">
                                  <span className="w-2 h-2 bg-purple-400 rounded-full mr-3 mt-2 flex-shrink-0"></span>
                                  <p className="text-white leading-relaxed">
                                    {insight}
                                  </p>
                                </div>
                              ) : (
                                sections.map((section, sectionIndex) => (
                                  <div key={sectionIndex} className="space-y-3">
                                    {section.type === "header" && (
                                      <h4 className="text-lg font-semibold text-purple-300 border-b border-purple-500/30 pb-2">
                                        {section.content}
                                      </h4>
                                    )}

                                    {section.type === "numbered" && (
                                      <div className="flex items-start">
                                        <span className="w-6 h-6 bg-purple-500 rounded-full mr-3 mt-1 flex-shrink-0 flex items-center justify-center text-white text-sm font-bold">
                                          {section.number}
                                        </span>
                                        <div className="flex-1">
                                          <p className="text-white font-medium mb-2">
                                            {section.content}
                                          </p>
                                          {section.bullets.length > 0 && (
                                            <ul className="space-y-1 ml-4">
                                              {section.bullets.map(
                                                (bullet, bulletIndex) => (
                                                  <li
                                                    key={bulletIndex}
                                                    className="flex items-start"
                                                  >
                                                    <span className="w-2 h-2 bg-purple-400 rounded-full mr-3 mt-2 flex-shrink-0"></span>
                                                    <span className="text-gray-300 text-sm">
                                                      {bullet}
                                                    </span>
                                                  </li>
                                                ),
                                              )}
                                            </ul>
                                          )}
                                        </div>
                                      </div>
                                    )}

                                    {section.type === "bullet" && (
                                      <div className="flex items-start">
                                        <span className="w-2 h-2 bg-purple-400 rounded-full mr-3 mt-2 flex-shrink-0"></span>
                                        <p className="text-white">
                                          {section.content}
                                        </p>
                                      </div>
                                    )}

                                    {section.type === "text" && (
                                      <p className="text-white leading-relaxed">
                                        {section.content}
                                      </p>
                                    )}

                                    {section.type === "header" &&
                                      section.subsections.length > 0 && (
                                        <div className="ml-4 space-y-3">
                                          {section.subsections.map(
                                            (subsection, subIndex) => (
                                              <div key={subIndex}>
                                                {subsection.type ===
                                                  "numbered" && (
                                                  <div className="flex items-start">
                                                    <span className="w-5 h-5 bg-purple-600 rounded-full mr-3 mt-1 flex-shrink-0 flex items-center justify-center text-white text-xs font-bold">
                                                      {subsection.number}
                                                    </span>
                                                    <div className="flex-1">
                                                      <p className="text-white text-sm font-medium mb-2">
                                                        {subsection.content}
                                                      </p>
                                                      {subsection.bullets
                                                        .length > 0 && (
                                                        <ul className="space-y-1 ml-4">
                                                          {subsection.bullets.map(
                                                            (
                                                              bullet,
                                                              bulletIndex,
                                                            ) => (
                                                              <li
                                                                key={
                                                                  bulletIndex
                                                                }
                                                                className="flex items-start"
                                                              >
                                                                <span className="w-1.5 h-1.5 bg-purple-400 rounded-full mr-2 mt-1.5 flex-shrink-0"></span>
                                                                <span className="text-gray-300 text-xs">
                                                                  {bullet}
                                                                </span>
                                                              </li>
                                                            ),
                                                          )}
                                                        </ul>
                                                      )}
                                                    </div>
                                                  </div>
                                                )}
                                                {subsection.type === "text" && (
                                                  <p className="text-gray-300 text-sm ml-4">
                                                    {subsection.content}
                                                  </p>
                                                )}
                                              </div>
                                            ),
                                          )}
                                        </div>
                                      )}
                                  </div>
                                ))
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Strengths and Weaknesses */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-700 rounded-lg p-6 border border-green-500/20">
                      <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                        <FontAwesomeIcon
                          icon={faCheckCircle}
                          className="text-green-500 mr-2"
                        />
                        Your Strengths
                      </h3>
                      <div className="space-y-3">
                        {insights.strengths.map((strength, index) => (
                          <div
                            key={index}
                            className="bg-gray-800/50 rounded-lg p-3 border-l-4 border-green-500"
                          >
                            <p className="text-white text-sm">
                              {strength.message}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-700 rounded-lg p-6 border border-red-500/20">
                      <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                        <FontAwesomeIcon
                          icon={faExclamationTriangle}
                          className="text-red-500 mr-2"
                        />
                        Areas for Improvement
                      </h3>
                      <div className="space-y-3">
                        {insights.weaknesses.map((weakness, index) => (
                          <div
                            key={index}
                            className="bg-gray-800/50 rounded-lg p-3 border-l-4 border-red-500"
                          >
                            <p className="text-white text-sm">
                              {weakness.message}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Recommendations */}
                  <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-700 rounded-lg p-6 border border-yellow-500/20">
                    <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                      <FontAwesomeIcon
                        icon={faLightbulb}
                        className="text-yellow-500 mr-2"
                      />
                      Personalized Recommendations
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {insights.recommendations.map((rec, index) => (
                        <div
                          key={index}
                          className="bg-gray-800/50 rounded-lg p-4 border border-yellow-500/30"
                        >
                          <div className="flex items-start">
                            <FontAwesomeIcon
                              icon={faArrowRight}
                              className="text-yellow-400 mt-1 mr-3 flex-shrink-0"
                            />
                            <div>
                              {rec.message && (
                                <p className="text-white font-semibold mb-2">
                                  {rec.message}
                                </p>
                              )}
                              {rec.suggestions && (
                                <ul className="text-gray-300 text-sm space-y-1">
                                  {rec.suggestions.map((suggestion, idx) => (
                                    <li key={idx} className="flex items-center">
                                      <span className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></span>
                                      {suggestion}
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-20">
                  <FontAwesomeIcon
                    icon={faArrowRight}
                    className="text-4xl text-gray-500 mb-4"
                  />
                  <p className="text-xl text-gray-300">
                    Click the AI Insights tab to analyze your progress
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default StatsPage;

// A new function inside your StatsPage.jsx file, or as a separate component

const InteractiveStatChart = ({
  allStats,
  visibleStats,
  onVisibilityChange,
  statColors,
  chartOptions,
  onDownload,
}) => {
  const { hideTooltip, showTooltip } = useTooltip();
  // Dynamically generate the datasets based on what's visible
  const datasets = Object.keys(visibleStats)
    .filter((statName) => visibleStats[statName]) // Only include visible stats
    .map((statName) => {
      const statData = allStats[statName.toLowerCase()];
      const colors = statColors[statName] || {
        borderColor: "#FFF",
        backgroundColor: "rgba(255,255,255,0.2)",
      };

      return {
        label: statName,
        data: statData.data,
        borderColor: colors.borderColor,
        backgroundColor: colors.backgroundColor,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: colors.borderColor,
        pointRadius: 3,
        pointHoverRadius: 6,
      };
    });

  const customTooltipOptions = {
    ...chartOptions,
    maintainAspectRatio: false,
    plugins: {
      ...chartOptions.plugins,
      tooltip: {
        // 3. Disable the default Chart.js tooltip
        enabled: false,

        // 4. Use `external` to trigger your custom tooltip
        external: (context) => {
          const tooltipModel = context.tooltip;

          // Hide the tooltip if the mouse leaves a point
          if (tooltipModel.opacity === 0) {
            hideTooltip();
            return;
          }

          const activePoint = tooltipModel.dataPoints[0];
          if (!activePoint) return;

          const statName = activePoint.dataset.label;
          const value = activePoint.raw;
          const timeLabel = activePoint.label; // e.g., "Day 5"

          // Create the content object for your custom tooltip
          const tooltipContent = {
            name: `${statName}: ${value}`,
            rarity: "Rare", // Or determine rarity based on value
            description: `On ${timeLabel}, your ${statName} was ${value}.`,
            stats: { [statName.toLowerCase()]: value },
          };

          showTooltip(tooltipContent);
        },
      },
    },
  };

  // Use the labels from the first stat's data (assuming they are all the same)
  const chartData = {
    labels: allStats.strength.labels,
    datasets: datasets,
  };

  return (
    <div
      id="interactive-chart-container"
      className="w-full p-6 bg-gray-900 rounded-md overflow-hidden"
      onMouseLeave={hideTooltip} // <-- 5. Hide tooltip when mouse leaves the chart area
    >
      <h3 className="text-2xl font-bold font-solo text-white mb-4 text-center tracking-wider">
        Performance Over Time
      </h3>

      {/* Control Panel for toggling lines */}
      <div className="flex flex-wrap justify-center gap-4 mb-4">
        {Object.keys(visibleStats).map((statName) => (
          <div key={statName} className="flex items-center">
            <input
              type="checkbox"
              id={`checkbox-${statName}`}
              checked={visibleStats[statName]}
              onChange={() => onVisibilityChange(statName)}
              className="w-4 h-4 rounded focus:ring-2"
              style={{ accentColor: statColors[statName]?.borderColor }}
            />
            <label
              htmlFor={`checkbox-${statName}`}
              className="ml-2 text-sm font-medium text-white cursor-pointer"
            >
              {statName}
            </label>
          </div>
        ))}
      </div>

      <div className="h-96">
        {" "}
        {/* Give the chart a fixed height */}
        <Line data={chartData} options={customTooltipOptions} />
      </div>

      <button
        className="mt-4 bg-primary drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] hover:bg-blue-400 text-white text-xs py-1 px-2 rounded"
        onClick={() =>
          onDownload("#interactive-chart-container", "interactive-stats")
        }
      >
        <FontAwesomeIcon icon={faDownload} /> Download Chart
      </button>
    </div>
  );
};
