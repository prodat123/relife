import axios from "axios";
import bcrypt from "bcrypt";
import db from "../db.js";

export default async function authRoutes(fastify, options) {
  fastify.get("/session", async (request, reply) => {
    if (!request.session.userId) {
      return reply.code(401).send({ message: "No active session" });
    }
    return reply
      .code(200)
      .send({ message: "Session valid", userId: request.session.userId });
  });

  // Signup Route
  fastify.post("/signup", async (request, reply) => {
    const { username, password, email, age } = request.body;

    const defaultStats = JSON.stringify({
      strength: 1,
      bravery: 1,
      intelligence: 1,
      endurance: 1,
    });

    try {
      const [existing] = await db.query(
        "SELECT * FROM users WHERE username = ?",
        [username],
      );
      if (existing.length > 0) {
        return reply.code(400).send({ message: "Username already exists" });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const joinedAt = new Date().toISOString().slice(0, 10);

      await db.query(
        "INSERT INTO users (username, email, age, password, experience, stats, joined_at, head, torso, legs, feet) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [
          username,
          email,
          age,
          hashedPassword,
          1,
          defaultStats,
          joinedAt,
          "",
          "",
          "",
          "",
        ],
      );

      const [result] = await db.query(
        "SELECT * FROM users WHERE username = ?",
        [username],
      );
      const user = result[0];

      request.session.userId = user.id;

      reply.code(200).send({
        message: "Signup successful",
        id: user.id,
        username: user.username,
        experience: user.experience,
        stats: JSON.parse(user.stats),
        head: user.head,
        torso: user.torso,
        legs: user.legs,
        feet: user.feet,
        weapon: user.weapon || null,
        currency: user.currency || 0,
      });
    } catch (error) {
      console.error("Error during signup:", error);
      reply.code(500).send({ message: "Error signing up" });
    }
  });

  // Login Route
  fastify.post("/login", async (request, reply) => {
    const { username, password } = request.body;

    try {
      const [result] = await db.query(
        "SELECT * FROM users WHERE username = ?",
        [username],
      );
      if (result.length === 0) {
        return reply.code(400).send({ message: "User not found" });
      }

      const user = result[0];
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        console.log("Invalid credentials for: " + request.ip);
        return reply.code(400).send({ message: "Invalid credentials" });
      }

      request.session.userId = user.id;

      reply.code(200).send({
        message: "Login successful",
        id: user.id,
        username: user.username,
        experience: user.experience,
        stats: JSON.parse(user.stats),
        head: user.head,
        torso: user.body, // Adjust this if incorrect
        legs: user.legs,
        feet: user.feet,
        weapon: user.weapon,
        currency: user.currency,
      });
      console.log("Login succeeded for: " + request.body);
    } catch (error) {
      console.error("Error during login:", error);
      reply.code(500).send({ message: "Error logging in" });
    }
  });

  // Logout Route
  fastify.post("/logout", (request, reply) => {
    request.destroySession((err) => {
      if (err) {
        return reply.code(500).send({ message: "Error logging out" });
      }
      reply.code(200).send({ message: "Logout successful" });
    });
  });

  fastify.post("/delete-account", async (request, reply) => {
    const { username } = request.body;

    try {
      if (!request.session.userId) {
        return reply.code(401).send({ message: "Not authenticated" });
      }

      // Fetch the user
      const [rows] = await db.query("SELECT * FROM users WHERE id = ?", [
        request.session.userId,
      ]);
      if (rows.length === 0) {
        return reply.code(404).send({ message: "User not found" });
      }

      const user = rows[0];

      if (user.username !== username) {
        return reply.code(400).send({ message: "Username does not match" });
      }

      // 🔥 Run all deletions in a transaction to avoid partial deletes
      await db.beginTransaction();

      try {
        // 1. Delete quest participants entries
        await db.query("DELETE FROM quest_participants WHERE user_id = ?", [
          user.id,
        ]);

        // 2. Delete quests created by the user
        await db.query("DELETE FROM quests WHERE created_by = ?", [user.id]);

        // 3. Delete the user account itself
        await db.query("DELETE FROM users WHERE id = ?", [user.id]);

        await db.commit();
      } catch (err) {
        await db.rollback();
        console.error("Transaction failed:", err);
        return reply.code(500).send({ message: "Error deleting account data" });
      }

      // ✅ Clear session
      if (request.session.destroy) {
        request.session.destroy((err) => {
          if (err) console.error("Session destroy error:", err);
        });
      } else if (request.session.delete) {
        request.session.delete(); // for fastify-secure-session
      }

      reply
        .code(200)
        .send({ message: "Account and related data deleted successfully" });
    } catch (error) {
      console.error("Error deleting account:", error);
      reply.code(500).send({ message: "Error deleting account" });
    }
  });

  fastify.post("/change-username", async (request, reply) => {
    const { userId, newUsername } = request.body;

    try {
      // Step 1: Get current spiritHealth
      const [rows] = await db.query(
        "SELECT spiritHealth FROM users WHERE id = ?",
        [userId],
      );

      if (!rows || rows.length === 0) {
        return reply.code(404).send("User not found");
      }

      const spiritHealth = rows[0].spiritHealth;

      // Step 2: Check if spiritHealth is 0
      if (spiritHealth !== 0) {
        return reply
          .code(403)
          .send("Username can only be changed when spiritHealth is 0");
      }

      // Step 3: Proceed to change username
      await db.query(
        "UPDATE users SET username = ?, spiritHealth = 50 WHERE id = ?",
        [newUsername, userId],
      );
      return reply.code(200).send("Username updated");
    } catch (error) {
      console.error(error);
      return reply.code(500).send("Error updating username");
    }
  });
}
