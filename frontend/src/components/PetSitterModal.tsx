import React, { useState, useEffect } from 'react';
import {
  Luggage, X, Printer, Phone, AlertTriangle, Pill,
  Utensils, Calendar, ShieldCheck, Heart, Dog, Cat
} from 'lucide-react';
import { api } from '../services/api';
import { Pet, PetSitterProfile } from '../types';
import { useTranslation } from '../i18n';

interface PetSitterModalProps {
  isOpen: boolean;
  onClose: () => void;
  pet: Pet;
}

export const PetSitterModal: React.FC<PetSitterModalProps> = ({
  isOpen,
  onClose,
  pet,
}) => {
  const { t } = useTranslation();
  const [profile, setProfile] = useState<PetSitterProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isOpen && pet) {
      setIsLoading(true);
      api.getPetSitterProfile(pet.id)
        .then((data) => setProfile(data))
        .catch((e) => console.error(e))
        .finally(() => setIsLoading(false));
    }
  }, [isOpen, pet]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-2xl max-h-[90vh] rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between no-print">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-cyan-500 text-white shadow-md shadow-cyan-500/30">
              <Luggage className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-zinc-900 dark:text-zinc-100">
                {t('pet_sitter.modal_title')}
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                {t('pet_sitter.modal_subtitle')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="px-3 py-1.5 rounded-xl font-bold text-xs bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 transition flex items-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>{t('pet_sitter.print')}</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-zinc-400 hover:text-zinc-600 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Area */}
        <div className="p-6 overflow-y-auto space-y-6 print:p-0">
          {isLoading || !profile ? (
            <div className="py-16 text-center text-zinc-400">
              <Luggage className="w-8 h-8 animate-bounce text-cyan-500 mx-auto mb-2" />
              <p className="text-xs">{t('common.loading')}</p>
            </div>
          ) : (
            <>
              {/* Pet Info Card */}
              <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800 flex items-center gap-4">
                {profile.primary_image_url ? (
                  <img
                    src={profile.primary_image_url}
                    alt={profile.name}
                    className="w-16 h-16 rounded-2xl object-cover"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-2xl bg-amber-100 dark:bg-zinc-800 flex items-center justify-center text-amber-600">
                    <Dog className="w-8 h-8" />
                  </div>
                )}
                <div>
                  <h2 className="text-xl font-black text-zinc-900 dark:text-zinc-100">
                    {profile.name}
                  </h2>
                  <p className="text-xs text-zinc-500">
                    {profile.breed || profile.species} &bull; {profile.age} &bull; {profile.gender === 'male' ? 'Samec' : 'Samice'}
                  </p>
                  {profile.microchip_number && (
                    <p className="text-[11px] text-zinc-400 mt-0.5">
                      Číslo čipu: <strong className="font-mono">{profile.microchip_number}</strong>
                    </p>
                  )}
                </div>
              </div>

              {/* Feeding Section */}
              <div className="p-5 rounded-2xl border border-amber-200/80 bg-amber-50/40 dark:bg-amber-950/20 dark:border-amber-900/60 space-y-2">
                <h4 className="font-bold text-sm text-amber-900 dark:text-amber-200 flex items-center gap-2">
                  <Utensils className="w-4 h-4 text-amber-600" />
                  <span>{t('pet_sitter.feeding')}</span>
                </h4>
                <p className="text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed whitespace-pre-line">
                  {profile.feeding_routine}
                </p>
              </div>

              {/* Allergies / Prohibited foods */}
              <div className="p-5 rounded-2xl border border-rose-200/80 bg-rose-50/40 dark:bg-rose-950/20 dark:border-rose-900/60 space-y-2">
                <h4 className="font-bold text-sm text-rose-900 dark:text-rose-200 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                  <span>{t('pet_sitter.allergies')}</span>
                </h4>
                <p className="text-xs text-rose-800 dark:text-rose-300 font-medium leading-relaxed whitespace-pre-line">
                  {profile.allergies_warning}
                </p>
              </div>

              {/* Medications if any */}
              {profile.active_medications && profile.active_medications.length > 0 && (
                <div className="p-5 rounded-2xl border border-purple-200/80 bg-purple-50/40 dark:bg-purple-950/20 dark:border-purple-900/60 space-y-2">
                  <h4 className="font-bold text-sm text-purple-900 dark:text-purple-200 flex items-center gap-2">
                    <Pill className="w-4 h-4 text-purple-600" />
                    <span>{t('pet_sitter.meds')}</span>
                  </h4>
                  <div className="space-y-2">
                    {profile.active_medications.map((m, idx) => (
                      <div key={idx} className="text-xs p-2.5 rounded-xl bg-white/70 dark:bg-zinc-900/70">
                        <strong className="text-zinc-900 dark:text-zinc-100">{m.name}</strong> – {m.dosage} ({m.frequency})
                        {m.notes && <p className="text-zinc-500 text-[11px] mt-0.5">{m.notes}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Routine & Habits */}
              <div className="p-5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-800 space-y-2">
                <h4 className="font-bold text-sm text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-zinc-500" />
                  <span>Denní režim & Povaha</span>
                </h4>
                <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed whitespace-pre-line">
                  {profile.daily_routine_notes}
                </p>
              </div>

              {/* Emergency Contacts */}
              <div className="p-5 rounded-2xl bg-zinc-900 text-white dark:bg-zinc-800 space-y-3">
                <h4 className="font-bold text-sm flex items-center gap-2 text-amber-400">
                  <Phone className="w-4 h-4" />
                  <span>{t('pet_sitter.contacts')}</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-zinc-800 dark:bg-zinc-700/60">
                    <span className="text-zinc-400 block text-[11px]">Běžný veterinář:</span>
                    <strong className="text-sm block">{profile.vet_contacts.vet_clinic || profile.vet_contacts.vet_name || 'Neuvedeno'}</strong>
                    <span className="text-amber-400 font-bold">{profile.vet_contacts.vet_phone || 'Bez tel.'}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-zinc-800 dark:bg-zinc-700/60">
                    <span className="text-zinc-400 block text-[11px]">24/7 Pohotovost:</span>
                    <strong className="text-sm block">{profile.vet_contacts.emergency_vet_clinic || 'Pohotovostní klinika'}</strong>
                    <span className="text-rose-400 font-bold">{profile.vet_contacts.emergency_vet_phone || 'Bez tel.'}</span>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
