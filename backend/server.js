const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const db = require('./db'); // Import the database connection
const cors = require('cors');
const bcrypt = require('bcryptjs');
const cron = require('node-cron');
const { v4: uuidv4 } = require('uuid'); // Import uuid to generate unique ids


app.use(bodyParser.json());

app.use(cors());


app.post('/auth/signup', async (req, res) => {
    const { username, password, email, age } = req.body;

    const defaultStats = JSON.stringify({
        physical_strength: 1,
        bravery: 1,
        intelligence: 1,
        stamina: 1,
    });

    try {
        // Check if the username already exists
        const [result] = await db.query('SELECT * FROM users WHERE username = ?', [username]);
        if (result.length > 0) {
            return res.status(400).json({ message: 'Username already exists' });
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insert the new user into the database
        const joinedAt = new Date(); // Current timestamp for joined_at
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
        SELECT CURDATE(), id FROM quests
        ORDER BY RAND() LIMIT 12;
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

cron.schedule('0 0 * * *', async () => { 
    console.log(`[${new Date().toISOString()}] Running daily quest insertion...`);
    // await clearCompletedQuestParticipants();
    await insertDailyQuests();
}, {
    scheduled: true,
    timezone: 'America/Los_Angeles' // California Timezone
});

cron.schedule('0 */6 * * *', async () => {
    try {
        console.log('Resetting discounts and spin timestamps...');
        await db.query(
            `UPDATE users
             SET discount = NULL`
        );
        console.log('Discounts and timestamps reset successfully.');
    } catch (err) {
        console.error('Error resetting discounts:', err.message, err.stack);
    }
});

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
    const { questId, userId } = req.body;

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

        // If user is already in the participants table, update progress if needed
        if (existingParticipant.length > 0) {
            if (existingParticipant[0].progress === 'Started') {
                return res.status(200).json({ message: 'Quest already started by this user' });
            }

            // Update progress to 'Started' and joined_at if not already done
            await db.query(
                'UPDATE quest_participants SET progress = ?, joined_at = ?, completed = ? WHERE id = ?',
                ['Started', new Date(), false, existingParticipant[0].id]
            );

            return res.status(200).json({ message: 'Quest progress updated to Started' });
        }

        // If user is not a participant, add them to the quest
        await db.query(
            'INSERT INTO quest_participants (quest_id, user_id, progress, completed, joined_at, completed_at) VALUES (?, ?, ?, ?, ?, ?)',
            [questId, userId, 'Started', false, new Date(), null]
        );

        res.status(201).json({ message: 'User added as participant with progress Started' });

    } catch (error) {
        console.error('Error selecting quest:', error);
        res.status(500).json({ error: 'An error occurred while selecting the quest.' });
    }
});

app.post('/quests/remove', async (req, res) => {
    const { questId, userId } = req.body;

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

    if (!userId) {
        return res.status(400).json({ error: 'User ID is required' });
    }

    try {
        const [activeQuests] = await db.query(
            `SELECT qp.quest_id, qp.progress, qp.completed, qp.joined_at, q.* 
             FROM quest_participants qp
             INNER JOIN quests q ON qp.quest_id = q.id
             WHERE qp.user_id = ? AND qp.completed = false`,
            [userId]
        );

        res.status(200).json(activeQuests);
    } catch (error) {
        console.error('Error fetching active quests:', error);
        res.status(500).json({ error: 'An error occurred while fetching active quests' });
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
        const currentDate = new Date().toISOString().split('T')[0]; // 'YYYY-MM-DD'

        // Query to fetch completed quests for the given user where completed = true and completed date is today
        const [completedQuests] = await db.query(
            `SELECT qp.quest_id, qp.progress, qp.completed, qp.joined_at, q.name, q.description, qp.completed_at 
             FROM quest_participants qp
             INNER JOIN quests q ON qp.quest_id = q.id
             WHERE qp.user_id = ? AND qp.completed = true`,
            [userId]  // Compare the 'completed_at' with today's date
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
        // Check if the quest is already completed today
        const [existing] = await db.query(
            `SELECT * FROM quest_participants WHERE quest_id = ? AND user_id = ? AND completed = 1 AND DATE(completed_at) = CURDATE()`,
            [questId, userId]
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
             SET completed = 1, completed_at = NOW()
             WHERE quest_id = ? AND user_id = ?`,
            [questId, userId]
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
        if (itemReward) {
            // Fetch current inventory
            const [user] = await db.query(
                `SELECT inventory FROM users WHERE id = ?`,
                [userId]
            );
            let inventory = JSON.parse(user[0].inventory || '[]');

            // Fetch the item details from the `items` table
            const [itemDetails] = await db.query(
                `SELECT * FROM items WHERE id = ?`,
                [itemReward]
            );
            if (itemDetails.length === 0) {
                return res.status(404).json({ error: 'Reward item not found.' });
            }

            // Apply random plus-minus of 5 to each stat
            let itemWithRandomStats = { ...itemDetails[0] };

            if (itemWithRandomStats.stats) {
                const stats = JSON.parse(itemWithRandomStats.stats);

                for (let stat in stats) {
                    const randomModifier = Math.floor(Math.random() * 7) - 3;
                    stats[stat] += randomModifier;
                }

                // Save the updated stats back to the item
                itemWithRandomStats.stats = JSON.stringify(stats);
            }

            // Generate a unique UUID for this item
            itemWithRandomStats.id = uuidv4();

            // Append the item object with modified stats and UUID to the inventory
            inventory.push(itemWithRandomStats);

            // Save the updated inventory
            await db.query(
                `UPDATE users
                 SET inventory = ?
                 WHERE id = ?`,
                [JSON.stringify(inventory), userId]
            );
        }

        res.json({ success: true, message: 'Quest marked as finished and rewards applied.' });
    } catch (err) {
        console.error('Error finishing quest:', err);
        res.status(500).json({ error: 'Failed to mark quest as finished.' });
    }
});


app.get('/quests/daily', async (req, res) => {
    const userId = req.query.userId;
    console.log('Received userId:', userId);

    try {
        // Set timezone to Pacific Time (PST/PDT)
        await db.query("SET time_zone = '-08:00';"); // Pacific Standard Time (PST, UTC-8)

        // Fetch today's quests
        const query = `
            SELECT q.id, q.name, q.description, q.difficulty, q.experience_reward, q.item_reward, q.stat_reward
            FROM quests q
            INNER JOIN daily_quests dq ON q.id = dq.quest_id
            WHERE dq.date = CURDATE();
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
            'SELECT username, experience, level, stats, head, torso, legs, feet, weapon, inventory, currency, discount, last_spin FROM users WHERE id = ?',
            [userId]
        );

        if (userResults.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        const user = userResults[0];

        // Log the user data for debugging
        console.log("Fetched User Data:", user);

        // Parse inventory from the user's data (stored as a JSON string)
        const inventoryItems = user.inventory ? JSON.parse(user.inventory) : [];

        // Log the parsed inventory for debugging
        console.log("Parsed Inventory Items:", inventoryItems);

        // Provide default placeholders for missing slots based on the inventory directly
        const equipment = {
            head: user.head && inventoryItems.find(item => item.id === String(user.head)) || { id: '', name: 'None', type: 'head' },
            torso: user.torso && inventoryItems.find(item => item.id === String(user.torso)) || { id: '', name: 'None', type: 'torso' },
            legs: user.legs && inventoryItems.find(item => item.id === String(user.legs)) || { id: '', name: 'None', type: 'legs' },
            feet: user.feet && inventoryItems.find(item => item.id === String(user.feet)) || { id: '', name: 'None', type: 'feet' },
            weapon: user.weapon && inventoryItems.find(item => item.id === String(user.weapon)) || { id: '', name: 'None', type: 'weapon' },
        };

        // Log the equipment data for debugging
        console.log("Mapped Equipment Data:", equipment);

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
            last_spin: user.last_spin
        });
    } catch (error) {
        console.error('Error fetching account data:', error.message);
        res.status(500).json({ error: 'Failed to fetch account data' });
    }
});

app.get('/leaderboard', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;
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
    console.log(userId, slot, itemId, inventory);

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

        let userStats = JSON.parse(userResult[0].stats || '{}');
        const equippedItemId = userResult[0].equippedItem;

        // ⚙️ Handle Stat Adjustment for Previously Equipped Item
        if (equippedItemId) {
            console.log("Removing stats from previously equipped item");

            const equippedItem = inventory.find(item => item.id === equippedItemId);
            if (equippedItem) {
                const equippedItemStats = JSON.parse(equippedItem.stats || '{}');
                Object.entries(equippedItemStats).forEach(([stat, value]) => {
                    const normalizedStat = stat.toLowerCase().trim();
                    if (userStats[normalizedStat] !== undefined) {
                        userStats[normalizedStat] -= value;
                        if (userStats[normalizedStat] <= 0) delete userStats[normalizedStat];
                    }
                });
            } else {
                console.warn("Previously equipped item not found in inventory");
            }
        }

        // ⚙️ Handle Unequip Logic
        if (itemId === null) {
            console.log("Unequipping item");

            // Update stats and unequip the item
            await db.query(
                `UPDATE users SET stats = ?, ?? = NULL WHERE id = ?`,
                [JSON.stringify(userStats), slot, userId]
            );

            return res.status(200).json({ 
                message: 'Item unequipped successfully', 
                updatedStats: userStats 
            });
        }

        // ⚙️ Handle Equip Logic
        console.log("Equipping new item");

        const newItem = inventory.find(item => item.id === itemId);
        if (!newItem) {
            return res.status(404).json({ error: 'Item not found in inventory' });
        }

        const newItemStats = JSON.parse(newItem.stats || '{}');
        Object.entries(newItemStats).forEach(([stat, value]) => {
            const normalizedStat = stat.toLowerCase().trim();
            // Add or update stat, without duplicating
            if (userStats[normalizedStat]) {
                userStats[normalizedStat] += value;
            } else {
                userStats[normalizedStat] = value;
            }
        });

        // Update stats and equip the new item
        await db.query(
            `UPDATE users SET stats = ?, ?? = ? WHERE id = ?`,
            [JSON.stringify(userStats), slot, itemId, userId]
        );

        res.status(200).json({ 
            message: 'Item equipped successfully', 
            updatedStats: userStats 
        });

    } catch (error) {
        console.error('Error updating equipment and stats:', error.message);
        res.status(500).json({ error: 'Failed to update equipment and stats' });
    }
});


