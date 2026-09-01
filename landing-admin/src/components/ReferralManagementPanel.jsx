import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLocale } from '../i18n/LocaleContext';
import {
  generateReferralCode,
  generateReferralLink,
  calculateConversionRate,
  formatReferralRevenue,
  getReferralTier,
  getNextReferralTier,
  normalizeReferralCode,
  isValidReferralCode,
} from '@raulizqli/landing-core/referralTracking';

/**
 * Referral Management Panel Component
 * Allows users to manage their referral code and view statistics.
 */
export default function ReferralManagementPanel({ billingAccount, onUpdate, onClose }) {
  const { t } = useLocale();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [referralConfig, setReferralConfig] = useState(
    billingAccount?.referralConfig || {
      enabled: false,
      code: '',
      customSlug: '',
      stats: {
        totalClicks: 0,
        totalSignups: 0,
        totalPaidConversions: 0,
        totalRevenue: 0,
      },
    }
  );
  const [customCode, setCustomCode] = useState('');
  const [editingCode, setEditingCode] = useState(false);
  const [copied, setCopied] = useState(false);

  const referralLink = referralConfig.code
    ? generateReferralLink(referralConfig.code)
    : '';

  const conversionRate = calculateConversionRate(referralConfig.stats);
  const currentTier = getReferralTier(referralConfig.stats.totalPaidConversions);
  const nextTier = getNextReferralTier(referralConfig.stats.totalPaidConversions);

  const handleEnableReferrals = async () => {
    setLoading(true);
    try {
      const newCode = generateReferralCode();
      const updatedConfig = {
        ...referralConfig,
        enabled: true,
        code: newCode,
      };
      setReferralConfig(updatedConfig);
      await onUpdate?.(updatedConfig);
    } catch (error) {
      console.error('Error enabling referrals:', error);
      alert('No se pudo activar el sistema de referidos. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateCode = async () => {
    if (!customCode.trim()) {
      alert('Por favor ingresa un código.');
      return;
    }

    const normalized = normalizeReferralCode(customCode);
    if (!isValidReferralCode(normalized)) {
      alert('Código inválido. Debe tener 6 caracteres alfanuméricos.');
      return;
    }

    setLoading(true);
    try {
      const updatedConfig = {
        ...referralConfig,
        code: normalized,
      };
      setReferralConfig(updatedConfig);
      await onUpdate?.(updatedConfig);
      setEditingCode(false);
      setCustomCode('');
    } catch (error) {
      console.error('Error updating code:', error);
      alert('No se pudo actualizar el código. Verifica que no esté en uso.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = () => {
    if (referralLink) {
      navigator.clipboard.writeText(referralLink).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    }
  };

  const handleToggleEnabled = async () => {
    setLoading(true);
    try {
      const updatedConfig = {
        ...referralConfig,
        enabled: !referralConfig.enabled,
      };
      setReferralConfig(updatedConfig);
      await onUpdate?.(updatedConfig);
    } catch (error) {
      console.error('Error toggling referrals:', error);
      alert('No se pudo cambiar el estado. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  if (!referralConfig.code) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden">
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4 flex justify-between items-center">
            <h2 className="text-xl font-bold text-white">Sistema de Referidos</h2>
            <button
              type="button"
              onClick={onClose}
              className="text-white hover:text-gray-200 text-2xl leading-none"
            >
              ×
            </button>
          </div>

          <div className="p-8 text-center">
            <div className="mb-6">
              <svg
                className="mx-auto h-24 w-24 text-indigo-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                />
              </svg>
            </div>

            <h3 className="text-2xl font-bold text-gray-900 mb-3">
              Activa tu código de referidos
            </h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              Gana recompensas al referir nuevos usuarios. Cada vez que alguien se registre
              con tu código y se convierta en cliente de pago, ganarás comisiones.
            </p>

            <div className="bg-indigo-50 rounded-lg p-6 mb-6 max-w-md mx-auto">
              <h4 className="font-semibold text-indigo-900 mb-3">Beneficios:</h4>
              <ul className="text-left space-y-2 text-sm text-indigo-800">
                <li className="flex items-start">
                  <span className="mr-2">✓</span>
                  <span>Comisiones por cada conversión exitosa</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">✓</span>
                  <span>Sistema de niveles con recompensas crecientes</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">✓</span>
                  <span>Dashboard de estadísticas en tiempo real</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">✓</span>
                  <span>Enlace personalizable para compartir</span>
                </li>
              </ul>
            </div>

            <button
              type="button"
              onClick={handleEnableReferrals}
              disabled={loading}
              className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-3 rounded-lg font-semibold hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Activando...' : 'Activar sistema de referidos'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
      <div className="w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden my-8">
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-bold text-white">Gestión de Referidos</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-white hover:text-gray-200 text-2xl leading-none"
          >
            ×
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Status and Toggle */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <h3 className="font-semibold text-gray-900">Estado del sistema</h3>
              <p className="text-sm text-gray-600">
                {referralConfig.enabled
                  ? 'Tu código está activo y puedes compartirlo'
                  : 'Tu código está pausado temporalmente'}
              </p>
            </div>
            <button
              type="button"
              onClick={handleToggleEnabled}
              disabled={loading}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                referralConfig.enabled ? 'bg-indigo-600' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  referralConfig.enabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Referral Code Section */}
          <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Tu código de referido</h3>
              <button
                type="button"
                onClick={() => setEditingCode(!editingCode)}
                className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
              >
                {editingCode ? 'Cancelar' : 'Personalizar'}
              </button>
            </div>

            {editingCode ? (
              <div className="space-y-3">
                <input
                  type="text"
                  value={customCode}
                  onChange={(e) => setCustomCode(e.target.value.toUpperCase())}
                  placeholder="Ingresa 6 caracteres"
                  maxLength={6}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-center text-2xl font-mono tracking-widest uppercase"
                />
                <button
                  type="button"
                  onClick={handleUpdateCode}
                  disabled={loading}
                  className="w-full bg-indigo-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-indigo-700 disabled:opacity-50"
                >
                  Actualizar código
                </button>
              </div>
            ) : (
              <div className="text-center">
                <div className="bg-white rounded-lg py-4 px-6 mb-4 inline-block">
                  <span className="text-4xl font-bold font-mono tracking-widest text-indigo-600">
                    {referralConfig.code}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-4">Comparte este código con colegas</p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={referralLink}
                    readOnly
                    className="flex-1 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm"
                  />
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-indigo-700"
                  >
                    {copied ? '✓ Copiado' : 'Copiar enlace'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="text-2xl font-bold text-indigo-600">
                {referralConfig.stats.totalClicks || 0}
              </div>
              <div className="text-sm text-gray-600">Clicks totales</div>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="text-2xl font-bold text-green-600">
                {referralConfig.stats.totalSignups || 0}
              </div>
              <div className="text-sm text-gray-600">Registros</div>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="text-2xl font-bold text-purple-600">
                {referralConfig.stats.totalPaidConversions || 0}
              </div>
              <div className="text-sm text-gray-600">Conversiones pagadas</div>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="text-2xl font-bold text-amber-600">
                {formatReferralRevenue(
                  referralConfig.stats.totalRevenue || 0,
                  billingAccount?.currency || 'usd'
                )}
              </div>
              <div className="text-sm text-gray-600">Ingresos generados</div>
            </div>
          </div>

          {/* Conversion Rate */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Tasa de conversión</span>
              <span className="text-lg font-bold text-indigo-600">
                {conversionRate.toFixed(1)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-indigo-600 to-purple-600 h-2 rounded-full transition-all"
                style={{ width: `${Math.min(conversionRate, 100)}%` }}
              />
            </div>
          </div>

          {/* Tier System */}
          <div className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Tu nivel actual</h3>
            <div className="flex items-center gap-4 mb-4">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold"
                style={{ backgroundColor: currentTier.color + '40', color: currentTier.color }}
              >
                {currentTier.rewardPercent}%
              </div>
              <div>
                <div className="text-xl font-bold" style={{ color: currentTier.color }}>
                  {currentTier.name}
                </div>
                <div className="text-sm text-gray-600">
                  Comisión: {currentTier.rewardPercent}% por conversión
                </div>
              </div>
            </div>

            {nextTier && (
              <div className="pt-4 border-t border-amber-200">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-gray-700">Progreso al siguiente nivel</span>
                  <span className="font-semibold text-gray-900">
                    {referralConfig.stats.totalPaidConversions} / {nextTier.minConversions}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-amber-500 to-yellow-500 h-2 rounded-full transition-all"
                    style={{
                      width: `${Math.min(
                        (referralConfig.stats.totalPaidConversions / nextTier.minConversions) *
                          100,
                        100
                      )}%`,
                    }}
                  />
                </div>
                <p className="text-xs text-gray-600 mt-2">
                  Alcanza {nextTier.minConversions} conversiones para desbloquear el nivel{' '}
                  <span className="font-semibold" style={{ color: nextTier.color }}>
                    {nextTier.name}
                  </span>{' '}
                  y aumentar tu comisión a {nextTier.rewardPercent}%
                </p>
              </div>
            )}
          </div>

          {/* Social Sharing */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-3">Compartir en redes sociales</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <a
                href={`https://twitter.com/intent/tweet?text=Únete a Toqua con mi código de referido: ${referralConfig.code}&url=${encodeURIComponent(referralLink)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 bg-[#1DA1F2] text-white px-4 py-2 rounded-lg hover:opacity-90 text-sm font-medium"
              >
                <span>🐦</span> Twitter
              </a>
              <a
                href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(referralLink)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 bg-[#4267B2] text-white px-4 py-2 rounded-lg hover:opacity-90 text-sm font-medium"
              >
                <span>📘</span> Facebook
              </a>
              <a
                href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(referralLink)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 bg-[#0077B5] text-white px-4 py-2 rounded-lg hover:opacity-90 text-sm font-medium"
              >
                <span>💼</span> LinkedIn
              </a>
              <a
                href={`https://wa.me/?text=Únete a Toqua con mi código: ${referralConfig.code} ${referralLink}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 bg-[#25D366] text-white px-4 py-2 rounded-lg hover:opacity-90 text-sm font-medium"
              >
                <span>📱</span> WhatsApp
              </a>
            </div>
          </div>

          {/* Close Button */}
          <div className="flex justify-end pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="bg-gray-100 text-gray-700 px-6 py-2 rounded-lg font-semibold hover:bg-gray-200"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
