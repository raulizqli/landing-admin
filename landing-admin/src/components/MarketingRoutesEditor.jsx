import {
  createEmptyMarketingRoute,
  normalizeMarketingRoute,
  normalizeMarketingRoutes,
  pathForMarketingRoute,
  slugify,
} from '@raulizqli/landing-core/marketingSite';

function StringListEditor({ label, values, onChange }) {
  const list = Array.isArray(values) && values.length ? values : [''];
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-bold uppercase text-gray-400">{label}</p>
        <button
          type="button"
          className="text-[10px] font-semibold text-indigo-600"
          onClick={() => onChange([...list, ''])}
        >
          + Add
        </button>
      </div>
      {list.map((value, index) => (
        <div key={`${label}-${index}`} className="flex gap-2">
          <input
            type="text"
            value={value}
            onChange={(e) => {
              const next = [...list];
              next[index] = e.target.value;
              onChange(next);
            }}
            className="w-full rounded-lg border p-2 text-xs"
          />
          <button
            type="button"
            className="text-[10px] text-red-500"
            onClick={() => onChange(list.filter((_, i) => i !== index))}
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}

function FaqEditor({ faqs, onChange }) {
  const list = Array.isArray(faqs) && faqs.length ? faqs : [{ question: '', answer: '' }];
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-bold uppercase text-gray-400">FAQs</p>
        <button
          type="button"
          className="text-[10px] font-semibold text-indigo-600"
          onClick={() => onChange([...list, { question: '', answer: '' }])}
        >
          + FAQ
        </button>
      </div>
      {list.map((item, index) => (
        <div key={`faq-${index}`} className="space-y-2 rounded-lg border border-gray-100 p-2">
          <input
            type="text"
            placeholder="Question"
            value={item.question || ''}
            onChange={(e) => {
              const next = [...list];
              next[index] = { ...next[index], question: e.target.value };
              onChange(next);
            }}
            className="w-full rounded-lg border p-2 text-xs"
          />
          <textarea
            placeholder="Answer"
            rows={2}
            value={item.answer || ''}
            onChange={(e) => {
              const next = [...list];
              next[index] = { ...next[index], answer: e.target.value };
              onChange(next);
            }}
            className="w-full rounded-lg border p-2 text-xs"
          />
        </div>
      ))}
    </div>
  );
}

function RouteContentEditor({ route, onChange }) {
  const content = route.content || {};
  const setContent = (patch) => onChange({ ...route, content: { ...content, ...patch } });

  if (route.type === 'home') {
    return (
      <div className="space-y-3">
        <input
          type="text"
          placeholder="Headline"
          value={content.headline || ''}
          onChange={(e) => setContent({ headline: e.target.value })}
          className="w-full rounded-lg border p-2 text-xs"
        />
        <input
          type="text"
          placeholder="Subheadline"
          value={content.subheadline || ''}
          onChange={(e) => setContent({ subheadline: e.target.value })}
          className="w-full rounded-lg border p-2 text-xs"
        />
        <textarea
          placeholder="Supporting text"
          rows={3}
          value={content.supportingText || ''}
          onChange={(e) => setContent({ supportingText: e.target.value })}
          className="w-full rounded-lg border p-2 text-xs"
        />
      </div>
    );
  }

  if (route.type === 'contact' || route.type === 'services_index') {
    return (
      <div className="space-y-3">
        <input
          type="text"
          placeholder="Headline"
          value={content.headline || ''}
          onChange={(e) => setContent({ headline: e.target.value })}
          className="w-full rounded-lg border p-2 text-xs"
        />
        <textarea
          placeholder="Body"
          rows={3}
          value={content.body || ''}
          onChange={(e) => setContent({ body: e.target.value })}
          className="w-full rounded-lg border p-2 text-xs"
        />
      </div>
    );
  }

  if (route.type === 'service') {
    return (
      <div className="space-y-3">
        <textarea
          placeholder="Summary"
          rows={2}
          value={content.summary || ''}
          onChange={(e) => setContent({ summary: e.target.value })}
          className="w-full rounded-lg border p-2 text-xs"
        />
        <textarea
          placeholder="Who it is for"
          rows={2}
          value={content.whoFor || ''}
          onChange={(e) => setContent({ whoFor: e.target.value })}
          className="w-full rounded-lg border p-2 text-xs"
        />
        <StringListEditor label="Problems" values={content.problems} onChange={(problems) => setContent({ problems })} />
        <StringListEditor label="Benefits" values={content.benefits} onChange={(benefits) => setContent({ benefits })} />
        <label className="block text-[11px]">
          <span className="mb-1 block font-bold uppercase text-gray-400">Technologies (comma-separated)</span>
          <input
            type="text"
            value={(content.technologies || []).join(', ')}
            onChange={(e) => setContent({
              technologies: e.target.value.split(',').map((item) => item.trim()).filter(Boolean),
            })}
            className="w-full rounded-lg border p-2 text-xs"
          />
        </label>
        <StringListEditor label="Architecture" values={content.architecture} onChange={(architecture) => setContent({ architecture })} />
        <StringListEditor label="Process" values={content.process} onChange={(process) => setContent({ process })} />
        <textarea
          placeholder="Comparison with alternatives"
          rows={2}
          value={content.comparison || ''}
          onChange={(e) => setContent({ comparison: e.target.value })}
          className="w-full rounded-lg border p-2 text-xs"
        />
        <textarea
          placeholder="Expected ROI"
          rows={2}
          value={content.roi || ''}
          onChange={(e) => setContent({ roi: e.target.value })}
          className="w-full rounded-lg border p-2 text-xs"
        />
        <FaqEditor faqs={content.faqs} onChange={(faqs) => setContent({ faqs })} />
        <input
          type="text"
          placeholder="Meta description"
          value={content.metaDescription || ''}
          onChange={(e) => setContent({ metaDescription: e.target.value })}
          className="w-full rounded-lg border p-2 text-xs"
        />
      </div>
    );
  }

  return (
    <p className="text-[11px] text-gray-500">
      Editor for type “{route.type}” will arrive in a later phase. You can still enable/title/SEO this route.
    </p>
  );
}

export default function MarketingRoutesEditor({ formData, onChange, activeRouteId, onSelectRoute }) {
  const routes = normalizeMarketingRoutes(formData.marketingRoutes);
  const activeId = activeRouteId || routes[0]?.id || '';
  const activeRoute = routes.find((route) => route.id === activeId) || routes[0] || null;

  const setRoutes = (nextRoutes) => {
    onChange({
      ...formData,
      marketingRoutes: normalizeMarketingRoutes(nextRoutes),
    });
  };

  const updateActive = (nextRoute) => {
    const normalized = normalizeMarketingRoute(nextRoute);
    setRoutes(routes.map((route) => (route.id === normalized.id ? normalized : route)));
  };

  const addService = () => {
    const slug = `service-${routes.filter((route) => route.type === 'service').length + 1}`;
    const route = createEmptyMarketingRoute({
      type: 'service',
      slug,
      title: 'New service',
      sortOrder: 20 + routes.length,
      content: {
        summary: 'Describe the service outcome in one or two sentences.',
        whoFor: 'Who benefits from this service.',
      },
    });
    setRoutes([...routes, route]);
    onSelectRoute?.(route.id);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {routes.map((route) => (
          <button
            key={route.id}
            type="button"
            onClick={() => onSelectRoute?.(route.id)}
            className={`rounded-lg border px-2.5 py-1.5 text-[11px] font-medium ${
              route.id === activeRoute?.id
                ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                : 'border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {route.title || route.type}
            <span className="ml-1 font-mono text-[9px] opacity-60">{route.path}</span>
          </button>
        ))}
        <button
          type="button"
          onClick={addService}
          className="rounded-lg border border-dashed border-indigo-300 px-2.5 py-1.5 text-[11px] font-semibold text-indigo-600"
        >
          + Service page
        </button>
      </div>

      {activeRoute ? (
        <div className="space-y-3 rounded-lg border border-gray-200 p-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-[11px]">
              <span className="mb-1 block font-bold uppercase text-gray-400">Title</span>
              <input
                type="text"
                value={activeRoute.title || ''}
                onChange={(e) => updateActive({ ...activeRoute, title: e.target.value })}
                className="w-full rounded-lg border p-2 text-xs"
              />
            </label>
            {(activeRoute.type === 'service' || activeRoute.type === 'custom') && (
              <label className="block text-[11px]">
                <span className="mb-1 block font-bold uppercase text-gray-400">Slug</span>
                <input
                  type="text"
                  value={activeRoute.slug || ''}
                  onChange={(e) => {
                    const slug = slugify(e.target.value);
                    updateActive({
                      ...activeRoute,
                      slug,
                      path: pathForMarketingRoute(activeRoute.type, slug),
                    });
                  }}
                  className="w-full rounded-lg border p-2 text-xs font-mono"
                />
              </label>
            )}
          </div>

          <label className="inline-flex items-center gap-2 text-[11px]">
            <input
              type="checkbox"
              checked={activeRoute.enabled !== false}
              onChange={(e) => updateActive({ ...activeRoute, enabled: e.target.checked })}
            />
            Enabled
          </label>

          <div className="grid gap-3 sm:grid-cols-2">
            <input
              type="text"
              placeholder="SEO title"
              value={activeRoute.seo?.title || ''}
              onChange={(e) => updateActive({
                ...activeRoute,
                seo: { ...activeRoute.seo, title: e.target.value },
              })}
              className="w-full rounded-lg border p-2 text-xs"
            />
            <input
              type="text"
              placeholder="SEO description"
              value={activeRoute.seo?.description || ''}
              onChange={(e) => updateActive({
                ...activeRoute,
                seo: { ...activeRoute.seo, description: e.target.value },
              })}
              className="w-full rounded-lg border p-2 text-xs"
            />
          </div>

          <RouteContentEditor route={activeRoute} onChange={updateActive} />

          {activeRoute.type === 'service' && (
            <button
              type="button"
              className="text-[11px] font-semibold text-red-600"
              onClick={() => {
                const next = routes.filter((route) => route.id !== activeRoute.id);
                setRoutes(next);
                onSelectRoute?.(next[0]?.id || '');
              }}
            >
              Delete this service route
            </button>
          )}
        </div>
      ) : (
        <p className="text-xs text-gray-500">Enable Marketing Site to seed default routes.</p>
      )}
    </div>
  );
}
