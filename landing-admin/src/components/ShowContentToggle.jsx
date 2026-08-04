/** Compact checkbox for “show this heading/text or omit it entirely”. */
export default function ShowContentToggle({
  checked,
  onChange,
  label = 'Mostrar',
  hint = '',
}) {
  return (
    <div className="space-y-1">
      <label className="flex items-center gap-2 text-xs text-gray-600">
        <input
          type="checkbox"
          checked={checked}
          onChange={(event) => onChange(event.target.checked)}
          className="rounded border-gray-300"
        />
        {label}
      </label>
      {hint ? <p className="text-[10px] text-gray-400 pl-6">{hint}</p> : null}
    </div>
  );
}
