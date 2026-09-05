import React, { useState } from 'react';
import {
  X, PhoneCall, ShieldAlert, AlertTriangle, CheckCircle2,
  FileText, LifeBuoy, HeartPulse, HelpCircle, Phone
} from 'lucide-react';
import { Vehicle } from '../types';
import { useTranslation } from '../i18n';

interface SosAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  vehicle: Vehicle | null;
}

export const SosAssistantModal: React.FC<SosAssistantModalProps> = ({
  isOpen,
  onClose,
  vehicle
}) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'contacts' | 'guide' | 'equipment'>('contacts');

  if (!isOpen || !vehicle) return null;

  const assistancePhone = vehicle.insurance_assistance_phone || '+420 1224';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-xl w-full p-6 shadow-2xl relative my-8">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>SOS Asistent při nehodě & poruše</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {vehicle.name} • SPZ: <span className="font-mono font-bold">{vehicle.license_plate}</span>
                {vehicle.vin && ` • VIN: ${vehicle.vin}`}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex items-center gap-2 mt-4 pb-2 border-b border-slate-100 dark:border-slate-800 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('contacts')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition ${
              activeTab === 'contacts'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <PhoneCall className="w-3.5 h-3.5" />
            Rychlé volání
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('guide')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition ${
              activeTab === 'guide'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            Postup při nehodě
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('equipment')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition ${
              activeTab === 'equipment'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <LifeBuoy className="w-3.5 h-3.5" />
            Povinná výbava
          </button>
        </div>

        <div className="mt-4 max-h-[60vh] overflow-y-auto pr-1 space-y-4">
          {/* TAB 1: CONTACTS */}
          {activeTab === 'contacts' && (
            <div className="space-y-3">
              {/* Primary Insurance Assistance */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-950/40 dark:to-blue-950/40 border border-indigo-100 dark:border-indigo-900/40 flex items-center justify-between gap-4">
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                    Asistence pojišťovny ({vehicle.insurance_company || 'Pojišťovna'})
                  </div>
                  <div className="text-sm font-semibold text-slate-900 dark:text-white mt-0.5">
                    Smlouva: {vehicle.insurance_policy_number || 'Neuvedeno'}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    Odtah, výměna pneu, vyproštění vozu, náhradní vozidlo
                  </div>
                </div>
                <a
                  href={`tel:${assistancePhone.replace(/\s+/g, '')}`}
                  className="px-4 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-indigo-500/25 transition flex-shrink-0"
                >
                  <Phone className="w-4 h-4" />
                  <span>{assistancePhone}</span>
                </a>
              </div>

              {/* Linka 1224 */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4">
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Linka pomoci řidičům (1224)
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Centrální linka České asociace pojišťoven – přepojí vás přímo na vaši pojišťovnu
                  </div>
                </div>
                <a
                  href="tel:1224"
                  className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-xs flex items-center gap-2 transition flex-shrink-0"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>1224</span>
                </a>
              </div>

              {/* Emergency Services */}
              <div className="grid grid-cols-2 gap-2.5 pt-2">
                <a
                  href="tel:155"
                  className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 flex items-center justify-between text-rose-700 dark:text-rose-300 hover:bg-rose-100 transition"
                >
                  <div>
                    <div className="text-xs font-bold">Záchranná služba</div>
                    <div className="text-[11px] opacity-80">Při zranění osob</div>
                  </div>
                  <span className="font-bold text-base font-mono">155</span>
                </a>

                <a
                  href="tel:158"
                  className="p-3 rounded-2xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/40 flex items-center justify-between text-blue-700 dark:text-blue-300 hover:bg-blue-100 transition"
                >
                  <div>
                    <div className="text-xs font-bold">Policie ČR</div>
                    <div className="text-[11px] opacity-80">Nehody a ohrožení</div>
                  </div>
                  <span className="font-bold text-base font-mono">158</span>
                </a>

                <a
                  href="tel:150"
                  className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 flex items-center justify-between text-amber-700 dark:text-amber-300 hover:bg-amber-100 transition"
                >
                  <div>
                    <div className="text-xs font-bold">Hasičský sbor</div>
                    <div className="text-[11px] opacity-80">Únik kapalin, požár</div>
                  </div>
                  <span className="font-bold text-base font-mono">150</span>
                </a>

                <a
                  href="tel:112"
                  className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-between text-slate-800 dark:text-slate-200 hover:bg-slate-200 transition"
                >
                  <div>
                    <div className="text-xs font-bold">Tísňová linka SOS</div>
                    <div className="text-[11px] opacity-80">Jednotné číslo EU</div>
                  </div>
                  <span className="font-bold text-base font-mono">112</span>
                </a>
              </div>
            </div>
          )}

          {/* TAB 2: STEP BY STEP GUIDE */}
          {activeTab === 'guide' && (
            <div className="space-y-3 text-xs text-slate-700 dark:text-slate-300">
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex items-start gap-3">
                <span className="w-5 h-5 rounded-full bg-rose-600 text-white font-bold flex items-center justify-center text-[11px] flex-shrink-0 mt-0.5">
                  1
                </span>
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white">Zastavit a zabezpečit místo</h4>
                  <p className="text-slate-500 dark:text-slate-400 mt-0.5">
                    Zapněte varovná světla. Ještě před vystoupením z vozu si <strong>oblečte reflexní vestu</strong>. Umístěte výstražný trojúhelník (50 m za vozidlo, na dálnici min. 100 m).
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex items-start gap-3">
                <span className="w-5 h-5 rounded-full bg-rose-600 text-white font-bold flex items-center justify-center text-[11px] flex-shrink-0 mt-0.5">
                  2
                </span>
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white">Zkontrolovat zdraví a poskytnout první pomoc</h4>
                  <p className="text-slate-500 dark:text-slate-400 mt-0.5">
                    Pokud je někdo zraněn, okamžitě volejte <strong>155</strong>. Použijte autolékárničku. Nezranění lidé by se měli přesunout za svodidla.
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex items-start gap-3">
                <span className="w-5 h-5 rounded-full bg-rose-600 text-white font-bold flex items-center justify-center text-[11px] flex-shrink-0 mt-0.5">
                  3
                </span>
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white">Kdy volat Policii ČR (158)?</h4>
                  <ul className="list-disc pl-4 mt-1 space-y-0.5 text-slate-500 dark:text-slate-400">
                    <li>Dojde ke zranění nebo usmrcení osoby.</li>
                    <li>Hmotná škoda na některém z vozidel zjevně převyšuje <strong>100 000 Kč</strong>.</li>
                    <li>Došlo ke škodě na majetku 3. osoby (svodidla, sloup, cizí zaparkovaný vůz).</li>
                    <li>Účastníci se nedokážou dohodnout na zavinění nebo druhý řidič ujede.</li>
                    <li>Podezření na alkohol / drogy nebo únik nebezpečných látek.</li>
                  </ul>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex items-start gap-3">
                <span className="w-5 h-5 rounded-full bg-rose-600 text-white font-bold flex items-center justify-center text-[11px] flex-shrink-0 mt-0.5">
                  4
                </span>
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white">Vyplnění záznamu o nehodě & fotodokumentace</h4>
                  <p className="text-slate-500 dark:text-slate-400 mt-0.5">
                    Vyplňte formulář <em>Záznam o dopravní nehodě</em> a podepište jej oba. Vyfoťte celkovou situaci z dálky, detail poškození, brzdné stopy a SPZ obou vozidel.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: EQUIPMENT */}
          {activeTab === 'equipment' && (
            <div className="space-y-3 text-xs">
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                <h4 className="font-bold text-slate-900 dark:text-white mb-2">Povinná výbava v ČR:</h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    <span><strong>Výstražný trojúhelník</strong> (homologovaný ECE 27)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    <span><strong>Reflexní vesta</strong> (doporučeno pro všechny členy posádky v dosahu řidiče)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    <span>
                      <strong>Autolékárnička</strong>
                      {vehicle.first_aid_kit_expiry_date && ` (Platnost do: ${new Date(vehicle.first_aid_kit_expiry_date).toLocaleDateString('cs-CZ')})`}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    <span><strong>Opravná sada na pneu</strong> nebo <strong>rezervní kolo s heverem a klíčem</strong></span>
                  </div>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40">
                <h4 className="font-bold text-indigo-900 dark:text-indigo-200 mb-2">Doporučená výbava:</h4>
                <div className="space-y-1.5 text-slate-600 dark:text-slate-400">
                  <div>• Startovací kabely a tažné lano</div>
                  <div>• Hasicí přístroj (povinný např. v Polsku)</div>
                  <div>• Pracovní rukavice, svítilna / čelovka</div>
                  <div>• Formulář <em>Záznam o dopravní nehodě</em> a propiska</div>
                  <div>• Zimní výbava (škrabka na led, smetáček, sněhové řetězy na horách)</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
          >
            Zavřít
          </button>
        </div>
      </div>
    </div>
  );
};
