import {
  faUser,
  faQuestionCircle,
  faScroll,
  faTrophy,
  faBox,
  faChartLine,
  faInfoCircle,
  faShop,
  faRankingStar,
  faBoxesStacked,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useState, useEffect, useContext, useMemo } from "react";
import { Link, useLocation } from "react-router-dom";
import { Tooltip } from "react-tooltip"; // Corrected import for Tooltip
import { UserContext } from "../Account/UserContext";

const Navbar = () => {
  const { accountDataRef, fetchAccountData } = useContext(UserContext);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false); // State to toggle the mobile menu
  const [accountData, setAccountData] = useState([]);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [claimedMilestones, setClaimedMilestones] = useState([]);
  const [claimableMilestones, setClaimableMilestones] = useState(false);
  const [timeLeft, setTimeLeft] = useState(getTimeUntilNextUTC());
  const questsleft = localStorage.getItem("questsLeft");
  const vowsLeft = parseInt(localStorage.getItem("vowsLeft")) || 0;
  const [updatedLevel, setUpdatedLevel] = useState(false);
  // const user = JSON.parse(localStorage.getItem('user'));
  // const userInitial = user?.username?.charAt(0).toUpperCase() || '?'; // Get the first letter of the username
  // const oldUpdates = localStorage.getItem("updatesData");
  const [newUpdateAvailable, setNewUpdateAvailable] = useState(false);
  const location = useLocation();
  const currentPath = location.pathname;
  const [showPremiumModal, setShowPremiumModal] = useState(false);

  const user = useMemo(() => JSON.parse(localStorage.getItem("user")), []);
  const userInitial = useMemo(
    () => user?.username?.charAt(0).toUpperCase() || "?",
    [user],
  );

  const oldUpdates = useMemo(() => localStorage.getItem("updatesData"), []);

  const perkMilestones = {
    strength: [20, 60, 150, 300, 1000, 2000],
    intelligence: [20, 60, 150, 300, 1000, 2000],
    endurance: [20, 60, 150, 300, 1000, 2000],
    bravery: [20, 60, 150, 300, 1000, 2000],
  };

  useEffect(() => {
    const interval = setInterval(() => {
      if (accountDataRef.current && !dataLoaded) {
        setAccountData(accountDataRef.current);
        // const playerMilestones = JSON.parse(accountDataRef.current.claimedMilestones) || [];
        // setClaimedMilestones(playerMilestones);
        setDataLoaded(true);
      }
    }, 500); // Small interval to wait for dataRef update

    return () => clearInterval(interval);
  }, [accountDataRef, dataLoaded, updatedLevel]);

  function calculateLevel(experience) {
    let level = 1;
    let xpForNextLevel = 10;

    while (experience >= xpForNextLevel) {
      level++;
      experience -= xpForNextLevel;
      xpForNextLevel = 10 * Math.pow(1.05, level - 1);
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

  useEffect(() => {
    const fetchUpdates = async () => {
      try {
        const response = await fetch(
          "https://docs.google.com/spreadsheets/d/e/2PACX-1vQwRovdOlYXUfnyGbl3gajTGp8Z2CdymvwK2SxB7uys6IXi4RhNJ6BF7WyaSClvcCMJKN4elSgVh7o7/pub?gid=0&single=true&output=csv",
        );
        if (!response.ok) {
          throw new Error("Failed to fetch updates.");
        }
        const text = await response.text();
        const rows = text.split("\n").map((row) => row.split(","));

        if (text.length > 1) {
          var stringText = JSON.stringify(text);
          if (stringText !== oldUpdates) {
            console.log("It is indeed different");

            setNewUpdateAvailable(true);
          } else {
            setNewUpdateAvailable(false);
          }
        }
      } catch (err) {
        console.error("Error fetching updates:", err);
      }
    };

    fetchUpdates();
  }, [oldUpdates]);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(getTimeUntilNextUTC());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  function getTimeUntilNextUTC() {
    const now = new Date();
    const nextUTC = new Date(
      Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate() + 1,
        0,
        0,
        0,
      ),
    ); // Next UTC midnight
    const diff = nextUTC - now;

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    return { hours, minutes, seconds };
  }

  const format = (n) => String(n).padStart(2, "0");

  // const rank = calculateRank(calculateLevel(accountData?.experience).level);

  const isActive = (path) => currentPath === path;

  const isPremium = accountData?.premium === 1;

  return (
    <>
      <nav className="bg-background text-white fixed w-full z-[99999]">
        <div className="hidden md:flex lg:flex flex-col space-y-4 md:space-y-2 items-start text-white w-[220px] h-full fixed top-0 left-0 p-4">
          <Link
            to={`/account/${user?.id}`}
            className="tracking-wider relative font-solo text-xl font-bold tracking-wide mb-4 ml-3 w-full hover:scale-105 transition-all duration-200"
          >
            ReLIFE Habits
          </Link>

          <Link
            to="/dashboard"
            className={`relative w-full font-solo px-3 py-2 rounded-md text-md font-medium text-left animate-all duration-200 hover:scale-105 ${
              isActive("/dashboard")
                ? "bg-primary text-white"
                : "hover:bg-primary"
            }`}
          >
            <FontAwesomeIcon icon={faScroll} className="mr-2" />
            Quests
            {Number(questsleft) > 0 && (
              <div className="absolute bottom-2 right-[65px]">
                <div className="bg-red-500 w-[20px] h-[20px] font-bold rounded-full text-md flex items-center justify-center ">
                  {questsleft}
                </div>
              </div>
            )}
          </Link>

          <Link
            to="/stats"
            className={`w-full px-3 py-2 rounded-md text-md font-solo font-medium text-left animate-all duration-200 hover:scale-105 ${
              isActive("/stats") ? "bg-primary text-white" : "hover:bg-primary"
            }`}
          >
            <FontAwesomeIcon icon={faChartLine} className="mr-2" />
            Progress
          </Link>

          <Link
            to="/inventory"
            className={`font-solo w-full px-3 py-2 rounded-md text-md font-medium text-left animate-all duration-200 hover:scale-105 ${
              isActive("/inventory")
                ? "bg-primary text-white"
                : "hover:bg-primary"
            }`}
          >
            <FontAwesomeIcon icon={faBox} className="mr-2" />
            Inventory
          </Link>

          {/* <Link
                to="/friends"
                className={`font-solo w-full px-3 py-2 rounded-md text-md font-medium text-left animate-all duration-200 hover:scale-105 ${
                  isActive("/friends")
                    ? "bg-primary text-white"
                    : "hover:bg-primary"
                }`}
              >
                <FontAwesomeIcon icon={faUserFriends} className="mr-2" />
                Friends
              </Link> */}

          <Link
            to="/leaderboard"
            className={`font-solo w-full px-3 py-2 rounded-md text-md font-medium text-left animate-all duration-200 hover:scale-105 ${
              isActive("/leaderboard")
                ? "bg-primary text-white"
                : "hover:bg-primary"
            }`}
          >
            <FontAwesomeIcon icon={faTrophy} className="mr-2" />
            Leaderboard
          </Link>

          <Link
            to="/shop"
            className={`font-solo w-full px-3 py-2 rounded-md text-md font-medium text-left animate-all duration-200 hover:scale-105 ${
              isActive("/shop") ? "bg-primary text-white" : "hover:bg-primary"
            }`}
          >
            <FontAwesomeIcon icon={faShop} className="mr-2" />
            Shop
          </Link>

          <div className="flex-grow"></div>

          <Link
            to="/about"
            className={`w-full font-solo px-3 py-2 rounded-md text-md font-medium text-white animate-all duration-200 hover:scale-105 ${
              isActive("/about") ? "bg-primary text-white" : "hover:bg-primary"
            }`}
          >
            <FontAwesomeIcon icon={faInfoCircle} /> About Us
          </Link>

          <Link
            to="/help"
            className={`w-full font-solo px-3 py-2 rounded-md text-md font-medium text-white animate-all duration-200 hover:scale-105 ${
              isActive("/help") ? "bg-primary text-white" : "hover:bg-primary"
            }`}
          >
            <FontAwesomeIcon icon={faQuestionCircle} /> Help
          </Link>
          <Link
            to={`/account/${user?.id}`}
            className={`w-full font-solo px-3 py-2 rounded-md text-md font-medium text-white animate-all duration-200 hover:scale-105 ${
              isActive(`/account/${user?.id}`)
                ? "bg-primary text-white"
                : "hover:bg-primary"
            }`}
          >
            <FontAwesomeIcon icon={faUser} /> {accountData?.username}
          </Link>
        </div>

        {/* Fixed Bottom Navigation Bar */}
        <div className="md:hidden fixed bottom-0 left-0 z-[9999] w-full bg-gray-900 text-white border-t border-gray-700 grid grid-cols-6 py-4">
          <Link
            to="/dashboard"
            className="flex flex-col items-center justify-center"
          >
            <FontAwesomeIcon icon={faScroll} className="text-lg" />
            {/* <span className="text-xs">Quests</span> */}
          </Link>

          <Link
            to="/stats"
            className="flex flex-col items-center justify-center"
          >
            <FontAwesomeIcon icon={faChartLine} className="text-lg" />
            {/* <span className="text-xs">Stats</span> */}
          </Link>

          <Link
            to="/inventory"
            className="flex flex-col items-center justify-center"
          >
            <FontAwesomeIcon icon={faBoxesStacked} className="text-lg" />
            {/* <span className="text-xs">Inventory</span> */}
          </Link>

          <Link
            to="/leaderboard"
            className="flex flex-col items-center justify-center"
          >
            <FontAwesomeIcon icon={faRankingStar} className="text-lg" />
            {/* <span className="text-xs">Leaderboard</span> */}
          </Link>

          <Link
            to="/shop"
            className="flex flex-col items-center justify-center"
          >
            <FontAwesomeIcon icon={faShop} className="text-lg" />
            {/* <span className="text-xs">Shop</span> */}
          </Link>

          <Link
            to={`/account/${user?.id}`}
            className="flex flex-col items-center justify-center"
          >
            <FontAwesomeIcon icon={faUser} className="text-lg" />
            {/* <span className="text-xs">Account</span> */}
          </Link>
        </div>

        {/* Mobile Navigation Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-[#1a2331]">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              {/* Mobile Version of the Leaderboard Link */}
              <Link
                to="/leaderboard"
                className="font-solo block px-3 py-2 rounded-md text-base font-medium hover:bg-primary"
                data-tip="Leaderboard" // Tooltip for Leaderboard
              >
                <FontAwesomeIcon icon={faTrophy} className="mr-2" /> Leaderboard
              </Link>

              <Link
                to={"/inventory"}
                className="font-solo block px-3 py-2 rounded-md text-base font-medium hover:bg-primary"
                data-tip="Inventory" // Tooltip for Account
              >
                <FontAwesomeIcon icon={faBox} className="mr-2" /> Inventory
              </Link>

              <div className="flex items-center justify-center w-full px-2 grid grid-cols-5">
                <Link
                  className="flex items-center justify-center cursor-pointer text-md"
                  to={"/help"}
                >
                  <FontAwesomeIcon className="ml-1" icon={faQuestionCircle} />
                </Link>
                <Link
                  className="flex items-center justify-center cursor-pointer text-md"
                  to={"/about"}
                >
                  <FontAwesomeIcon className="ml-1" icon={faInfoCircle} />
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* React Tooltip component */}
        <Tooltip place="top" effect="solid" />
        {showPremiumModal && (
          <PremiumModal onClose={() => setShowPremiumModal(false)} />
        )}
      </nav>
      <style>{`
        @keyframes glow {
          0% { filter: drop-shadow(0 0 6px #ffd700); }
          50% { filter: drop-shadow(0 0 18px #ffd700); }
          100% { filter: drop-shadow(0 0 6px #ffd700); }
        }
        .animate-glow {
          animation: glow 2s infinite;
        }
      `}</style>
    </>
  );
};

export default Navbar;
