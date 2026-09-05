import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Search, Plus, Sparkles, Filter, Heart, Clock, Utensils,
  CheckCircle2, X
} from 'lucide-react';
import { api } from '../services/api';
import { Recipe, RecipePantryMatch } from '../types';
import { RecipeCard } from '../components/RecipeCard';
import { GeminiImportModal } from '../components/GeminiImportModal';
import { useTranslation } from '../i18n';

export const RecipesPage: React.FC = () => {
  const { t } = useTranslation();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [pantryMatches, setPantryMatches] = useState<RecipePantryMatch[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('');
  const [selectedPrice, setSelectedPrice] = useState<string>('');
  const [selectedMaxTime, setSelectedMaxTime] = useState<number | undefined>();
  const [selectedTag, setSelectedTag] = useState<string>('');
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [onlyCanCook, setOnlyCanCook] = useState(false);

  // Gemini Modal
  const [isGeminiModalOpen, setIsGeminiModalOpen] = useState(false);

  const fetchRecipes = async () => {
    setIsLoading(true);
    try {
      const [recData, matchData] = await Promise.all([
        api.getRecipes({
          query: searchQuery || undefined,
          difficulty: selectedDifficulty || undefined,
          price_level: selectedPrice || undefined,
          max_time: selectedMaxTime,
          tag: selectedTag || undefined,
          favorite_only: onlyFavorites,
        }),
        api.matchRecipesWithPantry().catch(() => []),
      ]);
      setRecipes(recData);
      setPantryMatches(matchData);
    } catch (e) {
      console.error('Failed to load recipes', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchRecipes();
    }, 200);
    return () => clearTimeout(timer);
  }, [searchQuery, selectedDifficulty, selectedPrice, selectedMaxTime, selectedTag, onlyFavorites]);

  const handleToggleFavorite = async (id: number) => {
    try {
      const updated = await api.toggleFavorite(id);
      setRecipes((prev) =>
        prev.map((r) => (r.id === id ? { ...r, is_favorite: updated.is_favorite } : r))
      );
    } catch (e) {
      console.error(e);
    }
  };

  // Filter recipes if "onlyCanCook" is enabled
  const displayedRecipes = recipes.filter((recipe) => {
    if (!onlyCanCook) return true;
    const match = pantryMatches.find((m) => m.recipe_id === recipe.id);
    return match?.can_cook_now;
  });

  const popularTags = ['Těstoviny', 'Rychlovka', 'Snídaně', 'Oběd', 'Večeře', 'Dezerty', 'Bezlepkové', 'Česká kuchyně'];

  return (
    <div className="space-y-6 pb-16">
      {/* Top Banner & Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-100">
            {t('recipes.title')}
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            {t('recipes.subtitle')}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsGeminiModalOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-2xl text-xs sm:text-sm font-semibold bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-md shadow-orange-500/20 transition"
          >
            <Sparkles className="w-4 h-4" />
            <span>{t('recipes.import_gemini')}</span>
          </button>

          <Link
            to="/recipes/new"
            className="flex items-center gap-2 px-3.5 py-2 rounded-2xl text-xs sm:text-sm font-semibold bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-100 dark:text-zinc-900 shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            <span>{t('recipes.add_recipe')}</span>
          </Link>
        </div>
      </div>

      {/* Search & Filters Card */}
      <div className="p-4 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-3.5">
        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('recipes.search_placeholder')}
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/80 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
          {/* Favorites toggle */}
          <button
            onClick={() => setOnlyFavorites(!onlyFavorites)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border transition ${
              onlyFavorites
                ? 'bg-rose-50 border-rose-300 text-rose-600 dark:bg-rose-950/50 dark:border-rose-800 dark:text-rose-400 font-semibold'
                : 'border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800'
            }`}
          >
            <Heart className={`w-3.5 h-3.5 ${onlyFavorites ? 'fill-rose-500 text-rose-500' : ''}`} />
            <span>{t('recipes.filter_favorites')}</span>
          </button>

          {/* Pantry Smart Match toggle */}
          <button
            onClick={() => setOnlyCanCook(!onlyCanCook)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border transition ${
              onlyCanCook
                ? 'bg-emerald-50 border-emerald-300 text-emerald-600 dark:bg-emerald-950/50 dark:border-emerald-800 dark:text-emerald-400 font-semibold'
                : 'border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{t('recipes.filter_can_cook')}</span>
          </button>

          {/* Difficulty Select */}
          <select
            value={selectedDifficulty}
            onChange={(e) => setSelectedDifficulty(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-orange-500"
          >
            <option value="">{t('recipes.filter_difficulty')}: {t('recipes.filter_all')}</option>
            <option value="easy">{t('recipes.easy')}</option>
            <option value="medium">{t('recipes.medium')}</option>
            <option value="hard">{t('recipes.hard')}</option>
          </select>

          {/* Max Time Select */}
          <select
            value={selectedMaxTime || ''}
            onChange={(e) => setSelectedMaxTime(e.target.value ? Number(e.target.value) : undefined)}
            className="px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-orange-500"
          >
            <option value="">{t('recipes.filter_time')}: {t('recipes.filter_all')}</option>
            <option value="15">Do 15 min</option>
            <option value="30">Do 30 min</option>
            <option value="45">Do 45 min</option>
            <option value="60">Do 60 min</option>
          </select>

          {/* Price Select */}
          <select
            value={selectedPrice}
            onChange={(e) => setSelectedPrice(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-orange-500"
          >
            <option value="">{t('recipes.filter_price')}: {t('recipes.filter_all')}</option>
            <option value="low">$ {t('recipes.price_low')}</option>
            <option value="medium">$$ {t('recipes.price_medium')}</option>
            <option value="high">$$$ {t('recipes.price_high')}</option>
          </select>

          {/* Reset Filters */}
          {(selectedDifficulty || selectedPrice || selectedMaxTime || selectedTag || onlyFavorites || onlyCanCook) && (
            <button
              onClick={() => {
                setSelectedDifficulty('');
                setSelectedPrice('');
                setSelectedMaxTime(undefined);
                setSelectedTag('');
                setOnlyFavorites(false);
                setOnlyCanCook(false);
              }}
              className="text-orange-600 dark:text-orange-400 font-semibold hover:underline ml-auto"
            >
              Vymazat filtry
            </button>
          )}
        </div>

        {/* Tag pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 no-scrollbar">
          {popularTags.map((tg) => {
            const isSelected = selectedTag === tg;
            return (
              <button
                key={tg}
                onClick={() => setSelectedTag(isSelected ? '' : tg)}
                className={`text-xs px-3 py-1 rounded-full whitespace-nowrap transition ${
                  isSelected
                    ? 'bg-orange-500 text-white font-semibold shadow-sm'
                    : 'bg-zinc-100 dark:bg-zinc-800/80 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                }`}
              >
                #{tg}
              </button>
            );
          })}
        </div>
      </div>

      {/* Recipes Grid */}
      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center text-zinc-400">
          <Utensils className="w-8 h-8 animate-bounce text-orange-500 mb-2" />
          <p className="text-sm font-medium">{t('common.loading')}</p>
        </div>
      ) : displayedRecipes.length === 0 ? (
        <div className="py-16 text-center rounded-3xl border border-dashed border-zinc-200 dark:border-zinc-800 p-8">
          <Utensils className="w-12 h-12 stroke-1 text-zinc-300 dark:text-zinc-600 mx-auto mb-3" />
          <h3 className="font-bold text-base text-zinc-800 dark:text-zinc-200 mb-1">
            {t('recipes.empty')}
          </h3>
          <p className="text-xs text-zinc-500 max-w-sm mx-auto mb-4">
            Zkuste upravit vyhledávací kritéria nebo naimportujte nový recept přímo z internetu pomocí Gemini AI.
          </p>
          <button
            onClick={() => setIsGeminiModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-semibold bg-orange-500 text-white hover:bg-orange-600 transition"
          >
            <Sparkles className="w-4 h-4" />
            <span>Importovat recept</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayedRecipes.map((recipe) => {
            const match = pantryMatches.find((m) => m.recipe_id === recipe.id);
            return (
              <RecipeCard
                key={recipe.id}
                recipe={recipe}
                onToggleFavorite={handleToggleFavorite}
                canCookNow={match?.can_cook_now}
              />
            );
          })}
        </div>
      )}

      {/* Gemini AI Import Modal */}
      <GeminiImportModal
        isOpen={isGeminiModalOpen}
        onClose={() => setIsGeminiModalOpen(false)}
        onRecipeImported={(newRec) => {
          setRecipes((prev) => [newRec, ...prev]);
        }}
      />
    </div>
  );
};
