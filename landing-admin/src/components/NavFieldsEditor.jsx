import ImageUrlField from './ImageUrlField';
import SectionBackgroundEditor, { ColorField } from './SectionBackgroundEditor';
import { buildSocialUrl } from '../utils/socialLinks';
import { NAV_ALIGN_OPTIONS } from '../utils/sectionVisibility';
import { NAV_SPECIALTY_CASE_OPTIONS } from '../utils/navDisplay';
import {
  BRAND_COLOR_PRESETS,
  TEXT_COLOR_PRESETS,
} from '../utils/sectionBackground';
import {
  DEFAULT_NAV_CTA_BG_COLOR,
  DEFAULT_NAV_CTA_TEXT_COLOR,
} from '../utils/pageModel';

function NavSpecialtyFields({ formData, onChange }) {
  const casing = formData.navSpecialtyCase === 'capitalize' ? 'capitalize' : 'uppercase';

  return (
    <div className="space-y-3 rounded-lg border border-gray-100 bg-gray-50/80 p-3">
      <div className="space-y-2">
        <label className="block text-[10px] font-bold text-gray-400 uppercase">
          Especialidad en el navbar
        </label>
        <input
          type="text"
          value={formData.navSpecialty || ''}
          onChange={(e) => onChange({ ...formData, navSpecialty: e.target.value })}
          placeholder={formData.specialty || 'Psicología clínica'}
          className="w-full border p-2.5 text-xs rounded-lg focus:ring-1 focus:ring-indigo-500 outline-none bg-white"
        />
        <p className="text-[10px] text-gray-400">
          Texto bajo el nombre. Si lo dejas vacío, se usa la especialidad del hero (cuando exista).
        </p>
      </div>

      <fieldset className="space-y-2">
        <legend className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Estilo tipográfico</legend>
        {NAV_SPECIALTY_CASE_OPTIONS.map((option) => (
          <label key={option.value} className="flex items-center gap-2 text-xs text-gray-600">
            <input
              type="radio"
              name="nav-specialty-case"
              checked={casing === option.value}
              onChange={() => onChange({ ...formData, navSpecialtyCase: option.value })}
              className="border-gray-300"
            />
            {option.label}
          </label>
        ))}
      </fieldset>
    </div>
  );
}

