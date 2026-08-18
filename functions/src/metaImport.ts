/**
 * Import public Facebook Page + Instagram Business profile via Graph API.
 * The browser only sends a short-lived user token; this function never returns tokens.
 *
 * Mapper shape matches packages/landing-core/src/metaImport.js — keep in sync.
 */
import { onCall, HttpsError, CallableRequest } from "firebase-functions/v2/https";
import { getFirestore } from "firebase-admin/firestore";
import { initializeApp, getApps } from "firebase-admin/app";
import { sensitiveCallableOptions } from "./callableOptions.js";

if (getApps().length === 0) {
  initializeApp();
}

const USERS_COLLECTION = "users";
const BILLING_ACCOUNTS_COLLECTION = "billingAccounts";
const META_IMPORT_PLANS = new Set(["pro", "agency", "enterprise"]);

const GRAPH_VERSION = String(process.env.META_GRAPH_VERSION ?? "v21.0").trim() || "v21.0";
const PAGE_FIELDS = [
  "id",
  "name",
  "about",
  "description",
  "category",
  "phone",
  "whatsapp_number",
  "emails",
  "website",
  "username",
  "link",
  "single_line_address",
  "location",
  "cover",
  "picture",
  "instagram_business_account",
].join(",");
const ACCOUNT_FIELDS = "id,name,category,picture,instagram_business_account,access_token";
const IG_FIELDS = "id,username,name,biography,website,profile_picture_url,media.limit(8){caption,media_url,media_type,permalink}";

const callableOptions = sensitiveCallableOptions({ timeoutSeconds: 60 });

function normalizePlanId(value: unknown): string {
  const id = String(value ?? "").trim().toLowerCase();
  return META_IMPORT_PLANS.has(id) || id === "starter" ? id : "starter";
}

function isActiveStatus(status: unknown): boolean {
  const value = String(status ?? "").trim().toLowerCase();
  return value === "active" || value === "trialing";
}

async function assertMetaImportEntitlement(uid: string) {
  const profileSnap = await getFirestore().collection(USERS_COLLECTION).doc(uid).get();
  if (!profileSnap.exists) {
    throw new HttpsError("permission-denied", "Perfil de usuario no encontrado.");
  }
  const profile = profileSnap.data() ?? {};
  const role = String(profile.role ?? "").trim().toLowerCase();
  if (role === "root") return;

  const accountId = String(profile.accountId ?? uid).trim();
  const accountSnap = await getFirestore().collection(BILLING_ACCOUNTS_COLLECTION).doc(accountId).get();
  const account = accountSnap.exists ? (accountSnap.data() ?? {}) : {};
  const planId = normalizePlanId(account.plan);
  if (!isActiveStatus(account.status) || !META_IMPORT_PLANS.has(planId)) {
    throw new HttpsError(
      "permission-denied",
      "Conectar Facebook e Instagram requiere plan Pro o superior.",
    );
  }
}

function requireMetaAppConfig() {
  const appId = String(process.env.META_APP_ID ?? "").trim();
  const appSecret = String(process.env.META_APP_SECRET ?? "").trim();
  if (!appId || !appSecret) {
    throw new HttpsError(
      "failed-precondition",
      "Importar desde Facebook no está configurado (META_APP_ID / META_APP_SECRET).",
    );
  }
  return { appId, appSecret };
}

async function graphGet(path: string, token: string, params: Record<string, string> = {}) {
  const url = new URL(`https://graph.facebook.com/${GRAPH_VERSION}${path}`);
  url.searchParams.set("access_token", token);
  Object.entries(params).forEach(([key, value]) => {
    if (value) url.searchParams.set(key, value);
  });
  const response = await fetch(url, { method: "GET" });
  const body = await response.json() as {
    error?: { message?: string; code?: number };
    [key: string]: unknown;
  };
  if (!response.ok || body.error) {
    const message = String(body.error?.message ?? `Graph API ${response.status}`);
    throw new HttpsError("invalid-argument", message);
  }
  return body;
}

