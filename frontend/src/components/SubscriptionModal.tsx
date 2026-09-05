import React, { useState, useEffect } from 'react';
import { X, Calendar, DollarSign, Repeat, Check, User as UserIcon } from 'lucide-react';
import { Subscription, SubscriptionCreate, User, BillingCycle } from '../types';
import { useTranslation } from '../i18n';
import { CATEGORIES } from './TransactionModal';

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  subscription?: Subscription | null;
  users: User[];
  currentUserId: number;
  onSave: (data: SubscriptionCreate, id?: number) => Promise<void>;
}

export const SubscriptionModal: React.FC<SubscriptionModalProps> = ({
  isOpen,
  onClose,
  subscription,
  users,
  currentUserId,
  onSave
}) => {
  const { t } = useTranslation();

  const [name, setName] = useState('');
  const [amount, setAmount] = useState<number | ''>('');
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly');
  const [nextBillingDate, setNextBillingDate] = useState(new Date().toISOString().split('T')[0]);
  const [category, setCategory] = useState('entertainment');
  const [payerId, setPayerId] = useState<number>(currentUserId);
  const [serviceUrl, setServiceUrl] = useState('');
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (subscription) {
      setName(subscription.name);
      setAmount(subscription.amount);
      setBillingCycle(subscription.billing_cycle);
      setNextBillingDate(subscription.next_billing_date);
      setCategory(subscription.category);
      setPayerId(subscription.payer_id || currentUserId);
      setServiceUrl(subscription.service_url || '');
      setNotes(subscription.notes || '');
    } else {
      setName('');
      setAmount('');
      setBillingCycle('monthly');
      setNextBillingDate(new Date().toISOString().split('T')[0]);
      setCategory('entertainment');
      setPayerId(currentUserId);
      setServiceUrl('');
      setNotes('');
    }
  }, [subscription, currentUserId, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || amount === '' || amount <= 0) return;

    try {
      setIsSaving(true);
      const payload: SubscriptionCreate = {
        name: name.trim(),
        amount: Number(amount),
        billing_cycle: billingCycle,
        next_billing_date: nextBillingDate,
        category,
        payer_id: payerId,
        service_url: serviceUrl.trim() || undefined,
        notes: notes.trim() || undefined,
        is_active: true
      };
      await onSave(payload, subscription ? subscription.id : undefined);
      onClose();
    } catch (err) {
      console.error('Failed to save subscription:', err);
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
            <div className="p-2.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-2xl">
              <Repeat className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-slate-800 dark:text-white">
                {subscription ? 'Upravit předplatné' : t('finance.add_subscription')}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Pravidelná platba se sledováním termínu stržení
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
              Název služby *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="např. Netflix, Spotify Family, O2 Internet, Pojištění..."
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Částka (Kč) *
              </label>
              <input
                type="number"
                step="0.01"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value === '' ? '' : parseFloat(e.target.value))}
                placeholder="0.00"
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                {t('finance.billing_cycle')}
              </label>
              <select
                value={billingCycle}
                onChange={(e) => setBillingCycle(e.target.value as BillingCycle)}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
              >
                <option value="monthly">{t('finance.cycle_monthly')}</option>
                <option value="quarterly">{t('finance.cycle_quarterly')}</option>
                <option value="yearly">{t('finance.cycle_yearly')}</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                {t('finance.next_billing')} *
              </label>
              <input
                type="date"
                required
                value={nextBillingDate}
                onChange={(e) => setNextBillingDate(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                {t('finance.category')}
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
              >
                {CATEGORIES.filter(c => c.id !== 'income').map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.icon} {t(`finance.categories.${cat.id}`)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Plátce
              </label>
              <select
                value={payerId}
                onChange={(e) => setPayerId(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
              >
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.display_name || u.username}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Odkaz na správu (URL)
              </label>
              <input
                type="url"
                value={serviceUrl}
                onChange={(e) => setServiceUrl(e.target.value)}
                placeholder="https://..."
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
              />
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
              placeholder="Číslo smlouvy, přihlašovací údaje nebo poznámky..."
              className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
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
              className="flex-1 py-2.5 px-4 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-semibold rounded-2xl shadow-md transition-all text-sm flex items-center justify-center gap-2 disabled:opacity-50"
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
