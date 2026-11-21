import { recipesApi } from './api/recipes';
import { pantryApi } from './api/pantry';
import { shoppingApi } from './api/shopping';
import { aiApi } from './api/ai';
import { plantsApi } from './api/plants';
import { petsApi } from './api/pets';
import { usersApi } from './api/users';
import { choresApi } from './api/chores';
import { financeApi } from './api/finance';
import { documentsApi } from './api/documents';
import { vehiclesApi } from './api/vehicles';
import { medicinesApi } from './api/medicines';
import { authApi } from './api/auth';
import { activitiesApi } from './api/activities';
import { systemApi } from './api/system';
import { backupsApi } from './api/backups';
import { assetsApi } from './api/assets';
import { mealPlansApi } from './api/mealPlans';

export {
  setVaultToken,
  clearVaultToken,
  hasVaultToken,
  resolveDocumentFileUrl,
} from './http';

export const api = {
  ...recipesApi,
  ...pantryApi,
  ...shoppingApi,
  ...aiApi,
  ...plantsApi,
  ...petsApi,
  ...usersApi,
  ...choresApi,
  ...financeApi,
  ...documentsApi,
  ...vehiclesApi,
  ...medicinesApi,
  ...authApi,
  ...activitiesApi,
  ...systemApi,
  ...backupsApi,
  ...assetsApi,
  ...mealPlansApi,
};
