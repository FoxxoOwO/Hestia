import React, { useState, useEffect } from 'react';
import { X, PhoneCall, AlertTriangle, ShieldCheck, HeartPulse, Flame, Skull, Baby, Wind, Droplets } from 'lucide-react';
import { api } from '../services/api';
import { FirstAidGuide } from '../types';

interface FirstAidGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialGuideId?: string | null;
}

export const FirstAidGuideModal: React.FC<FirstAidGuideModalProps> = ({
  isOpen,
  onClose,
  initialGuideId
}) => {
  const [guides, setGuides] = useState<FirstAidGuide[]>([]);
  const [selectedGuideId, setSelectedGuideId] = useState<string>(initialGuideId || 'burns');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    const fetchGuides = async () => {
      setLoading(true);
      try {
        const data = await api.getFirstAidGuides();
        setGuides(data);
        if (initialGuideId) {
          setSelectedGuideId(initialGuideId);
        } else if (data.length > 0 && !selectedGuideId) {
          setSelectedGuideId(data[0].id);
        }
      } catch (err) {
        console.error('Failed to load first aid guides', err);
      } finally {
        setLoading(false);
      }
    };

    fetchGuides();
  }, [isOpen, initialGuideId]);

  if (!isOpen) return null;

  const currentGuide = guides.find(g => g.id === selectedGuideId) || guides[0];

  const getGuideIcon = (id: string) => {
    switch (id) {
      case 'burns': return <Flame className="w-5 h-5 text-orange-500" />;
      case 'intoxication': return <Skull className="w-5 h-5 text-purple-500" />;
      case 'febrile_seizures': return <Baby className="w-5 h-5 text-rose-500" />;
      case 'choking': return <Wind className="w-5 h-5 text-blue-500" />;
      case 'severe_bleeding': return <Droplets className="w-5 h-5 text-red-500" />;
      case 'anaphylaxis': return <HeartPulse className="w-5 h-5 text-amber-500" />;
      default: return <HeartPulse className="w-5 h-5 text-emerald-500" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl my-6 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 bg-rose-50/60 dark:bg-rose-950/20 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400">
              <HeartPulse className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
                SOS První pomoc & Toxikologie
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Rychlé záchranné postupy a přímé tísňové kontakty
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Emergency Call Action Cards */}
        <div className="p-4 grid grid-cols-1 sm:grid-cols-3 gap-3 bg-zinc-50 dark:bg-zinc-800/40 border-b border-zinc-200 dark:border-zinc-800 shrink-0">
          <a
            href="tel:155"
            className="p-3 rounded-xl bg-red-500 hover:bg-red-600 text-white flex items-center gap-3 shadow-sm transition-all group"
          >
            <div className="p-2 rounded-lg bg-white/20">
              <PhoneCall className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-medium opacity-90 block">Záchranná služba</span>
              <span className="text-lg font-black tracking-wider">155</span>
            </div>
          </a>

          <a
            href="tel:224919293"
            className="p-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white flex items-center gap-3 shadow-sm transition-all group"
          >
            <div className="p-2 rounded-lg bg-white/20">
              <Skull className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-medium opacity-90 block">Toxikologie (TIS)</span>
              <span className="text-sm font-black tracking-wider">224 91 92 93</span>
            </div>
          </a>

          <a
            href="tel:112"
            className="p-3 rounded-xl bg-zinc-700 hover:bg-zinc-800 text-white flex items-center gap-3 shadow-sm transition-all group"
          >
            <div className="p-2 rounded-lg bg-white/20">
              <PhoneCall className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-medium opacity-90 block">Tísňová linka SOS</span>
              <span className="text-lg font-black tracking-wider">112</span>
            </div>
          </a>
        </div>

        {/* Guide Selector & Content */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col md:flex-row gap-6">
          {/* Guide list sidebar */}
          <div className="w-full md:w-56 shrink-0 space-y-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 block px-2 mb-2">
              Krizové situace:
            </span>
            {guides.map((g) => {
              const isSelected = g.id === selectedGuideId;
              return (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => setSelectedGuideId(g.id)}
                  className={`w-full text-left p-2.5 rounded-xl text-xs font-semibold flex items-center gap-2.5 transition-all ${
                    isSelected
                      ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                      : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800/60 border border-transparent'
                  }`}
                >
                  {getGuideIcon(g.id)}
                  <span className="truncate">{g.title}</span>
                </button>
              );
            })}
          </div>

          {/* Guide detail content */}
          {currentGuide && (
            <div className="flex-1 space-y-4">
              <div className="flex items-start justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-3">
                <div>
                  <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                    {getGuideIcon(currentGuide.id)}
                    {currentGuide.title}
                  </h3>
                  <p className="text-xs text-zinc-600 dark:text-zinc-300 mt-1">
                    {currentGuide.summary}
                  </p>
                </div>
                {currentGuide.emergency_call && (
                  <a
                    href={`tel:${currentGuide.emergency_call.replace(/\s+/g, '')}`}
                    className="shrink-0 px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-300 border border-rose-200 dark:border-rose-800 text-xs font-bold flex items-center gap-1.5 hover:bg-rose-100"
                  >
                    <PhoneCall className="w-3.5 h-3.5" />
                    Volat {currentGuide.emergency_call}
                  </a>
                )}
              </div>

              {/* Action Steps */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4" />
                  CO OKAMŽITĚ UDĚLAT:
                </h4>
                <div className="space-y-2">
                  {currentGuide.action_steps.map((step, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-800/40 text-xs text-zinc-800 dark:text-zinc-200 flex items-start gap-2.5"
                    >
                      <span className="w-5 h-5 rounded-full bg-emerald-600 text-white font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <p className="leading-relaxed">{step}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Don't do steps */}
              {currentGuide.dont_do_steps.length > 0 && (
                <div className="space-y-2 pt-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4" />
                    CO NIKDY NEDĚLAT (ČASTÉ CHYBY):
                  </h4>
                  <div className="space-y-1.5">
                    {currentGuide.dont_do_steps.map((dont, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 rounded-xl bg-rose-50/60 dark:bg-rose-950/20 border border-rose-200/60 dark:border-rose-800/40 text-xs text-rose-900 dark:text-rose-200 flex items-start gap-2"
                      >
                        <span className="text-rose-500 font-bold shrink-0">✕</span>
                        <p className="leading-relaxed">{dont}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Note */}
              {currentGuide.note && (
                <div className="p-3 rounded-xl bg-zinc-100 dark:bg-zinc-800/60 text-xs text-zinc-600 dark:text-zinc-400 italic">
                  💡 {currentGuide.note}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 flex justify-end shrink-0 bg-zinc-50 dark:bg-zinc-900">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 text-sm font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-xl transition-colors"
          >
            Zavřít průvodce
          </button>
        </div>
      </div>
    </div>
  );
};
