import { useLang } from '../../hooks/useLang';
import Section from '../ui/Section';

export default function ValuePropsSection() {
  const { t } = useLang();
  const block = t.home.valueProps;

  return (
    <Section eyebrow={block.eyebrow} title={block.title} description={block.description}>
      <div className="grid gap-8 md:grid-cols-3">
        {block.items.map((item, index) => (
          <div
            key={item.title}
            className={
              index === 0
                ? 'rise-in'
                : index === 1
                  ? 'rise-in rise-in-delay-1'
                  : 'rise-in rise-in-delay-2'
            }
          >
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-purple)]">
              0{index + 1}
            </p>
            <h3 className="mt-3 font-display text-xl font-semibold text-[var(--text)]">{item.title}</h3>
            <p className="mt-3 text-sm leading-relaxed text-[var(--mute)] sm:text-base">{item.text}</p>
          </div>
        ))}
      </div>
    </Section>
  );
}
