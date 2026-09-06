import React, { useState, useEffect } from 'react';
import {
  Settings, Users, Globe, Moon, Sun, Monitor,
  Sparkles, Check, AlertCircle, Plus, Shield, UserPlus, X, Palette,
  Pencil, Trash2, AlertTriangle, Download, Upload, Database, HardDrive,
  RefreshCw, FileDown, FileUp, FileJson
} from 'lucide-react';
import { api } from '../services/api';
import { User, ServerBackup } from '../types';
import { useTranslation } from '../i18n';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

export const SettingsPage: React.FC = () => {
  const { t, language, setLanguage } = useTranslation();
  const { theme, setTheme, designStyle, setDesignStyle, designOptions, activeDesign } = useTheme();
  const { user } = useAuth();

  const [members, setMembers] = useState<User[]>([]);
  const [aiStatus, setAiStatus] = useState<{ gemini_configured: boolean; model: string } | null>(null);

  // New member modal
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newDisplayName, setNewDisplayName] = useState('');
  const [newPassword, setNewPassword] = useState('hestia123');
  const [newRole, setNewRole] = useState<'admin' | 'member'>('member');
  const [newAvatarColor, setNewAvatarColor] = useState('#f97316');

  // Edit member modal
  const [editingMember, setEditingMember] = useState<User | null>(null);
  const [editUsername, setEditUsername] = useState('');
  const [editDisplayName, setEditDisplayName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [editRole, setEditRole] = useState<'admin' | 'member'>('member');
  const [editAvatarColor, setEditAvatarColor] = useState('#f97316');
  const [editError, setEditError] = useState<string | null>(null);

  // Delete member modal
  const [deletingMember, setDeletingMember] = useState<User | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Reset all data modal
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [resetConfirmText, setResetConfirmText] = useState('');
  const [resetPassword, setResetPassword] = useState('');
  const [isResetting, setIsResetting] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);
  const [resetSuccess, setResetSuccess] = useState<string | null>(null);

  // Backups, Export & Import states
  const [backups, setBackups] = useState<ServerBackup[]>([]);
  const [loadingBackups, setLoadingBackups] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Import modal
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importMode, setImportMode] = useState<'merge' | 'replace'>('merge');
  const [isImporting, setIsImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState<string | null>(null);

  // Create snapshot modal
  const [isCreateBackupOpen, setIsCreateBackupOpen] = useState(false);
  const [backupNote, setBackupNote] = useState('');
  const [isCreatingBackup, setIsCreatingBackup] = useState(false);
  const [backupError, setBackupError] = useState<string | null>(null);
  const [backupSuccess, setBackupSuccess] = useState<string | null>(null);

  // Restore snapshot modal
  const [restoringBackup, setRestoringBackup] = useState<ServerBackup | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);
  const [restoreError, setRestoreError] = useState<string | null>(null);
  const [restoreSuccess, setRestoreSuccess] = useState<string | null>(null);

  // Delete snapshot modal
  const [deletingBackup, setDeletingBackup] = useState<ServerBackup | null>(null);
  const [isDeletingBackup, setIsDeletingBackup] = useState(false);

  const handleResetAllData = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanConfirm = resetConfirmText.trim().toUpperCase();
    if (cleanConfirm !== 'SMAZAT' && cleanConfirm !== 'CONFIRM') {
      setResetError('Musíte zadat text "SMAZAT" pro potvrzení.');
      return;
    }

    try {
      setIsResetting(true);
      setResetError(null);
      const res = await api.resetAllData(resetConfirmText.trim(), resetPassword.trim() || undefined);
      setResetSuccess(res.message || t('settings.reset_data_success'));
      setTimeout(() => {
        setIsResetModalOpen(false);
        setIsResetting(false);
        fetchSettingsData();
        window.location.reload();
      }, 1500);
    } catch (err: any) {
      setIsResetting(false);
      setResetError(err.message || 'Chyba při resetování databáze');
    }
  };

  const fetchSettingsData = async () => {
    try {
      const [membersData, statusData] = await Promise.all([
        api.getUsers(),
        api.getAiStatus().catch(() => null),
      ]);
      setMembers(membersData);
      setAiStatus(statusData);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchBackups = async () => {
    if (user?.role !== 'admin') return;
    try {
      setLoadingBackups(true);
      const data = await api.getBackups();
      setBackups(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingBackups(false);
    }
  };

  useEffect(() => {
    fetchSettingsData();
    if (user?.role === 'admin') {
      fetchBackups();
    }
  }, [user?.role]);

  const handleExportData = async () => {
    try {
      setIsExporting(true);
      const blob = await api.exportData();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const now = new Date();
      const pad = (n: number) => n.toString().padStart(2, '0');
      const timestamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
      a.download = `hestia_backup_${timestamp}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      alert(err.message || 'Chyba při exportu dat');
    } finally {
      setIsExporting(false);
    }
  };

  const handleDownloadBackup = async (b: ServerBackup) => {
    try {
      const blob = await api.downloadBackup(b.filename);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = b.filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      alert(err.message || 'Chyba při stahování zálohy');
    }
  };

  const handleImportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!importFile) return;
    try {
      setIsImporting(true);
      setImportError(null);
      setImportSuccess(null);
      const res = await api.importData(importFile, importMode);
      setImportSuccess(`${t('settings.import_success')} (${res.total_imported} položek)`);
      setTimeout(() => {
        setIsImportModalOpen(false);
        setIsImporting(false);
        setImportFile(null);
        fetchSettingsData();
        fetchBackups();
        if (importMode === 'replace') {
          window.location.reload();
        }
      }, 1500);
    } catch (err: any) {
      setIsImporting(false);
      setImportError(err.message || 'Chyba při importu souboru');
    }
  };

  const handleCreateSnapshot = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsCreatingBackup(true);
      setBackupError(null);
      await api.createBackup(backupNote.trim() || undefined);
      setBackupSuccess('Záloha byla úspěšně vytvořena.');
      setBackupNote('');
      fetchBackups();
      setTimeout(() => {
        setIsCreateBackupOpen(false);
        setBackupSuccess(null);
      }, 1000);
    } catch (err: any) {
      setBackupError(err.message || 'Chyba při vytváření zálohy');
    } finally {
      setIsCreatingBackup(false);
    }
  };

  const handleRestoreSnapshot = async () => {
    if (!restoringBackup) return;
    try {
      setIsRestoring(true);
      setRestoreError(null);
      await api.restoreBackup(restoringBackup.filename);
      setRestoreSuccess(t('settings.restore_success'));
      setTimeout(() => {
        setRestoringBackup(null);
        setIsRestoring(false);
        window.location.reload();
      }, 1500);
    } catch (err: any) {
      setIsRestoring(false);
      setRestoreError(err.message || 'Chyba při obnově systému ze zálohy');
    }
  };

  const handleDeleteSnapshot = async () => {
    if (!deletingBackup) return;
    try {
      setIsDeletingBackup(true);
      await api.deleteBackup(deletingBackup.filename);
      setDeletingBackup(null);
      fetchBackups();
    } catch (err: any) {
      alert(err.message || 'Chyba při mazání zálohy');
    } finally {
      setIsDeletingBackup(false);
    }
  };


  const handleCreateMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername.trim() || !newDisplayName.trim()) return;

    try {
      const token = localStorage.getItem('hestia_token');
      const res = await fetch('/api/v1/auth/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          username: newUsername.trim(),
          display_name: newDisplayName.trim(),
          password: newPassword,
          role: newRole,
          avatar_color: newAvatarColor,
          preferred_language: language,
          preferred_theme: theme,
        }),
      });
      if (res.ok) {
        setIsAddMemberOpen(false);
        setNewUsername('');
        setNewDisplayName('');
        fetchSettingsData();
      } else {
        const err = await res.json();
        alert(err.detail || 'Chyba při vytváření člena');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const openEditMember = (m: User) => {
    setEditingMember(m);
    setEditUsername(m.username);
    setEditDisplayName(m.display_name);
    setEditEmail(m.email || '');
    setEditRole((m.role as 'admin' | 'member') || 'member');
    setEditAvatarColor(m.avatar_color || '#f97316');
    setEditPassword('');
    setEditError(null);
  };

  const handleUpdateMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMember) return;
    if (!editUsername.trim() || !editDisplayName.trim()) return;

    try {
      const payload: any = {
        username: editUsername.trim(),
        display_name: editDisplayName.trim(),
        email: editEmail.trim() || undefined,
        role: editRole,
        avatar_color: editAvatarColor,
      };
      if (editPassword.trim()) {
        payload.password = editPassword.trim();
      }

      await api.updateUser(editingMember.id, payload);
      setEditingMember(null);
      fetchSettingsData();
    } catch (err: any) {
      setEditError(err.message || 'Chyba při úpravě člena');
    }
  };

  const handleDeleteMember = async () => {
    if (!deletingMember) return;
    try {
      await api.deleteUser(deletingMember.id);
      setDeletingMember(null);
      fetchSettingsData();
    } catch (err: any) {
      setDeleteError(err.message || 'Chyba při mazání člena');
    }
  };

  const avatarColors = [
    '#f97316', '#ef4444', '#ec4899', '#8b5cf6',
    '#3b82f6', '#06b6d4', '#10b981', '#84cc16'
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-24">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-100">
          {t('settings.title')}
        </h1>
        <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1">
          {t('settings.subtitle')}
        </p>
      </div>

      {/* Household Members */}
      <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-orange-100 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400">
              <Users className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
              {t('settings.members_title')}
            </h3>
          </div>
          {user?.role === 'admin' && (
            <button
              onClick={() => setIsAddMemberOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-orange-500 hover:bg-orange-600 text-white transition"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>{t('settings.add_member')}</span>
            </button>
          )}
        </div>

        <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
          {members.map((m) => (
            <div key={m.id} className="py-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-sm"
                  style={{ backgroundColor: m.avatar_color || '#f97316' }}
                >
                  {m.display_name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h4 className="font-bold text-sm text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                    {m.display_name}
                    {m.id === user?.id && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-orange-100 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 font-bold">
                        Vy
                      </span>
                    )}
                  </h4>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    @{m.username} • {m.role === 'admin' ? 'Správce' : 'Člen'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-medium px-2.5 py-1 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300">
                  {m.role === 'admin' ? 'Správce' : 'Člen'}
                </span>

                {/* Edit button */}
                {(user?.role === 'admin' || user?.id === m.id) && (
                  <button
                    onClick={() => openEditMember(m)}
                    title={t('settings.edit_member')}
                    className="p-1.5 rounded-xl text-zinc-400 hover:text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-950/40 transition"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                )}

                {/* Delete button */}
                {user?.role === 'admin' && (
                  m.id === user.id ? (
                    <span
                      title={t('settings.cannot_delete_self')}
                      className="p-1.5 text-zinc-300 dark:text-zinc-700 cursor-not-allowed"
                    >
                      <Trash2 className="w-4 h-4" />
                    </span>
                  ) : (
                    <button
                      onClick={() => {
                        setDeletingMember(m);
                        setDeleteError(null);
                      }}
                      title={t('settings.delete_member')}
                      className="p-1.5 rounded-xl text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Language & Appearance */}
      <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-6">
        <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
          Lokalizace a vzhled
        </h3>

        {/* Language Selection */}
        <div>
          <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
            {t('settings.language')}
          </label>
          <div className="grid grid-cols-2 gap-3 max-w-sm">
            <button
              onClick={() => setLanguage('cs')}
              className={`p-3 rounded-2xl border text-xs font-bold flex items-center gap-2.5 transition ${
                language === 'cs'
                  ? 'border-orange-500 bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400'
                  : 'border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400'
              }`}
            >
              <span className="text-base">🇨🇿</span>
              <span>Čeština</span>
            </button>
            <button
              onClick={() => setLanguage('en')}
              className={`p-3 rounded-2xl border text-xs font-bold flex items-center gap-2.5 transition ${
                language === 'en'
                  ? 'border-orange-500 bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400'
                  : 'border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400'
              }`}
            >
              <span className="text-base">🇬🇧</span>
              <span>English</span>
            </button>
          </div>
        </div>

        {/* Theme Selection */}
        <div>
          <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
            {t('settings.theme')}
          </label>
          <div className="grid grid-cols-3 gap-3 max-w-md">
            <button
              onClick={() => setTheme('light')}
              className={`p-3 rounded-2xl border text-xs font-bold flex flex-col items-center gap-1.5 transition ${
                theme === 'light'
                  ? 'border-orange-500 bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400'
                  : 'border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400'
              }`}
            >
              <Sun className="w-4 h-4" />
              <span>{t('settings.theme_light')}</span>
            </button>
            <button
              onClick={() => setTheme('dark')}
              className={`p-3 rounded-2xl border text-xs font-bold flex flex-col items-center gap-1.5 transition ${
                theme === 'dark'
                  ? 'border-orange-500 bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400'
                  : 'border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400'
              }`}
            >
              <Moon className="w-4 h-4" />
              <span>{t('settings.theme_dark')}</span>
            </button>
            <button
              onClick={() => setTheme('system')}
              className={`p-3 rounded-2xl border text-xs font-bold flex flex-col items-center gap-1.5 transition ${
                theme === 'system'
                  ? 'border-orange-500 bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400'
                  : 'border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400'
              }`}
            >
              <Monitor className="w-4 h-4" />
              <span>{t('settings.theme_system')}</span>
            </button>
          </div>
        </div>

        {/* Design Theme Selection (Alternative Designs) */}
        <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800/80 space-y-3">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5 text-orange-500" />
                <span>{t('settings.design_style')}</span>
              </label>
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-orange-100 dark:bg-orange-950/60 text-orange-700 dark:text-orange-300 flex items-center gap-1.5">
                <span
                  className="w-2 h-2 rounded-full inline-block"
                  style={{ backgroundColor: activeDesign.primaryColor }}
                />
                {language === 'cs' ? activeDesign.name : activeDesign.nameEn}
              </span>
            </div>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
              {t('settings.design_style_desc')}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            {designOptions.map((opt) => {
              const isSelected = designStyle === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setDesignStyle(opt.id)}
                  className={`p-3.5 rounded-2xl border text-left transition-all relative overflow-hidden flex flex-col justify-between ${
                    isSelected
                      ? 'border-orange-500 bg-orange-50/70 dark:bg-orange-950/30 ring-2 ring-orange-500/30 shadow-md'
                      : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/40'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3.5 h-3.5 rounded-full shadow-sm ring-1 ring-black/10"
                          style={{ backgroundColor: opt.primaryColor }}
                        />
                        <span className="font-bold text-xs text-zinc-900 dark:text-zinc-100">
                          {language === 'cs' ? opt.name : opt.nameEn}
                        </span>
                      </div>
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                          isSelected
                            ? 'bg-orange-500 text-white'
                            : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300'
                        }`}
                      >
                        {language === 'cs' ? opt.badge : opt.badgeEn}
                      </span>
                    </div>

                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400 line-clamp-2 leading-relaxed mb-2">
                      {language === 'cs' ? opt.description : opt.descriptionEn}
                    </p>

                    {/* Font, Shape & Layout tags */}
                    {(opt.fontCategory || opt.shapeStyle) && (
                      <div className="flex flex-wrap gap-1 mb-2.5">
                        {opt.fontCategory && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 font-mono">
                            🔤 {language === 'cs' ? opt.fontCategory : (opt.fontCategoryEn || opt.fontCategory)}
                          </span>
                        )}
                        {opt.shapeStyle && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300">
                            📐 {language === 'cs' ? opt.shapeStyle : (opt.shapeStyleEn || opt.shapeStyle)}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-zinc-200/60 dark:border-zinc-700/60 mt-auto">
                    {/* Swatch dots */}
                    <div className="flex items-center gap-1.5">
                      {opt.previewColors.map((c, i) => (
                        <div
                          key={i}
                          className="w-3.5 h-3.5 rounded-full border border-black/10 dark:border-white/10 shadow-xs"
                          style={{ backgroundColor: c }}
                        />
                      ))}
                    </div>

                    {isSelected ? (
                      <span className="flex items-center gap-1 text-[11px] font-bold text-orange-600 dark:text-orange-400">
                        <Check className="w-3.5 h-3.5" />
                        <span>Aktivní</span>
                      </span>
                    ) : (
                      <span className="text-[11px] text-zinc-400 font-medium hover:text-zinc-600 dark:hover:text-zinc-200">
                        Aktivovat
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Live preview showcase widget */}
          <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/80 dark:border-zinc-800 space-y-3 text-xs mt-3">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-200/60 dark:border-zinc-700/60 pb-2">
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: activeDesign.primaryColor }}
                />
                <span className="font-semibold text-zinc-700 dark:text-zinc-300">
                  {t('settings.design_preview_title')}:
                </span>
                <span className="font-bold text-orange-600 dark:text-orange-400 text-sm">
                  {language === 'cs' ? activeDesign.name : activeDesign.nameEn}
                </span>
              </div>

              <div className="flex items-center gap-1.5 text-[11px] text-zinc-500 dark:text-zinc-400 font-medium">
                <span>{language === 'cs' ? activeDesign.layoutStyle : activeDesign.layoutStyleEn}</span>
              </div>
            </div>

            {/* Interactive UI Element Playground */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 items-center">
              {/* Sample Button */}
              <div>
                <label className="block text-[10px] text-zinc-400 uppercase font-semibold mb-1">
                  Tlačítko (Button Style)
                </label>
                <button
                  type="button"
                  className="w-full px-3 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-semibold text-xs transition shadow-sm flex items-center justify-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{t('settings.design_preview_btn')}</span>
                </button>
              </div>

              {/* Sample Badge & Tag */}
              <div>
                <label className="block text-[10px] text-zinc-400 uppercase font-semibold mb-1">
                  Štítek &amp; Stav (Badge)
                </label>
                <div className="flex items-center gap-1.5 py-1">
                  <span className="px-2.5 py-1 rounded-xl bg-orange-100 dark:bg-orange-950/60 text-orange-700 dark:text-orange-300 text-[11px] font-bold inline-flex items-center gap-1">
                    <Check className="w-3 h-3" />
                    {t('settings.design_preview_badge')}
                  </span>
                  <span className="px-2 py-0.5 rounded-lg border border-zinc-200 dark:border-zinc-700 text-[10px] text-zinc-500">
                    {activeDesign.badge}
                  </span>
                </div>
              </div>

              {/* Sample Input */}
              <div>
                <label className="block text-[10px] text-zinc-400 uppercase font-semibold mb-1">
                  Formulářové pole (Input)
                </label>
                <input
                  type="text"
                  readOnly
                  value="Ukázkový text vstupu..."
                  className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Gemini AI Status */}
      <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-600 text-white shadow-md shadow-orange-500/20">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
              {t('settings.gemini_title')}
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              {t('settings.gemini_desc')}
            </p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/80 flex items-center justify-between text-xs">
          <div>
            <p className="font-semibold text-zinc-800 dark:text-zinc-200">
              Model: <span className="text-orange-600 dark:text-orange-400 font-mono font-bold">gemini-3.7-flash</span>
            </p>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
              Automaticky extrahuje ingredience, časy, náročnost a kroky vaření z webu i volného textu.
            </p>
          </div>

          <div>
            {aiStatus?.gemini_configured ? (
              <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold">
                <Check className="w-3.5 h-3.5" /> Aktivní
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 font-bold" title="Nastavte GEMINI_API_KEY v .env souboru">
                <AlertCircle className="w-3.5 h-3.5" /> Konfigurujte v .env
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Backups & Data Management (Admin only) */}
      {user?.role === 'admin' && (
        <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                  {t('settings.backups_title')}
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  {t('settings.backups_desc')}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setIsCreateBackupOpen(true);
                setBackupNote('');
                setBackupError(null);
                setBackupSuccess(null);
              }}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition shadow-sm self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              <span>{t('settings.create_snapshot_btn')}</span>
            </button>
          </div>

          {/* 2 Cards: Export & Import */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Export Card */}
            <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/80 dark:border-zinc-700/80 flex flex-col justify-between gap-3">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-zinc-900 dark:text-zinc-100 font-bold text-xs">
                  <Download className="w-4 h-4 text-blue-500" />
                  <span>{t('settings.export_card_title')}</span>
                </div>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
                  {t('settings.export_card_desc')}
                </p>
              </div>
              <button
                type="button"
                onClick={handleExportData}
                disabled={isExporting}
                className="inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl bg-white dark:bg-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-600 text-zinc-800 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-600 font-semibold text-xs transition shadow-xs"
              >
                {isExporting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-500" />
                    <span>{t('settings.exporting')}</span>
                  </>
                ) : (
                  <>
                    <FileDown className="w-3.5 h-3.5 text-blue-500" />
                    <span>{t('settings.export_btn')}</span>
                  </>
                )}
              </button>
            </div>

            {/* Import Card */}
            <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/80 dark:border-zinc-700/80 flex flex-col justify-between gap-3">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-zinc-900 dark:text-zinc-100 font-bold text-xs">
                  <Upload className="w-4 h-4 text-emerald-500" />
                  <span>{t('settings.import_card_title')}</span>
                </div>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
                  {t('settings.import_card_desc')}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsImportModalOpen(true);
                  setImportFile(null);
                  setImportError(null);
                  setImportSuccess(null);
                }}
                className="inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl bg-white dark:bg-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-600 text-zinc-800 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-600 font-semibold text-xs transition shadow-xs"
              >
                <FileUp className="w-3.5 h-3.5 text-emerald-500" />
                <span>{t('settings.import_btn')}</span>
              </button>
            </div>
          </div>

          {/* Snapshots Table / List */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-xs text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                <HardDrive className="w-4 h-4 text-zinc-400" />
                <span>{t('settings.snapshots_title')}</span>
                <span className="ml-1 text-[11px] font-normal text-zinc-400">
                  ({backups.length})
                </span>
              </h4>
              <button
                type="button"
                onClick={fetchBackups}
                disabled={loadingBackups}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 text-xs p-1"
                title="Aktualizovat seznam"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingBackups ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {loadingBackups && backups.length === 0 ? (
              <div className="text-center py-6 text-xs text-zinc-400">
                {t('common.loading')}
              </div>
            ) : backups.length === 0 ? (
              <div className="p-6 rounded-2xl bg-zinc-50 dark:bg-zinc-800/40 border border-dashed border-zinc-200 dark:border-zinc-700/80 text-center text-xs text-zinc-500 dark:text-zinc-400">
                {t('settings.no_snapshots')}
              </div>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-zinc-200 dark:border-zinc-800">
                <table className="w-full text-left text-xs">
                  <thead className="bg-zinc-50 dark:bg-zinc-800/70 text-zinc-500 dark:text-zinc-400 font-semibold border-b border-zinc-200 dark:border-zinc-800">
                    <tr>
                      <th className="py-2.5 px-3.5">{t('settings.col_filename')}</th>
                      <th className="py-2.5 px-3">{t('settings.col_date')}</th>
                      <th className="py-2.5 px-3">{t('settings.col_items')}</th>
                      <th className="py-2.5 px-3">{t('settings.col_size')}</th>
                      <th className="py-2.5 px-3">{t('settings.col_note')}</th>
                      <th className="py-2.5 px-3.5 text-right">{t('settings.col_actions')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
                    {backups.map((b) => (
                      <tr key={b.filename} className="hover:bg-zinc-50/70 dark:hover:bg-zinc-800/40 transition-colors">
                        <td className="py-2.5 px-3.5 font-mono text-[11px] text-zinc-800 dark:text-zinc-200 font-medium">
                          {b.filename}
                        </td>
                        <td className="py-2.5 px-3 text-zinc-500 whitespace-nowrap">
                          {new Date(b.created_at).toLocaleString('cs-CZ', {
                            day: '2-digit', month: '2-digit', year: 'numeric',
                            hour: '2-digit', minute: '2-digit'
                          })}
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 font-semibold text-[11px]">
                            {b.total_items}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-zinc-500 font-mono text-[11px]">
                          {b.file_size_kb} kB
                        </td>
                        <td className="py-2.5 px-3 text-zinc-600 dark:text-zinc-300 max-w-[180px] truncate">
                          {b.note || <span className="text-zinc-300 dark:text-zinc-600">—</span>}
                        </td>
                        <td className="py-2.5 px-3.5 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleDownloadBackup(b)}
                              title={t('settings.btn_download')}
                              className="p-1.5 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 transition"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setRestoringBackup(b);
                                setRestoreError(null);
                                setRestoreSuccess(null);
                              }}
                              title={t('settings.btn_restore')}
                              className="p-1.5 rounded-lg hover:bg-amber-100 dark:hover:bg-amber-950/60 text-amber-600 dark:text-amber-400 transition"
                            >
                              <RefreshCw className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeletingBackup(b)}
                              title={t('settings.btn_delete')}
                              className="p-1.5 rounded-lg hover:bg-red-100 dark:hover:bg-red-950/60 text-red-600 dark:text-red-400 transition"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Danger Zone: Wipe / Factory Reset Data (Admin only) */}
      {user?.role === 'admin' && (
        <div className="p-6 rounded-3xl bg-red-50/40 dark:bg-red-950/20 border border-red-200/80 dark:border-red-900/50 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-red-600 text-white shadow-md shadow-red-500/20">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-red-950 dark:text-red-200">
                {t('settings.danger_zone_title')}
              </h3>
              <p className="text-xs text-red-800/70 dark:text-red-300/70">
                {t('settings.danger_zone_desc')}
              </p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-red-200 dark:border-red-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <h4 className="font-bold text-xs text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                <Trash2 className="w-3.5 h-3.5 text-red-500" />
                <span>{t('settings.reset_data_title')}</span>
              </h4>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 max-w-xl leading-relaxed">
                {t('settings.reset_data_desc')}
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setIsResetModalOpen(true);
                setResetError(null);
                setResetSuccess(null);
                setResetConfirmText('');
                setResetPassword('');
              }}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold text-xs transition shadow-sm shrink-0"
            >
              <Trash2 className="w-4 h-4" />
              <span>{t('settings.reset_data_btn')}</span>
            </button>
          </div>
        </div>
      )}

      {/* Add Member Modal */}
      {isAddMemberOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-zinc-900 w-full max-w-md rounded-3xl shadow-2xl border border-zinc-200 dark:border-zinc-800 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3">
              <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-100">
                Přidat člena domácnosti
              </h3>
              <button
                onClick={() => setIsAddMemberOpen(false)}
                className="p-1 text-zinc-400 hover:text-zinc-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateMember} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Uživatelské jméno (login) *
                </label>
                <input
                  type="text"
                  required
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  placeholder="např. tomas"
                  className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Zobrazované jméno *
                </label>
                <input
                  type="text"
                  required
                  value={newDisplayName}
                  onChange={(e) => setNewDisplayName(e.target.value)}
                  placeholder="např. Tomáš"
                  className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Výchozí heslo *
                </label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Role v domácnosti
                </label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 text-sm"
                >
                  <option value="member">Člen domácnosti</option>
                  <option value="admin">Správce (Admin)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                  Barva profilu
                </label>
                <div className="flex items-center gap-2">
                  {avatarColors.map((color) => (
                    <button
                      type="button"
                      key={color}
                      onClick={() => setNewAvatarColor(color)}
                      className={`w-7 h-7 rounded-full transition-transform ${
                        newAvatarColor === color ? 'scale-125 ring-2 ring-orange-500 ring-offset-2' : ''
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              <div className="pt-3 flex gap-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 px-4 rounded-xl font-semibold text-xs bg-orange-500 hover:bg-orange-600 text-white transition"
                >
                  Vytvořit člena
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddMemberOpen(false)}
                  className="py-2.5 px-4 rounded-xl font-semibold text-xs bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300"
                >
                  Zrušit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Member Modal */}
      {editingMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-zinc-900 w-full max-w-md rounded-3xl shadow-2xl border border-zinc-200 dark:border-zinc-800 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-white font-bold text-xs shadow-sm"
                  style={{ backgroundColor: editAvatarColor }}
                >
                  {editDisplayName.charAt(0).toUpperCase() || 'U'}
                </div>
                <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-100">
                  {t('settings.edit_member_title')}
                </h3>
              </div>
              <button
                onClick={() => setEditingMember(null)}
                className="p-1 text-zinc-400 hover:text-zinc-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {editError && (
              <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/40 text-red-600 dark:text-red-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{editError}</span>
              </div>
            )}

            <form onSubmit={handleUpdateMember} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Uživatelské jméno (login) *
                </label>
                <input
                  type="text"
                  required
                  value={editUsername}
                  onChange={(e) => setEditUsername(e.target.value)}
                  placeholder="např. tomas"
                  className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 text-sm focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Zobrazované jméno *
                </label>
                <input
                  type="text"
                  required
                  value={editDisplayName}
                  onChange={(e) => setEditDisplayName(e.target.value)}
                  placeholder="např. Tomáš"
                  className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 text-sm focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  E-mail (volitelné)
                </label>
                <input
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  placeholder="tomas@rodina.cz"
                  className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 text-sm focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                    Nové heslo
                  </label>
                  <span className="text-[10px] text-zinc-400">
                    Ponechte prázdné pro zachování stávajícího
                  </span>
                </div>
                <input
                  type="password"
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 text-sm focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none"
                />
              </div>

              {/* Role selector: only visible if current user is admin */}
              {user?.role === 'admin' && (
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Role v domácnosti
                  </label>
                  <select
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 text-sm focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none"
                  >
                    <option value="member">Člen domácnosti</option>
                    <option value="admin">Správce (Admin)</option>
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                  Barva profilu
                </label>
                <div className="flex items-center gap-2">
                  {avatarColors.map((color) => (
                    <button
                      type="button"
                      key={color}
                      onClick={() => setEditAvatarColor(color)}
                      className={`w-7 h-7 rounded-full transition-transform ${
                        editAvatarColor === color ? 'scale-125 ring-2 ring-orange-500 ring-offset-2' : ''
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              <div className="pt-3 flex gap-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 px-4 rounded-xl font-semibold text-xs bg-orange-500 hover:bg-orange-600 text-white transition"
                >
                  {t('settings.save_changes')}
                </button>
                <button
                  type="button"
                  onClick={() => setEditingMember(null)}
                  className="py-2.5 px-4 rounded-xl font-semibold text-xs bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300"
                >
                  Zrušit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Member Confirmation Modal */}
      {deletingMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-zinc-900 w-full max-w-md rounded-3xl shadow-2xl border border-zinc-200 dark:border-zinc-800 p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-100">
                  {t('settings.delete_member_title')}
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Potvrzení trvalého odebrání člena
                </p>
              </div>
            </div>

            {deleteError && (
              <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/40 text-red-600 dark:text-red-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{deleteError}</span>
              </div>
            )}

            <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/80 flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-sm"
                style={{ backgroundColor: deletingMember.avatar_color || '#f97316' }}
              >
                {deletingMember.display_name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h4 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                  {deletingMember.display_name}
                </h4>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  @{deletingMember.username} • {deletingMember.role === 'admin' ? 'Správce' : 'Člen'}
                </p>
              </div>
            </div>

            <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
              {t('settings.delete_member_warning')}
            </p>

            <div className="pt-2 flex gap-2">
              <button
                type="button"
                onClick={handleDeleteMember}
                className="flex-1 py-2.5 px-4 rounded-xl font-semibold text-xs bg-red-600 hover:bg-red-700 text-white transition shadow-sm"
              >
                {t('settings.delete_member')}
              </button>
              <button
                type="button"
                onClick={() => setDeletingMember(null)}
                className="py-2.5 px-4 rounded-xl font-semibold text-xs bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300"
              >
                Zrušit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Wipe All Data Confirmation Modal */}
      {isResetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-zinc-900 w-full max-w-lg rounded-3xl shadow-2xl border border-red-200 dark:border-red-900/80 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-red-100 dark:bg-red-950/70 text-red-600 dark:text-red-400">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-100">
                    {t('settings.reset_data_modal_title')}
                  </h3>
                  <p className="text-xs text-red-600 dark:text-red-400 font-medium">
                    Nevratná operace s databází
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => !isResetting && setIsResetModalOpen(false)}
                className="p-1 text-zinc-400 hover:text-zinc-600 rounded-lg"
                disabled={isResetting}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {resetError && (
              <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/40 text-red-600 dark:text-red-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{resetError}</span>
              </div>
            )}

            {resetSuccess && (
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/40 text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-2">
                <Check className="w-4 h-4 shrink-0" />
                <span>{resetSuccess}</span>
              </div>
            )}

            <div className="p-3.5 rounded-2xl bg-red-50/60 dark:bg-red-950/30 border border-red-200/80 dark:border-red-900/40 text-xs text-red-900 dark:text-red-200 leading-relaxed">
              <p className="font-semibold mb-1">⚠️ {t('settings.reset_data_modal_warning')}</p>
              <ul className="list-disc list-inside text-[11px] text-red-800/80 dark:text-red-300/80 space-y-0.5 mt-1">
                <li>Smaže všechny recepty a kuchařku</li>
                <li>Smaže zásoby ve spíži a lednici i nákupní seznam</li>
                <li>Smaže pokojovky, mazlíčky a evidenci úkolů</li>
                <li>Smaže veškeré rodinné finance, rozpočty a transakce</li>
                <li>Smaže naskenované dokumenty z archivu</li>
                <li>Smaže garáž a vozový park, domácí lékárničku i historii aktivit</li>
                <li>Váš administrátorský účet ({user?.display_name}) zůstane plně funkční</li>
              </ul>
            </div>

            <form onSubmit={handleResetAllData} className="space-y-3.5 pt-1">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  {t('settings.reset_data_confirm_label')}
                </label>
                <input
                  type="text"
                  required
                  value={resetConfirmText}
                  onChange={(e) => setResetConfirmText(e.target.value)}
                  placeholder="SMAZAT"
                  disabled={isResetting}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 text-sm font-mono tracking-wide"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  {t('settings.reset_data_password_label')}
                </label>
                <input
                  type="password"
                  value={resetPassword}
                  onChange={(e) => setResetPassword(e.target.value)}
                  placeholder={t('settings.reset_data_password_placeholder')}
                  disabled={isResetting}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 text-sm"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="submit"
                  disabled={isResetting || (resetConfirmText.trim().toUpperCase() !== 'SMAZAT' && resetConfirmText.trim().toUpperCase() !== 'CONFIRM')}
                  className={`flex-1 py-2.5 px-4 rounded-xl font-semibold text-xs flex items-center justify-center gap-2 transition shadow-sm ${
                    isResetting || (resetConfirmText.trim().toUpperCase() !== 'SMAZAT' && resetConfirmText.trim().toUpperCase() !== 'CONFIRM')
                      ? 'bg-zinc-200 dark:bg-zinc-800 text-zinc-400 cursor-not-allowed'
                      : 'bg-red-600 hover:bg-red-700 text-white'
                  }`}
                >
                  <Trash2 className="w-4 h-4" />
                  <span>{isResetting ? t('settings.reset_data_cancelling') : t('settings.reset_data_confirm_btn')}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsResetModalOpen(false)}
                  disabled={isResetting}
                  className="py-2.5 px-4 rounded-xl font-semibold text-xs bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition"
                >
                  Zrušit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Server Backup Modal */}
      {isCreateBackupOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-zinc-900 w-full max-w-md rounded-3xl shadow-2xl border border-zinc-200 dark:border-zinc-800 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
                  <HardDrive className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-100">
                  {t('settings.create_snapshot_btn')}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => !isCreatingBackup && setIsCreateBackupOpen(false)}
                className="p-1 text-zinc-400 hover:text-zinc-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {backupError && (
              <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/40 text-red-600 dark:text-red-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{backupError}</span>
              </div>
            )}

            {backupSuccess && (
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/40 text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-2">
                <Check className="w-4 h-4 shrink-0" />
                <span>{backupSuccess}</span>
              </div>
            )}

            <form onSubmit={handleCreateSnapshot} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Poznámka k záloze (volitelná)
                </label>
                <input
                  type="text"
                  value={backupNote}
                  onChange={(e) => setBackupNote(e.target.value)}
                  placeholder={t('settings.snapshot_note_placeholder')}
                  disabled={isCreatingBackup}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="submit"
                  disabled={isCreatingBackup}
                  className="flex-1 py-2.5 px-4 rounded-xl font-semibold text-xs bg-blue-600 hover:bg-blue-700 text-white transition flex items-center justify-center gap-2 shadow-sm"
                >
                  {isCreatingBackup ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>{t('settings.creating_snapshot')}</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      <span>{t('settings.create_snapshot_btn')}</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setIsCreateBackupOpen(false)}
                  disabled={isCreatingBackup}
                  className="py-2.5 px-4 rounded-xl font-semibold text-xs bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300"
                >
                  Zrušit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Import JSON File Modal */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-zinc-900 w-full max-w-lg rounded-3xl shadow-2xl border border-zinc-200 dark:border-zinc-800 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                  <Upload className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-100">
                  {t('settings.import_modal_title')}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => !isImporting && setIsImportModalOpen(false)}
                className="p-1 text-zinc-400 hover:text-zinc-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {importError && (
              <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/40 text-red-600 dark:text-red-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{importError}</span>
              </div>
            )}

            {importSuccess && (
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/40 text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-2">
                <Check className="w-4 h-4 shrink-0" />
                <span>{importSuccess}</span>
              </div>
            )}

            <form onSubmit={handleImportSubmit} className="space-y-4">
              {/* Mode Selection */}
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
                  {t('settings.import_mode_label')}
                </label>
                <div className="space-y-2">
                  <label className={`flex items-start gap-3 p-3 rounded-2xl border cursor-pointer transition ${
                    importMode === 'merge'
                      ? 'border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/20'
                      : 'border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/40'
                  }`}>
                    <input
                      type="radio"
                      name="importMode"
                      value="merge"
                      checked={importMode === 'merge'}
                      onChange={() => setImportMode('merge')}
                      className="mt-0.5 text-emerald-600 focus:ring-emerald-500"
                    />
                    <div>
                      <span className="block text-xs font-bold text-zinc-900 dark:text-zinc-100">
                        {t('settings.import_mode_merge')}
                      </span>
                    </div>
                  </label>

                  <label className={`flex items-start gap-3 p-3 rounded-2xl border cursor-pointer transition ${
                    importMode === 'replace'
                      ? 'border-red-500 bg-red-50/40 dark:bg-red-950/20'
                      : 'border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/40'
                  }`}>
                    <input
                      type="radio"
                      name="importMode"
                      value="replace"
                      checked={importMode === 'replace'}
                      onChange={() => setImportMode('replace')}
                      className="mt-0.5 text-red-600 focus:ring-red-500"
                    />
                    <div>
                      <span className="block text-xs font-bold text-red-700 dark:text-red-300">
                        {t('settings.import_mode_replace')}
                      </span>
                    </div>
                  </label>
                </div>
              </div>

              {/* File Input */}
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                  {t('settings.import_select_file')}
                </label>
                <div className="relative border-2 border-dashed border-zinc-200 dark:border-zinc-700 rounded-2xl p-4 text-center hover:border-emerald-500/50 transition">
                  <input
                    type="file"
                    accept=".json,application/json"
                    required
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setImportFile(e.target.files[0]);
                      }
                    }}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div className="flex flex-col items-center justify-center gap-1 text-zinc-500 dark:text-zinc-400">
                    <FileJson className="w-8 h-8 text-emerald-500 mb-1" />
                    {importFile ? (
                      <div>
                        <span className="font-semibold text-xs text-zinc-800 dark:text-zinc-200 block">
                          {importFile.name}
                        </span>
                        <span className="text-[10px] text-zinc-400">
                          ({(importFile.size / 1024).toFixed(1)} kB)
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs">{t('settings.import_drag_drop')}</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="submit"
                  disabled={!importFile || isImporting}
                  className={`flex-1 py-2.5 px-4 rounded-xl font-semibold text-xs flex items-center justify-center gap-2 transition shadow-sm ${
                    !importFile || isImporting
                      ? 'bg-zinc-200 dark:bg-zinc-800 text-zinc-400 cursor-not-allowed'
                      : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  }`}
                >
                  {isImporting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>{t('settings.importing')}</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      <span>{t('settings.import_confirm_btn')}</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setIsImportModalOpen(false)}
                  disabled={isImporting}
                  className="py-2.5 px-4 rounded-xl font-semibold text-xs bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300"
                >
                  Zrušit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Restore Snapshot Modal */}
      {restoringBackup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-zinc-900 w-full max-w-md rounded-3xl shadow-2xl border border-zinc-200 dark:border-zinc-800 p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-100">
                  {t('settings.restore_confirm_title')}
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Obnova databáze ze serverového snapshotu
                </p>
              </div>
            </div>

            {restoreError && (
              <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/40 text-red-600 dark:text-red-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{restoreError}</span>
              </div>
            )}

            {restoreSuccess && (
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/40 text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-2">
                <Check className="w-4 h-4 shrink-0" />
                <span>{restoreSuccess}</span>
              </div>
            )}

            <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/80 text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-zinc-400">Soubor:</span>
                <span className="font-mono font-medium text-zinc-800 dark:text-zinc-200">{restoringBackup.filename}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Vytvořeno:</span>
                <span className="text-zinc-700 dark:text-zinc-300">
                  {new Date(restoringBackup.created_at).toLocaleString('cs-CZ')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Položek celkem:</span>
                <span className="font-semibold text-blue-600 dark:text-blue-400">{restoringBackup.total_items}</span>
              </div>
              {restoringBackup.note && (
                <div className="flex justify-between">
                  <span className="text-zinc-400">Poznámka:</span>
                  <span className="text-zinc-700 dark:text-zinc-300">{restoringBackup.note}</span>
                </div>
              )}
            </div>

            <p className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed bg-amber-50 dark:bg-amber-950/30 p-3 rounded-xl border border-amber-200 dark:border-amber-900/40">
              ⚠️ Obnova nahradí současný stav databáze daty z této zálohy. Váš administrátorský účet zůstane zachován.
            </p>

            <div className="pt-2 flex gap-2">
              <button
                type="button"
                onClick={handleRestoreSnapshot}
                disabled={isRestoring}
                className="flex-1 py-2.5 px-4 rounded-xl font-semibold text-xs bg-amber-600 hover:bg-amber-700 text-white transition flex items-center justify-center gap-2 shadow-sm"
              >
                {isRestoring ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>{t('settings.restoring')}</span>
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4" />
                    <span>{t('settings.restore_confirm_btn')}</span>
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => !isRestoring && setRestoringBackup(null)}
                disabled={isRestoring}
                className="py-2.5 px-4 rounded-xl font-semibold text-xs bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300"
              >
                Zrušit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Snapshot Confirmation Modal */}
      {deletingBackup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-zinc-900 w-full max-w-md rounded-3xl shadow-2xl border border-zinc-200 dark:border-zinc-800 p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-100">
                  {t('settings.btn_delete')} zálohu
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Potvrzení smazání souboru zálohy ze serveru
                </p>
              </div>
            </div>

            <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
              Opravdu si přejete smazat záložní snapshot <strong className="font-mono text-zinc-800 dark:text-zinc-200">{deletingBackup.filename}</strong>? Tento soubor bude trvale odstraněn ze serveru.
            </p>

            <div className="pt-2 flex gap-2">
              <button
                type="button"
                onClick={handleDeleteSnapshot}
                disabled={isDeletingBackup}
                className="flex-1 py-2.5 px-4 rounded-xl font-semibold text-xs bg-red-600 hover:bg-red-700 text-white transition flex items-center justify-center gap-2 shadow-sm"
              >
                {isDeletingBackup ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Mazání...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>{t('settings.btn_delete')}</span>
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => !isDeletingBackup && setDeletingBackup(null)}
                disabled={isDeletingBackup}
                className="py-2.5 px-4 rounded-xl font-semibold text-xs bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300"
              >
                Zrušit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
