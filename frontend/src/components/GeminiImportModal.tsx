import React, { useState } from 'react';
import { Sparkles, Globe, FileText, X, Check, Loader2, ChefHat, Clock, Users } from 'lucide-react';
import { api } from '../services/api';
import { Recipe } from '../types';
import { useTranslation } from '../i18n';

interface GeminiImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRecipeImported: (savedRecipe: Recipe) => void;
}

export const GeminiImportModal: React.FC<GeminiImportModalProps> = ({
  isOpen,
  onClose,
  onRecipeImported,
}) => {
  const { t, language } = useTranslation();
  const [activeTab, setActiveTab] = useState<'url' | 'text'>('url');
  const [url, setUrl] = useState('');
  const [rawText, setRawText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [extractedRecipe, setExtractedRecipe] = useState<Partial<Recipe> | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) return null;

  const handleExtract = async () => {
    setError(null);
    setIsLoading(true);
    setExtractedRecipe(null);

    try {
      const data = await api.importRecipeWithGemini({
        url: activeTab === 'url' ? url.trim() : undefined,
        raw_text: activeTab === 'text' ? rawText.trim() : undefined,
        target_language: language,
      });
      setExtractedRecipe(data);
    } catch (err: any) {
      setError(err.message || 'Nepodařilo se extrahovat recept.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!extractedRecipe) return;
    setIsSaving(true);
    setError(null);

    try {
      const saved = await api.createRecipe(extractedRecipe);
      onRecipeImported(saved);
      onClose();
    } catch (err: any) {
      setError('Chyba při ukládání receptu: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white dark:bg-zinc-900 w-full max-w-2xl max-h-[90vh] rounded-3xl shadow-2xl border border-zinc-200 dark:border-zinc-800 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-600 text-white shadow-md shadow-orange-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-100">
                {t('gemini.modal_title')}
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                {t('gemini.modal_subtitle')}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          {!extractedRecipe ? (
            <>
              {/* Tabs */}
              <div className="flex rounded-xl bg-zinc-100 dark:bg-zinc-800/80 p-1">
                <button
                  type="button"
                  onClick={() => setActiveTab('url')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-lg transition ${
                    activeTab === 'url'
                      ? 'bg-white dark:bg-zinc-700 text-orange-600 dark:text-orange-400 shadow-sm'
                      : 'text-zinc-600 dark:text-zinc-400'
                  }`}
                >
                  <Globe className="w-4 h-4" />
                  <span>{t('gemini.tab_url')}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('text')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-lg transition ${
                    activeTab === 'text'
                      ? 'bg-white dark:bg-zinc-700 text-orange-600 dark:text-orange-400 shadow-sm'
                      : 'text-zinc-600 dark:text-zinc-400'
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  <span>{t('gemini.tab_text')}</span>
                </button>
              </div>

              {/* Tab Form */}
              {activeTab === 'url' ? (
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                    URL adresa receptu
                  </label>
                  <input
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder={t('gemini.url_placeholder')}
                    className="w-full px-4 py-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                  <p className="text-[11px] text-zinc-400 mt-1.5">
                    Podporuje weby jako Apetit Online, Vareni.cz, TopRecepty, Allrecipes, BBC Food a další.
                  </p>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                    Text receptu nebo poznámka
                  </label>
                  <textarea
                    rows={6}
                    value={rawText}
                    onChange={(e) => setRawText(e.target.value)}
                    placeholder={t('gemini.text_placeholder')}
                    className="w-full px-4 py-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
                  />
                </div>
              )}

              {error && (
                <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-600 dark:text-rose-400">
                  {error}
                </div>
              )}

              <button
                type="button"
                onClick={handleExtract}
                disabled={isLoading || (activeTab === 'url' ? !url.trim() : !rawText.trim())}
                className="w-full py-3 px-4 rounded-2xl font-semibold text-sm bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-lg shadow-orange-500/25 transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{t('gemini.extracting')}</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>{t('gemini.btn_extract')}</span>
                  </>
                )}
              </button>
            </>
          ) : (
            /* Preview of Extracted Recipe */
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 flex items-center justify-between">
                <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5">
                  <Check className="w-4 h-4" /> Recept úspěšně analyzován a připraven!
                </span>
                <button
                  onClick={() => setExtractedRecipe(null)}
                  className="text-xs font-semibold text-zinc-500 hover:underline"
                >
                  Zkusit jiný
                </button>
              </div>

              {/* Title and Meta */}
              <div>
                <h4 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                  {extractedRecipe.title}
                </h4>
                {extractedRecipe.description && (
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                    {extractedRecipe.description}
                  </p>
                )}
                <div className="flex flex-wrap items-center gap-3 mt-3 text-xs text-zinc-600 dark:text-zinc-400 font-medium">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-orange-500" />
                    {(extractedRecipe.prep_time_minutes || 0) + (extractedRecipe.cook_time_minutes || 0)} min
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-orange-500" />
                    {extractedRecipe.default_servings} porcí
                  </span>
                  <span className="px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-[10px] uppercase font-bold">
                    {extractedRecipe.difficulty}
                  </span>
                </div>
              </div>

              {/* Utensils */}
              {(extractedRecipe.utensils || []).length > 0 && (
                <div>
                  <h5 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
                    Potřebné nádobí a náčiní
                  </h5>
                  <div className="flex flex-wrap gap-1.5">
                    {extractedRecipe.utensils?.map((u, i) => (
                      <span
                        key={i}
                        className="text-xs px-2.5 py-1 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
                      >
                        {u}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Ingredients */}
              <div>
                <h5 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
                  Ingredience ({extractedRecipe.ingredients?.length || 0})
                </h5>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs">
                  {extractedRecipe.ingredients?.map((ing, i) => (
                    <div
                      key={i}
                      className="p-2 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 flex items-center justify-between"
                    >
                      <span className="font-medium text-zinc-800 dark:text-zinc-200">
                        {ing.name}
                      </span>
                      <span className="font-bold text-orange-600 dark:text-orange-400">
                        {ing.amount} {ing.unit}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Instructions */}
              <div>
                <h5 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
                  Postup ({extractedRecipe.instructions?.length || 0} kroků)
                </h5>
                <div className="space-y-2 text-xs">
                  {extractedRecipe.instructions?.map((step) => (
                    <div
                      key={step.step}
                      className="p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 flex items-start gap-2.5"
                    >
                      <span className="w-5 h-5 rounded-full bg-orange-500 text-white font-bold text-[10px] flex items-center justify-center shrink-0">
                        {step.step}
                      </span>
                      <p className="text-zinc-700 dark:text-zinc-300 leading-relaxed">
                        {step.text}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="pt-2 flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex-1 py-3 px-4 rounded-2xl font-semibold text-sm bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/25 transition flex items-center justify-center gap-2"
                >
                  {isSaving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4" />
                  )}
                  <span>{t('gemini.btn_save_to_book')}</span>
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-3 rounded-2xl font-semibold text-sm bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 transition"
                >
                  {t('recipes.cancel')}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
