import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from '../i18n';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { PublicMember } from '../types';
import {
  Flame, Lock, ArrowRight, Eye, EyeOff, User as UserIcon,
  Globe, Sun, Moon, Monitor, AlertCircle, Sparkles, Check
} from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { t, language, setLanguage } = useTranslation();
  const { theme, setTheme, isDark } = useTheme();
  const { login } = useAuth();

  const [members, setMembers] = useState<PublicMember[]>([]);
  const [selectedMember, setSelectedMember] = useState<PublicMember | null>(null);
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isCustomUser, setIsCustomUser] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const passwordInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    api.getPublicMembers()
      .then((data) => {
        setMembers(data);
        if (data.length > 0) {
          // Default to first user (usually admin)
          setSelectedMember(data[0]);
          setUsername(data[0].username);
        }
      })
      .catch((err) => {
        console.error('Failed to load members', err);
        setIsCustomUser(true);
      });
  }, []);

  const handleSelectMember = (member: PublicMember) => {
    setSelectedMember(member);
    setUsername(member.username);
    setIsCustomUser(false);
    setError(null);
    setPassword('');
    setTimeout(() => {
      passwordInputRef.current?.focus();
    }, 50);
  };

  const handleCustomUserMode = () => {
    setSelectedMember(null);
    setUsername('');
    setPassword('');
    setError(null);
    setIsCustomUser(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      setError(language === 'cs' ? 'Zadejte prosím uživatelské jméno i heslo.' : 'Please enter username and password.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const success = await login(username.trim(), password);
      if (!success) {
        setError(
          language === 'cs'
            ? 'Neplatné uživatelské jméno nebo heslo. Zkuste to znovu.'
            : 'Invalid username or password. Please try again.'
        );
      }
    } catch {
      setError(
        language === 'cs'
          ? 'Chyba při komunikaci se serverem. Zkontrolujte připojení.'
          : 'Server communication error. Check your connection.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleLanguage = () => {
    setLanguage(language === 'cs' ? 'en' : 'cs');
  };

  const cycleTheme = () => {
    if (theme === 'system') setTheme('light');
    else if (theme === 'light') setTheme('dark');
    else setTheme('system');
  };

  return (
    <div className="min-h-screen w-full flex flex-col justify-between bg-gradient-to-b from-orange-50/40 via-white to-zinc-50 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950 text-zinc-900 dark:text-zinc-100 transition-colors duration-200">
      {/* Top Bar with Language and Theme */}
      <header className="max-w-7xl w-full mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-orange-600 to-amber-500 flex items-center justify-center shadow-md shadow-orange-500/20">
            <Flame className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="text-lg font-black tracking-tight bg-gradient-to-r from-orange-600 via-amber-600 to-orange-500 bg-clip-text text-transparent">
              HESTIA
            </span>
            <span className="text-[10px] uppercase font-bold tracking-widest text-zinc-400 block -mt-1">
              OS
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={toggleLanguage}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 text-xs font-semibold hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
          >
            <Globe className="w-3.5 h-3.5 text-orange-500" />
            <span className="uppercase">{language}</span>
          </button>

          <button
            onClick={cycleTheme}
            className="p-2 rounded-xl border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
            title="Přepnout téma"
          >
            {theme === 'system' ? (
              <Monitor className="w-4 h-4" />
            ) : isDark ? (
              <Moon className="w-4 h-4 text-amber-400" />
            ) : (
              <Sun className="w-4 h-4 text-orange-500" />
            )}
          </button>
        </div>
      </header>

      {/* Main Login Card */}
      <main className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          {/* Brand header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-orange-600 to-amber-500 shadow-xl shadow-orange-500/25 mb-4 animate-in zoom-in-90 duration-300">
              <Flame className="w-9 h-9 text-white" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
              {language === 'cs' ? 'Vítejte v Hestii' : 'Welcome to Hestia'}
            </h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
              {language === 'cs'
                ? 'Vyberte svůj profil a zadejte heslo pro vstup do domácnosti'
                : 'Select your household profile and enter your password'}
            </p>
          </div>

          <div className="bg-white dark:bg-zinc-900/90 rounded-3xl border border-zinc-200/80 dark:border-zinc-800 shadow-2xl shadow-zinc-900/5 p-6 sm:p-8 backdrop-blur-xl">
            {/* Household Member Selector Grid */}
            {members.length > 0 && !isCustomUser && (
              <div className="mb-6">
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-3">
                  {language === 'cs' ? 'Kdo jste?' : 'Who is logging in?'}
                </label>

                <div className="grid grid-cols-3 gap-2.5">
                  {members.map((m) => {
                    const isSelected = selectedMember?.id === m.id;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => handleSelectMember(m)}
                        className={`flex flex-col items-center p-3 rounded-2xl border transition-all duration-200 relative ${
                          isSelected
                            ? 'border-orange-500 bg-orange-50/60 dark:bg-orange-950/30 ring-2 ring-orange-500/20 shadow-md'
                            : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-900/50'
                        }`}
                      >
                        {isSelected && (
                          <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-orange-500 text-white flex items-center justify-center shadow-sm">
                            <Check className="w-2.5 h-2.5 stroke-[3]" />
                          </div>
                        )}
                        <div
                          className="w-11 h-11 rounded-xl flex items-center justify-center text-white font-bold text-base shadow-sm mb-2"
                          style={{ backgroundColor: m.avatar_color || '#f97316' }}
                        >
                          {m.display_name.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 truncate max-w-full">
                          {m.display_name}
                        </span>
                        <span className="text-[10px] text-zinc-400 dark:text-zinc-500 truncate capitalize">
                          {m.role === 'admin' ? (language === 'cs' ? 'Správce' : 'Admin') : (language === 'cs' ? 'Člen' : 'Member')}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="mb-4 p-3.5 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 flex items-start gap-3 animate-in fade-in slide-in-from-top-1">
                <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 mt-0.5 shrink-0" />
                <p className="text-xs text-red-700 dark:text-red-300 font-medium leading-relaxed">
                  {error}
                </p>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {isCustomUser ? (
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                    {language === 'cs' ? 'Uživatelské jméno' : 'Username'}
                  </label>
                  <div className="relative">
                    <UserIcon className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder={language === 'cs' ? 'např. admin, anna' : 'e.g. admin, anna'}
                      autoFocus
                      required
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/50 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition"
                    />
                  </div>
                </div>
              ) : null}

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                    {language === 'cs' ? 'Heslo' : 'Password'}
                  </label>
                  {selectedMember && (
                    <span className="text-[11px] text-zinc-400">
                      @{selectedMember.username}
                    </span>
                  )}
                </div>

                <div className="relative">
                  <Lock className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    ref={passwordInputRef}
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={language === 'cs' ? 'Zadejte své heslo' : 'Enter your password'}
                    required
                    className="w-full pl-10 pr-11 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/50 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition p-1"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-500 hover:to-amber-400 text-white font-semibold text-sm shadow-lg shadow-orange-500/25 hover:shadow-orange-500/35 transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {isSubmitting ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>{language === 'cs' ? 'Vstoupit do domácnosti' : 'Enter Household'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Custom user / member toggle */}
            <div className="mt-6 pt-4 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-xs text-zinc-500">
              {isCustomUser ? (
                <button
                  type="button"
                  onClick={() => {
                    setIsCustomUser(false);
                    if (members.length > 0) {
                      handleSelectMember(members[0]);
                    }
                  }}
                  className="text-orange-600 dark:text-orange-400 hover:underline font-medium"
                >
                  {language === 'cs' ? '← Zpět na výběr členů rodiny' : '← Back to member selection'}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleCustomUserMode}
                  className="text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 transition"
                >
                  {language === 'cs' ? 'Přihlásit se pod jiným jménem' : 'Log in with other username'}
                </button>
              )}

              <span className="text-[11px] text-zinc-400 font-mono">
                v1.1.0
              </span>
            </div>
          </div>

          {/* First run default password note */}
          <div className="mt-4 text-center">
            <p className="text-xs text-zinc-400 dark:text-zinc-500 flex items-center justify-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>
                {language === 'cs'
                  ? 'Výchozí heslo přednastavených profilů: '
                  : 'Default password for built-in accounts: '}
                <code className="bg-zinc-200/60 dark:bg-zinc-800 px-1.5 py-0.5 rounded text-zinc-700 dark:text-zinc-300 font-mono text-[11px]">
                  hestia123
                </code>
              </span>
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-4 text-center text-xs text-zinc-400 dark:text-zinc-600">
        Hestia Smart Home OS • Self-hosted & Private
      </footer>
    </div>
  );
};
