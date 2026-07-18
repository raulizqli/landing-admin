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

  if (
    route.type === 'contact'
    || route.type === 'services_index'
    || route.type === 'case_studies_index'
    || route.type === 'blog_index'
  ) {
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

  if (route.type === 'case_study') {
    return (
      <div className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <input type="text" placeholder="Client" value={content.client || ''} onChange={(e) => setContent({ client: e.target.value })} className="w-full rounded-lg border p-2 text-xs" />
          <input type="text" placeholder="Industry" value={content.industry || ''} onChange={(e) => setContent({ industry: e.target.value })} className="w-full rounded-lg border p-2 text-xs" />
        </div>
        <textarea placeholder="Summary" rows={2} value={content.summary || ''} onChange={(e) => setContent({ summary: e.target.value })} className="w-full rounded-lg border p-2 text-xs" />
        <textarea placeholder="Problem" rows={3} value={content.problem || ''} onChange={(e) => setContent({ problem: e.target.value })} className="w-full rounded-lg border p-2 text-xs" />
        <textarea placeholder="Solution" rows={3} value={content.solution || ''} onChange={(e) => setContent({ solution: e.target.value })} className="w-full rounded-lg border p-2 text-xs" />
        <StringListEditor label="Architecture" values={content.architecture} onChange={(architecture) => setContent({ architecture })} />
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
        <input type="text" placeholder="Timeline" value={content.timeline || ''} onChange={(e) => setContent({ timeline: e.target.value })} className="w-full rounded-lg border p-2 text-xs" />
        <StringListEditor
          label="Results (Label: Value)"
          values={(content.results || []).map((item) => `${item.label || ''}: ${item.value || ''}`)}
          onChange={(rows) => setContent({
            results: rows.map((row) => {
              const [label, ...rest] = String(row).split(':');
              return { label: (label || '').trim(), value: rest.join(':').trim() };
            }),
          })}
        />
        <textarea placeholder="Testimonial quote" rows={2} value={content.testimonialQuote || ''} onChange={(e) => setContent({ testimonialQuote: e.target.value })} className="w-full rounded-lg border p-2 text-xs" />
        <div className="grid gap-3 sm:grid-cols-2">
          <input type="text" placeholder="Testimonial author" value={content.testimonialAuthor || ''} onChange={(e) => setContent({ testimonialAuthor: e.target.value })} className="w-full rounded-lg border p-2 text-xs" />
          <input type="text" placeholder="Testimonial role" value={content.testimonialRole || ''} onChange={(e) => setContent({ testimonialRole: e.target.value })} className="w-full rounded-lg border p-2 text-xs" />
        </div>
      </div>
    );
  }

  if (route.type === 'blog_post') {
    return (
      <div className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-3">
          <input type="text" placeholder="Category" value={content.category || ''} onChange={(e) => setContent({ category: e.target.value })} className="w-full rounded-lg border p-2 text-xs" />
          <input type="date" value={content.date || ''} onChange={(e) => setContent({ date: e.target.value })} className="w-full rounded-lg border p-2 text-xs" />
          <input type="number" min="1" placeholder="Minutes" value={content.readingMinutes || 5} onChange={(e) => setContent({ readingMinutes: Number(e.target.value) || 5 })} className="w-full rounded-lg border p-2 text-xs" />
        </div>
        <textarea placeholder="Excerpt" rows={2} value={content.excerpt || ''} onChange={(e) => setContent({ excerpt: e.target.value })} className="w-full rounded-lg border p-2 text-xs" />
        <StringListEditor label="Body paragraphs" values={content.body} onChange={(body) => setContent({ body })} />
        <label className="block text-[11px]">
          <span className="mb-1 block font-bold uppercase text-gray-400">Tags (comma-separated)</span>
          <input
            type="text"
            value={(content.tags || []).join(', ')}
            onChange={(e) => setContent({
              tags: e.target.value.split(',').map((item) => item.trim()).filter(Boolean),
            })}
            className="w-full rounded-lg border p-2 text-xs"
          />
        </label>
      </div>
    );
  }

  if (route.type === 'estimate') {
    return (
      <div className="space-y-3">
        <input type="text" placeholder="Headline" value={content.headline || ''} onChange={(e) => setContent({ headline: e.target.value })} className="w-full rounded-lg border p-2 text-xs" />
        <textarea placeholder="Body" rows={2} value={content.body || ''} onChange={(e) => setContent({ body: e.target.value })} className="w-full rounded-lg border p-2 text-xs" />
        <div className="grid gap-3 sm:grid-cols-3">
          <label className="block text-[11px]">
            <span className="mb-1 block font-bold uppercase text-gray-400">MVP base</span>
            <input type="number" value={content.baseMvp || 12000} onChange={(e) => setContent({ baseMvp: Number(e.target.value) || 0 })} className="w-full rounded-lg border p-2 text-xs" />
          </label>
          <label className="block text-[11px]">
            <span className="mb-1 block font-bold uppercase text-gray-400">Product base</span>
            <input type="number" value={content.baseProduct || 28000} onChange={(e) => setContent({ baseProduct: Number(e.target.value) || 0 })} className="w-full rounded-lg border p-2 text-xs" />
          </label>
          <label className="block text-[11px]">
            <span className="mb-1 block font-bold uppercase text-gray-400">Platform base</span>
            <input type="number" value={content.basePlatform || 55000} onChange={(e) => setContent({ basePlatform: Number(e.target.value) || 0 })} className="w-full rounded-lg border p-2 text-xs" />
          </label>
        </div>
      </div>
    );
  }

  if (route.type === 'resources') {
    return (
      <div className="space-y-3">
        <input type="text" placeholder="Headline" value={content.headline || ''} onChange={(e) => setContent({ headline: e.target.value })} className="w-full rounded-lg border p-2 text-xs" />
        <textarea placeholder="Body" rows={2} value={content.body || ''} onChange={(e) => setContent({ body: e.target.value })} className="w-full rounded-lg border p-2 text-xs" />
        <StringListEditor label="Checklist items" values={content.checklist} onChange={(checklist) => setContent({ checklist })} />
        <input type="text" placeholder="Guide title" value={content.guideTitle || ''} onChange={(e) => setContent({ guideTitle: e.target.value })} className="w-full rounded-lg border p-2 text-xs" />
        <textarea placeholder="Guide body" rows={3} value={content.guideBody || ''} onChange={(e) => setContent({ guideBody: e.target.value })} className="w-full rounded-lg border p-2 text-xs" />
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

  const addRoute = (type, title) => {
    if (type === 'estimate' && routes.some((item) => item.type === 'estimate')) return;
    if (type === 'resources' && routes.some((item) => item.type === 'resources')) return;

    const count = routes.filter((route) => route.type === type).length + 1;
    const slug = type === 'service' || type === 'case_study' || type === 'blog_post'
      ? `${type.replaceAll('_', '-')}-${count}`
      : '';
    const route = createEmptyMarketingRoute({
      type,
      slug,
      title: title || `New ${type}`,
      sortOrder: 20 + routes.length,
    });
    let next = [...routes];
    if (type === 'case_study' && !routes.some((item) => item.type === 'case_studies_index')) {
      next.push(createEmptyMarketingRoute({
        id: 'case-studies-index',
        type: 'case_studies_index',
        title: 'Case Studies',
        sortOrder: 20,
        content: { headline: 'Case studies', body: 'Problem → Solution → Architecture → Results.' },
      }));
    }
    if (type === 'blog_post' && !routes.some((item) => item.type === 'blog_index')) {
      next.push(createEmptyMarketingRoute({
        id: 'blog-index',
        type: 'blog_index',
        title: 'Blog',
        sortOrder: 30,
        content: { headline: 'Blog', body: 'Technical notes and guides.' },
      }));
    }
    next = [...next, route];
    setRoutes(next);
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
        <button type="button" onClick={() => addRoute('service', 'New service')} className="rounded-lg border border-dashed border-indigo-300 px-2.5 py-1.5 text-[11px] font-semibold text-indigo-600">
          + Service
        </button>
        <button type="button" onClick={() => addRoute('case_study', 'New case study')} className="rounded-lg border border-dashed border-indigo-300 px-2.5 py-1.5 text-[11px] font-semibold text-indigo-600">
          + Case study
        </button>
        <button type="button" onClick={() => addRoute('blog_post', 'New blog post')} className="rounded-lg border border-dashed border-indigo-300 px-2.5 py-1.5 text-[11px] font-semibold text-indigo-600">
          + Blog post
        </button>
        {!routes.some((route) => route.type === 'estimate') && (
          <button type="button" onClick={() => addRoute('estimate', 'Estimate')} className="rounded-lg border border-dashed border-indigo-300 px-2.5 py-1.5 text-[11px] font-semibold text-indigo-600">
            + Estimate
          </button>
        )}
        {!routes.some((route) => route.type === 'resources') && (
          <button type="button" onClick={() => addRoute('resources', 'Resources')} className="rounded-lg border border-dashed border-indigo-300 px-2.5 py-1.5 text-[11px] font-semibold text-indigo-600">
            + Resources
          </button>
        )}
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
            {['service', 'case_study', 'blog_post', 'custom'].includes(activeRoute.type) && (
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

          {['service', 'case_study', 'blog_post', 'estimate', 'resources'].includes(activeRoute.type) && (
            <button
              type="button"
              className="text-[11px] font-semibold text-red-600"
              onClick={() => {
                const next = routes.filter((route) => route.id !== activeRoute.id);
                setRoutes(next);
                onSelectRoute?.(next[0]?.id || '');
              }}
            >
              Delete this route
            </button>
          )}
        </div>
      ) : (
        <p className="text-xs text-gray-500">Enable Marketing Site to seed default routes.</p>
      )}
    </div>
  );
}
