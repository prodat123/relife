const express = require('express');
// const session = require('express-session');
const app = express();
const bodyParser = require('body-parser');
const db = require('./db'); // Import the database connection
const cors = require('cors');
const bcrypt = require('bcryptjs');
const cron = require('node-cron');
const { v4: uuidv4 } = require('uuid'); // Import uuid to generate unique ids
const crypto = require('crypto-js');

require('dotenv').config();


app.use(cors());

app.use(bodyParser.json());
// app.use(bodyParser.urlencoded({ extended: true }));

// app.use(session({
//     secret: process.env.SECRET_KEY,
//     resave: false,
//     saveUninitialized: false,
//     cookie: {
//         secure: true,            // Set to true for HTTPS
//         httpOnly: true,
//         maxAge: 8 * 60 * 60 * 1000  // 8 hours
//     }
// }));

app.post('/auth/signup', async (req, res) => {
    const { username, password, email, age, recaptchaToken } = req.body;

    const defaultStats = JSON.stringify({
        strength: 1,
        bravery: 1,
        intelligence: 1,
        endurance: 1,
    });

    if (recaptchaToken.length < 40) {
        return res.status(400).json({ message: 'reCAPTCHA token is missing' });
    }

    try {
        const [result] = await db.query('SELECT * FROM users WHERE username = ?', [username]);
        if (result.length > 0) {
            return res.status(400).json({ message: 'Username already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const joinedAt = new Date().toISOString().slice(0, 10);

        await db.query(
            'INSERT INTO users (username, email, age, password, experience, level, stats, joined_at, head, torso, legs, feet) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [username, email, age, hashedPassword, 0, 1, defaultStats, joinedAt, '', '', '', '']
        );

        res.status(201).json({ message: 'User created successfully', username });
    } catch (error) {
        console.error('Error during signup:', error);
        res.status(500).json({ message: 'Error signing up' });
    }
});


app.post('/auth/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        // Check if the user exists
        const [result] = await db.query('SELECT * FROM users WHERE username = ?', [username]);
        if (result.length === 0) {
            return res.status(400).json({ message: 'User not found' });
        }

        const user = result[0];

        // Compare the hashed password
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        res.status(200).json({
            message: 'Login successful',
            id: user.id,
            username: user.username,
            experience: user.experience,
            level: user.level,
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
        res.status(500).json({ message: 'Error logging in' });
    }
});

app.get("/user", async (req, res) => {
    try {
        // Convert userId to an integer
        const userId = parseInt(req.query.userId, 10);
        console.log("User ID received:", userId);

        // Validate userId
        if (isNaN(userId)) {
            return res.status(400).json({ error: "Invalid User ID. It must be an integer." });
        }

        // Query to fetch user
        const query = "SELECT * FROM users WHERE id = ?";
        
        // Wrap the query in a Promise for async/await support
        const results = await db.query(query, [userId]);

        // Check if user exists
        if (results.length === 0) {
            return res.status(404).json({ error: "User not found" });
        }
        res.status(200).json({ user: results[0] });
    } catch (error) {
        console.error("Error fetching user:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
});

// Logout Route
app.post('/auth/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ message: 'Error logging out' });
        }
        res.status(200).json({ message: 'Logout successful' });
    });
});

const insertDailyQuests = async () => {
    const deleteQuery = `
        DELETE FROM daily_quests WHERE date < CURDATE();
    `;

    const insertQuery = `
        INSERT INTO daily_quests (date, quest_id)
        SELECT CURDATE(), id
        FROM (
            SELECT DISTINCT id
            FROM (
                -- Difficulty 1-5 (Existing)
                SELECT id FROM (SELECT id FROM quests WHERE type = 'daily' AND difficulty = 1 AND JSON_EXTRACT(stat_reward, '$.strength') IS NOT NULL ORDER BY RAND() LIMIT 2) AS subquery1
                UNION ALL
                SELECT id FROM (SELECT id FROM quests WHERE type = 'daily' AND difficulty = 1 AND JSON_EXTRACT(stat_reward, '$.bravery') IS NOT NULL ORDER BY RAND() LIMIT 2) AS subquery2
                UNION ALL
                SELECT id FROM (SELECT id FROM quests WHERE type = 'daily' AND difficulty = 1 AND JSON_EXTRACT(stat_reward, '$.intelligence') IS NOT NULL ORDER BY RAND() LIMIT 2) AS subquery3
                UNION ALL
                SELECT id FROM (SELECT id FROM quests WHERE type = 'daily' AND difficulty = 1 AND JSON_EXTRACT(stat_reward, '$.endurance') IS NOT NULL ORDER BY RAND() LIMIT 2) AS subquery4
                UNION ALL
                SELECT id FROM (SELECT id FROM quests WHERE type = 'daily' AND difficulty = 1 ORDER BY RAND() LIMIT 2) AS subquery5
                UNION ALL
                SELECT id FROM (SELECT id FROM quests WHERE type = 'daily' AND difficulty = 2 AND JSON_EXTRACT(stat_reward, '$.strength') IS NOT NULL ORDER BY RAND() LIMIT 1) AS subquery6
                UNION ALL
                SELECT id FROM (SELECT id FROM quests WHERE type = 'daily' AND difficulty = 2 AND JSON_EXTRACT(stat_reward, '$.bravery') IS NOT NULL ORDER BY RAND() LIMIT 1) AS subquery7
                UNION ALL
                SELECT id FROM (SELECT id FROM quests WHERE type = 'daily' AND difficulty = 2 AND JSON_EXTRACT(stat_reward, '$.intelligence') IS NOT NULL ORDER BY RAND() LIMIT 1) AS subquery8
                UNION ALL
                SELECT id FROM (SELECT id FROM quests WHERE type = 'daily' AND difficulty = 2 AND JSON_EXTRACT(stat_reward, '$.endurance') IS NOT NULL ORDER BY RAND() LIMIT 1) AS subquery9
                UNION ALL
                SELECT id FROM (SELECT id FROM quests WHERE type = 'daily' AND difficulty = 2 ORDER BY RAND() LIMIT 2) AS subquery10
                UNION ALL
                SELECT id FROM (SELECT id FROM quests WHERE type = 'daily' AND difficulty IN (3,4,5) AND JSON_EXTRACT(stat_reward, '$.strength') IS NOT NULL ORDER BY RAND() LIMIT 3) AS subquery11
                UNION ALL
                SELECT id FROM (SELECT id FROM quests WHERE type = 'daily' AND difficulty IN (3,4,5) AND JSON_EXTRACT(stat_reward, '$.bravery') IS NOT NULL ORDER BY RAND() LIMIT 3) AS subquery12
                UNION ALL
                SELECT id FROM (SELECT id FROM quests WHERE type = 'daily' AND difficulty IN (3,4,5) AND JSON_EXTRACT(stat_reward, '$.intelligence') IS NOT NULL ORDER BY RAND() LIMIT 3) AS subquery13
                UNION ALL
                SELECT id FROM (SELECT id FROM quests WHERE type = 'daily' AND difficulty IN (3,4,5) AND JSON_EXTRACT(stat_reward, '$.endurance') IS NOT NULL ORDER BY RAND() LIMIT 3) AS subquery14
                UNION ALL
                SELECT id FROM (SELECT id FROM quests WHERE type = 'daily' AND difficulty IN (3,4,5) ORDER BY RAND() LIMIT 6) AS subquery15

                -- Difficulty 6-8
                UNION ALL
                SELECT id FROM (SELECT id FROM quests WHERE type = 'daily' AND difficulty IN (6,7,8) AND JSON_EXTRACT(stat_reward, '$.strength') IS NOT NULL ORDER BY RAND() LIMIT 3) AS subquery16
                UNION ALL
                SELECT id FROM (SELECT id FROM quests WHERE type = 'daily' AND difficulty IN (6,7,8) AND JSON_EXTRACT(stat_reward, '$.bravery') IS NOT NULL ORDER BY RAND() LIMIT 3) AS subquery17
                UNION ALL
                SELECT id FROM (SELECT id FROM quests WHERE type = 'daily' AND difficulty IN (6,7,8) AND JSON_EXTRACT(stat_reward, '$.intelligence') IS NOT NULL ORDER BY RAND() LIMIT 3) AS subquery18
                UNION ALL
                SELECT id FROM (SELECT id FROM quests WHERE type = 'daily' AND difficulty IN (6,7,8) AND JSON_EXTRACT(stat_reward, '$.endurance') IS NOT NULL ORDER BY RAND() LIMIT 3) AS subquery19
                UNION ALL
                SELECT id FROM (SELECT id FROM quests WHERE type = 'daily' AND difficulty IN (6,7,8) ORDER BY RAND() LIMIT 6) AS subquery20

                -- Difficulty 9-10
                UNION ALL
                SELECT id FROM (SELECT id FROM quests WHERE type = 'daily' AND difficulty IN (9,10) AND JSON_EXTRACT(stat_reward, '$.strength') IS NOT NULL ORDER BY RAND() LIMIT 4) AS subquery21
                UNION ALL
                SELECT id FROM (SELECT id FROM quests WHERE type = 'daily' AND difficulty IN (9,10) AND JSON_EXTRACT(stat_reward, '$.bravery') IS NOT NULL ORDER BY RAND() LIMIT 4) AS subquery22
                UNION ALL
                SELECT id FROM (SELECT id FROM quests WHERE type = 'daily' AND difficulty IN (9,10) AND JSON_EXTRACT(stat_reward, '$.intelligence') IS NOT NULL ORDER BY RAND() LIMIT 4) AS subquery23
                UNION ALL
                SELECT id FROM (SELECT id FROM quests WHERE type = 'daily' AND difficulty IN (9,10) AND JSON_EXTRACT(stat_reward, '$.endurance') IS NOT NULL ORDER BY RAND() LIMIT 4) AS subquery24
                UNION ALL
                SELECT id FROM (SELECT id FROM quests WHERE type = 'daily' AND difficulty IN (9,10) ORDER BY RAND() LIMIT 8) AS subquery25

                -- Difficulty 11-12 (Most difficult, select the most challenging quests)
                UNION ALL
                SELECT id FROM (SELECT id FROM quests WHERE type = 'daily' AND difficulty IN (11,12) AND JSON_EXTRACT(stat_reward, '$.strength') IS NOT NULL ORDER BY RAND() LIMIT 5) AS subquery26
                UNION ALL
                SELECT id FROM (SELECT id FROM quests WHERE type = 'daily' AND difficulty IN (11,12) AND JSON_EXTRACT(stat_reward, '$.bravery') IS NOT NULL ORDER BY RAND() LIMIT 5) AS subquery27
                UNION ALL
                SELECT id FROM (SELECT id FROM quests WHERE type = 'daily' AND difficulty IN (11,12) AND JSON_EXTRACT(stat_reward, '$.intelligence') IS NOT NULL ORDER BY RAND() LIMIT 5) AS subquery28
                UNION ALL
                SELECT id FROM (SELECT id FROM quests WHERE type = 'daily' AND difficulty IN (11,12) AND JSON_EXTRACT(stat_reward, '$.endurance') IS NOT NULL ORDER BY RAND() LIMIT 5) AS subquery29
                UNION ALL
                SELECT id FROM (SELECT id FROM quests WHERE type = 'daily' AND difficulty IN (11,12) ORDER BY RAND() LIMIT 10) AS subquery30
            ) AS selected_quests
        ) AS final_quests
        WHERE id NOT IN (
            SELECT quest_id FROM daily_quests WHERE date = CURDATE()
        );
    `;



    try {
        // Delete previous daily quests before the current date
        await db.query(deleteQuery);
        console.log('Successfully removed previous daily quests.');

        // Insert new daily quests
        const [results] = await db.query(insertQuery);
        console.log('Successfully inserted daily quests:', results);
    } catch (err) {
        console.error('SQL Error:', err.message);
    }
};

const clearCompletedQuestParticipants = async () => {
    const query = `DELETE FROM quest_participants WHERE completed = 0;`;

    try {
        const [results] = await db.query(query);
        console.log('Successfully cleared completed quest participants:', results);
    } catch (err) {
        console.error('SQL Error (clearCompletedQuestParticipants):', err.message);
    }
};

const checkAndUpdateVows = async () => {
    try {
        console.log("Checking for overdue vows...");

        // Get all active vows from the database
        const [vows] = await db.query('SELECT * FROM vows WHERE status = "active"');

        // Get the current date in YYYY-MM-DD format
        const currentDate = new Date().toISOString().split('T')[0];

        for (const vow of vows) {
            const vowDeadline = new Date(vow.deadline);
            vowDeadline.setDate(vowDeadline.getDate()); // Add 1 day to match moment.js behavior

            // Convert to YYYY-MM-DD format for comparison
            const vowDeadlineFormatted = vowDeadline.toISOString().split('T')[0];

            if (currentDate > vowDeadlineFormatted) {
                // Deadline passed, mark vow as incomplete
                await db.query('UPDATE vows SET status = "incomplete" WHERE id = ?', [vow.id]);

                console.log(`Vow ID ${vow.id} marked as incomplete.`);

                // Fetch user stats from the users table
                const [userRows] = await db.query('SELECT stats FROM users WHERE id = ?', [vow.created_by]);

                if (userRows.length > 0) {
                    let userStats = JSON.parse(userRows[0].stat);
                    let statRewards = JSON.parse(vow.stat_reward);

                    // Subtract the stat rewards from user stats
                    for (const stat in statRewards) {
                        if (userStats[stat] !== undefined) {
                            userStats[stat] = Math.max(0, userStats[stat] - (statRewards[stat] * 2)); // Ensure no negative values
                        }
                    }

                    // Update the user's stats in the database
                    await db.query('UPDATE users SET stats = ? WHERE id = ?', [JSON.stringify(userStats), vow.created_by]);

                    console.log(`User ID ${vow.created_by} stats updated.`);
                }
            }
        }

        console.log("Vow check complete.");
    } catch (error) {
        console.error("Error processing vows:", error);
    }
};



cron.schedule('0 0 * * *', async () => { 
    console.log(`[${new Date().toISOString()}] Running daily quest insertion...`);
    await clearCompletedQuestParticipants();
    await insertDailyQuests();
    await checkAndUpdateVows();
}, {
    scheduled: true,
    timezone: 'America/Los_Angeles' // California Timezone
});

// cron.schedule('0 */6 * * *', async () => {
//     try {
//         console.log('Resetting discounts and spin timestamps...');
//         await db.query(
//             `UPDATE users
//              SET discount = NULL`
//         );
//         console.log('Discounts and timestamps reset successfully.');
//     } catch (err) {
//         console.error('Error resetting discounts:', err.message, err.stack);
//     }
// });

// Get quests by type
app.get('/quests', async (req, res) => {
    try {
        const [ quests ] = await db.query('SELECT * FROM quests');
        res.json(quests);
    } catch (error) {
        console.error('Error fetching quests:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

app.get('/quest/:id', async (req, res) => {
    try {
        const { id } = req.query;
        const [ quests ] = await db.query('SELECT * FROM quests WHERE id = ?', [id]);
        res.json(quests);
    } catch (error) {
        console.error('Error fetching quests:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

app.post('/quests/select', async (req, res) => {
    const { questId, userId, currentDate } = req.body;

    if (!questId || !userId) {
        return res.status(400).json({ error: 'Quest ID and User ID are required' });
    }

    try {
        // Check if the user exists in the users table
        const [userExists] = await db.query('SELECT id FROM users WHERE id = ?', [userId]);

        if (userExists.length === 0) {
            return res.status(400).json({ error: 'User does not exist' });
        }

        // Check if the user is already in the participants table for this quest
        const [existingParticipant] = await db.query(
            'SELECT * FROM quest_participants WHERE quest_id = ? AND user_id = ?',
            [questId, userId]
        );

        const now = new Date();
        const expiredAt = new Date(now.getTime() + 28800 * 1000);

        // Calculate expired_at (8 hours after joined_at)
        // const expiredAt = new Date(new Date(currentDate).getTime() + 8 * 60 * 60 * 1000);

        if (existingParticipant.length > 0) {
            if (existingParticipant[0].progress === 'Started') {
                return res.status(200).json({ message: 'Quest already started by this user' });
            }

            // Update progress to 'Started' and set joined_at & expired_at
            await db.query(
                'UPDATE quest_participants SET progress = ?, joined_at = ?, expired_at = ?, completed = ? WHERE id = ?',
                ['Started', currentDate, expiredAt, false, existingParticipant[0].id]
            );

            return res.status(200).json({ message: 'Quest progress updated to Started' });
        }

        // If user is not a participant, add them to the quest
        await db.query(
            'INSERT INTO quest_participants (quest_id, user_id, progress, completed, joined_at, expired_at, completed_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [questId, userId, 'Started', false, currentDate, expiredAt, null]
        );

        res.status(201).json({ message: 'User added as participant with progress Started' });

    } catch (error) {
        console.error('Error selecting quest:', error);
        res.status(500).json({ error: 'An error occurred while selecting the quest.' });
    }
});


app.post('/quests/remove', async (req, res) => {
    const { questId, userId } = req.body;

    // const decryptedUserId = decryptUserId(userId);
    if (!questId || !userId) {
        return res.status(400).json({ error: 'Quest ID and User ID are required' });
    }

    try {
        // Check if the user is already a participant
        const [existingParticipant] = await db.query(
            'SELECT * FROM quest_participants WHERE quest_id = ? AND user_id = ?',
            [questId, userId]
        );

        if (existingParticipant.length === 0) {
            return res.status(400).json({ error: 'You have not selected this quest' });
        }

        // Remove the user from the quest participants table
        await db.query(
            'DELETE FROM quest_participants WHERE quest_id = ? AND user_id = ?',
            [questId, userId]
        );

        res.status(200).json({ message: 'Quest removed successfully' });

    } catch (error) {
        console.error('Error removing quest:', error);
        res.status(500).json({ error: 'An error occurred while removing the quest' });
    }
});

// Fetch quests the user is participating in
app.get('/quests/active', async (req, res) => {
    const { userId } = req.query;
    // const decryptedUserId = decryptUserId(userId);

    if (!userId) {
        return res.status(400).json({ error: 'User ID is required' });
    }

    const now = new Date().toISOString().slice(0, 19).replace("T", " ");

    try {
        const [activeQuests] = await db.query(
            `SELECT qp.quest_id, qp.progress, qp.completed, qp.joined_at, qp.expired_at, q.* 
             FROM quest_participants qp
             INNER JOIN quests q ON qp.quest_id = q.id
             WHERE qp.user_id = ? 
               AND (qp.completed = 0 OR ? < qp.expired_at)`,
            [userId, now]
        );
        

        console.log(activeQuests);
        res.status(200).json(activeQuests);
    } catch (error) {
        console.error('Error fetching active quests:', error);
        res.status(500).json({ error: 'An error occurred while fetching active quests' });
    }
});

app.get('/quests/filled-slots/:userId', async (req, res) => {
    const { userId } = req.params;

    const now = new Date().toISOString().slice(0, 19).replace("T", " ");

    if (!userId) {
        return res.status(400).json({ error: 'User ID is required' });
    }

    try {
        // Query to count active quests where expired_at > NOW()
        const [result] = await db.query(
            'SELECT COUNT(*) AS activeQuests FROM quest_participants WHERE user_id = ? AND ? < expired_at',
            [userId, now]
        );

        res.status(200).json({ activeQuests: result[0].activeQuests });

    } catch (error) {
        console.error('Error fetching active quests:', error);
        res.status(500).json({ error: 'An error occurred while retrieving active quests.' });
    }
});


// Fetch completed quests the user has participated in
app.get('/quests/completed', async (req, res) => {
    const { userId } = req.query;

    // Validate if the user ID is provided
    if (!userId) {
        return res.status(400).json({ error: 'User ID is required' });
    }

    try {

        
        // Get the current date (formatted as 'YYYY-MM-DD')
        const currentDate = new Date().toLocaleDateString('en-CA');  // 'YYYY-MM-DD'
        // Query to fetch completed quests for the given user where completed = true and completed_at is today
        const [completedQuests] = await db.query(
            `SELECT qp.quest_id, qp.progress, qp.completed, qp.joined_at, q.name, q.description, qp.completed_at 
             FROM quest_participants qp
             INNER JOIN quests q ON qp.quest_id = q.id
             WHERE qp.user_id = ? AND qp.completed = 1 AND qp.completed_at = ?`,
            [userId, currentDate]  // Use the currentDate for filtering
        );
        // Return the completed quests
        res.status(200).json(completedQuests);
    } catch (error) {
        // Handle errors
        console.error('Error fetching completed quests:', error);
        res.status(500).json({ error: 'An error occurred while fetching completed quests' });
    }
});

app.post('/quests/finish', async (req, res) => {
    const { questId, userId } = req.body;

    try {

        const completionDate = new Date().toISOString().split('T')[0];

        // Check if the quest is already completed today
        const [existing] = await db.query(
            `SELECT * FROM quest_participants WHERE quest_id = ? AND user_id = ? AND completed = 1 AND completed_at = ?`,
            [questId, userId, completionDate]
        );
        if (existing.length > 0) {
            return res.status(400).json({ error: 'Quest already completed today.' });
        }

        // Retrieve the quest's rewards (experience, item, and stat rewards)
        const [quest] = await db.query(
            `SELECT experience_reward, item_reward, stat_reward FROM quests WHERE id = ?`,
            [questId]
        );
        if (quest.length === 0) {
            return res.status(404).json({ error: 'Quest not found.' });
        }

        const { experience_reward: experienceReward, item_reward: itemReward, stat_reward: statReward } = quest[0];

        // Mark quest as completed
        await db.query(
            `UPDATE quest_participants
             SET completed = 1, completed_at = ?
             WHERE quest_id = ? AND user_id = ?`,
            [completionDate, questId, userId]
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

        // Update user's inventory if an item reward exists
        // Update user's inventory if an item reward exists (30% chance)
        // if (itemReward) { // 30% chance
        //     // Fetch current inventory
        //     const [user] = await db.query(
        //         `SELECT inventory FROM users WHERE id = ?`,
        //         [userId]
        //     );
        //     let inventory = [];

        //     try {
        //         inventory = JSON.parse(user[0].inventory) || []; // Parse inventory safely
        //     } catch (error) {
        //         console.error("Error parsing inventory JSON:", error);
        //         inventory = []; // Default to empty array if parsing fails
        //     }

        //     // Fetch the item details from the `items` table
        //     const [itemDetails] = await db.query(
        //         `SELECT id, name FROM items WHERE id = ?`,
        //         [itemReward]
        //     );
        //     if (itemDetails.length === 0) {
        //         return res.status(404).json({ error: 'Reward item not found.' });
        //     }

        //     const item = itemDetails[0];

        //     // Check if the item already exists in the inventory
        //     let inventoryItem = inventory.find(invItem => invItem.id === item.id);

        //     if (inventoryItem) {
        //         inventoryItem.quantity = (inventoryItem.quantity || 0) + 1; // Ensure quantity exists before incrementing
        //     } else {
        //         inventory.push({ id: item.id, name: item.name, quantity: 1 }); // Add new item with quantity 1
        //     }

        //     // Save the updated inventory
        //     await db.query(
        //         `UPDATE users
        //         SET inventory = ?
        //         WHERE id = ?`,
        //         [JSON.stringify(inventory), userId]
        //     );

        //     console.log("Updated Inventory:", inventory); // Debugging: Check what is being saved
        // }


        res.json({ success: true, message: 'Quest marked as finished and rewards applied.' });
    } catch (err) {
        console.error('Error finishing quest:', err);
        res.status(500).json({ error: 'Failed to mark quest as finished.' });
    }
});

app.get('/quests/daily', async (req, res) => {
    try {
        // Set timezone to Pacific Time (PST/PDT)
        await db.query("SET time_zone = '-08:00';"); // Pacific Standard Time (PST, UTC-8)

        // Fetch today's quests
        const query = `
            SELECT q.id, q.name, q.description, q.difficulty, q.experience_reward, q.item_reward, q.stat_reward
            FROM quests q
            INNER JOIN daily_quests dq ON q.id = dq.quest_id;
        `;

        const [results] = await db.query(query);

        // Debug Timezone
        const [timeResult] = await db.query("SELECT NOW() AS server_time, CURDATE() AS server_date;");
        console.log('Server Time:', timeResult[0]?.server_time);
        console.log('Server Date:', timeResult[0]?.server_date);

        if (!results || results.length === 0) {
            console.log('No quests found for today.');
            return res.status(404).json({ message: 'No daily quests found' });
        }

        res.json(results);
    } catch (err) {
        console.error('Error fetching daily quests:', err.message);
        res.status(500).json({ message: 'Internal Server Error', error: err.message });
    }
});

app.get('/account', async (req, res) => {
    const { userId } = req.query;

    if (!userId) {
        return res.status(400).json({ error: 'User ID is required' });
    }

    try {
        // Fetch the user's account data
        const [userResults] = await db.query(
            'SELECT * FROM users WHERE id = ?',
            [userId]
        );

        if (userResults.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        const user = userResults[0];

        // Log the user data for debugging
        // console.log("Fetched User Data:", user);

        // Parse inventory from the user's data (stored as a JSON string)
        const inventoryItems = user.inventory ? JSON.parse(user.inventory) : [];

        // Log the parsed inventory for debugging
        // console.log("Parsed Inventory Items:", inventoryItems);

        // Provide default placeholders for missing slots based on the inventory directly
        const equipment = {
            head: user.head && inventoryItems.find(item => item.id === String(user.head)) || { id: '', name: 'None', type: 'head' },
            torso: user.torso && inventoryItems.find(item => item.id === String(user.torso)) || { id: '', name: 'None', type: 'torso' },
            legs: user.legs && inventoryItems.find(item => item.id === String(user.legs)) || { id: '', name: 'None', type: 'legs' },
            feet: user.feet && inventoryItems.find(item => item.id === String(user.feet)) || { id: '', name: 'None', type: 'feet' },
            weapon: user.weapon && inventoryItems.find(item => item.id === String(user.weapon)) || { id: '', name: 'None', type: 'weapon' },
        };

        // Log the equipment data for debugging
        // console.log("Mapped Equipment Data:", equipment);

        // Send the response with user data, inventory, and equipment
        res.status(200).json({
            username: user.username,
            experience: user.experience,
            level: user.level,
            stats: JSON.parse(user.stats || '{}'),
            equipment,
            inventory: inventoryItems, // Send inventory directly from the user's data
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
        });
    } catch (error) {
        console.error('Error fetching account data:', error.message);
        res.status(500).json({ error: 'Failed to fetch account data' });
    }
});

app.get('/monster', async (req, res) => {
    const { monsterName } = req.query;

    if (!monsterName) {
        return res.status(400).json({ error: 'Monster name is required' });
    }

    try {
        // Fetch the user's account data
        const [monsterResults] = await db.query(
            'SELECT * FROM monsters WHERE name = ?',
            [monsterName]
        );

        if (monsterResults.length === 0) {
            return res.status(404).json({ error: 'Monster not found' });
        }

        const monsterResult = monsterResults[0];

        // Log the equipment data for debugging
        // console.log("Mapped Equipment Data:", equipment);

        // Send the response with user data, inventory, and equipment
        res.status(200).json(monsterResult);
    } catch (error) {
        console.error('Error fetching monster data:', error.message);
        res.status(500).json({ error: 'Failed to fetch monster data' });
    }
});

app.get('/allMonsters', async (req, res) => {
    try {
        // Fetch the user's account data
        const [monsterResults] = await db.query(
            'SELECT * FROM monsters'
        );

        if (monsterResults.length === 0) {
            return res.status(404).json({ error: 'Monster not found' });
        }

        // const monsterResult = monsterResults[0];

        // Log the equipment data for debugging
        // console.log("Mapped Equipment Data:", equipment);

        // Send the response with user data, inventory, and equipment
        res.status(200).json(monsterResults);
    } catch (error) {
        console.error('Error fetching monster data:', error.message);
        res.status(500).json({ error: 'Failed to fetch monster data' });
    }
});

app.get('/leaderboard', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 5000;
        const offset = (page - 1) * limit;

        const [ users ] = await db.query(`
            SELECT id, username, experience, level 
            FROM users 
            ORDER BY experience DESC 
            LIMIT ? OFFSET ?
        `, [limit, offset]);

        const [ total ] = await db.query('SELECT COUNT(*) as count FROM users');

        res.json({
            users,
            currentPage: page,
            totalPages: Math.ceil(total[0].count / limit),
            totalUsers: total[0].count
        });
    } catch (error) {
        console.error('Error fetching leaderboard:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

app.post('/update-equipment', async (req, res) => {
    const { userId, slot, itemId, inventory } = req.body;
    // console.log(userId, slot, itemId, inventory);

    // Validate required fields
    if (!userId || !slot || !inventory) {
        return res.status(400).json({ error: 'Missing required fields: userId, slot, or inventory' });
    }

    // Validate slot
    const validSlots = ['head', 'torso', 'legs', 'feet', 'weapon'];
    if (!validSlots.includes(slot)) {
        return res.status(400).json({ error: 'Invalid slot specified' });
    }

    try {
        // Fetch user data
        const [userResult] = await db.query(
            `SELECT stats, ?? AS equippedItem FROM users WHERE id = ?`,
            [slot, userId]
        );

        if (userResult.length === 0) {
            return res.status(404).json({ error: 'User not found' });
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

            return res.status(200).json({ 
                message: 'Item unequipped successfully', 
                // updatedStats: userStats 
            });
        }

        // ⚙️ Handle Equip Logic
        console.log("Equipping new item");

        const newItem = inventory.find(item => item.id === itemId);
        if (!newItem) {
            return res.status(404).json({ error: 'Item not found in inventory' });
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

        res.status(200).json({ 
            message: 'Item equipped successfully', 
            // updatedStats: userStats 
        });

    } catch (error) {
        console.error('Error updating equipment and stats:', error.message);
        res.status(500).json({ error: 'Failed to update equipment and stats' });
    }
});


app.get('/items/:itemName', async (req, res) => {
    const { itemName } = req.params;  // Get the itemId from the request parameter

    try {
        // Query to fetch the item from the database
        const results = await db.query('SELECT * FROM items WHERE name = ?', [itemName]);

        if (results.length > 0) {
            res.json(results[0]);  // Return the item as JSON if found
        } else {
            res.status(404).json({ error: 'Item not found' });  // Item not found
        }
    } catch (error) {
        console.error('Error fetching item:', error);
        res.status(500).json({ error: 'Database error' });
    }
});

const generateRandomInt = () => {
    return Math.floor(Math.random() * 1e9); // Generates a random number between 0 and 1 billion
};

app.post('/level-up-item', async (req, res) => {
    const { userId, itemId, braveryStat } = req.body;

    // Validate request parameters
    if (!userId || !itemId || braveryStat === undefined) {
        return res.status(400).json({ error: 'Invalid request parameters.' });
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
            return res.status(404).json({ error: 'Base item not found.' });
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
            return res.status(404).json({ error: 'User not found.' });
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
            return res.status(400).json({ error: 'You need at least two of the same item to upgrade.' });
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

        res.json({
            success: true,
            message: `You have successfully leveled up the item and added it to your inventory.`,
            updatedInventory,
            newItem,
        });
    } catch (err) {
        console.error('Error leveling up item:', err.message, err.stack);
        res.status(500).json({ error: 'Failed to level up item.' });
    }
});


app.get("/stages", async (req, res) => {
    try {
      const [results] = await db.query("SELECT * FROM stages");
      res.json(results);
    } catch (error) {
      console.error("Error fetching stages:", error);
      res.status(500).json({ error: "Failed to fetch stages" });
    }
});

app.post("/add-currency", async (req, res) => {
    const { uid, reward } = req.body;

    // Check for missing parameters
    if (uid === undefined || reward === undefined) {
        return res.status(400).json({ error: "Missing parameters." });
    }

    // If reward is 0, skip the update and respond with a success message
    if (reward === 0) {
        return res.status(200).json({ message: "No currency added as reward is 0." });
    }

    try {
        const query = "UPDATE users SET currency = currency + ? WHERE id = ?";
        const [result] = await db.query(query, [reward, uid]);

        if (result.affectedRows > 0) {
            return res.status(200).json({ message: "Currency added successfully!" });
        } else {
            return res.status(404).json({ error: "User not found." });
        }
    } catch (error) {
        console.error("Error updating currency_reward:", error);
        return res.status(500).json({ error: "Internal server error." });
    }
});

app.get('/shop/items', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit, 10) || 100;
        const offset = parseInt(req.query.offset, 10) || 0;

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

        res.json(items);
    } catch (error) {
        console.error('Error fetching shop items:', error);
        res.status(500).json({ error: 'Failed to fetch shop items.' });
    }
});

app.post('/shop/buy', async (req, res) => {
    const { userId, itemId, price: discountedPrice, isGacha } = req.body;

    // Validate request parameters
    if (!userId || !itemId || discountedPrice === undefined) {
        return res.status(400).json({ error: 'Invalid request parameters.' });
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
            return res.status(404).json({ error: 'Item not found.' });
        }

        const { price, stats, ...item } = itemDetails[0];

        // If it's a Gacha roll, use a fixed price of 50
        const finalPrice = isGacha ? 50 : discountedPrice;

        // Validate discounted price
        const calculatedDiscountedPrice = Math.max(
            Math.floor(price * (1 - (req.body.discount / 100 || 0))),
            1
        );

        if (!isGacha && discountedPrice !== calculatedDiscountedPrice) {
            return res.status(400).json({ error: 'Invalid discounted price.' });
        }

        // Fetch user details
        const [user] = await db.query(
            `SELECT currency, inventory FROM users WHERE id = ?`,
            [userId]
        );
        if (user.length === 0) {
            return res.status(404).json({ error: 'User not found.' });
        }

        let { currency, inventory } = user[0];
        inventory = JSON.parse(inventory || '[]'); // Ensure inventory is an array

        // Check if user has enough currency
        if (currency < finalPrice) {
            return res.status(400).json({ error: 'Not enough currency.' });
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

        res.json({
            success: true,
            message: `You have successfully purchased the ${item.name}.`,
            updatedCurrency: currency,
            updatedInventory: inventory,
        });
    } catch (err) {
        console.error('Error purchasing item:', err.message, err.stack);
        res.status(500).json({ error: 'Failed to purchase item.' });
    }
});

app.get('/shop/spells', async (req, res) => {
    try {
        const limit = Number(req.query.limit) || 100;
        const offset = Number(req.query.offset) || 0;

        if (isNaN(limit) || isNaN(offset)) {
            return res.status(400).json({ error: 'Invalid limit or offset' });
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
        res.json(items);
    } catch (error) {
        console.error('Error fetching shop spells:', error);
        res.status(500).json({ error: 'Failed to fetch shop spells.' });
    }
});

app.post('/shop/gacha', async (req, res) => {
    const { userId, seedId, gachaCost } = req.body;

    if (seedId) { // 30% chance
        try {
            // Fetch current currency & inventory
            const [user] = await db.query(
                `SELECT currency, inventory FROM users WHERE id = ?`,
                [userId]
            );
    
            if (!user.length) {
                return res.status(404).json({ error: "User not found." });
            }
    
            let { currency, inventory } = user[0];
    
            // Check if user has enough currency
            if (currency < gachaCost) {
                return res.status(400).json({ error: "Not enough currency." });
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
                return res.status(404).json({ error: "Seed not found." });
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
            res.status(200).json({ 
                message: "Seed added successfully", 
                inventory: parsedInventory, 
                currency 
            });
    
        } catch (error) {
            console.error("Error in gacha function:", error);
            res.status(500).json({ error: "Internal Server Error" });
        }
    }
    
})


app.post('/spell-shop/buy', async (req, res) => {
    const { userId, spellId, price: discountedPrice, isGacha } = req.body;

    if (!userId || !spellId || discountedPrice === undefined) {
        return res.status(400).json({ error: 'Invalid request parameters.' });
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
            return res.status(404).json({ error: 'Spell not found.' });
        }

        const { price, stat, mana_cost, cooldown, duration, intelligenceRequired, ...spell } = spellDetails[0];

        // Set final price based on Gacha or Discount
        const finalPrice = isGacha ? 50 : discountedPrice;

        // Validate Discount
        const calculatedDiscountedPrice = Math.max(
            Math.floor(price * (1 - (req.body.discount / 100 || 0))),
            1
        );

        if (!isGacha && discountedPrice !== calculatedDiscountedPrice) {
            return res.status(400).json({ error: 'Invalid discounted price.' });
        }

        // Fetch user details
        const [user] = await db.query(
            `SELECT currency, ownedSpells FROM users WHERE id = ?`,
            [userId]
        );

        if (user.length === 0) {
            return res.status(404).json({ error: 'User not found.' });
        }

        let { currency, ownedSpells } = user[0];
        ownedSpells = JSON.parse(ownedSpells || '[]'); // Ensure ownedSpells is an array

        // Check if user has enough currency
        if (currency < finalPrice) {
            return res.status(400).json({ error: 'Not enough currency.' });
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

        res.json({
            success: true,
            message: `You have successfully purchased the ${spell.name}.`,
            updatedCurrency: currency,
            updatedInventory: ownedSpells,
        });
    } catch (err) {
        console.error('Error purchasing spell:', err.message, err.stack);
        res.status(500).json({ error: 'Failed to purchase spell.' });
    }
});



app.post('/spin-wheel', async (req, res) => {
    const { userId, intelligence } = req.body;

    if (!userId || intelligence === undefined) {
        return res.status(400).json({ error: 'Invalid request parameters.' });
    }

    try {
        // Fetch user details including last_spin timestamp
        const [user] = await db.query(
            `SELECT last_spin FROM users WHERE id = ?`,
            [userId]
        );

        if (user.length === 0) {
            return res.status(404).json({ error: 'User not found.' });
        }

        const { last_spin } = user[0];
        const now = new Date();

        // Check cooldown period (6 hours)
        if (last_spin) {
            const lastSpinDate = new Date(last_spin);
            const hoursSinceLastSpin = (now - lastSpinDate) / (1000 * 60 * 60);

            if (hoursSinceLastSpin < 6) {
                const timeLeft = 6 - hoursSinceLastSpin;
                return res.status(400).json({
                    error: `You can spin the wheel again in ${Math.ceil(timeLeft)} hours.`,
                });
            }
        }

        // Calculate the discount
        const baseDiscount = Math.floor(Math.random() * 21); // Random discount 0-20%
        const intelligenceBonus = Math.floor(intelligence / 10); // Intelligence influence
        const finalDiscount = Math.min(baseDiscount + intelligenceBonus, 90); // Cap at 90%

        // Update user's discount and last_spin timestamp
        await db.query(
            `UPDATE users
             SET discount = ?, last_spin = ?
             WHERE id = ?`,
            [finalDiscount, now, userId]
        );

        res.json({
            success: true,
            message: `You received a ${finalDiscount}% discount!`,
            discount: finalDiscount,
        });
    } catch (err) {
        console.error('Error spinning the wheel:', err.message, err.stack);
        res.status(500).json({ error: 'Failed to spin the wheel.' });
    }
});

app.get('/tower-leaderboard', async (req, res) => {
    try {
        const [leaderboard] = await db.query('SELECT * FROM tower_leaderboard ORDER BY floor DESC');
        res.json(leaderboard);
    } catch (error) {
        console.error('Error fetching leaderboard:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});


app.post('/add-to-tower-leaderboard', (req, res) => {
    const { username, userId, floor, achievedAt } = req.body;

    // Ensure data is provided
    if (!username || !userId || !floor || !achievedAt) {
        return res.status(400).json({ message: 'Missing required fields' });
    }

    // Query to insert or update user data in the leaderboard table
    const query = `
        INSERT INTO tower_leaderboard (username, userId, floor, date)
        VALUES (?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
            floor = VALUES(floor),
            date = VALUES(date)
    `;

    db.query(query, [username, userId, floor, achievedAt], (err, result) => {
        if (err) {
            return res.status(500).json({ message: 'Error adding to leaderboard', error: err });
        }

        // Check if the query affected any rows
        const isUpdated = result.affectedRows > 1;  // More than 1 means it was an update, not an insert
        
        if (isUpdated) {
            return res.status(200).json({ message: 'Leaderboard updated', data: result });
        } else {
            return res.status(200).json({ message: 'Leaderboard entry added', data: result });
        }
    });
});


app.post('/vows', async (req, res) => {
    try {
      const { name, description, selectedStats, difficulty, created_by, deadline } = req.body;
  
      // Reward configurations
      const xpRewards = [10, 20, 30, 40, 50];
      const statRewardValues = [1, 2, 3, 4, 5];
  
      // Check if user is valid and exists
      const userCheckQuery = 'SELECT COUNT(*) AS count FROM users WHERE id = ?';
      const [userCheckResult] = await db.query(userCheckQuery, [created_by]);
  
      if (userCheckResult[0].count === 0) {
        return res.status(404).json({ error: 'User does not exist' });
      }
  
      // Check active vow count for the user (excluding completed vows)
      const vowCountQuery = `
        SELECT COUNT(*) AS vowCount 
        FROM vows 
        WHERE created_by = ? AND status != 'completed'
      `;
      const [vowCountResult] = await db.query(vowCountQuery, [created_by]);
  
    //   if (vowCountResult[0].vowCount >= 3) {
    //     return res.status(403).json({ error: 'Vow limit exceeded. You can only have up to 3 active vows.' });
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
        return res.status(403).json({ error: 'You can only create up to 3 vows per day.' });
      }
  
      // Validate difficulty index range
      if (difficulty < 1 || difficulty > xpRewards.length) {
        return res.status(400).json({ error: 'Invalid difficulty level' });
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
  
      res.status(201).json({ message: 'Vow added successfully' });
  
    } catch (error) {
      console.error('Error adding vow:', error);
      res.status(500).json({ error: 'Failed to add vow' });
    }
});
  
// GET: Fetch vows for a specific user
app.get('/vows', async (req, res) => {
    const { userId } = req.query;

    if (!userId) {
        return res.status(400).json({ error: 'User ID is required' });
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
        res.json(rows);
    } catch (error) {
        console.error('Error fetching vows:', error);
        res.status(500).json({ error: 'Failed to fetch vows' });
    }
});



app.post('/vows/finish', async (req, res) => {
    const { vowId, userId, completedDate } = req.body;

    try {

        const completionDate = completedDate ? completedDate : new Date().toISOString().split('T')[0];

        // Check if the quest is already completed today
        // const [existing] = await db.query(
        //     `SELECT * FROM vows WHERE id = ? AND created_by = ? AND completed = 1 AND DATE(completed_at) = ?`,
        //     [questId, userId, completionDate]
        // );
        // if (existing.length > 0) {
        //     return res.status(400).json({ error: 'Quest already completed today.' });
        // }

        // Retrieve the quest's rewards (experience, item, and stat rewards)
        const [quest] = await db.query(
            `SELECT experience_reward, stat_reward FROM vows WHERE id = ?`,
            [vowId]
        );
        if (quest.length === 0) {
            return res.status(404).json({ error: 'Quest not found.' });
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

        res.json({ success: true, message: 'Quest marked as finished and rewards applied.' });
    } catch (err) {
        console.error('Error finishing quest:', err);
        res.status(500).json({ error: 'Failed to mark quest as finished.' });
    }
});

app.get('/completed-quests-stats', async (req, res) => {
    const { userId, date } = req.query;

    if (!userId) {
        return res.status(400).json({ error: 'User ID is required' });
    }

    if (!date) {
        return res.status(400).json({ error: 'Date is required' });
    }

    try {
        const currentDateStr = date;

        // Parse input date and calculate one week ago, including today
        const currentDate = new Date(currentDateStr);
        const oneWeekAgoDate = new Date(currentDate);
        oneWeekAgoDate.setDate(currentDate.getDate() - 6);

        const oneWeekAgoStr = oneWeekAgoDate.toISOString().split('T')[0];

        const [questParticipants] = await db.query(
            `SELECT qp.quest_id, qp.completed_at
             FROM quest_participants qp
             WHERE qp.user_id = ? AND qp.completed = 1
             AND qp.completed_at BETWEEN ? AND ?`,
            [userId, oneWeekAgoStr, currentDateStr]
        );

        const [vows] = await db.query(
            `SELECT v.id, v.completed_at, v.stat_reward
             FROM vows v
             WHERE v.created_by = ? 
             AND v.status = 'completed'
             AND v.completed_at BETWEEN ? AND ?`,
            [userId, oneWeekAgoStr, currentDateStr]
        );

        if (questParticipants.length === 0 && vows.length === 0) {
            const result = Array.from({ length: 7 }, (_, i) => {
                const day = new Date(oneWeekAgoDate);
                day.setDate(oneWeekAgoDate.getDate() + i);
                const dateStr = day.toISOString().split('T')[0];
                return { date: dateStr, stats: { strength: 0, bravery: 0, intelligence: 0, endurance: 0 } };
            });
            return res.json(result);
        }

        const questIds = questParticipants.map(qp => qp.quest_id);
        const [quests] = questIds.length
            ? await db.query('SELECT id, stat_reward FROM quests WHERE id IN (?)', [questIds])
            : [[]];

        const questRewards = quests.reduce((acc, quest) => {
            acc[quest.id] = JSON.parse(quest.stat_reward);
            return acc;
        }, {});

        const statsPerDay = {};

        questParticipants.forEach(participant => {
            const completedDateStr = participant.completed_at.slice(0, 10);
            const statReward = questRewards[participant.quest_id];
            if (!statReward) return;

            if (!statsPerDay[completedDateStr]) {
                statsPerDay[completedDateStr] = { strength: 0, bravery: 0, intelligence: 0, endurance: 0 };
            }

            statsPerDay[completedDateStr].strength += statReward.strength || 0;
            statsPerDay[completedDateStr].bravery += statReward.bravery || 0;
            statsPerDay[completedDateStr].intelligence += statReward.intelligence || 0;
            statsPerDay[completedDateStr].endurance += statReward.endurance || 0;
        });

        vows.forEach(vow => {
            const completedDateStr = vow.completed_at.slice(0, 10);
            const statReward = JSON.parse(vow.stat_reward);

            if (!statsPerDay[completedDateStr]) {
                statsPerDay[completedDateStr] = { strength: 0, bravery: 0, intelligence: 0, endurance: 0 };
            }

            statsPerDay[completedDateStr].strength += statReward.strength || 0;
            statsPerDay[completedDateStr].bravery += statReward.bravery || 0;
            statsPerDay[completedDateStr].intelligence += statReward.intelligence || 0;
            statsPerDay[completedDateStr].endurance += statReward.endurance || 0;
        });

        const result = Array.from({ length: 7 }, (_, i) => {
            const day = new Date(oneWeekAgoDate); 
            day.setDate(oneWeekAgoDate.getDate() + i); 
            const dateStr = day.toISOString().split('T')[0]; 
        
            const stats = statsPerDay[dateStr] || { strength: 0, bravery: 0, intelligence: 0, endurance: 0 };
        
            return { date: dateStr, stats };
        });
        

        console.log(result);

        res.json(result);
    } catch (error) {
        console.error('Error fetching completed quests and vows stats:', error);
        res.status(500).json({ error: 'Failed to fetch stats' });
    }
});

app.get('/total-completed-quests-stats', async (req, res) => {
    try {
        // Get the current date and the date 7 days ago
        const currentDate = new Date();
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(currentDate.getDate() - 7);

        // Convert to MySQL compatible format (YYYY-MM-DD)
        const formatDate = (date) => {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        };

        const currentDateStr = formatDate(currentDate);
        const oneWeekAgoStr = formatDate(oneWeekAgo);

        // Query to get all completed quests within the last week for ALL users
        const [questParticipants] = await db.query(
            `SELECT qp.quest_id, qp.completed_at, qp.user_id
             FROM quest_participants qp
             WHERE qp.completed = 1
             AND qp.completed_at >= ? AND qp.completed_at <= ?`,
            [oneWeekAgoStr, currentDateStr]
        );

        // Query to get all completed vows within the last week
        const [vows] = await db.query(
            `SELECT v.id, v.completed_at, v.stat_reward
             FROM vows v
             WHERE v.status = 'completed'
             AND v.completed_at BETWEEN ? AND ?`,
            [oneWeekAgoStr, currentDateStr]
        );

        if (questParticipants.length === 0 && vows.length === 0) {
            // Return stats with zero values for the week if no quests or vows completed
            return res.json({ stats: { strength: 0, bravery: 0, intelligence: 0, endurance: 0 } });
        }

        // Get all the quest stat_rewards for the fetched quest_ids
        const questIds = questParticipants.map(qp => qp.quest_id);
        const [quests] = questIds.length
            ? await db.query('SELECT id, stat_reward FROM quests WHERE id IN (?)', [questIds])
            : [[]];

        // Prepare a map of quest_id -> stat_reward
        const questRewards = quests.reduce((acc, quest) => {
            const parsedStatReward = JSON.parse(quest.stat_reward);
            acc[quest.id] = parsedStatReward;
            return acc;
        }, {});

        // Aggregate stats for the entire week
        let statsArray = {
            strength: [],
            bravery: [],
            intelligence: [],
            endurance: []
        };

        // Process quest stats
        questParticipants.forEach(participant => {
            const statReward = questRewards[participant.quest_id];
            if (!statReward) return;

            if (statReward.strength) statsArray.strength.push(statReward.strength);
            if (statReward.bravery) statsArray.bravery.push(statReward.bravery);
            if (statReward.intelligence) statsArray.intelligence.push(statReward.intelligence);
            if (statReward.endurance) statsArray.endurance.push(statReward.endurance);
        });

        // Process vow stats
        vows.forEach(vow => {
            const statReward = JSON.parse(vow.stat_reward);
            if (statReward.strength) statsArray.strength.push(statReward.strength);
            if (statReward.bravery) statsArray.bravery.push(statReward.bravery);
            if (statReward.intelligence) statsArray.intelligence.push(statReward.intelligence);
            if (statReward.endurance) statsArray.endurance.push(statReward.endurance);
        });

        // Helper function to calculate the median, excluding zeros
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

        // Calculate median for each stat
        const totalStats = {
            strength: calculateMedian(statsArray.strength),
            bravery: calculateMedian(statsArray.bravery),
            intelligence: calculateMedian(statsArray.intelligence),
            endurance: calculateMedian(statsArray.endurance),
        };

        console.log(totalStats);

        // Return the median stats for the week for all users
        res.json({ stats: totalStats });
    } catch (error) {
        console.error('Error fetching completed quests and vows stats:', error);
        res.status(500).json({ error: 'Failed to fetch stats' });
    }
});

app.get('/spells', async (req, res) => {
    try {
        const [ spells ] = await db.query(`
            SELECT * FROM spells 
        `);
        res.json(spells);
    } catch (error) {
        console.error('Error fetching leaderboard:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

app.post('/updateSpells', async (req, res) => {
    const { userId, spellSlots } = req.body; // Destructure from request body

    // Prepare spell list while maintaining order
    const orderedSpells = [
        spellSlots.first || null,
        spellSlots.second || null,
        spellSlots.third || null,
        spellSlots.fourth || null,
    ];

    // Convert the spell list to a string (comma-separated or JSON)
    const spellsString = JSON.stringify(orderedSpells);

    try {
        const query = `
            UPDATE users 
            SET spells = ? 
            WHERE id = ?;
        `;
        await db.query(query, [spellsString, userId]);
        res.json({ message: 'Spells updated successfully' });
    } catch (error) {
        console.error('Error updating spells:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

app.post('/getSpellData', async (req, res) => {
    const { spellName } = req.body; // Destructure spell name from request body

    // Check if spell name is provided
    if (!spellName) {
        return res.status(400).json({ message: 'Spell name is required' });
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
            return res.status(404).json({ message: 'Spell not found' });
        }

        // Respond with the spell data
        res.json(spellData[0]);
    } catch (error) {
        console.error('Error fetching spell data:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

app.get('/garden', async (req, res) => { 
    const { userId } = req.query;
    
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

        res.json(gardens);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to fetch garden data" });
    }
});

app.get('/plant', async (req, res) => {
    const { userId, plantId } = req.query;

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
            return res.status(404).json({ error: "Garden not found" });
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

        res.json({ ...plant, next_water_time: new Date(nextWaterTime * 1000) });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to fetch and update garden data" });
    }
});

app.post('/garden/plant', async (req, res) => {
    const { userId, seedId } = req.body;
    const now = new Date();

    try {
        // Fetch the current inventory from the users table
        const [userRows] = await db.query(`SELECT inventory FROM users WHERE id = ?`, [userId]);

        if (userRows.length === 0) {
            return res.status(404).json({ error: "User not found" });
        }

        let inventory = JSON.parse(userRows[0].inventory); // Assuming inventory is stored as a JSON string

        // Check if the seed exists in the inventory
        const seedIndex = inventory.findIndex(item => item.id === seedId && item.type === 'seed');
        if (seedIndex === -1) {
            return res.status(400).json({ error: "You don't have this seed in your inventory" });
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
            return res.status(404).json({ error: "Seed not found" });
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

        res.json({ message: "Seed planted and inventory updated!" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to plant seed" });
    }
});

// Water a plant
app.post('/garden/water', async (req, res) => {
    const { userId, gardenId } = req.body; // Removed lastWateredAt from the request

    try {
        // Fetch plant details
        const [plantRows] = await db.query(
            `SELECT * FROM player_garden WHERE id = ? AND player_id = ?`, 
            [gardenId, userId]
        );

        
        if (plantRows.length === 0) {
            return res.status(404).json({ error: "Plant not found" });
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

        res.json({ message: "Plant watered and is now growing!", status: "growing" });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to water plant" });
    }
});

// Harvest a plant
app.post('/garden/harvest', async (req, res) => {
    const { userId, gardenId } = req.body;

    try {
        // Fetch the plant details
        const [plantRows] = await db.query(
            `SELECT * FROM player_garden WHERE id = ? AND player_id = ?`, 
            [gardenId, userId]
        );
        
        if (plantRows.length === 0) {
            return res.status(400).json({ error: "Plant not ready for harvest" });
        }

        const plant = plantRows[0];

        // Fetch the corresponding seed data
        const [seedRows] = await db.query(
            `SELECT id, name, material FROM seeds WHERE id = ?`, 
            [plant.seed_id]
        );

        if (seedRows.length === 0) {
            return res.status(404).json({ error: "Seed data not found" });
        }

        const seed = seedRows[0];

        // Fetch the user's current inventory
        const [userRows] = await db.query(`SELECT inventory FROM users WHERE id = ?`, [userId]);

        if (userRows.length === 0) {
            return res.status(404).json({ error: "User not found" });
        }

        let inventory = JSON.parse(userRows[0].inventory || '[]'); // Ensure it's an array

        // Check if the seed already exists in the inventory
        let seedItem = inventory.find(item => item.id === seed.id && item.type === 'seed');

        if (seedItem) {
            seedItem.quantity += 1; // Increase seed quantity
        } else {
            inventory.push({ id: seed.id, name: seed.name, type: 'seed', quantity: 1 });
        }

        // Add the harvested material
        let materialItem = inventory.find(item => item.name === seed.material && item.type === 'material');

        if (materialItem) {
            materialItem.quantity += 1;
        } else {
            inventory.push({ name: seed.material, type: 'material', quantity: 1 });
        }

        // Update the user's inventory in the database
        await db.query(`UPDATE users SET inventory = ? WHERE id = ?`, [JSON.stringify(inventory), userId]);

        // Remove the plant from the garden
        await db.query(`DELETE FROM player_garden WHERE id = ?`, [gardenId]);

        res.json({ message: `You received 1 ${seed.name} seed and 1 ${seed.material}!` });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to harvest plant" });
    }
});

app.get('/seeds', async (req, res) => {
    const { id } = req.params;  // Get the itemId from the request parameter

    try {
        // Query to fetch the item from the database
        const results = await db.query('SELECT * FROM seeds');

        if (results.length > 0) {
            res.json(results[0]);  // Return the item as JSON if found
        } else {
            res.status(404).json({ error: 'Seed not found' });  // Item not found
        }
    } catch (error) {
        console.error('Error fetching seed:', error);
        res.status(500).json({ error: 'Database error' });
    }
});

app.get('/seed/:id', async (req, res) => {
    const { id } = req.params;  // Get the itemId from the request parameter

    try {
        // Query to fetch the item from the database
        const results = await db.query('SELECT * FROM seeds WHERE id = ?', [id]);

        if (results.length > 0) {
            res.json(results[0]);  // Return the item as JSON if found
        } else {
            res.status(404).json({ error: 'Seed not found' });  // Item not found
        }
    } catch (error) {
        console.error('Error fetching seed:', error);
        res.status(500).json({ error: 'Database error' });
    }
});

app.get("/craftable-items", async (req, res) => {
    try {
        const [result] = await db.query("SELECT * FROM craftable_items");
        console.log(result);
        // Convert recipe from text to JSON
        const formattedItems = result.map(item => ({
            ...item,
            recipe: JSON.parse(item.recipe) // Convert text to JSON
        }));

        res.json(formattedItems);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch craftable items" });
    }
});

app.post('/craft', async (req, res) => {
    const { userId, itemId, quantity } = req.body;

    try {
        // Fetch craftable item details
        const [craftableRows] = await db.query(
            `SELECT * FROM craftable_items WHERE id = ?`, 
            [itemId]
        );

        if (craftableRows.length === 0) {
            return res.status(404).json({ error: "Craftable item not found" });
        }

        const craftableItem = craftableRows[0];
        const recipe = JSON.parse(craftableItem.recipe); // Recipe is stored as a JSON object
        const itemStats = JSON.parse(craftableItem.stats || '{}'); // Ensure stat is parsed as JSON

        // Fetch user's inventory
        const [userRows] = await db.query(`SELECT inventory FROM users WHERE id = ?`, [userId]);

        if (userRows.length === 0) {
            return res.status(404).json({ error: "User not found" });
        }

        let inventory = JSON.parse(userRows[0].inventory || '[]'); // Ensure it's an array

        // Check if the user has enough materials
        for (const [material, reqQty] of Object.entries(recipe)) {
            const materialItem = inventory.find(item => item.name === material && item.type === 'material');
            if (!materialItem || materialItem.quantity < reqQty * quantity) {
                return res.status(400).json({ error: `Not enough ${material} to craft ${craftableItem.name}` });
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

        res.json({ message: `Successfully crafted ${quantity} ${craftableItem.name}` });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to craft item" });
    }
});

app.post('/consume', async (req, res) => {
    const { userId, itemId, quantity } = req.body;

    try {
        // Fetch user's inventory
        const [userRows] = await db.query(`SELECT inventory FROM users WHERE id = ?`, [userId]);

        if (userRows.length === 0) {
            return res.status(404).json({ error: "User not found" });
        }

        let inventory = JSON.parse(userRows[0].inventory || '[]'); // Ensure it's an array

        // Find the consumable item in inventory
        let consumableItem = inventory.find(item => item.name === itemId && item.type === 'consumable');

        if (!consumableItem) {
            return res.status(400).json({ error: "Item not found or not consumable" });
        }

        if (consumableItem.quantity < quantity) {
            return res.status(400).json({ error: `Not enough ${consumableItem.name} to consume` });
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

        res.json({
            message: `Successfully consumed ${quantity} ${consumableItem.name}`,
            stats: itemStats,
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to consume item" });
    }
});

app.get("/perks", async (req, res) => {
    try {
        const [result] = await db.query("SELECT * FROM perks");
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch craftable items" });
    }
});

app.get("/perks/:name", async (req, res) => {
    try {
        const { name } = req.params;
        const [result] = await db.query("SELECT * FROM perks WHERE name = ?", [name]);

        if (result.length === 0) {
            return res.status(404).json({ error: "Perk not found" });
        }

        res.json(result[0]);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch perk" });
    }
});

app.post('/choose-perk', async (req, res) => {
    const { userId, perkName, stat, newPerkPoints } = req.body;

    try {
        // Fetch user's perks
        const [userRows] = await db.query(`SELECT perks FROM users WHERE id = ?`, [userId]);

        if (userRows.length === 0) {
            return res.status(404).json({ error: "User not found" });
        }

        let perks = JSON.parse(userRows[0].perks || '[]'); // Ensure it's an array

        // Check if the perk already exists
        if (perks.some(perk => perk.perkName === perkName)) {
            return res.status(400).json({ error: "Perk already chosen" });
        }

        // Add new perk with full stat milestone tracking
        perks.push({ perkName, stat: stat });

        // Update the user's perks in the database
        await db.query(`UPDATE users SET perks = ?, perkPoints = ? WHERE id = ?`, [JSON.stringify(perks), newPerkPoints, userId]);

        res.json({ message: `Successfully added perk: ${perkName}` });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to save perk" });
    }
});

app.post("/claim-perk-point", async (req, res) => {
    const { userId, stat, milestone } = req.body;

    try {
        // Fetch current user data
        const [rows] = await db.query("SELECT perkPoints, claimedMilestones FROM users WHERE id = ?", [userId]);

        if (!rows.length) {
            return res.status(404).json({ error: "User not found" });
        }

        let user = rows[0]; // Extract user data from the first row
        let currentPerkPoints = parseInt(user.perkPoints, 10) || 0; // Ensure it's a number, default to 0
        let claimedMilestones = JSON.parse(user.claimedMilestones || "[]");

        // Check if milestone is already claimed
        if (claimedMilestones.some(m => m.stat === stat && m.milestone === milestone)) {
            return res.status(400).json({ error: "Milestone already claimed" });
        }

        // Increment perk points and update claimed milestones
        claimedMilestones.push({ stat, milestone });
        const updatedPerkPoints = currentPerkPoints + 1;

        await db.query("UPDATE users SET perkPoints = ?, claimedMilestones = ? WHERE id = ?", [
            updatedPerkPoints,
            JSON.stringify(claimedMilestones),
            userId
        ]);

        res.json({ message: "Perk point claimed!", perkPoints: updatedPerkPoints, claimedMilestones });
    } catch (error) {
        console.error("Error updating perk points:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

app.post("/remove-perk", async (req, res) => {
    const { userId, perkName, refundPoints } = req.body;

    try {
        // Fetch the current perks and perk points
        const [user] = await db.query(`SELECT perks, perkPoints FROM users WHERE id = ?`, [userId]);
        
        if (!user || user.length === 0) {
            return res.status(404).json({ error: "User not found" });
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

        res.json({ success: true, newPerks: userPerks, newPerkPoints });
    } catch (error) {
        console.error("Error removing perk:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

app.get("/guilds", async (req, res) => {
    try {
        const [result] = await db.query("SELECT * FROM guilds");
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch craftable items" });
    }
});

app.get("/user-guild", async (req, res) => {
    try {
        const { name, userId } = req.query; // Get both the guild name and userId from the query parameters
        
        if (!name || !userId) {
            return res.status(400).json({ error: "Guild name and user ID are required" });
        }

        // Query to fetch the guild by name
        const [result] = await db.query("SELECT * FROM guilds WHERE name = ?", [name]);

        if (result.length === 0) {
            return res.status(404).json({ error: "Guild not found" });
        }

        // Parse the members array from the database result
        const members = JSON.parse(result[0].members);

        // Check if the user is a member of the guild
        const isMember = members.some(member => Number(member.userId) === Number(userId));

        if (!isMember) {
            return res.status(403).json({ error: "User is not a member of this guild" });
        }

        res.json(result[0]); // Return the guild details
    } catch (error) {
        console.error("Error fetching guild:", error);
        res.status(500).json({ error: "Failed to fetch guild" });
    }
});

app.post('/create-guild', async (req, res) => {
    try {
        const { name, username, description, privacy, created_by } = req.body;

        // Validate required fields
        if (!name || !description || !privacy || !created_by) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Check if the user exists and fetch their currency balance
        const userCheckQuery = 'SELECT currency FROM users WHERE id = ?';
        const [userResult] = await db.query(userCheckQuery, [created_by]);

        if (userResult.length === 0) {
            return res.status(404).json({ error: 'User does not exist' });
        }

        const userGold = userResult[0].currency;

        // Check if the user has at least 20000 gold
        if (userGold < 20000) {
            return res.status(403).json({ error: 'Insufficient gold. You need at least 20000 gold to create a guild.' });
        }

        // Deduct 20,000 gold from user's balance
        const newBalance = userGold - 20000;
        const updateUserCurrencyQuery = 'UPDATE users SET currency = ?, guild = ? WHERE id = ?';
        await db.query(updateUserCurrencyQuery, [newBalance, name, created_by]);

        // Check if the guild name already exists
        const guildCountQuery = 'SELECT COUNT(*) AS guildCount FROM guilds WHERE name = ?';
        const [guildCountResult] = await db.query(guildCountQuery, [name]);

        if (guildCountResult[0].guildCount > 0) {
            return res.status(403).json({ error: 'This guild name already exists, choose a different name.' });
        }

        // Prepare members array with the creator as an admin
        const created_at = new Date();
        const members = [{ userId: created_by, username: username,  role: "admin" }];

        // Insert new guild into the database
        const sql = `INSERT INTO guilds (name, description, members, group_quests, created_at, privacy, request_list) 
                     VALUES (?, ?, ?, ?, ?, ?, ?)`;

        await db.query(sql, [
            name,
            description,
            JSON.stringify(members), // Store members array as JSON
            JSON.stringify([]), // Empty group_quests
            created_at,
            privacy,
            JSON.stringify([]) // Empty request_list
        ]);

        res.status(201).json({ message: 'Guild created successfully', newBalance });

    } catch (error) {
        console.error('Error creating guild:', error);
        res.status(500).json({ error: 'Failed to create guild' });
    }
});

app.post('/join-guild', async (req, res) => {
    try {
        const { name, userId, username } = req.body;

        if (!name || !userId || !username) {
            return res.status(400).json({ error: 'Guild name and userId are required' });
        }

        // Check if the user exists
        const userCheckQuery = 'SELECT COUNT(*) AS count FROM users WHERE id = ?';
        const [userCheckResult] = await db.query(userCheckQuery, [userId]);

        if (userCheckResult[0].count === 0) {
            return res.status(404).json({ error: 'User does not exist' });
        }

        // Check if the user is already in another guild
        const userGuildCheckQuery = 'SELECT guild FROM users WHERE id = ?';
        const [userGuildResult] = await db.query(userGuildCheckQuery, [userId]);

        if (userGuildResult[0].guild) {
            return res.status(403).json({ error: 'User is already in another guild' });
        }

        // Fetch the target guild by name
        const guildQuery = 'SELECT members, request_list, privacy FROM guilds WHERE name = ?';
        const [guildResult] = await db.query(guildQuery, [name]);

        if (guildResult.length === 0) {
            return res.status(404).json({ error: 'Guild not found' });
        }

        let { members, request_list, privacy } = guildResult[0];

        // Parse JSON fields
        members = JSON.parse(members);
        request_list = JSON.parse(request_list);

        // Check if the user is already a member
        if (members.some(member => member.userId === userId)) {
            return res.status(400).json({ error: 'User is already a member of this guild' });
        }

        if (privacy === "public") {
            // If public, add user immediately
            members.push({ userId, username: username, role: "member" });

            // Update the guild with new members
            const updateGuildQuery = 'UPDATE guilds SET members = ? WHERE name = ?';
            await db.query(updateGuildQuery, [JSON.stringify(members), name]);

            // Update the user's guild column
            const updateUserQuery = 'UPDATE users SET guild = ? WHERE id = ?';
            await db.query(updateUserQuery, [name, userId]);

            return res.status(200).json({ message: 'User successfully joined the guild' });
        } else {
            // If private, add user to the request list
            if (!request_list.includes(userId)) {
                request_list.push({userId, username: username});
            }

            // Update the guild with the new request list
            const updateRequestQuery = 'UPDATE guilds SET request_list = ? WHERE name = ?';
            await db.query(updateRequestQuery, [JSON.stringify(request_list), name]);

            return res.status(200).json({ message: 'Request sent to join the guild' });
        }
    } catch (error) {
        console.error('Error joining guild:', error);
        res.status(500).json({ error: 'Failed to join the guild' });
    }
});


app.post('/leave-guild', async (req, res) => {
    try {
        const { name, userId } = req.body;

        if (!name || !userId) {
            return res.status(400).json({ error: 'Guild name and userId are required' });
        }

        // Fetch guild data
        const guildQuery = 'SELECT members FROM guilds WHERE name = ?';
        const [guildResult] = await db.query(guildQuery, [name]);

        if (guildResult.length === 0) {
            return res.status(404).json({ error: 'Guild not found' });
        }

        let members = JSON.parse(guildResult[0].members);

        // Check if user is in the guild
        const userIndex = members.findIndex(member => Number(member.userId) === Number(userId));
        if (userIndex === -1) {
            return res.status(400).json({ error: 'User is not a member of this guild' });
        }

        // Check if the user is an admin and the last admin
        const isAdmin = members[userIndex].role === "admin";
        const remainingAdmins = members.filter(member => member.role === "admin" && Number(member.userId) !== Number(userId));

        if (isAdmin && remainingAdmins.length === 0 && members.length > 1) {
            return res.status(403).json({ error: 'You are the last admin. Assign another admin before leaving.' });
        }

        // Remove user from members list
        members.splice(userIndex, 1);

        if (members.length === 0) {
            // If no members left, delete the guild
            const deleteGuildQuery = 'DELETE FROM guilds WHERE name = ?';
            await db.query(deleteGuildQuery, [name]);
        } else {
            // Update guild members in database
            const updateQuery = 'UPDATE guilds SET members = ? WHERE name = ?';
            await db.query(updateQuery, [JSON.stringify(members), name]);
        }

        // Remove guild association from user in the users table
        const updateUserQuery = 'UPDATE users SET guild = NULL WHERE id = ?';
        await db.query(updateUserQuery, [userId]);

        res.status(200).json({ message: 'User successfully left the guild' });

    } catch (error) {
        console.error('Error quitting guild:', error);
        res.status(500).json({ error: 'Failed to quit the guild' });
    }
});

app.post('/handle-guild-request', async (req, res) => {
    try {
        const { name, userId, username, action } = req.body; // Removed adminId from request body

        if (!name || !userId || !action) {
            return res.status(400).json({ error: 'Guild name, userId, and action are required' });
        }

        // Fetch guild data
        const guildQuery = 'SELECT members, request_list FROM guilds WHERE name = ?';
        const [guildResult] = await db.query(guildQuery, [name]);

        if (guildResult.length === 0) {
            return res.status(404).json({ error: 'Guild not found' });
        }

        let { members, request_list } = guildResult[0];
        members = JSON.parse(members);
        request_list = JSON.parse(request_list);

        // Find admin userId from members list
        const admin = members.find(member => member.role === "admin");
        if (!admin) {
            return res.status(403).json({ error: 'No admin found in the guild' });
        }

        // Find user in request_list (now an array of objects)
        const requestIndex = request_list.findIndex(request => request.userId === userId);
        if (requestIndex === -1) {
            return res.status(400).json({ error: 'User did not request to join this guild' });
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

            return res.status(200).json({ message: 'User successfully joined the guild' });
        } else if (action === "reject") {
            // Remove user from request list
            request_list.splice(requestIndex, 1);

            const updateQuery = 'UPDATE guilds SET request_list = ? WHERE name = ?';
            await db.query(updateQuery, [JSON.stringify(request_list), name]);

            return res.status(200).json({ message: 'Join request rejected' });
        } else {
            return res.status(400).json({ error: 'Invalid action. Use "accept" or "reject"' });
        }
    } catch (error) {
        console.error('Error handling guild request:', error);
        res.status(500).json({ error: 'Failed to process request' });
    }
});

app.get('/guild-quests', async (req, res) => {
    try {
        const [result] = await db.query("SELECT * FROM guild_quests");
        res.json(result[0]);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch craftable items" });
    }
})






 

app.listen(3001, () => {
    console.log('✅ Backend running on HTTP at port 3001');
});
