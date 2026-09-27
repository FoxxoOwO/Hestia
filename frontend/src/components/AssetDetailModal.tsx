import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, Wrench, Shield, ShieldAlert, ShieldCheck, FileText, 
  ExternalLink, Copy, Check, Calendar, Store, Tag, 
  MapPin, Phone, Trash2, Edit3, Sparkles
} from 'lucide-react';
import { Asset } from '../types';
import { useTranslation } from '../i18n';

interface AssetDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  asset: Asset | null;
  onEdit: (asset: Asset) => void;
  onDelete: (id: number) => void;
  onScheduleService?: (applianceName: string) => void;
}

const CATEGORY_NAMES: Record<string, string> = {
  large_appliance: 'Velký spotřebič',
  small_appliance: 'Malý spotřebič',
  electronics: 'Elektronika a TV',
  tools_garden: 'Nářadí a zahrada',
  plumbing_hvac: 'Topení, klima a voda',
  furniture: 'Nábytek a vybavení',
  other: 'Ostatní majetek',
};

const ROOM_NAMES: Record<string, string> = {
  kitchen: 'Kuchyň',
  bathroom: 'Koupelna',
  living_room: 'Obývací pokoj',
  bedroom: 'Ložnice',
  hallway: 'Chodba / Zádveří',
  garage: 'Garáž',
  workshop: 'Dílna',
  garden: 'Zahrada',
  attic_cellar: 'Půda / Sklep',
  general: 'Celý dům',
};

