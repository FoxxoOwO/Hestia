import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Car, ArrowLeft, Calendar, ShieldCheck, AlertTriangle, ShieldAlert,
  CheckCircle2, Wrench, Fuel, Gauge, Disc, Heart, Edit3, Trash2,
  PhoneCall, Copy, Check, Plus, ExternalLink, RefreshCw
} from 'lucide-react';
import { api } from '../services/api';
import { Vehicle, VehicleUpdate, VehicleRefuelingCreate, VehicleServiceRecordCreate } from '../types';
import { VehicleEditModal } from '../components/VehicleEditModal';
import { RefuelingModal } from '../components/RefuelingModal';
import { ServiceRecordModal } from '../components/ServiceRecordModal';
import { MileageModal } from '../components/MileageModal';
import { SosAssistantModal } from '../components/SosAssistantModal';
import { useTranslation } from '../i18n';

export const VehicleDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'services' | 'refuelings' | 'sos'>('overview');
  const [copiedVin, setCopiedVin] = useState(false);

  // Modals
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isRefuelOpen, setIsRefuelOpen] = useState(false);
  const [isServiceOpen, setIsServiceOpen] = useState(false);
  const [isMileageOpen, setIsMileageOpen] = useState(false);
  const [isSosOpen, setIsSosOpen] = useState(false);

  const fetchVehicle = async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      const data = await api.getVehicle(Number(id));
      setVehicle(data);
    } catch (e) {
      console.error('Error fetching vehicle:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchVehicle();
  }, [id]);

  const handleCopyVin = () => {
    if (vehicle?.vin) {
      navigator.clipboard.writeText(vehicle.vin);
      setCopiedVin(true);
      setTimeout(() => setCopiedVin(false), 2000);
    }
  };

  const handleToggleFavorite = async () => {
    if (!vehicle) return;
    try {
      const updated = await api.updateVehicle(vehicle.id, { is_favorite: !vehicle.is_favorite });
      setVehicle(updated);
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteVehicle = async () => {
    if (!vehicle) return;
    if (window.confirm(`Opravdu si přejete smazat vozidlo ${vehicle.name}? Tato akce smaže i celou historii tankování a servisu.`)) {
      try {
        await api.deleteVehicle(vehicle.id);
        navigate('/vehicles');
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleUpdateVehicle = async (data: any) => {
    if (!vehicle) return;
    const updated = await api.updateVehicle(vehicle.id, data);
    setVehicle(updated);
  };

  const handleUpdateMileage = async (newMileage: number) => {
    if (!vehicle) return;
    const updated = await api.updateVehicleMileage(vehicle.id, newMileage);
    setVehicle(updated);
  };

  const handleAddRefueling = async (data: VehicleRefuelingCreate) => {
    if (!vehicle) return;
    await api.addRefueling(vehicle.id, data);
    fetchVehicle();
  };

  const handleDeleteRefueling = async (refuelingId: number) => {
    if (!vehicle) return;
    if (window.confirm('Opravdu chcete smazat tento záznam o tankování?')) {
      await api.deleteRefueling(vehicle.id, refuelingId);
      fetchVehicle();
    }
  };

  const handleAddService = async (data: VehicleServiceRecordCreate) => {
    if (!vehicle) return;
    await api.addServiceRecord(vehicle.id, data);
    fetchVehicle();
  };

  const handleDeleteService = async (serviceId: number) => {
    if (!vehicle) return;
    if (window.confirm('Opravdu chcete smazat tento servisní záznam?')) {
      await api.deleteServiceRecord(vehicle.id, serviceId);
      fetchVehicle();
    }
  };

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return '–';
    try {
      return new Date(dateStr).toLocaleDateString('cs-CZ');
    } catch {
      return dateStr;
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin mb-3" />
        <p className="text-sm text-slate-500">{t('common.loading')}</p>
      </div>
    );
  }

  if (!vehicle) {
    return (
      <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
        <p className="text-slate-500 mb-4">Vozidlo nebylo nalezeno.</p>
        <button
          onClick={() => navigate('/vehicles')}
          className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold"
        >
          Zpět do garáže
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Top Breadcrumb & Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/vehicles')}
            className="p-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 transition shadow-sm"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                {vehicle.name}
              </h1>
              <button
                onClick={handleToggleFavorite}
                className="p-1 text-slate-400 hover:text-rose-500 transition"
              >
                <Heart className={`w-5 h-5 ${vehicle.is_favorite ? 'fill-rose-500 text-rose-500' : ''}`} />
              </button>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {vehicle.make} {vehicle.model} {vehicle.year ? `• Rok ${vehicle.year}` : ''} {vehicle.color ? `• ${vehicle.color}` : ''}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="px-3.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl font-mono font-bold text-sm tracking-wider text-slate-900 dark:text-slate-100 shadow-sm">
            {vehicle.license_plate}
          </div>

          <button
            onClick={() => setIsMileageOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl text-xs font-semibold transition"
            title="Aktualizovat stav tachometru"
          >
            <Gauge className="w-4 h-4 text-indigo-500" />
            <span>{vehicle.current_mileage.toLocaleString('cs-CZ')} km</span>
          </button>

          <button
            onClick={() => setIsEditOpen(true)}
            className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition border border-slate-200 dark:border-slate-800"
            title="Upravit vozidlo"
          >
            <Edit3 className="w-4 h-4" />
          </button>

          <button
            onClick={handleDeleteVehicle}
            className="p-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition border border-rose-200 dark:border-rose-900/40"
            title="Smazat vozidlo"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 overflow-x-auto text-xs font-semibold">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl transition whitespace-nowrap ${
            activeTab === 'overview'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>{t('vehicles.tab_overview')}</span>
        </button>

        <button
          onClick={() => setActiveTab('services')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl transition whitespace-nowrap ${
            activeTab === 'services'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Wrench className="w-4 h-4" />
          <span>{t('vehicles.tab_services')}</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20">
            {vehicle.service_records?.length || 0}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('refuelings')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl transition whitespace-nowrap ${
            activeTab === 'refuelings'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Fuel className="w-4 h-4" />
          <span>{t('vehicles.tab_refuelings')}</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20">
            {vehicle.refuelings?.length || 0}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('sos')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl transition whitespace-nowrap ${
            activeTab === 'sos'
              ? 'bg-rose-600 text-white shadow-md shadow-rose-500/20'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <PhoneCall className="w-4 h-4" />
          <span>{t('vehicles.tab_sos')}</span>
        </button>
      </div>

      {/* ======================================================== */}
      {/* TAB 1: OVERVIEW & DEADLINES */}
      {/* ======================================================== */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Key Deadlines Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* MOT / STK */}
            <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-slate-500">STK & Emise</span>
                  {vehicle.mot_status === 'expired' ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-600">Propadlá</span>
                  ) : vehicle.mot_status === 'warning' ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-600">Pozor</span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-600">Platná</span>
                  )}
                </div>
                <div className="text-xl font-bold text-slate-900 dark:text-white">
                  {formatDate(vehicle.mot_expiry_date)}
                </div>
              </div>
              <div className="text-xs text-slate-400 mt-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                {vehicle.mot_days_remaining !== null && vehicle.mot_days_remaining !== undefined ? (
                  vehicle.mot_days_remaining < 0
                    ? `Propadlo před ${Math.abs(vehicle.mot_days_remaining)} dny`
                    : `Zbývá ${vehicle.mot_days_remaining} dní`
                ) : 'Datum nezadáno'}
              </div>
            </div>

            {/* Dálniční známka */}
            <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-slate-500">Dálniční známka ČR</span>
                  {vehicle.vignette_status === 'expired' ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-600">Vypršela</span>
                  ) : vehicle.vignette_status === 'warning' ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-600">Pozor</span>
                  ) : vehicle.vignette_status === 'ok' ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-600">Aktivní</span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-[10px] text-slate-400">Nemá</span>
                  )}
                </div>
                <div className="text-xl font-bold text-slate-900 dark:text-white">
                  {vehicle.vignette_expiry_date ? formatDate(vehicle.vignette_expiry_date) : 'Bez známky'}
                </div>
              </div>
              <div className="text-xs text-slate-400 mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <span>
                  {vehicle.vignette_days_remaining !== null ? `Zbývá ${vehicle.vignette_days_remaining} dní` : '–'}
                </span>
                <a
                  href="https://edalnice.cz"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-indigo-600 hover:underline flex items-center gap-0.5 font-semibold text-[11px]"
                >
                  <span>edalnice.cz</span>
                  <ExternalLink className="w-2.5 h-2.5" />
                </a>
              </div>
            </div>

            {/* Pojištění */}
            <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-slate-500">Pojištění (POV / HAV)</span>
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    {vehicle.insurance_company || 'Pojišťovna'}
                  </span>
                </div>
                <div className="text-xl font-bold text-slate-900 dark:text-white">
                  {vehicle.insurance_expiry_date ? formatDate(vehicle.insurance_expiry_date) : '–'}
                </div>
              </div>
              <div className="text-xs text-slate-400 mt-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                Smlouva: {vehicle.insurance_policy_number || 'neuvedeno'}
              </div>
            </div>

            {/* Výměna oleje */}
            <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-slate-500">Servisní interval oleje</span>
                  {vehicle.oil_status === 'expired' ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-600">Přetaženo!</span>
                  ) : vehicle.oil_status === 'warning' ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-600">Brzy vyměnit</span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-600">V normě</span>
                  )}
                </div>
                <div className="text-xl font-bold text-slate-900 dark:text-white">
                  {vehicle.oil_change_km_remaining !== null && vehicle.oil_change_km_remaining !== undefined
                    ? `za ${vehicle.oil_change_km_remaining.toLocaleString('cs-CZ')} km`
                    : 'Nenastaveno'}
                </div>
              </div>
              <div className="text-xs text-slate-400 mt-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                Poslední výměna: {vehicle.last_oil_change_mileage ? `${vehicle.last_oil_change_mileage.toLocaleString('cs-CZ')} km` : '–'}
              </div>
            </div>
          </div>

          {/* Tires & Specifications row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Tires Card */}
            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2.5 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                    <Disc className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-base">
                    Pneumatiky a sezónní sada
                  </h3>
                </div>
                <span className="px-3 py-1 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  {vehicle.tire_type === 'winter' ? 'Zimní obutí' : vehicle.tire_type === 'summer' ? 'Letní obutí' : 'Celoroční'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 text-xs">
                <div>
                  <div className="text-slate-400 mb-0.5">Rozměr pneu</div>
                  <div className="font-bold text-slate-800 dark:text-slate-200 font-mono">
                    {vehicle.tire_dimension || '–'}
                  </div>
                </div>
                <div>
                  <div className="text-slate-400 mb-0.5">Hloubka dezénu</div>
                  <div className="font-bold text-slate-800 dark:text-slate-200">
                    {vehicle.tire_tread_depth_mm ? `${vehicle.tire_tread_depth_mm} mm` : '–'}
                    <span className="text-[10px] text-slate-400 font-normal ml-1">
                      (min. {vehicle.tire_type === 'winter' ? '4 mm' : '1.6 mm'})
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40 text-xs">
                <div className="font-bold text-indigo-900 dark:text-indigo-300 mb-0.5">
                  Kde je uskladněna druhá sada?
                </div>
                <div className="text-slate-700 dark:text-slate-300">
                  {vehicle.tire_storage_location || 'Není zadáno (např. v pneuservisu nebo garáži)'}
                </div>
              </div>
            </div>

            {/* Technical Specifications Card */}
            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                  <Car className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base">
                  Technické údaje vozidla
                </h3>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                  <div className="text-slate-400 mb-0.5">Palivo</div>
                  <div className="font-bold text-slate-800 dark:text-slate-200 capitalize">
                    {vehicle.fuel_type === 'diesel' ? 'Nafta' : vehicle.fuel_type === 'petrol' ? 'Benzín' : vehicle.fuel_type}
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                  <div className="text-slate-400 mb-0.5">Objem nádrže</div>
                  <div className="font-bold text-slate-800 dark:text-slate-200">
                    {vehicle.tank_capacity_l ? `${vehicle.tank_capacity_l} l` : '–'}
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                  <div className="text-slate-400 mb-0.5">Výkon motoru</div>
                  <div className="font-bold text-slate-800 dark:text-slate-200">
                    {vehicle.engine_power_kw ? `${vehicle.engine_power_kw} kW` : '–'}
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                  <div className="text-slate-400 mb-0.5">Objem válců</div>
                  <div className="font-bold text-slate-800 dark:text-slate-200">
                    {vehicle.engine_displacement_cc ? `${vehicle.engine_displacement_cc} ccm` : '–'}
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                  <div className="text-slate-400 mb-0.5">Převodovka</div>
                  <div className="font-bold text-slate-800 dark:text-slate-200 capitalize">
                    {vehicle.transmission === 'manual' ? 'Manuální' : 'Automatická'}
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                  <div className="text-slate-400 mb-0.5">Lékárnička</div>
                  <div className="font-bold text-slate-800 dark:text-slate-200">
                    {formatDate(vehicle.first_aid_kit_expiry_date)}
                  </div>
                </div>
              </div>

              {/* VIN Code box with copy */}
              {vehicle.vin && (
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                  <div>
                    <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">VIN kód</div>
                    <div className="font-mono text-xs font-bold text-slate-900 dark:text-white tracking-widest">
                      {vehicle.vin}
                    </div>
                  </div>
                  <button
                    onClick={handleCopyVin}
                    className="p-1.5 rounded-lg bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 transition shadow-sm"
                    title="Kopírovat VIN"
                  >
                    {copiedVin ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              )}

              {vehicle.notes && (
                <p className="text-xs text-slate-500 dark:text-slate-400 italic">
                  "{vehicle.notes}"
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 2: SERVICE BOOK */}
      {/* ======================================================== */}
      {activeTab === 'services' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <div>
              <div className="text-xs text-slate-400 font-medium">Celkové výdaje na servis</div>
              <div className="text-2xl font-bold text-slate-900 dark:text-white">
                {vehicle.total_spent_service.toLocaleString('cs-CZ')} Kč
              </div>
            </div>
            <button
              onClick={() => setIsServiceOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-indigo-500/20 transition"
            >
              <Plus className="w-4 h-4" />
              <span>{t('vehicles.add_service')}</span>
            </button>
          </div>

          {vehicle.service_records?.length === 0 ? (
            <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
              <p className="text-xs text-slate-400">Zatím žádné servisní záznamy.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {vehicle.service_records.map(record => (
                <div
                  key={record.id}
                  className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex-shrink-0 mt-0.5">
                      <Wrench className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                          {record.title}
                        </h4>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold">
                          {record.service_type}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
                        <span>{formatDate(record.date)}</span>
                        <span>•</span>
                        <span>{record.mileage.toLocaleString('cs-CZ')} km</span>
                        {record.service_shop && (
                          <>
                            <span>•</span>
                            <span>{record.service_shop}</span>
                          </>
                        )}
                      </div>
                      {record.performed_operations && (
                        <p className="text-xs text-slate-600 dark:text-slate-400 mt-2">
                          {record.performed_operations}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800">
                    <span className="text-sm font-bold text-slate-900 dark:text-white">
                      {record.cost.toLocaleString('cs-CZ')} Kč
                    </span>
                    <button
                      onClick={() => handleDeleteService(record.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition"
                      title="Smazat záznam"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 3: FUEL LOG & REFUELINGS */}
      {/* ======================================================== */}
      {activeTab === 'refuelings' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="text-xs text-slate-400 font-medium">Průměrná spotřeba</div>
              <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                {vehicle.average_consumption ? `${vehicle.average_consumption} l / 100 km` : '–'}
              </div>
            </div>

            <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="text-xs text-slate-400 font-medium">Celkem utraceno za palivo</div>
              <div className="text-2xl font-bold text-slate-900 dark:text-white">
                {vehicle.total_spent_fuel.toLocaleString('cs-CZ')} Kč
              </div>
            </div>

            <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
              <div>
                <div className="text-xs text-slate-400 font-medium">Náklady na 1 km</div>
                <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                  {vehicle.cost_per_km ? `${vehicle.cost_per_km} Kč / km` : '–'}
                </div>
              </div>
              <button
                onClick={() => setIsRefuelOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-amber-500/20 transition"
              >
                <Plus className="w-4 h-4" />
                <span>Natankovat</span>
              </button>
            </div>
          </div>

          {vehicle.refuelings?.length === 0 ? (
            <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
              <p className="text-xs text-slate-400">Zatím žádná zaznamenaná tankování.</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-400 uppercase font-semibold border-b border-slate-100 dark:border-slate-800">
                  <tr>
                    <th className="px-4 py-3">Datum</th>
                    <th className="px-4 py-3">Tachometr</th>
                    <th className="px-4 py-3">Litry</th>
                    <th className="px-4 py-3">Cena / l</th>
                    <th className="px-4 py-3">Celkem</th>
                    <th className="px-4 py-3">Spotřeba</th>
                    <th className="px-4 py-3">Čerpací stanice</th>
                    <th className="px-4 py-3 text-right">Akce</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {vehicle.refuelings.map(r => (
                    <tr key={r.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                      <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">
                        {formatDate(r.date)}
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-300">
                        {r.mileage.toLocaleString('cs-CZ')} km
                      </td>
                      <td className="px-4 py-3 font-bold text-slate-800 dark:text-slate-200">
                        {r.fuel_amount_l} l
                      </td>
                      <td className="px-4 py-3 text-slate-500">
                        {r.price_per_l ? `${r.price_per_l.toFixed(2)} Kč` : '–'}
                      </td>
                      <td className="px-4 py-3 font-bold text-slate-900 dark:text-white">
                        {r.total_price.toLocaleString('cs-CZ')} Kč
                      </td>
                      <td className="px-4 py-3">
                        {r.calculated_consumption ? (
                          <span className="font-bold text-emerald-600 dark:text-emerald-400">
                            {r.calculated_consumption} l / 100 km
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">První nádrž</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                        {r.fuel_brand || '–'}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => handleDeleteRefueling(r.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded transition"
                          title="Smazat"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 4: SOS ASSISTANT & EQUIPMENT */}
      {/* ======================================================== */}
      {activeTab === 'sos' && (
        <div className="space-y-6">
          <div className="p-6 rounded-3xl bg-gradient-to-r from-rose-500 to-red-600 text-white shadow-xl shadow-rose-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-xl font-bold">Potřebujete okamžitou pomoc?</h3>
              <p className="text-xs text-rose-100 mt-1 max-w-md">
                V případě poruchy, defektu nebo nehody volejte asistenční linku své pojišťovny nebo bezplatnou Linku pomoci řidičům 1224.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <a
                href={`tel:${(vehicle.insurance_assistance_phone || '1224').replace(/\s+/g, '')}`}
                className="px-5 py-3 rounded-2xl bg-white text-rose-600 font-bold text-xs flex items-center gap-2 shadow-lg hover:bg-rose-50 transition"
              >
                <PhoneCall className="w-4 h-4" />
                <span>Volat {vehicle.insurance_assistance_phone || '1224'}</span>
              </a>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
              <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                Nouzové linky
              </h4>
              <div className="space-y-2">
                <a href="tel:1224" className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 flex justify-between items-center text-xs font-bold">
                  <span>Linka pomoci řidičům ČR</span>
                  <span className="font-mono text-sm text-indigo-600 dark:text-indigo-400">1224</span>
                </a>
                <a href="tel:155" className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 flex justify-between items-center text-xs font-bold text-rose-700">
                  <span>Záchranná služba (Zranění)</span>
                  <span className="font-mono text-sm">155</span>
                </a>
                <a href="tel:158" className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/40 flex justify-between items-center text-xs font-bold text-blue-700">
                  <span>Policie ČR (Nehoda nad 100 000 Kč)</span>
                  <span className="font-mono text-sm">158</span>
                </a>
                <a href="tel:112" className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex justify-between items-center text-xs font-bold">
                  <span>Tísňová linka SOS</span>
                  <span className="font-mono text-sm">112</span>
                </a>
              </div>
            </div>

            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
              <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                Povinná výbava vozidla
              </h4>
              <div className="space-y-2 text-xs">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>Výstražný trojúhelník</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>Reflexní vesta pro posádku</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>Autolékárnička {vehicle.first_aid_kit_expiry_date && `(do ${formatDate(vehicle.first_aid_kit_expiry_date)})`}</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>Sada na opravu defektu nebo rezerva s heverem</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <VehicleEditModal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        vehicle={vehicle}
        onSave={handleUpdateVehicle}
      />

      <RefuelingModal
        isOpen={isRefuelOpen}
        vehicle={vehicle}
        onClose={() => setIsRefuelOpen(false)}
        onSave={handleAddRefueling}
      />

      <ServiceRecordModal
        isOpen={isServiceOpen}
        vehicle={vehicle}
        onClose={() => setIsServiceOpen(false)}
        onSave={handleAddService}
      />

      <MileageModal
        isOpen={isMileageOpen}
        vehicle={vehicle}
        onClose={() => setIsMileageOpen(false)}
        onSave={handleUpdateMileage}
      />

      <SosAssistantModal
        isOpen={isSosOpen}
        vehicle={vehicle}
        onClose={() => setIsSosOpen(false)}
      />
    </div>
  );
};
export default VehicleDetailPage;
