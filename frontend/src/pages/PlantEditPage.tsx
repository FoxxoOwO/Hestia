import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Flower2, ArrowLeft, Save, Sparkles, Upload, Sun,
  Droplets, ShieldCheck, Heart, AlertTriangle, Snowflake
} from 'lucide-react';
import { api } from '../services/api';
import { RoomType, LightRequirement, PetToxicity, HealthStatus } from '../types';
import { useTranslation } from '../i18n';
import { UiSwitch } from '../components/UiSwitch';

export const PlantEditPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id && id !== 'new');
  const navigate = useNavigate();
  const { t } = useTranslation();

  // Form Fields
  const [name, setName] = useState('');
  const [speciesCzech, setSpeciesCzech] = useState('');
  const [speciesLatin, setSpeciesLatin] = useState('');
  const [room, setRoom] = useState<RoomType>('living_room');
  const [primaryImageUrl, setPrimaryImageUrl] = useState('');
  const [lightRequirement, setLightRequirement] = useState<LightRequirement>('bright_indirect');
  const [wateringInterval, setWateringInterval] = useState<number>(7);
  const [winterWateringInterval, setWinterWateringInterval] = useState<number>(14);
  const [fertilizingInterval, setFertilizingInterval] = useState<number>(14);
  const [mistingRequired, setMistingRequired] = useState(false);
  const [potDiameter, setPotDiameter] = useState<number | ''>('');
  const [substrateType, setSubstrateType] = useState('');
  const [petToxicity, setPetToxicity] = useState<PetToxicity>('safe');
  const [petToxicityNotes, setPetToxicityNotes] = useState('');
  const [healthStatus, setHealthStatus] = useState<HealthStatus>('healthy');
  const [healthNotes, setHealthNotes] = useState('');
  const [isWinterMode, setIsWinterMode] = useState(false);
  const [notes, setNotes] = useState('');

  const [isLoading, setIsLoading] = useState(isEdit);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isEdit && id) {
      api.getPlant(Number(id))
        .then((p) => {
          setName(p.name);
          setSpeciesCzech(p.species_czech || '');
          setSpeciesLatin(p.species_latin || '');
          setRoom(p.room);
          setPrimaryImageUrl(p.primary_image_url || '');
          setLightRequirement(p.light_requirement);
          setWateringInterval(p.watering_interval_days);
          setWinterWateringInterval(p.winter_watering_interval_days);
          setFertilizingInterval(p.fertilizing_interval_days);
          setMistingRequired(p.misting_required);
          setPotDiameter(p.pot_diameter_cm || '');
          setSubstrateType(p.substrate_type || '');
          setPetToxicity(p.pet_toxicity);
          setPetToxicityNotes(p.pet_toxicity_notes || '');
          setHealthStatus(p.health_status);
          setHealthNotes(p.health_notes || '');
          setIsWinterMode(p.is_winter_mode);
          setNotes(p.notes || '');
        })
        .catch((err) => {
          console.error(err);
          setError('Nepodařilo se načíst rostlinu.');
        })
        .finally(() => setIsLoading(false));
    }
  }, [isEdit, id]);

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setPrimaryImageUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Zadejte prosím název rostliny.');
      return;
    }

    setIsSaving(true);
    setError(null);

    const payload = {
      name: name.trim(),
      species_czech: speciesCzech.trim() || undefined,
      species_latin: speciesLatin.trim() || undefined,
      room,
      primary_image_url: primaryImageUrl || undefined,
      light_requirement: lightRequirement,
      watering_interval_days: Number(wateringInterval) || 7,
      winter_watering_interval_days: Number(winterWateringInterval) || 14,
      fertilizing_interval_days: Number(fertilizingInterval) || 14,
      misting_required: mistingRequired,
      pot_diameter_cm: potDiameter ? Number(potDiameter) : undefined,
      substrate_type: substrateType.trim() || undefined,
      pet_toxicity: petToxicity,
      pet_toxicity_notes: petToxicityNotes.trim() || undefined,
      health_status: healthStatus,
      health_notes: healthNotes.trim() || undefined,
      is_winter_mode: isWinterMode,
      notes: notes.trim() || undefined,
    };

    try {
      if (isEdit && id) {
        const updated = await api.updatePlant(Number(id), payload);
        navigate(`/plants/${updated.id}`);
      } else {
        const created = await api.createPlant(payload);
        navigate(`/plants/${created.id}`);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Chyba při ukládání rostliny.');
    } finally {
      setIsSaving(false);
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

  return (
    <div className="max-w-4xl mx-auto pb-24 space-y-6">
      {/* Top Header */}
      <div className="flex items-center justify-between gap-4">
        <Link
          to={isEdit && id ? `/plants/${id}` : '/plants'}
          className="inline-flex items-center gap-2 text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{isEdit ? 'Zpět na detail rostliny' : 'Zpět do přehledu'}</span>
        </Link>
      </div>

      <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-6">
        <div>
          <h1 className="text-2xl font-extrabold text-zinc-900 dark:text-zinc-100 flex items-center gap-2.5">
            <Flower2 className="w-6 h-6 text-emerald-500" />
            <span>{isEdit ? 'Upravit pokojovku' : 'Přidat novou rostlinu'}</span>
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Zadejte parametry péče, umístění v bytě a bezpečnost pro domácí mazlíčky.
          </p>
        </div>

        {error && (
          <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 border-b border-zinc-100 dark:border-zinc-800 pb-2">
              Základní údaje
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Název rostliny (přezdívka) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="např. Monstera v obýváku, Fíkus Benjamínek..."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Český druh
                </label>
                <input
                  type="text"
                  placeholder="např. Monstera skvostná, Zelenec..."
                  value={speciesCzech}
                  onChange={(e) => setSpeciesCzech(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Latinský název
                </label>
                <input
                  type="text"
                  placeholder="např. Monstera deliciosa, Chlorophytum comosum..."
                  value={speciesLatin}
                  onChange={(e) => setSpeciesLatin(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Místnost v domácnosti
                </label>
                <select
                  value={room}
                  onChange={(e: any) => setRoom(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="living_room">{t('plants.rooms.living_room')}</option>
                  <option value="bedroom">{t('plants.rooms.bedroom')}</option>
                  <option value="kitchen">{t('plants.rooms.kitchen')}</option>
                  <option value="bathroom">{t('plants.rooms.bathroom')}</option>
                  <option value="balcony">{t('plants.rooms.balcony')}</option>
                  <option value="hallway">{t('plants.rooms.hallway')}</option>
                  <option value="office">{t('plants.rooms.office')}</option>
                  <option value="other">{t('plants.rooms.other')}</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Nároky na světlo
                </label>
                <select
                  value={lightRequirement}
                  onChange={(e: any) => setLightRequirement(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="direct_sun">{t('plants.light.direct_sun')}</option>
                  <option value="bright_indirect">{t('plants.light.bright_indirect')}</option>
                  <option value="semi_shade">{t('plants.light.semi_shade')}</option>
                  <option value="shade">{t('plants.light.shade')}</option>
                </select>
              </div>
            </div>

            {/* Photo / Image URL */}
            <div className="space-y-2 pt-2">
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                Fotografie rostliny
              </label>
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageFileChange}
                  className="text-xs text-zinc-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700 dark:file:bg-emerald-950/40 dark:file:text-emerald-300 hover:file:bg-emerald-100"
                />
                <span className="text-xs text-zinc-400">nebo zadejte URL:</span>
                <input
                  type="url"
                  placeholder="https://..."
                  value={primaryImageUrl}
                  onChange={(e) => setPrimaryImageUrl(e.target.value)}
                  className="flex-1 px-3 py-1.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs text-zinc-900 dark:text-zinc-100"
                />
              </div>

              {primaryImageUrl && (
                <div className="mt-2 w-28 h-28 rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-700">
                  <img src={primaryImageUrl} alt="Preview" className="w-full h-full object-cover" />
                </div>
              )}
            </div>
          </div>

          {/* Watering & Care Schedules */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 border-b border-zinc-100 dark:border-zinc-800 pb-2 flex items-center gap-2">
              <Droplets className="w-4 h-4 text-blue-500" />
              <span>Plánování zálivky a péče</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Letní zálivka (každých X dní)
                </label>
                <input
                  type="number"
                  min={1}
                  required
                  value={wateringInterval}
                  onChange={(e) => setWateringInterval(Number(e.target.value))}
                  className="w-full px-4 py-2.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-sm text-zinc-900 dark:text-zinc-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Zimní zálivka (každých X dní)
                </label>
                <input
                  type="number"
                  min={1}
                  required
                  value={winterWateringInterval}
                  onChange={(e) => setWinterWateringInterval(Number(e.target.value))}
                  className="w-full px-4 py-2.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-sm text-zinc-900 dark:text-zinc-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Hnojení (každých X dní)
                </label>
                <input
                  type="number"
                  min={1}
                  value={fertilizingInterval}
                  onChange={(e) => setFertilizingInterval(Number(e.target.value))}
                  className="w-full px-4 py-2.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-sm text-zinc-900 dark:text-zinc-100"
                />
              </div>
            </div>

            {/* Checkboxes for misting & winter mode using authentic UiSwitch */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <UiSwitch
                checked={mistingRequired}
                onChange={setMistingRequired}
                label="Vyžaduje rosení listů"
                description="Vyšší vzdušná vlhkost"
              />

              <UiSwitch
                checked={isWinterMode}
                onChange={setIsWinterMode}
                label={
                  <span className="flex items-center gap-1.5">
                    <Snowflake className="w-3.5 h-3.5 text-blue-500" />
                    Zimní klidový režim aktivní
                  </span>
                }
                description="Používá zimní interval zálivky"
              />
            </div>
          </div>

          {/* Plant Passport & Pot Specs */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 border-b border-zinc-100 dark:border-zinc-800 pb-2">
              Květináč & Půda
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Průměr květináče (cm)
                </label>
                <input
                  type="number"
                  min={1}
                  placeholder="např. 18"
                  value={potDiameter}
                  onChange={(e) => setPotDiameter(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full px-4 py-2.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-sm text-zinc-900 dark:text-zinc-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Doporučený substrát
                </label>
                <input
                  type="text"
                  placeholder="např. Mix pro aroidy: piniová kůra, perlit, rašelina..."
                  value={substrateType}
                  onChange={(e) => setSubstrateType(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-sm text-zinc-900 dark:text-zinc-100"
                />
              </div>
            </div>
          </div>

          {/* Pet Toxicity & Health Status */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 border-b border-zinc-100 dark:border-zinc-800 pb-2 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span>Bezpečnost pro mazlíčky & Zdravotní stav</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Toxicita pro zvířata
                </label>
                <select
                  value={petToxicity}
                  onChange={(e: any) => setPetToxicity(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-sm text-zinc-900 dark:text-zinc-100"
                >
                  <option value="safe">🐾 Pet Friendly (Bezpečné pro psy a kočky)</option>
                  <option value="mildly_toxic">⚡ Mírně toxické (dráždí tlamu a žaludek)</option>
                  <option value="toxic">⚠️ Toxické pro kočky a psy!</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Zdravotní stav
                </label>
                <select
                  value={healthStatus}
                  onChange={(e: any) => setHealthStatus(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-sm text-zinc-900 dark:text-zinc-100"
                >
                  <option value="healthy">🌱 Zdravá a prosperující</option>
                  <option value="needs_attention">⚠️ Vyžaduje pozornost / kontrolu</option>
                  <option value="sick">🚨 Nemocná (škůdci / hniloba)</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Podrobnosti k toxicitě
                </label>
                <input
                  type="text"
                  placeholder="např. Obsahuje nerozpustné šťavelany vápenaté, držet mimo dosah koťat..."
                  value={petToxicityNotes}
                  onChange={(e) => setPetToxicityNotes(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-sm text-zinc-900 dark:text-zinc-100"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Obecné poznámky k pěstování
                </label>
                <textarea
                  rows={3}
                  placeholder="Kde byla koupena, jaké hnojivo má ráda, specifické chování..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-sm text-zinc-900 dark:text-zinc-100 resize-none"
                />
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-end gap-3">
            <Link
              to={isEdit && id ? `/plants/${id}` : '/plants'}
              className="px-5 py-2.5 rounded-2xl text-xs font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 transition"
            >
              Zrušit
            </Link>

            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center gap-2 px-6 py-2.5 rounded-2xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20 transition disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Ukládám...' : isEdit ? 'Uložit změny' : 'Vytvořit kytku'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
