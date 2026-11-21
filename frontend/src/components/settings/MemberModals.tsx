import React, { useState } from 'react';
import { AlertCircle, AlertTriangle, X } from 'lucide-react';
import { api } from '../../services/api';
import { User } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from '../../i18n';

const avatarColors = ['#f97316', '#3b82f6', '#10b981', '#8b5cf6', '#ec4899', '#eab308', '#14b8a6', '#ef4444'];

interface BaseProps {
  onClose: () => void;
  onSaved: () => void;
}

export const AddMemberModal: React.FC<BaseProps> = ({ onClose, onSaved }) => {
  const { t } = useTranslation();
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'admin' | 'member'>('member');
  const [avatarColor, setAvatarColor] = useState('#f97316');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !displayName.trim()) return;
    if (password.length < 12) {
      setError('Heslo nového člena musí mít alespoň 12 znaků.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await api.createUser({
        username: username.trim(),
        display_name: displayName.trim(),
        password,
        role,
        avatar_color: avatarColor,
      });
      onSaved();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Člena se nepodařilo vytvořit.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white dark:bg-zinc-900 w-full max-w-md rounded-3xl shadow-2xl border border-zinc-200 dark:border-zinc-800 p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3">
          <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-100">{t('settings.add_member')}</h3>
          <button onClick={onClose} className="p-1 text-zinc-400 hover:text-zinc-600 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/40 text-red-600 dark:text-red-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={submit} className="space-y-3.5">
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Uživatelské jméno (login) *
            </label>
            <input type="text" required value={username} onChange={(e) => setUsername(e.target.value)}
              placeholder={t('settings.username_placeholder')}
              className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Zobrazované jméno *
            </label>
            <input type="text" required value={displayName} onChange={(e) => setDisplayName(e.target.value)}
              placeholder={t('settings.display_name_placeholder')}
              className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Výchozí heslo *
            </label>
            <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Role v domácnosti
            </label>
            <select value={role} onChange={(e) => setRole(e.target.value as 'admin' | 'member')}
              className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 text-sm">
              <option value="member">{t('settings.role_member')}</option>
              <option value="admin">{t('settings.role_admin')}</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
              Barva profilu
            </label>
            <div className="flex items-center gap-2">
              {avatarColors.map((color) => (
                <button type="button" key={color} onClick={() => setAvatarColor(color)}
                  className={`w-7 h-7 rounded-full transition-transform ${
                    avatarColor === color ? 'scale-125 ring-2 ring-orange-500 ring-offset-2' : ''
                  }`}
                  style={{ backgroundColor: color }} />
              ))}
            </div>
          </div>
          <div className="pt-3 flex gap-2">
            <button type="submit" disabled={saving}
              className="flex-1 py-2.5 px-4 rounded-xl font-semibold text-xs bg-orange-500 hover:bg-orange-600 text-white transition disabled:opacity-50">
              {t('settings.add_member')}
            </button>
            <button type="button" onClick={onClose}
              className="py-2.5 px-4 rounded-xl font-semibold text-xs bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300">
              Zrušit
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

interface EditProps extends BaseProps {
  member: User;
}

export const EditMemberModal: React.FC<EditProps> = ({ member, onClose, onSaved }) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [username, setUsername] = useState(member.username);
  const [displayName, setDisplayName] = useState(member.display_name);
  const [email, setEmail] = useState(member.email || '');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'admin' | 'member'>((member.role as 'admin' | 'member') || 'member');
  const [avatarColor, setAvatarColor] = useState(member.avatar_color || '#f97316');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !displayName.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const payload: any = {
        username: username.trim(),
        display_name: displayName.trim(),
        email: email.trim() || undefined,
        role,
        avatar_color: avatarColor,
      };
      if (password.trim()) payload.password = password.trim();
      await api.updateUser(member.id, payload);
      onSaved();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Člena se nepodařilo upravit.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white dark:bg-zinc-900 w-full max-w-md rounded-3xl shadow-2xl border border-zinc-200 dark:border-zinc-800 p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white font-bold text-xs shadow-sm"
              style={{ backgroundColor: avatarColor }}>
              {displayName.charAt(0).toUpperCase() || 'U'}
            </div>
            <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-100">
              {t('settings.edit_member_title')}
            </h3>
          </div>
          <button onClick={onClose} className="p-1 text-zinc-400 hover:text-zinc-600 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/40 text-red-600 dark:text-red-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={submit} className="space-y-3.5">
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Uživatelské jméno (login) *
            </label>
            <input type="text" required value={username} onChange={(e) => setUsername(e.target.value)}
              placeholder={t('settings.username_placeholder')}
              className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Zobrazované jméno *
            </label>
            <input type="text" required value={displayName} onChange={(e) => setDisplayName(e.target.value)}
              placeholder={t('settings.display_name_placeholder')}
              className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">E-mail</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Nové heslo</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 text-sm" />
          </div>
          {user?.role === 'admin' && (
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Role v domácnosti
              </label>
              <select value={role} onChange={(e) => setRole(e.target.value as 'admin' | 'member')}
                className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 text-sm">
                <option value="member">{t('settings.role_member')}</option>
                <option value="admin">{t('settings.role_admin')}</option>
              </select>
            </div>
          )}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">Barva profilu</label>
            <div className="flex items-center gap-2">
              {avatarColors.map((color) => (
                <button type="button" key={color} onClick={() => setAvatarColor(color)}
                  className={`w-7 h-7 rounded-full transition-transform ${
                    avatarColor === color ? 'scale-125 ring-2 ring-orange-500 ring-offset-2' : ''
                  }`}
                  style={{ backgroundColor: color }} />
              ))}
            </div>
          </div>
          <div className="pt-3 flex gap-2">
            <button type="submit" disabled={saving}
              className="flex-1 py-2.5 px-4 rounded-xl font-semibold text-xs bg-orange-500 hover:bg-orange-600 text-white transition disabled:opacity-50">
              {t('settings.save_changes')}
            </button>
            <button type="button" onClick={onClose}
              className="py-2.5 px-4 rounded-xl font-semibold text-xs bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300">
              Zrušit
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export const DeleteMemberDialog: React.FC<EditProps> = ({ member, onClose, onSaved }) => {
  const { t } = useTranslation();
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const confirm = async () => {
    setDeleting(true);
    setError(null);
    try {
      await api.deleteUser(member.id);
      onSaved();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Člena se nepodařilo odebrat.');
    } finally {
      setDeleting(false);
    }
  };

  return (
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
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/40 text-red-600 dark:text-red-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/80 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-sm"
            style={{ backgroundColor: member.avatar_color || '#f97316' }}>
            {member.display_name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h4 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">{member.display_name}</h4>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              @{member.username} • {member.role === 'admin' ? 'Správce' : 'Člen'}
            </p>
          </div>
        </div>

        <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
          {t('settings.delete_member_warning')}
        </p>

        <div className="pt-2 flex gap-2">
          <button type="button" onClick={confirm} disabled={deleting}
            className="flex-1 py-2.5 px-4 rounded-xl font-semibold text-xs bg-red-600 hover:bg-red-700 text-white transition shadow-sm disabled:opacity-50">
            {t('settings.delete_member')}
          </button>
          <button type="button" onClick={onClose}
            className="py-2.5 px-4 rounded-xl font-semibold text-xs bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300">
            Zrušit
          </button>
        </div>
      </div>
    </div>
  );
};
