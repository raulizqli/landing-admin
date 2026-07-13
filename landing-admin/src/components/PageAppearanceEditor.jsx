import SectionBackgroundEditor from './SectionBackgroundEditor';

export default function PageAppearanceEditor({ formData, onChange }) {
  return (
    <div className="space-y-4 pt-2 border-t">
      <label className="block text-[11px] font-bold text-gray-400 uppercase">
        Apariencia general
      </label>

      <SectionBackgroundEditor
        sectionKey="page"
        label="Fondo de página"
        formData={formData}
        onChange={onChange}
      />

      <SectionBackgroundEditor
        sectionKey="hero"
        label="Fondo del hero (sin imagen/video)"
        formData={formData}
        onChange={onChange}
      />

      <SectionBackgroundEditor
        sectionKey="footer"
        label="Fondo del pie de página"
        formData={formData}
        onChange={onChange}
      />
    </div>
  );
}
