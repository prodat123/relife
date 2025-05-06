import React, { useState, useEffect } from "react";
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
import { faDownload } from "@fortawesome/free-solid-svg-icons";
import QuestTagsChart from "./QuestTagsChart";

ChartJS.register(CategoryScale, LinearScale, LineElement, PointElement, Title, Tooltip, Legend, Filler);

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

  const userId = JSON.parse(localStorage.getItem("user"))?.id;

  useEffect(() => {
    document.title = "Re:LIFE | Stats";
    fetchAccountData();
    fetchStatsData();
    fetchTotalStatsData();
  }, [daysRange, userId]);

  const fetchAccountData = async () => {
    try {
      const response = await axios.get(`${config.backendUrl}/account`, {
        params: { userId: userId },
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
      const response = await axios.get(`${config.backendUrl}/completed-quests-stats`, {
        params: {
          userId: userId,
          daysRange: daysRange,
        }
      });
  
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
      const response = await axios.get(`${config.backendUrl}/total-completed-quests-stats`, {
        params: { userId },
      });

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
    Strength: { borderColor: "rgb(239, 68, 68)", backgroundColor: "rgba(239, 68, 68, 0.2)" },
    Endurance: { borderColor: "rgb(34, 197, 94)", backgroundColor: "rgba(34, 197, 94, 0.2)" },
    Bravery: { borderColor: "rgb(59, 130, 246)", backgroundColor: "rgba(59, 130, 246, 0.2)" },
    Intelligence: { borderColor: "rgb(245, 158, 11)", backgroundColor: "rgba(245, 158, 11, 0.2)" },
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
          font: { family: "Space Mono, sans-serif", size: 14, weight: "semibold" },
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
      <div key={name} id={id} className="mb-6 p-6 bg-gray-800 rounded-lg shadow-md">
        <h3 className="text-xl font-bold text-white mb-2">{name}</h3>
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
                backgroundColor: statColors[name]?.backgroundColor || "rgba(255,255,255,0.2)",
                fill: true,
                tension: 0.4,
              },
            ],
          }}
          options={chartOptions}
        />
        <button
          className="mt-3 bg-indigo-600 hover:bg-indigo-500 text-white text-xs py-1 px-2 rounded"
          onClick={() => downloadChart(`#${id}`, name)}
        >
          <FontAwesomeIcon icon={faDownload} /> Download Chart
        </button>
      </div>
    );
  };

  // 🔥 Determine the stat with the highest weekly gain
  const statGains = {
    Strength: getWeeklyGain(data.strength.data),
    Intelligence: getWeeklyGain(data.intelligence.data),
    Bravery: getWeeklyGain(data.bravery.data),
    Endurance: getWeeklyGain(data.endurance.data),
  };

  const highestStat = Object.entries(statGains).sort((a, b) => b[1] - a[1])[0];

  return (
    <div className="container mx-auto p-4 grid xl:grid-cols-6 lg:grid-cols-5 md:grid-cols-4 grid-cols-3">
      <div className="lg:col-start-2 md:col-start-2 col-start-1 col-span-5 text-white">
        <h2 className="text-4xl font-bold text-center mb-6">Player Progress</h2>

        <div className="px-6 rounded-lg shadow-lg">
          {loading ? (
            <p className="text-center">Loading stats...</p>
          ) : (
            <>
              {accountData && (
                <DiamondRadarChart
                  stats={{
                    strength: accountData.stats?.strength,
                    intelligence: accountData.stats?.intelligence,
                    bravery: accountData.stats?.bravery,
                    endurance: accountData.stats?.endurance,
                  }}
                />
              )}
              

              

              <div className="flex justify-center items-center my-4">
                <label htmlFor="range" className="mr-2 text-white">Show last:</label>
                <select
                  id="range"
                  className="bg-gray-800 text-white px-2 py-1 rounded-md"
                  value={daysRange}
                  onChange={(e) => setDaysRange(Number(e.target.value))}
                >
                  <option value={7}>7 days</option>
                  <option value={14}>14 days</option>
                  <option value={30}>30 days</option>
                </select>
              </div>

              <div className="text-center bg-green-700 text-white py-2 px-4 rounded shadow-md">
                🎉 <strong>Great job!</strong> Your highest stat gain in the last {daysRange} days is{" "}
                <span className="underline font-bold">{highestStat[0]}</span> with a total of{" "}
                <span className="font-bold">{highestStat[1]}</span> points!
              </div>

              {/* Render the tag frequencies */}
              <div className="my-6 bg-gray-800 p-6 rounded-lg">
                <h3 className="text-xl font-bold text-white">Quest Tags Distribution</h3>
                <QuestTagsChart tags={tags} />
                {/* <ul>
                  {Object.entries(tags).map(([tag, count]) => (
                    <li key={tag} className="text-white">
                      {tag}: {count}
                    </li>
                  ))}
                </ul> */}

              </div>

              

              {renderStatChart("Strength", data.strength)}
              {renderStatChart("Intelligence", data.intelligence)}
              {renderStatChart("Bravery", data.bravery)}
              {renderStatChart("Endurance", data.endurance)}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default StatsPage;
