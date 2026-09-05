import React, { useState } from 'react';
import { X, Fuel, Check, AlertCircle, DollarSign, Gauge, Calendar, Sparkles } from 'lucide-react';
import { Vehicle, VehicleRefuelingCreate } from '../types';
import { useTranslation } from '../i18n';

interface RefuelingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: VehicleRefuelingCreate) => Promise<void>;
  vehicle: Vehicle | null;
}

export const RefuelingModal: React.FC<RefuelingModalProps> = ({
  isOpen,
  onClose,
  onSave,
  vehicle
}) => {
  const { t } = useTranslation();
  const todayStr = new Date().toISOString().split('T')[0];

  const [date, setDate] = useState(todayStr);
  const [mileage, setMileage] = useState<number | ''>(vehicle?.current_mileage || '');
  const [fuelAmountL, setFuelAmountL] = useState<number | ''>('');
  const [pricePerL, setPricePerL] = useState<number | ''>('');
  const [totalPrice, setTotalPrice] = useState<number | ''>('');
  const [isFullTank, setIsFullTank] = useState(true);
  const [fuelBrand, setFuelBrand] = useState('Orlen Benzina');
  const [notes, setNotes] = useState('');
  const [recordToFinance, setRecordToFinance] = useState(true);

  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !vehicle) return null;

  const handleLitersChange = (liters: number | '') => {
    setFuelAmountL(liters);
    if (liters !== '' && pricePerL !== '') {
      setTotalPrice(Math.round(liters * Number(pricePerL) * 100) / 100);
    } else if (liters !== '' && totalPrice !== '') {
      setPricePerL(Math.round((Number(totalPrice) / liters) * 100) / 100);
    }
  };

  const handlePricePerLChange = (ppl: number | '') => {
    setPricePerL(ppl);
    if (ppl !== '' && fuelAmountL !== '') {
      setTotalPrice(Math.round(Number(fuelAmountL) * Number(ppl) * 100) / 100);
    }
  };

  const handleTotalPriceChange = (tot: number | '') => {
    setTotalPrice(tot);
    if (tot !== '' && fuelAmountL !== '') {
      setPricePerL(Math.round((Number(tot) / Number(fuelAmountL)) * 100) / 100);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mileage === '' || fuelAmountL === '' || totalPrice === '') {
      setError('Vyplňte prosím stav tachometru, natankované litry a celkovou cenu.');
      return;
    }

    try {
      setIsSaving(true);
      setError(null);
      await onSave({
        date,
        mileage: Number(mileage),
        fuel_amount_l: Number(fuelAmountL),
        price_per_l: pricePerL === '' ? undefined : Number(pricePerL),
        total_price: Number(totalPrice),
        is_full_tank: isFullTank,
        fuel_brand: fuelBrand.trim() || undefined,
        notes: notes.trim() || undefined,
        record_to_finance: recordToFinance
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Nepodařilo se uložit záznam o tankování.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl relative">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Fuel className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Záznam o tankování
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {vehicle.name} ({vehicle.license_plate})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="my-3 p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-3.5">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Datum
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Stav tachometru (km) *
              </label>
              <input
                type="number"
                required
                value={mileage}
                onChange={e => setMileage(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder={vehicle.current_mileage ? String(vehicle.current_mileage) : '164200'}
                className="w-full px-3 py-2 text-xs font-semibold bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Litry *
              </label>
              <input
                type="number"
                step="0.01"
                required
                value={fuelAmountL}
                onChange={e => handleLitersChange(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="45.5"
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Kč / litr
              </label>
              <input
                type="number"
                step="0.1"
                value={pricePerL}
                onChange={e => handlePricePerLChange(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="36.90"
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Celkem Kč *
              </label>
              <input
                type="number"
                step="0.1"
                required
                value={totalPrice}
                onChange={e => handleTotalPriceChange(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="1680"
                className="w-full px-3 py-2 text-xs font-bold bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Čerpací stanice
              </label>
              <input
                type="text"
                value={fuelBrand}
                onChange={e => setFuelBrand(e.target.value)}
                placeholder="Orlen, Shell, MOL, OMV..."
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>
            <div className="flex items-center pt-5">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={isFullTank}
                  onChange={e => setIsFullTank(e.target.checked)}
                  className="rounded text-amber-500 focus:ring-amber-400"
                />
                <span>Natankováno do plné (spočítá spotřebu)</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Poznámka
            </label>
            <input
              type="text"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="např. Prémiová nafta bez biosložky, aditiva..."
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl"
            />
          </div>

          {/* Finance sync checkbox */}
          <div className="p-3 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40 flex items-center gap-2.5">
            <input
              type="checkbox"
              id="syncFinance"
              checked={recordToFinance}
              onChange={e => setRecordToFinance(e.target.checked)}
              className="rounded text-indigo-600 focus:ring-indigo-500"
            />
            <label htmlFor="syncFinance" className="text-xs text-indigo-900 dark:text-indigo-200 cursor-pointer font-medium">
              Zapsat automaticky do Rodinných financí (výdaj v kategorii Doprava)
            </label>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
            >
              Zrušit
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-xl transition flex items-center gap-2 shadow-md shadow-amber-500/20"
            >
              <Check className="w-4 h-4" />
              <span>{isSaving ? 'Ukládám...' : 'Zapsat tankování'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
