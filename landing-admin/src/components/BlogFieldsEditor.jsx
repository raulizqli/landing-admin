import {
  BLOG_LAYOUTS,
  createEmptyBlogPost,
  getBlogLayoutMeta,
} from '../utils/blog';
import ImageUrlField from './ImageUrlField';
import SectionBackgroundEditor from './SectionBackgroundEditor';
import { getDefaultLabelForPage } from '../utils/labels';

export default function BlogFieldsEditor({ formData, onChange, pageId, canToggleSection = true }) {
  const enabled = Boolean(formData.blogSectionEnabled);
  const items = Array.isArray(formData.blogPosts) && formData.blogPosts.length > 0
    ? formData.blogPosts
    : [createEmptyBlogPost()];
  const titlePlaceholder = getDefaultLabelForPage(formData, 'blog.defaultTitle');
  const introPlaceholder = getDefaultLabelForPage(formData, 'blog.defaultIntro');

  const updateItems = (nextItems) => {
    onChange({ ...formData, blogPosts: nextItems });
  };

  const updateItem = (index, field, value) => {
    updateItems(items.map((item, i) => (i === index ? { ...item, [field]: value } : item)));
  };

  const addItem = () => {
    updateItems([...items, createEmptyBlogPost()]);
  };

  const removeItem = (index) => {
    if (items.length <= 1) {
      updateItems([createEmptyBlogPost()]);
      return;
    }
    updateItems(items.filter((_, i) => i !== index));
  };

  const moveItem = (index, direction) => {
    const target = index + direction;
    if (target < 0 || target >= items.length) return;
    const next = [...items];
    const [item] = next.splice(index, 1);
    next.splice(target, 0, item);
    updateItems(next);
  };

  return (
    <div className="space-y-4 pt-2 border-t">
      <div className="flex items-center justify-between gap-3">
        <label className="block text-[11px] font-bold text-gray-400 uppercase">
          Blog / noticias
        </label>
        {canToggleSection && (
          <label className="flex items-center gap-2 text-xs text-gray-600">
            <input
              type="checkbox"
              checked={enabled}
              onChange={(e) => onChange({ ...formData, blogSectionEnabled: e.target.checked })}
              className="rounded border-gray-300"
            />
            Mostrar sección
          </label>
        )}
      </div>

      {enabled && (
        <>
          <p className="text-[10px] text-gray-400">
            Cada entrada es un bloque con un tipo de layout. Solo se publican bloques con contenido válido.
          </p>

          <div className="space-y-2">
            <label className="block text-[10px] font-bold text-gray-400 uppercase">Título de la sección</label>
            <input
              type="text"
              value={formData.blogSectionTitle || ''}
              onChange={(e) => onChange({ ...formData, blogSectionTitle: e.target.value })}
              placeholder={titlePlaceholder}
              className="w-full border p-2.5 text-xs rounded-lg focus:ring-1 focus:ring-indigo-500 outline-none"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-[10px] font-bold text-gray-400 uppercase">Texto introductorio (opcional)</label>
            <textarea
              rows="3"
              value={formData.blogSectionText || ''}
              onChange={(e) => onChange({ ...formData, blogSectionText: e.target.value })}
              placeholder={introPlaceholder}              className="w-full border p-2.5 text-xs rounded-lg focus:ring-1 focus:ring-indigo-500 outline-none resize-none"
            />
          </div>

          <div className="flex items-center justify-between">
            <p className="text-[10px] text-gray-400">{items.length} entrada{items.length === 1 ? '' : 's'}</p>
            <button
              type="button"
              onClick={addItem}
              className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800"
            >
              + Añadir entrada
            </button>
          </div>

          {items.map((item, index) => {
            const meta = getBlogLayoutMeta(item.layout);
            return (
              <div key={`blog-editor-${index}`} className="border rounded-lg p-4 space-y-3 bg-gray-50/80">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-gray-700">Entrada {index + 1}</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => moveItem(index, -1)}
                      disabled={index === 0}
                      className="text-[11px] text-gray-500 hover:text-gray-800 disabled:opacity-30"
                    >
                      Subir
                    </button>
                    <button
                      type="button"
                      onClick={() => moveItem(index, 1)}
                      disabled={index === items.length - 1}
                      className="text-[11px] text-gray-500 hover:text-gray-800 disabled:opacity-30"
                    >
                      Bajar
                    </button>
                    <button
                      type="button"
                      onClick={() => removeItem(index)}
                      className="text-[11px] text-red-500 hover:text-red-700"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-[10px] font-bold text-gray-400 uppercase">Tipo de bloque</label>
                  <select
                    value={item.layout || 'title_text'}
                    onChange={(e) => updateItem(index, 'layout', e.target.value)}
                    className="w-full border p-2.5 text-xs rounded-lg focus:ring-1 focus:ring-indigo-500 outline-none bg-white"
                  >
                    {BLOG_LAYOUTS.map((layout) => (
                      <option key={layout.value} value={layout.value}>
                        {layout.label}
                      </option>
                    ))}
                  </select>
                  <p className="text-[10px] text-gray-400">{meta.description}</p>
                </div>

                {meta.usesTitle && (
                  <div className="space-y-2">
                    <label className="block text-[10px] font-bold text-gray-400 uppercase">Título</label>
                    <input
                      type="text"
                      value={item.title || ''}
                      onChange={(e) => updateItem(index, 'title', e.target.value)}
                      placeholder="Título de la entrada"
                      className="w-full border p-2.5 text-xs rounded-lg focus:ring-1 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                )}

                {meta.usesText && (
                  <div className="space-y-2">
                    <label className="block text-[10px] font-bold text-gray-400 uppercase">Texto</label>
                    <textarea
                      rows="5"
                      value={item.text || ''}
                      onChange={(e) => updateItem(index, 'text', e.target.value)}
                      placeholder="Escribe el contenido. Usa líneas en blanco para separar párrafos."
                      className="w-full border p-2.5 text-xs rounded-lg focus:ring-1 focus:ring-indigo-500 outline-none resize-y min-h-[100px]"
                    />
                  </div>
                )}

                {meta.usesImage && (
                  <>
                    <ImageUrlField
                      label="Imagen"
                      value={item.imageUrl || ''}
                      onChange={(imageUrl) => updateItem(index, 'imageUrl', imageUrl)}
                      pageId={pageId}
                      pageData={formData}
                      uploadFolder={`blog-${index + 1}`}
                      placeholder="https://ejemplo.com/imagen.jpg"
                      previewClassName="h-24 w-full max-w-xs rounded-lg object-cover border bg-white"
                      previewAlt={`Vista previa blog ${index + 1}`}
                      helperText="Pega una URL o sube una imagen."
                    />
                    <div className="space-y-2">
                      <label className="block text-[10px] font-bold text-gray-400 uppercase">
                        Texto alternativo (opcional)
                      </label>
                      <input
                        type="text"
                        value={item.imageAlt || ''}
                        onChange={(e) => updateItem(index, 'imageAlt', e.target.value)}
                        placeholder="Descripción breve de la imagen"
                        className="w-full border p-2.5 text-xs rounded-lg focus:ring-1 focus:ring-indigo-500 outline-none"
                      />
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </>
      )}

      <SectionBackgroundEditor
        sectionKey="blog"
        label="Fondo del blog"
        formData={formData}
        onChange={onChange}
      />
    </div>
  );
}
