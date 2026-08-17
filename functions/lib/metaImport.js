"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.importMetaBusinessProfile = void 0;
exports.mapMetaGraphToDraft = mapMetaGraphToDraft;
/**
 * Import public Facebook Page + Instagram Business profile via Graph API.
 * The browser only sends a short-lived user token; this function never returns tokens.
 *
 * Mapper shape matches packages/landing-core/src/metaImport.js — keep in sync.
 */
const https_1 = require("firebase-functions/v2/https");
const callableOptions_js_1 = require("./callableOptions.js");
const GRAPH_VERSION = String((_a = process.env.META_GRAPH_VERSION) !== null && _a !== void 0 ? _a : "v21.0").trim() || "v21.0";
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
const callableOptions = (0, callableOptions_js_1.sensitiveCallableOptions)({ timeoutSeconds: 60 });
function requireMetaAppConfig() {
    var _a, _b;
    const appId = String((_a = process.env.META_APP_ID) !== null && _a !== void 0 ? _a : "").trim();
    const appSecret = String((_b = process.env.META_APP_SECRET) !== null && _b !== void 0 ? _b : "").trim();
    if (!appId || !appSecret) {
        throw new https_1.HttpsError("failed-precondition", "Importar desde Facebook no está configurado (META_APP_ID / META_APP_SECRET).");
    }
    return { appId, appSecret };
}
async function graphGet(path, token, params = {}) {
    var _a, _b;
    const url = new URL(`https://graph.facebook.com/${GRAPH_VERSION}${path}`);
    url.searchParams.set("access_token", token);
    Object.entries(params).forEach(([key, value]) => {
        if (value)
            url.searchParams.set(key, value);
    });
    const response = await fetch(url, { method: "GET" });
    const body = await response.json();
    if (!response.ok || body.error) {
        const message = String((_b = (_a = body.error) === null || _a === void 0 ? void 0 : _a.message) !== null && _b !== void 0 ? _b : `Graph API ${response.status}`);
        throw new https_1.HttpsError("invalid-argument", message);
    }
    return body;
}
async function exchangeLongLivedUserToken(shortToken, appId, appSecret) {
    var _a, _b;
    const url = new URL(`https://graph.facebook.com/${GRAPH_VERSION}/oauth/access_token`);
    url.searchParams.set("grant_type", "fb_exchange_token");
    url.searchParams.set("client_id", appId);
    url.searchParams.set("client_secret", appSecret);
    url.searchParams.set("fb_exchange_token", shortToken);
    const response = await fetch(url, { method: "GET" });
    const body = await response.json();
    if (!response.ok || !body.access_token) {
        throw new https_1.HttpsError("invalid-argument", String((_b = (_a = body.error) === null || _a === void 0 ? void 0 : _a.message) !== null && _b !== void 0 ? _b : "No se pudo validar el acceso de Facebook."));
    }
    return body.access_token;
}
function inferVerticalFromCategory(category) {
    const text = String(category !== null && category !== void 0 ? category : "").trim();
    const rules = [
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
function digitsOnly(value) {
    return String(value !== null && value !== void 0 ? value : "").replace(/\D/g, "");
}
function firstNonEmpty(...values) {
    for (const value of values) {
        const text = String(value !== null && value !== void 0 ? value : "").trim();
        if (text)
            return text;
    }
    return "";
}
function formatSingleLineAddress(location) {
    if (!location || typeof location !== "object")
        return "";
    const node = location;
    return [node.street, node.city, node.state, node.zip, node.country]
        .map((part) => String(part !== null && part !== void 0 ? part : "").trim())
        .filter(Boolean)
        .join(", ");
}
function pictureUrl(node) {
    if (typeof node === "string")
        return node.trim();
    if (!node || typeof node !== "object")
        return "";
    const record = node;
    const data = record.data && typeof record.data === "object"
        ? record.data
        : null;
    return firstNonEmpty(data === null || data === void 0 ? void 0 : data.url, record.source, record.url);
}
function instagramHandleFromUrl(url) {
    const raw = String(url !== null && url !== void 0 ? url : "").trim();
    if (!raw)
        return "";
    try {
        const parsed = new URL(raw.startsWith("http") ? raw : `https://${raw}`);
        if (!/instagram\.com$/i.test(parsed.hostname))
            return "";
        return parsed.pathname.replace(/^\/+/, "").split("/")[0].replace(/^@+/, "");
    }
    catch (_a) {
        return "";
    }
}
function facebookHandleFromPage(page) {
    var _a, _b;
    const username = String((_a = page.username) !== null && _a !== void 0 ? _a : "").trim();
    if (username)
        return username;
    const link = String((_b = page.link) !== null && _b !== void 0 ? _b : "").trim();
    if (!link)
        return "";
    try {
        const parsed = new URL(link);
        const slug = parsed.pathname.replace(/^\/+/, "").split("/")[0];
        if (!slug || slug === "profile.php" || slug === "pages")
            return "";
        return slug;
    }
    catch (_c) {
        return "";
    }
}
function mapsSearchUrl(address) {
    if (!address)
        return "";
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
}
function galleryFromMedia(media) {
    const record = media && typeof media === "object" ? media : {};
    const data = Array.isArray(record.data) ? record.data : Array.isArray(media) ? media : [];
    return data
        .filter((item) => {
        var _a, _b;
        if (!item || typeof item !== "object")
            return false;
        const type = String((_a = item.media_type) !== null && _a !== void 0 ? _a : "").toUpperCase();
        const url = String((_b = item.media_url) !== null && _b !== void 0 ? _b : "").trim();
        return Boolean(url) && (type === "IMAGE" || type === "CAROUSEL_ALBUM" || !type);
    })
        .slice(0, 8)
        .map((item) => {
        var _a, _b;
        const node = item;
        const caption = String((_a = node.caption) !== null && _a !== void 0 ? _a : "").trim();
        return {
            imageUrl: String((_b = node.media_url) !== null && _b !== void 0 ? _b : "").trim(),
            caption: caption.slice(0, 180),
            alt: caption.slice(0, 120),
        };
    });
}
function mapMetaGraphToDraft(input = {}) {
    var _a, _b, _c;
    const page = input.page && typeof input.page === "object" ? input.page : {};
    const instagram = input.instagram && typeof input.instagram === "object" ? input.instagram : {};
    const name = firstNonEmpty(page.name, instagram.name);
    const about = firstNonEmpty(page.about, page.description, instagram.biography);
    const specialty = firstNonEmpty(page.category);
    const location = firstNonEmpty(page.single_line_address, formatSingleLineAddress(page.location));
    const phone = digitsOnly(firstNonEmpty(page.whatsapp_number, page.phone));
    const emails = Array.isArray(page.emails) ? page.emails : [];
    const email = String((_a = emails[0]) !== null && _a !== void 0 ? _a : "").trim();
    const website = String((_c = (_b = page.website) !== null && _b !== void 0 ? _b : instagram.website) !== null && _c !== void 0 ? _c : "").trim();
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
function summarizeMetaPages(accounts) {
    return accounts.map((item) => {
        var _a, _b, _c;
        if (!item || typeof item !== "object")
            return null;
        const node = item;
        const ig = node.instagram_business_account && typeof node.instagram_business_account === "object"
            ? node.instagram_business_account
            : {};
        const id = String((_a = node.id) !== null && _a !== void 0 ? _a : "").trim();
        if (!id)
            return null;
        return {
            id,
            name: String((_b = node.name) !== null && _b !== void 0 ? _b : "").trim(),
            category: String((_c = node.category) !== null && _c !== void 0 ? _c : "").trim(),
            pictureUrl: pictureUrl(node.picture),
            hasInstagram: Boolean(ig.id),
        };
    }).filter(Boolean);
}
function stripTokenFields(value) {
    if (Array.isArray(value)) {
        return value.map((item) => stripTokenFields(item));
    }
    if (value && typeof value === "object") {
        const next = {};
        Object.entries(value).forEach(([key, nested]) => {
            if (/token/i.test(key))
                return;
            next[key] = stripTokenFields(nested);
        });
        return next;
    }
    return value;
}
exports.importMetaBusinessProfile = (0, https_1.onCall)(callableOptions, async (request) => {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
    if (!((_a = request.auth) === null || _a === void 0 ? void 0 : _a.uid)) {
        throw new https_1.HttpsError("unauthenticated", "Debes iniciar sesión.");
    }
    const { appId, appSecret } = requireMetaAppConfig();
    const userToken = String((_c = (_b = request.data) === null || _b === void 0 ? void 0 : _b.userAccessToken) !== null && _c !== void 0 ? _c : "").trim();
    const facebookPageId = String((_e = (_d = request.data) === null || _d === void 0 ? void 0 : _d.facebookPageId) !== null && _e !== void 0 ? _e : "").trim();
    if (!userToken || userToken.length < 20) {
        throw new https_1.HttpsError("invalid-argument", "Falta el acceso de Facebook.");
    }
    const longLived = await exchangeLongLivedUserToken(userToken, appId, appSecret);
    const accountsPayload = await graphGet("/me/accounts", longLived, { fields: ACCOUNT_FIELDS });
    const accounts = Array.isArray(accountsPayload.data) ? accountsPayload.data : [];
    if (!accounts.length) {
        throw new https_1.HttpsError("failed-precondition", "Esta cuenta de Facebook no administra ninguna Página. Crea o vincula una Página de negocio.");
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
    const pageToken = String((_f = selected.access_token) !== null && _f !== void 0 ? _f : "").trim();
    if (!pageToken) {
        throw new https_1.HttpsError("permission-denied", "No hay permiso para leer esa Página. Revisa que seas administrador.");
    }
    const page = await graphGet(`/${String(selected.id)}`, pageToken, { fields: PAGE_FIELDS });
    let instagram = {};
    const igAccount = page.instagram_business_account && typeof page.instagram_business_account === "object"
        ? page.instagram_business_account
        : selected.instagram_business_account && typeof selected.instagram_business_account === "object"
            ? selected.instagram_business_account
            : {};
    const igId = String((_g = igAccount.id) !== null && _g !== void 0 ? _g : "").trim();
    if (igId) {
        try {
            instagram = await graphGet(`/${igId}`, pageToken, { fields: IG_FIELDS });
        }
        catch (_l) {
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
            facebookName: String((_j = (_h = page.name) !== null && _h !== void 0 ? _h : selected.name) !== null && _j !== void 0 ? _j : ""),
            instagram: String((_k = instagram.username) !== null && _k !== void 0 ? _k : ""),
        },
    };
});
//# sourceMappingURL=metaImport.js.map