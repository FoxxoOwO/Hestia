import React, { useState } from 'react';
import {
  Sparkles, X, AlertTriangle, ShieldCheck, AlertCircle,
  Loader2, Search, HeartPulse, HelpCircle, Utensils
} from 'lucide-react';
import { api } from '../services/api';
import { PetFoodSafetyResponse, PetSpecies } from '../types';
import { useTranslation } from '../i18n';

interface PetFoodSafetyModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultSpecies?: PetSpecies;
}

export const PetFoodSafetyModal: React.FC<PetFoodSafetyModalProps> = ({
  isOpen,
  onClose,
  defaultSpecies = 'dog',
}) => {
  const { t, language } = useTranslation();
  const [species, setSpecies] = useState<string>(defaultSpecies);
  const [foodName, setFoodName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PetFoodSafetyResponse | null>(null);

  if (!isOpen) return null;

  const quickPresets = [
    { label: 'Čokoláda 🍫', query: 'čokoláda' },
    { label: 'Avokádo 🥑', query: 'avokádo' },
    { label: 'Hrozny / Rozinky 🍇', query: 'hrozny a rozinky' },
    { label: 'Xylitol (sladidlo) 🍬', query: 'xylitol' },
    { label: 'Vařené kosti 🍗', query: 'vařené drůbeží kosti' },
    { label: 'Cibule & Česnek 🧅', query: 'cibule a česnek' },
    { label: 'Mrkev 🥕', query: 'syrová mrkev' },
    { label: 'Tvaroh / Jogurt 🥣', query: 'bílý jogurt a tvaroh' },
  ];

  const handleCheck = async (queryToSearch?: string) => {
    const q = queryToSearch || foodName;
    if (!q.trim()) {
      setError('Zadejte prosím název potraviny.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const data = await api.checkPetFoodSafety({
        species,
        food_name: q.trim(),
        target_language: language,
      });
      setResult(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Chyba při komunikaci s Gemini AI.');
    } finally {
      setIsLoading(false);
    }
  };

  const getSafetyBadge = (level: string) => {
    switch (level) {
      case 'toxic':
        return (
          <div className="p-4 rounded-2xl bg-rose-500/15 border border-rose-500/40 text-rose-700 dark:text-rose-300 flex items-start gap-3">
            <div className="p-2 rounded-xl bg-rose-500 text-white shrink-0 shadow-md shadow-rose-500/30">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-rose-800 dark:text-rose-200">
                🔴 POZOR: Toxické a nebezpečné!
              </h4>
              <p className="text-xs text-rose-700/90 dark:text-rose-300/90 mt-0.5">
                Tato potravina může zvířeti způsobit těžkou otravu nebo ohrozit jeho život.
              </p>
            </div>
          </div>
        );
      case 'caution':
        return (
          <div className="p-4 rounded-2xl bg-amber-500/15 border border-amber-500/40 text-amber-700 dark:text-amber-300 flex items-start gap-3">
            <div className="p-2 rounded-xl bg-amber-500 text-white shrink-0 shadow-md shadow-amber-500/30">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-amber-800 dark:text-amber-200">
                🟡 Nevhodné / Pouze s opatrností
              </h4>
              <p className="text-xs text-amber-700/90 dark:text-amber-300/90 mt-0.5">
                Není přímo smrtelné, ale může vyvolat zažívací potíže, průjem nebo zánět slinivky.
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
                🟢 Bezpečné a vhodné
              </h4>
              <p className="text-xs text-emerald-700/90 dark:text-emerald-300/90 mt-0.5">
                Tato potravina je pro zvíře v rozumném množství bezpečná a může být zdravým pamlskem.
              </p>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-xl max-h-[90vh] rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 text-white shadow-md shadow-amber-500/30">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-zinc-900 dark:text-zinc-100">
                {t('pet_food_safety.modal_title')}
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                {t('pet_food_safety.modal_subtitle')}
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
          {/* Species Switcher */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">Druh zvířete:</span>
            <div className="flex gap-1.5">
              {[
                { id: 'dog', label: 'Pes 🐕' },
                { id: 'cat', label: 'Kočka 🐈' },
                { id: 'rabbit', label: 'Králík 🐇' },
                { id: 'bird', label: 'Pták 🦜' },
              ].map((s) => (
                <button
                  key={s.id}
                  onClick={() => setSpecies(s.id)}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition ${
                    species === s.id
                      ? 'bg-amber-500 text-white shadow-sm shadow-amber-500/30'
                      : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Search Input */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder={t('pet_food_safety.food_placeholder')}
                value={foodName}
                onChange={(e) => setFoodName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCheck()}
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <button
              onClick={() => handleCheck()}
              disabled={isLoading}
              className="px-5 py-2.5 rounded-2xl font-bold text-xs bg-amber-500 hover:bg-amber-600 text-white transition shadow-md shadow-amber-500/25 flex items-center gap-1.5 shrink-0 disabled:opacity-50"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              <span>Prověřit</span>
            </button>
          </div>

          {/* Quick Preset Chips */}
          <div>
            <span className="text-[11px] font-semibold text-zinc-400 block mb-1.5">
              Časté rizikové a bezpečné potraviny:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {quickPresets.map((preset, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setFoodName(preset.query);
                    handleCheck(preset.query);
                  }}
                  className="px-2.5 py-1 rounded-xl text-[11px] bg-zinc-100 dark:bg-zinc-800 hover:bg-amber-50 hover:text-amber-600 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 transition border border-zinc-200/60 dark:border-zinc-700/60"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs font-semibold">
              {error}
            </div>
          )}

          {/* Loading Animation */}
          {isLoading && (
            <div className="py-12 text-center text-zinc-400">
              <Loader2 className="w-8 h-8 animate-spin text-amber-500 mx-auto mb-2" />
              <p className="text-xs font-medium">{t('pet_food_safety.checking')}</p>
            </div>
          )}

          {/* Result Card */}
          {result && !isLoading && (
            <div className="space-y-4 pt-2 animate-in fade-in">
              {getSafetyBadge(result.safety_level)}

              <div className="p-5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-800 space-y-3 text-xs">
                <div>
                  <h4 className="font-bold text-sm text-zinc-900 dark:text-zinc-100 mb-1">
                    {result.headline}
                  </h4>
                  <p className="text-zinc-600 dark:text-zinc-300 leading-relaxed">
                    {result.risk_description}
                  </p>
                </div>

                {result.toxic_dose_info && (
                  <div className="pt-2 border-t border-zinc-200/60 dark:border-zinc-700/60">
                    <span className="font-bold text-zinc-800 dark:text-zinc-200 block mb-0.5">
                      ⚖️ {t('pet_food_safety.toxic_dose')}:
                    </span>
                    <p className="text-zinc-600 dark:text-zinc-400">
                      {result.toxic_dose_info}
                    </p>
                  </div>
                )}

                {result.symptoms_of_poisoning && result.symptoms_of_poisoning.length > 0 && (
                  <div className="pt-2 border-t border-zinc-200/60 dark:border-zinc-700/60">
                    <span className="font-bold text-zinc-800 dark:text-zinc-200 block mb-1">
                      ⚠️ {t('pet_food_safety.symptoms')}:
                    </span>
                    <ul className="list-disc pl-4 space-y-0.5 text-zinc-600 dark:text-zinc-400">
                      {result.symptoms_of_poisoning.map((sym, i) => (
                        <li key={i}>{sym}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="pt-2 border-t border-zinc-200/60 dark:border-zinc-700/60">
                  <span className="font-bold text-zinc-800 dark:text-zinc-200 block mb-0.5 flex items-center gap-1 text-rose-600 dark:text-rose-400">
                    <HeartPulse className="w-3.5 h-3.5" />
                    <span>{t('pet_food_safety.first_aid')}:</span>
                  </span>
                  <p className="text-zinc-700 dark:text-zinc-300 font-medium">
                    {result.first_aid_action}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
