import React, { useState, useEffect } from 'react';
import {
  AlertTriangle, X, Printer, Phone, Share2, Dog, Cat
} from 'lucide-react';
import { api } from '../services/api';
import { Pet, PetSosFlyer } from '../types';
import { useTranslation } from '../i18n';

interface PetSosModalProps {
  isOpen: boolean;
  onClose: () => void;
  pet: Pet;
}

export const PetSosModal: React.FC<PetSosModalProps> = ({
  isOpen,
  onClose,
  pet,
}) => {
  const { t } = useTranslation();
  const [flyer, setFlyer] = useState<PetSosFlyer | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isOpen && pet) {
      setIsLoading(true);
      api.getPetSosFlyer(pet.id)
        .then((data) => setFlyer(data))
        .catch((e) => console.error(e))
        .finally(() => setIsLoading(false));
    }
  }, [isOpen, pet]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-xl max-h-[92vh] rounded-3xl bg-white dark:bg-zinc-900 border-4 border-rose-600 shadow-2xl overflow-hidden flex flex-col">
        {/* Header Bar */}
        <div className="p-4 bg-rose-600 text-white flex items-center justify-between no-print">
          <div className="flex items-center gap-2 font-black text-sm uppercase tracking-wider">
            <AlertTriangle className="w-5 h-5 animate-pulse" />
            <span>{t('pet_sos.modal_title')}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="px-3 py-1.5 rounded-xl font-bold text-xs bg-white text-rose-700 hover:bg-rose-50 transition flex items-center gap-1.5 shadow-sm"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>{t('pet_sos.print')}</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl bg-black/20 hover:bg-black/40 text-white transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Flyer Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-center print:p-0">
          {isLoading || !flyer ? (
            <div className="py-20 text-center text-zinc-400">
              <AlertTriangle className="w-8 h-8 animate-spin text-rose-500 mx-auto mb-2" />
              <p className="text-xs">{t('common.loading')}</p>
            </div>
          ) : (
            <>
              {/* Giant Red Banner */}
              <div className="space-y-1">
                <span className="text-3xl sm:text-4xl font-black text-rose-600 uppercase tracking-widest block">
                  {t('pet_sos.headline')}
                </span>
                <p className="text-sm font-bold text-zinc-600 dark:text-zinc-300">
                  Prosíme o pomoc při hledání zaběhnutého mazlíčka
                </p>
              </div>

              {/* Big Photo */}
              <div className="max-w-xs mx-auto aspect-square rounded-3xl overflow-hidden bg-zinc-100 border-4 border-zinc-200 dark:border-zinc-700 shadow-lg">
                {flyer.image_url ? (
                  <img
                    src={flyer.image_url}
                    alt={flyer.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-zinc-400">
                    <Dog className="w-24 h-24" />
                  </div>
                )}
              </div>

              {/* Pet Name & Basic Details */}
              <div className="space-y-2">
                <h1 className="text-3xl font-black text-zinc-900 dark:text-zinc-100">
                  {flyer.name}
                </h1>
                <div className="flex flex-wrap items-center justify-center gap-2 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  {flyer.breed && <span className="px-3 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800">{flyer.breed}</span>}
                  {flyer.color && <span className="px-3 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800">Barva: {flyer.color}</span>}
                  {flyer.microchip_number && (
                    <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-200 font-mono font-bold">
                      Čip: {flyer.microchip_number}
                    </span>
                  )}
                </div>
              </div>

              {/* Distinctive Features */}
              {flyer.distinctive_features && (
                <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/40 text-xs text-zinc-600 dark:text-zinc-300 max-w-md mx-auto">
                  <span className="font-bold text-zinc-800 dark:text-zinc-200 block mb-0.5">
                    Popis & chování:
                  </span>
                  <p>{flyer.distinctive_features}</p>
                </div>
              )}

              {/* Reward Box */}
              {flyer.reward_note && (
                <div className="p-3 rounded-2xl bg-amber-500 text-white font-black text-base shadow-md tracking-wide max-w-sm mx-auto">
                  🏆 {flyer.reward_note}
                </div>
              )}

              {/* Emergency Call to Action */}
              <div className="p-5 rounded-3xl bg-rose-50 dark:bg-rose-950/40 border-2 border-rose-300 dark:border-rose-900/60 space-y-2 max-w-md mx-auto">
                <span className="text-xs font-bold text-rose-700 dark:text-rose-300 uppercase tracking-wider block">
                  {t('pet_sos.contact')}
                </span>
                <a
                  href={`tel:${flyer.owner_contact_phone}`}
                  className="inline-flex items-center gap-2 text-2xl font-black text-rose-600 dark:text-rose-400 hover:underline"
                >
                  <Phone className="w-6 h-6" />
                  <span>{flyer.owner_contact_phone}</span>
                </a>
                <p className="text-xs text-zinc-500">
                  Kontakt: {flyer.owner_contact_name}
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
