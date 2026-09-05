/**
 * Apply Valhalla Recording Studio seed into the current admin form (non-destructive merge of content fields).
 * Usage from browser console while editing a page is not required — wired via AI/admin helpers if needed.
 * Prefer: create page → paste from createValhallaRecordingStudioSeed() in a root script.
 */
import { createValhallaRecordingStudioSeed } from '@raulizqli/landing-core/valhallaRecordingStudioSeed';
import { hydratePageForm } from '@raulizqli/landing-core/pageModel';

export function buildValhallaPageForm(overrides = {}) {
  return hydratePageForm(createValhallaRecordingStudioSeed(overrides));
}
