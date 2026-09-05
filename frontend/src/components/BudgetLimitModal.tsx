import React, { useState, useEffect } from 'react';
import { X, Sliders, Check } from 'lucide-react';
import { useTranslation } from '../i18n';

interface BudgetLimitModalProps {
  isOpen: boolean;
  onClose: () => void;
  category: string;
  currentLimit: number;
  onSave: (category: string, newLimit: number) => Promise<void>;
}

export const BudgetLimitModal: React.FC<BudgetLimitModalProps> = ({
  isOpen,
  onClose,
  category,
  currentLimit,
  onSave
}) => {
  const { t } = useTranslation();
  const [limit, setLimit] = useState<number | ''>(currentLimit);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setLimit(currentLimit);
  }, [currentLimit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (limit === '' || limit < 0) return;
    try {
      setIsSaving(true);
      await onSave(category, Number(limit));
      onClose();
    } catch (err) {
      console.error('Failed to save budget limit:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-sm w-full p-6 shadow-2xl relative overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 rounded-2xl">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-800 dark:text-white">
                {t('finance.edit_budget')}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 capitalize">
                {t(`finance.categories.${category}`)}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="py-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Měsíční limit obálky (Kč)
            </label>
            <input
              type="number"
              step="100"
              required
              value={limit}
              onChange={(e) => setLimit(e.target.value === '' ? '' : parseFloat(e.target.value))}
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl text-base font-bold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div className="pt-2 flex gap-3">
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
              className="flex-1 py-2.5 px-4 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-semibold rounded-2xl shadow-md transition-all text-sm flex items-center justify-center gap-2 disabled:opacity-50"
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
