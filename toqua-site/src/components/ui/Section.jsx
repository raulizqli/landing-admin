export default function Section({
  id,
  eyebrow,
  title,
  description,
  children,
  className = '',
  headerClassName = '',
}) {
  return (
    <section id={id} className={`relative px-5 py-16 sm:px-8 sm:py-20 lg:px-12 ${className}`}>
      <div className="mx-auto max-w-6xl">
        {(eyebrow || title || description) && (
          <header className={`mb-10 max-w-3xl sm:mb-12 ${headerClassName}`}>
            {eyebrow && (
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-purple)]">
                {eyebrow}
              </p>
            )}
            {title && (
              <h2 className="font-display text-3xl font-semibold tracking-tight text-[var(--text)] sm:text-4xl">
                {title}
              </h2>
            )}
            {description && (
              <p className="mt-4 text-base leading-relaxed text-[var(--mute)] sm:text-lg">
                {description}
              </p>
            )}
          </header>
        )}
        {children}
      </div>
    </section>
  );
}
