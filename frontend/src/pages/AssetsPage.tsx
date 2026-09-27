import React, { useState, useEffect, useMemo } from 'react';
import { 
  Wrench, Plus, Search, Shield, ShieldCheck, ShieldAlert, 
  MapPin, FileText, ExternalLink, Filter, Sparkles, AlertTriangle,
  CheckCircle2, Store, Calendar, X, Layers
} from 'lucide-react';
import { Asset, AssetStats, AssetCategory, AssetRoom, WarrantyStatus } from '../types';
import { api } from '../services/api';
import { useTranslation } from '../i18n';
import { AssetEditModal } from '../components/AssetEditModal';
import { AssetDetailModal } from '../components/AssetDetailModal';

const CATEGORY_FILTERS: { id: string; label: string }[] = [
  { id: 'all', label: 'Všechny kategorie' },
  { id: 'large_appliance', label: 'Velké spotřebiče' },
  { id: 'small_appliance', label: 'Malé spotřebiče' },
  { id: 'electronics', label: 'Elektronika' },
  { id: 'tools_garden', label: 'Nářadí a zahrada' },
  { id: 'plumbing_hvac', label: 'Topení a klima' },
  { id: 'furniture', label: 'Nábytek' },
  { id: 'other', label: 'Ostatní' },
];

const ROOM_PILLS: { id: string; label: string }[] = [
  { id: 'all', label: 'Všechny místnosti' },
  { id: 'kitchen', label: 'Kuchyň' },
  { id: 'bathroom', label: 'Koupelna' },
  { id: 'living_room', label: 'Obývací pokoj' },
  { id: 'bedroom', label: 'Ložnice' },
  { id: 'garage', label: 'Garáž' },
  { id: 'workshop', label: 'Dílna' },
  { id: 'garden', label: 'Zahrada' },
];

