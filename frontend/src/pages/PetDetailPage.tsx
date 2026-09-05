import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Dog, Cat, ArrowLeft, Heart, Edit3, Trash2,
  Stethoscope, Luggage, AlertTriangle, Phone, Scale,
  Syringe, Pill, Utensils, Calendar, Plus, X, Check,
  Camera, ShoppingCart, ShieldAlert, Sparkles, CheckCircle2
} from 'lucide-react';
import { api } from '../services/api';
import { Pet, PetMedicalRecord, PetTask, PetLogEntry, PetMedication, PetWeightLog } from '../types';
import { PetDoctorModal } from '../components/PetDoctorModal';
import { PetSitterModal } from '../components/PetSitterModal';
import { PetSosModal } from '../components/PetSosModal';
import { PetWeightModal } from '../components/PetWeightModal';
import { useTranslation } from '../i18n';

export const PetDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [pet, setPet] = useState<Pet | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notification, setNotification] = useState<string | null>(null);

  // Modals
  const [isDoctorOpen, setIsDoctorOpen] = useState(false);
  const [isSitterOpen, setIsSitterOpen] = useState(false);
  const [isSosOpen, setIsSosOpen] = useState(false);
  const [isWeightOpen, setIsWeightOpen] = useState(false);
  const [isAddMedicalOpen, setIsAddMedicalOpen] = useState(false);
  const [isAddMedicationOpen, setIsAddMedicationOpen] = useState(false);
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);
  const [isAddLogOpen, setIsAddLogOpen] = useState(false);

  // Form states
  const [medRecordType, setMedRecordType] = useState<string>('vaccination');
  const [medRecordTitle, setMedRecordTitle] = useState('');
  const [medRecordDate, setMedRecordDate] = useState(new Date().toISOString().split('T')[0]);
  const [medRecordValidUntil, setMedRecordValidUntil] = useState('');
  const [medRecordVet, setMedRecordVet] = useState('');
  const [medRecordNotes, setMedRecordNotes] = useState('');

  const [medName, setMedName] = useState('');
  const [medDosage, setMedDosage] = useState('');
  const [medFrequency, setMedFrequency] = useState('');
  const [medNotes, setMedNotes] = useState('');

  const [taskType, setTaskType] = useState<string>('vaccination');
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDueDate, setTaskDueDate] = useState('');
  const [taskInterval, setTaskInterval] = useState(0);

  const [logTitle, setLogTitle] = useState('');
  const [logNotes, setLogNotes] = useState('');
  const [logImageUrl, setLogImageUrl] = useState('');

  const fetchPet = async () => {
    if (!id) return;
    try {
      const data = await api.getPet(Number(id));
      setPet(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPet();
  }, [id]);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  const handleFeed = async () => {
    if (!pet) return;
    try {
      const updated = await api.feedPet(pet.id);
      setPet(updated);
      showNotification(`🥣 Mazlíček "${updated.name}" byl nakrmen!`);
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleFavorite = async () => {
    if (!pet) return;
    try {
      const updated = await api.toggleFavoritePet(pet.id);
      setPet((prev) => (prev ? { ...prev, is_favorite: updated.is_favorite } : null));
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async () => {
    if (!pet) return;
    if (window.confirm(t('common.confirm_delete'))) {
      try {
        await api.deletePet(pet.id);
        navigate('/pets');
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleAddSupplyToShopping = async () => {
    if (!pet) return;
    const supply = prompt(`Co je potřeba koupit pro ${pet.name}?`, 'Krmivo / granule');
    if (!supply) return;
    try {
      await api.addPetSupplyToShopping(pet.id, supply);
      showNotification(`🛒 "${supply} (${pet.name})" bylo přidáno do nákupního seznamu!`);
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateMedicalRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pet || !medRecordTitle.trim()) return;
    try {
      await api.addPetMedicalRecord(pet.id, {
        record_type: medRecordType,
        title: medRecordTitle.trim(),
        performed_date: medRecordDate,
        valid_until: medRecordValidUntil || undefined,
        veterinarian: medRecordVet || undefined,
        notes: medRecordNotes || undefined,
      });
      setIsAddMedicalOpen(false);
      setMedRecordTitle('');
      setMedRecordNotes('');
      showNotification('Lékařský záznam byl úspěšně uložen.');
      fetchPet();
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateMedication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pet || !medName.trim()) return;
    try {
      await api.addPetMedication(pet.id, {
        name: medName.trim(),
        dosage: medDosage.trim(),
        frequency: medFrequency.trim(),
        notes: medNotes || undefined,
        is_active: true,
      });
      setIsAddMedicationOpen(false);
      setMedName('');
      setMedDosage('');
      setMedFrequency('');
      showNotification('Lék byl předepsán a přidán.');
      fetchPet();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteMedication = async (medId: number) => {
    if (!pet) return;
    try {
      await api.deletePetMedication(pet.id, medId);
      showNotification('Lék byl odebrán.');
      fetchPet();
    } catch (e) {
      console.error(e);
    }
  };

  const handleCompleteTask = async (taskId: number) => {
    if (!pet) return;
    try {
      await api.completePetTask(pet.id, taskId);
      showNotification('✅ Úkol splněn!');
      fetchPet();
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pet || !taskTitle.trim() || !taskDueDate) return;
    try {
      await api.createPetTask(pet.id, {
        task_type: taskType,
        title: taskTitle.trim(),
        due_date: taskDueDate,
        interval_days: Number(taskInterval) || 0,
      });
      setIsAddTaskOpen(false);
      setTaskTitle('');
      showNotification('Úkol péče byl naplánován.');
      fetchPet();
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pet || !logTitle.trim()) return;
    try {
      await api.addPetLog(pet.id, {
        entry_type: 'photo',
        title: logTitle.trim(),
        notes: logNotes.trim() || undefined,
        image_url: logImageUrl.trim() || undefined,
      });
      setIsAddLogOpen(false);
      setLogTitle('');
      setLogNotes('');
      setLogImageUrl('');
      showNotification('Záznam byl přidán do deníku.');
      fetchPet();
    } catch (e) {
      console.error(e);
    }
  };

  if (isLoading) {
    return (
      <div className="py-24 text-center text-zinc-400">
        <Dog className="w-10 h-10 animate-bounce text-amber-500 mx-auto mb-3" />
        <p className="text-sm font-medium">{t('common.loading')}</p>
      </div>
    );
  }

  if (!pet) {
    return (
      <div className="py-20 text-center">
        <p className="text-zinc-500">Mazlíček nebyl nalezen.</p>
        <Link to="/pets" className="mt-4 inline-block text-amber-600 font-semibold text-sm hover:underline">
          Zpět do přehledu
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20 max-w-6xl mx-auto">
      {/* Toast */}
      {notification && (
        <div className="fixed top-20 right-4 z-50 p-4 rounded-2xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 shadow-2xl text-xs font-bold animate-in slide-in-from-top flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>{notification}</span>
        </div>
      )}

      {/* Top Nav & Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Link
          to="/pets"
          className="inline-flex items-center gap-2 text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:text-amber-600 dark:hover:text-amber-400 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Zpět na přehled mazlíčků</span>
        </Link>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsDoctorOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-2xl text-xs font-semibold bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/50 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900/60 transition shadow-sm"
          >
            <Stethoscope className="w-3.5 h-3.5 text-rose-500" />
            <span>{t('pets.ai_vet')}</span>
          </button>

          <button
            onClick={() => setIsSitterOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-2xl text-xs font-semibold bg-cyan-50 hover:bg-cyan-100 dark:bg-cyan-950/40 dark:hover:bg-cyan-900/50 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-900/60 transition shadow-sm"
          >
            <Luggage className="w-3.5 h-3.5 text-cyan-500" />
            <span>{t('pets.pet_sitter')}</span>
          </button>

          <button
            onClick={() => setIsSosOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-2xl text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white transition shadow-sm"
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>{t('pets.sos_flyer')}</span>
          </button>

          <button
            onClick={handleToggleFavorite}
            className="p-2.5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 transition shadow-sm"
            title="Přidat do oblíbených"
          >
            <Heart className={`w-4 h-4 ${pet.is_favorite ? 'fill-rose-500 text-rose-500' : ''}`} />
          </button>

          <Link
            to={`/pets/${pet.id}/edit`}
            className="flex items-center gap-1.5 px-3 py-2 rounded-2xl text-xs font-semibold border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 transition shadow-sm"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Upravit</span>
          </Link>

          <button
            onClick={handleDelete}
            className="p-2.5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:text-rose-600 text-zinc-500 transition shadow-sm"
            title="Smazat profil"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Grid Header */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Pet Hero Card */}
        <div className="lg:col-span-5 rounded-3xl overflow-hidden bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <div className="relative aspect-[4/3] bg-zinc-100 dark:bg-zinc-800">
            {pet.primary_image_url ? (
              <img
                src={pet.primary_image_url}
                alt={pet.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-zinc-400 bg-gradient-to-tr from-amber-50 to-orange-50 dark:from-zinc-900 dark:to-zinc-800">
                <Dog className="w-20 h-20 text-amber-500 stroke-1" />
                <span className="text-xs mt-2 font-medium">Hestia Mazlíček</span>
              </div>
            )}

            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60" />

            <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-white text-xs font-semibold">
              <span className="px-3 py-1 rounded-xl bg-black/40 backdrop-blur-md">
                {t(`pets.species.${pet.species}`) || pet.species}
              </span>
              <span className="px-3 py-1 rounded-xl bg-amber-500/80 backdrop-blur-md">
                🎂 {pet.age_formatted}
              </span>
            </div>
          </div>

          <div className="p-5 border-t border-zinc-100 dark:border-zinc-800 space-y-3">
            <div>
              <h1 className="text-2xl font-black text-zinc-900 dark:text-zinc-100">
                {pet.name}
              </h1>
              {pet.breed && (
                <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
                  {pet.breed}
                </p>
              )}
            </div>

            {/* Badges */}
            <div className="flex flex-wrap gap-1.5 pt-1 text-[11px] font-semibold">
              <span className="px-2.5 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                {pet.gender === 'male' ? '♂ Samec' : pet.gender === 'female' ? '♀ Samice' : 'Pohlaví neznámé'}
              </span>
              {pet.is_neutered && (
                <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  ✓ Kastrovaný/á
                </span>
              )}
              {pet.color && (
                <span className="px-2.5 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                  Barva: {pet.color}
                </span>
              )}
            </div>

            {/* Passport & Microchip Box */}
            <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 space-y-1.5 text-xs">
              {pet.microchip_number && (
                <div className="flex items-center justify-between">
                  <span className="text-zinc-400">Číslo mikročipu:</span>
                  <a
                    href={`https://www.narodniregistr.cz/`}
                    target="_blank"
                    rel="noreferrer"
                    className="font-mono font-bold text-amber-600 hover:underline"
                  >
                    {pet.microchip_number} ↗
                  </a>
                </div>
              )}
              {pet.passport_number && (
                <div className="flex items-center justify-between">
                  <span className="text-zinc-400">Pas zvířete:</span>
                  <strong className="font-mono text-zinc-800 dark:text-zinc-200">{pet.passport_number}</strong>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Dashboard */}
        <div className="lg:col-span-7 space-y-6">
          {/* Family Feeding Tracker Banner */}
          <div className="p-6 rounded-3xl bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-transparent border border-amber-500/20 shadow-sm relative overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                  <Utensils className="w-4 h-4" />
                  Stav rodinného krmení
                </span>

                <div className="mt-2">
                  <h3 className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-zinc-100">
                    {pet.last_fed_at ? (
                      <>
                        Naposledy krmil(a):{' '}
                        <span className="text-amber-600 dark:text-amber-400">{pet.last_fed_by_name || 'někdo z rodiny'}</span>
                      </>
                    ) : (
                      'Dnes ještě nezaznamenáno'
                    )}
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                    {pet.last_fed_at
                      ? `Čas: ${new Date(pet.last_fed_at).toLocaleString('cs-CZ')}`
                      : 'Zaznamenejte, kdo dnes nasypal granule, aby pes nedostal večeři dvakrát.'}
                  </p>
                </div>
              </div>

              {/* Feed Now Button */}
              <button
                onClick={handleFeed}
                className="px-6 py-3.5 rounded-2xl font-bold text-sm bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-lg shadow-amber-500/25 transition transform active:scale-95 flex items-center justify-center gap-2 shrink-0"
              >
                <Utensils className="w-4 h-4 fill-white" />
                <span>Nakrmeno dnes</span>
              </button>
            </div>

            {/* Order to Shopping link */}
            <div className="mt-4 pt-4 border-t border-amber-500/15 flex items-center justify-between">
              <span className="text-xs text-zinc-500">Dochází krmivo nebo pamlsky?</span>
              <button
                onClick={handleAddSupplyToShopping}
                className="text-xs font-bold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1"
              >
                <ShoppingCart className="w-3.5 h-3.5" />
                <span>Přidat do nákupního seznamu</span>
              </button>
            </div>
          </div>

          {/* Diet & Allergies Card */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Dietary Routine */}
            <div className="p-5 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-2">
              <span className="text-xs font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                <Utensils className="w-4 h-4" />
                <span>Krmná dávka & Oblíbené</span>
              </span>
              <p className="text-xs text-zinc-700 dark:text-zinc-300 whitespace-pre-line leading-relaxed">
                {pet.dietary_needs || 'Běžné krmivo 2x denně.'}
              </p>
            </div>

            {/* Allergies & Prohibitions */}
            <div className="p-5 rounded-3xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/50 shadow-sm space-y-2">
              <span className="text-xs font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4" />
                <span>Po čem není dobře / Zákazy</span>
              </span>
              <p className="text-xs text-rose-800 dark:text-rose-300 font-medium whitespace-pre-line leading-relaxed">
                {pet.allergies_and_intolerances || 'Žádné známé potravinové alergie.'}
              </p>
            </div>
          </div>

          {/* Veterinary Card & Emergency 1-click */}
          <div className="p-5 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-3">
            <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <Stethoscope className="w-4 h-4 text-rose-500" />
              <span>Veterinární péče & Pohotovost</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-zinc-400 block">Stálý veterinář:</span>
                  <strong className="text-zinc-800 dark:text-zinc-200 text-xs block">{pet.vet_clinic || pet.vet_name || 'Neuvedeno'}</strong>
                  <span className="text-zinc-500">{pet.vet_phone || 'Bez telefonu'}</span>
                </div>
                {pet.vet_phone && (
                  <a
                    href={`tel:${pet.vet_phone}`}
                    className="p-2 rounded-xl bg-amber-500 text-white hover:bg-amber-600 transition shadow-sm"
                    title="Zavolat"
                  >
                    <Phone className="w-4 h-4" />
                  </a>
                )}
              </div>

              <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200/60 dark:border-rose-900/60 flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-rose-600 dark:text-rose-400 font-semibold block">24/7 Pohotovost:</span>
                  <strong className="text-zinc-900 dark:text-zinc-100 text-xs block">{pet.emergency_vet_clinic || 'Nonstop klinika'}</strong>
                  <span className="text-rose-700 dark:text-rose-300 font-bold">{pet.emergency_vet_phone || 'Bez čísla'}</span>
                </div>
                {pet.emergency_vet_phone && (
                  <a
                    href={`tel:${pet.emergency_vet_phone}`}
                    className="p-2 rounded-xl bg-rose-600 text-white hover:bg-rose-700 transition shadow-sm"
                    title="Okamžitě volat pohotovost"
                  >
                    <Phone className="w-4 h-4 animate-pulse" />
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs / Multi-card Section: Medical, Medications, Weight, Tasks, Diary */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Col: Medical records & Medications */}
        <div className="lg:col-span-6 space-y-6">
          {/* Medical Records (Vaccinations & Deworming) */}
          <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <Syringe className="w-4 h-4 text-emerald-500" />
                <span>Zdravotní záznamy & Očkování</span>
              </h3>
              <button
                onClick={() => setIsAddMedicalOpen(true)}
                className="text-xs font-bold text-emerald-600 hover:underline flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Přidat</span>
              </button>
            </div>

            <div className="space-y-2.5">
              {(!pet.medical_records || pet.medical_records.length === 0) ? (
                <p className="text-xs text-zinc-400 py-4 text-center">Zatím žádné lékařské záznamy.</p>
              ) : (
                pet.medical_records.map((rec) => (
                  <div key={rec.id} className="p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-800 text-xs space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-zinc-800 dark:text-zinc-200">{rec.title}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300">
                        {rec.record_type}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-zinc-500">
                      <span>Provedeno: {new Date(rec.performed_date).toLocaleDateString('cs-CZ')}</span>
                      {rec.valid_until && (
                        <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                          Platnost do: {new Date(rec.valid_until).toLocaleDateString('cs-CZ')}
                        </span>
                      )}
                    </div>
                    {rec.notes && <p className="text-[11px] text-zinc-400">{rec.notes}</p>}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Active Medications */}
          <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <Pill className="w-4 h-4 text-purple-500" />
                <span>Aktuální léky</span>
              </h3>
              <button
                onClick={() => setIsAddMedicationOpen(true)}
                className="text-xs font-bold text-purple-600 hover:underline flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Předepsat lék</span>
              </button>
            </div>

            <div className="space-y-2.5">
              {(!pet.medications || pet.medications.length === 0) ? (
                <p className="text-xs text-zinc-400 py-3 text-center">Žádné užívané léky.</p>
              ) : (
                pet.medications.map((m) => (
                  <div key={m.id} className="p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-800 text-xs flex items-center justify-between gap-3">
                    <div>
                      <strong className="text-zinc-900 dark:text-zinc-100 block">{m.name}</strong>
                      <span className="text-[11px] text-zinc-500">
                        {m.dosage} &bull; {m.frequency}
                      </span>
                      {m.notes && <p className="text-[10px] text-zinc-400 mt-0.5">{m.notes}</p>}
                    </div>

                    <button
                      onClick={() => handleDeleteMedication(m.id)}
                      className="p-1.5 rounded-xl hover:bg-rose-50 hover:text-rose-600 text-zinc-400 transition"
                      title="Odebrat lék"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Weight Card */}
          <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <Scale className="w-4 h-4 text-amber-500" />
                <span>Hmotnost ({pet.latest_weight_kg ? `${pet.latest_weight_kg} kg` : 'nezváženo'})</span>
              </h3>
              <button
                onClick={() => setIsWeightOpen(true)}
                className="text-xs font-bold text-amber-600 hover:underline flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Zapsat váhu</span>
              </button>
            </div>

            <div className="flex items-center justify-between p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/40 text-xs">
              <span className="text-zinc-500">Celkem záznamů o váze: {pet.weight_logs?.length || 0}</span>
              <button
                onClick={() => setIsWeightOpen(true)}
                className="text-amber-600 font-bold hover:underline"
              >
                Zobrazit graf a historii &rarr;
              </button>
            </div>
          </div>
        </div>

        {/* Right Col: Tasks & Diary */}
        <div className="lg:col-span-6 space-y-6">
          {/* Care Tasks */}
          <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-amber-500" />
                <span>Plán péče a úkoly</span>
              </h3>
              <button
                onClick={() => setIsAddTaskOpen(true)}
                className="text-xs font-bold text-amber-600 hover:underline flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Nový úkol</span>
              </button>
            </div>

            <div className="space-y-2.5">
              {(!pet.tasks || pet.tasks.length === 0) ? (
                <p className="text-xs text-zinc-400 py-4 text-center">Žádné naplánované úkoly.</p>
              ) : (
                pet.tasks.map((task) => (
                  <div key={task.id} className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800 flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-start gap-3">
                      <button
                        onClick={() => handleCompleteTask(task.id)}
                        className="mt-0.5 w-5 h-5 rounded-lg border border-zinc-300 dark:border-zinc-600 flex items-center justify-center hover:bg-emerald-500 hover:border-emerald-500 hover:text-white transition"
                      >
                        <Check className="w-3.5 h-3.5 opacity-0 hover:opacity-100" />
                      </button>
                      <div>
                        <h4 className="font-bold text-zinc-800 dark:text-zinc-200">{task.title}</h4>
                        <p className="text-[11px] text-zinc-500">
                          Termín: <span className="font-semibold text-zinc-700 dark:text-zinc-300">{new Date(task.due_date).toLocaleDateString('cs-CZ')}</span>
                          {task.interval_days > 0 && ` (opakovat každých ${task.interval_days} dní)`}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => handleCompleteTask(task.id)}
                      className="px-2.5 py-1 rounded-xl text-[11px] font-bold bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 hover:bg-emerald-500 hover:text-white transition"
                    >
                      Splnit
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Diary & Photo Timeline */}
          <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <Camera className="w-4 h-4 text-amber-500" />
                <span>Deník zážitků & Fotky</span>
              </h3>
              <button
                onClick={() => setIsAddLogOpen(true)}
                className="text-xs font-bold text-amber-600 hover:underline flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Přidat foto / zápis</span>
              </button>
            </div>

            <div className="space-y-3">
              {(!pet.log_entries || pet.log_entries.length === 0) ? (
                <p className="text-xs text-zinc-400 py-6 text-center">Zatím žádné fotky ani zápisy.</p>
              ) : (
                pet.log_entries.map((log) => (
                  <div key={log.id} className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-800 flex flex-col sm:flex-row gap-3 text-xs">
                    {log.image_url && (
                      <div className="w-full sm:w-24 h-24 rounded-xl overflow-hidden bg-zinc-200 shrink-0">
                        <img src={log.image_url} alt={log.title} className="w-full h-full object-cover" />
                      </div>
                    )}
                    <div className="flex-1">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300">
                          {log.entry_type}
                        </span>
                        <span className="text-[11px] text-zinc-400">
                          {new Date(log.created_at).toLocaleDateString('cs-CZ')}
                        </span>
                      </div>
                      <h4 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">{log.title}</h4>
                      {log.notes && <p className="text-zinc-600 dark:text-zinc-400 mt-1 whitespace-pre-line leading-relaxed">{log.notes}</p>}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal: Add Medical Record */}
      {isAddMedicalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-100">Nový lékařský záznam</h3>
              <button onClick={() => setIsAddMedicalOpen(false)} className="p-1 text-zinc-400 hover:text-zinc-600"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleCreateMedicalRecord} className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 mb-1">Typ záznamu</label>
                <select value={medRecordType} onChange={(e) => setMedRecordType(e.target.value)} className="w-full px-3 py-2 rounded-2xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs">
                  <option value="vaccination">Očkování</option>
                  <option value="deworming">Odčervení</option>
                  <option value="antiparasitic">Antiparazitika (klíšťata/blechy)</option>
                  <option value="checkup">Pravidelná kontrola</option>
                  <option value="surgery">Operace / Zákrok</option>
                  <option value="other">Jiné</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 mb-1">Název vakcíny / úkonu *</label>
                <input type="text" required placeholder="např. Nobivac DHPPi, Dehinel Plus..." value={medRecordTitle} onChange={(e) => setMedRecordTitle(e.target.value)} className="w-full px-3 py-2 rounded-2xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 mb-1">Datum podání *</label>
                  <input type="date" required value={medRecordDate} onChange={(e) => setMedRecordDate(e.target.value)} className="w-full px-3 py-2 rounded-2xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs" />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 mb-1">Platnost do (přeočkování)</label>
                  <input type="date" value={medRecordValidUntil} onChange={(e) => setMedRecordValidUntil(e.target.value)} className="w-full px-3 py-2 rounded-2xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs" />
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 mb-1">Poznámka</label>
                <input type="text" placeholder="Šarže, reakce, klinika..." value={medRecordNotes} onChange={(e) => setMedRecordNotes(e.target.value)} className="w-full px-3 py-2 rounded-2xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs" />
              </div>
              <div className="flex gap-2 pt-2">
                <button type="submit" className="flex-1 py-2.5 rounded-2xl font-bold text-xs bg-emerald-600 text-white hover:bg-emerald-700 transition">Uložit záznam</button>
                <button type="button" onClick={() => setIsAddMedicalOpen(false)} className="px-4 py-2.5 rounded-2xl text-xs bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">Zrušit</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Medication */}
      {isAddMedicationOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-100">Předepsat lék</h3>
              <button onClick={() => setIsAddMedicationOpen(false)} className="p-1 text-zinc-400 hover:text-zinc-600"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleCreateMedication} className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 mb-1">Název léku *</label>
                <input type="text" required placeholder="např. Apoquel 16mg, Amoksiklav..." value={medName} onChange={(e) => setMedName(e.target.value)} className="w-full px-3 py-2 rounded-2xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 mb-1">Dávkování *</label>
                  <input type="text" required placeholder="např. 1 tableta" value={medDosage} onChange={(e) => setMedDosage(e.target.value)} className="w-full px-3 py-2 rounded-2xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs" />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 mb-1">Frekvence *</label>
                  <input type="text" required placeholder="např. 2x denně s jídlem" value={medFrequency} onChange={(e) => setMedFrequency(e.target.value)} className="w-full px-3 py-2 rounded-2xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs" />
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 mb-1">Poznámka k užívání</label>
                <input type="text" placeholder="Délka léčby, skladovat v lednici..." value={medNotes} onChange={(e) => setMedNotes(e.target.value)} className="w-full px-3 py-2 rounded-2xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs" />
              </div>
              <div className="flex gap-2 pt-2">
                <button type="submit" className="flex-1 py-2.5 rounded-2xl font-bold text-xs bg-purple-600 text-white hover:bg-purple-700 transition">Uložit lék</button>
                <button type="button" onClick={() => setIsAddMedicationOpen(false)} className="px-4 py-2.5 rounded-2xl text-xs bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">Zrušit</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Care Task */}
      {isAddTaskOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-100">Naplánovat úkol péče</h3>
              <button onClick={() => setIsAddTaskOpen(false)} className="p-1 text-zinc-400 hover:text-zinc-600"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleCreateTask} className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 mb-1">Typ úkolu</label>
                <select value={taskType} onChange={(e) => setTaskType(e.target.value)} className="w-full px-3 py-2 rounded-2xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs">
                  <option value="vaccination">Očkování</option>
                  <option value="deworming">Odčervení</option>
                  <option value="antiparasitic">Antiparazitní pipeta / obojek</option>
                  <option value="vet_visit">Kontrola u veterináře</option>
                  <option value="grooming">Stříhání srsti / drápků</option>
                  <option value="custom">Vlastní úkol</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 mb-1">Název úkolu *</label>
                <input type="text" required placeholder="např. Koupit pipetu Bravecto..." value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)} className="w-full px-3 py-2 rounded-2xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 mb-1">Termín *</label>
                  <input type="date" required value={taskDueDate} onChange={(e) => setTaskDueDate(e.target.value)} className="w-full px-3 py-2 rounded-2xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs" />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 mb-1">Opakovat (dní, 0 = 1x)</label>
                  <input type="number" min={0} value={taskInterval} onChange={(e) => setTaskInterval(Number(e.target.value))} className="w-full px-3 py-2 rounded-2xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs" />
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <button type="submit" className="flex-1 py-2.5 rounded-2xl font-bold text-xs bg-amber-500 text-white hover:bg-amber-600 transition">Naplánovat</button>
                <button type="button" onClick={() => setIsAddTaskOpen(false)} className="px-4 py-2.5 rounded-2xl text-xs bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">Zrušit</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Diary Entry */}
      {isAddLogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-100">Přidat záznam do deníku</h3>
              <button onClick={() => setIsAddLogOpen(false)} className="p-1 text-zinc-400 hover:text-zinc-600"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleCreateLog} className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 mb-1">Název události *</label>
                <input type="text" required placeholder="např. Výlet k rybníku, Naučil se sedni..." value={logTitle} onChange={(e) => setLogTitle(e.target.value)} className="w-full px-3 py-2 rounded-2xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs" />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 mb-1">URL fotografie (volitelné)</label>
                <input type="url" placeholder="https://..." value={logImageUrl} onChange={(e) => setLogImageUrl(e.target.value)} className="w-full px-3 py-2 rounded-2xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs" />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 mb-1">Popis zážitku</label>
                <textarea rows={3} placeholder="Co se stalo, jak se mazlíček choval..." value={logNotes} onChange={(e) => setLogNotes(e.target.value)} className="w-full px-3 py-2 rounded-2xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs resize-none" />
              </div>
              <div className="flex gap-2 pt-2">
                <button type="submit" className="flex-1 py-2.5 rounded-2xl font-bold text-xs bg-amber-500 text-white hover:bg-amber-600 transition">Uložit do deníku</button>
                <button type="button" onClick={() => setIsAddLogOpen(false)} className="px-4 py-2.5 rounded-2xl text-xs bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">Zrušit</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Other Modals */}
      <PetDoctorModal
        isOpen={isDoctorOpen}
        onClose={() => setIsDoctorOpen(false)}
        petsList={[pet]}
        selectedPet={pet}
      />

      <PetSitterModal
        isOpen={isSitterOpen}
        onClose={() => setIsSitterOpen(false)}
        pet={pet}
      />

      <PetSosModal
        isOpen={isSosOpen}
        onClose={() => setIsSosOpen(false)}
        pet={pet}
      />

      <PetWeightModal
        isOpen={isWeightOpen}
        onClose={() => setIsWeightOpen(false)}
        pet={pet}
        onWeightAdded={() => fetchPet()}
      />
    </div>
  );
};
