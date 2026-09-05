import React, { useState, useRef } from 'react';
import { X, Sparkles, UploadCloud, FileText, CheckCircle2, Store, Calendar, DollarSign, Tag, Loader2 } from 'lucide-react';
import { api } from '../services/api';
import { ReceiptScanResponse } from '../types';
import { useTranslation } from '../i18n';

interface ReceiptScanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyReceipt: (data: ReceiptScanResponse) => void;
}

export const ReceiptScanModal: React.FC<ReceiptScanModalProps> = ({
  isOpen,
  onClose,
  onApplyReceipt
}) => {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<ReceiptScanResponse | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  const processImageFile = (file: File) => {
    setError(null);
    const reader = new FileReader();
    reader.onload = async () => {
      const base64Data = reader.result as string;
      setPreviewUrl(base64Data);
      try {
        setIsScanning(true);
        const result = await api.scanFinanceReceipt({
          image_base64: base64Data
        });
        setScanResult(result);
      } catch (err: any) {
        console.error('Scan receipt error:', err);
        setError(err.message || 'Nepodařilo se rozpoznat účtenku pomocí Gemini AI.');
      } finally {
        setIsScanning(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleApply = () => {
    if (scanResult) {
      onApplyReceipt(scanResult);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl relative overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 rounded-2xl">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-slate-800 dark:text-white">
                {t('finance.receipt_scan_title')}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {t('finance.receipt_scan_desc')}
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

        {/* Content */}
        <div className="py-4 space-y-4 overflow-y-auto flex-1">
          {/* Drop area */}
          {!previewUrl && (
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-purple-300 dark:border-purple-800/60 hover:border-purple-500 dark:hover:border-purple-600 bg-purple-50/40 dark:bg-purple-950/20 rounded-3xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all group"
            >
              <div className="p-4 bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-300 rounded-2xl mb-3 group-hover:scale-110 transition-transform">
                <UploadCloud className="w-8 h-8" />
              </div>
              <p className="font-semibold text-sm text-slate-700 dark:text-slate-200 mb-1">
                {t('finance.upload_receipt_image')}
              </p>
              <p className="text-xs text-slate-400 dark:text-slate-500">
                PNG, JPG, WEBP do velikosti 10 MB
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
          )}

          {/* Scanning loader */}
          {isScanning && (
            <div className="py-10 flex flex-col items-center justify-center text-center space-y-3">
              <Loader2 className="w-10 h-10 text-purple-600 animate-spin" />
              <p className="font-semibold text-slate-700 dark:text-slate-200 text-sm">
                {t('finance.scanning_receipt')}
              </p>
              <p className="text-xs text-slate-400">
                Gemini Flash vytahuje obchod, částku, datum a položky...
              </p>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 rounded-2xl text-rose-600 dark:text-rose-400 text-xs">
              {error}
            </div>
          )}

          {/* Results */}
          {scanResult && !isScanning && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 rounded-2xl text-emerald-700 dark:text-emerald-300 text-xs font-semibold">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Účtenka byla úspěšně zpracována! Zkontrolujte vytěžené údaje.</span>
              </div>

              {/* Preview image thumbnail */}
              {previewUrl && (
                <div className="flex justify-center">
                  <img
                    src={previewUrl}
                    alt="Receipt preview"
                    className="max-h-40 rounded-2xl border border-slate-200 dark:border-slate-800 object-contain shadow-sm"
                  />
                </div>
              )}

              {/* Details grid */}
              <div className="grid grid-cols-2 gap-3 bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 text-sm">
                <div>
                  <span className="text-xs text-slate-400 flex items-center gap-1 mb-1">
                    <Store className="w-3.5 h-3.5" /> Obchod:
                  </span>
                  <span className="font-semibold text-slate-800 dark:text-slate-100">
                    {scanResult.store_name || 'Neznámý obchod'}
                  </span>
                </div>

                <div>
                  <span className="text-xs text-slate-400 flex items-center gap-1 mb-1">
                    <DollarSign className="w-3.5 h-3.5" /> Celkem:
                  </span>
                  <span className="font-bold text-lg text-emerald-600 dark:text-emerald-400">
                    {scanResult.total_amount ? `${scanResult.total_amount.toLocaleString('cs-CZ')} Kč` : '0 Kč'}
                  </span>
                </div>

                <div>
                  <span className="text-xs text-slate-400 flex items-center gap-1 mb-1">
                    <Calendar className="w-3.5 h-3.5" /> Datum:
                  </span>
                  <span className="font-semibold text-slate-800 dark:text-slate-100">
                    {scanResult.date || 'Dnes'}
                  </span>
                </div>

                <div>
                  <span className="text-xs text-slate-400 flex items-center gap-1 mb-1">
                    <Tag className="w-3.5 h-3.5" /> Kategorie:
                  </span>
                  <span className="inline-block px-2 py-0.5 rounded-full text-xs font-semibold bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300">
                    {scanResult.category || 'groceries'}
                  </span>
                </div>

                {scanResult.items_summary && (
                  <div className="col-span-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                    <span className="text-xs text-slate-400 block mb-1">Položky na účtence:</span>
                    <p className="text-xs text-slate-600 dark:text-slate-300 whitespace-pre-line">
                      {scanResult.items_summary}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex gap-3">
          {scanResult ? (
            <>
              <button
                onClick={() => {
                  setScanResult(null);
                  setPreviewUrl(null);
                }}
                className="py-3 px-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold rounded-2xl transition-colors text-sm"
              >
                Nahrát jinou
              </button>
              <button
                onClick={handleApply}
                className="flex-1 py-3 px-4 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white font-semibold rounded-2xl shadow-md transition-all text-sm flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                {t('finance.create_from_receipt')}
              </button>
            </>
          ) : (
            <button
              onClick={onClose}
              className="w-full py-3 px-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold rounded-2xl transition-colors text-sm"
            >
              {t('common.close')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
