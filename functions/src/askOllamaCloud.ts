/**
 * Authenticated bridge to Ollama Cloud so the browser never sees the API token.
 * Source of truth: this file (compiled to lib/askOllamaCloud.js).
 *
 * P0: callable requires a signed-in root user (no public HTTP proxy).
 */
import { initializeApp, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { logger } from "firebase-functions";
import { onCall, HttpsError, CallableRequest } from "firebase-functions/v2/https";
import { defineSecret } from "firebase-functions/params";
import { Ollama } from "ollama";
import { sensitiveCallableOptions } from "./callableOptions.js";

if (getApps().length === 0) {
  initializeApp();
}

/** Secret Manager key — set with: firebase functions:secrets:set OLLAMA_CLOUD_TOKEN */
const ollamaCloudToken = defineSecret("OLLAMA_CLOUD_TOKEN");

/** Official Ollama Cloud host (docs: https://docs.ollama.com/cloud). */
const OLLAMA_CLOUD_HOST = "https://ollama.com";
const OLLAMA_CLOUD_MODEL = "glm-5:cloud";
const USERS_COLLECTION = "users";
const MAX_PROMPT_CHARS = 8000;

interface AskOllamaCloudPayload {
  prompt?: string;
}

function readPrompt(data: unknown): string {
  if (!data || typeof data !== "object") return "";
  const prompt = (data as AskOllamaCloudPayload).prompt;
  return typeof prompt === "string" ? prompt.trim() : "";
}

async function assertRootCaller(request: CallableRequest) {
  if (!request.auth?.uid) {
    throw new HttpsError("unauthenticated", "Debes iniciar sesión.");
  }

  const callerDoc = await getFirestore()
    .collection(USERS_COLLECTION)
    .doc(request.auth.uid)
    .get();

  if (!callerDoc.exists || callerDoc.data()?.role !== "root") {
    throw new HttpsError("permission-denied", "Solo un usuario root puede usar askOllamaCloud.");
  }

  return request.auth.uid;
}

export const askOllamaCloud = onCall(
  sensitiveCallableOptions({
    secrets: [ollamaCloudToken],
    timeoutSeconds: 120,
    memory: "512MiB",
  }),
  async (request: CallableRequest<AskOllamaCloudPayload>) => {
    await assertRootCaller(request);

    const prompt = readPrompt(request.data);
    if (!prompt) {
      throw new HttpsError("invalid-argument", "Missing required field: prompt");
    }
    if (prompt.length > MAX_PROMPT_CHARS) {
      throw new HttpsError(
        "invalid-argument",
        `El prompt supera el máximo de ${MAX_PROMPT_CHARS} caracteres.`,
      );
    }

    const token = String(
      ollamaCloudToken.value() || process.env.OLLAMA_CLOUD_TOKEN || "",
    ).trim();
    if (!token) {
      logger.error("askOllamaCloud: OLLAMA_CLOUD_TOKEN is not configured");
      throw new HttpsError(
        "failed-precondition",
        "OLLAMA_CLOUD_TOKEN no está configurado en Functions/Secret Manager.",
      );
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

      return { response: response.response };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      logger.error("askOllamaCloud failed", { message });
      throw new HttpsError(
        "internal",
        `Ollama Cloud (${OLLAMA_CLOUD_MODEL}) no respondió: ${message.slice(0, 240)}`,
      );
    }
  },
);
