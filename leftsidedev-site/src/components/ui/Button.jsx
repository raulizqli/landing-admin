import { Link } from 'react-router-dom';

const variants = {
  primary:
    'bg-[var(--color-accent)] text-[var(--color-ink)] hover:bg-[var(--color-accent-deep)] hover:text-white',
  secondary:
    'glass text-[var(--color-mist)] hover:border-[var(--color-accent)]/50 hover:text-[var(--color-accent)]',
  ghost: 'text-[var(--color-mute)] hover:text-[var(--color-mist)]',
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
