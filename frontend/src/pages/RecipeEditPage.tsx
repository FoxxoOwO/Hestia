import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, Save, ChefHat } from 'lucide-react';
import { api } from '../services/api';
import { Recipe, IngredientItem, InstructionStep } from '../types';
import { useTranslation } from '../i18n';

export const RecipeEditPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id && id !== 'new');
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [prepTime, setPrepTime] = useState(15);
  const [cookTime, setCookTime] = useState(30);
  const [servings, setServings] = useState(4);
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [priceLevel, setPriceLevel] = useState<'low' | 'medium' | 'high'>('medium');
  const [tagsInput, setTagsInput] = useState('');
  const [utensilsInput, setUtensilsInput] = useState('');
  const [ingredients, setIngredients] = useState<IngredientItem[]>([
    { name: '', amount: 1, unit: 'ks', note: '', category: 'other' },
  ]);
  const [instructions, setInstructions] = useState<InstructionStep[]>([
    { step: 1, text: '', timer_minutes: null },
  ]);

  const [isLoading, setIsLoading] = useState(isEdit);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isEdit && id) {
      api.getRecipe(Number(id))
        .then((data) => {
          setTitle(data.title);
          setDescription(data.description || '');
          setImageUrl(data.image_url || '');
          setPrepTime(data.prep_time_minutes);
          setCookTime(data.cook_time_minutes);
          setServings(data.default_servings || 4);
          setDifficulty(data.difficulty);
          setPriceLevel(data.price_level);
          setTagsInput((data.tags || []).join(', '));
          setUtensilsInput((data.utensils || []).join(', '));
          if (data.ingredients && data.ingredients.length > 0) {
            setIngredients(data.ingredients);
          }
          if (data.instructions && data.instructions.length > 0) {
            setInstructions(data.instructions);
          }
        })
        .catch((e) => console.error(e))
        .finally(() => setIsLoading(false));
    }
  }, [isEdit, id]);

  const handleAddIngredient = () => {
    setIngredients([...ingredients, { name: '', amount: 1, unit: 'ks', note: '', category: 'other' }]);
  };

  const handleRemoveIngredient = (index: number) => {
    setIngredients(ingredients.filter((_, i) => i !== index));
  };

  const handleUpdateIngredient = (index: number, field: keyof IngredientItem, value: any) => {
    const updated = [...ingredients];
    updated[index] = { ...updated[index], [field]: value };
    setIngredients(updated);
  };

  const handleAddInstruction = () => {
    setInstructions([
      ...instructions,
      { step: instructions.length + 1, text: '', timer_minutes: null },
    ]);
  };

  const handleRemoveInstruction = (index: number) => {
    const filtered = instructions.filter((_, i) => i !== index);
    const reindexed = filtered.map((item, i) => ({ ...item, step: i + 1 }));
    setInstructions(reindexed);
  };

  const handleUpdateInstruction = (index: number, field: keyof InstructionStep, value: any) => {
    const updated = [...instructions];
    updated[index] = { ...updated[index], [field]: value };
    setInstructions(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Vyplňte prosím název receptu.');
      return;
    }

    setIsSaving(true);
    setError(null);

    const tags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    const utensils = utensilsInput
      .split(',')
      .map((u) => u.trim())
      .filter(Boolean);

    const cleanIngredients = ingredients.filter((i) => i.name.trim().length > 0);
    const cleanInstructions = instructions.filter((i) => i.text.trim().length > 0);

    const payload: Partial<Recipe> = {
      title: title.trim(),
      description: description.trim() || undefined,
      image_url: imageUrl.trim() || undefined,
      prep_time_minutes: Number(prepTime),
      cook_time_minutes: Number(cookTime),
      default_servings: Number(servings),
      difficulty,
      price_level: priceLevel,
      tags,
      utensils,
      ingredients: cleanIngredients,
      instructions: cleanInstructions,
    };

    try {
      if (isEdit && id) {
        const updated = await api.updateRecipe(Number(id), payload);
        navigate(`/recipes/${updated.id}`);
      } else {
        const created = await api.createRecipe(payload);
        navigate(`/recipes/${created.id}`);
      }
    } catch (err: any) {
      setError(err.message || 'Nepodařilo se uložit recept.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="py-20 text-center text-zinc-400">{t('common.loading')}</div>;
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-24">
      {/* Top back */}
      <div className="flex items-center justify-between">
        <Link
          to={isEdit && id ? `/recipes/${id}` : '/'}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Zpět</span>
        </Link>
        <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
          {isEdit ? 'Upravit recept' : t('recipes.add_recipe')}
        </h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-600 dark:text-rose-400 font-medium">
            {error}
          </div>
        )}

        {/* Basic Info */}
        <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4">
          <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
            Základní údaje
          </h3>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Název receptu *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="např. Pečené kuře na rozmarýnu"
              className="w-full px-4 py-2.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Popis receptu
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Krátký popis jídla a chuťových vlastností..."
              className="w-full px-4 py-2.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              URL fotografie
            </label>
            <input
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://images.unsplash.com/..."
              className="w-full px-4 py-2.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          {/* Times and Meta */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Příprava (min)
              </label>
              <input
                type="number"
                min="0"
                value={prepTime}
                onChange={(e) => setPrepTime(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Vaření (min)
              </label>
              <input
                type="number"
                min="0"
                value={cookTime}
                onChange={(e) => setCookTime(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Výchozí porce
              </label>
              <input
                type="number"
                min="1"
                value={servings}
                onChange={(e) => setServings(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Náročnost
              </label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 text-sm"
              >
                <option value="easy">{t('recipes.easy')}</option>
                <option value="medium">{t('recipes.medium')}</option>
                <option value="hard">{t('recipes.hard')}</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Tagy (oddělené čárkou)
              </label>
              <input
                type="text"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder="Oběd, Rychlovka, Těstoviny"
                className="w-full px-4 py-2.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Nádobí a nástroje (oddělené čárkou)
              </label>
              <input
                type="text"
                value={utensilsInput}
                onChange={(e) => setUtensilsInput(e.target.value)}
                placeholder="Plech, Tyčový mixér, Pánev"
                className="w-full px-4 py-2.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 text-sm"
              />
            </div>
          </div>
        </div>

        {/* Ingredients Section */}
        <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
              Ingredience
            </h3>
            <button
              type="button"
              onClick={handleAddIngredient}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-orange-100 dark:bg-orange-950/60 text-orange-700 dark:text-orange-300 hover:bg-orange-200 transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Přidat surovinu</span>
            </button>
          </div>

          <div className="space-y-2.5">
            {ingredients.map((ing, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Název (např. Mouka)"
                  value={ing.name}
                  onChange={(e) => handleUpdateIngredient(idx, 'name', e.target.value)}
                  className="flex-2 px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 text-sm min-w-0"
                />
                <input
                  type="number"
                  step="any"
                  placeholder="Množství"
                  value={ing.amount}
                  onChange={(e) => handleUpdateIngredient(idx, 'amount', Number(e.target.value))}
                  className="w-20 px-2 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 text-sm"
                />
                <input
                  type="text"
                  placeholder="Jednotka"
                  value={ing.unit}
                  onChange={(e) => handleUpdateIngredient(idx, 'unit', e.target.value)}
                  className="w-16 px-2 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 text-sm"
                />
                <input
                  type="text"
                  placeholder="Poznámka (např. nasekaná)"
                  value={ing.note || ''}
                  onChange={(e) => handleUpdateIngredient(idx, 'note', e.target.value)}
                  className="flex-1 px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 text-sm hidden sm:block"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveIngredient(idx)}
                  disabled={ingredients.length <= 1}
                  className="p-2 text-zinc-400 hover:text-rose-500 transition disabled:opacity-30"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Instructions Section */}
        <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
              Postup vaření
            </h3>
            <button
              type="button"
              onClick={handleAddInstruction}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-orange-100 dark:bg-orange-950/60 text-orange-700 dark:text-orange-300 hover:bg-orange-200 transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Přidat krok</span>
            </button>
          </div>

          <div className="space-y-3">
            {instructions.map((step, idx) => (
              <div key={idx} className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-orange-500 text-white font-bold text-xs flex items-center justify-center shrink-0 mt-2">
                  {step.step}
                </span>
                <div className="flex-1 space-y-2">
                  <textarea
                    rows={2}
                    placeholder="Popište co v tomto kroku udělat..."
                    value={step.text}
                    onChange={(e) => handleUpdateInstruction(idx, 'text', e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 text-sm resize-none"
                  />
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-zinc-400">Minutka (volitelné):</span>
                    <input
                      type="number"
                      placeholder="min"
                      value={step.timer_minutes || ''}
                      onChange={(e) =>
                        handleUpdateInstruction(
                          idx,
                          'timer_minutes',
                          e.target.value ? Number(e.target.value) : null
                        )
                      }
                      className="w-20 px-2 py-1 rounded-lg bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 text-xs"
                    />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveInstruction(idx)}
                  disabled={instructions.length <= 1}
                  className="p-2 text-zinc-400 hover:text-rose-500 transition mt-2 disabled:opacity-30"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Submit Bar */}
        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={isSaving}
            className="flex-1 py-3 px-6 rounded-2xl font-semibold text-sm bg-orange-500 hover:bg-orange-600 text-white shadow-lg shadow-orange-500/25 transition flex items-center justify-center gap-2"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Ukládám...' : t('recipes.save')}</span>
          </button>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-6 py-3 rounded-2xl font-semibold text-sm bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 transition"
          >
            {t('recipes.cancel')}
          </button>
        </div>
      </form>
    </div>
  );
};
