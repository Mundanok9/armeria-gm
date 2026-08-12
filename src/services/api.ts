import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where 
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { 
  User, 
  Firearm, 
  AuditLog, 
  DashboardStats, 
  SituacaoArmamento, 
  TipoArmamento, 
  CondicaoArmamento, 
  PecaReparo, 
  RegistroManutencao,
  AgendamentoManutencao, 
  StatusAgendamento, 
  PrioridadeAgendamento 
} from '../types/index';

export const MOCK_TEST_USER: User = {
  id: 'usr-teste',
  matricula: 'TESTE',
  nome: 'Usuário de Teste (Admin)',
  cpf: '000.000.000-00',
  email: 'teste@armeria.gm.gov.br',
  cargo: 'Administrador de Teste',
  role: 'ADMIN',
  status: 'ATIVO',
  telefone: '(00) 90000-0000',
  created_at: new Date().toISOString(),
};

// Initial Seed Data for Firestore (Empty for production initialization)
const INITIAL_FIREARMS: Firearm[] = [];

const INITIAL_USERS: User[] = [
  MOCK_TEST_USER,
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
    created_at: new Date('2024-01-10').toISOString()
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
    created_at: new Date('2024-01-15').toISOString()
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
    created_at: new Date('2024-02-01').toISOString()
  }
];

const INITIAL_PECAS: PecaReparo[] = [];

const INITIAL_AGENDAMENTOS: AgendamentoManutencao[] = [];

// Helper to seed Firebase collection if empty
async function seedCollectionIfEmpty<T extends { id: string }>(colName: string, initialData: T[]): Promise<void> {
  if (!initialData || initialData.length === 0) return;
  try {
    const colRef = collection(db, colName);
    const snap = await getDocs(colRef);
    if (snap.empty) {
      for (const item of initialData) {
        await setDoc(doc(db, colName, item.id), item);
      }
    }
  } catch (err) {
    console.warn(`[Firebase] Could not seed ${colName}:`, err);
  }
}

let isSeeded = false;
async function ensureDbSeeded() {
  if (isSeeded) return;
  isSeeded = true;
  await seedCollectionIfEmpty('users', INITIAL_USERS);

  // One-time automatic cleanup of pre-existing mock seed data
  if (!localStorage.getItem('armeria_gm_reset_v2')) {
    localStorage.setItem('armeria_gm_reset_v2', 'true');
    try {
      await ApiService.resetSystemData();
    } catch (err) {
      console.warn('[Auto reset error]', err);
    }
  }
}

export class ApiService {
  private static getToken(): string | null {
    return localStorage.getItem('armeria_gm_token');
  }

  public static setToken(token: string): void {
    localStorage.setItem('armeria_gm_token', token);
  }

  public static clearToken(): void {
    localStorage.removeItem('armeria_gm_token');
    localStorage.removeItem('armeria_gm_mock_user');
  }

  public static mockLogin(userToLogin: User = MOCK_TEST_USER): { token: string; user: User } {
    const token = `mock_jwt_token_${userToLogin.id}`;
    this.setToken(token);
    localStorage.setItem('armeria_gm_mock_user', JSON.stringify(userToLogin));
    return { token, user: userToLogin };
  }

  public static async login(matricula: string, _password?: string): Promise<{ token: string; user: User }> {
    await ensureDbSeeded();
    const cleanMat = matricula.trim().toUpperCase();

    // Check Firebase for user with matching matricula
    try {
      const q = query(collection(db, 'users'), where('matricula', '==', cleanMat));
      const snap = await getDocs(q);
      if (!snap.empty) {
        const foundUser = snap.docs[0].data() as User;
        return this.mockLogin(foundUser);
      }
    } catch (e) {
      console.error('[Firebase Login Error]', e);
    }

    // Default fallback users if not found
    let role: 'ADMIN' | 'ARMEIRO' | 'OPERACIONAL' = 'ADMIN';
    let nome = 'Usuário da Armeria';
    if (cleanMat === 'GM-002') { role = 'ARMEIRO'; nome = 'Inspetor Carlos Mendes'; }
    if (cleanMat === 'GM-104') { role = 'OPERACIONAL'; nome = 'Guarda 1ª CL Souza'; }
    if (cleanMat === 'GM-001') { role = 'ADMIN'; nome = 'Comandante Silva'; }

    const userObj: User = {
      id: `usr-${cleanMat.toLowerCase()}`,
      matricula: cleanMat,
      nome,
      cpf: '000.000.000-00',
      cargo: role === 'ADMIN' ? 'Administrador' : role === 'ARMEIRO' ? 'Inspetor Armeiro' : 'Guarda Municipal',
      role,
      status: 'ATIVO',
      created_at: new Date().toISOString()
    };
    return this.mockLogin(userObj);
  }

  public static async getProfile(): Promise<User> {
    const savedUserStr = localStorage.getItem('armeria_gm_mock_user');
    if (savedUserStr) {
      return JSON.parse(savedUserStr) as User;
    }
    return MOCK_TEST_USER;
  }

