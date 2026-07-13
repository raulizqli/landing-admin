import { configureTracking } from '@raulizqli/landing-ui/trackInteraction';
import { trackLandingEvent } from './analytics';

configureTracking({
  trackCtaClick(ctaName) {
    trackLandingEvent('cta_click', { cta_name: ctaName });
  },
  trackSocialClick(network) {
    trackLandingEvent('social_click', { network });
  },
  trackContactClick(method) {
    trackLandingEvent('contact_click', { method });
  },
});

export {
  trackCtaClick,
  trackSocialClick,
  trackContactClick,
} from '@raulizqli/landing-ui/trackInteraction';
