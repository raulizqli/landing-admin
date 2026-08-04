import { describe, expect, it } from 'vitest';
import {
  getCustomLabelValue,
  setCustomLabelValue,
} from './labels.js';

describe('custom label editing', () => {
  it('keeps trailing spaces while typing', () => {
    let labels = { es: {}, en: {} };
    labels = setCustomLabelValue(labels, 'es', 'nav.bookAppointment', 'Reservar');
    labels = setCustomLabelValue(labels, 'es', 'nav.bookAppointment', 'Reservar ');
    labels = setCustomLabelValue(labels, 'es', 'nav.bookAppointment', 'Reservar cita');

    expect(getCustomLabelValue(labels, 'es', 'nav.bookAppointment')).toBe('Reservar cita');

    labels = setCustomLabelValue(labels, 'es', 'nav.bookAppointment', 'Reservar cita ');
    expect(getCustomLabelValue(labels, 'es', 'nav.bookAppointment')).toBe('Reservar cita ');
  });

  it('allows clearing a label to blank', () => {
    let labels = setCustomLabelValue({ es: {}, en: {} }, 'es', 'about.title', 'Sobre mí');
    labels = setCustomLabelValue(labels, 'es', 'about.title', '');
    expect(getCustomLabelValue(labels, 'es', 'about.title')).toBe('');
  });
});
