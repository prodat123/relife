import db from "../db.js";
import { v4 as uuidv4 } from "uuid";

export default async function shopRoutes(fastify, options) {
  fastify.get("/items", async (request, reply) => {
    try {
      const limit = parseInt(request.query.limit, 10) || 100;
      const offset = parseInt(request.query.offset, 10) || 0;

      const [items] = await db.query(
        `
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
            `,
        [limit, offset],
      );

      reply.send(items);
    } catch (error) {
      console.error("Error fetching shop items:", error);
      reply.code(500).send({ error: "Failed to fetch shop items." });
    }
  });

  fastify.post("/buy", async (request, reply) => {
    const { userId, itemId, price: discountedPrice, isGacha } = request.body;

    // Validate request parameters
    if (!userId || !itemId || discountedPrice === undefined) {
      return reply.code(400).send({ error: "Invalid request parameters." });
    }

    try {
      // Fetch item details from shop_items and items table
      const [itemDetails] = await db.query(
        `SELECT i.*, si.price 
                FROM shop_items si 
                JOIN items i ON si.item_id = i.id 
                WHERE si.id = ?`,
        [itemId],
      );

      if (itemDetails.length === 0) {
        return reply.code(404).send({ error: "Item not found." });
      }

      const { price, stats, ...item } = itemDetails[0];

      // If it's a Gacha roll, use a fixed price of 50
      const finalPrice = isGacha ? 50 : discountedPrice;

      // Validate discounted price
      const calculatedDiscountedPrice = Math.max(
        Math.floor(price * (1 - (request.body.discount / 100 || 0))),
        1,
      );

      if (!isGacha && discountedPrice !== calculatedDiscountedPrice) {
        return reply.code(400).send({ error: "Invalid discounted price." });
      }

      // Fetch user details
      const [user] = await db.query(
        `SELECT currency, inventory FROM users WHERE id = ?`,
        [userId],
      );
      if (user.length === 0) {
        return reply.code(404).send({ error: "User not found." });
      }

      let { currency, inventory } = user[0];
      inventory = JSON.parse(inventory || "[]"); // Ensure inventory is an array

      // Check if user has enough currency
      if (currency < finalPrice) {
        return reply.code(400).send({ error: "Not enough currency." });
      }

      // Deduct currency
      currency -= finalPrice;

      // Parse item stats (ensuring it's an object)
      let itemStats = JSON.parse(stats || "{}");

      // Prepare item with stats and a unique UUID
      let newItem = { ...item, stats: itemStats, id: uuidv4() };

      // Append item to inventory
      inventory.push(newItem);

      // Update user's inventory and currency in the database
      await db.query(
        `UPDATE users
                SET currency = ?, inventory = ?
                WHERE id = ?`,
        [currency, JSON.stringify(inventory), userId],
      );

      reply.send({
        success: true,
        message: `You have successfully purchased the ${item.name}.`,
        updatedCurrency: currency,
        updatedInventory: inventory,
      });
    } catch (err) {
      console.error("Error purchasing item:", err.message, err.stack);
      reply.code(500).send({ error: "Failed to purchase item." });
    }
  });

  fastify.get("/spells", async (request, reply) => {
    try {
      const limit = Number(request.query.limit) || 100;
      const offset = Number(request.query.offset) || 0;

      if (isNaN(limit) || isNaN(offset)) {
        return reply.code(400).send({ error: "Invalid limit or offset" });
      }

      console.log(`Fetching spells with limit=${limit} and offset=${offset}`);

      const [items] = await db.query(
        `
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
            `,
        [limit, offset],
      );

      console.log("Fetched items:", items);
      reply.send(items);
    } catch (error) {
      console.error("Error fetching shop spells:", error);
      reply.code(500).send({ error: "Failed to fetch shop spells." });
    }
  });

  fastify.post("/gacha", async (request, reply) => {
    const { userId, seedId, gachaCost } = request.body;

    if (seedId) {
      // 30% chance
      try {
        // Fetch current currency & inventory
        const [user] = await db.query(
          `SELECT currency, inventory FROM users WHERE id = ?`,
          [userId],
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
          [seedId],
        );

        if (seedDetails.length === 0) {
          return reply.code(404).send({ error: "Seed not found." });
        }

        const seed = seedDetails[0];

        // Check if the seed already exists in the inventory
        const existingSeedIndex = parsedInventory.findIndex(
          (invItem) => invItem.id === seed.id,
        );

        if (existingSeedIndex !== -1) {
          // Seed exists, update quantity
          parsedInventory[existingSeedIndex].quantity += 1;
        } else {
          // New seed, add to inventory
          parsedInventory.push({
            id: seed.id,
            name: seed.name,
            type: "seed",
            quantity: 1,
          });
        }

        // Update user's inventory and currency
        await db.query(
          `UPDATE users SET inventory = ?, currency = ? WHERE id = ?`,
          [JSON.stringify(parsedInventory), currency, userId],
        );

        console.log("Updated Inventory:", parsedInventory); // Debugging
        reply.code(200).send({
          message: "Seed added successfully",
          inventory: parsedInventory,
          currency,
        });
      } catch (error) {
        console.error("Error in gacha function:", error);
        reply.code(500).send({ error: "Internal Server Error" });
      }
    }
  });
}
