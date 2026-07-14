
import { resolveSectionVideo } from '@raulizqli/landing-core/heroVideo';
import { shouldShowVideoSection, splitVideoSectionParagraphs } from '@raulizqli/landing-core/videoSection';
import { buildSectionBackgroundStyle, getSectionTheme } from '@raulizqli/landing-core/sectionBackground';
import { SECTION_IDS } from '@raulizqli/landing-core/sectionAnchors';

function VideoPlayer({ video }) {
  if (video.type === 'file') {
    return (
      <video
        src={video.videoSrc}
        controls
        playsInline
        className="absolute inset-0 w-full h-full bg-black"
      />
    );
  }

  return (
    <iframe
      src={video.embedUrl}
      title="Video"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
      allowFullScreen
      className="absolute inset-0 w-full h-full border-0"
    />
  );
}

export default function VideoSection({ data }) {
  if (!shouldShowVideoSection(data)) return null;

  const video = resolveSectionVideo(data.videoSectionUrl);
  if (!video) return null;

  const title = String(data.videoSectionTitle ?? '').trim();
  const paragraphs = splitVideoSectionParagraphs(data.videoSectionText);
  const sectionStyle = buildSectionBackgroundStyle(getSectionTheme(data, 'video'), { sectionKey: 'video' });

  return (
    <section id={SECTION_IDS.video} className="border-y border-[#2A342D]/10" style={sectionStyle}>
      <div className="max-w-5xl mx-auto px-5 py-14 sm:py-20">
        {(title || paragraphs.length > 0) && (
          <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-10">
            {title && (
              <h2 className="font-serif text-2xl sm:text-3xl text-current mb-3">
                {title}
              </h2>
            )}
            {paragraphs.length > 0 && (
              <div className="space-y-3 text-sm sm:text-base text-current/70 leading-relaxed">
                {paragraphs.map((paragraph, index) => (
                  <p key={`video-section-p-${index}`}>{paragraph}</p>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="relative w-full max-w-3xl mx-auto aspect-video rounded-2xl overflow-hidden border border-[#2A342D]/10 shadow-sm bg-[#2A342D]">
          <VideoPlayer video={video} />
        </div>
      </div>
    </section>
  );
}
