import React, { useState } from 'react';
import { Scale, X, Plus, Calendar, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { api } from '../services/api';
import { Pet, PetWeightLog } from '../types';
import { useTranslation } from '../i18n';

interface PetWeightModalProps {
  isOpen: boolean;
  onClose: () => void;
  pet: Pet;
  onWeightAdded: (newLog: PetWeightLog) => void;
}

export const PetWeightModal: React.FC<PetWeightModalProps> = ({
  isOpen,
  onClose,
  pet,
  onWeightAdded,
}) => {
  const { t } = useTranslation();
  const [weightKg, setWeightKg] = useState<number | ''>('');
  const [recordedDate, setRecordedDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const weights = (pet.weight_logs || []).slice().sort((a, b) => new Date(a.recorded_date).getTime() - new Date(b.recorded_date).getTime());

  const handleAddWeight = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!weightKg || Number(weightKg) <= 0) {
      setError('Zadejte platnou hmotnost v kg.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const newEntry = await api.addPetWeight(pet.id, {
        weight_kg: Number(weightKg),
        recorded_date: recordedDate,
        notes: notes.trim() || undefined,
      });
      onWeightAdded(newEntry);
      setWeightKg('');
      setNotes('');
      onClose();
    } catch (err: any) {
      console.error(err);
      setError('Chyba při ukládání váhy.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getWeightTrend = () => {
    if (weights.length < 2) return null;
    const latest = weights[weights.length - 1].weight_kg;
    const previous = weights[weights.length - 2].weight_kg;
    const diff = latest - previous;
    if (Math.abs(diff) < 0.05) {
      return (
        <span className="flex items-center gap-1 text-xs font-semibold text-zinc-500">
          <Minus className="w-3.5 h-3.5" />
          <span>Stabilní hmotnost</span>
        </span>
      );
    }
    if (diff > 0) {
      return (
        <span className="flex items-center gap-1 text-xs font-semibold text-amber-600">
          <TrendingUp className="w-3.5 h-3.5" />
          <span>+{diff.toFixed(2)} kg od posledního vážení</span>
        </span>
      );
    }
    return (
      <span className="flex items-center gap-1 text-xs font-semibold text-cyan-600">
        <TrendingDown className="w-3.5 h-3.5" />
        <span>{diff.toFixed(2)} kg od posledního vážení</span>
      </span>
    );
  };

  const maxWeight = Math.max(...weights.map((w) => w.weight_kg), 1);
  const minWeight = Math.min(...weights.map((w) => w.weight_kg), 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-lg rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-500 text-white shadow-md shadow-amber-500/30">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-zinc-900 dark:text-zinc-100">
                Sledování váhy: {pet.name}
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Historie vážení a kondice
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-zinc-400 hover:text-zinc-600 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Trend banner */}
          <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
            <div>
              <span className="text-[11px] text-zinc-400 block">Poslední naměřená váha:</span>
              <strong className="text-2xl font-black text-zinc-900 dark:text-zinc-100">
                {pet.latest_weight_kg ? `${pet.latest_weight_kg} kg` : 'Zatím nezváženo'}
              </strong>
            </div>
            <div>{getWeightTrend()}</div>
          </div>

          {/* Mini Visual Chart if points exist */}
          {weights.length >= 2 && (
            <div className="space-y-2">
              <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block">
                Vývoj hmotnosti v čase:
              </span>
              <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-800 flex items-end justify-between gap-2 h-32 pt-6">
                {weights.slice(-7).map((w, idx) => {
                  const range = maxWeight - minWeight || 1;
                  const heightPercent = Math.max(15, Math.min(100, ((w.weight_kg - minWeight) / range) * 80 + 20));
                  return (
                    <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                      <span className="text-[10px] font-bold text-zinc-700 dark:text-zinc-300">
                        {w.weight_kg}k
                      </span>
                      <div
                        style={{ height: `${heightPercent}%` }}
                        className="w-full max-w-[28px] rounded-t-lg bg-gradient-to-t from-amber-500 to-orange-400 transition-all duration-500"
                        title={`${w.weight_kg} kg (${new Date(w.recorded_date).toLocaleDateString('cs-CZ')})`}
                      />
                      <span className="text-[9px] text-zinc-400 truncate w-full text-center">
                        {new Date(w.recorded_date).toLocaleDateString('cs-CZ', { month: 'numeric', day: 'numeric' })}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Form to log new weight */}
          <form onSubmit={handleAddWeight} className="space-y-4 pt-2 border-t border-zinc-100 dark:border-zinc-800">
            <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 block">
              Zapsat nové vážení:
            </span>

            {error && (
              <div className="p-3 rounded-xl bg-rose-50 text-rose-700 text-xs font-semibold">
                {error}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 mb-1">
                  Hmotnost (kg) *
                </label>
                <input
                  type="number"
                  step="0.05"
                  min="0.1"
                  required
                  placeholder="např. 14.5"
                  value={weightKg}
                  onChange={(e) => setWeightKg(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-sm text-zinc-900 dark:text-zinc-100"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 mb-1">
                  Datum vážení *
                </label>
                <input
                  type="date"
                  required
                  value={recordedDate}
                  onChange={(e) => setRecordedDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-sm text-zinc-900 dark:text-zinc-100"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 mb-1">
                Poznámka (např. váženo u veterináře, po dietě...)
              </label>
              <input
                type="text"
                placeholder="volitelná poznámka..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3.5 py-2 rounded-2xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs text-zinc-900 dark:text-zinc-100"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 rounded-2xl font-bold text-xs bg-amber-500 hover:bg-amber-600 text-white shadow-md shadow-amber-500/25 transition disabled:opacity-50"
            >
              Uložit vážení
            </button>
          </form>

          {/* Past logs list */}
          {weights.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
              <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block">
                Záznamy:
              </span>
              <div className="space-y-1.5 max-h-36 overflow-y-auto">
                {weights.slice().reverse().map((w) => (
                  <div key={w.id} className="p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 flex items-center justify-between text-xs">
                    <div>
                      <strong className="text-zinc-900 dark:text-zinc-100">{w.weight_kg} kg</strong>
                      {w.notes && <span className="text-zinc-400 text-[11px] ml-2">({w.notes})</span>}
                    </div>
                    <span className="text-zinc-400 text-[11px]">
                      {new Date(w.recorded_date).toLocaleDateString('cs-CZ')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
