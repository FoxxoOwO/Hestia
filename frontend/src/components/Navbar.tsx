import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Flame, Moon, Sun, Monitor, Globe, UserCheck, ChevronDown, LogOut, History, Palette } from 'lucide-react';
import { useTranslation } from '../i18n';
import { useTheme, DesignStyle } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { User } from '../types';
import { SwitchUserModal } from './SwitchUserModal';

export const Navbar: React.FC = () => {
  const { t, language, setLanguage } = useTranslation();
  const { theme, setTheme, isDark, designStyle, setDesignStyle, activeDesign, designOptions } = useTheme();
  const { user, logout } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [switchModalOpen, setSwitchModalOpen] = useState(false);
  const [targetUser, setTargetUser] = useState<User | null>(null);


  useEffect(() => {
    if (user) {
      api.getUsers().then(setUsers).catch(() => {});
    }
  }, [user]);

  const toggleLanguage = () => {
    setLanguage(language === 'cs' ? 'en' : 'cs');
  };

  const cycleTheme = () => {
    if (theme === 'system') setTheme('light');
    else if (theme === 'light') setTheme('dark');
    else setTheme('system');
  };

  const cycleDesignStyle = () => {
    const styles: DesignStyle[] = ['classic', 'nordic', 'cyber', 'glass', 'sunset'];
    const currentIndex = styles.indexOf(designStyle);
    const nextStyle = styles[(currentIndex + 1) % styles.length];
    setDesignStyle(nextStyle);
  };

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-white/80 dark:bg-zinc-900/80 border-b border-zinc-200 dark:border-zinc-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-600 flex items-center justify-center shadow-md shadow-orange-500/20 text-white">
            <Flame className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-xl tracking-tight bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent dark:from-orange-400 dark:to-amber-400">
                {t('app_name')}
              </span>
              <span className="text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded-full bg-orange-100 dark:bg-orange-950/60 text-orange-700 dark:text-orange-300">
                v1.0
              </span>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 hidden sm:block">
              {t('app_tagline')}
            </p>
          </div>
        </div>

        {/* Right side controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Language toggle */}
          <button
            onClick={toggleLanguage}
            title={language === 'cs' ? 'Přepnout do angličtiny' : 'Switch to Czech'}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
          >
            <Globe className="w-4 h-4 text-orange-500" />
            <span className="uppercase">{language}</span>
          </button>

          {/* Theme toggle */}
          <button
            onClick={cycleTheme}
            title={`Téma: ${theme}`}
            className="p-2 rounded-lg text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
          >
            {theme === 'system' ? (
              <Monitor className="w-4 h-4" />
            ) : isDark ? (
              <Moon className="w-4 h-4 text-amber-400" />
            ) : (
              <Sun className="w-4 h-4 text-orange-500" />
            )}
          </button>

          {/* Design style quick toggle */}
          <button
            onClick={cycleDesignStyle}
            title={`Designový styl: ${language === 'cs' ? activeDesign.name : activeDesign.nameEn} (klikněte pro přepnutí)`}
            className="p-2 rounded-lg text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition flex items-center gap-1 group"
          >
            <Palette className="w-4 h-4 text-orange-500 group-hover:scale-110 transition-transform" />
            <span
              className="w-2 h-2 rounded-full hidden sm:inline-block"
              style={{ backgroundColor: activeDesign.primaryColor }}
            />
          </button>

          {/* Active User switcher */}
          {user && (
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:border-orange-400 transition bg-white dark:bg-zinc-800/60"
              >
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-white font-bold text-xs shadow-sm"
                  style={{ backgroundColor: user.avatar_color || '#f97316' }}
                >
                  {user.display_name.charAt(0).toUpperCase()}
                </div>
                <span className="text-xs font-medium text-zinc-800 dark:text-zinc-200 hidden md:inline">
                  {user.display_name}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-white dark:bg-zinc-900 shadow-xl border border-zinc-200 dark:border-zinc-800 py-2 z-50 animate-in fade-in zoom-in-95">
                  <div className="px-4 py-2 border-b border-zinc-100 dark:border-zinc-800">
                    <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                      {user.display_name}
                    </p>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                      @{user.username} • {user.role === 'admin' ? 'Správce' : 'Člen'}
                    </p>
                  </div>

                  <div className="py-1">
                    <div className="px-3 py-1 text-[10px] uppercase tracking-wider font-bold text-zinc-400">
                      Přepnout člena rodiny
                    </div>
                    {users.map((u) => (
                      <button
                        key={u.id}
                        onClick={() => {
                          if (u.id !== user.id) {
                            setTargetUser(u);
                            setSwitchModalOpen(true);
                          }
                          setUserMenuOpen(false);
                        }}
                        className={`w-full flex items-center gap-2 px-3 py-1.5 text-xs text-left hover:bg-orange-50 dark:hover:bg-orange-950/40 transition cursor-pointer ${
                          u.id === user.id ? 'font-semibold text-orange-600 dark:text-orange-400' : 'text-zinc-700 dark:text-zinc-300'
                        }`}
                      >
                        <span
                          className="w-5 h-5 rounded-md flex items-center justify-center text-[10px] text-white font-bold"
                          style={{ backgroundColor: u.avatar_color }}
                        >
                          {u.display_name.charAt(0)}
                        </span>
                        <span>{u.display_name}</span>
                        {u.id === user.id && <UserCheck className="w-3.5 h-3.5 ml-auto text-orange-500" />}
                      </button>
                    ))}
                  </div>

                  <div className="pt-1 border-t border-zinc-100 dark:border-zinc-800">
                    <Link
                      to="/activity"
                      onClick={() => setUserMenuOpen(false)}
                      className="w-full flex items-center gap-2 px-4 py-2 text-xs text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
                    >
                      <History className="w-3.5 h-3.5 text-orange-500" />
                      <span>{language === 'cs' ? 'Historie aktivit' : 'Activity History'}</span>
                    </Link>

                    <button
                      onClick={() => {
                        setUserMenuOpen(false);
                        logout();
                      }}
                      className="w-full flex items-center gap-2 px-4 py-2 text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>{t('nav.logout')}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <SwitchUserModal
        isOpen={switchModalOpen}
        onClose={() => setSwitchModalOpen(false)}
        targetUser={targetUser}
      />
    </header>
  );
};
