"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.askOllamaCloud = void 0;
/**
 * Authenticated bridge to Ollama Cloud so the browser never sees the API token.
 * Source of truth: this file (compiled to lib/askOllamaCloud.js).
 *
 * P0: callable requires a signed-in root user (no public HTTP proxy).
 */
const app_1 = require("firebase-admin/app");
const firestore_1 = require("firebase-admin/firestore");
const firebase_functions_1 = require("firebase-functions");
const https_1 = require("firebase-functions/v2/https");
const params_1 = require("firebase-functions/params");
const ollama_1 = require("ollama");
const callableOptions_js_1 = require("./callableOptions.js");
if ((0, app_1.getApps)().length === 0) {
    (0, app_1.initializeApp)();
}
/** Secret Manager key — set with: firebase functions:secrets:set OLLAMA_CLOUD_TOKEN */
const ollamaCloudToken = (0, params_1.defineSecret)("OLLAMA_CLOUD_TOKEN");
/** Official Ollama Cloud host (docs: https://docs.ollama.com/cloud). */
const OLLAMA_CLOUD_HOST = "https://ollama.com";
const OLLAMA_CLOUD_MODEL = "glm-5:cloud";
const USERS_COLLECTION = "users";
const MAX_PROMPT_CHARS = 8000;
function readPrompt(data) {
    if (!data || typeof data !== "object")
        return "";
    const prompt = data.prompt;
    return typeof prompt === "string" ? prompt.trim() : "";
}
async function assertRootCaller(request) {
    var _a, _b;
    if (!((_a = request.auth) === null || _a === void 0 ? void 0 : _a.uid)) {
        throw new https_1.HttpsError("unauthenticated", "Debes iniciar sesión.");
    }
    const callerDoc = await (0, firestore_1.getFirestore)()
        .collection(USERS_COLLECTION)
        .doc(request.auth.uid)
        .get();
    if (!callerDoc.exists || ((_b = callerDoc.data()) === null || _b === void 0 ? void 0 : _b.role) !== "root") {
        throw new https_1.HttpsError("permission-denied", "Solo un usuario root puede usar askOllamaCloud.");
    }
    return request.auth.uid;
}
exports.askOllamaCloud = (0, https_1.onCall)((0, callableOptions_js_1.sensitiveCallableOptions)({
    secrets: [ollamaCloudToken],
    timeoutSeconds: 120,
    memory: "512MiB",
}), async (request) => {
    await assertRootCaller(request);
    const prompt = readPrompt(request.data);
    if (!prompt) {
        throw new https_1.HttpsError("invalid-argument", "Missing required field: prompt");
    }
    if (prompt.length > MAX_PROMPT_CHARS) {
        throw new https_1.HttpsError("invalid-argument", `El prompt supera el máximo de ${MAX_PROMPT_CHARS} caracteres.`);
    }
    const token = String(ollamaCloudToken.value() || process.env.OLLAMA_CLOUD_TOKEN || "").trim();
    if (!token) {
        firebase_functions_1.logger.error("askOllamaCloud: OLLAMA_CLOUD_TOKEN is not configured");
        throw new https_1.HttpsError("failed-precondition", "OLLAMA_CLOUD_TOKEN no está configurado en Functions/Secret Manager.");
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
        return { response: response.response };
    }
    catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        firebase_functions_1.logger.error("askOllamaCloud failed", { message });
        throw new https_1.HttpsError("internal", `Ollama Cloud (${OLLAMA_CLOUD_MODEL}) no respondió: ${message.slice(0, 240)}`);
    }
});
//# sourceMappingURL=askOllamaCloud.js.map