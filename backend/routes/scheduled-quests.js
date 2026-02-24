import db from "../db.js";

export default async function scheduledQuestRoutes(fastify, options) {
  fastify.get("/:userId", async (request, reply) => {
    try {
      const { userId } = request.params;

      // 1. Updated SQL Query to select the new schedule columns.
      // This query is simpler and more direct.
      const query = `
        SELECT 
            q.*, 
            sq.schedule_details,
            sq.streak,
            sq.last_completed_date
        FROM scheduled_quests sq
        JOIN quests q ON sq.quest_id = q.id
        WHERE sq.user_id = ?
        `;

      const [rows] = await db.query(query, [userId]);

      if (rows.length === 0) {
        return reply.send({
          message: "No scheduled quests found for this user",
        });
      }

      // 2. Simplified Data Processing. The complex map is no longer needed.
      // We just ensure the JSON fields are parsed correctly.
      const result = rows.map((row) => {
        return {
          ...row,
          // Safely parse JSON columns in case the driver doesn't do it automatically
          schedule_details:
            row.schedule_details && typeof row.schedule_details === "string"
              ? JSON.parse(row.schedule_details)
              : row.schedule_details,
          stat_reward:
            row.stat_reward && typeof row.stat_reward === "string"
              ? JSON.parse(row.stat_reward)
              : row.stat_reward,
        };
      });

      reply.send(result);
    } catch (error) {
      console.error("Error fetching scheduled quests:", error);
      reply.code(500).send({ message: "Internal Server Error" });
    }
  });

  fastify.post("/remove", async (request, reply) => {
    const { questId, userId, dayToRemove } = request.body;
    if (!request.session.userId || request.session.userId !== userId) {
      return reply.code(401).send({ error: "Unauthorized: Invalid Session" });
    }

    if (!questId || !userId || !dayToRemove) {
      return reply
        .code(400)
        .send({ error: "Quest ID, User ID, and dayToRemove are required" });
    }

    try {
      // Fetch the existing scheduled quest
      const [existingScheduledQuest] = await db.query(
        "SELECT * FROM scheduled_quests WHERE quest_id = ? AND user_id = ?",
        [questId, userId],
      );

      if (existingScheduledQuest.length === 0) {
        return reply
          .code(400)
          .send({ error: "You have not selected this quest" });
      }

      // Parse the existing days array from the database (JSON string to JavaScript array)
      const existingDays = JSON.parse(existingScheduledQuest[0].days || "[]");

      // Filter out the dayToRemove based on the 'day' field of the objects
      const updatedDays = existingDays.filter(
        (item) => item.day !== dayToRemove,
      );

      // If no days are left, we delete the quest entirely
      if (updatedDays.length === 0) {
        await db.query(
          "DELETE FROM scheduled_quests WHERE quest_id = ? AND user_id = ?",
          [questId, userId],
        );
        return reply
          .code(200)
          .send({ message: "Quest removed completely because no days left" });
      } else {
        // Otherwise, update the days column with the new array (after removal)
        await db.query(
          "UPDATE scheduled_quests SET days = ? WHERE quest_id = ? AND user_id = ?",
          [JSON.stringify(updatedDays), questId, userId],
        );
        return reply
          .code(200)
          .send({ message: "Day removed from scheduled quest" });
      }
    } catch (error) {
      console.error("Error removing quest:", error);
      return reply.code(500).send({
        error: "An error occurred while updating the scheduled quest",
      });
    }
  });
}
