import React, { useState, useEffect } from 'react';
import { 
  X, UtensilsCrossed, Sparkles, Search, Clock, 
  ChefHat, Check, Plus, AlertCircle 
} from 'lucide-react';
import { Recipe, MealType, MealPlanItemCreatePayload } from '../types';
import { api } from '../services/api';
import { useTranslation } from '../i18n';

interface MealPlanAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultDate: string; // YYYY-MM-DD
  defaultMealType?: MealType;
  onAdd: (payload: MealPlanItemCreatePayload) => Promise<void>;
}

export const MealPlanAddModal: React.FC<MealPlanAddModalProps> = ({
  isOpen,
  onClose,
  defaultDate,
  defaultMealType = 'dinner',
  onAdd,
}) => {
  const { t } = useTranslation();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [isLoadingRecipes, setIsLoadingRecipes] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Mode: 'recipe' or 'custom'
  const [mode, setMode] = useState<'recipe' | 'custom'>('recipe');

  // Form fields
  const [date, setDate] = useState(defaultDate);
  const [mealType, setMealType] = useState<MealType>(defaultMealType);
  const [selectedRecipeId, setSelectedRecipeId] = useState<number | null>(null);
  const [customTitle, setCustomTitle] = useState('');
  const [servings, setServings] = useState<number>(4);
  const [notes, setNotes] = useState('');

  // Recipe search & filter
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (isOpen) {
      setDate(defaultDate);
      setMealType(defaultMealType);
      setSelectedRecipeId(null);
      setCustomTitle('');
      setServings(4);
      setNotes('');
      setError(null);
      loadRecipes();
    }
  }, [isOpen, defaultDate, defaultMealType]);

  const loadRecipes = async () => {
    try {
      setIsLoadingRecipes(true);
      const res = await api.getRecipes();
      setRecipes(res);
    } catch (err) {
      console.error('Failed to load recipes', err);
    } finally {
      setIsLoadingRecipes(false);
    }
  };

  if (!isOpen) return null;

  const filteredRecipes = recipes.filter(r => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const titleMatch = r.title.toLowerCase().includes(q);
    const tagMatch = (r.tags || []).some(tag => tag.toLowerCase().includes(q));
    return titleMatch || tagMatch;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'recipe' && !selectedRecipeId) {
      setError('Vyberte prosím recept ze seznamu nebo přepněte na vlastní jídlo');
      return;
    }
    if (mode === 'custom' && !customTitle.trim()) {
      setError('Zadejte název vlastního jídla');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      const payload: MealPlanItemCreatePayload = {
        date,
        meal_type: mealType,
        recipe_id: mode === 'recipe' ? selectedRecipeId : null,
        custom_title: mode === 'custom' ? customTitle.trim() : undefined,
        servings: Number(servings) || 4,
        notes: notes.trim() || undefined,
        is_cooked: false,
      };

      await onAdd(payload);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Nepodařilo se přidat jídlo do plánu');
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedRecipe = recipes.find(r => r.id === selectedRecipeId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-zinc-900 rounded-3xl max-w-xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        
        {/* Header */}
        <div className="p-5 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-orange-500/10 text-orange-600 dark:text-orange-400 flex items-center justify-center">
              <ChefHat className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                Přidat jídlo do plánu
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Týdenní plánovač jídel a propojení s nákupním seznamem
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4 text-xs sm:text-sm">
          {error && (
            <div className="p-3 rounded-2xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/40 text-red-600 dark:text-red-400 flex items-center gap-2 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Date & Meal Type */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Datum
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/60 px-3.5 py-2.5 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
            <div>
              <label className="block font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Druh jídla
              </label>
              <select
                value={mealType}
                onChange={e => setMealType(e.target.value as MealType)}
                className="w-full rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/60 px-3.5 py-2.5 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="breakfast">Snídaně</option>
                <option value="lunch">Oběd</option>
                <option value="dinner">Večeře</option>
                <option value="snack">Svačina / Dezert</option>
              </select>
            </div>
          </div>

          {/* Mode Switcher */}
          <div className="flex rounded-2xl bg-zinc-100 dark:bg-zinc-800 p-1">
            <button
              type="button"
              onClick={() => setMode('recipe')}
              className={`flex-1 py-2 rounded-xl text-xs font-semibold transition ${
                mode === 'recipe'
                  ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-sm'
                  : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100'
              }`}
            >
              Vybrat z mých receptů
            </button>
            <button
              type="button"
              onClick={() => setMode('custom')}
              className={`flex-1 py-2 rounded-xl text-xs font-semibold transition ${
                mode === 'custom'
                  ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-sm'
                  : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100'
              }`}
            >
              Vlastní jídlo (bez receptu)
            </button>
          </div>

          {/* Recipe Mode */}
          {mode === 'recipe' ? (
            <div className="space-y-3">
              <div className="relative">
                <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Vyhledat v receptech podle názvu nebo štítku..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/80 text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              {/* Selected recipe indicator */}
              {selectedRecipe && (
                <div className="p-3 rounded-2xl bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800/50 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    {selectedRecipe.image_url ? (
                      <img
                        src={selectedRecipe.image_url}
                        alt={selectedRecipe.title}
                        className="w-10 h-10 rounded-xl object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-xl bg-orange-500/20 text-orange-600 flex items-center justify-center font-bold">
                        <UtensilsCrossed className="w-5 h-5" />
                      </div>
                    )}
                    <div>
                      <span className="text-[10px] text-orange-600 dark:text-orange-400 font-semibold uppercase block">
                        Vybraný recept
                      </span>
                      <span className="font-bold text-zinc-900 dark:text-zinc-100 text-sm">
                        {selectedRecipe.title}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedRecipeId(null)}
                    className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Recipe List */}
              <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-2 bg-zinc-50/50 dark:bg-zinc-900/40">
                {isLoadingRecipes ? (
                  <div className="p-4 text-center text-zinc-400 text-xs">Načítám recepty...</div>
                ) : filteredRecipes.length === 0 ? (
                  <div className="p-4 text-center text-zinc-400 text-xs">Žádný recept neodpovídá vyhledávání.</div>
                ) : (
                  filteredRecipes.map(r => {
                    const isSelected = r.id === selectedRecipeId;
                    return (
                      <div
                        key={r.id}
                        onClick={() => setSelectedRecipeId(r.id)}
                        className={`flex items-center justify-between p-2 rounded-xl cursor-pointer transition ${
                          isSelected
                            ? 'bg-orange-500 text-white font-semibold shadow-sm'
                            : 'hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          {r.image_url ? (
                            <img src={r.image_url} alt="" className="w-8 h-8 rounded-lg object-cover" />
                          ) : (
                            <div className="w-8 h-8 rounded-lg bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center">
                              <UtensilsCrossed className="w-4 h-4 opacity-50" />
                            </div>
                          )}
                          <div>
                            <span className="text-xs block leading-tight">{r.title}</span>
                            <span className={`text-[10px] ${isSelected ? 'text-white/80' : 'text-zinc-400'}`}>
                              {r.cook_time_minutes} min • {r.difficulty}
                            </span>
                          </div>
                        </div>
                        {isSelected && <Check className="w-4 h-4" />}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          ) : (
            <div>
              <label className="block font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Název jídla *
              </label>
              <input
                type="text"
                required
                value={customTitle}
                onChange={e => setCustomTitle(e.target.value)}
                placeholder="např. Domácí pizza, Palačinky s jahodami, Svíčková u babičky..."
                className="w-full rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/60 px-3.5 py-2.5 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
          )}

          {/* Servings & Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Počet porcí
              </label>
              <input
                type="number"
                min="1"
                max="24"
                value={servings}
                onChange={e => setServings(Number(e.target.value))}
                className="w-full rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/60 px-3.5 py-2.5 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Poznámka k přípravě
              </label>
              <input
                type="text"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="např. Naložit maso den předem, bez cibule..."
                className="w-full rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/60 px-3.5 py-2.5 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-zinc-200 dark:border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-2xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 font-medium transition"
            >
              Zrušit
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white font-bold shadow-md shadow-orange-500/20 active:scale-95 transition disabled:opacity-50"
            >
              {isSubmitting ? 'Ukládám...' : 'Naplánovat jídlo'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
