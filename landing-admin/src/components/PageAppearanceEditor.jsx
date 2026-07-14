
import SectionBackgroundEditor from './SectionBackgroundEditor';

export default function PageAppearanceEditor({ formData, onChange, sections = ['page'] }) {
  const editors = {
    page: (
      <SectionBackgroundEditor
        key="page"
        sectionKey="page"
        label="Fondo de página"
        formData={formData}
        onChange={onChange}
      />
    ),
    footer: (
      <SectionBackgroundEditor
        key="footer"
        sectionKey="footer"
        label="Fondo del pie de página"
        formData={formData}
        onChange={onChange}
      />
    ),
    hero: (
      <SectionBackgroundEditor
        key="hero"
        sectionKey="hero"
        label="Fondo del hero (sin imagen/video)"
        formData={formData}
        onChange={onChange}
      />
    ),
  };

  return (
    <div className="space-y-4">
      {sections.map((key) => editors[key]).filter(Boolean)}
    </div>
  );
}
