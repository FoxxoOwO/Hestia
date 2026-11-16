import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, PiggyBank, Plus, Check } from 'lucide-react';
import { SavingsGoal } from '../types';
import { useTranslation } from '../i18n';

interface AddSavingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  goal: SavingsGoal | null;
  onAdd: (goalId: number, amount: number) => Promise<void>;
}

export const AddSavingsModal: React.FC<AddSavingsModalProps> = ({
  isOpen,
  onClose,
  goal,
  onAdd
}) => {
  const { t } = useTranslation();
  const [amount, setAmount] = useState<number | ''>('');
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen || !goal) return null;

  const quickAmounts = [500, 1000, 2000, 5000];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (amount === '' || amount <= 0) return;
    try {
      setIsSaving(true);
      await onAdd(goal.id, Number(amount));
      setAmount('');
      onClose();
    } catch (err) {
      console.error('Failed to add savings:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl max-w-sm w-full p-6 shadow-2xl relative overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-2xl">
              <PiggyBank className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-base text-zinc-800 dark:text-white">
                {t('finance.add_money')}
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate max-w-[180px]">
                {goal.title}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Current status */}
        <div className="py-4">
          <div className="p-3 bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/50 rounded-2xl mb-4 flex justify-between items-center text-xs">
            <span className="text-zinc-500 dark:text-zinc-400">Dosud naspořeno:</span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400">
              {goal.current_amount.toLocaleString('cs-CZ')} / {goal.target_amount.toLocaleString('cs-CZ')} Kč
            </span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                Vložit částku (Kč)
              </label>
              <input
                type="number"
                step="1"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value === '' ? '' : parseFloat(e.target.value))}
                placeholder="1000"
                className="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 rounded-2xl text-lg font-bold text-zinc-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Quick amount chips */}
            <div className="flex gap-2">
              {quickAmounts.map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => setAmount(q)}
                  className="flex-1 py-1.5 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-xl text-xs font-semibold text-zinc-700 dark:text-zinc-300 transition-colors"
                >
                  +{q}
                </button>
              ))}
            </div>

            <div className="pt-3 flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="py-2.5 px-4 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 font-semibold rounded-2xl transition-colors text-sm"
              >
                {t('common.close')}
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="flex-1 py-2.5 px-4 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-semibold rounded-2xl shadow-md transition-all text-sm flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Plus className="w-4 h-4" />
                Vložit úsporu
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>,
    document.body
  );
};
