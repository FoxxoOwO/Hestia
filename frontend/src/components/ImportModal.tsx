import React, { useState, useRef } from 'react';
import { X, UploadCloud, FileSpreadsheet, CheckCircle2, AlertCircle, Loader2, ArrowRight, UserCheck } from 'lucide-react';
import { api } from '../services/api';
import { CsvImportPreview, CsvImportRow, User } from '../types';
import { useTranslation } from '../i18n';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  users: User[];
  currentUserId: number;
  onImportSuccess: () => void;
}

export const ImportModal: React.FC<ImportModalProps> = ({
  isOpen,
  onClose,
  users,
  currentUserId,
  onImportSuccess
}) => {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [preview, setPreview] = useState<CsvImportPreview | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [payerId, setPayerId] = useState<number>(currentUserId);
  const [isShared, setIsShared] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  if (!isOpen) return null;

  const handleFile = async (file: File) => {
    setSelectedFile(file);
    setError(null);
    try {
      setIsLoading(true);
      const res = await api.previewFinanceImport(file);
      setPreview(res);
    } catch (err: any) {
      console.error('Import preview failed:', err);
      setError(err.message || 'Nepodařilo se zpracovat výpis. Zkontrolujte formát souboru (.csv, .xlsx, .xls).');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const handleConfirm = async () => {
    if (!preview || preview.rows.length === 0) return;
    try {
      setIsImporting(true);
      await api.confirmFinanceImport({
        rows: preview.rows,
        payer_id: payerId,
        is_shared: isShared
      });
      onImportSuccess();
      onClose();
    } catch (err: any) {
      console.error('Failed to import rows:', err);
      setError(err.message || 'Chyba při ukládání importovaných plateb.');
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-2xl w-full p-6 shadow-2xl relative overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-2xl">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-slate-800 dark:text-white">
                {t('finance.import_title')}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {t('finance.import_desc')}
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

        {/* Body */}
        <div className="py-4 space-y-4 overflow-y-auto flex-1">
          {!preview ? (
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-blue-300 dark:border-blue-800/60 hover:border-blue-500 dark:hover:border-blue-600 bg-blue-50/30 dark:bg-blue-950/20 rounded-3xl p-10 flex flex-col items-center justify-center text-center cursor-pointer transition-all group"
            >
              <div className="p-4 bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-300 rounded-2xl mb-3 group-hover:scale-110 transition-transform">
                <UploadCloud className="w-9 h-9" />
              </div>
              <p className="font-semibold text-slate-700 dark:text-slate-200 text-sm mb-1">
                {t('finance.drop_file')}
              </p>
              <p className="text-xs text-slate-400">
                Podporovány jsou bankovní exporty ČS, AirBank, KB, Fio, ČSOB, Revolut a další.
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleFile(f);
                }}
                className="hidden"
              />
            </div>
          ) : (
            <div className="space-y-4">
              {/* Summary Stats Cards */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <span className="text-xs text-slate-400 block">Nalezeno položek</span>
                  <span className="text-xl font-bold text-slate-800 dark:text-white">
                    {preview.total_count}
                  </span>
                </div>
                <div className="p-3.5 bg-rose-50 dark:bg-rose-950/30 rounded-2xl border border-rose-100 dark:border-rose-900">
                  <span className="text-xs text-rose-500 block">Výdaje celkem</span>
                  <span className="text-xl font-bold text-rose-600 dark:text-rose-400">
                    {preview.total_expense.toLocaleString('cs-CZ')} Kč
                  </span>
                </div>
                <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/30 rounded-2xl border border-emerald-100 dark:border-emerald-900">
                  <span className="text-xs text-emerald-500 block">Příjmy celkem</span>
                  <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                    {preview.total_income.toLocaleString('cs-CZ')} Kč
                  </span>
                </div>
              </div>

              {/* Assignment Controls */}
              <div className="grid grid-cols-2 gap-3 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    {t('finance.import_assign_payer')}
                  </label>
                  <select
                    value={payerId}
                    onChange={(e) => setPayerId(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                  >
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.display_name || u.username}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center pt-5">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700 dark:text-slate-300">
                    <input
                      type="checkbox"
                      checked={isShared}
                      onChange={(e) => setIsShared(e.target.checked)}
                      className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
                    />
                    <span>{t('finance.import_as_shared')}</span>
                  </label>
                </div>
              </div>

              {/* Preview table */}
              <div>
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-2">
                  Náhled prvních {Math.min(preview.rows.length, 15)} položek z celkových {preview.total_count}:
                </span>
                <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden max-h-56 overflow-y-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 dark:bg-slate-800/90 text-slate-600 dark:text-slate-300 font-semibold sticky top-0">
                      <tr>
                        <th className="py-2 px-3">Datum</th>
                        <th className="py-2 px-3">Název</th>
                        <th className="py-2 px-3">Kategorie</th>
                        <th className="py-2 px-3 text-right">Částka</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {preview.rows.slice(0, 15).map((r, idx) => (
                        <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                          <td className="py-2 px-3 text-slate-500 whitespace-nowrap">{r.date}</td>
                          <td className="py-2 px-3 font-medium text-slate-800 dark:text-slate-200 truncate max-w-xs">{r.title}</td>
                          <td className="py-2 px-3">
                            <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px]">
                              {r.category}
                            </span>
                          </td>
                          <td className={`py-2 px-3 text-right font-semibold whitespace-nowrap ${
                            r.transaction_type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-800 dark:text-slate-200'
                          }`}>
                            {r.transaction_type === 'income' ? '+' : '-'}{r.amount.toLocaleString('cs-CZ')} Kč
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Loading */}
          {isLoading && (
            <div className="py-8 flex flex-col items-center justify-center space-y-2">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
              <p className="text-xs text-slate-500">Parsování a auto-kategorizace plateb...</p>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 rounded-2xl text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex gap-3">
          {preview ? (
            <>
              <button
                onClick={() => {
                  setPreview(null);
                  setSelectedFile(null);
                }}
                className="py-2.5 px-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold rounded-2xl transition-colors text-sm"
              >
                Vybrat jiný soubor
              </button>
              <button
                onClick={handleConfirm}
                disabled={isImporting}
                className="flex-1 py-2.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-2xl shadow-md transition-all text-sm flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isImporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                {t('finance.btn_confirm_import', { count: preview.total_count })}
              </button>
            </>
          ) : (
            <button
              onClick={onClose}
              className="w-full py-2.5 px-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold rounded-2xl transition-colors text-sm"
            >
              {t('common.close')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
