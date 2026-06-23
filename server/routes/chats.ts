import express from "express";
import { isAuthenticated } from "../middleware/authMiddleware";
import multer from "multer";
import fs from "fs";
import axios from "axios";
import FormData from "form-data";
import { Conversation } from "../models/Conversations";
import { Message } from "../models/Messages";

import { generateConversationTitle } from "../helpers/aiHelper";

const router = express.Router();
const upload = multer({ dest: "uploads/" });

router.post(
  "/",
  isAuthenticated,
  upload.single("file"),
  async (req, res): Promise<void> => {
    try {
      const { text, conversationId, model: selectedModel } = req.body;
      const file = req.file;
      const userId = (req as any).user.ID;
      const promptContent = text || "";

      if (!promptContent && !file) {
        res.status(400).json({ message: "A prompt or a file is required" });
        return;
      }

      // ── Conversation & user message ────────────────────────────
      let currentConversationId = conversationId;
      let generatedTitle = "";

      if (!currentConversationId) {
        if (promptContent) {
          // 👇 UPDATED: Passing selectedModel here so it dynamically forces Ollama locally
          generatedTitle = await generateConversationTitle(promptContent, selectedModel);
        } else {
          generatedTitle = "File Analysis";
        }

        const newConversation = await Conversation.create({
          title: generatedTitle,
          userId: userId,
        });
        currentConversationId = newConversation.ID;
      }

      await Message.create({
        conversationId: currentConversationId,
        role: "user",
        content: promptContent,
        userId: userId,
      });

      // ── Dynamic prompt extraction ──────────────────────────────
      let finalPrompt = promptContent;
      const summarizeKeywords = [
        "summarize",
        "summarise",
        "summary of",
        "tldr",
      ];
      const hasKeyword = summarizeKeywords.some((k) =>
        promptContent.toLowerCase().includes(k),
      );
      if (hasKeyword) {
        finalPrompt = promptContent
          .replace(/summarize\s*(this)?:?/i, "")
          .replace(/summarise\s*(this)?:?/i, "")
          .replace(/summary of:?/i, "")
          .replace(/tldr:?/i, "")
          .trim();
      }

      const wordCountMatch = promptContent.match(/\b(\d+)\s*words?\b/i);
      const maxWords = wordCountMatch ? parseInt(wordCountMatch[1]) : 0;
      if (wordCountMatch) {
        finalPrompt = finalPrompt.replace(/\bin\s+\d+\s*words?\b/i, "").trim();
      }

      // ── Route to FastAPI ───────────────────────────────────────
      const form = new FormData();
      const modelName = selectedModel?.split(":")?.[1] || "combined";

      if (file) {
        form.append("file", fs.createReadStream(file.path), file.originalname);
      } else {
        form.append("text", finalPrompt);
      }
      form.append("model", modelName);
      form.append("max_words", maxWords.toString());

      console.log(`Routing to Python service with model: ${modelName}`);
      const summaryResponse = await axios.post(
        "http://localhost:5001/summarize",
        form,
        { headers: form.getHeaders() },
      );
      const rawResponse =
        summaryResponse.data.summary || summaryResponse.data.final_summary;

      const aiResponse = rawResponse
        .replace(/#{1,6}\s*/g, "")
        .replace(/`/g, "")
        .trim();

      // ── Cleanup, save & respond ────────────────────────────────
      if (file) {
        fs.unlinkSync(file.path);
      }

      await Message.create({
        conversationId: currentConversationId,
        role: "model",
        content: aiResponse,
        userId: userId,
      });

      res.json({
        response: aiResponse,
        conversationId: currentConversationId,
        title: generatedTitle || undefined,
      });
    } catch (error: any) {
      console.error("API Error:", error);
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      res.status(500).json({ message: "Failed to get response from AI" });
    }
  },
);

export default router;