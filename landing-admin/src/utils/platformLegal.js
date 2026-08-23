export const PLATFORM_PRODUCT_NAME = 'Toqua';
export const PLATFORM_OPERATOR_NAME = 'LeftSideDev';
export const DEFAULT_LEGAL_CONTACT_EMAIL = 'hello@toqua.site';

export const PLATFORM_LEGAL_KINDS = ['privacy', 'terms', 'dataDeletion'];

/** Public SPA paths (no auth). Paste the production origin into Meta / future provider consoles. */
export const PLATFORM_LEGAL_PATHS = {
  privacy: '/privacy',
  terms: '/terms',
  dataDeletion: '/data-deletion',
};

export function normalizePublicPath(pathname = '') {
  const raw = String(pathname ?? '').split(/[?#]/)[0].trim();
  if (!raw || raw === '/') return '/';
  return raw.replace(/\/+$/, '') || '/';
}

/** Direct hits boot without Auth / App Check / reCAPTCHA (see main.jsx). */
export function isPublicLegalPath(pathname = '') {
  return Object.values(PLATFORM_LEGAL_PATHS).includes(normalizePublicPath(pathname));
}

const DOCUMENTS = {
  es: {
    privacy: {
      title: 'Política de privacidad',
      updated: '17 de agosto de 2026',
      sections: [
        {
          heading: 'Quiénes somos',
          paragraphs: [
            '{product} es el panel de administración de landings operado por {operator}. Esta política describe cómo tratamos los datos personales cuando usas el panel (por ejemplo admin.toqua.site), no el contenido de cada landing de cliente.',
            'Contacto de privacidad: {email}.',
          ],
        },
        {
          heading: 'Datos que recabamos',
          paragraphs: [
            'Cuenta: nombre, correo, teléfono (si lo indicas al registrarte), rol y páginas asignadas. La autenticación la gestiona Firebase Authentication (contraseñas hasheadas; no las almacenamos en texto plano).',
            'Uso del panel: identificadores de sesión, registros técnicos y, si está activo, App Check / reCAPTCHA para proteger el acceso.',
            'Contenido que publicas: textos, imágenes y datos de negocio de tus landings, que tú controlas y puedes editar o borrar.',
            'Pagos: si contratas un plan, el cobro lo procesan Stripe o Mercado Pago. No almacenamos números completos de tarjeta.',
          ],
        },
        {
          heading: 'Facebook, Instagram y otros servicios conectados',
          paragraphs: [
            'Si conectas Facebook / Instagram para importar un perfil de negocio, Meta nos entrega (con tu autorización) datos públicos o de Página que administras: identificador y nombre de la Página, descripción, categoría, contacto publicado, fotos de perfil/portada y, si hay una cuenta profesional de Instagram vinculada, usuario, biografía y medios recientes.',
            'Usamos esos datos solo para prellenar tu landing. No publicamos en tu nombre, no leemos tu Messenger personal y no usamos los datos para anuncios de {operator}.',
            'El token de acceso se usa en el servidor durante la importación y no se guarda en Firestore. Puedes revocar el acceso en Facebook → Configuración → Aplicaciones y sitios web.',
            'Si en el futuro añadimos otros proveedores (por ejemplo Google), recabaremos solo los datos necesarios para esa función y actualizaremos esta política.',
          ],
        },
        {
          heading: 'Uso, conservación y encargados',
          paragraphs: [
            'Usamos los datos para autenticarte, prestar el CMS, importar perfiles, facturar, seguridad y soporte.',
            'Conservamos la cuenta mientras esté activa. Tras una solicitud de eliminación, borramos o anonimizamos los datos personales en un plazo razonable (normalmente 30 días), salvo copias de seguridad o obligaciones legales.',
            'Encargados habituales: Google Firebase (Auth, Firestore, Functions, Hosting, Storage), Meta (si conectas Facebook), procesadores de pago y, si lo configuras, analítica.',
          ],
        },
        {
          heading: 'Tus derechos',
          paragraphs: [
            'Puedes solicitar acceso, corrección o eliminación de tus datos escribiendo a {email} desde el correo de tu cuenta. El procedimiento de eliminación de la app está en {deletionPath}.',
            'No vendemos datos personales. No está dirigido a menores de 13 años.',
          ],
        },
      ],
    },
    terms: {
      title: 'Condiciones de servicio',
      updated: '17 de agosto de 2026',
      sections: [
        {
          heading: 'Aceptación',
          paragraphs: [
            'Al crear una cuenta o usar {product} aceptas estas condiciones. Si no estás de acuerdo, no uses el panel.',
            'Operador: {operator}. Contacto: {email}.',
          ],
        },
        {
          heading: 'El servicio',
          paragraphs: [
            '{product} permite crear, editar y publicar landings y sitios asociados. El servicio se ofrece «tal cual», con los planes vigentes (incluido un nivel gratuito con límites).',
            'Cada landing puede tener su propia política de privacidad y términos visibles para los visitantes. Tú eres responsable del contenido que publicas y de cumplir la ley aplicable a tu actividad.',
          ],
        },
        {
          heading: 'Cuentas y uso aceptable',
          paragraphs: [
            'Debes facilitar datos veraces. El acceso de nuevas cuentas puede requerir aprobación. No compartas tu contraseña.',
            'Prohibido: uso ilícito, spam, scraping abusivo, vulnerar sistemas, suplantar identidades o conectar cuentas de terceros sin autorización del titular.',
          ],
        },
        {
          heading: 'Servicios de terceros',
          paragraphs: [
            'Funciones opcionales (Facebook / Instagram, pagos, analítica, mapas, etc.) están sujetas a los términos de esos proveedores. Al conectarlas, nos autorizas a tratar los datos necesarios para esa función.',
            'Si revocas el acceso en el proveedor, la importación o el cobro pueden dejar de funcionar hasta que vuelvas a conectar.',
          ],
        },
        {
          heading: 'Responsabilidad',
          paragraphs: [
            'En la medida permitida por la ley, {operator} no responde de daños indirectos, lucro cesante o contenidos de landings de clientes. Nuestra responsabilidad agregada se limita a lo pagado por el servicio en los 12 meses anteriores (o cero si usas el plan gratuito).',
            'Podemos actualizar estas condiciones. El uso continuado tras la publicación en {termsPath} implica aceptación.',
          ],
        },
      ],
    },
    dataDeletion: {
      title: 'Eliminación de la app y de tus datos',
      updated: '17 de agosto de 2026',
      sections: [
        {
          heading: 'Cómo solicitarlo',
          paragraphs: [
            'Esta página cumple el requisito de instrucciones de eliminación de datos de Facebook / Meta y de otros servicios que conectes a {product}.',
            'Envía un correo a {email} desde la dirección de tu cuenta, con el asunto «Eliminar mi cuenta Toqua». Incluye el correo de la cuenta y, si lo sabes, el ID de usuario.',
            'Confirmaremos la solicitud y, cuando termine, te avisaremos. El plazo habitual es de 30 días.',
          ],
        },
        {
          heading: 'Qué eliminamos',
          paragraphs: [
            'Cuenta de {product}: perfil, rol, asignaciones de páginas y sesiones.',
            'Datos importados de Facebook / Instagram u otros proveedores que estén ligados a tu usuario (tokens no se persisten; el contenido ya copiado a una landing se borra si también eliminamos o nos pides borrar esas páginas).',
            'No podemos borrar copias que hayas publicado tú en otros sitios, ni datos que Meta u otro proveedor conserve en sus sistemas. Eso se gestiona en cada proveedor.',
          ],
        },
        {
          heading: 'Desconectar Facebook u otro servicio sin borrar Toqua',
          paragraphs: [
            'Facebook: Configuración y privacidad → Configuración → Aplicaciones y sitios web → Toqua / LeftSideDev → Quitar. Eso revoca el permiso; no borra tu cuenta de {product} ni las landings ya guardadas.',
            'Otros proveedores futuros: usa su panel de permisos de aplicaciones o escríbenos a {email} para que revoquemos la conexión en nuestro lado.',
            'Si solo quieres borrar una landing, un administrador puede eliminarla desde el panel sin cerrar la cuenta.',
          ],
        },
      ],
    },
  },
  en: {
    privacy: {
      title: 'Privacy policy',
      updated: 'August 17, 2026',
      sections: [
        {
          heading: 'Who we are',
          paragraphs: [
            '{product} is the landing-page admin operated by {operator}. This policy covers personal data when you use the admin (for example admin.toqua.site), not visitor-facing copy on each client landing.',
            'Privacy contact: {email}.',
          ],
        },
        {
          heading: 'Data we collect',
          paragraphs: [
            'Account: name, email, phone (if you provide it at sign-up), role, and assigned pages. Authentication is handled by Firebase Authentication (hashed passwords; we do not store plaintext passwords).',
            'Admin usage: session identifiers, technical logs, and App Check / reCAPTCHA when enabled to protect sign-in.',
            'Content you publish: texts, images, and business details on your landings, which you control and can edit or delete.',
            'Payments: plan checkout is processed by Stripe or Mercado Pago. We do not store full card numbers.',
          ],
        },
        {
          heading: 'Facebook, Instagram, and other connected services',
          paragraphs: [
            'If you connect Facebook / Instagram to import a business profile, Meta (with your permission) shares Page data you administer: Page id and name, description, category, published contact details, profile/cover photos, and, if a professional Instagram account is linked, username, biography, and recent media.',
            'We use that data only to prefill your landing. We do not post on your behalf, read personal Messenger, or use the data for {operator} ads.',
            'The access token is used server-side during import and is not stored in Firestore. You can revoke access in Facebook → Settings → Apps and websites.',
            'If we add other providers later (for example Google), we will collect only what that feature needs and update this policy.',
          ],
        },
        {
          heading: 'Use, retention, and processors',
          paragraphs: [
            'We use data to authenticate you, run the CMS, import profiles, bill, secure the service, and provide support.',
            'We keep the account while it is active. After a deletion request we delete or anonymize personal data within a reasonable period (typically 30 days), except backups or legal holds.',
            'Typical processors: Google Firebase (Auth, Firestore, Functions, Hosting, Storage), Meta (if you connect Facebook), payment processors, and analytics if you enable it.',
          ],
        },
        {
          heading: 'Your rights',
          paragraphs: [
            'You may request access, correction, or deletion by emailing {email} from your account address. App / data deletion instructions are at {deletionPath}.',
            'We do not sell personal data. The service is not directed at children under 13.',
          ],
        },
      ],
    },
    terms: {
      title: 'Terms of service',
      updated: 'August 17, 2026',
      sections: [
        {
          heading: 'Acceptance',
          paragraphs: [
            'By creating an account or using {product} you accept these terms. If you do not agree, do not use the admin.',
            'Operator: {operator}. Contact: {email}.',
          ],
        },
        {
          heading: 'The service',
          paragraphs: [
            '{product} lets you create, edit, and publish landings and related sites. The service is provided as-is, under the then-current plans (including a limited free tier).',
            'Each landing may show its own privacy policy and terms to visitors. You are responsible for the content you publish and for complying with laws that apply to your activity.',
          ],
        },
        {
          heading: 'Accounts and acceptable use',
          paragraphs: [
            'Provide accurate details. New accounts may require approval. Do not share your password.',
            'You may not use the service unlawfully, spam, scrape abusively, attack systems, impersonate others, or connect third-party accounts without the owner’s authorization.',
          ],
        },
        {
          heading: 'Third-party services',
          paragraphs: [
            'Optional features (Facebook / Instagram, payments, analytics, maps, and similar) are subject to those providers’ terms. By connecting them you authorize us to process the data needed for that feature.',
            'If you revoke access at the provider, import or billing may stop until you reconnect.',
          ],
        },
        {
          heading: 'Liability',
          paragraphs: [
            'To the extent permitted by law, {operator} is not liable for indirect damages, lost profits, or client landing content. Our aggregate liability is limited to fees you paid for the service in the prior 12 months (or zero on the free plan).',
            'We may update these terms. Continued use after they are posted at {termsPath} constitutes acceptance.',
          ],
        },
      ],
    },
    dataDeletion: {
      title: 'App and data deletion',
      updated: 'August 17, 2026',
      sections: [
        {
          heading: 'How to request it',
          paragraphs: [
            'This page is the user data deletion instructions URL for Facebook / Meta and for other services you may connect to {product}.',
            'Email {email} from your account address with the subject “Delete my Toqua account”. Include the account email and, if you know it, your user id.',
            'We will confirm the request and notify you when it is done. Typical completion is within 30 days.',
          ],
        },
        {
          heading: 'What we delete',
          paragraphs: [
            '{product} account: profile, role, page assignments, and sessions.',
            'Facebook / Instagram (or other provider) data tied to your user (tokens are not persisted; content already copied onto a landing is removed if we also delete those pages or you ask us to).',
            'We cannot delete copies you published elsewhere, or data Meta or another provider keeps on their systems. Handle that in each provider’s settings.',
          ],
        },
        {
          heading: 'Disconnect Facebook or another service without deleting Toqua',
          paragraphs: [
            'Facebook: Settings & privacy → Settings → Apps and websites → Toqua / LeftSideDev → Remove. That revokes permission; it does not delete your {product} account or saved landings.',
            'Future providers: use their app-permissions settings, or email {email} so we can disconnect on our side.',
            'To delete a single landing, an admin can remove it from the panel without closing the account.',
          ],
        },
      ],
    },
  },
};

export function getLegalContactEmail() {
  return String(import.meta.env.VITE_LEGAL_CONTACT_EMAIL ?? '').trim() || DEFAULT_LEGAL_CONTACT_EMAIL;
}

export function normalizePlatformLegalKind(value) {
  const kind = String(value ?? '').trim();
  return PLATFORM_LEGAL_KINDS.includes(kind) ? kind : 'privacy';
}

/**
 * @param {string} [origin]
 * @returns {{ privacy: string, terms: string, dataDeletion: string }}
 */
export function getPlatformLegalUrls(origin = '') {
  const base = String(origin || '').replace(/\/$/, '');
  return {
    privacy: `${base}${PLATFORM_LEGAL_PATHS.privacy}`,
    terms: `${base}${PLATFORM_LEGAL_PATHS.terms}`,
    dataDeletion: `${base}${PLATFORM_LEGAL_PATHS.dataDeletion}`,
  };
}

function interpolate(text, vars) {
  return String(text ?? '').replace(/\{(\w+)\}/g, (_, name) => {
    if (vars[name] == null) return `{${name}}`;
    return String(vars[name]);
  });
}

/**
 * @param {'privacy' | 'terms' | 'dataDeletion'} kind
 * @param {'es' | 'en'} locale
 * @param {{ email?: string }} [options]
 */
export function getPlatformLegalDocument(kind, locale = 'es', options = {}) {
  const resolvedKind = normalizePlatformLegalKind(kind);
  const lang = locale === 'en' ? 'en' : 'es';
  const source = DOCUMENTS[lang][resolvedKind];
  const email = String(options.email ?? '').trim() || getLegalContactEmail();
  const vars = {
    product: PLATFORM_PRODUCT_NAME,
    operator: PLATFORM_OPERATOR_NAME,
    email,
    deletionPath: PLATFORM_LEGAL_PATHS.dataDeletion,
    termsPath: PLATFORM_LEGAL_PATHS.terms,
    privacyPath: PLATFORM_LEGAL_PATHS.privacy,
  };

  return {
    kind: resolvedKind,
    path: PLATFORM_LEGAL_PATHS[resolvedKind],
    title: source.title,
    updated: source.updated,
    email,
    sections: source.sections.map((section) => ({
      heading: interpolate(section.heading, vars),
      paragraphs: section.paragraphs.map((paragraph) => interpolate(paragraph, vars)),
    })),
  };
}
