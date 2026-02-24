import React, { useContext, useEffect, useState } from "react";
import { Line } from "react-chartjs-2";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faDownload } from "@fortawesome/free-solid-svg-icons";
import axios from "axios";
import config from "../config";
import { UserContext } from "./UserContext";

const TotalStatsChart = ({ daysRange }) => {
  const userId = JSON.parse(localStorage.getItem("user"))?.id;

  const { accountDataRef, fetchAccountData } = useContext(UserContext);

  const [accountData, setAccountData] = useState([]);
  const [accountStats, setAccountStats] = useState({});
  const [dataLoaded, setDataLoaded] = useState(false);
  // In your TotalStatsChart component
  const [isComparing, setIsComparing] = useState(false);
  const [comparisonData, setComparisonData] = useState(null); // To store "last week's" data

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      if (accountDataRef.current && !dataLoaded) {
        setAccountData(accountDataRef.current);
        setAccountStats(accountDataRef.current.stats);
        // const playerMilestones = JSON.parse(accountDataRef.current.claimedMilestones) || [];
        // setClaimedMilestones(playerMilestones);
        setDataLoaded(true);
      }
    }, 100); // Small interval to wait for dataRef update

    return () => clearInterval(interval);
  }, [accountDataRef, dataLoaded]);

  const [data, setData] = useState({
    strength: { labels: [], data: [] },
    intelligence: { labels: [], data: [] },
    bravery: { labels: [], data: [] },
    endurance: { labels: [], data: [] },
  });

  // 1. Create a reusable helper function for processing the data
  const processCumulativeStats = (apiResult, accountStats) => {
    if (!apiResult || apiResult.length === 0) {
      return {
        strength: { labels: [], data: [] },
        intelligence: { labels: [], data: [] },
        bravery: { labels: [], data: [] },
        endurance: { labels: [], data: [] },
      };
    }

    // This is the cumulative logic from your original function
    const stats = {
      strength: { labels: [], data: [] },
      intelligence: { labels: [], data: [] },
      bravery: { labels: [], data: [] },
      endurance: { labels: [], data: [] },
    };

    const sorted = [...apiResult].sort(
      (a, b) => new Date(b.date) - new Date(a.date)
    );
    const today = sorted[0];
    const totalGainToday =
      today.stats.strength +
      today.stats.intelligence +
      today.stats.bravery +
      today.stats.endurance;
    const currentTotal =
      accountStats.strength +
      accountStats.intelligence +
      accountStats.bravery +
      accountStats.endurance;
    const baseTotal = currentTotal - totalGainToday;
    const totalSum = Object.values(accountStats).reduce(
      (acc, val) => acc + val,
      0
    );

    const total = {
      strength: Math.round((accountStats.strength / totalSum) * baseTotal),
      intelligence: Math.round(
        (accountStats.intelligence / totalSum) * baseTotal
      ),
      bravery: Math.round((accountStats.bravery / totalSum) * baseTotal),
      endurance: Math.round((accountStats.endurance / totalSum) * baseTotal),
    };

    const initialDate = new Date(new Date(today.date).getTime() - 86400000)
      .toISOString()
      .split("T")[0];
    const cumulativeStats = [{ date: initialDate, stats: { ...total } }];

    sorted.reverse().forEach(({ date, stats: s }) => {
      total.strength += s.strength;
      total.intelligence += s.intelligence;
      total.bravery += s.bravery;
      total.endurance += s.endurance;
      cumulativeStats.push({ date, stats: { ...total } });
    });

    cumulativeStats.forEach(({ date, stats: s }) => {
      stats.strength.labels.push(date);
      stats.strength.data.push(s.strength);
      stats.intelligence.labels.push(date);
      stats.intelligence.data.push(s.intelligence);
      stats.bravery.labels.push(date);
      stats.bravery.data.push(s.bravery);
      stats.endurance.labels.push(date);
      stats.endurance.data.push(s.endurance);
    });

    return stats;
  };

  // 2. Update your fetchStatsData function
  const fetchStatsData = async () => {
    if (!accountStats.strength) return; // Don't run if account stats aren't loaded

    setLoading(true);
    try {
      const commonParams = { userId, daysRange };

      // Fetch data for the current period
      const currentPeriodPromise = axios.get(
        `${config.backendUrl}/completed-quests-stats`,
        {
          params: { ...commonParams, offset: 0 }, // offset: 0 for current period
        }
      );

      let promises = [currentPeriodPromise];

      if (isComparing) {
        // If comparing, add a promise to fetch the previous period's data
        const previousPeriodPromise = axios.get(
          `${config.backendUrl}/completed-quests-stats`,
          {
            params: { ...commonParams, offset: daysRange }, // offset by daysRange to get previous period
          }
        );
        promises.push(previousPeriodPromise);
      }

      const responses = await Promise.all(promises);

      const currentDataResult = responses[0].data;
      const processedCurrentData = processCumulativeStats(
        currentDataResult,
        accountStats
      );
      setData(processedCurrentData);

      if (isComparing && responses[1]) {
        const comparisonDataResult = responses[1].data;
        // For the comparison period, we need to adjust the "current" stats to what they were `daysRange` ago.
        // This is a simplification; a more accurate method would require historical stat snapshots.
        const totalGainCurrentPeriod = currentDataResult.reduce(
          (sum, day) =>
            sum +
            day.stats.strength +
            day.stats.intelligence +
            day.stats.bravery +
            day.stats.endurance,
          0
        );
        const historicalAccountStats = {
          strength:
            accountStats.strength -
            currentDataResult.reduce((s, d) => s + d.stats.strength, 0),
          intelligence:
            accountStats.intelligence -
            currentDataResult.reduce((s, d) => s + d.stats.intelligence, 0),
          bravery:
            accountStats.bravery -
            currentDataResult.reduce((s, d) => s + d.stats.bravery, 0),
          endurance:
            accountStats.endurance -
            currentDataResult.reduce((s, d) => s + d.stats.endurance, 0),
        };

        const processedComparisonData = processCumulativeStats(
          comparisonDataResult,
          historicalAccountStats
        );
        setComparisonData(processedComparisonData);
      } else {
        setComparisonData(null); // Clear comparison data if toggle is off
      }
    } catch (err) {
      console.error("Error fetching stats data:", err);
    } finally {
      setLoading(false);
    }
  };

  // 3. Update the useEffect that calls fetchStatsData
  useEffect(() => {
    fetchStatsData();
  }, [daysRange, userId, accountStats, isComparing]); // Add isComparing to the dependency array

  const chartOptions = {
    responsive: true,
    animation: {
      duration: 1000,
      easing: "easeOutQuart",
    },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        enabled: false,
      },
      datalabels: {
        display: false, // <-- THIS disables labels on points
      },
    },

    elements: {
      line: {
        tension: 0.4,
        borderWidth: 3, // Hide the line
      },
      point: {
        radius: 0, // Hide data points
      },
    },
    scales: {
      x: {
        display: false, // Hide the entire X-axis
      },
      y: {
        beginAtZero: true,
        title: {
          display: false,
        },
        ticks: {
          color: "white",
          font: { family: "Space Mono, sans-serif", size: 12 },
        },
        grid: {
          drawTicks: false,
          drawBorder: false,
          color: "rgba(255, 255, 255, 0.1)", // or set to 'transparent' to remove entirely
        },
      },
    },
  };

  // Update the renderCombinedStatChart function
  const renderCombinedStatChart = (statNames, currentData, comparisonData) => {
    const labels = currentData[statNames[0]]?.labels || [];

    // Combine data for the current period
    const currentCombinedData = labels.map((_, index) => {
      return statNames.reduce((sum, name) => {
        return sum + (currentData[name]?.data[index] || 0);
      }, 0);
    });

    const datasets = [
      {
        label: `Current ${daysRange} Days`,
        data: currentCombinedData,
        borderColor: "#3B82F6", // Blue
        backgroundColor: "rgba(59, 130, 246, 0.3)",
        fill: true,
        tension: 0.4,
      },
    ];

    // If we have comparison data, add it as a second dataset
    if (comparisonData) {
      const comparisonCombinedData = labels.map((_, index) => {
        // Use same label length for alignment
        return statNames.reduce((sum, name) => {
          // The comparison data might have a different length, so handle that
          const value = comparisonData[name]?.data[index];
          return sum + (value !== undefined ? value : 0);
        }, 0);
      });

      datasets.push({
        label: `Previous ${daysRange} Days`,
        data: comparisonCombinedData,
        borderColor: "rgba(107, 114, 128, 0.8)", // Gray
        backgroundColor: "transparent",
        fill: false,
        tension: 0.4,
        borderDash: [5, 5], // Make it a dashed line
      });
    }

    return (
      <div /* ... your existing div ... */>
        <h3 className="text-xl font-bold text-white mb-2 font-solo">
          Total Growth
        </h3>
        <Line
          data={{ labels, datasets }} // Pass the new datasets array
          options={{
            ...chartOptions,
            plugins: {
              // Re-enable legend and tooltips for comparison
              legend: {
                display: isComparing, // Only show legend when comparing
                labels: { color: "white" },
              },
              tooltip: { enabled: true },
            },
          }}
        />
      </div>
    );
  };

  const getWeeklyGain = (arr) => {
    if (!arr.length) return 0;
    return arr.slice(-7).reduce((acc, val) => acc + val, 0);
  };

  // In the main return block
  return (
    <div className="w-full bg-gray-900 p-4 rounded-md overflow-x-auto">
      {/* Add the comparison toggle here */}
      <div className="flex items-center justify-end mb-2 pr-4">
        <label htmlFor="compare-toggle" className="text-sm text-gray-300 mr-2">
          Compare to Previous Period
        </label>
        <input
          type="checkbox"
          id="compare-toggle"
          className="w-4 h-4 rounded"
          style={{ accentColor: "#3B82F6" }}
          checked={isComparing}
          onChange={() => setIsComparing(!isComparing)}
        />
      </div>

      <div className="min-w-[300px] sm:min-w-full">
        {loading ? (
          <div className="text-center text-white p-8">
            Loading Chart Data...
          </div>
        ) : (
          renderCombinedStatChart(
            ["strength", "endurance", "bravery", "intelligence"],
            data, // Current period data
            comparisonData // Comparison period data (or null)
          )
        )}
      </div>
    </div>
  );
};

export default TotalStatsChart;
