import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Gauge, Check, AlertCircle } from 'lucide-react';
import { Vehicle } from '../types';

interface MileageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (mileage: number) => Promise<void>;
  vehicle: Vehicle | null;
}

export const MileageModal: React.FC<MileageModalProps> = ({
  isOpen,
  onClose,
  onSave,
  vehicle
}) => {
  const [mileage, setMileage] = useState<number | ''>(vehicle?.current_mileage || '');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !vehicle) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mileage === '') return;

    if (Number(mileage) < (vehicle.current_mileage || 0)) {
      setError(`Nový stav nemůže být nižší než stávající (${vehicle.current_mileage.toLocaleString('cs-CZ')} km).`);
      return;
    }

    try {
      setIsSaving(true);
      setError(null);
      await onSave(Number(mileage));
      onClose();
    } catch (err: any) {
      setError(err.message || 'Nepodařilo se aktualizovat stav tachometru.');
    } finally {
      setIsSaving(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl max-w-sm w-full p-6 shadow-2xl relative">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <Gauge className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-zinc-900 dark:text-white text-base">
                Aktualizovat tachometr
              </h3>
              <p className="text-xs text-zinc-400">{vehicle.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-zinc-400 hover:text-zinc-600 rounded-lg">
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="my-3 p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 text-xs flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Nový stav tachometru (km)
            </label>
            <input
              type="number"
              required
              autoFocus
              value={mileage}
              onChange={e => setMileage(e.target.value === '' ? '' : Number(e.target.value))}
              placeholder={String(vehicle.current_mileage || 0)}
              className="w-full px-3 py-2 text-base font-bold bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 rounded-xl"
            />
            <p className="text-[11px] text-zinc-400 mt-1">
              Aktuálně uloženo: {vehicle.current_mileage.toLocaleString('cs-CZ')} km
            </p>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs text-zinc-600 dark:text-zinc-400 rounded-xl hover:bg-zinc-100"
            >
              Zrušit
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-4 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl flex items-center gap-1.5 shadow-md shadow-indigo-500/20"
            >
              <Check className="w-3.5 h-3.5" />
              <span>{isSaving ? 'Ukládám...' : 'Uložit stav'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};
