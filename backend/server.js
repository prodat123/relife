import Fastify from "fastify";
import rateLimit from "@fastify/rate-limit";
import bodyParser from "body-parser";
import db from "./db.js";
import cors from "@fastify/cors";
import bcrypt from "bcryptjs";
import cron from "node-cron";
import axios from "axios";
import { v4 as uuidv4 } from "uuid";
import fastifySession from "@fastify/session";
import fastifyCookie from "@fastify/cookie";
import underPressure from "@fastify/under-pressure";
import helmet from "@fastify/helmet";
import dotenv from "dotenv";
import { Server } from "socket.io";

import authRoutes from "./routes/auth.js";
import questRoutes from "./routes/quests.js";
import scheduledQuestRoutes from "./routes/scheduled-quests.js";
import questsRoutes from "./routes/quests.js";
import shopRoutes from "./routes/shop.js";

dotenv.config();

// Initialize Fastify
const fastify = Fastify({ trustProxy: true });

fastify.register(underPressure);

fastify.register(authRoutes, { prefix: "/auth" });
fastify.register(questsRoutes, { prefix: "/quests" });
fastify.register(questRoutes, { prefix: "/quest" });
fastify.register(scheduledQuestRoutes, { prefix: "/scheduled-quests" });
fastify.register(shopRoutes, { prefix: "/shop" });

// Helmet & CORS
fastify.register(helmet);
fastify.register(cors, {
  origin: (origin, cb) => {
    const allowedOrigins = [
      "https://localhost",
      "capacitor://localhost",
      "http://localhost:3000",
      "https://relifehabits.com",
    ];
    if (!origin || allowedOrigins.includes(origin)) {
      cb(null, true);
    } else {
      cb(new Error("Not allowed by CORS"), false);
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "Origin",
    "X-Requested-With",
  ],
});

// Cookie and Session
fastify.register(fastifyCookie);
fastify.register(fastifySession, {
  secret: process.env.SESSION_SECRET_KEY,
  cookie: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 86400 * 1000 * 30, // 30 days
  },
  saveUninitialized: false,
});

// Global Rate Limiting
fastify.register(rateLimit, {
  max: 150,
  timeWindow: "10 seconds",
  ban: 60000,
  keyGenerator: (req) => req.ip,
  errorResponseBuilder: (req, context) => ({
    code: 429,
    error: "Too Many Requests",
    message: `Rate limit exceeded: ${context.max} requests per ${context.after}`,
  }),
});

// Custom GET Rate Limiting by userId
const questsRateLimit = {};
const MAX_QUEST_CALLS = 100;
const QUEST_WINDOW = 10 * 1000;
const IP_BLOCK_LIMIT = 150;
const IP_BLOCK_WINDOW = 10 * 1000; // 10 seconds
const IP_BLOCK_DURATION = 60 * 1000; // 1 minute

fastify.addHook("preHandler", async (request, reply) => {
  const ip = request.ip;
  const now = Date.now();

  if (!questsRateLimit[ip]) {
    questsRateLimit[ip] = {
      count: 1,
      startTime: now,
      blockedUntil: null,
    };
  }

  const ipData = questsRateLimit[ip];

  // Check if IP is currently blocked
  if (ipData.blockedUntil && now < ipData.blockedUntil) {
    console.warn(`IP ${ip} is temporarily blocked.`);
    return reply
      .code(429)
      .send({ error: "Too many requests. Try again later." });
  }

  // Reset count if time window has passed
  if (now - ipData.startTime > IP_BLOCK_WINDOW) {
    ipData.count = 1;
    ipData.startTime = now;
    ipData.blockedUntil = null;
  } else {
    ipData.count++;
  }

  // Block IP if request count exceeds the limit
  if (ipData.count > IP_BLOCK_LIMIT) {
    ipData.blockedUntil = now + IP_BLOCK_DURATION;
    console.warn(
      `Rate limit exceeded for IP ${ip}. Blocking for ${
        IP_BLOCK_DURATION / 1000
      } seconds.`,
    );
    return reply
      .code(429)
      .send({ error: "Rate limit exceeded. Please try again later." });
  }
});

const io = new Server(fastify.server, {
  cors: {
    origin: [
      "https://www.relifehabits.com", // Add this for completeness
      "https://relifehabits.com", // production frontend
      "http://localhost:3000", // dev frontend
    ],
    methods: ["GET", "POST"],
    credentials: true,
  },
});

fastify.get("/user-stats", async (request, reply) => {
  console.log("THIS IS BEING CALLED");
  try {
    // Query to count users
    const [userCountResult] = await db.query(
      "SELECT COUNT(*) as totalUsers FROM users",
    );

    // Query to count quest participants
    const [questCountResult] = await db.query(
      "SELECT COUNT(*) as totalParticipants FROM quest_participants",
    );

    const totalUsers = userCountResult[0].totalUsers;
    const totalParticipants = questCountResult[0].totalParticipants;

    console.log("TOTAL USERS: " + totalUsers);
    console.log("TOTAL PARTICIPANTS: " + totalParticipants);
    return reply.code(200).send({
      totalUsers,
      totalParticipants,
    });
  } catch (error) {
    console.error("Error fetching stats:", error);
    return reply.code(500).send({ error: "Internal server error" });
  }
});

const clearCompletedQuestParticipants = async () => {
  const query = `
        DELETE qp FROM quest_participants qp
        JOIN quests q ON qp.quest_id = q.id
        WHERE qp.completed = 0 AND q.type = 'daily';
    `;

  try {
    const [results] = await db.query(query);
    console.log(
      "🧹 Successfully cleared incomplete daily quest participants:",
      results,
    );
  } catch (err) {
    console.error("SQL Error (clearCompletedQuestParticipants):", err.message);
  }
};

const calculateLevel = (experience) => {
  let level = 1;
  let xpForNextLevel = 10;

  while (experience >= xpForNextLevel) {
    level++;
    experience -= xpForNextLevel;
    xpForNextLevel = 10 * Math.pow(1.05, level - 1);
  }

  return { level, remainingXP: experience, xpForNextLevel };
};

