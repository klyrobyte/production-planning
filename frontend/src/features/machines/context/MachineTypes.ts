export interface FactoryItem {
  id: string;
  code: string;
  name: string;
}

export interface MachineItem {
  id: string;
  factory_id: string;
  factory_code: string;
  factory_name: string;
  code: string;
  name: string;
  type: string | null;
  tonnage: string | null;
  status: 'active' | 'inactive';
  created_at: string;
}

export interface CreateMachinePayload {
  factory_id: string;
  code: string;
  name: string;
  type: string | null;
  tonnage: string | null;
}

export interface UpdateMachinePayload {
  code: string;
  name: string;
  type: string | null;
  tonnage: string | null;
  status: 'active' | 'inactive';
  pin?: string;
}

export interface DeleteTarget {
  id: string;
  name: string;
}
