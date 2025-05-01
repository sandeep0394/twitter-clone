import express from "express";
import Battle from "../models/Battle.js";

const router = express.Router();

// Create a new battle thread
router.post("/create", async (req, res) => {
  try {
    const { topic, participants } = req.body;
    const newBattle = new Battle({ topic, participants });
    await newBattle.save();
    res.json(newBattle);
  } catch (error) {
    res.status(500).json({ error: "Failed to create battle" });
  }
});

// Fetch all battle threads
router.get("/", async (req, res) => {
  try {
    const battles = await Battle.find().sort({ createdAt: -1 });
    res.json(battles);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch battles" });
  }
});

// Submit a response to a battle
router.post("/:battleId/respond", async (req, res) => {
  try {
    const { battleId } = req.params;
    const { senderId, content } = req.body;

    const battle = await Battle.findById(battleId);
    if (!battle) return res.status(404).json({ error: "Battle not found" });

    battle.messages.push({ senderId, content, timestamp: new Date() });
    await battle.save();

    res.json(battle);
  } catch (error) {
    res.status(500).json({ error: "Failed to submit response" });
  }
});

// Vote for a response
router.post("/:battleId/vote", async (req, res) => {
  try {
    const { battleId } = req.params;
    const { userId } = req.body;

    const battle = await Battle.findById(battleId);
    if (!battle) return res.status(404).json({ error: "Battle not found" });

    const existingVote = battle.votes.find(v => v.userId === userId);

    if (existingVote) {
      existingVote.count += 1;
    } else {
      battle.votes.push({ userId, count: 1 });
    }

    await battle.save();
    res.json(battle);
  } catch (error) {
    res.status(500).json({ error: "Failed to vote" });
  }
});

export default router;
