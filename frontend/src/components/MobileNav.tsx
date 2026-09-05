import React from 'react';
import { NavLink } from 'react-router-dom';
import { UtensilsCrossed, PackageOpen, ShoppingCart, Flower2, Dog, CheckSquare, Wallet, FolderArchive, Car, HeartPulse, Settings } from 'lucide-react';
import { useTranslation } from '../i18n';

export const MobileNav: React.FC = () => {
  const { t } = useTranslation();

  const navItems = [
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
    { to: '/settings', label: t('nav.settings'), icon: Settings },
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-lg border-t border-zinc-200 dark:border-zinc-800 px-2 py-1.5 safe-area-pb">
      <div className="flex items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 py-1 px-3 rounded-xl text-[11px] font-medium transition ${
                  isActive
                    ? 'text-orange-600 dark:text-orange-400 font-semibold'
                    : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <div
                    className={`p-1 rounded-lg transition ${
                      isActive ? 'bg-orange-100 dark:bg-orange-950/60' : ''
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <span>{item.label}</span>
                </>
              )}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};
