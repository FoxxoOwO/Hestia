import React, { useState } from 'react';
import { X, Wrench, Check, AlertCircle, Calendar, Gauge, Building2 } from 'lucide-react';
import { Vehicle, VehicleServiceRecordCreate, ServiceType } from '../types';
import { useTranslation } from '../i18n';

interface ServiceRecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: VehicleServiceRecordCreate) => Promise<void>;
  vehicle: Vehicle | null;
}

export const ServiceRecordModal: React.FC<ServiceRecordModalProps> = ({
  isOpen,
  onClose,
  onSave,
  vehicle
}) => {
  const { t } = useTranslation();
  const todayStr = new Date().toISOString().split('T')[0];

  const [serviceType, setServiceType] = useState<ServiceType>('oil_change');
  const [title, setTitle] = useState('Výměna motorového oleje a filtrů');
  const [date, setDate] = useState(todayStr);
  const [mileage, setMileage] = useState<number | ''>(vehicle?.current_mileage || '');
  const [cost, setCost] = useState<number | ''>('');
  const [serviceShop, setServiceShop] = useState('');
  const [performedOperations, setPerformedOperations] = useState('');
  const [recordToFinance, setRecordToFinance] = useState(true);

  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !vehicle) return null;

  const handleTypeChange = (type: ServiceType) => {
    setServiceType(type);
    if (type === 'oil_change' && !title) {
      setTitle('Výměna motorového oleje a filtrů');
    } else if (type === 'regular_service' && !title) {
      setTitle('Garanční / roční servisní prohlídka');
    } else if (type === 'brakes' && !title) {
      setTitle('Kontrola a servis brzdové soustavy');
    } else if (type === 'tires' && !title) {
      setTitle('Přezutí a vyvážení kol');
    } else if (type === 'inspection' && !title) {
      setTitle('Prohlídka STK a měření emisí');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || mileage === '') {
      setError('Vyplňte prosím název servisu a stav tachometru.');
      return;
    }

    try {
      setIsSaving(true);
      setError(null);
      await onSave({
        service_type: serviceType,
        title: title.trim(),
        date,
        mileage: Number(mileage),
        cost: cost === '' ? 0 : Number(cost),
        service_shop: serviceShop.trim() || undefined,
        performed_operations: performedOperations.trim() || undefined,
        record_to_finance: recordToFinance
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Nepodařilo se uložit servisní záznam.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl relative my-8">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Záznam do servisní knížky
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
                Typ servisu
              </label>
              <select
                value={serviceType}
                onChange={e => handleTypeChange(e.target.value as ServiceType)}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl"
              >
                <option value="oil_change">Výměna oleje a filtrů</option>
                <option value="regular_service">Pravidelná prohlídka</option>
                <option value="brakes">Brzdy & kapalina</option>
                <option value="tires">Pneumatiky & geometrie</option>
                <option value="inspection">STK a emise</option>
                <option value="repair">Oprava / výměna dílu</option>
                <option value="other">Ostatní údržba</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Datum servisu
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Název úkonu / Popis *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="např. Výměna oleje Castrol Edge 5W-30 + filtry"
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Tachometr (km) *
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
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Cena celkem (Kč)
              </label>
              <input
                type="number"
                value={cost}
                onChange={e => setCost(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="4200"
                className="w-full px-3 py-2 text-xs font-bold bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Autoservis / Mechanik
            </label>
            <input
              type="text"
              value={serviceShop}
              onChange={e => setServiceShop(e.target.value)}
              placeholder="např. Autoservis Novák & Syn, Auto Ševčík..."
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Podrobný rozpis prací a použitých dílů
            </label>
            <textarea
              rows={3}
              value={performedOperations}
              onChange={e => setPerformedOperations(e.target.value)}
              placeholder="např. 4.7 l motorového oleje, olejový filtr Mann, nový vzduchový filtr, doplnění chladící kapaliny G13..."
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl"
            />
          </div>

          {/* Finance sync checkbox */}
          <div className="p-3 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40 flex items-center gap-2.5">
            <input
              type="checkbox"
              id="syncServiceFinance"
              checked={recordToFinance}
              onChange={e => setRecordToFinance(e.target.checked)}
              className="rounded text-indigo-600 focus:ring-indigo-500"
            />
            <label htmlFor="syncServiceFinance" className="text-xs text-indigo-900 dark:text-indigo-200 cursor-pointer font-medium">
              Zapsat náklady na servis do Rodinných financí (Kategorie Doprava)
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
              className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition flex items-center gap-2 shadow-md shadow-indigo-500/20"
            >
              <Check className="w-4 h-4" />
              <span>{isSaving ? 'Ukládám...' : 'Zapsat do servisní knížky'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
