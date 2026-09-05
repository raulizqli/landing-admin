export const PAGE_LANGUAGES = ['es', 'en'];

export const PAGE_LANGUAGE_OPTIONS = [
  { value: 'es', label: 'Español', shortLabel: 'ES' },
  { value: 'en', label: 'English', shortLabel: 'EN' },
];

const ROOT_TEXT_FIELDS = [
  'specialty',
  'navSpecialty',
  'preHeroTitle',
  'preHeroText',
  'aboutTagline',
  'aboutBio',
  'servicesSectionTitle',
  'servicesSectionText',
  'catalogSectionTitle',
  'catalogSectionText',
  'gallerySectionTitle',
  'gallerySectionText',
  'galleryPortfolioLabel',
  'videoSectionTitle',
  'videoSectionText',
  'testimonialsSectionTitle',
  'blogSectionTitle',
  'blogSectionText',
  'location',
  'termsOfUseTitle',
  'termsOfUseBody',
  'privacyPolicyTitle',
  'privacyPolicyBody',
  'expeditionIssuerName',
];

const COLLECTION_SPECS = {
  heroSlides: {
    fields: ['title', 'text', 'customButtonLabel'],
  },
  services: {
    fields: ['title', 'description', 'listItems'],
  },
  catalogItems: {
    fields: ['title', 'description', 'price'],
  },
  galleryItems: {
    fields: ['caption', 'alt'],
  },
  expeditionDocuments: {
    fields: ['documentType', 'alt'],
  },
  videoSectionItems: {
    fields: ['caption'],
  },
  testimonials: {
    fields: ['title', 'quote'],
  },
  blogPosts: {
    fields: ['title', 'text', 'imageAlt'],
  },
  locations: {
    fields: ['label', 'address', 'email', 'phone'],
  },
  customEmbeds: {
    fields: [
      'label',
      'title',
      'htmlCode',
      'body',
      'quoteText',
      'quoteAttribution',
      'ctaText',
      'ctaButtonLabel',
    ],
    nested: {
      faqItems: ['question', 'answer'],
      steps: ['title', 'description'],
      serviceItems: ['title', 'description', 'listItems'],
    },
  },
};

function cloneTextValue(value) {
  if (Array.isArray(value)) return value.map((item) => String(item ?? ''));
  return String(value ?? '');
}

function hasValue(value) {
  if (Array.isArray(value)) return value.some((item) => String(item ?? '').trim());
  return String(value ?? '').trim().length > 0;
}

function pickLocalizedValue(activeValue, fallbackValue, baseValue) {
  if (hasValue(activeValue)) return cloneTextValue(activeValue);
  if (hasValue(fallbackValue)) return cloneTextValue(fallbackValue);
  return cloneTextValue(baseValue);
}

function pickEditingValue(activeValue, baseValue, { useRootWhenMissing = true } = {}) {
  // Preserve explicit blanks and in-progress spaces while typing in the editor.
  if (activeValue !== undefined && activeValue !== null) {
    return cloneTextValue(activeValue);
  }
  // Default language: missing keys should show root/shared content (matches live landing).
  // Secondary language: keep blanks so translators see what still needs copy.
  if (useRootWhenMissing) {
    if (Array.isArray(baseValue)) return baseValue.map((item) => String(item ?? ''));
    return cloneTextValue(baseValue);
  }
  return Array.isArray(baseValue) ? [] : '';
}

function normalizeTranslationItem(item, spec) {
  const source = item && typeof item === 'object' ? item : {};
  const result = {};

  spec.fields.forEach((field) => {
    if (source[field] !== undefined) result[field] = cloneTextValue(source[field]);
  });

  Object.entries(spec.nested || {}).forEach(([collection, fields]) => {
    const sourceItems = source[collection];
    if (!sourceItems || typeof sourceItems !== 'object' || Array.isArray(sourceItems)) return;
    result[collection] = {};
    Object.entries(sourceItems).forEach(([id, nestedItem]) => {
      const normalized = {};
      fields.forEach((field) => {
        if (nestedItem?.[field] !== undefined) {
          normalized[field] = cloneTextValue(nestedItem[field]);
        }
      });
      result[collection][id] = normalized;
    });
  });

  return result;
}

function normalizeTranslationBucket(bucket) {
  const source = bucket && typeof bucket === 'object' && !Array.isArray(bucket) ? bucket : {};
  const result = {};

  ROOT_TEXT_FIELDS.forEach((field) => {
    if (source[field] !== undefined) result[field] = cloneTextValue(source[field]);
  });

  Object.entries(COLLECTION_SPECS).forEach(([collection, spec]) => {
    const sourceItems = source[collection];
    if (!sourceItems || typeof sourceItems !== 'object' || Array.isArray(sourceItems)) return;
    result[collection] = {};
    Object.entries(sourceItems).forEach(([id, item]) => {
      result[collection][id] = normalizeTranslationItem(item, spec);
    });
  });

  return result;
}

