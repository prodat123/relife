import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import LevelProgressBar from "./LevelProgressBar";
import { useParams } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faAngleLeft,
  faAngleRight,
  faArrowRight,
  faBrain,
  faCertificate,
  faDiamond,
  faDumbbell,
  faFire,
  faFireAlt,
  faHandFist,
  faHeart,
  faMedal,
  faQuestionCircle,
  faRunning,
} from "@fortawesome/free-solid-svg-icons";
import config from "../config";
import CharacterDisplay from "../Miscellaneous/CharacterDisplay";
import StreakGrid from "../Miscellaneous/StreakGrid";
import { HomeGrid } from "./HomeGrid";

const AccountPage = ({ id }) => {
  const { userId } = useParams();
  const [accountData, setAccountData] = useState(null);
  const [error, setError] = useState(null);
  const dropdownRef = useRef(null); // Reference to the dropdown element
  const [badges, setBadges] = useState([]);

  useEffect(() => {
    document.title = "Re:LIFE | Account Page"; // Set the title for this component
  }, []);

  const isOwner = id == userId;

  const fetchAccountData = async () => {
    try {
      const response = await axios.get(
        `${config.backendUrl}/account`,
        {
          params: { userId: userId ? userId : id },
        },
        {
          withCredentials: true,
        },
      );
      const player = response.data;
      setAccountData(response.data);
      setBadges(JSON.parse(player.badges));
    } catch (error) {
      console.error("Error fetching account data:", error);
      setError(error.response?.data?.error || "Failed to fetch account data");
    }
  };

  useEffect(() => {
    fetchAccountData();
  }, [userId]);

  const signOut = async () => {
    localStorage.setItem("user", null);
    window.location.reload();
  };

  if (error) return <p>{error}</p>;
  if (!accountData) return <p>Loading...</p>;
  const { username, experience, stats, equipment, inventory } = accountData;

  const spiritQuotes = [
    "Your light begins to fade...",
    "You sense a burning hole in your soul...",
    "Your body feels frail...",
    "A subtle disturbance perturbs you...",
    "You feel fine.",
    "You're in good spirits.",
    "You feel animated and well.",
    "A wave of power washes over you...",
    "You feel ready to do anything...",
  ];

  const spiritHealth = accountData.spiritHealth ?? 0;
  const maxSpiritHealth = accountData.maxSpiritHealth ?? 0;
  const percentage = (spiritHealth / maxSpiritHealth) * 100;

  let quoteIndex = Math.floor(percentage / 10);
  quoteIndex = Math.min(quoteIndex, spiritQuotes.length - 1); // cap at last index
  // If health is 0 or below 5%, use the lowest quote
  if (percentage <= 5) {
    quoteIndex = 0;
  }

  return (
    <div className="w-full text-white grid 2xl:grid-cols-6 lg:grid-cols-5 md:grid-cols-3 grid-cols-1 gap-4 min-h-screen h-full p-4">
      {/* Header */}
      <div className="lg:col-start-2 md:col-start-2 lg:col-span-5 col-span-5 flex flex-col items-center justify-center">
        <h1 className="text-3xl font-extrabold font-solo tracking-widest text-center drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]">
          {username}
        </h1>
        {/* <FontSelector /> */}
        <div className="flex items-center justify-center flex-wrap gap-2 mt-2">
          {badges.map((badge, index) => (
            <span
              key={index}
              className="px-3 py-1 text-xs font-medium bg-primary text-gray-200 rounded-md"
            >
              {badge}
            </span>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="w-full grid lg:grid-cols-4 md:grid-cols-1 grid-cols-1 lg:col-span-5 md:col-span-4 w-full lg:col-start-2 md:col-start-2 gap-2 col-span-5">
        <div className="md:col-span-1 col-span-1">
          <CharacterDisplay equipment={equipment} />
        </div>
        <div className="md:col-span-3 col-span-1">
          <StreakGrid userId={userId} />
        </div>

        <div className="lg:col-span-2 md:col-span-2 col-span-1 w-full p-6 bg-gradient-to-br from-gray-900 via-slate-900 to-gray-800 rounded-lg shadow-2xl border border-slate-700">
          <div className="lg:px-6 py-6 px-6">
            <div className="text-4xl font-bold text-center font-solo tracking-widest mb-6 pb-4 border-b-2 border-slate-700 text-transparent bg-clip-text bg-gradient-to-r from-slate-300 to-slate-500">
              BASE STATS
            </div>

            <LevelProgressBar experience={experience} />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
              {" "}
              {/* Adjusted gap and margin */}
              {Object.entries(stats).map(([key, value]) => {
                const statConfig = {
                  strength: {
                    color: "text-red-500",
                    shadowColor: "rgba(239, 68, 68, 0.3)",
                    icon: faDumbbell,
                  },
                  bravery: {
                    color: "text-blue-500",
                    shadowColor: "rgba(59, 130, 246, 0.3)",
                    icon: faRunning,
                  },
                  intelligence: {
                    color: "text-yellow-500",
                    shadowColor: "rgba(245, 158, 11, 0.3)",
                    icon: faBrain,
                  },
                  endurance: {
                    color: "text-green-500",
                    shadowColor: "rgba(34, 197, 94, 0.3)",
                    icon: faHeart,
                  },
                };

                const config = statConfig[key] || {
                  color: "text-gray-400",
                  shadowColor: "rgba(156, 163, 175, 0.2)",
                  icon: faQuestionCircle,
                };

                return (
                  <div
                    key={key}
                    className="group relative bg-slate-800/50 p-4 rounded-lg border border-slate-700 transition-all duration-300 ease-in-out hover:-translate-y-1"
                    style={{
                      boxShadow: `0 0 15px -5px ${config.shadowColor}`,
                    }}
                  >
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center justify-center h-16 w-16 bg-slate-900/70 rounded-md border border-slate-600">
                        <FontAwesomeIcon
                          icon={config.icon}
                          className={`h-8 w-8 transition-colors duration-300 ${config.color} group-hover:scale-110`}
                        />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-slate-400 font-medium text-sm uppercase tracking-wider">
                          {key}
                        </span>
                        <span
                          className={`text-5xl font-bold font-solo ${config.color}`}
                        >
                          {value}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="md:col-span-2 col-span-1">
          <HomeGrid userData={accountData} userInventory={inventory} />
        </div>

        <PWAInstallButton />
      </div>

      {isOwner && (
        <div
          className="bg-red-500 z-[100] text-white rounded-md px-4 py-2 mt-3 cursor-pointer text-center lg:col-start-3 md:col-start-2 lg:col-span-2 md:col-span-4 col-span-5 h-10 w-full"
          onClick={signOut}
        >
          Sign Out
        </div>
      )}
    </div>
  );
};

export default AccountPage;
