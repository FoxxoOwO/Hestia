import React, { useState, useEffect } from 'react';
import {
  Settings, Users, Globe, Moon, Sun, Monitor,
  Sparkles, Check, AlertCircle, Plus, Shield, UserPlus, X, Palette
} from 'lucide-react';
import { api } from '../services/api';
import { User } from '../types';
import { useTranslation } from '../i18n';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

export const SettingsPage: React.FC = () => {
  const { t, language, setLanguage } = useTranslation();
  const { theme, setTheme, designStyle, setDesignStyle, designOptions, activeDesign } = useTheme();
  const { user } = useAuth();

  const [members, setMembers] = useState<User[]>([]);
  const [aiStatus, setAiStatus] = useState<{ gemini_configured: boolean; model: string } | null>(null);

  // New member modal
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newDisplayName, setNewDisplayName] = useState('');
  const [newPassword, setNewPassword] = useState('hestia123');
  const [newRole, setNewRole] = useState<'admin' | 'member'>('member');
  const [newAvatarColor, setNewAvatarColor] = useState('#f97316');

  const fetchSettingsData = async () => {
    try {
      const [membersData, statusData] = await Promise.all([
        api.getUsers(),
        api.getAiStatus().catch(() => null),
      ]);
      setMembers(membersData);
      setAiStatus(statusData);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchSettingsData();
  }, []);

  const handleCreateMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername.trim() || !newDisplayName.trim()) return;

    try {
      const token = localStorage.getItem('hestia_token');
      const res = await fetch('/api/v1/auth/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          username: newUsername.trim(),
          display_name: newDisplayName.trim(),
          password: newPassword,
          role: newRole,
          avatar_color: newAvatarColor,
          preferred_language: language,
          preferred_theme: theme,
        }),
      });
      if (res.ok) {
        setIsAddMemberOpen(false);
        setNewUsername('');
        setNewDisplayName('');
        fetchSettingsData();
      } else {
        const err = await res.json();
        alert(err.detail || 'Chyba při vytváření člena');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const avatarColors = [
    '#f97316', '#ef4444', '#ec4899', '#8b5cf6',
    '#3b82f6', '#06b6d4', '#10b981', '#84cc16'
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-24">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-100">
          {t('settings.title')}
        </h1>
        <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1">
          {t('settings.subtitle')}
        </p>
      </div>

      {/* Household Members */}
      <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-orange-100 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400">
              <Users className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
              {t('settings.members_title')}
            </h3>
          </div>
          {user?.role === 'admin' && (
            <button
              onClick={() => setIsAddMemberOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-orange-500 hover:bg-orange-600 text-white transition"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>{t('settings.add_member')}</span>
            </button>
          )}
        </div>

        <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
          {members.map((m) => (
            <div key={m.id} className="py-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-sm"
                  style={{ backgroundColor: m.avatar_color || '#f97316' }}
                >
                  {m.display_name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h4 className="font-bold text-sm text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                    {m.display_name}
                    {m.id === user?.id && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-orange-100 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 font-bold">
                        Vy
                      </span>
                    )}
                  </h4>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    @{m.username} • {m.role === 'admin' ? 'Správce' : 'Člen'}
                  </p>
                </div>
              </div>

              <span className="text-xs font-medium px-2.5 py-1 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300">
                {m.role === 'admin' ? 'Plný přístup' : 'Člen rodiny'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Language & Appearance */}
      <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-6">
        <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
          Lokalizace a vzhled
        </h3>

        {/* Language Selection */}
        <div>
          <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
            {t('settings.language')}
          </label>
          <div className="grid grid-cols-2 gap-3 max-w-sm">
            <button
              onClick={() => setLanguage('cs')}
              className={`p-3 rounded-2xl border text-xs font-bold flex items-center gap-2.5 transition ${
                language === 'cs'
                  ? 'border-orange-500 bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400'
                  : 'border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400'
              }`}
            >
              <span className="text-base">🇨🇿</span>
              <span>Čeština</span>
            </button>
            <button
              onClick={() => setLanguage('en')}
              className={`p-3 rounded-2xl border text-xs font-bold flex items-center gap-2.5 transition ${
                language === 'en'
                  ? 'border-orange-500 bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400'
                  : 'border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400'
              }`}
            >
              <span className="text-base">🇬🇧</span>
              <span>English</span>
            </button>
          </div>
        </div>

        {/* Theme Selection */}
        <div>
          <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
            {t('settings.theme')}
          </label>
          <div className="grid grid-cols-3 gap-3 max-w-md">
            <button
              onClick={() => setTheme('light')}
              className={`p-3 rounded-2xl border text-xs font-bold flex flex-col items-center gap-1.5 transition ${
                theme === 'light'
                  ? 'border-orange-500 bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400'
                  : 'border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400'
              }`}
            >
              <Sun className="w-4 h-4" />
              <span>{t('settings.theme_light')}</span>
            </button>
            <button
              onClick={() => setTheme('dark')}
              className={`p-3 rounded-2xl border text-xs font-bold flex flex-col items-center gap-1.5 transition ${
                theme === 'dark'
                  ? 'border-orange-500 bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400'
                  : 'border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400'
              }`}
            >
              <Moon className="w-4 h-4" />
              <span>{t('settings.theme_dark')}</span>
            </button>
            <button
              onClick={() => setTheme('system')}
              className={`p-3 rounded-2xl border text-xs font-bold flex flex-col items-center gap-1.5 transition ${
                theme === 'system'
                  ? 'border-orange-500 bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400'
                  : 'border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400'
              }`}
            >
              <Monitor className="w-4 h-4" />
              <span>{t('settings.theme_system')}</span>
            </button>
          </div>
        </div>

        {/* Design Theme Selection (Alternative Designs) */}
        <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800/80 space-y-3">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5 text-orange-500" />
                <span>{t('settings.design_style')}</span>
              </label>
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-orange-100 dark:bg-orange-950/60 text-orange-700 dark:text-orange-300 flex items-center gap-1.5">
                <span
                  className="w-2 h-2 rounded-full inline-block"
                  style={{ backgroundColor: activeDesign.primaryColor }}
                />
                {language === 'cs' ? activeDesign.name : activeDesign.nameEn}
              </span>
            </div>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
              {t('settings.design_style_desc')}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            {designOptions.map((opt) => {
              const isSelected = designStyle === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setDesignStyle(opt.id)}
                  className={`p-3.5 rounded-2xl border text-left transition-all relative overflow-hidden flex flex-col justify-between ${
                    isSelected
                      ? 'border-orange-500 bg-orange-50/70 dark:bg-orange-950/30 ring-2 ring-orange-500/30 shadow-md'
                      : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/40'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3.5 h-3.5 rounded-full shadow-sm ring-1 ring-black/10"
                          style={{ backgroundColor: opt.primaryColor }}
                        />
                        <span className="font-bold text-xs text-zinc-900 dark:text-zinc-100">
                          {language === 'cs' ? opt.name : opt.nameEn}
                        </span>
                      </div>
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                          isSelected
                            ? 'bg-orange-500 text-white'
                            : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300'
                        }`}
                      >
                        {language === 'cs' ? opt.badge : opt.badgeEn}
                      </span>
                    </div>

                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400 line-clamp-2 leading-relaxed mb-3">
                      {language === 'cs' ? opt.description : opt.descriptionEn}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-zinc-200/60 dark:border-zinc-700/60 mt-auto">
                    {/* Swatch dots */}
                    <div className="flex items-center gap-1.5">
                      {opt.previewColors.map((c, i) => (
                        <div
                          key={i}
                          className="w-3.5 h-3.5 rounded-full border border-black/10 dark:border-white/10 shadow-xs"
                          style={{ backgroundColor: c }}
                        />
                      ))}
                    </div>

                    {isSelected ? (
                      <span className="flex items-center gap-1 text-[11px] font-bold text-orange-600 dark:text-orange-400">
                        <Check className="w-3.5 h-3.5" />
                        <span>Aktivní</span>
                      </span>
                    ) : (
                      <span className="text-[11px] text-zinc-400 font-medium hover:text-zinc-600 dark:hover:text-zinc-200">
                        Aktivovat
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Live preview showcase widget */}
          <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/80 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-3 text-xs mt-2">
            <div className="flex items-center gap-2">
              <div
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: activeDesign.primaryColor }}
              />
              <span className="font-semibold text-zinc-700 dark:text-zinc-300">
                {t('settings.design_preview_title')}:
              </span>
              <span className="font-bold text-orange-600 dark:text-orange-400">
                {language === 'cs' ? activeDesign.name : activeDesign.nameEn}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-xl bg-orange-100 dark:bg-orange-950/60 text-orange-700 dark:text-orange-300 text-[11px] font-bold">
                {t('settings.design_preview_badge')}
              </span>
              <button
                type="button"
                className="px-3 py-1.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-semibold text-xs transition shadow-sm"
              >
                {t('settings.design_preview_btn')}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Gemini AI Status */}
      <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-600 text-white shadow-md shadow-orange-500/20">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
              {t('settings.gemini_title')}
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              {t('settings.gemini_desc')}
            </p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/80 flex items-center justify-between text-xs">
          <div>
            <p className="font-semibold text-zinc-800 dark:text-zinc-200">
              Model: <span className="text-orange-600 dark:text-orange-400 font-mono font-bold">gemini-3.7-flash</span>
            </p>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
              Automaticky extrahuje ingredience, časy, náročnost a kroky vaření z webu i volného textu.
            </p>
          </div>

          <div>
            {aiStatus?.gemini_configured ? (
              <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold">
                <Check className="w-3.5 h-3.5" /> Aktivní
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 font-bold" title="Nastavte GEMINI_API_KEY v .env souboru">
                <AlertCircle className="w-3.5 h-3.5" /> Konfigurujte v .env
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Add Member Modal */}
      {isAddMemberOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-zinc-900 w-full max-w-md rounded-3xl shadow-2xl border border-zinc-200 dark:border-zinc-800 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3">
              <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-100">
                Přidat člena domácnosti
              </h3>
              <button
                onClick={() => setIsAddMemberOpen(false)}
                className="p-1 text-zinc-400 hover:text-zinc-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateMember} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Uživatelské jméno (login) *
                </label>
                <input
                  type="text"
                  required
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  placeholder="např. tomas"
                  className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Zobrazované jméno *
                </label>
                <input
                  type="text"
                  required
                  value={newDisplayName}
                  onChange={(e) => setNewDisplayName(e.target.value)}
                  placeholder="např. Tomáš"
                  className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Výchozí heslo *
                </label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Role v domácnosti
                </label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 text-sm"
                >
                  <option value="member">Člen domácnosti</option>
                  <option value="admin">Správce (Admin)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                  Barva profilu
                </label>
                <div className="flex items-center gap-2">
                  {avatarColors.map((color) => (
                    <button
                      type="button"
                      key={color}
                      onClick={() => setNewAvatarColor(color)}
                      className={`w-7 h-7 rounded-full transition-transform ${
                        newAvatarColor === color ? 'scale-125 ring-2 ring-orange-500 ring-offset-2' : ''
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              <div className="pt-3 flex gap-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 px-4 rounded-xl font-semibold text-xs bg-orange-500 hover:bg-orange-600 text-white transition"
                >
                  Vytvořit člena
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddMemberOpen(false)}
                  className="py-2.5 px-4 rounded-xl font-semibold text-xs bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300"
                >
                  Zrušit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
