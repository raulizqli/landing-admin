import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Button from '../ui/Button';

const BASE = {
  mvp: 12000,
  product: 28000,
  platform: 55000,
};

const ADDONS = [
  { id: 'aiAgents', label: 'AI Agents', cost: 9000 },
  { id: 'rag', label: 'RAG / knowledge AI', cost: 8000 },
  { id: 'mobile', label: 'Mobile app', cost: 12000 },
  { id: 'automation', label: 'Workflow automation', cost: 5000 },
  { id: 'integrations', label: 'Complex integrations', cost: 7000 },
];

export default function EstimateCalculator() {
  const [scope, setScope] = useState('product');
  const [selected, setSelected] = useState(['aiAgents']);
  const [urgency, setUrgency] = useState('standard');

  const estimate = useMemo(() => {
    const addonsTotal = ADDONS.filter((item) => selected.includes(item.id)).reduce(
      (sum, item) => sum + item.cost,
      0,
    );
    const subtotal = BASE[scope] + addonsTotal;
    const multiplier = urgency === 'rush' ? 1.25 : urgency === 'flexible' ? 0.92 : 1;
    const low = Math.round((subtotal * multiplier) * 0.85);
    const high = Math.round((subtotal * multiplier) * 1.2);
    return { low, high };
  }, [scope, selected, urgency]);

  const toggle = (id) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  };

  return (
    <div className="glass rounded-2xl p-6 sm:p-8">
      <div className="grid gap-8 lg:grid-cols-2">
        <div className="space-y-6">
          <fieldset>
            <legend className="mb-3 text-sm font-semibold">Project scope</legend>
            <div className="grid gap-2">
              {[
                ['mvp', 'Startup MVP'],
                ['product', 'Custom product'],
                ['platform', 'Platform / multi-tenant'],
              ].map(([value, label]) => (
                <label key={value} className="flex cursor-pointer items-center gap-3 rounded-xl border border-[var(--color-line)] px-3 py-2.5">
                  <input
                    type="radio"
                    name="scope"
                    checked={scope === value}
                    onChange={() => setScope(value)}
                  />
                  <span className="text-sm">{label}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend className="mb-3 text-sm font-semibold">Capabilities</legend>
            <div className="grid gap-2">
              {ADDONS.map((item) => (
                <label key={item.id} className="flex cursor-pointer items-center gap-3 rounded-xl border border-[var(--color-line)] px-3 py-2.5">
                  <input
                    type="checkbox"
                    checked={selected.includes(item.id)}
                    onChange={() => toggle(item.id)}
                  />
                  <span className="text-sm">{item.label}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <label className="block text-sm">
            <span className="mb-2 block font-semibold">Timeline</span>
            <select
              value={urgency}
              onChange={(event) => setUrgency(event.target.value)}
              className="w-full rounded-xl border border-[var(--color-line)] bg-[var(--color-ink)] px-3 py-2.5"
            >
              <option value="flexible">Flexible</option>
              <option value="standard">Standard</option>
              <option value="rush">Rush (&lt; 6 weeks pressure)</option>
            </select>
          </label>
        </div>

        <div className="flex flex-col justify-between rounded-2xl border border-[var(--color-line)] bg-[var(--color-ink)] p-6">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-[var(--color-accent)]">Ballpark</p>
            <p className="mt-3 font-display text-4xl font-bold tracking-tight">
              ${estimate.low.toLocaleString()} – ${estimate.high.toLocaleString()}
            </p>
            <p className="mt-3 text-sm leading-relaxed text-[var(--color-mute)]">
              Indicative USD range for planning. Final quotes follow discovery, compliance needs, and
              integration depth.
            </p>
          </div>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button to="/contact#discovery">Book a Discovery Call</Button>
            <Button to="/contact" variant="secondary">
              Talk to us
            </Button>
          </div>
          <p className="mt-4 text-xs text-[var(--color-mute)]">
            Prefer a guided walkthrough?{' '}
            <Link to="/resources" className="text-[var(--color-accent)] underline-offset-2 hover:underline">
              Download the AI checklist
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
