import type { VercelRequest, VercelResponse } from "@vercel/node";
import dotenv from "dotenv";
import { draftReplyWithGroq, heuristicDraftReply } from "./classifier_utils";

dotenv.config();

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const { channel, sender, message, category, priority } = req.body;

  if (!message || !sender || !channel) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const apiKey = process.env.GROQ_API_KEY;
  const model = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";

  if (!apiKey) {
    console.log("No GROQ_API_KEY found, drafting reply using local heuristic fallback.");
    const response = heuristicDraftReply(channel, sender, message, category || "General", priority || "normal");
    return res.status(200).json({
      ...response,
      _isFallback: true,
      _msg: "Demo Mode: Drafted using local heuristics."
    });
  }

  try {
    const response = await draftReplyWithGroq(channel, sender, message, category || "General", priority || "normal", apiKey, model);
    return res.status(200).json(response);
  } catch (err: any) {
    console.error("Groq reply drafting failed, using heuristic fallback:", err);
    const response = heuristicDraftReply(channel, sender, message, category || "General", priority || "normal");
    return res.status(200).json({
      ...response,
      _isFallback: true,
      _msg: `Groq Error: ${err.message || "Unknown error"}. Drafted reply using fallback heuristics.`
    });
  }
}
