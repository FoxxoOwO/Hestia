import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Upload, FileText, Wrench, Shield, AlertCircle } from 'lucide-react';
import { Asset, AssetCreatePayload, AssetCategory, AssetRoom, AssetStatus } from '../types';
import { useTranslation } from '../i18n';
import { api } from '../services/api';

interface AssetEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  asset?: Asset | null;
  onSave: (savedAsset: Asset) => void;
}

const CATEGORIES: { id: AssetCategory; label: string }[] = [
  { id: 'large_appliance', label: 'Velký spotřebič' },
  { id: 'small_appliance', label: 'Malý spotřebič' },
  { id: 'electronics', label: 'Elektronika a TV' },
  { id: 'tools_garden', label: 'Nářadí a zahrada' },
  { id: 'plumbing_hvac', label: 'Topení, klima a voda' },
  { id: 'furniture', label: 'Nábytek a vybavení' },
  { id: 'other', label: 'Ostatní majetek' },
];

const ROOMS: { id: AssetRoom; label: string }[] = [
  { id: 'kitchen', label: 'Kuchyň' },
  { id: 'bathroom', label: 'Koupelna' },
  { id: 'living_room', label: 'Obývací pokoj' },
  { id: 'bedroom', label: 'Ložnice' },
  { id: 'hallway', label: 'Chodba / Zádveří' },
  { id: 'garage', label: 'Garáž' },
  { id: 'workshop', label: 'Dílna' },
  { id: 'garden', label: 'Zahrada' },
  { id: 'attic_cellar', label: 'Půda / Sklep' },
  { id: 'general', label: 'Celý dům' },
];

