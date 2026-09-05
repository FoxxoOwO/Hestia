import React, { useState, useEffect, useMemo } from 'react';
import {
  Wallet, ArrowUpRight, ArrowDownLeft, TrendingUp, TrendingDown,
  Calendar, Plus, FileSpreadsheet, Sparkles, QrCode, CheckCircle2,
  AlertCircle, ShieldCheck, Repeat, PiggyBank, BarChart3, Search,
  Filter, Trash2, Edit, Sliders, ExternalLink, ChevronRight, Check
} from 'lucide-react';
import { api } from '../services/api';
import {
  FinanceMonthlySummary, Transaction, DebtSettlementResponse,
  Subscription, SavingsGoal, User, UserFinanceProfile,
  TransactionCreate, SubscriptionCreate, SavingsGoalCreate,
  DebtSettlementItem, CategorySpendSummary
} from '../types';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../i18n';
import { TransactionModal, CATEGORIES } from '../components/TransactionModal';
import { ReceiptScanModal } from '../components/ReceiptScanModal';
import { ImportModal } from '../components/ImportModal';
import { QrPaymentModal } from '../components/QrPaymentModal';
import { SubscriptionModal } from '../components/SubscriptionModal';
import { SavingsGoalModal } from '../components/SavingsGoalModal';
import { BudgetLimitModal } from '../components/BudgetLimitModal';
import { AddSavingsModal } from '../components/AddSavingsModal';

type TabType = 'overview' | 'settlement' | 'subscriptions' | 'goals' | 'analytics';

