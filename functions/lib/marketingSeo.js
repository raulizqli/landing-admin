"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.marketingRobots = exports.marketingRss = exports.marketingSitemap = void 0;
const firestore_1 = require("firebase-admin/firestore");
const https_1 = require("firebase-functions/v2/https");
const app_1 = require("firebase-admin/app");
if ((0, app_1.getApps)().length === 0) {
    (0, app_1.initializeApp)();
}
function normalizeHost(value) {
    return String(value || "")
        .trim()
        .toLowerCase()
        .replace(/^www\./, "")
        .split(":")[0];
}
async function resolvePageByRequest(req) {
    var _a, _b, _c, _d;
    const db = (0, firestore_1.getFirestore)();
    const pageIdParam = String((_d = (_b = (_a = req.query) === null || _a === void 0 ? void 0 : _a.pageId) !== null && _b !== void 0 ? _b : (_c = req.query) === null || _c === void 0 ? void 0 : _c.paginaId) !== null && _d !== void 0 ? _d : "").trim();
    if (pageIdParam) {
        const snap = await db.collection("pages").doc(pageIdParam).get();
        if (snap.exists)
            return { pageId: snap.id, data: (snap.data() || {}) };
        const legacy = await db.collection("paginas").doc(pageIdParam).get();
        if (legacy.exists)
            return { pageId: legacy.id, data: (legacy.data() || {}) };
        return null;
    }
    const host = normalizeHost(req.get("x-forwarded-host") || req.get("host") || "");
    if (!host || host.includes("localhost") || host.includes("web.app") || host.includes("firebaseapp.com")) {
        return null;
    }
    for (const collectionName of ["pages", "paginas"]) {
        const query = await db.collection(collectionName).where("customDomain", "==", host).limit(1).get();
        if (!query.empty) {
            const doc = query.docs[0];
            return { pageId: doc.id, data: (doc.data() || {}) };
        }
    }
    return null;
}
function xmlResponse(res, body, contentType) {
    res.set("Cache-Control", "public, max-age=300");
    res.set("Content-Type", contentType);
    if (!body) {
        res.status(404).send("Not found");
        return;
    }
    res.status(200).send(body);
}
async function handleFeed(req, res, kind) {
    if (req.method && req.method !== "GET" && req.method !== "HEAD") {
        res.status(405).send("Method Not Allowed");
        return;
    }
    const resolved = await resolvePageByRequest(req);
    if (!resolved || resolved.data.siteMode !== "marketing") {
        res.status(404).send("Marketing SEO feed not available for this host.");
        return;
    }
    const artifacts = resolved.data.seoArtifacts || {};
    if (kind === "sitemap") {
        xmlResponse(res, String(artifacts.sitemapXml || ""), "application/xml; charset=utf-8");
        return;
    }
    if (kind === "rss") {
        xmlResponse(res, String(artifacts.rssXml || ""), "application/rss+xml; charset=utf-8");
        return;
    }
    xmlResponse(res, String(artifacts.robotsTxt || "User-agent: *\nAllow: /\n"), "text/plain; charset=utf-8");
}
exports.marketingSitemap = (0, https_1.onRequest)({ cors: false }, async (req, res) => {
    await handleFeed(req, res, "sitemap");
});
exports.marketingRss = (0, https_1.onRequest)({ cors: false }, async (req, res) => {
    await handleFeed(req, res, "rss");
});
exports.marketingRobots = (0, https_1.onRequest)({ cors: false }, async (req, res) => {
    await handleFeed(req, res, "robots");
});
//# sourceMappingURL=marketingSeo.js.map