async function exchangeLongLivedUserToken(shortToken: string, appId: string, appSecret: string) {
  const url = new URL(`https://graph.facebook.com/${GRAPH_VERSION}/oauth/access_token`);
  url.searchParams.set("grant_type", "fb_exchange_token");
  url.searchParams.set("client_id", appId);
  url.searchParams.set("client_secret", appSecret);
  url.searchParams.set("fb_exchange_token", shortToken);
  const response = await fetch(url, { method: "GET" });
  const body = await response.json() as { access_token?: string; error?: { message?: string } };
  if (!response.ok || !body.access_token) {
    throw new HttpsError(
      "invalid-argument",
      String(body.error?.message ?? "No se pudo validar el acceso de Facebook."),
    );
  }
  return body.access_token;
}

function inferVerticalFromCategory(category: unknown): string {
  const text = String(category ?? "").trim();
  const rules: Array<[RegExp, string]> = [
    [/nail|spa|beauty|salon|cosmetic|hair|barber|est[eé]tic|maquill/i, "beauty"],
    [/dentist|dental|odont/i, "dental"],
    [/psycholog|therap|mental health|counsel/i, "psychology"],
    [/lawyer|attorney|\blaw\b|legal|abogad/i, "legal"],
    [/veterinar|\bvet\b|pet care/i, "veterinary"],
    [/gym|fitness|yoga|personal train|coach/i, "fitness"],
    [/school|educat|tutor|academ/i, "education"],
    [/shop|store|boutique|e-?comm/i, "ecommerce"],
    [/doctor|clinic|medical|physio|nutri/i, "medical"],
  ];
  const match = rules.find(([pattern]) => pattern.test(text));
  return match ? match[1] : "generic";
}

function digitsOnly(value: unknown) {
  return String(value ?? "").replace(/\D/g, "");
}

function firstNonEmpty(...values: unknown[]) {
  for (const value of values) {
    const text = String(value ?? "").trim();
    if (text) return text;
  }
  return "";
}

function formatSingleLineAddress(location: unknown) {
  if (!location || typeof location !== "object") return "";
  const node = location as Record<string, unknown>;
  return [node.street, node.city, node.state, node.zip, node.country]
    .map((part) => String(part ?? "").trim())
    .filter(Boolean)
    .join(", ");
}

function pictureUrl(node: unknown): string {
  if (typeof node === "string") return node.trim();
  if (!node || typeof node !== "object") return "";
  const record = node as Record<string, unknown>;
  const data = record.data && typeof record.data === "object"
    ? (record.data as Record<string, unknown>)
    : null;
  return firstNonEmpty(data?.url, record.source, record.url);
}

function instagramHandleFromUrl(url: unknown) {
  const raw = String(url ?? "").trim();
  if (!raw) return "";
  try {
    const parsed = new URL(raw.startsWith("http") ? raw : `https://${raw}`);
    if (!/instagram\.com$/i.test(parsed.hostname)) return "";
    return parsed.pathname.replace(/^\/+/, "").split("/")[0].replace(/^@+/, "");
  } catch {
    return "";
  }
}

function facebookHandleFromPage(page: Record<string, unknown>) {
  const username = String(page.username ?? "").trim();
  if (username) return username;
  const link = String(page.link ?? "").trim();
  if (!link) return "";
  try {
    const parsed = new URL(link);
    const slug = parsed.pathname.replace(/^\/+/, "").split("/")[0];
    if (!slug || slug === "profile.php" || slug === "pages") return "";
    return slug;
  } catch {
    return "";
  }
}

function mapsSearchUrl(address: string) {
  if (!address) return "";
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
}

