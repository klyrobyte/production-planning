export interface PartItem {
  id?: string | number;
  area?: string;
  tonnage?: string;
  backup_line?: string;
  home_line?: string;
  sebango?: string;
  customer?: string;
  model?: string;
  part_number: string;
  part_name: string;
  material?: string;
  weight?: number;
  mold?: string;
  cavity?: number;
  cycle_time?: number;
  shikake?: number;
  customer_pno?: string;
  customer_sebango?: string;
  spec?: number;
  process?: string;
  factory_id?: number;
  factory_name?: string;
  ct_seconds?: number;
  pcs_per_kanban?: number;
  qr_webhook_url?: string;
  created_at?: string;
  updated_at?: string;
}

export interface CreatePartPayload {
  part_number: string;
  part_name: string;
  model?: string;
  customer?: string;
  factory_id?: number;
  ct_seconds?: number;
  cavity?: number;
  pcs_per_kanban?: number;
  [key: string]: any;
}

export interface UpdatePartPayload extends Partial<CreatePartPayload> {}

export interface OrderConversionItem {
  id?: string | number;
  cust_part_number?: string;
  cust_sebango?: string;
  prod_sebango?: string;
  part_category?: string;
  customer_code?: string;
  internal_part_id?: number;
  internal_part_number?: string;
  internal_part_name?: string;
  conversion_factor?: number;
  created_at?: string;
  updated_at?: string;
}

export interface CreateConversionPayload {
  cust_part_number?: string;
  cust_sebango?: string;
  prod_sebango?: string;
  part_category?: string;
  customer_code?: string;
  internal_part_id?: number;
  conversion_factor?: number;
}

export interface UpdateConversionPayload extends Partial<CreateConversionPayload> {}

export interface LeaderItem {
  id: string | number;
  name: string;
  pin?: string;
  npk?: string;
  shift?: string;
  process_line?: string;
  created_at?: string;
  updated_at?: string;
}

export interface CreateLeaderPayload {
  name: string;
  pin?: string;
  npk?: string;
  shift?: string;
  process_line?: string;
}

export interface UpdateLeaderPayload extends Partial<CreateLeaderPayload> {}

export interface ExcelImportResult {
  inserted: number;
  updated?: number;
  failed?: number;
  errors?: string[];
}

export interface DatabaseTabProps {
  refreshTrigger: number;
}

export type MasterPartsTabProps = DatabaseTabProps;
export type OrderConversionsTabProps = DatabaseTabProps;
export type LeadersTabProps = DatabaseTabProps;
