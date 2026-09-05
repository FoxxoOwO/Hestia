import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Flower2, ArrowLeft, Droplets, Heart, Edit3, Trash2,
  Stethoscope, Calendar, AlertTriangle, ShieldCheck, Sun,
  CheckCircle2, Plus, X, Camera, Sparkles, Clock, Check,
  Maximize2, Snowflake, ChevronRight
} from 'lucide-react';
import { api } from '../services/api';
import { Plant, PlantTask, PlantLogEntry } from '../types';
import { PlantDoctorModal } from '../components/PlantDoctorModal';
import { useTranslation } from '../i18n';

export const PlantDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [plant, setPlant] = useState<Plant | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notification, setNotification] = useState<string | null>(null);

  // Modals
  const [isDoctorModalOpen, setIsDoctorModalOpen] = useState(false);
  const [isAddLogOpen, setIsAddLogOpen] = useState(false);
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);

  // Add Log Entry Form State
  const [logType, setLogType] = useState<'photo' | 'note' | 'repotting'>('photo');
  const [logTitle, setLogTitle] = useState('');
  const [logNotes, setLogNotes] = useState('');
  const [logImageUrl, setLogImageUrl] = useState('');
  const [isSubmittingLog, setIsSubmittingLog] = useState(false);

  // Add Task Form State
  const [taskType, setTaskType] = useState<'water' | 'fertilize' | 'repot' | 'mist' | 'clean_leaves' | 'custom'>('fertilize');
  const [taskInterval, setTaskInterval] = useState(14);
  const [taskDueDate, setTaskDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 14);
    return d.toISOString().split('T')[0];
  });
  const [taskNotes, setTaskNotes] = useState('');
  const [isSubmittingTask, setIsSubmittingTask] = useState(false);

  const fetchPlant = async () => {
    if (!id) return;
    try {
      const data = await api.getPlant(Number(id));
      setPlant(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPlant();
  }, [id]);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  const handleWater = async () => {
    if (!plant) return;
    try {
      const updated = await api.waterPlant(plant.id);
      setPlant(updated);
      showNotification(`💧 Rostlina "${updated.name}" byla úspěšně zalita!`);
    } catch (e) {
      console.error(e);
      showNotification('Chyba při zaznamenání zálivky.');
    }
  };

  const handleToggleWinterMode = async () => {
    if (!plant) return;
    try {
      const updated = await api.toggleWinterMode(plant.id);
      setPlant(updated);
      showNotification(
        updated.is_winter_mode
          ? '❄️ Zimní klidový režim aktivován'
          : '☀️ Letní růstový režim aktivován'
      );
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleFavorite = async () => {
    if (!plant) return;
    try {
      const updated = await api.toggleFavoritePlant(plant.id);
      setPlant((prev) => (prev ? { ...prev, is_favorite: updated.is_favorite } : null));
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async () => {
    if (!plant) return;
    if (window.confirm(t('common.confirm_delete'))) {
      try {
        await api.deletePlant(plant.id);
        navigate('/plants');
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleCompleteTask = async (taskId: number) => {
    if (!plant) return;
    try {
      const updatedTask = await api.completePlantTask(plant.id, taskId);
      setPlant((prev) => {
        if (!prev) return null;
        const newTasks = (prev.tasks || []).map((t) => (t.id === taskId ? updatedTask : t));
        return { ...prev, tasks: newTasks };
      });
      showNotification('✅ Úkol splněn!');
      fetchPlant(); // refresh hydration/log if watering task
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!plant) return;
    setIsSubmittingTask(true);
    try {
      await api.createPlantTask(plant.id, {
        task_type: taskType,
        due_date: taskDueDate,
        interval_days: Number(taskInterval),
        notes: taskNotes || undefined,
      });
      setIsAddTaskOpen(false);
      setTaskNotes('');
      showNotification('Úkol byl úspěšně přidán.');
      fetchPlant();
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmittingTask(false);
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setLogImageUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleCreateLogEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!plant) return;
    if (!logTitle.trim()) return;

    setIsSubmittingLog(true);
    try {
      await api.addPlantLogEntry(plant.id, {
        entry_type: logType,
        title: logTitle.trim(),
        notes: logNotes.trim() || undefined,
        image_url: logImageUrl || undefined,
      });
      setIsAddLogOpen(false);
      setLogTitle('');
      setLogNotes('');
      setLogImageUrl('');
      showNotification('Záznam byl přidán do fotodeníku.');
      fetchPlant();
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmittingLog(false);
    }
  };

  if (isLoading) {
    return (
      <div className="py-24 text-center text-zinc-400">
        <Flower2 className="w-10 h-10 animate-bounce text-emerald-500 mx-auto mb-3" />
        <p className="text-sm font-medium">{t('common.loading')}</p>
      </div>
    );
  }

  if (!plant) {
    return (
      <div className="py-20 text-center">
        <p className="text-zinc-500">Rostlina nebyla nalezena.</p>
        <Link to="/plants" className="mt-4 inline-block text-emerald-600 font-semibold text-sm hover:underline">
          Zpět do květináře
        </Link>
      </div>
    );
  }

  const roomLabel = t(`plants.rooms.${plant.room}`) || plant.room;
  const lightLabel = t(`plants.light.${plant.light_requirement}`) || plant.light_requirement;

  return (
    <div className="space-y-6 pb-20 max-w-6xl mx-auto">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed top-20 right-4 z-50 p-4 rounded-2xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 shadow-2xl text-xs font-bold animate-in slide-in-from-top flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-emerald-400" />
          <span>{notification}</span>
        </div>
      )}

      {/* Navigation & Action Bar */}
      <div className="flex items-center justify-between gap-4">
        <Link
          to="/plants"
          className="inline-flex items-center gap-2 text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Zpět na přehled rostlin</span>
        </Link>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsDoctorModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-2xl text-xs font-semibold bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/50 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900/60 transition shadow-sm"
          >
            <Stethoscope className="w-3.5 h-3.5 text-rose-500" />
            <span className="hidden sm:inline">{t('plants.ai_doctor')}</span>
          </button>

          <button
            onClick={handleToggleFavorite}
            className="p-2.5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 transition shadow-sm"
            title="Přidat do oblíbených"
          >
            <Heart className={`w-4 h-4 ${plant.is_favorite ? 'fill-rose-500 text-rose-500' : ''}`} />
          </button>

          <Link
            to={`/plants/${plant.id}/edit`}
            className="flex items-center gap-1.5 px-3 py-2 rounded-2xl text-xs font-semibold border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 transition shadow-sm"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Upravit</span>
          </Link>

          <button
            onClick={handleDelete}
            className="p-2.5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:text-rose-600 text-zinc-500 transition shadow-sm"
            title="Smazat rostlinu"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Hero Header: Image & Hydration Control */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Plant Photo / Card */}
        <div className="lg:col-span-5 rounded-3xl overflow-hidden bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <div className="relative aspect-[4/3] bg-zinc-100 dark:bg-zinc-800">
            {plant.primary_image_url ? (
              <img
                src={plant.primary_image_url}
                alt={plant.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-zinc-400 dark:text-zinc-600 bg-gradient-to-tr from-emerald-50 to-teal-50 dark:from-zinc-900 dark:to-zinc-800">
                <Flower2 className="w-16 h-16 stroke-1 text-emerald-500" />
                <span className="text-xs mt-2 font-medium">Hestia Botanik</span>
              </div>
            )}

            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60" />

            {/* Room & Season Badges */}
            <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-white text-xs font-semibold">
              <span className="px-3 py-1 rounded-xl bg-black/40 backdrop-blur-md">
                📍 {roomLabel}
              </span>
              {plant.is_winter_mode ? (
                <span className="px-3 py-1 rounded-xl bg-blue-500/80 backdrop-blur-md">
                  ❄️ {t('plants.winter_mode')}
                </span>
              ) : (
                <span className="px-3 py-1 rounded-xl bg-emerald-500/80 backdrop-blur-md">
                  ☀️ {t('plants.summer_mode')}
                </span>
              )}
            </div>
          </div>

          {/* Subtitle / Botanical naming */}
          <div className="p-4 sm:p-5 border-t border-zinc-100 dark:border-zinc-800">
            <h1 className="text-2xl font-extrabold text-zinc-900 dark:text-zinc-100">
              {plant.name}
            </h1>
            {(plant.species_czech || plant.species_latin) && (
              <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 italic mt-0.5">
                {plant.species_czech} {plant.species_latin && `(${plant.species_latin})`}
              </p>
            )}

            {/* Quick Badges row */}
            <div className="mt-3 flex flex-wrap gap-1.5">
              {plant.pet_toxicity === 'safe' && (
                <span className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  🐾 Bezpečné pro zvířata
                </span>
              )}
              {plant.pet_toxicity === 'toxic' && (
                <span className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                  ⚠️ Toxické pro kočky a psy!
                </span>
              )}
              {plant.pet_toxicity === 'mildly_toxic' && (
                <span className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                  ⚡ Mírně toxické (dráždí sliznice)
                </span>
              )}

              {plant.health_status === 'healthy' ? (
                <span className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                  🌱 Výborný zdravotní stav
                </span>
              ) : plant.health_status === 'needs_attention' ? (
                <span className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300">
                  ⚠️ Vyžaduje péči
                </span>
              ) : (
                <span className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300">
                  🚨 Nemocná (AI léčení)
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right Hydration & Care Dashboard */}
        <div className="lg:col-span-7 space-y-6">
          {/* Hydration Banner & Quick Water CTA */}
          <div className="p-6 rounded-3xl bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-transparent border border-emerald-500/20 shadow-sm relative overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                  <Droplets className="w-4 h-4" />
                  Stav hydratace a vláhy
                </span>

                <div className="mt-2 flex items-baseline gap-2">
                  <h3 className="text-2xl font-black text-zinc-900 dark:text-zinc-100">
                    {plant.watering_status === 'watered_today' && 'Dnes zalito!'}
                    {plant.watering_status === 'due_today' && 'Zalít dnes!'}
                    {plant.watering_status === 'overdue' && 'Zálivka má zpoždění!'}
                    {plant.watering_status === 'ok' && `Zalít za ${plant.days_until_watering} dní`}
                  </h3>
                </div>

                <div className="mt-2 text-xs text-zinc-600 dark:text-zinc-400 space-y-1">
                  <p>
                    Naposledy zalito:{' '}
                    <span className="font-semibold text-zinc-900 dark:text-zinc-200">
                      {plant.last_watered_date
                        ? new Date(plant.last_watered_date).toLocaleDateString('cs-CZ')
                        : 'Zatím nezaznamenáno'}
                    </span>
                  </p>
                  <p>
                    Předpokládaná další zálivka:{' '}
                    <span className="font-semibold text-zinc-900 dark:text-zinc-200">
                      {plant.next_watering_date
                        ? new Date(plant.next_watering_date).toLocaleDateString('cs-CZ')
                        : 'Dnes'}
                    </span>
                  </p>
                </div>
              </div>

              {/* Water Button */}
              <button
                onClick={handleWater}
                className="px-6 py-3.5 rounded-2xl font-bold text-sm bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white shadow-lg shadow-blue-500/25 transition transform active:scale-95 flex items-center justify-center gap-2"
              >
                <Droplets className="w-5 h-5 fill-white" />
                <span>Zalito dnes</span>
              </button>
            </div>

            {/* Winter Mode Toggle Switch inside hydration box */}
            <div className="mt-6 pt-4 border-t border-emerald-500/15 flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <Snowflake
                  className={`w-4 h-4 ${
                    plant.is_winter_mode ? 'text-blue-500 animate-pulse' : 'text-zinc-400'
                  }`}
                />
                <div>
                  <span className="text-xs font-bold text-zinc-900 dark:text-zinc-200">
                    {t('plants.winter_mode')}
                  </span>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                    Interval:{' '}
                    <strong className="text-zinc-700 dark:text-zinc-300">
                      {plant.is_winter_mode
                        ? `${plant.winter_watering_interval_days} dní (Zima)`
                        : `${plant.watering_interval_days} dní (Léto)`}
                    </strong>
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleToggleWinterMode}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  plant.is_winter_mode ? 'bg-blue-600' : 'bg-zinc-300 dark:bg-zinc-700'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    plant.is_winter_mode ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Plant Passport / Care Specs */}
          <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4">
            <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <Flower2 className="w-4 h-4 text-emerald-500" />
              <span>{t('plants.passport')}</span>
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
              <div className="p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800">
                <span className="text-zinc-400 block mb-1">Světlo</span>
                <span className="font-semibold text-zinc-800 dark:text-zinc-200 flex items-center gap-1">
                  <Sun className="w-3.5 h-3.5 text-amber-500" />
                  {lightLabel}
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800">
                <span className="text-zinc-400 block mb-1">Květináč (průměr)</span>
                <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                  {plant.pot_diameter_cm ? `${plant.pot_diameter_cm} cm` : 'Neurčeno'}
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800">
                <span className="text-zinc-400 block mb-1">Rosení listů</span>
                <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                  {plant.misting_required ? '💦 Ano, vyžaduje' : 'Není nutné'}
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800 col-span-2 sm:col-span-3">
                <span className="text-zinc-400 block mb-1">{t('plants.substrate')}</span>
                <p className="font-medium text-zinc-800 dark:text-zinc-200">
                  {plant.substrate_type || 'Běžný propustný substrát pro pokojové rostliny'}
                </p>
              </div>

              {plant.pet_toxicity_notes && (
                <div className="p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800 col-span-2 sm:col-span-3">
                  <span className="text-zinc-400 block mb-1">Toxicita pro domácí zvířata</span>
                  <p className="font-medium text-zinc-800 dark:text-zinc-200">
                    {plant.pet_toxicity_notes}
                  </p>
                </div>
              )}

              {plant.notes && (
                <div className="p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800 col-span-2 sm:col-span-3">
                  <span className="text-zinc-400 block mb-1">Poznámky k péči</span>
                  <p className="text-zinc-700 dark:text-zinc-300 leading-relaxed">
                    {plant.notes}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Two Column Section: Care Tasks & Growth Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Care Tasks List */}
        <div className="lg:col-span-5 p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-emerald-500" />
              <span>Plán péče a úkoly</span>
            </h3>

            <button
              onClick={() => setIsAddTaskOpen(true)}
              className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Nový úkol</span>
            </button>
          </div>

          {/* Tasks items */}
          <div className="space-y-2.5">
            {(!plant.tasks || plant.tasks.length === 0) ? (
              <p className="text-xs text-zinc-400 py-4 text-center">
                Žádné naplánované úkoly.
              </p>
            ) : (
              plant.tasks.map((task) => {
                const isOverdue = new Date(task.due_date) < new Date();
                return (
                  <div
                    key={task.id}
                    className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800 flex items-center justify-between gap-3 group"
                  >
                    <div className="flex items-start gap-3">
                      <button
                        onClick={() => handleCompleteTask(task.id)}
                        className="mt-0.5 w-5 h-5 rounded-lg border border-zinc-300 dark:border-zinc-600 flex items-center justify-center hover:bg-emerald-500 hover:border-emerald-500 hover:text-white transition group-hover:border-emerald-500"
                      >
                        <Check className="w-3.5 h-3.5 opacity-0 hover:opacity-100 group-hover:opacity-60" />
                      </button>

                      <div>
                        <h4 className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                          {t(`plants.tasks.${task.task_type}`) || task.task_type}
                        </h4>
                        <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                          Termín:{' '}
                          <span
                            className={
                              isOverdue ? 'text-rose-600 font-semibold' : 'text-zinc-700 dark:text-zinc-300'
                            }
                          >
                            {new Date(task.due_date).toLocaleDateString('cs-CZ')}
                          </span>{' '}
                          (opakovat po {task.interval_days} dnech)
                        </p>
                        {task.notes && (
                          <p className="text-[10px] text-zinc-400 mt-0.5">{task.notes}</p>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => handleCompleteTask(task.id)}
                      className="px-2.5 py-1 rounded-xl text-[11px] font-bold bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 hover:bg-emerald-500 hover:text-white hover:border-emerald-500 transition text-zinc-600 dark:text-zinc-300"
                    >
                      Splnit
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Growth Timeline & Events Journal */}
        <div className="lg:col-span-7 p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <Camera className="w-4 h-4 text-emerald-500" />
                <span>{t('plants.timeline_title')}</span>
              </h3>
              <p className="text-xs text-zinc-400">
                Fotodokumentace růstu, přesazování a diagnóz
              </p>
            </div>

            <button
              onClick={() => setIsAddLogOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-2xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{t('plants.add_log_entry')}</span>
            </button>
          </div>

          {/* Timeline entries */}
          <div className="space-y-4 pt-2">
            {(!plant.log_entries || plant.log_entries.length === 0) ? (
              <p className="text-xs text-zinc-400 py-6 text-center">
                Zatím žádné záznamy v deníku růstu.
              </p>
            ) : (
              plant.log_entries.map((entry) => (
                <div
                  key={entry.id}
                  className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-800 flex flex-col sm:flex-row gap-4"
                >
                  {entry.image_url && (
                    <div className="w-full sm:w-28 h-28 shrink-0 rounded-xl overflow-hidden bg-zinc-200 dark:bg-zinc-700">
                      <img
                        src={entry.image_url}
                        alt={entry.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300">
                        {entry.entry_type === 'photo' && '📷 Fotka růstu'}
                        {entry.entry_type === 'repotting' && '🪴 Přesazení'}
                        {entry.entry_type === 'ai_diagnosis' && '🩺 Diagnóza AI'}
                        {entry.entry_type === 'note' && '📝 Poznámka'}
                      </span>
                      <span className="text-[11px] text-zinc-400">
                        {new Date(entry.created_at).toLocaleDateString('cs-CZ')}
                      </span>
                    </div>

                    <h4 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                      {entry.title}
                    </h4>
                    {entry.notes && (
                      <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1 whitespace-pre-line leading-relaxed">
                        {entry.notes}
                      </p>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Modal: Add Log Entry */}
      {isAddLogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xl overflow-hidden p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-100">
                Přidat záznam do fotodeníku
              </h3>
              <button
                onClick={() => setIsAddLogOpen(false)}
                className="p-1 rounded-xl text-zinc-400 hover:text-zinc-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateLogEntry} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Typ záznamu
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setLogType('photo')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition ${
                      logType === 'photo'
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400'
                        : 'border-zinc-200 dark:border-zinc-800 text-zinc-500'
                    }`}
                  >
                    Foto růstu
                  </button>
                  <button
                    type="button"
                    onClick={() => setLogType('repotting')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition ${
                      logType === 'repotting'
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400'
                        : 'border-zinc-200 dark:border-zinc-800 text-zinc-500'
                    }`}
                  >
                    Přesazení
                  </button>
                  <button
                    type="button"
                    onClick={() => setLogType('note')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition ${
                      logType === 'note'
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400'
                        : 'border-zinc-200 dark:border-zinc-800 text-zinc-500'
                    }`}
                  >
                    Poznámka
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Název události
                </label>
                <input
                  type="text"
                  required
                  placeholder="např. Nový jarní list, Přesazeno do 22cm květníku..."
                  value={logTitle}
                  onChange={(e) => setLogTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-sm text-zinc-900 dark:text-zinc-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Fotografie (volitelné)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="w-full text-xs text-zinc-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700 dark:file:bg-emerald-950/40 dark:file:text-emerald-300 hover:file:bg-emerald-100"
                />
                {logImageUrl && (
                  <div className="mt-2 w-20 h-20 rounded-xl overflow-hidden bg-zinc-100">
                    <img src={logImageUrl} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Poznámky & Postřehy
                </label>
                <textarea
                  rows={3}
                  placeholder="Detaily, rozměry listu, nový substrát..."
                  value={logNotes}
                  onChange={(e) => setLogNotes(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-sm text-zinc-900 dark:text-zinc-100 resize-none"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="submit"
                  disabled={isSubmittingLog}
                  className="flex-1 py-3 rounded-2xl font-semibold text-sm bg-emerald-600 hover:bg-emerald-700 text-white transition shadow-md"
                >
                  Uložit do deníku
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddLogOpen(false)}
                  className="px-4 py-3 rounded-2xl font-semibold text-sm bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 transition"
                >
                  Zrušit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Care Task */}
      {isAddTaskOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xl overflow-hidden p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-100">
                Přidat úkol péče
              </h3>
              <button
                onClick={() => setIsAddTaskOpen(false)}
                className="p-1 rounded-xl text-zinc-400 hover:text-zinc-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Typ úkonu
                </label>
                <select
                  value={taskType}
                  onChange={(e: any) => setTaskType(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-sm text-zinc-900 dark:text-zinc-100"
                >
                  <option value="fertilize">Hnojení</option>
                  <option value="repot">Přesazení</option>
                  <option value="mist">Rosení listů</option>
                  <option value="clean_leaves">Otření prachu z listů</option>
                  <option value="water">Zálivka</option>
                  <option value="custom">Vlastní úkol</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Opakovat každých (dní)
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={taskInterval}
                    onChange={(e) => setTaskInterval(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-sm text-zinc-900 dark:text-zinc-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Nejbližší termín
                  </label>
                  <input
                    type="date"
                    required
                    value={taskDueDate}
                    onChange={(e) => setTaskDueDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-sm text-zinc-900 dark:text-zinc-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Poznámka k úkolu
                </label>
                <input
                  type="text"
                  placeholder="např. Použít hnojivo na zelené pokojovky..."
                  value={taskNotes}
                  onChange={(e) => setTaskNotes(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-sm text-zinc-900 dark:text-zinc-100"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="submit"
                  disabled={isSubmittingTask}
                  className="flex-1 py-3 rounded-2xl font-semibold text-sm bg-emerald-600 hover:bg-emerald-700 text-white transition shadow-md"
                >
                  Naplánovat úkol
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddTaskOpen(false)}
                  className="px-4 py-3 rounded-2xl font-semibold text-sm bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 transition"
                >
                  Zrušit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* AI Doctor Modal for this plant */}
      <PlantDoctorModal
        isOpen={isDoctorModalOpen}
        onClose={() => setIsDoctorModalOpen(false)}
        plantsList={[plant]}
      />
    </div>
  );
};
