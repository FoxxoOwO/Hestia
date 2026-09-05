import React, { useState, useEffect } from 'react';
import { X, Pill, AlertTriangle, Snowflake, FileText, Check, ShieldAlert } from 'lucide-react';
import { Medicine, MedicineCreate, MedicineUpdate, MedicineForm, MedicineCategory, MedicineLocation, User } from '../types';
import { useTranslation } from '../i18n';

interface MedicineEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: MedicineCreate | MedicineUpdate) => Promise<void>;
  medicine?: Medicine | null;
  users?: User[];
}

export const MedicineEditModal: React.FC<MedicineEditModalProps> = ({
  isOpen,
  onClose,
  onSave,
  medicine,
  users = []
}) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'basic' | 'usage' | 'safety'>('basic');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [activeSubstance, setActiveSubstance] = useState('');
  const [form, setForm] = useState<MedicineForm>('tablets');
  const [category, setCategory] = useState<MedicineCategory>('pain_fever');
  const [location, setLocation] = useState<MedicineLocation>('bathroom');
  const [packageSize, setPackageSize] = useState('');
  const [currentQuantity, setCurrentQuantity] = useState<number>(1);
  const [unit, setUnit] = useState('ks');
  const [minQuantityWarning, setMinQuantityWarning] = useState<number>(0);

  // Dates & opening
  const [expirationDate, setExpirationDate] = useState('');
  const [openedDate, setOpenedDate] = useState('');
  const [validityMonthsAfterOpening, setValidityMonthsAfterOpening] = useState<number | ''>('');

  // Medical properties
  const [isPrescription, setIsPrescription] = useState(false);
  const [requiresRefrigeration, setRequiresRefrigeration] = useState(false);
  const [ageGroup, setAgeGroup] = useState('all');
  const [dosageInstructions, setDosageInstructions] = useState('');
  const [storageInstructions, setStorageInstructions] = useState('');
  const [suklCodeOrUrl, setSuklCodeOrUrl] = useState('');
  const [notes, setNotes] = useState('');
  const [assignedUserId, setAssignedUserId] = useState<number | ''>('');

  useEffect(() => {
    if (medicine) {
      setName(medicine.name || '');
      setActiveSubstance(medicine.active_substance || '');
      setForm(medicine.form || 'tablets');
      setCategory(medicine.category || 'pain_fever');
      setLocation(medicine.location || 'bathroom');
      setPackageSize(medicine.package_size || '');
      setCurrentQuantity(medicine.current_quantity ?? 1);
      setUnit(medicine.unit || 'ks');
      setMinQuantityWarning(medicine.min_quantity_warning ?? 0);
      setExpirationDate(medicine.expiration_date || '');
      setOpenedDate(medicine.opened_date || '');
      setValidityMonthsAfterOpening(medicine.validity_months_after_opening ?? '');
      setIsPrescription(medicine.is_prescription ?? false);
      setRequiresRefrigeration(medicine.requires_refrigeration ?? false);
      setAgeGroup(medicine.age_group || 'all');
      setDosageInstructions(medicine.dosage_instructions || '');
      setStorageInstructions(medicine.storage_instructions || '');
      setSuklCodeOrUrl(medicine.sukl_code_or_url || '');
      setNotes(medicine.notes || '');
      setAssignedUserId(medicine.assigned_user_id || '');
    } else {
      setName('');
      setActiveSubstance('');
      setForm('tablets');
      setCategory('pain_fever');
      setLocation('bathroom');
      setPackageSize('');
      setCurrentQuantity(1);
      setUnit('ks');
      setMinQuantityWarning(0);
      setExpirationDate('');
      setOpenedDate('');
      setValidityMonthsAfterOpening('');
      setIsPrescription(false);
      setRequiresRefrigeration(false);
      setAgeGroup('all');
      setDosageInstructions('');
      setStorageInstructions('Při pokojové teplotě do 25 °C');
      setSuklCodeOrUrl('');
      setNotes('');
      setAssignedUserId('');
    }
    setError(null);
    setActiveTab('basic');
  }, [medicine, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Zadejte název léku nebo zdravotnického materiálu.');
      return;
    }

    setIsSaving(true);
    setError(null);

    const payload: MedicineCreate = {
      name: name.trim(),
      active_substance: activeSubstance.trim() || undefined,
      form,
      category,
      location,
      package_size: packageSize.trim() || undefined,
      current_quantity: Number(currentQuantity) || 0,
      unit: unit.trim() || 'ks',
      min_quantity_warning: Number(minQuantityWarning) || 0,
      expiration_date: expirationDate || undefined,
      opened_date: openedDate || undefined,
      validity_months_after_opening: validityMonthsAfterOpening ? Number(validityMonthsAfterOpening) : undefined,
      is_prescription: isPrescription,
      requires_refrigeration: requiresRefrigeration,
      age_group: ageGroup,
      dosage_instructions: dosageInstructions.trim() || undefined,
      storage_instructions: storageInstructions.trim() || undefined,
      sukl_code_or_url: suklCodeOrUrl.trim() || undefined,
      notes: notes.trim() || undefined,
      assigned_user_id: assignedUserId ? Number(assignedUserId) : undefined
    };

    try {
      await onSave(payload);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Nepodařilo se uložit položku.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl my-8">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/40">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400">
              <Pill className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
                {medicine ? 'Upravit lék / materiál' : 'Přidat do lékárničky'}
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Evidence zásob, hlídání expirace a bezpečné dávkování
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-zinc-200 dark:border-zinc-800 px-6 bg-zinc-50/50 dark:bg-zinc-900">
          <button
            type="button"
            onClick={() => setActiveTab('basic')}
            className={`py-3 px-4 text-sm font-semibold border-b-2 transition-all ${
              activeTab === 'basic'
                ? 'border-rose-500 text-rose-600 dark:text-rose-400'
                : 'border-transparent text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
            }`}
          >
            Základní údaje & Sklad
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('usage')}
            className={`py-3 px-4 text-sm font-semibold border-b-2 transition-all ${
              activeTab === 'usage'
                ? 'border-rose-500 text-rose-600 dark:text-rose-400'
                : 'border-transparent text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
            }`}
          >
            Expirace & Otevření
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('safety')}
            className={`py-3 px-4 text-sm font-semibold border-b-2 transition-all ${
              activeTab === 'safety'
                ? 'border-rose-500 text-rose-600 dark:text-rose-400'
                : 'border-transparent text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
            }`}
          >
            Dávkování & Bezpečnost
          </button>
        </div>

        {error && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 flex items-center gap-3 text-sm text-rose-700 dark:text-rose-300">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* TAB 1: BASIC */}
          {activeTab === 'basic' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Název přípravku *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="např. Paralen 500, Ibalgin 400, Olynth..."
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-rose-500 text-sm text-zinc-900 dark:text-zinc-100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Účinná látka (prevence předávkování)
                  </label>
                  <input
                    type="text"
                    placeholder="např. Paracetamol, Ibuprofen, Xylometazolin..."
                    value={activeSubstance}
                    onChange={(e) => setActiveSubstance(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-rose-500 text-sm text-zinc-900 dark:text-zinc-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Léková forma
                  </label>
                  <select
                    value={form}
                    onChange={(e) => setForm(e.target.value as MedicineForm)}
                    className="w-full px-3.5 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-rose-500 text-sm text-zinc-900 dark:text-zinc-100"
                  >
                    <option value="tablets">Tablety / Kapsle</option>
                    <option value="syrup">Sirup</option>
                    <option value="drops">Kapky</option>
                    <option value="ointment">Mast / Krém / Gel</option>
                    <option value="spray">Sprej</option>
                    <option value="injection">Injekce / Pero</option>
                    <option value="dressing">Obvaz / Náplast / Gáza</option>
                    <option value="device">Zdravotnická pomůcka</option>
                    <option value="other">Ostatní</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Kategorie / Indikace
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as MedicineCategory)}
                    className="w-full px-3.5 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-rose-500 text-sm text-zinc-900 dark:text-zinc-100"
                  >
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
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Umístění lékárničky
                  </label>
                  <select
                    value={location}
                    onChange={(e) => setLocation(e.target.value as MedicineLocation)}
                    className="w-full px-3.5 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-rose-500 text-sm text-zinc-900 dark:text-zinc-100"
                  >
                    <option value="bathroom">Koupelna</option>
                    <option value="kitchen">Kuchyň</option>
                    <option value="travel_kit">Cestovní lékárnička</option>
                    <option value="cottage">Chata / Chalupa</option>
                    <option value="car">Autolékárnička</option>
                    <option value="bedroom">Ložnice / Noční stolek</option>
                    <option value="other">Jiné umístění</option>
                  </select>
                </div>
              </div>

              {/* Quantity & Packaging */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Velikost balení
                  </label>
                  <input
                    type="text"
                    placeholder="např. 24 tablet, 100 ml"
                    value={packageSize}
                    onChange={(e) => setPackageSize(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-rose-500 text-sm text-zinc-900 dark:text-zinc-100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Aktuální množství
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    value={currentQuantity}
                    onChange={(e) => setCurrentQuantity(parseFloat(e.target.value) || 0)}
                    className="w-full px-3.5 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-rose-500 text-sm text-zinc-900 dark:text-zinc-100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Jednotka
                  </label>
                  <input
                    type="text"
                    placeholder="tablety, ml, ks, sáčky"
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-rose-500 text-sm text-zinc-900 dark:text-zinc-100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Upozornit při poklesu pod
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    placeholder="např. 4"
                    value={minQuantityWarning}
                    onChange={(e) => setMinQuantityWarning(parseFloat(e.target.value) || 0)}
                    className="w-full px-3.5 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-rose-500 text-sm text-zinc-900 dark:text-zinc-100"
                  />
                </div>
              </div>

              {/* Assignment to family member */}
              {users.length > 0 && (
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Určeno pro člena rodiny (volitelné)
                  </label>
                  <select
                    value={assignedUserId}
                    onChange={(e) => setAssignedUserId(e.target.value ? Number(e.target.value) : '')}
                    className="w-full px-3.5 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-rose-500 text-sm text-zinc-900 dark:text-zinc-100"
                  >
                    <option value="">Společné pro celou domácnost</option>
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.display_name || u.username}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: EXPIRATION & OPENING */}
          {activeTab === 'usage' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Datum expirace (Minimální trvanlivost)
                  </label>
                  <input
                    type="date"
                    value={expirationDate}
                    onChange={(e) => setExpirationDate(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-rose-500 text-sm text-zinc-900 dark:text-zinc-100"
                  />
                  <p className="text-[11px] text-zinc-500 mt-1">
                    Systém začne varovat žlutým semaforem 60 dní předem.
                  </p>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Datum otevření balení
                  </label>
                  <input
                    type="date"
                    value={openedDate}
                    onChange={(e) => setOpenedDate(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-rose-500 text-sm text-zinc-900 dark:text-zinc-100"
                  />
                  <p className="text-[11px] text-zinc-500 mt-1">
                    Vyplňte pro oční kapky, sirupy, masti nebo kapky do nosu.
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Použitelnost po otevření (v měsících)
                </label>
                <input
                  type="number"
                  min="1"
                  max="48"
                  placeholder="např. 1 měsíc u očních kapek, 6 měsíců u sirupu"
                  value={validityMonthsAfterOpening}
                  onChange={(e) => setValidityMonthsAfterOpening(e.target.value ? parseInt(e.target.value) : '')}
                  className="w-full px-3.5 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-rose-500 text-sm text-zinc-900 dark:text-zinc-100"
                />
              </div>

              <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div className="text-xs text-amber-800 dark:text-amber-300 space-y-1">
                  <p className="font-semibold">Bezpečná likvidace nepoužitých a prošlých léků</p>
                  <p>
                    Léky nikdy nevyhazujte do směsného odpadu ani nesplachujte do toalety (znečištění podzemních vod).
                    Veškerá prošlá léčiva vám zdarma odeberou v kterékoliv lékárně k ekologické likvidaci.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: DOSAGE & SAFETY */}
          {activeTab === 'safety' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="flex items-center gap-3 p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isPrescription}
                    onChange={(e) => setIsPrescription(e.target.checked)}
                    className="rounded text-rose-600 focus:ring-rose-500 w-4 h-4"
                  />
                  <div>
                    <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 block">
                      Pouze na lékařský předpis (Rx)
                    </span>
                    <span className="text-[11px] text-zinc-500">
                      Vyžaduje recept od praktického lékaře nebo specialisty.
                    </span>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={requiresRefrigeration}
                    onChange={(e) => setRequiresRefrigeration(e.target.checked)}
                    className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                  />
                  <div>
                    <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 block flex items-center gap-1.5">
                      <Snowflake className="w-3.5 h-3.5 text-blue-500" />
                      Skladovat v chladničce (2-8 °C)
                    </span>
                    <span className="text-[11px] text-zinc-500">
                      Inzulín, některá probiotika, oční kapky či vakcíny.
                    </span>
                  </div>
                </label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Věková skupina & Omezení
                  </label>
                  <select
                    value={ageGroup}
                    onChange={(e) => setAgeGroup(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-rose-500 text-sm text-zinc-900 dark:text-zinc-100"
                  >
                    <option value="all">Pro všechny věkové skupiny</option>
                    <option value="adults_only">Pouze pro dospělé</option>
                    <option value="kids_from_12yo">Děti od 12 let a dospělí</option>
                    <option value="kids_from_6yo">Děti od 6 let</option>
                    <option value="kids_from_3yo">Děti od 3 let</option>
                    <option value="infants">Kojenci a batolata</option>
                    <option value="seniors">Senioři</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Skladovací podmínky
                  </label>
                  <input
                    type="text"
                    placeholder="např. Při pokojové teplotě do 25 °C v temnu"
                    value={storageInstructions}
                    onChange={(e) => setStorageInstructions(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-rose-500 text-sm text-zinc-900 dark:text-zinc-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Návod k dávkování a užívání
                </label>
                <textarea
                  rows={2}
                  placeholder="např. 1 tableta 3x denně po jídle, zapít sklenicí vody. Maximálně 4 tablety za den."
                  value={dosageInstructions}
                  onChange={(e) => setDosageInstructions(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-rose-500 text-sm text-zinc-900 dark:text-zinc-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Kód SÚKL nebo odkaz na příbalový leták
                </label>
                <input
                  type="text"
                  placeholder="https://www.sukl.cz/leciva/... nebo kód přípravku"
                  value={suklCodeOrUrl}
                  onChange={(e) => setSuklCodeOrUrl(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-rose-500 text-sm text-zinc-900 dark:text-zinc-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Doplňující poznámky
                </label>
                <textarea
                  rows={2}
                  placeholder="Upozornění na nežádoucí účinky, zkušenosti s lékem, vlastní poznámka..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-rose-500 text-sm text-zinc-900 dark:text-zinc-100"
                />
              </div>
            </div>
          )}

          {/* Footer buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-200 dark:border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors"
            >
              Zrušit
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2 text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 active:bg-rose-800 rounded-xl transition-colors flex items-center gap-2 shadow-sm disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              {isSaving ? 'Ukládám...' : medicine ? 'Uložit změny' : 'Přidat do lékárničky'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
