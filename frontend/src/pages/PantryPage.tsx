import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  PackageOpen, Plus, Search, Sparkles, CheckCircle,
  AlertTriangle, AlertCircle, Trash2, Edit2, X, ShoppingCart,
  Refrigerator, Snowflake, Carrot, Utensils
} from 'lucide-react';
import { api } from '../services/api';
import { PantryItem, PantryCategory, RecipePantryMatch } from '../types';
import { useTranslation } from '../i18n';

export const PantryPage: React.FC = () => {
  const { t } = useTranslation();
  const [items, setItems] = useState<PantryItem[]>([]);
  const [pantryMatches, setPantryMatches] = useState<RecipePantryMatch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Add / Edit Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<PantryItem | null>(null);
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState<PantryCategory>('fridge');
  const [formQuantity, setFormQuantity] = useState<number>(1);
  const [formUnit, setFormUnit] = useState('ks');
  const [formExpiration, setFormExpiration] = useState('');
  const [formNote, setFormNote] = useState('');
  const [notification, setNotification] = useState<string | null>(null);

  const fetchPantryData = async () => {
    setIsLoading(true);
    try {
      const [itemsData, matchData] = await Promise.all([
        api.getPantryItems(selectedCategory, searchQuery),
        api.matchRecipesWithPantry().catch(() => []),
      ]);
      setItems(itemsData);
      setPantryMatches(matchData);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPantryData();
  }, [selectedCategory, searchQuery]);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  const handleOpenAddModal = () => {
    setEditingItem(null);
    setFormName('');
    setFormCategory('fridge');
    setFormQuantity(1);
    setFormUnit('ks');
    setFormExpiration('');
    setFormNote('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item: PantryItem) => {
    setEditingItem(item);
    setFormName(item.name);
    setFormCategory(item.category);
    setFormQuantity(item.quantity);
    setFormUnit(item.unit);
    setFormExpiration(item.expiration_date || '');
    setFormNote(item.note || '');
    setIsModalOpen(true);
  };

  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    const payload = {
      name: formName.trim(),
      category: formCategory,
      quantity: Number(formQuantity),
      unit: formUnit.trim(),
      expiration_date: formExpiration || undefined,
      note: formNote.trim() || undefined,
    };

    try {
      if (editingItem) {
        await api.updatePantryItem(editingItem.id, payload);
        showNotification('Surovina upravena');
      } else {
        await api.createPantryItem(payload);
        showNotification('Surovina přidána do zásob');
      }
      setIsModalOpen(false);
      fetchPantryData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteItem = async (id: number) => {
    if (window.confirm('Opravdu chcete tuto surovinu odebrat ze zásob?')) {
      try {
        await api.deletePantryItem(id);
        setItems(items.filter((i) => i.id !== id));
        showNotification('Položka odebrána');
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleAddMissingToShopping = async (match: RecipePantryMatch) => {
    try {
      await api.addRecipeToShopping(
        match.recipe_id,
        match.missing_ingredients.map((m) => ({
          name: m.ingredient_name,
          amount: m.required_amount,
          unit: m.unit,
        }))
      );
      showNotification(`Chybějící suroviny pro "${match.recipe_title}" přidány do nákupního seznamu!`);
    } catch (e) {
      console.error(e);
    }
  };

  const categories = [
    { id: 'all', label: t('pantry.cat_all'), icon: PackageOpen },
    { id: 'fridge', label: t('pantry.cat_fridge'), icon: Refrigerator },
    { id: 'freezer', label: t('pantry.cat_freezer'), icon: Snowflake },
    { id: 'pantry', label: t('pantry.cat_pantry'), icon: PackageOpen },
    { id: 'produce', label: t('pantry.cat_produce'), icon: Carrot },
  ];

  const canCookNowRecipes = pantryMatches.filter((m) => m.can_cook_now);
  const almostCookRecipes = pantryMatches.filter(
    (m) => !m.can_cook_now && m.missing_ingredients_count <= 2
  );

  return (
    <div className="space-y-6 pb-20">
      {/* Toast */}
      {notification && (
        <div className="fixed top-20 right-4 z-50 p-4 rounded-2xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 shadow-2xl text-xs font-bold animate-in slide-in-from-top flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>{notification}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-100">
            {t('pantry.title')}
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            {t('pantry.subtitle')}
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-semibold bg-orange-500 hover:bg-orange-600 text-white shadow-md shadow-orange-500/20 transition self-start md:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>{t('pantry.add_item')}</span>
        </button>
      </div>

      {/* Smart Pantry Match Card ("Co mohu uvařit") */}
      {(canCookNowRecipes.length > 0 || almostCookRecipes.length > 0) && (
        <div className="p-6 rounded-3xl bg-gradient-to-br from-orange-500/10 via-amber-500/5 to-transparent border border-orange-200 dark:border-orange-500/20 shadow-sm space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-orange-500 text-white shadow-sm">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-100">
                {t('pantry.match_recipes_title')}
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Chytré porovnání receptů s aktuálním stavem vaší lednice a spíže
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* 100% Cook Now */}
            {canCookNowRecipes.map((match) => (
              <div
                key={match.recipe_id}
                className="p-3.5 rounded-2xl bg-white dark:bg-zinc-900 border border-emerald-300 dark:border-emerald-800/80 flex items-center justify-between shadow-sm"
              >
                <div className="flex items-center gap-2.5">
                  <span className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-xs shrink-0">
                    100%
                  </span>
                  <div>
                    <Link
                      to={`/recipes/${match.recipe_id}`}
                      className="font-bold text-sm text-zinc-900 dark:text-zinc-100 hover:text-orange-500 transition"
                    >
                      {match.recipe_title}
                    </Link>
                    <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" /> Všechny suroviny máme doma!
                    </p>
                  </div>
                </div>

                <Link
                  to={`/recipes/${match.recipe_id}`}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 transition"
                >
                  Uvařit
                </Link>
              </div>
            ))}

            {/* Missing 1-2 ingredients */}
            {almostCookRecipes.map((match) => (
              <div
                key={match.recipe_id}
                className="p-3.5 rounded-2xl bg-white dark:bg-zinc-900 border border-amber-200 dark:border-amber-800/60 flex items-center justify-between shadow-sm"
              >
                <div className="flex items-center gap-2.5">
                  <span className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold text-xs shrink-0">
                    {Math.round(match.match_percentage)}%
                  </span>
                  <div>
                    <Link
                      to={`/recipes/${match.recipe_id}`}
                      className="font-bold text-sm text-zinc-900 dark:text-zinc-100 hover:text-orange-500 transition"
                    >
                      {match.recipe_title}
                    </Link>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                      Chybí: {match.missing_ingredients.map((m) => m.ingredient_name).join(', ')}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => handleAddMissingToShopping(match)}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 hover:bg-amber-200 transition"
                  title="Přidat chybějící suroviny do nákupního seznamu"
                >
                  <ShoppingCart className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Do nákupu</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Search & Category Filter */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          {categories.map((cat) => {
            const Icon = cat.icon;
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-semibold whitespace-nowrap transition ${
                  isSelected
                    ? 'bg-orange-500 text-white shadow-sm'
                    : 'bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        <div className="relative">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('pantry.search_placeholder')}
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </div>
      </div>

      {/* Items Table / Grid */}
      {isLoading ? (
        <div className="py-20 text-center text-zinc-400">{t('common.loading')}</div>
      ) : items.length === 0 ? (
        <div className="py-16 text-center rounded-3xl border border-dashed border-zinc-200 dark:border-zinc-800 p-8">
          <PackageOpen className="w-12 h-12 stroke-1 text-zinc-400 mx-auto mb-3" />
          <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
            {t('pantry.no_items')}
          </p>
          <button
            onClick={handleOpenAddModal}
            className="mt-3 px-4 py-2 rounded-2xl text-xs font-semibold bg-orange-500 text-white hover:bg-orange-600 transition"
          >
            Přidat první surovinu
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {items.map((item) => {
            const statusConfig = {
              fresh: {
                label: t('pantry.status_fresh'),
                color: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/60',
                icon: CheckCircle,
              },
              expiring_soon: {
                label: t('pantry.status_expiring'),
                color: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/60',
                icon: AlertTriangle,
              },
              expired: {
                label: t('pantry.status_expired'),
                color: 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800/60',
                icon: AlertCircle,
              },
            }[item.status];

            const StatusIcon = statusConfig.icon;

            return (
              <div
                key={item.id}
                className="p-4 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col justify-between hover:border-orange-300 dark:hover:border-orange-500/40 transition"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span
                      className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusConfig.color}`}
                    >
                      <StatusIcon className="w-3 h-3" />
                      <span>{statusConfig.label}</span>
                    </span>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEditModal(item)}
                        className="p-1.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteItem(item.id)}
                        className="p-1.5 text-zinc-400 hover:text-rose-500 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <h4 className="font-bold text-base text-zinc-900 dark:text-zinc-100">
                    {item.name}
                  </h4>
                  {item.note && (
                    <p className="text-xs text-zinc-400 mt-0.5 italic">{item.note}</p>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between text-xs">
                  <span className="font-extrabold text-base text-orange-600 dark:text-orange-400">
                    {item.quantity} {item.unit}
                  </span>
                  {item.expiration_date && (
                    <span className="text-zinc-500 dark:text-zinc-400 font-medium">
                      Expirace: {item.expiration_date}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-zinc-900 w-full max-w-md rounded-3xl shadow-2xl border border-zinc-200 dark:border-zinc-800 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3">
              <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-100">
                {editingItem ? 'Upravit surovinu' : 'Přidat surovinu do zásob'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-zinc-400 hover:text-zinc-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveItem} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Název suroviny *
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="např. Máslo, Mléko, Cibule..."
                  className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Kategorie
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 text-sm"
                  >
                    <option value="fridge">Lednice</option>
                    <option value="freezer">Mrazák</option>
                    <option value="pantry">Spíž</option>
                    <option value="produce">Ovoce a zelenina</option>
                    <option value="spices">Koření</option>
                    <option value="bakery">Pečivo</option>
                    <option value="other">Ostatní</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Množství a jednotka
                  </label>
                  <div className="flex gap-1.5">
                    <input
                      type="number"
                      step="any"
                      min="0.1"
                      required
                      value={formQuantity}
                      onChange={(e) => setFormQuantity(Number(e.target.value))}
                      className="w-2/3 px-2 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 text-sm"
                    />
                    <input
                      type="text"
                      required
                      value={formUnit}
                      onChange={(e) => setFormUnit(e.target.value)}
                      placeholder="ks"
                      className="w-1/3 px-2 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 text-sm"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Datum expirace / trvanlivosti
                </label>
                <input
                  type="date"
                  value={formExpiration}
                  onChange={(e) => setFormExpiration(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Poznámka (volitelné)
                </label>
                <input
                  type="text"
                  value={formNote}
                  onChange={(e) => setFormNote(e.target.value)}
                  placeholder="např. otevřeno v pondělí"
                  className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 text-sm"
                />
              </div>

              <div className="pt-3 flex gap-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 px-4 rounded-xl font-semibold text-xs bg-orange-500 hover:bg-orange-600 text-white transition"
                >
                  Uložit
                </button>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="py-2.5 px-4 rounded-xl font-semibold text-xs bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300"
                >
                  Zrušit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
