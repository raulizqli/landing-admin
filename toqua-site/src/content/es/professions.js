export const professions = {
  metaTitle: 'Profesiones',
  metaDescription:
    'Toqua para psicología, pediatría, odontología y servicios legales. Páginas claras para tus clientes.',
  eyebrow: 'Profesiones',
  title: 'Hecha para tu tipo de práctica',
  description:
    'Los mismos pasos simples, con ejemplos y lenguaje que encajan con cómo atiendes a las personas.',
  listCta: 'Ver detalle',
  items: [
    {
      slug: 'psychology',
      name: 'Psicología',
      summary: 'Presenta tu enfoque, servicios y cómo agendar — con calma y claridad.',
      audience: 'Psicólogas, psicoterapeutas y consultorios de salud mental.',
      body: [
        'Las personas que te buscan en internet quieren saber si pueden confiar en ti. Tu página debe sentirse humana: quién eres, con qué temas trabajas y cómo dar el primer paso.',
        'Con Toqua armás una página limpia: presentación, servicios, testimonios si los tienes, y un contacto fácil (correo, teléfono o WhatsApp).',
        'Puedes empezar con lo esencial y, si más adelante quieres un blog de tips o una galería, subir de plan sin rehacer todo.',
      ],
      tips: [
        'Usa una foto profesional y cercana, no demasiado formal.',
        'Explica en 2–3 frases tu forma de trabajar.',
        'Deja un solo llamado a la acción claro: “Agenda” o “Escríbeme”.',
      ],
    },
    {
      slug: 'pediatrics',
      name: 'Pediatría',
      summary: 'Información para mamás y papás: horarios, ubicación y cómo llegar.',
      audience: 'Pediatras y consultorios infantiles.',
      body: [
        'Los padres buscan rápido: dirección, horarios, si atiendes urgencias y cómo pedir cita. Una página clara reduce llamadas repetidas.',
        'Toqua te deja mostrar ubicación en mapa, varios teléfonos si hace falta, y servicios (control del niño sano, vacunas, seguimiento).',
        'El tono puede ser cálido y tranquilizador — sin promesas médicas exageradas, solo información útil.',
      ],
      tips: [
        'Destaca horarios y cómo llegar al consultorio.',
        'Lista de servicios en lenguaje de padres, no de expediente.',
        'Incluye un contacto secundario si hay recepción.',
      ],
    },
    {
      slug: 'dental',
      name: 'Odontología',
      summary: 'Servicios, antes/después si aplica, y una vía fácil para agendar.',
      audience: 'Dentistas y clínicas dentales.',
      body: [
        'Quien busca dentista quiere ver tratamientos, ubicación y un siguiente paso simple. La confianza también viene de fotos reales del consultorio.',
        'Con planes que incluyen galería puedes mostrar el espacio o resultados (con consentimiento). Con blog, puedes explicar cuidados básicos.',
        'Toqua mantiene el diseño limpio para que lo importante no se pierda entre anuncios.',
      ],
      tips: [
        'Lista tratamientos con precios solo si te sientes cómoda.',
        'Una foto del consultorio genera más confianza que stock genérico.',
        'WhatsApp suele funcionar muy bien para primeras citas.',
      ],
    },
    {
      slug: 'legal',
      name: 'Legal',
      summary: 'Áreas de práctica, credenciales y un contacto serio y accesible.',
      audience: 'Abogados y despachos pequeños.',
      body: [
        'Los clientes potenciales buscan especialidad, experiencia y cómo contactarte sin fricción. Una página sobria y clara dice más que un texto largo.',
        'Toqua te ayuda a organizar áreas de práctica, sobre ti, y un formulario o correo. Puedes añadir un blog de notas legales cuando lo necesites.',
        'El diseño cálido de Toqua se adapta: el tono lo pones tú con tus textos.',
      ],
      tips: [
        'Sé específica en las áreas (familia, laboral, mercantil…).',
        'Evita jerga innecesaria en la primera pantalla.',
        'Incluye colegiatura o datos que respalden tu práctica si aplica.',
      ],
    },
  ],
};

export function getProfession(slug) {
  return professions.items.find((item) => item.slug === slug) || null;
}