function translationBucketHasContent(bucket) {
  if (!bucket || typeof bucket !== 'object') return false;
  return Object.values(bucket).some((value) => {
    if (Array.isArray(value)) return hasValue(value);
    if (value && typeof value === 'object') return translationBucketHasContent(value);
    return hasValue(value);
  });
}

function mergeMissingNestedTranslations(bucketNested, extractedNested, fields) {
  const sourceBucket = bucketNested && typeof bucketNested === 'object' && !Array.isArray(bucketNested)
    ? bucketNested
    : {};
  const sourceExtracted = extractedNested && typeof extractedNested === 'object' && !Array.isArray(extractedNested)
    ? extractedNested
    : {};
  const ids = [...new Set([...Object.keys(sourceExtracted), ...Object.keys(sourceBucket)])];
  const result = {};

  ids.forEach((id) => {
    const bucketItem = sourceBucket[id] && typeof sourceBucket[id] === 'object' ? sourceBucket[id] : {};
    const extractedItem = sourceExtracted[id] && typeof sourceExtracted[id] === 'object'
      ? sourceExtracted[id]
      : {};
    const merged = { ...bucketItem };
    fields.forEach((field) => {
      if (merged[field] === undefined) {
        merged[field] = cloneTextValue(extractedItem[field]);
      }
    });
    result[id] = merged;
  });

  return result;
}

/**
 * Fill gaps in a translation bucket from the page root/shared collections.
 * Keeps explicit blanks; only copies when a key is missing (undefined).
 * Rematches collection items by id, then by stable index key, then by position.
 */
function mergeMissingTranslationFields(bucket, page = {}) {
  const extracted = extractPageTranslation(page);
  const result = normalizeTranslationBucket(bucket);

  ROOT_TEXT_FIELDS.forEach((field) => {
    if (result[field] === undefined) {
      result[field] = cloneTextValue(extracted[field]);
    }
  });

  Object.entries(COLLECTION_SPECS).forEach(([collection, spec]) => {
    const pageItems = Array.isArray(page[collection]) ? page[collection] : [];
    const bucketItems = result[collection] && typeof result[collection] === 'object'
      ? { ...result[collection] }
      : {};
    const extractedItems = extracted[collection] || {};
    const unusedBucketIds = new Set(Object.keys(bucketItems));
    const mergedItems = {};

    pageItems.forEach((item, index) => {
      const id = getItemId(item, index, collection);
      const indexKey = `${collection}-${index + 1}`;
      let source = bucketItems[id];

      if (source) {
        unusedBucketIds.delete(id);
      } else if (bucketItems[indexKey]) {
        source = bucketItems[indexKey];
        unusedBucketIds.delete(indexKey);
      } else {
        const positionalId = [...unusedBucketIds][0];
        if (positionalId) {
          source = bucketItems[positionalId];
          unusedBucketIds.delete(positionalId);
        }
      }

      const extractedItem = extractedItems[id] || {};
      const merged = normalizeTranslationItem(source || {}, spec);

      spec.fields.forEach((field) => {
        if (merged[field] === undefined) {
          merged[field] = cloneTextValue(extractedItem[field]);
        }
      });

      Object.entries(spec.nested || {}).forEach(([nestedCollection, fields]) => {
        merged[nestedCollection] = mergeMissingNestedTranslations(
          merged[nestedCollection],
          extractedItem[nestedCollection],
          fields,
        );
      });

      mergedItems[id] = merged;
    });

    result[collection] = mergedItems;
  });

  return result;
}

function getItemId(item, index, collection) {
  return String(item?.id ?? '').trim() || `${collection}-${index + 1}`;
}

function extractNestedTranslations(item, nestedSpecs) {
  const result = {};
  Object.entries(nestedSpecs || {}).forEach(([collection, fields]) => {
    result[collection] = {};
    const items = Array.isArray(item?.[collection]) ? item[collection] : [];
    items.forEach((nestedItem, index) => {
      const id = getItemId(nestedItem, index, collection);
      result[collection][id] = {};
      fields.forEach((field) => {
        result[collection][id][field] = cloneTextValue(nestedItem?.[field]);
      });
    });
  });
  return result;
}

