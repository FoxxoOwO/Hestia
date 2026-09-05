import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Clock, Users, Heart, Edit3, Trash2, ArrowLeft,
  CheckCircle2, ShoppingCart, ExternalLink, Utensils,
  Play, Pause, RotateCcw, Sparkles
} from 'lucide-react';
import { api } from '../services/api';
import { Recipe, ScaledIngredientItem } from '../types';
import { PortionScaler } from '../components/PortionScaler';
import { useTranslation } from '../i18n';

export const RecipeDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [servings, setServings] = useState<number>(4);
  const [scaledIngredients, setScaledIngredients] = useState<ScaledIngredientItem[]>([]);
  const [completedSteps, setCompletedSteps] = useState<Record<number, boolean>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [notification, setNotification] = useState<string | null>(null);

  // Active step timer state
  const [activeTimerStep, setActiveTimerStep] = useState<number | null>(null);
  const [timerSecondsLeft, setTimerSecondsLeft] = useState<number>(0);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);

  useEffect(() => {
    if (!id) return;
    const recipeId = Number(id);
    setIsLoading(true);

    api.getRecipe(recipeId)
      .then((data) => {
        setRecipe(data);
        const initServings = data.default_servings || 4;
        setServings(initServings);
        return api.scaleRecipe(recipeId, initServings);
      })
      .then((scaleRes) => {
        setScaledIngredients(scaleRes.scaled_ingredients);
      })
      .catch((e) => console.error(e))
      .finally(() => setIsLoading(false));
  }, [id]);

  // Timer tick effect
  useEffect(() => {
    let interval: any = null;
    if (isTimerRunning && timerSecondsLeft > 0) {
      interval = setInterval(() => {
        setTimerSecondsLeft((prev) => prev - 1);
      }, 1000);
    } else if (timerSecondsLeft === 0 && isTimerRunning) {
      setIsTimerRunning(false);
      showNotification('⏰ Čas vypršel!');
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timerSecondsLeft]);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  const handleServingsChange = async (newServings: number) => {
    if (!recipe) return;
    setServings(newServings);
    try {
      const res = await api.scaleRecipe(recipe.id, newServings);
      setScaledIngredients(res.scaled_ingredients);
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleStep = (stepNumber: number) => {
    setCompletedSteps((prev) => ({
      ...prev,
      [stepNumber]: !prev[stepNumber],
    }));
  };

  const startTimer = (stepNum: number, minutes: number) => {
    setActiveTimerStep(stepNum);
    setTimerSecondsLeft(minutes * 60);
    setIsTimerRunning(true);
  };

  const handleToggleFavorite = async () => {
    if (!recipe) return;
    try {
      const updated = await api.toggleFavorite(recipe.id);
      setRecipe((prev) => (prev ? { ...prev, is_favorite: updated.is_favorite } : null));
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async () => {
    if (!recipe) return;
    if (window.confirm(t('common.confirm_delete'))) {
      try {
        await api.deleteRecipe(recipe.id);
        navigate('/');
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleAddMissingToShopping = async (missing: ScaledIngredientItem[]) => {
    if (!recipe) return;
    try {
      await api.addRecipeToShopping(
        recipe.id,
        missing.map((m) => ({
          name: m.name,
          amount: m.scaled_amount,
          unit: m.unit,
          category: m.category || 'other',
        }))
      );
      showNotification(`Přidáno ${missing.length} chybějících surovin do nákupního seznamu!`);
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddAllToShopping = async (all: ScaledIngredientItem[]) => {
    if (!recipe) return;
    try {
      await api.addRecipeToShopping(
        recipe.id,
        all.map((m) => ({
          name: m.name,
          amount: m.scaled_amount,
          unit: m.unit,
          category: m.category || 'other',
        }))
      );
      showNotification(`Všech ${all.length} surovin přidáno do nákupního seznamu!`);
    } catch (e) {
      console.error(e);
    }
  };

  if (isLoading || !recipe) {
    return (
      <div className="py-20 text-center text-zinc-400">
        <Utensils className="w-8 h-8 animate-bounce text-orange-500 mx-auto mb-2" />
        <p className="text-sm">{t('common.loading')}</p>
      </div>
    );
  }

  const formatTimerTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      {/* Toast notification */}
      {notification && (
        <div className="fixed top-20 right-4 z-50 p-4 rounded-2xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 shadow-2xl text-xs font-bold animate-in slide-in-from-top flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>{notification}</span>
        </div>
      )}

      {/* Top back and actions */}
      <div className="flex items-center justify-between">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Zpět do receptáře</span>
        </Link>

        <div className="flex items-center gap-2">
          <button
            onClick={handleToggleFavorite}
            className="p-2.5 rounded-2xl border border-zinc-200 dark:border-zinc-800 hover:border-rose-300 transition"
            title="Oblíbený recept"
          >
            <Heart
              className={`w-4 h-4 ${recipe.is_favorite ? 'fill-rose-500 text-rose-500' : 'text-zinc-400'}`}
            />
          </button>
          <Link
            to={`/recipes/${recipe.id}/edit`}
            className="p-2.5 rounded-2xl border border-zinc-200 dark:border-zinc-800 hover:border-orange-400 text-zinc-600 dark:text-zinc-300 transition"
            title={t('recipes.edit')}
          >
            <Edit3 className="w-4 h-4" />
          </Link>
          <button
            onClick={handleDelete}
            className="p-2.5 rounded-2xl border border-zinc-200 dark:border-zinc-800 hover:border-rose-400 text-zinc-600 dark:text-zinc-300 hover:text-rose-500 transition"
            title={t('recipes.delete')}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Hero Header with Image */}
      <div className="rounded-3xl overflow-hidden bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm">
        {recipe.image_url && (
          <div className="relative aspect-[21/9] sm:aspect-[21/8] w-full overflow-hidden bg-zinc-100 dark:bg-zinc-800">
            <img
              src={recipe.image_url}
              alt={recipe.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          </div>
        )}

        <div className="p-6 sm:p-8 space-y-4">
          <div className="flex flex-wrap gap-2">
            {(recipe.tags || []).map((t, idx) => (
              <span
                key={idx}
                className="text-xs font-semibold px-3 py-1 rounded-full bg-orange-100 dark:bg-orange-950/60 text-orange-700 dark:text-orange-300"
              >
                #{t}
              </span>
            ))}
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-100">
            {recipe.title}
          </h1>

          {recipe.description && (
            <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-300 leading-relaxed">
              {recipe.description}
            </p>
          )}

          {recipe.source_url && (
            <a
              href={recipe.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-orange-600 dark:text-orange-400 hover:underline font-medium"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Zdrojový recept na webu</span>
            </a>
          )}

          {/* Quick Info Bar */}
          <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
            <div className="p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/40">
              <span className="text-[10px] uppercase font-bold text-zinc-400">
                {t('recipes.prep_time')}
              </span>
              <p className="text-sm font-bold text-zinc-800 dark:text-zinc-200 mt-0.5">
                {recipe.prep_time_minutes} min
              </p>
            </div>
            <div className="p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/40">
              <span className="text-[10px] uppercase font-bold text-zinc-400">
                {t('recipes.cook_time')}
              </span>
              <p className="text-sm font-bold text-zinc-800 dark:text-zinc-200 mt-0.5">
                {recipe.cook_time_minutes} min
              </p>
            </div>
            <div className="p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/40">
              <span className="text-[10px] uppercase font-bold text-zinc-400">
                {t('recipes.filter_difficulty')}
              </span>
              <p className="text-sm font-bold capitalize text-zinc-800 dark:text-zinc-200 mt-0.5">
                {recipe.difficulty}
              </p>
            </div>
            <div className="p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/40">
              <span className="text-[10px] uppercase font-bold text-zinc-400">
                {t('recipes.filter_price')}
              </span>
              <p className="text-sm font-bold uppercase text-zinc-800 dark:text-zinc-200 mt-0.5">
                {recipe.price_level}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Utensils & Equipment */}
      {(recipe.utensils || []).length > 0 && (
        <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <div className="flex items-center gap-2.5 mb-3">
            <div className="p-2 rounded-xl bg-orange-100 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400">
              <Utensils className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-100">
              {t('recipes.utensils_title')}
            </h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {recipe.utensils.map((utensil, idx) => (
              <span
                key={idx}
                className="px-3 py-1.5 rounded-2xl text-xs font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200"
              >
                {utensil}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Ingredients & Dynamic Portion Scaler */}
      <div>
        <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-3 px-1">
          {t('recipes.ingredients_title')}
        </h3>
        <PortionScaler
          servings={servings}
          onServingsChange={handleServingsChange}
          scaledIngredients={scaledIngredients}
          onAddMissingToShopping={handleAddMissingToShopping}
          onAddAllToShopping={handleAddAllToShopping}
        />
      </div>

      {/* Method / Steps with interactive check & timer */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
            {t('recipes.instructions_title')}
          </h3>
          <span className="text-xs text-zinc-400 font-medium">
            Odškrtávejte kroky během vaření
          </span>
        </div>

        <div className="space-y-4">
          {(recipe.instructions || []).map((step) => {
            const isDone = completedSteps[step.step];
            const hasTimer = !!step.timer_minutes;
            const isThisTimerActive = activeTimerStep === step.step;

            return (
              <div
                key={step.step}
                className={`p-4 rounded-2xl border transition-all ${
                  isDone
                    ? 'bg-zinc-50 dark:bg-zinc-800/30 border-zinc-200 dark:border-zinc-800 opacity-60'
                    : 'bg-white dark:bg-zinc-800/60 border-zinc-200 dark:border-zinc-700/80 shadow-sm'
                }`}
              >
                <div className="flex items-start gap-3.5">
                  {/* Checkbox button */}
                  <button
                    onClick={() => handleToggleStep(step.step)}
                    className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 transition ${
                      isDone
                        ? 'bg-emerald-500 text-white'
                        : 'border-2 border-zinc-300 dark:border-zinc-600 hover:border-orange-500'
                    }`}
                  >
                    {isDone && <CheckCircle2 className="w-4 h-4" />}
                  </button>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold text-orange-600 dark:text-orange-400">
                        {t('recipes.step')} {step.step}
                      </span>
                    </div>
                    <p
                      className={`text-sm text-zinc-800 dark:text-zinc-200 leading-relaxed ${
                        isDone ? 'line-through text-zinc-400 dark:text-zinc-500' : ''
                      }`}
                    >
                      {step.text}
                    </p>

                    {/* Step Timer Control */}
                    {hasTimer && (
                      <div className="mt-3 flex items-center gap-3">
                        {isThisTimerActive ? (
                          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-orange-500 text-white text-xs font-bold shadow-md shadow-orange-500/30 animate-pulse">
                            <Clock className="w-3.5 h-3.5" />
                            <span>{formatTimerTime(timerSecondsLeft)}</span>
                            <button
                              onClick={() => setIsTimerRunning(!isTimerRunning)}
                              className="p-1 hover:bg-white/20 rounded"
                            >
                              {isTimerRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                            </button>
                            <button
                              onClick={() => {
                                setIsTimerRunning(false);
                                setActiveTimerStep(null);
                              }}
                              className="p-1 hover:bg-white/20 rounded"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => startTimer(step.step, step.timer_minutes!)}
                            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold bg-orange-100 dark:bg-orange-950/60 text-orange-700 dark:text-orange-300 hover:bg-orange-200 transition"
                          >
                            <Clock className="w-3.5 h-3.5" />
                            <span>
                              {t('recipes.start_timer')} ({step.timer_minutes} min)
                            </span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
