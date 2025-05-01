import express from "express";
import Battle from "../models/Battle.js";
import authenticateUser from "../middleware/protectRoute.js";

const router = express.Router();

// 🎯 **Create a New Battle**
router.post("/create", authenticateUser, async (req, res) => {
    try {
        const { title, description, challengeTime } = req.body;

        if (!title || !description || !challengeTime) {
            return res.status(400).json({ success: false, message: "All fields are required" });
        }

        const battle = new Battle({
            title,
            description,
            challengeTime,
            createdBy: req.user.id,
            players: [req.user.id], // Automatically add creator as Player 1
        });

        await battle.save();
        res.status(201).json({ success: true, battle });
    } catch (error) {
        console.error("🔥 Error creating battle:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
});

// 🎯 **Get All Battles**
router.get("/", async (req, res) => {
    try {
        const battles = await Battle.find()
            .populate("createdBy")
            .populate("players");
        res.json({ success: true, battles });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server error" });
    }
});

// 🎯 **Join a Battle**
router.post("/join/:battleId", authenticateUser, async (req, res) => {
    try {
        const battle = await Battle.findById(req.params.battleId);
        if (!battle) return res.status(404).json({ success: false, message: "Battle not found" });

        // If already 2 players, deny entry as player
        if (battle.players.length >= 2) {
            return res.status(403).json({ success: false, message: "Battle already has two players. You can join as a spectator." });
        }

        // Add player2
        if (!battle.players.includes(req.user.id)) {
            battle.players.push(req.user.id);
            battle.status = "waiting";
            await battle.save();
        }

        res.json({ success: true, battle, message: "Successfully joined as Player 2" });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server error" });
    }
});

// 🎯 **Spectators Voting System**
router.post("/vote/:battleId", authenticateUser, async (req, res) => {
    try {
        const { player } = req.body; // player should be "player1" or "player2"
        const battle = await Battle.findById(req.params.battleId);
        if (!battle) return res.status(404).json({ success: false, message: "Battle not found" });

        // Update vote count
        battle.votes.set(player, (battle.votes.get(player) || 0) + 1);
        await battle.save();

        res.json({ success: true, votes: battle.votes });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server error" });
    }
});

export default router;