function galleryFromMedia(media: unknown) {
  const record = media && typeof media === "object" ? media as Record<string, unknown> : {};
  const data = Array.isArray(record.data) ? record.data : Array.isArray(media) ? media : [];
  return data
    .filter((item) => {
      if (!item || typeof item !== "object") return false;
      const type = String((item as Record<string, unknown>).media_type ?? "").toUpperCase();
      const url = String((item as Record<string, unknown>).media_url ?? "").trim();
      return Boolean(url) && (type === "IMAGE" || type === "CAROUSEL_ALBUM" || !type);
    })
    .slice(0, 8)
    .map((item) => {
      const node = item as Record<string, unknown>;
      const caption = String(node.caption ?? "").trim();
      return {
        imageUrl: String(node.media_url ?? "").trim(),
        caption: caption.slice(0, 180),
        alt: caption.slice(0, 120),
      };
    });
}

export function mapMetaGraphToDraft(input: {
  page?: Record<string, unknown>;
  instagram?: Record<string, unknown>;
} = {}) {
  const page = input.page && typeof input.page === "object" ? input.page : {};
  const instagram = input.instagram && typeof input.instagram === "object" ? input.instagram : {};
  const name = firstNonEmpty(page.name, instagram.name);
  const about = firstNonEmpty(page.about, page.description, instagram.biography);
  const specialty = firstNonEmpty(page.category);
  const location = firstNonEmpty(page.single_line_address, formatSingleLineAddress(page.location));
  const phone = digitsOnly(firstNonEmpty(page.whatsapp_number, page.phone));
  const emails = Array.isArray(page.emails) ? page.emails : [];
  const email = String(emails[0] ?? "").trim();
  const website = String(page.website ?? instagram.website ?? "").trim();
  const instagramHandle = firstNonEmpty(instagram.username, instagramHandleFromUrl(website));
  const coverUrl = pictureUrl(page.cover) || pictureUrl(instagram.profile_picture_url);
  const profileUrl = pictureUrl(page.picture) || pictureUrl(instagram.profile_picture_url);
  const galleryItems = galleryFromMedia(instagram.media);
  const hasWhatsapp = Boolean(digitsOnly(page.whatsapp_number)) || Boolean(phone);
  const tagline = about ? about.split(". ")[0].slice(0, 160) : "";

  return {
    name,
    specialty: specialty && specialty.length < 80 ? specialty : "",
    vertical: inferVerticalFromCategory(firstNonEmpty(page.category)),
    navMode: profileUrl ? "profile" : "logo",
    navIconUrl: profileUrl,
    navLogoUrl: profileUrl,
    navCtaTarget: hasWhatsapp ? "whatsapp" : email ? "email" : "link",
    navCtaLink: !hasWhatsapp && !email ? website : "",
    heroSectionEnabled: true,
    heroSlides: [
      {
        imageUrl: coverUrl,
        title: name,
        text: tagline || about.slice(0, 180),
        showTitle: true,
        showText: Boolean(tagline || about),
        showButtons: true,
        buttonsPosition: "bottom-left",
      },
    ],
    heroTitle: name,
    heroSubtitle: tagline || about.slice(0, 180),
    aboutSectionEnabled: Boolean(about),
    aboutTagline: tagline,
    aboutBio: about,
    gallerySectionEnabled: galleryItems.length > 0,
    galleryItems,
    contactSectionEnabled: true,
    location,
    locationMapsUrl: mapsSearchUrl(location),
    showLocationMap: Boolean(location),
    email,
    phone,
    phoneIsWhatsapp: hasWhatsapp,
    socialSectionEnabled: true,
    instagram: instagramHandle,
    whatsapp: phone,
    facebook: facebookHandleFromPage(page),
    seo: {
      defaultTitle: name ? `${name}${specialty ? ` | ${specialty}` : ""}` : "",
      defaultDescription: about.slice(0, 160),
      ogImageUrl: coverUrl || profileUrl,
      canonicalBaseUrl: "",
    },
  };
}

