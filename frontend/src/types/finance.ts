import { UserSimple } from './chore';

export type TransactionType = 'expense' | 'income';
export type SplitType = 'equal' | 'custom' | 'full';
export type BillingCycle = 'monthly' | 'yearly' | 'quarterly';

export interface Transaction {
  id: number;
  title: string;
  amount: number;
  transaction_type: TransactionType;
  category: string;
  date: string;
  payer_id: number;
  is_shared: boolean;
  split_type: SplitType;
  split_details?: string;
  receipt_url?: string;
  notes?: string;
  is_settled: boolean;
  created_at: string;
  updated_at: string;
  payer?: UserSimple;
}

export interface TransactionCreate {
  title: string;
  amount: number;
  transaction_type?: TransactionType;
  category?: string;
  date: string;
  payer_id: number;
  is_shared?: boolean;
  split_type?: SplitType;
  split_details?: string;
  receipt_url?: string;
  notes?: string;
}

export interface TransactionUpdate {
  title?: string;
  amount?: number;
  transaction_type?: TransactionType;
  category?: string;
  date?: string;
  payer_id?: number;
  is_shared?: boolean;
  split_type?: SplitType;
  split_details?: string;
  receipt_url?: string;
  notes?: string;
  is_settled?: boolean;
}

export interface CategoryBudget {
  id: number;
  category: string;
  monthly_limit: number;
  icon: string;
  color: string;
}

export interface CategoryBudgetCreate {
  category: string;
  monthly_limit: number;
  icon?: string;
  color?: string;
}

export interface Subscription {
  id: number;
  name: string;
  amount: number;
  billing_cycle: BillingCycle;
  next_billing_date: string;
  category: string;
  payer_id?: number;
  is_active: boolean;
  service_url?: string;
  notes?: string;
  created_at: string;
  payer?: UserSimple;
  monthly_equivalent: number;
  days_until_billing?: number;
}

export interface SubscriptionCreate {
  name: string;
  amount: number;
  billing_cycle?: BillingCycle;
  next_billing_date: string;
  category?: string;
  payer_id?: number;
  is_active?: boolean;
  service_url?: string;
  notes?: string;
}

export interface SubscriptionUpdate {
  name?: string;
  amount?: number;
  billing_cycle?: BillingCycle;
  next_billing_date?: string;
  category?: string;
  payer_id?: number;
  is_active?: boolean;
  service_url?: string;
  notes?: string;
}

export interface SavingsGoal {
  id: number;
  title: string;
  target_amount: number;
  current_amount: number;
  target_date?: string;
  icon: string;
  color: string;
  is_completed: boolean;
  notes?: string;
  created_at: string;
  progress_percentage: number;
}

export interface SavingsGoalCreate {
  title: string;
  target_amount: number;
  current_amount?: number;
  target_date?: string;
  icon?: string;
  color?: string;
  is_completed?: boolean;
  notes?: string;
}

export interface SavingsGoalUpdate {
  title?: string;
  target_amount?: number;
  current_amount?: number;
  target_date?: string;
  icon?: string;
  color?: string;
  is_completed?: boolean;
  notes?: string;
}

export interface AddSavingsInput {
  amount: number;
}

export interface DebtSettlementItem {
  from_user_id: number;
  from_user_name: string;
  to_user_id: number;
  to_user_name: string;
  to_user_iban?: string;
  to_user_account?: string;
  amount: number;
  spayd_string: string;
}

export interface MemberBalance {
  user_id: number;
  user_name: string;
  avatar_color: string;
  paid_total: number;
  share_total: number;
  net_balance: number;
}

export interface DebtSettlementResponse {
  balances: MemberBalance[];
  settlements: DebtSettlementItem[];
}

export interface CategorySpendSummary {
  category: string;
  current_month_amount: number;
  historical_monthly_average: number;
  budget_limit?: number;
  percentage_of_budget?: number;
  difference_from_average_percent?: number;
  icon: string;
  color: string;
}

export interface FinanceMonthlySummary {
  month: string;
  total_income: number;
  total_expense: number;
  net_balance: number;
  total_budget: number;
  all_months_average_expense: number;
  distinct_months_count: number;
  categories: CategorySpendSummary[];
  recent_transactions: Transaction[];
}

export interface CsvImportRow {
  date: string;
  title: string;
  amount: number;
  transaction_type: TransactionType;
  category: string;
}

export interface CsvImportPreview {
  rows: CsvImportRow[];
  total_count: number;
  total_income: number;
  total_expense: number;
}

export interface CsvImportConfirm {
  rows: CsvImportRow[];
  payer_id: number;
  is_shared: boolean;
}

export interface ReceiptScanRequest {
  image_base64?: string;
  image_url?: string;
}

export interface ReceiptScanResponse {
  store_name?: string;
  date?: string;
  total_amount?: number;
  category?: string;
  items_summary?: string;
  raw_text?: string;
}

export interface UserFinanceProfile {
  user_id: number;
  bank_account?: string;
  iban?: string;
}
