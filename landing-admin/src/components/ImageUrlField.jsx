import { useRef, useState } from 'react';
import { uploadPageImage } from '../utils/uploadImage';
import { useEntitlements } from '../hooks/useEntitlements';
import { useLocale } from '../i18n/LocaleContext';

export default function ImageUrlField({
  label,
  value,
  onChange,
  pageId,
  pageData,
  uploadFolder,
  placeholder = 'https://ejemplo.com/imagen.jpg',
  previewClassName = 'h-16 w-16 object-cover border bg-white rounded',
  previewAlt = 'Vista previa',
  helperText,
  maxBytes,
  onUpgradePlan,
  upgradeLabel,
}) {
  const fileInputRef = useRef(null);
  const { t } = useLocale();
  const entitlements = useEntitlements();
  const canUpload = entitlements.bypass || entitlements.has('imageUpload');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const handleUpload = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    if (!canUpload) {
      setError(t('billing.features.imageUploadLocked'));
      onUpgradePlan?.();
      return;
    }

    setError('');
    setUploading(true);

    try {
      const url = await uploadPageImage(file, { pageId, folder: uploadFolder, pageData, maxBytes });
      onChange(url);
    } catch (uploadError) {
      console.error(uploadError);
      setError(uploadError?.message || 'No se pudo subir la imagen.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-2">
      <label className="block text-[10px] font-bold text-gray-400 uppercase">{label}</label>
      {helperText && (
        <p className="text-[10px] text-gray-400">{helperText}</p>
      )}
      <div className="flex gap-2">
        <input
          type="text"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="flex-1 min-w-0 border p-2.5 text-xs rounded-lg focus:ring-1 focus:ring-indigo-500 outline-none"
        />
        <button
          type="button"
          disabled={uploading || (!canUpload && !onUpgradePlan)}
          onClick={() => {
            if (!canUpload) {
              setError(t('billing.features.imageUploadLocked'));
              onUpgradePlan?.();
              return;
            }
            fileInputRef.current?.click();
          }}
          title={canUpload ? undefined : t('billing.features.imageUploadLocked')}
          className="shrink-0 px-3 py-2 text-[11px] font-semibold rounded-lg border border-indigo-200 text-indigo-700 bg-indigo-50 hover:bg-indigo-100 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {uploading ? 'Subiendo...' : (canUpload ? 'Subir' : (upgradeLabel || t('common.upgrade')))}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="hidden"
          onChange={handleUpload}
        />
      </div>
      {error && (
        <p className="text-[10px] text-red-600">{error}</p>
      )}
      {!canUpload && (
        <p className="text-[10px] text-amber-700">
          {t('billing.features.imageUploadLocked')}
        </p>
      )}
      {value && (
        <div className="flex items-center gap-2 text-[10px] text-gray-500">
          <img
            src={value}
            alt={previewAlt}
            className={previewClassName}
          />
          Vista previa
        </div>
      )}
    </div>
  );
}
