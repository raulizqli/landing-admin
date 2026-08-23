const ASSETS = {
  mark: '/brand/toqua-mark-square-dark.png',
  lockupTaglineShort: '/brand/toqua-lockup-horizontal-light-tagline-short.png',
  lockupTaglineLong: '/brand/toqua-lockup-horizontal-light-tagline-long-transparent.png',
  stackedTaglineLong: '/brand/toqua-lockup-stacked-light-tagline-long-transparent.png',
  wordmarkQTaglineLong: '/brand/toqua-wordmark-q-horizontal-light-tagline-long-transparent.png',
  wordmarkQTaglineLongAlt: '/brand/toqua-wordmark-q-horizontal-light-tagline-long-alt-transparent.png',
};

const LONG_MOTTO = {
  es: 'Un toque, tu sitio en línea.',
  en: 'One touch, your site online.',
};

const SHORT_MOTTO = {
  es: 'Crea. Publica. Listo.',
  en: 'Create. Publish. Ready.',
};

const sizes = {
  sm: { mark: 'h-8 w-8', lockup: 'h-8', stacked: 'h-28', wordmark: 'h-10', text: 'text-lg' },
  md: { mark: 'h-10 w-10', lockup: 'h-10', stacked: 'h-36', wordmark: 'h-12', text: 'text-xl' },
  lg: { mark: 'h-12 w-12', lockup: 'h-12', stacked: 'h-44 sm:h-52', wordmark: 'h-14', text: 'text-2xl' },
  xl: { mark: 'h-14 w-14', lockup: 'h-14', stacked: 'h-56 sm:h-64', wordmark: 'h-16', text: 'text-3xl' },
};

function EnTextLockup({ dim, className, motto = 'short', priority }) {
  const mottoText = motto === 'long' ? LONG_MOTTO.en : SHORT_MOTTO.en;

  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <img
        src={ASSETS.mark}
        alt=""
        className={`${dim.mark} rounded-lg object-contain`}
        width={48}
        height={48}
        decoding="async"
        {...(priority ? { fetchPriority: 'high' } : {})}
      />
      <span className="flex min-w-0 flex-col leading-tight">
        <span className={`font-display font-semibold tracking-tight text-[var(--text-purple)] ${dim.text}`}>
          Toqua
        </span>
        <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--mute)]">
          {mottoText}
        </span>
      </span>
    </span>
  );
}

/**
 * @param {'mark' | 'lockup' | 'lockupTagline' | 'lockupTaglineLong' | 'stackedTaglineLong' | 'wordmarkQ' | 'wordmarkQAlt'} variant
 * @param {'es' | 'en'} [lang]
 */
export default function ToquaLogo({
  variant = 'lockup',
  lang = 'es',
  size = 'md',
  className = '',
  priority = false,
}) {
  const dim = sizes[size] || sizes.md;

  const enTextVariants = new Set([
    'lockup',
    'lockupTagline',
    'lockupTaglineLong',
    'stackedTaglineLong',
    'wordmarkQ',
    'wordmarkQAlt',
  ]);

  if (lang === 'en' && enTextVariants.has(variant)) {
    const motto =
      variant === 'wordmarkQ' || variant === 'wordmarkQAlt' || variant === 'stackedTaglineLong'
        ? 'long'
        : 'short';
    return <EnTextLockup dim={dim} className={className} motto={motto} priority={priority} />;
  }

  if (variant === 'mark') {
    return (
      <img
        src={ASSETS.mark}
        alt="Toqua"
        className={`${dim.mark} rounded-lg object-contain ${className}`}
        width={48}
        height={48}
        decoding="async"
        {...(priority ? { fetchPriority: 'high' } : {})}
      />
    );
  }

  const srcByVariant = {
    lockup: ASSETS.lockupTaglineShort,
    lockupTagline: ASSETS.lockupTaglineShort,
    lockupTaglineLong: ASSETS.lockupTaglineLong,
    stackedTaglineLong: ASSETS.stackedTaglineLong,
    wordmarkQ: ASSETS.wordmarkQTaglineLong,
    wordmarkQAlt: ASSETS.wordmarkQTaglineLongAlt,
  };

  const src = srcByVariant[variant] || ASSETS.lockupTaglineShort;

  const imgClass =
    variant === 'stackedTaglineLong'
      ? `${dim.stacked} w-auto max-w-[280px] object-contain`
      : variant === 'wordmarkQ' || variant === 'wordmarkQAlt'
        ? `${dim.wordmark} w-auto max-w-[min(100%,320px)] object-contain object-left`
        : `${dim.lockup} w-auto max-w-[min(100%,280px)] object-contain object-left`;

  return (
    <img
      src={src}
      alt="Toqua"
      className={`${imgClass} ${className}`.trim()}
      decoding="async"
      {...(priority ? { fetchPriority: 'high' } : {})}
    />
  );
}