function summarizeMetaPages(accounts: unknown[]) {
  return accounts.map((item) => {
    if (!item || typeof item !== "object") return null;
    const node = item as Record<string, unknown>;
    const ig = node.instagram_business_account && typeof node.instagram_business_account === "object"
      ? node.instagram_business_account as Record<string, unknown>
      : {};
    const id = String(node.id ?? "").trim();
    if (!id) return null;
    return {
      id,
      name: String(node.name ?? "").trim(),
      category: String(node.category ?? "").trim(),
      pictureUrl: pictureUrl(node.picture),
      hasInstagram: Boolean(ig.id),
    };
  }).filter(Boolean);
}

function stripTokenFields<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((item) => stripTokenFields(item)) as T;
  }
  if (value && typeof value === "object") {
    const next: Record<string, unknown> = {};
    Object.entries(value as Record<string, unknown>).forEach(([key, nested]) => {
      if (/token/i.test(key)) return;
      next[key] = stripTokenFields(nested);
    });
    return next as T;
  }
  return value;
}

export const importMetaBusinessProfile = onCall(
  callableOptions,
  async (request: CallableRequest) => {
    if (!request.auth?.uid) {
      throw new HttpsError("unauthenticated", "Debes iniciar sesión.");
    }

    await assertMetaImportEntitlement(request.auth.uid);

    const { appId, appSecret } = requireMetaAppConfig();
    const userToken = String(request.data?.userAccessToken ?? "").trim();
    const facebookPageId = String(request.data?.facebookPageId ?? "").trim();

    if (!userToken || userToken.length < 20) {
      throw new HttpsError("invalid-argument", "Falta el acceso de Facebook.");
    }

    const longLived = await exchangeLongLivedUserToken(userToken, appId, appSecret);
    const accountsPayload = await graphGet("/me/accounts", longLived, { fields: ACCOUNT_FIELDS });
    const accounts = Array.isArray(accountsPayload.data) ? accountsPayload.data as Record<string, unknown>[] : [];

    if (!accounts.length) {
      throw new HttpsError(
        "failed-precondition",
        "Esta cuenta de Facebook no administra ninguna Página. Crea o vincula una Página de negocio.",
      );
    }

    const pages = summarizeMetaPages(accounts);
    const selected = facebookPageId
      ? accounts.find((item) => String(item.id) === facebookPageId)
      : accounts.length === 1
        ? accounts[0]
        : null;

    if (!selected) {
      return {
        ok: true,
        needsPageChoice: true,
        pages,
      };
    }

    const pageToken = String(selected.access_token ?? "").trim();
    if (!pageToken) {
      throw new HttpsError(
        "permission-denied",
        "No hay permiso para leer esa Página. Revisa que seas administrador.",
      );
    }

    const page = await graphGet(`/${String(selected.id)}`, pageToken, { fields: PAGE_FIELDS }) as Record<string, unknown>;
    let instagram: Record<string, unknown> = {};
    const igAccount = page.instagram_business_account && typeof page.instagram_business_account === "object"
      ? page.instagram_business_account as Record<string, unknown>
      : selected.instagram_business_account && typeof selected.instagram_business_account === "object"
        ? selected.instagram_business_account as Record<string, unknown>
        : {};
    const igId = String(igAccount.id ?? "").trim();
    if (igId) {
      try {
        instagram = await graphGet(`/${igId}`, pageToken, { fields: IG_FIELDS }) as Record<string, unknown>;
      } catch {
        instagram = {};
      }
    }

    const draft = mapMetaGraphToDraft({ page, instagram });

    return {
      ok: true,
      needsPageChoice: false,
      pages,
      selectedPageId: String(selected.id),
      draft: stripTokenFields(draft),
      source: {
        facebookPageId: String(selected.id),
        facebookName: String(page.name ?? selected.name ?? ""),
        instagram: String(instagram.username ?? ""),
      },
    };
  },
);
