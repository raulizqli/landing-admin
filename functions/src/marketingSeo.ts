import { getFirestore } from "firebase-admin/firestore";
import { onRequest } from "firebase-functions/v2/https";
import { initializeApp, getApps } from "firebase-admin/app";

if (getApps().length === 0) {
  initializeApp();
}

type SeoArtifacts = {
  sitemapXml?: string;
  rssXml?: string;
  robotsTxt?: string;
  baseUrl?: string;
};

type PageDoc = {
  siteMode?: string;
  customDomain?: string;
  seoArtifacts?: SeoArtifacts;
  seo?: { canonicalBaseUrl?: string };
};

function normalizeHost(value: string): string {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/^www\./, "")
    .split(":")[0];
}

async function resolvePageByRequest(req: { query?: Record<string, unknown>; get: (name: string) => string | undefined }): Promise<{ pageId: string; data: PageDoc } | null> {
  const db = getFirestore();
  const pageIdParam = String(req.query?.pageId ?? req.query?.paginaId ?? "").trim();
  if (pageIdParam) {
    const snap = await db.collection("pages").doc(pageIdParam).get();
    if (snap.exists) return { pageId: snap.id, data: (snap.data() || {}) as PageDoc };
    const legacy = await db.collection("paginas").doc(pageIdParam).get();
    if (legacy.exists) return { pageId: legacy.id, data: (legacy.data() || {}) as PageDoc };
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
      return { pageId: doc.id, data: (doc.data() || {}) as PageDoc };
    }
  }
  return null;
}

function xmlResponse(res: { set: (k: string, v: string) => void; status: (n: number) => { send: (b: string) => void }; send: (b: string) => void }, body: string, contentType: string) {
  res.set("Cache-Control", "public, max-age=300");
  res.set("Content-Type", contentType);
  if (!body) {
    res.status(404).send("Not found");
    return;
  }
  res.status(200).send(body);
}

async function handleFeed(
  req: { method?: string; query?: Record<string, unknown>; get: (name: string) => string | undefined },
  res: { set: (k: string, v: string) => void; status: (n: number) => { send: (b: string) => void }; send: (b: string) => void },
  kind: "sitemap" | "rss" | "robots",
) {
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

export const marketingSitemap = onRequest({ cors: false }, async (req, res) => {
  await handleFeed(req, res, "sitemap");
});

export const marketingRss = onRequest({ cors: false }, async (req, res) => {
  await handleFeed(req, res, "rss");
});

export const marketingRobots = onRequest({ cors: false }, async (req, res) => {
  await handleFeed(req, res, "robots");
});
