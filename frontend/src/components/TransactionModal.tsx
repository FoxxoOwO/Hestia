import React, { useState, useEffect } from 'react';
import { X, DollarSign, Calendar, Tag, User as UserIcon, Sparkles, Check, Users, FileText } from 'lucide-react';
import { Transaction, TransactionCreate, User, ReceiptScanResponse } from '../types';
import { useTranslation } from '../i18n';
import { ReceiptScanModal } from './ReceiptScanModal';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction?: Transaction | null;
  users: User[];
  currentUserId: number;
  onSave: (data: TransactionCreate, id?: number) => Promise<void>;
}

export const CATEGORIES = [
  { id: 'groceries', nameCs: 'Potraviny a drogerie', icon: '🛒' },
  { id: 'housing', nameCs: 'Bydlení a nájem', icon: '🏠' },
  { id: 'utilities', nameCs: 'Energie a služby', icon: '⚡' },
  { id: 'transport', nameCs: 'Doprava a palivo', icon: '🚗' },
  { id: 'pets', nameCs: 'Domácí mazlíčci', icon: '🐾' },
  { id: 'health', nameCs: 'Zdraví a lékárna', icon: '💊' },
  { id: 'entertainment', nameCs: 'Zábava a restaurace', icon: '🍿' },
  { id: 'kids', nameCs: 'Děti a škola', icon: '🧸' },
  { id: 'shopping', nameCs: 'Nákupy a oblečení', icon: '🛍️' },
  { id: 'income', nameCs: 'Příjmy a mzda', icon: '💰' },
  { id: 'other', nameCs: 'Ostatní', icon: '🏷️' }
];

export const TransactionModal: React.FC<TransactionModalProps> = ({
  isOpen,
  onClose,
  transaction,
  users,
  currentUserId,
  onSave
}) => {
  const { t } = useTranslation();

  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState<number | ''>('');
  const [transactionType, setTransactionType] = useState<'expense' | 'income'>('expense');
  const [category, setCategory] = useState('groceries');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [payerId, setPayerId] = useState<number>(currentUserId);
  const [isShared, setIsShared] = useState(true);
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isScanModalOpen, setIsScanModalOpen] = useState(false);

  useEffect(() => {
    if (transaction) {
      setTitle(transaction.title);
      setAmount(transaction.amount);
      setTransactionType(transaction.transaction_type);
      setCategory(transaction.category);
      setDate(transaction.date);
      setPayerId(transaction.payer_id);
      setIsShared(transaction.is_shared);
      setNotes(transaction.notes || '');
    } else {
      setTitle('');
      setAmount('');
      setTransactionType('expense');
      setCategory('groceries');
      setDate(new Date().toISOString().split('T')[0]);
      setPayerId(currentUserId);
      setIsShared(true);
      setNotes('');
    }
  }, [transaction, currentUserId, isOpen]);

  if (!isOpen) return null;

  const handleApplyReceipt = (receipt: ReceiptScanResponse) => {
    if (receipt.store_name) setTitle(receipt.store_name);
    if (receipt.total_amount) setAmount(receipt.total_amount);
    if (receipt.date) setDate(receipt.date);
    if (receipt.category) setCategory(receipt.category);
    if (receipt.items_summary) setNotes(receipt.items_summary);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || amount === '' || amount <= 0) return;

    try {
      setIsSaving(true);
      const payload: TransactionCreate = {
        title: title.trim(),
        amount: Number(amount),
        transaction_type: transactionType,
        category,
        date,
        payer_id: payerId,
        is_shared: transactionType === 'income' ? false : isShared,
        split_type: 'equal',
        notes: notes.trim() || undefined
      };
      await onSave(payload, transaction ? transaction.id : undefined);
      onClose();
    } catch (err) {
      console.error('Failed to save transaction:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl relative overflow-hidden max-h-[90vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 rounded-2xl">
                <DollarSign className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-slate-800 dark:text-white">
                  {transaction ? t('finance.transaction_modal_title_edit') : t('finance.transaction_modal_title_add')}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {transaction ? 'Upravit evidovanou položku' : 'Zadat novou platbu do rozpočtu'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {!transaction && (
                <button
                  type="button"
                  onClick={() => setIsScanModalOpen(true)}
                  className="px-3 py-1.5 bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/60 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors shadow-sm"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  {t('finance.scan_receipt')}
                </button>
              )}
              <button
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="py-4 space-y-4 overflow-y-auto flex-1">
            {/* Type selector (Expense vs Income) */}
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl">
              <button
                type="button"
                onClick={() => {
                  setTransactionType('expense');
                  if (category === 'income') setCategory('groceries');
                }}
                className={`py-2 text-sm font-semibold rounded-xl transition-all ${
                  transactionType === 'expense'
                    ? 'bg-white dark:bg-slate-700 text-rose-600 dark:text-rose-400 shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'
                }`}
              >
                {t('finance.type_expense')}
              </button>
              <button
                type="button"
                onClick={() => {
                  setTransactionType('income');
                  setCategory('income');
                  setIsShared(false);
                }}
                className={`py-2 text-sm font-semibold rounded-xl transition-all ${
                  transactionType === 'income'
                    ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'
                }`}
              >
                {t('finance.type_income')}
              </button>
            </div>

            {/* Title */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                {t('finance.title_label')} *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="např. Nákup v Lidlu, Měsíční nájem, Benzín..."
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 dark:text-white"
              />
            </div>

            {/* Amount & Date row */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  {t('finance.amount')} (Kč) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value === '' ? '' : parseFloat(e.target.value))}
                  placeholder="0.00"
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  {t('finance.date')}
                </label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 dark:text-white"
                />
              </div>
            </div>

            {/* Category & Payer */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  {t('finance.category')}
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 dark:text-white"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.icon} {t(`finance.categories.${cat.id}`)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  {t('finance.payer')}
                </label>
                <select
                  value={payerId}
                  onChange={(e) => setPayerId(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 dark:text-white"
                >
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.display_name || u.username}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Shared checkbox (only for expenses) */}
            {transactionType === 'expense' && (
              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-start gap-3">
                <input
                  type="checkbox"
                  id="is_shared"
                  checked={isShared}
                  onChange={(e) => setIsShared(e.target.checked)}
                  className="mt-1 w-4 h-4 rounded text-amber-600 focus:ring-amber-500 border-slate-300"
                />
                <label htmlFor="is_shared" className="text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                  <span className="font-semibold block text-slate-800 dark:text-white">
                    {t('finance.is_shared_label')}
                  </span>
                  <span className="text-slate-400 dark:text-slate-400">
                    Rozdělí se rovným dílem mezi aktivní členy domácnosti pro vyrovnání dluhů a QR platby.
                  </span>
                </label>
              </div>
            )}

            {/* Notes */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                {t('finance.notes')}
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Podrobnosti, položky nákupu nebo poznámka..."
                className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 dark:text-white"
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
                className="flex-1 py-2.5 px-4 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-semibold rounded-2xl shadow-md transition-all text-sm flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Check className="w-4 h-4" />
                {t('common.success')}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Embedded receipt scanner modal */}
      <ReceiptScanModal
        isOpen={isScanModalOpen}
        onClose={() => setIsScanModalOpen(false)}
        onApplyReceipt={handleApplyReceipt}
      />
    </>
  );
};
