import React from 'react';
import {
  X, CheckSquare, ShoppingCart, Flower2, Wallet,
  HeartPulse, Dog, Car, History, Sparkles, LayoutGrid,
  ChevronUp, ChevronDown, Eye, EyeOff, RotateCcw, SlidersHorizontal
} from 'lucide-react';
import { useTranslation } from '../../i18n';

export type DashboardWidgetId =
  | 'chores'
  | 'shopping'
  | 'plants'
  | 'finances'
  | 'medicines'
  | 'pets'
  | 'vehicles'
  | 'activity'
  | 'recipe_tip';

export interface DashboardWidgetConfig {
  id: DashboardWidgetId;
  enabled: boolean;
}

interface DashboardCustomizeModalProps {
  isOpen: boolean;
  onClose: () => void;
  widgets: DashboardWidgetConfig[];
  onToggleWidget: (id: DashboardWidgetId) => void;
  onMoveUp: (id: DashboardWidgetId) => void;
  onMoveDown: (id: DashboardWidgetId) => void;
  onReset: () => void;
  showQuickStats: boolean;
  onToggleQuickStats: () => void;
  isCompact: boolean;
  onToggleCompact: () => void;
}

const WIDGET_ICONS: Record<DashboardWidgetId, React.ElementType> = {
  chores: CheckSquare,
  shopping: ShoppingCart,
  plants: Flower2,
  finances: Wallet,
  medicines: HeartPulse,
  pets: Dog,
  vehicles: Car,
  activity: History,
  recipe_tip: Sparkles,
};

export const DashboardCustomizeModal: React.FC<DashboardCustomizeModalProps> = ({
  isOpen,
  onClose,
  widgets,
  onToggleWidget,
  onMoveUp,
  onMoveDown,
  onReset,
  showQuickStats,
  onToggleQuickStats,
  isCompact,
  onToggleCompact,
}) => {
  const { t } = useTranslation();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-zinc-900 rounded-3xl max-w-xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between shrink-0 bg-zinc-50/50 dark:bg-zinc-900/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-orange-100 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400">
              <SlidersHorizontal className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-100">
                {t('dashboard.customize')}
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                {t('dashboard.customize_desc')}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
            aria-label="Zavřít"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Global Settings Bar */}
        <div className="p-3.5 sm:p-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-100/40 dark:bg-zinc-950/40 grid grid-cols-1 sm:grid-cols-2 gap-2.5 shrink-0">
          <label className="flex items-center justify-between p-2.5 rounded-xl bg-white dark:bg-zinc-850 border border-zinc-200/80 dark:border-zinc-700/60 cursor-pointer shadow-xs hover:border-orange-300 transition">
            <div className="flex items-center gap-2.5">
              <LayoutGrid className="w-4 h-4 text-orange-500" />
              <span className="text-xs font-semibold text-zinc-750 dark:text-zinc-250">
                {t('dashboard.widgets.quick_stats')}
              </span>
            </div>
            <input
              type="checkbox"
              checked={showQuickStats}
              onChange={onToggleQuickStats}
              className="w-4 h-4 rounded text-orange-600 focus:ring-orange-500 border-zinc-300 dark:border-zinc-600 accent-orange-500 cursor-pointer"
            />
          </label>

          <label className="flex items-center justify-between p-2.5 rounded-xl bg-white dark:bg-zinc-850 border border-zinc-200/80 dark:border-zinc-700/60 cursor-pointer shadow-xs hover:border-orange-300 transition">
            <div className="flex items-center gap-2.5">
              <span className="text-xs font-semibold text-zinc-750 dark:text-zinc-250">
                Kompaktní mřížka
              </span>
            </div>
            <input
              type="checkbox"
              checked={isCompact}
              onChange={onToggleCompact}
              className="w-4 h-4 rounded text-orange-600 focus:ring-orange-500 border-zinc-300 dark:border-zinc-600 accent-orange-500 cursor-pointer"
            />
          </label>
        </div>

        {/* Widget Order & Visibility List */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-2">
          <div className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-2 px-1">
            Jednotlivé bloky a pořadí
          </div>

          {widgets.map((widget, index) => {
            const Icon = WIDGET_ICONS[widget.id] || CheckSquare;
            const title = t(`dashboard.widgets.${widget.id}`);
            const isFirst = index === 0;
            const isLast = index === widgets.length - 1;

            return (
              <div
                key={widget.id}
                className={`flex items-center justify-between p-3 rounded-2xl border transition-all ${
                  widget.enabled
                    ? 'bg-white dark:bg-zinc-850 border-zinc-200 dark:border-zinc-750 shadow-xs'
                    : 'bg-zinc-50 dark:bg-zinc-900/40 border-dashed border-zinc-200 dark:border-zinc-800 opacity-60'
                }`}
              >
                {/* Left: Icon & Label */}
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`p-2 rounded-xl shrink-0 ${
                      widget.enabled
                        ? 'bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400'
                        : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <span
                    className={`text-xs sm:text-sm font-medium truncate ${
                      widget.enabled
                        ? 'text-zinc-800 dark:text-zinc-200 font-semibold'
                        : 'text-zinc-400 dark:text-zinc-500 line-through'
                    }`}
                  >
                    {title}
                  </span>
                </div>

                {/* Right: Controls (Reorder & Visibility Toggle) */}
                <div className="flex items-center gap-1 shrink-0">
                  {/* Move Up */}
                  <button
                    type="button"
                    onClick={() => onMoveUp(widget.id)}
                    disabled={isFirst}
                    className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-20 disabled:cursor-not-allowed transition"
                    title="Posunout výše"
                  >
                    <ChevronUp className="w-4 h-4" />
                  </button>

                  {/* Move Down */}
                  <button
                    type="button"
                    onClick={() => onMoveDown(widget.id)}
                    disabled={isLast}
                    className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-20 disabled:cursor-not-allowed transition"
                    title="Posunout níže"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </button>

                  {/* Divider */}
                  <div className="w-[1px] h-4 bg-zinc-200 dark:border-zinc-700 mx-1" />

                  {/* Toggle On/Off */}
                  <button
                    type="button"
                    onClick={() => onToggleWidget(widget.id)}
                    className={`p-1.5 rounded-lg transition ${
                      widget.enabled
                        ? 'text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
                        : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                    }`}
                    title={widget.enabled ? 'Skrýt widget' : 'Zobrazit widget'}
                  >
                    {widget.enabled ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between shrink-0 bg-zinc-50/60 dark:bg-zinc-900/60">
          <button
            type="button"
            onClick={onReset}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{t('dashboard.reset_defaults')}</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-orange-600 hover:bg-orange-500 shadow-md shadow-orange-500/20 active:scale-98 transition"
          >
            {t('dashboard.save_changes')}
          </button>
        </div>
      </div>
    </div>
  );
};
