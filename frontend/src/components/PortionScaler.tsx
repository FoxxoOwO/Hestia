import React from 'react';
import { Minus, Plus, Users, ShoppingCart, Check, AlertCircle } from 'lucide-react';
import { ScaledIngredientItem } from '../types';
import { useTranslation } from '../i18n';

interface PortionScalerProps {
  servings: number;
  onServingsChange: (newServings: number) => void;
  scaledIngredients: ScaledIngredientItem[];
  onAddMissingToShopping?: (ingredients: ScaledIngredientItem[]) => void;
  onAddAllToShopping?: (ingredients: ScaledIngredientItem[]) => void;
}

export const PortionScaler: React.FC<PortionScalerProps> = ({
  servings,
  onServingsChange,
  scaledIngredients,
  onAddMissingToShopping,
  onAddAllToShopping,
}) => {
  const { t } = useTranslation();

  const missingIngredients = scaledIngredients.filter((i) => !i.is_in_pantry);

  return (
    <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-5 shadow-sm">
      {/* Servings control header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-100 dark:border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-orange-100 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
              Přepočet porcí (Dynamický kalkulátor)
            </h4>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Ingredience se automaticky přizpůsobí zvolenému počtu strávníků
            </p>
          </div>
        </div>

        {/* Stepper */}
        <div className="flex items-center gap-2 self-start sm:self-auto bg-zinc-100 dark:bg-zinc-800/80 p-1 rounded-xl">
          <button
            onClick={() => onServingsChange(Math.max(1, servings - 1))}
            className="w-8 h-8 rounded-lg flex items-center justify-center bg-white dark:bg-zinc-700 text-zinc-800 dark:text-zinc-200 hover:bg-orange-500 hover:text-white transition shadow-sm disabled:opacity-50"
            disabled={servings <= 1}
            title="Snížit počet porcí"
          >
            <Minus className="w-4 h-4" />
          </button>
          <span className="w-16 text-center font-bold text-sm text-zinc-900 dark:text-zinc-100">
            {servings} {t('recipes.servings')}
          </span>
          <button
            onClick={() => onServingsChange(servings + 1)}
            className="w-8 h-8 rounded-lg flex items-center justify-center bg-white dark:bg-zinc-700 text-zinc-800 dark:text-zinc-200 hover:bg-orange-500 hover:text-white transition shadow-sm"
            title="Zvýšit počet porcí"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Ingredient rows */}
      <div className="mt-4 divide-y divide-zinc-100 dark:divide-zinc-800/60">
        {scaledIngredients.map((item, idx) => (
          <div
            key={idx}
            className="py-2.5 flex items-center justify-between gap-4 text-sm hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 rounded-lg px-2 transition"
          >
            <div className="flex items-center gap-2.5 flex-1 min-w-0">
              {item.is_in_pantry ? (
                <span
                  className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0"
                  title="Tuto surovinu máme ve spíži/lednici"
                >
                  <Check className="w-3 h-3 stroke-[3]" />
                </span>
              ) : (
                <span
                  className="w-5 h-5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0"
                  title="Tato surovina chybí v zásobách"
                >
                  <AlertCircle className="w-3 h-3 stroke-[2.5]" />
                </span>
              )}
              <span className="font-medium text-zinc-800 dark:text-zinc-200 truncate">
                {item.name}
              </span>
              {item.note && (
                <span className="text-xs text-zinc-400 italic truncate hidden sm:inline">
                  ({item.note})
                </span>
              )}
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <span className="font-bold text-orange-600 dark:text-orange-400">
                {item.scaled_amount} {item.unit}
              </span>
              {item.is_in_pantry ? (
                <span className="text-[10px] uppercase font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded">
                  doma ({item.pantry_amount} {item.unit})
                </span>
              ) : (
                <span className="text-[10px] uppercase font-semibold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded">
                  chybí
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Shopping actions bar */}
      <div className="mt-5 pt-4 border-t border-zinc-100 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-3">
        <div className="text-xs text-zinc-500">
          {missingIngredients.length === 0 ? (
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1.5">
              <Check className="w-4 h-4" /> Všechny suroviny máte v domácích zásobách!
            </span>
          ) : (
            <span className="text-amber-600 dark:text-amber-400 font-medium flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4" /> Chybí {missingIngredients.length} surovin pro uvaření.
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {missingIngredients.length > 0 && onAddMissingToShopping && (
            <button
              onClick={() => onAddMissingToShopping(missingIngredients)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-amber-500 hover:bg-amber-600 text-white shadow-sm transition"
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              <span>{t('recipes.add_missing_to_shopping')}</span>
            </button>
          )}

          {onAddAllToShopping && (
            <button
              onClick={() => onAddAllToShopping(scaledIngredients)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 transition"
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              <span>{t('recipes.add_all_to_shopping')}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
