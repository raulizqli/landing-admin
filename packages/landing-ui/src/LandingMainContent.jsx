
import HeroCarousel from './HeroCarousel';
import PreHeroSection from './PreHeroSection';
import ServicesSection from './ServicesSection';
import CatalogSection from './CatalogSection';
import GallerySection from './GallerySection';
import VideoSection from './VideoSection';
import TestimonialsSection from './TestimonialsSection';
import BlogSection from './BlogSection';
import ContactSection from './ContactSection';
import SocialSection from './SocialSection';
import CustomEmbedSlot from './CustomEmbedSlot';
import { buildSectionBackgroundStyle, getSectionTheme } from '@raulizqli/landing-core/sectionBackground';
import { SECTION_IDS } from '@raulizqli/landing-core/sectionAnchors';
import { getLabel, resolvePageLabels } from '@raulizqli/landing-core/labels';
import {
  isAboutSectionEnabled,
  isContactSectionEnabled,
  isHeroSectionEnabled,
  isSocialSectionEnabled,
} from '@raulizqli/landing-core/sectionVisibility';

export default function LandingMainContent({ data, specialty, interactive = true }) {
  const labels = resolvePageLabels(data);
  const aboutTagline = data.aboutTagline || getLabel(labels, 'placeholders.aboutTagline');
  const aboutBio = data.aboutBio || getLabel(labels, 'placeholders.aboutBio');
  const aboutStyle = buildSectionBackgroundStyle(getSectionTheme(data, 'about'), { sectionKey: 'about' });
  const showHero = isHeroSectionEnabled(data);
  const showAbout = isAboutSectionEnabled(data);
  const showContact = isContactSectionEnabled(data);
  const showSocial = isSocialSectionEnabled(data);

  return (
    <main>
      <CustomEmbedSlot data={data} placement="before_pre_hero" interactive={interactive} />
      <PreHeroSection data={data} />
      <CustomEmbedSlot data={data} placement="after_pre_hero" interactive={interactive} />
      {showHero && (
        <>
          <HeroCarousel data={data} specialty={specialty} interactive={interactive} />
          <CustomEmbedSlot data={data} placement="after_hero" interactive={interactive} />
        </>
      )}

      {showAbout && (
        <>
          <section id={SECTION_IDS.about} className="border-y border-[#2A342D]/10" style={aboutStyle}>
            <div className="max-w-5xl mx-auto px-5 py-14 sm:py-20">
              <h2 className="font-serif text-2xl sm:text-3xl text-current mb-8 sm:mb-10 text-center md:text-left">
                {getLabel(labels, 'about.title')}
              </h2>
              <div className="grid md:grid-cols-2 gap-10 md:gap-16 items-start">
                <blockquote className="border-l-2 border-[#4A5D4E] pl-5 italic text-current/80 text-base sm:text-lg leading-relaxed">
                  &ldquo;{aboutTagline}&rdquo;
                </blockquote>
                <div className="text-sm sm:text-base text-current/70 leading-relaxed">
                  <p>{aboutBio}</p>
                </div>
              </div>
            </div>
          </section>
          <CustomEmbedSlot data={data} placement="after_about" interactive={interactive} />
        </>
      )}

      <ServicesSection data={data} />
      <CustomEmbedSlot data={data} placement="after_services" interactive={interactive} />

      <CatalogSection data={data} interactive={interactive} />
      <CustomEmbedSlot data={data} placement="after_catalog" interactive={interactive} />

      <GallerySection data={data} interactive={interactive} />
      <CustomEmbedSlot data={data} placement="after_gallery" interactive={interactive} />

      <VideoSection data={data} />
      <CustomEmbedSlot data={data} placement="after_video" interactive={interactive} />

      <TestimonialsSection data={data} />
      <CustomEmbedSlot data={data} placement="after_testimonials" interactive={interactive} />

      <BlogSection data={data} />
      <CustomEmbedSlot data={data} placement="after_blog" interactive={interactive} />

      {showContact && (
        <>
          <ContactSection data={data} interactive={interactive} />
          <CustomEmbedSlot data={data} placement="after_contact" interactive={interactive} />
        </>
      )}

      {showSocial && (
        <>
          <SocialSection data={data} interactive={interactive} />
          <CustomEmbedSlot data={data} placement="after_social" interactive={interactive} />
        </>
      )}
      <CustomEmbedSlot data={data} placement="before_footer" interactive={interactive} />
    </main>
  );
}
