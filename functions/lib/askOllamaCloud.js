"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.askOllamaCloud = void 0;
/**
 * HTTPS bridge to Ollama Cloud so the browser never sees the API token.
 * Source of truth: this file (compiled to lib/askOllamaCloud.js).
 */
const firebase_functions_1 = require("firebase-functions");
const https_1 = require("firebase-functions/v2/https");
const params_1 = require("firebase-functions/params");
const ollama_1 = require("ollama");
/** Secret Manager key — set with: firebase functions:secrets:set OLLAMA_CLOUD_TOKEN */
const ollamaCloudToken = (0, params_1.defineSecret)("OLLAMA_CLOUD_TOKEN");
/** Official Ollama Cloud host (docs: https://docs.ollama.com/cloud). */
const OLLAMA_CLOUD_HOST = "https://ollama.com";
const OLLAMA_CLOUD_MODEL = "glm-5:cloud";
function readPrompt(body) {
    if (!body || typeof body !== "object")
        return "";
    const prompt = body.prompt;
    return typeof prompt === "string" ? prompt.trim() : "";
}
exports.askOllamaCloud = (0, https_1.onRequest)({
    secrets: [ollamaCloudToken],
    cors: true, // Allow POST + Content-Type from local Vite and production hosting
    timeoutSeconds: 120,
    memory: "512MiB",
}, async (req, res) => {
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
    const token = String(ollamaCloudToken.value() || process.env.OLLAMA_CLOUD_TOKEN || "").trim();
    if (!token) {
        firebase_functions_1.logger.error("askOllamaCloud: OLLAMA_CLOUD_TOKEN is not configured");
        res.status(500).json({ error: "Ollama Cloud token is not configured." });
        return;
    }
    try {
        const ollama = new ollama_1.Ollama({
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
    }
    catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        firebase_functions_1.logger.error("askOllamaCloud failed", { message, error });
        res.status(502).json({
            error: "Failed to reach Ollama Cloud",
            detail: message.slice(0, 240),
        });
    }
});
//# sourceMappingURL=askOllamaCloud.js.map