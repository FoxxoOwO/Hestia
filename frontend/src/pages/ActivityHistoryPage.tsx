import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from '../i18n';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { ActivityLog, ActivityStats, User } from '../types';
import {
  History, Shield, Sparkles, CheckCircle2, Car, HeartPulse,
  FileText, DollarSign, Sprout, PawPrint, BookOpen, ShoppingBag,
  Settings, RefreshCw, Search, Trash2, Filter, Calendar, Clock,
  User as UserIcon, AlertTriangle, ArrowUpRight
} from 'lucide-react';

export const ActivityHistoryPage: React.FC = () => {
  const { t, language } = useTranslation();
  const { user } = useAuth();

  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [stats, setStats] = useState<ActivityStats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Filters
  const [selectedModule, setSelectedModule] = useState<string>('all');
  const [selectedUserId, setSelectedUserId] = useState<number | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Pagination
  const [limit] = useState<number>(30);
  const [offset, setOffset] = useState<number>(0);
  const [total, setTotal] = useState<number>(0);

  const loadData = async (resetOffset = false) => {
    try {
      const currentOffset = resetOffset ? 0 : offset;
      if (resetOffset) setOffset(0);

      const [actRes, statsRes, usersRes] = await Promise.all([
        api.getActivities({
          limit,
          offset: currentOffset,
          module: selectedModule !== 'all' ? selectedModule : undefined,
          user_id: selectedUserId !== 'all' ? selectedUserId : undefined,
          search: searchQuery.trim() || undefined,
        }),
        api.getActivityStats(),
        api.getUsers()
      ]);

      if (resetOffset) {
        setActivities(actRes.items);
      } else {
        setActivities((prev) => (currentOffset === 0 ? actRes.items : [...prev, ...actRes.items]));
      }
      setTotal(actRes.total);
      setStats(statsRes);
      setUsers(usersRes);
    } catch (err) {
      console.error('Failed to load activity history', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    setIsLoading(true);
    loadData(true);
  }, [selectedModule, selectedUserId]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    loadData(true);
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadData(true);
  };

  const handleLoadMore = async () => {
    const nextOffset = offset + limit;
    setOffset(nextOffset);
    try {
      const res = await api.getActivities({
        limit,
        offset: nextOffset,
        module: selectedModule !== 'all' ? selectedModule : undefined,
        user_id: selectedUserId !== 'all' ? selectedUserId : undefined,
        search: searchQuery.trim() || undefined,
      });
      setActivities((prev) => [...prev, ...res.items]);
      setTotal(res.total);
    } catch (err) {
      console.error('Failed to load more activities', err);
    }
  };

  const handleClearHistory = async () => {
    if (!window.confirm(language === 'cs' ? 'Opravdu chcete vyčistit starší historii aktivit (ponechat posledních 30 dní)?' : 'Really clear older activity history (keep last 30 days)?')) {
      return;
    }
    try {
      await api.clearActivities(30);
      loadData(true);
    } catch (err) {
      console.error('Failed to clear activities', err);
    }
  };

  const getModuleBadge = (mod: string) => {
    switch (mod) {
      case 'auth':
        return {
          label: language === 'cs' ? 'Účty & Bezpečnost' : 'Auth & Security',
          icon: Shield,
          color: 'text-indigo-500 bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-900/50'
        };
      case 'chores':
        return {
          label: language === 'cs' ? 'Domácí práce' : 'Chores',
          icon: CheckCircle2,
          color: 'text-amber-500 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900/50'
        };
      case 'finance':
        return {
          label: language === 'cs' ? 'Finance & Rozpočet' : 'Finance',
          icon: DollarSign,
          color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900/50'
        };
      case 'vehicles':
        return {
          label: language === 'cs' ? 'Vozový park' : 'Garage & Fleet',
          icon: Car,
          color: 'text-blue-500 bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-900/50'
        };
      case 'medicines':
        return {
          label: language === 'cs' ? 'Lékárnička' : 'Medicine Cabinet',
          icon: HeartPulse,
          color: 'text-rose-500 bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900/50'
        };
      case 'documents':
        return {
          label: language === 'cs' ? 'Digitální archiv' : 'Documents',
          icon: FileText,
          color: 'text-purple-500 bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-900/50'
        };
      case 'plants':
        return {
          label: language === 'cs' ? 'Rostliny' : 'Plants',
          icon: Sprout,
          color: 'text-teal-500 bg-teal-50 dark:bg-teal-950/40 border-teal-200 dark:border-teal-900/50'
        };
      case 'pets':
        return {
          label: language === 'cs' ? 'Mazlíčci' : 'Pets',
          icon: PawPrint,
          color: 'text-orange-500 bg-orange-50 dark:bg-orange-950/40 border-orange-200 dark:border-orange-900/50'
        };
      default:
        return {
          label: mod,
          icon: Sparkles,
          color: 'text-zinc-500 bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700'
        };
    }
  };

  // Group activities by date
  const groupedActivities = useMemo(() => {
    const groups: { [dateStr: string]: ActivityLog[] } = {};
    const todayStr = new Date().toISOString().slice(0, 10);
    const yesterdayDate = new Date();
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterdayStr = yesterdayDate.toISOString().slice(0, 10);

    activities.forEach((act) => {
      const actDate = act.created_at.slice(0, 10);
      let groupTitle = actDate;
      if (actDate === todayStr) {
        groupTitle = language === 'cs' ? 'Dnes' : 'Today';
      } else if (actDate === yesterdayStr) {
        groupTitle = language === 'cs' ? 'Včera' : 'Yesterday';
      } else {
        try {
          const d = new Date(act.created_at);
          groupTitle = d.toLocaleDateString(language === 'cs' ? 'cs-CZ' : 'en-US', {
            weekday: 'long',
            day: 'numeric',
            month: 'long'
          });
        } catch {
          groupTitle = actDate;
        }
      }

      if (!groups[groupTitle]) {
        groups[groupTitle] = [];
      }
      groups[groupTitle].push(act);
    });

    return groups;
  }, [activities, language]);

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Top Banner & KPI Cards */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-orange-500/10 dark:bg-orange-500/20 flex items-center justify-center text-orange-600 dark:text-orange-400">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                {language === 'cs' ? 'Historie aktivit' : 'Activity History & Audit Log'}
              </h1>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                {language === 'cs'
                  ? 'Auditní stopa: přehled toho, kdo v rodině co nastavil, splnil či zaevidoval'
                  : 'Household audit trail: who configured, completed, or recorded changes'}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>{language === 'cs' ? 'Obnovit' : 'Refresh'}</span>
          </button>

          {user?.role === 'admin' && (
            <button
              onClick={handleClearHistory}
              title="Promazat záznamy starší než 30 dní"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 text-xs font-semibold text-zinc-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{language === 'cs' ? 'Úklid (>30 dní)' : 'Clean old'}</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Stats */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm">
            <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
              {language === 'cs' ? 'Celkem událostí' : 'Total Activities'}
            </span>
            <div className="text-2xl font-black text-zinc-900 dark:text-zinc-100 mt-1">
              {stats.total_activities.toLocaleString()}
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm">
            <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
              {language === 'cs' ? 'Dnes provedeno' : 'Done Today'}
            </span>
            <div className="text-2xl font-black text-orange-600 dark:text-orange-400 mt-1">
              {stats.activities_today}
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm col-span-2 sm:col-span-1">
            <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
              {language === 'cs' ? 'Nejaktivnější člen' : 'Most Active Member'}
            </span>
            <div className="text-base font-bold text-zinc-900 dark:text-zinc-100 mt-1 truncate">
              {stats.most_active_member || (language === 'cs' ? 'Zatím bez dat' : 'No data yet')}
            </div>
          </div>
        </div>
      )}

      {/* Filters Toolbar */}
      <div className="p-4 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-3">
        {/* Module Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
          {[
            { id: 'all', label: language === 'cs' ? 'Všechny moduly' : 'All Modules' },
            { id: 'auth', label: language === 'cs' ? 'Přihlášení & Účty' : 'Auth & Accounts' },
            { id: 'chores', label: language === 'cs' ? 'Domácí práce' : 'Chores' },
            { id: 'finance', label: language === 'cs' ? 'Finance' : 'Finance' },
            { id: 'vehicles', label: language === 'cs' ? 'Garáž' : 'Garage' },
            { id: 'medicines', label: language === 'cs' ? 'Lékárnička' : 'Medicines' },
            { id: 'documents', label: language === 'cs' ? 'Dokumenty' : 'Documents' },
            { id: 'plants', label: language === 'cs' ? 'Kytky' : 'Plants' },
            { id: 'pets', label: language === 'cs' ? 'Mazlíčci' : 'Pets' }
          ].map((m) => {
            const isSelected = selectedModule === m.id;
            return (
              <button
                key={m.id}
                onClick={() => setSelectedModule(m.id)}
                className={`px-3 py-1.5 rounded-xl font-medium whitespace-nowrap transition cursor-pointer ${
                  isSelected
                    ? 'bg-orange-500 text-white shadow-sm'
                    : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                }`}
              >
                {m.label}
              </button>
            );
          })}
        </div>

        {/* Member dropdown + Search */}
        <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-1">
          {/* Member selector */}
          <div className="w-full sm:w-60">
            <select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value === 'all' ? 'all' : Number(e.target.value))}
              className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition"
            >
              <option value="all">
                {language === 'cs' ? '👤 Všichni členové rodiny' : '👤 All Family Members'}
              </option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.display_name} (@{u.username})
                </option>
              ))}
            </select>
          </div>

          {/* Search bar */}
          <form onSubmit={handleSearch} className="w-full sm:flex-1 relative">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={language === 'cs' ? 'Hledat v popisu akcí...' : 'Search activity descriptions...'}
              className="w-full pl-9 pr-20 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 text-xs focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  loadData(true);
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-[11px] text-zinc-400 hover:text-zinc-600 px-2 py-0.5 rounded-lg"
              >
                {language === 'cs' ? 'Zrušit' : 'Clear'}
              </button>
            )}
          </form>
        </div>
      </div>

      {/* Activities Timeline */}
      {isLoading ? (
        <div className="py-16 text-center">
          <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-zinc-500">{language === 'cs' ? 'Načítám historii aktivit...' : 'Loading activities...'}</p>
        </div>
      ) : activities.length === 0 ? (
        <div className="py-16 text-center bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 p-8">
          <div className="w-14 h-14 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mx-auto text-zinc-400 mb-4">
            <Filter className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-zinc-800 dark:text-zinc-200">
            {language === 'cs' ? 'Žádné aktivity nenalezeny' : 'No activities found'}
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 max-w-sm mx-auto">
            {language === 'cs'
              ? 'Pro zvolené filtry nebyly zaznamenány žádné události. Zkuste vybrat jiný modul nebo vymazat hledání.'
              : 'No activities match the selected filters. Try choosing a different module or clear search.'}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedActivities).map(([dateGroup, items]) => (
            <div key={dateGroup} className="space-y-3">
              <div className="flex items-center gap-2 px-1">
                <Calendar className="w-3.5 h-3.5 text-orange-500" />
                <h3 className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                  {dateGroup}
                </h3>
                <span className="text-[11px] text-zinc-400">({items.length})</span>
              </div>

              <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200/80 dark:border-zinc-800 divide-y divide-zinc-100 dark:divide-zinc-800/60 shadow-sm overflow-hidden">
                {items.map((act) => {
                  const badge = getModuleBadge(act.module);
                  const Icon = badge.icon;
                  const timeStr = act.created_at ? new Date(act.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';

                  return (
                    <div
                      key={act.id}
                      className="p-4 sm:p-5 flex items-start gap-3.5 hover:bg-zinc-50/50 dark:hover:bg-zinc-850/40 transition group"
                    >
                      {/* User Avatar */}
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-xs shadow-sm shrink-0 mt-0.5"
                        style={{ backgroundColor: act.user_avatar_color || '#f97316' }}
                      >
                        {act.user_name.charAt(0).toUpperCase()}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                            {act.user_name}
                          </span>

                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-semibold border ${badge.color}`}>
                            <Icon className="w-3 h-3" />
                            <span>{badge.label}</span>
                          </span>

                          <span className="ml-auto text-[11px] text-zinc-400 flex items-center gap-1 font-mono">
                            <Clock className="w-3 h-3" />
                            {timeStr}
                          </span>
                        </div>

                        <h4 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 leading-snug">
                          {act.title}
                        </h4>

                        {act.description && (
                          <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1 leading-relaxed">
                            {act.description}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Load More Button */}
          {activities.length < total && (
            <div className="text-center pt-4">
              <button
                onClick={handleLoadMore}
                className="px-5 py-2.5 rounded-2xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-xs font-bold text-zinc-700 dark:text-zinc-300 transition shadow-sm"
              >
                {language === 'cs'
                  ? `Načíst další aktivity (${activities.length} z ${total})`
                  : `Load more activities (${activities.length} of ${total})`}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
