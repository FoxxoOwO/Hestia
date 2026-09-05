import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, Check, AlertCircle } from 'lucide-react';
import { MedicationSchedule, MedicationScheduleCreate, MedicationScheduleUpdate, Medicine, User } from '../types';

interface MedicationScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: MedicationScheduleCreate | MedicationScheduleUpdate) => Promise<void>;
  schedule?: MedicationSchedule | null;
  medicines: Medicine[];
  users: User[];
  defaultMedicineId?: number;
}

export const MedicationScheduleModal: React.FC<MedicationScheduleModalProps> = ({
  isOpen,
  onClose,
  onSave,
  schedule,
  medicines,
  users,
  defaultMedicineId
}) => {
  const [medicineId, setMedicineId] = useState<number>(defaultMedicineId || (medicines[0]?.id ?? 0));
  const [userId, setUserId] = useState<number>(users[0]?.id ?? 1);
  const [scheduleType, setScheduleType] = useState<'chronic' | 'acute_course' | 'as_needed'>('chronic');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState('');
  const [timesPerDay, setTimesPerDay] = useState(1);
  const [timeSlots, setTimeSlots] = useState<string[]>(['morning']);
  const [foodRelation, setFoodRelation] = useState<'before_food' | 'with_food' | 'after_food' | 'empty_stomach' | 'any'>('with_food');
  const [dosagePerTake, setDosagePerTake] = useState('1 tableta');
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (schedule) {
      setMedicineId(schedule.medicine_id);
      setUserId(schedule.user_id);
      setScheduleType(schedule.schedule_type);
      setStartDate(schedule.start_date);
      setEndDate(schedule.end_date || '');
      setTimesPerDay(schedule.times_per_day);
      setTimeSlots(schedule.time_slots || ['morning']);
      setFoodRelation(schedule.food_relation || 'any');
      setDosagePerTake(schedule.dosage_per_take || '1 tableta');
      setNotes(schedule.notes || '');
    } else {
      setMedicineId(defaultMedicineId || (medicines[0]?.id ?? 0));
      setUserId(users[0]?.id ?? 1);
      setScheduleType('chronic');
      setStartDate(new Date().toISOString().split('T')[0]);
      setEndDate('');
      setTimesPerDay(1);
      setTimeSlots(['morning']);
      setFoodRelation('with_food');
      setDosagePerTake('1 tableta');
      setNotes('');
    }
    setError(null);
  }, [schedule, isOpen, defaultMedicineId, medicines, users]);

  if (!isOpen) return null;

  const toggleSlot = (slot: string) => {
    if (timeSlots.includes(slot)) {
      if (timeSlots.length > 1) {
        setTimeSlots(timeSlots.filter(s => s !== slot));
      }
    } else {
      setTimeSlots([...timeSlots, slot]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!medicineId) {
      setError('Vyberte prosím lék.');
      return;
    }
    if (!userId) {
      setError('Vyberte prosím člena rodiny.');
      return;
    }

    setIsSaving(true);
    setError(null);

    const payload: MedicationScheduleCreate = {
      medicine_id: Number(medicineId),
      user_id: Number(userId),
      schedule_type: scheduleType,
      start_date: startDate,
      end_date: scheduleType === 'acute_course' && endDate ? endDate : undefined,
      times_per_day: timeSlots.length,
      time_slots: timeSlots,
      food_relation: foodRelation,
      dosage_per_take: dosagePerTake.trim() || '1 tableta',
      is_active: true,
      notes: notes.trim() || undefined
    };

    try {
      await onSave(payload);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Nepodařilo se uložit rozvrh.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/40">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                {schedule ? 'Upravit dávkovací plán' : 'Nastavit plán užívání léků'}
              </h2>
              <p className="text-xs text-zinc-500">
                Pravidelné ranní/večerní dávky nebo krátkodobé antibiotické kúry
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

        {error && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 flex items-center gap-3 text-sm text-rose-700 dark:text-rose-300">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Lék ze zásob *
              </label>
              <select
                value={medicineId}
                onChange={(e) => setMedicineId(Number(e.target.value))}
                className="w-full px-3.5 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm text-zinc-900 dark:text-zinc-100"
              >
                {medicines.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} {m.active_substance ? `(${m.active_substance})` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Člen rodiny *
              </label>
              <select
                value={userId}
                onChange={(e) => setUserId(Number(e.target.value))}
                className="w-full px-3.5 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm text-zinc-900 dark:text-zinc-100"
              >
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.display_name || u.username}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Typ plánu
              </label>
              <select
                value={scheduleType}
                onChange={(e) => setScheduleType(e.target.value as any)}
                className="w-full px-3.5 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm text-zinc-900 dark:text-zinc-100"
              >
                <option value="chronic">Dlouhodobé / trvalé užívání</option>
                <option value="acute_course">Časově omezená kúra (např. ATB na 7 dní)</option>
                <option value="as_needed">Dle potřeby (PRN)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Dávka na jedno užití
              </label>
              <input
                type="text"
                placeholder="např. 1 tableta, 5 ml, 1 vstřik"
                value={dosagePerTake}
                onChange={(e) => setDosagePerTake(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm text-zinc-900 dark:text-zinc-100"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Datum zahájení
              </label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm text-zinc-900 dark:text-zinc-100"
              />
            </div>

            {scheduleType === 'acute_course' && (
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Konec kúry
                </label>
                <input
                  type="date"
                  required
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm text-zinc-900 dark:text-zinc-100"
                />
              </div>
            )}
          </div>

          {/* Time slots */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
              Denní časování dávek
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[
                { key: 'morning', label: 'Ráno', icon: '🌅' },
                { key: 'noon', label: 'Poledne', icon: '☀️' },
                { key: 'evening', label: 'Večer', icon: '🌆' },
                { key: 'night', label: 'Na noc', icon: '🌙' }
              ].map((slot) => {
                const isSelected = timeSlots.includes(slot.key);
                return (
                  <button
                    key={slot.key}
                    type="button"
                    onClick={() => toggleSlot(slot.key)}
                    className={`py-2 px-3 rounded-xl border text-xs font-medium flex flex-col items-center gap-1 transition-all ${
                      isSelected
                        ? 'border-purple-500 bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 font-semibold'
                        : 'border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:border-zinc-300'
                    }`}
                  >
                    <span className="text-base">{slot.icon}</span>
                    <span>{slot.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Food relation */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Vztah k jídlu
            </label>
            <select
              value={foodRelation}
              onChange={(e) => setFoodRelation(e.target.value as any)}
              className="w-full px-3.5 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm text-zinc-900 dark:text-zinc-100"
            >
              <option value="with_food">Při jídle</option>
              <option value="after_food">Po jídle</option>
              <option value="before_food">Před jídlem (30 min předem)</option>
              <option value="empty_stomach">Nalačno (ihned ráno)</option>
              <option value="any">Nezáleží na jídle</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Poznámka / Instrukce lékaře
            </label>
            <input
              type="text"
              placeholder="např. Dobrat celé balení, zapít sklenicí vody..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm text-zinc-900 dark:text-zinc-100"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-200 dark:border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors"
            >
              Zrušit
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2 text-sm font-semibold text-white bg-purple-600 hover:bg-purple-700 rounded-xl transition-colors flex items-center gap-2 shadow-sm disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              {isSaving ? 'Ukládám...' : schedule ? 'Uložit změny' : 'Aktivovat plán'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
