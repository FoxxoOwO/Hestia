import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  LayoutDashboard, CheckSquare, ShoppingCart, Flower2,
  Wallet, HeartPulse, Dog, Car, History, Sparkles,
  SlidersHorizontal, Plus, ArrowRight, RefreshCw, AlertCircle,
  Clock, CheckCircle2, Droplet, Flame, AlertTriangle, ChevronRight,
  UtensilsCrossed, Calendar, Award
} from 'lucide-react';
import { api } from '../services/api';
import {
  Chore, ShoppingItem, MedicineStats, Medicine, MedicationSchedule,
  FinanceMonthlySummary, Subscription, Pet, Vehicle, ActivityLog,
  Recipe, LeaderboardMember
} from '../types';
import { useTranslation } from '../i18n';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { ChorePanicModal } from '../components/ChorePanicModal';
import {
  DashboardCustomizeModal,
  DashboardWidgetConfig,
  DashboardWidgetId
} from '../components/dashboard/DashboardCustomizeModal';

const STORAGE_KEY_WIDGETS = 'hestia_dashboard_widgets_v2';
const STORAGE_KEY_STATS = 'hestia_dashboard_quick_stats_v2';
const STORAGE_KEY_COMPACT = 'hestia_dashboard_compact_v2';

const DEFAULT_WIDGETS: DashboardWidgetConfig[] = [
  { id: 'chores', enabled: true },
  { id: 'shopping', enabled: true },
  { id: 'plants', enabled: true },
  { id: 'finances', enabled: true },
  { id: 'medicines', enabled: true },
  { id: 'pets', enabled: true },
  { id: 'vehicles', enabled: true },
  { id: 'activity', enabled: true },
  { id: 'recipe_tip', enabled: true },
];

