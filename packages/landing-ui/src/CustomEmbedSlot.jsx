
import {
  getEmbedsForPlacement,
  isCustomSectionVisible,
  normalizeCustomEmbeds,
} from '@raulizqli/landing-core/customEmbeds';
import { SECTION_IDS } from '@raulizqli/landing-core/sectionAnchors';
import CustomEmbedBlock from './CustomEmbedBlock';

export default function CustomEmbedSlot({ data, placement, interactive = true }) {
  const embeds = getEmbedsForPlacement(data, placement);
  if (!embeds.length) return null;

  const allEmbeds = normalizeCustomEmbeds(data?.customEmbeds)
    .filter((embed) => isCustomSectionVisible(embed));
  const isFirstVisiblePlacement = allEmbeds[0]
    && embeds.some((embed) => embed.id === allEmbeds[0].id);

  return (
    <div
      id={isFirstVisiblePlacement ? SECTION_IDS.embeds : undefined}
      data-preview-section={isFirstVisiblePlacement ? SECTION_IDS.embeds : undefined}
    >
      {embeds.map((embed) => (
        <CustomEmbedBlock
          key={embed.id}
          embed={embed}
          interactive={interactive}
          language={data?.activeLanguage || data?.labelLanguage}
        />
      ))}
    </div>
  );
}
