import React from 'react';
import { Link } from 'react-router-dom';
import {
  Droplets, Heart, AlertTriangle, CheckCircle2,
  Flower2, Sun, Sparkles
} from 'lucide-react';
import { Plant } from '../types';
import { useTranslation } from '../i18n';

interface PlantCardProps {
  plant: Plant;
  onWater: (id: number) => void;
  onToggleFavorite: (id: number) => void;
}

export const PlantCard: React.FC<PlantCardProps> = ({
  plant,
  onWater,
  onToggleFavorite,
}) => {
  const { t } = useTranslation();

  const getWateringBadge = () => {
    switch (plant.watering_status) {
      case 'watered_today':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500 text-white shadow-md shadow-emerald-500/20">
            <CheckCircle2 className="w-3.5 h-3.5" />
            {t('plants.watered_today')}
          </span>
        );
      case 'due_today':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-orange-500 text-white shadow-md shadow-orange-500/30 animate-pulse">
            <Droplets className="w-3.5 h-3.5" />
            {t('plants.due_today')}
          </span>
        );
      case 'overdue':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-600 text-white shadow-md shadow-rose-600/30 animate-pulse">
            <AlertTriangle className="w-3.5 h-3.5" />
            {t('plants.overdue')}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-zinc-900/70 dark:bg-zinc-800/80 backdrop-blur-md text-white">
            <Droplets className="w-3.5 h-3.5 text-blue-400" />
            {t('plants.water_in_days').replace('{{count}}', String(plant.days_until_watering))}
          </span>
        );
    }
  };

  const getPetBadge = () => {
    switch (plant.pet_toxicity) {
      case 'safe':
        return (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            Pet Friendly 🐾
          </span>
        );
      case 'toxic':
        return (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
            Toxické ⚠️
          </span>
        );
      case 'mildly_toxic':
        return (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
            Mírně toxické
          </span>
        );
    }
  };

  const roomLabel = t(`plants.rooms.${plant.room}`) || plant.room;

  return (
    <div className="group relative rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-emerald-400 dark:hover:border-emerald-500/60 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col">
      {/* Image container */}
      <Link to={`/plants/${plant.id}`} className="block relative aspect-[16/11] overflow-hidden bg-zinc-100 dark:bg-zinc-800">
        {plant.primary_image_url ? (
          <img
            src={plant.primary_image_url}
            alt={plant.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-zinc-400 dark:text-zinc-600 bg-gradient-to-tr from-emerald-50 to-teal-50 dark:from-zinc-900 dark:to-zinc-800">
            <Flower2 className="w-12 h-12 stroke-1 text-emerald-500" />
            <span className="text-xs mt-2 font-medium">Hestia Botanik</span>
          </div>
        )}

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />

        {/* Top Badges */}
        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
          {getWateringBadge()}
        </div>

        {/* Favorite Button */}
        <button
          onClick={(e) => {
            e.preventDefault();
            onToggleFavorite(plant.id);
          }}
          className="absolute top-3 right-3 p-2 rounded-full backdrop-blur-md bg-white/70 dark:bg-black/50 hover:bg-white dark:hover:bg-black text-zinc-700 dark:text-zinc-300 hover:text-rose-500 transition shadow-md"
        >
          <Heart
            className={`w-4 h-4 ${plant.is_favorite ? 'fill-rose-500 text-rose-500' : ''}`}
          />
        </button>

        {/* Bottom meta on image */}
        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white text-xs font-medium">
          <span className="px-2 py-0.5 rounded-lg bg-black/40 backdrop-blur-md text-[11px]">
            {roomLabel}
          </span>
          {plant.is_winter_mode && (
            <span className="text-[10px] px-2 py-0.5 rounded-lg bg-blue-500/80 backdrop-blur-md text-white font-semibold">
              ❄️ Zimní klid
            </span>
          )}
        </div>
      </Link>

      {/* Content */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          {/* Pet Toxicity & Health Status */}
          <div className="flex items-center gap-2 mb-2">
            {getPetBadge()}
            {plant.health_status === 'needs_attention' && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300">
                Vyžaduje péči
              </span>
            )}
            {plant.health_status === 'sick' && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300">
                Nemocná
              </span>
            )}
          </div>

          {/* Plant Name & Latin species */}
          <Link to={`/plants/${plant.id}`}>
            <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors line-clamp-1">
              {plant.name}
            </h3>
          </Link>
          {(plant.species_czech || plant.species_latin) && (
            <p className="text-xs text-zinc-500 dark:text-zinc-400 italic line-clamp-1 mt-0.5">
              {plant.species_czech || plant.species_latin}
            </p>
          )}
        </div>

        {/* Action Row */}
        <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between gap-2">
          <div className="text-[11px] text-zinc-400">
            Interval: {plant.is_winter_mode ? plant.winter_watering_interval_days : plant.watering_interval_days} dní
          </div>

          {/* Quick Water Button */}
          <button
            onClick={() => onWater(plant.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition shadow-sm ${
              plant.is_thirsty
                ? 'bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white shadow-blue-500/25'
                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-emerald-50 hover:text-emerald-600 dark:hover:bg-emerald-950/50 dark:hover:text-emerald-400'
            }`}
          >
            <Droplets className="w-3.5 h-3.5" />
            <span>{plant.watering_status === 'watered_today' ? 'Zalito' : t('plants.water_now')}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
