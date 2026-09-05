import React, { useState, useEffect } from 'react';
import { X, Wrench, RefreshCw, Users, Sparkles, Clock, Calendar } from 'lucide-react';
import { Chore, ChoreCreateInput, User } from '../types';
import { useTranslation } from '../i18n';

interface ChoreEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  chore?: Chore | null;
  users: User[];
  onSave: (data: ChoreCreateInput, id?: number) => Promise<void>;
}

export const ChoreEditModal: React.FC<ChoreEditModalProps> = ({
  isOpen,
  onClose,
  chore,
  users,
  onSave
}) => {
  const { t } = useTranslation();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [room, setRoom] = useState('kitchen');
  const [category, setCategory] = useState('routine');
  const [frequency, setFrequency] = useState('weekly');
  const [intervalDays, setIntervalDays] = useState(7);
  const [points, setPoints] = useState(15);
  const [estimatedMinutes, setEstimatedMinutes] = useState(15);
  const [isRotationEnabled, setIsRotationEnabled] = useState(true);
  const [rotationMemberIds, setRotationMemberIds] = useState<number[]>([]);
  const [currentAssigneeId, setCurrentAssigneeId] = useState<number | null>(null);
  const [dueDate, setDueDate] = useState('');
  const [cleaningSuppliesNeeded, setCleaningSuppliesNeeded] = useState('');
  const [isApplianceMaintenance, setIsApplianceMaintenance] = useState(false);
  const [applianceName, setApplianceName] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (chore) {
      setTitle(chore.title);
      setDescription(chore.description || '');
      setRoom(chore.room);
      setCategory(chore.category);
      setFrequency(chore.frequency);
      setIntervalDays(chore.interval_days);
      setPoints(chore.points);
      setEstimatedMinutes(chore.estimated_minutes);
      setIsRotationEnabled(chore.is_rotation_enabled);
      setRotationMemberIds(chore.rotation_member_ids_list || []);
      setCurrentAssigneeId(chore.current_assignee_id);
      setDueDate(chore.due_date || '');
      setCleaningSuppliesNeeded(chore.cleaning_supplies_needed || '');
      setIsApplianceMaintenance(chore.is_appliance_maintenance);
      setApplianceName(chore.appliance_name || '');
    } else {
      // Defaults for new chore
      setTitle('');
      setDescription('');
      setRoom('kitchen');
      setCategory('routine');
      setFrequency('weekly');
      setIntervalDays(7);
      setPoints(15);
      setEstimatedMinutes(15);
      setIsRotationEnabled(true);
      const allUserIds = users.map(u => u.id);
      setRotationMemberIds(allUserIds);
      setCurrentAssigneeId(allUserIds[0] || null);
      const today = new Date().toISOString().split('T')[0];
      setDueDate(today);
      setCleaningSuppliesNeeded('');
      setIsApplianceMaintenance(false);
      setApplianceName('');
    }
  }, [chore, users, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSaving(true);
    try {
      const payload: ChoreCreateInput = {
        title,
        description: description || undefined,
        room,
        category,
        frequency,
        interval_days: Number(intervalDays),
        points: Number(points),
        estimated_minutes: Number(estimatedMinutes),
        is_rotation_enabled: isRotationEnabled,
        rotation_member_ids: isRotationEnabled ? rotationMemberIds : [],
        current_assignee_id: currentAssigneeId,
        due_date: dueDate || undefined,
        cleaning_supplies_needed: cleaningSuppliesNeeded || undefined,
        is_appliance_maintenance: isApplianceMaintenance,
        appliance_name: isApplianceMaintenance ? applianceName : undefined,
      };

      await onSave(payload, chore?.id);
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  const toggleUserInRotation = (userId: number) => {
    if (rotationMemberIds.includes(userId)) {
      setRotationMemberIds(rotationMemberIds.filter(id => id !== userId));
    } else {
      setRotationMemberIds([...rotationMemberIds, userId]);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-gray-200 dark:border-gray-700">
        
        {/* Header */}
        <div className="p-5 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
            {chore ? t('chores.edit_chore') : t('chores.add_chore_btn')}
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 flex-1 text-xs">
          
          {/* Title */}
          <div>
            <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Název úkolu *
            </label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="např. Vyklidit myčku, Vytřít koupelnu..."
              required
              className="w-full text-sm rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3.5 py-2 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">
              Popis a instrukce
            </label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={2}
              placeholder="Detailní postup, kam uklidit věci..."
              className="w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3.5 py-2 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          {/* Room & Category */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">
                Místnost / Zóna
              </label>
              <select
                value={room}
                onChange={e => setRoom(e.target.value)}
                className="w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-gray-100"
              >
                <option value="kitchen">Kuchyně</option>
                <option value="bathroom">Koupelna & WC</option>
                <option value="living_room">Obývací pokoj</option>
                <option value="bedroom">Ložnice</option>
                <option value="hallway">Předsíň & Chodba</option>
                <option value="kids_room">Dětský pokoj</option>
                <option value="garden">Zahrada & Balkon</option>
                <option value="general">Celý dům</option>
              </select>
            </div>

            <div>
              <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">
                Kategorie úkolu
              </label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-gray-100"
              >
                <option value="routine">Běžná rutina</option>
                <option value="maintenance">Údržba spotřebiče</option>
                <option value="deep_clean">Generální úklid</option>
                <option value="panic_mode">Panic mode (Rychloúkol)</option>
              </select>
            </div>
          </div>

          {/* Frequency & Interval */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">
                Frekvence
              </label>
              <select
                value={frequency}
                onChange={e => {
                  const val = e.target.value;
                  setFrequency(val);
                  if (val === 'daily') setIntervalDays(1);
                  else if (val === 'weekly') setIntervalDays(7);
                  else if (val === 'biweekly') setIntervalDays(14);
                  else if (val === 'monthly') setIntervalDays(30);
                  else if (val === 'seasonal') setIntervalDays(90);
                }}
                className="w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-gray-100"
              >
                <option value="daily">Denně (1 den)</option>
                <option value="weekly">Týdně (7 dní)</option>
                <option value="biweekly">Každé 2 týdny (14 dní)</option>
                <option value="monthly">Měsíčně (30 dní)</option>
                <option value="seasonal">Sezónně (90 dní)</option>
                <option value="as_needed">Podle potřeby</option>
              </select>
            </div>

            <div>
              <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">
                Interval opakování (dní)
              </label>
              <input
                type="number"
                min="1"
                value={intervalDays}
                onChange={e => setIntervalDays(Number(e.target.value))}
                className="w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-gray-100"
              />
            </div>
          </div>

          {/* Points & Time */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                Odměna (b.)
              </label>
              <input
                type="number"
                min="1"
                max="100"
                value={points}
                onChange={e => setPoints(Number(e.target.value))}
                className="w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-gray-100"
              />
            </div>

            <div>
              <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-blue-500" />
                Čas (min)
              </label>
              <input
                type="number"
                min="1"
                value={estimatedMinutes}
                onChange={e => setEstimatedMinutes(Number(e.target.value))}
                className="w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-gray-100"
              />
            </div>

            <div>
              <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-emerald-500" />
                Příští termín
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
                className="w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-gray-100"
              />
            </div>
          </div>

          {/* Rotation Toggle & Members */}
          <div className="p-3.5 rounded-xl bg-gray-50 dark:bg-gray-700/40 border border-gray-200 dark:border-gray-700 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4 text-indigo-500" />
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                    Férová rotace v rodině
                  </h4>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400">
                    Automaticky střídat členy rodiny při každém splnění
                  </p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={isRotationEnabled}
                onChange={e => setIsRotationEnabled(e.target.checked)}
                className="w-4 h-4 rounded text-primary-600 focus:ring-primary-500"
              />
            </div>

            {isRotationEnabled && (
              <div>
                <label className="block text-[11px] font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                  Kdo je zařazen do střídání:
                </label>
                <div className="flex flex-wrap gap-2">
                  {users.map(u => {
                    const isSelected = rotationMemberIds.includes(u.id);
                    return (
                      <button
                        type="button"
                        key={u.id}
                        onClick={() => toggleUserInRotation(u.id)}
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition-all ${
                          isSelected
                            ? 'bg-white dark:bg-gray-800 border-primary-500 text-gray-900 dark:text-gray-100 shadow-sm'
                            : 'bg-transparent border-gray-300 dark:border-gray-600 text-gray-400 opacity-60'
                        }`}
                      >
                        <div
                          className="w-4 h-4 rounded-full flex items-center justify-center text-white text-[9px]"
                          style={{ backgroundColor: u.avatar_color }}
                        >
                          {u.display_name.charAt(0)}
                        </div>
                        <span className="text-xs">{u.display_name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div>
              <label className="block text-[11px] font-medium text-gray-600 dark:text-gray-400 mb-1">
                Kdo začíná (je na řadě teď):
              </label>
              <select
                value={currentAssigneeId || ''}
                onChange={e => setCurrentAssigneeId(e.target.value ? Number(e.target.value) : null)}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-1.5 text-gray-900 dark:text-gray-100"
              >
                <option value="">Kdokoli (volný úkol)</option>
                {users.map(u => (
                  <option key={u.id} value={u.id}>
                    {u.display_name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Appliance Service Toggle */}
          <div className="p-3.5 rounded-xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Wrench className="w-4 h-4 text-blue-500" />
                <span className="font-semibold text-gray-900 dark:text-gray-100">
                  Péče o domácí spotřebič (Servisní knížka)
                </span>
              </div>
              <input
                type="checkbox"
                checked={isApplianceMaintenance}
                onChange={e => setIsApplianceMaintenance(e.target.checked)}
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
              />
            </div>
            {isApplianceMaintenance && (
              <input
                type="text"
                placeholder="Název spotřebiče (např. Kávovar DeLonghi, Myčka Bosch)"
                value={applianceName}
                onChange={e => setApplianceName(e.target.value)}
                className="w-full rounded-lg border border-blue-200 dark:border-blue-800 bg-white dark:bg-gray-700 px-3 py-1.5 text-gray-900 dark:text-gray-100"
              />
            )}
          </div>

          {/* Cleaning supplies needed */}
          <div>
            <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">
              Potřebné čisticí prostředky (pro rychlý nákup)
            </label>
            <input
              type="text"
              placeholder="např. Tablety do myčky Jar Platinum, Pytle do koše..."
              value={cleaningSuppliesNeeded}
              onChange={e => setCleaningSuppliesNeeded(e.target.value)}
              className="w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3.5 py-2 text-gray-900 dark:text-gray-100"
            />
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-2 pt-3 border-t border-gray-100 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 font-medium"
            >
              Zrušit
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-bold shadow-md shadow-primary-500/20 active:scale-98"
            >
              {isSaving ? 'Ukládám...' : 'Uložit úkol'}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