  // FIREARMS
  public static async getFirearms(filters?: {
    search?: string;
    tipo?: TipoArmamento | 'TODOS';
    situacao?: SituacaoArmamento | 'TODOS';
    condicao?: CondicaoArmamento | 'TODOS';
    atrasadas?: boolean | string;
  }): Promise<Firearm[]> {
    await ensureDbSeeded();
    await this.syncAndFixMaintenanceSchedules();
    try {
      const colRef = collection(db, 'firearms');
      const snap = await getDocs(colRef);
      let list = snap.docs.map(d => d.data() as Firearm);

      if (filters?.search) {
        const term = filters.search.toLowerCase();
        list = list.filter(f => 
          f.n_serie?.toLowerCase().includes(term) ||
          f.n_patrimonio?.toLowerCase().includes(term) ||
          f.modelo?.toLowerCase().includes(term) ||
          f.marca?.toLowerCase().includes(term) ||
          f.localizacao?.toLowerCase().includes(term)
        );
      }

      if (filters?.tipo && filters.tipo !== 'TODOS') {
        list = list.filter(f => f.tipo === filters.tipo);
      }

      if (filters?.situacao && filters.situacao !== 'TODOS') {
        list = list.filter(f => f.situacao === filters.situacao);
      }

      if (filters?.condicao && filters.condicao !== 'TODOS') {
        list = list.filter(f => f.condicao === filters.condicao);
      }

      if (filters?.atrasadas) {
        const todayStr = new Date().toISOString().split('T')[0];
        list = list.filter(f => f.proxima_manutencao && f.proxima_manutencao < todayStr);
      }

      return list;
    } catch (err) {
      console.error('[Firebase getFirearms error]', err);
      return [];
    }
  }

  // Helper to remove any duplicate or superseded active schedules for a firearm
  private static async clearExistingActiveAgendamentos(firearmId: string, keepAgdId?: string): Promise<void> {
    try {
      const agendamentosSnap = await getDocs(collection(db, 'agendamentos'));
      for (const itemDoc of agendamentosSnap.docs) {
        const agd = itemDoc.data() as AgendamentoManutencao;
        if (agd.firearm_id === firearmId && agd.id !== keepAgdId && (agd.status === 'AGENDADO' || agd.status === 'EM_ANDAMENTO')) {
          await deleteDoc(doc(db, 'agendamentos', itemDoc.id));
        }
      }
    } catch (e) {
      console.warn('[clearExistingActiveAgendamentos error]', e);
    }
  }

