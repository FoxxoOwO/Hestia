import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Flower2, Plus, Sparkles, Stethoscope, Luggage, Search,
  Droplets, ShieldCheck, AlertTriangle, X
} from 'lucide-react';
import { api } from '../services/api';
import { Plant, RoomType } from '../types';
import { PlantCard } from '../components/PlantCard';
import { PlantAiModal } from '../components/PlantAiModal';
import { PlantDoctorModal } from '../components/PlantDoctorModal';
import { PlantSitterModal } from '../components/PlantSitterModal';
import { useTranslation } from '../i18n';

export const PlantsPage: React.FC = () => {
  const { t } = useTranslation();
  const [plants, setPlants] = useState<Plant[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRoom, setSelectedRoom] = useState<string>('all');
  const [onlyThirsty, setOnlyThirsty] = useState(false);
  const [onlyPetSafe, setOnlyPetSafe] = useState(false);
  const [onlyNeedsCare, setOnlyNeedsCare] = useState(false);

  // Modals
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [isDoctorModalOpen, setIsDoctorModalOpen] = useState(false);
  const [isSitterModalOpen, setIsSitterModalOpen] = useState(false);

  const [notification, setNotification] = useState<string | null>(null);

  const fetchPlants = async () => {
    setIsLoading(true);
    try {
      const data = await api.getPlants({
        room: selectedRoom,
        thirsty_only: onlyThirsty,
        pet_toxicity: onlyPetSafe ? 'safe' : undefined,
        health_status: onlyNeedsCare ? 'needs_attention' : undefined,
        query: searchQuery || undefined,
      });
      setPlants(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchPlants();
    }, 200);
    return () => clearTimeout(timer);
  }, [searchQuery, selectedRoom, onlyThirsty, onlyPetSafe, onlyNeedsCare]);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  const handleWaterPlant = async (id: number) => {
    try {
      const updated = await api.waterPlant(id);
      setPlants((prev) => prev.map((p) => (p.id === id ? updated : p)));
      showNotification(`💧 Rostlina "${updated.name}" byla zalita! Další zálivka za ${updated.watering_interval_days} dní.`);
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleFavorite = async (id: number) => {
    try {
      const updated = await api.toggleFavoritePlant(id);
      setPlants((prev) => prev.map((p) => (p.id === id ? { ...p, is_favorite: updated.is_favorite } : p)));
    } catch (e) {
      console.error(e);
    }
  };

  const thirstyCount = plants.filter((p) => p.is_thirsty).length;

  return (
    <div className="space-y-6 pb-20">
      {/* Toast */}
      {notification && (
        <div className="fixed top-20 right-4 z-50 p-4 rounded-2xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 shadow-2xl text-xs font-bold animate-in slide-in-from-top flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-emerald-400" />
          <span>{notification}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-100 flex items-center gap-2.5">
            <span>{t('plants.title')}</span>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
              {plants.length} kytek
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            {t('plants.subtitle')}
          </p>
        </div>

        {/* Top Action Bar */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsDoctorModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-2xl text-xs font-semibold bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/50 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900/60 transition shadow-sm"
          >
            <Stethoscope className="w-4 h-4 text-rose-500" />
            <span>{t('plants.ai_doctor')}</span>
          </button>

          <button
            onClick={() => setIsSitterModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-2xl text-xs font-semibold bg-cyan-50 hover:bg-cyan-100 dark:bg-cyan-950/40 dark:hover:bg-cyan-900/50 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-900/60 transition shadow-sm"
          >
            <Luggage className="w-4 h-4 text-cyan-500" />
            <span>{t('plants.plant_sitter')}</span>
          </button>

          <button
            onClick={() => setIsAiModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-xs font-semibold bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-md shadow-emerald-500/20 transition"
          >
            <Sparkles className="w-4 h-4" />
            <span>{t('plants.ai_analyze')}</span>
          </button>

          <Link
            to="/plants/new"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-xs font-semibold bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-100 dark:text-zinc-900 transition shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>{t('plants.add_plant')}</span>
          </Link>
        </div>
      </div>

      {/* Thirsty Alert Banner if any plants need water */}
      {thirstyCount > 0 && !onlyThirsty && (
        <div className="p-4 rounded-3xl bg-gradient-to-r from-orange-500/15 via-amber-500/10 to-transparent border border-orange-300/80 dark:border-orange-500/30 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-orange-500 text-white shadow-md shadow-orange-500/30 shrink-0">
              <Droplets className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                {thirstyCount} {thirstyCount === 1 ? 'kytka má dnes žízeň' : 'kytky mají dnes žízeň!'}
              </h4>
              <p className="text-xs text-zinc-600 dark:text-zinc-400">
                Zkontrolujte stav substrátu a dopřejte jim potřebnou vláhu.
              </p>
            </div>
          </div>

          <button
            onClick={() => setOnlyThirsty(true)}
            className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-orange-500 hover:bg-orange-600 text-white transition shadow-sm shrink-0"
          >
            Zobrazit žíznivé
          </button>
        </div>
      )}

      {/* Search & Filters */}
      <div className="p-4 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('plants.search_placeholder')}
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
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
          {/* Thirsty button */}
          <button
            onClick={() => setOnlyThirsty(!onlyThirsty)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border transition ${
              onlyThirsty
                ? 'bg-orange-50 border-orange-300 text-orange-600 dark:bg-orange-950/50 dark:border-orange-800 dark:text-orange-400 font-semibold'
                : 'border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800'
            }`}
          >
            <Droplets className="w-3.5 h-3.5" />
            <span>{t('plants.filter_thirsty')}</span>
          </button>

          {/* Pet Friendly */}
          <button
            onClick={() => setOnlyPetSafe(!onlyPetSafe)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border transition ${
              onlyPetSafe
                ? 'bg-emerald-50 border-emerald-300 text-emerald-600 dark:bg-emerald-950/50 dark:border-emerald-800 dark:text-emerald-400 font-semibold'
                : 'border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>{t('plants.filter_pet_safe')}</span>
          </button>

          {/* Needs Attention */}
          <button
            onClick={() => setOnlyNeedsCare(!onlyNeedsCare)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border transition ${
              onlyNeedsCare
                ? 'bg-amber-50 border-amber-300 text-amber-600 dark:bg-amber-950/50 dark:border-amber-800 dark:text-amber-400 font-semibold'
                : 'border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>{t('plants.filter_needs_care')}</span>
          </button>

          {/* Room filter */}
          <select
            value={selectedRoom}
            onChange={(e) => setSelectedRoom(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="all">{t('plants.filter_room')}: {t('plants.filter_all')}</option>
            <option value="living_room">{t('plants.rooms.living_room')}</option>
            <option value="bedroom">{t('plants.rooms.bedroom')}</option>
            <option value="kitchen">{t('plants.rooms.kitchen')}</option>
            <option value="bathroom">{t('plants.rooms.bathroom')}</option>
            <option value="balcony">{t('plants.rooms.balcony')}</option>
            <option value="hallway">{t('plants.rooms.hallway')}</option>
            <option value="office">{t('plants.rooms.office')}</option>
          </select>

          {/* Clear filters */}
          {(onlyThirsty || onlyPetSafe || onlyNeedsCare || selectedRoom !== 'all') && (
            <button
              onClick={() => {
                setOnlyThirsty(false);
                setOnlyPetSafe(false);
                setOnlyNeedsCare(false);
                setSelectedRoom('all');
              }}
              className="text-emerald-600 dark:text-emerald-400 font-semibold hover:underline ml-auto"
            >
              Vymazat filtry
            </button>
          )}
        </div>
      </div>

      {/* Plants Grid */}
      {isLoading ? (
        <div className="py-20 text-center text-zinc-400">
          <Flower2 className="w-8 h-8 animate-bounce text-emerald-500 mx-auto mb-2" />
          <p className="text-sm">{t('common.loading')}</p>
        </div>
      ) : plants.length === 0 ? (
        <div className="py-16 text-center rounded-3xl border border-dashed border-zinc-200 dark:border-zinc-800 p-8">
          <Flower2 className="w-12 h-12 stroke-1 text-zinc-400 mx-auto mb-3 text-emerald-500" />
          <h3 className="font-bold text-base text-zinc-800 dark:text-zinc-200 mb-1">
            {t('plants.empty')}
          </h3>
          <p className="text-xs text-zinc-500 max-w-sm mx-auto mb-4">
            Přidejte svou první pokojovku vyfocením přes Gemini AI nebo ručním zápisem.
          </p>
          <button
            onClick={() => setIsAiModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 transition"
          >
            <Sparkles className="w-4 h-4" />
            <span>Rozpoznat kytku z fotky</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {plants.map((plant) => (
            <PlantCard
              key={plant.id}
              plant={plant}
              onWater={handleWaterPlant}
              onToggleFavorite={handleToggleFavorite}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      <PlantAiModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        onPlantCreated={(newPlant) => {
          setPlants((prev) => [newPlant, ...prev]);
        }}
      />

      <PlantDoctorModal
        isOpen={isDoctorModalOpen}
        onClose={() => setIsDoctorModalOpen(false)}
        plantsList={plants}
      />

      <PlantSitterModal
        isOpen={isSitterModalOpen}
        onClose={() => setIsSitterModalOpen(false)}
      />
    </div>
  );
};
