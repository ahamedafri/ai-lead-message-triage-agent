import type { VercelRequest, VercelResponse } from "@vercel/node";
import dotenv from "dotenv";

dotenv.config();

export default function handler(req: VercelRequest, res: VercelResponse) {
  const hasKey = !!process.env.GROQ_API_KEY;
  res.status(200).json({
    status: hasKey ? "online" : "offline",
    hasApiKey: hasKey,
    model: process.env.GROQ_MODEL || "llama-3.3-70b-versatile"
  });
}
