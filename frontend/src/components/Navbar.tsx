import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Link, useLocation } from 'react-router-dom';
import {
  Flame, Moon, Sun, Monitor, Globe, UserCheck, ChevronDown, LogOut, History, Palette,
  Menu, X, UtensilsCrossed, PackageOpen, ShoppingCart, Flower2, Dog, CheckSquare,
  Wallet, FolderArchive, Car, HeartPulse, Settings
} from 'lucide-react';
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
  const location = useLocation();
  const [users, setUsers] = useState<User[]>([]);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [switchModalOpen, setSwitchModalOpen] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [targetUser, setTargetUser] = useState<User | null>(null);

  const mobileNavItems = [
    { to: '/', label: t('nav.recipes'), icon: UtensilsCrossed },
    { to: '/pantry', label: t('nav.pantry'), icon: PackageOpen },
    { to: '/shopping', label: t('nav.shopping'), icon: ShoppingCart },
    { to: '/plants', label: t('nav.plants'), icon: Flower2 },
    { to: '/pets', label: t('nav.pets'), icon: Dog },
    { to: '/chores', label: t('nav.chores'), icon: CheckSquare },
    { to: '/finance', label: t('nav.finances'), icon: Wallet },
    { to: '/documents', label: t('nav.documents'), icon: FolderArchive },
    { to: '/vehicles', label: t('nav.vehicles'), icon: Car },
    { to: '/medicines', label: t('nav.first_aid'), icon: HeartPulse },
    { to: '/activity', label: t('nav.activity'), icon: History },
    { to: '/settings', label: t('nav.settings'), icon: Settings },
  ];


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
    const styles = designOptions.map((o) => o.id);
    const currentIndex = styles.indexOf(designStyle);
    const nextStyle = styles[(currentIndex + 1) % styles.length];
    setDesignStyle(nextStyle);
  };

  return (
    <>
      <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-white/80 dark:bg-zinc-900/80 border-b border-zinc-200 dark:border-zinc-800">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-1.5 sm:gap-4 w-full">
          {/* Brand */}
          <div className="flex items-center gap-1.5 sm:gap-3 min-w-0">
            {/* Mobile hamburger menu toggle */}
            <button
              type="button"
              onClick={() => setMobileDrawerOpen(!mobileDrawerOpen)}
              className="lg:hidden p-2 rounded-xl text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition shrink-0"
              aria-label="Menu modulů"
            >
              {mobileDrawerOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            {designStyle === 'terminal' ? (
              <div className="flex items-center gap-2 font-mono">
                <div className="w-9 h-9 border border-emerald-600 dark:border-emerald-500 bg-emerald-100 dark:bg-emerald-950/80 flex items-center justify-center text-emerald-800 dark:text-emerald-400 font-bold text-sm shadow-sm dark:shadow-[0_0_10px_rgba(34,197,94,0.4)] shrink-0">
                  &gt;_
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-base sm:text-lg text-emerald-800 dark:text-emerald-400 tracking-wider truncate">
                      HESTIA.SYS
                    </span>
                    <span className="inline-block w-2 h-4 bg-emerald-700 dark:bg-emerald-400 animate-pulse shrink-0" />
                    <span className="text-[10px] uppercase font-bold px-1 py-0.2 border border-emerald-600/40 dark:border-emerald-500/40 text-emerald-800 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/40 hidden sm:inline-block">
                      v1.1
                    </span>
                  </div>
                  <p className="text-[10px] text-emerald-700 dark:text-emerald-500 hidden sm:block">
                    ROOT@LOCAL_NODE // OK
                  </p>
                </div>
              </div>
            ) : designStyle === 'neobrutalism' ? (
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 sm:w-10 sm:h-10 bg-yellow-300 border-2 border-black dark:border-white flex items-center justify-center text-black font-black text-base shadow-[2px_2px_0px_#000] dark:shadow-[2px_2px_0px_#fff] shrink-0">
                  ⚡
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-black text-lg sm:text-xl tracking-tight bg-yellow-300 text-black px-1.5 sm:px-2 py-0.5 border-2 border-black dark:border-white shadow-[2px_2px_0px_#000] dark:shadow-[2px_2px_0px_#fff] uppercase rotate-[-1deg] truncate">
                      HESTIA!
                    </span>
                    <span className="text-[10px] font-black px-1.5 py-0.5 bg-black dark:bg-zinc-900 text-yellow-300 border border-black dark:border-white uppercase shadow-[1px_1px_0px_#000] dark:shadow-[1px_1px_0px_#fff] hidden sm:inline-block">
                      v1.1
                    </span>
                  </div>
                  <p className="text-[10px] font-bold text-zinc-800 dark:text-zinc-200 uppercase tracking-wider hidden sm:block">
                    Pop-Art Smart Home
                  </p>
                </div>
              </div>
            ) : designStyle === 'editorial' ? (
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-9 h-9 sm:w-10 sm:h-10 border border-amber-900/40 dark:border-amber-400/40 bg-[#fdfaf5] dark:bg-[#201d1a] flex items-center justify-center text-amber-900 dark:text-amber-200 font-serif font-black text-base sm:text-lg shadow-xs shrink-0">
                  🏛️
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-serif font-black text-lg sm:text-xl tracking-widest text-rose-950 dark:text-rose-100 uppercase truncate">
                      HESTIA
                    </span>
                    <span className="text-[10px] font-serif italic text-amber-800 dark:text-amber-300 border-b border-amber-800/40 hidden sm:inline-block">
                      VOL. I · NO. 11
                    </span>
                  </div>
                  <p className="text-[10px] font-serif italic text-zinc-600 dark:text-zinc-400 hidden sm:block">
                    Domestic Gazette &amp; Chronicle
                  </p>
                </div>
              </div>
            ) : (
              <>
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-600 flex items-center justify-center shadow-md shadow-orange-500/20 text-white shrink-0">
                  <Flame className="w-5 h-5 sm:w-6 sm:h-6 animate-pulse" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-lg sm:text-xl tracking-tight bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent dark:from-orange-400 dark:to-amber-400 truncate">
                      {t('app_name')}
                    </span>
                    <span className="text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded-full bg-orange-100 dark:bg-orange-950/60 text-orange-700 dark:text-orange-300 hidden sm:inline-block">
                      v1.1
                    </span>
                  </div>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 hidden sm:block">
                    {t('app_tagline')}
                  </p>
                </div>
              </>
            )}
          </div>

          {/* Center layout decoration */}
          <div className="hidden lg:flex items-center">
            {designStyle === 'terminal' && (
              <div className="flex items-center gap-2 font-mono text-[11px] text-emerald-800 dark:text-emerald-400/90 bg-emerald-100/70 dark:bg-emerald-950/40 px-3 py-1 border border-emerald-600/40 dark:border-emerald-500/40 shadow-xs dark:shadow-[0_0_8px_rgba(34,197,94,0.2)]">
                <span className="w-2 h-2 rounded-full bg-emerald-600 dark:bg-emerald-400 animate-ping" />
                <span>PORT:8000 // TTY:1 // BUFFER:CLEAN // SYSTEM:READY</span>
              </div>
            )}
            {designStyle === 'neobrutalism' && (
              <div className="flex items-center gap-2 px-3 py-1 bg-yellow-300 text-black border-2 border-black dark:border-white shadow-[3px_3px_0px_#000] dark:shadow-[3px_3px_0px_#fff] text-xs font-black uppercase tracking-wider">
                <span>⚡ 3D TACTILE POP-ART OS</span>
              </div>
            )}
            {designStyle === 'editorial' && (
              <div className="flex items-center gap-2 font-serif italic text-xs text-amber-900/80 dark:text-amber-200/80 border-y border-amber-900/30 px-3 py-0.5">
                <span>„Ubi concordia, ibi victoria“ — Domácí almanach</span>
              </div>
            )}
          </div>

          {/* Right side controls */}
          <div className="flex items-center gap-1 sm:gap-2.5 shrink-0">
            {/* Language toggle */}
            <button
              onClick={toggleLanguage}
              title={language === 'cs' ? 'Přepnout do angličtiny' : 'Switch to Czech'}
              className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
            >
              <Globe className="w-4 h-4 text-orange-500" />
              <span className="uppercase text-[11px]">{language}</span>
            </button>

            {/* Theme toggle */}
            <button
              onClick={cycleTheme}
              title={`Téma: ${theme}`}
              className="p-1.5 sm:p-2 rounded-lg text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
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
              className="p-1.5 sm:p-2 rounded-lg text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition flex items-center gap-1 group"
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
                  className="flex items-center gap-1 sm:gap-2 p-1 sm:pl-2 sm:pr-3 sm:py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:border-orange-400 transition bg-white dark:bg-zinc-800/60"
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
                  <ChevronDown className="w-3.5 h-3.5 text-zinc-400 hidden sm:inline" />
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
      </header>

      <SwitchUserModal
        isOpen={switchModalOpen}
        onClose={() => setSwitchModalOpen(false)}
        targetUser={targetUser}
      />

      {/* Mobile Side Navigation Drawer mounted via Portal to document.body */}
      {mobileDrawerOpen && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-50 lg:hidden overflow-hidden" role="dialog" aria-modal="true">
          {/* Full viewport backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
            onClick={() => setMobileDrawerOpen(false)}
          />

          {/* Full height slide-out drawer sheet */}
          <div className="fixed inset-y-0 left-0 max-w-[290px] w-[85vw] bg-white dark:bg-zinc-900 shadow-2xl p-4 flex flex-col z-10 overflow-y-auto h-full max-h-screen">
            {/* Drawer Header */}
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-zinc-200 dark:border-zinc-800 shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-600 flex items-center justify-center text-white shadow-sm">
                  <Flame className="w-5 h-5" />
                </div>
                <div>
                  <span className="font-bold text-base bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent dark:from-orange-400 dark:to-amber-400">
                    {t('app_name')}
                  </span>
                  <span className="text-[10px] uppercase font-bold ml-1.5 px-1 py-0.5 rounded bg-orange-100 dark:bg-orange-950/60 text-orange-700 dark:text-orange-300">
                    v1.1
                  </span>
                </div>
              </div>
              <button
                onClick={() => setMobileDrawerOpen(false)}
                className="p-1.5 rounded-lg text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
                aria-label="Zavřít menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 px-2 mb-2 shrink-0">
              {language === 'cs' ? 'Moduly domácnosti' : 'Household Modules'}
            </div>

            {/* Modules navigation list */}
            <nav className="space-y-1 flex-1 overflow-y-auto pr-1">
              {mobileNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.to || (item.to !== '/' && location.pathname.startsWith(item.to));
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={() => setMobileDrawerOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition ${
                      isActive
                        ? 'bg-orange-500 text-white font-semibold shadow-sm'
                        : 'text-zinc-700 dark:text-zinc-300 hover:bg-orange-50 dark:hover:bg-orange-950/40 hover:text-orange-600 dark:hover:text-orange-400'
                    }`}
                  >
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-orange-500'}`} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Quick settings in drawer */}
            <div className="pt-3 mt-3 border-t border-zinc-200 dark:border-zinc-800 shrink-0 space-y-2 text-xs">
              <div className="flex items-center justify-between px-2 py-1">
                <span className="text-zinc-500 dark:text-zinc-400">Jazyk / Language:</span>
                <button
                  onClick={toggleLanguage}
                  className="px-2.5 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 font-bold uppercase text-[11px] text-orange-600 dark:text-orange-400"
                >
                  {language}
                </button>
              </div>
              <div className="flex items-center justify-between px-2 py-1">
                <span className="text-zinc-500 dark:text-zinc-400">Režim zobrazení:</span>
                <button
                  onClick={cycleTheme}
                  className="px-2.5 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-[11px] capitalize text-zinc-700 dark:text-zinc-300"
                >
                  {theme}
                </button>
              </div>
              <div className="flex items-center justify-between px-2 py-1">
                <span className="text-zinc-500 dark:text-zinc-400">Styl rozhraní:</span>
                <button
                  onClick={cycleDesignStyle}
                  className="px-2.5 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-[11px] font-medium text-zinc-700 dark:text-zinc-300"
                >
                  {language === 'cs' ? activeDesign.name : activeDesign.nameEn}
                </button>
              </div>
            </div>

            {/* User profile section */}
            {user && (
              <div className="pt-3 mt-3 border-t border-zinc-200 dark:border-zinc-800 flex items-center gap-3 px-2 shrink-0">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                  style={{ backgroundColor: user.avatar_color }}
                >
                  {user.display_name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                    {user.display_name}
                  </p>
                  <p className="text-[10px] text-zinc-500 dark:text-zinc-400 truncate">
                    {user.role === 'admin' ? (language === 'cs' ? 'Správce domova' : 'Admin') : (language === 'cs' ? 'Člen domova' : 'Member')}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setMobileDrawerOpen(false);
                    logout();
                  }}
                  className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition shrink-0"
                  title={t('nav.logout')}
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>,
        document.body
      )}
    </>
  );
};
