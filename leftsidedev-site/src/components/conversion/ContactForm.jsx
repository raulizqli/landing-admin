import { useState } from 'react';
import { SITE } from '../../content/site';
import Button from '../ui/Button';

export default function ContactForm({ intent = 'discovery' }) {
  const [status, setStatus] = useState('idle');

  const onSubmit = (event) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const subject = encodeURIComponent(`[${intent}] ${data.get('name')} — ${data.get('company')}`);
    const body = encodeURIComponent(
      [
        `Name: ${data.get('name')}`,
        `Email: ${data.get('email')}`,
        `Company: ${data.get('company')}`,
        `Budget: ${data.get('budget')}`,
        '',
        data.get('message'),
      ].join('\n'),
    );
    setStatus('sent');
    window.location.href = `mailto:${SITE.email}?subject=${subject}&body=${body}`;
  };

  return (
    <form className="glass space-y-4 rounded-2xl p-6 sm:p-8" onSubmit={onSubmit}>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="mb-1.5 block text-[var(--color-mute)]">Name</span>
          <input
            name="name"
            required
            className="w-full rounded-xl border border-[var(--color-line)] bg-[var(--color-ink)] px-3 py-2.5"
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1.5 block text-[var(--color-mute)]">Work email</span>
          <input
            name="email"
            type="email"
            required
            className="w-full rounded-xl border border-[var(--color-line)] bg-[var(--color-ink)] px-3 py-2.5"
          />
        </label>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="mb-1.5 block text-[var(--color-mute)]">Company</span>
          <input
            name="company"
            className="w-full rounded-xl border border-[var(--color-line)] bg-[var(--color-ink)] px-3 py-2.5"
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1.5 block text-[var(--color-mute)]">Budget range</span>
          <select
            name="budget"
            className="w-full rounded-xl border border-[var(--color-line)] bg-[var(--color-ink)] px-3 py-2.5"
            defaultValue=""
          >
            <option value="" disabled>
              Select…
            </option>
            <option>$5k–$15k</option>
            <option>$15k–$40k</option>
            <option>$40k–$100k</option>
            <option>$100k+</option>
            <option>Not sure yet</option>
          </select>
        </label>
      </div>
      <label className="block text-sm">
        <span className="mb-1.5 block text-[var(--color-mute)]">What should we build?</span>
        <textarea
          name="message"
          required
          rows={5}
          className="w-full rounded-xl border border-[var(--color-line)] bg-[var(--color-ink)] px-3 py-2.5"
          placeholder="Goals, timeline, systems to integrate…"
        />
      </label>
      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit">Send message</Button>
        <Button href={SITE.calendlyUrl} external variant="secondary">
          Open Calendly
        </Button>
        {status === 'sent' && (
          <p className="text-sm text-[var(--color-accent)]" role="status">
            Opening your email client…
          </p>
        )}
      </div>
    </form>
  );
}
