import {
  createEmptySectionCustomStyle,
  normalizeSectionCustomStyle,
  SECTION_CUSTOM_ENTRANCE_OPTIONS,
  SECTION_CUSTOM_GAP_OPTIONS,
  SECTION_CUSTOM_HOVER_OPTIONS,
  SECTION_CUSTOM_SHADOW_OPTIONS,
} from '@raulizqli/landing-core/sectionCustomStyle';

export default function SectionCustomStyleEditor({
  value,
  onChange,
  label = 'CSS personalizado',
}) {
  const style = normalizeSectionCustomStyle(value || createEmptySectionCustomStyle());

  const patch = (partial) => {
    onChange(normalizeSectionCustomStyle({ ...style, ...partial }));
  };

  return (
    <div className="space-y-3 rounded-lg border border-[#4A5D4E]/20 bg-white p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[10px] font-bold text-gray-400 uppercase">{label}</p>
        <button
          type="button"
          onClick={() => onChange(createEmptySectionCustomStyle())}
          className="text-[10px] font-semibold text-indigo-600 hover:text-indigo-800"
        >
          Restaurar
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="block text-[10px] font-bold text-gray-400 uppercase">Fondo</label>
          <input
            type="color"
            value={style.backgroundColor}
            onChange={(e) => patch({ backgroundColor: e.target.value })}
            className="h-9 w-full cursor-pointer rounded border border-gray-200 bg-white"
          />
        </div>
        <div className="space-y-1">
          <label className="block text-[10px] font-bold text-gray-400 uppercase">Borde</label>
          <input
            type="color"
            value={style.borderColor}
            onChange={(e) => patch({ borderColor: e.target.value })}
            className="h-9 w-full cursor-pointer rounded border border-gray-200 bg-white"
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div className="space-y-1">
          <label className="block text-[10px] font-bold text-gray-400 uppercase">Opacidad borde</label>
          <input
            type="number"
            min="0"
            max="1"
            step="0.05"
            value={style.borderOpacity}
            onChange={(e) => patch({ borderOpacity: e.target.value })}
            className="w-full border p-2 text-xs rounded-lg outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>
        <div className="space-y-1">
          <label className="block text-[10px] font-bold text-gray-400 uppercase">Grosor</label>
          <input
            type="number"
            min="0"
            max="4"
            value={style.borderWidth}
            onChange={(e) => patch({ borderWidth: e.target.value })}
            className="w-full border p-2 text-xs rounded-lg outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>
        <div className="space-y-1">
          <label className="block text-[10px] font-bold text-gray-400 uppercase">Radio</label>
          <input
            type="number"
            min="0"
            max="40"
            value={style.borderRadius}
            onChange={(e) => patch({ borderRadius: e.target.value })}
            className="w-full border p-2 text-xs rounded-lg outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <label className="block text-[10px] font-bold text-gray-400 uppercase">Sombra</label>
          <select
            value={style.shadow}
            onChange={(e) => patch({ shadow: e.target.value })}
            className="w-full border p-2 text-xs rounded-lg bg-white outline-none focus:ring-1 focus:ring-indigo-500"
          >
            {SECTION_CUSTOM_SHADOW_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <label className="block text-[10px] font-bold text-gray-400 uppercase">Hover</label>
          <select
            value={style.hover}
            onChange={(e) => patch({ hover: e.target.value })}
            className="w-full border p-2 text-xs rounded-lg bg-white outline-none focus:ring-1 focus:ring-indigo-500"
          >
            {SECTION_CUSTOM_HOVER_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <label className="block text-[10px] font-bold text-gray-400 uppercase">Entrada</label>
          <select
            value={style.entrance}
            onChange={(e) => patch({ entrance: e.target.value })}
            className="w-full border p-2 text-xs rounded-lg bg-white outline-none focus:ring-1 focus:ring-indigo-500"
          >
            {SECTION_CUSTOM_ENTRANCE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <label className="block text-[10px] font-bold text-gray-400 uppercase">Espaciado</label>
          <select
            value={style.gap}
            onChange={(e) => patch({ gap: e.target.value })}
            className="w-full border p-2 text-xs rounded-lg bg-white outline-none focus:ring-1 focus:ring-indigo-500"
          >
            {SECTION_CUSTOM_GAP_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
