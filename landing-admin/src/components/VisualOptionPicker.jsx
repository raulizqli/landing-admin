function PreviewGlyph({ kind }) {
  if (kind === 'layout-title') {
    return (
      <div className="space-y-1.5">
        <div className="h-8 rounded bg-gray-200/90" />
        <div className="h-2 w-2/3 mx-auto rounded bg-gray-300" />
      </div>
    );
  }

  if (kind === 'layout-description') {
    return (
      <div className="space-y-1.5">
        <div className="h-6 rounded bg-gray-200/90" />
        <div className="h-1.5 w-3/4 rounded bg-gray-300" />
        <div className="h-1.5 w-full rounded bg-gray-200" />
        <div className="h-1.5 w-5/6 rounded bg-gray-200" />
      </div>
    );
  }

  if (kind === 'layout-list') {
    return (
      <div className="space-y-1.5">
        <div className="h-5 rounded bg-gray-200/90" />
        <div className="space-y-1 pl-1">
          <div className="h-1.5 w-full rounded bg-gray-300" />
          <div className="h-1.5 w-5/6 rounded bg-gray-200" />
          <div className="h-1.5 w-4/5 rounded bg-gray-200" />
        </div>
      </div>
    );
  }

  if (kind === 'style-cards') {
    return (
      <div className="rounded-md border border-gray-200 bg-white p-1.5 shadow-sm space-y-1">
        <div className="h-5 rounded bg-gray-200" />
        <div className="h-1.5 w-3/4 rounded bg-gray-300" />
      </div>
    );
  }

  if (kind === 'style-minimal') {
    return (
      <div className="p-1 space-y-1.5">
        <div className="h-5 rounded bg-gray-100" />
        <div className="h-1.5 w-2/3 rounded bg-gray-200" />
      </div>
    );
  }

  if (kind === 'style-editorial') {
    return (
      <div className="space-y-1.5 border-b border-gray-300 pb-1.5">
        <div className="h-2 w-1/2 rounded bg-gray-400" />
        <div className="h-1.5 w-full rounded bg-gray-200" />
        <div className="h-1.5 w-4/5 rounded bg-gray-200" />
      </div>
    );
  }

  if (kind === 'transition-none') {
    return (
      <div className="flex items-center justify-center gap-1 h-full">
        <div className="h-6 w-6 rounded border border-gray-300 bg-gray-100" />
        <span className="text-[9px] text-gray-400 font-medium">→</span>
        <div className="h-6 w-6 rounded border border-gray-300 bg-gray-200" />
      </div>
    );
  }

  if (kind === 'transition-fade') {
    return (
      <div className="relative h-full flex items-center justify-center">
        <div className="h-7 w-8 rounded border border-gray-200 bg-gray-100 opacity-40" />
        <div className="absolute h-7 w-8 rounded border border-gray-300 bg-gray-200 opacity-90" />
      </div>
    );
  }

  if (kind === 'transition-slide') {
    return (
      <div className="flex items-center justify-center gap-0.5 h-full overflow-hidden">
        <div className="h-6 w-5 rounded border border-gray-200 bg-gray-100 opacity-50 -translate-x-1" />
        <div className="h-6 w-5 rounded border border-gray-300 bg-gray-200" />
        <div className="h-6 w-5 rounded border border-gray-200 bg-gray-100 opacity-50 translate-x-1" />
      </div>
    );
  }

  return <div className="h-8 rounded bg-gray-100" />;
}

const LAYOUT_PREVIEW = {
  title: 'layout-title',
  title_description: 'layout-description',
  title_list: 'layout-list',
};

const STYLE_PREVIEW = {
  cards: 'style-cards',
  minimal: 'style-minimal',
  editorial: 'style-editorial',
};

const TRANSITION_PREVIEW = {
  none: 'transition-none',
  fade: 'transition-fade',
  slide: 'transition-slide',
};

export function resolvePreviewKind(option, previewMap) {
  if (option.preview) return option.preview;
  if (previewMap && previewMap[option.value]) return previewMap[option.value];
  return null;
}

/**
 * Compact 3-option visual radio group for admin editors.
 * @param {{ options: Array<{ value: string, label: string, description?: string, preview?: string }>, value: string, onChange: (value: string) => void, name: string, previewMap?: Record<string, string> }} props
 */
export default function VisualOptionPicker({
  options = [],
  value,
  onChange,
  name,
  previewMap,
}) {
  return (
    <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label={name}>
      {options.map((option) => {
        const selected = value === option.value;
        const previewKind = resolvePreviewKind(option, previewMap);

        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(option.value)}
            className={`rounded-lg border p-2 text-left transition-colors ${
              selected
                ? 'border-[#4A5D4E] bg-[#4A5D4E]/5 ring-1 ring-[#4A5D4E]/30'
                : 'border-gray-200 bg-white hover:border-gray-300'
            }`}
          >
            <div className="h-12 mb-2 rounded-md bg-[#F4F1EA]/70 p-1.5">
              <PreviewGlyph kind={previewKind} />
            </div>
            <p className={`text-[11px] font-semibold leading-tight ${selected ? 'text-[#2A342D]' : 'text-gray-700'}`}>
              {option.label}
            </p>
            {option.description && (
              <p className="mt-0.5 text-[9px] text-gray-400 leading-snug line-clamp-2">
                {option.description}
              </p>
            )}
          </button>
        );
      })}
    </div>
  );
}

export const SERVICE_LAYOUT_PREVIEW_MAP = LAYOUT_PREVIEW;
export const VISUAL_STYLE_PREVIEW_MAP = STYLE_PREVIEW;
export const CAROUSEL_TRANSITION_PREVIEW_MAP = TRANSITION_PREVIEW;
