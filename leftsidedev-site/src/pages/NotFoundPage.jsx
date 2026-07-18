import Seo from '../components/seo/Seo';
import Button from '../components/ui/Button';
import { buildPageMeta } from '../utils/seo';

export default function NotFoundPage() {
  const meta = buildPageMeta({
    title: 'Page not found',
    description: 'The page you requested does not exist.',
    path: '/404',
    noIndex: true,
  });

  return (
    <>
      <Seo meta={meta} />
      <div className="mx-auto flex min-h-[50vh] max-w-6xl flex-col items-start justify-center px-5 py-20 sm:px-8">
        <p className="text-xs uppercase tracking-[0.2em] text-[var(--color-accent)]">404</p>
        <h1 className="mt-3 font-display text-4xl font-bold">Page not found</h1>
        <p className="mt-3 max-w-lg text-[var(--color-mute)]">
          That route is not part of the LeftSideDev site. Try services, case studies, or contact.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button to="/">Go home</Button>
          <Button to="/contact" variant="secondary">
            Contact
          </Button>
        </div>
      </div>
    </>
  );
}
