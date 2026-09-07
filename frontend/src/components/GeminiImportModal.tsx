import React, { useState, useRef } from 'react';
import { Sparkles, Globe, FileText, Upload, X, Check, Loader2, Clock, Users, FileUp, CheckSquare, Square, ChevronDown, ChevronUp } from 'lucide-react';
import { api } from '../services/api';
import { Recipe } from '../types';
import { useTranslation } from '../i18n';

interface GeminiImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRecipeImported: (savedRecipe: Recipe) => void;
  onRecipesImported?: (savedRecipes: Recipe[]) => void;
}

export const GeminiImportModal: React.FC<GeminiImportModalProps> = ({
  isOpen,
  onClose,
  onRecipeImported,
  onRecipesImported,
}) => {
  const { t, language } = useTranslation();
  const [activeTab, setActiveTab] = useState<'url' | 'text' | 'file'>('url');
  const [url, setUrl] = useState('');
  const [rawText, setRawText] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [extractedRecipes, setExtractedRecipes] = useState<Partial<Recipe>[]>([]);
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleClose = () => {
    setUrl('');
    setRawText('');
    setSelectedFile(null);
    setError(null);
    setExtractedRecipes([]);
    setSelectedIndices(new Set());
    setExpandedIndex(null);
    onClose();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const handleExtract = async () => {
    setError(null);
    setIsLoading(true);
    setExtractedRecipes([]);
    setSelectedIndices(new Set());
    setExpandedIndex(null);

    try {
      if (activeTab === 'file') {
        if (!selectedFile) {
          setError(t('gemini.no_file_selected') || 'Vyberte prosím soubor.');
          setIsLoading(false);
          return;
        }
        const res = await api.importRecipeFromFile(selectedFile, language);
        if (!res.recipes || res.recipes.length === 0) {
          setError('V souboru nebyl nalezen žádný recept.');
          return;
        }
        setExtractedRecipes(res.recipes);
        setSelectedIndices(new Set(res.recipes.map((_, i) => i)));
        if (res.recipes.length === 1) {
          setExpandedIndex(0);
        }
      } else {
        const data = await api.importRecipeWithGemini({
          url: activeTab === 'url' ? url.trim() : undefined,
          raw_text: activeTab === 'text' ? rawText.trim() : undefined,
          target_language: language,
        });
        setExtractedRecipes([data]);
        setSelectedIndices(new Set([0]));
        setExpandedIndex(0);
      }
    } catch (err: any) {
      setError(err.message || 'Nepodařilo se extrahovat recept.');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSelectIndex = (index: number) => {
    setSelectedIndices((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIndices.size === extractedRecipes.length) {
      setSelectedIndices(new Set());
    } else {
      setSelectedIndices(new Set(extractedRecipes.map((_, i) => i)));
    }
  };

  const handleSave = async () => {
    if (extractedRecipes.length === 0) return;
    setIsSaving(true);
    setError(null);

    try {
      const toSave = extractedRecipes.filter((_, i) => selectedIndices.has(i));
      if (toSave.length === 0) {
        setError('Vyberte alespoň jeden recept k uložení.');
        setIsSaving(false);
        return;
      }

      const savedList: Recipe[] = [];
      for (const rec of toSave) {
        const saved = await api.createRecipe(rec);
        savedList.push(saved);
        if (!onRecipesImported) {
          onRecipeImported(saved);
        }
      }

      if (onRecipesImported) {
        onRecipesImported(savedList);
      }
      handleClose();
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
            onClick={handleClose}
            className="p-2 rounded-xl text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          {extractedRecipes.length === 0 ? (
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
                <button
                  type="button"
                  onClick={() => setActiveTab('file')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-lg transition ${
                    activeTab === 'file'
                      ? 'bg-white dark:bg-zinc-700 text-orange-600 dark:text-orange-400 shadow-sm'
                      : 'text-zinc-600 dark:text-zinc-400'
                  }`}
                >
                  <Upload className="w-4 h-4" />
                  <span>{t('gemini.tab_file')}</span>
                </button>
              </div>

              {/* Tab Form */}
              {activeTab === 'url' && (
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
              )}

              {activeTab === 'text' && (
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

              {activeTab === 'file' && (
                <div className="space-y-3">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept=".pdf,.html,.htm,.rtf,.rtk,.txt,.csv,.jpg,.jpeg,.png,.webp,.zip"
                    className="hidden"
                  />

                  {/* Drop Zone */}
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDragging(true);
                    }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`cursor-pointer border-2 border-dashed rounded-3xl p-6 text-center transition flex flex-col items-center justify-center gap-3 ${
                      isDragging
                        ? 'border-orange-500 bg-orange-50/50 dark:bg-orange-950/20 scale-[0.99]'
                        : 'border-zinc-300 dark:border-zinc-700 hover:border-orange-400 dark:hover:border-orange-500 bg-zinc-50/50 dark:bg-zinc-800/30'
                    }`}
                  >
                    <div className="w-12 h-12 rounded-2xl bg-orange-100 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 flex items-center justify-center shadow-sm">
                      <FileUp className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                        {t('gemini.file_drop_title')}
                      </p>
                      <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1 max-w-md">
                        {t('gemini.file_drop_formats')}
                      </p>
                    </div>

                    {/* Supported Format Badges */}
                    <div className="flex flex-wrap items-center justify-center gap-1.5 pt-2">
                      {['PDF', 'HTML', 'RTF / RTK', 'CSV', 'Foto (JPG/PNG)', 'ZIP balíček'].map((fmt) => (
                        <span
                          key={fmt}
                          className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-md bg-zinc-200/80 dark:bg-zinc-700/80 text-zinc-600 dark:text-zinc-300"
                        >
                          {fmt}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Selected File Card */}
                  {selectedFile && (
                    <div className="p-3.5 rounded-2xl bg-orange-50/70 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-900/50 flex items-center justify-between">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="p-2 rounded-xl bg-orange-500 text-white shrink-0">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">
                            {selectedFile.name}
                          </p>
                          <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                            {formatFileSize(selectedFile.size)}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedFile(null);
                          if (fileInputRef.current) fileInputRef.current.value = '';
                        }}
                        className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
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
                disabled={
                  isLoading ||
                  (activeTab === 'url' && !url.trim()) ||
                  (activeTab === 'text' && !rawText.trim()) ||
                  (activeTab === 'file' && !selectedFile)
                }
                className="w-full py-3 px-4 rounded-2xl font-semibold text-sm bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-lg shadow-orange-500/25 transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>
                      {activeTab === 'file'
                        ? t('gemini.extracting_file') || 'Gemini AI zpracovává soubor...'
                        : t('gemini.extracting')}
                    </span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>
                      {activeTab === 'file'
                        ? t('gemini.btn_extract_file') || 'Analyzovat soubor s Gemini AI'
                        : t('gemini.btn_extract')}
                    </span>
                  </>
                )}
              </button>
            </>
          ) : (
            /* Results View */
            <div className="space-y-4">
              {/* Header banner */}
              <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 flex items-center justify-between">
                <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5">
                  <Check className="w-4 h-4" />
                  {extractedRecipes.length > 1
                    ? `Nalezeno ${extractedRecipes.length} receptů v souboru!`
                    : 'Recept úspěšně analyzován a připraven!'}
                </span>
                <button
                  onClick={() => {
                    setExtractedRecipes([]);
                    setSelectedIndices(new Set());
                    setExpandedIndex(null);
                  }}
                  className="text-xs font-semibold text-zinc-500 hover:underline"
                >
                  Zkusit jiný
                </button>
              </div>

              {/* Batch multi-recipe selector if > 1 recipe */}
              {extractedRecipes.length > 1 && (
                <div className="flex items-center justify-between pb-1 px-1 text-xs">
                  <span className="font-semibold text-zinc-700 dark:text-zinc-300">
                    Vyberte recepty k uložení ({selectedIndices.size} z {extractedRecipes.length}):
                  </span>
                  <button
                    type="button"
                    onClick={toggleSelectAll}
                    className="text-orange-600 dark:text-orange-400 font-bold hover:underline"
                  >
                    {selectedIndices.size === extractedRecipes.length ? 'Zrušit výběr' : 'Vybrat vše'}
                  </button>
                </div>
              )}

              {/* Recipes List / Single Recipe */}
              <div className="space-y-3">
                {extractedRecipes.map((recipe, idx) => {
                  const isSelected = selectedIndices.has(idx);
                  const isExpanded = expandedIndex === idx || extractedRecipes.length === 1;

                  return (
                    <div
                      key={idx}
                      className={`rounded-2xl border transition overflow-hidden ${
                        isSelected
                          ? 'border-orange-300 dark:border-orange-700 bg-white dark:bg-zinc-900/90 shadow-sm'
                          : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/40 opacity-75'
                      }`}
                    >
                      {/* Recipe Header Card */}
                      <div className="p-4 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          {extractedRecipes.length > 1 && (
                            <button
                              type="button"
                              onClick={() => toggleSelectIndex(idx)}
                              className="text-orange-600 dark:text-orange-400 shrink-0"
                            >
                              {isSelected ? (
                                <CheckSquare className="w-5 h-5" />
                              ) : (
                                <Square className="w-5 h-5 text-zinc-400" />
                              )}
                            </button>
                          )}
                          <div className="min-w-0 flex-1">
                            <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 truncate">
                              {recipe.title || 'Recept bez názvu'}
                            </h4>
                            <div className="flex flex-wrap items-center gap-3 mt-1 text-[11px] text-zinc-500 dark:text-zinc-400">
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3 text-orange-500" />
                                {(recipe.prep_time_minutes || 0) + (recipe.cook_time_minutes || 0)} min
                              </span>
                              <span className="flex items-center gap-1">
                                <Users className="w-3 h-3 text-orange-500" />
                                {recipe.default_servings || 4} porcí
                              </span>
                              <span>{recipe.ingredients?.length || 0} surovin</span>
                              <span>{recipe.instructions?.length || 0} kroků</span>
                            </div>
                          </div>
                        </div>

                        {extractedRecipes.length > 1 && (
                          <button
                            type="button"
                            onClick={() => setExpandedIndex(isExpanded && expandedIndex === idx ? null : idx)}
                            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                          >
                            {isExpanded && expandedIndex === idx ? (
                              <ChevronUp className="w-4 h-4" />
                            ) : (
                              <ChevronDown className="w-4 h-4" />
                            )}
                          </button>
                        )}
                      </div>

                      {/* Expanded Details (Full ingredients & instructions) */}
                      {isExpanded && (
                        <div className="px-4 pb-4 pt-1 border-t border-zinc-100 dark:border-zinc-800/80 space-y-3">
                          {recipe.description && (
                            <p className="text-xs text-zinc-600 dark:text-zinc-400 italic">
                              {recipe.description}
                            </p>
                          )}

                          {/* Utensils */}
                          {(recipe.utensils || []).length > 0 && (
                            <div>
                              <h5 className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-1">
                                Nádobí
                              </h5>
                              <div className="flex flex-wrap gap-1">
                                {recipe.utensils?.map((u, i) => (
                                  <span
                                    key={i}
                                    className="text-[11px] px-2 py-0.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
                                  >
                                    {u}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Ingredients */}
                          <div>
                            <h5 className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-1">
                              Ingredience ({recipe.ingredients?.length || 0})
                            </h5>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs">
                              {recipe.ingredients?.map((ing, i) => (
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
                            <h5 className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-1">
                              Postup ({recipe.instructions?.length || 0} kroků)
                            </h5>
                            <div className="space-y-1.5 text-xs">
                              {recipe.instructions?.map((step) => (
                                <div
                                  key={step.step}
                                  className="p-2 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 flex items-start gap-2"
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
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {error && (
                <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-600 dark:text-rose-400">
                  {error}
                </div>
              )}

              {/* Actions */}
              <div className="pt-2 flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={isSaving || selectedIndices.size === 0}
                  className="flex-1 py-3 px-4 rounded-2xl font-semibold text-sm bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/25 transition flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Ukládám {selectedIndices.size} receptů...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>
                        {extractedRecipes.length > 1
                          ? `Uložit vybrané recepty (${selectedIndices.size})`
                          : t('gemini.btn_save_to_book')}
                      </span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleClose}
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
