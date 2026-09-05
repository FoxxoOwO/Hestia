import React, { useState, useEffect } from 'react';
import { X, Calculator, AlertTriangle, Baby, Clock, CheckCircle2, ShieldAlert } from 'lucide-react';
import { api } from '../services/api';
import { PediatricDosage } from '../types';

interface PediatricDosageModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PediatricDosageModal: React.FC<PediatricDosageModalProps> = ({
  isOpen,
  onClose
}) => {
  const [weightKg, setWeightKg] = useState<number>(12);
  const [selectedDrug, setSelectedDrug] = useState<'paracetamol' | 'ibuprofen'>('paracetamol');
  const [dosageData, setDosageData] = useState<PediatricDosage | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    const fetchDosage = async () => {
      if (weightKg < 3 || weightKg > 65) return;
      setLoading(true);
      setError(null);
      try {
        const data = await api.getPediatricDosage(weightKg, selectedDrug);
        if (isMounted) setDosageData(data);
      } catch (err: any) {
        if (isMounted) setError(err.message || 'Chyba při výpočtu dávkování');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchDosage();
    return () => { isMounted = false; };
  }, [isOpen, weightKg, selectedDrug]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl my-6">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 bg-emerald-50/50 dark:bg-emerald-950/20">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Baby className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                Kalkulačka dětského dávkování
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Přesný a bezpečný přepočet antipyretik (sirupů a čípků) podle hmotnosti dítěte
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

        <div className="p-6 space-y-6">
          {/* Controls: Weight & Drug Switch */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/60">
            {/* Weight Input */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-300">
                  Hmotnost dítěte
                </label>
                <span className="text-lg font-extrabold text-emerald-600 dark:text-emerald-400">
                  {weightKg} kg
                </span>
              </div>
              <input
                type="range"
                min="4"
                max="45"
                step="0.5"
                value={weightKg}
                onChange={(e) => setWeightKg(parseFloat(e.target.value))}
                className="w-full accent-emerald-600 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-zinc-400 mt-1">
                <span>4 kg (kojenci)</span>
                <span>20 kg (předškoláci)</span>
                <span>45 kg (školáci)</span>
              </div>
            </div>

            {/* Drug Selection */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-300 block mb-2">
                Účinná látka
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedDrug('paracetamol')}
                  className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                    selectedDrug === 'paracetamol'
                      ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 shadow-sm'
                      : 'border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                  }`}
                >
                  <span>Paracetamol</span>
                  <span className="text-[10px] text-zinc-400 block">(Paralen, Panadol)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedDrug('ibuprofen')}
                  className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                    selectedDrug === 'ibuprofen'
                      ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 shadow-sm'
                      : 'border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                  }`}
                >
                  <span>Ibuprofen</span>
                  <span className="text-[10px] text-zinc-400 block">(Nurofen, Ibalgin)</span>
                </button>
              </div>
            </div>
          </div>

          {/* Results Display */}
          {dosageData && (
            <div className="space-y-4">
              {/* Summary KPIs */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3.5 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 text-center">
                  <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 uppercase block">
                    Jednotlivá dávka
                  </span>
                  <span className="text-xl font-black text-emerald-900 dark:text-emerald-100">
                    {dosageData.single_dose_mg_min} – {dosageData.single_dose_mg_max} mg
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/60 text-center">
                  <span className="text-[11px] font-semibold text-blue-700 dark:text-blue-300 uppercase block">
                    Minimální interval
                  </span>
                  <span className="text-xl font-black text-blue-900 dark:text-blue-100 flex items-center justify-center gap-1">
                    <Clock className="w-4 h-4 text-blue-500" />
                    každých {dosageData.interval_hours} hod.
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 text-center">
                  <span className="text-[11px] font-semibold text-amber-700 dark:text-amber-300 uppercase block">
                    Denní maximum (24h)
                  </span>
                  <span className="text-xl font-black text-amber-900 dark:text-amber-100">
                    max {dosageData.daily_max_mg} mg
                  </span>
                </div>
              </div>

              {/* Specific Preparations in Czech pharmacies */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-2">
                  Dávkování konkrétních přípravků pro {weightKg} kg dítě:
                </h4>
                <div className="space-y-2.5">
                  {dosageData.preparations.map((prep, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/40 flex items-center justify-between gap-4"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                            {prep.brand_name}
                          </span>
                          <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300">
                            {prep.concentration}
                          </span>
                        </div>
                        {prep.note && (
                          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                            {prep.note}
                          </p>
                        )}
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-base font-black text-emerald-600 dark:text-emerald-400 px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800">
                          {prep.amount_per_single_dose}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Alternation Strategy Alert */}
              <div className="p-3.5 rounded-xl bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800/50 text-xs text-purple-900 dark:text-purple-200 space-y-1">
                <p className="font-bold flex items-center gap-1.5">
                  <span>💡 Pravidlo střídání při neklesající horečce:</span>
                </p>
                <p>
                  Pokud horečka po 4 hodinách neklesá, lze podat lék s <strong>druhou účinnou látkou</strong> (např. v 08:00 Paralen, ve 12:00 Nurofen, v 16:00 Paralen). 
                  Vždy však musí být dodržen odstup <strong>minimálně 6–8 hodin mezi dvěma dávkami stejného léku</strong>!
                </p>
              </div>

              {/* Safety warnings */}
              <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/50 text-xs text-rose-800 dark:text-rose-300 space-y-1.5">
                <p className="font-bold flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-rose-500 shrink-0" />
                  <span>Kritická bezpečnostní pravidla:</span>
                </p>
                <ul className="list-disc list-inside space-y-1 pl-1 text-[11px]">
                  {dosageData.safety_warnings.map((w, idx) => (
                    <li key={idx}>{w}</li>
                  ))}
                  <li><strong>NIKDY nepodávejte dětem do 15 let Acylpyrin / Aspirin</strong> (kyselinu acetylsalicylovou) – hrozí život ohrožující Reyův syndrom!</li>
                </ul>
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="flex justify-end pt-2 border-t border-zinc-200 dark:border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 text-sm font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors"
            >
              Zavřít kalkulačku
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
