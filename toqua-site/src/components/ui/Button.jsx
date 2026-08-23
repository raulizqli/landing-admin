import { Link } from 'react-router-dom';

const variants = {
  primary:
    'bg-[var(--cta)] text-white shadow-sm hover:bg-[var(--cta-hover)]',
  secondary:
    'surface text-[var(--text-purple)] hover:border-[var(--text-purple)]/35',
  ghost: 'text-[var(--mute)] hover:text-[var(--text-purple)]',
  /** Solid button on gradient / dark panels (white fill, brand text). */
  inverse:
    'bg-white text-[var(--text-purple)] shadow-sm hover:bg-[var(--bg-primary)]',
  /** Outline button on gradient / dark panels. */
  inverseOutline:
    'border border-white/40 bg-transparent text-white hover:border-white hover:bg-white/10',
};

export default function Button({
  to,
  href,
  children,
  variant = 'primary',
  className = '',
  external = false,
  type = 'button',
  onClick,
  ariaLabel,
}) {
  const classes = [
    'inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold tracking-tight transition duration-200',
    variants[variant] || variants.primary,
    className,
  ].join(' ');

  if (to) {
    return (
      <Link to={to} className={classes} aria-label={ariaLabel} onClick={onClick}>
        {children}
      </Link>
    );
  }

  if (href) {
    return (
      <a
        href={href}
        className={classes}
        aria-label={ariaLabel}
        onClick={onClick}
        {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
      >
        {children}
      </a>
    );
  }

  return (
    <button type={type} className={classes} aria-label={ariaLabel} onClick={onClick}>
      {children}
    </button>
  );
}
