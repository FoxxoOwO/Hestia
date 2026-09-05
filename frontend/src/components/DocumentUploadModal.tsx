import React, { useState, useRef } from 'react';
import {
  X, UploadCloud, FileText, Sparkles, Check, Loader2,
  Calendar, Shield, Tag, DollarSign, Building2, MapPin, Lock
} from 'lucide-react';
import { api } from '../services/api';
import { DocumentCategory, DocumentCreate, DocumentAiScanResponse } from '../types';
import { useTranslation } from '../i18n';

interface DocumentUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveSuccess: () => void;
}

export const DOCUMENT_CATEGORIES: { id: DocumentCategory; icon: string; nameCs: string }[] = [
  { id: 'warranty', icon: '🛡️', nameCs: 'Záruční listy & Účtenky' },
  { id: 'contract', icon: '📑', nameCs: 'Smlouvy & Pojištění' },
  { id: 'inspection', icon: '🔧', nameCs: 'Revize & Technické zprávy' },
  { id: 'manual', icon: '📖', nameCs: 'Návody & Manuály' },
  { id: 'identity', icon: '🆔', nameCs: 'Osobní & Rodinné doklady' },
  { id: 'medical', icon: '🏥', nameCs: 'Lékařské zprávy & Zdraví' },
  { id: 'housing', icon: '🏠', nameCs: 'Nemovitost & Bydlení' },
  { id: 'vehicle', icon: '🚗', nameCs: 'Vozidla & Garáž' },
  { id: 'other', icon: '📁', nameCs: 'Ostatní dokumenty' }
];

