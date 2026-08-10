import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import { User, Firearm, AuditLog, PecaReparo, AgendamentoManutencao } from '../src/types/index';

const DATA_DIR = path.join(process.cwd(), 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const FIREARMS_FILE = path.join(DATA_DIR, 'firearms.json');
const PECAS_FILE = path.join(DATA_DIR, 'pecas.json');
const AGENDAMENTOS_FILE = path.join(DATA_DIR, 'agendamentos.json');
const LOGS_FILE = path.join(DATA_DIR, 'logs.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

export interface UserRecord extends User {
  passwordHash: string;
}

// Initial seed data
const getInitialUsers = (): UserRecord[] => [
  {
    id: 'usr-teste',
    matricula: 'TESTE',
    nome: 'Usuário de Teste (Admin)',
    cpf: '000.000.000-00',
    email: 'teste@armeria.gm.gov.br',
    cargo: 'Administrador de Teste',
    role: 'ADMIN',
    status: 'ATIVO',
    telefone: '(00) 90000-0000',
    created_at: new Date('2024-01-01').toISOString(),
    passwordHash: bcrypt.hashSync('teste123', 10),
  },
  {
    id: 'usr-admin-1',
    matricula: 'GM-001',
    nome: 'Comandante Silva',
    cpf: '111.222.333-00',
    email: 'admin@armeria.gm.gov.br',
    cargo: 'Comandante da Guarda Municipal',
    role: 'ADMIN',
    status: 'ATIVO',
    telefone: '(11) 98765-4321',
    created_at: new Date('2024-01-10').toISOString(),
    passwordHash: bcrypt.hashSync('admin123', 10),
  },
  {
    id: 'usr-armeiro-1',
    matricula: 'GM-002',
    nome: 'Inspetor Carlos Mendes',
    cpf: '222.333.444-11',
    email: 'armeiro@armeria.gm.gov.br',
    cargo: 'Inspetor / Chefe da Armeria',
    role: 'ARMEIRO',
    status: 'ATIVO',
    telefone: '(11) 97654-3210',
    created_at: new Date('2024-01-15').toISOString(),
    passwordHash: bcrypt.hashSync('armeiro123', 10),
  },
  {
    id: 'usr-operacional-1',
    matricula: 'GM-104',
    nome: 'Guarda 1ª CL Souza',
    cpf: '333.444.555-22',
    email: 'souza@armeria.gm.gov.br',
    cargo: 'Guarda Municipal 1ª Classe',
    role: 'OPERACIONAL',
    status: 'ATIVO',
    telefone: '(11) 96543-2109',
    created_at: new Date('2024-02-01').toISOString(),
    passwordHash: bcrypt.hashSync('guarda123', 10),
  }
];

const getInitialFirearms = (): Firearm[] => [
  {
    id: 'arm-001',
    n_serie: 'TS9-887412',
    n_patrimonio: 'PAT-GM-2023-001',
    tipo: 'PISTOLA',
    marca: 'Taurus',
    modelo: 'TS9',
    calibre: '9mm Parabellum',
    capacidade: 17,
    acabamento: 'Oxidado Negro',
    comprimento_cano: '4.0 polegadas',
    situacao: 'DISPONIVEL',
    condicao: 'EXCELENTE',
    localizacao: 'Armeria Central - Armário A1 - Gaveta 01',
    observacoes: 'Acompanha 3 carregadores de 17 tiros e maleta original.',
    ultima_manutencao: '2026-07-20',
    proxima_manutencao: '2026-08-19',
    historico_manutencao: [
      {
        id: 'man-001',
        data: '2026-07-20',
        tipo: 'PREVENTIVA',
        descricao: 'Revisão periódica preventiva de 30 dias. Limpeza completa, lubrificação e inspeção de percussor.',
        responsavel: 'Inspetor Carlos Mendes'
      }
    ],
    created_at: new Date('2024-01-15').toISOString(),
    updated_at: new Date('2026-07-20').toISOString(),
  },
  {
    id: 'arm-002',
    n_serie: 'PT940-55421',
    n_patrimonio: 'PAT-GM-2022-045',
    tipo: 'PISTOLA',
    marca: 'Taurus',
    modelo: 'PT 940',
    calibre: '.40 S&W',
    capacidade: 12,
    acabamento: 'Inox Fosco',
    comprimento_cano: '4.2 polegadas',
    situacao: 'DISPONIVEL',
    condicao: 'BOM',
    localizacao: 'Armeria Central - Cofre Principal 01',
    observacoes: 'Manutenção atrasada em mais de 7 dias! Necessita revisão preventiva urgente.',
    ultima_manutencao: '2026-06-15',
    proxima_manutencao: '2026-07-15', // Overdue by 20 days (>7 days!)
    historico_manutencao: [
      {
        id: 'man-002',
        data: '2026-06-15',
        tipo: 'PREVENTIVA',
        descricao: 'Desmontagem de 1º escalão e descarbonização da rampa de alimentação.',
        responsavel: 'Inspetor Carlos Mendes'
      }
    ],
    created_at: new Date('2023-06-10').toISOString(),
    updated_at: new Date('2026-06-15').toISOString(),
  },
  {
    id: 'arm-003',
    n_serie: 'ST12-99831',
    n_patrimonio: 'PAT-GM-2021-089',
    tipo: 'ESPINGARDA',
    marca: 'Taurus / CBC',
    modelo: 'ST12 Tactical',
    calibre: '12 GA',
    capacidade: 7,
    acabamento: 'Oxidado Fosco / Polímero',
    comprimento_cano: '19 polegadas',
    situacao: 'MANUTENCAO',
    condicao: 'NECESSITA_REPARO',
    localizacao: 'Oficina de Manutenção Especializada',
    observacoes: 'Substituição necessária da mola do tubo de depósito. Peça solicitada para aquisição.',
    ultima_manutencao: '2026-07-28',
    proxima_manutencao: '2026-08-27',
    historico_manutencao: [
      {
        id: 'man-003',
        data: '2026-07-28',
        tipo: 'CORRETIVA',
        descricao: 'Identificada falha na alimentação do 5º cartucho. Mola do tubo de depósito deformada. Solicitada aquisição de nova mola.',
        responsavel: 'Inspetor Carlos Mendes',
        peca_solicitada: {
          nome_peca: 'Mola do Tubo de Depósito 12GA',
          quantidade: 1,
          descricao: 'Mola de recuperação de cartuchos para espingarda ST12 Tactical CBC/Taurus.'
        }
      }
    ],
    created_at: new Date('2022-04-05').toISOString(),
    updated_at: new Date('2026-07-28').toISOString(),
  },
  {
    id: 'arm-004',
    n_serie: 'CTT40-109283',
    n_patrimonio: 'PAT-GM-2023-012',
    tipo: 'CARABINA',
    marca: 'Taurus',
    modelo: 'CTT 40',
    calibre: '.40 S&W',
    capacidade: 30,
    acabamento: 'Anodizado Preto / Polímero',
    comprimento_cano: '7.9 polegadas',
    situacao: 'DISPONIVEL',
    condicao: 'EXCELENTE',
    localizacao: 'Armeria Central - Cofre Principal 02',
    observacoes: 'Equipado com Red Dot e zarelho tático de 2 pontos.',
    ultima_manutencao: '2026-08-01',
    proxima_manutencao: '2026-08-31',
    historico_manutencao: [
      {
        id: 'man-004',
        data: '2026-08-01',
        tipo: 'PREVENTIVA',
        descricao: 'Inspeção geral e calibração de alça e massa de mira.',
        responsavel: 'Inspetor Carlos Mendes'
      }
    ],
    created_at: new Date('2023-11-20').toISOString(),
    updated_at: new Date('2026-08-01').toISOString(),
  },
  {
    id: 'arm-005',
    n_serie: 'G22-USA7761',
    n_patrimonio: 'PAT-GM-2024-005',
    tipo: 'PISTOLA',
    marca: 'Glock',
    modelo: 'G22 Gen4',
    calibre: '.40 S&W',
    capacidade: 15,
    acabamento: 'nDLC Finish',
    comprimento_cano: '4.49 polegadas',
    situacao: 'DISPONIVEL',
    condicao: 'EXCELENTE',
    localizacao: 'Armeria Central - Armário A2 - Gaveta 03',
    observacoes: 'Manutenção preventiva vencida há 15 dias.',
    ultima_manutencao: '2026-06-20',
    proxima_manutencao: '2026-07-20', // Overdue by 15 days (>7 days!)
    historico_manutencao: [
      {
        id: 'man-005',
        data: '2026-06-20',
        tipo: 'PREVENTIVA',
        descricao: 'Revisão geral pós-treinamento de tiro.',
        responsavel: 'Inspetor Carlos Mendes'
      }
    ],
    created_at: new Date('2024-02-14').toISOString(),
    updated_at: new Date('2026-06-20').toISOString(),
  }
];

const getInitialPecas = (): PecaReparo[] => [
  {
    id: 'peca-001',
    firearm_id: 'arm-003',
    firearm_serie: 'ST12-99831',
    firearm_modelo: 'ST12 Tactical',
    manutencao_id: 'man-003',
    nome_peca: 'Mola do Tubo de Depósito 12GA',
    quantidade: 1,
    descricao: 'Mola de recuperação de cartuchos para espingarda ST12 Tactical CBC/Taurus.',
    data_solicitacao: '2026-07-28T14:30:00.000Z',
    status: 'PENDENTE',
    responsavel: 'Inspetor Carlos Mendes'
  },
  {
    id: 'peca-002',
    firearm_id: 'arm-002',
    firearm_serie: 'PT940-55421',
    firearm_modelo: 'PT 940',
    manutencao_id: 'man-000',
    nome_peca: 'Extrator de Extracao .40 S&W',
    quantidade: 2,
    descricao: 'Extrator de reserva para pistolas Taurus linha PT.',
    data_solicitacao: '2026-07-10T10:00:00.000Z',
    status: 'ADQUIRIDA',
    responsavel: 'Inspetor Carlos Mendes'
  }
];

const getInitialAgendamentos = (): AgendamentoManutencao[] => [
  {
    id: 'agd-001',
    firearm_id: 'arm-001',
    firearm_serie: 'TS9-887412',
    firearm_modelo: 'Taurus TS9',
    firearm_tipo: 'PISTOLA',
    tipo: 'PREVENTIVA',
    data_agendada: '2026-08-19',
    horario: '09:00',
    motivo_observacao: 'Manutenção Preventiva Semestral - Inspeção de percussor e mola recuperadora.',
    status: 'AGENDADO',
    prioridade: 'MEDIA',
    responsavel: 'Inspetor Carlos Mendes',
    created_at: new Date('2026-07-20').toISOString(),
    updated_at: new Date('2026-07-20').toISOString()
  },
  {
    id: 'agd-002',
    firearm_id: 'arm-002',
    firearm_serie: 'PT940-55421',
    firearm_modelo: 'Taurus PT 940',
    firearm_tipo: 'PISTOLA',
    tipo: 'CORRETIVA',
    data_agendada: '2026-07-15',
    horario: '14:30',
    motivo_observacao: 'ATRASADA (+7 DIAS): Troca do extrator de munição e ajuste de trava de segurança.',
    status: 'AGENDADO',
    prioridade: 'CRITICA',
    responsavel: 'Inspetor Carlos Mendes',
    created_at: new Date('2026-06-15').toISOString(),
    updated_at: new Date('2026-06-15').toISOString()
  },
  {
    id: 'agd-003',
    firearm_id: 'arm-003',
    firearm_serie: 'ST12-99831',
    firearm_modelo: 'Taurus / CBC ST12 Tactical',
    firearm_tipo: 'ESPINGARDA',
    tipo: 'CORRETIVA',
    data_agendada: '2026-08-10',
    horario: '10:00',
    motivo_observacao: 'Substituição da mola do tubo de depósito (peça já adquirida) e aferição do ferrolho.',
    status: 'EM_ANDAMENTO',
    prioridade: 'ALTA',
    responsavel: 'Inspetor Carlos Mendes',
    created_at: new Date('2026-07-28').toISOString(),
    updated_at: new Date('2026-07-28').toISOString()
  },
  {
    id: 'agd-004',
    firearm_id: 'arm-004',
    firearm_serie: 'CTT40-109283',
    firearm_modelo: 'Taurus CTT 40',
    firearm_tipo: 'CARABINA',
    tipo: 'PREVENTIVA',
    data_agendada: '2026-08-31',
    horario: '11:00',
    motivo_observacao: 'Revisão geral periódica de 30 dias e aferição de alça/massa de mira.',
    status: 'AGENDADO',
    prioridade: 'BAIXA',
    responsavel: 'Inspetor Carlos Mendes',
    created_at: new Date('2026-08-01').toISOString(),
    updated_at: new Date('2026-08-01').toISOString()
  }
];

// Helper database load & save methods
export class Database {
  private static readJSON<T>(filePath: string, fallback: T): T {
    try {
      if (!fs.existsSync(filePath)) {
        fs.writeFileSync(filePath, JSON.stringify(fallback, null, 2), 'utf-8');
        return fallback;
      }
      const data = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(data) as T;
    } catch (err) {
      console.error(`Error reading ${filePath}:`, err);
      return fallback;
    }
  }

  private static writeJSON<T>(filePath: string, data: T): void {
    try {
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
    } catch (err) {
      console.error(`Error writing ${filePath}:`, err);
    }
  }

  // Users
  public static getUsers(): UserRecord[] {
    return this.readJSON<UserRecord[]>(USERS_FILE, getInitialUsers());
  }

  public static saveUsers(users: UserRecord[]): void {
    this.writeJSON(USERS_FILE, users);
  }

  // Firearms
  public static getFirearms(): Firearm[] {
    return this.readJSON<Firearm[]>(FIREARMS_FILE, getInitialFirearms());
  }

  public static saveFirearms(firearms: Firearm[]): void {
    this.writeJSON(FIREARMS_FILE, firearms);
  }

  // Pecas de Reparo
  public static getPecas(): PecaReparo[] {
    return this.readJSON<PecaReparo[]>(PECAS_FILE, getInitialPecas());
  }

  public static savePecas(pecas: PecaReparo[]): void {
    this.writeJSON(PECAS_FILE, pecas);
  }

  // Agendamentos de Manutenção
  public static getAgendamentos(): AgendamentoManutencao[] {
    return this.readJSON<AgendamentoManutencao[]>(AGENDAMENTOS_FILE, getInitialAgendamentos());
  }

  public static saveAgendamentos(agendamentos: AgendamentoManutencao[]): void {
    this.writeJSON(AGENDAMENTOS_FILE, agendamentos);
  }

  // Audit Logs
  public static getLogs(): AuditLog[] {
    return this.readJSON<AuditLog[]>(LOGS_FILE, []);
  }

  public static addLog(log: Omit<AuditLog, 'id' | 'timestamp'>): void {
    const logs = this.getLogs();
    const newLog: AuditLog = {
      ...log,
      id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString()
    };
    logs.unshift(newLog);
    if (logs.length > 1000) logs.pop();
    this.writeJSON(LOGS_FILE, logs);
  }
}
