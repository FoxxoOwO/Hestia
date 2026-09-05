import React, { useState, useEffect } from 'react';
import {
  Pill, Plus, Search, Filter, AlertTriangle, Snowflake, ShieldAlert,
  ShoppingCart, Calendar, Clock, CheckCircle2, Trash2, Edit, ExternalLink,
  Baby, HeartPulse, Sparkles, MapPin, ChevronRight, PhoneCall, Check, Minus
} from 'lucide-react';
import { api } from '../services/api';
import {
  Medicine, MedicineStats, MedicationSchedule, MedicationLog,
  MedicineCategory, MedicineLocation, User
} from '../types';
import { useTranslation } from '../i18n';
import { MedicineEditModal } from '../components/MedicineEditModal';
import { MedicationScheduleModal } from '../components/MedicationScheduleModal';
import { PediatricDosageModal } from '../components/PediatricDosageModal';
import { FirstAidGuideModal } from '../components/FirstAidGuideModal';

export const MedicinesPage: React.FC = () => {
  const { t } = useTranslation();

  // State
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [stats, setStats] = useState<MedicineStats | null>(null);
  const [schedules, setSchedules] = useState<MedicationSchedule[]>([]);
  const [logs, setLogs] = useState<MedicationLog[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // Tabs & filters
  const [activeTab, setActiveTab] = useState<'inventory' | 'schedules' | 'first_aid' | 'calculator'>('inventory');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedLocation, setSelectedLocation] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all'); // all, expired, warning, low_stock

  // Modals
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingMedicine, setEditingMedicine] = useState<Medicine | null>(null);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<MedicationSchedule | null>(null);
  const [isPediatricModalOpen, setIsPediatricModalOpen] = useState(false);
  const [isFirstAidModalOpen, setIsFirstAidModalOpen] = useState(false);
  const [selectedGuideId, setSelectedGuideId] = useState<string | null>(null);

  // Quick feedback toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [medsData, statsData, schedsData, logsData] = await Promise.all([
        api.getMedicines(),
        api.getMedicineStats(),
        api.getMedicationSchedules(),
        api.getMedicationLogs({ limit: 15 })
      ]);
      setMedicines(medsData);
      setStats(statsData);
      setSchedules(schedsData);
      setLogs(logsData);
    } catch (err) {
      console.error('Failed to load medicines data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filtered medicines
  const filteredMedicines = medicines.filter((m) => {
    const matchesSearch =
      !searchQuery ||
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.active_substance && m.active_substance.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (m.notes && m.notes.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory = selectedCategory === 'all' || m.category === selectedCategory;
    const matchesLocation = selectedLocation === 'all' || m.location === selectedLocation;

    let matchesStatus = true;
    if (filterStatus === 'expired') {
      matchesStatus = m.expiration_status === 'expired' || m.after_opening_expired;
    } else if (filterStatus === 'warning') {
      matchesStatus = m.expiration_status === 'warning';
    } else if (filterStatus === 'low_stock') {
      matchesStatus = m.is_low_stock;
    }

    return matchesSearch && matchesCategory && matchesLocation && matchesStatus;
  });

  // Action: Add to shopping list
  const handleAddToShopping = async (med: Medicine) => {
    try {
      const res = await api.addMedicineToShopping(med.id);
      showToast(`Položka "${med.name}" byla přidána do nákupního seznamu.`);
    } catch (err: any) {
      showToast(`Chyba: ${err.message || 'Nepodařilo se přidat do nákupu'}`);
    }
  };

  // Action: Mark as opened today
  const handleMarkOpened = async (med: Medicine) => {
    try {
      await api.markMedicineOpened(med.id);
      showToast(`Balení "${med.name}" označeno jako otevřené dnes.`);
      loadData();
    } catch (err: any) {
      showToast('Chyba při označení otevření.');
    }
  };

  // Action: Adjust stock
  const handleAdjustStock = async (med: Medicine, delta: number) => {
    try {
      await api.adjustMedicineStock(med.id, delta);
      loadData();
    } catch (err: any) {
      showToast('Chyba při změně množství.');
    }
  };

  // Action: Delete medicine
  const handleDeleteMedicine = async (med: Medicine) => {
    if (!window.confirm(`Opravdu chcete smazat "${med.name}" z lékárničky?`)) return;
    try {
      await api.deleteMedicine(med.id);
      showToast(`"${med.name}" byl smazán.`);
      loadData();
    } catch (err: any) {
      showToast('Chyba při mazání léku.');
    }
  };

  // Action: Save medicine modal
  const handleSaveMedicine = async (data: any) => {
    if (editingMedicine) {
      await api.updateMedicine(editingMedicine.id, data);
      showToast(`Lék "${data.name}" byl aktualizován.`);
    } else {
      await api.createMedicine(data);
      showToast(`Lék "${data.name}" byl přidán do lékárničky.`);
    }
    loadData();
  };

  // Action: Save schedule modal
  const handleSaveSchedule = async (data: any) => {
    if (editingSchedule) {
      await api.updateMedicationSchedule(editingSchedule.id, data);
      showToast('Rozvrh byl upraven.');
    } else {
      await api.createMedicationSchedule(data);
      showToast('Nový plán užívání léků aktivován.');
    }
    loadData();
  };

  // Action: Delete schedule
  const handleDeleteSchedule = async (schedId: number) => {
    if (!window.confirm('Opravdu chcete zrušit tento plán užívání?')) return;
    try {
      await api.deleteMedicationSchedule(schedId);
      showToast('Plán byl zrušen.');
      loadData();
    } catch (err: any) {
      showToast('Chyba při rušení plánu.');
    }
  };

  // Action: Take medication dose today
  const handleTakeDose = async (sched: MedicationSchedule) => {
    try {
      await api.createMedicationLog({
        schedule_id: sched.id,
        medicine_id: sched.medicine_id,
        user_id: sched.user_id,
        time_slot: sched.time_slots[0] || 'morning',
        dose_taken: sched.dosage_per_take,
        status: 'taken',
        decrement_stock: true,
        notes: 'Užito včas.'
      });
      showToast(`Dávka léku "${sched.medicine_name}" byla zaznamenána jako užitá.`);
      loadData();
    } catch (err: any) {
      showToast('Chyba při zápisu dávky.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 px-5 py-3 rounded-2xl shadow-xl border border-zinc-700 dark:border-zinc-300 text-sm font-medium flex items-center gap-2 animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 dark:text-emerald-600" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400">
              <Pill className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-zinc-100">
                {t('medicines.title')}
              </h1>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                {t('medicines.subtitle')}
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setIsPediatricModalOpen(true)}
            className="px-4 py-2.5 rounded-xl border border-emerald-300 dark:border-emerald-800/60 bg-emerald-50/70 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 font-semibold text-xs flex items-center gap-2 hover:bg-emerald-100 transition-all shadow-sm"
          >
            <Baby className="w-4 h-4" />
            <span>Dětská kalkulačka dávek</span>
          </button>

          <button
            onClick={() => setIsFirstAidModalOpen(true)}
            className="px-4 py-2.5 rounded-xl border border-rose-300 dark:border-rose-800/60 bg-rose-50/70 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300 font-semibold text-xs flex items-center gap-2 hover:bg-rose-100 transition-all shadow-sm"
          >
            <HeartPulse className="w-4 h-4" />
            <span>SOS První pomoc & TIS</span>
          </button>

          <button
            onClick={() => {
              setEditingMedicine(null);
              setIsEditModalOpen(true);
            }}
            className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white font-semibold text-xs flex items-center gap-2 shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Přidat lék / materiál</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Bar */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm">
            <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 block">
              Celkem zásob
            </span>
            <span className="text-2xl font-black text-zinc-900 dark:text-zinc-100 mt-1 block">
              {stats.total_items} ks
            </span>
          </div>

          <div
            onClick={() => setFilterStatus(filterStatus === 'expired' ? 'all' : 'expired')}
            className={`p-4 rounded-2xl border shadow-sm cursor-pointer transition-all ${
              stats.expired_count > 0
                ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800/60 text-rose-900 dark:text-rose-100'
                : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100'
            }`}
          >
            <span className="text-[11px] font-bold uppercase tracking-wider text-rose-500 block">
              Prošlé léky
            </span>
            <span className="text-2xl font-black mt-1 block">
              {stats.expired_count}
            </span>
          </div>

          <div
            onClick={() => setFilterStatus(filterStatus === 'warning' ? 'all' : 'warning')}
            className={`p-4 rounded-2xl border shadow-sm cursor-pointer transition-all ${
              stats.expiring_soon_count > 0
                ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800/60 text-amber-900 dark:text-amber-100'
                : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100'
            }`}
          >
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-500 block">
              Expirace do 60 dní
            </span>
            <span className="text-2xl font-black mt-1 block">
              {stats.expiring_soon_count}
            </span>
          </div>

          <div
            onClick={() => setFilterStatus(filterStatus === 'low_stock' ? 'all' : 'low_stock')}
            className={`p-4 rounded-2xl border shadow-sm cursor-pointer transition-all ${
              stats.low_stock_count > 0
                ? 'bg-orange-50 dark:bg-orange-950/40 border-orange-300 dark:border-orange-800/60 text-orange-900 dark:text-orange-100'
                : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100'
            }`}
          >
            <span className="text-[11px] font-bold uppercase tracking-wider text-orange-500 block">
              Docházející zásoby
            </span>
            <span className="text-2xl font-black mt-1 block">
              {stats.low_stock_count}
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm">
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-500 block flex items-center gap-1">
              <Snowflake className="w-3.5 h-3.5" /> V lednici
            </span>
            <span className="text-2xl font-black text-zinc-900 dark:text-zinc-100 mt-1 block">
              {stats.requires_fridge_count}
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm">
            <span className="text-[11px] font-bold uppercase tracking-wider text-purple-500 block">
              Aktivní rozvrhy
            </span>
            <span className="text-2xl font-black text-zinc-900 dark:text-zinc-100 mt-1 block">
              {stats.active_schedules_count}
            </span>
          </div>
        </div>
      )}

      {/* Main Tabs Navigation */}
      <div className="flex border-b border-zinc-200 dark:border-zinc-800 gap-2">
        <button
          onClick={() => setActiveTab('inventory')}
          className={`py-3 px-5 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'inventory'
              ? 'border-rose-500 text-rose-600 dark:text-rose-400'
              : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
          }`}
        >
          <Pill className="w-4 h-4" />
          <span>Zásoby léků ({filteredMedicines.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('schedules')}
          className={`py-3 px-5 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'schedules'
              ? 'border-rose-500 text-rose-600 dark:text-rose-400'
              : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Dávkovací rozvrh ({schedules.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('first_aid')}
          className={`py-3 px-5 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'first_aid'
              ? 'border-rose-500 text-rose-600 dark:text-rose-400'
              : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
          }`}
        >
          <HeartPulse className="w-4 h-4 text-rose-500" />
          <span>První pomoc & Pohotovost</span>
        </button>

        <button
          onClick={() => setActiveTab('calculator')}
          className={`py-3 px-5 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'calculator'
              ? 'border-rose-500 text-rose-600 dark:text-rose-400'
              : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
          }`}
        >
          <Baby className="w-4 h-4 text-emerald-500" />
          <span>Dětská kalkulačka dávek</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: INVENTORY (ZÁSOBY LÉKŮ) */}
      {/* ========================================================================= */}
      {activeTab === 'inventory' && (
        <div className="space-y-6">
          {/* Search & Filters */}
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                placeholder={t('medicines.search_placeholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 text-zinc-900 dark:text-zinc-100 shadow-sm"
              />
            </div>

            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3.5 py-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 text-zinc-800 dark:text-zinc-200 shadow-sm"
            >
              <option value="all">Všechny kategorie</option>
              <option value="pain_fever">Horečka a bolest</option>
              <option value="cold_cough">Rýma a kašel</option>
              <option value="digestion">Zažívání a žaludek</option>
              <option value="allergy">Alergie a bodnutí</option>
              <option value="injury_disinfection">Poranění a dezinfekce</option>
              <option value="eyes_ears">Oči, uši a zuby</option>
              <option value="chronic_rx">Chronické léky (Rx)</option>
              <option value="vitamins">Vitamíny a doplňky</option>
              <option value="first_aid_material">Zdravotnický materiál</option>
              <option value="other">Ostatní</option>
            </select>

            {/* Location Filter */}
            <select
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="px-3.5 py-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 text-zinc-800 dark:text-zinc-200 shadow-sm"
            >
              <option value="all">Všechna umístění</option>
              <option value="bathroom">Koupelna</option>
              <option value="kitchen">Kuchyň</option>
              <option value="travel_kit">Cestovní lékárnička</option>
              <option value="cottage">Chata / Chalupa</option>
              <option value="car">Autolékárnička</option>
              <option value="bedroom">Ložnice</option>
              <option value="other">Jiné umístění</option>
            </select>

            {/* Reset status filter if active */}
            {filterStatus !== 'all' && (
              <button
                onClick={() => setFilterStatus('all')}
                className="px-3 py-2 text-xs font-semibold rounded-xl bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-300"
              >
                Zrušit filtr stavu ✕
              </button>
            )}
          </div>

          {/* Medicine Cards Grid */}
          {filteredMedicines.length === 0 ? (
            <div className="text-center py-16 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-8">
              <Pill className="w-12 h-12 mx-auto text-zinc-300 dark:text-zinc-700 mb-3" />
              <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                Nebyly nalezeny žádné léky
              </h3>
              <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
                Zkuste změnit vyhledávací dotaz nebo přidejte nový lék či obvaz do lékárničky.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredMedicines.map((med) => {
                const isExpired = med.expiration_status === 'expired' || med.after_opening_expired;
                const isWarning = med.expiration_status === 'warning';

                return (
                  <div
                    key={med.id}
                    className={`p-5 rounded-2xl bg-white dark:bg-zinc-900 border transition-all shadow-sm hover:shadow-md flex flex-col justify-between ${
                      isExpired
                        ? 'border-rose-300 dark:border-rose-900/60 bg-rose-50/20'
                        : isWarning
                        ? 'border-amber-300 dark:border-amber-900/60 bg-amber-50/20'
                        : 'border-zinc-200 dark:border-zinc-800'
                    }`}
                  >
                    <div>
                      {/* Top Badges & Location */}
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300">
                            {t(`medicines.category_${med.category}`)}
                          </span>
                          {med.is_prescription && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300">
                              Rx Předpis
                            </span>
                          )}
                          {med.requires_refrigeration && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 flex items-center gap-1">
                              <Snowflake className="w-3 h-3" /> Lednice
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1 text-[11px] font-semibold text-zinc-500">
                          <MapPin className="w-3.5 h-3.5 text-zinc-400" />
                          <span>{t(`medicines.location_${med.location}`)}</span>
                        </div>
                      </div>

                      {/* Medicine Name & Active Substance */}
                      <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                        {med.name}
                      </h3>
                      {med.active_substance && (
                        <p className="text-xs text-rose-600 dark:text-rose-400 font-medium">
                          {med.active_substance}
                        </p>
                      )}

                      {/* Expiration Semaphore */}
                      <div className="mt-3 p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/60 dark:border-zinc-700/50 text-xs space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-zinc-500">Expirace:</span>
                          <span className={`font-bold flex items-center gap-1 ${
                            isExpired
                              ? 'text-rose-600 dark:text-rose-400'
                              : isWarning
                              ? 'text-amber-600 dark:text-amber-400'
                              : 'text-emerald-600 dark:text-emerald-400'
                          }`}>
                            {med.expiration_date || 'Neuvedeno'}
                            {med.days_until_expiration != null && (
                              <span className="text-[10px]">
                                {med.days_until_expiration < 0
                                  ? `(prošlo před ${Math.abs(med.days_until_expiration)} dny)`
                                  : `(za ${med.days_until_expiration} dní)`}
                              </span>
                            )}
                          </span>
                        </div>

                        {med.opened_date && (
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-zinc-400">Otevřeno:</span>
                            <span className="text-zinc-600 dark:text-zinc-300">
                              {med.opened_date}
                              {med.validity_months_after_opening && ` (max ${med.validity_months_after_opening} měs.)`}
                            </span>
                          </div>
                        )}

                        {med.after_opening_expired && (
                          <p className="text-[11px] font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" /> Prošlé po otevření – vyřadit!
                          </p>
                        )}
                      </div>

                      {/* Dosage notes */}
                      {med.dosage_instructions && (
                        <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-2 line-clamp-2">
                          💬 {med.dosage_instructions}
                        </p>
                      )}
                    </div>

                    {/* Bottom Actions & Stock Controls */}
                    <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800/80 space-y-3">
                      <div className="flex items-center justify-between">
                        {/* Stock Counter with quick +/- */}
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleAdjustStock(med, -1)}
                            className="p-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 text-xs"
                            title="Odebrat 1 ks"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${
                            med.is_low_stock
                              ? 'bg-orange-100 dark:bg-orange-950/60 text-orange-700 dark:text-orange-300'
                              : 'text-zinc-800 dark:text-zinc-200'
                          }`}>
                            {med.current_quantity} {med.unit}
                          </span>
                          <button
                            onClick={() => handleAdjustStock(med, 1)}
                            className="p-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 text-xs"
                            title="Přidat 1 ks"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Quick 1-click add to shopping */}
                        <button
                          onClick={() => handleAddToShopping(med)}
                          className="px-2.5 py-1 rounded-lg text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 flex items-center gap-1 transition-colors"
                          title="Přidat do nákupního seznamu"
                        >
                          <ShoppingCart className="w-3 h-3" />
                          <span>Do nákupu</span>
                        </button>
                      </div>

                      <div className="flex items-center justify-between pt-1 text-xs">
                        <div className="flex items-center gap-2">
                          {!med.opened_date && med.validity_months_after_opening && (
                            <button
                              onClick={() => handleMarkOpened(med)}
                              className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                            >
                              Otevřeno dnes
                            </button>
                          )}
                          {med.sukl_code_or_url && (
                            <a
                              href={med.sukl_code_or_url.startsWith('http') ? med.sukl_code_or_url : `https://www.sukl.cz/leciva/${med.sukl_code_or_url}`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[11px] font-semibold text-zinc-400 hover:text-zinc-600 flex items-center gap-0.5"
                            >
                              SÚKL <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                          )}
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => {
                              setEditingMedicine(med);
                              setIsEditModalOpen(true);
                            }}
                            className="p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800"
                            title="Upravit lék"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteMedicine(med)}
                            className="p-1.5 text-zinc-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40"
                            title="Smazat lék"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: SCHEDULES (DÁVKOVACÍ ROZVRHY & DNES UŽÍT) */}
      {/* ========================================================================= */}
      {activeTab === 'schedules' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                Plány užívání léků
              </h2>
              <p className="text-xs text-zinc-500">
                Aktivní dlouhodobé medikace a akutní kúry pro členy rodiny
              </p>
            </div>
            <button
              onClick={() => {
                setEditingSchedule(null);
                setIsScheduleModalOpen(true);
              }}
              className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs flex items-center gap-2 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Nastavit nový rozvrh</span>
            </button>
          </div>

          {schedules.length === 0 ? (
            <div className="text-center py-16 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-8">
              <Calendar className="w-12 h-12 mx-auto text-zinc-300 dark:text-zinc-700 mb-3" />
              <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                Zatím není nastaven žádný dávkovací rozvrh
              </h3>
              <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
                Vytvořte rozvrh pro pravidelné ranní/večerní léky nebo zapište probíhající antibiotickou kúru.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {schedules.map((sched) => (
                <div
                  key={sched.id}
                  className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        sched.schedule_type === 'acute_course'
                          ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300'
                          : 'bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300'
                      }`}>
                        {sched.schedule_type === 'acute_course' ? 'Akutní kúra' : 'Dlouhodobá medikace'}
                      </span>
                      <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">
                        👤 {sched.user_name || 'Člen rodiny'}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                      {sched.medicine_name}
                    </h3>
                    <p className="text-xs font-semibold text-purple-600 dark:text-purple-400 mt-0.5">
                      Dávka: {sched.dosage_per_take}
                    </p>

                    {/* Time slots badges */}
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {sched.time_slots.map((slot, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs font-medium"
                        >
                          {slot === 'morning' ? '🌅 Ráno' : slot === 'noon' ? '☀️ Poledne' : slot === 'evening' ? '🌆 Večer' : '🌙 Na noc'}
                        </span>
                      ))}
                    </div>

                    {sched.notes && (
                      <p className="text-xs text-zinc-500 mt-2">
                        {sched.notes}
                      </p>
                    )}
                  </div>

                  <div className="mt-5 pt-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                    {/* Compliance button */}
                    <button
                      onClick={() => handleTakeDose(sched)}
                      disabled={sched.is_taken_today}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                        sched.is_taken_today
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 cursor-default'
                          : 'bg-purple-600 hover:bg-purple-700 text-white shadow-sm'
                      }`}
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>{sched.is_taken_today ? 'Dnes užito' : 'Vzít dávku'}</span>
                    </button>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          setEditingSchedule(sched);
                          setIsScheduleModalOpen(true);
                        }}
                        className="p-1.5 text-zinc-400 hover:text-zinc-600 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800"
                        title="Upravit rozvrh"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteSchedule(sched.id)}
                        className="p-1.5 text-zinc-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40"
                        title="Zrušit rozvrh"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Recent Logs Table */}
          {logs.length > 0 && (
            <div className="mt-8">
              <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-400 mb-3">
                Nedávná historie užití dávek
              </h3>
              <div className="overflow-x-auto bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-zinc-50 dark:bg-zinc-800/40 border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 font-semibold">
                    <tr>
                      <th className="p-3">Čas</th>
                      <th className="p-3">Lék</th>
                      <th className="p-3">Dávka</th>
                      <th className="p-3">Uživatel</th>
                      <th className="p-3">Stav</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                    {logs.map((l) => (
                      <tr key={l.id}>
                        <td className="p-3 text-zinc-500">
                          {new Date(l.taken_at).toLocaleString('cs-CZ')}
                        </td>
                        <td className="p-3 font-bold text-zinc-900 dark:text-zinc-100">
                          {l.medicine_name}
                        </td>
                        <td className="p-3 text-zinc-600 dark:text-zinc-300">
                          {l.dose_taken}
                        </td>
                        <td className="p-3 text-zinc-600 dark:text-zinc-300">
                          {l.user_name}
                        </td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300">
                            Užito
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: FIRST AID (PRVNÍ POMOC & TIS) */}
      {/* ========================================================================= */}
      {activeTab === 'first_aid' && (
        <div className="space-y-6">
          {/* Emergency Action Banner */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <a
              href="tel:155"
              className="p-5 rounded-2xl bg-gradient-to-br from-red-600 to-rose-700 text-white shadow-md flex items-center justify-between hover:scale-[1.02] transition-transform"
            >
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider opacity-80 block">
                  Zdravotnická záchranná služba
                </span>
                <span className="text-3xl font-black mt-1 block">155</span>
                <span className="text-xs opacity-90 mt-1 block">Tísňová linka ČR</span>
              </div>
              <PhoneCall className="w-8 h-8 opacity-80" />
            </a>

            <a
              href="tel:224919293"
              className="p-5 rounded-2xl bg-gradient-to-br from-purple-700 to-indigo-800 text-white shadow-md flex items-center justify-between hover:scale-[1.02] transition-transform"
            >
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider opacity-80 block">
                  Toxikologické středisko (TIS)
                </span>
                <span className="text-2xl font-black mt-1 block">224 91 92 93</span>
                <span className="text-xs opacity-90 mt-1 block">Otravy léky, saponáty, houbami</span>
              </div>
              <PhoneCall className="w-8 h-8 opacity-80" />
            </a>

            <a
              href="tel:112"
              className="p-5 rounded-2xl bg-gradient-to-br from-zinc-800 to-zinc-950 text-white shadow-md flex items-center justify-between hover:scale-[1.02] transition-transform"
            >
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider opacity-80 block">
                  Jednotné evropské číslo
                </span>
                <span className="text-3xl font-black mt-1 block">112</span>
                <span className="text-xs opacity-90 mt-1 block">Univerzální tísňová linka</span>
              </div>
              <PhoneCall className="w-8 h-8 opacity-80" />
            </a>
          </div>

          {/* Quick Guide Launchers */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-400 mb-3">
              Rychlý rozcestník krizových postupů:
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {[
                { id: 'burns', title: 'Popáleniny a opaření', desc: 'Chlazení čistou vodou, sterilní krytí', icon: '🔥' },
                { id: 'intoxication', title: 'Otravy léky a saponáty', desc: 'Postup před voláním na TIS Praha', icon: '☠️' },
                { id: 'febrile_seizures', title: 'Febrilní křeče u dětí', desc: 'Záchvat při vysoké horečce', icon: '👶' },
                { id: 'choking', title: 'Dušení cizím tělesem', desc: 'Údery mezi lopatky a Heimlichův manévr', icon: '💨' },
                { id: 'severe_bleeding', title: 'Masivní krvácení', desc: 'Tlakový obvaz a zaškrcení končetiny', icon: '🩸' },
                { id: 'anaphylaxis', title: 'Anafylaxe a bodnutí', desc: 'Aplikace adrenalinu (EpiPen)', icon: '🐝' }
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setSelectedGuideId(item.id);
                    setIsFirstAidModalOpen(true);
                  }}
                  className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-left hover:border-rose-300 dark:hover:border-rose-800 transition-all flex items-center justify-between shadow-sm group"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{item.icon}</span>
                    <div>
                      <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-rose-600 transition-colors">
                        {item.title}
                      </h4>
                      <p className="text-xs text-zinc-500 mt-0.5">
                        {item.desc}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-zinc-400 group-hover:translate-x-1 transition-transform" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: CALCULATOR (DĚTSKÁ KALKULAČKA) */}
      {/* ========================================================================= */}
      {activeTab === 'calculator' && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm max-w-2xl mx-auto text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
              <Baby className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
              Kalkulačka bezpečného dávkování antipyretik pro děti
            </h2>
            <p className="text-xs text-zinc-500 max-w-md mx-auto">
              Přesný přepočet podle hmotnosti v kilogramech pro paracetamol (Paralen, Panadol sirupy a čípky) i ibuprofen (Nurofen, Ibalgin sirupy 2% i 4%).
            </p>
            <button
              onClick={() => setIsPediatricModalOpen(true)}
              className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md transition-all"
            >
              Otevřít interaktivní kalkulačku dávek
            </button>
          </div>
        </div>
      )}

      {/* Modals */}
      <MedicineEditModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSave={handleSaveMedicine}
        medicine={editingMedicine}
        users={users}
      />

      <MedicationScheduleModal
        isOpen={isScheduleModalOpen}
        onClose={() => setIsScheduleModalOpen(false)}
        onSave={handleSaveSchedule}
        schedule={editingSchedule}
        medicines={medicines}
        users={users}
      />

      <PediatricDosageModal
        isOpen={isPediatricModalOpen}
        onClose={() => setIsPediatricModalOpen(false)}
      />

      <FirstAidGuideModal
        isOpen={isFirstAidModalOpen}
        onClose={() => setIsFirstAidModalOpen(false)}
        initialGuideId={selectedGuideId}
      />
    </div>
  );
};
export default MedicinesPage;
