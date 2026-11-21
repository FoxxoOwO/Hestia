import React, { useState } from 'react';
import { AlertCircle, AlertTriangle, Check, Shield } from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export const SecuritySettings: React.FC = () => {
  const { user, refreshUser } = useAuth();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newOwnPassword, setNewOwnPassword] = useState('');
  const [confirmOwnPassword, setConfirmOwnPassword] = useState('');
  const [oldVaultPin, setOldVaultPin] = useState('');
  const [newVaultPin, setNewVaultPin] = useState('');
  const [confirmVaultPin, setConfirmVaultPin] = useState('');
  const [securityError, setSecurityError] = useState<string | null>(null);
  const [securityNotice, setSecurityNotice] = useState<string | null>(null);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setSecurityError(null);
    setSecurityNotice(null);
    if (newOwnPassword.length < 12) {
      setSecurityError('Nové heslo musí mít alespoň 12 znaků.');
      return;
    }
    if (newOwnPassword !== confirmOwnPassword) {
      setSecurityError('Nová hesla se neshodují.');
      return;
    }
    try {
      await api.changePassword(currentPassword, newOwnPassword);
      setCurrentPassword('');
      setNewOwnPassword('');
      setConfirmOwnPassword('');
      setSecurityNotice('Heslo bylo změněno.');
      await refreshUser();
    } catch (err: any) {
      setSecurityError(err.message || 'Heslo se nepodařilo změnit.');
    }
  };

  const handleSetVaultPin = async (e: React.FormEvent) => {
    e.preventDefault();
    setSecurityError(null);
    setSecurityNotice(null);
    if (!/^\d{6}$/.test(newVaultPin)) {
      setSecurityError('PIN musí obsahovat právě 6 číslic.');
      return;
    }
    if (newVaultPin !== confirmVaultPin) {
      setSecurityError('Zadané PINy se neshodují.');
      return;
    }
    try {
      await api.setVaultPin(newVaultPin, oldVaultPin || undefined);
      setOldVaultPin('');
      setNewVaultPin('');
      setConfirmVaultPin('');
      setSecurityNotice('PIN trezoru byl nastaven.');
    } catch (err: any) {
      setSecurityError(err.message || 'PIN se nepodařilo nastavit.');
    }
  };

  return (
          <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-5">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400">
                <Shield className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">Bezpečnost</h3>
            </div>

            {user?.must_change_password && (
              <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-xs text-amber-800 dark:text-amber-200 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>Při prvním přihlášení si musíte nastavit vlastní heslo. Použijte formulář níže.</span>
              </div>
            )}

            {securityError && (
              <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{securityError}</span>
              </div>
            )}
            {securityNotice && (
              <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-700 dark:text-emerald-300 flex items-start gap-2">
                <Check className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{securityNotice}</span>
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-3 max-w-md">
              <h4 className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Změna vlastního hesla</h4>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Aktuální heslo"
                autoComplete="current-password"
                className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-transparent text-sm"
              />
              <input
                type="password"
                value={newOwnPassword}
                onChange={(e) => setNewOwnPassword(e.target.value)}
                placeholder="Nové heslo (min. 12 znaků)"
                autoComplete="new-password"
                className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-transparent text-sm"
              />
              <input
                type="password"
                value={confirmOwnPassword}
                onChange={(e) => setConfirmOwnPassword(e.target.value)}
                placeholder="Potvrďte nové heslo"
                autoComplete="new-password"
                className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-transparent text-sm"
              />
              <button
                type="submit"
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-orange-500 hover:bg-orange-600 text-white transition"
              >
                Změnit heslo
              </button>
            </form>

            {user?.role === 'admin' && (
              <form onSubmit={handleSetVaultPin} className="space-y-3 max-w-md pt-4 border-t border-zinc-100 dark:border-zinc-800">
                <h4 className="text-xs font-bold text-zinc-700 dark:text-zinc-300">PIN digitálního trezoru</h4>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                  PIN má 6 číslic. Pokud trezor ještě nemá nastavený PIN, ponechte první pole prázdné.
                </p>
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={6}
                  value={oldVaultPin}
                  onChange={(e) => setOldVaultPin(e.target.value.replace(/\D/g, ''))}
                  placeholder="Aktuální PIN (při změně)"
                  className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-transparent text-sm"
                />
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={6}
                  value={newVaultPin}
                  onChange={(e) => setNewVaultPin(e.target.value.replace(/\D/g, ''))}
                  placeholder="Nový PIN (6 číslic)"
                  className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-transparent text-sm"
                />
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={6}
                  value={confirmVaultPin}
                  onChange={(e) => setConfirmVaultPin(e.target.value.replace(/\D/g, ''))}
                  placeholder="Potvrďte nový PIN"
                  className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-transparent text-sm"
                />
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-rose-500 hover:bg-rose-600 text-white transition"
                >
                  Nastavit PIN trezoru
                </button>
              </form>
            )}
          </div>
  );
};
