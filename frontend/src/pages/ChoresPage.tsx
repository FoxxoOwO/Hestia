import React, { useState, useEffect, useMemo } from 'react';
import { 
  Sparkles, Flame, RefreshCw, Wrench, Trophy, Plus, 
  Search, Filter, Calendar, CheckCircle2, Gift, Users, ShoppingBag
} from 'lucide-react';
import { api } from '../services/api';
import { Chore, User, LeaderboardMember, ChoreReward, ChoreCreateInput } from '../types';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../i18n';
import { ChoreCard } from '../components/ChoreCard';
import { ChorePanicModal } from '../components/ChorePanicModal';
import { ChoreWheelModal } from '../components/ChoreWheelModal';
import { ChoreRewardModal } from '../components/ChoreRewardModal';
import { ChoreEditModal } from '../components/ChoreEditModal';

type TabType = 'today' | 'rotation' | 'maintenance' | 'deep_clean' | 'leaderboard';

export const ChoresPage: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();

  const [chores, setChores] = useState<Chore[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardMember[]>([]);
  const [rewards, setRewards] = useState<ChoreReward[]>([]);
  const [panicTasks, setPanicTasks] = useState<Chore[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Tabs & Filters
  const [activeTab, setActiveTab] = useState<TabType>('today');
  const [selectedRoom, setSelectedRoom] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals
  const [isPanicModalOpen, setIsPanicModalOpen] = useState(false);
  const [isWheelModalOpen, setIsWheelModalOpen] = useState(false);
  const [isRewardModalOpen, setIsRewardModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingChore, setEditingChore] = useState<Chore | null>(null);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [choresData, usersData, leaderboardData, rewardsData, panicData] = await Promise.all([
        api.getChores(),
        api.getUsers(),
        api.getChoreLeaderboard(),
        api.getChoreRewards(),
        api.getPanicModeTasks()
      ]);
      setChores(choresData);
      setUsers(usersData);
      setLeaderboard(leaderboardData);
      setRewards(rewardsData);
      setPanicTasks(panicData);
    } catch (err) {
      console.error('Failed to load chores data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Handlers
  const handleCompleteChore = async (choreId: number) => {
    try {
      const updated = await api.completeChore(choreId);
      setChores(prev => prev.map(c => c.id === choreId ? updated : c));
      // Refresh leaderboard points
      const newLeaderboard = await api.getChoreLeaderboard();
      setLeaderboard(newLeaderboard);
    } catch (err) {
      console.error('Failed to complete chore:', err);
    }
  };

  const handleReassignChore = async (choreId: number, newAssigneeId: number) => {
    try {
      const updated = await api.reassignChore(choreId, newAssigneeId);
      setChores(prev => prev.map(c => c.id === choreId ? updated : c));
    } catch (err) {
      console.error('Failed to reassign chore:', err);
    }
  };

  const handleDeleteChore = async (choreId: number) => {
    if (!window.confirm(t('common.confirm_delete'))) return;
    try {
      await api.deleteChore(choreId);
      setChores(prev => prev.filter(c => c.id !== choreId));
    } catch (err) {
      console.error('Failed to delete chore:', err);
    }
  };

  const handleSaveChore = async (data: ChoreCreateInput, id?: number) => {
    try {
      if (id) {
        const updated = await api.updateChore(id, data);
        setChores(prev => prev.map(c => c.id === id ? updated : c));
      } else {
        const created = await api.createChore(data);
        setChores(prev => [created, ...prev]);
      }
    } catch (err) {
      console.error('Failed to save chore:', err);
    }
  };

  const handleAddToShopping = async (choreId: number, supplyName: string) => {
    try {
      const res = await api.addChoreSupplyToShopping(choreId, supplyName);
      alert(res.message);
    } catch (err) {
      console.error('Failed to add supply to shopping:', err);
    }
  };

  const handleRedeemReward = async (rewardId: number) => {
    await api.redeemChoreReward(rewardId);
    const newLeaderboard = await api.getChoreLeaderboard();
    setLeaderboard(newLeaderboard);
  };

  const handleCreateReward = async (data: { title: string; description?: string; cost_points: number; icon?: string }) => {
    const created = await api.createChoreReward(data);
    setRewards(prev => [...prev, created]);
  };

  // Current user's available points from leaderboard
  const currentUserPoints = useMemo(() => {
    if (!user) return 0;
    const found = leaderboard.find(l => l.user_id === user.id);
    return found ? found.available_points : 0;
  }, [leaderboard, user]);

  // Filtered chores based on active tab and search
  const filteredChores = useMemo(() => {
    return chores.filter(chore => {
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = chore.title.toLowerCase().includes(q);
        const matchesDesc = chore.description?.toLowerCase().includes(q);
        const matchesAppliance = chore.appliance_name?.toLowerCase().includes(q);
        if (!matchesTitle && !matchesDesc && !matchesAppliance) return false;
      }

      // Room filter
      if (selectedRoom !== 'all' && chore.room !== selectedRoom) {
        return false;
      }

      // Tab specific logic
      if (activeTab === 'today') {
        // Show if overdue, due today, or due within 1 day, or assigned to current user
        return chore.is_overdue || chore.days_until_due === 0 || chore.current_assignee_id === user?.id;
      } else if (activeTab === 'rotation') {
        return chore.is_rotation_enabled;
      } else if (activeTab === 'maintenance') {
        return chore.is_appliance_maintenance;
      } else if (activeTab === 'deep_clean') {
        return chore.category === 'deep_clean' || chore.frequency === 'seasonal';
      }

      return true;
    });
  }, [chores, activeTab, selectedRoom, searchQuery, user]);

  // Deep cleaning room stats
  const deepCleanRooms = useMemo(() => {
    const deepChores = chores.filter(c => c.category === 'deep_clean' || c.frequency === 'seasonal');
    const roomsMap: Record<string, { total: number; completed: number }> = {};
    deepChores.forEach(c => {
      if (!roomsMap[c.room]) roomsMap[c.room] = { total: 0, completed: 0 };
      roomsMap[c.room].total++;
      if (c.last_completed_at) roomsMap[c.room].completed++;
    });
    return roomsMap;
  }, [chores]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Header with Title and Action buttons */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Sparkles className="w-7 h-7 text-primary-500" />
            {t('chores.title')}
          </h1>
          <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400 mt-1">
            {t('chores.subtitle')}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Panic Mode button */}
          <button
            onClick={() => setIsPanicModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 shadow-sm shadow-red-500/20 active:scale-95 transition-all"
          >
            <Flame className="w-4 h-4 animate-pulse" />
            {t('chores.panic_mode_btn')}
          </button>

          {/* Wheel of chores */}
          <button
            onClick={() => setIsWheelModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-900/40 hover:bg-amber-200 dark:hover:bg-amber-800/50 transition-colors"
          >
            <Sparkles className="w-4 h-4 text-amber-500" />
            {t('chores.wheel_btn')}
          </button>

          {/* Reward store button */}
          <button
            onClick={() => setIsRewardModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-purple-700 dark:text-purple-300 bg-purple-100 dark:bg-purple-900/40 hover:bg-purple-200 dark:hover:bg-purple-800/50 transition-colors"
          >
            <Gift className="w-4 h-4 text-purple-500" />
            <span>Odměny</span>
            <span className="ml-1 px-1.5 py-0.5 rounded-full bg-purple-200 dark:bg-purple-800 text-[10px]">
              {currentUserPoints} b.
            </span>
          </button>

          {/* New chore */}
          <button
            onClick={() => { setEditingChore(null); setIsEditModalOpen(true); }}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-primary-600 hover:bg-primary-700 shadow-sm shadow-primary-500/20 active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4" />
            {t('chores.add_chore_btn')}
          </button>
        </div>
      </div>

      {/* Tabs navigation */}
      <div className="flex border-b border-gray-200 dark:border-gray-700 overflow-x-auto gap-2 pb-px scrollbar-none">
        <button
          onClick={() => setActiveTab('today')}
          className={`flex items-center gap-2 py-2.5 px-4 font-semibold text-xs md:text-sm border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'today'
              ? 'border-primary-500 text-primary-600 dark:text-primary-400'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
          }`}
        >
          <Calendar className="w-4 h-4" />
          {t('chores.tab_today')}
        </button>

        <button
          onClick={() => setActiveTab('rotation')}
          className={`flex items-center gap-2 py-2.5 px-4 font-semibold text-xs md:text-sm border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'rotation'
              ? 'border-primary-500 text-primary-600 dark:text-primary-400'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
          }`}
        >
          <RefreshCw className="w-4 h-4" />
          {t('chores.tab_rotation')}
        </button>

        <button
          onClick={() => setActiveTab('maintenance')}
          className={`flex items-center gap-2 py-2.5 px-4 font-semibold text-xs md:text-sm border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'maintenance'
              ? 'border-primary-500 text-primary-600 dark:text-primary-400'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
          }`}
        >
          <Wrench className="w-4 h-4" />
          {t('chores.tab_maintenance')}
        </button>

        <button
          onClick={() => setActiveTab('deep_clean')}
          className={`flex items-center gap-2 py-2.5 px-4 font-semibold text-xs md:text-sm border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'deep_clean'
              ? 'border-primary-500 text-primary-600 dark:text-primary-400'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
          }`}
        >
          <CheckCircle2 className="w-4 h-4" />
          {t('chores.tab_deep_clean')}
        </button>

        <button
          onClick={() => setActiveTab('leaderboard')}
          className={`flex items-center gap-2 py-2.5 px-4 font-semibold text-xs md:text-sm border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'leaderboard'
              ? 'border-primary-500 text-primary-600 dark:text-primary-400'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
          }`}
        >
          <Trophy className="w-4 h-4 text-amber-500" />
          {t('chores.tab_leaderboard')}
        </button>
      </div>

      {/* Leaderboard View */}
      {activeTab === 'leaderboard' ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {leaderboard.map((member, index) => {
              const isFirst = index === 0;
              return (
                <div
                  key={member.user_id}
                  className={`p-5 rounded-2xl border transition-all ${
                    isFirst
                      ? 'bg-gradient-to-b from-amber-500/10 via-amber-500/5 to-transparent border-amber-300 dark:border-amber-700/60 shadow-md ring-1 ring-amber-400/30'
                      : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-sm'
                  }`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-12 h-12 rounded-2xl flex items-center justify-center text-white text-base font-bold shadow-md"
                        style={{ backgroundColor: member.avatar_color }}
                      >
                        {member.display_name.charAt(0)}
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900 dark:text-gray-100 flex items-center gap-1.5">
                          {member.display_name}
                          {isFirst && <Trophy className="w-4 h-4 text-amber-500" />}
                        </h3>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {index + 1}. místo v rodině
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-3 border-t border-gray-100 dark:border-gray-700/60 text-xs">
                    <div className="p-2.5 rounded-xl bg-gray-50 dark:bg-gray-700/40">
                      <span className="text-gray-400 text-[10px] block">{t('chores.leaderboard.weekly_rank')}</span>
                      <span className="text-base font-extrabold text-primary-600 dark:text-primary-400">
                        +{member.weekly_points} b.
                      </span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-gray-50 dark:bg-gray-700/40">
                      <span className="text-gray-400 text-[10px] block">{t('chores.leaderboard.available_points')}</span>
                      <span className="text-base font-extrabold text-amber-600 dark:text-amber-400">
                        {member.available_points} b.
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Rewards showcase */}
          <div className="p-6 rounded-2xl bg-gradient-to-r from-purple-500/10 via-amber-500/10 to-transparent border border-purple-200 dark:border-purple-800/40 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-purple-100 dark:bg-purple-900/40 flex items-center justify-center text-purple-600 dark:text-purple-300">
                <Gift className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 dark:text-gray-100">
                  {t('chores.rewards.title')}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Vyměňte své body za rodinný film, večeři na přání nebo zmrzlinový pohár!
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsRewardModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-sm"
            >
              Otevřít obchod
            </button>
          </div>
        </div>
      ) : (
        /* Standard Chores View with Filters */
        <div className="space-y-4">
          
          {/* Filters Bar: Search & Room Pills */}
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
            {/* Search Input */}
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder={t('chores.search_placeholder')}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full text-xs rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 pl-9 pr-3 py-2 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            {/* Room pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 scrollbar-none text-xs">
              {[
                { id: 'all', label: t('chores.rooms.all') },
                { id: 'kitchen', label: t('chores.rooms.kitchen') },
                { id: 'bathroom', label: t('chores.rooms.bathroom') },
                { id: 'living_room', label: t('chores.rooms.living_room') },
                { id: 'bedroom', label: t('chores.rooms.bedroom') },
                { id: 'hallway', label: t('chores.rooms.hallway') },
              ].map(room => (
                <button
                  key={room.id}
                  onClick={() => setSelectedRoom(room.id)}
                  className={`px-3 py-1.5 rounded-lg whitespace-nowrap font-medium transition-colors ${
                    selectedRoom === room.id
                      ? 'bg-primary-600 text-white shadow-sm'
                      : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  {room.label}
                </button>
              ))}
            </div>
          </div>

          {/* Deep clean room progress cards (if deep clean tab) */}
          {activeTab === 'deep_clean' && Object.keys(deepCleanRooms).length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-2">
              {Object.entries(deepCleanRooms).map(([rm, stats]) => {
                const percent = Math.round((stats.completed / stats.total) * 100);
                return (
                  <div key={rm} className="p-3 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between text-xs font-semibold mb-1">
                      <span className="capitalize">{t(`chores.rooms.${rm}`) || rm}</span>
                      <span className="text-primary-600">{percent}%</span>
                    </div>
                    <div className="w-full bg-gray-100 dark:bg-gray-700 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-primary-500 h-full rounded-full transition-all duration-300"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-gray-400 mt-1 block">
                      {stats.completed} z {stats.total} úkolů hotovo
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Chore Cards Grid */}
          {isLoading ? (
            <div className="py-12 text-center text-gray-400">
              {t('common.loading')}
            </div>
          ) : filteredChores.length === 0 ? (
            <div className="py-16 text-center bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-8">
              <Sparkles className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
              <h3 className="text-base font-bold text-gray-700 dark:text-gray-300">
                {t('chores.empty_chores')}
              </h3>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredChores.map(chore => (
                <ChoreCard
                  key={chore.id}
                  chore={chore}
                  users={users}
                  currentUserId={user?.id || 1}
                  onComplete={handleCompleteChore}
                  onReassign={handleReassignChore}
                  onEdit={c => { setEditingChore(c); setIsEditModalOpen(true); }}
                  onDelete={handleDeleteChore}
                  onAddToShopping={handleAddToShopping}
                />
              ))}
            </div>
          )}

        </div>
      )}

      {/* Modals */}
      <ChorePanicModal
        isOpen={isPanicModalOpen}
        onClose={() => setIsPanicModalOpen(false)}
        tasks={panicTasks}
        onCompleteTask={handleCompleteChore}
      />

      <ChoreWheelModal
        isOpen={isWheelModalOpen}
        onClose={() => setIsWheelModalOpen(false)}
        users={users}
        chores={chores}
        onAssignChore={handleReassignChore}
      />

      <ChoreRewardModal
        isOpen={isRewardModalOpen}
        onClose={() => setIsRewardModalOpen(false)}
        rewards={rewards}
        userPoints={currentUserPoints}
        onRedeem={handleRedeemReward}
        onCreateReward={handleCreateReward}
      />

      <ChoreEditModal
        isOpen={isEditModalOpen}
        onClose={() => { setIsEditModalOpen(false); setEditingChore(null); }}
        chore={editingChore}
        users={users}
        onSave={handleSaveChore}
      />

    </div>
  );
};
