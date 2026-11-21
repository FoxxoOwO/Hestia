import React from 'react';
import { Check, Monitor, Moon, Palette, Sparkles, Sun } from 'lucide-react';
import { useTranslation } from '../../i18n';
import { useTheme } from '../../context/ThemeContext';

export const AppearanceSettings: React.FC = () => {
  const { t, language, setLanguage } = useTranslation();
  const { theme, setTheme, designStyle, setDesignStyle, designOptions, activeDesign } = useTheme();

  return (
          <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-6">
            <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
              Lokalizace a vzhled
            </h3>

            {/* Language Selection */}
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
                {t('settings.language')}
              </label>
              <div className="grid grid-cols-2 gap-3 max-w-sm">
                <button
                  onClick={() => setLanguage('cs')}
                  className={`p-3 rounded-2xl border text-xs font-bold flex items-center gap-2.5 transition ${
                    language === 'cs'
                      ? 'border-orange-500 bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400'
                      : 'border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400'
                  }`}
                >
                  <span className="text-base">🇨🇿</span>
                  <span>Čeština</span>
                </button>
                <button
                  onClick={() => setLanguage('en')}
                  className={`p-3 rounded-2xl border text-xs font-bold flex items-center gap-2.5 transition ${
                    language === 'en'
                      ? 'border-orange-500 bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400'
                      : 'border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400'
                  }`}
                >
                  <span className="text-base">🇬🇧</span>
                  <span>English</span>
                </button>
              </div>
            </div>

            {/* Theme Selection */}
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
                {t('settings.theme')}
              </label>
              <div className="grid grid-cols-3 gap-3 max-w-md">
                <button
                  onClick={() => setTheme('light')}
                  className={`p-3 rounded-2xl border text-xs font-bold flex flex-col items-center gap-1.5 transition ${
                    theme === 'light'
                      ? 'border-orange-500 bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400'
                      : 'border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400'
                  }`}
                >
                  <Sun className="w-4 h-4" />
                  <span>{t('settings.theme_light')}</span>
                </button>
                <button
                  onClick={() => setTheme('dark')}
                  className={`p-3 rounded-2xl border text-xs font-bold flex flex-col items-center gap-1.5 transition ${
                    theme === 'dark'
                      ? 'border-orange-500 bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400'
                      : 'border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400'
                  }`}
                >
                  <Moon className="w-4 h-4" />
                  <span>{t('settings.theme_dark')}</span>
                </button>
                <button
                  onClick={() => setTheme('system')}
                  className={`p-3 rounded-2xl border text-xs font-bold flex flex-col items-center gap-1.5 transition ${
                    theme === 'system'
                      ? 'border-orange-500 bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400'
                      : 'border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400'
                  }`}
                >
                  <Monitor className="w-4 h-4" />
                  <span>{t('settings.theme_system')}</span>
                </button>
              </div>
            </div>

            {/* Design Theme Selection (Alternative Designs) */}
            <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800/80 space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                    <Palette className="w-3.5 h-3.5 text-orange-500" />
                    <span>{t('settings.design_style')}</span>
                  </label>
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-orange-100 dark:bg-orange-950/60 text-orange-700 dark:text-orange-300 flex items-center gap-1.5">
                    <span
                      className="w-2 h-2 rounded-full inline-block"
                      style={{ backgroundColor: activeDesign.primaryColor }}
                    />
                    {language === 'cs' ? activeDesign.name : activeDesign.nameEn}
                  </span>
                </div>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                  {t('settings.design_style_desc')}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                {designOptions.map((opt: any) => {
                  const isSelected = designStyle === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setDesignStyle(opt.id)}
                      className={`p-3.5 rounded-2xl border text-left transition-all relative overflow-hidden flex flex-col justify-between ${
                        isSelected
                          ? 'border-orange-500 bg-orange-50/70 dark:bg-orange-950/30 ring-2 ring-orange-500/30 shadow-md'
                          : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/40'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-3.5 h-3.5 rounded-full shadow-sm ring-1 ring-black/10"
                              style={{ backgroundColor: opt.primaryColor }}
                            />
                            <span className="font-bold text-xs text-zinc-900 dark:text-zinc-100">
                              {language === 'cs' ? opt.name : opt.nameEn}
                            </span>
                          </div>
                          <span
                            className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                              isSelected
                                ? 'bg-orange-500 text-white'
                                : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300'
                            }`}
                          >
                            {language === 'cs' ? opt.badge : opt.badgeEn}
                          </span>
                        </div>

                        <p className="text-[11px] text-zinc-500 dark:text-zinc-400 line-clamp-2 leading-relaxed mb-2">
                          {language === 'cs' ? opt.description : opt.descriptionEn}
                        </p>

                        {/* Font, Shape & Layout tags */}
                        {(opt.fontCategory || opt.shapeStyle) && (
                          <div className="flex flex-wrap gap-1 mb-2.5">
                            {opt.fontCategory && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 font-mono">
                                🔤 {language === 'cs' ? opt.fontCategory : (opt.fontCategoryEn || opt.fontCategory)}
                              </span>
                            )}
                            {opt.shapeStyle && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300">
                                📐 {language === 'cs' ? opt.shapeStyle : (opt.shapeStyleEn || opt.shapeStyle)}
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-zinc-200/60 dark:border-zinc-700/60 mt-auto">
                        {/* Swatch dots */}
                        <div className="flex items-center gap-1.5">
                          {opt.previewColors.map((c: string, i: number) => (
                            <div
                              key={i}
                              className="w-3.5 h-3.5 rounded-full border border-black/10 dark:border-white/10 shadow-xs"
                              style={{ backgroundColor: c }}
                            />
                          ))}
                        </div>

                        {isSelected ? (
                          <span className="flex items-center gap-1 text-[11px] font-bold text-orange-600 dark:text-orange-400">
                            <Check className="w-3.5 h-3.5" />
                            <span>Aktivní</span>
                          </span>
                        ) : (
                          <span className="text-[11px] text-zinc-400 font-medium hover:text-zinc-600 dark:hover:text-zinc-200">
                            Aktivovat
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Live preview showcase widget */}
              <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/80 dark:border-zinc-800 space-y-3 text-xs mt-3">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-200/60 dark:border-zinc-700/60 pb-2">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: activeDesign.primaryColor }}
                    />
                    <span className="font-semibold text-zinc-700 dark:text-zinc-300">
                      {t('settings.design_preview_title')}:
                    </span>
                    <span className="font-bold text-orange-600 dark:text-orange-400 text-sm">
                      {language === 'cs' ? activeDesign.name : activeDesign.nameEn}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 text-[11px] text-zinc-500 dark:text-zinc-400 font-medium">
                    <span>{language === 'cs' ? activeDesign.layoutStyle : activeDesign.layoutStyleEn}</span>
                  </div>
                </div>

                {/* Interactive UI Element Playground */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 items-center">
                  {/* Sample Button */}
                  <div>
                    <label className="block text-[10px] text-zinc-400 uppercase font-semibold mb-1">
                      Tlačítko (Button Style)
                    </label>
                    <button
                      type="button"
                      className="w-full px-3 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-semibold text-xs transition shadow-sm flex items-center justify-center gap-1.5"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>{t('settings.design_preview_btn')}</span>
                    </button>
                  </div>

                  {/* Sample Badge & Tag */}
                  <div>
                    <label className="block text-[10px] text-zinc-400 uppercase font-semibold mb-1">
                      Štítek &amp; Stav (Badge)
                    </label>
                    <div className="flex items-center gap-1.5 py-1">
                      <span className="px-2.5 py-1 rounded-xl bg-orange-100 dark:bg-orange-950/60 text-orange-700 dark:text-orange-300 text-[11px] font-bold inline-flex items-center gap-1">
                        <Check className="w-3 h-3" />
                        {t('settings.design_preview_badge')}
                      </span>
                      <span className="px-2 py-0.5 rounded-lg border border-zinc-200 dark:border-zinc-700 text-[10px] text-zinc-500">
                        {activeDesign.badge}
                      </span>
                    </div>
                  </div>

                  {/* Sample Input */}
                  <div>
                    <label className="block text-[10px] text-zinc-400 uppercase font-semibold mb-1">
                      Formulářové pole (Input)
                    </label>
                    <input
                      type="text"
                      readOnly
                      value="Ukázkový text vstupu..."
                      className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
  );
};