export const AssetDetailModal: React.FC<AssetDetailModalProps> = ({
  isOpen,
  onClose,
  asset,
  onEdit,
  onDelete,
  onScheduleService,
}) => {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);

  if (!isOpen || !asset) return null;

  const copySerialNumber = () => {
    if (asset.serial_number) {
      navigator.clipboard.writeText(asset.serial_number);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getWarrantyBadge = () => {
    if (asset.warranty_status === 'valid') {
      return (
        <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-500 text-white shadow-sm">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300 block">
                Platná záruka
              </span>
              <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                Zbývá {asset.days_until_warranty_expiry} dní
              </span>
              <span className="text-xs text-zinc-500 dark:text-zinc-400 block">
                Konec záruky: {asset.warranty_expiry_date}
              </span>
            </div>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300">
            {asset.warranty_months} měsíců
          </span>
        </div>
      );
    }

    if (asset.warranty_status === 'expiring_soon') {
      return (
        <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 flex items-center justify-between animate-pulse">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500 text-white shadow-sm">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-300 block">
                Záruka brzy končí!
              </span>
              <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                Zbývá jen {asset.days_until_warranty_expiry} dní
              </span>
              <span className="text-xs text-zinc-500 dark:text-zinc-400 block">
                Vyprší: {asset.warranty_expiry_date}
              </span>
            </div>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-200 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200">
            Pozor
          </span>
        </div>
      );
    }

    if (asset.warranty_status === 'expired') {
      return (
        <div className="p-3 rounded-2xl bg-zinc-100 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 flex items-center justify-between text-zinc-500 dark:text-zinc-400 text-xs">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-zinc-400" />
            <span>Záruka vypršela ({asset.warranty_expiry_date})</span>
          </div>
          <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300">
            Po záruce
          </span>
        </div>
      );
    }

    return (
      <div className="p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-700/60 text-zinc-400 text-xs flex items-center gap-2">
        <Shield className="w-4 h-4" />
        <span>U tohoto předmětu nebyla evidována záruční lhůta</span>
      </div>
    );
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-zinc-900 rounded-3xl max-w-lg w-full max-h-[92vh] flex flex-col shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        
        {/* Header */}
        <div className="p-5 border-b border-zinc-200 dark:border-zinc-800 flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
              <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-orange-500" />
                {ROOM_NAMES[asset.room] || asset.room}
              </span>
              <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-300">
                {CATEGORY_NAMES[asset.category] || asset.category}
              </span>
              {asset.brand && (
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                  {asset.brand}
                </span>
              )}
            </div>
            <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 leading-tight">
              {asset.name}
            </h2>
            {asset.model_number && (
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Model: <span className="font-mono font-medium text-zinc-700 dark:text-zinc-300">{asset.model_number}</span>
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs sm:text-sm">
          
          {/* Warranty card */}
          {getWarrantyBadge()}

          {/* S/N Box */}
          {asset.serial_number && (
            <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 block">
                  Sériové číslo pro servis
                </span>
                <span className="font-mono text-sm font-bold text-zinc-900 dark:text-zinc-100 select-all">
                  {asset.serial_number}
                </span>
              </div>
              <button
                onClick={copySerialNumber}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-zinc-700 border border-zinc-200 dark:border-zinc-600 text-xs font-medium text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 transition shadow-sm"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Zkopírováno' : 'Kopírovat'}</span>
              </button>
            </div>
          )}

          {/* Quick info grid */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/80 dark:border-zinc-700/60">
              <span className="text-[10px] text-zinc-400 font-medium block">Datum pořízení</span>
              <span className="font-semibold text-zinc-900 dark:text-zinc-100 text-xs sm:text-sm">
                {asset.purchase_date || 'Neuvedeno'}
              </span>
            </div>
            <div className="p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/80 dark:border-zinc-700/60">
              <span className="text-[10px] text-zinc-400 font-medium block">Pořizovací cena</span>
              <span className="font-semibold text-zinc-900 dark:text-zinc-100 text-xs sm:text-sm">
                {asset.purchase_price != null ? `${asset.purchase_price.toLocaleString('cs-CZ')} Kč` : 'Neuvedeno'}
              </span>
            </div>
            <div className="p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/80 dark:border-zinc-700/60">
              <span className="text-[10px] text-zinc-400 font-medium block">Prodejce</span>
              <span className="font-semibold text-zinc-900 dark:text-zinc-100 text-xs sm:text-sm">
                {asset.store_or_vendor || 'Neuvedeno'}
              </span>
            </div>
            <div className="p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/80 dark:border-zinc-700/60">
              <span className="text-[10px] text-zinc-400 font-medium block">Stav</span>
              <span className="font-semibold text-zinc-900 dark:text-zinc-100 text-xs sm:text-sm">
                {asset.status === 'active' ? 'V provozu' : asset.status === 'in_repair' ? 'V opravě' : asset.status === 'sold' ? 'Prodáno' : 'Vyřazeno'}
              </span>
            </div>
          </div>

          {/* Files / Attachments */}
          <div className="space-y-2">
            <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 block">
              Dokumenty a manuály
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {asset.invoice_url ? (
                <a
                  href={asset.invoice_url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between p-3 rounded-2xl bg-orange-50/60 dark:bg-orange-950/20 border border-orange-200/80 dark:border-orange-900/40 text-orange-700 dark:text-orange-300 hover:bg-orange-100/60 transition group"
                >
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 shrink-0 text-orange-500" />
                    <span className="text-xs font-semibold">Účtenka / Záruční list</span>
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100" />
                </a>
              ) : (
                <div className="p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/30 border border-zinc-200 dark:border-zinc-700/60 text-zinc-400 text-xs flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  <span>Bez účtenky</span>
                </div>
              )}

              {asset.manual_url ? (
                <a
                  href={asset.manual_url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between p-3 rounded-2xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200/80 dark:border-blue-900/40 text-blue-700 dark:text-blue-300 hover:bg-blue-100/60 transition group"
                >
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 shrink-0 text-blue-500" />
                    <span className="text-xs font-semibold">Uživatelský návod</span>
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100" />
                </a>
              ) : (
                <div className="p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/30 border border-zinc-200 dark:border-zinc-700/60 text-zinc-400 text-xs flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  <span>Bez manuálu</span>
                </div>
              )}
            </div>
          </div>

          {/* Service & Contact */}
          {asset.contact_service && (
            <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 space-y-1">
              <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block">
                Autorizovaný servis / kontakt
              </span>
              <p className="text-xs sm:text-sm font-medium text-zinc-800 dark:text-zinc-200 flex items-center gap-2">
                <Phone className="w-4 h-4 text-orange-500 shrink-0" />
                <span>{asset.contact_service}</span>
              </p>
            </div>
          )}

          {/* Notes */}
          {asset.notes && (
            <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 space-y-1">
              <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block">
                Poznámky k údržbě a dílům
              </span>
              <p className="text-xs text-zinc-700 dark:text-zinc-300 whitespace-pre-line leading-relaxed">
                {asset.notes}
              </p>
            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
          <button
            onClick={() => {
              if (window.confirm(`Opravdu chcete odstranit spotřebič "${asset.name}"?`)) {
                onDelete(asset.id);
                onClose();
              }
            }}
            className="p-2 text-zinc-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl transition"
            title="Odstranit"
          >
            <Trash2 className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onClose();
                onEdit(asset);
              }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 text-xs font-semibold transition"
            >
              <Edit3 className="w-4 h-4" />
              <span>Upravit</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-2xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-xs font-semibold transition"
            >
              Zavřít
            </button>
          </div>
        </div>

      </div>
    </div>,
    document.body
  );
};
