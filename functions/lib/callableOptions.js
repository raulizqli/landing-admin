"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sensitiveCallableOptions = sensitiveCallableOptions;
/**
 * Shared callable options for Gen2 HTTPS callables.
 * App Check is enforced outside the emulator (F12). Override with ENFORCE_APP_CHECK=0 if needed.
 */
function sensitiveCallableOptions(extra = {}) {
    var _a;
    const isEmulator = process.env.FUNCTIONS_EMULATOR === "true";
    const enforceExplicit = String((_a = process.env.ENFORCE_APP_CHECK) !== null && _a !== void 0 ? _a : "").trim();
    const enforceAppCheck = !isEmulator && enforceExplicit !== "0" && enforceExplicit.toLowerCase() !== "false";
    return Object.assign({ cors: true, invoker: "public", enforceAppCheck }, extra);
}
//# sourceMappingURL=callableOptions.js.map