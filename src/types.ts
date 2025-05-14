export interface CatalogService {
  id: string;
  name: string;
  value: number;
  tenant_id: string;
  created_at: string;
  updated_at: string;
}

export type ServiceStatus = 'orcamento' | 'pago' | 'nao_pago';

export interface Service {
  id: string;
  client_name: string;
  service_date: string;
  car_plate: string;
  car_model: string;
  service_value: number;
  service_id: string;
  selected_services?: string[];
  service?: CatalogService;
  created_at: string;
  updated_at: string;
  auth_code?: string;
  observacoes?: string;
  client_phone?: string;
  tenant_id: string;
  catalog_services?: CatalogService[];
  services?: CatalogService[];
  status?: ServiceStatus;
}

export const REPAIRED_PARTS = [
  'capo',
  'teto',
  'tampa traseira',
  'paralama dianteiro esquerdo',
  'paralama dianteiro direito',
  'porta dianteira esquerda',
  'porta dianteira direita',
  'porta traseira esquerda',
  'porta traseira direita',
  'lateral traseira esquerda',
  'lateral traseira direita',
  'parachoque dianteiro',
  'parachoque traseiro',
  'coluna lado esquerdo',
  'coluna lado direito',
  'polimento',
  'pintura',
  'outros'
] as const;

export type RepairedPart = typeof REPAIRED_PARTS[number];

// Interfaces para a nota fiscal
export interface ClienteNF {
  nome: string;
  telefone?: string;
}

export interface VeiculoNF {
  modelo: string;
  placa: string;
}

export interface ServicoNF {
  descricaoServico: string;
  valor: number;
}

export interface NotaFiscal {
  cliente: ClienteNF;
  veiculo: VeiculoNF;
  servicos: ServicoNF[];
  data: string;
  valorTotal: number;
  codigoAutenticacao: string;
  numeroPedido?: string;
  observacoes?: string;
}