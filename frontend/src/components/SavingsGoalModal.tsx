import React, { useState, useEffect } from 'react';
import { X, PiggyBank, Calendar, DollarSign, Check, Heart, Palmtree, Car, Home, Laptop, Gift } from 'lucide-react';
import { SavingsGoal, SavingsGoalCreate } from '../types';
import { useTranslation } from '../i18n';

interface SavingsGoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  goal?: SavingsGoal | null;
  onSave: (data: SavingsGoalCreate, id?: number) => Promise<void>;
}

const PRESET_ICONS = [
  { id: 'PiggyBank', icon: '🐷', label: 'Prasátko' },
  { id: 'Palmtree', icon: '🌴', label: 'Dovolená' },
  { id: 'Car', icon: '🚗', label: 'Auto' },
  { id: 'Home', icon: '🏠', label: 'Bydlení' },
  { id: 'Laptop', icon: '💻', label: 'Elektronika' },
  { id: 'Gift', icon: '🎁', label: 'Dárky' },
  { id: 'Heart', icon: '❤️', label: 'Rezerva' }
];

const PRESET_COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#f97316', '#eab308'];

export const SavingsGoalModal: React.FC<SavingsGoalModalProps> = ({
  isOpen,
  onClose,
  goal,
  onSave
}) => {
  const { t } = useTranslation();

  const [title, setTitle] = useState('');
  const [targetAmount, setTargetAmount] = useState<number | ''>('');
  const [currentAmount, setCurrentAmount] = useState<number | ''>(0);
  const [targetDate, setTargetDate] = useState('');
  const [icon, setIcon] = useState('PiggyBank');
  const [color, setColor] = useState('#10b981');
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (goal) {
      setTitle(goal.title);
      setTargetAmount(goal.target_amount);
      setCurrentAmount(goal.current_amount);
      setTargetDate(goal.target_date || '');
      setIcon(goal.icon || 'PiggyBank');
      setColor(goal.color || '#10b981');
      setNotes(goal.notes || '');
    } else {
      setTitle('');
      setTargetAmount('');
      setCurrentAmount(0);
      setTargetDate('');
      setIcon('PiggyBank');
      setColor('#10b981');
      setNotes('');
    }
  }, [goal, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || targetAmount === '' || targetAmount <= 0) return;

    try {
      setIsSaving(true);
      const payload: SavingsGoalCreate = {
        title: title.trim(),
        target_amount: Number(targetAmount),
        current_amount: currentAmount === '' ? 0 : Number(currentAmount),
        target_date: targetDate || undefined,
        icon,
        color,
        notes: notes.trim() || undefined
      };
      await onSave(payload, goal ? goal.id : undefined);
      onClose();
    } catch (err) {
      console.error('Failed to save savings goal:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl relative overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-2xl">
              <PiggyBank className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-slate-800 dark:text-white">
                {goal ? 'Upravit spořicí cíl' : t('finance.add_goal')}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Stanovte si cíl a sledujte svůj pokrok
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="py-4 space-y-4 overflow-y-auto flex-1">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Název cíle *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="např. Letní dovolená v Řecku, Nová pohovka, Nouzová rezerva..."
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Cílová částka (Kč) *
              </label>
              <input
                type="number"
                step="1"
                required
                value={targetAmount}
                onChange={(e) => setTargetAmount(e.target.value === '' ? '' : parseFloat(e.target.value))}
                placeholder="50000"
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Aktuálně naspořeno (Kč)
              </label>
              <input
                type="number"
                step="1"
                value={currentAmount}
                onChange={(e) => setCurrentAmount(e.target.value === '' ? '' : parseFloat(e.target.value))}
                placeholder="0"
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Cílové datum (volitelné)
            </label>
            <input
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:text-white"
            />
          </div>

          {/* Icon & Color selector */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Ikona
              </label>
              <div className="flex flex-wrap gap-2">
                {PRESET_ICONS.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setIcon(item.id)}
                    className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg border transition-all ${
                      icon === item.id
                        ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 scale-105'
                        : 'border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    {item.icon}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Barva
              </label>
              <div className="flex flex-wrap gap-2">
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    style={{ backgroundColor: c }}
                    className={`w-9 h-9 rounded-xl border-2 transition-transform ${
                      color === c ? 'border-white dark:border-slate-900 scale-110 shadow-md ring-2 ring-emerald-500' : 'border-transparent'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Poznámka
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Odkazy, detaily nebo plán spoření..."
              className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:text-white"
            />
          </div>

          {/* Footer */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="py-2.5 px-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold rounded-2xl transition-colors text-sm"
            >
              {t('common.close')}
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex-1 py-2.5 px-4 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-semibold rounded-2xl shadow-md transition-all text-sm flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              {t('common.success')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
