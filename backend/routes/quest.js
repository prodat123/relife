import db from "../db.js";

export default async function questRoutes(fastify, options) {
  fastify.get("/:id", async (request, reply) => {
    try {
      const { id } = request.query;
      const [quests] = await db.query("SELECT * FROM quests WHERE id = ?", [
        id,
      ]);
      reply.send(quests);
    } catch (error) {
      console.error("Error fetching quests:", error);
      reply.code(500).send({ message: "Internal Server Error" });
    }
  });

  fastify.post("/", async (request, reply) => {
    try {
      const {
        name,
        description,
        difficulty,
        experience_reward,
        stat_reward,
        tags,
        created_by,
      } = request.body;

      // Validate required fields
      if (
        !name ||
        !description ||
        !difficulty ||
        !experience_reward ||
        !stat_reward ||
        !tags ||
        !created_by
      ) {
        return reply
          .code(400)
          .send({ message: "Missing required quest fields" });
      }

      // Step 1: Check how many quests the user already created
      const [countRows] = await db.query(
        `SELECT COUNT(*) as questCount FROM quests WHERE created_by = ?`,
        [created_by],
      );

      const currentQuestCount = countRows[0].questCount;

      // if (currentQuestCount >= 10) {
      //   return reply.code(403).send({
      //     message: "Quest limit reached. You can only create up to 10 quests.",
      //   });
      // }

      // Step 2: Proceed to insert new quest
      const statRewardJson = JSON.stringify(stat_reward);
      const tagsJson = JSON.stringify(tags);

      const [result] = await db.query(
        `INSERT INTO quests 
        (name, description, type, difficulty, experience_reward, stat_reward, tags, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          name,
          description,
          "daily",
          difficulty,
          experience_reward,
          statRewardJson,
          tagsJson,
          created_by,
        ],
      );

      console.log("Quest created succesfully");

      reply.code(201).send({
        message: "Quest created successfully",
        questId: result.insertId,
      });
    } catch (error) {
      console.error("Error creating quest:", error);
      reply.code(500).send({ message: "Internal Server Error" });
    }
  });

  fastify.delete("/:questId", async (request, reply) => {
    const { questId } = request.params;
    const { userId } = request.query;

    if (!userId) {
      return reply.code(400).send({ message: "User ID is required" });
    }

    try {
      // Check if the quest belongs to the user
      const [existing] = await db.query(
        "SELECT * FROM quests WHERE id = ? AND created_by = ?",
        [questId, userId],
      );

      if (existing.length === 0) {
        return reply
          .code(404)
          .send({ message: "Quest not found or unauthorized" });
      }

      // Delete the quest
      await db.query("DELETE FROM quests WHERE id = ? AND created_by = ?", [
        questId,
        userId,
      ]);

      return reply.send({ message: "Quest deleted successfully" });
    } catch (error) {
      console.error("❌ Error deleting quest:", error);
      return reply.code(500).send({ message: "Internal Server Error" });
    }
  });

  fastify.put("/:id", async (request, reply) => {
    const connection = await db.getConnection();
    try {
      const { id: questId } = request.params;
      const userId = request.session.userId;
      const { name, description, schedule } = request.body;

      if (!userId) {
        return reply
          .code(401)
          .send({ message: "Unauthorized: Please log in." });
      }
      if (!name || !schedule) {
        return reply
          .code(400)
          .send({ message: "Missing required fields (name, schedule)." });
      }

      await connection.beginTransaction();

      // --- Step 1: VERIFY the quest exists and the user owns it ---
      const [existingQuest] = await connection.query(
        `SELECT id FROM quests WHERE id = ? AND created_by = ?`,
        [questId, userId],
      );

      // If the query returns no rows, then we know the quest is not found or owned by the user.
      if (existingQuest.length === 0) {
        await connection.rollback(); // Stop and rollback immediately.
        return reply.code(404).send({
          message: "Quest not found or you do not have permission to edit it.",
        });
      }

      // --- Step 2: UPDATE the core quest details (if they have changed) ---
      // Now that we know the quest exists, we can safely run the UPDATE.
      // We no longer need to check for affectedRows because 0 is a valid result.
      await connection.query(
        `UPDATE quests SET name = ?, description = ? WHERE id = ? AND created_by = ?`,
        [name, description || "", questId, userId],
      );
      console.log("✅ Quest details updated for quest ID:", questId);

      // --- Step 3: Update the schedule details (using your existing upsert logic) ---
      const [existingSchedule] = await connection.query(
        `SELECT quest_id FROM scheduled_quests WHERE quest_id = ? AND user_id = ?`,
        [questId, userId],
      );

      if (existingSchedule.length > 0) {
        await connection.query(
          `UPDATE scheduled_quests SET schedule_details = ? WHERE quest_id = ? AND user_id = ?`,
          [JSON.stringify(schedule), questId, userId],
        );
        console.log("📆 Quest schedule updated for quest ID:", questId);
      } else {
        await connection.query(
          `INSERT INTO scheduled_quests (quest_id, user_id, schedule_details) VALUES (?, ?, ?)`,
          [questId, userId, JSON.stringify(schedule)],
        );
        console.log("📆 Quest schedule created for quest ID:", questId);
      }

      await connection.commit();
      reply.code(200).send({ message: "Quest updated successfully" });
    } catch (error) {
      await connection.rollback();
      console.error("Error updating quest:", error);
      reply.code(500).send({ message: "Internal Server Error" });
    } finally {
      connection.release();
    }
  });
}
