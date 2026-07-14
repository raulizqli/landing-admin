
import {
  BRAND_COLOR_PRESETS,
  GRADIENT_DIRECTIONS,
  TEXT_COLOR_PRESETS,
  getSectionTheme,
  parseColorToHex,
  updateSectionThemeInForm,
} from '../utils/sectionBackground';

export function ColorField({ label, value, onChange, presets = BRAND_COLOR_PRESETS }) {
  const hexValue = parseColorToHex(value, '#F4F1EA');

  return (
    <div className="space-y-1.5">
      <label className="block text-[10px] font-bold text-gray-400 uppercase">{label}</label>
      <div className="flex flex-wrap gap-1.5">
        {presets.map((preset) => (
          <button
            key={`${label}-${preset.value}`}
            type="button"
            title={preset.label}
            onClick={() => onChange(preset.value)}
            className={`h-6 w-6 rounded-full border-2 transition ${
              hexValue === preset.value ? 'border-indigo-500 scale-110' : 'border-white shadow-sm'
            }`}
            style={{ backgroundColor: preset.value }}
            aria-label={preset.label}
          />
        ))}
      </div>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={hexValue}
          onChange={(e) => onChange(e.target.value.toUpperCase())}
          className="h-8 w-10 rounded border border-gray-200 cursor-pointer shrink-0"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={() => onChange(parseColorToHex(value, hexValue))}
          onPaste={(e) => {
            const pasted = e.clipboardData?.getData('text');
            if (!pasted) return;
            e.preventDefault();
            onChange(parseColorToHex(pasted, hexValue));
          }}
          placeholder="#F4F1EA o rgb(244, 241, 234)"
          className="flex-1 border p-2 text-xs rounded-lg font-mono"
          spellCheck={false}
        />
      </div>
      <p className="text-[10px] text-gray-400">Pega un hex (#RGB / #RRGGBB) o rgb()/rgba().</p>
    </div>
  );
}

export default function SectionBackgroundEditor({
  sectionKey,
  label = 'Apariencia de sección',
  formData,
  onChange,
  showOpacity = false,
}) {
  const theme = getSectionTheme(formData, sectionKey);

  const updateTheme = (partial) => {
    onChange(updateSectionThemeInForm(formData, sectionKey, partial));
  };

  return (
    <fieldset className="space-y-3 rounded-lg border border-gray-100 bg-gray-50/80 p-3">
      <legend className="px-1 text-[10px] font-bold text-gray-400 uppercase">{label}</legend>

      <ColorField
        label="Color de fondo"
        value={theme.backgroundColor}
        onChange={(backgroundColor) => updateTheme({ backgroundColor })}
        presets={BRAND_COLOR_PRESETS}
      />

      <ColorField
        label="Color de texto"
        value={theme.textColor}
        onChange={(textColor) => updateTheme({ textColor })}
        presets={TEXT_COLOR_PRESETS}
      />

      <label className="flex items-center gap-2 text-xs text-gray-600">
        <input
          type="checkbox"
          checked={theme.useGradient}
          onChange={(e) => updateTheme({ useGradient: e.target.checked })}
          className="rounded border-gray-300"
        />
        Usar degradado
      </label>

      {theme.useGradient && (
        <div className="space-y-3 pl-1 border-l-2 border-gray-200 ml-1">
          <ColorField
            label="Segundo color"
            value={theme.gradientColor}
            onChange={(gradientColor) => updateTheme({ gradientColor })}
            presets={BRAND_COLOR_PRESETS}
          />

          <div className="space-y-1">
            <label className="block text-[10px] font-bold text-gray-400 uppercase">Dirección</label>
            <select
              value={theme.gradientDirection}
              onChange={(e) => updateTheme({ gradientDirection: e.target.value })}
              className="w-full border p-2 text-xs rounded-lg bg-white"
            >
              {GRADIENT_DIRECTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {showOpacity && (
        <div className="space-y-1">
          <label className="block text-[10px] font-bold text-gray-400 uppercase">
            Transparencia ({theme.backgroundOpacity}%)
          </label>
          <input
            type="range"
            min="0"
            max="100"
            step="5"
            value={theme.backgroundOpacity}
            onChange={(e) => updateTheme({ backgroundOpacity: Number(e.target.value) })}
            className="w-full"
          />
          <p className="text-[10px] text-gray-400">
            0% = totalmente transparente (solo blur). 100% = opaco.
          </p>
        </div>
      )}
    </fieldset>
  );
}
