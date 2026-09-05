import React, { useState, useEffect } from 'react';
import {
  Luggage, X, Printer, Droplets, Ban, Wind, CheckCircle2
} from 'lucide-react';
import { api } from '../services/api';
import { PlantSitterScheduleItem } from '../types';
import { useTranslation } from '../i18n';

interface PlantSitterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PlantSitterModal: React.FC<PlantSitterModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { t } = useTranslation();
  const [schedule, setSchedule] = useState<PlantSitterScheduleItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      api.getPlantSitterSchedule()
        .then(setSchedule)
        .catch(console.error)
        .finally(() => setIsLoading(false));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white dark:bg-zinc-900 w-full max-w-3xl max-h-[90vh] rounded-3xl shadow-2xl border border-zinc-200 dark:border-zinc-800 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 text-white shadow-md shadow-blue-500/20">
              <Luggage className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-100">
                {t('plant_sitter.modal_title')}
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                {t('plant_sitter.modal_subtitle')}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 transition"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>{t('plant_sitter.print')}</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4 print:p-0">
          <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-xs text-blue-900 dark:text-blue-200">
            <p className="font-bold mb-0.5">📌 Pokyny pro zalévače během dovolené</p>
            <p>
              Většina pokojovek lépe snáší mírné sucho než přelití. Pokud je substrát na dotek vlhký, raději nezalévejte. Vodu nalévejte přímo k hlíně, ne na listy.
            </p>
          </div>

          {isLoading ? (
            <div className="py-12 text-center text-xs text-zinc-400">Načítám rozpis zálivky...</div>
          ) : (
            <div className="divide-y divide-zinc-100 dark:divide-zinc-800/80">
              {schedule.map((item) => (
                <div
                  key={item.plant_id}
                  className="py-3.5 flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3">
                    {item.image_url ? (
                      <img
                        src={item.image_url}
                        alt={item.plant_name}
                        className="w-12 h-12 rounded-2xl object-cover shrink-0"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-400 shrink-0">
                        🌱
                      </div>
                    )}
                    <div>
                      <h4 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                        {item.plant_name}
                      </h4>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">
                        {item.species} • {t(`plants.rooms.${item.room}`) || item.room}
                      </p>
                      <p className="text-[11px] text-zinc-600 dark:text-zinc-300 mt-1">
                        {item.instructions}
                      </p>
                    </div>
                  </div>

                  <div className="shrink-0 text-right">
                    {item.action_required === 'water' ? (
                      <div className="inline-flex items-center gap-1 px-3 py-1 rounded-xl text-xs font-bold bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300">
                        <Droplets className="w-3.5 h-3.5" />
                        <span>{item.recommended_water_amount}</span>
                      </div>
                    ) : (
                      <div className="inline-flex items-center gap-1 px-3 py-1 rounded-xl text-xs font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400">
                        <Ban className="w-3.5 h-3.5" />
                        <span>{t('plant_sitter.action_do_not_touch')}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
