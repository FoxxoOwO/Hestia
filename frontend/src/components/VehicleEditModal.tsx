import React, { useState, useEffect } from 'react';
import { X, Car, Calendar, ShieldCheck, Wrench, Disc, Check, AlertCircle, Phone } from 'lucide-react';
import { Vehicle, VehicleCreate, VehicleUpdate, FuelType, TransmissionType, TireType, VignetteType } from '../types';
import { useTranslation } from '../i18n';

interface VehicleEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: VehicleCreate | VehicleUpdate) => Promise<void>;
  vehicle?: Vehicle | null;
}

export const VehicleEditModal: React.FC<VehicleEditModalProps> = ({
  isOpen,
  onClose,
  onSave,
  vehicle
}) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'basic' | 'deadlines' | 'tires' | 'service'>('basic');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [make, setMake] = useState('Škoda');
  const [model, setModel] = useState('');
  const [year, setYear] = useState<number | ''>('');
  const [color, setColor] = useState('');
  const [licensePlate, setLicensePlate] = useState('');
  const [vin, setVin] = useState('');
  const [fuelType, setFuelType] = useState<FuelType>('diesel');
  const [tankCapacityL, setTankCapacityL] = useState<number | ''>(50);
  const [enginePowerKw, setEnginePowerKw] = useState<number | ''>('');
  const [engineDisplacementCc, setEngineDisplacementCc] = useState<number | ''>('');
  const [transmission, setTransmission] = useState<TransmissionType>('manual');
  const [currentMileage, setCurrentMileage] = useState<number | ''>(0);
  const [isFavorite, setIsFavorite] = useState(false);

  // Deadlines
  const [motExpiryDate, setMotExpiryDate] = useState('');
  const [vignetteExpiryDate, setVignetteExpiryDate] = useState('');
  const [vignetteType, setVignetteType] = useState<VignetteType>('1_year');
  const [insuranceCompany, setInsuranceCompany] = useState('Kooperativa');
  const [insurancePolicyNumber, setInsurancePolicyNumber] = useState('');
  const [insuranceExpiryDate, setInsuranceExpiryDate] = useState('');
  const [insuranceAssistancePhone, setInsuranceAssistancePhone] = useState('+420 1224');
  const [firstAidKitExpiryDate, setFirstAidKitExpiryDate] = useState('');

  // Tires
  const [tireType, setTireType] = useState<TireType>('winter');
  const [tireDimension, setTireDimension] = useState('');
  const [tireTreadDepthMm, setTireTreadDepthMm] = useState<number | ''>(5.0);
  const [tireStorageLocation, setTireStorageLocation] = useState('');

  // Maintenance
  const [oilChangeIntervalKm, setOilChangeIntervalKm] = useState<number | ''>(15000);
  const [oilChangeIntervalMonths, setOilChangeIntervalMonths] = useState<number | ''>(12);
  const [lastOilChangeMileage, setLastOilChangeMileage] = useState<number | ''>('');
  const [lastOilChangeDate, setLastOilChangeDate] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (vehicle) {
      setName(vehicle.name || '');
      setMake(vehicle.make || 'Škoda');
      setModel(vehicle.model || '');
      setYear(vehicle.year || '');
      setColor(vehicle.color || '');
      setLicensePlate(vehicle.license_plate || '');
      setVin(vehicle.vin || '');
      setFuelType(vehicle.fuel_type || 'diesel');
      setTankCapacityL(vehicle.tank_capacity_l ?? 50);
      setEnginePowerKw(vehicle.engine_power_kw || '');
      setEngineDisplacementCc(vehicle.engine_displacement_cc || '');
      setTransmission(vehicle.transmission || 'manual');
      setCurrentMileage(vehicle.current_mileage ?? 0);
      setIsFavorite(vehicle.is_favorite || false);

      setMotExpiryDate(vehicle.mot_expiry_date || '');
      setVignetteExpiryDate(vehicle.vignette_expiry_date || '');
      setVignetteType(vehicle.vignette_type || '1_year');
      setInsuranceCompany(vehicle.insurance_company || '');
      setInsurancePolicyNumber(vehicle.insurance_policy_number || '');
      setInsuranceExpiryDate(vehicle.insurance_expiry_date || '');
      setInsuranceAssistancePhone(vehicle.insurance_assistance_phone || '+420 1224');
      setFirstAidKitExpiryDate(vehicle.first_aid_kit_expiry_date || '');

      setTireType(vehicle.tire_type || 'winter');
      setTireDimension(vehicle.tire_dimension || '');
      setTireTreadDepthMm(vehicle.tire_tread_depth_mm ?? 5.0);
      setTireStorageLocation(vehicle.tire_storage_location || '');

      setOilChangeIntervalKm(vehicle.oil_change_interval_km ?? 15000);
      setOilChangeIntervalMonths(vehicle.oil_change_interval_months ?? 12);
      setLastOilChangeMileage(vehicle.last_oil_change_mileage || '');
      setLastOilChangeDate(vehicle.last_oil_change_date || '');
      setNotes(vehicle.notes || '');
    } else {
      setName('');
      setMake('Škoda');
      setModel('');
      setYear('');
      setColor('');
      setLicensePlate('');
      setVin('');
      setFuelType('diesel');
      setTankCapacityL(50);
      setEnginePowerKw('');
      setEngineDisplacementCc('');
      setTransmission('manual');
      setCurrentMileage(0);
      setIsFavorite(false);

      setMotExpiryDate('');
      setVignetteExpiryDate('');
      setVignetteType('1_year');
      setInsuranceCompany('Kooperativa');
      setInsurancePolicyNumber('');
      setInsuranceExpiryDate('');
      setInsuranceAssistancePhone('+420 1224');
      setFirstAidKitExpiryDate('');

      setTireType('winter');
      setTireDimension('');
      setTireTreadDepthMm(5.0);
      setTireStorageLocation('');

      setOilChangeIntervalKm(15000);
      setOilChangeIntervalMonths(12);
      setLastOilChangeMileage('');
      setLastOilChangeDate('');
      setNotes('');
    }
  }, [vehicle, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !make.trim() || !model.trim() || !licensePlate.trim()) {
      setError('Vyplňte prosím název, značku, model a SPZ vozidla.');
      return;
    }

    try {
      setIsSaving(true);
      setError(null);
      const payload: VehicleCreate = {
        name: name.trim(),
        make: make.trim(),
        model: model.trim(),
        year: year === '' ? undefined : Number(year),
        color: color.trim() || undefined,
        license_plate: licensePlate.trim().toUpperCase(),
        vin: vin.trim().toUpperCase() || undefined,
        fuel_type: fuelType,
        tank_capacity_l: tankCapacityL === '' ? undefined : Number(tankCapacityL),
        engine_power_kw: enginePowerKw === '' ? undefined : Number(enginePowerKw),
        engine_displacement_cc: engineDisplacementCc === '' ? undefined : Number(engineDisplacementCc),
        transmission,
        current_mileage: currentMileage === '' ? 0 : Number(currentMileage),
        is_favorite: isFavorite,

        mot_expiry_date: motExpiryDate || undefined,
        vignette_expiry_date: vignetteExpiryDate || undefined,
        vignette_type: vignetteType,
        insurance_company: insuranceCompany.trim() || undefined,
        insurance_policy_number: insurancePolicyNumber.trim() || undefined,
        insurance_expiry_date: insuranceExpiryDate || undefined,
        insurance_assistance_phone: insuranceAssistancePhone.trim() || undefined,
        first_aid_kit_expiry_date: firstAidKitExpiryDate || undefined,

        tire_type: tireType,
        tire_dimension: tireDimension.trim() || undefined,
        tire_tread_depth_mm: tireTreadDepthMm === '' ? undefined : Number(tireTreadDepthMm),
        tire_storage_location: tireStorageLocation.trim() || undefined,

        oil_change_interval_km: oilChangeIntervalKm === '' ? undefined : Number(oilChangeIntervalKm),
        oil_change_interval_months: oilChangeIntervalMonths === '' ? undefined : Number(oilChangeIntervalMonths),
        last_oil_change_mileage: lastOilChangeMileage === '' ? undefined : Number(lastOilChangeMileage),
        last_oil_change_date: lastOilChangeDate || undefined,
        notes: notes.trim() || undefined,
      };

      await onSave(payload);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Nepodařilo se uložit vozidlo.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-2xl w-full p-6 shadow-2xl relative my-8">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <Car className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                {vehicle ? 'Upravit vozidlo' : 'Přidat vozidlo do garáže'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {vehicle ? `${vehicle.make} ${vehicle.model} (${vehicle.license_plate})` : 'Zadejte identifikační a technické údaje nového rodinného vozu'}
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
        <div className="flex items-center gap-2 mt-4 pb-2 border-b border-slate-100 dark:border-slate-800 overflow-x-auto text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('basic')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition ${
              activeTab === 'basic'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Car className="w-3.5 h-3.5" />
            Základní údaje
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('deadlines')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition ${
              activeTab === 'deadlines'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            STK & Pojištění
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('tires')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition ${
              activeTab === 'tires'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Disc className="w-3.5 h-3.5" />
            Pneumatiky
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('service')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition ${
              activeTab === 'service'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Wrench className="w-3.5 h-3.5" />
            Servis & Intervaly
          </button>
        </div>

        {error && (
          <div className="my-3 p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4 max-h-[60vh] overflow-y-auto pr-1">
          {/* TAB 1: BASIC */}
          {activeTab === 'basic' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Název / Přezdívka vozidla *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="např. Škoda Octavia Combi"
                    className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Registrační značka (SPZ) *
                  </label>
                  <input
                    type="text"
                    required
                    value={licensePlate}
                    onChange={e => setLicensePlate(e.target.value.toUpperCase())}
                    placeholder="např. 1AB 2345"
                    className="w-full px-3 py-2 text-sm font-mono uppercase bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Značka (Výrobce) *
                  </label>
                  <input
                    type="text"
                    required
                    value={make}
                    onChange={e => setMake(e.target.value)}
                    placeholder="Škoda, VW, Kia..."
                    className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Model *
                  </label>
                  <input
                    type="text"
                    required
                    value={model}
                    onChange={e => setModel(e.target.value)}
                    placeholder="Octavia, Fabia, Golf..."
                    className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Rok výroby
                  </label>
                  <input
                    type="number"
                    value={year}
                    onChange={e => setYear(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="2019"
                    className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    VIN kód (číslo karoserie)
                  </label>
                  <input
                    type="text"
                    value={vin}
                    onChange={e => setVin(e.target.value.toUpperCase())}
                    placeholder="TMBJJ7NE8K0194820"
                    className="w-full px-3 py-2 text-sm font-mono uppercase bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Barva karoserie
                  </label>
                  <input
                    type="text"
                    value={color}
                    onChange={e => setColor(e.target.value)}
                    placeholder="např. Šedá metalíza"
                    className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Typ paliva
                  </label>
                  <select
                    value={fuelType}
                    onChange={e => setFuelType(e.target.value as FuelType)}
                    className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  >
                    <option value="diesel">Nafta</option>
                    <option value="petrol">Benzín</option>
                    <option value="lpg">LPG</option>
                    <option value="cng">CNG</option>
                    <option value="hybrid">Hybrid</option>
                    <option value="electric">Elektro</option>
                    <option value="other">Ostatní</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Převodovka
                  </label>
                  <select
                    value={transmission}
                    onChange={e => setTransmission(e.target.value as TransmissionType)}
                    className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  >
                    <option value="manual">Manuální</option>
                    <option value="automatic">Automatická</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Nádrž (litrů)
                  </label>
                  <input
                    type="number"
                    value={tankCapacityL}
                    onChange={e => setTankCapacityL(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Aktuální km *
                  </label>
                  <input
                    type="number"
                    required
                    value={currentMileage}
                    onChange={e => setCurrentMileage(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="164200"
                    className="w-full px-3 py-2 text-sm font-semibold bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: DEADLINES & LEGISLATION */}
          {activeTab === 'deadlines' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-700 dark:text-amber-300">
                Sledujte termíny STK, pojištění a dálniční známky. Hestia vás automaticky včas upozorní (30 dní předem).
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Platnost STK & Měření emisí
                  </label>
                  <input
                    type="date"
                    value={motExpiryDate}
                    onChange={e => setMotExpiryDate(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Dálniční známka ČR (platnost do)
                  </label>
                  <input
                    type="date"
                    value={vignetteExpiryDate}
                    onChange={e => setVignetteExpiryDate(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Pojišťovna (POV / HAV)
                  </label>
                  <input
                    type="text"
                    value={insuranceCompany}
                    onChange={e => setInsuranceCompany(e.target.value)}
                    placeholder="např. Kooperativa, Generali, ČPP"
                    className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Číslo pojistné smlouvy
                  </label>
                  <input
                    type="text"
                    value={insurancePolicyNumber}
                    onChange={e => setInsurancePolicyNumber(e.target.value)}
                    placeholder="KOOP-849201"
                    className="w-full px-3 py-2 text-sm font-mono bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Výročí pojištění
                  </label>
                  <input
                    type="date"
                    value={insuranceExpiryDate}
                    onChange={e => setInsuranceExpiryDate(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Asistenční telefon
                  </label>
                  <input
                    type="text"
                    value={insuranceAssistancePhone}
                    onChange={e => setInsuranceAssistancePhone(e.target.value)}
                    placeholder="+420 1224"
                    className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Expirace autolékárničky
                  </label>
                  <input
                    type="date"
                    value={firstAidKitExpiryDate}
                    onChange={e => setFirstAidKitExpiryDate(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: TIRES */}
          {activeTab === 'tires' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Aktuálně obuté pneu
                  </label>
                  <select
                    value={tireType}
                    onChange={e => setTireType(e.target.value as TireType)}
                    className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  >
                    <option value="winter">Zimní (min. 4 mm dle zákona)</option>
                    <option value="summer">Letní (min. 1.6 mm)</option>
                    <option value="all_season">Celoroční (All Season)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Naměřená hloubka dezénu (mm)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={tireTreadDepthMm}
                    onChange={e => setTireTreadDepthMm(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="např. 5.5"
                    className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Rozměr pneumatik
                </label>
                <input
                  type="text"
                  value={tireDimension}
                  onChange={e => setTireDimension(e.target.value)}
                  placeholder="např. 205/55 R16 91H"
                  className="w-full px-3 py-2 text-sm font-mono bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Kde je uskladněna druhá sada pneumatik?
                </label>
                <input
                  type="text"
                  value={tireStorageLocation}
                  onChange={e => setTireStorageLocation(e.target.value)}
                  placeholder="např. Pneuservis Barum – regál 4B, Garáž na zdi..."
                  className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>
            </div>
          )}

          {/* TAB 4: SERVICE & NOTES */}
          {activeTab === 'service' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Interval výměny oleje (km)
                  </label>
                  <input
                    type="number"
                    value={oilChangeIntervalKm}
                    onChange={e => setOilChangeIntervalKm(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="15000"
                    className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Interval výměny oleje (měsíce)
                  </label>
                  <input
                    type="number"
                    value={oilChangeIntervalMonths}
                    onChange={e => setOilChangeIntervalMonths(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="12"
                    className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Tachometr při poslední výměně oleje (km)
                  </label>
                  <input
                    type="number"
                    value={lastOilChangeMileage}
                    onChange={e => setLastOilChangeMileage(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="155000"
                    className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Datum poslední výměny oleje
                  </label>
                  <input
                    type="date"
                    value={lastOilChangeDate}
                    onChange={e => setLastOilChangeDate(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Poznámky k vozidlu
                </label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="např. Druhý klíč je v šuplíku v pracovně, kód k autorádiu..."
                  className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
            >
              Zrušit
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition flex items-center gap-2 shadow-md shadow-indigo-500/20"
            >
              <Check className="w-4 h-4" />
              <span>{isSaving ? 'Ukládám...' : 'Uložit vozidlo'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
