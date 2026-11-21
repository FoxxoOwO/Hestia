import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { I18nProvider } from './i18n';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { PasswordChangeGate } from './components/PasswordChangeGate';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Flame } from 'lucide-react';

const lazyPage = <T extends Record<string, React.ComponentType<any>>>(
  loader: () => Promise<T>,
  key: keyof T
) => lazy(() => loader().then((m) => ({ default: m[key] })));

const LoginPage = lazyPage(() => import('./pages/LoginPage'), 'LoginPage');
const DashboardPage = lazyPage(() => import('./pages/DashboardPage'), 'DashboardPage');
const RecipesPage = lazyPage(() => import('./pages/RecipesPage'), 'RecipesPage');
const RecipeDetailPage = lazyPage(() => import('./pages/RecipeDetailPage'), 'RecipeDetailPage');
const RecipeEditPage = lazyPage(() => import('./pages/RecipeEditPage'), 'RecipeEditPage');
const PantryPage = lazyPage(() => import('./pages/PantryPage'), 'PantryPage');
const ShoppingListPage = lazyPage(() => import('./pages/ShoppingListPage'), 'ShoppingListPage');
const PlantsPage = lazyPage(() => import('./pages/PlantsPage'), 'PlantsPage');
const PlantDetailPage = lazyPage(() => import('./pages/PlantDetailPage'), 'PlantDetailPage');
const PlantEditPage = lazyPage(() => import('./pages/PlantEditPage'), 'PlantEditPage');
const PetsPage = lazyPage(() => import('./pages/PetsPage'), 'PetsPage');
const PetDetailPage = lazyPage(() => import('./pages/PetDetailPage'), 'PetDetailPage');
const PetEditPage = lazyPage(() => import('./pages/PetEditPage'), 'PetEditPage');
const ChoresPage = lazyPage(() => import('./pages/ChoresPage'), 'ChoresPage');
const FinancePage = lazyPage(() => import('./pages/FinancePage'), 'FinancePage');
const DocumentsPage = lazyPage(() => import('./pages/DocumentsPage'), 'DocumentsPage');
const VehiclesPage = lazyPage(() => import('./pages/VehiclesPage'), 'VehiclesPage');
const VehicleDetailPage = lazyPage(() => import('./pages/VehicleDetailPage'), 'VehicleDetailPage');
const MedicinesPage = lazyPage(() => import('./pages/MedicinesPage'), 'MedicinesPage');
const ActivityHistoryPage = lazyPage(() => import('./pages/ActivityHistoryPage'), 'ActivityHistoryPage');
const AssetsPage = lazyPage(() => import('./pages/AssetsPage'), 'AssetsPage');
const MealPlannerPage = lazyPage(() => import('./pages/MealPlannerPage'), 'MealPlannerPage');
const SettingsPage = lazyPage(() => import('./pages/SettingsPage'), 'SettingsPage');

const RouteFallback: React.FC = () => (
  <div className="py-16 flex flex-col items-center justify-center text-zinc-400">
    <div className="w-7 h-7 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
  </div>
);

const AppContent: React.FC = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-orange-600 to-amber-500 flex items-center justify-center shadow-xl shadow-orange-500/20 mb-4 animate-pulse">
          <Flame className="w-8 h-8 text-white" />
        </div>
        <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mb-2" />
        <span className="text-xs font-semibold text-zinc-400 uppercase tracking-widest">
          Hestia OS
        </span>
      </div>
    );
  }

  if (!user) {
    return (
      <Suspense fallback={<RouteFallback />}>
        <LoginPage />
      </Suspense>
    );
  }

  // Výchozí/dočasné heslo musí být nahrazeno dřív, než se uživatel dostane k datům.
  if (user.must_change_password) {
    return <PasswordChangeGate />;
  }

  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col bg-transparent text-zinc-900 dark:text-zinc-100 transition-colors duration-200 overflow-x-hidden w-full max-w-full">
        <Navbar />
        
        <div className="flex-1 flex max-w-7xl w-full mx-auto overflow-x-hidden">
          <Sidebar />
          <main className="flex-1 p-3 sm:p-6 lg:p-8 min-w-0 w-full max-w-full overflow-x-hidden">
            <ErrorBoundary>
            <Suspense fallback={<RouteFallback />}>
              <Routes>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/recipes" element={<RecipesPage />} />
              <Route path="/recipes/new" element={<RecipeEditPage />} />
              <Route path="/recipes/:id" element={<RecipeDetailPage />} />
              <Route path="/recipes/:id/edit" element={<RecipeEditPage />} />
              <Route path="/meal-planner" element={<MealPlannerPage />} />
              <Route path="/pantry" element={<PantryPage />} />
              <Route path="/shopping" element={<ShoppingListPage />} />
              <Route path="/assets" element={<AssetsPage />} />
              <Route path="/plants" element={<PlantsPage />} />
              <Route path="/plants/new" element={<PlantEditPage />} />
              <Route path="/plants/:id" element={<PlantDetailPage />} />
              <Route path="/plants/:id/edit" element={<PlantEditPage />} />
              <Route path="/pets" element={<PetsPage />} />
              <Route path="/pets/new" element={<PetEditPage />} />
              <Route path="/pets/:id" element={<PetDetailPage />} />
              <Route path="/pets/:id/edit" element={<PetEditPage />} />
              <Route path="/chores" element={<ChoresPage />} />
              <Route path="/finance" element={<FinancePage />} />
              <Route path="/documents" element={<DocumentsPage />} />
              <Route path="/vehicles" element={<VehiclesPage />} />
              <Route path="/vehicles/:id" element={<VehicleDetailPage />} />
              <Route path="/medicines" element={<MedicinesPage />} />
              <Route path="/first-aid" element={<MedicinesPage />} />
              <Route path="/activity" element={<ActivityHistoryPage />} />
              <Route path="/history" element={<ActivityHistoryPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
            </Suspense>
            </ErrorBoundary>
          </main>
        </div>
      </div>
    </BrowserRouter>
  );
};

export const App: React.FC = () => {
  return (
    <ThemeProvider>
      <I18nProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </I18nProvider>
    </ThemeProvider>
  );
};

export default App;
