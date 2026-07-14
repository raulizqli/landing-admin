import ImageUrlField from './ImageUrlField';
import SectionBackgroundEditor from './SectionBackgroundEditor';

export default function PreHeroFieldsEditor({ formData, onChange, pageId, canToggleSection = true }) {
  const enabled = Boolean(formData.preHeroEnabled);
  const splitMode = formData.preHeroMode === 'split';

  return (
    <div className="space-y-3 pt-2 border-t">
      <div className="flex items-center justify-between gap-3">
        <label className="block text-[11px] font-bold text-gray-400 uppercase">
          Sección antes del hero
        </label>
        {canToggleSection && (
          <label className="flex items-center gap-2 text-xs text-gray-600">
            <input
              type="checkbox"
              checked={enabled}
              onChange={(e) => onChange({ ...formData, preHeroEnabled: e.target.checked })}
              className="rounded border-gray-300"
            />
            Mostrar sección
          </label>
        )}
      </div>

      {enabled && (
        <>
          <fieldset className="space-y-2">
            <legend className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Tipo de contenido</legend>
            <label className="flex items-center gap-2 text-xs text-gray-600">
              <input
                type="radio"
                name="pre-hero-mode"
                checked={!splitMode}
                onChange={() => onChange({ ...formData, preHeroMode: 'banner' })}
                className="border-gray-300"
              />
              Imagen completa (el texto va en el gráfico)
            </label>
            <label className="flex items-center gap-2 text-xs text-gray-600">
              <input
                type="radio"
                name="pre-hero-mode"
                checked={splitMode}
                onChange={() => onChange({ ...formData, preHeroMode: 'split' })}
                className="border-gray-300"
              />
              Foto + título y texto editables
            </label>
          </fieldset>

          <ImageUrlField
            label={splitMode ? 'Foto' : 'Imagen completa'}
            value={formData.preHeroImageUrl || ''}
            onChange={(preHeroImageUrl) => onChange({ ...formData, preHeroImageUrl })}
            pageId={pageId}
            pageData={formData}
            uploadFolder="pre-hero"
            placeholder="https://ejemplo.com/imagen.jpg"
            previewClassName={splitMode ? 'h-20 w-16 object-cover border bg-white rounded' : 'h-16 max-w-full object-contain border bg-white rounded'}
            previewAlt="Vista previa pre-hero"
            helperText="Pega una URL o sube la imagen."
          />

          {splitMode && (
            <>
              <fieldset className="space-y-2">
                <legend className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Posición de la imagen</legend>
                <label className="flex items-center gap-2 text-xs text-gray-600">
                  <input
                    type="radio"
                    name="pre-hero-image-side"
                    checked={(formData.preHeroImageSide || 'left') !== 'right'}
                    onChange={() => onChange({ ...formData, preHeroImageSide: 'left' })}
                    className="border-gray-300"
                  />
                  Imagen a la izquierda
                </label>
                <label className="flex items-center gap-2 text-xs text-gray-600">
                  <input
                    type="radio"
                    name="pre-hero-image-side"
                    checked={formData.preHeroImageSide === 'right'}
                    onChange={() => onChange({ ...formData, preHeroImageSide: 'right' })}
                    className="border-gray-300"
                  />
                  Imagen a la derecha
                </label>
              </fieldset>

              <div className="space-y-2">
                <label className="block text-[10px] font-bold text-gray-400 uppercase">Título</label>
                <input
                  type="text"
                  value={formData.preHeroTitle || ''}
                  onChange={(e) => onChange({ ...formData, preHeroTitle: e.target.value })}
                  placeholder="¿Quién es María García?"
                  className="w-full border p-2.5 text-xs rounded-lg focus:ring-1 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-[10px] font-bold text-gray-400 uppercase">Texto</label>
                <textarea
                  rows="6"
                  value={formData.preHeroText || ''}
                  onChange={(e) => onChange({ ...formData, preHeroText: e.target.value })}
                  placeholder="Escribe uno o varios párrafos. Separa párrafos con una línea en blanco."
                  className="w-full border p-2.5 text-xs rounded-lg focus:ring-1 focus:ring-indigo-500 outline-none resize-none"
                />
              </div>
            </>
          )}
        </>
      )}

      <SectionBackgroundEditor
        sectionKey="preHero"
        label="Fondo de la sección pre-hero"
        formData={formData}
        onChange={onChange}
      />
    </div>
  );
}
