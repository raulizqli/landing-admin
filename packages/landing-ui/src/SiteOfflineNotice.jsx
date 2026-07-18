/**
 * Shown when unpaid publicity no longer covers hosting (offline stage).
 */
export default function SiteOfflineNotice({
  siteName = '',
  renewUrl = '',
}) {
  const name = String(siteName || '').trim() || 'This site';
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#070B0A] px-6 py-16 text-[#F4F7F5] font-sans">
      <div className="max-w-lg text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#7CFFB2]">
          Temporarily offline
        </p>
        <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
          {name} is offline
        </h1>
        <p className="mt-4 text-sm leading-relaxed text-[#A8B5AE] sm:text-base">
          The subscription has been unpaid long enough that platform publicity no longer
          covers hosting. Renew the plan to restore the public site.
        </p>
        {renewUrl ? (
          <a
            href={renewUrl}
            className="mt-8 inline-flex rounded-xl bg-[#7CFFB2] px-5 py-3 text-sm font-semibold text-[#070B0A]"
          >
            Renew subscription
          </a>
        ) : null}
      </div>
    </div>
  );
}