app.get('/items/:itemId', async (req, res) => {
    const { itemId } = req.params;  // Get the itemId from the request parameter

    try {
        // Query to fetch the item from the database
        const results = await db.query('SELECT * FROM items WHERE id = ?', [itemId]);

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
        const statTypes = ['stamina', 'physical_strength', 'bravery', 'intelligence'];

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
                i.description
            FROM 
                shop_items si
            JOIN 
                items i ON si.item_id = i.id
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
            `SELECT currency, inventory, stats FROM users WHERE id = ?`,
            [userId]
        );
        if (user.length === 0) {
            return res.status(404).json({ error: 'User not found.' });
        }

        let { currency, inventory, stats: userStats } = user[0];
        inventory = JSON.parse(inventory || '[]');
        userStats = JSON.parse(userStats || '{}');

        // Check if user has enough currency
        if (currency < finalPrice) {
            return res.status(400).json({ error: 'Not enough currency.' });
        }

        // Deduct currency
        currency -= finalPrice;

        // Prepare item with random stat modifiers and a unique UUID
        let itemWithRandomStats = { ...item, id: uuidv4() };

        if (stats) {
            let itemStats = JSON.parse(stats);

            for (let stat in itemStats) {
                const randomModifier = Math.floor(Math.random() * 7) - 3; // ±3 random modifier
                itemStats[stat] += randomModifier;
            }

            itemWithRandomStats.stats = JSON.stringify(itemStats);
        }

        // Append modified item to inventory
        inventory.push(itemWithRandomStats);

        // Update user's inventory and currency
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


app.listen(3001, () => {
    console.log('✅ Backend running on HTTP at port 3001');
});