  // Automatic Auditor to fix missing or past-due +30 days maintenance schedules and strictly enforce rules:
  // - If firearm is MANUTENCAO, NECESSITA_REPARO, or BAIXADA: remove active schedule from Agendamentos tab!
  // - If firearm is DISPONIVEL: ensure exactly 1 active 30-day schedule exists.
  private static async syncAndFixMaintenanceSchedules(): Promise<void> {
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      const next30 = new Date();
      next30.setDate(next30.getDate() + 30);
      const next30Str = next30.toISOString().split('T')[0];

      const firearmsSnap = await getDocs(collection(db, 'firearms'));
      if (firearmsSnap.empty) return;

      const agendamentosSnap = await getDocs(collection(db, 'agendamentos'));
      const agendamentosList = agendamentosSnap.docs.map(d => d.data() as AgendamentoManutencao);

      for (const docItem of firearmsSnap.docs) {
        const farm = docItem.data() as Firearm;
        const isEmManutencaoOuReparo = farm.situacao === 'MANUTENCAO' || farm.condicao === 'NECESSITA_REPARO' || farm.situacao === 'BAIXADA';

        const activeSchedules = agendamentosList.filter(
          a => a.firearm_id === farm.id && (a.status === 'AGENDADO' || a.status === 'EM_ANDAMENTO')
        );

        if (isEmManutencaoOuReparo) {
          // Remove active schedules for firearms in maintenance/repair/retired
          for (const agd of activeSchedules) {
            await deleteDoc(doc(db, 'agendamentos', agd.id));
          }
        } else {
          // Firearm is DISPONIVEL
          let targetNextDate = farm.proxima_manutencao;

          if (!targetNextDate || targetNextDate < todayStr) {
            targetNextDate = next30Str;
            await updateDoc(doc(db, 'firearms', farm.id), {
              proxima_manutencao: targetNextDate,
              updated_at: new Date().toISOString()
            });
          }

          if (activeSchedules.length > 1) {
            // Keep only 1 active schedule
            activeSchedules.sort((a, b) => new Date(b.updated_at || b.created_at || 0).getTime() - new Date(a.updated_at || a.created_at || 0).getTime());
            for (let i = 1; i < activeSchedules.length; i++) {
              await deleteDoc(doc(db, 'agendamentos', activeSchedules[i].id));
            }
          } else if (activeSchedules.length === 0) {
            const newAgdId = `agd-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
            const newAgd: AgendamentoManutencao = {
              id: newAgdId,
              firearm_id: farm.id,
              firearm_serie: farm.n_serie,
              firearm_modelo: farm.modelo,
              firearm_tipo: farm.tipo,
              tipo: 'PREVENTIVA',
              data_agendada: targetNextDate,
              horario: '09:00',
              motivo_observacao: 'Manutenção preventiva periódica programada (ciclo de 30 dias).',
              status: 'AGENDADO',
              prioridade: 'MEDIA',
              responsavel: 'Inspetor Armeiro',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            };
            await setDoc(doc(db, 'agendamentos', newAgdId), newAgd);
          }
        }
      }
    } catch (e) {
      console.warn('[syncAndFixMaintenanceSchedules error]', e);
    }
  }

  public static async getFirearm(id: string): Promise<Firearm> {
    await ensureDbSeeded();
    try {
      const docRef = doc(db, 'firearms', id);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        return snap.data() as Firearm;
      }
    } catch (e) {
      console.error('[Firebase getFirearm error]', e);
    }
    throw new Error('Armamento não encontrado no Firebase.');
  }

  public static async createFirearm(data: Partial<Firearm>): Promise<Firearm> {
    await ensureDbSeeded();
    const nowIso = new Date().toISOString();
    const todayStr = new Date().toISOString().split('T')[0];
    
    const next30 = new Date();
    next30.setDate(next30.getDate() + 30);
    const proximaDefault = next30.toISOString().split('T')[0];

    const id = `arm-${Date.now()}`;
    const newFirearm: Firearm = {
      id,
      n_serie: data.n_serie || '',
      n_patrimonio: data.n_patrimonio || '',
      tipo: data.tipo || 'PISTOLA',
      marca: data.marca || '',
      modelo: data.modelo || '',
      calibre: data.calibre || '',
      capacidade: Number(data.capacidade) || 15,
      acabamento: data.acabamento || '',
      comprimento_cano: data.comprimento_cano || '',
      situacao: data.situacao || 'DISPONIVEL',
      condicao: data.condicao || 'EXCELENTE',
      localizacao: data.localizacao || 'Armeria Central',
      observacoes: data.observacoes || '',
      ultima_manutencao: data.ultima_manutencao || todayStr,
      proxima_manutencao: data.proxima_manutencao || proximaDefault,
      historico_manutencao: data.historico_manutencao || [],
      created_at: nowIso,
      updated_at: nowIso,
    };

    await setDoc(doc(db, 'firearms', id), newFirearm);

    const isEmManutencaoOuReparo = newFirearm.situacao === 'MANUTENCAO' || newFirearm.condicao === 'NECESSITA_REPARO' || newFirearm.situacao === 'BAIXADA';

    if (!isEmManutencaoOuReparo) {
      // Auto-create initial 30-day preventive maintenance appointment
      try {
        const agdId = `agd-${Date.now()}`;
        const newAgd: AgendamentoManutencao = {
          id: agdId,
          firearm_id: id,
          firearm_serie: newFirearm.n_serie,
          firearm_modelo: newFirearm.modelo,
          firearm_tipo: newFirearm.tipo,
          tipo: 'PREVENTIVA',
          data_agendada: newFirearm.proxima_manutencao,
          horario: '09:00',
          motivo_observacao: 'Primeiro agendamento de revisão preventiva (30 dias pós-cadastro).',
          status: 'AGENDADO',
          prioridade: 'MEDIA',
          responsavel: 'Inspetor Armeiro',
          created_at: nowIso,
          updated_at: nowIso
        };
        await setDoc(doc(db, 'agendamentos', agdId), newAgd);
      } catch (e) {
        console.warn('[Create initial agendamento error]', e);
      }
    }

    await this.addLog('CRIACAO_ARMAMENTO', `Armamento nº série ${newFirearm.n_serie} cadastrado no Firebase.`);
    return newFirearm;
  }

  public static async updateFirearm(id: string, data: Partial<Firearm>): Promise<Firearm> {
    await ensureDbSeeded();
    const docRef = doc(db, 'firearms', id);
    const snap = await getDoc(docRef);
    const existing = snap.exists() ? (snap.data() as Firearm) : null;

    const todayStr = new Date().toISOString().split('T')[0];
    const next30 = new Date();
    next30.setDate(next30.getDate() + 30);
    const next30Str = next30.toISOString().split('T')[0];

    const targetSituacao = data.situacao ?? existing?.situacao ?? 'DISPONIVEL';
    const targetCondicao = data.condicao ?? existing?.condicao ?? 'BOM';
    const isEmManutencaoOuReparo = targetSituacao === 'MANUTENCAO' || targetCondicao === 'NECESSITA_REPARO' || targetSituacao === 'BAIXADA';

    const updatedData = { ...data };

    if (!isEmManutencaoOuReparo) {
      if (!updatedData.proxima_manutencao || updatedData.proxima_manutencao < todayStr) {
        updatedData.proxima_manutencao = next30Str;
      }
    }

    const updated = {
      ...existing,
      ...updatedData,
      updated_at: new Date().toISOString()
    } as Firearm;

    await setDoc(docRef, updated, { merge: true });

    if (isEmManutencaoOuReparo) {
      await this.clearExistingActiveAgendamentos(id);
    } else {
      await this.clearExistingActiveAgendamentos(id);
      const agdId = `agd-${Date.now()}`;
      const newAgd: AgendamentoManutencao = {
        id: agdId,
        firearm_id: id,
        firearm_serie: updated.n_serie,
        firearm_modelo: updated.modelo,
        firearm_tipo: updated.tipo,
        tipo: 'PREVENTIVA',
        data_agendada: updated.proxima_manutencao || next30Str,
        horario: '09:00',
        motivo_observacao: 'Manutenção preventiva periódica programada (ciclo de 30 dias).',
        status: 'AGENDADO',
        prioridade: 'MEDIA',
        responsavel: 'Inspetor Armeiro',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      await setDoc(doc(db, 'agendamentos', agdId), newAgd);
    }

    await this.addLog('ATUALIZACAO_ARMAMENTO', `Armamento ID ${id} atualizado no Firebase.`);
    return updated;
  }

  public static async deleteFirearm(id: string): Promise<{ success: boolean }> {
    try {
      await ensureDbSeeded();
      let n_serie = '';
      try {
        const firearm = await this.getFirearm(id);
        if (firearm) {
          n_serie = firearm.n_serie;
          // Deletar agendamentos vinculados por ID ou Série
          const qAgd1 = query(collection(db, 'agendamentos'), where('firearm_id', '==', id));
          const agdSnap1 = await getDocs(qAgd1);
          for (const d of agdSnap1.docs) {
            await deleteDoc(doc(db, 'agendamentos', d.id));
          }
          if (n_serie) {
            const qAgd2 = query(collection(db, 'agendamentos'), where('firearm_serie', '==', n_serie));
            const agdSnap2 = await getDocs(qAgd2);
            for (const d of agdSnap2.docs) {
              await deleteDoc(doc(db, 'agendamentos', d.id));
            }
            // Deletar peças vinculadas por série
            const qPecas = query(collection(db, 'pecas'), where('firearm_serie', '==', n_serie));
            const pecasSnap = await getDocs(qPecas);
            for (const d of pecasSnap.docs) {
              await deleteDoc(doc(db, 'pecas', d.id));
            }
          }
        }
      } catch (err) {
        console.warn('Aviso ao consultar armamento antes da exclusão:', err);
      }

      await deleteDoc(doc(db, 'firearms', id));
      await this.addLog('EXCLUSAO_ARMAMENTO', `Armamento ID ${id} ${n_serie ? `(Série ${n_serie})` : ''} excluído do sistema.`);
      return { success: true };
    } catch (error: any) {
      console.error('Erro ao excluir armamento:', error);
      throw new Error(`Erro ao excluir o armamento: ${error.message || error}`);
    }
  }

  public static async addManutencao(
    id: string,
    data: {
      tipo: 'PREVENTIVA' | 'CORRETIVA';
      descricao: string;
      responsavel?: string;
      nova_condicao?: CondicaoArmamento;
      peca_solicitada?: {
        nome_peca: string;
        quantidade: number;
        descricao?: string;
      };
    }
  ): Promise<Firearm> {
    await ensureDbSeeded();
    const firearm = await this.getFirearm(id);
    const today = new Date().toISOString().split('T')[0];
    
    // Calculate 30 days ahead from today for next preventive maintenance
    const next30 = new Date();
    next30.setDate(next30.getDate() + 30);
    const proximaManutencaoDate = next30.toISOString().split('T')[0];

    const manId = `man-${Date.now()}`;

    const newRecord = {
      id: manId,
      data: today,
      tipo: data.tipo,
      descricao: data.descricao,
      responsavel: data.responsavel || 'Inspetor Armeiro'
    };

    const historico = [newRecord, ...(firearm.historico_manutencao || [])];
    const updatedFields: Partial<Firearm> = {
      historico_manutencao: historico,
      ultima_manutencao: today,
      proxima_manutencao: proximaManutencaoDate,
      updated_at: new Date().toISOString()
    };

    if (data.peca_solicitada) {
      const pecaId = `peca-${Date.now()}`;
      const newPeca: PecaReparo = {
        id: pecaId,
        firearm_id: firearm.id,
        firearm_serie: firearm.n_serie,
        firearm_modelo: firearm.modelo,
        manutencao_id: manId,
        nome_peca: data.peca_solicitada.nome_peca,
        quantidade: data.peca_solicitada.quantidade || 1,
        descricao: data.peca_solicitada.descricao || '',
        status: 'PENDENTE',
        data_solicitacao: today,
        responsavel: data.responsavel || 'Armeiro'
      };
      await setDoc(doc(db, 'pecas', pecaId), newPeca);
      updatedFields.situacao = 'MANUTENCAO';
      updatedFields.condicao = data.nova_condicao || 'NECESSITA_REPARO';
    } else {
      // If no new part is requested, performing maintenance restores the firearm to DISPONIVEL
      if (firearm.situacao === 'MANUTENCAO' || firearm.condicao === 'NECESSITA_REPARO') {
        updatedFields.situacao = 'DISPONIVEL';
        if (!data.nova_condicao || data.nova_condicao === 'NECESSITA_REPARO') {
          updatedFields.condicao = 'BOM';
        } else {
          updatedFields.condicao = data.nova_condicao;
        }
      } else if (data.nova_condicao) {
        updatedFields.condicao = data.nova_condicao;
      }
    }

    if (data.nova_condicao) {
      updatedFields.condicao = data.nova_condicao;
      if (data.nova_condicao === 'NECESSITA_REPARO') {
        updatedFields.situacao = 'MANUTENCAO';
      } else if (['EXCELENTE', 'BOM', 'REGULAR'].includes(data.nova_condicao) && !data.peca_solicitada) {
        updatedFields.situacao = 'DISPONIVEL';
      }
    }

    const docRef = doc(db, 'firearms', id);
    await updateDoc(docRef, updatedFields);

    // 1. Resolve open agendamentos for this firearm
    try {
      const agdSnap = await getDocs(collection(db, 'agendamentos'));
      for (const itemDoc of agdSnap.docs) {
        const agdData = itemDoc.data() as AgendamentoManutencao;
        if (agdData.firearm_id === id && (agdData.status === 'AGENDADO' || agdData.status === 'EM_ANDAMENTO')) {
          await updateDoc(doc(db, 'agendamentos', itemDoc.id), {
            status: 'CONCLUIDO',
            concluido_em: today,
            resultado_descricao: `Manutenção ${data.tipo} executada. Descrição: ${data.descricao}`,
            updated_at: new Date().toISOString()
          });
        }
      }
    } catch (e) {
      console.warn('[Resolve open agendamentos error]', e);
    }

    const finalSituacao = updatedFields.situacao || firearm.situacao;
    const finalCondicao = updatedFields.condicao || firearm.condicao;
    const isEmManutencaoOuReparo = finalSituacao === 'MANUTENCAO' || finalCondicao === 'NECESSITA_REPARO' || finalSituacao === 'BAIXADA';

    if (isEmManutencaoOuReparo) {
      await this.clearExistingActiveAgendamentos(id);
    } else {
      // 2. Automatically create the next preventive agendamento scheduled for +30 days
      try {
        await this.clearExistingActiveAgendamentos(id);
        const nextAgdId = `agd-${Date.now()}`;
        const newAgd: AgendamentoManutencao = {
          id: nextAgdId,
          firearm_id: firearm.id,
          firearm_serie: firearm.n_serie,
          firearm_modelo: firearm.modelo,
          firearm_tipo: firearm.tipo,
          tipo: 'PREVENTIVA',
          data_agendada: proximaManutencaoDate,
          horario: '09:00',
          motivo_observacao: `Revisão preventiva periódica de 30 dias (reagendada pós-${data.tipo.toLowerCase()}).`,
          status: 'AGENDADO',
          prioridade: 'MEDIA',
          responsavel: data.responsavel || 'Inspetor Armeiro',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        await setDoc(doc(db, 'agendamentos', nextAgdId), newAgd);
      } catch (e) {
        console.warn('[Auto-create next 30-day agendamento error]', e);
      }
    }

    await this.addLog('MANUTENCAO_REGISTRADA', `Manutenção ${data.tipo} registrada para armamento ${firearm.n_serie}. Próxima revisão agendada para ${proximaManutencaoDate}.`);

    return { ...firearm, ...updatedFields } as Firearm;
  }

  // PEÇAS DE REPARO
  public static async getPecas(filters?: { status?: string; search?: string }): Promise<PecaReparo[]> {
    await ensureDbSeeded();
    try {
      const snap = await getDocs(collection(db, 'pecas'));
      let list = snap.docs.map(d => d.data() as PecaReparo);

      if (filters?.status && filters.status !== 'TODOS') {
        list = list.filter(p => p.status === filters.status);
      }

      if (filters?.search) {
        const term = filters.search.toLowerCase();
        list = list.filter(p => 
          p.nome_peca?.toLowerCase().includes(term) ||
          p.firearm_serie?.toLowerCase().includes(term) ||
          p.firearm_modelo?.toLowerCase().includes(term)
        );
      }

      return list;
    } catch (e) {
      console.error('[Firebase getPecas error]', e);
      return [];
    }
  }

  public static async updatePecaStatus(id: string, status: 'PENDENTE' | 'ADQUIRIDA' | 'INSTALADA'): Promise<PecaReparo> {
    await ensureDbSeeded();
    const docRef = doc(db, 'pecas', id);
    await updateDoc(docRef, { status });
    const snap = await getDoc(docRef);
    const peca = snap.data() as PecaReparo;

    if (status === 'INSTALADA' && peca.firearm_id) {
      try {
        const farmRef = doc(db, 'firearms', peca.firearm_id);
        const farmSnap = await getDoc(farmRef);
        
        if (farmSnap.exists()) {
          const farm = farmSnap.data() as Firearm;
          const todayStr = new Date().toISOString().split('T')[0];

          // Create maintenance record for the installed repair part
          const newRecord: RegistroManutencao = {
            id: `man-peca-${Date.now()}`,
            data: todayStr,
            tipo: 'CORRETIVA',
            descricao: `Instalação de peça de reparo realizada: ${peca.nome_peca} (Qtd: ${peca.quantidade} un.)${peca.descricao ? ' - Observação: ' + peca.descricao : ''}.`,
            responsavel: peca.responsavel || 'Inspetor Armeiro'
          };

          const historico = [newRecord, ...(farm.historico_manutencao || [])];

          // Check if there are any remaining pending or acquired parts for this firearm
          const pecasSnap = await getDocs(collection(db, 'pecas'));
          const allPecas = pecasSnap.docs.map(d => d.data() as PecaReparo);
          const remainingParts = allPecas.filter(
            p => p.firearm_id === peca.firearm_id && p.id !== peca.id && (p.status === 'PENDENTE' || p.status === 'ADQUIRIDA')
          );

          const updates: Partial<Firearm> = {
            ultima_manutencao: todayStr,
            historico_manutencao: historico,
            updated_at: new Date().toISOString()
          };

          if (remainingParts.length === 0) {
            const next30 = new Date();
            next30.setDate(next30.getDate() + 30);
            const next30Str = next30.toISOString().split('T')[0];

            if (farm.situacao === 'MANUTENCAO') {
              updates.situacao = 'DISPONIVEL';
            }
            if (farm.condicao === 'NECESSITA_REPARO') {
              updates.condicao = 'BOM';
            }
            updates.proxima_manutencao = next30Str;
          }

          await updateDoc(farmRef, updates);

          await this.addLog(
            'MANUTENCAO_REGISTRADA',
            `Peça ${peca.nome_peca} instalada e registrada no histórico individual do armamento nº série ${farm.n_serie}.${remainingParts.length === 0 ? ' Armamento liberado e retornado para DISPONÍVEL.' : ''}`
          );
        }
      } catch (err) {
        console.warn('[Error updating firearm status and history on peca installation]', err);
      }
    }

    return peca;
  }

  // AGENDAMENTOS
  public static async getAgendamentos(filters?: {
    status?: StatusAgendamento | 'TODOS';
    tipo?: 'PREVENTIVA' | 'CORRETIVA' | 'TODOS';
    prioridade?: PrioridadeAgendamento | 'TODOS';
    search?: string;
    firearm_id?: string;
  }): Promise<AgendamentoManutencao[]> {
    await ensureDbSeeded();
    await this.syncAndFixMaintenanceSchedules();
    try {
      const snap = await getDocs(collection(db, 'agendamentos'));
      let list = snap.docs.map(d => d.data() as AgendamentoManutencao);

      if (filters?.status && filters.status !== 'TODOS') {
        list = list.filter(a => a.status === filters.status);
      }
      if (filters?.tipo && filters.tipo !== 'TODOS') {
        list = list.filter(a => a.tipo === filters.tipo);
      }
      if (filters?.prioridade && filters.prioridade !== 'TODOS') {
        list = list.filter(a => a.prioridade === filters.prioridade);
      }
      if (filters?.firearm_id) {
        list = list.filter(a => a.firearm_id === filters.firearm_id);
      }
      if (filters?.search) {
        const term = filters.search.toLowerCase();
        list = list.filter(a => 
          a.firearm_serie?.toLowerCase().includes(term) ||
          a.firearm_modelo?.toLowerCase().includes(term) ||
          a.motivo_observacao?.toLowerCase().includes(term)
        );
      }

      // Sort by closest date first (data_agendada asc, horario asc)
      list.sort((a, b) => {
        const dateA = a.data_agendada || '';
        const dateB = b.data_agendada || '';
        if (dateA !== dateB) {
          return dateA.localeCompare(dateB);
        }
        const timeA = a.horario || '';
        const timeB = b.horario || '';
        return timeA.localeCompare(timeB);
      });

      return list;
    } catch (e) {
      console.error('[Firebase getAgendamentos error]', e);
      return [];
    }
  }

  public static async createAgendamento(data: Partial<AgendamentoManutencao>): Promise<AgendamentoManutencao> {
    await ensureDbSeeded();
    const nowIso = new Date().toISOString();
    const id = `agd-${Date.now()}`;

    let firearm_serie = data.firearm_serie || '';
    let firearm_modelo = data.firearm_modelo || '';
    let firearm_tipo = data.firearm_tipo || 'PISTOLA';

    if (data.firearm_id) {
      // Enforce single active schedule per firearm
      await this.clearExistingActiveAgendamentos(data.firearm_id);

      if (!firearm_serie || !firearm_modelo) {
        try {
          const farm = await this.getFirearm(data.firearm_id);
          firearm_serie = farm.n_serie;
          firearm_modelo = farm.modelo;
          firearm_tipo = farm.tipo;
        } catch (e) {
          // continue
        }
      }
    }

    const newAgd: AgendamentoManutencao = {
      id,
      firearm_id: data.firearm_id || '',
      firearm_serie,
      firearm_modelo,
      firearm_tipo,
      tipo: data.tipo || 'PREVENTIVA',
      data_agendada: data.data_agendada || new Date().toISOString().split('T')[0],
      horario: data.horario || '',
      motivo_observacao: data.motivo_observacao || '',
      status: 'AGENDADO',
      prioridade: data.prioridade || 'MEDIA',
      responsavel: data.responsavel || 'Inspetor Armeiro',
      created_at: nowIso,
      updated_at: nowIso,
    };

    await setDoc(doc(db, 'agendamentos', id), newAgd);
    await this.addLog('AGENDAMENTO_CRIADO', `Agendamento de manutenção criado para arma ${firearm_serie}.`);
    return newAgd;
  }

  public static async updateAgendamento(id: string, data: Partial<AgendamentoManutencao>): Promise<AgendamentoManutencao> {
    await ensureDbSeeded();
    const docRef = doc(db, 'agendamentos', id);
    const snap = await getDoc(docRef);
    const existing = snap.data() as AgendamentoManutencao;

    const updated = {
      ...existing,
      ...data,
      updated_at: new Date().toISOString()
    };

    await setDoc(docRef, updated, { merge: true });

    if (data.status === 'CONCLUIDO' && existing.status !== 'CONCLUIDO') {
      await this.updateAgendamentoStatus(id, 'CONCLUIDO', data.resultado_descricao || 'Agendamento concluído.');
    }

    return updated;
  }

  public static async updateAgendamentoStatus(
    id: string,
    status: StatusAgendamento,
    resultado_descricao?: string
  ): Promise<AgendamentoManutencao> {
    await ensureDbSeeded();
    const docRef = doc(db, 'agendamentos', id);
    const snap = await getDoc(docRef);
    if (!snap.exists()) {
      throw new Error('Agendamento não encontrado.');
    }
    const agd = snap.data() as AgendamentoManutencao;
    const todayStr = new Date().toISOString().split('T')[0];

    const updates: any = {
      status,
      updated_at: new Date().toISOString()
    };

    if (resultado_descricao) {
      updates.resultado_descricao = resultado_descricao;
    }

    if (status === 'CONCLUIDO') {
      updates.concluido_em = todayStr;

      if (agd.firearm_id) {
        try {
          const next30 = new Date();
          next30.setDate(next30.getDate() + 30);
          const proximaManutencaoDate = next30.toISOString().split('T')[0];

          const farmRef = doc(db, 'firearms', agd.firearm_id);
          const farmSnap = await getDoc(farmRef);
          if (farmSnap.exists()) {
            const farm = farmSnap.data() as Firearm;
            const newRecord = {
              id: `man-${Date.now()}`,
              data: todayStr,
              tipo: agd.tipo,
              descricao: resultado_descricao || `Manutenção ${agd.tipo} realizada via agendamento.`,
              responsavel: agd.responsavel || 'Inspetor Armeiro'
            };
            const historico = [newRecord, ...(farm.historico_manutencao || [])];

            await updateDoc(farmRef, {
              ultima_manutencao: todayStr,
              proxima_manutencao: proximaManutencaoDate,
              historico_manutencao: historico,
              situacao: farm.situacao === 'MANUTENCAO' ? 'DISPONIVEL' : farm.situacao,
              condicao: farm.condicao === 'NECESSITA_REPARO' ? 'BOM' : farm.condicao,
              updated_at: new Date().toISOString()
            });

            // Create next 30-day preventive appointment
            const nextAgdId = `agd-${Date.now()}`;
            const newNextAgd: AgendamentoManutencao = {
              id: nextAgdId,
              firearm_id: farm.id,
              firearm_serie: farm.n_serie,
              firearm_modelo: farm.modelo,
              firearm_tipo: farm.tipo,
              tipo: 'PREVENTIVA',
              data_agendada: proximaManutencaoDate,
              horario: '09:00',
              motivo_observacao: 'Manutenção preventiva periódica programada (30 dias pós-conclusão).',
              status: 'AGENDADO',
              prioridade: 'MEDIA',
              responsavel: agd.responsavel || 'Inspetor Armeiro',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            };
            await setDoc(doc(db, 'agendamentos', nextAgdId), newNextAgd);
          }
        } catch (err) {
          console.warn('[Error syncing firearm on agendamento conclusion]', err);
        }
      }
    }

    await updateDoc(docRef, updates);
    const updatedSnap = await getDoc(docRef);
    return updatedSnap.data() as AgendamentoManutencao;
  }

  public static async deleteAgendamento(id: string): Promise<{ success: boolean }> {
    await ensureDbSeeded();
    await deleteDoc(doc(db, 'agendamentos', id));
    return { success: true };
  }

  // USERS
  public static async getUsers(): Promise<User[]> {
    await ensureDbSeeded();
    try {
      const snap = await getDocs(collection(db, 'users'));
      return snap.docs.map(d => d.data() as User);
    } catch (e) {
      console.error('[Firebase getUsers error]', e);
      return INITIAL_USERS;
    }
  }

  public static async createUser(userData: any): Promise<User> {
    await ensureDbSeeded();
    const id = `usr-${Date.now()}`;
    const newUser: User = {
      id,
      matricula: userData.matricula,
      nome: userData.nome,
      cpf: userData.cpf || '',
      cargo: userData.cargo || 'Guarda Municipal',
      role: userData.role || 'OPERACIONAL',
      status: userData.status || 'ATIVO',
      created_at: new Date().toISOString(),
    };

    await setDoc(doc(db, 'users', id), newUser);
    await this.addLog('CRIACAO_USUARIO', `Usuário ${newUser.nome} (${newUser.matricula}) criado no Firebase.`);
    return newUser;
  }

  public static async updateUser(id: string, userData: any): Promise<User> {
    await ensureDbSeeded();
    const docRef = doc(db, 'users', id);
    const updatePayload = { ...userData };
    if (!updatePayload.password) {
      delete updatePayload.password;
    }
    await updateDoc(docRef, updatePayload);
    await this.addLog('EDICAO_USUARIO', `Usuário ${updatePayload.nome || id} (Matrícula: ${updatePayload.matricula || ''}) atualizado no sistema.`);
    const snap = await getDoc(docRef);
    return snap.data() as User;
  }

  public static async deleteUser(id: string): Promise<{ success: boolean }> {
    await ensureDbSeeded();
    await deleteDoc(doc(db, 'users', id));
    await this.addLog('EXCLUSAO_USUARIO', `Usuário ID ${id} excluído do sistema.`);
    return { success: true };
  }

  // SYSTEM STATS & AUDIT LOGS
  public static async getStats(): Promise<DashboardStats> {
    await ensureDbSeeded();
    const firearms = await this.getFirearms();
    const pecas = await this.getPecas();
    const agendamentos = await this.getAgendamentos();
    const users = await this.getUsers();

    const totalArmas = firearms.length;
    const disponiveis = firearms.filter(f => f.situacao === 'DISPONIVEL').length;
    const emManutencao = firearms.filter(f => f.situacao === 'MANUTENCAO').length;
    const baixadas = firearms.filter(f => f.situacao === 'BAIXADA').length;
    const pecasPendentes = pecas.filter(p => p.status === 'PENDENTE').length;

    const todayStr = new Date().toISOString().split('T')[0];
    const atrasadasManutencao = firearms.filter(f => f.proxima_manutencao && f.proxima_manutencao < todayStr).length;
    const agendamentosPendentes = agendamentos.filter(a => a.status === 'AGENDADO' || a.status === 'EM_ANDAMENTO').length;

    return {
      totalArmas,
      disponiveis,
      emManutencao,
      baixadas,
      atrasadasManutencao,
      pecasPendentes,
      agendamentosPendentes,
      totalUsuarios: users.length
    };
  }

  public static async getLogs(): Promise<AuditLog[]> {
    await ensureDbSeeded();
    try {
      const snap = await getDocs(collection(db, 'logs'));
      let logs = snap.docs.map(d => d.data() as AuditLog);
      logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      return logs;
    } catch (e) {
      return [];
    }
  }

  public static async addLog(action: string, details: string): Promise<void> {
    try {
      const user = await this.getProfile();
      const id = `log-${Date.now()}`;
      const logEntry: AuditLog = {
        id,
        timestamp: new Date().toISOString(),
        user_id: user?.id || 'usr-anon',
        user_nome: user?.nome || 'Operador',
        action,
        details,
      };
      await setDoc(doc(db, 'logs', id), logEntry);
    } catch (e) {
      console.warn('[Firebase Log Error]', e);
    }
  }

  public static async exportBackup(): Promise<any> {
    const [users, firearms, pecas, agendamentos, logs] = await Promise.all([
      this.getUsers(),
      this.getFirearms(),
      this.getPecas(),
      this.getAgendamentos(),
      this.getLogs(),
    ]);

    return {
      timestamp: new Date().toISOString(),
      source: 'Firebase Firestore',
      data: { users, firearms, pecas, agendamentos, logs }
    };
  }

  public static async restoreBackup(backupData: any): Promise<{ success: boolean; message: string }> {
    if (backupData?.data) {
      const d = backupData.data;
      if (Array.isArray(d.firearms)) {
        for (const item of d.firearms) await setDoc(doc(db, 'firearms', item.id), item);
      }
      if (Array.isArray(d.users)) {
        for (const item of d.users) await setDoc(doc(db, 'users', item.id), item);
      }
      if (Array.isArray(d.pecas)) {
        for (const item of d.pecas) await setDoc(doc(db, 'pecas', item.id), item);
      }
      if (Array.isArray(d.agendamentos)) {
        for (const item of d.agendamentos) await setDoc(doc(db, 'agendamentos', item.id), item);
      }
    }
    return { success: true, message: 'Restauração no Firebase Firestore concluída com sucesso!' };
  }

  public static async resetSystemData(): Promise<{ success: boolean; message: string }> {
    try {
      const collectionsToWipe = ['firearms', 'pecas', 'agendamentos', 'logs'];
      for (const colName of collectionsToWipe) {
        const snap = await getDocs(collection(db, colName));
        for (const docItem of snap.docs) {
          await deleteDoc(doc(db, colName, docItem.id));
        }
      }
      await this.addLog('SISTEMA_ZERADO', 'Limpeza completa realizada: todos os armamentos, agendamentos, manutenções, peças e registros foram removidos para início oficial de uso.');
      return { success: true, message: 'Sistema zerado com sucesso! Todos os registros, armamentos, agendamentos e peças foram removidos.' };
    } catch (e: any) {
      console.error('[Reset System Data Error]', e);
      throw new Error(`Erro ao zerar sistema: ${e.message || e}`);
    }
  }
}
