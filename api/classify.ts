import type { VercelRequest, VercelResponse } from "@vercel/node";
import dotenv from "dotenv";
import { classifyMessageWithGroq, heuristicClassify } from "../src/services/classifier";

dotenv.config();

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const { channel, sender, message } = req.body;

  if (!message || !sender || !channel) {
    return res.status(400).json({ error: "Missing required fields: channel, sender, message" });
  }

  const apiKey = process.env.GROQ_API_KEY;
  const model = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";

  if (!apiKey) {
    console.log("No GROQ_API_KEY found, using local heuristic fallback.");
    const prediction = heuristicClassify(channel, sender, message);
    return res.status(200).json({
      ...prediction,
      _isFallback: true,
      _msg: "Demo Mode: No GROQ_API_KEY provided in .env. Using local smart heuristics."
    });
  }

  try {
    const prediction = await classifyMessageWithGroq(channel, sender, message, apiKey, model);
    return res.status(200).json(prediction);
  } catch (err: any) {
    console.error("Groq API classification failed:", err);
    const prediction = heuristicClassify(channel, sender, message);
    return res.status(200).json({
      ...prediction,
      _isFallback: true,
      _msg: `Groq Error: ${err.message || "Unknown error"}. Using local smart heuristics fallback.`
    });
  }
}
