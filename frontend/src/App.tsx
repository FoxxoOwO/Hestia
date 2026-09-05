import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { I18nProvider } from './i18n';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { MobileNav } from './components/MobileNav';

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
import { SettingsPage } from './pages/SettingsPage';

export const App: React.FC = () => {
  return (
    <ThemeProvider>
      <I18nProvider>
        <AuthProvider>
          <BrowserRouter>
            <div className="min-h-screen flex flex-col bg-zinc-50/50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 transition-colors duration-200">
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
                    <Route path="/settings" element={<SettingsPage />} />
                  </Routes>
                </main>
              </div>

              <MobileNav />
            </div>
          </BrowserRouter>
        </AuthProvider>
      </I18nProvider>
    </ThemeProvider>
  );
};

export default App;