export function extractPageTranslation(page = {}) {
  const result = {};

  ROOT_TEXT_FIELDS.forEach((field) => {
    result[field] = cloneTextValue(page[field]);
  });

  Object.entries(COLLECTION_SPECS).forEach(([collection, spec]) => {
    result[collection] = {};
    const items = Array.isArray(page[collection]) ? page[collection] : [];
    items.forEach((item, index) => {
      const id = getItemId(item, index, collection);
      const translated = {};
      spec.fields.forEach((field) => {
        translated[field] = cloneTextValue(item?.[field]);
      });
      Object.assign(translated, extractNestedTranslations(item, spec.nested));
      result[collection][id] = translated;
    });
  });

  return result;
}

export function normalizePageLanguage(value, fallback = 'es') {
  return PAGE_LANGUAGES.includes(value) ? value : (PAGE_LANGUAGES.includes(fallback) ? fallback : 'es');
}

export function normalizeEnabledLanguages(value, defaultLanguage = 'es') {
  const fallback = normalizePageLanguage(defaultLanguage);
  const source = Array.isArray(value) ? value : [fallback];
  const selected = new Set(
    source
      .map((language) => normalizePageLanguage(language, fallback))
      .filter(Boolean),
  );
  selected.add(fallback);

  const languages = PAGE_LANGUAGES.filter((language) => selected.has(language));
  return languages.length > 0 ? languages : [fallback];
}

export function normalizePageTranslations(value, page = {}, defaultLanguage = 'es') {
  const source = value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  const fallback = normalizePageLanguage(defaultLanguage);
  const result = {
    en: normalizeTranslationBucket(source.en),
    es: normalizeTranslationBucket(source.es),
  };

  if (!translationBucketHasContent(result[fallback])) {
    result[fallback] = extractPageTranslation(page);
  } else {
    // Partial buckets (common after incremental i18n saves) left the CMS editor blank
    // while the public landing still fell back to root fields — heal gaps on load.
    result[fallback] = mergeMissingTranslationFields(result[fallback], page);
  }

  return result;
}

function resolveNestedCollection(
  sharedItems,
  activeItems,
  fallbackItems,
  fields,
  collection,
  fallbackEnabled,
  useRootWhenMissing = true,
) {
  return (Array.isArray(sharedItems) ? sharedItems : []).map((item, index) => {
    const id = getItemId(item, index, collection);
    const active = activeItems?.[id] || {};
    const fallback = fallbackItems?.[id] || {};
    const resolved = { ...item, id };
    fields.forEach((field) => {
      resolved[field] = fallbackEnabled
        ? pickLocalizedValue(active[field], fallback[field], item?.[field])
        : pickEditingValue(active[field], item?.[field], { useRootWhenMissing });
    });
    return resolved;
  });
}

function resolveTranslatedCollection(
  items,
  activeBucket,
  fallbackBucket,
  collection,
  spec,
  fallbackEnabled,
  useRootWhenMissing = true,
) {
  return (Array.isArray(items) ? items : []).map((item, index) => {
    const id = getItemId(item, index, collection);
    const active = activeBucket?.[collection]?.[id] || {};
    const fallback = fallbackBucket?.[collection]?.[id] || {};
    const resolved = { ...item, id };

    spec.fields.forEach((field) => {
      resolved[field] = fallbackEnabled
        ? pickLocalizedValue(active[field], fallback[field], item?.[field])
        : pickEditingValue(active[field], item?.[field], { useRootWhenMissing });
    });

    Object.entries(spec.nested || {}).forEach(([nestedCollection, fields]) => {
      resolved[nestedCollection] = resolveNestedCollection(
        item?.[nestedCollection],
        active[nestedCollection],
        fallback[nestedCollection],
        fields,
        nestedCollection,
        fallbackEnabled,
        useRootWhenMissing,
      );
    });

    return resolved;
  });
}

export function resolvePageLanguage(page = {}, requestedLanguage, options = {}) {
  const defaultLanguage = normalizePageLanguage(page.defaultLanguage ?? page.labelLanguage);
  const enabledLanguages = normalizeEnabledLanguages(page.enabledLanguages, defaultLanguage);
  const requested = normalizePageLanguage(requestedLanguage, defaultLanguage);
  const language = enabledLanguages.includes(requested) ? requested : defaultLanguage;
  const translations = normalizePageTranslations(page.translations, page, defaultLanguage);
  const activeBucket = translations[language] || {};
  const fallbackBucket = translations[defaultLanguage] || {};
  // Respect explicit fallback:false in the editor so blank values and trailing spaces survive.
  const fallbackEnabled = options.fallback !== false;
  const useRootWhenMissing = language === defaultLanguage;
  const result = {
    ...page,
    defaultLanguage,
    enabledLanguages,
    translations,
    labelLanguage: language,
    activeLanguage: language,
  };

  ROOT_TEXT_FIELDS.forEach((field) => {
    result[field] = fallbackEnabled
      ? pickLocalizedValue(activeBucket[field], fallbackBucket[field], page[field])
      : pickEditingValue(activeBucket[field], page[field], { useRootWhenMissing });
  });

  Object.entries(COLLECTION_SPECS).forEach(([collection, spec]) => {
    result[collection] = resolveTranslatedCollection(
      page[collection],
      activeBucket,
      fallbackBucket,
      collection,
      spec,
      fallbackEnabled,
      useRootWhenMissing,
    );
  });

  return result;
}

