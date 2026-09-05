import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Car, Plus, Search, AlertTriangle, ShieldAlert, CheckCircle2,
  Fuel, Wrench, ShieldCheck, Gauge, Disc, Heart, ExternalLink,
  ChevronRight, PhoneCall, Sparkles, RefreshCw
} from 'lucide-react';
import { api } from '../services/api';
import { Vehicle, VehicleFleetStats, VehicleCreate, VehicleUpdate, VehicleRefuelingCreate, VehicleServiceRecordCreate } from '../types';
import { VehicleEditModal } from '../components/VehicleEditModal';
import { RefuelingModal } from '../components/RefuelingModal';
import { ServiceRecordModal } from '../components/ServiceRecordModal';
import { SosAssistantModal } from '../components/SosAssistantModal';
import { useTranslation } from '../i18n';

export const VehiclesPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [stats, setStats] = useState<VehicleFleetStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [favoriteOnly, setFavoriteOnly] = useState(false);

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [refuelingVehicle, setRefuelingVehicle] = useState<Vehicle | null>(null);
  const [serviceVehicle, setServiceVehicle] = useState<Vehicle | null>(null);
  const [sosVehicle, setSosVehicle] = useState<Vehicle | null>(null);

  const fetchVehicles = async () => {
    setIsLoading(true);
    try {
      const [vList, sData] = await Promise.all([
        api.getVehicles({ query: searchQuery.trim() || undefined, favorite_only: favoriteOnly }),
        api.getVehicleFleetStats()
      ]);
      setVehicles(vList);
      setStats(sData);
    } catch (e) {
      console.error('Error fetching vehicles:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchVehicles();
    }, 250);
    return () => clearTimeout(timer);
  }, [searchQuery, favoriteOnly]);

  const handleCreateVehicle = async (data: VehicleCreate | VehicleUpdate) => {
    await api.createVehicle(data as VehicleCreate);
    fetchVehicles();
  };

  const handleSaveRefueling = async (data: VehicleRefuelingCreate) => {
    if (!refuelingVehicle) return;
    await api.addRefueling(refuelingVehicle.id, data);
    fetchVehicles();
  };

  const handleSaveService = async (data: VehicleServiceRecordCreate) => {
    if (!serviceVehicle) return;
    await api.addServiceRecord(serviceVehicle.id, data);
    fetchVehicles();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
            <Car className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              {t('vehicles.title')}
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {t('vehicles.subtitle')}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-semibold text-sm transition shadow-lg shadow-indigo-500/20"
          >
            <Plus className="w-4 h-4" />
            <span>{t('vehicles.add_vehicle')}</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total Vehicles */}
        <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-sm flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
            <Car className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">
              {stats?.total_vehicles ?? '–'}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              {t('vehicles.kpi_total')}
            </div>
          </div>
        </div>

        {/* Warning Deadlines */}
        <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-sm flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
              {stats?.warning_deadlines_count ?? 0}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              {t('vehicles.kpi_warning')}
            </div>
          </div>
        </div>

        {/* Expired Deadlines */}
        <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-sm flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-rose-600 dark:text-rose-400">
              {stats?.expired_deadlines_count ?? 0}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              {t('vehicles.kpi_expired')}
            </div>
          </div>
        </div>

        {/* Fleet Average Consumption */}
        <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-sm flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <Fuel className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {stats?.fleet_average_consumption ? `${stats.fleet_average_consumption} l` : '–'}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              {t('vehicles.kpi_avg_consumption')} (l/100 km)
            </div>
          </div>
        </div>
      </div>

      {/* Toolbar: Search and Filter */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="relative flex-1 w-full sm:w-auto">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder={t('vehicles.search_placeholder')}
            className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          />
        </div>

        <button
          onClick={() => setFavoriteOnly(!favoriteOnly)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition ${
            favoriteOnly
              ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200 dark:border-rose-800'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Heart className={`w-3.5 h-3.5 ${favoriteOnly ? 'fill-rose-500 text-rose-500' : ''}`} />
          <span>Pouze oblíbená vozidla</span>
        </button>
      </div>

      {/* Vehicles Grid */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin mb-3" />
          <p className="text-sm text-slate-500">{t('common.loading')}</p>
        </div>
      ) : vehicles.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-4 text-3xl">
            🚗
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
            {t('vehicles.no_vehicles')}
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-6">
            Začněte přidáním prvního vozidla. Hestia pohlídá termíny STK, dálniční známky, výměnu oleje a reálnou spotřebu.
          </p>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-semibold text-sm transition shadow-lg shadow-indigo-500/20"
          >
            <Plus className="w-4 h-4" />
            <span>{t('vehicles.add_first_vehicle')}</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {vehicles.map(vehicle => {
            return (
              <div
                key={vehicle.id}
                className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800/90 hover:border-indigo-500/40 hover:shadow-xl transition flex flex-col justify-between"
              >
                <div>
                  {/* Top Bar */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="p-3 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                        <Car className="w-7 h-7" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-slate-900 dark:text-white text-lg">
                            {vehicle.name}
                          </h3>
                          {vehicle.is_favorite && (
                            <Heart className="w-4 h-4 fill-rose-500 text-rose-500" />
                          )}
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {vehicle.make} {vehicle.model} {vehicle.year ? `(${vehicle.year})` : ''}
                        </p>
                      </div>
                    </div>

                    {/* License Plate Badge */}
                    <div className="px-3 py-1 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-mono font-bold text-xs tracking-wider text-slate-900 dark:text-slate-100 shadow-inner">
                      {vehicle.license_plate}
                    </div>
                  </div>

                  {/* Mileage and Engine info */}
                  <div className="flex items-center gap-3 text-xs text-slate-600 dark:text-slate-400 mb-4 flex-wrap">
                    <div className="flex items-center gap-1 font-semibold text-slate-800 dark:text-slate-200">
                      <Gauge className="w-3.5 h-3.5 text-indigo-500" />
                      <span>{vehicle.current_mileage.toLocaleString('cs-CZ')} km</span>
                    </div>
                    <span>•</span>
                    <span className="capitalize">{vehicle.fuel_type === 'diesel' ? 'Nafta' : vehicle.fuel_type === 'petrol' ? 'Benzín' : vehicle.fuel_type}</span>
                    {vehicle.engine_power_kw && (
                      <>
                        <span>•</span>
                        <span>{vehicle.engine_power_kw} kW</span>
                      </>
                    )}
                    {vehicle.average_consumption && (
                      <>
                        <span>•</span>
                        <span className="font-bold text-emerald-600 dark:text-emerald-400">
                          {vehicle.average_consumption} l/100 km
                        </span>
                      </>
                    )}
                  </div>

                  {/* Deadlines Status Indicators */}
                  <div className="space-y-2 mb-4 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 text-xs">
                    {/* MOT */}
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-medium">STK & Emise</span>
                      {vehicle.mot_status === 'expired' ? (
                        <span className="flex items-center gap-1 font-bold text-rose-600">
                          <ShieldAlert className="w-3.5 h-3.5" />
                          Propadlá ({vehicle.mot_days_remaining} d.)
                        </span>
                      ) : vehicle.mot_status === 'warning' ? (
                        <span className="flex items-center gap-1 font-bold text-amber-600">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          Vyprší za {vehicle.mot_days_remaining} dní
                        </span>
                      ) : vehicle.mot_days_remaining !== null ? (
                        <span className="flex items-center gap-1 text-emerald-600 font-medium">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Platná ({vehicle.mot_days_remaining} d.)
                        </span>
                      ) : (
                        <span className="text-slate-400">Neuvedeno</span>
                      )}
                    </div>

                    {/* Vignette */}
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-medium">Dálniční známka ČR</span>
                      {vehicle.vignette_status === 'expired' ? (
                        <span className="flex items-center gap-1 font-bold text-rose-600">
                          <ShieldAlert className="w-3.5 h-3.5" />
                          Vypršela
                        </span>
                      ) : vehicle.vignette_status === 'warning' ? (
                        <span className="flex items-center gap-1 font-bold text-amber-600">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          Vyprší za {vehicle.vignette_days_remaining} dní
                        </span>
                      ) : vehicle.vignette_days_remaining !== null ? (
                        <span className="flex items-center gap-1 text-emerald-600 font-medium">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Platná ({vehicle.vignette_days_remaining} d.)
                        </span>
                      ) : (
                        <span className="text-slate-400">Nemá</span>
                      )}
                    </div>

                    {/* Oil change */}
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-medium">Výměna oleje</span>
                      {vehicle.oil_status === 'expired' ? (
                        <span className="flex items-center gap-1 font-bold text-rose-600">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          Přetaženo!
                        </span>
                      ) : vehicle.oil_change_km_remaining !== null && vehicle.oil_change_km_remaining !== undefined ? (
                        <span className={`font-medium ${vehicle.oil_status === 'warning' ? 'text-amber-600 font-bold' : 'text-slate-700 dark:text-slate-300'}`}>
                          za {vehicle.oil_change_km_remaining.toLocaleString('cs-CZ')} km
                        </span>
                      ) : (
                        <span className="text-slate-400">Neuvedeno</span>
                      )}
                    </div>

                    {/* Tires */}
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-medium">Pneumatiky</span>
                      <span className="text-slate-700 dark:text-slate-300 font-medium flex items-center gap-1">
                        <Disc className="w-3 h-3 text-slate-400" />
                        {vehicle.tire_type === 'winter' ? 'Zimní' : vehicle.tire_type === 'summer' ? 'Letní' : 'Celoroční'}
                        {vehicle.tire_tread_depth_mm && ` (${vehicle.tire_tread_depth_mm} mm)`}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Bottom Action Bar */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setRefuelingVehicle(vehicle)}
                      className="px-2.5 py-1.5 text-xs font-semibold rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 hover:bg-amber-100 transition flex items-center gap-1"
                      title="Zapsat tankování"
                    >
                      <Fuel className="w-3.5 h-3.5" />
                      <span>Natankovat</span>
                    </button>
                    <button
                      onClick={() => setServiceVehicle(vehicle)}
                      className="px-2.5 py-1.5 text-xs font-semibold rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 transition flex items-center gap-1"
                      title="Zapsat servis"
                    >
                      <Wrench className="w-3.5 h-3.5" />
                      <span>Servis</span>
                    </button>
                    <button
                      onClick={() => setSosVehicle(vehicle)}
                      className="p-1.5 text-xs font-semibold rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 hover:bg-rose-100 transition"
                      title="SOS Asistence při nehodě"
                    >
                      <PhoneCall className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <button
                    onClick={() => navigate(`/vehicles/${vehicle.id}`)}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 transition"
                  >
                    <span>Spravovat</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modals */}
      <VehicleEditModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSave={handleCreateVehicle}
      />

      <RefuelingModal
        isOpen={!!refuelingVehicle}
        vehicle={refuelingVehicle}
        onClose={() => setRefuelingVehicle(null)}
        onSave={handleSaveRefueling}
      />

      <ServiceRecordModal
        isOpen={!!serviceVehicle}
        vehicle={serviceVehicle}
        onClose={() => setServiceVehicle(null)}
        onSave={handleSaveService}
      />

      <SosAssistantModal
        isOpen={!!sosVehicle}
        vehicle={sosVehicle}
        onClose={() => setSosVehicle(null)}
      />
    </div>
  );
};
export default VehiclesPage;
