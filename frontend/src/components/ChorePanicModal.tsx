import React, { useState, useEffect } from 'react';
import { X, Flame, Play, Pause, RotateCcw, CheckCircle2, Trophy, Sparkles } from 'lucide-react';
import { Chore } from '../types';
import { useTranslation } from '../i18n';

interface ChorePanicModalProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: Chore[];
  onCompleteTask: (choreId: number) => Promise<void>;
}

export const ChorePanicModal: React.FC<ChorePanicModalProps> = ({
  isOpen,
  onClose,
  tasks,
  onCompleteTask
}) => {
  const { t } = useTranslation();
  const [timeLeft, setTimeLeft] = useState(15 * 60); // 15 minutes in seconds
  const [isActive, setIsActive] = useState(false);
  const [completedIds, setCompletedIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    let interval: any = null;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(time => time - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setIsActive(false);
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft]);

  if (!isOpen) return null;

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const timeFormatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const toggleTask = async (taskId: number) => {
    if (completedIds.has(taskId)) {
      setCompletedIds(prev => {
        const next = new Set(prev);
        next.delete(taskId);
        return next;
      });
    } else {
      setCompletedIds(prev => new Set(prev).add(taskId));
      await onCompleteTask(taskId);
    }
  };

  const allCompleted = tasks.length > 0 && completedIds.size === tasks.length;
  const progressPercent = tasks.length > 0 ? Math.round((completedIds.size / tasks.length) * 100) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-lg w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-red-200 dark:border-red-900/50">
        
        {/* Header with fiery panic theme */}
        <div className="bg-gradient-to-r from-red-600 via-orange-600 to-amber-600 p-5 text-white flex items-start justify-between relative overflow-hidden">
          <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-white/10 rounded-full blur-xl pointer-events-none" />
          <div className="relative z-10">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/20 text-xs font-bold uppercase tracking-wider mb-2">
              <Flame className="w-3.5 h-3.5 animate-bounce" />
              Panic Mode 🌪️
            </div>
            <h2 className="text-xl font-bold">{t('chores.panic_modal.title')}</h2>
            <p className="text-xs text-red-100 mt-1 max-w-sm">
              {t('chores.panic_modal.subtitle')}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg bg-black/20 hover:bg-black/40 text-white transition-colors relative z-10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Stopwatch Countdown Widget */}
        <div className="p-4 bg-red-50/50 dark:bg-red-950/20 border-b border-red-100 dark:border-red-900/30 flex items-center justify-between">
          <div className="flex items-baseline gap-2">
            <span className={`text-4xl font-extrabold tracking-tight font-mono ${
              timeLeft < 180 ? 'text-red-600 dark:text-red-400 animate-pulse' : 'text-gray-900 dark:text-gray-100'
            }`}>
              {timeFormatted}
            </span>
            <span className="text-xs text-gray-500 font-medium">zbývá času</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsActive(!isActive)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white shadow-sm transition-all ${
                isActive ? 'bg-amber-600 hover:bg-amber-700' : 'bg-red-600 hover:bg-red-700'
              }`}
            >
              {isActive ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              {isActive ? t('chores.panic_modal.pause_timer') : t('chores.panic_modal.start_timer')}
            </button>
            <button
              onClick={() => { setIsActive(false); setTimeLeft(15 * 60); }}
              title={t('chores.panic_modal.reset_timer')}
              className="p-1.5 rounded-lg bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-gray-100 dark:bg-gray-700 h-1.5">
          <div
            className="bg-emerald-500 h-1.5 transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Task List */}
        <div className="p-5 overflow-y-auto space-y-3 flex-1">
          {allCompleted ? (
            <div className="py-8 text-center bg-emerald-50 dark:bg-emerald-950/30 rounded-xl border border-emerald-200 dark:border-emerald-800 p-6">
              <Trophy className="w-14 h-14 text-emerald-500 mx-auto mb-3 animate-bounce" />
              <h3 className="text-lg font-bold text-emerald-800 dark:text-emerald-300">
                {t('chores.panic_modal.all_done')}
              </h3>
              <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1 flex items-center justify-center gap-1">
                <Sparkles className="w-4 h-4" />
                {t('chores.panic_modal.bonus_points')}
              </p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-2">
                <span>Rychlé prioritní úkoly ({completedIds.size} / {tasks.length})</span>
                <span>+{tasks.reduce((sum, t) => sum + t.points, 0)} b. celkem</span>
              </div>
              {tasks.map(task => {
                const isDone = completedIds.has(task.id);
                return (
                  <div
                    key={task.id}
                    onClick={() => toggleTask(task.id)}
                    className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                      isDone
                        ? 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/40 opacity-70'
                        : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-red-300 dark:hover:border-red-700'
                    }`}
                  >
                    <button
                      className={`mt-0.5 w-5 h-5 rounded flex items-center justify-center transition-colors ${
                        isDone ? 'text-emerald-600' : 'text-gray-300 hover:text-gray-500'
                      }`}
                    >
                      <CheckCircle2 className="w-5 h-5" />
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className={`text-sm font-semibold ${isDone ? 'line-through text-gray-400' : 'text-gray-900 dark:text-gray-100'}`}>
                          {task.title}
                        </span>
                        <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 whitespace-nowrap">
                          +{task.points} b.
                        </span>
                      </div>
                      {task.description && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-1">
                          {task.description}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-1 text-[10px] text-gray-400">
                        <span>⏱️ {task.estimated_minutes} min</span>
                        <span>•</span>
                        <span>📍 {task.room}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-gray-50 dark:bg-gray-900/40 border-t border-gray-200 dark:border-gray-700 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-semibold bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200"
          >
            {t('common.close')}
          </button>
        </div>

      </div>
    </div>
  );
};
