// const express = require('express');
const fastify = require('fastify')({logger: "true"});
// const session = require('express-session');
const rateLimit = require('@fastify/rate-limit');
const bodyParser = require('body-parser');
const db = require('./db'); // Import the database connection
// const cors = require('cors');
const cors = require('@fastify/cors');
const bcrypt = require('bcryptjs');
const cron = require('node-cron');
const { v4: uuidv4 } = require('uuid'); // Import uuid to generate unique ids

require('dotenv').config();

fastify.register(require('@fastify/helmet'));
fastify.register(cors, {
    origin: ['https://relifehabits.com', '*'], // your frontend domain
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Origin', 'X-Requested-With'],
    credentials: true
});


fastify.register(require('@fastify/rate-limit'), {
    max: 100, // Lower this if you want aggressive protection
    timeWindow: '10 seconds',
    ban: 60000, // Ban for 60 seconds if limit exceeded
    keyGenerator: function (req) {
      return req.ip; // Limit per IP
    },
    errorResponseBuilder: function (req, context) {
      return {
        code: 429,
        error: 'Too Many Requests',
        message: `Rate limit exceeded: ${context.max} requests per ${context.after}`,
      };
    }
});

const questsRateLimit = {}; // Store request history per userId

const MAX_QUEST_CALLS = 100;
const QUEST_WINDOW = 10 * 1000; // 10 seconds

// Middleware for rate limiting
fastify.addHook('preHandler', async (request, reply) => {
    if (request.method !== 'GET') return;

    const { userId } = request.query;

    // If no userId is provided, skip rate limiting
    if (!userId) return;

    const now = Date.now();

    // Initialize rate limiting data for the user
    if (!questsRateLimit[userId]) {
        questsRateLimit[userId] = {
            count: 1,
            startTime: now,
            blockedUntil: null
        };
    }

    const userData = questsRateLimit[userId];

    // If the user is blocked, deny the request
    if (userData.blockedUntil && now < userData.blockedUntil) {
        return reply.code(429).send({ error: 'Too many requests. Please wait a bit.' });
    }

    // Reset the counter if the time window has passed
    if (now - userData.startTime > QUEST_WINDOW) {
        userData.count = 1;
        userData.startTime = now;
        userData.blockedUntil = null;
    } else {
        userData.count += 1;
    }

    // If the max number of calls is exceeded, block for the remainder of the window
    if (userData.count > MAX_QUEST_CALLS) {
        userData.blockedUntil = now + QUEST_WINDOW;
        return reply.code(429).send({ error: 'Rate limit exceeded. Please try again in 10 seconds.' });
    }
});




  

fastify.post('/auth/signup', async (request, reply) => {
    const { username, password, email, age, recaptchaToken } = request.body;

    const defaultStats = JSON.stringify({
        strength: 1,
        bravery: 1,
        intelligence: 1,
        endurance: 1,
    });

    if (!recaptchaToken || recaptchaToken.length < 40) {
        return reply.code(400).send({ message: 'reCAPTCHA token is missing' });
    }

    try {
        // Check if username already exists
        const [existing] = await db.query('SELECT * FROM users WHERE username = ?', [username]);
        if (existing.length > 0) {
            return reply.code(400).send({ message: 'Username already exists' });
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);
        const joinedAt = new Date().toISOString().slice(0, 10);

        // Insert the user
        await db.query(
            'INSERT INTO users (username, email, age, password, experience, stats, joined_at, head, torso, legs, feet) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [username, email, age, hashedPassword, 0, defaultStats, joinedAt, '', '', '', '']
        );

        // Fetch the newly inserted user
        const [result] = await db.query('SELECT * FROM users WHERE username = ?', [username]);
        const user = result[0];

        reply.code(200).send({
            message: 'Login successful',
            id: user.id,
            username: user.username,
            experience: user.experience,
            stats: JSON.parse(user.stats),
            head: user.head,
            torso: user.torso,  // Make sure the column name is correct
            legs: user.legs,
            feet: user.feet,
            weapon: user.weapon || null,
            currency: user.currency || 0,
        });
    } catch (error) {
        console.error('Error during signup:', error);
        reply.code(500).send({ message: 'Error signing up' });
    }
});


fastify.post('/auth/login', async (request, reply) => {
    const { username, password } = request.body;

    try {
        // Check if the user exists
        const [result] = await db.query('SELECT * FROM users WHERE username = ?', [username]);
        if (result.length === 0) {
            return reply.code(400).send({ message: 'User not found' });
        }

        const user = result[0];

        // Compare the hashed password
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return reply.code(400).send({ message: 'Invalid credentials' });
        }

        reply.code(200).send({
            message: 'Login successful',
            id: user.id,
            username: user.username,
            experience: user.experience,
            stats: JSON.parse(user.stats), // Assuming stats is stored as a JSON string
            head: user.head,
            torso: user.body, 
            legs: user.legs,
            feet: user.feet,
            weapon: user.weapon,
            currency: user.currency,
        });
    } catch (error) {
        console.error('Error during login:', error);
        reply.code(500).send({ message: 'Error logging in' });
    }
});

// Logout Route
fastify.post('/auth/logout', (request, reply) => {
    request.session.destroy((err) => {
        if (err) {
            return reply.code(500).send({ message: 'Error logging out' });
        }
        reply.code(200).send({ message: 'Logout successful' });
    });
});

