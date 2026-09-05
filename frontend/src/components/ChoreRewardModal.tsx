import React, { useState } from 'react';
import { 
  X, Gift, Film, Utensils, IceCream, Shield, 
  Sparkles, Check, Plus, Coins
} from 'lucide-react';
import { ChoreReward } from '../types';
import { useTranslation } from '../i18n';

interface ChoreRewardModalProps {
  isOpen: boolean;
  onClose: () => void;
  rewards: ChoreReward[];
  userPoints: number;
  onRedeem: (rewardId: number) => Promise<void>;
  onCreateReward: (data: { title: string; description?: string; cost_points: number; icon?: string }) => Promise<void>;
}

export const ChoreRewardModal: React.FC<ChoreRewardModalProps> = ({
  isOpen,
  onClose,
  rewards,
  userPoints,
  onRedeem,
  onCreateReward
}) => {
  const { t } = useTranslation();
  const [showAddForm, setShowAddForm] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [costPoints, setCostPoints] = useState(50);
  const [icon, setIcon] = useState('Gift');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  if (!isOpen) return null;

  const getRewardIcon = (iconName: string) => {
    switch (iconName) {
      case 'Film': return <Film className="w-5 h-5 text-indigo-500" />;
      case 'Utensils': return <Utensils className="w-5 h-5 text-orange-500" />;
      case 'IceCream': return <IceCream className="w-5 h-5 text-pink-500" />;
      case 'Shield': return <Shield className="w-5 h-5 text-emerald-500" />;
      default: return <Gift className="w-5 h-5 text-amber-500" />;
    }
  };

  const handleRedeem = async (rewardId: number) => {
    try {
      await onRedeem(rewardId);
      setSuccessMessage(t('chores.rewards.redeemed_success'));
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (e: any) {
      alert(e.message || 'Error');
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setIsSubmitting(true);
    try {
      await onCreateReward({
        title,
        description: description || undefined,
        cost_points: costPoints,
        icon
      });
      setTitle('');
      setDescription('');
      setShowAddForm(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-lg w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-gray-200 dark:border-gray-700">
        
        {/* Header */}
        <div className="p-5 border-b border-gray-100 dark:border-gray-700 flex items-start justify-between bg-gradient-to-r from-amber-500/10 to-orange-500/10">
          <div>
            <div className="flex items-center gap-2">
              <Coins className="w-5 h-5 text-amber-500" />
              <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                {t('chores.rewards.title')}
              </h2>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {t('chores.rewards.subtitle')}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Balance Banner */}
        <div className="px-5 py-3 bg-amber-50 dark:bg-amber-950/40 border-b border-amber-100 dark:border-amber-900/30 flex items-center justify-between">
          <span className="text-xs font-medium text-amber-900 dark:text-amber-200">
            {t('chores.rewards.available_points')}:
          </span>
          <span className="text-base font-extrabold text-amber-600 dark:text-amber-400 flex items-center gap-1">
            <Sparkles className="w-4 h-4" />
            {userPoints} {t('chores.pts')}
          </span>
        </div>

        {/* Success toast */}
        {successMessage && (
          <div className="mx-5 mt-3 p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs font-semibold text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-500" />
            {successMessage}
          </div>
        )}

        {/* Rewards List */}
        <div className="p-5 overflow-y-auto space-y-3 flex-1">
          {rewards.map(reward => {
            const canAfford = userPoints >= reward.cost_points;
            return (
              <div
                key={reward.id}
                className="flex items-center justify-between p-3.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:shadow-sm transition-all"
              >
                <div className="flex items-center gap-3 min-w-0 pr-2">
                  <div className="w-10 h-10 rounded-xl bg-gray-50 dark:bg-gray-700/60 flex items-center justify-center flex-shrink-0">
                    {getRewardIcon(reward.icon)}
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100 truncate">
                      {reward.title}
                    </h4>
                    {reward.description && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1 mt-0.5">
                        {reward.description}
                      </p>
                    )}
                    <span className="inline-block mt-1 text-xs font-semibold text-amber-600 dark:text-amber-400">
                      {reward.cost_points} {t('chores.pts')}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => handleRedeem(reward.id)}
                  disabled={!canAfford}
                  className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    canAfford
                      ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-sm shadow-amber-500/20 active:scale-95'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  {canAfford ? t('chores.rewards.redeem_btn') : t('chores.rewards.not_enough_points')}
                </button>
              </div>
            );
          })}

          {/* Add custom reward accordion */}
          {showAddForm ? (
            <form onSubmit={handleCreate} className="p-4 rounded-xl border border-dashed border-gray-300 dark:border-gray-600 space-y-3 bg-gray-50/50 dark:bg-gray-900/20">
              <h4 className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                {t('chores.rewards.add_reward')}
              </h4>
              <input
                type="text"
                placeholder="Název odměny (např. Výběr rodinného filmu)"
                value={title}
                onChange={e => setTitle(e.target.value)}
                required
                className="w-full text-xs rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-gray-800 dark:text-gray-200"
              />
              <input
                type="text"
                placeholder="Popis odměny (volitelné)"
                value={description}
                onChange={e => setDescription(e.target.value)}
                className="w-full text-xs rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-gray-800 dark:text-gray-200"
              />
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="block text-[10px] text-gray-400 mb-1">Cena v bodech:</label>
                  <input
                    type="number"
                    min="5"
                    step="5"
                    value={costPoints}
                    onChange={e => setCostPoints(Number(e.target.value))}
                    className="w-full text-xs rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-1.5 text-gray-800 dark:text-gray-200"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-[10px] text-gray-400 mb-1">Ikona:</label>
                  <select
                    value={icon}
                    onChange={e => setIcon(e.target.value)}
                    className="w-full text-xs rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-1.5 text-gray-800 dark:text-gray-200"
                  >
                    <option value="Gift">Dárek (Gift)</option>
                    <option value="Film">Film / Kino</option>
                    <option value="Utensils">Jídlo / Večeře</option>
                    <option value="IceCream">Zmrzlina</option>
                    <option value="Shield">Štít (Imunita)</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-3 py-1.5 text-xs text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg"
                >
                  Zrušit
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-3 py-1.5 text-xs font-bold text-white bg-primary-600 hover:bg-primary-700 rounded-lg shadow-sm"
                >
                  Uložit odměnu
                </button>
              </div>
            </form>
          ) : (
            <button
              onClick={() => setShowAddForm(true)}
              className="w-full py-2.5 rounded-xl border border-dashed border-gray-300 dark:border-gray-600 hover:border-amber-500 dark:hover:border-amber-500 text-xs font-semibold text-gray-600 dark:text-gray-400 hover:text-amber-600 dark:hover:text-amber-400 flex items-center justify-center gap-1.5 transition-colors"
            >
              <Plus className="w-4 h-4" />
              {t('chores.rewards.add_reward')}
            </button>
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
