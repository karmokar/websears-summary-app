import express from "express";
import crypto from "crypto";
import { isAuthenticated } from "../middleware/authMiddleware";
import { Conversation } from "../models/Conversations";
import { Message } from "../models/Messages";

const router = express.Router();
router.use(express.json());
router.use(isAuthenticated);

router.get("/", async (req, res) => {
  const userId = (req as any).user.ID;
  const conversations = await Conversation.findAll({
    where: { userId },
    order: [["updatedAt", "DESC"]],
  });
  res.json(conversations);
});

router.get("/:id", async (req, res) => {
  const userId = (req as any).user.ID;
  const conversationId = req.params.id;
  const messages = await Message.findAll({
    where: { conversationId, userId: userId },
    order: [["createdAt", "ASC"]],
  });
  res.json(messages);
});

router.post("/:id/share", async (req, res) => {
  const userId = (req as any).user.ID;
  const conversationId = req.params.id;
  try {
    const conversation = await Conversation.findOne({
      where: { ID: conversationId, userId },
    });
    if (!conversation) {
      res.status(404).json({ message: "Conversation not found" });
      return;
    }
    let token = conversation.get("shareToken") as string | null;
    if (!token) {
      token = crypto.randomBytes(16).toString("hex");
    }
    await conversation.update({ isPublic: true, shareToken: token });
    res.json({
      shareToken: token,
      shareUrl: `${process.env.PUBLIC_APP_URL || "http://localhost:5173"}/#/share/${token}`,
    });
  } catch (error: any) {
    console.error("Failed to share conversation", error);
    res.status(500).json({ message: "Failed to share conversation" });
  }
});

router.post("/:id/unshare", async (req, res) => {
  const userId = (req as any).user.ID;
  const conversationId = req.params.id;
  try {
    const conversation = await Conversation.findOne({
      where: { ID: conversationId, userId },
    });
    if (!conversation) {
      res.status(404).json({ message: "Conversation not found" });
      return;
    }
    await conversation.update({ isPublic: false });
    res.status(204).send();
  } catch (error: any) {
    console.error("Failed to unshare conversation", error);
    res.status(500).json({ message: "Failed to unshare conversation" });
  }
});

router.delete("/:id", async (req, res) => {
  const userId = (req as any).user.ID;
  const conversationId = req.params.id;

  try {
    const result = await Conversation.destroy({
      where: {
        ID: conversationId,
        userId: userId,
      },
    });
    if (result == 0) {
      res.status(400).json({
        message: "Conversation not found or you do not have permission",
      });
      return;
    }
    res.status(204).send();
  } catch (err: any) {
    res.status(500).json({ message: "Failed to delete conversation" });
  }
});

export default router;
