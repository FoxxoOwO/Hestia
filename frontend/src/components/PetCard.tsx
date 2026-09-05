import React from 'react';
import { Link } from 'react-router-dom';
import {
  Dog, Cat, Heart, Utensils, Syringe, AlertCircle,
  CheckCircle2, Clock, ShieldAlert, Sparkles
} from 'lucide-react';
import { Pet } from '../types';
import { useTranslation } from '../i18n';

interface PetCardProps {
  pet: Pet;
  onFeed: (id: number) => void;
  onToggleFavorite: (id: number) => void;
}

export const PetCard: React.FC<PetCardProps> = ({
  pet,
  onFeed,
  onToggleFavorite,
}) => {
  const { t } = useTranslation();

  const getSpeciesIcon = () => {
    switch (pet.species) {
      case 'cat':
        return <Cat className="w-12 h-12 stroke-1 text-purple-500" />;
      case 'dog':
      default:
        return <Dog className="w-12 h-12 stroke-1 text-amber-500" />;
    }
  };

  const speciesLabel = t(`pets.species.${pet.species}`) || pet.species;

  return (
    <div className="group relative rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-amber-400 dark:hover:border-amber-500/60 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col">
      {/* Image container */}
      <Link to={`/pets/${pet.id}`} className="block relative aspect-[16/11] overflow-hidden bg-zinc-100 dark:bg-zinc-800">
        {pet.primary_image_url ? (
          <img
            src={pet.primary_image_url}
            alt={pet.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-zinc-400 dark:text-zinc-600 bg-gradient-to-tr from-amber-50 to-orange-50 dark:from-zinc-900 dark:to-zinc-800">
            {getSpeciesIcon()}
            <span className="text-xs mt-2 font-medium">Hestia Mazlíček</span>
          </div>
        )}

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />

        {/* Species & Gender Badges */}
        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-black/50 backdrop-blur-md text-white border border-white/20">
            {speciesLabel}
          </span>
          {pet.gender !== 'unknown' && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/80 dark:bg-zinc-800/80 backdrop-blur-md text-zinc-800 dark:text-zinc-200">
              {pet.gender === 'male' ? '♂ Samec' : '♀ Samice'}
            </span>
          )}
        </div>

        {/* Favorite Button */}
        <button
          onClick={(e) => {
            e.preventDefault();
            onToggleFavorite(pet.id);
          }}
          className="absolute top-3 right-3 p-2 rounded-full backdrop-blur-md bg-white/70 dark:bg-black/50 hover:bg-white dark:hover:bg-black text-zinc-700 dark:text-zinc-300 hover:text-rose-500 transition shadow-md"
        >
          <Heart
            className={`w-4 h-4 ${pet.is_favorite ? 'fill-rose-500 text-rose-500' : ''}`}
          />
        </button>

        {/* Bottom meta on image */}
        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white text-xs font-medium">
          <span className="px-2 py-0.5 rounded-lg bg-black/40 backdrop-blur-md text-[11px]">
            🎂 {pet.age_formatted}
          </span>
          {pet.latest_weight_kg && (
            <span className="text-[11px] px-2 py-0.5 rounded-lg bg-black/40 backdrop-blur-md font-semibold">
              ⚖️ {pet.latest_weight_kg} kg
            </span>
          )}
        </div>
      </Link>

      {/* Content */}
      <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
        <div>
          <div className="flex items-start justify-between gap-2">
            <div>
              <Link to={`/pets/${pet.id}`}>
                <h3 className="font-bold text-lg text-zinc-900 dark:text-zinc-100 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors line-clamp-1">
                  {pet.name}
                </h3>
              </Link>
              {pet.breed && (
                <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-1">
                  {pet.breed}
                </p>
              )}
            </div>

            {pet.has_upcoming_vet_task && (
              <span className="shrink-0 flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 animate-pulse" title="Blíží se termín očkování nebo kontroly!">
                <Syringe className="w-3 h-3" />
                <span>Očkování</span>
              </span>
            )}
          </div>

          {/* Feeding info */}
          <div className="mt-3 p-2.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800/80 text-xs">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
                <Utensils className="w-3 h-3 text-amber-500" />
                <span>Krmení:</span>
              </span>
              <span className="text-[11px] font-semibold text-zinc-800 dark:text-zinc-200 truncate">
                {pet.last_fed_at ? (
                  <>
                    {new Date(pet.last_fed_at).toLocaleDateString('cs-CZ') === new Date().toLocaleDateString('cs-CZ')
                      ? `Dnes v ${new Date(pet.last_fed_at).toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit' })} (${pet.last_fed_by_name || 'někdo'})`
                      : `${new Date(pet.last_fed_at).toLocaleDateString('cs-CZ')}`}
                  </>
                ) : (
                  <span className="text-zinc-400">Zatím nezaznamenáno</span>
                )}
              </span>
            </div>
          </div>

          {/* Allergies hint */}
          {pet.allergies_and_intolerances && (
            <div className="mt-2 flex items-center gap-1.5 text-[11px] text-rose-600 dark:text-rose-400">
              <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{pet.allergies_and_intolerances}</span>
            </div>
          )}
        </div>

        {/* Action Row */}
        <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between gap-2">
          <Link
            to={`/pets/${pet.id}`}
            className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:text-amber-600 dark:hover:text-amber-400 transition"
          >
            Zdravotní karta &rarr;
          </Link>

          {/* Quick Feed Button */}
          <button
            onClick={() => onFeed(pet.id)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white transition shadow-sm shadow-amber-500/20 active:scale-95"
          >
            <Utensils className="w-3.5 h-3.5" />
            <span>Nakrmeno</span>
          </button>
        </div>
      </div>
    </div>
  );
};
