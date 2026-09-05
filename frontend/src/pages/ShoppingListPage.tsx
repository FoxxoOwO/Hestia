import React, { useState, useEffect } from 'react';
import {
  ShoppingCart, Plus, Trash2, CheckCircle2,
  Sparkles, Check, RotateCcw
} from 'lucide-react';
import { api } from '../services/api';
import { ShoppingItem } from '../types';
import { useTranslation } from '../i18n';

export const ShoppingListPage: React.FC = () => {
  const { t } = useTranslation();
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [newItemName, setNewItemName] = useState('');
  const [newItemAmount, setNewItemAmount] = useState('');
  const [newItemUnit, setNewItemUnit] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const fetchShoppingList = async () => {
    setIsLoading(true);
    try {
      const data = await api.getShoppingItems();
      setItems(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchShoppingList();
  }, []);

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim()) return;

    try {
      const created = await api.createShoppingItem({
        name: newItemName.trim(),
        amount: newItemAmount ? Number(newItemAmount) : undefined,
        unit: newItemUnit.trim() || undefined,
        is_checked: false,
      });
      setItems([...items, created]);
      setNewItemName('');
      setNewItemAmount('');
      setNewItemUnit('');
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleCheck = async (item: ShoppingItem) => {
    try {
      const updated = await api.updateShoppingItem(item.id, {
        is_checked: !item.is_checked,
      });
      setItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, is_checked: updated.is_checked } : i))
      );
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteItem = async (id: number) => {
    try {
      await api.deleteShoppingItem(id);
      setItems(items.filter((i) => i.id !== id));
    } catch (e) {
      console.error(e);
    }
  };

  const handleClearCompleted = async () => {
    try {
      await api.clearCompletedShopping();
      setItems(items.filter((i) => !i.is_checked));
    } catch (e) {
      console.error(e);
    }
  };

  const handleClearAll = async () => {
    if (window.confirm('Opravdu chcete vyprázdnit celý nákupní seznam?')) {
      try {
        await api.clearAllShopping();
        setItems([]);
      } catch (e) {
        console.error(e);
      }
    }
  };

  const pendingItems = items.filter((i) => !i.is_checked);
  const completedItems = items.filter((i) => i.is_checked);

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-100">
            {t('shopping.title')}
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            {t('shopping.subtitle')}
          </p>
        </div>

        {items.length > 0 && (
          <div className="flex items-center gap-2">
            {completedItems.length > 0 && (
              <button
                onClick={handleClearCompleted}
                className="text-xs font-semibold px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
              >
                {t('shopping.clear_completed')} ({completedItems.length})
              </button>
            )}
            <button
              onClick={handleClearAll}
              className="text-xs font-semibold p-2 rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
              title={t('shopping.clear_all')}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Quick Add Form */}
      <form
        onSubmit={handleAddItem}
        className="p-3 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm flex items-center gap-2"
      >
        <input
          type="text"
          required
          value={newItemName}
          onChange={(e) => setNewItemName(e.target.value)}
          placeholder={t('shopping.item_name_placeholder')}
          className="flex-1 px-3 py-2 rounded-xl bg-transparent text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none"
        />
        <input
          type="number"
          step="any"
          value={newItemAmount}
          onChange={(e) => setNewItemAmount(e.target.value)}
          placeholder="Počet"
          className="w-16 px-2 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 text-xs text-center"
        />
        <input
          type="text"
          value={newItemUnit}
          onChange={(e) => setNewItemUnit(e.target.value)}
          placeholder="ks"
          className="w-14 px-2 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 text-xs text-center"
        />
        <button
          type="submit"
          className="p-2.5 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white shadow-md shadow-orange-500/20 transition shrink-0"
        >
          <Plus className="w-5 h-5" />
        </button>
      </form>

      {/* Shopping List Items */}
      {isLoading ? (
        <div className="py-20 text-center text-zinc-400">{t('common.loading')}</div>
      ) : items.length === 0 ? (
        <div className="py-16 text-center rounded-3xl border border-dashed border-zinc-200 dark:border-zinc-800 p-8">
          <ShoppingCart className="w-12 h-12 stroke-1 text-zinc-300 dark:text-zinc-600 mx-auto mb-3" />
          <h3 className="font-bold text-base text-zinc-800 dark:text-zinc-200 mb-1">
            {t('shopping.empty')}
          </h3>
          <p className="text-xs text-zinc-500 max-w-xs mx-auto">
            Přidejte položku výše nebo klikněte na "Přidat do nákupu" přímo v detailu libovolného receptu.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Active Items */}
          <div className="rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm divide-y divide-zinc-100 dark:divide-zinc-800/60 overflow-hidden">
            {pendingItems.map((item) => (
              <div
                key={item.id}
                onClick={() => handleToggleCheck(item)}
                className="p-4 flex items-center justify-between gap-3 hover:bg-orange-50/50 dark:hover:bg-zinc-800/40 cursor-pointer transition select-none"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-6 h-6 rounded-full border-2 border-zinc-300 dark:border-zinc-600 flex items-center justify-center shrink-0" />
                  <span className="font-semibold text-sm text-zinc-900 dark:text-zinc-100 truncate">
                    {item.name}
                  </span>
                  {item.recipe_id && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-100 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 shrink-0">
                      {t('shopping.from_recipe')}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  {(item.amount || item.unit) && (
                    <span className="font-bold text-xs text-zinc-600 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded-lg">
                      {item.amount} {item.unit}
                    </span>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteItem(item.id);
                    }}
                    className="p-1.5 text-zinc-300 hover:text-rose-500 rounded-lg transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}

            {pendingItems.length === 0 && (
              <div className="p-6 text-center text-xs text-zinc-400 font-medium">
                Vše nakoupeno! Můžete vymazat koupené položky níže.
              </div>
            )}
          </div>

          {/* Completed Items */}
          {completedItems.length > 0 && (
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2 px-2">
                Koupeno ({completedItems.length})
              </h4>
              <div className="rounded-3xl bg-white/60 dark:bg-zinc-900/60 border border-zinc-200/60 dark:border-zinc-800/60 shadow-sm divide-y divide-zinc-100 dark:divide-zinc-800/40 overflow-hidden">
                {completedItems.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => handleToggleCheck(item)}
                    className="p-3.5 flex items-center justify-between gap-3 hover:bg-zinc-50 dark:hover:bg-zinc-800/30 cursor-pointer transition select-none opacity-60"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                      <span className="line-through text-xs font-medium text-zinc-500 dark:text-zinc-400 truncate">
                        {item.name}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      {(item.amount || item.unit) && (
                        <span className="line-through text-[11px] text-zinc-400">
                          {item.amount} {item.unit}
                        </span>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteItem(item.id);
                        }}
                        className="p-1 text-zinc-300 hover:text-rose-500 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
