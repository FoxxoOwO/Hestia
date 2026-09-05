import React, { useState } from 'react';
import {
  Stethoscope, Camera, Upload, X, Check, Loader2,
  AlertTriangle, ShieldAlert, CheckCircle2, Sparkles
} from 'lucide-react';
import { api } from '../services/api';
import { Plant, PlantDiagnosisResponse } from '../types';
import { useTranslation } from '../i18n';

interface PlantDoctorModalProps {
  isOpen: boolean;
  onClose: () => void;
  plant?: Plant | null;
  plantsList?: Plant[];
}

export const PlantDoctorModal: React.FC<PlantDoctorModalProps> = ({
  isOpen,
  onClose,
  plant,
  plantsList = [],
}) => {
  const { t, language } = useTranslation();
  const [selectedPlantId, setSelectedPlantId] = useState<number | undefined>(plant?.id);
  const [symptoms, setSymptoms] = useState('');
  const [imageBase64, setImageBase64] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [diagnosis, setDiagnosis] = useState<PlantDiagnosisResponse | null>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
      setError('Popište prosím příznaky nebo nahrajte fotografii poškozeného listu/rostliny.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setDiagnosis(null);

    const chosenPlant = plant || plantsList.find((p) => p.id === selectedPlantId);

    try {
      const data = await api.diagnosePlantHealth({
        plant_id: chosenPlant?.id,
        plant_name: chosenPlant?.name,
        symptoms_description: symptoms.trim() || 'Vyhodnoť stav rostliny a příznaky z přiložené fotografie.',
        image_base64: imageBase64 || undefined,
        target_language: language,
      });
      setDiagnosis(data);

      // If tied to a plant, optionally record this in the plant's growth log
      if (chosenPlant) {
        api.addPlantLogEntry(chosenPlant.id, {
          entry_type: 'ai_diagnosis',
          title: `AI Diagnostika: ${data.diagnosis}`,
          notes: `${data.cause}\nLéčba: ${data.action_steps.join(', ')}`,
          image_url: imageBase64 || undefined,
        }).catch(() => {});
      }
    } catch (err: any) {
      setError(err.message || 'Nepodařilo se provést diagnózu.');
    } finally {
      setIsLoading(false);
    }
  };

  const getSeverityBadge = (sev: string) => {
    switch (sev) {
      case 'low':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300">
            {t('plant_doctor.severity_low')}
          </span>
        );
      case 'high':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-600 text-white animate-pulse">
            {t('plant_doctor.severity_high')}
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-500 text-white">
            {t('plant_doctor.severity_medium')}
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white dark:bg-zinc-900 w-full max-w-2xl max-h-[90vh] rounded-3xl shadow-2xl border border-zinc-200 dark:border-zinc-800 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-rose-500 to-amber-500 text-white shadow-md shadow-rose-500/20">
              <Stethoscope className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-100">
                {t('plant_doctor.modal_title')}
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                {t('plant_doctor.modal_subtitle')}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          {!diagnosis ? (
            <>
              {/* Plant selector if not preselected */}
              {!plant && plantsList.length > 0 && (
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                    Kterou kytku z vaší sbírky chcete zkontrolovat? (volitelné)
                  </label>
                  <select
                    value={selectedPlantId || ''}
                    onChange={(e) => setSelectedPlantId(e.target.value ? Number(e.target.value) : undefined)}
                    className="w-full px-4 py-2.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 text-sm"
                  >
                    <option value="">-- Vyberte rostlinu z květináře --</option>
                    {plantsList.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.species_czech || p.species_latin || p.room})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Photo Upload for Sickness */}
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
                  Fotografie postiženého listu, škůdců nebo stonku
                </label>
                <div className="relative border-2 border-dashed border-zinc-300 dark:border-zinc-700 hover:border-rose-400 rounded-3xl p-5 text-center transition bg-zinc-50/50 dark:bg-zinc-800/30">
                  {imageBase64 ? (
                    <div className="relative inline-block max-h-48 rounded-2xl overflow-hidden shadow-md">
                      <img
                        src={imageBase64}
                        alt="Sick plant preview"
                        className="max-h-48 object-cover rounded-2xl"
                      />
                      <button
                        type="button"
                        onClick={() => setImageBase64(null)}
                        className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 text-white hover:bg-black transition"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div>
                      <Camera className="w-10 h-10 text-rose-500 mx-auto mb-2 stroke-1" />
                      <p className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                        Vyfoťte detail problému zblízka
                      </p>
                      <label className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 cursor-pointer shadow-sm">
                        <Upload className="w-3.5 h-3.5" />
                        <span>Nahrát fotografii</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleFileChange}
                          className="hidden"
                        />
                      </label>
                    </div>
                  )}
                </div>
              </div>

              {/* Symptoms text */}
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                  {t('plant_doctor.symptoms_label')}
                </label>
                <textarea
                  rows={4}
                  value={symptoms}
                  onChange={(e) => setSymptoms(e.target.value)}
                  placeholder={t('plant_doctor.symptoms_placeholder')}
                  className="w-full px-4 py-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-rose-500 resize-none"
                />
              </div>

              {error && (
                <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-600 dark:text-rose-400">
                  {error}
                </div>
              )}

              <button
                type="button"
                onClick={handleDiagnose}
                disabled={isLoading || (!symptoms.trim() && !imageBase64)}
                className="w-full py-3.5 px-4 rounded-2xl font-semibold text-sm bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-600 hover:to-amber-600 text-white shadow-lg shadow-rose-500/25 transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{t('plant_doctor.diagnosing')}</span>
                  </>
                ) : (
                  <>
                    <Stethoscope className="w-4 h-4" />
                    <span>{t('plant_doctor.btn_diagnose')}</span>
                  </>
                )}
              </button>
            </>
          ) : (
            /* Diagnosis Results View */
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-white dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 shadow-sm space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-400">
                    {t('plant_doctor.diagnosis_result')}
                  </span>
                  {getSeverityBadge(diagnosis.severity)}
                </div>
                <h4 className="text-xl font-extrabold text-zinc-900 dark:text-zinc-100">
                  {diagnosis.diagnosis}
                </h4>
                <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed">
                  <strong className="text-zinc-800 dark:text-zinc-100">{t('plant_doctor.cause')}: </strong>
                  {diagnosis.cause}
                </p>
              </div>

              {/* Contagious alert */}
              <div
                className={`p-3.5 rounded-2xl border flex items-center gap-2.5 text-xs font-semibold ${
                  diagnosis.is_contagious
                    ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 text-rose-700 dark:text-rose-300'
                    : 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 text-emerald-700 dark:text-emerald-300'
                }`}
              >
                {diagnosis.is_contagious ? (
                  <>
                    <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                    <span>{t('plant_doctor.contagious_yes')}</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                    <span>{t('plant_doctor.contagious_no')}</span>
                  </>
                )}
              </div>

              {/* Action Steps */}
              <div className="space-y-2">
                <h5 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                  {t('plant_doctor.action_steps')}
                </h5>
                <div className="space-y-2">
                  {diagnosis.action_steps.map((step, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-800 text-xs flex items-start gap-2.5"
                    >
                      <span className="w-5 h-5 rounded-full bg-emerald-500 text-white font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <p className="text-zinc-700 dark:text-zinc-300 leading-relaxed font-medium">
                        {step}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Prevention Tips */}
              {diagnosis.prevention_tips && (
                <div className="p-3.5 rounded-2xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200/60 text-xs text-amber-900 dark:text-amber-200">
                  <p className="font-bold mb-0.5">{t('plant_doctor.prevention')}</p>
                  <p className="opacity-90">{diagnosis.prevention_tips}</p>
                </div>
              )}

              <div className="pt-2 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setDiagnosis(null)}
                  className="flex-1 py-3 px-4 rounded-2xl font-semibold text-xs bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 text-zinc-700 dark:text-zinc-300 transition"
                >
                  Nová diagnóza
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="py-3 px-6 rounded-2xl font-semibold text-xs bg-emerald-600 hover:bg-emerald-700 text-white shadow-md transition"
                >
                  Hotovo
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
