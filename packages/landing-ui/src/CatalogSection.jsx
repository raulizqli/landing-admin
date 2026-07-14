
import {
  getVisibleCatalogItems,
  resolveCatalogItemLink,
  shouldShowCatalogSection,
  splitCatalogSectionText,
} from '@raulizqli/landing-core/catalog';
import { buildSectionBackgroundStyle, getSectionTheme } from '@raulizqli/landing-core/sectionBackground';
import { SECTION_IDS } from '@raulizqli/landing-core/sectionAnchors';
import { getLabel, resolvePageLabels } from '@raulizqli/landing-core/labels';

function CatalogCard({ item, interactive = true, labels }) {
  const imageUrl = String(item.imageUrl ?? '').trim();
  const title = String(item.title ?? '').trim();
  const description = String(item.description ?? '').trim();
  const price = String(item.price ?? '').trim();
  const itemLink = resolveCatalogItemLink(item);

  return (
    <article className="bg-white rounded-2xl border border-[#2A342D]/10 shadow-sm overflow-hidden h-full flex flex-col">
      {imageUrl ? (
        <div className="aspect-[4/3] bg-[#E8E4DB] overflow-hidden">
          <img
            src={imageUrl}
            alt={title || getLabel(labels, 'catalog.productAlt')}
            className="w-full h-full object-cover"
          />
        </div>
      ) : (
        <div className="aspect-[4/3] bg-[#E8E4DB] flex items-center justify-center">
          <span className="text-xs uppercase tracking-widest text-[#2A342D]/35">{getLabel(labels, 'catalog.noImage')}</span>
        </div>
      )}

      <div className="p-5 sm:p-6 flex flex-col flex-1">
        {title && (
          <h3 className="font-serif text-lg sm:text-xl text-[#2A342D] mb-2 leading-snug">
            {title}
          </h3>
        )}

        {description && (
          <p className="text-sm text-[#2A342D]/70 leading-relaxed flex-1 mb-4">
            {description}
          </p>
        )}

        <div className="mt-auto flex items-center justify-between gap-3 pt-2">
          {price ? (
            <p className="text-sm font-semibold text-[#4A5D4E]">{price}</p>
          ) : (
            <span />
          )}

          {itemLink && (
            interactive ? (
              <a
                href={itemLink.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-medium text-[#4A5D4E] hover:underline shrink-0"
              >
                {getLabel(labels, 'catalog.viewMore')}
              </a>
            ) : (
              <span className="text-xs font-medium text-[#4A5D4E] shrink-0">{getLabel(labels, 'catalog.viewMore')}</span>
            )
          )}
        </div>
      </div>
    </article>
  );
}

export default function CatalogSection({ data, interactive = true }) {
  if (!shouldShowCatalogSection(data)) return null;

  const labels = resolvePageLabels(data);
  const items = getVisibleCatalogItems(data);
  const sectionTitle = String(data.catalogSectionTitle ?? '').trim() || getLabel(labels, 'catalog.defaultTitle');
  const introParagraphs = splitCatalogSectionText(data.catalogSectionText);
  const sectionStyle = buildSectionBackgroundStyle(getSectionTheme(data, 'catalog'), { sectionKey: 'catalog' });

  return (
    <section id={SECTION_IDS.catalog} className="border-y border-[#2A342D]/10" style={sectionStyle}>
      <div className="max-w-5xl mx-auto px-5 py-14 sm:py-20">
        <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-12">
          <h2 className="font-serif text-2xl sm:text-3xl text-current mb-3">
            {sectionTitle}
          </h2>
          {introParagraphs.length > 0 ? (
            <div className="space-y-3 text-sm text-current/60 leading-relaxed">
              {introParagraphs.map((paragraph, index) => (
                <p key={`catalog-intro-${index}`}>{paragraph}</p>
              ))}
            </div>
          ) : (
            <p className="text-sm text-[#2A342D]/60">
              {getLabel(labels, 'catalog.defaultIntro')}
            </p>
          )}
        </div>

        <div className={`grid gap-5 sm:gap-6 ${items.length === 1 ? 'max-w-sm mx-auto' : 'sm:grid-cols-2 lg:grid-cols-3'}`}>
          {items.map((item, index) => (
            <CatalogCard key={`catalog-item-${index}`} item={item} interactive={interactive} labels={labels} />
          ))}
        </div>
      </div>
    </section>
  );
}
