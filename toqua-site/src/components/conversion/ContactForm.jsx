import { useState } from 'react';
import { SITE } from '../../content/site';
import { useLang } from '../../hooks/useLang';
import Button from '../ui/Button';

export default function ContactForm() {
  const { t } = useLang();
  const labels = t.contact.form;
  const [status, setStatus] = useState('idle');

  const onSubmit = (event) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const subject = encodeURIComponent(`[Toqua] ${data.get('name')} — ${data.get('practice') || 'Contact'}`);
    const body = encodeURIComponent(
      [
        `Name: ${data.get('name')}`,
        `Email: ${data.get('email')}`,
        `Practice: ${data.get('practice')}`,
        '',
        data.get('message'),
      ].join('\n'),
    );
    setStatus('sent');
    window.location.href = `mailto:${SITE.email}?subject=${subject}&body=${body}`;
  };

  return (
    <form className="surface space-y-4 rounded-2xl p-6 sm:p-8" onSubmit={onSubmit}>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="mb-1.5 block text-[var(--mute)]">{labels.name}</span>
          <input
            name="name"
            required
            className="w-full rounded-xl border border-[var(--line)] bg-[var(--bg-primary)] px-3 py-2.5"
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1.5 block text-[var(--mute)]">{labels.email}</span>
          <input
            name="email"
            type="email"
            required
            className="w-full rounded-xl border border-[var(--line)] bg-[var(--bg-primary)] px-3 py-2.5"
          />
        </label>
      </div>
      <label className="block text-sm">
        <span className="mb-1.5 block text-[var(--mute)]">{labels.practice}</span>
        <input
          name="practice"
          className="w-full rounded-xl border border-[var(--line)] bg-[var(--bg-primary)] px-3 py-2.5"
        />
      </label>
      <label className="block text-sm">
        <span className="mb-1.5 block text-[var(--mute)]">{labels.message}</span>
        <textarea
          name="message"
          required
          rows={5}
          placeholder={labels.messagePlaceholder}
          className="w-full rounded-xl border border-[var(--line)] bg-[var(--bg-primary)] px-3 py-2.5"
        />
      </label>
      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit">{labels.submit}</Button>
        {status === 'sent' && (
          <p className="text-sm text-[var(--text-purple)]" role="status">
            {labels.sent}
          </p>
        )}
      </div>
    </form>
  );
}
