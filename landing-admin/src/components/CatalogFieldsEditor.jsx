import { createEmptyCatalogItem } from '../utils/catalog';
import ImageUrlField from './ImageUrlField';
import SectionBackgroundEditor from './SectionBackgroundEditor';

export default function CatalogFieldsEditor({ formData, onChange, pageId, canToggleSection = true }) {
  const enabled = Boolean(formData.catalogSectionEnabled);
  const items = Array.isArray(formData.catalogItems) && formData.catalogItems.length > 0
    ? formData.catalogItems
    : [createEmptyCatalogItem()];

  const updateItems = (nextItems) => {
    onChange({ ...formData, catalogItems: nextItems });
  };

  const updateItem = (index, field, value) => {
    updateItems(items.map((item, i) => (i === index ? { ...item, [field]: value } : item)));
  };

  const addItem = () => {
    updateItems([...items, createEmptyCatalogItem()]);
  };

  const removeItem = (index) => {
    if (items.length <= 1) {
      updateItems([createEmptyCatalogItem()]);
      return;
    }
    updateItems(items.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4 pt-2 border-t">
      <div className="flex items-center justify-between gap-3">
        <label className="block text-[11px] font-bold text-gray-400 uppercase">
          Catálogo de productos
        </label>
        {canToggleSection && (
          <label className="flex items-center gap-2 text-xs text-gray-600">
            <input
              type="checkbox"
              checked={enabled}
              onChange={(e) => onChange({ ...formData, catalogSectionEnabled: e.target.checked })}
              className="rounded border-gray-300"
            />
            Mostrar sección
          </label>
        )}
      </div>

      {enabled && (
        <>
          <p className="text-[10px] text-gray-400">
            Ideal para mostrar productos (lentes, armazones, paquetes, etc.) con foto, precio y enlace opcional.
          </p>

          <div className="space-y-2">
            <label className="block text-[10px] font-bold text-gray-400 uppercase">Título de la sección</label>
            <input
              type="text"
              value={formData.catalogSectionTitle || ''}
              onChange={(e) => onChange({ ...formData, catalogSectionTitle: e.target.value })}
              placeholder="Catálogo de lentes"
              className="w-full border p-2.5 text-xs rounded-lg focus:ring-1 focus:ring-indigo-500 outline-none"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-[10px] font-bold text-gray-400 uppercase">Texto introductorio (opcional)</label>
            <textarea
              rows="3"
              value={formData.catalogSectionText || ''}
              onChange={(e) => onChange({ ...formData, catalogSectionText: e.target.value })}
              placeholder="Descubre nuestras opciones de lentes y armazones."
              className="w-full border p-2.5 text-xs rounded-lg focus:ring-1 focus:ring-indigo-500 outline-none resize-none"
            />
          </div>

          <div className="flex items-center justify-between">
            <p className="text-[10px] text-gray-400">Cada producto necesita al menos título, descripción o imagen.</p>
            <button
              type="button"
              onClick={addItem}
              className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800"
            >
              + Añadir producto
            </button>
          </div>

          {items.map((item, index) => (
            <div key={`catalog-editor-${index}`} className="border rounded-lg p-4 space-y-3 bg-gray-50/80">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-700">Producto {index + 1}</span>
                <button
                  type="button"
                  onClick={() => removeItem(index)}
                  className="text-[11px] text-red-500 hover:text-red-700"
                >
                  Eliminar
                </button>
              </div>

              <ImageUrlField
                label="Imagen del producto"
                value={item.imageUrl || ''}
                onChange={(imageUrl) => updateItem(index, 'imageUrl', imageUrl)}
                pageId={pageId}
                pageData={formData}
                uploadFolder={`catalog-${index + 1}`}
                placeholder="https://ejemplo.com/lentes.jpg"
                previewClassName="h-16 w-20 object-cover border bg-white rounded"
                previewAlt={`Vista previa producto ${index + 1}`}
                helperText="Pega una URL o sube la foto del producto."
              />

              <div className="space-y-2">
                <label className="block text-[10px] font-bold text-gray-400 uppercase">Título</label>
                <input
                  type="text"
                  value={item.title || ''}
                  onChange={(e) => updateItem(index, 'title', e.target.value)}
                  placeholder="Lentes progresivos antireflejo"
                  className="w-full border p-2.5 text-xs rounded-lg focus:ring-1 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-[10px] font-bold text-gray-400 uppercase">Descripción</label>
                <textarea
                  rows="3"
                  value={item.description || ''}
                  onChange={(e) => updateItem(index, 'description', e.target.value)}
                  placeholder="Cristales con protección UV y tratamiento antirrayas."
                  className="w-full border p-2.5 text-xs rounded-lg focus:ring-1 focus:ring-indigo-500 outline-none resize-none"
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <label className="block text-[10px] font-bold text-gray-400 uppercase">Precio (opcional)</label>
                  <input
                    type="text"
                    value={item.price || ''}
                    onChange={(e) => updateItem(index, 'price', e.target.value)}
                    placeholder="$2,500 MXN"
                    className="w-full border p-2.5 text-xs rounded-lg focus:ring-1 focus:ring-indigo-500 outline-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-[10px] font-bold text-gray-400 uppercase">Enlace (opcional)</label>
                  <input
                    type="url"
                    value={item.link || ''}
                    onChange={(e) => updateItem(index, 'link', e.target.value)}
                    placeholder="https://tienda.ejemplo.com/producto"
                    className="w-full border p-2.5 text-xs rounded-lg focus:ring-1 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>
            </div>
          ))}
        </>
      )}

      <SectionBackgroundEditor
        sectionKey="catalog"
        label="Fondo del catálogo"
        formData={formData}
        onChange={onChange}
      />
    </div>
  );
}
