import React, { useContext, useEffect, useState } from "react";
import {
  Routes,
  Route,
  Navigate,
  useLocation,
  matchPath,
  useNavigate,
} from "react-router-dom";
import QuestDashboard from "./Quests/QuestDashboard";
import Login from "./Authentication/Login";
import Signup from "./Authentication/SignUp";
import AccountPage from "./Account/AccountPage";
import Navbar from "./Miscellaneous/Navbar";
import Leaderboard from "./Leaderboard/Leaderboard";
import Shop from "./Shop/Shop";
import HomePage from "./Miscellaneous/HomePage";
import axios from "axios";
import config from "./config";
import Inventory from "./Inventory/Inventory";
import HelpPage from "./Miscellaneous/HelpPage";
import UpdatesPage from "./Miscellaneous/UpdatesPage";
import StatsPage from "./Account/StatsPage";
import { UserContext } from "./Account/UserContext";
import AboutUs from "./Miscellaneous/AboutUs";
import CutsceneModal from "./Miscellaneous/CutsceneModal";
import DeleteAccount from "./Miscellaneous/DeleteAccount";
import { FontProvider } from "./Miscellaneous/FontProvider";

const App = () => {
  const { accountDataRef, fetchAccountData } = useContext(UserContext);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [accountData, setAccountData] = useState({});

  const [level, setlevel] = useState(null);
  const [questTable, setQuestTable] = useState([]);
  const userId = JSON.parse(localStorage.getItem("user"))?.id;
  const [user, setUser] = useState([]);
  const [isSessionChecked, setIsSessionChecked] = useState(false); // Prevent infinite loop
  const [stage, setStage] = useState(0);
  const [theme, setThemeState] = useState(
    () => localStorage.getItem("theme") || "theme-blue",
  );

  const [showCutscene, setShowCutscene] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();

  const hiddenNavbarRoutes = [
    "/",
    "/login",
    "/signup",
    "/tower/:duration",
    "/cutscene",
    "/privacy-policy",
  ];

  const [showShadowPopup, setShowShadowPopup] = useState(false);

  useEffect(() => {
    fetchAccountData(userId);
  }, [userId]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (accountDataRef.current && !dataLoaded) {
        setAccountData(accountDataRef.current);
        setDataLoaded(true);
      }
    }, 300); // Small interval to wait for dataRef update

    return () => clearInterval(interval);
  }, [accountDataRef, dataLoaded]);

  // Function to calculate user level based on experience
  useEffect(() => {
    function calculateLevel(experience) {
      let level = 1;
      let xpForNextLevel = 10;

      while (experience >= xpForNextLevel) {
        level++;
        experience -= xpForNextLevel;
        xpForNextLevel = Math.ceil(xpForNextLevel * 1.1);
      }

      return { level, remainingXP: experience, xpForNextLevel };
    }
    setlevel(calculateLevel(accountData?.experience).level);
  }, [accountData]);

  useEffect(() => {
    document.documentElement.classList.remove(
      "theme-blue",
      "theme-red",
      "theme-green",
    );
    document.documentElement.classList.add(theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  // Wrapper for protected routes
  const RequireAuth = ({ children }) => {
    return userId ? children : <Navigate to="/login" />;
  };

  useEffect(() => {
    if (accountData && accountData.spiritHealth === 0) {
      setShowShadowPopup(true);
    }
  }, [accountData]);

  const isHidden = hiddenNavbarRoutes.some((route) =>
    matchPath({ path: route, end: true }, location.pathname),
  );

  useEffect(() => {
    const verifySession = async () => {
      try {
        const response = await axios.get(`${config.backendUrl}/auth/session`, {
          withCredentials: true,
        });
        console.log(response);
      } catch (err) {
        const unauthenticatedRoutes = ["/login", "/signup", "/"];
        const currentPath = location.pathname;

        if (
          err.response?.status === 401 &&
          !unauthenticatedRoutes.includes(currentPath)
        ) {
          console.warn("Session invalid");
          navigate("/login");
        }
      }
    };

    verifySession();
  }, []);

  const storyScenes = [
    {
      image: "/images/messy_room.png",
      text: "You weren’t born here.",
      delay: 3000,
    },
    {
      image: "/images/family_dinner.png",
      text: "You were sent here.",
      delay: 3000,
    },
    {
      image: "/images/portal.png",
      text: "In front of you lies a boundless structure, whose peak becomes a new horizon stretching into the heavens.",
      delay: 10000,
    },
    {
      image: "/images/ranking_board.png",
      text: "Her doors are welcome to all who wish to claim victory over the most cherished foe of all: the self",
      delay: 10000,
    },
    {
      image: "/images/training_ground.png",
      text: "Many have joined. Many have given up.",
      delay: 5000,
    },
    {
      image: "/images/rival.png",
      text: "Do you have what it takes to beat…",
      delay: 5000,
    },
    {
      image: "/images/hero_awaken.png",
      text: "The Tower of Rebirth",
      delay: 6000,
    },
  ];

  return (
    <FontProvider user={accountData}>
      <div className="bg-background min-h-screen">
        {!isHidden && accountData && <Navbar />}

        <div className={`${!isHidden && "pb-32"}`}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />

            <Route
              path="/cutscene"
              element={
                <RequireAuth>
                  <CutsceneModal
                    scenes={storyScenes}
                    onClose={() => setShowCutscene(false)}
                  />
                </RequireAuth>
              }
            />

            <Route
              path="/dashboard"
              element={
                <RequireAuth>
                  <QuestDashboard />
                </RequireAuth>
              }
            />

            <Route
              path="/account/:userId"
              element={
                <RequireAuth>
                  <AccountPage id={userId} />
                </RequireAuth>
              }
            />

            <Route
              path="/leaderboard"
              element={
                <RequireAuth>
                  <Leaderboard userId={userId} />
                </RequireAuth>
              }
            />

            <Route
              path="/inventory"
              element={
                <RequireAuth>
                  <Inventory userId={userId} />
                </RequireAuth>
              }
            />

            <Route
              path="/stats"
              element={
                <RequireAuth>
                  <StatsPage userId={userId} />
                </RequireAuth>
              }
            />

            <Route
              path="/help"
              element={
                <RequireAuth>
                  <HelpPage />
                </RequireAuth>
              }
            />
            <Route
              path="/updates"
              element={
                <RequireAuth>
                  <UpdatesPage />
                </RequireAuth>
              }
            />

            <Route
              path="/about"
              element={
                <RequireAuth>
                  <AboutUs />
                </RequireAuth>
              }
            />

            <Route
              path="/shop"
              element={
                <RequireAuth>
                  <Shop />
                </RequireAuth>
              }
            />

            <Route
              path="/delete-account"
              element={
                <RequireAuth>
                  <DeleteAccount />
                </RequireAuth>
              }
            />

            <Route
              path="*"
              element={<Navigate to={accountData ? "/dashboard" : "/login"} />}
            />
          </Routes>
        </div>
      </div>
    </FontProvider>
  );
};

export default App;