export const FinancePage: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();

  // State
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [currentMonth, setCurrentMonth] = useState<string>(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  const [summary, setSummary] = useState<FinanceMonthlySummary | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [settlement, setSettlement] = useState<DebtSettlementResponse | null>(null);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [userProfile, setUserProfile] = useState<UserFinanceProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Bank profile form state
  const [bankAccountInput, setBankAccountInput] = useState('');
  const [ibanInput, setIbanInput] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileSuccessMsg, setProfileSuccessMsg] = useState(false);

  // Modals state
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);

  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [selectedSettlement, setSelectedSettlement] = useState<DebtSettlementItem | null>(null);

  const [isSubModalOpen, setIsSubModalOpen] = useState(false);
  const [editingSub, setEditingSub] = useState<Subscription | null>(null);

  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<SavingsGoal | null>(null);

  const [isAddSavingsModalOpen, setIsAddSavingsModalOpen] = useState(false);
  const [selectedGoalForSavings, setSelectedGoalForSavings] = useState<SavingsGoal | null>(null);

  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
  const [editingCategoryBudget, setEditingCategoryBudget] = useState<{ category: string; limit: number } | null>(null);

  // Filters for transactions list
  const [txSearch, setTxSearch] = useState('');
  const [selectedCatFilter, setSelectedCatFilter] = useState('all');

  // Month choices (current and past 11 months)
  const monthOptions = useMemo(() => {
    const opts = [];
    const now = new Date();
    for (let i = 0; i < 12; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const val = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleDateString('cs-CZ', { month: 'long', year: 'numeric' });
      opts.push({ value: val, label: label.charAt(0).toUpperCase() + label.slice(1) });
    }
    return opts;
  }, []);

  // Fetch data
  const loadData = async () => {
    try {
      setIsLoading(true);
      const [sumData, txData, settlData, subsData, goalsData, usersData, profData] = await Promise.all([
        api.getFinanceSummary(currentMonth),
        api.getFinanceTransactions({ month: currentMonth, limit: 100 }),
        api.getDebtSettlement(currentMonth),
        api.getSubscriptions(),
        api.getSavingsGoals(),
        api.getUsers(),
        api.getUserFinanceProfile().catch(() => ({ user_id: user?.id || 1, bank_account: '', iban: '' }))
      ]);

      setSummary(sumData);
      setTransactions(txData);
      setSettlement(settlData);
      setSubscriptions(subsData);
      setGoals(goalsData);
      setUsers(usersData);
      setUserProfile(profData);
      setBankAccountInput(profData.bank_account || '');
      setIbanInput(profData.iban || '');
    } catch (err) {
      console.error('Failed to load finance data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentMonth]);

  // Handlers for Transactions
  const handleSaveTransaction = async (data: TransactionCreate, id?: number) => {
    if (id) {
      await api.updateTransaction(id, data);
    } else {
      await api.createTransaction(data);
    }
    await loadData();
  };

  const handleDeleteTransaction = async (id: number) => {
    if (window.confirm('Opravdu chcete tuto transakci smazat?')) {
      await api.deleteTransaction(id);
      await loadData();
    }
  };

  // Handlers for Subscriptions
  const handleSaveSubscription = async (data: SubscriptionCreate, id?: number) => {
    if (id) {
      await api.updateSubscription(id, data);
    } else {
      await api.createSubscription(data);
    }
    await loadData();
  };

  const handleDeleteSubscription = async (id: number) => {
    if (window.confirm('Opravdu chcete toto předplatné smazat?')) {
      await api.deleteSubscription(id);
      await loadData();
    }
  };

  // Handlers for Goals
  const handleSaveGoal = async (data: SavingsGoalCreate, id?: number) => {
    if (id) {
      await api.updateSavingsGoal(id, data);
    } else {
      await api.createSavingsGoal(data);
    }
    await loadData();
  };

  const handleDeleteGoal = async (id: number) => {
    if (window.confirm('Opravdu chcete tento cíl smazat?')) {
      await api.deleteSavingsGoal(id);
      await loadData();
    }
  };

  const handleAddSavings = async (goalId: number, amount: number) => {
    await api.addSavingsToGoal(goalId, amount);
    await loadData();
  };

  // Budget envelope limit update
  const handleSaveBudgetLimit = async (category: string, newLimit: number) => {
    await api.setCategoryBudget({
      category,
      monthly_limit: newLimit
    });
    await loadData();
  };

  // Debt settlement
  const handleSettleAll = async () => {
    if (window.confirm(t('finance.mark_all_settled_confirm'))) {
      await api.settleDebts();
      await loadData();
    }
  };

  // Save bank account profile
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSavingProfile(true);
      const res = await api.updateUserFinanceProfile({
        bank_account: bankAccountInput.trim() || undefined,
        iban: ibanInput.trim() || undefined
      });
      setUserProfile(res);
      setProfileSuccessMsg(true);
      setTimeout(() => setProfileSuccessMsg(false), 3000);
      // Reload settlement to get updated SPAYD strings
      const settlData = await api.getDebtSettlement(currentMonth);
      setSettlement(settlData);
    } catch (err) {
      console.error('Failed to update bank profile:', err);
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Filtered transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      const matchesCat = selectedCatFilter === 'all' || t.category === selectedCatFilter;
      const matchesSearch = !txSearch.trim() || 
        t.title.toLowerCase().includes(txSearch.toLowerCase()) ||
        (t.notes && t.notes.toLowerCase().includes(txSearch.toLowerCase()));
      return matchesCat && matchesSearch;
    });
  }, [transactions, selectedCatFilter, txSearch]);

  // Subscriptions monthly sum
  const subscriptionsMonthlyTotal = useMemo(() => {
    return subscriptions.reduce((acc, s) => acc + (s.monthly_equivalent || 0), 0);
  }, [subscriptions]);

  const currentUserId = user?.id || (users[0]?.id ?? 1);

  // Category Icon helper
  const getCategoryMeta = (catId: string) => {
    const found = CATEGORIES.find(c => c.id === catId);
    return found || { id: catId, nameCs: catId, icon: '🏷️' };
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl text-white shadow-md shadow-orange-500/20">
              <Wallet className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800 dark:text-white">
                {t('finance.title')}
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {t('finance.subtitle')}
              </p>
            </div>
          </div>
        </div>

        {/* Action Controls & Month Selector */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Month Selector */}
          <div className="relative">
            <select
              value={currentMonth}
              onChange={(e) => setCurrentMonth(e.target.value)}
              className="appearance-none bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-2.5 pr-9 text-sm font-semibold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-sm"
            >
              {monthOptions.map((m) => (
                <option key={m.value} value={m.value}>
                  📅 {m.label}
                </option>
              ))}
            </select>
          </div>

          {/* AI Scan Receipt */}
          <button
            onClick={() => setIsReceiptModalOpen(true)}
            className="px-3.5 py-2.5 bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/40 dark:hover:bg-purple-900/60 text-purple-700 dark:text-purple-300 rounded-2xl text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <Sparkles className="w-4 h-4" />
            <span>{t('finance.scan_receipt')}</span>
          </button>

          {/* Import Statement */}
          <button
            onClick={() => setIsImportModalOpen(true)}
            className="px-3.5 py-2.5 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 rounded-2xl text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>{t('finance.import_statement')}</span>
          </button>

          {/* Add Transaction */}
          <button
            onClick={() => {
              setEditingTx(null);
              setIsTxModalOpen(true);
            }}
            className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white rounded-2xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-md shadow-orange-500/20"
          >
            <Plus className="w-4 h-4" />
            <span>{t('finance.add_transaction')}</span>
          </button>
        </div>
      </div>

      {/* Top 4 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Income */}
        <div className="p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm relative overflow-hidden group">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              {t('finance.total_income')}
            </span>
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
              <ArrowDownLeft className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-800 dark:text-white">
            {summary?.total_income.toLocaleString('cs-CZ') || 0} Kč
          </div>
          <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 font-medium">
            Mzdy a ostatní příjmy
          </p>
        </div>

        {/* Expense */}
        <div className="p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm relative overflow-hidden group">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              {t('finance.total_expense')}
            </span>
            <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-800 dark:text-white">
            {summary?.total_expense.toLocaleString('cs-CZ') || 0} Kč
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            Z rozpočtu {summary?.total_budget.toLocaleString('cs-CZ') || 0} Kč
          </p>
        </div>

        {/* Net Balance */}
        <div className="p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm relative overflow-hidden group">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              {t('finance.net_balance')}
            </span>
            <div className={`p-2 rounded-xl ${
              (summary?.net_balance || 0) >= 0
                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400'
                : 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400'
            }`}>
              {(summary?.net_balance || 0) >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
            </div>
          </div>
          <div className={`text-2xl font-black ${
            (summary?.net_balance || 0) >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
          }`}>
            {(summary?.net_balance || 0) > 0 ? '+' : ''}
            {summary?.net_balance.toLocaleString('cs-CZ') || 0} Kč
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            {(summary?.net_balance || 0) >= 0 ? 'Ušetřeno v tomto měsíci' : 'Přečerpáno v tomto měsíci'}
          </p>
        </div>

        {/* All-Months Historical Average Spending */}
        <div className="p-5 bg-gradient-to-br from-slate-900 to-indigo-950 text-white rounded-3xl border border-slate-800 shadow-sm relative overflow-hidden group">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-indigo-200">
              {t('finance.all_months_average')}
            </span>
            <div className="p-2 rounded-xl bg-white/10 text-amber-300">
              <BarChart3 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-white">
            {summary?.all_months_average_expense.toLocaleString('cs-CZ') || 0} Kč
          </div>
          <div className="mt-1 flex items-center gap-1.5 text-[11px] text-indigo-300">
            <span>Z {summary?.distinct_months_count || 1} evidovaných měsíců</span>
            {summary && summary.total_expense > 0 && summary.all_months_average_expense > 0 && (
              <span className={`px-1.5 py-0.5 rounded font-bold text-[10px] ${
                summary.total_expense > summary.all_months_average_expense
                  ? 'bg-rose-500/30 text-rose-300'
                  : 'bg-emerald-500/30 text-emerald-300'
              }`}>
                {summary.total_expense > summary.all_months_average_expense ? '▲ Vyšší' : '▼ Nižší'}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-1 overflow-x-auto">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'overview'
              ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Wallet className="w-4 h-4" />
          {t('finance.tab_overview')}
        </button>

        <button
          onClick={() => setActiveTab('settlement')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'settlement'
              ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <QrCode className="w-4 h-4" />
          {t('finance.tab_settlement')}
          {settlement && settlement.settlements.length > 0 && (
            <span className="px-1.5 py-0.5 rounded-full bg-white text-amber-600 text-[10px] font-black">
              {settlement.settlements.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('subscriptions')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'subscriptions'
              ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Repeat className="w-4 h-4" />
          {t('finance.tab_subscriptions')}
          <span className="text-[10px] opacity-75">
            ({subscriptions.length})
          </span>
        </button>

        <button
          onClick={() => setActiveTab('goals')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'goals'
              ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <PiggyBank className="w-4 h-4" />
          {t('finance.tab_goals')}
          <span className="text-[10px] opacity-75">
            ({goals.length})
          </span>
        </button>

        <button
          onClick={() => setActiveTab('analytics')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'analytics'
              ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          {t('finance.tab_analytics')}
        </button>
      </div>

      {/* Tab 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Envelope Method (Obálková metoda) Category Budgets */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="font-bold text-lg text-slate-800 dark:text-white flex items-center gap-2">
                  <span>✉️</span> {t('finance.budget_status')}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Sledování čerpání jednotlivých kategorií a limitů rozpočtu
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {summary?.categories.map((cat) => {
                const meta = getCategoryMeta(cat.category);
                const limit = cat.budget_limit || 4000;
                const pct = Math.min(150, Math.round((cat.current_month_amount / Math.max(1, limit)) * 100));
                
                // Color status: green < 80%, yellow 80-100%, red > 100%
                let barColor = 'bg-emerald-500';
                let badgeClass = 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40';
                if (pct > 100) {
                  barColor = 'bg-rose-500';
                  badgeClass = 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40';
                } else if (pct >= 80) {
                  barColor = 'bg-amber-500';
                  badgeClass = 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40';
                }

                return (
                  <div
                    key={cat.category}
                    className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800/80 hover:shadow-sm transition-all"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{meta.icon}</span>
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                          {t(`finance.categories.${cat.category}`)}
                        </span>
                      </div>
                      <button
                        onClick={() => {
                          setEditingCategoryBudget({ category: cat.category, limit });
                          setIsBudgetModalOpen(true);
                        }}
                        className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded hover:bg-slate-200/50 dark:hover:bg-slate-700/50"
                        title={t('finance.edit_budget')}
                      >
                        <Sliders className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex items-baseline justify-between text-xs mb-1.5">
                      <span className="font-extrabold text-sm text-slate-900 dark:text-white">
                        {cat.current_month_amount.toLocaleString('cs-CZ')} Kč
                      </span>
                      <span className="text-slate-400 text-[11px]">
                        z {limit.toLocaleString('cs-CZ')} Kč ({pct}%)
                      </span>
                    </div>

                    {/* Progress bar */}
                    <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                        style={{ width: `${Math.min(100, pct)}%` }}
                      />
                    </div>

                    <div className="mt-2.5 flex items-center justify-between text-[11px]">
                      <span className={`px-2 py-0.5 rounded-md font-semibold ${badgeClass}`}>
                        {pct > 100
                          ? `Překročeno o ${(cat.current_month_amount - limit).toLocaleString('cs-CZ')} Kč`
                          : `Zbývá ${(limit - cat.current_month_amount).toLocaleString('cs-CZ')} Kč`}
                      </span>
                      <span className="text-slate-400 dark:text-slate-500 text-[10px]">
                        průměr {cat.historical_monthly_average.toLocaleString('cs-CZ')} Kč
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Transactions list */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-5">
              <div>
                <h3 className="font-bold text-lg text-slate-800 dark:text-white">
                  {t('finance.recent_transactions')}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Přehled evidovaných výdajů a příjmů za zvolený měsíc
                </p>
              </div>

              {/* Filters */}
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={txSearch}
                    onChange={(e) => setTxSearch(e.target.value)}
                    placeholder="Hledat platbu..."
                    className="pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-amber-500 dark:text-white"
                  />
                </div>

                <select
                  value={selectedCatFilter}
                  onChange={(e) => setSelectedCatFilter(e.target.value)}
                  className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-amber-500 dark:text-white"
                >
                  <option value="all">Všechny kategorie</option>
                  {CATEGORIES.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.icon} {c.nameCs}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {filteredTransactions.length === 0 ? (
              <div className="py-12 text-center text-slate-400 dark:text-slate-500">
                <Wallet className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm font-medium">{t('finance.no_transactions')}</p>
                <button
                  onClick={() => {
                    setEditingTx(null);
                    setIsTxModalOpen(true);
                  }}
                  className="mt-3 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  {t('finance.add_transaction')}
                </button>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredTransactions.map((t) => {
                  const meta = getCategoryMeta(t.category);
                  const isIncome = t.transaction_type === 'income';

                  return (
                    <div
                      key={t.id}
                      className="py-3.5 flex items-center justify-between hover:bg-slate-50/60 dark:hover:bg-slate-800/30 px-2 rounded-2xl transition-colors group"
                    >
                      <div className="flex items-center gap-3.5">
                        <div className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-lg shrink-0">
                          {meta.icon}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm text-slate-800 dark:text-slate-100">
                              {t.title}
                            </span>
                            {t.is_shared && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400">
                                Sdíleno
                              </span>
                            )}
                            {t.is_settled && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
                                Vyrovnáno
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                            <span>{t.date}</span>
                            <span>•</span>
                            <span>{t.payer?.display_name || t.payer?.username || 'Člen'}</span>
                            {t.notes && (
                              <>
                                <span>•</span>
                                <span className="truncate max-w-xs">{t.notes}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className={`font-bold text-sm whitespace-nowrap ${
                          isIncome ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-800 dark:text-slate-100'
                        }`}>
                          {isIncome ? '+' : '-'}{t.amount.toLocaleString('cs-CZ')} Kč
                        </span>

                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => {
                              setEditingTx(t);
                              setIsTxModalOpen(true);
                            }}
                            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                            title="Upravit"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteTransaction(t.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30"
                            title="Smazat"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: DEBT SETTLEMENT ("KDO KOMU DLUŽÍ") & SPAYD QR */}
      {activeTab === 'settlement' && (
        <div className="space-y-6">
          {/* Header Card */}
          <div className="bg-gradient-to-r from-emerald-600 to-teal-700 rounded-3xl p-6 text-white shadow-lg shadow-teal-700/10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <ShieldCheck className="w-5 h-5 text-emerald-200" />
                <h3 className="text-xl font-bold">{t('finance.debt_settlement_title')}</h3>
              </div>
              <p className="text-xs text-emerald-100 max-w-xl">
                {t('finance.debt_settlement_subtitle')}
              </p>
            </div>
            {settlement && settlement.settlements.length > 0 && (
              <button
                onClick={handleSettleAll}
                className="px-4 py-2.5 bg-white text-emerald-800 hover:bg-emerald-50 rounded-2xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5 whitespace-nowrap self-start md:self-auto"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                {t('finance.mark_all_settled')}
              </button>
            )}
          </div>

          {/* Member balances */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {settlement?.balances.map((b) => {
              const isPositive = b.net_balance > 0.01;
              const isZero = Math.abs(b.net_balance) <= 0.01;

              return (
                <div
                  key={b.user_id}
                  className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div
                      className="w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-white text-sm shadow-sm"
                      style={{ backgroundColor: b.avatar_color || '#f97316' }}
                    >
                      {b.user_name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-slate-800 dark:text-white">
                        {b.user_name}
                      </h4>
                      <span className="text-[11px] text-slate-400">
                        {isZero ? 'Vyrovnáno' : (isPositive ? t('finance.is_owed') : t('finance.owes'))}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-500 dark:text-slate-400 mb-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex justify-between">
                      <span>{t('finance.paid')}:</span>
                      <span className="font-semibold text-slate-700 dark:text-slate-200">
                        {b.paid_total.toLocaleString('cs-CZ')} Kč
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>{t('finance.share')}:</span>
                      <span className="font-semibold text-slate-700 dark:text-slate-200">
                        {b.share_total.toLocaleString('cs-CZ')} Kč
                      </span>
                    </div>
                  </div>

                  <div className={`p-3 rounded-2xl flex items-center justify-between text-xs font-bold ${
                    isZero
                      ? 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                      : isPositive
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400'
                      : 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400'
                  }`}>
                    <span>Bilance:</span>
                    <span className="text-sm">
                      {b.net_balance > 0 ? '+' : ''}{b.net_balance.toLocaleString('cs-CZ')} Kč
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Suggested Transfers & 1-Click SPAYD QR codes */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
            <h3 className="font-bold text-lg text-slate-800 dark:text-white mb-4">
              {t('finance.suggested_transfers')}
            </h3>

            {settlement?.settlements.length === 0 ? (
              <div className="py-8 text-center text-emerald-600 dark:text-emerald-400 space-y-2">
                <CheckCircle2 className="w-12 h-12 mx-auto opacity-80" />
                <p className="font-bold text-base">{t('finance.settled_all')}</p>
                <p className="text-xs text-slate-400">
                  Nikdo nikomu v této chvíli nedluží žádné peníze za sdílené nákupy.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {settlement?.settlements.map((s, idx) => (
                  <div
                    key={idx}
                    className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 rounded-2xl">
                        <QrCode className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-slate-800 dark:text-white">
                          <span className="text-rose-600 dark:text-rose-400">{s.from_user_name}</span> zaplatí{' '}
                          <span className="text-emerald-600 dark:text-emerald-400">{s.to_user_name}</span>
                        </div>
                        <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                          {s.to_user_account ? (
                            <span>Účet: {s.to_user_account}</span>
                          ) : s.to_user_iban ? (
                            <span>IBAN: {s.to_user_iban}</span>
                          ) : (
                            <span className="text-amber-500">Číslo účtu zatím nenastaveno</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 self-end sm:self-auto">
                      <span className="font-black text-lg text-emerald-600 dark:text-emerald-400">
                        {s.amount.toLocaleString('cs-CZ')} Kč
                      </span>
                      <button
                        onClick={() => {
                          setSelectedSettlement(s);
                          setIsQrModalOpen(true);
                        }}
                        className="px-3.5 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
                      >
                        <QrCode className="w-4 h-4" />
                        {t('finance.show_qr')}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* User's Bank Account Profile for QR payments */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
            <h3 className="font-bold text-base text-slate-800 dark:text-white mb-1">
              {t('finance.my_bank_profile')}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Zadejte své bankovní spojení, aby ostatní členové mohli vygenerovat QR kód přímo na váš účet.
            </p>

            <form onSubmit={handleSaveProfile} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {t('finance.bank_account')}
                </label>
                <input
                  type="text"
                  value={bankAccountInput}
                  onChange={(e) => setBankAccountInput(e.target.value)}
                  placeholder="např. 123456789/0800"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {t('finance.iban')}
                </label>
                <input
                  type="text"
                  value={ibanInput}
                  onChange={(e) => setIbanInput(e.target.value)}
                  placeholder="CZ..."
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:text-white"
                />
              </div>

              <div className="flex items-end">
                <button
                  type="submit"
                  disabled={isSavingProfile}
                  className="w-full py-2.5 px-4 bg-slate-800 dark:bg-slate-700 hover:bg-slate-900 dark:hover:bg-slate-600 text-white rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  {profileSuccessMsg ? t('finance.profile_saved') : t('finance.save_profile')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tab 3: SUBSCRIPTIONS */}
      {activeTab === 'subscriptions' && (
        <div className="space-y-6">
          {/* Subscriptions Overview Card */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h3 className="font-bold text-lg text-slate-800 dark:text-white">
                {t('finance.subscriptions_title')}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Sledování měsíčních a ročních fixních poplatků a blížících se plateb
              </p>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right">
                <span className="text-xs text-slate-400 block">{t('finance.monthly_total')}</span>
                <span className="text-xl font-bold text-indigo-600 dark:text-indigo-400">
                  {subscriptionsMonthlyTotal.toLocaleString('cs-CZ')} Kč
                </span>
                <span className="text-[10px] text-slate-400 block">
                  {t('finance.yearly_projection')}: {(subscriptionsMonthlyTotal * 12).toLocaleString('cs-CZ')} Kč
                </span>
              </div>

              <button
                onClick={() => {
                  setEditingSub(null);
                  setIsSubModalOpen(true);
                }}
                className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-md"
              >
                <Plus className="w-4 h-4" />
                {t('finance.add_subscription')}
              </button>
            </div>
          </div>

          {/* Subscriptions Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {subscriptions.map((sub) => {
              const meta = getCategoryMeta(sub.category);
              const isDueSoon = sub.days_until_billing !== null && sub.days_until_billing !== undefined && sub.days_until_billing <= 5;

              return (
                <div
                  key={sub.id}
                  className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between hover:shadow-md transition-all group"
                >
                  <div>
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-lg">
                          {meta.icon}
                        </div>
                        <div>
                          <h4 className="font-bold text-sm text-slate-800 dark:text-white">
                            {sub.name}
                          </h4>
                          <span className="text-xs text-slate-400 capitalize">
                            {sub.billing_cycle === 'monthly' ? 'Měsíčně' : sub.billing_cycle === 'yearly' ? 'Ročně' : 'Čtvrtletně'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => {
                            setEditingSub(sub);
                            setIsSubModalOpen(true);
                          }}
                          className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteSubscription(sub.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="flex items-baseline justify-between mb-3">
                      <span className="text-2xl font-black text-slate-900 dark:text-white">
                        {sub.amount.toLocaleString('cs-CZ')} Kč
                      </span>
                      {sub.billing_cycle !== 'monthly' && (
                        <span className="text-xs text-slate-400">
                          ~{sub.monthly_equivalent.toLocaleString('cs-CZ')} Kč/měsíc
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                    <span className="text-slate-400">Příští platba:</span>
                    <span className={`font-semibold px-2 py-0.5 rounded-md ${
                      isDueSoon
                        ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 animate-pulse'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                    }`}>
                      {sub.next_billing_date} ({sub.days_until_billing !== null && sub.days_until_billing !== undefined && sub.days_until_billing >= 0 ? `za ${sub.days_until_billing} dní` : 'dnes'})
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 4: SAVINGS GOALS */}
      {activeTab === 'goals' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-lg text-slate-800 dark:text-white">
                {t('finance.goals_title')}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Společné rodinné cíle, rezervy a dovolené
              </p>
            </div>

            <button
              onClick={() => {
                setEditingGoal(null);
                setIsGoalModalOpen(true);
              }}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-md shadow-emerald-600/20"
            >
              <Plus className="w-4 h-4" />
              {t('finance.add_goal')}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {goals.map((goal) => {
              const pct = goal.progress_percentage || Math.min(100, Math.round((goal.current_amount / Math.max(1, goal.target_amount)) * 100));

              return (
                <div
                  key={goal.id}
                  className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between hover:shadow-md transition-all group"
                >
                  <div>
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl shadow-sm"
                          style={{ backgroundColor: `${goal.color}20`, color: goal.color }}
                        >
                          {goal.icon === 'Palmtree' ? '🌴' : goal.icon === 'Car' ? '🚗' : goal.icon === 'Home' ? '🏠' : goal.icon === 'Laptop' ? '💻' : goal.icon === 'Gift' ? '🎁' : goal.icon === 'Heart' ? '❤️' : '🐷'}
                        </div>
                        <div>
                          <h4 className="font-bold text-base text-slate-800 dark:text-white">
                            {goal.title}
                          </h4>
                          {goal.target_date && (
                            <span className="text-[11px] text-slate-400 block">
                              Cíl do: {goal.target_date}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => {
                            setEditingGoal(goal);
                            setIsGoalModalOpen(true);
                          }}
                          className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteGoal(goal.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mb-4">
                      <div className="flex justify-between items-baseline text-xs mb-1.5">
                        <span className="font-extrabold text-slate-800 dark:text-white text-base">
                          {goal.current_amount.toLocaleString('cs-CZ')} Kč
                        </span>
                        <span className="text-slate-400 text-xs">
                          z {goal.target_amount.toLocaleString('cs-CZ')} Kč ({pct}%)
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-slate-800 h-3 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{
                            width: `${pct}%`,
                            backgroundColor: goal.color || '#10b981'
                          }}
                        />
                      </div>
                    </div>

                    {goal.notes && (
                      <p className="text-xs text-slate-400 mb-4 line-clamp-2">
                        {goal.notes}
                      </p>
                    )}
                  </div>

                  {/* 1-Click Deposit Button */}
                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    {goal.is_completed ? (
                      <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4" /> {t('finance.goal_completed')}
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400">
                        Zbývá naspořit {(goal.target_amount - goal.current_amount).toLocaleString('cs-CZ')} Kč
                      </span>
                    )}

                    <button
                      onClick={() => {
                        setSelectedGoalForSavings(goal);
                        setIsAddSavingsModalOpen(true);
                      }}
                      className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 rounded-xl text-xs font-bold flex items-center gap-1 transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      {t('finance.add_money')}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 5: LONG-TERM ANALYTICS & HISTORICAL AVERAGES */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
            <div className="mb-5">
              <h3 className="font-bold text-lg text-slate-800 dark:text-white">
                {t('finance.analytics_title')}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {t('finance.analytics_subtitle')} (výpočet ze všech {summary?.distinct_months_count || 1} evidovaných měsíců)
              </p>
            </div>

            <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 dark:bg-slate-800/90 text-slate-600 dark:text-slate-300 font-bold">
                  <tr>
                    <th className="py-3 px-4">{t('finance.category')}</th>
                    <th className="py-3 px-4 text-right">{t('finance.current_month')}</th>
                    <th className="py-3 px-4 text-right">{t('finance.historical_average')}</th>
                    <th className="py-3 px-4 text-right">{t('finance.diff_from_average')}</th>
                    <th className="py-3 px-4 text-right">{t('finance.limit')}</th>
                    <th className="py-3 px-4 text-center">Akce</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {summary?.categories.map((c) => {
                    const meta = getCategoryMeta(c.category);
                    const diffPct = c.difference_from_average_percent;

                    return (
                      <tr key={c.category} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <span className="text-base">{meta.icon}</span>
                            <span className="font-semibold text-slate-800 dark:text-slate-200">
                              {t(`finance.categories.${c.category}`)}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-slate-900 dark:text-white">
                          {c.current_month_amount.toLocaleString('cs-CZ')} Kč
                        </td>
                        <td className="py-3 px-4 text-right text-slate-500 dark:text-slate-400 font-medium">
                          {c.historical_monthly_average.toLocaleString('cs-CZ')} Kč
                        </td>
                        <td className="py-3 px-4 text-right">
                          {diffPct !== null && diffPct !== undefined ? (
                            <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                              diffPct > 10
                                ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400'
                                : diffPct < -10
                                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                            }`}>
                              {diffPct > 0 ? `+${diffPct}%` : `${diffPct}%`}
                            </span>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right font-medium text-slate-600 dark:text-slate-300">
                          {(c.budget_limit || 4000).toLocaleString('cs-CZ')} Kč
                        </td>
                        <td className="py-3 px-4 text-center">
                          <button
                            onClick={() => {
                              setEditingCategoryBudget({ category: c.category, limit: c.budget_limit || 4000 });
                              setIsBudgetModalOpen(true);
                            }}
                            className="p-1 text-slate-400 hover:text-amber-600 rounded hover:bg-slate-100 dark:hover:bg-slate-800"
                            title={t('finance.edit_budget')}
                          >
                            <Sliders className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODALS */}
      <TransactionModal
        isOpen={isTxModalOpen}
        onClose={() => {
          setIsTxModalOpen(false);
          setEditingTx(null);
        }}
        transaction={editingTx}
        users={users}
        currentUserId={currentUserId}
        onSave={handleSaveTransaction}
      />

      <ReceiptScanModal
        isOpen={isReceiptModalOpen}
        onClose={() => setIsReceiptModalOpen(false)}
        onApplyReceipt={(receipt) => {
          setEditingTx(null);
          setIsTxModalOpen(true);
          // Wait for modal render and pre-populate via timeout or transaction object
          setTimeout(() => {
            setIsTxModalOpen(true);
          }, 50);
        }}
      />

      <ImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        users={users}
        currentUserId={currentUserId}
        onImportSuccess={loadData}
      />

      <QrPaymentModal
        isOpen={isQrModalOpen}
        onClose={() => {
          setIsQrModalOpen(false);
          setSelectedSettlement(null);
        }}
        settlement={selectedSettlement}
      />

      <SubscriptionModal
        isOpen={isSubModalOpen}
        onClose={() => {
          setIsSubModalOpen(false);
          setEditingSub(null);
        }}
        subscription={editingSub}
        users={users}
        currentUserId={currentUserId}
        onSave={handleSaveSubscription}
      />

      <SavingsGoalModal
        isOpen={isGoalModalOpen}
        onClose={() => {
          setIsGoalModalOpen(false);
          setEditingGoal(null);
        }}
        goal={editingGoal}
        onSave={handleSaveGoal}
      />

      <BudgetLimitModal
        isOpen={isBudgetModalOpen}
        onClose={() => {
          setIsBudgetModalOpen(false);
          setEditingCategoryBudget(null);
        }}
        category={editingCategoryBudget?.category || 'groceries'}
        currentLimit={editingCategoryBudget?.limit || 4000}
        onSave={handleSaveBudgetLimit}
      />

      <AddSavingsModal
        isOpen={isAddSavingsModalOpen}
        onClose={() => {
          setIsAddSavingsModalOpen(false);
          setSelectedGoalForSavings(null);
        }}
        goal={selectedGoalForSavings}
        onAdd={handleAddSavings}
      />
    </div>
  );
};