export const DashboardPage: React.FC = () => {
  const { t } = useTranslation();
  const { designStyle } = useTheme();
  const { user } = useAuth();

  // Layout & Customization state
  const [widgets, setWidgets] = useState<DashboardWidgetConfig[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_WIDGETS);
      if (saved) {
        const parsed: DashboardWidgetConfig[] = JSON.parse(saved);
        // Merge with any newly added widgets to preserve configuration
        const existingIds = new Set(parsed.map(w => w.id));
        const missing = DEFAULT_WIDGETS.filter(w => !existingIds.has(w.id));
        return [...parsed, ...missing];
      }
    } catch {
      // fallback to default
    }
    return DEFAULT_WIDGETS;
  });

  const [showQuickStats, setShowQuickStats] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_STATS);
      return saved !== null ? JSON.parse(saved) : true;
    } catch {
      return true;
    }
  });

  const [isCompact, setIsCompact] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_COMPACT);
      return saved !== null ? JSON.parse(saved) : false;
    } catch {
      return false;
    }
  });

  const [isCustomizeOpen, setIsCustomizeOpen] = useState(false);
  const [isPanicModalOpen, setIsPanicModalOpen] = useState(false);

  // Data state
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [chores, setChores] = useState<Chore[]>([]);
  const [panicTasks, setPanicTasks] = useState<Chore[]>([]);
  const [shoppingItems, setShoppingItems] = useState<ShoppingItem[]>([]);
  const [plants, setPlants] = useState<any[]>([]);
  const [medicineStats, setMedicineStats] = useState<MedicineStats | null>(null);
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [medSchedules, setMedSchedules] = useState<MedicationSchedule[]>([]);
  const [financeSummary, setFinanceSummary] = useState<FinanceMonthlySummary | null>(null);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [pets, setPets] = useState<Pet[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);

  // Inline Quick Add Shopping Item state
  const [newShoppingName, setNewShoppingName] = useState('');
  const [isAddingShopping, setIsAddingShopping] = useState(false);

  // Load all dashboard data in parallel
  const loadDashboardData = async (silent = false) => {
    try {
      if (!silent) setIsLoading(true);
      else setIsRefreshing(true);

      const results = await Promise.allSettled([
        api.getChores(),
        api.getPanicModeTasks(),
        api.getShoppingItems(),
        api.getPlants(),
        api.getMedicineStats(),
        api.getMedicines(),
        api.getMedicationSchedules(undefined, true),
        api.getFinanceSummary(),
        api.getSubscriptions(),
        api.getPets(),
        api.getVehicles(),
        api.getActivities({ limit: 6 }),
        api.getRecipes(),
      ]);

      if (results[0].status === 'fulfilled') setChores(results[0].value);
      if (results[1].status === 'fulfilled') setPanicTasks(results[1].value);
      if (results[2].status === 'fulfilled') setShoppingItems(results[2].value);
      if (results[3].status === 'fulfilled') setPlants(results[3].value);
      if (results[4].status === 'fulfilled') setMedicineStats(results[4].value);
      if (results[5].status === 'fulfilled') setMedicines(results[5].value);
      if (results[6].status === 'fulfilled') setMedSchedules(results[6].value);
      if (results[7].status === 'fulfilled') setFinanceSummary(results[7].value);
      if (results[8].status === 'fulfilled') setSubscriptions(results[8].value);
      if (results[9].status === 'fulfilled') setPets(results[9].value);
      if (results[10].status === 'fulfilled') setVehicles(results[10].value);
      if (results[11].status === 'fulfilled') setActivities(results[11].value?.items || []);
      if (results[12].status === 'fulfilled') setRecipes(results[12].value);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  // Save layout configurations to localStorage
  const saveWidgets = (newWidgets: DashboardWidgetConfig[]) => {
    setWidgets(newWidgets);
    localStorage.setItem(STORAGE_KEY_WIDGETS, JSON.stringify(newWidgets));
  };

  const handleToggleWidget = (id: DashboardWidgetId) => {
    const next = widgets.map(w => (w.id === id ? { ...w, enabled: !w.enabled } : w));
    saveWidgets(next);
  };

  const handleMoveUp = (id: DashboardWidgetId) => {
    const idx = widgets.findIndex(w => w.id === id);
    if (idx <= 0) return;
    const next = [...widgets];
    const item = next.splice(idx, 1)[0];
    next.splice(idx - 1, 0, item);
    saveWidgets(next);
  };

  const handleMoveDown = (id: DashboardWidgetId) => {
    const idx = widgets.findIndex(w => w.id === id);
    if (idx === -1 || idx >= widgets.length - 1) return;
    const next = [...widgets];
    const item = next.splice(idx, 1)[0];
    next.splice(idx + 1, 0, item);
    saveWidgets(next);
  };

  const handleResetLayout = () => {
    setWidgets(DEFAULT_WIDGETS);
    setShowQuickStats(true);
    setIsCompact(false);
    localStorage.removeItem(STORAGE_KEY_WIDGETS);
    localStorage.removeItem(STORAGE_KEY_STATS);
    localStorage.removeItem(STORAGE_KEY_COMPACT);
  };

  const handleToggleQuickStats = () => {
    const next = !showQuickStats;
    setShowQuickStats(next);
    localStorage.setItem(STORAGE_KEY_STATS, JSON.stringify(next));
  };

  const handleToggleCompact = () => {
    const next = !isCompact;
    setIsCompact(next);
    localStorage.setItem(STORAGE_KEY_COMPACT, JSON.stringify(next));
  };

  // Quick Action Handlers
  const handleCompleteChore = async (choreId: number) => {
    try {
      const updated = await api.completeChore(choreId);
      setChores(prev => prev.map(c => (c.id === choreId ? updated : c)));
    } catch (err) {
      console.error('Failed to complete chore:', err);
    }
  };

  const handleToggleShoppingItem = async (itemId: number) => {
    try {
      const item = shoppingItems.find(i => i.id === itemId);
      if (!item) return;
      const updated = await api.updateShoppingItem(itemId, { is_checked: !item.is_checked });
      setShoppingItems(prev => prev.map(i => (i.id === itemId ? updated : i)));
    } catch (err) {
      console.error('Failed to toggle shopping item:', err);
    }
  };

  const handleAddShoppingItem = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = newShoppingName.trim();
    if (!trimmed || isAddingShopping) return;

    try {
      setIsAddingShopping(true);
      const created = await api.createShoppingItem({
        name: trimmed,
        is_checked: false,
      });
      setShoppingItems(prev => [created, ...prev]);
      setNewShoppingName('');
    } catch (err) {
      console.error('Failed to add shopping item:', err);
    } finally {
      setIsAddingShopping(false);
    }
  };

  const handleWaterPlant = async (plantId: number) => {
    try {
      const updated = await api.waterPlant(plantId);
      setPlants(prev => prev.map(p => (p.id === plantId ? updated : p)));
    } catch (err) {
      console.error('Failed to water plant:', err);
    }
  };

  // Derived Calculations
  const activeChores = useMemo(() => {
    return chores.filter(c => c.is_active);
  }, [chores]);

  const pendingShopping = useMemo(() => {
    return shoppingItems.filter(i => !i.is_checked);
  }, [shoppingItems]);

  const thirstyPlants = useMemo(() => {
    return plants.filter(p => (p.days_until_watering ?? 0) <= 0);
  }, [plants]);

  const urgentMedicines = useMemo(() => {
    const expired = medicines.filter(m => m.expiration_status === 'expired');
    const expiringSoon = medicines.filter(m => m.expiration_status === 'warning' || (!m.expiration_status && (m.days_until_expiration ?? 999) <= 30));
    return { expired, expiringSoon };
  }, [medicines]);

  const upcomingSubscriptions = useMemo(() => {
    return subscriptions
      .filter(s => s.is_active)
      .slice(0, 4);
  }, [subscriptions]);

  const suggestedRecipe = useMemo(() => {
    if (recipes.length === 0) return null;
    // pick one random recipe or favorite
    const favs = recipes.filter(r => r.is_favorite);
    if (favs.length > 0) return favs[Math.floor(Math.random() * favs.length)];
    return recipes[0];
  }, [recipes]);

  // Loading Screen
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-orange-500/10 text-orange-600 flex items-center justify-center animate-pulse">
          <LayoutDashboard className="w-6 h-6" />
        </div>
        <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
          {t('common.loading')}
        </p>
      </div>
    );
  }

  // Active enabled widgets in ordered sequence
  const activeWidgets = widgets.filter(w => w.enabled);

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
              {t('dashboard.title')}
            </h1>
            {designStyle === 'terminal' && (
              <span className="text-xs font-mono px-2 py-0.5 border border-emerald-500 text-emerald-500 bg-emerald-950/40">
                [LIVE_MONITOR]
              </span>
            )}
            {designStyle === 'monochrome' && (
              <span className="text-xs font-mono px-2 py-0.5 border border-zinc-400 dark:border-zinc-600 text-zinc-800 dark:text-zinc-200 bg-zinc-200/60 dark:bg-zinc-800 tracking-wider">
                MONO // OVERVIEW
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            {t('dashboard.subtitle')}
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => loadDashboardData(true)}
            disabled={isRefreshing}
            className="p-2.5 rounded-2xl border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition disabled:opacity-50"
            title={t('dashboard.refresh')}
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-orange-500' : ''}`} />
          </button>

          <button
            onClick={() => setIsPanicModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-rose-500/10 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 font-bold text-xs transition active:scale-95"
          >
            <Flame className="w-4 h-4" />
            <span className="hidden sm:inline">{t('dashboard.panic_mode')}</span>
          </button>

          <button
            onClick={() => setIsCustomizeOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-white dark:bg-zinc-850 border border-zinc-200 dark:border-zinc-750 text-zinc-750 dark:text-zinc-200 hover:border-orange-400 text-xs font-semibold shadow-xs transition"
          >
            <SlidersHorizontal className="w-4 h-4 text-orange-500" />
            <span>{t('dashboard.customize')}</span>
          </button>
        </div>
      </div>

      {/* 1. Quick Stats (KPI Bar) */}
      {showQuickStats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
          {/* Shopping Count */}
          <Link
            to="/shopping"
            className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs hover:border-orange-400 hover:shadow-md transition group"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                {t('dashboard.stats.shopping_count')}
              </span>
              <div className="p-2 rounded-xl bg-orange-100 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 group-hover:scale-110 transition">
                <ShoppingCart className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                {pendingShopping.length}
              </span>
              <span className="text-xs text-zinc-400">
                {t('dashboard.stats.shopping_unit')}
              </span>
            </div>
          </Link>

          {/* Chores Pending */}
          <Link
            to="/chores"
            className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs hover:border-blue-400 hover:shadow-md transition group"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                {t('dashboard.stats.chores_count')}
              </span>
              <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition">
                <CheckSquare className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                {activeChores.length}
              </span>
              <span className="text-xs text-zinc-400">
                {t('dashboard.stats.chores_unit')}
              </span>
            </div>
          </Link>

          {/* Thirsty Plants */}
          <Link
            to="/plants"
            className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs hover:border-emerald-400 hover:shadow-md transition group"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                {t('dashboard.stats.plants_count')}
              </span>
              <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition">
                <Flower2 className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                {thirstyPlants.length}
              </span>
              <span className="text-xs text-zinc-400">
                {t('dashboard.stats.plants_unit')}
              </span>
            </div>
          </Link>

          {/* Medicine Alert */}
          <Link
            to="/medicines"
            className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs hover:border-rose-400 hover:shadow-md transition group"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                {t('dashboard.stats.medicines_alert')}
              </span>
              <div
                className={`p-2 rounded-xl group-hover:scale-110 transition ${
                  (medicineStats?.expired_count ?? 0) > 0
                    ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400'
                    : 'bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400'
                }`}
              >
                <HeartPulse className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                {(medicineStats?.expired_count ?? 0) + (medicineStats?.expiring_soon_count ?? 0)}
              </span>
              <span className="text-xs text-zinc-400">
                {t('dashboard.stats.medicines_unit')}
              </span>
            </div>
          </Link>

          {/* Monthly Finance Balance */}
          <Link
            to="/finance"
            className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs hover:border-purple-400 hover:shadow-md transition group col-span-2 sm:col-span-1"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                {t('dashboard.stats.monthly_balance')}
              </span>
              <div className="p-2 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 group-hover:scale-110 transition">
                <Wallet className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span
                className={`text-xl sm:text-2xl font-bold ${
                  (financeSummary?.net_balance ?? 0) >= 0
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-rose-600 dark:text-rose-400'
                }`}
              >
                {Math.round(financeSummary?.net_balance ?? 0).toLocaleString()}
              </span>
              <span className="text-xs text-zinc-400">
                {t('dashboard.stats.monthly_balance_unit')}
              </span>
            </div>
          </Link>
        </div>
      )}

      {/* 2. Main Customizable Grid */}
      <div
        className={`grid gap-4 sm:gap-6 ${
          isCompact
            ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
            : 'grid-cols-1 lg:grid-cols-2'
        }`}
      >
        {activeWidgets.map(w => {
          switch (w.id) {
            // --- CHORES WIDGET ---
            case 'chores':
              return (
                <div
                  key="chores"
                  className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 p-5 shadow-xs flex flex-col"
                >
                  <div className="flex items-center justify-between pb-3.5 border-b border-zinc-100 dark:border-zinc-800/80 mb-3.5">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400">
                        <CheckSquare className="w-4 h-4" />
                      </div>
                      <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                        {t('dashboard.widgets.chores')}
                      </h2>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-semibold">
                        {activeChores.length}
                      </span>
                    </div>

                    <Link
                      to="/chores"
                      className="text-xs font-semibold text-orange-600 dark:text-orange-400 hover:text-orange-700 flex items-center gap-1 transition"
                    >
                      <span>{t('dashboard.view_all')}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>

                  {activeChores.length === 0 ? (
                    <div className="py-8 text-center text-zinc-400 dark:text-zinc-500 text-xs flex-1 flex flex-col items-center justify-center">
                      <div className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-500 flex items-center justify-center mb-2">
                        <CheckCircle2 className="w-5 h-5" />
                      </div>
                      <p>{t('dashboard.chores.empty')}</p>
                    </div>
                  ) : (
                    <div className="space-y-2 flex-1">
                      {activeChores.slice(0, 4).map(chore => (
                        <div
                          key={chore.id}
                          className="flex items-center justify-between p-2.5 rounded-2xl bg-zinc-50 dark:bg-zinc-850/60 border border-zinc-100 dark:border-zinc-800/60 hover:border-blue-300 transition group"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <button
                              type="button"
                              onClick={() => handleCompleteChore(chore.id)}
                              className="w-5 h-5 rounded-lg border-2 border-zinc-300 dark:border-zinc-600 group-hover:border-blue-500 flex items-center justify-center transition shrink-0"
                              title={t('dashboard.chores.complete_tooltip')}
                            >
                              <div className="w-2.5 h-2.5 rounded-sm bg-blue-500 opacity-0 group-hover:opacity-100 transition" />
                            </button>
                            <div className="min-w-0">
                              <p className="text-xs font-medium text-zinc-800 dark:text-zinc-200 truncate">
                                {chore.title}
                              </p>
                              <div className="flex items-center gap-2 text-[10px] text-zinc-400">
                                {chore.room && <span>📍 {chore.room}</span>}
                                {chore.points > 0 && (
                                  <span className="text-amber-500 font-bold">
                                    +{chore.points} b
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-200/60 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 shrink-0 font-medium">
                            {chore.current_assignee?.display_name || (chore.current_assignee_id ? `Člen #${chore.current_assignee_id}` : 'Všichni')}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Quick button to panic mode */}
                  <div className="pt-3 mt-3 border-t border-zinc-100 dark:border-zinc-800/80">
                    <button
                      type="button"
                      onClick={() => setIsPanicModalOpen(true)}
                      className="w-full py-2 px-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 font-semibold text-xs hover:bg-rose-100 dark:hover:bg-rose-950/60 transition flex items-center justify-center gap-2"
                    >
                      <Flame className="w-3.5 h-3.5 text-rose-500" />
                      <span>{t('dashboard.chores.panic_btn')}</span>
                    </button>
                  </div>
                </div>
              );

            // --- SHOPPING WIDGET ---
            case 'shopping':
              return (
                <div
                  key="shopping"
                  className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 p-5 shadow-xs flex flex-col"
                >
                  <div className="flex items-center justify-between pb-3.5 border-b border-zinc-100 dark:border-zinc-800/80 mb-3.5">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-xl bg-orange-50 dark:bg-orange-950/50 text-orange-600 dark:text-orange-400">
                        <ShoppingCart className="w-4 h-4" />
                      </div>
                      <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                        {t('dashboard.widgets.shopping')}
                      </h2>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-orange-100 dark:bg-orange-950 text-orange-700 dark:text-orange-300 font-semibold">
                        {pendingShopping.length}
                      </span>
                    </div>

                    <Link
                      to="/shopping"
                      className="text-xs font-semibold text-orange-600 dark:text-orange-400 hover:text-orange-700 flex items-center gap-1 transition"
                    >
                      <span>{t('dashboard.view_all')}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>

                  {/* Inline Quick Add Item */}
                  <form onSubmit={handleAddShoppingItem} className="flex gap-2 mb-3">
                    <input
                      type="text"
                      value={newShoppingName}
                      onChange={e => setNewShoppingName(e.target.value)}
                      placeholder={t('dashboard.shopping.placeholder')}
                      className="flex-1 px-3 py-2 text-xs rounded-xl bg-zinc-50 dark:bg-zinc-850 border border-zinc-200 dark:border-zinc-750 text-zinc-800 dark:text-zinc-200 focus:outline-hidden focus:border-orange-500"
                    />
                    <button
                      type="submit"
                      disabled={isAddingShopping || !newShoppingName.trim()}
                      className="px-3 py-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-40 text-white rounded-xl text-xs font-semibold transition shrink-0 flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>{t('dashboard.add')}</span>
                    </button>
                  </form>

                  {pendingShopping.length === 0 ? (
                    <div className="py-6 text-center text-zinc-400 dark:text-zinc-500 text-xs flex-1 flex flex-col items-center justify-center">
                      <div className="w-10 h-10 rounded-full bg-orange-50 dark:bg-orange-950/40 text-orange-500 flex items-center justify-center mb-2">
                        <CheckCircle2 className="w-5 h-5" />
                      </div>
                      <p>{t('dashboard.shopping.empty')}</p>
                    </div>
                  ) : (
                    <div className="space-y-1.5 flex-1 overflow-y-auto max-h-[190px]">
                      {pendingShopping.slice(0, 5).map(item => (
                        <div
                          key={item.id}
                          onClick={() => handleToggleShoppingItem(item.id)}
                          className="flex items-center justify-between p-2 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-850 border border-transparent hover:border-zinc-200 dark:hover:border-zinc-800 cursor-pointer transition"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <input
                              type="checkbox"
                              checked={item.is_checked}
                              onChange={() => {}}
                              className="w-4 h-4 rounded text-orange-600 accent-orange-500 cursor-pointer shrink-0"
                            />
                            <span className="text-xs font-medium text-zinc-800 dark:text-zinc-200 truncate">
                              {item.name}
                            </span>
                          </div>
                          {item.amount && (
                            <span className="text-[10px] text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-full shrink-0">
                              {item.amount} {item.unit || ''}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );

            // --- PLANTS WIDGET ---
            case 'plants':
              return (
                <div
                  key="plants"
                  className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 p-5 shadow-xs flex flex-col"
                >
                  <div className="flex items-center justify-between pb-3.5 border-b border-zinc-100 dark:border-zinc-800/80 mb-3.5">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
                        <Flower2 className="w-4 h-4" />
                      </div>
                      <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                        {t('dashboard.widgets.plants')}
                      </h2>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-semibold">
                        {thirstyPlants.length}
                      </span>
                    </div>

                    <Link
                      to="/plants"
                      className="text-xs font-semibold text-orange-600 dark:text-orange-400 hover:text-orange-700 flex items-center gap-1 transition"
                    >
                      <span>{t('dashboard.view_all')}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>

                  {thirstyPlants.length === 0 ? (
                    <div className="py-8 text-center text-zinc-400 dark:text-zinc-500 text-xs flex-1 flex flex-col items-center justify-center">
                      <div className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-500 flex items-center justify-center mb-2">
                        <Droplet className="w-5 h-5" />
                      </div>
                      <p>{t('dashboard.plants.empty')}</p>
                    </div>
                  ) : (
                    <div className="space-y-2 flex-1">
                      {thirstyPlants.slice(0, 4).map(plant => (
                        <div
                          key={plant.id}
                          className="flex items-center justify-between p-2.5 rounded-2xl bg-zinc-50 dark:bg-zinc-850/60 border border-zinc-100 dark:border-zinc-800/60 hover:border-emerald-300 transition"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-xs shrink-0">
                              🌱
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 truncate">
                                {plant.name}
                              </p>
                              <div className="flex items-center gap-2 text-[10px] text-zinc-400">
                                <span>{plant.room || 'Místnost'}</span>
                                <span className="text-rose-500 font-medium">
                                  {plant.days_until_watering < 0
                                    ? t('dashboard.plants.overdue_days', { count: Math.abs(plant.days_until_watering) })
                                    : t('dashboard.plants.due_today')}
                                </span>
                              </div>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleWaterPlant(plant.id)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-xs transition active:scale-95 shrink-0"
                          >
                            <Droplet className="w-3.5 h-3.5" />
                            <span>{t('dashboard.plants.water_now')}</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );

            // --- FINANCES WIDGET ---
            case 'finances':
              return (
                <div
                  key="finances"
                  className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 p-5 shadow-xs flex flex-col"
                >
                  <div className="flex items-center justify-between pb-3.5 border-b border-zinc-100 dark:border-zinc-800/80 mb-3.5">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400">
                        <Wallet className="w-4 h-4" />
                      </div>
                      <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                        {t('dashboard.widgets.finances')}
                      </h2>
                    </div>

                    <Link
                      to="/finance"
                      className="text-xs font-semibold text-orange-600 dark:text-orange-400 hover:text-orange-700 flex items-center gap-1 transition"
                    >
                      <span>{t('dashboard.view_all')}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>

                  {/* Monthly overview card */}
                  <div className="grid grid-cols-3 gap-2 p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-850/60 border border-zinc-100 dark:border-zinc-800/80 mb-3">
                    <div>
                      <span className="text-[10px] text-zinc-400 uppercase font-semibold">
                        {t('dashboard.finances.income')}
                      </span>
                      <p className="text-xs sm:text-sm font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                        +{Math.round(financeSummary?.total_income ?? 0).toLocaleString()} Kč
                      </p>
                    </div>
                    <div>
                      <span className="text-[10px] text-zinc-400 uppercase font-semibold">
                        {t('dashboard.finances.expenses')}
                      </span>
                      <p className="text-xs sm:text-sm font-bold text-rose-600 dark:text-rose-400 mt-0.5">
                        -{Math.round(financeSummary?.total_expense ?? 0).toLocaleString()} Kč
                      </p>
                    </div>
                    <div>
                      <span className="text-[10px] text-zinc-400 uppercase font-semibold">
                        {t('dashboard.finances.balance')}
                      </span>
                      <p
                        className={`text-xs sm:text-sm font-bold mt-0.5 ${
                          (financeSummary?.net_balance ?? 0) >= 0
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-rose-600 dark:text-rose-400'
                        }`}
                      >
                        {Math.round(financeSummary?.net_balance ?? 0).toLocaleString()} Kč
                      </p>
                    </div>
                  </div>

                  {/* Upcoming Subscriptions */}
                  <div className="flex-1">
                    <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-2">
                      {t('dashboard.finances.upcoming_subs')}
                    </p>
                    {upcomingSubscriptions.length === 0 ? (
                      <p className="text-xs text-zinc-400 py-2">
                        {t('dashboard.finances.no_subs')}
                      </p>
                    ) : (
                      <div className="space-y-1.5">
                        {upcomingSubscriptions.map(sub => (
                          <div
                            key={sub.id}
                            className="flex items-center justify-between p-2 rounded-xl bg-zinc-50 dark:bg-zinc-850/40 text-xs"
                          >
                            <span className="font-medium text-zinc-700 dark:text-zinc-300 truncate">
                              {sub.name}
                            </span>
                            <span className="font-bold text-zinc-900 dark:text-zinc-100 shrink-0">
                              {sub.amount} Kč
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );

            // --- MEDICINES WIDGET ---
            case 'medicines':
              return (
                <div
                  key="medicines"
                  className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 p-5 shadow-xs flex flex-col"
                >
                  <div className="flex items-center justify-between pb-3.5 border-b border-zinc-100 dark:border-zinc-800/80 mb-3.5">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400">
                        <HeartPulse className="w-4 h-4" />
                      </div>
                      <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                        {t('dashboard.widgets.medicines')}
                      </h2>
                    </div>

                    <Link
                      to="/medicines"
                      className="text-xs font-semibold text-orange-600 dark:text-orange-400 hover:text-orange-700 flex items-center gap-1 transition"
                    >
                      <span>{t('dashboard.view_all')}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>

                  {/* Expiration alert banner */}
                  {(medicineStats?.expired_count ?? 0) > 0 || (medicineStats?.expiring_soon_count ?? 0) > 0 ? (
                    <div className="space-y-2 mb-3">
                      {(medicineStats?.expired_count ?? 0) > 0 && (
                        <div className="flex items-center justify-between p-2.5 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-800 dark:text-rose-300 font-semibold">
                          <div className="flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 text-rose-500" />
                            <span>{t('dashboard.medicines.expired_count')}</span>
                          </div>
                          <span className="px-2 py-0.5 rounded-full bg-rose-200 dark:bg-rose-900 text-rose-900 dark:text-rose-100 font-bold">
                            {medicineStats?.expired_count}
                          </span>
                        </div>
                      )}

                      {(medicineStats?.expiring_soon_count ?? 0) > 0 && (
                        <div className="flex items-center justify-between p-2.5 rounded-2xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-900/60 text-xs text-amber-800 dark:text-amber-300 font-semibold">
                          <div className="flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 text-amber-500" />
                            <span>{t('dashboard.medicines.expiring_soon')}</span>
                          </div>
                          <span className="px-2 py-0.5 rounded-full bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-100 font-bold">
                            {medicineStats?.expiring_soon_count}
                          </span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-900/40 text-xs text-emerald-800 dark:text-emerald-300 font-medium mb-3 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span>{t('dashboard.medicines.all_ok')}</span>
                    </div>
                  )}

                  {/* Active Schedules Today */}
                  <div className="flex-1">
                    <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-2">
                      {t('dashboard.medicines.schedules_today')}
                    </p>
                    {medSchedules.length === 0 ? (
                      <p className="text-xs text-zinc-400 py-1">
                        {t('dashboard.medicines.no_schedules')}
                      </p>
                    ) : (
                      <div className="space-y-1.5">
                        {medSchedules.slice(0, 3).map(schedule => (
                          <div
                            key={schedule.id}
                            className="flex items-center justify-between p-2 rounded-xl bg-zinc-50 dark:bg-zinc-850/40 text-xs"
                          >
                            <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                              {schedule.medicine_name || `Lék #${schedule.medicine_id}`}
                            </span>
                            <span className="text-[10px] text-zinc-400">
                              {schedule.dosage_per_take} · {schedule.times_per_day}x denně
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );

            // --- PETS WIDGET ---
            case 'pets':
              return (
                <div
                  key="pets"
                  className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 p-5 shadow-xs flex flex-col"
                >
                  <div className="flex items-center justify-between pb-3.5 border-b border-zinc-100 dark:border-zinc-800/80 mb-3.5">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400">
                        <Dog className="w-4 h-4" />
                      </div>
                      <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                        {t('dashboard.widgets.pets')}
                      </h2>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 font-semibold">
                        {pets.length}
                      </span>
                    </div>

                    <Link
                      to="/pets"
                      className="text-xs font-semibold text-orange-600 dark:text-orange-400 hover:text-orange-700 flex items-center gap-1 transition"
                    >
                      <span>{t('dashboard.view_all')}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>

                  {pets.length === 0 ? (
                    <div className="py-8 text-center text-zinc-400 dark:text-zinc-500 text-xs flex-1 flex flex-col items-center justify-center">
                      <p>{t('dashboard.pets.empty')}</p>
                    </div>
                  ) : (
                    <div className="space-y-2 flex-1">
                      {pets.slice(0, 3).map(pet => (
                        <Link
                          key={pet.id}
                          to={`/pets/${pet.id}`}
                          className="flex items-center justify-between p-2.5 rounded-2xl bg-zinc-50 dark:bg-zinc-850/60 border border-zinc-100 dark:border-zinc-800/60 hover:border-amber-300 transition"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold text-xs shrink-0">
                              🐾
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-zinc-800 dark:text-zinc-200 truncate">
                                {pet.name}
                              </p>
                              <p className="text-[10px] text-zinc-400 truncate">
                                {pet.species} {pet.breed ? `· ${pet.breed}` : ''}
                              </p>
                            </div>
                          </div>

                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-semibold">
                            {t('dashboard.pets.status_ok')}
                          </span>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              );

            // --- VEHICLES WIDGET ---
            case 'vehicles':
              return (
                <div
                  key="vehicles"
                  className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 p-5 shadow-xs flex flex-col"
                >
                  <div className="flex items-center justify-between pb-3.5 border-b border-zinc-100 dark:border-zinc-800/80 mb-3.5">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-xl bg-cyan-50 dark:bg-cyan-950/50 text-cyan-600 dark:text-cyan-400">
                        <Car className="w-4 h-4" />
                      </div>
                      <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                        {t('dashboard.widgets.vehicles')}
                      </h2>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-100 dark:bg-cyan-950 text-cyan-700 dark:text-cyan-300 font-semibold">
                        {vehicles.length}
                      </span>
                    </div>

                    <Link
                      to="/vehicles"
                      className="text-xs font-semibold text-orange-600 dark:text-orange-400 hover:text-orange-700 flex items-center gap-1 transition"
                    >
                      <span>{t('dashboard.view_all')}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>

                  {vehicles.length === 0 ? (
                    <div className="py-8 text-center text-zinc-400 dark:text-zinc-500 text-xs flex-1 flex flex-col items-center justify-center">
                      <p>{t('dashboard.vehicles.empty')}</p>
                    </div>
                  ) : (
                    <div className="space-y-2 flex-1">
                      {vehicles.slice(0, 3).map(v => (
                        <Link
                          key={v.id}
                          to={`/vehicles/${v.id}`}
                          className="flex items-center justify-between p-2.5 rounded-2xl bg-zinc-50 dark:bg-zinc-850/60 border border-zinc-100 dark:border-zinc-800/60 hover:border-cyan-300 transition"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-8 h-8 rounded-xl bg-cyan-100 dark:bg-cyan-950 text-cyan-600 dark:text-cyan-400 flex items-center justify-center font-bold text-xs shrink-0">
                              🚗
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-zinc-800 dark:text-zinc-200 truncate">
                                {v.make} {v.model}
                              </p>
                              <p className="text-[10px] text-zinc-400 truncate font-mono">
                                {v.license_plate} · {v.current_mileage?.toLocaleString() || 0} km
                              </p>
                            </div>
                          </div>

                          {v.mot_expiry_date && (
                            <span
                              className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                                v.mot_status === 'expired'
                                  ? 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300'
                                  : v.mot_status === 'warning'
                                  ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
                                  : 'bg-zinc-200/60 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
                              }`}
                            >
                              STK {new Date(v.mot_expiry_date).toLocaleDateString()}
                            </span>
                          )}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              );

            // --- ACTIVITY FEED WIDGET ---
            case 'activity':
              return (
                <div
                  key="activity"
                  className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 p-5 shadow-xs flex flex-col"
                >
                  <div className="flex items-center justify-between pb-3.5 border-b border-zinc-100 dark:border-zinc-800/80 mb-3.5">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400">
                        <History className="w-4 h-4" />
                      </div>
                      <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                        {t('dashboard.widgets.activity')}
                      </h2>
                    </div>

                    <Link
                      to="/activity"
                      className="text-xs font-semibold text-orange-600 dark:text-orange-400 hover:text-orange-700 flex items-center gap-1 transition"
                    >
                      <span>{t('dashboard.view_all')}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>

                  {activities.length === 0 ? (
                    <div className="py-8 text-center text-zinc-400 dark:text-zinc-500 text-xs flex-1 flex flex-col items-center justify-center">
                      <p>{t('dashboard.activity.empty')}</p>
                    </div>
                  ) : (
                    <div className="space-y-2 flex-1">
                      {activities.slice(0, 4).map(act => (
                        <div
                          key={act.id}
                          className="flex items-start gap-2.5 p-2 rounded-xl text-xs hover:bg-zinc-50 dark:hover:bg-zinc-850/40 transition"
                        >
                          <div className="w-2 h-2 rounded-full bg-orange-500 mt-1.5 shrink-0" />
                          <div className="min-w-0 flex-1">
                            <p className="text-zinc-800 dark:text-zinc-200 font-medium line-clamp-1">
                              {act.description}
                            </p>
                            <span className="text-[10px] text-zinc-400">
                              {new Date(act.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · {act.user_name || 'Systém'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );

            // --- RECIPE INSPIRATION WIDGET ---
            case 'recipe_tip':
              return (
                <div
                  key="recipe_tip"
                  className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 p-5 shadow-xs flex flex-col"
                >
                  <div className="flex items-center justify-between pb-3.5 border-b border-zinc-100 dark:border-zinc-800/80 mb-3.5">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400">
                        <UtensilsCrossed className="w-4 h-4" />
                      </div>
                      <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                        {t('dashboard.recipe_tip.title')}
                      </h2>
                    </div>

                    <Link
                      to="/recipes"
                      className="text-xs font-semibold text-orange-600 dark:text-orange-400 hover:text-orange-700 flex items-center gap-1 transition"
                    >
                      <span>{t('dashboard.view_all')}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>

                  {!suggestedRecipe ? (
                    <div className="py-8 text-center text-zinc-400 dark:text-zinc-500 text-xs flex-1 flex flex-col items-center justify-center">
                      <p>{t('dashboard.recipe_tip.no_recipes')}</p>
                    </div>
                  ) : (
                    <div className="flex-1 flex flex-col">
                      <div className="flex items-center gap-3 mb-3">
                        {suggestedRecipe.image_url ? (
                          <img
                            src={suggestedRecipe.image_url}
                            alt={suggestedRecipe.title}
                            className="w-16 h-16 rounded-2xl object-cover shrink-0 border border-zinc-200 dark:border-zinc-800"
                          />
                        ) : (
                          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500/20 to-orange-500/20 text-orange-500 flex items-center justify-center text-2xl shrink-0">
                            🍲
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 truncate">
                            {suggestedRecipe.title}
                          </h3>
                          <div className="flex items-center gap-3 text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                            {suggestedRecipe.prep_time_minutes ? (
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3 text-zinc-400" />
                                {suggestedRecipe.prep_time_minutes} min
                              </span>
                            ) : null}
                            {suggestedRecipe.difficulty && (
                              <span className="capitalize">{suggestedRecipe.difficulty}</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="mt-auto">
                        <Link
                          to={`/recipes/${suggestedRecipe.id}`}
                          className="w-full py-2 px-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-semibold text-xs shadow-sm transition flex items-center justify-center gap-1.5"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>{t('dashboard.recipe_tip.view_recipe')}</span>
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              );

            default:
              return null;
          }
        })}
      </div>

      {/* Customization Modal */}
      <DashboardCustomizeModal
        isOpen={isCustomizeOpen}
        onClose={() => setIsCustomizeOpen(false)}
        widgets={widgets}
        onToggleWidget={handleToggleWidget}
        onMoveUp={handleMoveUp}
        onMoveDown={handleMoveDown}
        onReset={handleResetLayout}
        showQuickStats={showQuickStats}
        onToggleQuickStats={handleToggleQuickStats}
        isCompact={isCompact}
        onToggleCompact={handleToggleCompact}
      />

      {/* Panic Mode Modal */}
      <ChorePanicModal
        isOpen={isPanicModalOpen}
        onClose={() => setIsPanicModalOpen(false)}
        tasks={panicTasks}
        onCompleteTask={handleCompleteChore}
      />
    </div>
  );
};