export const DocumentUploadModal: React.FC<DocumentUploadModalProps> = ({
  isOpen,
  onClose,
  onSaveSuccess
}) => {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Upload & AI state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [autoAnalyze, setAutoAnalyze] = useState(true);
  const [uploadedFilePath, setUploadedFilePath] = useState<string | null>(null);
  const [uploadedFileType, setUploadedFileType] = useState('application/pdf');
  const [uploadedFileSize, setUploadedFileSize] = useState(0);

  // Form fields
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<DocumentCategory>('warranty');
  const [issuer, setIssuer] = useState('');
  const [documentDate, setDocumentDate] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [warrantyMonths, setWarrantyMonths] = useState<number | ''>('');
  const [contractNumber, setContractNumber] = useState('');
  const [amount, setAmount] = useState<number | ''>('');
  const [physicalLocation, setPhysicalLocation] = useState('');
  const [isVaultProtected, setIsVaultProtected] = useState(false);
  const [tags, setTags] = useState('');
  const [summary, setSummary] = useState('');
  const [ocrFulltext, setOcrFulltext] = useState('');

  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleProcessFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) handleProcessFile(file);
  };

  const handleProcessFile = async (file: File) => {
    setSelectedFile(file);
    setError(null);
    try {
      setIsUploading(true);
      const res = await api.uploadDocumentFile(file, autoAnalyze);
      setUploadedFilePath(res.file_path);
      setUploadedFileType(res.file_type);
      setUploadedFileSize(res.file_size);

      // Pre-fill form from Gemini AI metadata if present
      if (res.ai_metadata) {
        const meta = res.ai_metadata;
        if (meta.title) setTitle(meta.title);
        if (meta.category) setCategory(meta.category);
        if (meta.issuer) setIssuer(meta.issuer);
        if (meta.document_date) setDocumentDate(meta.document_date);
        if (meta.expiry_date) setExpiryDate(meta.expiry_date);
        if (meta.warranty_months) setWarrantyMonths(meta.warranty_months);
        if (meta.contract_number) setContractNumber(meta.contract_number);
        if (meta.amount) setAmount(meta.amount);
        if (meta.tags) setTags(meta.tags);
        if (meta.summary) setSummary(meta.summary);
        if (meta.ocr_fulltext) setOcrFulltext(meta.ocr_fulltext);
      } else {
        setTitle(file.name.replace(/\.[^/.]+$/, ''));
      }
    } catch (err: any) {
      console.error('File upload error:', err);
      setError(err.message || 'Nepodařilo se nahrát soubor.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setUploadedFilePath(null);
    setTitle('');
    setCategory('warranty');
    setIssuer('');
    setDocumentDate('');
    setExpiryDate('');
    setWarrantyMonths('');
    setContractNumber('');
    setAmount('');
    setPhysicalLocation('');
    setIsVaultProtected(false);
    setTags('');
    setSummary('');
    setOcrFulltext('');
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadedFilePath || !title.trim()) return;

    try {
      setIsSaving(true);
      const payload: DocumentCreate = {
        title: title.trim(),
        category,
        file_path: uploadedFilePath,
        file_name: selectedFile?.name || 'document.pdf',
        file_size: uploadedFileSize,
        file_type: uploadedFileType,
        issuer: issuer.trim() || undefined,
        document_date: documentDate || undefined,
        expiry_date: expiryDate || undefined,
        warranty_months: warrantyMonths === '' ? undefined : Number(warrantyMonths),
        contract_number: contractNumber.trim() || undefined,
        amount: amount === '' ? undefined : Number(amount),
        physical_location: physicalLocation.trim() || undefined,
        is_vault_protected: isVaultProtected,
        tags: tags.trim() || undefined,
        summary: summary.trim() || undefined,
        ocr_fulltext: ocrFulltext.trim() || undefined
      };
      await api.createDocument(payload);
      onSaveSuccess();
      handleReset();
      onClose();
    } catch (err: any) {
      console.error('Failed to save document:', err);
      setError(err.message || 'Chyba při ukládání dokumentu.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-2xl w-full p-6 shadow-2xl relative overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-2xl">
              <UploadCloud className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-slate-800 dark:text-white">
                {t('documents.upload_btn')}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Digitalizace a archivace do rodinného šanonu
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
          {/* File drop zone if no file uploaded yet */}
          {!uploadedFilePath ? (
            <div className="space-y-4">
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
                  {t('documents.drop_file_zone')}
                </p>
                <p className="text-xs text-slate-400">
                  Podporovány jsou soubory PDF, JPEG, PNG, WEBP
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>

              {/* Gemini AI toggle checkbox */}
              <div className="p-3 bg-purple-50 dark:bg-purple-950/30 rounded-2xl border border-purple-100 dark:border-purple-900/50 flex items-center gap-3">
                <input
                  type="checkbox"
                  id="auto_analyze"
                  checked={autoAnalyze}
                  onChange={(e) => setAutoAnalyze(e.target.checked)}
                  className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 border-slate-300"
                />
                <label htmlFor="auto_analyze" className="text-xs text-slate-700 dark:text-slate-300 cursor-pointer flex items-center gap-1.5 font-medium">
                  <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  <span>{t('documents.auto_extract_label')}</span>
                </label>
              </div>
            </div>
          ) : (
            /* Uploaded file preview badge */
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 rounded-2xl flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span className="font-semibold text-emerald-800 dark:text-emerald-200 truncate max-w-sm">
                  {selectedFile?.name} ({(uploadedFileSize / 1024).toFixed(0)} KB)
                </span>
              </div>
              <button
                type="button"
                onClick={handleReset}
                className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 underline"
              >
                Změnit soubor
              </button>
            </div>
          )}

          {/* Loader when uploading / analyzing */}
          {isUploading && (
            <div className="py-10 flex flex-col items-center justify-center text-center space-y-3">
              <Loader2 className="w-10 h-10 text-purple-600 animate-spin" />
              <p className="font-semibold text-slate-700 dark:text-slate-200 text-sm">
                {t('documents.ai_analyzing')}
              </p>
              <p className="text-xs text-slate-400">
                Gemini vytěžuje název, vystavitele, datum nákupu, záruku a text...
              </p>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 rounded-2xl text-rose-600 dark:text-rose-400 text-xs">
              {error}
            </div>
          )}

          {/* Form fields (visible once file is uploaded) */}
          {uploadedFilePath && !isUploading && (
            <form id="document-form" onSubmit={handleSubmit} className="space-y-4">
              {/* Title */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Název dokumentu *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="např. Záruční list – Sušička Bosch Serie 8"
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                />
              </div>

              {/* Category & Issuer */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Šanon (Kategorie)
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as DocumentCategory)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                  >
                    {DOCUMENT_CATEGORIES.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.icon} {c.nameCs}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {t('documents.issuer')}
                  </label>
                  <input
                    type="text"
                    value={issuer}
                    onChange={(e) => setIssuer(e.target.value)}
                    placeholder="např. Alza.cz, Allianz, ČEZ..."
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                  />
                </div>
              </div>

              {/* Dates & Warranty */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Datum vystavení
                  </label>
                  <input
                    type="date"
                    value={documentDate}
                    onChange={(e) => setDocumentDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Konec záruky / Expirace
                  </label>
                  <input
                    type="date"
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Záruka (měsíců)
                  </label>
                  <input
                    type="number"
                    value={warrantyMonths}
                    onChange={(e) => setWarrantyMonths(e.target.value === '' ? '' : parseInt(e.target.value))}
                    placeholder="24"
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                  />
                </div>
              </div>

              {/* Contract Number & Amount */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {t('documents.contract_num')}
                  </label>
                  <input
                    type="text"
                    value={contractNumber}
                    onChange={(e) => setContractNumber(e.target.value)}
                    placeholder="Sériové číslo nebo číslo smlouvy"
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {t('documents.amount')} (Kč)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value === '' ? '' : parseFloat(e.target.value))}
                    placeholder="0.00"
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                  />
                </div>
              </div>

              {/* Physical Location (Kde leží papírový originál) */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  📦 {t('documents.physical_location')}
                </label>
                <input
                  type="text"
                  value={physicalLocation}
                  onChange={(e) => setPhysicalLocation(e.target.value)}
                  placeholder={t('documents.location_placeholder')}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                />
              </div>

              {/* Tags & AI Summary */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {t('documents.tags_label')}
                  </label>
                  <input
                    type="text"
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                    placeholder="pračka, bosch, elektro, záruka..."
                    className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {t('documents.summary_label')}
                  </label>
                  <textarea
                    rows={2}
                    value={summary}
                    onChange={(e) => setSummary(e.target.value)}
                    placeholder="Stručný popis obsahu dokumentu..."
                    className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                  />
                </div>
              </div>

              {/* Vault protection toggle */}
              <div className="p-3 bg-rose-50/60 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/40 rounded-2xl flex items-center gap-3">
                <input
                  type="checkbox"
                  id="vault_protected"
                  checked={isVaultProtected}
                  onChange={(e) => setIsVaultProtected(e.target.checked)}
                  className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500 border-slate-300"
                />
                <label htmlFor="vault_protected" className="text-xs text-slate-700 dark:text-slate-300 cursor-pointer flex items-center gap-1.5 font-semibold">
                  <Lock className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                  <span>{t('documents.vault_toggle_label')}</span>
                </label>
              </div>
            </form>
          )}
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
          {uploadedFilePath && (
            <button
              type="submit"
              form="document-form"
              disabled={isSaving || !title.trim()}
              className="flex-1 py-2.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-2xl shadow-md transition-all text-sm flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              {t('documents.save_document')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
