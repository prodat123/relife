import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaDiscord } from "react-icons/fa";
import { faEye } from "@fortawesome/free-solid-svg-icons";
import config from "../config";
import axios from "axios";

function HomePage() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ totalUsers: 0, totalParticipants: 0 });

  const handleHeroButtonClick = () => {
    navigate("/signup");
  };

  const handleLogin = () => {
    navigate("/login");
  };

  var user = null;

  try {
    const storedUser = localStorage.getItem("user");
    user = storedUser ? JSON.parse(storedUser) : null;
  } catch (error) {
    console.warn("Failed to parse user data from localStorage:", error);
    user = null;
  }

  useEffect(() => {
    if (user) {
      navigate(`/dashboard`);
    }
  }, [user]);

  const joinDiscord = async () => {
    window.open(
      "https://discord.gg/5Pzp4nMxkF",
      "_blank",
      "noopener,noreferrer",
    );
  };

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await axios.get(`${config.backendUrl}/user-stats`); // adjust to your backend URL
        console.log(response.data);
        setStats(response.data);
      } catch (error) {
        console.error("Error fetching stats:", error);
      }
    };

    fetchStats();
  }, []);

  const features = [
    {
      title: "IRL Questing",
      image: "/homepage/quest-feature.png",
      description:
        "Select and complete real-life daily quests to gain XP, stats, and get stronger to face foes in the tower.",
    },
    {
      title: "Leaderboard",
      image: "/homepage/leaderboard.png",
      description:
        "Compete with other players to be the best version of yourselves.",
    },
    {
      title: "Progress Tracker",
      image: "/homepage/player-progress.png",
      description:
        "Track your weekly stat progress and find out if you are on track with the rest of the world.",
    },
    {
      title: "Inventory",
      image: "/homepage/player-inventory.png",
      description:
        "Change your loadout, craft scrapboxes for loot, and view your owned items",
    },
    {
      title: "Account Page",
      image: "/homepage/player-info.png",
      description:
        "Check what it takes to reach the next rank and all your other stats!",
    },
  ];

  const backgroundRunes = [
    "각성", // Awakening
    "헌터", // Hunter
    "마나", // Mana
    "던전", // Dungeon
    "레벨업", // Level Up
    "그림자", // Shadow
    "스킬", // Skill
    "검", // Sword
    "계약", // Contract
    "죽음", // Death
    "왕관", // Crown
    "악마", // Demon
    "포탈", // Portal
    "영혼", // Soul
    "사신", // Grim Reaper / Death God
    "공격", // Attack
    "방어", // Defense
    "진화", // Evolution
    "지배자", // Monarch / Ruler
    "소환", // Summon
    "무기", // Weapon
    "혼돈", // Chaos
    "운명", // Fate
    "심연", // Abyss
    "속도", // Speed
    "치유", // Heal
  ];

  return (
    <>
      <div className="flex flex-col items-center justify-center h-screen relative overflow-hidden">
        {/* Background Video */}
        <video
          autoPlay
          loop
          muted
          playsInline
          disablePictureInPicture
          controlsList="nodownload nofullscreen noremoteplayback"
          className="absolute top-0 left-0 w-full h-full object-cover z-0"
        >
          <source src="/homepage/homepage-background4.mp4" type="video/mp4" />
          Your browser does not support the video tag.
        </video>

        {/* Optional dark overlay */}
        <div className="absolute top-0 left-0 w-full h-full bg-background bg-opacity-60 z-5"></div>
        {/* Overlay */}
        {/* <div className="absolute inset-0 bg-black bg-opacity-40"></div> */}

        {/* Content */}
        <div className="text-center text-white z-10 p-8 flex items-center flex-col justify-center">
          <img
            src={"/sprites/Logo.png"}
            className="pixel-art w-40 h-40 mb-4"
            alt="Logo"
          ></img>
          <h1 className="text-5xl md:text-6xl font-extrabold uppercase font-solo tracking-widest">
            Awaken, Player
          </h1>
          <p className="text-lg md:text-xl font-solo font-light  max-w-xl mx-auto font-semibold">
            Level Up your Life with ReLIFE Habits
          </p>

          <p className="mb-4">
            {"- " + "Inspired by the Solo Levelling System" + " -"}
          </p>

          <div className="flex flex-col items-center w-full justify-center">
            <button
              onClick={handleHeroButtonClick}
              className="px-8 py-3 my-3 bg-gradient-to-r from-[#0f0f0f] to-[#1c1c1c] text-blue-300 font-extrabold text-xl rounded-md shadow-[0_0_20px_rgba(0,255,255,0.4)] hover:shadow-[0_0_30px_rgba(0,255,255,0.7)] transition-all duration-300 transform hover:scale-105 hover:brightness-125 font-solo tracking-wide"
            >
              Start Your Awakening
            </button>

            <p className="text-white my-2">- or -</p>

            <button
              onClick={handleLogin}
              className="font-solo px-8 py-3 my-3 bg-gradient-to-r from-[#0f0f0f] to-[#1c1c1c] text-blue-300 font-extrabold text-xl rounded-md shadow-[0_0_20px_rgba(0,200,255,0.4)] hover:shadow-[0_0_30px_rgba(0,200,255,0.7)] transition-all duration-300 transform hover:scale-105 hover:brightness-125 tracking-wide"
            >
              Log In
            </button>
          </div>
        </div>
      </div>

      <div className="w-full h-screen flex items-center py-16 px-6 text-center relative overflow-hidden">
        {/* Magical purple glow in the background */}
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-[500px] h-[500px] bg-primary opacity-20 rounded-full blur-3xl z-0" />

        {/* Foreground content */}
        <div className="relative z-10 max-w-4xl mx-auto">
          <h2 className="font-solo tracking-widest text-3xl md:text-6xl font-bold text-primary mb-4 drop-shadow-md">
            {stats.totalUsers?.toLocaleString()}
          </h2>
          <h3 className="text-lg md:text-2xl text-white mb-4 font-solo font-bold tracking-wider">
            Players Have Joined!
          </h3>
          <p className="text-gray-300 text-lg max-w-xl mx-auto">
            The realm is alive! Join the journey and level up with the
            community.
          </p>

          <div className="mt-10 flex justify-center gap-6 flex-wrap">
            <div className="bg-gray-800/80 backdrop-blur-md p-6 rounded-xl shadow-lg transition transform">
              <p className="font-solo tracking-widest text-4xl font-bold text-green-400">
                {(stats.totalParticipants + 20000)?.toLocaleString()}
              </p>
              <p className="text-sm text-gray-400 mt-1">
                Total Quests Completed
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="relative w-full h-screen overflow-hidden">
        {/* Subtle background glow orb */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-primary opacity-10 blur-2xl rounded-full z-0" />

        {/* Content on top */}
        <div className="relative z-10 text-center text-white py-24 px-6 h-full flex flex-col justify-center overflow-hidden bg-background">
          {/* Pulsing shadow aura */}
          <div className="absolute top-1/2 left-1/2 w-[500px] h-[500px] -translate-x-1/2 -translate-y-1/2 bg-primary to-black opacity-20 blur-3xl animate-pulse-fast rounded-full z-0" />
          <div className="container mx-auto relative z-10">
            <h2 className="text-3xl md:text-5xl font-solo font-bold mb-6 tracking-widest text-text">
              Our Vision
            </h2>

            <div className="max-w-2xl mx-auto text-lg md:text-xl font-light leading-relaxed text-gray-300 backdrop-blur-sm p-6">
              <p>
                We envision a world where games do more than entertain — where
                they{" "}
                <span className="text-white font-semibold">inspire growth</span>
                ,{" "}
                <span className="text-white font-semibold">
                  encourage better habits
                </span>
                , and{" "}
                <span className="text-white font-semibold">
                  empower communities
                </span>
                .
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* About Us Section */}
      <section className="py-12 w-full flex items-center py-16 px-6 text-center relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-primary opacity-10 blur-2xl rounded-full z-0" />

        <div className="container mx-auto px-6">
          <h2 className="text-3xl md:text-5xl font-solo font-bold text-center text-white mb-12 tracking-wider text-primary">
            Our Features
          </h2>

          <div className="flex flex-wrap items-center justify-center gap-3">
            {features.map((feature, idx) => (
              <div
                key={idx}
                className="group w-[400px] relative rounded-md overflow-hidden shadow-lg transition-transform transform hover:scale-[1.02] hover:shadow-xl"
              >
                <img
                  key={feature.image} // forces React to re-render when the image source changes
                  src={`${feature.image}?v=${Date.now()}`}
                  alt={feature.title}
                  className="w-full h-64 object-cover object-center transition-opacity duration-300 group-hover:opacity-80"
                />

                <div className="absolute inset-0 flex items-end p-4 bg-gradient-to-t from-black/80 via-black/40 to-black/20">
                  <div className="transition-all duration-300 transform translate-y-0 group-hover:-translate-y-10">
                    <h3 className="text-xl font-bold text-white font-solo mb-1">
                      {feature.title}
                    </h3>
                    <p className="text-sm text-gray-200 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      {feature.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="relative text-white py-24 px-4 text-center overflow-hidden">
        {/* Background aura or glowing effect */}
        <div className="relative z-10 max-w-4xl mx-auto">
          <h2 className="text-3xl font-solo md:text-5xl font-extrabold tracking-wide mb-6 text-text drop-shadow-lg">
            Are You Ready to Level Up?
          </h2>
          <p className="text-lg font-bold font-solo md:text-xl text-gray-300 mb-10">
            Start questing now to become the best version of yourself.
          </p>
          <button
            onClick={handleHeroButtonClick}
            className="px-8 py-3 bg-gradient-to-r from-[#0f0f0f] to-[#1c1c1c] text-blue-300 font-extrabold text-xl rounded-md shadow-[0_0_20px_rgba(0,255,255,0.4)] hover:shadow-[0_0_30px_rgba(0,255,255,0.7)] transition-all duration-300 transform hover:scale-105 hover:brightness-125 font-solo tracking-wide"
          >
            Start Your Awakening
          </button>
        </div>
      </section>
    </>
  );
}

export default HomePage;
