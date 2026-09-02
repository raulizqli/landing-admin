import { useEffect, useId, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { GOOGLE_ADS_CLIENT, GOOGLE_ADS_SLOT, isAdSenseConfigured } from '../../config/ads';

const ADS_SCRIPT_SELECTOR = 'script[src*="pagead/js/adsbygoogle.js"]';

function waitForAdsScript() {
  if (typeof window === 'undefined') return Promise.resolve(false);
  if (window.adsbygoogle?.loaded) return Promise.resolve(true);

  const existing = document.querySelector(ADS_SCRIPT_SELECTOR);
  if (!existing) return Promise.resolve(false);

  return new Promise((resolve) => {
    const done = () => resolve(Boolean(window.adsbygoogle?.loaded));
    if (window.adsbygoogle?.loaded) {
      done();
      return;
    }
    existing.addEventListener('load', done, { once: true });
    existing.addEventListener('error', () => resolve(false), { once: true });
    window.setTimeout(() => resolve(Boolean(window.adsbygoogle?.loaded)), 4000);
  });
}

function pushAdUnit() {
  const runtime = window;
  runtime.adsbygoogle = runtime.adsbygoogle || [];
  runtime.adsbygoogle.push({});
}

/**
 * Responsive Google AdSense display unit.
 * Hides itself when Google marks the slot unfilled (wrong slot/domain or no inventory).
 */
export default function AdSenseUnit({
  layout = 'display',
  format = 'auto',
  className = '',
  minHeight = 90,
  label = 'Advertisement',
}) {
  const location = useLocation();
  const unitKey = useId();
  const insRef = useRef(null);
  const pushedRef = useRef(false);
  const [visible, setVisible] = useState(true);
  const configured = isAdSenseConfigured();

  useEffect(() => {
    if (!configured || typeof window === 'undefined') return undefined;

    pushedRef.current = false;
    setVisible(true);

    let cancelled = false;
    let observer;
    let hideTimer;

    const watchStatus = (node) => {
      const sync = () => {
        const status = node.getAttribute('data-ad-status');
        if (status === 'filled') {
          setVisible(true);
        } else if (status === 'unfilled' || status === 'unfill-optimized') {
          setVisible(false);
        }
      };

      observer = new MutationObserver(sync);
      observer.observe(node, { attributes: true, attributeFilter: ['data-ad-status'] });
      hideTimer = window.setTimeout(sync, 5000);
      sync();
    };

    const mountAd = async () => {
      await waitForAdsScript();
      if (cancelled || !insRef.current || pushedRef.current) return;

      try {
        pushAdUnit();
        pushedRef.current = true;
      } catch {
        window.setTimeout(() => {
          if (cancelled || !insRef.current || pushedRef.current) return;
          try {
            pushAdUnit();
            pushedRef.current = true;
          } catch {
            setVisible(false);
          }
        }, 750);
      }

      if (insRef.current) watchStatus(insRef.current);
    };

    mountAd();

    return () => {
      cancelled = true;
      observer?.disconnect();
      if (hideTimer) window.clearTimeout(hideTimer);
    };
  }, [configured, location.pathname, unitKey]);

  if (!configured || !visible) return null;

  const insProps = {
    ref: insRef,
    key: `${location.pathname}-${unitKey}`,
    className: `adsbygoogle block w-full overflow-hidden ${className}`.trim(),
    style: { display: 'block', minHeight: `${minHeight}px` },
    'data-ad-client': GOOGLE_ADS_CLIENT,
    'data-ad-slot': GOOGLE_ADS_SLOT,
    'data-ad-format': format,
    'data-full-width-responsive': 'true',
  };

  if (layout === 'in-article') {
    insProps['data-ad-layout'] = 'in-article';
  }

  return (
    <aside className="w-full" aria-label={label}>
      <ins {...insProps} />
    </aside>
  );
}
