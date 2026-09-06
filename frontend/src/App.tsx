import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { I18nProvider } from './i18n';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';

import { LoginPage } from './pages/LoginPage';
import { RecipesPage } from './pages/RecipesPage';
import { RecipeDetailPage } from './pages/RecipeDetailPage';
import { RecipeEditPage } from './pages/RecipeEditPage';
import { PantryPage } from './pages/PantryPage';
import { ShoppingListPage } from './pages/ShoppingListPage';
import { PlantsPage } from './pages/PlantsPage';
import { PlantDetailPage } from './pages/PlantDetailPage';
import { PlantEditPage } from './pages/PlantEditPage';
import { PetsPage } from './pages/PetsPage';
import { PetDetailPage } from './pages/PetDetailPage';
import { PetEditPage } from './pages/PetEditPage';
import { ChoresPage } from './pages/ChoresPage';
import { FinancePage } from './pages/FinancePage';
import { DocumentsPage } from './pages/DocumentsPage';
import { VehiclesPage } from './pages/VehiclesPage';
import { VehicleDetailPage } from './pages/VehicleDetailPage';
import { MedicinesPage } from './pages/MedicinesPage';
import { ActivityHistoryPage } from './pages/ActivityHistoryPage';
import { SettingsPage } from './pages/SettingsPage';
import { Flame } from 'lucide-react';

const AppContent: React.FC = () => {
  const { user, token, isLoading } = useAuth();

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

  if (!user || !token) {
    return <LoginPage />;
  }

  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col bg-transparent text-zinc-900 dark:text-zinc-100 transition-colors duration-200">
        <Navbar />
        
        <div className="flex-1 flex max-w-7xl w-full mx-auto">
          <Sidebar />
          <main className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0">
            <Routes>
              <Route path="/" element={<RecipesPage />} />
              <Route path="/recipes/new" element={<RecipeEditPage />} />
              <Route path="/recipes/:id" element={<RecipeDetailPage />} />
              <Route path="/recipes/:id/edit" element={<RecipeEditPage />} />
              <Route path="/pantry" element={<PantryPage />} />
              <Route path="/shopping" element={<ShoppingListPage />} />
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
