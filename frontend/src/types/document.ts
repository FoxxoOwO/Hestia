export type DocumentCategory =
  | 'warranty'
  | 'contract'
  | 'identity'
  | 'inspection'
  | 'manual'
  | 'medical'
  | 'housing'
  | 'vehicle'
  | 'other';

export type DocumentStatus = 'active' | 'expiring_soon' | 'expired' | 'permanent';

export interface DocumentItem {
  id: number;
  title: string;
  category: DocumentCategory;
  file_path: string;
  file_name: string;
  file_size: number;
  file_type: string;
  issuer?: string;
  document_date?: string;
  expiry_date?: string;
  warranty_months?: number;
  contract_number?: string;
  amount?: number;
  physical_location?: string;
  is_vault_protected: boolean;
  tags?: string;
  summary?: string;
  ocr_fulltext?: string;
  related_entity_type?: string;
  related_entity_id?: number;
  created_by_id?: number;
  created_at: string;
  updated_at: string;
  days_until_expiry?: number | null;
  status: DocumentStatus;
}

export interface DocumentCreate {
  title: string;
  category: DocumentCategory;
  file_path: string;
  file_name: string;
  file_size?: number;
  file_type?: string;
  issuer?: string;
  document_date?: string;
  expiry_date?: string;
  warranty_months?: number;
  contract_number?: string;
  amount?: number;
  physical_location?: string;
  is_vault_protected?: boolean;
  tags?: string;
  summary?: string;
  ocr_fulltext?: string;
  related_entity_type?: string;
  related_entity_id?: number;
}

export interface DocumentUpdate {
  title?: string;
  category?: DocumentCategory;
  file_path?: string;
  file_name?: string;
  file_size?: number;
  file_type?: string;
  issuer?: string;
  document_date?: string;
  expiry_date?: string;
  warranty_months?: number;
  contract_number?: string;
  amount?: number;
  physical_location?: string;
  is_vault_protected?: boolean;
  tags?: string;
  summary?: string;
  ocr_fulltext?: string;
  related_entity_type?: string;
  related_entity_id?: number;
}

export interface DocumentStats {
  total_documents: number;
  expiring_soon_count: number;
  expired_count: number;
  vault_count: number;
  categories: Record<string, number>;
}

export interface DocumentAiScanResponse {
  title?: string;
  category?: DocumentCategory;
  issuer?: string;
  document_date?: string;
  expiry_date?: string;
  warranty_months?: number;
  contract_number?: string;
  amount?: number;
  tags?: string;
  summary?: string;
  ocr_fulltext?: string;
}

export interface DocumentUploadResult {
  file_path: string;
  file_name: string;
  file_size: number;
  file_type: string;
  ai_metadata?: DocumentAiScanResponse;
}
