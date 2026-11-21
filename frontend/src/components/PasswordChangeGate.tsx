import React, { useState } from 'react';
import { AlertTriangle, Flame } from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

/**
 * Brána zobrazovaná po prvním přihlášení (nebo po detekci výchozího hesla).
 * Dokud uživatel nezmění heslo, nepustí ho do aplikace.
 */
export const PasswordChangeGate: React.FC = () => {
  const { refreshUser, logout } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (newPassword.length < 12) {
      setError('Nové heslo musí mít alespoň 12 znaků.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Nová hesla se neshodují.');
      return;
    }
    setBusy(true);
    try {
      await api.changePassword(currentPassword, newPassword);
      await refreshUser();
    } catch (err: any) {
      setError(err.message || 'Heslo se nepodařilo změnit.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-4">
      <div className="w-full max-w-md p-7 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xl space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-orange-600 to-amber-500 flex items-center justify-center shadow-lg shadow-orange-500/20">
            <Flame className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-lg text-zinc-900 dark:text-white">Nastavte si heslo</h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Hestia – první přihlášení</p>
          </div>
        </div>

        <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-xs text-amber-800 dark:text-amber-200 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>
            Používáte výchozí nebo dočasné heslo. Před pokračováním si musíte nastavit vlastní heslo
            (min. 12 znaků).
          </span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            placeholder="Aktuální heslo"
            autoComplete="current-password"
            className="w-full px-3 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-transparent text-sm"
          />
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Nové heslo (min. 12 znaků)"
            autoComplete="new-password"
            className="w-full px-3 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-transparent text-sm"
          />
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Potvrďte nové heslo"
            autoComplete="new-password"
            className="w-full px-3 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-transparent text-sm"
          />
          {error && <p className="text-xs text-rose-600 dark:text-rose-400">{error}</p>}
          <button
            type="submit"
            disabled={busy}
            className="w-full py-2.5 rounded-xl text-sm font-semibold bg-orange-500 hover:bg-orange-600 text-white transition disabled:opacity-50"
          >
            {busy ? 'Ukládám…' : 'Nastavit heslo a pokračovat'}
          </button>
        </form>

        <button
          type="button"
          onClick={logout}
          className="w-full text-xs text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
        >
          Odhlásit se
        </button>
      </div>
    </div>
  );
};
