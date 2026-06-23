import express from "express";
import { Conversation } from "../models/Conversations";
import { Message } from "../models/Messages";

const router = express.Router();

router.get("/:token", async (req, res) => {
  const { token } = req.params;

  try {
    const conversation = await Conversation.findOne({
      where: { shareToken: token, isPublic: true },
    });

    if (!conversation) {
      res.status(404).json({ message: "Share conversation not found" });
      return;
    }
    const messages = await Message.findAll({
      where: { conversationId: conversation.get("ID") },
      order: [["createdAt", "ASC"]],
    });
    res.json({
      title: conversation.get("title"),
      messages,
    });
  } catch (error: any) {
    console.error("Failed to fetch the share Conversation", error);
    res.status(500).json({ message: "Failed to fetch the conversation" });
  }
});

export default router;
