const VARIANTS = {
  mark: {
    src: '/brand/toqua-mark-square-dark.png',
    alt: 'Toqua',
  },
  markDark: {
    src: '/brand/toqua-mark-square-dark.png',
    alt: 'Toqua',
  },
  lockup: {
    src: '/brand/toqua-lockup-horizontal-light-tagline-short.png',
    alt: 'Toqua — Crea. Publica. Listo.',
  },
  lockupTagline: {
    src: '/brand/toqua-lockup-horizontal-light-tagline-short.png',
    alt: 'Toqua — Crea. Publica. Listo.',
  },
  lockupTaglineLong: {
    src: '/brand/toqua-lockup-horizontal-light-tagline-long-transparent.png',
    alt: 'Toqua — Un toque, tu sitio en línea.',
  },
  stacked: {
    src: '/brand/toqua-lockup-stacked-light-tagline-long-transparent.png',
    alt: 'Toqua — Un toque, tu sitio en línea.',
  },
  stackedTaglineLong: {
    src: '/brand/toqua-lockup-stacked-light-tagline-long-transparent.png',
    alt: 'Toqua — Un toque, tu sitio en línea.',
  },
  wordmarkQ: {
    src: '/brand/toqua-wordmark-q-horizontal-light-tagline-long-transparent.png',
    alt: 'Toqua — Un toque, tu sitio en línea.',
  },
  wordmarkQAlt: {
    src: '/brand/toqua-wordmark-q-horizontal-light-tagline-long-alt-transparent.png',
    alt: 'Toqua — Un toque, tu sitio en línea.',
  },
};

/**
 * Official Toqua brand mark.
 * @param {'mark'|'markDark'|'lockup'|'lockupTagline'|'lockupTaglineLong'|'stacked'|'stackedTaglineLong'|'wordmarkQ'|'wordmarkQAlt'} variant
 */
export default function ToquaLogo({
  variant = 'lockupTagline',
  className = '',
  imgClassName = 'h-full w-auto object-contain',
  alt,
}) {
  const asset = VARIANTS[variant] || VARIANTS.lockupTagline;
  return (
    <span className={`inline-flex items-center ${className}`.trim()}>
      <img
        src={asset.src}
        alt={alt || asset.alt}
        className={imgClassName}
        decoding="async"
      />
    </span>
  );
}