function preserveDefaultNestedItems(editedItems, defaultItems, fields, collection, useEditedText) {
  const defaultsById = new Map(
    (Array.isArray(defaultItems) ? defaultItems : []).map((item, index) => [
      getItemId(item, index, collection),
      item,
    ]),
  );

  return (Array.isArray(editedItems) ? editedItems : []).map((item, index) => {
    const id = getItemId(item, index, collection);
    const defaultItem = defaultsById.get(id) || {};
    const result = { ...item, id };
    if (!useEditedText) {
      fields.forEach((field) => {
        result[field] = cloneTextValue(defaultItem[field]);
      });
    }
    return result;
  });
}

function preserveDefaultCollection(editedItems, defaultItems, collection, spec, useEditedText) {
  const defaultsById = new Map(
    (Array.isArray(defaultItems) ? defaultItems : []).map((item, index) => [
      getItemId(item, index, collection),
      item,
    ]),
  );

  return (Array.isArray(editedItems) ? editedItems : []).map((item, index) => {
    const id = getItemId(item, index, collection);
    const defaultItem = defaultsById.get(id) || {};
    const result = { ...item, id };

    if (!useEditedText) {
      spec.fields.forEach((field) => {
        result[field] = cloneTextValue(defaultItem[field]);
      });
    }

    Object.entries(spec.nested || {}).forEach(([nestedCollection, fields]) => {
      result[nestedCollection] = preserveDefaultNestedItems(
        item?.[nestedCollection],
        defaultItem?.[nestedCollection],
        fields,
        nestedCollection,
        useEditedText,
      );
    });

    return result;
  });
}

export function updatePageTranslation(page = {}, editedPage = {}, requestedLanguage) {
  const defaultLanguage = normalizePageLanguage(page.defaultLanguage ?? page.labelLanguage);
  const language = normalizePageLanguage(requestedLanguage, defaultLanguage);
  const enabledLanguages = normalizeEnabledLanguages(page.enabledLanguages, defaultLanguage);
  const translations = normalizePageTranslations(page.translations, page, defaultLanguage);
  const defaultPage = resolvePageLanguage(page, defaultLanguage);
  const useEditedText = language === defaultLanguage;
  const next = {
    ...page,
    ...editedPage,
    defaultLanguage,
    enabledLanguages,
    labelLanguage: defaultLanguage,
  };

  ROOT_TEXT_FIELDS.forEach((field) => {
    next[field] = useEditedText
      ? cloneTextValue(editedPage[field])
      : cloneTextValue(defaultPage[field]);
  });

  Object.entries(COLLECTION_SPECS).forEach(([collection, spec]) => {
    next[collection] = preserveDefaultCollection(
      editedPage[collection],
      defaultPage[collection],
      collection,
      spec,
      useEditedText,
    );
  });

  next.translations = {
    ...translations,
    [language]: extractPageTranslation(editedPage),
  };
  delete next.activeLanguage;

  return next;
}

export function setPageLanguageConfiguration(page = {}, {
  defaultLanguage,
  enabledLanguages,
} = {}) {
  const previousDefault = normalizePageLanguage(page.defaultLanguage ?? page.labelLanguage);
  const nextDefault = normalizePageLanguage(defaultLanguage, previousDefault);
  const nextEnabled = normalizeEnabledLanguages(enabledLanguages, nextDefault);
  const translations = normalizePageTranslations(page.translations, page, previousDefault);
  const defaultPage = resolvePageLanguage(
    { ...page, translations, defaultLanguage: previousDefault, enabledLanguages: PAGE_LANGUAGES },
    nextDefault,
  );

  const result = {
    ...page,
    ...defaultPage,
    defaultLanguage: nextDefault,
    enabledLanguages: nextEnabled,
    labelLanguage: nextDefault,
    translations: {
      ...translations,
      [nextDefault]: extractPageTranslation(defaultPage),
    },
  };
  delete result.activeLanguage;
  return result;
}
