export default function PlanGate({ allowed, label, onUpgrade, children, className = '' }) {
  if (allowed) return children;

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
