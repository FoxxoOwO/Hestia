import React, { useState } from 'react';
import {
  X, FileText, Calendar, Building2, MapPin, Tag,
  Clock, AlertTriangle, CheckCircle2, ShieldAlert,
  Download, ExternalLink, Trash2, Sparkles, Copy, Check, Lock
} from 'lucide-react';
import { DocumentItem } from '../types';
import { DOCUMENT_CATEGORIES } from './DocumentUploadModal';
import { useTranslation } from '../i18n';

interface DocumentDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: DocumentItem | null;
  onDelete?: (id: number) => Promise<void>;
}

export const DocumentDetailModal: React.FC<DocumentDetailModalProps> = ({
  isOpen,
  onClose,
  document: doc,
  onDelete
}) => {
  const { t } = useTranslation();
  const [showOcr, setShowOcr] = useState(false);
  const [copiedOcr, setCopiedOcr] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (!isOpen || !doc) return null;

  const categoryInfo = DOCUMENT_CATEGORIES.find(c => c.id === doc.category) || {
    id: doc.category,
    icon: '📁',
    nameCs: doc.category
  };

  const formatBytes = (bytes?: number) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '–';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('cs-CZ');
    } catch {
      return dateStr;
    }
  };

  const handleCopyOcr = () => {
    if (doc.ocr_fulltext) {
      navigator.clipboard.writeText(doc.ocr_fulltext);
      setCopiedOcr(true);
      setTimeout(() => setCopiedOcr(false), 2000);
    }
  };

  const handleDelete = async () => {
    if (!onDelete) return;
    try {
      setIsDeleting(true);
      await onDelete(doc.id);
      onClose();
    } catch (err) {
      console.error('Failed to delete document:', err);
    } finally {
      setIsDeleting(false);
      setConfirmDelete(false);
    }
  };

  const fileUrl = doc.file_path.startsWith('/') ? doc.file_path : `/${doc.file_path}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-2xl w-full p-6 shadow-2xl relative my-8">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <span className="text-3xl p-2.5 bg-slate-100 dark:bg-slate-800 rounded-2xl">
              {categoryInfo.icon}
            </span>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  {categoryInfo.nameCs}
                </span>
                {doc.is_vault_protected && (
                  <span className="flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                    <Lock className="w-3 h-3" />
                    Trezor
                  </span>
                )}
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mt-1">
                {doc.title}
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Expiry Banner */}
        <div className="my-4">
          {doc.status === 'expiring_soon' && (
            <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300">
              <AlertTriangle className="w-5 h-5 flex-shrink-0 text-amber-500" />
              <div className="text-sm font-medium">
                {t('documents.warranty_expiring', { days: doc.days_until_expiry ?? 0 })}
                {doc.expiry_date && ` (${formatDate(doc.expiry_date)})`}
              </div>
            </div>
          )}

          {doc.status === 'expired' && (
            <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300">
              <ShieldAlert className="w-5 h-5 flex-shrink-0 text-rose-500" />
              <div className="text-sm font-medium">
                {t('documents.warranty_expired')} – {t('documents.expired_ago', { days: Math.abs(doc.days_until_expiry ?? 0) })}
                {doc.expiry_date && ` (${formatDate(doc.expiry_date)})`}
              </div>
            </div>
          )}

          {doc.status === 'active' && doc.days_until_expiry !== null && (
            <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300">
              <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-500" />
              <div className="text-sm font-medium">
                {t('documents.warranty_valid', { days: doc.days_until_expiry })}
                {doc.expiry_date && ` (do ${formatDate(doc.expiry_date)})`}
              </div>
            </div>
          )}

          {doc.status === 'permanent' && (
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-100 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 text-sm">
              <Clock className="w-4 h-4 text-slate-400" />
              <span>{t('documents.filter_permanent')}</span>
            </div>
          )}
        </div>

        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
          {/* Metadata Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 text-sm">
            <div>
              <div className="text-xs text-slate-400 flex items-center gap-1 mb-1">
                <Building2 className="w-3.5 h-3.5" />
                {t('documents.issuer')}
              </div>
              <div className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                {doc.issuer || '–'}
              </div>
            </div>

            <div>
              <div className="text-xs text-slate-400 flex items-center gap-1 mb-1">
                <FileText className="w-3.5 h-3.5" />
                {t('documents.contract_num')}
              </div>
              <div className="font-semibold text-slate-800 dark:text-slate-200 font-mono text-xs truncate">
                {doc.contract_number || '–'}
              </div>
            </div>

            <div>
              <div className="text-xs text-slate-400 flex items-center gap-1 mb-1">
                <Calendar className="w-3.5 h-3.5" />
                Vystaveno
              </div>
              <div className="font-semibold text-slate-800 dark:text-slate-200">
                {formatDate(doc.document_date)}
              </div>
            </div>

            <div>
              <div className="text-xs text-slate-400 flex items-center gap-1 mb-1">
                <Calendar className="w-3.5 h-3.5" />
                Platnost do
              </div>
              <div className="font-semibold text-slate-800 dark:text-slate-200">
                {formatDate(doc.expiry_date)}
              </div>
            </div>

            <div>
              <div className="text-xs text-slate-400 flex items-center gap-1 mb-1">
                <Clock className="w-3.5 h-3.5" />
                Délka záruky
              </div>
              <div className="font-semibold text-slate-800 dark:text-slate-200">
                {doc.warranty_months ? `${doc.warranty_months} měsíců` : '–'}
              </div>
            </div>

            <div>
              <div className="text-xs text-slate-400 flex items-center gap-1 mb-1">
                {t('documents.amount')}
              </div>
              <div className="font-semibold text-slate-800 dark:text-slate-200">
                {doc.amount ? `${doc.amount.toLocaleString('cs-CZ')} Kč` : '–'}
              </div>
            </div>
          </div>

          {/* Physical Location Card */}
          <div className="p-3.5 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40 flex items-start gap-3">
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex-shrink-0">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                {t('documents.physical_location')}
              </div>
              <div className="text-sm font-medium text-slate-800 dark:text-slate-200 mt-0.5">
                {doc.physical_location || 'Pouze v digitální podobě (nemá papírový originál)'}
              </div>
            </div>
          </div>

          {/* AI Summary */}
          {doc.summary && (
            <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-50/60 to-purple-50/60 dark:from-indigo-950/30 dark:to-purple-950/30 border border-indigo-100 dark:border-indigo-900/40">
              <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-1.5">
                <Sparkles className="w-4 h-4 text-indigo-500" />
                {t('documents.summary_label')}
              </div>
              <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                {doc.summary}
              </p>
            </div>
          )}

          {/* Tags */}
          {doc.tags && (
            <div className="flex items-center gap-2 flex-wrap">
              <Tag className="w-3.5 h-3.5 text-slate-400" />
              {doc.tags.split(',').map((tag, idx) => (
                <span
                  key={idx}
                  className="text-xs px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                >
                  #{tag.trim()}
                </span>
              ))}
            </div>
          )}

          {/* Attached File Preview / Download */}
          <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                <FileText className="w-6 h-6" />
              </div>
              <div className="truncate">
                <div className="text-sm font-medium text-slate-900 dark:text-white truncate">
                  {doc.file_name}
                </div>
                <div className="text-xs text-slate-400">
                  {formatBytes(doc.file_size)} • {doc.file_type || 'soubor'}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <a
                href={fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                {t('documents.view_file')}
              </a>
              <a
                href={fileUrl}
                download={doc.file_name}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
              >
                <Download className="w-3.5 h-3.5" />
                {t('documents.download_file')}
              </a>
            </div>
          </div>

          {/* OCR Full-text Accordion */}
          {doc.ocr_fulltext && (
            <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
              <button
                type="button"
                onClick={() => setShowOcr(!showOcr)}
                className="w-full flex items-center justify-between p-3.5 text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition"
              >
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-indigo-500" />
                  <span>Rozpoznaný text dokumentu (Gemini OCR)</span>
                </div>
                <span className="text-slate-400">{showOcr ? 'Skrýt' : 'Rozbalit'}</span>
              </button>
              {showOcr && (
                <div className="p-4 bg-slate-900 text-slate-200 font-mono text-xs max-h-48 overflow-y-auto whitespace-pre-wrap relative">
                  <button
                    onClick={handleCopyOcr}
                    className="absolute top-2 right-2 p-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 transition"
                    title="Kopírovat text"
                  >
                    {copiedOcr ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                  {doc.ocr_fulltext}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-4 mt-4 border-t border-slate-100 dark:border-slate-800">
          {onDelete && (
            confirmDelete ? (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={handleDelete}
                  className="px-3 py-1.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition"
                >
                  {isDeleting ? 'Mažu...' : 'Opravdu smazat?'}
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmDelete(false)}
                  className="px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
                >
                  Zrušit
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition"
              >
                <Trash2 className="w-4 h-4" />
                Smazat dokument
              </button>
            )
          )}

          <button
            type="button"
            onClick={onClose}
            className="ml-auto px-5 py-2 text-sm font-semibold rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
          >
            Zavřít
          </button>
        </div>
      </div>
    </div>
  );
};
