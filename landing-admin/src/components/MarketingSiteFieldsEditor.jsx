import {
  createMarketingSiteSkeleton,
  normalizeSiteMode,
} from '@raulizqli/landing-core/marketingSite';

function updateMarketing(formData, patch) {
  return {
    ...formData,
    marketing: {
      ...(formData.marketing || {}),
      ...patch,
    },
  };
}

function updateSeo(formData, patch) {
  return {
    ...formData,
    seo: {
      ...(formData.seo || {}),
      ...patch,
    },
  };
}

function updateCta(formData, key, patch) {
  return updateMarketing(formData, {
    [key]: {
      ...(formData.marketing?.[key] || {}),
      ...patch,
    },
  });
}

export default function MarketingSiteFieldsEditor({
  formData,
  onChange,
  canUseMarketingSite = false,
  onUpgrade,
}) {
  const siteMode = normalizeSiteMode(formData.siteMode);
  const marketing = formData.marketing || {};
  const seo = formData.seo || {};

  const enableMarketing = () => {
    if (!canUseMarketingSite) {
      onUpgrade?.();
      return;
    }
    const hasRoutes = Array.isArray(formData.marketingRoutes) && formData.marketingRoutes.length > 0;
    onChange({
      ...formData,
      siteMode: 'marketing',
      marketingRoutes: hasRoutes
        ? formData.marketingRoutes
        : createMarketingSiteSkeleton({
          name: formData.name || 'Marketing Site',
          brand: formData.specialty || 'AI Engineering Studio',
        }),
    });
  };

  const disableMarketing = () => {
    onChange({ ...formData, siteMode: 'landing' });
  };

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wide text-gray-500">Site mode</p>
            <p className="mt-1 text-xs text-gray-700">
              {siteMode === 'marketing'
                ? 'Marketing Site — multi-page routes edited below.'
                : 'Landing — classic single-page sections.'}
            </p>
            {!canUseMarketingSite && (
              <p className="mt-2 text-[11px] text-amber-700">
                Marketing Site requires Enterprise. Root accounts bypass this gate.
              </p>
            )}
          </div>
          <span className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-semibold uppercase ${
            siteMode === 'marketing' ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-200 text-gray-600'
          }`}
          >
            {siteMode}
          </span>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {siteMode !== 'marketing' ? (
            <button
              type="button"
              onClick={enableMarketing}
              className="rounded-lg bg-indigo-600 px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-indigo-500"
            >
              {canUseMarketingSite ? 'Enable Marketing Site' : 'Upgrade to Enterprise'}
            </button>
          ) : (
            <button
              type="button"
              onClick={disableMarketing}
              className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-[11px] font-semibold text-gray-700 hover:bg-gray-100"
            >
              Switch back to Landing
            </button>
          )}
        </div>
      </div>

      {siteMode === 'marketing' && (
        <>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-[11px]">
              <span className="mb-1 block font-bold uppercase text-gray-400">Primary CTA label</span>
              <input
                type="text"
                value={marketing.primaryCta?.label || ''}
                onChange={(e) => onChange(updateCta(formData, 'primaryCta', { label: e.target.value }))}
                className="w-full rounded-lg border p-2 text-xs"
              />
            </label>
            <label className="block text-[11px]">
              <span className="mb-1 block font-bold uppercase text-gray-400">Primary CTA href</span>
              <input
                type="text"
                value={marketing.primaryCta?.href || ''}
                onChange={(e) => onChange(updateCta(formData, 'primaryCta', { href: e.target.value }))}
                className="w-full rounded-lg border p-2 text-xs"
              />
            </label>
            <label className="block text-[11px]">
              <span className="mb-1 block font-bold uppercase text-gray-400">Secondary CTA label</span>
              <input
                type="text"
                value={marketing.secondaryCta?.label || ''}
                onChange={(e) => onChange(updateCta(formData, 'secondaryCta', { label: e.target.value }))}
                className="w-full rounded-lg border p-2 text-xs"
              />
            </label>
            <label className="block text-[11px]">
              <span className="mb-1 block font-bold uppercase text-gray-400">Secondary CTA href</span>
              <input
                type="text"
                value={marketing.secondaryCta?.href || ''}
                onChange={(e) => onChange(updateCta(formData, 'secondaryCta', { href: e.target.value }))}
                className="w-full rounded-lg border p-2 text-xs"
              />
            </label>
          </div>

          <label className="block text-[11px]">
            <span className="mb-1 block font-bold uppercase text-gray-400">Calendly URL</span>
            <input
              type="url"
              value={marketing.calendlyUrl || ''}
              onChange={(e) => onChange(updateMarketing(formData, { calendlyUrl: e.target.value }))}
              className="w-full rounded-lg border p-2 text-xs"
              placeholder="https://calendly.com/..."
            />
          </label>

          <div className="flex flex-wrap gap-4 text-[11px]">
            <label className="inline-flex items-center gap-2">
              <input
                type="checkbox"
                checked={marketing.stickyCtaEnabled !== false}
                onChange={(e) => onChange(updateMarketing(formData, { stickyCtaEnabled: e.target.checked }))}
              />
              Sticky CTA
            </label>
            <label className="inline-flex items-center gap-2">
              <input
                type="checkbox"
                checked={marketing.floatingContactEnabled !== false}
                onChange={(e) => onChange(updateMarketing(formData, { floatingContactEnabled: e.target.checked }))}
              />
              Floating contact
            </label>
            <label className="inline-flex items-center gap-2">
              <input
                type="checkbox"
                checked={marketing.newsletterEnabled === true}
                onChange={(e) => onChange(updateMarketing(formData, { newsletterEnabled: e.target.checked }))}
              />
              Newsletter teaser in footer
            </label>
          </div>

          <label className="block text-[11px]">
            <span className="mb-1 block font-bold uppercase text-gray-400">Specializations (comma-separated)</span>
            <input
              type="text"
              value={(marketing.specializations || []).join(', ')}
              onChange={(e) => onChange(updateMarketing(formData, {
                specializations: e.target.value.split(',').map((item) => item.trim()).filter(Boolean),
              }))}
              className="w-full rounded-lg border p-2 text-xs"
            />
          </label>

          <label className="block text-[11px]">
            <span className="mb-1 block font-bold uppercase text-gray-400">Tech stack (comma-separated)</span>
            <input
              type="text"
              value={(marketing.techStack || []).join(', ')}
              onChange={(e) => onChange(updateMarketing(formData, {
                techStack: e.target.value.split(',').map((item) => item.trim()).filter(Boolean),
              }))}
              className="w-full rounded-lg border p-2 text-xs"
            />
          </label>

          <div className="space-y-2 rounded-lg border border-gray-200 p-3">
            <p className="text-[11px] font-bold uppercase text-gray-400">Default SEO</p>
            <input
              type="text"
              placeholder="Default title"
              value={seo.defaultTitle || ''}
              onChange={(e) => onChange(updateSeo(formData, { defaultTitle: e.target.value }))}
              className="w-full rounded-lg border p-2 text-xs"
            />
            <textarea
              placeholder="Default description"
              rows={2}
              value={seo.defaultDescription || ''}
              onChange={(e) => onChange(updateSeo(formData, { defaultDescription: e.target.value }))}
              className="w-full rounded-lg border p-2 text-xs"
            />
            <input
              type="url"
              placeholder="Canonical base URL (https://client.com)"
              value={seo.canonicalBaseUrl || ''}
              onChange={(e) => onChange(updateSeo(formData, { canonicalBaseUrl: e.target.value }))}
              className="w-full rounded-lg border p-2 text-xs"
            />
          </div>
        </>
      )}
    </div>
  );
}
