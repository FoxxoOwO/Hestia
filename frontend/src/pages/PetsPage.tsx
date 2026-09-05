import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Dog, Cat, Plus, Sparkles, Stethoscope, Search,
  Utensils, Syringe, Heart, X, CheckCircle2, ShieldAlert
} from 'lucide-react';
import { api } from '../services/api';
import { Pet, PetSpecies } from '../types';
import { PetCard } from '../components/PetCard';
import { PetFoodSafetyModal } from '../components/PetFoodSafetyModal';
import { PetDoctorModal } from '../components/PetDoctorModal';
import { useTranslation } from '../i18n';

export const PetsPage: React.FC = () => {
  const { t } = useTranslation();
  const [pets, setPets] = useState<Pet[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpecies, setSelectedSpecies] = useState<string>('all');
  const [onlyFavorites, setOnlyFavorites] = useState(false);

  // Modals
  const [isFoodSafetyOpen, setIsFoodSafetyOpen] = useState(false);
  const [isDoctorOpen, setIsDoctorOpen] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  const fetchPets = async () => {
    setIsLoading(true);
    try {
      const data = await api.getPets({
        species: selectedSpecies,
        favorite_only: onlyFavorites,
        query: searchQuery || undefined,
      });
      setPets(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchPets();
    }, 200);
    return () => clearTimeout(timer);
  }, [searchQuery, selectedSpecies, onlyFavorites]);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  const handleFeed = async (id: number) => {
    try {
      const updated = await api.feedPet(id);
      setPets((prev) => prev.map((p) => (p.id === id ? updated : p)));
      showNotification(`🥣 Mazlíček "${updated.name}" byl úspěšně nakrmen!`);
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleFavorite = async (id: number) => {
    try {
      const updated = await api.toggleFavoritePet(id);
      setPets((prev) => prev.map((p) => (p.id === id ? { ...p, is_favorite: updated.is_favorite } : p)));
    } catch (e) {
      console.error(e);
    }
  };

  const upcomingVetCount = pets.filter((p) => p.has_upcoming_vet_task).length;

  return (
    <div className="space-y-6 pb-20">
      {/* Toast */}
      {notification && (
        <div className="fixed top-20 right-4 z-50 p-4 rounded-2xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 shadow-2xl text-xs font-bold animate-in slide-in-from-top flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>{notification}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-100 flex items-center gap-2.5">
            <span>{t('pets.title')}</span>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300">
              {pets.length} zvířat
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            {t('pets.subtitle')}
          </p>
        </div>

        {/* Top Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsFoodSafetyOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-2xl text-xs font-semibold bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-900/50 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-900/60 transition shadow-sm"
          >
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>{t('pets.food_safety')}</span>
          </button>

          <button
            onClick={() => setIsDoctorOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-2xl text-xs font-semibold bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/50 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900/60 transition shadow-sm"
          >
            <Stethoscope className="w-4 h-4 text-rose-500" />
            <span>{t('pets.ai_vet')}</span>
          </button>

          <Link
            to="/pets/new"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-xs font-semibold bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-100 dark:text-zinc-900 transition shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>{t('pets.add_pet')}</span>
          </Link>
        </div>
      </div>

      {/* Vet Care Alert Banner if any pet has upcoming vaccination/deworming */}
      {upcomingVetCount > 0 && (
        <div className="p-4 rounded-3xl bg-gradient-to-r from-rose-500/15 via-amber-500/10 to-transparent border border-rose-300/80 dark:border-rose-500/30 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-rose-500 text-white shadow-md shadow-rose-500/30 shrink-0">
              <Syringe className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                {upcomingVetCount} {upcomingVetCount === 1 ? 'mazlíček má naplánované očkování či kontrolu' : 'mazlíčci mají naplánované očkování či kontrolu!'}
              </h4>
              <p className="text-xs text-zinc-600 dark:text-zinc-400">
                Zkontrolujte platnost vakcín a včas se objednejte k vašemu veterinárnímu lékaři.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Search & Filter Bar */}
      <div className="p-4 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('pets.search_placeholder')}
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
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

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
          <button
            onClick={() => setSelectedSpecies('all')}
            className={`px-3 py-1.5 rounded-xl border transition ${
              selectedSpecies === 'all'
                ? 'bg-amber-500 text-white border-amber-500 font-bold shadow-sm'
                : 'border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50'
            }`}
          >
            {t('pets.species_all')}
          </button>

          <button
            onClick={() => setSelectedSpecies('dog')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border transition ${
              selectedSpecies === 'dog'
                ? 'bg-amber-500 text-white border-amber-500 font-bold shadow-sm'
                : 'border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50'
            }`}
          >
            <Dog className="w-3.5 h-3.5" />
            <span>Psi 🐕</span>
          </button>

          <button
            onClick={() => setSelectedSpecies('cat')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border transition ${
              selectedSpecies === 'cat'
                ? 'bg-amber-500 text-white border-amber-500 font-bold shadow-sm'
                : 'border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50'
            }`}
          >
            <Cat className="w-3.5 h-3.5" />
            <span>Kočky 🐈</span>
          </button>

          <button
            onClick={() => setSelectedSpecies('rabbit')}
            className={`px-3 py-1.5 rounded-xl border transition ${
              selectedSpecies === 'rabbit'
                ? 'bg-amber-500 text-white border-amber-500 font-bold shadow-sm'
                : 'border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50'
            }`}
          >
            Králíci 🐇
          </button>

          {/* Favorites only */}
          <button
            onClick={() => setOnlyFavorites(!onlyFavorites)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border transition ${
              onlyFavorites
                ? 'bg-rose-50 border-rose-300 text-rose-600 dark:bg-rose-950/50 dark:border-rose-800 dark:text-rose-400 font-semibold'
                : 'border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50'
            }`}
          >
            <Heart className={`w-3.5 h-3.5 ${onlyFavorites ? 'fill-rose-500' : ''}`} />
            <span>Oblíbení</span>
          </button>

          {(selectedSpecies !== 'all' || onlyFavorites || searchQuery) && (
            <button
              onClick={() => {
                setSelectedSpecies('all');
                setOnlyFavorites(false);
                setSearchQuery('');
              }}
              className="text-amber-600 dark:text-amber-400 font-semibold hover:underline ml-auto"
            >
              Vymazat filtry
            </button>
          )}
        </div>
      </div>

      {/* Pets Grid */}
      {isLoading ? (
        <div className="py-20 text-center text-zinc-400">
          <Dog className="w-10 h-10 animate-bounce text-amber-500 mx-auto mb-2" />
          <p className="text-sm">{t('common.loading')}</p>
        </div>
      ) : pets.length === 0 ? (
        <div className="py-16 text-center rounded-3xl border border-dashed border-zinc-200 dark:border-zinc-800 p-8">
          <Dog className="w-14 h-14 stroke-1 text-zinc-300 mx-auto mb-3" />
          <h3 className="font-bold text-base text-zinc-800 dark:text-zinc-200 mb-1">
            {t('pets.empty')}
          </h3>
          <p className="text-xs text-zinc-500 max-w-sm mx-auto mb-4">
            Přidejte do rodiny svého psa, kočku nebo jiné zvířátko a mějte očkování, váhu i léky pod kontrolou.
          </p>
          <Link
            to="/pets/new"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-semibold bg-amber-500 text-white hover:bg-amber-600 transition"
          >
            <Plus className="w-4 h-4" />
            <span>{t('pets.add_pet')}</span>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {pets.map((pet) => (
            <PetCard
              key={pet.id}
              pet={pet}
              onFeed={handleFeed}
              onToggleFavorite={handleToggleFavorite}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      <PetFoodSafetyModal
        isOpen={isFoodSafetyOpen}
        onClose={() => setIsFoodSafetyOpen(false)}
      />

      <PetDoctorModal
        isOpen={isDoctorOpen}
        onClose={() => setIsDoctorOpen(false)}
        petsList={pets}
      />
    </div>
  );
};
