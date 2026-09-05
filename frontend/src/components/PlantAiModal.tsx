import React, { useState } from 'react';
import {
  Sparkles, Camera, Upload, X, Check, Loader2,
  Flower2, AlertTriangle, ShieldCheck, Sun, Droplets, Heart
} from 'lucide-react';
import { api } from '../services/api';
import { Plant, PlantAiExtracted, RoomType } from '../types';
import { useTranslation } from '../i18n';

interface PlantAiModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPlantCreated: (savedPlant: Plant) => void;
}

export const PlantAiModal: React.FC<PlantAiModalProps> = ({
  isOpen,
  onClose,
  onPlantCreated,
}) => {
  const { t, language } = useTranslation();
  const [plantName, setPlantName] = useState('');
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<RoomType>('living_room');
  const [customNickname, setCustomNickname] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [extractedData, setExtractedData] = useState<PlantAiExtracted | null>(null);

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

  const handleAnalyze = async () => {
    if (!plantName.trim() && !imageBase64) {
      setError('Vyberte fotografii rostliny nebo zadejte její název.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setExtractedData(null);

    try {
      const data = await api.analyzePlantWithGemini({
        plant_name: plantName.trim() || undefined,
        image_base64: imageBase64 || undefined,
        target_language: language,
      });
      setExtractedData(data);
      if (!customNickname) {
        setCustomNickname(data.common_name);
      }
    } catch (err: any) {
      setError(err.message || 'Nepodařilo se analyzovat rostlinu.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!extractedData) return;
    setIsSaving(true);
    setError(null);

    try {
      const payload: Partial<Plant> = {
        name: customNickname.trim() || extractedData.common_name,
        species_latin: extractedData.species_latin,
        species_czech: extractedData.species_czech,
        room: selectedRoom,
        light_requirement: extractedData.light_requirement,
        watering_interval_days: extractedData.watering_interval_days,
        winter_watering_interval_days: extractedData.winter_watering_interval_days,
        fertilizing_interval_days: extractedData.fertilizing_interval_days,
        misting_required: extractedData.misting_required,
        substrate_type: extractedData.substrate_recommendation,
        pet_toxicity: extractedData.pet_toxicity,
        pet_toxicity_notes: extractedData.pet_toxicity_details,
        health_status: 'healthy',
        health_notes: extractedData.initial_health_assessment,
        notes: extractedData.description,
        primary_image_url: imageBase64 || undefined,
      };

      const saved = await api.createPlant(payload);
      onPlantCreated(saved);
      onClose();
    } catch (err: any) {
      setError('Chyba při ukládání rostliny: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white dark:bg-zinc-900 w-full max-w-2xl max-h-[90vh] rounded-3xl shadow-2xl border border-zinc-200 dark:border-zinc-800 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-100">
                AI Botanik – Rozpoznání a analýza rostliny
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Nahrajte fotku nebo zadejte název, Gemini 3.7 určí druh, toxicitu pro zvířata a plán zálivky
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
          {!extractedData ? (
            <>
              {/* Photo Upload Area */}
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
                  Fotografie rostliny (volitelné, ale doporučeno pro přesné rozpoznání)
                </label>
                <div className="relative border-2 border-dashed border-zinc-300 dark:border-zinc-700 hover:border-emerald-500 rounded-3xl p-6 text-center transition bg-zinc-50/50 dark:bg-zinc-800/30">
                  {imageBase64 ? (
                    <div className="relative inline-block max-h-48 rounded-2xl overflow-hidden shadow-md">
                      <img
                        src={imageBase64}
                        alt="Preview"
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
                      <Camera className="w-10 h-10 text-emerald-500 mx-auto mb-2 stroke-1" />
                      <p className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                        Vyfoťte kytku nebo nahrajte fotku z galerie
                      </p>
                      <p className="text-[11px] text-zinc-400 mt-1">
                        PNG, JPG nebo WebP do 10 MB
                      </p>
                      <label className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 cursor-pointer shadow-sm">
                        <Upload className="w-3.5 h-3.5" />
                        <span>Vybrat soubor</span>
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

              {/* Plant Name input */}
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                  Nebo zadejte název rostliny (pokud nemáte fotku)
                </label>
                <input
                  type="text"
                  value={plantName}
                  onChange={(e) => setPlantName(e.target.value)}
                  placeholder="např. Monstera deliciosa, Ficus lyrata, Zelenec..."
                  className="w-full px-4 py-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Room select */}
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                  V jaké místnosti bude kytka stát?
                </label>
                <select
                  value={selectedRoom}
                  onChange={(e) => setSelectedRoom(e.target.value as RoomType)}
                  className="w-full px-4 py-2.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 text-sm"
                >
                  <option value="living_room">{t('plants.rooms.living_room')}</option>
                  <option value="bedroom">{t('plants.rooms.bedroom')}</option>
                  <option value="kitchen">{t('plants.rooms.kitchen')}</option>
                  <option value="bathroom">{t('plants.rooms.bathroom')}</option>
                  <option value="balcony">{t('plants.rooms.balcony')}</option>
                  <option value="hallway">{t('plants.rooms.hallway')}</option>
                  <option value="office">{t('plants.rooms.office')}</option>
                </select>
              </div>

              {error && (
                <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-600 dark:text-rose-400">
                  {error}
                </div>
              )}

              <button
                type="button"
                onClick={handleAnalyze}
                disabled={isLoading || (!plantName.trim() && !imageBase64)}
                className="w-full py-3 px-4 rounded-2xl font-semibold text-sm bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-lg shadow-emerald-500/25 transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Gemini AI analyzuje rostlinu...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Rozpoznat a analyzovat pomocí Gemini AI</span>
                  </>
                )}
              </button>
            </>
          ) : (
            /* Result Preview */
            <div className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 flex items-center justify-between">
                <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5">
                  <Check className="w-4 h-4" /> Rostlina úspěšně identifikována!
                </span>
                <button
                  onClick={() => setExtractedData(null)}
                  className="text-xs font-semibold text-zinc-500 hover:underline"
                >
                  Zkusit jinou
                </button>
              </div>

              {/* Plant Nickname / Title */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-1">
                  Pojmenování rostliny u vás doma
                </label>
                <input
                  type="text"
                  value={customNickname}
                  onChange={(e) => setCustomNickname(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 font-bold text-base"
                />
                <p className="text-xs text-zinc-500 italic mt-1">
                  Botanický název: {extractedData.species_czech} ({extractedData.species_latin})
                </p>
              </div>

              {/* Pet Toxicity Alert Box */}
              <div
                className={`p-4 rounded-2xl border flex items-start gap-3 ${
                  extractedData.pet_toxicity === 'safe'
                    ? 'bg-emerald-50/60 dark:bg-emerald-950/40 border-emerald-200 text-emerald-900 dark:text-emerald-200'
                    : 'bg-rose-50/70 dark:bg-rose-950/40 border-rose-200 text-rose-900 dark:text-rose-200'
                }`}
              >
                {extractedData.pet_toxicity === 'safe' ? (
                  <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                )}
                <div className="text-xs">
                  <p className="font-bold">
                    {extractedData.pet_toxicity === 'safe'
                      ? 'Bezpečné pro domácí zvířata (Pet Friendly 🐾)'
                      : 'Pozor: Toxické pro kočky a psy! ⚠️'}
                  </p>
                  <p className="mt-0.5 opacity-90 leading-relaxed">
                    {extractedData.pet_toxicity_details}
                  </p>
                </div>
              </div>

              {/* Care Requirements Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs text-center">
                <div className="p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-800">
                  <Sun className="w-4 h-4 text-amber-500 mx-auto mb-1" />
                  <span className="text-[10px] uppercase font-bold text-zinc-400">Světlo</span>
                  <p className="font-bold text-zinc-800 dark:text-zinc-200 mt-0.5 capitalize">
                    {t(`plants.light.${extractedData.light_requirement}`)}
                  </p>
                </div>
                <div className="p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-800">
                  <Droplets className="w-4 h-4 text-blue-500 mx-auto mb-1" />
                  <span className="text-[10px] uppercase font-bold text-zinc-400">Zálivka (léto)</span>
                  <p className="font-bold text-zinc-800 dark:text-zinc-200 mt-0.5">
                    každých {extractedData.watering_interval_days} dní
                  </p>
                </div>
                <div className="p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-800">
                  <Droplets className="w-4 h-4 text-cyan-500 mx-auto mb-1" />
                  <span className="text-[10px] uppercase font-bold text-zinc-400">Zálivka (zima)</span>
                  <p className="font-bold text-zinc-800 dark:text-zinc-200 mt-0.5">
                    každých {extractedData.winter_watering_interval_days} dní
                  </p>
                </div>
                <div className="p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-800">
                  <Flower2 className="w-4 h-4 text-emerald-500 mx-auto mb-1" />
                  <span className="text-[10px] uppercase font-bold text-zinc-400">Hnojení</span>
                  <p className="font-bold text-zinc-800 dark:text-zinc-200 mt-0.5">
                    každých {extractedData.fertilizing_interval_days} dní
                  </p>
                </div>
              </div>

              {/* Substrate and Notes */}
              <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-800 text-xs space-y-2">
                <p>
                  <span className="font-bold text-zinc-700 dark:text-zinc-300">Doporučený substrát: </span>
                  <span className="text-zinc-600 dark:text-zinc-400">{extractedData.substrate_recommendation}</span>
                </p>
                <p>
                  <span className="font-bold text-zinc-700 dark:text-zinc-300">Rosení listů: </span>
                  <span className="text-zinc-600 dark:text-zinc-400">
                    {extractedData.misting_required ? 'Ano, vyžaduje vyšší vlhkost rosením' : 'Není nutné'}
                  </span>
                </p>
                {extractedData.initial_health_assessment && (
                  <p>
                    <span className="font-bold text-zinc-700 dark:text-zinc-300">Stav z fotky: </span>
                    <span className="text-zinc-600 dark:text-zinc-400">{extractedData.initial_health_assessment}</span>
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex-1 py-3 px-4 rounded-2xl font-semibold text-sm bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/25 transition flex items-center justify-center gap-2"
                >
                  {isSaving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4" />
                  )}
                  <span>Přidat do květináře</span>
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-3 rounded-2xl font-semibold text-sm bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 transition"
                >
                  Zrušit
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