export default function NavFieldsEditor({ formData, onChange, pageId }) {
  const logoMode = formData.navMode === 'logo';
  const iconOnly = formData.navIconOnly === true;
  const ctaTarget = formData.navCtaTarget || 'email';
  const showCta = formData.navShowCta !== false;
  const showMenu = formData.navShowMenu === true;
  const navAlign = formData.navAlign || 'spread';
  const whatsappUrl = buildSocialUrl(formData.whatsapp, 'whatsapp');

  return (
    <div className="space-y-3 pt-2 border-t">
      <label className="block text-[11px] font-bold text-gray-400 uppercase">Barra de navegación</label>

      <fieldset className="space-y-2">
        <legend className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Estilo de marca</legend>
        <label className="flex items-center gap-2 text-xs text-gray-600">
          <input
            type="radio"
            name="nav-brand-mode"
            checked={!logoMode}
            onChange={() => onChange({ ...formData, navMode: 'profile' })}
            className="border-gray-300"
          />
          Perfil: icono/foto + nombre y especialidad
        </label>
        <label className="flex items-center gap-2 text-xs text-gray-600">
          <input
            type="radio"
            name="nav-brand-mode"
            checked={logoMode}
            onChange={() => onChange({ ...formData, navMode: 'logo' })}
            className="border-gray-300"
          />
          Logo personalizado (imagen grande)
        </label>
      </fieldset>

      {!logoMode ? (
        <>
          <ImageUrlField
            label="Icono o foto"
            value={formData.navIconUrl || ''}
            onChange={(navIconUrl) => onChange({ ...formData, navIconUrl })}
            pageId={pageId}
            pageData={formData}
            uploadFolder="nav-icon"
            placeholder="https://ejemplo.com/foto.jpg"
            previewClassName="h-8 w-8 rounded-full object-cover border bg-white"
            previewAlt="Vista previa del icono"
            helperText="Pega una URL o sube una imagen (JPG, PNG, WEBP o GIF, máx. 5 MB)."
          />

          <fieldset className="space-y-2">
            <legend className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Contenido visible</legend>
            <label className="flex items-center gap-2 text-xs text-gray-600">
              <input
                type="radio"
                name="nav-display-mode"
                checked={!iconOnly}
                onChange={() => onChange({ ...formData, navIconOnly: false })}
                className="border-gray-300"
              />
              Icono + nombre y especialidad
            </label>
            <label className="flex items-center gap-2 text-xs text-gray-600">
              <input
                type="radio"
                name="nav-display-mode"
                checked={iconOnly}
                onChange={() => onChange({ ...formData, navIconOnly: true })}
                className="border-gray-300"
              />
              Solo icono
            </label>
            {iconOnly && !formData.navIconUrl && (
              <p className="text-[10px] text-amber-600">
                Sin imagen se mostrará la inicial del nombre como respaldo.
              </p>
            )}

            {!iconOnly && (
              <NavSpecialtyFields formData={formData} onChange={onChange} />
            )}
          </fieldset>
        </>
      ) : (
        <>
          <ImageUrlField
            label="Logo personalizado"
            value={formData.navLogoUrl || ''}
            onChange={(navLogoUrl) => onChange({ ...formData, navLogoUrl })}
            pageId={pageId}
            pageData={formData}
            uploadFolder="nav-logo"
            placeholder="https://ejemplo.com/mi-logo.png"
            previewClassName="h-10 max-w-[180px] object-contain border bg-white rounded px-2"
            previewAlt="Vista previa del logo"
            helperText="Pega una URL o sube tu logo. Sin imagen se usará nombre y especialidad como respaldo."
          />
          <NavSpecialtyFields formData={formData} onChange={onChange} />
        </>
      )}

      <fieldset className="space-y-2 pt-1">
        <legend className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Versión / layout</legend>
        <div className="space-y-1">
          <label className="block text-[10px] font-bold text-gray-400 uppercase">Alineación</label>
          <select
            value={navAlign}
            onChange={(e) => onChange({ ...formData, navAlign: e.target.value })}
            className="w-full border p-2.5 text-xs rounded-lg bg-white focus:ring-1 focus:ring-indigo-500 outline-none"
          >
            {NAV_ALIGN_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <label className="flex items-center gap-2 text-xs text-gray-600">
          <input
            type="checkbox"
            checked={showCta}
            onChange={(e) => onChange({ ...formData, navShowCta: e.target.checked })}
            className="rounded border-gray-300"
          />
          Mostrar botón «Reservar cita»
        </label>
        <label className="flex items-center gap-2 text-xs text-gray-600">
          <input
            type="checkbox"
            checked={showMenu}
            onChange={(e) => onChange({ ...formData, navShowMenu: e.target.checked })}
            className="rounded border-gray-300"
          />
          Menú con secciones habilitadas
        </label>
        <p className="text-[10px] text-gray-400">
          El menú lista solo secciones activas y con contenido. En móvil aparece como menú desplegable.
        </p>
      </fieldset>

      {showCta && (
      <fieldset className="space-y-3 pt-1">
        <legend className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Botón «Reservar cita»</legend>
        <label className="flex items-center gap-2 text-xs text-gray-600">
          <input
            type="radio"
            name="nav-cta-target"
            checked={ctaTarget === 'email'}
            onChange={() => onChange({ ...formData, navCtaTarget: 'email' })}
            className="border-gray-300"
          />
          Email (usa el email público)
        </label>
        <label className="flex items-center gap-2 text-xs text-gray-600">
          <input
            type="radio"
            name="nav-cta-target"
            checked={ctaTarget === 'whatsapp'}
            onChange={() => onChange({ ...formData, navCtaTarget: 'whatsapp' })}
            className="border-gray-300"
          />
          WhatsApp (usa el número de redes sociales)
        </label>
        <label className="flex items-center gap-2 text-xs text-gray-600">
          <input
            type="radio"
            name="nav-cta-target"
            checked={ctaTarget === 'link'}
            onChange={() => onChange({ ...formData, navCtaTarget: 'link' })}
            className="border-gray-300"
          />
          Enlace personalizado
        </label>

        {ctaTarget === 'email' && !formData.email && (
          <p className="text-[10px] text-amber-600">Completa el campo Email público más abajo.</p>
        )}
        {ctaTarget === 'whatsapp' && !whatsappUrl && (
          <p className="text-[10px] text-amber-600">Configura WhatsApp en la sección Redes sociales.</p>
        )}
        {ctaTarget === 'link' && (
          <div className="space-y-2">
            <input
              type="url"
              value={formData.navCtaLink || ''}
              onChange={(e) => onChange({ ...formData, navCtaLink: e.target.value })}
              placeholder="https://calendly.com/tu-usuario o doctoralia.com.mx/..."
              className="w-full border p-2.5 text-xs rounded-lg focus:ring-1 focus:ring-indigo-500 outline-none"
            />
          </div>
        )}

        <div className="space-y-3 rounded-lg border border-gray-100 bg-gray-50/80 p-3">
          <ColorField
            label="Color de fondo del botón"
            value={formData.navCtaBgColor || DEFAULT_NAV_CTA_BG_COLOR}
            onChange={(navCtaBgColor) => onChange({ ...formData, navCtaBgColor })}
            presets={BRAND_COLOR_PRESETS}
          />
          <ColorField
            label="Color del texto del botón"
            value={formData.navCtaTextColor || DEFAULT_NAV_CTA_TEXT_COLOR}
            onChange={(navCtaTextColor) => onChange({ ...formData, navCtaTextColor })}
            presets={TEXT_COLOR_PRESETS}
          />
        </div>
        {navAlign === 'right' && (
          <p className="text-[10px] text-gray-400">
            Con alineación a la derecha, el botón queda a la izquierda y la marca a la derecha.
          </p>
        )}
      </fieldset>
      )}

      <SectionBackgroundEditor
        sectionKey="nav"
        label="Fondo de la barra de navegación"
        formData={formData}
        onChange={onChange}
        showOpacity
      />
    </div>
  );
}
