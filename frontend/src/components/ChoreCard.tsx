import React, { useState } from 'react';
import { 
  CheckCircle2, Clock, Users, RefreshCw, ShoppingBag, 
  Wrench, MoreVertical, Edit2, Trash2, ArrowRightLeft, Sparkles
} from 'lucide-react';
import { Chore, User } from '../types';
import { useTranslation } from '../i18n';

interface ChoreCardProps {
  chore: Chore;
  users: User[];
  currentUserId: number;
  onComplete: (choreId: number) => Promise<void>;
  onReassign: (choreId: number, newAssigneeId: number) => Promise<void>;
  onEdit: (chore: Chore) => void;
  onDelete: (choreId: number) => void;
  onAddToShopping: (choreId: number, supplyName: string) => void;
}

export const ChoreCard: React.FC<ChoreCardProps> = ({
  chore,
  users,
  currentUserId,
  onComplete,
  onReassign,
  onEdit,
  onDelete,
  onAddToShopping
}) => {
  const { t } = useTranslation();
  const [isCompleting, setIsCompleting] = useState(false);
  const [showReassignMenu, setShowReassignMenu] = useState(false);
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);

  const handleComplete = async () => {
    setIsCompleting(true);
    try {
      await onComplete(chore.id);
    } finally {
      setIsCompleting(false);
    }
  };

  const isAssignedToMe = chore.current_assignee_id === currentUserId;

  const getDueBadge = () => {
    if (chore.is_overdue) {
      return (
        <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300 animate-pulse">
          <Clock className="w-3 h-3" />
          {t('chores.overdue')}
        </span>
      );
    }
    if (chore.days_until_due === 0) {
      return (
        <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
          <Clock className="w-3 h-3" />
          {t('chores.due_today')}
        </span>
      );
    }
    if (chore.days_until_due !== null && chore.days_until_due !== undefined) {
      return (
        <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
          {t('chores.due_in_days', { days: chore.days_until_due })}
        </span>
      );
    }
    return null;
  };

  const getRoomName = (room: string) => {
    const key = `chores.rooms.${room}`;
    return t(key) || room;
  };

  return (
    <div className={`relative bg-white dark:bg-gray-800 rounded-xl border p-4 shadow-sm transition-all hover:shadow-md ${
      isAssignedToMe ? 'border-primary-300 dark:border-primary-700/60 ring-1 ring-primary-400/20' : 'border-gray-200 dark:border-gray-700'
    }`}>
      {/* Top Header Row */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-medium px-2 py-0.5 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
            {getRoomName(chore.room)}
          </span>
          {getDueBadge()}
          {chore.is_appliance_maintenance && (
            <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
              <Wrench className="w-3 h-3" />
              {chore.appliance_name || t('chores.appliance')}
            </span>
          )}
        </div>

        {/* Options dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowOptionsMenu(!showOptionsMenu)}
            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <MoreVertical className="w-4 h-4" />
          </button>
          {showOptionsMenu && (
            <div className="absolute right-0 mt-1 w-36 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-20">
              <button
                onClick={() => { setShowOptionsMenu(false); onEdit(chore); }}
                className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <Edit2 className="w-3.5 h-3.5" />
                {t('chores.edit_chore')}
              </button>
              <button
                onClick={() => { setShowOptionsMenu(false); onDelete(chore.id); }}
                className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
              >
                <Trash2 className="w-3.5 h-3.5" />
                {t('common.confirm_delete')}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Chore Title and Description */}
      <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-base mb-1 leading-snug">
        {chore.title}
      </h3>
      {chore.description && (
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-3 line-clamp-2">
          {chore.description}
        </p>
      )}

      {/* Meta Specs: Points, Time, Frequency */}
      <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400 mb-3.5">
        <span className="flex items-center gap-1 font-semibold text-amber-600 dark:text-amber-400">
          <Sparkles className="w-3.5 h-3.5" />
          +{chore.points} {t('chores.pts')}
        </span>
        <span className="flex items-center gap-1">
          <Clock className="w-3.5 h-3.5" />
          {chore.estimated_minutes} {t('chores.minutes')}
        </span>
        {chore.is_rotation_enabled && (
          <span className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400 font-medium">
            <RefreshCw className="w-3 h-3" />
            Rotace
          </span>
        )}
      </div>

      {/* Needed Supplies Banner */}
      {chore.cleaning_supplies_needed && (
        <div className="flex items-center justify-between gap-2 p-2 mb-3 rounded-lg bg-orange-50/70 dark:bg-orange-950/20 border border-orange-100 dark:border-orange-900/30 text-xs">
          <span className="text-orange-900 dark:text-orange-300 truncate">
            🛒 {chore.cleaning_supplies_needed}
          </span>
          <button
            onClick={() => onAddToShopping(chore.id, chore.cleaning_supplies_needed!)}
            className="flex-shrink-0 text-xs font-medium text-orange-600 dark:text-orange-400 hover:underline flex items-center gap-1"
            title={t('chores.order_supply')}
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            + Nákup
          </button>
        </div>
      )}

      {/* Assignee & Action Row */}
      <div className="flex items-center justify-between gap-2 pt-2 border-t border-gray-100 dark:border-gray-700/60 mt-auto">
        {/* Current Assignee Avatar & Name */}
        <div className="flex items-center gap-2">
          {chore.current_assignee ? (
            <div className="flex items-center gap-1.5">
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold shadow-sm"
                style={{ backgroundColor: chore.current_assignee.avatar_color || '#f97316' }}
              >
                {chore.current_assignee.display_name.charAt(0).toUpperCase()}
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] text-gray-400 leading-none">{t('chores.on_turn')}</span>
                <span className="text-xs font-medium text-gray-800 dark:text-gray-200 leading-tight">
                  {chore.current_assignee.display_name}
                </span>
              </div>
            </div>
          ) : (
            <span className="text-xs text-gray-400 flex items-center gap-1">
              <Users className="w-3.5 h-3.5" />
              Kdokoli
            </span>
          )}

          {/* Reassign dropdown button */}
          <div className="relative">
            <button
              onClick={() => setShowReassignMenu(!showReassignMenu)}
              title={t('chores.reassign_btn')}
              className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <ArrowRightLeft className="w-3 h-3" />
            </button>
            {showReassignMenu && (
              <div className="absolute left-0 bottom-full mb-1 w-44 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 py-1 z-30">
                <div className="px-3 py-1 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                  {t('chores.reassign_btn')}
                </div>
                {users.map(u => (
                  <button
                    key={u.id}
                    onClick={() => {
                      setShowReassignMenu(false);
                      onReassign(chore.id, u.id);
                    }}
                    className={`w-full flex items-center gap-2 px-3 py-1.5 text-xs text-left hover:bg-gray-50 dark:hover:bg-gray-700/60 ${
                      chore.current_assignee_id === u.id ? 'font-bold text-primary-600' : 'text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    <div
                      className="w-4 h-4 rounded-full flex items-center justify-center text-white text-[9px]"
                      style={{ backgroundColor: u.avatar_color }}
                    >
                      {u.display_name.charAt(0)}
                    </div>
                    {u.display_name}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Complete button */}
        <button
          onClick={handleComplete}
          disabled={isCompleting}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium shadow-sm transition-all active:scale-95 ${
            isAssignedToMe
              ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20'
              : 'bg-gray-100 dark:bg-gray-700 hover:bg-emerald-600 hover:text-white text-gray-700 dark:text-gray-200'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          {isCompleting ? '...' : t('chores.mark_completed')}
        </button>
      </div>
    </div>
  );
};
