export interface Service {
  id: string;
  client_name: string;
  car_model: string;
  car_plate: string;
  service_date: string;
  service_value: number;
  status?: string;
  completion_status?: string;
  tenant_id: string;
  auth_code?: string;
  selected_services?: string[];
  service?: {
    id: string;
    name: string;
    value: number;
  };
  catalog_services?: Array<{
    id: string;
    name: string;
    value: number;
  }>;
  services?: Array<{
    id: string;
    name: string;
    value: number;
  }>;
  repaired_parts?: string[] | string | Record<string, any>;
  photos?: any[];
} 