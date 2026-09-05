import React from 'react';
import { Link } from 'react-router-dom';
import { Clock, Users, Heart, Sparkles, ChefHat } from 'lucide-react';
import { Recipe } from '../types';
import { useTranslation } from '../i18n';

interface RecipeCardProps {
  recipe: Recipe;
  onToggleFavorite: (id: number) => void;
  canCookNow?: boolean;
}

export const RecipeCard: React.FC<RecipeCardProps> = ({ recipe, onToggleFavorite, canCookNow }) => {
  const { t } = useTranslation();

  const difficultyColors = {
    easy: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
    medium: 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800',
    hard: 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200 dark:border-rose-800',
  };

  const difficultyLabel = {
    easy: t('recipes.easy'),
    medium: t('recipes.medium'),
    hard: t('recipes.hard'),
  }[recipe.difficulty] || recipe.difficulty;

  const priceSign = {
    low: '$',
    medium: '$$',
    high: '$$$',
  }[recipe.price_level] || '$$';

  return (
    <div className="group relative rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-orange-400 dark:hover:border-orange-500/60 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col">
      {/* Image container */}
      <Link to={`/recipes/${recipe.id}`} className="block relative aspect-[16/10] overflow-hidden bg-zinc-100 dark:bg-zinc-800">
        {recipe.image_url ? (
          <img
            src={recipe.image_url}
            alt={recipe.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-zinc-400 dark:text-zinc-600 bg-gradient-to-tr from-orange-50 to-amber-50 dark:from-zinc-900 dark:to-zinc-800">
            <ChefHat className="w-12 h-12 stroke-1" />
            <span className="text-xs mt-2 font-medium">Hestia Receptář</span>
          </div>
        )}

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />

        {/* Top Badges */}
        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
          {canCookNow && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500 text-white shadow-lg shadow-emerald-500/30">
              <Sparkles className="w-3 h-3" />
              Lze uvařit!
            </span>
          )}
        </div>

        {/* Favorite Button */}
        <button
          onClick={(e) => {
            e.preventDefault();
            onToggleFavorite(recipe.id);
          }}
          className="absolute top-3 right-3 p-2 rounded-full backdrop-blur-md bg-white/70 dark:bg-black/50 hover:bg-white dark:hover:bg-black text-zinc-700 dark:text-zinc-300 hover:text-rose-500 transition shadow-md"
        >
          <Heart
            className={`w-4 h-4 ${recipe.is_favorite ? 'fill-rose-500 text-rose-500' : ''}`}
          />
        </button>

        {/* Quick meta on image */}
        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white text-xs font-medium">
          <span className="flex items-center gap-1 drop-shadow">
            <Clock className="w-3.5 h-3.5 text-orange-400" />
            {recipe.total_time_minutes} {t('recipes.mins')}
          </span>
          <span className="flex items-center gap-1 drop-shadow">
            <Users className="w-3.5 h-3.5 text-orange-400" />
            {recipe.default_servings} {t('recipes.servings')}
          </span>
        </div>
      </Link>

      {/* Content */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          {/* Difficulty and Price badges */}
          <div className="flex items-center gap-2 mb-2">
            <span
              className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-md border ${
                difficultyColors[recipe.difficulty] || difficultyColors.medium
              }`}
            >
              {difficultyLabel}
            </span>
            <span
              className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
              title={`Cenová náročnost: ${priceSign}`}
            >
              {priceSign}
            </span>
          </div>

          {/* Title */}
          <Link to={`/recipes/${recipe.id}`}>
            <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-100 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors line-clamp-1">
              {recipe.title}
            </h3>
          </Link>

          {/* Description */}
          {recipe.description && (
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 line-clamp-2 leading-relaxed">
              {recipe.description}
            </p>
          )}
        </div>

        {/* Tags footer */}
        <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800/80 flex flex-wrap gap-1">
          {(recipe.tags || []).slice(0, 3).map((tag, idx) => (
            <span
              key={idx}
              className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-300"
            >
              #{tag}
            </span>
          ))}
          {(recipe.tags || []).length > 3 && (
            <span className="text-[10px] font-medium px-1.5 py-0.5 text-zinc-400">
              +{recipe.tags.length - 3}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
