import SectionBackgroundEditor from './SectionBackgroundEditor';

export default function VideoSectionFieldsEditor({ formData, onChange }) {
  const enabled = Boolean(formData.videoSectionEnabled);

  return (
    <div className="space-y-3 pt-2 border-t">
      <div className="flex items-center justify-between gap-3">
        <label className="block text-[11px] font-bold text-gray-400 uppercase">
          Sección de video
        </label>
        <label className="flex items-center gap-2 text-xs text-gray-600">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => onChange({ ...formData, videoSectionEnabled: e.target.checked })}
            className="rounded border-gray-300"
          />
          Mostrar sección
        </label>
      </div>

      {enabled && (
        <>
          <div className="space-y-2">
            <label className="block text-[10px] font-bold text-gray-400 uppercase">Enlace del video</label>
            <input
              type="url"
              value={formData.videoSectionUrl || ''}
              onChange={(e) => onChange({ ...formData, videoSectionUrl: e.target.value })}
              placeholder="https://youtube.com/watch?v=... o https://vimeo.com/..."
              className="w-full border p-2.5 text-xs rounded-lg focus:ring-1 focus:ring-indigo-500 outline-none"
            />
            <p className="text-[10px] text-gray-400">
              YouTube, Vimeo o archivo directo (.mp4). El reproductor incluye controles para el visitante.
            </p>
          </div>

          <div className="space-y-2">
            <label className="block text-[10px] font-bold text-gray-400 uppercase">Título (opcional)</label>
            <input
              type="text"
              value={formData.videoSectionTitle || ''}
              onChange={(e) => onChange({ ...formData, videoSectionTitle: e.target.value })}
              placeholder="Conoce mi enfoque terapéutico"
              className="w-full border p-2.5 text-xs rounded-lg focus:ring-1 focus:ring-indigo-500 outline-none"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-[10px] font-bold text-gray-400 uppercase">Texto (opcional)</label>
            <textarea
              rows="4"
              value={formData.videoSectionText || ''}
              onChange={(e) => onChange({ ...formData, videoSectionText: e.target.value })}
              placeholder="Breve introducción al video. Separa párrafos con una línea en blanco."
              className="w-full border p-2.5 text-xs rounded-lg focus:ring-1 focus:ring-indigo-500 outline-none resize-none"
            />
          </div>
        </>
      )}

      <SectionBackgroundEditor
        sectionKey="video"
        label="Fondo de la sección de video"
        formData={formData}
        onChange={onChange}
      />
    </div>
  );
}
