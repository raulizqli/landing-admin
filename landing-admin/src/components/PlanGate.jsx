/**
 * Gates Pro+ UI. When locked, prefers an explicit promo (title / benefits)
 * so users can read value before upgrading — not only a button over faded fields.
 */
export default function PlanGate({
  allowed,
  label,
  onUpgrade,
  children,
  className = '',
  lockedTitle = '',
  lockedDescription = '',
  lockedBenefits = null,
}) {
  if (allowed) return children;

  const benefits = Array.isArray(lockedBenefits)
    ? lockedBenefits.map((item) => String(item ?? '').trim()).filter(Boolean)
    : [];
  const hasPromo = Boolean(lockedTitle || lockedDescription || benefits.length);

  if (hasPromo) {
    return (
      <div
        className={`rounded-lg border border-indigo-100 bg-indigo-50/50 p-4 space-y-3 ${className}`}
      >
        {lockedTitle ? (
          <h3 className="text-sm font-semibold text-[#2A342D]">{lockedTitle}</h3>
        ) : null}
        {lockedDescription ? (
          <p className="text-xs text-gray-600 leading-relaxed">{lockedDescription}</p>
        ) : null}
        {benefits.length > 0 ? (
          <ul className="space-y-1.5">
            {benefits.map((item) => (
              <li key={item} className="flex gap-2 text-xs text-gray-700 leading-snug">
                <span className="text-indigo-600 font-semibold shrink-0" aria-hidden="true">✓</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        ) : null}
        <button
          type="button"
          onClick={onUpgrade}
          className="text-xs font-semibold px-3 py-2 rounded-lg bg-[#4A5D4E] text-white hover:bg-[#3d4d41] shadow"
        >
          {label}
        </button>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <div className="pointer-events-none opacity-45 select-none">{children}</div>
      <div className="absolute inset-0 flex items-center justify-center bg-[#F4F1EA]/70 rounded-lg">
        <button
          type="button"
          onClick={onUpgrade}
          className="text-xs font-semibold px-3 py-2 rounded-lg bg-[#4A5D4E] text-white hover:bg-[#3d4d41] shadow"
        >
          {label}
        </button>
      </div>
    </div>
  );
}