fastify.get("/user-stats", async (request, reply) => {
    console.log("THIS IS BEING CALLED");
    try {
      // Query to count users
      const [userCountResult] = await db.query("SELECT COUNT(*) as totalUsers FROM users");
  
      // Query to count quest participants
      const [questCountResult] = await db.query("SELECT COUNT(*) as totalParticipants FROM quest_participants");
  
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
  

// const insertDailyQuests = async () => {
//     const deleteQuery = `
//         DELETE FROM daily_quests WHERE date < CURDATE();
//     `;

//     const insertQuery = `
//         INSERT INTO daily_quests (date, quest_id)
//         SELECT CURDATE(), id
//         FROM (
//             SELECT DISTINCT id
//             FROM (
//                 -- Difficulty 1-5 (Existing)
//                 SELECT id FROM (SELECT id FROM quests WHERE type = 'daily' AND difficulty = 1 AND JSON_EXTRACT(stat_reward, '$.strength') IS NOT NULL ORDER BY RAND() LIMIT 2) AS subquery1
//                 UNION ALL
//                 SELECT id FROM (SELECT id FROM quests WHERE type = 'daily' AND difficulty = 1 AND JSON_EXTRACT(stat_reward, '$.bravery') IS NOT NULL ORDER BY RAND() LIMIT 2) AS subquery2
//                 UNION ALL
//                 SELECT id FROM (SELECT id FROM quests WHERE type = 'daily' AND difficulty = 1 AND JSON_EXTRACT(stat_reward, '$.intelligence') IS NOT NULL ORDER BY RAND() LIMIT 2) AS subquery3
//                 UNION ALL
//                 SELECT id FROM (SELECT id FROM quests WHERE type = 'daily' AND difficulty = 1 AND JSON_EXTRACT(stat_reward, '$.endurance') IS NOT NULL ORDER BY RAND() LIMIT 2) AS subquery4
//                 UNION ALL
//                 SELECT id FROM (SELECT id FROM quests WHERE type = 'daily' AND difficulty = 1 ORDER BY RAND() LIMIT 2) AS subquery5
//                 UNION ALL
//                 SELECT id FROM (SELECT id FROM quests WHERE type = 'daily' AND difficulty = 2 AND JSON_EXTRACT(stat_reward, '$.strength') IS NOT NULL ORDER BY RAND() LIMIT 1) AS subquery6
//                 UNION ALL
//                 SELECT id FROM (SELECT id FROM quests WHERE type = 'daily' AND difficulty = 2 AND JSON_EXTRACT(stat_reward, '$.bravery') IS NOT NULL ORDER BY RAND() LIMIT 1) AS subquery7
//                 UNION ALL
//                 SELECT id FROM (SELECT id FROM quests WHERE type = 'daily' AND difficulty = 2 AND JSON_EXTRACT(stat_reward, '$.intelligence') IS NOT NULL ORDER BY RAND() LIMIT 1) AS subquery8
//                 UNION ALL
//                 SELECT id FROM (SELECT id FROM quests WHERE type = 'daily' AND difficulty = 2 AND JSON_EXTRACT(stat_reward, '$.endurance') IS NOT NULL ORDER BY RAND() LIMIT 1) AS subquery9
//                 UNION ALL
//                 SELECT id FROM (SELECT id FROM quests WHERE type = 'daily' AND difficulty = 2 ORDER BY RAND() LIMIT 2) AS subquery10
//                 UNION ALL
//                 SELECT id FROM (SELECT id FROM quests WHERE type = 'daily' AND difficulty IN (3,4,5) AND JSON_EXTRACT(stat_reward, '$.strength') IS NOT NULL ORDER BY RAND() LIMIT 3) AS subquery11
//                 UNION ALL
//                 SELECT id FROM (SELECT id FROM quests WHERE type = 'daily' AND difficulty IN (3,4,5) AND JSON_EXTRACT(stat_reward, '$.bravery') IS NOT NULL ORDER BY RAND() LIMIT 3) AS subquery12
//                 UNION ALL
//                 SELECT id FROM (SELECT id FROM quests WHERE type = 'daily' AND difficulty IN (3,4,5) AND JSON_EXTRACT(stat_reward, '$.intelligence') IS NOT NULL ORDER BY RAND() LIMIT 3) AS subquery13
//                 UNION ALL
//                 SELECT id FROM (SELECT id FROM quests WHERE type = 'daily' AND difficulty IN (3,4,5) AND JSON_EXTRACT(stat_reward, '$.endurance') IS NOT NULL ORDER BY RAND() LIMIT 3) AS subquery14
//                 UNION ALL
//                 SELECT id FROM (SELECT id FROM quests WHERE type = 'daily' AND difficulty IN (3,4,5) ORDER BY RAND() LIMIT 6) AS subquery15

//                 -- Difficulty 6-8
//                 UNION ALL
//                 SELECT id FROM (SELECT id FROM quests WHERE type = 'daily' AND difficulty IN (6,7,8) AND JSON_EXTRACT(stat_reward, '$.strength') IS NOT NULL ORDER BY RAND() LIMIT 3) AS subquery16
//                 UNION ALL
//                 SELECT id FROM (SELECT id FROM quests WHERE type = 'daily' AND difficulty IN (6,7,8) AND JSON_EXTRACT(stat_reward, '$.bravery') IS NOT NULL ORDER BY RAND() LIMIT 3) AS subquery17
//                 UNION ALL
//                 SELECT id FROM (SELECT id FROM quests WHERE type = 'daily' AND difficulty IN (6,7,8) AND JSON_EXTRACT(stat_reward, '$.intelligence') IS NOT NULL ORDER BY RAND() LIMIT 3) AS subquery18
//                 UNION ALL
//                 SELECT id FROM (SELECT id FROM quests WHERE type = 'daily' AND difficulty IN (6,7,8) AND JSON_EXTRACT(stat_reward, '$.endurance') IS NOT NULL ORDER BY RAND() LIMIT 3) AS subquery19
//                 UNION ALL
//                 SELECT id FROM (SELECT id FROM quests WHERE type = 'daily' AND difficulty IN (6,7,8) ORDER BY RAND() LIMIT 6) AS subquery20

//                 -- Difficulty 9-10
//                 UNION ALL
//                 SELECT id FROM (SELECT id FROM quests WHERE type = 'daily' AND difficulty IN (9,10) AND JSON_EXTRACT(stat_reward, '$.strength') IS NOT NULL ORDER BY RAND() LIMIT 4) AS subquery21
//                 UNION ALL
//                 SELECT id FROM (SELECT id FROM quests WHERE type = 'daily' AND difficulty IN (9,10) AND JSON_EXTRACT(stat_reward, '$.bravery') IS NOT NULL ORDER BY RAND() LIMIT 4) AS subquery22
//                 UNION ALL
//                 SELECT id FROM (SELECT id FROM quests WHERE type = 'daily' AND difficulty IN (9,10) AND JSON_EXTRACT(stat_reward, '$.intelligence') IS NOT NULL ORDER BY RAND() LIMIT 4) AS subquery23
//                 UNION ALL
//                 SELECT id FROM (SELECT id FROM quests WHERE type = 'daily' AND difficulty IN (9,10) AND JSON_EXTRACT(stat_reward, '$.endurance') IS NOT NULL ORDER BY RAND() LIMIT 4) AS subquery24
//                 UNION ALL
//                 SELECT id FROM (SELECT id FROM quests WHERE type = 'daily' AND difficulty IN (9,10) ORDER BY RAND() LIMIT 8) AS subquery25

//                 -- Difficulty 11-12 (Most difficult, select the most challenging quests)
//                 UNION ALL
//                 SELECT id FROM (SELECT id FROM quests WHERE type = 'daily' AND difficulty IN (11,12) AND JSON_EXTRACT(stat_reward, '$.strength') IS NOT NULL ORDER BY RAND() LIMIT 5) AS subquery26
//                 UNION ALL
//                 SELECT id FROM (SELECT id FROM quests WHERE type = 'daily' AND difficulty IN (11,12) AND JSON_EXTRACT(stat_reward, '$.bravery') IS NOT NULL ORDER BY RAND() LIMIT 5) AS subquery27
//                 UNION ALL
//                 SELECT id FROM (SELECT id FROM quests WHERE type = 'daily' AND difficulty IN (11,12) AND JSON_EXTRACT(stat_reward, '$.intelligence') IS NOT NULL ORDER BY RAND() LIMIT 5) AS subquery28
//                 UNION ALL
//                 SELECT id FROM (SELECT id FROM quests WHERE type = 'daily' AND difficulty IN (11,12) AND JSON_EXTRACT(stat_reward, '$.endurance') IS NOT NULL ORDER BY RAND() LIMIT 5) AS subquery29
//                 UNION ALL
//                 SELECT id FROM (SELECT id FROM quests WHERE type = 'daily' AND difficulty IN (11,12) ORDER BY RAND() LIMIT 10) AS subquery30
//             ) AS selected_quests
//         ) AS final_quests
//         WHERE id NOT IN (
//             SELECT quest_id FROM daily_quests WHERE date = CURDATE()
//         );
//     `;



//     try {
//         // Delete previous daily quests before the current date
//         await db.query(deleteQuery);
//         console.log('Successfully removed previous daily quests.');

//         // Insert new daily quests
//         const [results] = await db.query(insertQuery);
//         console.log('Successfully inserted daily quests:', results);
//     } catch (err) {
//         console.error('SQL Error:', err.message);
//     }
// };

const clearCompletedQuestParticipants = async () => {
    const query = `
        DELETE qp FROM quest_participants qp
        JOIN quests q ON qp.quest_id = q.id
        WHERE qp.completed = 0 AND q.type = 'daily';
    `;

    try {
        const [results] = await db.query(query);
        console.log('🧹 Successfully cleared incomplete daily quest participants:', results);
    } catch (err) {
        console.error('SQL Error (clearCompletedQuestParticipants):', err.message);
    }
};


// const checkAndUpdateVows = async () => {
//     try {
//         console.log("Checking for overdue vows...");

//         // Get all active vows from the database
//         const [vows] = await db.query('SELECT * FROM vows WHERE status = "active"');

//         // Get the current date in YYYY-MM-DD format
//         const currentDate = new Date().toISOString().split('T')[0];

//         for (const vow of vows) {
//             const vowDeadline = new Date(vow.deadline);
//             vowDeadline.setDate(vowDeadline.getDate()); // Add 1 day to match moment.js behavior

//             // Convert to YYYY-MM-DD format for comparison
//             const vowDeadlineFormatted = vowDeadline.toISOString().split('T')[0];

//             if (currentDate > vowDeadlineFormatted) {
//                 // Deadline passed, mark vow as incomplete
//                 await db.query('UPDATE vows SET status = "incomplete" WHERE id = ?', [vow.id]);

//                 console.log(`Vow ID ${vow.id} marked as incomplete.`);

//                 // Fetch user stats from the users table
//                 const [userRows] = await db.query('SELECT stats FROM users WHERE id = ?', [vow.created_by]);

//                 if (userRows.length > 0) {
//                     let userStats = JSON.parse(userRows[0].stat);
//                     let statRewards = JSON.parse(vow.stat_reward);

//                     // Subtract the stat rewards from user stats
//                     for (const stat in statRewards) {
//                         if (userStats[stat] !== undefined) {
//                             userStats[stat] = Math.max(0, userStats[stat] - (statRewards[stat] * 2)); // Ensure no negative values
//                         }
//                     }

//                     // Update the user's stats in the database
//                     await db.query('UPDATE users SET stats = ? WHERE id = ?', [JSON.stringify(userStats), vow.created_by]);

//                     console.log(`User ID ${vow.created_by} stats updated.`);
//                 }
//             }
//         }

//         console.log("Vow check complete.");
//     } catch (error) {
//         console.error("Error processing vows:", error);
//     }
// };

const calculateLevel = (experience) => { 
    let level = 1;
    let xpForNextLevel = 100;

    while (experience >= xpForNextLevel) {
        level++;
        experience -= xpForNextLevel;
        xpForNextLevel = 100 * Math.pow(1.05, (level - 1));
    }

    return { level, remainingXP: experience, xpForNextLevel };
};

const checkSpiritHealth = async () => {
    const today = new Date().toISOString().split('T')[0];

    try {
        const [users] = await db.query('SELECT id, spiritHealth, maxSpiritHealth, experience FROM users');

        for (const user of users) {
            // Calculate the level from experience
            const { level } = calculateLevel(user.experience);
                    
            const maxSpiritHealth = 50 + level;

            
            // user.spiritHealth = 50 + level; // Add the level to existing spiritHealth
            
            // Update the user's spiritHealth in the database
            await db.query('UPDATE users SET spiritHealth = ? WHERE id = ?', [user.spiritHealth, user.id]);

            const [quests] = await db.query(
                'SELECT * FROM quest_participants WHERE user_id = ? AND completed_at = ?',
                [user.id, today]
            );

            let newSpirit = user.spiritHealth;
            console.log(quests);

            if (quests.length > 0) {
                if(user.maxSpiritHealth < maxSpiritHealth){
                    await db.query('UPDATE users SET spiritHealth = ?, maxSpiritHealth = ? WHERE id = ?', [maxSpiritHealth, maxSpiritHealth, user.id]);
                }else if(user.spiritHealth < maxSpiritHealth){
                    if(user.spiritHealth + 3 >= maxSpiritHealth){
                        await db.query('UPDATE users SET spiritHealth = maxSpiritHealth, maxSpiritHealth = ? WHERE id = ?', [maxSpiritHealth, user.id]);
                    }else{
                        newSpirit += 3;
                        await db.query('UPDATE users SET spiritHealth = ?, maxSpiritHealth = ? WHERE id = ?', [newSpirit, maxSpiritHealth, user.id]);
                    }
                }
            } else {
                console.log(user.id + "NO QUEST");
                // No quests completed
                newSpirit = Math.max(user.spiritHealth - 5, 0);
                await db.query('UPDATE users SET spiritHealth = ?, maxSpiritHealth = ? WHERE id = ?', [newSpirit, maxSpiritHealth, user.id]);
            }

            // If spiritHealth is 0, reset everything
            if (newSpirit === 0) {
                const emptyStats = JSON.stringify({
                    strength: 1,
                    bravery: 1,
                    intelligence: 1,
                    endurance: 1
                });

                await db.query(`
                    UPDATE users SET 
                        experience = 0,
                        stats = ?,
                        head = '',
                        torso = '',
                        legs = '',
                        feet = '',
                        weapon = '',
                        inventory = '[]',
                        currency = 0,
                        spells = '[]',
                        ownedSpells = '[]',
                        badges = '[]',
                        perks = '[]',
                        perkPoints = 0,
                        guild = NULL,
                        questTags = '[]'
                    WHERE id = ?`, [emptyStats, user.id]);

                console.log(`💀 ${user.id}'s spirit reached 0. Stats and progress reset.`);
            }
        }

        console.log('🌅 Spirit health update completed.');
    } catch (err) {
        console.error('Error running daily spirit check:', err);
    }
};

// Node.js Express
fastify.post('/change-username', async (request, reply) => {
    const { userId, newUsername } = request.body;

    try {
        // Step 1: Get current spiritHealth
        const [rows] = await db.query('SELECT spiritHealth FROM users WHERE id = ?', [userId]);

        if (!rows || rows.length === 0) {
            return reply.code(404).send('User not found');
        }

        const spiritHealth = rows[0].spiritHealth;

        // Step 2: Check if spiritHealth is 0
        if (spiritHealth !== 0) {
            return reply.code(403).send('Username can only be changed when spiritHealth is 0');
        }

        // Step 3: Proceed to change username
        await db.query('UPDATE users SET username = ?, spiritHealth = 50 WHERE id = ?', [newUsername, userId]);
        return reply.code(200).send('Username updated');
    } catch (error) {
        console.error(error);
        return reply.code(500).send('Error updating username');
    }
});

async function autoSelectQuest(questId, userId) {
    const formattedDate = new Date();
    const datetime = formattedDate.toISOString().slice(0, 19).replace('T', ' ');
  
    const [userExists] = await db.query('SELECT id, guild FROM users WHERE id = ?', [userId]);
    if (userExists.length === 0) return;
  
    const guildName = userExists[0].guild;
    let extraSlots = 0;
    let questTimerBuff = 0;
  
    if (guildName) {
        const [guild] = await db.query('SELECT guild_upgrades FROM guilds WHERE name = ?', [guildName]);
        if (guild.length > 0) {
            const guildUpgrades = JSON.parse(guild[0].guild_upgrades || '[]');
            extraSlots = (guildUpgrades.find(u => u.type === 'extraSlots')?.level || 0) * 2;
            questTimerBuff = (guildUpgrades.find(u => u.type === 'questTimerBuff')?.level || 0) * 5;
        }
    }
  
    const [activeQuests] = await db.query(
        'SELECT id FROM quest_participants WHERE user_id = ? AND completed = 0',
        [userId]
    );
  
    if (activeQuests.length >= 4 + extraSlots) return;
  
    const [existing] = await db.query(
        'SELECT * FROM quest_participants WHERE quest_id = ? AND user_id = ?',
        [questId, userId]
    );
  
    const [quest] = await db.query(
        'SELECT difficulty, type FROM quests WHERE id = ?',
        [questId]
    );
  
    if (!quest || quest.length === 0) return;
  
    const difficulty = quest[0].difficulty || 1;
    const type = quest[0].type || '';
    const isJourney = type === 'journey';
  
    const expiredAt = isJourney
        ? new Date(formattedDate.getTime() + 24 * 60 * 60 * 1000)
        : new Date(formattedDate.getTime() + ((difficulty * 30 - questTimerBuff) * 60 * 1000));
  
    if (existing.length > 0) {
        if (existing[0].progress !== 'Started') {
            await db.query(
            `UPDATE quest_participants SET progress = ?, joined_at = ?, joined_at_datetime = ?, expired_at = ?, completed = ?
            WHERE id = ?`,
            ['Started', datetime, formattedDate, expiredAt, false, existing[0].id]
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
            'Started',
            false,
            datetime,
            expiredAt,
            null,
            formattedDate,
            isJourney ? 0 : null
        ]
    );
}

cron.schedule('0 0 * * *', async () => { 
    await clearCompletedQuestParticipants();

    const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const currentDay = daysOfWeek[new Date().getUTCDay()]; // returns e.g., "Monday"
  
    try {
      // ✅ Reset numberOfRuns in tower_players
      await db.query('UPDATE tower_players SET numberOfRuns = 0');
      console.log('🔁 Reset numberOfRuns to 0 for all tower players');

      const [scheduled] = await db.query('SELECT * FROM scheduled_quests');
  
      for (const row of scheduled) {
        const daysArray = JSON.parse(row.days || '[]');
  
        if (daysArray.includes(currentDay)) {
          await autoSelectQuest(row.quest_id, row.user_id);
          console.log(`✅ Auto-started quest ${row.quest_id} for user ${row.user_id} on ${currentDay}`);
        }
      }
    } catch (err) {
      console.error('❌ Error running daily cron:', err);
    }

    // await insertDailyQuests();
    // await checkAndUpdateVows();
}, {
    scheduled: true,
    timezone: "UTC"
});


cron.schedule('59 23 * * *', async () => {
    await checkSpiritHealth();
}, {
    scheduled: true,
    timezone: "UTC"
});

  




// Get quests by type

fastify.get('/quests', async (request, reply) => {
    const { userId } = request.query;

    if (!userId) {
        return reply.code(400).send({ error: 'User ID is required' });
    }

    try {
        const [quests] = await db.query('SELECT * FROM quests');
        return reply.send(quests);
    } catch (error) {
        console.error('Error fetching quests:', error);
        return reply.code(500).send({ message: 'Internal Server Error' });
    }
});

fastify.get('/quest/:id', async (request, reply) => {
    try {
        const { id } = request.query;
        const [ quests ] = await db.query('SELECT * FROM quests WHERE id = ?', [id]);
        reply.send(quests);
    } catch (error) {
        console.error('Error fetching quests:', error);
        reply.code(500).send({ message: 'Internal Server Error' });
    }
});

fastify.post('/quests/select', async (request, reply) => {
    const { questId, userId } = request.body;
    const formattedDate = new Date();

    if (!questId || !userId) {
        return reply.code(400).send({ error: 'Quest ID and User ID are required' });
    }

    try {
        // Check if user exists and get their guild
        const [userExists] = await db.query(
            'SELECT id, guild FROM users WHERE id = ?',
            [userId]
        );

        if (userExists.length === 0) {
            return reply.code(400).send({ error: 'User does not exist' });
        }

        const guildName = userExists[0].guild;
        let extraSlots = 0;
        let questTimerBuff = 0;

        if (guildName) {
            const [guild] = await db.query(
                'SELECT guild_upgrades FROM guilds WHERE name = ?',
                [guildName]
            );

            if (guild.length === 0) {
                return reply.code(404).send({ error: 'Guild not found' });
            }

            const guildUpgrades = JSON.parse(guild[0].guild_upgrades || '[]');
            const extraSlotsUpgrade = guildUpgrades.find(u => u.type === 'extraSlots');
            const questTimerBuffUpgrade = guildUpgrades.find(u => u.type === 'questTimerBuff');

            extraSlots = extraSlotsUpgrade ? extraSlotsUpgrade.level * 2 : 0;
            questTimerBuff = questTimerBuffUpgrade ? questTimerBuffUpgrade.level * 5 : 0;
        }

        // Count active quests
        const [activeQuests] = await db.query(
            'SELECT id FROM quest_participants WHERE user_id = ? AND completed = 0',
            [userId]
        );

        const maxSlots = 4 + extraSlots;
        if (activeQuests.length >= maxSlots) {
            return reply.code(400).send({ error: `You already have ${maxSlots} active quests.` });
        }

        // Prevent duplicate quest start
        const [existing] = await db.query(
            'SELECT * FROM quest_participants WHERE quest_id = ? AND user_id = ?',
            [questId, userId]
        );

        const datetime = formattedDate.toISOString().slice(0, 19).replace('T', ' ');

        if (existing.length > 0) {
            if (existing[0].progress === 'Started') {
                return reply.code(200).send({ message: 'Quest already started by this user' });
            }

            const [quest] = await db.query(
                'SELECT difficulty, type FROM quests WHERE id = ?',
                [questId]
            );
            const difficulty = quest[0]?.difficulty || 1;
            const expirationMinutes = (difficulty * 30) - questTimerBuff;
            const expiredAt = new Date(formattedDate.getTime() + expirationMinutes * 60 * 1000);

            await db.query(
                `UPDATE quest_participants 
                 SET progress = ?, joined_at = ?, joined_at_datetime = ?, expired_at = ?, completed = ? 
                 WHERE id = ?`,
                ['Started', datetime, formattedDate, expiredAt, false, existing[0].id]
            );

            return reply.code(200).send({ message: 'Quest progress updated to Started' });
        }

        // Start a new quest (now includes `type` for checking if it's a "journey")
        const [quest] = await db.query(
            'SELECT difficulty, type FROM quests WHERE id = ?',
            [questId]
        );

        const difficulty = quest[0]?.difficulty || 1;
        const questType = quest[0]?.type || '';
        const isJourney = questType === 'journey';

        let expiredAt;
        if (isJourney) {
            expiredAt = new Date(formattedDate.getTime() + 24 * 60 * 60 * 1000); // +24 hours
        } else {
            const expirationMinutes = (difficulty * 30) - questTimerBuff;
            expiredAt = new Date(formattedDate.getTime() + expirationMinutes * 60 * 1000);
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
                'Started',
                false,
                datetime,
                expiredAt,
                null,
                formattedDate,
                isJourney ? 0 : null
            ]
        );

        return reply.code(201).send({ message: `Quest started${isJourney ? ', expires in 24 hours' : ''}.` });

    } catch (err) {
        console.error('Error selecting quest:', err);
        return reply.code(500).send({ error: 'An error occurred while selecting the quest.' });
    }
});

fastify.post('/quests/remove', async (request, reply) => {
    const { questId, userId } = request.body;

    if (!questId || !userId) {
        return reply.code(400).send({ error: 'Quest ID and User ID are required' });
    }


    try {
        const [existingParticipant] = await db.query(
            'SELECT * FROM quest_participants WHERE quest_id = ? AND user_id = ?',
            [questId, userId]
        );

        if (existingParticipant.length === 0) {
            return reply.code(400).send({ error: 'You have not selected this quest' });
        }

        await db.query(
            'DELETE FROM quest_participants WHERE quest_id = ? AND user_id = ?',
            [questId, userId]
        );

        reply.code(200).send({ message: 'Quest removed successfully' });

    } catch (error) {
        console.error('Error removing quest:', error);
        reply.code(500).send({ error: 'An error occurred while removing the quest' });
    }
});

// Fetch quests the user is participating in
fastify.get('/quests/active', async (request, reply) => {
    const { userId } = request.query;
  
    if (!userId) {
      return reply.code(400).send({ error: 'User ID is required' });
    }
  
    try {
        const [activeQuests] = await db.query(
            `SELECT qp.quest_id, qp.progress, qp.completed, qp.joined_at, qp.expired_at, qp.period_completed, q.* 
            FROM quest_participants qp
            INNER JOIN quests q ON qp.quest_id = q.id
            WHERE qp.user_id = ? AND qp.completed = 0`,
            [userId]
        );
  
        return reply.code(200).send(activeQuests);
    } catch (error) {
      console.error('Error fetching active quests:', error);
      return reply.code(500).send({ error: 'An error occurred while fetching active quests' });
    }
});

// Fetch completed quests the user has participated in
fastify.get('/quests/completed', async (request, reply) => {
    const { userId } = request.query;
  
    // Validate if the user ID is provided
    if (!userId) {
      return reply.code(400).send({ error: 'User ID is required' });
    }
  
    try {
      // Get the current date in 'YYYY-MM-DD' format
      const currentDate = new Date().toISOString().slice(0, 10);
      console.log('Current Date:', currentDate);
  
      // Query to fetch completed quests for the given user where completed = true and completed_at is today
      const [completedQuests] = await db.query(
        `SELECT qp.quest_id, qp.progress, qp.completed, qp.joined_at, q.name, q.description, qp.completed_at 
         FROM quest_participants qp
         INNER JOIN quests q ON qp.quest_id = q.id
         WHERE qp.user_id = ? AND qp.completed = 1 AND qp.completed_at = ?`,
        [userId, currentDate]
      );
  
      // Return the completed quests
      return reply.send(completedQuests);
    } catch (error) {
      console.error('Error fetching completed quests:', error);
      return reply.code(500).send({ error: 'An error occurred while fetching completed quests' });
    }
});

fastify.post('/quests/finish', async (request, reply) => {
    const { questId, userId } = request.body;

    const now = new Date().toISOString().slice(0, 19).replace("T", " ");
    const currentDate = new Date().toISOString().slice(0, 10); // 'YYYY-MM-DD'
    const formattedDate = new Date();

    try {
        const [userExists] = await db.query('SELECT id, guild FROM users WHERE id = ?', [userId]);
        if (userExists.length === 0) {
            return reply.code(400).send({ error: 'User does not exist' });
        }

        const guildName = userExists[0].guild;

        let xpBoost = 0;
        if (guildName) {
            const [guild] = await db.query(`SELECT guild_upgrades FROM guilds WHERE name = ?`, [guildName]);
            if (guild.length > 0) {
                const guildUpgrades = JSON.parse(guild[0].guild_upgrades);
                const xpBoostUpgrade = guildUpgrades.find(u => u.type === 'xpBoost');
                xpBoost = xpBoostUpgrade ? xpBoostUpgrade.level * 8 : 0;
            }
        }

        const [quest] = await db.query(
            `SELECT name, experience_reward, item_reward, stat_reward, tags, type, period FROM quests WHERE id = ?`,
            [questId]
        );
        if (quest.length === 0) {
            return reply.code(404).send({ error: 'Quest not found.' });
        }

        const { name: questName, experience_reward: experienceReward, item_reward: itemReward, stat_reward: statReward, tags: questTags, type: questType, period } = quest[0];
        const formattedTags = JSON.parse(questTags);

        const [claimable] = await db.query(
            `SELECT * FROM quest_participants WHERE quest_id = ? AND user_id = ? AND expired_at < ?`,
            [questId, userId, now]
        );

        if (claimable.length === 0) {
            return reply.code(400).send({ error: 'Quest is not ready to be claimed' });
        }

        const existingQuest = claimable[0];

        if (questType === 'journey') {
            const currentPeriod = existingQuest.period_completed || 0;

            if (currentPeriod + 1 >= period) {
                // Final step, mark as completed
                await db.query(
                    `UPDATE quest_participants 
                     SET completed = 1, completed_at = ?, progress = ? 
                     WHERE id = ?`,
                    [currentDate, 'Completed', existingQuest.id]
                );
            } else {
                // Increment and continue journey
                const newPeriod = currentPeriod + 1;
                const newExpiredAt = new Date(formattedDate.getTime() + 24 * 60 * 60 * 1000); // +24h

                await db.query(
                    `UPDATE quest_participants 
                     SET period_completed = ?, joined_at = ?, joined_at_datetime = ?, expired_at = ?, progress = ? 
                     WHERE id = ?`,
                    [newPeriod, now, formattedDate, newExpiredAt, 'Started', existingQuest.id]
                );
            }
        } else {
            // Mark as completed for normal quests
            await db.query(
                `UPDATE quest_participants
                 SET completed = 1, completed_at = ?
                 WHERE quest_id = ? AND user_id = ?`,
                [currentDate, questId, userId]
            );

        }

        let boostedExperienceReward = experienceReward + xpBoost;

        // Add XP
        if (boostedExperienceReward) {
            await db.query(
                `UPDATE users
                 SET experience = experience + ?
                 WHERE id = ?`,
                [boostedExperienceReward, userId]
            );
        }

        let statRewardThisPeriod = {};

        // Update stats and tags
        if (statReward) {
            const parsedStatReward = JSON.parse(statReward);
            const [user] = await db.query(`SELECT stats, questTags FROM users WHERE id = ?`, [userId]);
        
            let userStats = JSON.parse(user[0].stats || '{}');
            let playerTags = JSON.parse(user[0].questTags || '[]');
        
            for (let tag of formattedTags) {
                if (!playerTags.includes(tag)) {
                    playerTags.push(tag);
                }
            }
        
            if (playerTags.length > 10) {
                playerTags = playerTags.slice(playerTags.length - 10);
            }
        
            // If journey, divide and round up stat reward
            const currentPeriod = existingQuest.period_completed;
            console.log("Current period: " + currentPeriod);
            console.log("Total period: " + period);
            // console.log("current period:" + currentPeriod);
            // console.log("total period:" + period);
            if (questType === 'journey') {
                if(currentPeriod + 1 >= period){
                    statRewardThisPeriod = parsedStatReward;
                }else{
                    for (let stat in parsedStatReward) {
                        statRewardThisPeriod[stat] = Math.ceil(parsedStatReward[stat] / period);
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
                [JSON.stringify(userStats), JSON.stringify(playerTags), userId]
            );
        }

        // --- Check if this quest contributes to a path step ---
        const [activePaths] = await db.query(
            `SELECT pp.*, p.*
             FROM path_participants pp
             JOIN paths p ON pp.path_id = p.id
             WHERE pp.user_id = ?`,
            [userId]
        );
          
        
        if (activePaths.length > 0) {
            const completedQuestName = questName;
            const completedQuestTags = formattedTags;
            const updatedStats = statRewardThisPeriod;
        
            for (let path of activePaths) {
                const steps = JSON.parse(path.steps);
                const progress = path.progress || 0;
                const currentStep = steps[progress];
                if (!currentStep) continue;
            
                const { requirement } = currentStep;
            
                let contributes = false;
            
                // Check if quest name matches required
                if (
                    requirement.questNames &&
                    requirement.questNames.includes(completedQuestName)
                ) {
                    contributes = true;
                    console.log("THIS IS TRUE - name");
                }
            
                // Check if any tag from this quest matches required
                if (
                    requirement.questTags &&
                    completedQuestTags.some(tag => requirement.questTags.includes(tag))
                ) {
                    contributes = true;
                    console.log("THIS IS TRUE - tags");
                }
            
                // Check if any updated stat matches required stat condition
                if (
                    requirement.questStats &&
                    Object.keys(updatedStats).some(stat => requirement.questStats.includes(stat))
                ) {
                    contributes = true;
                    console.log("THIS IS TRUE - stats");
                }
            
                if (contributes) {
                    // Get joined_at for this path
                    const [[{ joined_at }]] = await db.query(
                      `SELECT joined_at FROM path_participants WHERE user_id = ? AND path_id = ?`,
                      [userId, path.id] // path.pathId should be the actual path reference in user_paths
                    );
                  
                    const [participantQuests] = await db.query(
                      `SELECT qp.quest_id, qp.joined_at_datetime, q.name, q.tags, q.stat_reward
                       FROM quest_participants qp
                       JOIN quests q ON qp.quest_id = q.id
                       WHERE qp.user_id = ? AND qp.joined_at_datetime > ?`,
                      [userId, joined_at]
                    );
                  
                    const completedQuestNames = participantQuests.map(q => q.name);
                    const completedTags = [
                      ...new Set(participantQuests.flatMap(q => JSON.parse(q.tags || '[]')))
                    ];
                  
                    // Aggregate stats from all completed quests
                    const completedStats = {};
                    for (const quest of participantQuests) {
                      const statRewards = JSON.parse(quest.stat_reward || '{}');
                      for (let stat in statRewards) {
                        completedStats[stat] = (completedStats[stat] || 0) + statRewards[stat];
                      }
                    }
                  
                    const hasRequiredTags =
                      !requirement.questTags ||
                      requirement.questTags.every(tag => completedTags.includes(tag));
                  
                    const hasRequiredQuests =
                      !requirement.questNames ||
                      requirement.questNames.every(name => completedQuestNames.includes(name));
                  
                    const hasRequiredStats =
                      !requirement.questStats ||
                      requirement.questStats.every(stat => completedStats[stat] && completedStats[stat] > 0);
                  
                    const totalMatchingQuests = participantQuests.filter(q => {
                      const questTags = JSON.parse(q.tags || '[]');
                      return (
                        (!requirement.questNames || requirement.questNames.includes(q.name)) ||
                        (!requirement.questTags || questTags.some(tag => requirement.questTags.includes(tag)))
                      );
                    }).length;
                  
                    const meetsNumRequirement =
                      !requirement.numOfQuests || totalMatchingQuests >= requirement.numOfQuests;
                  
                    if (
                      hasRequiredTags &&
                      hasRequiredQuests &&
                      hasRequiredStats &&
                      meetsNumRequirement
                    ) {
                      const isFinalStep = progress + 1 >= steps.length;
                      await db.query(
                        `UPDATE path_participants 
                         SET progress = ?, completed_at = ?
                         WHERE path_id = ? AND user_id = ?`,
                        [progress + 1, isFinalStep ? new Date() : null, path.id, userId]
                      );
                    }
                }
                  
            }
        }
  
        

        // (Optional) Item reward logic can be added here

        reply.send({ 
            success: true, 
            message: 'Quest marked as finished and rewards applied.', 
            statsIncreased: statRewardThisPeriod || {}
        });

    } catch (err) {
        console.error('Error finishing quest:', err);
        reply.code(500).send({ error: 'Failed to mark quest as finished.' });
    }
});

fastify.post('/schedule-quest', async (request, reply) => {
    console.log("Incoming body:", request.body);
  
    const { quest_id, user_id, days } = request.body;
  
    if (!quest_id || !user_id || !Array.isArray(days)) {
        return reply.code(400).send({ error: 'Missing quest_id, user_id, or days' });
    }
  
    try {
        const [existing] = await db.query(
            `SELECT * FROM scheduled_quests WHERE quest_id = ? AND user_id = ?`,
            [quest_id, user_id]
        );
    
        // 🌟 Step 1: Fetch all scheduled quests for this user
        const [allScheduled] = await db.query(
            `SELECT days FROM scheduled_quests WHERE user_id = ?`,
            [user_id]
        );
    
        // 🌟 Step 2: Build a count of how many quests are scheduled per day
        const dayCounts = {};
        for (const row of allScheduled) {
            const userDays = JSON.parse(row.days || '[]');
            for (const day of userDays) {
            dayCounts[day] = (dayCounts[day] || 0) + 1;
            }
        }
    
        // 🌟 Step 3: If this quest already exists, subtract its current days from the count
        if (existing.length > 0) {
            const currentDays = JSON.parse(existing[0].days || '[]');
            for (const day of currentDays) {
            dayCounts[day] = (dayCounts[day] || 0) - 1;
            }
        }
    
        // 🌟 Step 4: Check if adding new days would exceed the limit
        const exceeded = days.some(day => (dayCounts[day] || 0) + 1 > 3);
        if (exceeded) {
            return reply.code(400).send({
            success: false,
            error: 'You can only schedule up to 3 quests per day.'
            });
        }
    
        // 🌟 Step 5: Proceed with normal logic
        if (existing.length > 0) {
            if (days.length === 0) {
            await db.query(
                `DELETE FROM scheduled_quests WHERE quest_id = ? AND user_id = ?`,
                [quest_id, user_id]
            );
            return reply.send({ success: true, message: 'Quest unscheduled (deleted)' });
            } else {
            const daysString = JSON.stringify(days);
            await db.query(
                `UPDATE scheduled_quests SET days = ? WHERE quest_id = ? AND user_id = ?`,
                [daysString, quest_id, user_id]
            );
            return reply.send({ success: true, message: 'Quest days updated successfully' });
            }
        } else {
            if (days.length === 0) {
            return reply.send({ success: true, message: 'No action taken (empty days)' });
            } else {
            const daysString = JSON.stringify(days);
            await db.query(
                `INSERT INTO scheduled_quests (quest_id, user_id, days) VALUES (?, ?, ?)`,
                [quest_id, user_id, daysString]
            );
            return reply.send({ success: true, message: 'Quest scheduled successfully' });
            }
        }
  
    } catch (err) {
      console.error(err);
      reply.code(500).send({ error: 'Internal Server Error' });
    }
});

fastify.get('/scheduled-quests/:userId', async (request, reply) => {
    try {
        const { userId } = request.params;  // Access `userId` from route parameters
        const query = `
            SELECT q.*, sq.days
            FROM quests q
            LEFT JOIN scheduled_quests sq ON q.id = sq.quest_id
            WHERE sq.user_id = ?
        `;
        
        const [result] = await db.query(query, [userId]);
    
        if (result.length === 0) {
            return reply.code(404).send({ message: 'No scheduled quests found for this user' });
        }
    
        // Parse the `days` column if it exists (it's stored as a stringified array)
        result.forEach(quest => {
            if (quest.days) {
            quest.days = JSON.parse(quest.days);  // Convert the JSON string back to an array
            }
        });
    
        reply.send(result);
    } catch (error) {
        console.error('Error fetching scheduled quests:', error);
        reply.code(500).send({ message: 'Internal Server Error' });
    }
});

fastify.post('/scheduled-quests/remove', async (request, reply) => {
    const { questId, userId, dayToRemove } = request.body;

    if (!questId || !userId || !dayToRemove) {
        return reply.code(400).send({ error: 'Quest ID, User ID, and dayToRemove are required' });
    }

    try {
        const [existingScheduledQuest] = await db.query(
            'SELECT * FROM scheduled_quests WHERE quest_id = ? AND user_id = ?',
            [questId, userId]
        );

        if (existingScheduledQuest.length === 0) {
            return reply.code(400).send({ error: 'You have not selected this quest' });
        }

        const existingDays = JSON.parse(existingScheduledQuest[0].days || '[]');
        const updatedDays = existingDays.filter(day => day !== dayToRemove);

        if (updatedDays.length === 0) {
            // Optional: delete the row if no days are left
            await db.query(
                'DELETE FROM scheduled_quests WHERE quest_id = ? AND user_id = ?',
                [questId, userId]
            );
            return reply.code(200).send({ message: 'Quest removed completely because no days left' });
        } else {
            // Update the days column with the new array
            await db.query(
                'UPDATE scheduled_quests SET days = ? WHERE quest_id = ? AND user_id = ?',
                [JSON.stringify(updatedDays), questId, userId]
            );
            return reply.code(200).send({ message: 'Day removed from scheduled quest' });
        }

    } catch (error) {
        console.error('Error removing quest:', error);
        return reply.code(500).send({ error: 'An error occurred while updating the scheduled quest' });
    }
});

  
  
  

// fastify.get('/quests/daily', async (request, reply) => {
//     try {
//         // Set timezone to Pacific Time (PST/PDT)
//         await db.query("SET time_zone = '-08:00';"); // Pacific Standard Time (PST, UTC-8)

//         // Fetch today's quests
//         const query = `
//             SELECT q.id, q.name, q.description, q.difficulty, q.experience_reward, q.item_reward, q.stat_reward
//             FROM quests q
//             INNER JOIN daily_quests dq ON q.id = dq.quest_id;
//         `;

//         const [results] = await db.query(query);

//         if (!results || results.length === 0) {
//             console.log('No quests found for today.');
//             return reply.code(404).send({ message: 'No daily quests found' });
//         }

//         reply.send(results);
//     } catch (err) {
//         console.error('Error fetching daily quests:', err.message);
//         reply.code(500).send({ message: 'Internal Server Error', error: err.message });
//     }
// });

fastify.get('/account', async (request, reply) => {
    const { userId } = request.query;
  
    if (!userId) {
      return reply.code(400).send({ error: 'User ID is required' });
    }
  
    try {
      // Fetch the user's account data
      const [userResults] = await db.query(
        'SELECT * FROM users WHERE id = ?',
        [userId]
      );
  
      if (userResults.length === 0) {
        return reply.code(404).send({ error: 'User not found' });
      }
  
      const user = userResults[0];
  
      // Parse inventory from the user's data (stored as a JSON string)
      const inventoryItems = user.inventory ? JSON.parse(user.inventory) : [];
  
      // Provide default placeholders for missing slots based on the inventory directly
      const equipment = {
        head: user.head && inventoryItems.find(item => item.id === String(user.head)) || { id: '', name: 'None', type: 'head' },
        torso: user.torso && inventoryItems.find(item => item.id === String(user.torso)) || { id: '', name: 'None', type: 'torso' },
        legs: user.legs && inventoryItems.find(item => item.id === String(user.legs)) || { id: '', name: 'None', type: 'legs' },
        feet: user.feet && inventoryItems.find(item => item.id === String(user.feet)) || { id: '', name: 'None', type: 'feet' },
        weapon: user.weapon && inventoryItems.find(item => item.id === String(user.weapon)) || { id: '', name: 'None', type: 'weapon' },
      };
  
      // Send the response with user data, inventory, and equipment
      return reply.code(200).send({
        username: user.username,
        experience: user.experience,
        stats: JSON.parse(user.stats || '{}'),
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
      });
  
    } catch (error) {
      console.error('Error fetching account data:', error.message);
      return reply.code(500).send({ error: 'Failed to fetch account data' });
    }
});
  

fastify.get('/monster', async (request, reply) => {
    const { monsterName } = request.query;

    if (!monsterName) {
        return reply.code(400).send({ error: 'Monster name is required' });
    }

    try {
        // Fetch the user's account data
        const [monsterResults] = await db.query(
            'SELECT * FROM monsters WHERE name = ?',
            [monsterName]
        );

        if (monsterResults.length === 0) {
            return reply.code(404).send({ error: 'Monster not found' });
        }

        const monsterResult = monsterResults[0];

        // Log the equipment data for debugging
        // console.log("Mapped Equipment Data:", equipment);

        // Send the response with user data, inventory, and equipment
        reply.code(200).send(monsterResult);
    } catch (error) {
        console.error('Error fetching monster data:', error.message);
        reply.code(500).send({ error: 'Failed to fetch monster data' });
    }
});

fastify.get('/allMonsters', async (request, reply) => {
    try {
        // Fetch the user's account data
        const [monsterResults] = await db.query(
            'SELECT * FROM monsters'
        );

        if (monsterResults.length === 0) {
            return reply.code(404).send({ error: 'Monster not found' });
        }

        // const monsterResult = monsterResults[0];

        // Log the equipment data for debugging
        // console.log("Mapped Equipment Data:", equipment);

        // Send the response with user data, inventory, and equipment
        reply.code(200).send(monsterResults);
    } catch (error) {
        console.error('Error fetching monster data:', error.message);
        reply.code(500).send({ error: 'Failed to fetch monster data' });
    }
});


// Store rate limits in memory
const leaderboardRateLimit = {};



fastify.get('/leaderboard', async (request, reply) => {
    const { userId } = request.query;

    if (!userId) {
        return reply.code(400).send({ error: 'User ID is required' });
    }

    try {
        const page = 1;
        const limit = 5000;
        const offset = (page - 1) * limit;

        const [users] = await db.query(`
            SELECT id, username, experience 
            FROM users 
            ORDER BY experience DESC 
            LIMIT ? OFFSET ?
        `, [limit, offset]);

        const [total] = await db.query('SELECT COUNT(*) as count FROM users');

        const [userCheck] = await db.query('SELECT id FROM users WHERE id = ?', [userId]);
        if (userCheck.length === 0) {
            return reply.code(404).send({ error: 'User not found' });
        }

        return reply.send({
            users,
            currentPage: page,
            totalPages: Math.ceil(total[0].count / limit),
            totalUsers: total[0].count
        });
    } catch (error) {
        console.error('Error fetching leaderboard:', error);
        reply.code(500).send({ message: 'Internal Server Error' });
    }
});



fastify.post('/update-equipment', async (request, reply) => {
    const { userId, slot, itemId, inventory } = request.body;
    // console.log(userId, slot, itemId, inventory);

    // Validate required fields
    if (!userId || !slot || !inventory) {
        return reply.code(400).send({ error: 'Missing required fields: userId, slot, or inventory' });
    }

    // Validate slot
    const validSlots = ['head', 'torso', 'legs', 'feet', 'weapon'];
    if (!validSlots.includes(slot)) {
        return reply.code(400).send({ error: 'Invalid slot specified' });
    }

    try {
        // Fetch user data
        const [userResult] = await db.query(
            `SELECT stats, ?? AS equippedItem FROM users WHERE id = ?`,
            [slot, userId]
        );

        if (userResult.length === 0) {
            return reply.code(404).send({ error: 'User not found' });
        }

        // let userStats = JSON.parse(userResult[0].stats || '{}');
        // const equippedItemId = userResult[0].equippedItem;

        // // ⚙️ Handle Stat Adjustment for Previously Equipped Item
        // if (equippedItemId) {
        //     console.log("Removing stats from previously equipped item");

        //     const equippedItem = inventory.find(item => item.id === equippedItemId);
        //     if (equippedItem) {
        //         const equippedItemStats = JSON.parse(equippedItem.stats || '{}');
        //         Object.entries(equippedItemStats).forEach(([stat, value]) => {
        //             const normalizedStat = stat.toLowerCase().trim();
        //             if (userStats[normalizedStat] !== undefined) {
        //                 userStats[normalizedStat] -= value;
        //                 if (userStats[normalizedStat] <= 0) delete userStats[normalizedStat];
        //             }
        //         });
        //     } else {
        //         console.warn("Previously equipped item not found in inventory");
        //     }
        // }

        // ⚙️ Handle Unequip Logic
        if (itemId === null) {
            console.log("Unequipping item");

            // Update stats and unequip the item
            await db.query(
                `UPDATE users SET ?? = NULL WHERE id = ?`,
                [slot, userId]
            );

            return reply.code(200).send({ 
                message: 'Item unequipped successfully', 
                // updatedStats: userStats 
            });
        }

        // ⚙️ Handle Equip Logic
        console.log("Equipping new item");

        const newItem = inventory.find(item => item.id === itemId);
        if (!newItem) {
            return reply.code(404).send({ error: 'Item not found in inventory' });
        }

        // const newItemStats = JSON.parse(newItem.stats || '{}');
        // Object.entries(newItemStats).forEach(([stat, value]) => {
        //     const normalizedStat = stat.toLowerCase().trim();
        //     // Add or update stat, without duplicating
        //     if (userStats[normalizedStat]) {
        //         userStats[normalizedStat] += value;
        //     } else {
        //         userStats[normalizedStat] = value;
        //     }
        // });

        // Update stats and equip the new item
        await db.query(
            `UPDATE users SET ?? = ? WHERE id = ?`,
            [slot, itemId, userId]
        );

        reply.code(200).send({ 
            message: 'Item equipped successfully', 
            // updatedStats: userStats 
        });

    } catch (error) {
        console.error('Error updating equipment and stats:', error.message);
        reply.code(500).send({ error: 'Failed to update equipment and stats' });
    }
});


fastify.get('/items/:itemName', async (request, reply) => {
    const { itemName } = request.params;  // Get the itemId from the request parameter

    try {
        // Query to fetch the item from the database
        const results = await db.query('SELECT * FROM items WHERE name = ?', [itemName]);

        if (results.length > 0) {
            reply.send(results[0]);  // Return the item as JSON if found
        } else {
            reply.code(404).send({ error: 'Item not found' });  // Item not found
        }
    } catch (error) {
        console.error('Error fetching item:', error);
        reply.code(500).send({ error: 'Database error' });
    }
});

const generateRandomInt = () => {
    return Math.floor(Math.random() * 1e9); // Generates a random number between 0 and 1 billion
};

fastify.post('/level-up-item', async (request, reply) => {
    const { userId, itemId, braveryStat } = request.body;

    // Validate request parameters
    if (!userId || !itemId || braveryStat === undefined) {
        return reply.code(400).send({ error: 'Invalid request parameters.' });
    }

    try {
        // Fetch the item details from the `items` table for the item to be leveled up
        const [baseItemDetails] = await db.query(
            `SELECT i.id, i.name, i.stats, i.type, i.image_url, i.description 
             FROM items i 
             WHERE i.id = ?`,
            [itemId]
        );

        if (baseItemDetails.length === 0) {
            return reply.code(404).send({ error: 'Base item not found.' });
        }

        const baseItem = baseItemDetails[0]; // Base item details (name, stats, type, image_url, description)

        // Parse base item stats
        const parsedBaseStats = JSON.parse(baseItem.stats);

        // Fetch the user's inventory to check how many of this item they have
        const [userDetails] = await db.query(
            `SELECT inventory FROM users WHERE id = ?`,
            [userId]
        );

        if (userDetails.length === 0) {
            return reply.code(404).send({ error: 'User not found.' });
        }

        let { inventory } = userDetails[0];
        inventory = JSON.parse(inventory || '[]'); // Parse inventory array

        // Fetch the names of the items in the user's inventory (we need item names to compare)
        const itemNamesQuery = `SELECT id, name FROM items WHERE id IN (?)`;
        const [inventoryItems] = await db.query(itemNamesQuery, [inventory]);

        // Count how many of the same item name the user has in their inventory
        const itemCount = inventoryItems.filter(item => item.name === baseItem.name).length;

        // If the user doesn't have enough items to upgrade, return an error
        if (itemCount < 2) {
            return reply.code(400).send({ error: 'You need at least two of the same item to upgrade.' });
        }

        // Calculate the upgrade stats (including bravery influence)
        const updatedStats = { ...parsedBaseStats };
        const statTypes = ['endurance', 'strength', 'bravery', 'intelligence'];

        // Apply bravery stat to each stat type
        statTypes.forEach(stat => {
            if (updatedStats[stat] !== undefined) {
                updatedStats[stat] = updatedStats[stat] * (1 + braveryStat / 100);
            }
        });

        // Add special ability if exists in base item and apply the increase
        if (parsedBaseStats.specialAbility !== undefined) {
            updatedStats.specialAbility = parsedBaseStats.specialAbility + Math.floor(Math.random() * 5);
        }

        // Generate a new ID for the leveled-up item
        const newItemId = generateRandomInt(); // You can use your existing ID generation logic

        // Create the leveled-up item with the new stats and details
        const newItem = {
            id: newItemId,
            name: `${baseItem.name} (Leveled Up)`,
            stats: JSON.stringify(updatedStats),
            type: baseItem.type,           // Keep the same type as the original item
            image_url: baseItem.image_url, // Keep the same image URL as the original item
            description: baseItem.description // Keep the same description as the original item
        };

        // Insert the new leveled-up item into the `items` table
        await db.query(
            `INSERT INTO items SET ?`,
            newItem
        );

        // Remove one of the base items from the user's inventory (as it has been used for upgrading)
        const updatedInventory = inventory.filter(itemId => itemId !== baseItem.id);

        // Add the new leveled-up item to the user's inventory
        updatedInventory.push(newItemId);

        // Update the user's inventory in the database
        await db.query(
            `UPDATE users 
             SET inventory = ? 
             WHERE id = ?`,
            [JSON.stringify(updatedInventory), userId]
        );

        reply.send({
            success: true,
            message: `You have successfully leveled up the item and added it to your inventory.`,
            updatedInventory,
            newItem,
        });
    } catch (err) {
        console.error('Error leveling up item:', err.message, err.stack);
        reply.code(500).send({ error: 'Failed to level up item.' });
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
        const [playerResult] = await db.query(`
            SELECT userId, floor, numberOfRuns
            FROM tower_players 
            WHERE userId = ?
        `, [id]);

        if (playerResult.length === 0) {
            return reply.code(404).send({ error: "Tower not found." });
        }

        const { userId, floor, numberOfRuns } = playerResult[0];

        // Get total reward from stages
        const [rewardResult] = await db.query(`
            SELECT SUM(currency_reward) AS totalReward
            FROM stages
            WHERE id <= ?
        `, [floor]);

        const baseReward = rewardResult[0].totalReward || 0;

        if (baseReward === 0) {
            return reply.code(200).send({ message: "No currency added as reward is 0." });
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
        const [updateResult] = await db.query(updateUserQuery, [scaledReward, userId]);

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



fastify.get('/shop/items', async (request, reply) => {
    try {
        const limit = parseInt(request.query.limit, 10) || 100;
        const offset = parseInt(request.query.offset, 10) || 0;

        const [items] = await db.query(`
            SELECT 
                si.id AS shop_item_id,
                i.name,
                si.price,
                i.type,
                i.stats,
                i.image_url,
                i.description,
                i.levelRequired
            FROM 
                shop_items si
            JOIN 
                items i ON si.item_id = i.id
            ORDER BY si.price ASC
            LIMIT ? OFFSET ?
        `, [limit, offset]);

        reply.send(items);
    } catch (error) {
        console.error('Error fetching shop items:', error);
        reply.code(500).send({ error: 'Failed to fetch shop items.' });
    }
});

fastify.post('/shop/buy', async (request, reply) => {
    const { userId, itemId, price: discountedPrice, isGacha } = request.body;

    // Validate request parameters
    if (!userId || !itemId || discountedPrice === undefined) {
        return reply.code(400).send({ error: 'Invalid request parameters.' });
    }

    try {
        // Fetch item details from shop_items and items table
        const [itemDetails] = await db.query(
            `SELECT i.*, si.price 
             FROM shop_items si 
             JOIN items i ON si.item_id = i.id 
             WHERE si.id = ?`,
            [itemId]
        );

        if (itemDetails.length === 0) {
            return reply.code(404).send({ error: 'Item not found.' });
        }

        const { price, stats, ...item } = itemDetails[0];

        // If it's a Gacha roll, use a fixed price of 50
        const finalPrice = isGacha ? 50 : discountedPrice;

        // Validate discounted price
        const calculatedDiscountedPrice = Math.max(
            Math.floor(price * (1 - (request.body.discount / 100 || 0))),
            1
        );

        if (!isGacha && discountedPrice !== calculatedDiscountedPrice) {
            return reply.code(400).send({ error: 'Invalid discounted price.' });
        }

        // Fetch user details
        const [user] = await db.query(
            `SELECT currency, inventory FROM users WHERE id = ?`,
            [userId]
        );
        if (user.length === 0) {
            return reply.code(404).send({ error: 'User not found.' });
        }

        let { currency, inventory } = user[0];
        inventory = JSON.parse(inventory || '[]'); // Ensure inventory is an array

        // Check if user has enough currency
        if (currency < finalPrice) {
            return reply.code(400).send({ error: 'Not enough currency.' });
        }

        // Deduct currency
        currency -= finalPrice;

        // Parse item stats (ensuring it's an object)
        let itemStats = JSON.parse(stats || '{}');

        // Prepare item with stats and a unique UUID
        let newItem = { ...item, stats: itemStats, id: uuidv4() };

        // Append item to inventory
        inventory.push(newItem);

        // Update user's inventory and currency in the database
        await db.query(
            `UPDATE users
             SET currency = ?, inventory = ?
             WHERE id = ?`,
            [currency, JSON.stringify(inventory), userId]
        );

        reply.send({
            success: true,
            message: `You have successfully purchased the ${item.name}.`,
            updatedCurrency: currency,
            updatedInventory: inventory,
        });
    } catch (err) {
        console.error('Error purchasing item:', err.message, err.stack);
        reply.code(500).send({ error: 'Failed to purchase item.' });
    }
});

fastify.get('/shop/spells', async (request, reply) => {
    try {
        const limit = Number(request.query.limit) || 100;
        const offset = Number(request.query.offset) || 0;

        if (isNaN(limit) || isNaN(offset)) {
            return reply.code(400).send({ error: 'Invalid limit or offset' });
        }

        console.log(`Fetching spells with limit=${limit} and offset=${offset}`);

        const [items] = await db.query(`
            SELECT 
                si.id AS shop_spell_id,
                i.name,
                si.price,
                i.type,
                i.stat, 
                i.mana_cost, 
                i.cooldown, 
                i.duration, 
                i.intelligenceRequired
            FROM 
                shop_spells si
            JOIN 
                spells i ON si.spell_id = i.id
            ORDER BY si.price ASC
            LIMIT ? OFFSET ?
        `, [limit, offset]);

        console.log('Fetched items:', items);
        reply.send(items);
    } catch (error) {
        console.error('Error fetching shop spells:', error);
        reply.code(500).send({ error: 'Failed to fetch shop spells.' });
    }
});

fastify.post('/shop/gacha', async (request, reply) => {
    const { userId, seedId, gachaCost } = request.body;

    if (seedId) { // 30% chance
        try {
            // Fetch current currency & inventory
            const [user] = await db.query(
                `SELECT currency, inventory FROM users WHERE id = ?`,
                [userId]
            );
    
            if (!user.length) {
                return reply.code(404).send({ error: "User not found." });
            }
    
            let { currency, inventory } = user[0];
    
            // Check if user has enough currency
            if (currency < gachaCost) {
                return reply.code(400).send({ error: "Not enough currency." });
            }
    
            // Deduct gacha cost
            currency -= gachaCost;
    
            // Parse inventory safely
            let parsedInventory = [];
            if (inventory) {
                try {
                    parsedInventory = JSON.parse(inventory);
                } catch (error) {
                    console.error("Error parsing inventory JSON:", error);
                }
            }
    
            // Fetch the seed details from the `seeds` table
            const [seedDetails] = await db.query(
                `SELECT id, name FROM seeds WHERE id = ?`,
                [seedId]
            );
    
            if (seedDetails.length === 0) {
                return reply.code(404).send({ error: "Seed not found." });
            }
    
            const seed = seedDetails[0];
    
            // Check if the seed already exists in the inventory
            const existingSeedIndex = parsedInventory.findIndex(invItem => invItem.id === seed.id);
    
            if (existingSeedIndex !== -1) {
                // Seed exists, update quantity
                parsedInventory[existingSeedIndex].quantity += 1;
            } else {
                // New seed, add to inventory
                parsedInventory.push({ id: seed.id, name: seed.name, type: 'seed', quantity: 1 });
            }
    
            // Update user's inventory and currency
            await db.query(
                `UPDATE users SET inventory = ?, currency = ? WHERE id = ?`,
                [JSON.stringify(parsedInventory), currency, userId]
            );
    
            console.log("Updated Inventory:", parsedInventory); // Debugging
            reply.code(200).send({ 
                message: "Seed added successfully", 
                inventory: parsedInventory, 
                currency 
            });
    
        } catch (error) {
            console.error("Error in gacha function:", error);
            reply.code(500).send({ error: "Internal Server Error" });
        }
    }
    
})


fastify.post('/spell-shop/buy', async (request, reply) => {
    const { userId, spellId, price: discountedPrice, isGacha } = request.body;

    if (!userId || !spellId || discountedPrice === undefined) {
        return reply.code(400).send({ error: 'Invalid request parameters.' });
    }

    try {
        // Fetch spell details with new columns
        const [spellDetails] = await db.query(
            `SELECT s.*, ss.price 
             FROM shop_spells ss 
             JOIN spells s ON ss.spell_id = s.id 
             WHERE s.id = ?`,
            [spellId]
        );

        if (spellDetails.length === 0) {
            return reply.code(404).send({ error: 'Spell not found.' });
        }

        const { price, stat, mana_cost, cooldown, duration, intelligenceRequired, ...spell } = spellDetails[0];

        // Set final price based on Gacha or Discount
        const finalPrice = isGacha ? 50 : discountedPrice;

        // Validate Discount
        const calculatedDiscountedPrice = Math.max(
            Math.floor(price * (1 - (request.body.discount / 100 || 0))),
            1
        );

        if (!isGacha && discountedPrice !== calculatedDiscountedPrice) {
            return reply.code(400).send({ error: 'Invalid discounted price.' });
        }

        // Fetch user details
        const [user] = await db.query(
            `SELECT currency, ownedSpells FROM users WHERE id = ?`,
            [userId]
        );

        if (user.length === 0) {
            return reply.code(404).send({ error: 'User not found.' });
        }

        let { currency, ownedSpells } = user[0];
        ownedSpells = JSON.parse(ownedSpells || '[]'); // Ensure ownedSpells is an array

        // Check if user has enough currency
        if (currency < finalPrice) {
            return reply.code(400).send({ error: 'Not enough currency.' });
        }

        // Deduct currency
        currency -= finalPrice;

        // Prepare spell object with a unique ID including new attributes
        let newSpell = { 
            ...spell, 
            stat, 
            mana_cost, 
            cooldown, 
            duration, 
            intelligenceRequired, 
            id: uuidv4() 
        };

        // Append spell to user's owned spells
        ownedSpells.push(newSpell);

        // Update user's currency and owned spells
        await db.query(
            `UPDATE users
             SET currency = ?, ownedSpells = ? 
             WHERE id = ?`,
            [currency, JSON.stringify(ownedSpells), userId]
        );

        reply.send({
            success: true,
            message: `You have successfully purchased the ${spell.name}.`,
            updatedCurrency: currency,
            updatedInventory: ownedSpells,
        });
    } catch (err) {
        console.error('Error purchasing spell:', err.message, err.stack);
        reply.code(500).send({ error: 'Failed to purchase spell.' });
    }
});
//     const { userId, intelligence } = request.body;

//     if (!userId || intelligence === undefined) {
//         return reply.code(400).send({ error: 'Invalid request parameters.' });
//     }

//     try {
//         // Fetch user details including last_spin timestamp
//         const [user] = await db.query(
//             `SELECT last_spin FROM users WHERE id = ?`,
//             [userId]
//         );

//         if (user.length === 0) {
//             return reply.code(404).send({ error: 'User not found.' });
//         }

//         const { last_spin } = user[0];
//         const now = new Date();

//         // Check cooldown period (6 hours)
//         if (last_spin) {
//             const lastSpinDate = new Date(last_spin);
//             const hoursSinceLastSpin = (now - lastSpinDate) / (1000 * 60 * 60);

//             if (hoursSinceLastSpin < 6) {
//                 const timeLeft = 6 - hoursSinceLastSpin;
//                 return reply.code(400).send({
//                     error: `You can spin the wheel again in ${Math.ceil(timeLeft)} hours.`,
//                 });
//             }
//         }

//         // Calculate the discount
//         const baseDiscount = Math.floor(Math.random() * 21); // Random discount 0-20%
//         const intelligenceBonus = Math.floor(intelligence / 10); // Intelligence influence
//         const finalDiscount = Math.min(baseDiscount + intelligenceBonus, 90); // Cap at 90%

//         // Update user's discount and last_spin timestamp
//         await db.query(
//             `UPDATE users
//              SET discount = ?, last_spin = ?
//              WHERE id = ?`,
//             [finalDiscount, now, userId]
//         );

//         reply.send({
//             success: true,
//             message: `You received a ${finalDiscount}% discount!`,
//             discount: finalDiscount,
//         });
//     } catch (err) {
//         console.error('Error spinning the wheel:', err.message, err.stack);
//         reply.code(500).send({ error: 'Failed to spin the wheel.' });
//     }
// });

fastify.post('/tower-join', async (request, reply) => {
    let { id, userId } = request.body;

    // Regular expression to validate UUID v4 format
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

    // Validate UUID format for id
    if (!uuidPattern.test(id)) {
        return reply.code(400).send({ error: 'Invalid UUID format for id.' });
    }

    // Force convert userId to integer
    userId = parseInt(userId, 10);

    // Validate the conversion result for userId
    if (isNaN(userId) || userId <= 0) {
        return reply.code(400).send({ error: 'Invalid userId. Must be a positive integer.' });
    }

    const checkQuery = `
        SELECT * FROM tower_players WHERE userId = ?;
    `;
    const updateQuery = `
        UPDATE tower_players
        SET floor = 0
        WHERE userId = ?;
    `;
    const insertQuery = `
        INSERT INTO tower_players (id, userId, active, floor)
        VALUES (?, ?, ?, ?);
    `;

    try {
        // Check if a record with the same userId already exists
        const [existingPlayer] = await db.query(checkQuery, [userId]);

        if (existingPlayer.length > 0) {
            if (existingPlayer[0].active === 0) {
                // If user exists and is inactive, update the floor to 0
                await db.query(updateQuery, [userId]);
                console.log(`Player with userId ${userId} reset floor to 0.`);
            }
        } else {
            // If no existing record, insert the new player
            await db.query(insertQuery, [id, userId, 1, 0]);
            console.log(`New player with userId ${userId} added with floor 0.`);
        }

        return reply.code(200).send({ message: 'Player processed successfully!' });
    } catch (error) {
        console.error('Error in tower-join:', error);
        return reply.code(500).send({ error: 'Internal server error.' });
    }
});


fastify.post('/tower-restart', async (request, reply) => {
    let { userId } = request.body;

    // Force convert userId to integer
    userId = parseInt(userId, 10);

    // Validate the conversion result for userId
    if (isNaN(userId) || userId <= 0) {
        return reply.code(400).send({ error: 'Invalid userId. Must be a positive integer.' });
    }

    const checkQuery = `SELECT * FROM tower_players WHERE userId = ?;`;
    const restartQuery = `
        UPDATE tower_players
        SET floor = 0
        WHERE userId = ?;
    `;

    try {
        const [existingPlayer] = await db.query(checkQuery, [userId]);

        if (existingPlayer.length > 0) {
            // Reset the floor to 0 if the player exists
            await db.query(restartQuery, [userId]);
            console.log(`Floor reset to 0 for userId ${userId}.`);
            return reply.code(200).send({ message: 'Floor reset successfully!' });
        } else {
            // User doesn't exist
            console.log(`UserId ${userId} not found.`);
            return reply.code(404).send({ error: 'User does not exist. Cannot restart.' });
        }

    } catch (error) {
        console.error('Error in tower-restart:', error);
        return reply.code(500).send({ error: 'Internal server error.' });
    }
});

fastify.put('/tower-floor-update', async (request, reply) => {
    const { userId, floor } = request.body;

    if (!userId || floor === undefined) {
        return reply.code(400).send({ error: "ID and floor are required" });
    }

    const query = `
        UPDATE tower_players
        SET floor = ?
        WHERE userId = ?;
    `;

    try {
        const [result] = await db.query(query, [floor, userId]);

        if (result.affectedRows > 0) {
            reply.code(200).send({ message: `Floor updated successfully for userId: ${userId}` });
        } 

    } catch (error) {
        console.error("Failed to update floor:", error);
        reply.code(500).send({ error: "Failed to update floor" });
    }
});

fastify.get('/tower-floor', async (request, reply) => {
    let { userId } = request.query;  // Accessing the userId from the query string

    // Validate if userId is provided
    if (!userId) {
        return reply.code(400).send({ error: 'userId is required.' });
    }

    const query = `
        SELECT floor, numberOfRuns FROM tower_players
        WHERE userId = ?;
    `;

    try {
        const [rows] = await db.query(query, [parseInt(userId, 10)]);

        if (rows.length === 0) {
            return reply.code(200).send({ floor: 0, numOfRuns: 0 });
            // return reply.code(404).send({ message: 'Player not found.' });
        }

        return reply.code(200).send({ floor: rows[0].floor, numOfRuns: rows[0].numberOfRuns });
    } catch (error) {
        console.error('Error in tower-floor:', error);
        return reply.code(500).send({ error: 'Internal server error.' });
    }
});


fastify.get('/tower-leaderboard', async (request, reply) => {
    try {
        const [leaderboard] = await db.query('SELECT * FROM tower_leaderboard ORDER BY floor DESC');
        reply.send(leaderboard);
    } catch (error) {
        console.error('Error fetching leaderboard:', error);
        reply.code(500).send({ message: 'Internal Server Error' });
    }
});


fastify.post('/add-to-tower-leaderboard', async (request, reply) => {
    try {
        const { username, userId, achievedAt } = request.body;

        if (!username || !userId || !achievedAt) {
            return reply.code(400).send({ message: 'Missing required fields' });
        }

        // Get the floor from tower_players
        const getFloorQuery = `SELECT floor FROM tower_players WHERE userId = ?`;
        const [floorResult] = await db.query(getFloorQuery, [userId]);

        if (floorResult.length === 0) {
            return reply.code(404).send({ message: 'User not found in tower_players' });
        }

        const floor = floorResult[0].floor;

        // Check if the user is already in the leaderboard
        const checkQuery = `SELECT floor FROM tower_leaderboard WHERE userId = ?`;
        const [checkResult] = await db.query(checkQuery, [userId]);

        if (checkResult.length > 0) {
            const currentFloor = checkResult[0].floor;
            if (floor > currentFloor) {
                // Update the leaderboard if the new floor is higher
                const updateQuery = `
                    UPDATE tower_leaderboard
                    SET floor = ?, date = ?
                    WHERE userId = ?;
                `;

                await db.query(updateQuery, [floor, achievedAt, userId]);

                return reply.code(200).send({ message: 'Leaderboard updated' });
            } else {
                return reply.code(200).send({ message: 'New floor is not higher. No update made.' });
            }
        } else {
            // User not in leaderboard, insert new record
            const insertQuery = `
                INSERT INTO tower_leaderboard (username, userId, floor, date)
                VALUES (?, ?, ?, ?);
            `;

            await db.query(insertQuery, [username, userId, floor, achievedAt]);

            return reply.code(201).send({ message: 'Leaderboard entry added' });
        }

    } catch (error) {
        console.error('Error interacting with the database:', error);
        reply.code(500).send({ message: 'Failed to interact with the database', error });
    }
});


fastify.post('/vows', async (request, reply) => {
    try {
      const { name, description, selectedStats, difficulty, created_by, deadline } = request.body;
  
      // Reward configurations
      const xpRewards = [10, 20, 30, 40, 50];
      const statRewardValues = [1, 2, 3, 4, 5];
  
      // Check if user is valid and exists
      const userCheckQuery = 'SELECT COUNT(*) AS count FROM users WHERE id = ?';
      const [userCheckResult] = await db.query(userCheckQuery, [created_by]);
  
      if (userCheckResult[0].count === 0) {
        return reply.code(404).send({ error: 'User does not exist' });
      }
  
      // Check active vow count for the user (excluding completed vows)
      const vowCountQuery = `
        SELECT COUNT(*) AS vowCount 
        FROM vows 
        WHERE created_by = ? AND status != 'completed'
      `;
      const [vowCountResult] = await db.query(vowCountQuery, [created_by]);
  
    //   if (vowCountResult[0].vowCount >= 3) {
    //     return reply.code(403).send({ error: 'Vow limit exceeded. You can only have up to 3 active vows.' });
    //   }
  
      // Check if there are already 3 vows with the same created_at date
      const created_at = new Date().toISOString().split('T')[0]; // Current date in yyyy-mm-dd format
      const vowDateCountQuery = `
        SELECT COUNT(*) AS dateVowCount 
        FROM vows 
        WHERE created_by = ? AND created_at = ?
      `;
      const [dateVowCountResult] = await db.query(vowDateCountQuery, [created_by, created_at]);
  
      if (dateVowCountResult[0].dateVowCount >= 3) {
        return reply.code(403).send({ error: 'You can only create up to 3 vows per day.' });
      }
  
      // Validate difficulty index range
      if (difficulty < 1 || difficulty > xpRewards.length) {
        return reply.code(400).send({ error: 'Invalid difficulty level' });
      }
  
      // Calculate experience reward
      const experience_reward = xpRewards[difficulty - 1];
  
      // Calculate stat reward
      const stat_reward = selectedStats.reduce((acc, stat) => {
        acc[stat] = statRewardValues[difficulty - 1];
        return acc;
      }, {});
  
      // Define SQL insertion query
      const sql = `INSERT INTO vows (name, description, experience_reward, stat_reward, difficulty, created_by, status, created_at, completed_at, deadline) 
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
      const status = 'active';
      const completed_at = ''; // Empty by default
  
      // Insert vow into database
      await db.query(sql, [
        name,
        description,
        experience_reward,
        JSON.stringify(stat_reward),
        difficulty,
        created_by,
        status,
        created_at,
        completed_at,
        deadline
      ]);
  
      reply.code(201).send({ message: 'Vow added successfully' });
  
    } catch (error) {
      console.error('Error adding vow:', error);
      reply.code(500).send({ error: 'Failed to add vow' });
    }
});
  
// GET: Fetch vows for a specific user
fastify.get('/vows', async (request, reply) => {
    const { userId } = request.query;

    if (!userId) {
        return reply.code(400).send({ error: 'User ID is required' });
    }

    try {
        const [rows] = await db.query(
            'SELECT * FROM vows WHERE created_by = ? AND status IN ("active", "incomplete", "completed") ' +
            'ORDER BY ' +
            'CASE ' +
            '    WHEN status = "active" THEN 1 ' +
            '    WHEN status = "incomplete" THEN 2 ' +
            '    WHEN status = "completed" THEN 3 ' +
            '    ELSE 4 ' + // In case there are other statuses not expected
            'END, created_at DESC',
            [userId]
        );        
        reply.send(rows);
    } catch (error) {
        console.error('Error fetching vows:', error);
        reply.code(500).send({ error: 'Failed to fetch vows' });
    }
});



fastify.post('/vows/finish', async (request, reply) => {
    const { vowId, userId, completedDate } = request.body;

    try {

        const completionDate = completedDate ? completedDate : new Date().toISOString().split('T')[0];

        // Check if the quest is already completed today
        // const [existing] = await db.query(
        //     `SELECT * FROM vows WHERE id = ? AND created_by = ? AND completed = 1 AND DATE(completed_at) = ?`,
        //     [questId, userId, completionDate]
        // );
        // if (existing.length > 0) {
        //     return reply.code(400).send({ error: 'Quest already completed today.' });
        // }

        // Retrieve the quest's rewards (experience, item, and stat rewards)
        const [quest] = await db.query(
            `SELECT experience_reward, stat_reward FROM vows WHERE id = ?`,
            [vowId]
        );
        if (quest.length === 0) {
            return reply.code(404).send({ error: 'Quest not found.' });
        }

        const { experience_reward: experienceReward, stat_reward: statReward } = quest[0];

        // Mark quest as completed
        await db.query(
            `UPDATE vows
             SET status = 'completed', completed_at = ?
             WHERE id = ? AND created_by = ?`,
            [completionDate, vowId, userId]
        );

        // Update user's experience points
        if (experienceReward) {
            await db.query(
                `UPDATE users
                 SET experience = experience + ?
                 WHERE id = ?`,
                [experienceReward, userId]
            );
        }

        // Update user's stats if statReward exists
        if (statReward) {
            const statUpdates = JSON.parse(statReward); // Assuming stat_reward is stored as JSON string
            
            // Fetch current user stats
            const [user] = await db.query(
                `SELECT stats FROM users WHERE id = ?`,
                [userId]
            );
            let userStats = JSON.parse(user[0].stats || '{}'); // Assuming stats are stored in JSON format

            // Apply stat rewards
            for (let stat in statUpdates) {
                if (userStats[stat]) {
                    userStats[stat] += statUpdates[stat];
                } else {
                    userStats[stat] = statUpdates[stat];
                }
            }

            // Save updated stats back to the database
            await db.query(
                `UPDATE users
                 SET stats = ?
                 WHERE id = ?`,
                [JSON.stringify(userStats), userId]
            );
        }

        reply.send({ success: true, message: 'Quest marked as finished and rewards applied.' });
    } catch (err) {
        console.error('Error finishing quest:', err);
        reply.code(500).send({ error: 'Failed to mark quest as finished.' });
    }
});

fastify.get('/completed-quests-stats', async (request, reply) => {
    const { userId, daysRange } = request.query;
    console.log(userId, daysRange);
    
    if (!userId || !daysRange) {
        return reply.code(400).send({ error: 'User ID and daysRange are required' });
    }

    try {
        const days = parseInt(daysRange);
        if (isNaN(days) || days <= 0) {
            return reply.code(400).send({ error: 'Invalid daysRange value' });
        }

        const currentDate = new Date();
        const startDate = new Date();
        startDate.setDate(currentDate.getDate() - (days - 1));

        const currentDateStr = currentDate.toISOString().split('T')[0];
        const startDateStr = startDate.toISOString().split('T')[0];

        const [questParticipants] = await db.query(
            `SELECT qp.quest_id, qp.completed_at
             FROM quest_participants qp
             WHERE qp.user_id = ? AND qp.completed = 1
             AND DATE(qp.completed_at) BETWEEN ? AND ?`,
            [userId, startDateStr, currentDateStr]
        );

        if (questParticipants.length === 0) {
            const result = Array.from({ length: days }, (_, i) => {
                const day = new Date(startDate);
                day.setDate(startDate.getDate() + i);
                const dateStr = day.toISOString().split('T')[0];
                return {
                    date: dateStr,
                    stats: {
                        strength: 0,
                        bravery: 0,
                        intelligence: 0,
                        endurance: 0
                    },
                    tags: []
                };
            });
            return reply.send(result);
        }

        const questIds = questParticipants.map(qp => qp.quest_id);
        const [quests] = questIds.length
            ? await db.query('SELECT id, stat_reward, tags FROM quests WHERE id IN (?)', [questIds])
            : [[]];

        const questRewards = {};
        const questTags = {};

        quests.forEach(quest => {
            questRewards[quest.id] = JSON.parse(quest.stat_reward);
            questTags[quest.id] = JSON.parse(quest.tags); // Parse tags as JSON here
        });

        const statsPerDay = {};

        questParticipants.forEach(participant => {
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
                    tags: new Set()
                };
            }

            statsPerDay[completedDateStr].strength += statReward.strength || 0;
            statsPerDay[completedDateStr].bravery += statReward.bravery || 0;
            statsPerDay[completedDateStr].intelligence += statReward.intelligence || 0;
            statsPerDay[completedDateStr].endurance += statReward.endurance || 0;

            if (tags && Array.isArray(tags)) {
                tags.forEach(tag => statsPerDay[completedDateStr].tags.add(tag.trim())); // If tags is an array, add each tag
            }
        });

        const result = Array.from({ length: days }, (_, i) => {
            const day = new Date(startDate);
            day.setDate(startDate.getDate() + i);
            const dateStr = day.toISOString().split('T')[0];

            const statsEntry = statsPerDay[dateStr] || {
                strength: 0,
                bravery: 0,
                intelligence: 0,
                endurance: 0,
                tags: new Set()
            };

            return {
                date: dateStr,
                stats: {
                    strength: statsEntry.strength,
                    bravery: statsEntry.bravery,
                    intelligence: statsEntry.intelligence,
                    endurance: statsEntry.endurance
                },
                tags: Array.from(statsEntry.tags) // Convert the Set to an array before returning
            };
        });

        reply.send(result);
    } catch (error) {
        console.error('Error fetching completed quest stats:', error);
        reply.code(500).send({ error: 'Failed to fetch stats' });
    }
});





fastify.get('/total-completed-quests-stats', async (request, reply) => {
    try {
        const currentDate = new Date();
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(currentDate.getDate() - 7);

        const formatDate = (date) => {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        };

        const currentDateStr = formatDate(currentDate);
        const oneWeekAgoStr = formatDate(oneWeekAgo);

        const [questParticipants] = await db.query(
            `SELECT qp.quest_id
             FROM quest_participants qp
             WHERE qp.completed = 1
             AND DATE(qp.completed_at) BETWEEN ? AND ?`,
            [oneWeekAgoStr, currentDateStr]
        );

        if (questParticipants.length === 0) {
            return reply.send({ stats: { strength: 0, bravery: 0, intelligence: 0, endurance: 0 } });
        }

        const questIds = questParticipants.map(qp => qp.quest_id);
        const [quests] = await db.query(
            'SELECT id, stat_reward FROM quests WHERE id IN (?)',
            [questIds]
        );

        const statsArray = {
            strength: [],
            bravery: [],
            intelligence: [],
            endurance: []
        };

        quests.forEach(quest => {
            const statReward = JSON.parse(quest.stat_reward);
            if (statReward.strength) statsArray.strength.push(statReward.strength);
            if (statReward.bravery) statsArray.bravery.push(statReward.bravery);
            if (statReward.intelligence) statsArray.intelligence.push(statReward.intelligence);
            if (statReward.endurance) statsArray.endurance.push(statReward.endurance);
        });

        const calculateMedian = (arr) => {
            const nonZeroArr = arr.filter(value => value !== 0);
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
            endurance: calculateMedian(statsArray.endurance)
        };

        console.log(totalStats);
        reply.send({ stats: totalStats });
    } catch (error) {
        console.error('Error fetching total completed quest stats:', error);
        reply.code(500).send({ error: 'Failed to fetch stats' });
    }
});


fastify.get('/spells', async (request, reply) => {
    try {
        const [ spells ] = await db.query(`
            SELECT * FROM spells 
        `);
        reply.send(spells);
    } catch (error) {
        console.error('Error fetching leaderboard:', error);
        reply.code(500).send({ message: 'Internal Server Error' });
    }
});

fastify.post('/updateSpells', async (request, reply) => {
    const { userId, spellSlots } = request.body; // Destructure from request body

    console.log(spellSlots)
    // Prepare spell list while maintaining order
    const orderedSpells = [
        spellSlots.first || null,
        spellSlots.second || null,
        spellSlots.third || null,
        spellSlots.fourth || null,
    ];

    // Convert the spell list to a string (comma-separated or JSON)
    const spellsString = JSON.stringify(orderedSpells);

    console.log(spellsString);

    try {
        const query = `
            UPDATE users 
            SET spells = ? 
            WHERE id = ?;
        `;
        db.query(query, [spellsString, userId]);
        reply.send({ message: 'Spells updated successfully' });
    } catch (error) {
        console.error('Error updating spells:', error);
        reply.code(500).send({ message: 'Internal Server Error' });
    }
});

fastify.post('/getSpellData', async (request, reply) => {
    const { spellName } = request.body; // Destructure spell name from request body

    // Check if spell name is provided
    if (!spellName) {
        return reply.code(400).send({ message: 'Spell name is required' });
    }

    try {
        // Query to get the spell data from the database based on spell name
        const query = `
            SELECT * 
            FROM spells 
            WHERE name = ?;
        `;
        const [spellData] = await db.query(query, [spellName]);

        // Check if spell exists
        if (spellData.length === 0) {
            return reply.code(404).send({ message: 'Spell not found' });
        }

        // Respond with the spell data
        reply.send(spellData[0]);
    } catch (error) {
        console.error('Error fetching spell data:', error);
        reply.code(500).send({ message: 'Internal Server Error' });
    }
});

fastify.get('/garden', async (request, reply) => { 
    const { userId } = request.query;
    
    try {
        const [gardens] = await db.query(`
            SELECT pg.id, s.name, pg.planted_at, pg.last_watered_at, pg.status, 
                   pg.last_wilted_at, pg.total_progress, pg.next_water_time, s.growth_time, s.wilt_time
            FROM player_garden pg
            JOIN seeds s ON pg.seed_id = s.id
            WHERE pg.player_id = ?`, 
            [userId]
        );

        const currentTime = Math.floor(Date.now() / 1000); // Current timestamp

        for (const plant of gardens) {
            const plantedAt = plant.planted_at 
                ? Math.floor(new Date(plant.planted_at).getTime() / 1000)
                : 0;
            const lastWatered = plant.last_watered_at 
                ? Math.floor(new Date(plant.last_watered_at).getTime() / 1000)
                : plantedAt;
            const lastWilted = plant.last_wilted_at 
                ? Math.floor(new Date(plant.last_wilted_at).getTime() / 1000)
                : 0;
            const nextWaterTime = plant.next_water_time 
                ? Math.floor(new Date(plant.next_water_time).getTime() / 1000)
                : plantedAt;

            const growthTimeSec = plant.growth_time; 
            const wiltTimeSec = plant.wilt_time;

            const totalProgress = plant.total_progress;

            const timeSinceLastWatered = currentTime - lastWatered;

            if (!plantedAt) continue;

            let effectiveGrowingTime = currentTime - plantedAt;
            if (lastWilted && lastWilted > plantedAt) {
                effectiveGrowingTime -= Math.max(currentTime - lastWilted, 0);
            }

            const computedTimeLeft = Math.max(growthTimeSec - effectiveGrowingTime, 0);
            
            // Approximate time remaining
            let timeLeftApprox = "Less than a minute";
            if (computedTimeLeft > 3600) {
                timeLeftApprox = `${Math.ceil(computedTimeLeft / 3600)} hours left`;
            } else if (computedTimeLeft > 60) {
                timeLeftApprox = `${Math.ceil(computedTimeLeft / 60)} minutes left`;
            }
            plant.computedTimeLeft = timeLeftApprox;

            
            // }
            if (totalProgress >= growthTimeSec) {
                await db.query(
                    `UPDATE player_garden SET status = 'harvestable' WHERE id = ?`, 
                    [plant.id]
                );
                plant.status = 'harvestable';
                continue;
            }

            
        }

        reply.send(gardens);
    } catch (err) {
        console.error(err);
        reply.code(500).send({ error: "Failed to fetch garden data" });
    }
});

fastify.get('/plant', async (request, reply) => {
    const { userId, plantId } = request.query;

    try {
        // Select plant details with row lock removed (no transaction)
        const [gardens] = await db.query(`
            SELECT pg.id, s.name, pg.planted_at, pg.last_watered_at, pg.status, 
                   pg.last_wilted_at, pg.total_progress, pg.next_water_time, 
                   s.growth_time, s.wilt_time
            FROM player_garden pg
            JOIN seeds s ON pg.seed_id = s.id
            WHERE pg.player_id = ? AND pg.id = ?`,
            [userId, plantId]
        );

        if (gardens.length === 0) {
            return reply.code(404).send({ error: "Garden not found" });
        }

        const plant = gardens[0];
        const currentTime = Math.floor(Date.now() / 1000);

        const lastWatered = plant.last_watered_at 
            ? Math.floor(new Date(plant.last_watered_at).getTime() / 1000)
            : Math.floor(new Date(plant.planted_at).getTime() / 1000);

        let nextWaterTime = plant.next_water_time 
            ? Math.floor(new Date(plant.next_water_time).getTime() / 1000)
            : lastWatered;

        const timeSinceLastWatered = currentTime - lastWatered;
        console.log((nextWaterTime - lastWatered) < plant.wilt_time)
        if (currentTime >= nextWaterTime && (nextWaterTime - lastWatered) < plant.wilt_time) {
            db.query(
                `UPDATE player_garden SET status = 'harvestable' WHERE id = ?`, 
                [plant.id]
            );
        }

        if (timeSinceLastWatered >= plant.wilt_time) {
            await db.query(
                `UPDATE player_garden 
                SET status = 'wilted', last_wilted_at = ? 
                WHERE id = ?`, 
                [new Date(currentTime * 1000), plant.id]
            );
        }

        nextWaterTime = lastWatered + plant.wilt_time;
        let newTotalProgress = (plant.total_progress || 0) + plant.wilt_time;

        if (newTotalProgress > plant.growth_time) {
            newTotalProgress = plant.growth_time;
        }

        console.log(`Updating total_progress: ${newTotalProgress}, next_water_time: ${new Date(nextWaterTime * 1000)}`);

        // Update total_progress and next_water_time without transaction
        db.query(`
            UPDATE player_garden 
            SET total_progress = ?, 
                next_water_time = DATE_ADD(last_watered_at, INTERVAL ? SECOND) 
            WHERE id = ? AND player_id = ?`,
            [newTotalProgress, plant.wilt_time, plant.id, userId]
        );

        reply.send({ ...plant, next_water_time: new Date(nextWaterTime * 1000) });

    } catch (err) {
        console.error(err);
        reply.code(500).send({ error: "Failed to fetch and update garden data" });
    }
});

fastify.post('/garden/plant', async (request, reply) => {
    const { userId, seedId } = request.body;
    const now = new Date();

    try {
        // Fetch the current inventory from the users table
        const [userRows] = await db.query(`SELECT inventory FROM users WHERE id = ?`, [userId]);

        if (userRows.length === 0) {
            return reply.code(404).send({ error: "User not found" });
        }

        let inventory = JSON.parse(userRows[0].inventory); // Assuming inventory is stored as a JSON string

        // Check if the seed exists in the inventory
        const seedIndex = inventory.findIndex(item => item.id === seedId && item.type === 'seed');
        if (seedIndex === -1) {
            return reply.code(400).send({ error: "You don't have this seed in your inventory" });
        }

        // Reduce quantity or remove seed entirely
        if (inventory[seedIndex].quantity > 1) {
            inventory[seedIndex].quantity -= 1;
        } else {
            inventory.splice(seedIndex, 1); // Remove if only 1 left
        }

        // Convert inventory back to JSON and update the users table
        await db.query(`UPDATE users SET inventory = ? WHERE id = ?`, [JSON.stringify(inventory), userId]);

        // Fetch the seed info from the seeds table
        const [seedRows] = await db.query(`SELECT growth_time, wilt_time FROM seeds WHERE id = ?`, [seedId]);
        if (seedRows.length === 0) {
            return reply.code(404).send({ error: "Seed not found" });
        }
        const seedInfo = seedRows[0];

        const now = new Date();
        const nextWaterTime = new Date(now.getTime() + seedInfo.wilt_time * 1000);

        
        console.log(nextWaterTime);

        // Insert into player_garden (plant the seed)
        // We use new Date(0) for last_watered_at and last_wilted_at as placeholders.
        // Set time_left to the seed's growth_time so that it counts down as the plant grows.
        await db.query(`
            INSERT INTO player_garden (player_id, seed_id, planted_at, last_watered_at, last_wilted_at, status, total_progress, next_water_time)
            VALUES (?, ?, ?, ?, ?, 'growing', ?, ?)`, 
            [userId, seedId, now, now, null, 0, nextWaterTime]
        );

        reply.send({ message: "Seed planted and inventory updated!" });
    } catch (err) {
        console.error(err);
        reply.code(500).send({ error: "Failed to plant seed" });
    }
});

// Water a plant
fastify.post('/garden/water', async (request, reply) => {
    const { userId, gardenId } = request.body; // Removed lastWateredAt from the request

    try {
        // Fetch plant details
        const [plantRows] = await db.query(
            `SELECT * FROM player_garden WHERE id = ? AND player_id = ?`, 
            [gardenId, userId]
        );

        
        if (plantRows.length === 0) {
            return reply.code(404).send({ error: "Plant not found" });
        }

        const plant = plantRows[0];

        const [seedRows] = await db.query(
            `SELECT * FROM seeds WHERE id = ?`, 
            [plant.seed_id]
        );

        const seed = seedRows[0];

        // Get the current date/time
        const now = new Date();
        


        let nextWaterTime = new Date(now.getTime() + seed.wilt_time * 1000);
        if(plant.total_progress + seed.wilt_time >= seed.growth_time){
            nextWaterTime = new Date(now.getTime() + (seed.growth_time - plant.total_progress) * 1000);
            console.log("This is the next watering time: " + nextWaterTime);
        }

        // 🌱 Update plant status to 'growing' and set last_watered_at to the current date/time
        await db.query(
            `UPDATE player_garden 
             SET last_watered_at = ?, next_water_time = ?, status = 'growing' 
             WHERE id = ? AND player_id = ?`, 
            [now, nextWaterTime, gardenId, userId]
        );

        reply.send({ message: "Plant watered and is now growing!", status: "growing" });

    } catch (err) {
        console.error(err);
        reply.code(500).send({ error: "Failed to water plant" });
    }
});

// Harvest a plant
fastify.post('/garden/harvest', async (request, reply) => {
    const { userId, gardenId } = request.body;

    try {
        // Fetch the plant details
        const [plantRows] = await db.query(
            `SELECT * FROM player_garden WHERE id = ? AND player_id = ?`, 
            [gardenId, userId]
        );

        if (plantRows.length === 0) {
            return reply.code(400).send({ error: "Plant not found in garden" });
        }

        const plant = plantRows[0];

        // Fetch the corresponding seed data (now includes growth_time)
        const [seedRows] = await db.query(
            `SELECT id, name, material, growth_time FROM seeds WHERE id = ?`, 
            [plant.seed_id]
        );

        if (seedRows.length === 0) {
            return reply.code(404).send({ error: "Seed data not found" });
        }

        const seed = seedRows[0];

        // Check if plant is fully grown
        if (plant.total_progress < seed.growth_time) {
            return reply.code(400).send({ error: "Plant is not fully grown yet!" });
        }

        // Fetch the user's current inventory
        const [userRows] = await db.query(`SELECT inventory FROM users WHERE id = ?`, [userId]);

        if (userRows.length === 0) {
            return reply.code(404).send({ error: "User not found" });
        }

        let inventory = JSON.parse(userRows[0].inventory || '[]'); // Ensure it's an array

        // Add seed to inventory
        let seedItem = inventory.find(item => item.id === seed.id && item.type === 'seed');
        if (seedItem) {
            seedItem.quantity += 1;
        } else {
            inventory.push({ id: seed.id, name: seed.name, type: 'seed', quantity: 1 });
        }

        // Add harvested material
        let materialItem = inventory.find(item => item.name === seed.material && item.type === 'material');
        if (materialItem) {
            materialItem.quantity += 1;
        } else {
            inventory.push({ name: seed.material, type: 'material', quantity: 1 });
        }

        // Update inventory in DB
        await db.query(`UPDATE users SET inventory = ? WHERE id = ?`, [JSON.stringify(inventory), userId]);

        // Remove plant from garden
        await db.query(`DELETE FROM player_garden WHERE id = ?`, [gardenId]);

        reply.send({ message: `You received 1 ${seed.name} seed and 1 ${seed.material}!` });

    } catch (err) {
        console.error(err);
        reply.code(500).send({ error: "Failed to harvest plant" });
    }
});


fastify.get('/seeds', async (request, reply) => {
    const { id } = request.params;  // Get the itemId from the request parameter

    try {
        // Query to fetch the item from the database
        const results = await db.query('SELECT * FROM seeds');

        if (results.length > 0) {
            reply.send(results[0]);  // Return the item as JSON if found
        } else {
            reply.code(404).send({ error: 'Seed not found' });  // Item not found
        }
    } catch (error) {
        console.error('Error fetching seed:', error);
        reply.code(500).send({ error: 'Database error' });
    }
});

fastify.get('/seed/:id', async (request, reply) => {
    const { id } = request.params;  // Get the itemId from the request parameter

    try {
        // Query to fetch the item from the database
        const results = await db.query('SELECT * FROM seeds WHERE id = ?', [id]);

        if (results.length > 0) {
            reply.send(results[0]);  // Return the item as JSON if found
        } else {
            reply.code(404).send({ error: 'Seed not found' });  // Item not found
        }
    } catch (error) {
        console.error('Error fetching seed:', error);
        reply.code(500).send({ error: 'Database error' });
    }
});

fastify.get("/craftable-items", async (request, reply) => {
    try {
        const [result] = await db.query("SELECT * FROM craftable_items");
        // Convert recipe from text to JSON
        const formattedItems = result.map(item => ({
            ...item,
            recipe: JSON.parse(item.recipe) // Convert text to JSON
        }));

        reply.send(formattedItems);
    } catch (error) {
        reply.code(500).send({ error: "Failed to fetch craftable items" });
    }
});

fastify.post('/craft', async (request, reply) => {
    const { userId, itemId, quantity } = request.body;

    try {
        // Fetch craftable item details
        const [craftableRows] = await db.query(
            `SELECT * FROM craftable_items WHERE id = ?`, 
            [itemId]
        );

        if (craftableRows.length === 0) {
            return reply.code(404).send({ error: "Craftable item not found" });
        }

        const craftableItem = craftableRows[0];
        const recipe = JSON.parse(craftableItem.recipe); // Recipe is stored as a JSON object
        const itemStats = JSON.parse(craftableItem.stats || '{}'); // Ensure stat is parsed as JSON

        // Fetch user's inventory
        const [userRows] = await db.query(`SELECT inventory FROM users WHERE id = ?`, [userId]);

        if (userRows.length === 0) {
            return reply.code(404).send({ error: "User not found" });
        }

        let inventory = JSON.parse(userRows[0].inventory || '[]'); // Ensure it's an array

        // Check if the user has enough materials
        for (const [material, reqQty] of Object.entries(recipe)) {
            const materialItem = inventory.find(item => item.name === material && item.type === 'material');
            if (!materialItem || materialItem.quantity < reqQty * quantity) {
                return reply.code(400).send({ error: `Not enough ${material} to craft ${craftableItem.name}` });
            }
        }

        // Deduct materials from inventory
        for (const [material, reqQty] of Object.entries(recipe)) {
            let materialItem = inventory.find(item => item.name === material && item.type === 'material');
            materialItem.quantity -= reqQty * quantity;
        }

        // Add crafted item to inventory
        let craftedItem = inventory.find(item => item.name === craftableItem.name);
        if (craftedItem) {
            craftedItem.quantity += quantity;
        } else {
            inventory.push({ 
                name: craftableItem.name, 
                type: craftableItem.type, 
                quantity, 
                stats: itemStats // Ensure stats are properly stored as JSON
            });
        }

        // Update the user's inventory in the database
        await db.query(`UPDATE users SET inventory = ? WHERE id = ?`, [JSON.stringify(inventory), userId]);

        reply.send({ message: `Successfully crafted ${quantity} ${craftableItem.name}` });

    } catch (err) {
        console.error(err);
        reply.code(500).send({ error: "Failed to craft item" });
    }
});

fastify.post('/consume', async (request, reply) => {
    const { userId, itemId, quantity } = request.body;

    try {
        // Fetch user's inventory
        const [userRows] = await db.query(`SELECT inventory FROM users WHERE id = ?`, [userId]);

        if (userRows.length === 0) {
            return reply.code(404).send({ error: "User not found" });
        }

        let inventory = JSON.parse(userRows[0].inventory || '[]'); // Ensure it's an array

        // Find the consumable item in inventory
        let consumableItem = inventory.find(item => item.name === itemId && item.type === 'consumable');

        if (!consumableItem) {
            return reply.code(400).send({ error: "Item not found or not consumable" });
        }

        if (consumableItem.quantity < quantity) {
            return reply.code(400).send({ error: `Not enough ${consumableItem.name} to consume` });
        }

        // Extract item stats before consuming
        const itemStats =consumableItem.stats || {}; // Ensure it's an object

        // Subtract the quantity
        consumableItem.quantity -= quantity;

        // Remove item if quantity reaches zero
        if (consumableItem.quantity <= 0) {
            inventory = inventory.filter(item => item.name !== itemId);
        }

        // Update the user's inventory in the database
        await db.query(`UPDATE users SET inventory = ? WHERE id = ?`, [JSON.stringify(inventory), userId]);

        reply.send({
            message: `Successfully consumed ${quantity} ${consumableItem.name}`,
            stats: itemStats,
        });

    } catch (err) {
        console.error(err);
        reply.code(500).send({ error: "Failed to consume item" });
    }
});

fastify.get("/perks", async (request, reply) => {
    try {
        const [result] = await db.query("SELECT * FROM perks");
        reply.send(result);
    } catch (error) {
        reply.code(500).send({ error: "Failed to fetch craftable items" });
    }
});

fastify.get("/perks/:name", async (request, reply) => {
    try {
        const { name } = request.params;
        const [result] = await db.query("SELECT * FROM perks WHERE name = ?", [name]);

        if (result.length === 0) {
            return reply.code(404).send({ error: "Perk not found" });
        }

        reply.send(result[0]);
    } catch (error) {
        reply.code(500).send({ error: "Failed to fetch perk" });
    }
});

fastify.post('/choose-perk', async (request, reply) => {
    const { userId, perkName } = request.body;

    try {
        // ✅ Check if the perk exists and fetch its point cost and type
        const [perkCheck] = await db.query(
            `SELECT pointCost, type FROM perks WHERE name = ?`, [perkName]
        );

        if (perkCheck.length === 0) {
            return reply.code(404).send({ error: "Perk does not exist" });
        }

        const { pointCost, type } = perkCheck[0];

        // ✅ Fetch user's perks and current perk points
        const [userRows] = await db.query(
            `SELECT perks, perkPoints FROM users WHERE id = ?`, 
            [userId]
        );

        if (userRows.length === 0) {
            return reply.code(404).send({ error: "User not found" });
        }

        let perks = JSON.parse(userRows[0].perks || '[]'); // Ensure it's an array
        const currentPerkPoints = userRows[0].perkPoints;

        // ✅ Check if the user has enough perk points
        if (currentPerkPoints < pointCost) {
            return reply.code(400).send({ error: "Not enough perk points" });
        }

        // ✅ Check if the user already has the perk
        if (perks.some(perk => perk.perkName === perkName)) {
            return reply.code(400).send({ error: "Perk already chosen" });
        }

        // ✅ Add the new perk with the fetched 'type'
        perks.push({ perkName, type });

        // ✅ Deduct the perk cost from the user's perk points
        const updatedPerkPoints = currentPerkPoints - pointCost;

        // ✅ Update the user's perks and perk points in the database
        await db.query(
            `UPDATE users SET perks = ?, perkPoints = ? WHERE id = ?`,
            [JSON.stringify(perks), updatedPerkPoints, userId]
        );

        reply.send({ 
            message: `Successfully added perk: ${perkName}`, 
            type,
            remainingPerkPoints: updatedPerkPoints 
        });

    } catch (err) {
        console.error(err);
        reply.code(500).send({ error: "Failed to save perk" });
    }
});


fastify.post("/claim-perk-point", async (request, reply) => {
    const { userId, stat, milestone } = request.body;

    try {
        // Fetch current user data
        const [rows] = await db.query("SELECT perkPoints, claimedMilestones FROM users WHERE id = ?", [userId]);

        if (!rows.length) {
            return reply.code(404).send({ error: "User not found" });
        }

        let user = rows[0]; // Extract user data from the first row
        let currentPerkPoints = parseInt(user.perkPoints, 10) || 0; // Ensure it's a number, default to 0
        let claimedMilestones = JSON.parse(user.claimedMilestones || "[]");

        // Check if milestone is already claimed
        if (claimedMilestones.some(m => m.stat === stat && m.milestone === milestone)) {
            return reply.code(400).send({ error: "Milestone already claimed" });
        }

        // Increment perk points and update claimed milestones
        claimedMilestones.push({ stat, milestone });
        const updatedPerkPoints = currentPerkPoints + 1;

        await db.query("UPDATE users SET perkPoints = ?, claimedMilestones = ? WHERE id = ?", [
            updatedPerkPoints,
            JSON.stringify(claimedMilestones),
            userId
        ]);

        reply.send({ message: "Perk point claimed!", perkPoints: updatedPerkPoints, claimedMilestones });
    } catch (error) {
        console.error("Error updating perk points:", error);
        reply.code(500).send({ error: "Internal server error" });
    }
});

fastify.post("/remove-perk", async (request, reply) => {
    const { userId, perkName, refundPoints } = request.body;

    try {
        // Fetch the current perks and perk points
        const [user] = await db.query(`SELECT perks, perkPoints FROM users WHERE id = ?`, [userId]);
        
        if (!user || user.length === 0) {
            return reply.code(404).send({ error: "User not found" });
        }

        let userPerks = JSON.parse(user[0].perks);
        let newPerkPoints = user[0].perkPoints + refundPoints; // Refund points

        // Remove the selected perk
        userPerks = userPerks.filter(perk => perk.perkName !== perkName);

        // Update the database
        await db.query(
            `UPDATE users SET perks = ?, perkPoints = ? WHERE id = ?`,
            [JSON.stringify(userPerks), newPerkPoints, userId]
        );

        reply.send({ success: true, newPerks: userPerks, newPerkPoints });
    } catch (error) {
        console.error("Error removing perk:", error);
        reply.code(500).send({ error: "Internal Server Error" });
    }
});

fastify.get("/guilds", async (request, reply) => {
    try {
        const [result] = await db.query("SELECT * FROM guilds");
        return reply.send(result);
    } catch (error) {
        return reply.code(500).send({ error: "Failed to fetch guilds" });
    }
});

fastify.get("/user-guild", async (request, reply) => {
    try {
      const { name, userId } = request.query; // Get both the guild name and userId from the query parameters
  
      if (!name || !userId) {
        return reply.code(400).send({ error: "Guild name and user ID are required" });
      }
  
      // Query to fetch the guild by name
      const [result] = await db.query("SELECT * FROM guilds WHERE name = ?", [name]);
  
      if (result.length === 0) {
        return reply.code(404).send({ error: "Guild not found" });
      }
  
      // Parse the members array from the database result
      const members = JSON.parse(result[0].members);
  
      // Check if the user is a member of the guild
      const isMember = members.some(member => Number(member.userId) === Number(userId));
  
      if (!isMember) {
        return reply.code(403).send({ error: "User is not a member of this guild" });
      }
  
      reply.send(result[0]); // Return the guild details
    } catch (error) {
      console.error("Error fetching guild:", error);
      return reply.code(500).send({ error: "Failed to fetch guild" });
    }
  });
  

fastify.post('/create-guild', async (request, reply) => {
    try {
        const { name, description, privacy, created_by } = request.body;

        // Validate required fields
        if (!name || !description || !privacy || !created_by) {
            return reply.code(400).send({ error: 'Missing required fields' });
        }

        // Fetch user data: currency, guild, and username
        const userCheckQuery = 'SELECT currency, guild, username FROM users WHERE id = ?';
        const [userResult] = await db.query(userCheckQuery, [created_by]);

        if (userResult.length === 0) {
            return reply.code(404).send({ error: 'User does not exist' });
        }

        const { currency: userGold, guild, username } = userResult[0];

        // Check if the user is already in a guild
        if (guild && guild.trim() !== '') {
            return reply.code(403).send({ error: 'You are already in a guild and cannot create another one.' });
        }

        // Check if the user has at least 50,000 gold
        if (userGold < 50000) {
            return reply.code(403).send({ error: 'Insufficient gold. You need at least 50,000 gold to create a guild.' });
        }

        // Deduct 50,000 gold from user's balance and set guild name
        const newBalance = userGold - 50000;
        const updateUserCurrencyQuery = 'UPDATE users SET currency = ?, guild = ? WHERE id = ?';
        await db.query(updateUserCurrencyQuery, [newBalance, name, created_by]);

        // Check if the guild name already exists
        const guildCountQuery = 'SELECT COUNT(*) AS guildCount FROM guilds WHERE name = ?';
        const [guildCountResult] = await db.query(guildCountQuery, [name]);

        if (guildCountResult[0].guildCount > 0) {
            return reply.code(403).send({ error: 'This guild name already exists, choose a different name.' });
        }

        // Prepare members array with the creator as an admin
        const created_at = new Date();
        const members = [{ userId: created_by, username, role: "admin" }];

        // Insert new guild into the database
        const sql = `INSERT INTO guilds (name, description, members, group_quests, created_at, privacy, request_list, guild_gems) 
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;

        await db.query(sql, [
            name,
            description,
            JSON.stringify(members), // Store members array as JSON
            JSON.stringify([]), // Empty group_quests
            created_at,
            privacy || 'public',
            JSON.stringify([]), // Empty request_list
            20
        ]);

        reply.code(201).send({ message: 'Guild created successfully', newBalance });

    } catch (error) {
        console.error('Error creating guild:', error);
        reply.code(500).send({ error: 'Failed to create guild' });
    }
});


fastify.post('/join-guild', async (request, reply) => {
    try {
        const { name, userId } = request.body;

        if (!name || !userId) {
            return reply.code(400).send({ error: 'Guild name, userId, and username are required' });
        }

        // Check if the user exists
        const userCheckQuery = 'SELECT COUNT(*) AS count FROM users WHERE id = ?';
        const [userCheckResult] = await db.query(userCheckQuery, [userId]);

        if (userCheckResult[0].count === 0) {
            return reply.code(404).send({ error: 'User does not exist' });
        }

        // Check if the user is already in another guild
        const userGuildCheckQuery = 'SELECT username, guild FROM users WHERE id = ?';
        const [userGuildResult] = await db.query(userGuildCheckQuery, [userId]);

        if (userGuildResult[0].guild) {
            return reply.code(403).send({ error: 'User is already in another guild' });
        }

        // Fetch the target guild by name
        const guildQuery = 'SELECT members, request_list, privacy FROM guilds WHERE name = ?';
        const [guildResult] = await db.query(guildQuery, [name]);

        if (guildResult.length === 0) {
            return reply.code(404).send({ error: 'Guild not found' });
        }

        let { members, request_list, privacy } = guildResult[0];

        if (!privacy || (privacy !== 'public' && privacy !== 'private')) {
            return reply.code(500).send({ error: 'Guild privacy setting is invalid' });
        }

        // Parse JSON fields
        members = JSON.parse(members);
        request_list = JSON.parse(request_list);

        // Check if the guild has reached maximum capacity (50 members)
        if (members.length >= 50) {
            return reply.code(403).send({ error: 'Maximum guild capacity reached (50 members)' });
        }

        // Check if the user is already a member
        if (members.some(member => member.userId === userId)) {
            return reply.code(400).send({ error: 'User is already a member of this guild' });
        }

        if (privacy === "public") {
            // If public, add user immediately
            members.push({ userId, username: userGuildResult[0].username, role: "member" });

            // Update the guild with new members
            const updateGuildQuery = 'UPDATE guilds SET members = ? WHERE name = ?';
            await db.query(updateGuildQuery, [JSON.stringify(members), name]);

            // Update the user's guild column
            const updateUserQuery = 'UPDATE users SET guild = ? WHERE id = ?';
            await db.query(updateUserQuery, [name, userId]);

            return reply.code(200).send({ message: 'User successfully joined the guild' });
        } else if (privacy === "private") {
            // If private, add user to the request list
            if (!request_list.some(request => request.userId === userId)) {
                request_list.push({ userId, username: userGuildResult[0].username });
            }

            // Update the guild with the new request list
            const updateRequestQuery = 'UPDATE guilds SET request_list = ? WHERE name = ?';
            await db.query(updateRequestQuery, [JSON.stringify(request_list), name]);

            return reply.code(200).send({ message: 'Request sent to join the guild' });
        }
    } catch (error) {
        console.error('Error joining guild:', error);
        reply.code(500).send({ error: 'Failed to join the guild' });
    }
});


fastify.post('/leave-guild', async (request, reply) => {
    try {
        const { name, userId } = request.body;

        if (!name || !userId) {
            return reply.code(400).send({ error: 'Guild name and userId are required' });
        }

        // Fetch guild data
        const guildQuery = 'SELECT members FROM guilds WHERE name = ?';
        const [guildResult] = await db.query(guildQuery, [name]);

        if (guildResult.length === 0) {
            return reply.code(404).send({ error: 'Guild not found' });
        }

        let members = JSON.parse(guildResult[0].members);

        // Check if user is in the guild
        const userIndex = members.findIndex(member => Number(member.userId) === Number(userId));
        if (userIndex === -1) {
            return reply.code(400).send({ error: 'User is not a member of this guild' });
        }

        const isAdmin = members[userIndex].role === "admin";

        // Remove user from the members list
        members.splice(userIndex, 1);

        if (members.length === 0) {
            // If no members left, delete the guild
            const deleteGuildQuery = 'DELETE FROM guilds WHERE name = ?';
            await db.query(deleteGuildQuery, [name]);
            
            // Remove guild association from user
            const updateUserQuery = 'UPDATE users SET guild = NULL WHERE id = ?';
            await db.query(updateUserQuery, [userId]);

            return reply.code(200).send({ message: 'Guild deleted as no members are left' });
        }

        if (isAdmin) {
            // If the leaving user is the last admin, assign a random member as admin
            const remainingAdmins = members.filter(member => member.role === "admin");

            if (remainingAdmins.length === 0) {
                const randomIndex = Math.floor(Math.random() * members.length);
                members[randomIndex].role = "admin";  // Assign admin role to a random member
            }
        }

        // Update guild members in the database
        const updateQuery = 'UPDATE guilds SET members = ? WHERE name = ?';
        await db.query(updateQuery, [JSON.stringify(members), name]);

        // Remove guild association from user
        const updateUserQuery = 'UPDATE users SET guild = NULL WHERE id = ?';
        await db.query(updateUserQuery, [userId]);

        reply.code(200).send({ message: 'User successfully left the guild' });

    } catch (error) {
        console.error('Error quitting guild:', error);
        reply.code(500).send({ error: 'Failed to quit the guild' });
    }
});


fastify.post('/handle-guild-request', async (request, reply) => {
    try {
        const { name, userId, username, action } = request.body; // Removed adminId from request body

        if (!name || !userId || !action) {
            return reply.code(400).send({ error: 'Guild name, userId, and action are required' });
        }

        // Fetch guild data
        const guildQuery = 'SELECT members, request_list FROM guilds WHERE name = ?';
        const [guildResult] = await db.query(guildQuery, [name]);

        if (guildResult.length === 0) {
            return reply.code(404).send({ error: 'Guild not found' });
        }

        let { members, request_list } = guildResult[0];
        members = JSON.parse(members);
        request_list = JSON.parse(request_list);

        // Find admin userId from members list
        const admin = members.find(member => member.role === "admin");
        if (!admin) {
            return reply.code(403).send({ error: 'No admin found in the guild' });
        }

        // Find user in request_list (now an array of objects)
        const requestIndex = request_list.findIndex(request => request.userId === userId);
        if (requestIndex === -1) {
            return reply.code(400).send({ error: 'User did not request to join this guild' });
        }

        if (action === "accept") {
            // Add user to members with default "player" role
            members.push({ userId, username, role: "player" });

            // Remove user from request list
            request_list.splice(requestIndex, 1);

            // Update guild name in users table
            const updateUserGuildQuery = 'UPDATE users SET guild = ? WHERE id = ?';
            await db.query(updateUserGuildQuery, [name, userId]);

            // Update guild members and request list
            const updateQuery = 'UPDATE guilds SET members = ?, request_list = ? WHERE name = ?';
            await db.query(updateQuery, [JSON.stringify(members), JSON.stringify(request_list), name]);

            return reply.code(200).send({ message: 'User successfully joined the guild' });
        } else if (action === "reject") {
            // Remove user from request list
            request_list.splice(requestIndex, 1);

            const updateQuery = 'UPDATE guilds SET request_list = ? WHERE name = ?';
            await db.query(updateQuery, [JSON.stringify(request_list), name]);

            return reply.code(200).send({ message: 'Join request rejected' });
        } else {
            return reply.code(400).send({ error: 'Invalid action. Use "accept" or "reject"' });
        }
    } catch (error) {
        console.error('Error handling guild request:', error);
        reply.code(500).send({ error: 'Failed to process request' });
    }
});

fastify.get('/guild-quests', async (request, reply) => {
    try {
        const [result] = await db.query("SELECT * FROM guild_quests");
        reply.send(result);
    } catch (error) {
        reply.code(500).send({ error: "Failed to fetch craftable items" });
    }
})

fastify.post('/select-guild-quest', async (request, reply) => {
    try {
      const { questId, userId, guildName } = request.body;
  
      if (!questId || !userId || !guildName) {
        return reply.code(400).send({ error: 'questId, userId, and guildName are required' });
      }
  
      // 1. Fetch guild data and check if the user is an admin
      const guildQuery = 'SELECT members, group_quests, guild_gems FROM guilds WHERE name = ?';
      const [guildResult] = await db.query(guildQuery, [guildName]);
  
      if (guildResult.length === 0) {
        return reply.code(404).send({ error: 'Guild not found' });
      }
  
      let { members, group_quests, guild_gems } = guildResult[0];
      members = JSON.parse(members);
      group_quests = JSON.parse(group_quests);
  
      // Check if the user is an admin
      const admin = members.find(member => member.userId === userId && member.role === 'admin');
  
      if (!admin) {
        return reply.code(403).send({ error: 'User is not an admin in this guild' });
      }
  
      // 2. Check if the questId exists in the guild_quests table
      const questCheckQuery = 'SELECT * FROM guild_quests WHERE id = ?';
      const [questCheckResult] = await db.query(questCheckQuery, [questId]);
  
      if (questCheckResult.length === 0) {
        return reply.code(404).send({ error: 'Quest not found' });
      }
  
      // 3. Check if the guild has enough gems for the quest
      if (guild_gems < questCheckResult[0].price) {
        return reply.code(400).send({ error: 'Not enough guild gems for this quest' });
      }
  
      // 4. Ensure that the quest is not already selected
      if (group_quests.some(quest => quest.id === questId)) {
        return reply.code(400).send({ error: 'Quest is already selected for the guild' });
      }
  
      // 5. Add the quest with the selected date to the group_quests
      const newQuest = { id: questId, selectedDate: new Date(), claimedMembers: [] };
      group_quests.push(newQuest);
  
      // Deduct the price of the quest from guild_gems
      const updatedGuildGems = guild_gems - questCheckResult[0].price;
  
      // 6. Update guild's group_quests and guild_gems columns
      const updateGuildQuery = 'UPDATE guilds SET group_quests = ?, guild_gems = ? WHERE name = ?';
      await db.query(updateGuildQuery, [JSON.stringify(group_quests), updatedGuildGems, guildName]);
  
      return reply.code(200).send({ message: 'Quest successfully added to the guild' });
    } catch (error) {
      console.error('Error handling select-guild-quest request:', error);
      return reply.code(500).send({ error: 'Failed to process request' });
    }
});

fastify.post('/calculate-total-completions', async (request, reply) => {
    try {
        const { groupQuestId, guildName } = request.body;
        if (!groupQuestId || !guildName) {
            return reply.code(400).send({ error: 'groupQuestId and guildName are required' });
        }
    
        // 1. Fetch guild data: group_quests and members
        const guildQuery = 'SELECT group_quests, members FROM guilds WHERE name = ?';
        const [guildResult] = await db.query(guildQuery, [guildName]);
        if (guildResult.length === 0) {
            return reply.code(404).send({ error: 'Guild not found' });
        }
        const groupQuests = JSON.parse(guildResult[0].group_quests || '[]');
        if (groupQuests.length === 0) {
            return reply.code(400).send({ error: 'No quests in the guild' });
        }
        const members = JSON.parse(guildResult[0].members || '[]');
        const guildMemberIds = members.map(member => member.userId);
    
        // 2. Find the specific group quest in the guild's group_quests array using groupQuestId
        const groupQuest = groupQuests.find(gq => gq.id === groupQuestId);
        if (!groupQuest) {
            return reply.code(404).send({ error: 'Group quest not found in guild records' });
        }
        const selectedAt = groupQuest.selectedDate;
        if (!selectedAt) {
            return reply.code(400).send({ error: 'Selected date missing for this group quest' });
        }
    
        // 3. Fetch the completion criteria for this quest from the guild_quests table
        const guildQuestQuery = 'SELECT completion_criteria FROM guild_quests WHERE id = ?';
        const [guildQuestResult] = await db.query(guildQuestQuery, [groupQuestId]);
        if (guildQuestResult.length === 0) {
            return reply.code(404).send({ error: 'Completion criteria not found for this quest' });
        }
        let completionCriteria = guildQuestResult[0].completion_criteria;
        if (typeof completionCriteria === 'string') {
            completionCriteria = JSON.parse(completionCriteria);
        }
        const { stat: requiredStat, quantity: requiredQuantity } = completionCriteria;
        if (!requiredStat || !requiredQuantity) {
            return reply.code(400).send({ error: 'Invalid completion criteria' });
        }

        const participantsQuery = `
            SELECT COUNT(*) AS completedCount
            FROM quest_participants qp
            JOIN quests q ON qp.quest_id = q.id
            WHERE qp.joined_at_datetime > ?
                AND qp.completed = 1
                AND qp.user_id IN (?)
                AND JSON_UNQUOTE(JSON_EXTRACT(q.stat_reward, CONCAT('$.', ?))) IS NOT NULL
        `;

        const [participantsResult] = await db.query(participantsQuery, [
            selectedAt,        // the date threshold for joined_at
            guildMemberIds,  // the list of guild member IDs
            requiredStat,    // again, for the JSON_EXTRACT check
        ]);

        const completedCount = participantsResult[0].completedCount;

        console.log(completedCount);
        
        // 7. Return the total valid completions and progress percentage
        return reply.code(200).send({completedCount});
    } catch (error) {
      console.error('Error calculating total completions:', error);
      return reply.code(500).send({ error: 'Failed to calculate total completions' });
    }
});

fastify.post('/finish-guild-quest', async (request, reply) => {
    const { questId, userId, guildName } = request.body;

    try {
        const completionDate = new Date().toISOString().split('T')[0];

        // Retrieve the quest's rewards including currency_reward
        const [quest] = await db.query(
            `SELECT experience_reward, item_reward, stat_reward, currency_reward FROM guild_quests WHERE id = ?`,
            [questId]
        );

        if (quest.length === 0) {
            return reply.code(404).send({ error: 'Quest not found.' });
        }

        const { experience_reward: experienceReward, item_reward: itemReward, stat_reward: statReward, currency_reward: currencyReward } = quest[0];

        // Update user's experience points
        if (experienceReward) {
            await db.query(
                `UPDATE users
                 SET experience = experience + ?
                 WHERE id = ?`,
                [experienceReward, userId]
            );
        }

        // Update user's stats if statReward exists
        if (statReward) {
            const statUpdates = JSON.parse(statReward);

            // Fetch current user stats
            const [user] = await db.query(
                `SELECT stats FROM users WHERE id = ?`,
                [userId]
            );
            let userStats = JSON.parse(user[0].stats || '{}');

            // Apply stat rewards
            for (let stat in statUpdates) {
                userStats[stat] = (userStats[stat] || 0) + statUpdates[stat];
            }

            // Save updated stats
            await db.query(
                `UPDATE users
                 SET stats = ?
                 WHERE id = ?`,
                [JSON.stringify(userStats), userId]
            );
        }

        // Increment into group_quests and add userId to claimedMembers
        const [guild] = await db.query(
            `SELECT group_quests, members, guild_gems FROM guilds WHERE name = ?`,
            [guildName]
        );

        if (guild.length === 0) {
            return reply.code(404).send({ error: 'Guild not found.' });
        }

        let groupQuests = JSON.parse(guild[0].group_quests || '{}');
        let members = JSON.parse(guild[0].members || '[]');
        let guildGems = guild[0].guild_gems;

        // Find the quest in the group_quests array based on questId
        const questToUpdate = groupQuests.find(q => q.id === questId);

        if (!questToUpdate) {
            return reply.code(404).send({ error: 'Quest not found in group quests.' });
        }

        // Ensure claimedMembers array exists
        if (!questToUpdate.claimedMembers) {
            questToUpdate.claimedMembers = [];
        }

        if (!questToUpdate.claimedMembers.includes(userId)) {
            questToUpdate.claimedMembers.push(userId);
        }

        // Check if all members have claimed the quest
        const allClaimed = members.every(member => 
            questToUpdate.claimedMembers.includes(member.userId)
        );

        if (allClaimed) {
            // Add the currency reward to the guild's gems
            if (currencyReward) {
                guildGems += currencyReward;
            }

            // Remove the quest from group_quests
            groupQuests = groupQuests.filter(q => q.id !== questId);
        }

        // Save the updated group_quests and guild_gems
        await db.query(
            `UPDATE guilds
             SET group_quests = ?, guild_gems = ?
             WHERE name = ?`,
            [JSON.stringify(groupQuests), guildGems, guildName]
        );

        reply.send({ 
            success: true, 
            message: allClaimed 
                ? 'All members claimed the quest. Quest removed from group quests and currency added to guild gems.' 
                : 'Quest marked as finished, rewards applied, and group quest updated.' 
        });

    } catch (err) {
        console.error('Error finishing quest:', err);
        reply.code(500).send({ error: 'Failed to mark quest as finished.' });
    }
});

fastify.post('/guild-upgrade', async (request, reply) => {
    const { guildName, upgradeType, userId } = request.body;  // Include userId in request

    if (!guildName || !upgradeType || !userId) {
        return reply.code(400).send({ message: "Missing required fields" });
    }

    const cost = 25;

    try {
        // ✅ Check if the user is an admin
        const [guild] = await db.query(`
            SELECT guild_gems, guild_upgrades, members 
            FROM guilds 
            WHERE name = ?
        `, [guildName]);

        if (guild.length === 0) {
            return reply.code(404).send({ message: "Guild not found" });
        }

        const { guild_gems, guild_upgrades, members } = guild[0];

        // ✅ Verify admin status
        const membersArray = JSON.parse(members);
        const user = membersArray.find(member => Number(member.userId) === Number(userId));

        if (!user || user.role !== "admin") {
            return reply.code(403).send({ message: "Only admins can upgrade the guild" });
        }

        // ✅ Parse upgrades or initialize as empty array
        let upgrades = [];
        try {
            upgrades = guild_upgrades ? JSON.parse(guild_upgrades) : [];
            
            // Ensure it's an array, reset to empty array if invalid
            if (!Array.isArray(upgrades)) {
                console.warn("Invalid format detected, resetting to empty array.");
                upgrades = [];
            }
        } catch (error) {
            console.error("Error parsing guild_upgrades:", error);
            upgrades = [];
        }

        // ✅ Check if the guild has enough currency
        if (guild_gems < cost) {
            return reply.code(400).send({ message: "Not enough currency" });
        }

        // ✅ Find existing upgrade
        const existingUpgrade = upgrades.find(upgrade => upgrade.type === upgradeType);

        if (existingUpgrade) {
            // Check if the upgrade is already at level 5
            if (existingUpgrade.level >= 5) {
                return reply.code(400).send({ message: "Upgrade is already at maximum level (5)" });
            }
            // Increment level if upgrade already exists and is not maxed out
            existingUpgrade.level += 1;
        } else {
            // Add new upgrade if it doesn't exist, starting at level 1
            upgrades.push({ type: upgradeType, level: 1 });
        }

        const newCurrency = guild_gems - cost;

        // ✅ Save the array of objects back to the database
        const upgradesJSON = JSON.stringify(upgrades);

        await db.query(`
            UPDATE guilds 
            SET guild_gems = ?, guild_upgrades = ? 
            WHERE name = ?
        `, [newCurrency, upgradesJSON, guildName]);

        reply.code(200).send({
            message: "Guild upgraded successfully",
            guildName,
            newCurrency,
            upgrades
        });

    } catch (error) {
        console.error("Error upgrading guild:", error);
        reply.code(500).send({ message: "Internal server error" });
    }
});

fastify.post('/donate-gold', async (request, reply) => {
    try {
        const { userId, guildName, amount } = request.body;

        if (!userId || !guildName || !amount || amount <= 0) {
            return reply.code(400).send({ error: 'User ID, guild name, and a valid donation amount are required' });
        }

        const conversionRate = 10000;

        // Fetch user data including the username
        const userQuery = 'SELECT username, currency FROM users WHERE id = ?';
        const [userResult] = await db.query(userQuery, [userId]);

        if (userResult.length === 0) {
            return reply.code(404).send({ error: 'User not found' });
        }

        const { username, currency } = userResult[0];

        // Check if the user has enough currency
        const updateUserCurrencyQuery = `
        UPDATE users 
        SET currency = currency - ? 
        WHERE id = ? AND currency >= ?`;
        const [updateResult] = await db.query(updateUserCurrencyQuery, [amount, userId, amount]);

        if (updateResult.affectedRows === 0) {
        return reply.code(400).send({ error: 'Insufficient currency to donate' });
        }


        // Fetch the current guild data, now including unconverted_gold
        const guildQuery = 'SELECT gold_collected, guild_gems, unconverted_gold FROM guilds WHERE name = ?';
        const [guildResult] = await db.query(guildQuery, [guildName]);

        if (guildResult.length === 0) {
            return reply.code(404).send({ error: 'Guild not found' });
        }

        let goldCollected = [];
        try {
            goldCollected = JSON.parse(guildResult[0].gold_collected) || [];
        } catch (error) {
            console.error('Error parsing gold_collected:', error);
        }

        let unconvertedGold = guildResult[0].unconverted_gold || 0;

        // Update or add donor info
        let existingDonor = goldCollected.find(d => d.userId === userId);
        if (existingDonor) {
            existingDonor.gold += amount;
        } else {
            goldCollected.push({ userId: userId, username: username, gold: amount });
        }

        // Add the newly donated amount to unconvertedGold
        unconvertedGold += amount;

        // Calculate how many new gems should be awarded
        const gemsToAdd = Math.floor(unconvertedGold / conversionRate);
        unconvertedGold = unconvertedGold % conversionRate;

        const totalGems = guildResult[0].guild_gems + gemsToAdd;

        // Update the guild with new data
        const updateGuildQuery = `
            UPDATE guilds 
            SET gold_collected = ?, guild_gems = ?, unconverted_gold = ?
            WHERE name = ?`;
        await db.query(updateGuildQuery, [JSON.stringify(goldCollected), totalGems, unconvertedGold, guildName]);

        reply.code(200).send({
            message: `Donation successful. ${gemsToAdd} gem(s) added.`,
            guild_gems: totalGems,
            remaining_gold: unconvertedGold
        });

    } catch (error) {
        console.error('Error donating gold:', error);
        reply.code(500).send({ error: 'Failed to donate gold' });
    }
});

fastify.get('/paths/free', async () => {
    const [rows] = await db.query(
      "SELECT * FROM paths"
    );
    return rows;
  });

  // Display a path
fastify.get('/path/:id', async (req) => {
    const [rows] = await db.query('SELECT * FROM paths WHERE id = ?', [req.params.id]);
    return rows[0];
});

  // Select a path
fastify.post('/paths/select', async (req) => {
    const date = new Date();
    const { userId, pathId } = req.body;
    const [existing] = await db.query(
      'SELECT * FROM path_participants WHERE user_id = ? AND path_id = ?', [userId, pathId]
    );

    if (existing.length) return { message: 'Already joined this path.' };

    await db.query('INSERT INTO path_participants (user_id, path_id, progress, joined_at) VALUES (?, ?, 0, ?)', [userId, pathId, date]);
    return { message: 'Path selected.' };
});

  // Quit a path
fastify.post('/path/quit', async (req) => {
    const { userId, path_id } = req.body;
    await db.query('DELETE FROM path_participants WHERE userId = ? AND path_id = ?', [userId, path_id]);
    return { message: 'Path quit successfully.' };
});

  // Check if current step is completed and reward
fastify.post('/paths/step/complete', async (req) => {
    const { userId, pathId } = req.body;

    const [[participant]] = await db.query(
      'SELECT * FROM path_participants WHERE user_id = ? AND path_id = ?',
      [userId, pathId]
    );
    if (!participant) return { error: 'Not participating in path.' };

    const [[path]] = await db.query('SELECT * FROM paths WHERE id = ?', [pathId]);
    const steps = JSON.parse(path.steps || '[]');
    const rewards = JSON.parse(path.rewards || '[]');

    const currentStep = steps[participant.progress];
    if (!currentStep) return { message: 'All steps completed!' };

    // Simulate completion
    const nextProgress = participant.progress + 1;
    await db.query('UPDATE path_participants SET progress = ? WHERE user_id = ? AND path_id = ?', [nextProgress, userId, pathId]);

    const reward = rewards[nextProgress - 1];
    return {
      message: 'Step completed.',
      rewardGiven: reward || {},
      nextStep: steps[nextProgress] || null
    };
});

  // Get active path and progress
fastify.get('/path/participant/:userId', async (req) => {
    const [rows] = await db.query(
      `SELECT pp.*, p.name, p.steps, p.rewards
       FROM path_participants pp
       JOIN paths p ON pp.path_id = p.id
       WHERE pp.userId = ?`,
      [req.params.userId]
    );

    return rows.map(row => ({
      ...row,
      steps: JSON.parse(row.steps),
      rewards: JSON.parse(row.rewards)
    }));
});

// In your Fastify route file (e.g. routes/paths.js or routes/index.js)
fastify.get('/paths/available', async (request, reply) => {
    const { userId } = request.query;
  
    if (!userId) {
      return reply.status(400).send({ error: 'Missing userId in query' });
    }
  
    try {
      const [takenPaths] = await db.query(
        `SELECT path_id FROM path_participants WHERE userId = ?`,
        [userId]
      );
  
      const takenPathIds = takenPaths.map(row => row.path_id);
  
      const placeholders = takenPathIds.map(() => '?').join(',');
      const [availablePaths] = takenPathIds.length > 0
        ? await db.query(
            `SELECT * FROM paths WHERE id NOT IN (${placeholders})`,
            takenPathIds
          )
        : await db.query(`SELECT * FROM paths`);
  
      reply.send(availablePaths);
    } catch (err) {
      console.error('Error fetching available paths:', err);
      reply.status(500).send({ error: 'Failed to fetch available paths' });
    }
});

fastify.get('/paths/active', async (request, reply) => {
    const { userId } = request.query;
  
    if (!userId) {
        return reply.status(400).send({ error: 'Missing userId in query' });
    }
  
    try {
        // Get all path_ids that the user is currently participating in
        const [participantRows] = await db.query(
            `SELECT * FROM path_participants WHERE user_id = ?`,
            [userId]
        );
    
        if (participantRows.length === 0) {
            return reply.send([]); // No active paths
        }
    
        const pathIds = participantRows.map(row => row.path_id);
        const placeholders = pathIds.map(() => '?').join(',');
    
        // Get full path data for those paths
        const [pathRows] = await db.query(
            `SELECT * FROM paths WHERE id IN (${placeholders})`,
            pathIds
        );
    
        // Merge progress/resumeTime from participantRows into each path
        const enrichedPaths = pathRows.map(path => {
            const participant = participantRows.find(p => p.path_id === path.id);
            return {
            ...path,
            progress: participant.progress,
            completed_at: participant.completed_at,
            resumeTime: participant.resumeTime,
            };
        });
    
        reply.send(enrichedPaths);
    } catch (err) {
      console.error('Error fetching active paths:', err);
      reply.status(500).send({ error: 'Failed to fetch active paths' });
    }
});
  
  


const start = async () => {
    try {
      await fastify.listen({ port: 3001 });
      console.log('✅ Backend running on HTTP at port 3001');
    } catch (err) {
      fastify.log.error(err);
      process.exit(1);
    }
};
  
start();


// fastify.listen(3001, () => {
//     console.log('✅ Backend running on HTTP at port 3001');
// });
