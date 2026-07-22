export interface FactoryItem {
  id: string;
  code: string;
  name: string;
  location: string | null;
  created_at: string;
}

export interface FactoryPayload {
  code: string;
  name: string;
  location: string | null;
}

export interface DeleteTarget {
  id: string;
  name: string;
}