export const AssetsPage: React.FC = () => {
  const { t } = useTranslation();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [stats, setStats] = useState<AssetStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRoom, setSelectedRoom] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedWarranty, setSelectedWarranty] = useState<string>('all');

  // Modals state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [detailAsset, setDetailAsset] = useState<Asset | null>(null);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [assetsData, statsData] = await Promise.all([
        api.getAssets(),
        api.getAssetStats(),
      ]);
      setAssets(assetsData);
      setStats(statsData);
    } catch (err) {
      console.error('Failed to load assets data', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSaveAsset = (saved: Asset) => {
    setAssets(prev => {
      const idx = prev.findIndex(a => a.id === saved.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = saved;
        return next;
      }
      return [saved, ...prev];
    });
    api.getAssetStats().then(setStats).catch(() => {});
  };

  const handleDeleteAsset = async (id: number) => {
    try {
      await api.deleteAsset(id);
      setAssets(prev => prev.filter(a => a.id !== id));
      if (detailAsset?.id === id) setDetailAsset(null);
      api.getAssetStats().then(setStats).catch(() => {});
    } catch (err) {
      console.error('Failed to delete asset', err);
    }
  };

  // Filtered assets list
  const filteredAssets = useMemo(() => {
    return assets.filter(item => {
      if (selectedRoom !== 'all' && item.room !== selectedRoom) return false;
      if (selectedCategory !== 'all' && item.category !== selectedCategory) return false;
      if (selectedWarranty !== 'all') {
        if (selectedWarranty === 'valid' && item.warranty_status !== 'valid' && item.warranty_status !== 'expiring_soon') return false;
        if (selectedWarranty === 'expiring_soon' && item.warranty_status !== 'expiring_soon') return false;
        if (selectedWarranty === 'expired' && item.warranty_status !== 'expired') return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = item.name.toLowerCase().includes(q);
        const matchesBrand = (item.brand || '').toLowerCase().includes(q);
        const matchesModel = (item.model_number || '').toLowerCase().includes(q);
        const matchesSerial = (item.serial_number || '').toLowerCase().includes(q);
        const matchesVendor = (item.store_or_vendor || '').toLowerCase().includes(q);
        return matchesName || matchesBrand || matchesModel || matchesSerial || matchesVendor;
      }
      return true;
    });
  }, [assets, selectedRoom, selectedCategory, selectedWarranty, searchQuery]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <Wrench className="w-7 h-7 text-orange-500" />
            <span>Majetek a spotřebiče</span>
          </h1>
          <p className="text-xs md:text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Evidence domácího vybavení, odpočet záruk, PDF manuály a servisní záznamy
          </p>
        </div>

        <button
          onClick={() => {
            setEditingAsset(null);
            setIsEditModalOpen(true);
          }}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold text-white bg-orange-500 hover:bg-orange-600 shadow-md shadow-orange-500/20 active:scale-95 transition self-start md:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Přidat spotřebič</span>
        </button>
      </div>

      {/* KPI Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* Total assets */}
          <div className="p-4 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 block">
                Celkem majetku
              </span>
              <span className="text-2xl font-extrabold text-zinc-900 dark:text-zinc-100 mt-0.5 block">
                {stats.total_assets}
              </span>
              <span className="text-[10px] text-zinc-500">v evidenci domu</span>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-orange-500/10 text-orange-600 dark:text-orange-400 flex items-center justify-center">
              <Layers className="w-5 h-5" />
            </div>
          </div>

          {/* Total Value */}
          <div className="p-4 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 block">
                Celková hodnota
              </span>
              <span className="text-xl sm:text-2xl font-extrabold text-zinc-900 dark:text-zinc-100 mt-0.5 block">
                {stats.total_value.toLocaleString('cs-CZ')} Kč
              </span>
              <span className="text-[10px] text-zinc-500">pořizovací cena</span>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Store className="w-5 h-5" />
            </div>
          </div>

          {/* Active Warranties */}
          <div className="p-4 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 block">
                V záruce
              </span>
              <span className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5 block">
                {stats.active_warranties}
              </span>
              <span className="text-[10px] text-zinc-500">platných záruk</span>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>

          {/* Expiring soon alert */}
          <div className={`p-4 rounded-3xl border shadow-sm flex items-center justify-between transition-all ${
            stats.expiring_soon_warranties > 0
              ? 'bg-amber-500/10 border-amber-300 dark:border-amber-700/60 ring-1 ring-amber-400/20'
              : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800'
          }`}>
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 block">
                Končí do 30 dnů
              </span>
              <span className={`text-2xl font-extrabold mt-0.5 block ${
                stats.expiring_soon_warranties > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-zinc-900 dark:text-zinc-100'
              }`}>
                {stats.expiring_soon_warranties}
              </span>
              <span className="text-[10px] text-zinc-500">
                {stats.expiring_soon_warranties > 0 ? 'vyžaduje kontrolu!' : 'žádná záruka nekončí'}
              </span>
            </div>
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
              stats.expiring_soon_warranties > 0
                ? 'bg-amber-500 text-white shadow-md shadow-amber-500/30 animate-pulse'
                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400'
            }`}>
              <ShieldAlert className="w-5 h-5" />
            </div>
          </div>
        </div>
      )}

      {/* Filters Card */}
      <div className="p-4 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-3.5">
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          {/* Search input */}
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Hledat název, značku, model, S/N..."
              className="w-full pl-10 pr-4 py-2 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/80 text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Dropdown Filters */}
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <select
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
              className="text-xs px-3 py-2 rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/60 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              {CATEGORY_FILTERS.map(c => (
                <option key={c.id} value={c.id}>{c.label}</option>
              ))}
            </select>

            <select
              value={selectedWarranty}
              onChange={e => setSelectedWarranty(e.target.value)}
              className="text-xs px-3 py-2 rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/60 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="all">Všechny záruky</option>
              <option value="valid">V záruce</option>
              <option value="expiring_soon">Končí brzy (do 30 dní)</option>
              <option value="expired">Po záruce</option>
            </select>
          </div>
        </div>

        {/* Room Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
          {ROOM_PILLS.map(r => (
            <button
              key={r.id}
              onClick={() => setSelectedRoom(r.id)}
              className={`px-3 py-1.5 rounded-xl whitespace-nowrap font-medium transition ${
                selectedRoom === r.id
                  ? 'bg-orange-500 text-white shadow-sm font-semibold'
                  : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* Asset Cards Grid */}
      {isLoading ? (
        <div className="py-16 text-center text-zinc-400">
          Načítám evidenci majetku...
        </div>
      ) : filteredAssets.length === 0 ? (
        <div className="py-16 text-center bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 p-8 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-zinc-400 flex items-center justify-center mx-auto">
            <Wrench className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-zinc-800 dark:text-zinc-200">
            {assets.length === 0 ? 'Zatím nemáte v evidenci žádné spotřebiče' : 'Žádné položky neodpovídají filtrům'}
          </h3>
          <p className="text-xs text-zinc-500 max-w-sm mx-auto">
            {assets.length === 0
              ? 'Přidejte svou myčku, pračku, ledničku nebo zahradní sekačku a mějte přehled o zárukách a návodech.'
              : 'Zkuste upravit vyhledávací dotaz nebo vybrat jinou místnost.'}
          </p>
          {assets.length === 0 && (
            <button
              onClick={() => {
                setEditingAsset(null);
                setIsEditModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-orange-500 text-white text-xs font-bold shadow-md shadow-orange-500/20 hover:bg-orange-600 transition"
            >
              <Plus className="w-4 h-4" />
              <span>Přidat první spotřebič</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAssets.map(asset => (
            <div
              key={asset.id}
              onClick={() => setDetailAsset(asset)}
              className="p-4 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group"
            >
              <div className="space-y-2.5">
                {/* Top Badges */}
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-orange-500" />
                    {asset.room}
                  </span>

                  {/* Warranty Status Badge */}
                  {asset.warranty_status === 'valid' ? (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" />
                      Zbývá {asset.days_until_warranty_expiry} d.
                    </span>
                  ) : asset.warranty_status === 'expiring_soon' ? (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-500 text-white flex items-center gap-1 shadow-sm animate-pulse">
                      <ShieldAlert className="w-3 h-3" />
                      Končí za {asset.days_until_warranty_expiry} d.!
                    </span>
                  ) : asset.warranty_status === 'expired' ? (
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-400">
                      Po záruce
                    </span>
                  ) : null}
                </div>

                {/* Title & Brand */}
                <div>
                  {asset.brand && (
                    <span className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider block">
                      {asset.brand}
                    </span>
                  )}
                  <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100 group-hover:text-orange-500 transition line-clamp-1">
                    {asset.name}
                  </h3>
                  {asset.model_number && (
                    <span className="text-xs font-mono text-zinc-500 dark:text-zinc-400 block mt-0.5">
                      {asset.model_number}
                    </span>
                  )}
                </div>

                {/* S/N and Price */}
                <div className="flex items-center justify-between text-xs text-zinc-500 pt-1 border-t border-zinc-100 dark:border-zinc-800/60">
                  <span>
                    {asset.serial_number ? `S/N: ${asset.serial_number.substring(0, 10)}...` : 'Bez S/N'}
                  </span>
                  <span className="font-semibold text-zinc-700 dark:text-zinc-300">
                    {asset.purchase_price != null ? `${asset.purchase_price.toLocaleString('cs-CZ')} Kč` : ''}
                  </span>
                </div>
              </div>

              {/* Bottom Card Actions / Badges */}
              <div className="flex items-center justify-between pt-3 mt-2 border-t border-zinc-100 dark:border-zinc-800/60 text-xs">
                <div className="flex items-center gap-1.5">
                  {asset.invoice_url && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-300 flex items-center gap-0.5">
                      <FileText className="w-2.5 h-2.5" />
                      <span>Účtenka</span>
                    </span>
                  )}
                  {asset.manual_url && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-300 flex items-center gap-0.5">
                      <FileText className="w-2.5 h-2.5" />
                      <span>Návod</span>
                    </span>
                  )}
                </div>

                <span className="text-zinc-400 group-hover:text-orange-500 transition text-[11px] font-semibold flex items-center gap-0.5">
                  Detail &gt;
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit / Create Modal */}
      <AssetEditModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingAsset(null);
        }}
        asset={editingAsset}
        onSave={handleSaveAsset}
      />

      {/* Detail Modal */}
      <AssetDetailModal
        isOpen={!!detailAsset}
        onClose={() => setDetailAsset(null)}
        asset={detailAsset}
        onEdit={(a) => {
          setEditingAsset(a);
          setIsEditModalOpen(true);
        }}
        onDelete={handleDeleteAsset}
      />

    </div>
  );
};
