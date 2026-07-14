import { getVisibleBlogPosts } from './blog';
import { getVisibleCatalogItems } from './catalog';
import { isCustomSectionVisible, normalizeCustomEmbeds } from './customEmbeds';
import { getVisibleGalleryItems } from './gallery';
import { shouldShowPreHero } from './preHero';
import { getVisibleServices } from './services';
import { getSocialLinks } from './socialLinks';
import { getVisibleTestimonials } from './testimonials';
import { shouldShowVideoSection } from './videoSection';
import { TOGGLEABLE_PAGE_SECTIONS, isFlagEnabled } from './sectionVisibility';
import { getVerticalMeta } from '@raulizqli/landing-core/verticals';

function hasText(value) {
  return Boolean(String(value ?? '').trim());
}

function truncateLabel(value, max = 32) {
  const text = String(value ?? '').trim().replace(/\s+/g, ' ');
  if (text.length <= max) return text;
  return `${text.slice(0, Math.max(1, max - 1)).trimEnd()}…`;
}

function filled(label) {
  return { filled: true, label };
}

function empty(label = 'Sin datos') {
  return { filled: false, label };
}

function countFilledHeroSlides(data) {
  const slides = Array.isArray(data?.heroSlides) ? data.heroSlides : [];
  return slides.filter((slide) => (
    hasText(slide?.imageUrl)
    || hasText(slide?.videoUrl)
    || (slide?.showTitle && hasText(slide?.title))
    || (slide?.showText && hasText(slide?.text))
  )).length;
}

function countEnabledVisibilityFlags(data) {
  return TOGGLEABLE_PAGE_SECTIONS.filter(({ flag, defaultEnabled }) => (
    isFlagEnabled(data, flag, defaultEnabled)
  )).length;
}

/**
 * Compact fill indicator for collapsed editor accordion sections.
 * @returns {{ filled: boolean, label: string }}
 */
export function getEditorSectionFill(sectionKey, data) {
  if (!data) return empty();

  switch (sectionKey) {
    case 'identity': {
      const name = String(data.name ?? '').trim();
      const specialty = String(data.specialty ?? '').trim();
      const verticalMeta = getVerticalMeta(data.vertical);
      const verticalLabel = verticalMeta?.label?.es || '';
      const bits = [];

      if (name) bits.push(truncateLabel(name, 28));
      if (specialty) bits.push(truncateLabel(specialty, 26));
      else if (verticalMeta?.id && verticalMeta.id !== 'generic' && verticalLabel) {
        bits.push(truncateLabel(verticalLabel, 24));
      }

      if (bits.length === 0) return empty('Sin identidad');
      return filled(bits.join(' · '));
    }

    case 'nav': {
      const bits = [];
      if (data.navMode === 'logo' && hasText(data.navLogoUrl)) bits.push('Logo');
      if (data.navMode !== 'logo' && hasText(data.navIconUrl)) bits.push('Icono');
      if (data.navShowCta !== false) bits.push('CTA');
      if (data.navShowMenu === true) bits.push('Menú');
      return bits.length ? filled(bits.join(' · ')) : empty('Básico');
    }

    case 'visibility': {
      const enabled = countEnabledVisibilityFlags(data);
      return filled(`${enabled} activas`);
    }

    case 'preHero': {
      if (!shouldShowPreHero(data)) {
        return data.preHeroEnabled ? empty('Activo, falta contenido') : empty();
      }
      const mode = data.preHeroMode === 'split' ? 'Editorial' : 'Banner';
      return filled(mode);
    }

    case 'hero': {
      const count = countFilledHeroSlides(data);
      if (count === 0) return empty();
      return filled(count === 1 ? '1 diapositiva' : `${count} diapositivas`);
    }

    case 'about': {
      const tagline = String(data.aboutTagline ?? '').trim();
      const hasBio = data.aboutBioEnabled !== false && hasText(data.aboutBio);
      if (tagline) {
        return filled(hasBio ? `${truncateLabel(tagline, 28)} · Bio` : truncateLabel(tagline, 36));
      }
      if (hasBio) return filled('Con bio');
      return empty();
    }

    case 'contact': {
      const bits = [];
      if (hasText(data.email)) bits.push('Email');
      if (hasText(data.phone)) bits.push('Teléfono');
      if (hasText(data.location)) bits.push('Ubicación');
      return bits.length ? filled(bits.join(' · ')) : empty();
    }
    case 'services': {
      const count = getVisibleServices(data).length;
      if (count === 0) return empty();
      return filled(count === 1 ? '1 ítem' : `${count} ítems`);
    }

    case 'catalog': {
      const count = getVisibleCatalogItems(data).length;
      if (count === 0) return empty();
      return filled(count === 1 ? '1 ítem' : `${count} ítems`);
    }

    case 'gallery': {
      const count = getVisibleGalleryItems(data).length;
      if (count === 0) return empty();
      const withPortfolio = hasText(data.galleryPortfolioUrl);
      const base = count === 1 ? '1 imagen' : `${count} imágenes`;
      return filled(withPortfolio ? `${base} · portafolio` : base);
    }

    case 'video': {
      if (shouldShowVideoSection(data)) return filled('Con video');
      if (data.videoSectionEnabled) return empty('Activo, falta URL');
      return empty();
    }

    case 'testimonials': {
      const count = getVisibleTestimonials(data).length;
      if (count === 0) return empty();
      return filled(count === 1 ? '1 testimonio' : `${count} testimonios`);
    }

    case 'blog': {
      const count = getVisibleBlogPosts(data).length;
      if (count === 0) return empty();
      return filled(count === 1 ? '1 entrada' : `${count} entradas`);
    }

    case 'social': {
      const count = getSocialLinks(data).length;
      if (count === 0) return empty();
      return filled(count === 1 ? '1 red' : `${count} redes`);
    }

    case 'embeds': {
      const embeds = normalizeCustomEmbeds(data.customEmbeds).filter((embed) => (
        embed.enabled !== false && isCustomSectionVisible(embed)
      ));
      if (embeds.length === 0) return empty();
      return filled(embeds.length === 1 ? '1 bloque' : `${embeds.length} bloques`);
    }

    case 'footer': {
      const bits = [];
      if (hasText(data.analyticsMeasurementId)) bits.push('GA4');
      if (hasText(data.customDomain)) bits.push('dominio');
      if (data.hostingProvider && data.hostingProvider !== 'hub') bits.push('hosting');
      if (data.useExternalFirebase === true) bits.push('Firebase ext.');
      if (data.termsOfUseEnabled !== false || data.privacyPolicyEnabled !== false) bits.push('legal');
      return bits.length ? filled(bits.join(' · ')) : empty('Solo pie');
    }

    default:
      return empty();
  }
}
