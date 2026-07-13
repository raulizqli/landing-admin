
import { resolveSectionVideo } from './heroVideo';

export function shouldShowVideoSection(data) {
  if (!data?.videoSectionEnabled) return false;
  return Boolean(resolveSectionVideo(data?.videoSectionUrl));
}

export function splitVideoSectionParagraphs(text) {
  return String(text ?? '')
    .split(/\n+/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
}
