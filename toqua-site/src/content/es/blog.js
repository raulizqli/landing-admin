export const blog = {
  metaTitle: 'Blog',
  metaDescription: 'Tips claros para profesionales: primera página, confianza en línea y primeros pasos.',
  eyebrow: 'Blog',
  title: 'Notas prácticas para tu presencia en línea',
  description: 'Textos cortos, sin jerga, pensados para consultorios y prácticas.',
  readMore: 'Leer artículo',
  backToList: 'Volver al blog',
  minutes: 'min de lectura',
  posts: [
    {
      slug: 'first-professional-page-checklist',
      title: 'Lista corta para tu primera página profesional',
      date: '2026-07-10',
      readingMinutes: 5,
      excerpt:
        'Qué incluir antes de compartir tu página con clientes: contacto, servicios y una foto clara.',
      tags: ['Primeros pasos', 'Consultorio'],
      body: [
        'No necesitas una página perfecta el día uno. Necesitas una página honesta que responda tres cosas: quién eres, qué ofreces y cómo contactarte.',
        'Empieza por tu nombre y especialidad en un lenguaje que quien te busque entienda. Evita títulos largos o frases vacías.',
        'Agrega una foto donde se te vea con claridad. Una imagen cercana genera más confianza que un paisaje genérico.',
        'Lista de 3 a 6 servicios o temas con los que trabajas. No hace falta detallar cada sesión; basta con orientar.',
        'Deja un contacto visible: correo, teléfono o WhatsApp. Un solo botón principal evita confusión.',
        'Revisa en el celular. La mayoría de tus clientes te encontrarán desde el teléfono. Si se lee bien ahí, vas bien.',
        'Cuando esté lista, publícala y compártela en tu tarjeta, redes o firma de correo. Puedes mejorarla después.',
      ],
    },
    {
      slug: 'what-patients-look-for-online',
      title: 'Qué buscan tus clientes cuando te buscan en internet',
      date: '2026-06-18',
      readingMinutes: 6,
      excerpt:
        'Cómo se ve una página que genera confianza: claridad, ubicación y un siguiente paso fácil.',
      tags: ['Confianza', 'Clientes'],
      body: [
        'Cuando alguien escribe tu nombre o tu especialidad en el buscador, llega con prisa y un poco de duda. Quiere señales rápidas de que eres real y accesible.',
        'La claridad gana a lo “bonito”. Un título confuso o demasiados botones hace que se vayan. Una frase simple y un contacto claro los retiene.',
        'La ubicación importa. Incluso si atiendes en línea, di dónde estás basada o en qué zonas das cita. Reduce fricción.',
        'Las reseñas o testimonios breves ayudan, siempre con consentimiento. No hace falta un muro de textos: dos o tres bastan.',
        'El siguiente paso debe ser obvio: “Escríbeme”, “Agenda” o “Llama”. Si hay cinco opciones, ninguna destaca.',
        'Actualiza horarios y datos de contacto cuando cambien. Una página desactualizada se siente poco cuidada — aunque el diseño sea bueno.',
        'Toqua existe para que puedas enfocarte en ese contenido humano, no en pelear con herramientas complicadas.',
      ],
    },
  ],
};

export function getPost(slug) {
  return blog.posts.find((post) => post.slug === slug) || null;
}
