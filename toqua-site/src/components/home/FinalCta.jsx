import { getAdminSignupUrl } from '../../content/site';
import { useLang } from '../../hooks/useLang';
import Section from '../ui/Section';
import Button from '../ui/Button';

export default function FinalCta() {
  const { path, t } = useLang();
  const block = t.home.finalCta;
  const signupUrl = getAdminSignupUrl();

  return (
    <Section className="pb-24">
      <div className="relative overflow-hidden rounded-3xl px-6 py-12 sm:px-10 sm:py-14">
        <div
          className="absolute inset-0 opacity-90"
          style={{ background: 'var(--q-gradient)' }}
          aria-hidden="true"
        />
        <div className="relative max-w-2xl text-white">
          <h2 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">{block.title}</h2>
          <p className="mt-4 text-base leading-relaxed text-white/90 sm:text-lg">{block.text}</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button href={signupUrl} external variant="inverse">
              {block.primary}
            </Button>
            <Button to={path('/contact')} variant="inverseOutline">
              {block.secondary}
            </Button>
          </div>
        </div>
      </div>
    </Section>
  );
}
