import axios from "axios";
import bcrypt from "bcrypt";
import db from "../db.js";

const getDayStringFromDate = (date) => {
  return date.toLocaleDateString("en-US", { weekday: "long", timeZone: "UTC" });
};

const explosiveRoll = (rolls, sum = 0) => {
  if (rolls <= 0) return sum; // Stop when rolls are finished

  const diceRoll = Math.floor(Math.random() * 6) + 1; // Random number between 1 and 6
  sum += diceRoll;

  if (diceRoll === 6) {
    // If 6 is rolled, roll again but without decreasing the roll count
    return explosiveRoll(rolls, sum);
  }

  // Continue rolling, decreasing the roll count
  return explosiveRoll(rolls - 1, sum);
};

export default async function questsRoutes(fastify, options) {
  fastify.get("/:userId", async (request, reply) => {
    const { userId } = request.params;

    if (!userId) {
      return reply.code(400).send({ error: "User ID is required" });
    }

    try {
      const [quests] = await db.query(
        "SELECT * FROM quests WHERE created_by = ?",
        [userId],
      );
      return reply.send(quests);
    } catch (error) {
      console.error("Error fetching user-created quests:", error);
      return reply.code(500).send({ message: "Internal Server Error" });
    }
  });

  fastify.get("/", async (request, reply) => {
    const { userId } = request.query;

    if (!userId) {
      return reply.code(400).send({ error: "User ID is required" });
    }

    try {
      const [quests] = await db.query("SELECT * FROM quests");
      return reply.send(quests);
    } catch (error) {
      console.error("Error fetching quests:", error);
      return reply.code(500).send({ message: "Internal Server Error" });
    }
  });

  fastify.post("/select", async (request, reply) => {
    const { questId, userId } = request.body;
    const formattedDate = new Date();

    if (!questId || !userId) {
      return reply
        .code(400)
        .send({ error: "Quest ID and User ID are required" });
    }

    try {
      // Check if user exists and get their guild
      const [userExists] = await db.query(
        "SELECT id, guild FROM users WHERE id = ?",
        [userId],
      );

      if (userExists.length === 0) {
        return reply.code(400).send({ error: "User does not exist" });
      }

      const guildName = userExists[0].guild;
      let extraSlots = 0;
      let questTimerBuff = 0;

      if (guildName) {
        const [guild] = await db.query(
          "SELECT guild_upgrades FROM guilds WHERE name = ?",
          [guildName],
        );

        if (guild.length === 0) {
          return reply.code(404).send({ error: "Guild not found" });
        }

        const guildUpgrades = JSON.parse(guild[0].guild_upgrades || "[]");
        const extraSlotsUpgrade = guildUpgrades.find(
          (u) => u.type === "extraSlots",
        );
        const questTimerBuffUpgrade = guildUpgrades.find(
          (u) => u.type === "questTimerBuff",
        );

        extraSlots = extraSlotsUpgrade ? extraSlotsUpgrade.level * 2 : 0;
        questTimerBuff = questTimerBuffUpgrade
          ? questTimerBuffUpgrade.level * 5
          : 0;
      }

      // Count active quests
      const [activeQuests] = await db.query(
        "SELECT id FROM quest_participants WHERE user_id = ? AND completed = 0",
        [userId],
      );

      const maxSlots = 4 + extraSlots;
      if (activeQuests.length >= maxSlots) {
        return reply
          .code(400)
          .send({ error: `You already have ${maxSlots} active quests.` });
      }

      // Prevent duplicate quest start
      const [existing] = await db.query(
        "SELECT * FROM quest_participants WHERE quest_id = ? AND user_id = ?",
        [questId, userId],
      );

      const datetime = formattedDate
        .toISOString()
        .slice(0, 19)
        .replace("T", " ");

      if (existing.length > 0) {
        if (existing[0].progress === "Started") {
          return reply
            .code(200)
            .send({ message: "Quest already started by this user" });
        }

        const [quest] = await db.query(
          "SELECT difficulty, type FROM quests WHERE id = ?",
          [questId],
        );
        const difficulty = quest[0]?.difficulty || 1;
        const expirationMinutes = difficulty * 30 - questTimerBuff;
        const expiredAt = new Date(
          formattedDate.getTime() + expirationMinutes * 60 * 1000,
        );

        await db.query(
          `UPDATE quest_participants 
                 SET progress = ?, joined_at = ?, joined_at_datetime = ?, expired_at = ?, completed = ? 
                 WHERE id = ?`,
          [
            "Started",
            datetime,
            formattedDate,
            expiredAt,
            false,
            existing[0].id,
          ],
        );

        return reply
          .code(200)
          .send({ message: "Quest progress updated to Started" });
      }

      // Start a new quest (now includes `type` for checking if it's a "journey")
      const [quest] = await db.query(
        "SELECT difficulty, type FROM quests WHERE id = ?",
        [questId],
      );

      const difficulty = quest[0]?.difficulty || 1;
      const questType = quest[0]?.type || "";
      const isJourney = questType === "journey";

      let expiredAt;
      if (isJourney) {
        expiredAt = new Date(formattedDate.getTime() + 24 * 60 * 60 * 1000); // +24 hours
      } else {
        const expirationMinutes = difficulty * 30 - questTimerBuff;
        expiredAt = new Date(
          formattedDate.getTime() + expirationMinutes * 60 * 1000,
        );
      }

      console.log("Joined at:", formattedDate);
      console.log("Expires at:", expiredAt);

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

      return reply.code(201).send({
        message: `Quest started${isJourney ? ", expires in 24 hours" : ""}.`,
      });
    } catch (err) {
      console.error("Error selecting quest:", err);
      return reply
        .code(500)
        .send({ error: "An error occurred while selecting the quest." });
    }
  });

  fastify.post("/remove", async (request, reply) => {
    const { questId, userId } = request.body;

    if (!questId || !userId) {
      return reply
        .code(400)
        .send({ error: "Quest ID and User ID are required" });
    }

    try {
      const [existingParticipant] = await db.query(
        "SELECT * FROM quest_participants WHERE quest_id = ? AND user_id = ?",
        [questId, userId],
      );

      if (existingParticipant.length === 0) {
        return reply
          .code(400)
          .send({ error: "You have not selected this quest" });
      }

      await db.query(
        "DELETE FROM quest_participants WHERE quest_id = ? AND user_id = ?",
        [questId, userId],
      );

      reply.code(200).send({ message: "Quest removed successfully" });
    } catch (error) {
      console.error("Error removing quest:", error);
      reply
        .code(500)
        .send({ error: "An error occurred while removing the quest" });
    }
  });

  // Fetch quests the user is participating in
  fastify.get("/active", async (request, reply) => {
    const { userId } = request.query;

    if (!userId) {
      return reply.code(400).send({ error: "User ID is required" });
    }

    try {
      const [activeQuests] = await db.query(
        `SELECT qp.quest_id, qp.progress, qp.completed, qp.joined_at, qp.expired_at, qp.period_completed, q.* 
            FROM quest_participants qp
            INNER JOIN quests q ON qp.quest_id = q.id
            WHERE qp.user_id = ? AND qp.completed = 0`,
        [userId],
      );

      return reply.code(200).send(activeQuests);
    } catch (error) {
      console.error("Error fetching active quests:", error);
      return reply
        .code(500)
        .send({ error: "An error occurred while fetching active quests" });
    }
  });

  // Fetch completed quests the user has participated in
  fastify.get("/completed", async (request, reply) => {
    const { userId, date } = request.query;

    // Validate if the user ID is provided
    if (!userId || !date) {
      return reply.code(400).send({ error: "User ID is required" });
    }

    try {
      // Query to fetch completed quests for the given user where completed = true and completed_at is today
      const [completedQuests] = await db.query(
        `SELECT qp.quest_id, qp.progress, qp.completed, qp.joined_at, q.name, q.description, qp.completed_at 
        FROM quest_participants qp
        INNER JOIN quests q ON qp.quest_id = q.id
        WHERE qp.user_id = ? AND qp.completed_at = ?`,
        [userId, date],
      );

      // Return the completed quests
      return reply.send(completedQuests);
    } catch (error) {
      console.error("Error fetching completed quests:", error);
      return reply
        .code(500)
        .send({ error: "An error occurred while fetching completed quests" });
    }
  });

  fastify.get("/todo-completed", async (request, reply) => {
    const { userId, date } = request.query;

    if (!userId || !date) {
      return reply.code(400).send({ error: "User ID and date are required" });
    }

    try {
      // This query now joins the scheduled_quests table (sq) and extracts the type
      // from the JSON schedule_details column.
      const [completedQuests] = await db.query(
        `SELECT 
         qp.quest_id, qp.progress, qp.completed, qp.joined_at, 
         q.name, q.description, qp.completed_at,
         JSON_UNQUOTE(JSON_EXTRACT(sq.schedule_details, '$.type')) as type
       FROM 
         quest_participants qp
       INNER JOIN 
         quests q ON qp.quest_id = q.id
       INNER JOIN 
         scheduled_quests sq ON qp.quest_id = sq.quest_id
       WHERE 
         qp.user_id = ? AND (
           (JSON_UNQUOTE(JSON_EXTRACT(sq.schedule_details, '$.type')) != 'specific' AND qp.completed_at = ?) OR
           (JSON_UNQUOTE(JSON_EXTRACT(sq.schedule_details, '$.type')) = 'specific' AND qp.completed = true)
         )`,
        [userId, date],
      );

      return reply.send(completedQuests);
    } catch (error) {
      console.error("Error fetching completed quests:", error);
      return reply
        .code(500)
        .send({ error: "An error occurred while fetching completed quests" });
    }
  });

  // Fetch a user's quest completion history for the last 30 days
  fastify.get("/completion-history", async (request, reply) => {
    const { userId } = request.query;

    if (!userId) {
      return reply.code(400).send({ error: "User ID is required" });
    }

    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 365);
      const startDate = thirtyDaysAgo.toISOString().split("T")[0];

      const [completedQuests] = await db.query(
        `SELECT
         qp.completed_at,
         q.stat_reward
       FROM quest_participants qp
       INNER JOIN quests q ON qp.quest_id = q.id
       WHERE qp.user_id = ? AND qp.completed_at >= ? AND qp.completed = 1`,
        [userId, startDate],
      );

      const dailyTally = {};

      for (const quest of completedQuests) {
        const dateKey = quest.completed_at;
        if (!dailyTally[dateKey]) {
          dailyTally[dateKey] = { quest_count: 0, stats: {} };
        }
        dailyTally[dateKey].quest_count += 1;
        for (const [stat, value] of Object.entries(
          JSON.parse(quest.stat_reward) || {},
        )) {
          dailyTally[dateKey].stats[stat] =
            (dailyTally[dateKey].stats[stat] || 0) + value;
        }
      }

      const finalHistoryMap = {};
      for (const [date, data] of Object.entries(dailyTally)) {
        let dominantStat = "default";
        let maxVal = 0;

        for (const [stat, value] of Object.entries(data.stats)) {
          // --- THIS IS THE FIX ---
          // It ensures the key 'stat' is not a number before considering it.
          if (isNaN(stat) && value > maxVal) {
            maxVal = value;
            dominantStat = stat; // This will now correctly be "strength", "bravery", etc.
          }
        }

        finalHistoryMap[date] = {
          quest_count: data.quest_count,
          dominant_stat: dominantStat,
        };
      }

      return reply.send(finalHistoryMap);
    } catch (error) {
      console.error("Error fetching completion history:", error);
      return reply
        .code(500)
        .send({ error: "An error occurred while fetching completion history" });
    }
  });

  fastify.post("/finish", async (request, reply) => {
    const { questId, userId, date, currentDay } = request.body;

    const now = new Date(date).toISOString().slice(0, 19).replace("T", " ");
    // const currentDate = new Date(date).toISOString().slice(0, 10); // 'YYYY-MM-DD'
    const completionDate = new Date(date);
    const completionDateString = completionDate.toISOString().slice(0, 10); // 'YYYY-MM-DD'

    try {
      const [userExists] = await db.query(
        "SELECT id, guild FROM users WHERE id = ?",
        [userId],
      );
      if (userExists.length === 0) {
        return reply.code(400).send({ error: "User does not exist" });
      }

      const [alreadyClaimedToday] = await db.query(
        `SELECT id FROM quest_participants WHERE quest_id = ? AND user_id = ? AND completed_at = ?`,
        [questId, userId, completionDateString],
      );

      if (alreadyClaimedToday.length > 0) {
        return reply
          .code(400)
          .send({ error: "Quest has already been completed today" });
      }

      // --- Fetch Quest and its Schedule ---
      const [questScheduleData] = await db.query(
        `SELECT q.*, sq.schedule_details, sq.streak, sq.last_completed_date
       FROM scheduled_quests sq
       JOIN quests q ON sq.quest_id = q.id
       WHERE sq.user_id = ? AND sq.quest_id = ?`,
        [userId, questId],
      );

      if (questScheduleData.length === 0) {
        return reply
          .code(404)
          .send({ error: "Quest is not scheduled for this user." });
      }

      const scheduledQuest = questScheduleData[0];
      const schedule = JSON.parse(scheduledQuest.schedule_details || "{}");

      // --- NEW: Validate if the quest is actually scheduled for today ---
      let isScheduledToday = false;
      const todayDayString = getDayStringFromDate(completionDate); // e.g., 'Monday'

      switch (schedule.type) {
        case "daily":
          isScheduledToday = true;
          break;
        case "weekly":
          // Convert short day names ('Mon', 'Tue') to full names
          const weeklyDays = schedule.days.map(
            (dayShort) =>
              ({
                Mon: "Monday",
                Tue: "Tuesday",
                Wed: "Wednesday",
                Thu: "Thursday",
                Fri: "Friday",
                Sat: "Saturday",
                Sun: "Sunday",
              })[dayShort],
          );
          if (weeklyDays.includes(todayDayString)) {
            isScheduledToday = true;
          }
          break;
        case "specific":
          if (schedule.startDate === completionDateString) {
            isScheduledToday = true;
          }
          break;
      }

      // if (!isScheduledToday) {
      //   return reply
      //     .code(400)
      //     .send({ error: `Quest not scheduled for ${todayDayString}.` });
      // }

      const guildName = userExists[0].guild;

      let xpBoost = 0;
      if (guildName) {
        const [guild] = await db.query(
          `SELECT guild_upgrades FROM guilds WHERE name = ?`,
          [guildName],
        );
        if (guild.length > 0) {
          const guildUpgrades = JSON.parse(guild[0].guild_upgrades);
          const xpBoostUpgrade = guildUpgrades.find(
            (u) => u.type === "xpBoost",
          );
          xpBoost = xpBoostUpgrade ? xpBoostUpgrade.level * 8 : 0;
        }
      }

      const [quest] = await db.query(
        `SELECT name, experience_reward, item_reward, stat_reward, tags, type, period, difficulty FROM quests WHERE id = ?`,
        [questId],
      );

      if (quest.length === 0) {
        return reply.code(404).send({ error: "Quest not found." });
      }

      // // Update streak if not claimed today
      // const [streakData] = await db.query(
      //   `SELECT days FROM scheduled_quests WHERE user_id = ? AND quest_id = ?`,
      //   [userId, questId]
      // );

      let newStreak = 1; // Default to 1 for a new streak
      const lastDate = scheduledQuest.last_completed_date
        ? new Date(scheduledQuest.last_completed_date)
        : null;

      if (lastDate) {
        const diffTime = completionDate.getTime() - lastDate.getTime();
        const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

        let expectedDiff = 1; // For daily quests
        if (schedule.type === "weekly") {
          expectedDiff = 7; // For weekly quests
        }

        // If the completion is within the expected window (e.g., exactly 1 day for daily, 7 for weekly), continue streak
        if (diffDays === expectedDiff) {
          newStreak = (scheduledQuest.streak || 0) + 1;
        }
      }

      // let days = [];
      // try {
      //   days = JSON.parse(streakData[0]?.days || "[]");
      // } catch (err) {
      //   console.error("Failed to parse days:", err);
      //   days = [];
      // }

      // const dayIndex = days.findIndex((d) => d.day === currentDay);
      // let updatedDay;

      // if (dayIndex > -1) {
      //   const existing = days[dayIndex];
      //   const today = new Date(date);
      //   const lastDate = new Date(existing.last_completed_date);

      //   const diffTime = today.getTime() - lastDate.getTime();
      //   const diffDays = diffTime / (1000 * 60 * 60 * 24);

      //   if (existing.last_completed_date === date) {
      //     // Already completed today, keep streak
      //     updatedDay = existing;
      //   } else if (diffDays <= 8 && diffDays >= 6) {
      //     // Continued streak if last completion was 6-8 days ago
      //     updatedDay = {
      //       ...existing,
      //       streak: existing.streak + 1,
      //       last_completed_date: date,
      //     };
      //   } else {
      //     // Streak reset
      //     updatedDay = {
      //       ...existing,
      //       streak: 1,
      //       last_completed_date: date,
      //     };
      //   }

      //   days[dayIndex] = updatedDay;
      // } else {
      //   // First time completing this day
      //   updatedDay = {
      //     day: currentDay,
      //     streak: 1,
      //     last_completed_date: date,
      //   };
      //   days.push(updatedDay);
      // }

      await db.query(
        `UPDATE scheduled_quests SET streak = ?, last_completed_date = ? WHERE user_id = ? AND quest_id = ?`,
        [newStreak, completionDateString, userId, questId],
      );

      const {
        name: questName,
        experience_reward: experienceReward,
        item_reward: itemReward,
        stat_reward: statReward,
        tags: questTags,
        type: questType,
        period,
        difficulty,
      } = quest[0];
      const formattedTags = JSON.parse(questTags);

      // const [claimable] = await db.query(
      //     `SELECT * FROM quest_participants WHERE quest_id = ? AND user_id = ?`,
      //     [questId, userId, now]
      // );

      const existingQuest = quest[0];

      const [questParticipationRows] = await db.query(
        `SELECT * FROM quest_participants WHERE quest_id = ? AND user_id = ?`,
        [questId, userId],
      );

      const activatedQuest = questParticipationRows[0];

      if (questType === "journey") {
        if (!activatedQuest) {
          // Insert the journey quest if it doesn't exist
          const newExpiredAt = new Date(
            completionDate.getTime() + 24 * 60 * 60 * 1000,
          ); // +24h
          await db.query(
            `INSERT INTO quest_participants 
                     (quest_id, user_id, period_completed, joined_at, joined_at_datetime, completed_at, expired_at, progress, completed) 
                     VALUES (?, ?, 1, ?, ?, ?, ?, ?, 0)`,
            [
              questId,
              userId,
              now,
              completionDate,
              date,
              newExpiredAt,
              "Started",
            ],
          );
          console.log("Inserted new journey quest for user.");
        } else {
          const currentPeriod = activatedQuest.period_completed || 0;
          const newPeriodCompleted = currentPeriod + 1;
          if (currentPeriod + 1 >= period) {
            await db.query(
              `DELETE FROM quest_participants 
                         WHERE id = ?`,
              [activatedQuest.id],
            );

            await db.query(
              `DELETE FROM scheduled_quests 
                         WHERE quest_id = ? AND user_id = ?`, // adjust column name if needed
              [activatedQuest.quest_id, userId],
            );
          } else {
            // Increment and continue journey
            const newExpiredAt = new Date(
              completionDate.getTime() + 24 * 60 * 60 * 1000,
            ); // +24h

            await db.query(
              `UPDATE quest_participants 
                         SET period_completed = ?, completed_at = ?, joined_at = ?, joined_at_datetime = ?, expired_at = ?, progress = ? 
                         WHERE id = ?`,
              [
                newPeriodCompleted,
                date,
                now,
                completionDate,
                newExpiredAt,
                "Started",
                activatedQuest.id,
              ],
            );
          }
        }
      } else {
        await db.query(
          `INSERT INTO quest_participants (quest_id, user_id, completed, completed_at)
                 VALUES (?, ?, 1, ?)
                 ON DUPLICATE KEY UPDATE
                   completed = 1,
                   completed_at = VALUES(completed_at)`,
          [questId, userId, date],
        );
      }

      let boostedExperienceReward = experienceReward + xpBoost;
      let currencyReward = experienceReward + explosiveRoll(2);
      // Add XP
      if (boostedExperienceReward || currencyReward) {
        const updates = [];
        const params = [];

        if (boostedExperienceReward) {
          updates.push("experience = experience + ?");
          params.push(boostedExperienceReward);
        }

        if (currencyReward) {
          updates.push("currency = currency + ?");
          params.push(currencyReward);
        }

        params.push(userId); // for WHERE clause

        await db.query(
          `UPDATE users SET ${updates.join(", ")} WHERE id = ?`,
          params,
        );
      }

      let statRewardThisPeriod = {};

      // Update stats and tags
      if (statReward) {
        const parsedStatReward = JSON.parse(statReward);
        const [user] = await db.query(
          `SELECT stats, questTags FROM users WHERE id = ?`,
          [userId],
        );

        let userStats = JSON.parse(user[0].stats || "{}");
        let playerTags = JSON.parse(user[0].questTags || "[]");

        for (let tag of formattedTags) {
          if (!playerTags.includes(tag)) {
            playerTags.push(tag);
          }
        }

        if (playerTags.length > 10) {
          playerTags = playerTags.slice(playerTags.length - 10);
        }

        // If journey, divide and round up stat reward
        const currentPeriod = existingQuest.period_completed || 0;

        // console.log("current period:" + currentPeriod);
        // console.log("total period:" + period);
        if (questType === "journey") {
          if (currentPeriod + 1 >= period) {
            statRewardThisPeriod = parsedStatReward;
          } else {
            for (let stat in parsedStatReward) {
              statRewardThisPeriod[stat] = Math.ceil(
                parsedStatReward[stat] / period,
              );
              console.log(statRewardThisPeriod[stat]);
            }
          }
        } else {
          statRewardThisPeriod = parsedStatReward;
        }

        for (let stat in statRewardThisPeriod) {
          userStats[stat] = (userStats[stat] || 0) + statRewardThisPeriod[stat];
        }

        await db.query(
          `UPDATE users
                 SET stats = ?, questTags = ?
                 WHERE id = ?`,
          [JSON.stringify(userStats), JSON.stringify(playerTags), userId],
        );
      }

      // (Optional) Item reward logic can be added here

      reply.send({
        success: true,
        message: "Quest marked as finished and rewards applied.",
        statsIncreased: statRewardThisPeriod || {},
        streak: newStreak,
        experienceReward: experienceReward,
        currencyReward: currencyReward,
        difficulty: difficulty,
      });
    } catch (err) {
      console.error("Error finishing quest:", err);
      reply.code(500).send({ error: "Failed to mark quest as finished." });
    }
  });

  fastify.post("/undo", async (request, reply) => {
    const { questId, userId, date, currentDay } = request.body;

    try {
      // 1️⃣ Validate user exists
      const [userExists] = await db.query(
        "SELECT id, experience, stats, questTags, currency FROM users WHERE id = ?",
        [userId],
      );
      if (userExists.length === 0) {
        return reply.code(400).send({ error: "User does not exist" });
      }

      // 2️⃣ Get quest info
      const [quest] = await db.query(
        `SELECT experience_reward, stat_reward, tags, type, period 
       FROM quests WHERE id = ?`,
        [questId],
      );
      if (quest.length === 0) {
        return reply.code(404).send({ error: "Quest not found" });
      }

      const {
        experience_reward: xpReward,
        stat_reward: statReward,
        experience_reward: currencyReward = 0, // <-- new
        tags: questTags,
        type: questType,
        period,
      } = quest[0];

      const parsedTags = JSON.parse(questTags || "[]");
      const parsedStatReward = JSON.parse(statReward || "{}");

      // 3️⃣ Reverse XP
      await db.query(
        `UPDATE users SET experience = GREATEST(0, experience - ?) WHERE id = ?`,
        [xpReward, userId],
      );

      // 4️⃣ Reverse stats
      let userStats = JSON.parse(userExists[0].stats || "{}");
      for (let stat in parsedStatReward) {
        userStats[stat] = Math.max(
          0,
          (userStats[stat] || 0) - parsedStatReward[stat],
        );
      }

      // 4️⃣b Reverse currency
      const currentCurrency = userExists[0].currency || 0;
      const newCurrency = Math.max(0, currentCurrency - currencyReward);

      // Optionally remove quest tags
      let playerTags = JSON.parse(userExists[0].questTags || "[]");
      playerTags = playerTags.filter((tag) => !parsedTags.includes(tag));

      await db.query(
        `UPDATE users SET stats = ?, questTags = ?, currency = ? WHERE id = ?`,
        [
          JSON.stringify(userStats),
          JSON.stringify(playerTags),
          newCurrency,
          userId,
        ],
      );

      // 5️⃣ Reverse quest_participants
      if (questType === "journey") {
        await db.query(
          `UPDATE quest_participants 
         SET completed = 0, progress = 'Started'
         WHERE quest_id = ? AND user_id = ?`,
          [questId, userId],
        );
      } else {
        await db.query(
          `DELETE FROM quest_participants WHERE quest_id = ? AND user_id = ?`,
          [questId, userId],
        );
      }

      // 6️⃣ Reverse streak
      const [streakData] = await db.query(
        `SELECT days FROM scheduled_quests WHERE user_id = ? AND quest_id = ?`,
        [userId, questId],
      );

      if (streakData.length > 0) {
        let days = JSON.parse(streakData[0].days || "[]");
        const dayIndex = days.findIndex((d) => d.day === currentDay);

        if (dayIndex > -1) {
          days[dayIndex].streak = Math.max(0, days[dayIndex].streak - 1);
          days[dayIndex].last_completed_date = null;
          await db.query(
            `UPDATE scheduled_quests SET days = ? WHERE user_id = ? AND quest_id = ?`,
            [JSON.stringify(days), userId, questId],
          );
        }
      }

      reply.send({ success: true, message: "Quest completion reversed." });
    } catch (err) {
      console.error("Error reversing quest:", err);
      reply.code(500).send({ error: "Failed to reverse quest." });
    }
  });

  fastify.delete("/:id", async (request, reply) => {
    const connection = await db.getConnection();
    try {
      // 1. Get the quest ID from the URL and the user ID from the session
      const { id: questId } = request.params;
      const userId = request.session.userId;

      // --- Authorization Check ---
      if (!userId) {
        return reply.code(401).send({ error: "Unauthorized: Invalid Session" });
      }

      // --- Use a Transaction for Safety ---
      // This ensures that either BOTH deletions succeed, or NEITHER does.
      await connection.beginTransaction();

      // --- Step 1: Delete the schedule entry first ---
      // We use `user_id` here to ensure a user can't delete another user's schedule.
      await connection.query(
        `DELETE FROM scheduled_quests WHERE quest_id = ? AND user_id = ?`,
        [questId, userId],
      );

      // --- Step 2: Delete the main quest entry ---
      // We use `created_by` here as another critical security check.
      const [questDeleteResult] = await connection.query(
        `DELETE FROM quests WHERE id = ? AND created_by = ?`,
        [questId, userId],
      );

      // If no rows were affected, the quest didn't exist or belong to this user.
      if (questDeleteResult.affectedRows === 0) {
        await connection.rollback(); // Undo any potential changes
        return reply.code(404).send({
          message:
            "Quest not found or you do not have permission to delete it.",
        });
      }

      // --- Finalize the Transaction ---
      await connection.commit();

      return reply
        .code(200)
        .send({ message: "Quest and its schedule were deleted successfully" });
    } catch (error) {
      // If any part fails, undo everything
      await connection.rollback();
      console.error("Error deleting quest:", error);
      return reply
        .code(500)
        .send({ error: "An error occurred while deleting the quest." });
    } finally {
      // Always release the database connection
      connection.release();
    }
  });
}
