import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from '../i18n';
import { useAuth } from '../context/AuthContext';
import { User, PublicMember } from '../types';
import { X, Lock, Eye, EyeOff, ArrowRight, AlertCircle, LogOut } from 'lucide-react';

interface SwitchUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetUser: User | PublicMember | null;
}

export const SwitchUserModal: React.FC<SwitchUserModalProps> = ({
  isOpen,
  onClose,
  targetUser,
}) => {
  const { t, language } = useTranslation();
  const { login, logout } = useAuth();

  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const passwordInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setPassword('');
      setError(null);
      setTimeout(() => {
        passwordInputRef.current?.focus();
      }, 100);
    }
  }, [isOpen, targetUser]);

  if (!isOpen || !targetUser) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      setError(language === 'cs' ? 'Zadejte prosím heslo.' : 'Please enter password.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const success = await login(targetUser.username, password);
      if (success) {
        onClose();
      } else {
        setError(
          language === 'cs'
            ? `Nesprávné heslo pro účet ${targetUser.display_name}.`
            : `Incorrect password for ${targetUser.display_name}.`
        );
      }
    } catch {
      setError(
        language === 'cs'
          ? 'Chyba při přihlašování. Zkuste to znovu.'
          : 'Login failed. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFullLogout = () => {
    onClose();
    logout();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-sm rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xl p-6 relative">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
        >
          <X className="w-4 h-4" />
        </button>

        {/* User Card */}
        <div className="flex flex-col items-center text-center mt-1 mb-6">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center text-white text-2xl font-black shadow-lg mb-3"
            style={{ backgroundColor: targetUser.avatar_color || '#f97316' }}
          >
            {targetUser.display_name.charAt(0).toUpperCase()}
          </div>
          <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
            {targetUser.display_name}
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            @{targetUser.username} • {targetUser.role === 'admin' ? (language === 'cs' ? 'Správce' : 'Admin') : (language === 'cs' ? 'Člen' : 'Member')}
          </p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2">
            {language === 'cs' ? 'Pro přepnutí zadejte heslo tohoto účtu' : 'Enter account password to switch'}
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 p-3 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0" />
            <p className="text-xs text-red-700 dark:text-red-300 font-medium">
              {error}
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <Lock className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              ref={passwordInputRef}
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={language === 'cs' ? 'Heslo' : 'Password'}
              required
              className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              tabIndex={-1}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 p-1"
            >
              {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            </button>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2.5 px-4 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-semibold text-sm shadow-md shadow-orange-500/20 transition flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isSubmitting ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <span>{language === 'cs' ? 'Přepnout účet' : 'Switch Account'}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800 text-center">
          <button
            type="button"
            onClick={handleFullLogout}
            className="inline-flex items-center gap-1.5 text-xs text-red-600 dark:text-red-400 hover:underline"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>{language === 'cs' ? 'Odhlásit se na úvodní obrazovku' : 'Log out to login screen'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
