const noop = () => {};

let handlers = {
  trackCtaClick: noop,
  trackSocialClick: noop,
  trackContactClick: noop,
};

export function configureTracking(next = {}) {
  handlers = { ...handlers, ...next };
}

export function trackCtaClick(ctaName) {
  handlers.trackCtaClick(ctaName);
}

export function trackSocialClick(network) {
  handlers.trackSocialClick(network);
}

export function trackContactClick(method) {
  handlers.trackContactClick(method);
}
