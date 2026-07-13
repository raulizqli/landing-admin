import SectionBackgroundEditor from './SectionBackgroundEditor';

export default function AboutFieldsEditor({ formData, onChange }) {
  return (
    <div className="space-y-4 pt-2 border-t">
      <label className="block text-[11px] font-bold text-gray-400 uppercase">Sobre mí</label>

      <div className="space-y-2">
        <label className="block text-[10px] font-bold text-gray-400 uppercase">Frase Filosofía</label>
        <input
          type="text"
          value={formData.aboutTagline || ''}
          onChange={(e) => onChange({ ...formData, aboutTagline: e.target.value })}
          className="w-full border p-2.5 text-xs rounded-lg focus:ring-1 focus:ring-indigo-500 outline-none"
        />
      </div>

      <div className="space-y-2">
        <label className="block text-[10px] font-bold text-gray-400 uppercase">Biografía Completa</label>
        <textarea
          rows="4"
          value={formData.aboutBio || ''}
          onChange={(e) => onChange({ ...formData, aboutBio: e.target.value })}
          className="w-full border p-2.5 text-xs rounded-lg focus:ring-1 focus:ring-indigo-500 outline-none resize-none"
        />
      </div>

      <SectionBackgroundEditor
        sectionKey="about"
        label="Fondo de «Sobre mí»"
        formData={formData}
        onChange={onChange}
      />
    </div>
  );
}
