
import { getEmbedsForPlacement } from '@raulizqli/landing-core/customEmbeds';
import CustomEmbedBlock from './CustomEmbedBlock';

export default function CustomEmbedSlot({ data, placement }) {
  const embeds = getEmbedsForPlacement(data, placement);
  if (!embeds.length) return null;

  return (
    <>
      {embeds.map((embed) => (
        <CustomEmbedBlock key={embed.id} embed={embed} />
      ))}
    </>
  );
}
