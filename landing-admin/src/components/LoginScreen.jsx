import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

export default function LoginScreen() {
  const { signIn, authError } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [localError, setLocalError] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLocalError('');
    setSubmitting(true);

    try {
      await signIn(email, password);
    } catch {
      // authError is set in context
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F1EA] flex items-center justify-center p-6 font-sans">
      <div className="w-full max-w-md bg-white border border-[#2A342D]/10 rounded-2xl shadow-xl p-8">
        <div className="mb-8 text-center">
          <p className="text-[11px] uppercase tracking-[0.2em] text-[#4A5D4E] font-semibold mb-2">
            Multi-Landing CMS
          </p>
          <h1 className="font-serif text-3xl text-[#2A342D]">Acceso al panel</h1>
          <p className="text-sm text-[#2A342D]/60 mt-2">
            Inicia sesión para editar tus landings asignadas.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="login-email" className="block text-[11px] font-bold text-[#2A342D]/50 uppercase">
              Email
            </label>
            <input
              id="login-email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full border border-[#2A342D]/15 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#4A5D4E]/30"
              placeholder="tu@email.com"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="login-password" className="block text-[11px] font-bold text-[#2A342D]/50 uppercase">
              Contraseña
            </label>
            <input
              id="login-password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full border border-[#2A342D]/15 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#4A5D4E]/30"
              placeholder="••••••••"
            />
          </div>

          {(localError || authError) && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
              {localError || authError}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-[#4A5D4E] text-white rounded-lg py-2.5 text-sm font-semibold hover:bg-[#3d4d41] transition disabled:opacity-60"
          >
            {submitting ? 'Entrando...' : 'Iniciar sesión'}
          </button>
        </form>
      </div>
    </div>
  );
}