export const AssetEditModal: React.FC<AssetEditModalProps> = ({
  isOpen,
  onClose,
  asset,
  onSave,
}) => {
  const { t } = useTranslation();
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [category, setCategory] = useState<AssetCategory>('large_appliance');
  const [room, setRoom] = useState<AssetRoom>('kitchen');
  const [brand, setBrand] = useState('');
  const [modelNumber, setModelNumber] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [purchaseDate, setPurchaseDate] = useState('');
  const [warrantyMonths, setWarrantyMonths] = useState<number>(24);
  const [purchasePrice, setPurchasePrice] = useState<string>('');
  const [storeOrVendor, setStoreOrVendor] = useState('');
  const [manualUrl, setManualUrl] = useState('');
  const [invoiceUrl, setInvoiceUrl] = useState('');
  const [status, setStatus] = useState<AssetStatus>('active');
  const [notes, setNotes] = useState('');
  const [contactService, setContactService] = useState('');

  const [invoiceFile, setInvoiceFile] = useState<File | null>(null);
  const [manualFile, setManualFile] = useState<File | null>(null);

  useEffect(() => {
    if (asset) {
      setName(asset.name || '');
      setCategory(asset.category || 'large_appliance');
      setRoom(asset.room || 'kitchen');
      setBrand(asset.brand || '');
      setModelNumber(asset.model_number || '');
      setSerialNumber(asset.serial_number || '');
      setPurchaseDate(asset.purchase_date || '');
      setWarrantyMonths(asset.warranty_months ?? 24);
      setPurchasePrice(asset.purchase_price != null ? String(asset.purchase_price) : '');
      setStoreOrVendor(asset.store_or_vendor || '');
      setManualUrl(asset.manual_url || '');
      setInvoiceUrl(asset.invoice_url || '');
      setStatus(asset.status || 'active');
      setNotes(asset.notes || '');
      setContactService(asset.contact_service || '');
    } else {
      setName('');
      setCategory('large_appliance');
      setRoom('kitchen');
      setBrand('');
      setModelNumber('');
      setSerialNumber('');
      setPurchaseDate(new Date().toISOString().substring(0, 10));
      setWarrantyMonths(24);
      setPurchasePrice('');
      setStoreOrVendor('');
      setManualUrl('');
      setInvoiceUrl('');
      setStatus('active');
      setNotes('');
      setContactService('');
    }
    setInvoiceFile(null);
    setManualFile(null);
    setError(null);
  }, [asset, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Zadejte název spotřebiče či majetku');
      return;
    }

    try {
      setIsSaving(true);
      setError(null);

      const payload: AssetCreatePayload = {
        name: name.trim(),
        category,
        room,
        brand: brand.trim() || undefined,
        model_number: modelNumber.trim() || undefined,
        serial_number: serialNumber.trim() || undefined,
        purchase_date: purchaseDate || undefined,
        warranty_months: Number(warrantyMonths) || 0,
        purchase_price: purchasePrice ? parseFloat(purchasePrice) : undefined,
        store_or_vendor: storeOrVendor.trim() || undefined,
        manual_url: manualUrl.trim() || undefined,
        invoice_url: invoiceUrl.trim() || undefined,
        status,
        notes: notes.trim() || undefined,
        contact_service: contactService.trim() || undefined,
      };

      let saved: Asset;
      if (asset) {
        saved = await api.updateAsset(asset.id, payload);
      } else {
        saved = await api.createAsset(payload);
      }

      // Handle file uploads if selected
      if (invoiceFile) {
        const uploadRes = await api.uploadAssetFile(saved.id, invoiceFile, 'invoice');
        saved = uploadRes.asset;
      }
      if (manualFile) {
        const uploadRes = await api.uploadAssetFile(saved.id, manualFile, 'manual');
        saved = uploadRes.asset;
      }

      onSave(saved);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Nepodařilo se uložit spotřebič');
    } finally {
      setIsSaving(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-zinc-900 rounded-3xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        
        {/* Header */}
        <div className="p-5 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-orange-500/10 text-orange-600 dark:text-orange-400 flex items-center justify-center">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                {asset ? 'Upravit spotřebič / majetek' : 'Nový spotřebič / majetek'}
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Záruky, sériová čísla, manuály a servisní údaje
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4 text-xs sm:text-sm">
          {error && (
            <div className="p-3 rounded-2xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/40 text-red-600 dark:text-red-400 flex items-center gap-2 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Name & Brand */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Název spotřebiče / předmětu *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="např. Myčka nádobí Bosch Serie 6"
                className="w-full rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/60 px-3.5 py-2.5 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
            <div>
              <label className="block font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Značka / Výrobce
              </label>
              <input
                type="text"
                value={brand}
                onChange={e => setBrand(e.target.value)}
                placeholder="např. Bosch, LG, IKEA"
                className="w-full rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/60 px-3.5 py-2.5 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
          </div>

          {/* Category & Room */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Kategorie
              </label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value as AssetCategory)}
                className="w-full rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/60 px-3.5 py-2.5 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                {CATEGORIES.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Místnost / Umístění
              </label>
              <select
                value={room}
                onChange={e => setRoom(e.target.value as AssetRoom)}
                className="w-full rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/60 px-3.5 py-2.5 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                {ROOMS.map(r => (
                  <option key={r.id} value={r.id}>{r.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Model Number & Serial Number */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Modelové označení
              </label>
              <input
                type="text"
                value={modelNumber}
                onChange={e => setModelNumber(e.target.value)}
                placeholder="např. SMV6ZCX00E"
                className="w-full rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/60 px-3.5 py-2.5 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
            <div>
              <label className="block font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Sériové číslo (S/N)
              </label>
              <input
                type="text"
                value={serialNumber}
                onChange={e => setSerialNumber(e.target.value)}
                placeholder="např. FD0102034567"
                className="w-full rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/60 px-3.5 py-2.5 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
          </div>

          {/* Warranty & Purchase Card */}
          <div className="p-4 rounded-2xl bg-orange-50/50 dark:bg-orange-950/20 border border-orange-200/80 dark:border-orange-900/30 space-y-3">
            <div className="flex items-center gap-2 text-orange-700 dark:text-orange-300 font-semibold text-xs">
              <Shield className="w-4 h-4" />
              <span>Nákup a záruční lhůta</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Datum nákupu
                </label>
                <input
                  type="date"
                  value={purchaseDate}
                  onChange={e => setPurchaseDate(e.target.value)}
                  className="w-full rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3.5 py-2 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div>
                <label className="block font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Záruka (měsíce)
                </label>
                <select
                  value={warrantyMonths}
                  onChange={e => setWarrantyMonths(Number(e.target.value))}
                  className="w-full rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3.5 py-2 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value={0}>Bez záruky (0 měsíců)</option>
                  <option value={12}>1 rok (12 měsíců)</option>
                  <option value={24}>2 roky (24 měsíců - standard)</option>
                  <option value={36}>3 roky (36 měsíců)</option>
                  <option value={60}>5 let (60 měsíců - prodloužená)</option>
                  <option value={120}>10 let (120 měsíců)</option>
                </select>
              </div>
              <div>
                <label className="block font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Cena pořízení (Kč)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={purchasePrice}
                  onChange={e => setPurchasePrice(e.target.value)}
                  placeholder="např. 14990"
                  className="w-full rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3.5 py-2 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>

            <div>
              <label className="block font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Prodejce / Obchod
              </label>
              <input
                type="text"
                value={storeOrVendor}
                onChange={e => setStoreOrVendor(e.target.value)}
                placeholder="např. Alza.cz, Datart, IKEA..."
                className="w-full rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3.5 py-2 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
          </div>

          {/* Files (Invoice & Manual) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3.5 rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/40 space-y-2">
              <label className="block font-medium text-zinc-700 dark:text-zinc-300">
                Účtenka / Záruční list (soubor)
              </label>
              <input
                type="file"
                accept=".pdf,.png,.jpg,.jpeg"
                onChange={e => setInvoiceFile(e.target.files?.[0] || null)}
                className="text-xs text-zinc-500 file:mr-2 file:py-1 file:px-2.5 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-orange-50 file:text-orange-600 dark:file:bg-orange-950/40 dark:file:text-orange-300 hover:file:bg-orange-100 cursor-pointer"
              />
              {invoiceUrl && !invoiceFile && (
                <div className="text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <FileText className="w-3.5 h-3.5" />
                  <span>Uložen doklad: <a href={invoiceUrl} target="_blank" rel="noreferrer" className="underline">Zobrazit</a></span>
                </div>
              )}
            </div>

            <div className="p-3.5 rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/40 space-y-2">
              <label className="block font-medium text-zinc-700 dark:text-zinc-300">
                Uživatelský manuál (soubor nebo odkaz)
              </label>
              <input
                type="file"
                accept=".pdf,.png,.jpg,.jpeg"
                onChange={e => setManualFile(e.target.files?.[0] || null)}
                className="text-xs text-zinc-500 file:mr-2 file:py-1 file:px-2.5 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-orange-50 file:text-orange-600 dark:file:bg-orange-950/40 dark:file:text-orange-300 hover:file:bg-orange-100 cursor-pointer"
              />
              <input
                type="url"
                value={manualUrl}
                onChange={e => setManualUrl(e.target.value)}
                placeholder="nebo vložte odkaz na webový manuál..."
                className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-1.5 text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-orange-500"
              />
            </div>
          </div>

          {/* Service contact & Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Servisní kontakt (telefon / web)
              </label>
              <input
                type="text"
                value={contactService}
                onChange={e => setContactService(e.target.value)}
                placeholder="např. +420 251 095 546 / servis@bosch.cz"
                className="w-full rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/60 px-3.5 py-2.5 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
            <div>
              <label className="block font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Stav
              </label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value as AssetStatus)}
                className="w-full rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/60 px-3.5 py-2.5 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="active">Aktivní (v provozu)</option>
                <option value="in_repair">V opravě / servisu</option>
                <option value="disposed">Vyřazeno / zlikvidováno</option>
                <option value="sold">Prodáno / darováno</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              Poznámky, údržba a náhradní díly
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="např. Sáčky do vysavače typ Swirl S67, HEPA filtr měnit ročně, odvápnění každé 2 měsíce..."
              className="w-full rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/60 px-3.5 py-2.5 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-zinc-200 dark:border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-2xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 font-medium transition"
            >
              Zrušit
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white font-bold shadow-md shadow-orange-500/20 active:scale-95 transition disabled:opacity-50"
            >
              {isSaving ? 'Ukládám...' : asset ? 'Uložit změny' : 'Přidat spotřebič'}
            </button>
          </div>
        </form>

      </div>
    </div>,
    document.body
  );
};
