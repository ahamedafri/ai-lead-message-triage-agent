import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { 
  classifyMessageWithGroq, 
  heuristicClassify,
  draftReplyWithGroq,
  heuristicDraftReply
} from "./src/services/classifier";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;

  app.use(express.json());

  // API Route to check connection status without leaking the key
  app.get("/api/config-status", (req, res) => {
    const hasKey = !!process.env.GROQ_API_KEY;
    res.json({
      status: hasKey ? "online" : "offline",
      hasApiKey: hasKey,
      model: process.env.GROQ_MODEL || "llama-3.3-70b-versatile"
    });
  });

  // API Route to perform classification
  app.post("/api/classify", async (req, res) => {
    const { channel, sender, message } = req.body;

    if (!message || !sender || !channel) {
      return res.status(400).json({ error: "Missing required fields: channel, sender, message" });
    }

    const apiKey = process.env.GROQ_API_KEY;
    const model = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";

    if (!apiKey) {
      console.log("No GROQ_API_KEY found, using local heuristic fallback.");
      const prediction = heuristicClassify(channel, sender, message);
      return res.json({
        ...prediction,
        _isFallback: true,
        _msg: "Demo Mode: No GROQ_API_KEY provided in .env. Using local smart heuristics."
      });
    }

    try {
      const prediction = await classifyMessageWithGroq(channel, sender, message, apiKey, model);
      return res.json(prediction);
    } catch (err: any) {
      console.error("Groq API classification failed:", err);
      const prediction = heuristicClassify(channel, sender, message);
      return res.json({
        ...prediction,
        _isFallback: true,
        _msg: `Groq Error: ${err.message || "Unknown error"}. Using local smart heuristics fallback.`
      });
    }
  });

  // API Route to generate a draft reply on demand
  app.post("/api/draft-reply", async (req, res) => {
    const { channel, sender, message, category, priority } = req.body;

    if (!message || !sender || !channel) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const apiKey = process.env.GROQ_API_KEY;
    const model = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";

    if (!apiKey) {
      console.log("No GROQ_API_KEY found, drafting reply using local heuristic fallback.");
      const response = heuristicDraftReply(channel, sender, message, category || "General", priority || "normal");
      return res.json({
        ...response,
        _isFallback: true,
        _msg: "Demo Mode: Drafted using local heuristics."
      });
    }

    try {
      const response = await draftReplyWithGroq(channel, sender, message, category || "General", priority || "normal", apiKey, model);
      return res.json(response);
    } catch (err: any) {
      console.error("Groq reply drafting failed, using heuristic fallback:", err);
      const response = heuristicDraftReply(channel, sender, message, category || "General", priority || "normal");
      return res.json({
        ...response,
        _isFallback: true,
        _msg: `Groq Error: ${err.message || "Unknown error"}. Drafted reply using fallback heuristics.`
      });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`\n🚀 Server is running!`);
    console.log(`   - Local:            http://localhost:${PORT}`);
    console.log(`   - Network loopback: http://127.0.0.1:${PORT}`);
    console.log(`   - Bound address:    http://0.0.0.0:${PORT} (for containers)\n`);
  });
}

startServer();
