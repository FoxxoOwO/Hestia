import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { 
  CalendarDays, ChevronLeft, ChevronRight, Plus, ShoppingCart, 
  ChefHat, CheckCircle2, Circle, UtensilsCrossed, Sparkles, 
  Trash2, ExternalLink, Clock, AlertCircle, Check, X
} from 'lucide-react';
import { MealPlanItem, MealType, MealPlanItemCreatePayload, GenerateShoppingResponse, Recipe } from '../types';
import { api } from '../services/api';
import { useTranslation } from '../i18n';
import { MealPlanAddModal } from '../components/MealPlanAddModal';

const DAY_NAMES = ['Pondělí', 'Úterý', 'Středa', 'Čtvrtek', 'Pátek', 'Sobota', 'Neděle'];
const MEAL_TYPES: { id: MealType; label: string; icon: string }[] = [
  { id: 'breakfast', label: 'Snídaně', icon: '🍳' },
  { id: 'lunch', label: 'Oběd', icon: '🍲' },
  { id: 'dinner', label: 'Večeře', icon: '🍽️' },
  { id: 'snack', label: 'Svačina', icon: '🍎' },
];

export const MealPlannerPage: React.FC = () => {
  const { t } = useTranslation();

  // Current week start (Monday)
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(() => {
    const now = new Date();
    const day = now.getDay();
    // In JS Sunday is 0, Monday is 1... We want Monday as start
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    const mon = new Date(now.setDate(diff));
    mon.setHours(0, 0, 0, 0);
    return mon;
  });

  const [mealPlans, setMealPlans] = useState<MealPlanItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Add modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [modalDate, setModalDate] = useState('');
  const [modalMealType, setModalMealType] = useState<MealType>('dinner');

  // Shopping generation feedback
  const [isGeneratingShopping, setIsGeneratingShopping] = useState(false);
  const [shoppingFeedback, setShoppingFeedback] = useState<GenerateShoppingResponse | null>(null);

  // Random tip recipe
  const [allRecipes, setAllRecipes] = useState<Recipe[]>([]);
  const [randomTipRecipe, setRandomTipRecipe] = useState<Recipe | null>(null);

  // Format date to YYYY-MM-DD
  const formatDateISO = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Generate 7 days of the week
  const weekDays = useMemo(() => {
    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(currentWeekStart);
      d.setDate(currentWeekStart.getDate() + i);
      days.push({
        dateObj: d,
        isoString: formatDateISO(d),
        dayName: DAY_NAMES[i],
        dayNumber: d.getDate(),
        monthNumber: d.getMonth() + 1,
        isToday: formatDateISO(d) === formatDateISO(new Date()),
      });
    }
    return days;
  }, [currentWeekStart]);

  const startDateStr = weekDays[0].isoString;
  const endDateStr = weekDays[6].isoString;

  const loadWeekPlans = async () => {
    try {
      setIsLoading(true);
      const data = await api.getMealPlans(startDateStr, endDateStr);
      setMealPlans(data);
    } catch (err) {
      console.error('Failed to load meal plans', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadWeekPlans();
  }, [startDateStr, endDateStr]);

  useEffect(() => {
    api.getRecipes().then(setAllRecipes).catch(() => {});
  }, []);

  const handlePrevWeek = () => {
    const d = new Date(currentWeekStart);
    d.setDate(d.getDate() - 7);
    setCurrentWeekStart(d);
  };

  const handleNextWeek = () => {
    const d = new Date(currentWeekStart);
    d.setDate(d.getDate() + 7);
    setCurrentWeekStart(d);
  };

  const handleThisWeek = () => {
    const now = new Date();
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    const mon = new Date(now.setDate(diff));
    mon.setHours(0, 0, 0, 0);
    setCurrentWeekStart(mon);
  };

  const handleOpenAddModal = (dateStr: string, mealType: MealType) => {
    setModalDate(dateStr);
    setModalMealType(mealType);
    setIsAddModalOpen(true);
  };

  const handleAddMeal = async (payload: MealPlanItemCreatePayload) => {
    const created = await api.createMealPlanItem(payload);
    setMealPlans(prev => [...prev, created]);
  };

  const handleToggleCooked = async (id: number) => {
    try {
      const updated = await api.toggleCookedMealPlan(id);
      setMealPlans(prev => prev.map(m => m.id === id ? updated : m));
    } catch (err) {
      console.error('Failed to toggle cooked status', err);
    }
  };

  const handleDeleteItem = async (id: number) => {
    try {
      await api.deleteMealPlanItem(id);
      setMealPlans(prev => prev.filter(m => m.id !== id));
    } catch (err) {
      console.error('Failed to delete meal plan item', err);
    }
  };

  const handleGenerateShopping = async () => {
    try {
      setIsGeneratingShopping(true);
      const res = await api.generateShoppingFromMealPlan({
        start_date: startDateStr,
        end_date: endDateStr,
        check_pantry: true,
      });
      setShoppingFeedback(res);
    } catch (err: any) {
      alert(err.message || 'Nepodařilo se vygenerovat nákupní seznam');
    } finally {
      setIsGeneratingShopping(false);
    }
  };

  const pickRandomRecipe = () => {
    if (allRecipes.length === 0) return;
    const random = allRecipes[Math.floor(Math.random() * allRecipes.length)];
    setRandomTipRecipe(random);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <CalendarDays className="w-7 h-7 text-orange-500" />
            <span>Týdenní plánovač jídel</span>
          </h1>
          <p className="text-xs md:text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Plánování snídaní, obědů a večeří s automatickým přenosem surovin do nákupního seznamu
          </p>
        </div>

        {/* Top actions */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Random tip inspiration */}
          <button
            onClick={pickRandomRecipe}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-xs font-semibold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60 hover:bg-amber-100 transition shadow-sm"
          >
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>Inspiruj mě receptem</span>
          </button>

          {/* Generate Shopping list button */}
          <button
            onClick={handleGenerateShopping}
            disabled={isGeneratingShopping}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-xs font-bold text-white bg-orange-500 hover:bg-orange-600 shadow-md shadow-orange-500/20 active:scale-95 transition disabled:opacity-50"
          >
            <ShoppingCart className="w-4 h-4" />
            <span>{isGeneratingShopping ? 'Generuji nákup...' : 'Vytvořit nákupní seznam'}</span>
          </button>
        </div>
      </div>

      {/* Random recipe inspiration card (if clicked) */}
      {randomTipRecipe && (
        <div className="p-4 rounded-3xl bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-transparent border border-amber-300/80 dark:border-amber-700/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-in fade-in">
          <div className="flex items-center gap-3">
            {randomTipRecipe.image_url ? (
              <img src={randomTipRecipe.image_url} alt="" className="w-12 h-12 rounded-2xl object-cover shadow-sm shrink-0" />
            ) : (
              <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center font-bold shadow-md shadow-amber-500/20 shrink-0">
                <ChefHat className="w-6 h-6" />
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-300">
                  Tip na vaření
                </span>
                <span className="text-xs text-zinc-500">
                  {randomTipRecipe.cook_time_minutes} min • {randomTipRecipe.difficulty}
                </span>
              </div>
              <h4 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                {randomTipRecipe.title}
              </h4>
            </div>
          </div>
          <div className="flex items-center gap-2 self-end sm:self-center">
            <Link
              to={`/recipes/${randomTipRecipe.id}`}
              className="px-3 py-1.5 rounded-xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs font-semibold text-zinc-800 dark:text-zinc-200 hover:bg-zinc-50 transition"
            >
              Recept &gt;
            </Link>
            <button
              onClick={() => {
                setModalDate(formatDateISO(new Date()));
                setModalMealType('dinner');
                setIsAddModalOpen(true);
              }}
              className="px-3 py-1.5 rounded-xl bg-amber-500 text-white text-xs font-bold hover:bg-amber-600 transition shadow-sm"
            >
              Naplánovat tento týden
            </button>
            <button
              onClick={() => setRandomTipRecipe(null)}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Shopping Feedback Banner */}
      {shoppingFeedback && (
        <div className="p-4 rounded-3xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 flex items-center justify-between gap-4 animate-in fade-in">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-2xl bg-emerald-500 text-white shadow-sm shrink-0">
              <Check className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-emerald-900 dark:text-emerald-200">
                Nákupní seznam byl úspěšně vygenerován!
              </h4>
              <p className="text-xs text-emerald-700 dark:text-emerald-300">
                Přidáno <strong>{shoppingFeedback.added_items_count} surovin</strong>. 
                {shoppingFeedback.already_in_pantry_count > 0 && (
                  <span> ({shoppingFeedback.already_in_pantry_count} surovin již máte v dostatečném množství ve spíži).</span>
                )}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to="/shopping"
              className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition whitespace-nowrap"
            >
              Otevřít nákup &gt;
            </Link>
            <button
              onClick={() => setShoppingFeedback(null)}
              className="p-1 rounded-lg text-emerald-600 hover:text-emerald-800 dark:text-emerald-400"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Week Navigator Bar */}
      <div className="p-4 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrevWeek}
            className="p-2 rounded-2xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 transition"
            title="Předchozí týden"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={handleNextWeek}
            className="p-2 rounded-2xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 transition"
            title="Další týden"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
          <button
            onClick={handleThisWeek}
            className="px-3 py-1.5 rounded-2xl text-xs font-semibold bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 transition"
          >
            Tento týden
          </button>
        </div>

        <div className="text-center">
          <span className="text-sm sm:text-base font-bold text-zinc-900 dark:text-zinc-100">
            {weekDays[0].dayNumber}. {weekDays[0].monthNumber}. – {weekDays[6].dayNumber}. {weekDays[6].monthNumber}. {weekDays[6].dateObj.getFullYear()}
          </span>
        </div>

        <div className="text-xs text-zinc-400 font-medium">
          Naplánováno celkem {mealPlans.length} jídel
        </div>
      </div>

      {/* Week Grid (7 Columns / Days) */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-7 gap-3">
        {weekDays.map(day => {
          const dayPlans = mealPlans.filter(m => m.date === day.isoString);

          return (
            <div
              key={day.isoString}
              className={`rounded-3xl border flex flex-col p-3.5 space-y-3 transition-all ${
                day.isToday
                  ? 'bg-orange-500/5 dark:bg-orange-950/20 border-orange-300 dark:border-orange-700/60 shadow-md ring-1 ring-orange-400/20'
                  : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 shadow-sm'
              }`}
            >
              {/* Day Header */}
              <div className="flex items-center justify-between pb-2 border-b border-zinc-100 dark:border-zinc-800/80">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                      {day.dayName}
                    </span>
                    {day.isToday && (
                      <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-orange-500 text-white font-extrabold uppercase tracking-wider">
                        Dnes
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-zinc-400 font-medium block">
                    {day.dayNumber}. {day.monthNumber}.
                  </span>
                </div>

                {/* Quick Add Button for the day */}
                <button
                  onClick={() => handleOpenAddModal(day.isoString, 'dinner')}
                  className="p-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-orange-500 hover:text-white text-zinc-500 dark:text-zinc-400 transition"
                  title="Přidat jídlo na tento den"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {/* Meal Slots (Breakfast, Lunch, Dinner, Snack) */}
              <div className="space-y-2.5 flex-1">
                {MEAL_TYPES.map(type => {
                  const itemsInSlot = dayPlans.filter(m => m.meal_type === type.id);

                  return (
                    <div key={type.id} className="space-y-1">
                      <div className="flex items-center justify-between text-[11px] font-semibold text-zinc-400 px-1">
                        <span className="flex items-center gap-1">
                          <span>{type.icon}</span>
                          <span>{type.label}</span>
                        </span>
                        <button
                          onClick={() => handleOpenAddModal(day.isoString, type.id)}
                          className="opacity-40 hover:opacity-100 hover:text-orange-500 transition"
                          title={`Přidat ${type.label}`}
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      {/* Items in this slot */}
                      {itemsInSlot.length === 0 ? (
                        <div
                          onClick={() => handleOpenAddModal(day.isoString, type.id)}
                          className="p-2 rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800/70 hover:border-orange-400 dark:hover:border-orange-500/60 text-[11px] text-zinc-400 dark:text-zinc-500 hover:text-orange-500 cursor-pointer transition text-center py-2.5"
                        >
                          + naplánovat
                        </div>
                      ) : (
                        itemsInSlot.map(item => (
                          <div
                            key={item.id}
                            className={`p-2.5 rounded-2xl border transition-all ${
                              item.is_cooked
                                ? 'bg-zinc-50 dark:bg-zinc-800/40 border-zinc-200 dark:border-zinc-700/60 opacity-60'
                                : 'bg-white dark:bg-zinc-800/80 border-zinc-200 dark:border-zinc-700 shadow-sm'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-1.5">
                              <button
                                onClick={() => handleToggleCooked(item.id)}
                                className="mt-0.5 text-zinc-400 hover:text-emerald-500 transition shrink-0"
                                title={item.is_cooked ? 'Označit jako neuvařeno' : 'Označit jako uvařeno'}
                              >
                                {item.is_cooked ? (
                                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                ) : (
                                  <Circle className="w-4 h-4" />
                                )}
                              </button>

                              <div className="flex-1 min-w-0">
                                <span className={`text-xs font-bold block truncate leading-tight ${
                                  item.is_cooked ? 'line-through text-zinc-500' : 'text-zinc-900 dark:text-zinc-100'
                                }`}>
                                  {item.recipe_title || item.custom_title}
                                </span>

                                <div className="flex flex-wrap items-center gap-1.5 mt-1 text-[10px] text-zinc-400">
                                  <span>{item.servings} porce</span>
                                  {item.recipe_cook_time && (
                                    <span>• {item.recipe_cook_time} min</span>
                                  )}
                                  {item.recipe_id && (
                                    <Link
                                      to={`/recipes/${item.recipe_id}`}
                                      className="text-orange-600 dark:text-orange-400 hover:underline inline-flex items-center gap-0.5"
                                    >
                                      <span>recept</span>
                                      <ExternalLink className="w-2.5 h-2.5" />
                                    </Link>
                                  )}
                                </div>

                                {item.notes && (
                                  <p className="text-[10px] text-zinc-500 italic mt-1 line-clamp-2">
                                    {item.notes}
                                  </p>
                                )}
                              </div>

                              <button
                                onClick={() => handleDeleteItem(item.id)}
                                className="p-1 text-zinc-300 hover:text-red-500 transition shrink-0"
                                title="Smazat jídlo"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Modal */}
      <MealPlanAddModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        defaultDate={modalDate}
        defaultMealType={modalMealType}
        onAdd={handleAddMeal}
      />

    </div>
  );
};
