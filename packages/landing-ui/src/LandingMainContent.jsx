
import HeroCarousel from './HeroCarousel';
import PreHeroSection from './PreHeroSection';
import ServicesSection from './ServicesSection';
import CatalogSection from './CatalogSection';
import VideoSection from './VideoSection';
import TestimonialsSection from './TestimonialsSection';
import ContactSection from './ContactSection';
import SocialSection from './SocialSection';
import CustomEmbedSlot from './CustomEmbedSlot';
import { buildSectionBackgroundStyle, getSectionTheme } from '@raulizqli/landing-core/sectionBackground';
import { SECTION_IDS } from '@raulizqli/landing-core/sectionAnchors';
import { getLabel, resolvePageLabels } from '@raulizqli/landing-core/labels';

export default function LandingMainContent({ data, specialty, interactive = true }) {
  const labels = resolvePageLabels(data);
  const aboutTagline = data.aboutTagline || getLabel(labels, 'placeholders.aboutTagline');
  const aboutBio = data.aboutBio || getLabel(labels, 'placeholders.aboutBio');
  const aboutStyle = buildSectionBackgroundStyle(getSectionTheme(data, 'about'), { sectionKey: 'about' });

  return (
    <main>
      <CustomEmbedSlot data={data} placement="before_pre_hero" />
      <PreHeroSection data={data} />
      <CustomEmbedSlot data={data} placement="after_pre_hero" />
      <HeroCarousel data={data} specialty={specialty} interactive={interactive} />
      <CustomEmbedSlot data={data} placement="after_hero" />

      <section id={SECTION_IDS.about} className="border-y border-[#2A342D]/10" style={aboutStyle}>
        <div className="max-w-5xl mx-auto px-5 py-14 sm:py-20">
          <div className="grid md:grid-cols-2 gap-10 md:gap-16 items-start">
            <div>
              <h2 className="font-serif text-2xl sm:text-3xl text-[#2A342D] mb-6">
                {getLabel(labels, 'about.title')}
              </h2>
              <blockquote className="border-l-2 border-[#4A5D4E] pl-5 italic text-[#2A342D]/80 text-base sm:text-lg leading-relaxed">
                &ldquo;{aboutTagline}&rdquo;
              </blockquote>
            </div>
            <div className="text-sm sm:text-base text-[#2A342D]/70 leading-relaxed">
              <p>{aboutBio}</p>
            </div>
          </div>
        </div>
      </section>
      <CustomEmbedSlot data={data} placement="after_about" />

      <ServicesSection data={data} />
      <CustomEmbedSlot data={data} placement="after_services" />

      <CatalogSection data={data} interactive={interactive} />
      <CustomEmbedSlot data={data} placement="after_catalog" />

      <VideoSection data={data} />
      <CustomEmbedSlot data={data} placement="after_video" />

      <TestimonialsSection data={data} />
      <CustomEmbedSlot data={data} placement="after_testimonials" />

      <ContactSection data={data} interactive={interactive} />
      <CustomEmbedSlot data={data} placement="after_contact" />

      <SocialSection data={data} interactive={interactive} />
      <CustomEmbedSlot data={data} placement="after_social" />
      <CustomEmbedSlot data={data} placement="before_footer" />
    </main>
  );
}
