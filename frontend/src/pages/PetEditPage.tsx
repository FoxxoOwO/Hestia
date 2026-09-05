import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Dog, Cat, ArrowLeft, Save, Upload, AlertTriangle,
  Utensils, ShieldAlert, Stethoscope, Scale
} from 'lucide-react';
import { api } from '../services/api';
import { PetSpecies, PetGender } from '../types';
import { useTranslation } from '../i18n';

export const PetEditPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id && id !== 'new');
  const navigate = useNavigate();
  const { t } = useTranslation();

  // Form Fields
  const [name, setName] = useState('');
  const [species, setSpecies] = useState<PetSpecies>('dog');
  const [breed, setBreed] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [gender, setGender] = useState<PetGender>('unknown');
  const [isNeutered, setIsNeutered] = useState(false);
  const [color, setColor] = useState('');
  const [microchipNumber, setMicrochipNumber] = useState('');
  const [passportNumber, setPassportNumber] = useState('');
  const [primaryImageUrl, setPrimaryImageUrl] = useState('');
  const [initialWeight, setInitialWeight] = useState<number | ''>('');

  const [dietaryNeeds, setDietaryNeeds] = useState('');
  const [allergies, setAllergies] = useState('');

  const [vetName, setVetName] = useState('');
  const [vetClinic, setVetClinic] = useState('');
  const [vetPhone, setVetPhone] = useState('');
  const [vetAddress, setVetAddress] = useState('');
  const [emergencyVetClinic, setEmergencyVetClinic] = useState('');
  const [emergencyVetPhone, setEmergencyVetPhone] = useState('');

  const [notes, setNotes] = useState('');

  const [isLoading, setIsLoading] = useState(isEdit);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isEdit && id) {
      api.getPet(Number(id))
        .then((p) => {
          setName(p.name);
          setSpecies(p.species);
          setBreed(p.breed || '');
          setBirthDate(p.birth_date || '');
          setGender(p.gender);
          setIsNeutered(p.is_neutered);
          setColor(p.color || '');
          setMicrochipNumber(p.microchip_number || '');
          setPassportNumber(p.passport_number || '');
          setPrimaryImageUrl(p.primary_image_url || '');
          setDietaryNeeds(p.dietary_needs || '');
          setAllergies(p.allergies_and_intolerances || '');
          setVetName(p.vet_name || '');
          setVetClinic(p.vet_clinic || '');
          setVetPhone(p.vet_phone || '');
          setVetAddress(p.vet_address || '');
          setEmergencyVetClinic(p.emergency_vet_clinic || '');
          setEmergencyVetPhone(p.emergency_vet_phone || '');
          setNotes(p.notes || '');
        })
        .catch((e) => {
          console.error(e);
          setError('Nepodařilo se načíst data mazlíčka.');
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
      setError('Zadejte prosím jméno mazlíčka.');
      return;
    }

    setIsSaving(true);
    setError(null);

    const payload = {
      name: name.trim(),
      species,
      breed: breed.trim() || undefined,
      birth_date: birthDate || undefined,
      gender,
      is_neutered: isNeutered,
      color: color.trim() || undefined,
      microchip_number: microchipNumber.trim() || undefined,
      passport_number: passportNumber.trim() || undefined,
      primary_image_url: primaryImageUrl || undefined,
      dietary_needs: dietaryNeeds.trim() || undefined,
      allergies_and_intolerances: allergies.trim() || undefined,
      vet_name: vetName.trim() || undefined,
      vet_clinic: vetClinic.trim() || undefined,
      vet_phone: vetPhone.trim() || undefined,
      vet_address: vetAddress.trim() || undefined,
      emergency_vet_clinic: emergencyVetClinic.trim() || undefined,
      emergency_vet_phone: emergencyVetPhone.trim() || undefined,
      notes: notes.trim() || undefined,
      initial_weight_kg: !isEdit && initialWeight ? Number(initialWeight) : undefined,
    };

    try {
      if (isEdit && id) {
        const updated = await api.updatePet(Number(id), payload);
        navigate(`/pets/${updated.id}`);
      } else {
        const created = await api.createPet(payload);
        navigate(`/pets/${created.id}`);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Chyba při ukládání mazlíčka.');
    } finally {
      setIsSaving(false);
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

  return (
    <div className="max-w-4xl mx-auto pb-24 space-y-6">
      {/* Top Header */}
      <div className="flex items-center justify-between gap-4">
        <Link
          to={isEdit && id ? `/pets/${id}` : '/pets'}
          className="inline-flex items-center gap-2 text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:text-amber-600 dark:hover:text-amber-400 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{isEdit ? 'Zpět na profil mazlíčka' : 'Zpět do přehledu'}</span>
        </Link>
      </div>

      <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-6">
        <div>
          <h1 className="text-2xl font-black text-zinc-900 dark:text-zinc-100 flex items-center gap-2.5">
            <Dog className="w-6 h-6 text-amber-500" />
            <span>{isEdit ? `Upravit mazlíčka: ${name}` : 'Nový mazlíček do rodiny'}</span>
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Zadejte identifikační údaje, očkování, jídelníček a kontakt na veterináře.
          </p>
        </div>

        {error && (
          <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 border-b border-zinc-100 dark:border-zinc-800 pb-2">
              Základní identifikační údaje
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Jméno mazlíčka *
                </label>
                <input
                  type="text"
                  required
                  placeholder="např. Baddy, Mia, Max..."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Druh zvířete *
                </label>
                <select
                  value={species}
                  onChange={(e: any) => setSpecies(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="dog">Pes 🐕</option>
                  <option value="cat">Kočka 🐈</option>
                  <option value="rabbit">Králík 🐇</option>
                  <option value="bird">Pták 🦜</option>
                  <option value="rodent">Hlodavec (morče, křeček) 🐹</option>
                  <option value="reptile">Plaz 🦎</option>
                  <option value="other">Ostatní</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Plemeno
                </label>
                <input
                  type="text"
                  placeholder="např. Zlatý retrívr, Britská krátkosrstá..."
                  value={breed}
                  onChange={(e) => setBreed(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-sm text-zinc-900 dark:text-zinc-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Datum narození (nebo odhad)
                </label>
                <input
                  type="date"
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-sm text-zinc-900 dark:text-zinc-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Pohlaví
                </label>
                <select
                  value={gender}
                  onChange={(e: any) => setGender(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-sm text-zinc-900 dark:text-zinc-100"
                >
                  <option value="male">Samec (kluk)</option>
                  <option value="female">Samice (holka)</option>
                  <option value="unknown">Neznámé / neuvedeno</option>
                </select>
              </div>

              <div className="flex items-center">
                <label className="flex items-center gap-3 p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800 cursor-pointer w-full mt-5 sm:mt-0">
                  <input
                    type="checkbox"
                    checked={isNeutered}
                    onChange={(e) => setIsNeutered(e.target.checked)}
                    className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500"
                  />
                  <div>
                    <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200 block">
                      Kastrovaný / Kastrovaná
                    </span>
                    <span className="text-[11px] text-zinc-400">Pomáhá sledovat sklon k nadváze</span>
                  </div>
                </label>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Barva srsti / zbarvení
                </label>
                <input
                  type="text"
                  placeholder="např. Zlatá krémová, Černá s bílou náprsenkou..."
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-sm text-zinc-900 dark:text-zinc-100"
                />
              </div>

              {!isEdit && (
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Aktuální hmotnost (kg)
                  </label>
                  <input
                    type="number"
                    step="0.05"
                    min="0.05"
                    placeholder="např. 12.5"
                    value={initialWeight}
                    onChange={(e) => setInitialWeight(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-4 py-2.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-sm text-zinc-900 dark:text-zinc-100"
                  />
                </div>
              )}
            </div>

            {/* Microchip & Passport */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Číslo mikročipu
                </label>
                <input
                  type="text"
                  placeholder="15-místný kód (např. 203098100123456)"
                  value={microchipNumber}
                  onChange={(e) => setMicrochipNumber(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-sm text-zinc-900 dark:text-zinc-100 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Číslo pasu pro zvířata v zájmovém chovu
                </label>
                <input
                  type="text"
                  placeholder="např. CZ 1234567"
                  value={passportNumber}
                  onChange={(e) => setPassportNumber(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-sm text-zinc-900 dark:text-zinc-100 font-mono"
                />
              </div>
            </div>

            {/* Photo */}
            <div className="space-y-2 pt-2">
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                Fotografie mazlíčka
              </label>
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageFileChange}
                  className="text-xs text-zinc-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-amber-50 file:text-amber-700 dark:file:bg-amber-950/40 dark:file:text-amber-300 hover:file:bg-amber-100"
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

          {/* Diet & Allergies */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 border-b border-zinc-100 dark:border-zinc-800 pb-2 flex items-center gap-2">
              <Utensils className="w-4 h-4 text-amber-500" />
              <span>Jídelníček & Potravinová omezení</span>
            </h3>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Krmná dávka & Oblíbené krmivo (co a kolik jí)
              </label>
              <textarea
                rows={2}
                placeholder="např. Granule Brit Care jehněčí 2x denně 150g (ráno v 7:30 a večer v 18:00), miluje mrkev a sušené plíce..."
                value={dietaryNeeds}
                onChange={(e) => setDietaryNeeds(e.target.value)}
                className="w-full px-4 py-2.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-sm text-zinc-900 dark:text-zinc-100 resize-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-rose-600 dark:text-rose-400 mb-1 flex items-center gap-1">
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>Alergie & Po čem není dobře (Zákazy)</span>
              </label>
              <textarea
                rows={2}
                placeholder="např. Alergie na kuřecí maso, nesnáší laktózu (mléko způsobuje průjem), zákaz čokolády a hroznů..."
                value={allergies}
                onChange={(e) => setAllergies(e.target.value)}
                className="w-full px-4 py-2.5 rounded-2xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/60 text-sm text-zinc-900 dark:text-zinc-100 resize-none"
              />
            </div>
          </div>

          {/* Veterinary Care */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 border-b border-zinc-100 dark:border-zinc-800 pb-2 flex items-center gap-2">
              <Stethoscope className="w-4 h-4 text-rose-500" />
              <span>Veterinární péče & Pohotovost</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Veterinární klinika / Lékař
                </label>
                <input
                  type="text"
                  placeholder="např. Veterinární klinika U Lesa, MVDr. Novák"
                  value={vetClinic}
                  onChange={(e) => setVetClinic(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-sm text-zinc-900 dark:text-zinc-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Telefon na stálého veterináře
                </label>
                <input
                  type="tel"
                  placeholder="+420 608 123 456"
                  value={vetPhone}
                  onChange={(e) => setVetPhone(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-sm text-zinc-900 dark:text-zinc-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  24/7 Veterinární pohotovost (klinika)
                </label>
                <input
                  type="text"
                  placeholder="např. VET24 Pohotovost Nonstop"
                  value={emergencyVetClinic}
                  onChange={(e) => setEmergencyVetClinic(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-sm text-zinc-900 dark:text-zinc-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-rose-600 dark:text-rose-400 mb-1">
                  Telefon na pohotovost (SOS)
                </label>
                <input
                  type="tel"
                  placeholder="+420 222 333 444"
                  value={emergencyVetPhone}
                  onChange={(e) => setEmergencyVetPhone(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900 text-sm text-zinc-900 dark:text-zinc-100"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Poznámky k povaze a návykům
                </label>
                <textarea
                  rows={2}
                  placeholder="Přátelský, bojí se ohňostrojů, rád plave, rád spí v posteli..."
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
              to={isEdit && id ? `/pets/${id}` : '/pets'}
              className="px-5 py-2.5 rounded-2xl text-xs font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 transition"
            >
              Zrušit
            </Link>

            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center gap-2 px-6 py-2.5 rounded-2xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white shadow-md shadow-amber-500/25 transition disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Ukládám...' : isEdit ? 'Uložit změny' : 'Založit profil'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
