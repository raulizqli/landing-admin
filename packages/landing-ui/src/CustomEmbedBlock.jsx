
import { useEffect, useRef } from 'react';

function activateScripts(container) {
  const scripts = container.querySelectorAll('script');
  scripts.forEach((oldScript) => {
    const newScript = document.createElement('script');
    [...oldScript.attributes].forEach((attr) => {
      newScript.setAttribute(attr.name, attr.value);
    });
    if (oldScript.textContent) {
      newScript.textContent = oldScript.textContent;
    }
    oldScript.parentNode?.replaceChild(newScript, oldScript);
  });
}

export default function CustomEmbedBlock({ embed }) {
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !embed?.htmlCode) return undefined;

    container.innerHTML = embed.htmlCode;
    activateScripts(container);

    return () => {
      container.innerHTML = '';
    };
  }, [embed?.id, embed?.htmlCode]);

  if (!embed?.htmlCode) return null;

  const contentClass = embed.fullWidth
    ? 'w-full px-5 py-10 sm:py-14'
    : 'max-w-5xl mx-auto px-5 py-10 sm:py-14';

  return (
    <section
      className="border-y border-[#2A342D]/10 custom-embed-section"
      data-embed-id={embed.id}
      aria-label={embed.label || embed.title || 'Integración personalizada'}
    >
      <div className={contentClass}>
        {embed.title && (
          <h2 className="font-serif text-2xl sm:text-3xl text-[#2A342D] mb-6 text-center">
            {embed.title}
          </h2>
        )}
        <div ref={containerRef} className="custom-embed-content w-full min-h-[48px]" />
      </div>
    </section>
  );
}
