export type UserRole = 'ADMIN' | 'ARMEIRO' | 'OPERACIONAL';
export type UserStatus = 'ATIVO' | 'INATIVO';

export interface User {
  id: string;
  matricula: string;
  nome: string;
  cpf: string;
  email?: string;
  cargo: string;
  role: UserRole;
  status: UserStatus;
  telefone?: string;
  created_at: string;
}

export type TipoArmamento = 
  | 'PISTOLA' 
  | 'REVOLVER' 
  | 'ESPINGARDA' 
  | 'CARABINA' 
  | 'SUBMETRALHADORA' 
  | 'FUZIL'
  | 'OUTRO';

export type SituacaoArmamento = 
  | 'DISPONIVEL' 
  | 'MANUTENCAO' 
  | 'BAIXADA';

export type CondicaoArmamento = 
  | 'EXCELENTE' 
  | 'BOM' 
  | 'REGULAR' 
  | 'NECESSITA_REPARO';

export type TipoManutencao = 'PREVENTIVA' | 'CORRETIVA';

export interface PecaReparo {
  id: string;
  firearm_id: string;
  firearm_serie: string;
  firearm_modelo: string;
  manutencao_id: string;
  nome_peca: string;
  quantidade: number;
  descricao?: string;
  data_solicitacao: string;
  status: 'PENDENTE' | 'ADQUIRIDA' | 'INSTALADA';
  responsavel: string;
}

export interface RegistroManutencao {
  id: string;
  data: string;
  tipo: TipoManutencao;
  descricao: string;
  responsavel: string;
  peca_solicitada?: {
    nome_peca: string;
    quantidade: number;
    descricao?: string;
  };
}

export interface Firearm {
  id: string;
  n_serie: string;
  n_patrimonio: string;
  tipo: TipoArmamento;
  marca: string;
  modelo: string;
  calibre: string;
  capacidade: number;
  acabamento: string;
  comprimento_cano: string;
  situacao: SituacaoArmamento;
  condicao: CondicaoArmamento;
  localizacao: string;
  observacoes: string;
  ultima_manutencao?: string; // YYYY-MM-DD or ISO
  proxima_manutencao?: string; // YYYY-MM-DD or ISO (30 days after ultima_manutencao)
  historico_manutencao: RegistroManutencao[];
  created_at: string;
  updated_at: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  user_id: string;
  user_nome: string;
  action: string;
  details: string;
  ip?: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export type StatusAgendamento = 'AGENDADO' | 'EM_ANDAMENTO' | 'CONCLUIDO' | 'CANCELADO';
export type PrioridadeAgendamento = 'BAIXA' | 'MEDIA' | 'ALTA' | 'CRITICA';

export interface AgendamentoManutencao {
  id: string;
  firearm_id: string;
  firearm_serie: string;
  firearm_modelo: string;
  firearm_tipo: TipoArmamento;
  tipo: TipoManutencao; // 'PREVENTIVA' | 'CORRETIVA'
  data_agendada: string; // YYYY-MM-DD
  horario?: string; // HH:mm
  motivo_observacao: string;
  status: StatusAgendamento;
  prioridade: PrioridadeAgendamento;
  responsavel?: string;
  concluido_em?: string;
  resultado_descricao?: string;
  created_at: string;
  updated_at: string;
}

export interface DashboardStats {
  totalArmas: number;
  disponiveis: number;
  emManutencao: number;
  baixadas: number;
  atrasadasManutencao: number;
  pecasPendentes: number;
  agendamentosPendentes: number;
  totalUsuarios: number;
}
