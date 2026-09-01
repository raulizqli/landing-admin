import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLocale } from '../i18n/LocaleContext';
import { getReferralAnalyticsRemote } from '../utils/referralFunctions';
import {
  calculateConversionRate,
  formatReferralRevenue,
  getReferralTier,
} from '@raulizqli/landing-core/referralTracking';

/**
 * Referral Dashboard Component
 * Displays detailed referral statistics and conversion history.
 */
export default function ReferralDashboard({ billingAccount, onClose, onOpenManagement }) {
  const { t } = useLocale();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getReferralAnalyticsRemote();
      setAnalytics(data);
    } catch (err) {
      console.error('Error loading analytics:', err);
      setError('No se pudieron cargar las estadísticas. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <div className="bg-white rounded-2xl p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="text-center mt-4 text-gray-600">Cargando estadísticas...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <div className="bg-white rounded-2xl p-8 max-w-md">
          <h3 className="text-lg font-semibold text-red-600 mb-2">Error</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={loadAnalytics}
              className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
            >
              Reintentar
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!analytics?.hasReferralCode) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <div className="bg-white rounded-2xl p-8 max-w-md text-center">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No tienes un código de referidos
          </h3>
          <p className="text-gray-600 mb-6">
            Activa el sistema de referidos para comenzar a ganar comisiones.
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenManagement?.();
              }}
              className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
            >
              Activar referidos
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    );
  }

  const { referralConfig, conversions = [] } = analytics;
  const stats = referralConfig.stats || {};
  const conversionRate = calculateConversionRate(stats);
  const currentTier = getReferralTier(stats.totalPaidConversions);

  const formatDate = (timestamp) => {
    if (!timestamp) return '-';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return new Intl.DateTimeFormat('es', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
      <div className="w-full max-w-6xl bg-white rounded-2xl shadow-2xl overflow-hidden my-8">
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-bold text-white">Dashboard de Referidos</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-white hover:text-gray-200 text-2xl leading-none"
          >
            ×
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Quick Actions */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenManagement?.();
              }}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-indigo-700 text-sm"
            >
              Gestionar código
            </button>
            <button
              type="button"
              onClick={loadAnalytics}
              className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg font-semibold hover:bg-gray-200 text-sm"
            >
              ↻ Actualizar
            </button>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200">
              <div className="text-3xl font-bold text-indigo-600">{stats.totalClicks || 0}</div>
              <div className="text-sm text-gray-700 font-medium">Clicks totales</div>
              <div className="text-xs text-gray-600 mt-1">
                Personas que usaron tu link
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-4 border border-green-200">
              <div className="text-3xl font-bold text-green-600">{stats.totalSignups || 0}</div>
              <div className="text-sm text-gray-700 font-medium">Registros</div>
              <div className="text-xs text-gray-600 mt-1">
                Usuarios que se registraron
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-4 border border-purple-200">
              <div className="text-3xl font-bold text-purple-600">
                {stats.totalPaidConversions || 0}
              </div>
              <div className="text-sm text-gray-700 font-medium">Conversiones</div>
              <div className="text-xs text-gray-600 mt-1">
                Clientes que pagaron
              </div>
            </div>

            <div className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-lg p-4 border border-amber-200">
              <div className="text-3xl font-bold text-amber-600">
                {formatReferralRevenue(stats.totalRevenue || 0, billingAccount?.currency || 'usd')}
              </div>
              <div className="text-sm text-gray-700 font-medium">Ingresos generados</div>
              <div className="text-xs text-gray-600 mt-1">
                Total acumulado
              </div>
            </div>
          </div>

          {/* Conversion Funnel */}
          <div className="bg-gray-50 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Embudo de conversión</h3>
            <div className="space-y-3">
              <div className="relative">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700">Clicks</span>
                  <span className="text-sm font-bold text-gray-900">{stats.totalClicks || 0}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-4">
                  <div
                    className="bg-blue-600 h-4 rounded-full"
                    style={{ width: '100%' }}
                  />
                </div>
              </div>

              <div className="relative">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700">Registros</span>
                  <span className="text-sm font-bold text-gray-900">{stats.totalSignups || 0}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-4">
                  <div
                    className="bg-green-600 h-4 rounded-full"
                    style={{
                      width: `${stats.totalClicks > 0 ? (stats.totalSignups / stats.totalClicks) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>

              <div className="relative">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700">Conversiones</span>
                  <span className="text-sm font-bold text-gray-900">
                    {stats.totalPaidConversions || 0}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-4">
                  <div
                    className="bg-purple-600 h-4 rounded-full"
                    style={{
                      width: `${stats.totalClicks > 0 ? (stats.totalPaidConversions / stats.totalClicks) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-300">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-gray-900">Tasa de conversión</span>
                  <span className="text-xl font-bold text-indigo-600">
                    {conversionRate.toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Current Tier */}
          <div
            className="rounded-xl p-6 border-2"
            style={{ backgroundColor: currentTier.color + '20', borderColor: currentTier.color }}
          >
            <div className="flex items-center gap-4">
              <div
                className="w-20 h-20 rounded-full flex items-center justify-center text-3xl font-bold"
                style={{ backgroundColor: currentTier.color + '40', color: currentTier.color }}
              >
                {currentTier.rewardPercent}%
              </div>
              <div>
                <div className="text-2xl font-bold" style={{ color: currentTier.color }}>
                  Nivel {currentTier.name}
                </div>
                <div className="text-gray-700 font-medium">
                  Comisión actual: {currentTier.rewardPercent}% por cada conversión
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  {stats.totalPaidConversions || 0} conversiones completadas
                </div>
              </div>
            </div>
          </div>

          {/* Conversions History */}
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                Historial de conversiones ({conversions.length})
              </h3>
            </div>

            {conversions.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <svg
                  className="mx-auto h-16 w-16 text-gray-400 mb-3"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <p>Aún no tienes conversiones</p>
                <p className="text-sm mt-1">
                  Comparte tu código para comenzar a generar ingresos
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Fecha
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Usuario referido
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Plan
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Estado
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ingreso
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {conversions.map((conversion) => (
                      <tr key={conversion.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatDate(conversion.convertedAt || conversion.createdAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {conversion.referredEmail || 'Usuario anónimo'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-indigo-100 text-indigo-800 uppercase">
                            {conversion.planId || 'N/A'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 py-1 text-xs font-semibold rounded-full ${
                              conversion.status === 'converted'
                                ? 'bg-green-100 text-green-800'
                                : conversion.status === 'signed_up'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {conversion.status === 'converted' ? 'Convertido' : 
                             conversion.status === 'signed_up' ? 'Registrado' : 
                             conversion.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600">
                          {formatReferralRevenue(conversion.revenue || 0, conversion.currency || 'usd')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
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
