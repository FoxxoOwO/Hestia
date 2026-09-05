import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  UtensilsCrossed, PackageOpen, ShoppingCart, Settings,
  Sparkles, Wrench, Flower2, Dog, CheckSquare, Wallet, HeartPulse
} from 'lucide-react';
import { useTranslation } from '../i18n';

export const Sidebar: React.FC = () => {
  const { t } = useTranslation();

  const mainNav = [
    { to: '/', label: t('nav.recipes'), icon: UtensilsCrossed },
    { to: '/pantry', label: t('nav.pantry'), icon: PackageOpen },
    { to: '/shopping', label: t('nav.shopping'), icon: ShoppingCart },
    { to: '/plants', label: t('nav.plants'), icon: Flower2 },
    { to: '/pets', label: t('nav.pets'), icon: Dog },
    { to: '/settings', label: t('nav.settings'), icon: Settings },
  ];

  const futureModules = [
    { label: t('nav.assets'), icon: Wrench },
    { label: t('nav.chores'), icon: CheckSquare },
    { label: t('nav.finances'), icon: Wallet },
    { label: t('nav.first_aid'), icon: HeartPulse },
  ];

  return (
    <aside className="hidden lg:flex flex-col w-64 border-r border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50 p-4 shrink-0 min-h-[calc(100vh-4rem)]">
      <div className="space-y-1">
        {mainNav.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition ${
                  isActive
                    ? 'bg-orange-500 text-white shadow-md shadow-orange-500/25 font-semibold'
                    : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100'
                }`
              }
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </div>

      <hr className="my-6 border-zinc-200 dark:border-zinc-800" />

      {/* Future modules teaser section */}
      <div>
        <div className="flex items-center gap-1.5 px-3 mb-2 text-[11px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
          <Sparkles className="w-3 h-3 text-amber-500" />
          <span>{t('nav.future_modules')}</span>
        </div>
        <div className="space-y-1">
          {futureModules.map((mod, idx) => {
            const Icon = mod.icon;
            return (
              <div
                key={idx}
                className="flex items-center justify-between px-3 py-2 rounded-xl text-xs text-zinc-400 dark:text-zinc-500 hover:bg-zinc-100/50 dark:hover:bg-zinc-800/40 cursor-not-allowed group transition"
                title="Tento modul bude dostupný v další fázi Hestia OS"
              >
                <div className="flex items-center gap-2.5">
                  <Icon className="w-3.5 h-3.5 text-zinc-400 group-hover:text-orange-400 transition" />
                  <span>{mod.label}</span>
                </div>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-400">
                  brzy
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-auto pt-6">
        <div className="p-3 rounded-2xl bg-gradient-to-br from-orange-50 to-amber-50 dark:from-zinc-800/60 dark:to-zinc-800/20 border border-orange-200/60 dark:border-zinc-700/60 text-xs">
          <div className="flex items-center gap-2 text-orange-700 dark:text-orange-400 font-semibold mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Hestia AI Ready</span>
          </div>
          <p className="text-[11px] text-zinc-600 dark:text-zinc-400 leading-relaxed">
            Podpora importu receptů přes Google Gemini 3.7.
          </p>
        </div>
      </div>
    </aside>
  );
};