async function autoSelectQuest(questId, userId) {
  const formattedDate = new Date();
  const datetime = formattedDate.toISOString().slice(0, 19).replace("T", " ");

  const [userExists] = await db.query(
    "SELECT id, guild FROM users WHERE id = ?",
    [userId],
  );
  if (userExists.length === 0) return;

  const guildName = userExists[0].guild;
  let extraSlots = 0;
  let questTimerBuff = 0;

  if (guildName) {
    const [guild] = await db.query(
      "SELECT guild_upgrades FROM guilds WHERE name = ?",
      [guildName],
    );
    if (guild.length > 0) {
      const guildUpgrades = JSON.parse(guild[0].guild_upgrades || "[]");
      extraSlots =
        (guildUpgrades.find((u) => u.type === "extraSlots")?.level || 0) * 2;
      questTimerBuff =
        (guildUpgrades.find((u) => u.type === "questTimerBuff")?.level || 0) *
        5;
    }
  }

  const [activeQuests] = await db.query(
    "SELECT id FROM quest_participants WHERE user_id = ? AND completed = 0",
    [userId],
  );

  if (activeQuests.length >= 4 + extraSlots) return;

  const [existing] = await db.query(
    "SELECT * FROM quest_participants WHERE quest_id = ? AND user_id = ?",
    [questId, userId],
  );

  const [quest] = await db.query(
    "SELECT difficulty, type FROM quests WHERE id = ?",
    [questId],
  );

  if (!quest || quest.length === 0) return;

  const difficulty = quest[0].difficulty || 1;
  const type = quest[0].type || "";
  const isJourney = type === "journey";

  const expiredAt = isJourney
    ? new Date(formattedDate.getTime() + 24 * 60 * 60 * 1000)
    : new Date(
        formattedDate.getTime() +
          (difficulty * 30 - questTimerBuff) * 60 * 1000,
      );

  if (existing.length > 0) {
    if (existing[0].progress !== "Started") {
      await db.query(
        `UPDATE quest_participants SET progress = ?, joined_at = ?, joined_at_datetime = ?, expired_at = ?, completed = ?
            WHERE id = ?`,
        ["Started", datetime, formattedDate, expiredAt, false, existing[0].id],
      );
    }
    return;
  }

  await db.query(
    `INSERT INTO quest_participants 
        (quest_id, user_id, progress, completed, joined_at, expired_at, completed_at, joined_at_datetime, period_completed) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      questId,
      userId,
      "Started",
      false,
      datetime,
      expiredAt,
      null,
      formattedDate,
      isJourney ? 0 : null,
    ],
  );
}

fastify.post("/schedule-quest", async (request, reply) => {
  // 1. Destructure the new 'schedule' object from the request body
  const { quest_id, user_id, schedule } = request.body;

  console.log(request.body);

  if (!request.session.userId || request.session.userId !== user_id) {
    return reply.code(401).send({ error: "Unauthorized: Invalid Session" });
  }

  // 2. Updated validation logic to check for the schedule object and its contents
  if (!quest_id || !user_id || !schedule || typeof schedule !== "object") {
    return reply.code(400).send({
      error: "Missing or invalid quest_id, user_id, or schedule object",
    });
  }

  // More specific validation for schedule properties
  if (!schedule.type || !schedule.time || !schedule.startDate) {
    return reply.code(400).send({
      error:
        "Schedule object is missing required properties (type, time, startDate)",
    });
  }

  if (
    schedule.type === "weekly" &&
    (!Array.isArray(schedule.days) || schedule.days.length === 0)
  ) {
    return reply
      .code(400)
      .send({ error: "Weekly schedule must include at least one day." });
  }

  try {
    // Check if a schedule for this quest and user already exists
    const [existing] = await db.query(
      `SELECT quest_id FROM scheduled_quests WHERE quest_id = ? AND user_id = ?`,
      [quest_id, user_id],
    );

    // 3. Simplified logic: We either INSERT a new schedule or UPDATE the existing one.
    // The complex logic for merging days and preserving streaks is no longer needed here.
    // Streak management will now happen when a user completes a quest.

    if (existing.length > 0) {
      // The schedule already exists, so we UPDATE it.
      await db.query(
        `UPDATE scheduled_quests SET schedule_details = ? WHERE quest_id = ? AND user_id = ?`,
        [JSON.stringify(schedule), quest_id, user_id],
      );
      return reply.send({
        success: true,
        message: "Quest schedule updated successfully",
      });
    } else {
      // This is a new schedule, so we INSERT it.
      // The streak and last_completed_date will use their default values (0 and NULL).
      await db.query(
        `INSERT INTO scheduled_quests (quest_id, user_id, schedule_details) VALUES (?, ?, ?)`,
        [quest_id, user_id, JSON.stringify(schedule)],
      );
      return reply.send({
        success: true,
        message: "Quest scheduled successfully",
      });
    }
  } catch (err) {
    console.error("Error in /schedule-quest:", err);
    reply.code(500).send({ error: "Internal Server Error" });
  }
});

const MISSION_LOOT_TABLES = {
  easy: { peasantly: 70, artisan: 25, knightly: 5 },
  medium: { knightly: 50, noble: 40, kingly: 10 },
  hard: { noble: 60, kingly: 30, emperor: 10 },
};

// Helper function to perform a weighted roll (from your /open-scrapbox logic)
const getRandomItemFromMissionLootTable = (table) => {
  const entries = Object.entries(table);
  const totalWeight = entries.reduce((sum, [, weight]) => sum + weight, 0);
  const rand = Math.random() * totalWeight;
  let runningWeight = 0;
  for (const [itemName, weight] of entries) {
    runningWeight += weight;
    if (rand <= runningWeight) return itemName;
  }
  return null;
};

fastify.post("/missions/claim", async (request, reply) => {
  // 1. Destructure userId, difficulty, and date
  const { userId, difficulty, date } = request.body;

  console.log(userId);
  console.log(difficulty);
  console.log(date);

  if (!request.session.userId || request.session.userId !== userId) {
    return reply.code(401).send({ error: "Unauthorized: Invalid Session" });
  }
  if (!userId || !difficulty || !date) {
    return reply.code(400).send({ error: "Missing required details" });
  }

  try {
    // 2. Fetch user and check if reward was already claimed
    const [userRows] = await db.query(
      `SELECT inventory, missionRewardClaimed FROM users WHERE id = ?`,
      [userId],
    );
    if (userRows.length === 0) {
      return reply.code(404).send({ error: "User not found" });
    }

    const user = userRows[0];
    const lastClaimDate = user.missionRewardClaimed
      ? new Date(user.missionRewardClaimed).toISOString().slice(0, 10)
      : null;

    if (lastClaimDate === date) {
      return reply
        .code(403)
        .send({ error: "Reward already claimed for today." });
    }

    // --- ITEM REWARD LOGIC STARTS HERE ---

    // 3. Roll for the item rarity based on mission difficulty
    const lootTable = MISSION_LOOT_TABLES[difficulty];
    if (!lootTable) {
      return reply.code(400).send({ error: "Invalid mission difficulty." });
    }
    const rewardedItemRarity = getRandomItemFromMissionLootTable(lootTable);

    // 4. Get a random item of that rarity from the database
    const [[rewardItem]] = await db.query(
      `SELECT * FROM items WHERE rarity = ? ORDER BY RAND() LIMIT 1`,
      [rewardedItemRarity],
    );
    if (!rewardItem) {
      return reply
        .code(404)
        .send({ error: "No item found for the rolled rarity." });
    }

    // 5. Add the new item to the user's inventory
    let inventory = JSON.parse(user.inventory || "[]");
    const existingItem = inventory.find(
      (item) => item.name === rewardItem.name,
    );

    if (existingItem) {
      existingItem.quantity = (existingItem.quantity || 1) + 1;
    } else {
      inventory.push({
        id: uuidv4(), // Ensure you have uuid imported or available
        name: rewardItem.name,
        type: rewardItem.type,
        rarity: rewardItem.rarity,
        description: rewardItem.description,
        image_url: rewardItem.image_url,
        levelRequired: rewardItem.levelRequired || 1,
        quantity: 1,
      });
    }

    // 6. Update inventory and mark reward as claimed in one query
    await db.query(
      `UPDATE users SET inventory = ?, missionRewardClaimed = ? WHERE id = ?`,
      [JSON.stringify(inventory), date, userId],
    );

    // 7. Send the rewarded item data back to the frontend
    return reply.send({ success: true, rewardedItem: rewardItem });
  } catch (err) {
    console.error("Error in /missions/claim:", err);
    reply.code(500).send({ error: "Internal Server Error" });
  }
});

fastify.post("/missions/update", async (request, reply) => {
  const { userId, missions, date, reward, difficulty } = request.body;

  if (!request.session.userId || request.session.userId !== userId) {
    return reply.code(401).send({ error: "Unauthorized: Invalid Session" });
  }

  if (
    !userId ||
    !missions ||
    !Array.isArray(missions) ||
    !date ||
    !reward ||
    !difficulty
  ) {
    return reply.code(400).send({
      error: "Missing userId, missions array, date, or reward object.",
    });
  }

  try {
    const [userRows] = await db.query(
      `SELECT dailyMissions FROM users WHERE id = ?`,
      [userId],
    );

    if (userRows.length === 0) {
      return reply.code(404).send({ error: "User not found" });
    }

    const user = userRows[0];

    let existingMissions = {};
    try {
      existingMissions = user.dailyMissions
        ? JSON.parse(user.dailyMissions)
        : {};
    } catch {
      existingMissions = {};
    }

    existingMissions[date] = {
      missions, // Array of today's missions
      reward, // The daily reward object
      difficulty,
      completed: false, // Flag for whether today's reward has been claimed
      claimedAt: null, // When the user claimed it (null until they do)
    };

    const updatedJSON = JSON.stringify(existingMissions);

    await db.query(`UPDATE users SET dailyMissions = ? WHERE id = ?`, [
      updatedJSON,
      userId,
    ]);

    return reply.send({
      success: true,
      message: "Daily missions and reward updated successfully.",
      dailyMissions: existingMissions,
    });
  } catch (err) {
    console.error("Error in /missions/update:", err);
    return reply.code(500).send({ error: "Internal Server Error" });
  }
});

fastify.get("/rewards/daily-season", async (request, reply) => {
  try {
    // Define the current season. You can change this number to switch seasons.
    const currentSeasonId = 1;

    // 1. Fetch all rewards for the current season, ordered by day.
    const [rewards] = await db.query(
      `SELECT day, reward_type, reward_amount 
         FROM reward_seasons 
         WHERE season_id = ? 
         ORDER BY day ASC`,
      [currentSeasonId],
    );

    if (rewards.length === 0) {
      return reply.code(404).send({
        error: `Reward data for season ${currentSeasonId} not found.`,
      });
    }

    // 2. Send the full list of rewards as the response.
    return reply.send(rewards);
  } catch (err) {
    console.error("Error in /rewards/daily-season:", err);
    reply.code(500).send({ error: "Internal Server Error" });
  }
});

fastify.get("/rewards/daily-status/:userId", async (request, reply) => {
  const { userId } = request.params;
  // Standard authentication check
  if (!request.session.userId || request.session.userId != userId) {
    return reply.code(401).send({ error: "Unauthorized: Invalid Session" });
  }

  try {
    // 1. Fetch both the user's data and the current reward season's data in parallel
    const [userRows] = await db.query(`SELECT * FROM users WHERE id = ?`, [
      Number(userId),
    ]);

    const currentSeasonId = 1; // You can make this dynamic later
    const [rewardRows] = await db.query(
      `SELECT day, reward_type, reward_amount FROM reward_seasons WHERE season_id = ? ORDER BY day ASC`,
      [currentSeasonId],
    );

    // --- Validation ---
    if (userRows.length === 0) {
      return reply.code(404).send({ error: "User not found" });
    }
    if (rewardRows.length === 0) {
      return reply
        .code(404)
        .send({ error: `Reward season ${currentSeasonId} not found.` });
    }

    // 2. Safely parse the user's reward data
    const user = userRows[0];
    const rewardData = JSON.parse(user.dailyRewardClaimed) || {
      streak: 0,
      lastClaimDate: null,
    };

    // 3. Determine if the user can claim their reward today
    const todayStr = new Date().toISOString().slice(0, 10);
    const canClaimToday = rewardData.lastClaimDate !== todayStr;

    // 4. Determine the user's current position in the reward cycle
    // If they can claim, their streak is the next day. If not, it's the day they already claimed.
    let currentStreak;
    if (canClaimToday) {
      // This is a consecutive, non-breaking streak
      currentStreak = (rewardData.streak % 14) + 1;
    } else {
      // They have already claimed today, so their streak is the day they are on
      currentStreak = rewardData.streak;
    }

    // 5. Send the complete payload to the frontend
    return reply.send({
      success: true,
      rewards: rewardRows, // The full list of 14 rewards for the season
      streak: currentStreak,
      canClaimToday: canClaimToday,
    });
  } catch (err) {
    console.error("Error in /rewards/daily-status:", err);
    reply.code(500).send({ error: "Internal Server Error" });
  }
});

fastify.post("/rewards/daily-claim", async (request, reply) => {
  const { userId } = request.body;

  if (!request.session.userId || request.session.userId !== userId) {
    return reply.code(401).send({ error: "Unauthorized: Invalid Session" });
  }
  if (!userId) {
    return reply.code(400).send({ error: "Missing userId" });
  }

  try {
    const todayStr = new Date().toISOString().slice(0, 10);

    const [userRows] = await db.query(
      `SELECT dailyRewardClaimed FROM users WHERE id = ?`,
      [userId],
    );

    if (userRows.length === 0) {
      return reply.code(404).send({ error: "User not found" });
    }

    const rewardData = JSON.parse(userRows[0].dailyRewardClaimed) || {
      streak: 0,
      lastClaimDate: null,
    };

    if (rewardData.lastClaimDate === todayStr) {
      return reply
        .code(403)
        .send({ error: "Reward already claimed for today." });
    }

    const newStreak = (rewardData.streak % 14) + 1;
    const currentSeasonId = 1;

    const [rewardRows] = await db.query(
      `SELECT reward_type, reward_amount FROM reward_seasons WHERE season_id = ? AND day = ?`,
      [currentSeasonId, newStreak],
    );

    if (rewardRows.length === 0) {
      return reply.code(500).send({
        error: `Reward for Season ${currentSeasonId}, Day ${newStreak} not found in database.`,
      });
    }

    // --- MAPPING LOGIC ---

    // 1. Define mappings for rarity and icons on the backend
    const rarityMap = {
      1: "Common",
      2: "Common",
      3: "Uncommon",
      4: "Uncommon",
      5: "Rare",
      6: "Rare",
      7: "Rare",
      8: "Common",
      9: "Common",
      10: "Uncommon",
      11: "Uncommon",
      12: "Rare",
      13: "Rare",
      14: "Legendary",
    };

    const iconMap = {
      xp: "award",
      gems: "gem",
      currency: "coins", // Mapped from 'gold' for consistency
    };

    const dbReward = rewardRows[0];

    // 2. Construct the reward object, now including rarity and icon name
    const rewardToClaim = {
      type: dbReward.reward_type,
      amount: dbReward.reward_amount,
      rarity: rarityMap[newStreak] || "Common",
      icon: iconMap[dbReward.reward_type] || "star", // Add icon name with a fallback
    };

    // --- DATABASE UPDATE ---
    const columnToUpdate =
      rewardToClaim.type === "xp" ? "experience" : "currency";
    const newRewardData = {
      streak: newStreak,
      lastClaimDate: todayStr,
    };

    await db.query(
      `UPDATE users 
       SET 
         dailyRewardClaimed = ?,
         ${columnToUpdate} = ${columnToUpdate} + ?
       WHERE id = ?`,
      [JSON.stringify(newRewardData), rewardToClaim.amount, userId],
    );

    // --- FINAL RESPONSE ---
    return reply.send({
      success: true,
      message: `Successfully claimed Day ${newStreak} reward!`,
      claimedReward: { ...rewardToClaim, day: newStreak },
      newStreak: newStreak,
    });
  } catch (err) {
    console.error("Error in /rewards/daily-claim:", err);
    reply.code(500).send({ error: "Internal Server Error" });
  }
});

fastify.get("/account", async (request, reply) => {
  const { userId } = request.query;

  if (!userId) {
    return reply.code(400).send({ error: "User ID is required" });
  }

  try {
    // Fetch the user's account data
    const [userResults] = await db.query("SELECT * FROM users WHERE id = ?", [
      userId,
    ]);

    if (userResults.length === 0) {
      return reply.code(404).send({ error: "User not found" });
    }

    const user = userResults[0];

    // Parse inventory from the user's data (stored as a JSON string)
    const inventoryItems = user.inventory ? JSON.parse(user.inventory) : [];

    // Provide default placeholders for missing slots based on the inventory directly
    const equipment = {
      head: (user.head &&
        inventoryItems.find((item) => item.id === String(user.head))) || {
        id: "",
        name: "None",
        type: "head",
      },
      torso: (user.torso &&
        inventoryItems.find((item) => item.id === String(user.torso))) || {
        id: "",
        name: "None",
        type: "torso",
      },
      legs: (user.legs &&
        inventoryItems.find((item) => item.id === String(user.legs))) || {
        id: "",
        name: "None",
        type: "legs",
      },
      feet: (user.feet &&
        inventoryItems.find((item) => item.id === String(user.feet))) || {
        id: "",
        name: "None",
        type: "feet",
      },
      weapon: (user.weapon &&
        inventoryItems.find((item) => item.id === String(user.weapon))) || {
        id: "",
        name: "None",
        type: "weapon",
      },
    };

    // Send the response with user data, inventory, and equipment
    return reply.code(200).send({
      id: user.id,
      username: user.username,
      experience: user.experience,
      stats: JSON.parse(user.stats || "{}"),
      equipment,
      inventory: inventoryItems,
      currency: user.currency,
      discount: user.discount,
      last_spin: user.last_spin,
      spells: user.spells,
      ownedSpells: user.ownedSpells,
      badges: user.badges,
      perks: user.perks,
      perkPoints: user.perkPoints,
      claimedMilestones: user.claimedMilestones,
      guild: user.guild,
      questTags: user.questTags,
      spiritHealth: user.spiritHealth,
      maxSpiritHealth: user.maxSpiritHealth,
      unlockedFloors: user.unlockedFloors,
      premium: user.premium,
      goal: user.goal,
      dailyRewardClaimed: user.dailyRewardClaimed,
      missionRewardClaimed: user.missionRewardClaimed,
      dailyMissions: user.dailyMissions,
      roomLayout: user.roomLayout,
      font: user.font,
      progress: JSON.parse(user.progress),
    });
  } catch (error) {
    console.error("Error fetching account data:", error.message);
    return reply.code(500).send({ error: "Failed to fetch account data" });
  }
});

fastify.post("/user/layout/save", async (request, reply) => {
  // 1. Get userId and grid layout from the request body
  const { userId, grid } = request.body;

  // 2. Security: Ensure the user is authenticated and updating their own layout
  if (
    !request.session.userId ||
    Number(request.session.userId) != Number(userId)
  ) {
    return reply.code(401).send({ error: "Unauthorized: Invalid Session" });
  }

  // 3. Validate the incoming data
  if (!userId || !grid || !Array.isArray(grid)) {
    return reply.code(400).send({
      error:
        "Invalid request parameters. 'userId' and 'grid' array are required.",
    });
  }

  try {
    // 4. (Optimization) Sanitize the grid data before saving.
    // We only need to store the cell ID and the unique ID of the item in it.
    // This keeps the data lightweight and avoids duplicating full item details.
    const sanitizedLayout = grid.map((cell) => ({
      id: cell.id,
      itemId: cell.item ? cell.item.id : null, // Store only the item's unique ID, or null if empty
    }));

    // Convert the sanitized layout to a JSON string for storage
    const layoutJson = JSON.stringify(sanitizedLayout);

    // 5. Update the database with the new layout
    const [updateResult] = await db.query(
      `UPDATE users SET roomLayout = ? WHERE id = ?`,
      [layoutJson, userId],
    );

    if (updateResult.affectedRows === 0) {
      return reply.code(404).send({ error: "User not found." });
    }

    // 6. Send a success response
    reply.send({
      success: true,
      message: "Layout saved successfully.",
    });
  } catch (err) {
    console.error("Error saving user layout:", err.message, err.stack);
    reply.code(500).send({ error: "Failed to save layout." });
  }
});

// A new, dedicated endpoint for saving the user's font preference.
fastify.post("/user/font/save", async (request, reply) => {
  // 1. Get userId and the new font from the request body
  const { userId, font } = request.body;

  // 2. Security: Ensure the user is authenticated and updating their own settings
  if (
    !request.session.userId ||
    Number(request.session.userId) !== Number(userId)
  ) {
    return reply.code(401).send({ error: "Unauthorized: Invalid Session" });
  }

  // 3. Validate the incoming data
  if (!userId || !font || typeof font !== "string") {
    return reply.code(400).send({
      error: "Invalid request. 'userId' and 'font' string are required.",
    });
  }

  // (Optional but Recommended) Further validate that the font is one of the allowed values
  const ALLOWED_FONTS = [
    "sans",
    "solo",
    "display",
    "mono",
    "script",
    "serifKr",
    "heading",
  ]; // This should match your client-side FONT_OPTIONS
  if (!ALLOWED_FONTS.includes(font)) {
    return reply.code(400).send({ error: "Invalid font selected." });
  }

  try {
    // 4. Update the database with the new font preference
    const [updateResult] = await db.query(
      `UPDATE users SET font = ? WHERE id = ?`,
      [font, userId],
    );

    if (updateResult.affectedRows === 0) {
      return reply.code(404).send({ error: "User not found." });
    }

    // 5. Send a success response
    reply.send({
      success: true,
      message: "Font preference saved successfully.",
    });
  } catch (err) {
    console.error("Error saving user font:", err.message, err.stack);
    reply.code(500).send({ error: "Failed to save font preference." });
  }
});

fastify.get("/monster", async (request, reply) => {
  const { bossName } = request.query;

  if (!bossName) {
    return reply.code(400).send({ error: "Monster name is required" });
  }

  try {
    // Fetch the user's account data
    const [monsterResults] = await db.query(
      "SELECT * FROM monsters WHERE name = ?",
      [bossName],
    );

    if (monsterResults.length === 0) {
      return reply.code(404).send({ error: "Monster not found" });
    }

    const monsterResult = monsterResults[0];

    // Log the equipment data for debugging
    // console.log("Mapped Equipment Data:", equipment);

    // Send the response with user data, inventory, and equipment
    reply.code(200).send(monsterResult);
  } catch (error) {
    console.error("Error fetching monster data:", error.message);
    reply.code(500).send({ error: "Failed to fetch monster data" });
  }
});

fastify.get("/allMonsters", async (request, reply) => {
  try {
    const [monsterResults] = await db.query("SELECT * FROM monsters");

    if (monsterResults.length === 0) {
      return reply.code(404).send({ error: "No monsters found" });
    }

    // Process each monster
    const monstersWithLoot = await Promise.all(
      monsterResults.map(async (monster) => {
        let lootItemIds = [];

        try {
          lootItemIds = JSON.parse(monster.loot || "[]");
        } catch (e) {
          lootItemIds = [];
        }

        let lootItems = [];

        if (lootItemIds.length > 0) {
          const [items] = await db.query(
            `SELECT * FROM items WHERE id IN (?)`,
            [lootItemIds],
          );
          lootItems = items;
        }

        return {
          ...monster,
          loot: lootItems, // replace IDs with actual item data
        };
      }),
    );

    reply.code(200).send(monstersWithLoot);
  } catch (error) {
    console.error("Error fetching monster data:", error.message);
    reply.code(500).send({ error: "Failed to fetch monster data" });
  }
});
fastify.get("/leaderboard", async (request, reply) => {
  const { userId, stat = "experience", timeframe = "all_time" } = request.query;
  if (!userId || !request.session.userId || request.session.userId != userId) {
    return reply.code(401).send({ error: "Unauthorized" });
  }

  try {
    const allowedStats = [
      "experience",
      "strength",
      "intelligence",
      "bravery",
      "endurance",
    ];
    const sortStat = allowedStats.includes(stat) ? stat : "experience";
    let leaderboardQuery;

    if (timeframe === "all_time") {
      // "All time" logic is correct and does not change.
      let orderByClause =
        sortStat === "experience"
          ? "ORDER BY experience DESC"
          : `ORDER BY CAST(JSON_EXTRACT(stats, '$.${sortStat}') AS UNSIGNED) DESC`;

      leaderboardQuery = `
        SELECT id, username, experience, stats, inventory, head, torso, legs, feet, weapon 
        FROM users
        ${orderByClause}
        LIMIT 50
      `;
    } else {
      // --- FINAL UPDATED LOGIC FOR WEEKLY/MONTHLY ---

      const dateInterval = timeframe === "weekly" ? "7 DAY" : "1 MONTH";

      // 1. The SUM clause now correctly references the `quests` table (aliased as `q`).
      let sumClause;
      if (sortStat === "experience") {
        sumClause = `SUM(q.experience_reward)`;
      } else {
        sumClause = `SUM(CAST(JSON_EXTRACT(q.stat_reward, '$.${sortStat}') AS UNSIGNED))`;
      }

      // 2. The query now includes a JOIN to the `quests` table.
      leaderboardQuery = `
        SELECT
          u.id, u.username, u.experience, u.stats, u.inventory,
          u.head, u.torso, u.legs, u.feet, u.weapon,
          COALESCE(${sumClause}, 0) AS leaderboardValue
        FROM users u
        LEFT JOIN quest_participants qp ON u.id = qp.user_id
        LEFT JOIN quests q ON qp.quest_id = q.id
        WHERE qp.completed_at >= NOW() - INTERVAL ${dateInterval}
        GROUP BY u.id
        ORDER BY leaderboardValue DESC
        LIMIT 50
      `;
    }

    const [users] = await db.query(leaderboardQuery);

    // The data mapping logic below is correct and needs no further changes.
    const usersWithDetails = users.map((user, index) => {
      const stats = user.stats ? JSON.parse(user.stats) : {};
      stats.experience = user.experience;
      const inventoryItems = user.inventory ? JSON.parse(user.inventory) : [];

      const equipment = {
        head:
          inventoryItems.find(
            (item) => String(item.id) === String(user.head),
          ) || null,
        torso:
          inventoryItems.find(
            (item) => String(item.id) === String(user.torso),
          ) || null,
        legs:
          inventoryItems.find(
            (item) => String(item.id) === String(user.legs),
          ) || null,
        feet:
          inventoryItems.find(
            (item) => String(item.id) === String(user.feet),
          ) || null,
        weapon:
          inventoryItems.find(
            (item) => String(item.id) === String(user.weapon),
          ) || null,
      };

      const leaderboardValue =
        timeframe === "all_time"
          ? sortStat === "experience"
            ? user.experience
            : stats[sortStat] || 0
          : user.leaderboardValue;

      return {
        id: user.id,
        username: user.username,
        rank: index + 1,
        stats,
        equipment,
        leaderboardValue,
      };
    });

    return reply.send({ users: usersWithDetails });
  } catch (error) {
    console.error("Error fetching leaderboard:", error);
    reply.code(500).send({ message: "Internal Server Error" });
  }
});
fastify.post("/update-equipment", async (request, reply) => {
  const { userId, slot, itemId, inventory } = request.body;
  
  // Validate required fields
  if (!userId || !slot || !inventory) {
    return reply
      .code(400)
      .send({ error: "Missing required fields: userId, slot, or inventory" });
  }

  // Validate slot
  const validSlots = ["head", "torso", "legs", "feet", "weapon"];
  if (!validSlots.includes(slot)) {
    return reply.code(400).send({ error: "Invalid slot specified" });
  }

  try {
    // Fetch user data
    const [userResult] = await db.query(
      `SELECT stats, ?? AS equippedItem FROM users WHERE id = ?`,
      [slot, userId],
    );

    if (userResult.length === 0) {
      return reply.code(404).send({ error: "User not found" });
    }

    // ⚙️ Handle Unequip Logic
    if (itemId === null) {
      console.log("Unequipping item");

      // Update stats and unequip the item
      await db.query(`UPDATE users SET ?? = NULL WHERE id = ?`, [slot, userId]);

      return reply.code(200).send({
        message: "Item unequipped successfully",
        // updatedStats: userStats
      });
    }

    // Handle Equip Logic
    console.log("Equipping new item");

    const newItem = inventory.find((item) => item.id === itemId);
    if (!newItem) {
      return reply.code(404).send({ error: "Item not found in inventory" });
    }

    // Update stats and equip the new item
    await db.query(`UPDATE users SET ?? = ? WHERE id = ?`, [
      slot,
      itemId,
      userId,
    ]);

    reply.code(200).send({
      message: "Item equipped successfully",
      // updatedStats: userStats
    });
  } catch (error) {
    console.error("Error updating equipment and stats:", error.message);
    reply.code(500).send({ error: "Failed to update equipment and stats" });
  }
});

fastify.get("/items/:itemName", async (request, reply) => {
  const { itemName } = request.params; // Get the itemId from the request parameter

  try {
    // Query to fetch the item from the database
    const results = await db.query("SELECT * FROM items WHERE name = ?", [
      itemName,
    ]);

    if (results.length > 0) {
      reply.send(results[0]); // Return the item as JSON if found
    } else {
      reply.code(404).send({ error: "Item not found" }); // Item not found
    }
  } catch (error) {
    console.error("Error fetching item:", error);
    reply.code(500).send({ error: "Database error" });
  }
});

const generateRandomInt = () => {
  return Math.floor(Math.random() * 1e9); // Generates a random number between 0 and 1 billion
};

fastify.post("/level-up-item", async (request, reply) => {
  const { userId, itemId, braveryStat } = request.body;

  // Validate request parameters
  if (!userId || !itemId || braveryStat === undefined) {
    return reply.code(400).send({ error: "Invalid request parameters." });
  }

  try {
    // Fetch the item details from the `items` table for the item to be leveled up
    const [baseItemDetails] = await db.query(
      `SELECT i.id, i.name, i.stats, i.type, i.image_url, i.description 
             FROM items i 
             WHERE i.id = ?`,
      [itemId],
    );

    if (baseItemDetails.length === 0) {
      return reply.code(404).send({ error: "Base item not found." });
    }

    const baseItem = baseItemDetails[0]; // Base item details (name, stats, type, image_url, description)

    // Parse base item stats
    const parsedBaseStats = JSON.parse(baseItem.stats);

    // Fetch the user's inventory to check how many of this item they have
    const [userDetails] = await db.query(
      `SELECT inventory FROM users WHERE id = ?`,
      [userId],
    );

    if (userDetails.length === 0) {
      return reply.code(404).send({ error: "User not found." });
    }

    let { inventory } = userDetails[0];
    inventory = JSON.parse(inventory || "[]"); // Parse inventory array

    // Fetch the names of the items in the user's inventory (we need item names to compare)
    const itemNamesQuery = `SELECT id, name FROM items WHERE id IN (?)`;
    const [inventoryItems] = await db.query(itemNamesQuery, [inventory]);

    // Count how many of the same item name the user has in their inventory
    const itemCount = inventoryItems.filter(
      (item) => item.name === baseItem.name,
    ).length;

    // If the user doesn't have enough items to upgrade, return an error
    if (itemCount < 2) {
      return reply
        .code(400)
        .send({ error: "You need at least two of the same item to upgrade." });
    }

    // Calculate the upgrade stats (including bravery influence)
    const updatedStats = { ...parsedBaseStats };
    const statTypes = ["endurance", "strength", "bravery", "intelligence"];

    // Apply bravery stat to each stat type
    statTypes.forEach((stat) => {
      if (updatedStats[stat] !== undefined) {
        updatedStats[stat] = updatedStats[stat] * (1 + braveryStat / 100);
      }
    });

    // Add special ability if exists in base item and apply the increase
    if (parsedBaseStats.specialAbility !== undefined) {
      updatedStats.specialAbility =
        parsedBaseStats.specialAbility + Math.floor(Math.random() * 5);
    }

    // Generate a new ID for the leveled-up item
    const newItemId = generateRandomInt(); // You can use your existing ID generation logic

    // Create the leveled-up item with the new stats and details
    const newItem = {
      id: newItemId,
      name: `${baseItem.name} (Leveled Up)`,
      stats: JSON.stringify(updatedStats),
      type: baseItem.type, // Keep the same type as the original item
      image_url: baseItem.image_url, // Keep the same image URL as the original item
      description: baseItem.description, // Keep the same description as the original item
    };

    // Insert the new leveled-up item into the `items` table
    await db.query(`INSERT INTO items SET ?`, newItem);

    // Remove one of the base items from the user's inventory (as it has been used for upgrading)
    const updatedInventory = inventory.filter(
      (itemId) => itemId !== baseItem.id,
    );

    // Add the new leveled-up item to the user's inventory
    updatedInventory.push(newItemId);

    // Update the user's inventory in the database
    await db.query(
      `UPDATE users 
             SET inventory = ? 
             WHERE id = ?`,
      [JSON.stringify(updatedInventory), userId],
    );

    reply.send({
      success: true,
      message: `You have successfully leveled up the item and added it to your inventory.`,
      updatedInventory,
      newItem,
    });
  } catch (err) {
    console.error("Error leveling up item:", err.message, err.stack);
    reply.code(500).send({ error: "Failed to level up item." });
  }
});

fastify.get("/stages", async (request, reply) => {
  try {
    const [results] = await db.query("SELECT * FROM stages");
    reply.send(results);
  } catch (error) {
    console.error("Error fetching stages:", error);
    reply.code(500).send({ error: "Failed to fetch stages" });
  }
});

fastify.post("/add-currency", async (request, reply) => {
  const { id } = request.body;

  if (id === undefined) {
    return reply.code(400).send({ error: "Missing tower ID." });
  }

  try {
    // Get userId, floor, and numberOfRuns from tower_players
    const [playerResult] = await db.query(
      `
            SELECT userId, floor, numberOfRuns
            FROM tower_players 
            WHERE userId = ?
        `,
      [id],
    );

    if (playerResult.length === 0) {
      return reply.code(404).send({ error: "Tower not found." });
    }

    const { userId, floor, numberOfRuns } = playerResult[0];

    // Get total reward from stages
    const [rewardResult] = await db.query(
      `
            SELECT SUM(currency_reward) AS totalReward
            FROM stages
            WHERE id <= ?
        `,
      [floor],
    );

    const baseReward = rewardResult[0].totalReward || 0;

    if (baseReward === 0) {
      return reply
        .code(200)
        .send({ message: "No currency added as reward is 0." });
    }

    // Apply scaling formula
    const multiplier = 3 / (1 + 0.2 * numberOfRuns);
    const scaledReward = Math.round(baseReward * multiplier);

    // Update user currency
    const updateUserQuery = `
            UPDATE users 
            SET currency = currency + ?
            WHERE id = ?
        `;
    const [updateResult] = await db.query(updateUserQuery, [
      scaledReward,
      userId,
    ]);

    if (updateResult.affectedRows > 0) {
      // Reset the tower state and increment numberOfRuns
      const updateTowerQuery = `
                UPDATE tower_players
                SET active = 0, floor = 0, numberOfRuns = numberOfRuns + 1
                WHERE userId = ?;
            `;
      await db.query(updateTowerQuery, [id]);

      return reply.code(200).send({ reward: scaledReward });
    } else {
      return reply.code(404).send({ error: "User not found." });
    }
  } catch (error) {
    console.error("Error updating currency_reward:", error);
    return reply.code(500).send({ error: "Internal server error." });
  }
});

const rarities = [
  { rarity: "peasantly", weight: 100 },
  { rarity: "artisan", weight: 20 },
  { rarity: "knightly", weight: 5 },
  { rarity: "noble", weight: 1 },
  { rarity: "kingly", weight: 0.2 },
  { rarity: "emperor", weight: 0.01 },
];

function getRandomRarity() {
  const totalWeight = rarities.reduce((sum, r) => sum + r.weight, 0);
  const randomNum = Math.random() * totalWeight;

  let cumulativeWeight = 0;
  for (const rarity of rarities) {
    cumulativeWeight += rarity.weight;
    if (randomNum <= cumulativeWeight) {
      return rarity.rarity;
    }
  }
}

async function claimRewards(io, socket, { userId, gateId, bossName }) {
  // 1. Get participants list
  const [rows] = await db.query(`SELECT participants FROM gates WHERE id = ?`, [
    gateId,
  ]);

  if (rows.length === 0) {
    socket.emit("error", { error: "Gate not found" });
    return null;
  }

  let participants = JSON.parse(rows[0].participants || "[]");
  let player = participants.find((p) => p.id === userId);

  if (!player) {
    socket.emit("error", { error: "Player not found in gate" });
    return null;
  }

  // 2. Check if already claimed
  if (player.claimedRewards) {
    socket.emit("rewardsFetched", {
      userId,
      gateId,
      lootDrop: [],
      message: "Rewards already claimed",
    });
    return null;
  }

  // 3. Generate loot
  const lootDrop = await handleBossDefeat(gateId, userId, bossName);

  // 4. Mark all participants as inactive
  participants = participants.map((p) => ({
    ...p,
    status: "inactive",
    claimedRewards: p.id === userId ? true : p.claimedRewards, // only claimer gets marked as claimed
  }));

  // 5. Save back to DB
  await db.query(`UPDATE gates SET participants = ? WHERE id = ?`, [
    JSON.stringify(participants),
    gateId,
  ]);

  // 6. Send loot
  socket.emit("rewardsFetched", {
    userId,
    gateId,
    lootDrop,
    message: "Rewards successfully claimed",
  });

  return lootDrop;
}

const lootTablesByDuration = {
  7: {
    peasantly: 70,
    artisan: 20,
    knightly: 5,
    noble: 3,
    kingly: 1,
    emperor: 1,
  },
  14: {
    peasantly: 55,
    artisan: 25,
    knightly: 8,
    noble: 6,
    kingly: 4,
    emperor: 2,
  },
  21: {
    peasantly: 45,
    artisan: 28,
    knightly: 10,
    noble: 9,
    kingly: 6,
    emperor: 2,
  },
  30: {
    peasantly: 35,
    artisan: 30,
    knightly: 12,
    noble: 12,
    kingly: 8,
    emperor: 3,
  },
  60: {
    peasantly: 20,
    artisan: 25,
    knightly: 15,
    noble: 20,
    kingly: 12,
    emperor: 8,
  },
};

const getRandomItemFromLootTable = (table) => {
  const entries = Object.entries(table);
  const totalWeight = entries.reduce((sum, [, weight]) => sum + weight, 0);
  const rand = Math.random() * totalWeight;

  let runningWeight = 0;
  for (const [rarity, weight] of entries) {
    runningWeight += weight;
    if (rand <= runningWeight) return rarity;
  }
  return null;
};

fastify.get("/completed-quests-stats", async (request, reply) => {
  const { userId, daysRange } = request.query;
  console.log(userId, daysRange);

  if (!userId || !daysRange) {
    return reply
      .code(400)
      .send({ error: "User ID and daysRange are required" });
  }

  try {
    const days = parseInt(daysRange);
    if (isNaN(days) || days <= 0) {
      return reply.code(400).send({ error: "Invalid daysRange value" });
    }

    const currentDate = new Date();
    const startDate = new Date();
    startDate.setDate(currentDate.getDate() - (days - 1));

    const currentDateStr = currentDate.toISOString().split("T")[0];
    const startDateStr = startDate.toISOString().split("T")[0];

    const [questParticipants] = await db.query(
      `SELECT qp.quest_id, qp.completed_at
             FROM quest_participants qp
             WHERE qp.user_id = ? AND qp.completed = 1
             AND DATE(qp.completed_at) BETWEEN ? AND ?`,
      [userId, startDateStr, currentDateStr],
    );

    if (questParticipants.length === 0) {
      const result = Array.from({ length: days }, (_, i) => {
        const day = new Date(startDate);
        day.setDate(startDate.getDate() + i);
        const dateStr = day.toISOString().split("T")[0];
        return {
          date: dateStr,
          stats: {
            strength: 0,
            bravery: 0,
            intelligence: 0,
            endurance: 0,
          },
          tags: [],
        };
      });
      return reply.send(result);
    }

    const questIds = questParticipants.map((qp) => qp.quest_id);
    const [quests] = questIds.length
      ? await db.query(
          "SELECT id, stat_reward, tags FROM quests WHERE id IN (?)",
          [questIds],
        )
      : [[]];

    const questRewards = {};
    const questTags = {};

    quests.forEach((quest) => {
      questRewards[quest.id] = JSON.parse(quest.stat_reward);
      questTags[quest.id] = JSON.parse(quest.tags); // Parse tags as JSON here
    });

    const statsPerDay = {};

    questParticipants.forEach((participant) => {
      const completedDateStr = participant.completed_at.slice(0, 10);
      const statReward = questRewards[participant.quest_id];
      const tags = questTags[participant.quest_id]; // Get the parsed tags here

      if (!statReward) return;

      if (!statsPerDay[completedDateStr]) {
        statsPerDay[completedDateStr] = {
          strength: 0,
          bravery: 0,
          intelligence: 0,
          endurance: 0,
          tags: new Set(),
        };
      }

      statsPerDay[completedDateStr].strength += statReward.strength || 0;
      statsPerDay[completedDateStr].bravery += statReward.bravery || 0;
      statsPerDay[completedDateStr].intelligence +=
        statReward.intelligence || 0;
      statsPerDay[completedDateStr].endurance += statReward.endurance || 0;

      if (tags && Array.isArray(tags)) {
        tags.forEach((tag) =>
          statsPerDay[completedDateStr].tags.add(tag.trim()),
        ); // If tags is an array, add each tag
      }
    });

    const result = Array.from({ length: days }, (_, i) => {
      const day = new Date(startDate);
      day.setDate(startDate.getDate() + i);
      const dateStr = day.toISOString().split("T")[0];

      const statsEntry = statsPerDay[dateStr] || {
        strength: 0,
        bravery: 0,
        intelligence: 0,
        endurance: 0,
        tags: new Set(),
      };

      return {
        date: dateStr,
        stats: {
          strength: statsEntry.strength,
          bravery: statsEntry.bravery,
          intelligence: statsEntry.intelligence,
          endurance: statsEntry.endurance,
        },
        tags: Array.from(statsEntry.tags), // Convert the Set to an array before returning
      };
    });

    reply.send(result);
  } catch (error) {
    console.error("Error fetching completed quest stats:", error);
    reply.code(500).send({ error: "Failed to fetch stats" });
  }
});

fastify.get("/total-completed-quests-stats", async (request, reply) => {
  try {
    const currentDate = new Date();
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(currentDate.getDate() - 7);

    const formatDate = (date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    };

    const currentDateStr = formatDate(currentDate);
    const oneWeekAgoStr = formatDate(oneWeekAgo);

    const [questParticipants] = await db.query(
      `SELECT qp.quest_id
             FROM quest_participants qp
             WHERE qp.completed = 1
             AND DATE(qp.completed_at) BETWEEN ? AND ?`,
      [oneWeekAgoStr, currentDateStr],
    );

    if (questParticipants.length === 0) {
      return reply.send({
        stats: { strength: 0, bravery: 0, intelligence: 0, endurance: 0 },
      });
    }

    const questIds = questParticipants.map((qp) => qp.quest_id);
    const [quests] = await db.query(
      "SELECT id, stat_reward FROM quests WHERE id IN (?)",
      [questIds],
    );

    const statsArray = {
      strength: [],
      bravery: [],
      intelligence: [],
      endurance: [],
    };

    quests.forEach((quest) => {
      const statReward = JSON.parse(quest.stat_reward);
      if (statReward.strength) statsArray.strength.push(statReward.strength);
      if (statReward.bravery) statsArray.bravery.push(statReward.bravery);
      if (statReward.intelligence)
        statsArray.intelligence.push(statReward.intelligence);
      if (statReward.endurance) statsArray.endurance.push(statReward.endurance);
    });

    const calculateMedian = (arr) => {
      const nonZeroArr = arr.filter((value) => value !== 0);
      nonZeroArr.sort((a, b) => a - b);
      const len = nonZeroArr.length;

      if (len === 0) return 0;
      if (len % 2 === 1) {
        return nonZeroArr[Math.floor(len / 2)];
      } else {
        const mid = len / 2;
        return (nonZeroArr[mid - 1] + nonZeroArr[mid]) / 2;
      }
    };

    const totalStats = {
      strength: calculateMedian(statsArray.strength),
      bravery: calculateMedian(statsArray.bravery),
      intelligence: calculateMedian(statsArray.intelligence),
      endurance: calculateMedian(statsArray.endurance),
    };

    console.log(totalStats);
    reply.send({ stats: totalStats });
  } catch (error) {
    console.error("Error fetching total completed quest stats:", error);
    reply.code(500).send({ error: "Failed to fetch stats" });
  }
});

fastify.post("/scrap", async (request, reply) => {
  const { userId, itemId } = request.body;

  try {
    // Step 1: Get user inventory and currency
    const [users] = await db.query(
      `SELECT inventory, currency FROM users WHERE id = ?`,
      [userId],
    );
    if (users.length === 0)
      return reply.code(404).send({ error: "User not found" });

    let inventory = JSON.parse(users[0].inventory);
    let currentGold = users[0].currency || 0;

    // Step 2: Find item by id
    const itemToScrap = inventory.find((item) => item.id === itemId);
    if (!itemToScrap)
      return reply.code(400).send({ error: "Item not found in inventory" });

    // Step 3: Get item data from items table
    const [items] = await db.query(`SELECT * FROM items WHERE name = ?`, [
      itemToScrap.name,
    ]);
    if (items.length === 0)
      return reply.code(400).send({ error: "Item not found in items table" });

    const itemData = items[0];

    // Step 4: Define rarity → gold exchange rates
    const rarityValues = {
      peasantly: 10,
      artisan: 25,
      knightly: 100,
      noble: 250,
      kingly: 1000,
      kingly: 1000,
      emperor: 2000,
    };

    const rewardGold = rarityValues[itemData.rarity.toLowerCase()] || 5; // fallback if rarity unknown

    // Step 5: Remove the scrapped item from inventory
    inventory = inventory.filter((item) => item.id !== itemId);

    // Step 6: Update user’s gold + inventory
    const newGold = currentGold + rewardGold;

    await db.query(
      `UPDATE users SET inventory = ?, currency = ? WHERE id = ?`,
      [JSON.stringify(inventory), newGold, userId],
    );

    return reply.send({
      success: true,
      message: `${itemData.name} scrapped for ${rewardGold} gold.`,
      goldEarned: rewardGold,
      totalGold: newGold,
    });
  } catch (error) {
    console.error("Error scrapping item:", error);
    return reply.code(500).send({ error: "Internal server error" });
  }
});

fastify.post("/consume", async (request, reply) => {
  const { userId, itemId, quantity } = request.body;

  try {
    // Fetch user's inventory
    const [userRows] = await db.query(
      `SELECT inventory FROM users WHERE id = ?`,
      [userId],
    );

    if (userRows.length === 0) {
      return reply.code(404).send({ error: "User not found" });
    }

    let inventory = JSON.parse(userRows[0].inventory || "[]"); // Ensure it's an array

    // Find the consumable item in inventory
    let consumableItem = inventory.find(
      (item) => item.name === itemId && item.type === "consumable",
    );

    if (!consumableItem) {
      return reply
        .code(400)
        .send({ error: "Item not found or not consumable" });
    }

    if (consumableItem.quantity < quantity) {
      return reply
        .code(400)
        .send({ error: `Not enough ${consumableItem.name} to consume` });
    }

    // Extract item stats before consuming
    const itemStats = consumableItem.stats || {}; // Ensure it's an object

    // Subtract the quantity
    consumableItem.quantity -= quantity;

    // Remove item if quantity reaches zero
    if (consumableItem.quantity <= 0) {
      inventory = inventory.filter((item) => item.name !== itemId);
    }

    // Update the user's inventory in the database
    await db.query(`UPDATE users SET inventory = ? WHERE id = ?`, [
      JSON.stringify(inventory),
      userId,
    ]);

    reply.send({
      message: `Successfully consumed ${quantity} ${consumableItem.name}`,
      stats: itemStats,
    });
  } catch (err) {
    console.error(err);
    reply.code(500).send({ error: "Failed to consume item" });
  }
});

fastify.get("/craftable-scrapboxes", async (request, reply) => {
  try {
    const [result] = await db.query("SELECT * FROM scrapboxes");

    // Parse the loot_table field instead of recipe
    const formattedBoxes = result.map((item) => ({
      ...item,
      loot_table: JSON.parse(item.loot_table), // Parse loot table JSON
    }));

    reply.send(formattedBoxes);
  } catch (error) {
    console.error(error);
    reply.code(500).send({ error: "Failed to fetch craftable scrapboxes" });
  }
});

fastify.post("/craft-scrapbox", async (request, reply) => {
  const { userId, scrapboxId, quantity } = request.body;

  console.log("User Id: " + userId);

  console.log("Scrapbox Id:" + scrapboxId);

  console.log("Quantity: " + quantity);

  try {
    // 1. Fetch scrapbox details
    const [scrapboxRows] = await db.query(
      `SELECT * FROM scrapboxes WHERE id = ?`,
      [scrapboxId],
    );

    if (scrapboxRows.length === 0) {
      return reply.code(404).send({ error: "Scrapbox not found" });
    }

    const scrapbox = scrapboxRows[0];
    const totalCost = scrapbox.scrap_cost * quantity;
    const requiredScrapName = `${scrapbox.rarity} scrap`;

    // 2. Fetch user inventory
    const [userRows] = await db.query(
      `SELECT inventory FROM users WHERE id = ?`,
      [userId],
    );
    if (userRows.length === 0) {
      return reply.code(404).send({ error: "User not found" });
    }

    let inventory = JSON.parse(userRows[0].inventory || "[]");

    console.log(inventory);

    // 3. Check if user has enough matching-rarity scrap
    const scrapItem = inventory.find(
      (item) =>
        item.name.toLowerCase() === requiredScrapName.toLowerCase() &&
        item.type === "material",
    );

    console.log(!scrapItem);

    if (!scrapItem || scrapItem.quantity < totalCost) {
      return reply.code(400).send({
        error: `Not enough ${requiredScrapName} to craft ${scrapbox.name}`,
      });
    }

    // 4. Deduct the scrap
    scrapItem.quantity -= totalCost;

    // 5. Add the scrapbox to inventory
    const existingBox = inventory.find(
      (item) => item.name === scrapbox.name && item.type === "scrapbox",
    );

    if (existingBox) {
      existingBox.quantity += quantity;
    } else {
      inventory.push({
        name: scrapbox.name,
        type: "scrapbox",
        quantity,
        stats: {
          loot_table: JSON.parse(scrapbox.loot_table),
          rarity: scrapbox.rarity,
        },
      });
    }

    // 6. Save inventory
    await db.query(`UPDATE users SET inventory = ? WHERE id = ?`, [
      JSON.stringify(inventory),
      userId,
    ]);

    reply.send({
      message: `Successfully crafted ${quantity} ${scrapbox.name}`,
    });
  } catch (err) {
    console.error(err);
    reply.code(500).send({ error: "Failed to craft scrapbox" });
  }
});

fastify.post("/open-scrapbox", async (request, reply) => {
  const { userId, scrapboxId } = request.body;

  try {
    // 1. Get user inventory
    const [users] = await db.query(`SELECT inventory FROM users WHERE id = ?`, [
      Number(userId),
    ]);
    if (users.length === 0)
      return reply.code(404).send({ error: "User not found" });

    let inventory = JSON.parse(users[0].inventory);

    // 2. Find scrapbox by ID in inventory
    const scrapboxItem = inventory.find((item) => item.id === scrapboxId);
    console.log(scrapboxItem.name);
    if (!scrapboxItem)
      return reply.code(400).send({ error: "Scrapbox not found in inventory" });

    // 3. Get scrapbox item data (loot table)
    const [items] = await db.query(`SELECT * FROM scrapboxes WHERE name = ?`, [
      scrapboxItem.name,
    ]);
    console.log(items);
    if (items.length === 0)
      return reply
        .code(400)
        .send({ error: "Scrapbox not found in items table" });

    const scrapboxData = items[0];
    const lootTable = JSON.parse(scrapboxData.loot_table); // { "artisan": 50, "knight": 1 }

    // 4. Roll for random item based on weight
    const getRandomItemFromLootTable = (table) => {
      const entries = Object.entries(table);
      const totalWeight = entries.reduce((sum, [, weight]) => sum + weight, 0);
      const rand = Math.random() * totalWeight;

      let runningWeight = 0;
      for (const [itemName, weight] of entries) {
        runningWeight += weight;
        if (rand <= runningWeight) return itemName;
      }
      return null;
    };

    const rewardedItemRarity = getRandomItemFromLootTable(lootTable);
    if (!rewardedItemRarity)
      return reply.code(500).send({ error: "Loot roll failed" });

    // 5. Get full data of rewarded item
    const [[rewardItem]] = await db.query(
      `SELECT * FROM items WHERE rarity = ? ORDER BY RAND() LIMIT 1`,
      [rewardedItemRarity],
    );

    if (rewardItem.length === 0)
      return reply
        .code(400)
        .send({ error: "Reward item not found in items table" });

    const rewardData = rewardItem;

    // 6. Add rewarded item to inventory
    const existingReward = inventory.find(
      (item) => item.name === rewardData.name && item.type === rewardData.type,
    );

    if (existingReward) {
      existingReward.quantity = (existingReward.quantity || 1) + 1;
    } else {
      const newReward = {
        id: uuidv4(),
        rarity: rewardData.rarity,
        name: rewardData.name,
        type: rewardData.type,
        description: rewardData.description,
        image_url: rewardData.image_url,
        levelRequired: rewardData.levelRequired || 1,
        quantity: 1,
      };
      inventory.push(newReward);
    }

    // 7. Remove one scrapbox
    scrapboxItem.quantity -= 1;
    if (scrapboxItem.quantity <= 0) {
      inventory = inventory.filter((item) => item.id !== scrapboxId);
    }

    // 8. Save updated inventory
    await db.query(`UPDATE users SET inventory = ? WHERE id = ?`, [
      JSON.stringify(inventory),
      userId,
    ]);

    return reply.send({
      success: true,
      rewardedItem: rewardData.name,
      rewardData,
      remainingScrapboxes:
        scrapboxItem.quantity > 0 ? scrapboxItem.quantity : 0,
    });
  } catch (error) {
    console.error("Error opening scrapbox:", error);
    return reply.code(500).send({ error: "Internal server error" });
  }
});

const start = async () => {
  try {
    await fastify.listen({ port: 3001, host: "0.0.0.0" });
    console.log("✅ Backend running on HTTP at port 3001");
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
