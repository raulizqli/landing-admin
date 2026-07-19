/**
 * HTTPS bridge to Ollama Cloud so the browser never sees the API token.
 * Source of truth: this file (compiled to lib/askOllamaCloud.js).
 */
import { logger } from "firebase-functions";
import { onRequest } from "firebase-functions/v2/https";
import { defineSecret } from "firebase-functions/params";
import { Ollama } from "ollama";

/** Secret Manager key — set with: firebase functions:secrets:set OLLAMA_CLOUD_TOKEN */
const ollamaCloudToken = defineSecret("OLLAMA_CLOUD_TOKEN");

/** Official Ollama Cloud host (docs: https://docs.ollama.com/cloud). */
const OLLAMA_CLOUD_HOST = "https://ollama.com";
const OLLAMA_CLOUD_MODEL = "glm-5:cloud";

function readPrompt(body: unknown): string {
  if (!body || typeof body !== "object") return "";
  const prompt = (body as { prompt?: unknown }).prompt;
  return typeof prompt === "string" ? prompt.trim() : "";
}

export const askOllamaCloud = onRequest(
  {
    secrets: [ollamaCloudToken],
    cors: true, // Allow POST + Content-Type from local Vite and production hosting
    timeoutSeconds: 120,
    memory: "512MiB",
  },
  async (req, res) => {
    if (req.method === "OPTIONS") {
      res.status(204).send("");
      return;
    }

    if (req.method !== "POST") {
      res.status(405).json({ error: "Method not allowed. Use POST." });
      return;
    }

    const prompt = readPrompt(req.body);
    if (!prompt) {
      res.status(400).json({ error: "Missing required field: prompt" });
      return;
    }

    // Bound secret (deploy) or .env / emulator fallback for local.
    const token = String(
      ollamaCloudToken.value() || process.env.OLLAMA_CLOUD_TOKEN || "",
    ).trim();
    if (!token) {
      logger.error("askOllamaCloud: OLLAMA_CLOUD_TOKEN is not configured");
      res.status(500).json({ error: "Ollama Cloud token is not configured." });
      return;
    }

    try {
      const ollama = new Ollama({
        host: OLLAMA_CLOUD_HOST,
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const response = await ollama.generate({
        model: OLLAMA_CLOUD_MODEL,
        prompt,
        stream: false,
      });

      res.status(200).json({ response: response.response });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      logger.error("askOllamaCloud failed", { message, error });
      res.status(502).json({
        error: "Failed to reach Ollama Cloud",
        detail: message.slice(0, 240),
      });
    }
  },
);
