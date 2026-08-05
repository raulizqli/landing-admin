import { useEffect, useMemo, useRef, useState } from 'react';
import {
  BLOG_LAYOUTS,
  createEmptyBlogPost,
  getBlogLayoutMeta,
} from '../utils/blog';
import ImageUrlField from './ImageUrlField';
import SectionBackgroundEditor from './SectionBackgroundEditor';
import ShowContentToggle from './ShowContentToggle';
import AiAssistButton from './AiAssistButton';
import { getDefaultLabelForPage } from '../utils/labels';
import { useEntitlements } from '../hooks/useEntitlements';
import { useLocale } from '../i18n/LocaleContext';

function formatPostCurrentValue(post) {
  const title = String(post?.title ?? '').trim();
  const text = String(post?.text ?? '').trim();
  if (title && text) return `Título: ${title}\nTexto: ${text}`;
  return title || text || '';
}

export default function BlogFieldsEditor({ formData, onChange, pageId, canToggleSection = true }) {
  const { t } = useLocale();
  const entitlements = useEntitlements();
  const canFull = entitlements.bypass || entitlements.aiLane === 'full';
  const enabled = Boolean(formData.blogSectionEnabled);
  const items = Array.isArray(formData.blogPosts) && formData.blogPosts.length > 0
    ? formData.blogPosts
    : [createEmptyBlogPost()];
  const titlePlaceholder = getDefaultLabelForPage(formData, 'blog.defaultTitle');
  const introPlaceholder = getDefaultLabelForPage(formData, 'blog.defaultIntro');
  const [selectedPostIndex, setSelectedPostIndex] = useState(0);
  const prevPostCountRef = useRef(items.length);

  useEffect(() => {
    if (items.length > prevPostCountRef.current) {
      const newIndex = items.length - 1;
      setSelectedPostIndex(newIndex);
    }
    prevPostCountRef.current = items.length;
  }, [items.length]);

  useEffect(() => {
    if (selectedPostIndex >= items.length) {
      setSelectedPostIndex(Math.max(0, items.length - 1));
    }
  }, [items.length, selectedPostIndex]);

  const selectedPost = items[selectedPostIndex] || items[0];

  const blogAiMenu = useMemo(() => [
    {
      action: 'blog_draft',
      labelKey: 'ai.blog.editPost',
      fieldPath: `blogPosts[${selectedPostIndex}]`,
      currentValue: formatPostCurrentValue(selectedPost),
    },
    {
      action: 'blog_draft',
      labelKey: 'ai.blog.addPost',
      fieldPath: 'blogPosts[+]',
      currentValue: '',
    },
  ], [selectedPost, selectedPostIndex]);

  const updateItems = (nextItems) => {
    onChange({ ...formData, blogPosts: nextItems });
  };

  const updateItem = (index, field, value) => {
    updateItems(items.map((item, i) => (i === index ? { ...item, [field]: value } : item)));
  };

  const addItem = () => {
    const nextIndex = items.length;
    updateItems([...items, createEmptyBlogPost()]);
    setSelectedPostIndex(nextIndex);
  };

  const removeItem = (index) => {
    if (items.length <= 1) {
      updateItems([createEmptyBlogPost()]);
      setSelectedPostIndex(0);
      return;
    }
    updateItems(items.filter((_, i) => i !== index));
    setSelectedPostIndex((prev) => {
      if (prev === index) return Math.max(0, index - 1);
      if (prev > index) return prev - 1;
      return prev;
    });
  };

  const moveItem = (index, direction) => {
    const target = index + direction;
    if (target < 0 || target >= items.length) return;
    const next = [...items];
    const [item] = next.splice(index, 1);
    next.splice(target, 0, item);
    updateItems(next);
    setSelectedPostIndex((prev) => {
      if (prev === index) return target;
      if (prev === target) return index;
      return prev;
    });
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
            <ShowContentToggle
              checked={formData.blogShowTitle !== false}
              onChange={(blogShowTitle) => onChange({ ...formData, blogShowTitle })}
              label="Mostrar título de la sección"
              hint="Desactivado = se omite el título (no usa el valor por defecto)."
            />
            {formData.blogShowTitle !== false && (
              <input
                type="text"
                value={formData.blogSectionTitle || ''}
                onChange={(e) => onChange({ ...formData, blogSectionTitle: e.target.value })}
                placeholder={titlePlaceholder}
                className="w-full border p-2.5 text-xs rounded-lg focus:ring-1 focus:ring-indigo-500 outline-none"
              />
            )}
          </div>

          <div className="space-y-2">
            <ShowContentToggle
              checked={formData.blogShowIntro !== false}
              onChange={(blogShowIntro) => onChange({ ...formData, blogShowIntro })}
              label="Mostrar texto introductorio"
              hint="Desactivado = se omite la introducción (no usa el texto por defecto)."
            />
            {formData.blogShowIntro !== false && (
              <textarea
                rows="3"
                value={formData.blogSectionText || ''}
                onChange={(e) => onChange({ ...formData, blogSectionText: e.target.value })}
                placeholder={introPlaceholder}
                className="w-full border p-2.5 text-xs rounded-lg focus:ring-1 focus:ring-indigo-500 outline-none resize-none"
              />
            )}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-[10px] text-gray-400">
                {items.length} entrada{items.length === 1 ? '' : 's'}
              </p>
              <p className="text-[10px] text-gray-400 mt-0.5">
                {t('ai.blog.selectedPost', { n: selectedPostIndex + 1 })}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {canFull && (
                <AiAssistButton
                  formData={formData}
                  onChange={onChange}
                  pageId={pageId}
                  action="blog_draft"
                  fieldPath={`blogPosts[${selectedPostIndex}]`}
                  currentValue={formatPostCurrentValue(selectedPost)}
                  label="✨ LeftSide AI"
                  showLiteMenu={false}
                  customMenu={blogAiMenu}
                  workingTaskLabel={t('ai.workingBlog')}
                />
              )}
              <button
                type="button"
                onClick={addItem}
                className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800"
              >
                + Añadir entrada
              </button>
            </div>
          </div>

          {items.map((item, index) => {
            const meta = getBlogLayoutMeta(item.layout);
            const selected = index === selectedPostIndex;
            return (
              <div
                key={item.id || `blog-editor-${index}`}
                role="button"
                tabIndex={0}
                onClick={() => setSelectedPostIndex(index)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    setSelectedPostIndex(index);
                  }
                }}
                className={`border rounded-lg p-4 space-y-3 bg-gray-50/80 cursor-pointer ${
                  selected ? 'border-indigo-300 ring-1 ring-indigo-100' : 'border-gray-200'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-gray-700">
                    Entrada {index + 1}
                    {selected && (
                      <span className="ml-1.5 text-[10px] font-bold uppercase text-indigo-500">
                        · seleccionada
                      </span>
                    )}
                  </span>
                  <div className="flex items-center gap-2" onClick={(event) => event.stopPropagation()}>
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

                <div className="space-y-2" onClick={(event) => event.stopPropagation()}>
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
                  <div className="space-y-2" onClick={(event) => event.stopPropagation()}>
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
                  <div className="space-y-2" onClick={(event) => event.stopPropagation()}>
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
                  <div onClick={(event) => event.stopPropagation()}>
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
                    <div className="space-y-2 mt-3">
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
                  </div>
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
