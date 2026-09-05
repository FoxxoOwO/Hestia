import React, { useState, useEffect, useCallback } from 'react';
import {
  FolderArchive, UploadCloud, Lock, Unlock, Search,
  AlertTriangle, ShieldAlert, CheckCircle2, Clock,
  Grid, List, FileText, ExternalLink, MapPin, Eye,
  Building2, Sparkles, Filter, RefreshCw, X, ShieldCheck
} from 'lucide-react';
import { api } from '../services/api';
import {
  DocumentItem, DocumentCategory, DocumentStatus, DocumentStats
} from '../types';
import { DOCUMENT_CATEGORIES, DocumentUploadModal } from '../components/DocumentUploadModal';
import { VaultPinModal } from '../components/VaultPinModal';
import { DocumentDetailModal } from '../components/DocumentDetailModal';
import { useTranslation } from '../i18n';

export const DocumentsPage: React.FC = () => {
  const { t } = useTranslation();

  // Data state
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [stats, setStats] = useState<DocumentStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter state
  const [selectedCategory, setSelectedCategory] = useState<DocumentCategory | 'all'>('all');
  const [selectedStatus, setSelectedStatus] = useState<DocumentStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Vault state
  const [isVaultUnlocked, setIsVaultUnlocked] = useState(false);
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);

  // Modal state
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<DocumentItem | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  const fetchStats = async () => {
    try {
      const s = await api.getDocumentStats();
      setStats(s);
    } catch (e) {
      console.error('Error fetching document stats:', e);
    }
  };

  const fetchDocuments = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await api.getDocuments({
        category: selectedCategory === 'all' ? undefined : selectedCategory,
        status: selectedStatus === 'all' ? undefined : selectedStatus,
        search: searchQuery.trim() || undefined,
        vault_unlocked: isVaultUnlocked
      });
      setDocuments(data);
    } catch (e: any) {
      console.error('Error fetching documents:', e);
      setError(e.message || 'Nepodařilo se načíst dokumenty.');
    } finally {
      setIsLoading(false);
    }
  }, [selectedCategory, selectedStatus, searchQuery, isVaultUnlocked]);

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchDocuments();
    }, 250);
    return () => clearTimeout(timer);
  }, [fetchDocuments]);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  const handleDeleteDocument = async (id: number) => {
    try {
      await api.deleteDocument(id);
      showNotification('Dokument byl úspěšně smazán');
      fetchDocuments();
      fetchStats();
    } catch (err: any) {
      console.error('Error deleting document:', err);
      alert(err.message || 'Nepodařilo se smazat dokument');
    }
  };

  const handleVaultToggle = () => {
    if (isVaultUnlocked) {
      setIsVaultUnlocked(false);
      showNotification('Trezor byl uzamčen');
    } else {
      setIsPinModalOpen(true);
    }
  };

  const handleVaultPinSuccess = () => {
    setIsVaultUnlocked(true);
    showNotification('Trezor byl úspěšně odemčen');
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

  const formatBytes = (bytes?: number) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Notification Toast */}
      {notification && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-2 px-4 py-3 bg-emerald-600 text-white rounded-2xl shadow-xl animate-bounce text-sm font-medium">
          <CheckCircle2 className="w-5 h-5" />
          <span>{notification}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2.5 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <FolderArchive className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                {t('documents.title')}
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {t('documents.subtitle')}
              </p>
            </div>
          </div>
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Vault Lock / Unlock Button */}
          <button
            onClick={handleVaultToggle}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition shadow-sm border ${
              isVaultUnlocked
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20'
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            {isVaultUnlocked ? (
              <>
                <Unlock className="w-4 h-4 text-amber-500" />
                <span>{t('documents.vault_btn_unlocked')}</span>
              </>
            ) : (
              <>
                <Lock className="w-4 h-4 text-slate-400" />
                <span>{t('documents.vault_btn_locked')}</span>
              </>
            )}
          </button>

          {/* Upload Document Button */}
          <button
            onClick={() => setIsUploadModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold text-sm transition shadow-lg shadow-indigo-500/20"
          >
            <UploadCloud className="w-4 h-4" />
            <span>{t('documents.upload_btn')}</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total Documents */}
        <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-sm flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
            <FolderArchive className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">
              {stats?.total_documents ?? '–'}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              {t('documents.kpi_total')}
            </div>
          </div>
        </div>

        {/* Expiring Soon */}
        <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-sm flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
              {stats?.expiring_soon_count ?? 0}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              {t('documents.kpi_expiring')}
            </div>
          </div>
        </div>

        {/* Expired */}
        <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-sm flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-rose-600 dark:text-rose-400">
              {stats?.expired_count ?? 0}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              {t('documents.kpi_expired')}
            </div>
          </div>
        </div>

        {/* In Vault */}
        <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-sm flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
            <Lock className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {stats?.vault_count ?? 0}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              {t('documents.kpi_vault')}
            </div>
          </div>
        </div>
      </div>

      {/* Category Tabs (Binders) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
        <button
          onClick={() => setSelectedCategory('all')}
          className={`px-4 py-2 rounded-2xl font-semibold text-xs whitespace-nowrap transition flex items-center gap-2 border ${
            selectedCategory === 'all'
              ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-500/20'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <span>🗂️</span>
          <span>{t('documents.filter_all')}</span>
          <span className={`text-[11px] px-1.5 py-0.2 rounded-full ${
            selectedCategory === 'all' ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
          }`}>
            {stats?.total_documents ?? 0}
          </span>
        </button>

        {DOCUMENT_CATEGORIES.map(cat => {
          const count = stats?.categories?.[cat.id] ?? 0;
          const isSelected = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-2 rounded-2xl font-semibold text-xs whitespace-nowrap transition flex items-center gap-2 border ${
                isSelected
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-500/20'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <span>{cat.icon}</span>
              <span>{cat.nameCs}</span>
              {count > 0 && (
                <span className={`text-[11px] px-1.5 py-0.2 rounded-full ${
                  isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                }`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-3 p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
        {/* Status Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto">
          {(
            [
              { id: 'all', label: 'Všechny stavy' },
              { id: 'active', label: t('documents.filter_active') },
              { id: 'expiring_soon', label: t('documents.filter_expiring_soon') },
              { id: 'expired', label: t('documents.filter_expired') },
              { id: 'permanent', label: t('documents.filter_permanent') },
            ] as const
          ).map(st => (
            <button
              key={st.id}
              onClick={() => setSelectedStatus(st.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition ${
                selectedStatus === st.id
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {st.label}
            </button>
          ))}
        </div>

        {/* Right: Search & View Mode */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder={t('documents.search_placeholder')}
              className="w-full pl-9 pr-8 py-1.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Grid / Table Toggle */}
          <div className="flex items-center border border-slate-200 dark:border-slate-800 rounded-xl p-0.5 bg-slate-50 dark:bg-slate-800/40">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition ${
                viewMode === 'grid'
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
              }`}
              title="Mřížka"
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg transition ${
                viewMode === 'table'
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
              }`}
              title="Tabulka"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Content Area */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin mb-3" />
          <p className="text-sm text-slate-500">{t('common.loading')}</p>
        </div>
      ) : error ? (
        <div className="p-6 rounded-3xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-center">
          <p className="font-semibold">{error}</p>
          <button
            onClick={() => fetchDocuments()}
            className="mt-3 px-4 py-1.5 bg-rose-600 text-white rounded-xl text-xs font-semibold hover:bg-rose-700 transition"
          >
            Zkusit znovu
          </button>
        </div>
      ) : documents.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-4 text-3xl">
            🗃️
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
            {t('documents.no_documents')}
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-6">
            Nahrajte PDF fakturu, vyfocený záruční list, revizní zprávu nebo smlouvu. Gemini AI automaticky vytěží všechny údaje.
          </p>
          <button
            onClick={() => setIsUploadModalOpen(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-semibold text-sm transition shadow-lg shadow-indigo-500/20"
          >
            <UploadCloud className="w-4 h-4" />
            <span>{t('documents.upload_btn')}</span>
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        /* Grid Cards View */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {documents.map(doc => {
            const catInfo = DOCUMENT_CATEGORIES.find(c => c.id === doc.category) || {
              id: doc.category,
              icon: '📁',
              nameCs: doc.category
            };

            return (
              <div
                key={doc.id}
                onClick={() => setSelectedDoc(doc)}
                className="group relative p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800/90 hover:border-indigo-500/50 hover:shadow-xl transition-all cursor-pointer flex flex-col justify-between"
              >
                <div>
                  {/* Top Bar: Icon, Category, Badges */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2.5">
                      <span className="text-2xl p-2 rounded-xl bg-slate-100 dark:bg-slate-800 group-hover:scale-110 transition-transform">
                        {catInfo.icon}
                      </span>
                      <div>
                        <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block">
                          {catInfo.nameCs}
                        </span>
                        <h3 className="font-bold text-slate-900 dark:text-white text-base line-clamp-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                          {doc.title}
                        </h3>
                      </div>
                    </div>

                    {doc.is_vault_protected && (
                      <span
                        title="V rodinném trezoru (chráněno PINem)"
                        className="p-1.5 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 flex-shrink-0"
                      >
                        <Lock className="w-3.5 h-3.5" />
                      </span>
                    )}
                  </div>

                  {/* Issuer & Contract Number */}
                  <div className="space-y-1 mb-3 text-xs text-slate-600 dark:text-slate-400">
                    {doc.issuer && (
                      <div className="flex items-center gap-1.5 truncate">
                        <Building2 className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                        <span className="truncate">{doc.issuer}</span>
                      </div>
                    )}
                    {doc.contract_number && (
                      <div className="flex items-center gap-1.5 truncate font-mono text-[11px] text-slate-500">
                        <FileText className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                        <span className="truncate">SN/Č: {doc.contract_number}</span>
                      </div>
                    )}
                  </div>

                  {/* Physical Location Badge */}
                  {doc.physical_location && (
                    <div className="flex items-center gap-1.5 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800/80 text-xs text-slate-700 dark:text-slate-300 mb-3">
                      <MapPin className="w-3.5 h-3.5 text-indigo-500 flex-shrink-0" />
                      <span className="truncate">{doc.physical_location}</span>
                    </div>
                  )}

                  {/* AI Summary Snippet */}
                  {doc.summary && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mb-3 italic">
                      "{doc.summary}"
                    </p>
                  )}
                </div>

                {/* Bottom Bar: Expiry status & File link */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2 mt-auto">
                  {/* Status Indicator */}
                  <div>
                    {doc.status === 'expiring_soon' && (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400">
                        <AlertTriangle className="w-3 h-3" />
                        {doc.days_until_expiry !== null && `Zbývá ${doc.days_until_expiry} dní`}
                      </span>
                    )}
                    {doc.status === 'expired' && (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400">
                        <ShieldAlert className="w-3 h-3" />
                        Vypršelo
                      </span>
                    )}
                    {doc.status === 'active' && doc.expiry_date && (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 className="w-3 h-3" />
                        {doc.days_until_expiry !== null ? `Záruka ještě ${doc.days_until_expiry} d.` : 'Platný'}
                      </span>
                    )}
                    {doc.status === 'permanent' && (
                      <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500">
                        <Clock className="w-3 h-3" />
                        Trvalé
                      </span>
                    )}
                  </div>

                  {/* Amount or Open Button */}
                  <div className="flex items-center gap-2">
                    {doc.amount ? (
                      <span className="text-xs font-bold text-slate-900 dark:text-white">
                        {doc.amount.toLocaleString('cs-CZ')} Kč
                      </span>
                    ) : null}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedDoc(doc);
                      }}
                      className="p-1.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
                      title="Podrobnosti"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Table View */
        <div className="overflow-x-auto rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 text-xs uppercase border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-5 py-3.5">Dokument</th>
                <th className="px-4 py-3.5">Vystavitel / Číslo</th>
                <th className="px-4 py-3.5">Stav / Expirace</th>
                <th className="px-4 py-3.5">Částka</th>
                <th className="px-4 py-3.5">Kde leží originál</th>
                <th className="px-4 py-3.5 text-right">Akce</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
              {documents.map(doc => {
                const catInfo = DOCUMENT_CATEGORIES.find(c => c.id === doc.category) || {
                  id: doc.category,
                  icon: '📁',
                  nameCs: doc.category
                };

                return (
                  <tr
                    key={doc.id}
                    onClick={() => setSelectedDoc(doc)}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 cursor-pointer transition"
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{catInfo.icon}</span>
                        <div>
                          <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                            {doc.title}
                            {doc.is_vault_protected && (
                              <Lock className="w-3 h-3 text-purple-500" />
                            )}
                          </div>
                          <div className="text-xs text-slate-400">
                            {catInfo.nameCs}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3.5">
                      <div className="text-xs font-medium text-slate-800 dark:text-slate-200">
                        {doc.issuer || '–'}
                      </div>
                      {doc.contract_number && (
                        <div className="font-mono text-[11px] text-slate-400">
                          {doc.contract_number}
                        </div>
                      )}
                    </td>

                    <td className="px-4 py-3.5">
                      {doc.status === 'expiring_soon' && (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400">
                          <AlertTriangle className="w-3 h-3" />
                          Zbývá {doc.days_until_expiry} dní
                        </span>
                      )}
                      {doc.status === 'expired' && (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400">
                          <ShieldAlert className="w-3 h-3" />
                          Vypršelo
                        </span>
                      )}
                      {doc.status === 'active' && doc.expiry_date && (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                          <CheckCircle2 className="w-3 h-3" />
                          do {formatDate(doc.expiry_date)}
                        </span>
                      )}
                      {doc.status === 'permanent' && (
                        <span className="text-xs text-slate-400">
                          Trvalé
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-3.5 font-medium text-xs">
                      {doc.amount ? `${doc.amount.toLocaleString('cs-CZ')} Kč` : '–'}
                    </td>

                    <td className="px-4 py-3.5 text-xs text-slate-600 dark:text-slate-400">
                      {doc.physical_location ? (
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-indigo-500 flex-shrink-0" />
                          <span className="truncate max-w-[200px]">{doc.physical_location}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">Digitální</span>
                      )}
                    </td>

                    <td className="px-4 py-3.5 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedDoc(doc);
                        }}
                        className="p-1.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Upload Modal */}
      <DocumentUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onSaveSuccess={() => {
          setIsUploadModalOpen(false);
          showNotification('Dokument byl úspěšně uložen do archivu');
          fetchDocuments();
          fetchStats();
        }}
      />

      {/* Vault PIN Modal */}
      <VaultPinModal
        isOpen={isPinModalOpen}
        onClose={() => setIsPinModalOpen(false)}
        onSuccess={handleVaultPinSuccess}
      />

      {/* Document Detail Modal */}
      <DocumentDetailModal
        isOpen={!!selectedDoc}
        document={selectedDoc}
        onClose={() => setSelectedDoc(null)}
        onDelete={handleDeleteDocument}
      />
    </div>
  );
};
export default DocumentsPage;
