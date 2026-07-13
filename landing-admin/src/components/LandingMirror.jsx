import { LandingPage } from '@raulizqli/landing-ui';
import { withPreviewContent } from '@raulizqli/landing-core/previewContent';

export default function LandingMirror({ previewData, previewSeed }) {
  const data = withPreviewContent(previewData, { seed: previewSeed, enabled: true });

  return (
    <LandingPage
      data={data}
      interactive={false}
      className="pointer-events-none select-none"
    />
  );
}
