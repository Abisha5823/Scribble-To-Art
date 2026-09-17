import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware for parsing JSON with ample limit for canvas drawing base64
  app.use(express.json({ limit: "15mb" }));

  // Lazy Gemini client initialization
  let geminiClient: GoogleGenAI | null = null;
  function getGeminiClient(): GoogleGenAI | null {
    if (!process.env.GEMINI_API_KEY) return null;
    if (!geminiClient) {
      geminiClient = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });
    }
    return geminiClient;
  }

  // Health check endpoint
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  // AI Creativity Feature: "What Did You Create?"
  app.post("/api/analyze-artwork", async (req, res) => {
    try {
      const { imageBase64, startingPatternType, level } = req.body;

      if (!imageBase64) {
        return res.status(400).json({ error: "Missing imageBase64 in request" });
      }

      const client = getGeminiClient();

      if (!client) {
        // Fallback when API key is not yet set in environment
        const fallbackTitles = [
          "Whispers in Motion",
          "The Serene Horizon",
          "Cosmic Reverie",
          "Dancing Contours",
          "Hidden Wanderer",
          "Luminous Solitude",
          "Whimsical Journey",
          "Symphony of Lines",
        ];
        const randomTitle = fallbackTitles[Math.floor(Math.random() * fallbackTitles.length)];
        return res.json({
          interpretation: `A wonderfully imaginative creation blossoming out of a ${startingPatternType || "scribble"}. The flowing contours and personal brush strokes breathe life and mystery into the canvas!`,
          suggestedTitle: randomTitle,
          tags: ["Imaginative", "Expressive", "Original"],
          isFallback: true,
        });
      }

      // Extract raw base64 data if it has data URL prefix
      let cleanBase64 = imageBase64;
      let mimeType = "image/png";
      if (cleanBase64.startsWith("data:")) {
        const matches = cleanBase64.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
        if (matches && matches.length === 3) {
          mimeType = matches[1];
          cleanBase64 = matches[2];
        }
      }

      const promptText = `You are a supportive, insightful art curator in the relaxing game "Scribble to Art".
The player was given a random procedural starting pattern (${startingPatternType || "abstract scribble"}, Level ${level || 1}) and freely transformed it with their imagination into this drawing.
Carefully examine the artwork:
1. Provide a warm, uplifting, imaginative interpretation of what you see in 1 to 2 sentences (e.g., "I see a gentle breeze sweeping through a starry meadow", "A playful spirit seems to smile through the intertwining colors").
2. Suggest a poetic, evocative artwork title (2 to 5 words).
3. Suggest 3 mood/thematic keywords (e.g. ["Ethereal", "Playful", "Harmonious"]).
Return strictly JSON matching this structure:
{
  "interpretation": "string",
  "suggestedTitle": "string",
  "tags": ["string", "string", "string"]
}`;

      const response = await client.models.generateContent({
        model: "gemini-3.8-flash",
        contents: {
          parts: [
            {
              inlineData: {
                mimeType,
                data: cleanBase64,
              },
            },
            {
              text: promptText,
            },
          ],
        },
        config: {
          responseMimeType: "application/json",
          temperature: 0.7,
        },
      });

      const responseText = response.text || "";
      let parsed = null;
      try {
        parsed = JSON.parse(responseText);
      } catch {
        parsed = {
          interpretation: responseText.slice(0, 200) || "A beautiful, heartfelt creation with distinctive flow and character.",
          suggestedTitle: "Harmony of Shapes",
          tags: ["Creative", "Artistic", "Inspired"],
        };
      }

      return res.json(parsed);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";
      console.error("Failed to analyze artwork:", message);
      return res.json({
        interpretation: "A uniquely captivating piece where every line finds its purpose and harmony.",
        suggestedTitle: "Dream in Colors",
        tags: ["Creative", "Expressive", "Vibrant"],
        isFallback: true,
      });
    }
  });

  // Vite middleware in dev; static file serving in production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
