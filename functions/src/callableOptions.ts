/**
 * Shared callable options for Gen2 HTTPS callables.
 * App Check is enforced outside the emulator (F12). Override with ENFORCE_APP_CHECK=0 if needed.
 */
export function sensitiveCallableOptions(extra: Record<string, unknown> = {}) {
  const isEmulator = process.env.FUNCTIONS_EMULATOR === "true";
  const enforceExplicit = String(process.env.ENFORCE_APP_CHECK ?? "").trim();
  const enforceAppCheck = !isEmulator && enforceExplicit !== "0" && enforceExplicit.toLowerCase() !== "false";

  return {
    cors: true,
    invoker: "public" as const,
    enforceAppCheck,
    ...extra,
  };
}
