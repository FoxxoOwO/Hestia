import React, { useState } from 'react';
import {
  Stethoscope, X, Camera, AlertTriangle, ShieldCheck,
  AlertCircle, Loader2, HeartPulse, Check, Sparkles, PhoneCall
} from 'lucide-react';
import { api } from '../services/api';
import { Pet, PetSymptomResponse } from '../types';
import { useTranslation } from '../i18n';

interface PetDoctorModalProps {
  isOpen: boolean;
  onClose: () => void;
  petsList: Pet[];
  selectedPet?: Pet;
}

export const PetDoctorModal: React.FC<PetDoctorModalProps> = ({
  isOpen,
  onClose,
  petsList,
  selectedPet,
}) => {
  const { t, language } = useTranslation();

  const [chosenPetId, setChosenPetId] = useState<number | ''>(
    selectedPet ? selectedPet.id : petsList.length > 0 ? petsList[0].id : ''
  );
  const [symptoms, setSymptoms] = useState('');
  const [imageBase64, setImageBase64] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [diagnosis, setDiagnosis] = useState<PetSymptomResponse | null>(null);
  const [savedToDiary, setSavedToDiary] = useState(false);

  if (!isOpen) return null;

  const currentPet = petsList.find((p) => p.id === chosenPetId) || selectedPet;

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setImageBase64(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleDiagnose = async () => {
    if (!symptoms.trim() && !imageBase64) {
      setError('Popište prosím příznaky zvířete nebo přiložte fotografii.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setDiagnosis(null);
    setSavedToDiary(false);

    try {
      const data = await api.diagnosePetSymptoms({
        pet_id: currentPet?.id,
        pet_name: currentPet?.name,
        pet_species: currentPet?.species || 'dog',
        pet_age: currentPet?.age_formatted,
        symptoms_description: symptoms.trim() || 'Vyhodnoťte zdravotní stav a viditelný problém z přiložené fotografie.',
        image_base64: imageBase64 || undefined,
        target_language: language,
      });
      setDiagnosis(data);

      // Auto record into pet's diary if pet is selected
      if (currentPet) {
        api.addPetLog(currentPet.id, {
          entry_type: 'symptom_check',
          title: `AI Veterinární konzultace: ${data.assessment_headline}`,
          notes: `${data.urgency_message}\nMožné příčiny: ${data.possible_causes.join(', ')}\nKroky: ${data.action_steps.join(', ')}`,
          image_url: imageBase64 || undefined,
        }).then(() => setSavedToDiary(true)).catch(() => {});
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Chyba při komunikaci s Gemini AI.');
    } finally {
      setIsLoading(false);
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'emergency':
        return (
          <div className="p-4 rounded-2xl bg-rose-500/15 border border-rose-500/40 text-rose-700 dark:text-rose-300 flex items-start gap-3">
            <div className="p-2 rounded-xl bg-rose-600 text-white shrink-0 shadow-md shadow-rose-600/30 animate-pulse">
              <HeartPulse className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-rose-800 dark:text-rose-200">
                🚨 {t('pet_doctor.severity_emergency')}
              </h4>
              <p className="text-xs text-rose-700/90 dark:text-rose-300/90 mt-0.5">
                Vyžaduje okamžitou návštěvu veterinární pohotovosti! Neotálejte.
              </p>
            </div>
          </div>
        );
      case 'medium':
        return (
          <div className="p-4 rounded-2xl bg-amber-500/15 border border-amber-500/40 text-amber-700 dark:text-amber-300 flex items-start gap-3">
            <div className="p-2 rounded-xl bg-amber-500 text-white shrink-0 shadow-md shadow-amber-500/30">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-amber-800 dark:text-amber-200">
                🟡 {t('pet_doctor.severity_medium')}
              </h4>
              <p className="text-xs text-amber-700/90 dark:text-amber-300/90 mt-0.5">
                Doporučujeme objednat se na vyšetření k veterináři během následujících 24 hodin.
              </p>
            </div>
          </div>
        );
      default:
        return (
          <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-700 dark:text-emerald-300 flex items-start gap-3">
            <div className="p-2 rounded-xl bg-emerald-500 text-white shrink-0 shadow-md shadow-emerald-500/30">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-emerald-800 dark:text-emerald-200">
                🟢 {t('pet_doctor.severity_low')}
              </h4>
              <p className="text-xs text-emerald-700/90 dark:text-emerald-300/90 mt-0.5">
                Mírný stav – pokračujte v šetrném režimu a sledujte chování zvířete.
              </p>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-2xl max-h-[90vh] rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-rose-500 text-white shadow-md shadow-rose-500/30">
              <Stethoscope className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-zinc-900 dark:text-zinc-100">
                {t('pet_doctor.modal_title')}
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                {t('pet_doctor.modal_subtitle')}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Pet Selector */}
          {petsList.length > 0 && (
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Kterého mazlíčka se problém týká?
              </label>
              <select
                value={chosenPetId}
                onChange={(e) => setChosenPetId(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-sm text-zinc-900 dark:text-zinc-100"
              >
                {petsList.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.species === 'cat' ? 'Kočka' : 'Pes'}, {p.age_formatted})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Symptoms Textarea */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Popište chování a příznaky
            </label>
            <textarea
              rows={3}
              placeholder={t('pet_doctor.symptoms_placeholder')}
              value={symptoms}
              onChange={(e) => setSymptoms(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-sm text-zinc-900 dark:text-zinc-100 resize-none focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
          </div>

          {/* Photo upload */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Fotografie (rána, oko, zuby, trus, kůže...)
            </label>
            <div className="flex items-center gap-3">
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="text-xs text-zinc-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-rose-50 file:text-rose-700 dark:file:bg-rose-950/40 dark:file:text-rose-300 hover:file:bg-rose-100"
              />
              {imageBase64 && (
                <div className="w-14 h-14 rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-700 shrink-0">
                  <img src={imageBase64} alt="Preview" className="w-full h-full object-cover" />
                </div>
              )}
            </div>
          </div>

          <button
            onClick={handleDiagnose}
            disabled={isLoading}
            className="w-full py-3 rounded-2xl font-bold text-xs bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-600/25 transition flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            <span>{t('pet_doctor.btn_diagnose')}</span>
          </button>

          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs font-semibold">
              {error}
            </div>
          )}

          {/* Diagnosis Results */}
          {diagnosis && !isLoading && (
            <div className="space-y-4 pt-2 border-t border-zinc-100 dark:border-zinc-800 animate-in fade-in">
              {getSeverityBadge(diagnosis.severity)}

              {/* Quick vet contact if emergency/medium */}
              {currentPet?.vet_phone && diagnosis.severity !== 'low' && (
                <div className="p-3.5 rounded-2xl bg-zinc-100 dark:bg-zinc-800/80 flex items-center justify-between gap-3 text-xs">
                  <div>
                    <span className="font-bold text-zinc-800 dark:text-zinc-200 block">
                      {currentPet.vet_clinic || 'Váš veterinář'}
                    </span>
                    <span className="text-zinc-500">{currentPet.vet_phone}</span>
                  </div>
                  <a
                    href={`tel:${currentPet.vet_phone}`}
                    className="px-3.5 py-1.5 rounded-xl font-bold bg-rose-600 hover:bg-rose-700 text-white flex items-center gap-1.5 transition"
                  >
                    <PhoneCall className="w-3.5 h-3.5" />
                    <span>Zavolat</span>
                  </a>
                </div>
              )}

              <div className="p-5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-800 space-y-3.5 text-xs">
                <div>
                  <h4 className="font-bold text-sm text-zinc-900 dark:text-zinc-100 mb-1">
                    {diagnosis.assessment_headline}
                  </h4>
                  <p className="text-zinc-700 dark:text-zinc-300 font-medium">
                    {diagnosis.urgency_message}
                  </p>
                </div>

                {diagnosis.possible_causes && diagnosis.possible_causes.length > 0 && (
                  <div className="pt-2 border-t border-zinc-200/60 dark:border-zinc-700/60">
                    <span className="font-bold text-zinc-800 dark:text-zinc-200 block mb-1">
                      🔍 {t('pet_doctor.possible_causes')}:
                    </span>
                    <ul className="list-disc pl-4 space-y-0.5 text-zinc-600 dark:text-zinc-400">
                      {diagnosis.possible_causes.map((c, i) => (
                        <li key={i}>{c}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {diagnosis.action_steps && diagnosis.action_steps.length > 0 && (
                  <div className="pt-2 border-t border-zinc-200/60 dark:border-zinc-700/60">
                    <span className="font-bold text-zinc-800 dark:text-zinc-200 block mb-1">
                      📋 {t('pet_doctor.action_steps')}:
                    </span>
                    <ol className="list-decimal pl-4 space-y-1 text-zinc-700 dark:text-zinc-300">
                      {diagnosis.action_steps.map((step, i) => (
                        <li key={i}>{step}</li>
                      ))}
                    </ol>
                  </div>
                )}

                {diagnosis.red_flag_symptoms && diagnosis.red_flag_symptoms.length > 0 && (
                  <div className="pt-2 border-t border-zinc-200/60 dark:border-zinc-700/60 text-rose-700 dark:text-rose-400">
                    <span className="font-bold block mb-1">
                      ⚠️ {t('pet_doctor.red_flags')}:
                    </span>
                    <ul className="list-disc pl-4 space-y-0.5">
                      {diagnosis.red_flag_symptoms.map((flag, i) => (
                        <li key={i}>{flag}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {diagnosis.home_care_advice && (
                  <div className="pt-2 border-t border-zinc-200/60 dark:border-zinc-700/60">
                    <span className="font-bold text-zinc-800 dark:text-zinc-200 block mb-0.5">
                      🏡 {t('pet_doctor.home_care')}:
                    </span>
                    <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">
                      {diagnosis.home_care_advice}
                    </p>
                  </div>
                )}

                {savedToDiary && (
                  <p className="pt-2 text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" />
                    <span>Záznam byl automaticky uložen do zdravotního deníku zvířete.</span>
                  </p>
                )}
              </div>

              <p className="text-[10px] text-zinc-400 text-center italic">
                {t('pet_doctor.disclaimer')}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
