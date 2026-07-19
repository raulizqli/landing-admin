import { describe, expect, it } from 'vitest';
import {
  LANDING_BRIEF_TEMPLATE,
  hasMeaningfulLandingBrief,
  normalizeLandingDraft,
} from './landingDraft';

describe('landingDraft', () => {
  it('requires the user to complete the guide', () => {
    expect(hasMeaningfulLandingBrief(LANDING_BRIEF_TEMPLATE)).toBe(false);
    expect(hasMeaningfulLandingBrief(`Tipo de negocio: Clínica dental familiar
Nombre: Sonrisa Norte
Objetivo: Conseguir solicitudes de primera cita desde la zona norte de la ciudad.
Público: Familias con niños y adultos que buscan atención preventiva.
Servicios: Limpieza, valoración, ortodoncia y odontopediatría.`)).toBe(true);
  });

  it('normalizes model output into page-model fields', () => {
    const draft = normalizeLandingDraft({
      name: '<b>Sonrisa Norte</b>',
      specialty: 'Odontología familiar',
      vertical: 'dental',
      hero: { title: 'Cuida tu sonrisa', text: 'Atención cercana.' },
      about: { tagline: 'Tu salud primero', bio: 'Acompañamos a cada familia.' },
      servicesSection: { title: 'Tratamientos', text: 'Opciones para cada etapa.' },
      services: [{ title: 'Valoración', description: 'Un primer diagnóstico claro.' }],
      seo: { title: 'Dentista familiar', description: 'Atención dental cercana.' },
    });

    expect(draft.name).toBe('Sonrisa Norte');
    expect(draft.vertical).toBe('dental');
    expect(draft.heroSlides[0].title).toBe('Cuida tu sonrisa');
    expect(draft.services).toHaveLength(1);
    expect(draft.servicesSectionEnabled).toBe(true);
  });
});
