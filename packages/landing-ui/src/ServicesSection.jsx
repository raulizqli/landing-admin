
import {
  getVisibleServices,
  shouldShowServicesSection,
  splitServicesSectionText,
} from '@raulizqli/landing-core/services';
import { buildSectionBackgroundStyle, getSectionTheme } from '@raulizqli/landing-core/sectionBackground';
import { SECTION_IDS } from '@raulizqli/landing-core/sectionAnchors';
import { getLabel, resolvePageLabels } from '@raulizqli/landing-core/labels';

function ServiceCard({ item }) {
  const imageUrl = String(item.imageUrl ?? '').trim();
  const title = String(item.title ?? '').trim();
  const description = String(item.description ?? '').trim();

  return (
    <article className="bg-white rounded-2xl border border-[#2A342D]/10 shadow-sm p-6 h-full flex flex-col">
      {imageUrl && (
        <img
          src={imageUrl}
          alt=""
          className="w-12 h-12 rounded-xl object-cover border border-[#2A342D]/10 mb-4"
        />
      )}

      {title && (
        <h3 className="font-serif text-lg sm:text-xl text-[#2A342D] mb-2 leading-snug">
          {title}
        </h3>
      )}

      {description && (
        <p className="text-sm text-[#2A342D]/70 leading-relaxed flex-1">
          {description}
        </p>
      )}
    </article>
  );
}

export default function ServicesSection({ data }) {
  if (!shouldShowServicesSection(data)) return null;

  const labels = resolvePageLabels(data);
  const items = getVisibleServices(data);
  const sectionTitle = String(data.servicesSectionTitle ?? '').trim() || getLabel(labels, 'services.defaultTitle');
  const introParagraphs = splitServicesSectionText(data.servicesSectionText);
  const sectionStyle = buildSectionBackgroundStyle(getSectionTheme(data, 'services'), { sectionKey: 'services' });

  return (
    <section id={SECTION_IDS.services} className="border-y border-[#2A342D]/10" style={sectionStyle}>
      <div className="max-w-5xl mx-auto px-5 py-14 sm:py-20">
        <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-12">
          <h2 className="font-serif text-2xl sm:text-3xl text-[#2A342D] mb-3">
            {sectionTitle}
          </h2>
          {introParagraphs.length > 0 ? (
            <div className="space-y-3 text-sm text-[#2A342D]/60 leading-relaxed">
              {introParagraphs.map((paragraph, index) => (
                <p key={`services-intro-${index}`}>{paragraph}</p>
              ))}
            </div>
          ) : (
            <p className="text-sm text-[#2A342D]/60">
              {getLabel(labels, 'services.defaultIntro')}
            </p>
          )}
        </div>

        <div className={`grid gap-5 sm:gap-6 ${items.length === 1 ? 'max-w-md mx-auto' : 'sm:grid-cols-2 lg:grid-cols-3'}`}>
          {items.map((item, index) => (
            <ServiceCard key={`service-${index}`} item={item} />
          ))}
        </div>
      </div>
    </section>
  );
}
