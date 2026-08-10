import { Router, Response } from 'express';
import { Database } from '../db';
import { AgendamentoManutencao, StatusAgendamento, PrioridadeAgendamento, TipoManutencao } from '../../src/types/index';
import { authenticateJWT, requireRole, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

router.use(authenticateJWT);

// GET /api/agendamentos - List maintenance appointments with optional filtering
router.get('/', (req: AuthenticatedRequest, res: Response) => {
  let agendamentos = Database.getAgendamentos();
  const { status, tipo, prioridade, search, firearm_id } = req.query;

  // Auto-check for overdue appointments and sync firearms needing repair
  const todayStr = new Date().toISOString().split('T')[0];
  let updated = false;

  agendamentos = agendamentos.map(agd => {
    if ((agd.status === 'AGENDADO' || agd.status === 'EM_ANDAMENTO') && agd.data_agendada < todayStr) {
      if (agd.prioridade !== 'CRITICA') {
        agd.prioridade = 'CRITICA';
        agd.updated_at = new Date().toISOString();
        updated = true;
      }
    }
    return agd;
  });

  // Ensure firearms with condicao === 'NECESSITA_REPARO' remain listed in EM_ANDAMENTO (Na Bancada)
  const firearms = Database.getFirearms();
  let firearmsUpdated = false;

  firearms.forEach(firearm => {
    if (firearm.condicao === 'NECESSITA_REPARO') {
      if (firearm.situacao !== 'MANUTENCAO') {
        firearm.situacao = 'MANUTENCAO';
        firearmsUpdated = true;
      }

      // Check if an agendamento exists for this firearm
      const existingIndex = agendamentos.findIndex(a => a.firearm_id === firearm.id && a.status !== 'CANCELADO');

      if (existingIndex !== -1) {
        if (agendamentos[existingIndex].status !== 'EM_ANDAMENTO') {
          agendamentos[existingIndex].status = 'EM_ANDAMENTO';
          agendamentos[existingIndex].tipo = 'CORRETIVA';
          agendamentos[existingIndex].motivo_observacao = agendamentos[existingIndex].motivo_observacao || 'Armamento necessita reparo (Na Bancada)';
          agendamentos[existingIndex].updated_at = new Date().toISOString();
          updated = true;
        }
      } else {
        // Create an automatic agendamento on the workbench (EM_ANDAMENTO)
        const newAgd: AgendamentoManutencao = {
          id: `agd-repair-${firearm.id}`,
          firearm_id: firearm.id,
          firearm_serie: firearm.n_serie,
          firearm_modelo: `${firearm.marca} ${firearm.modelo}`,
          firearm_tipo: firearm.tipo,
          tipo: 'CORRETIVA',
          data_agendada: todayStr,
          horario: '08:00',
          motivo_observacao: 'Armamento com condição física: Necessita Reparo (Na Bancada)',
          status: 'EM_ANDAMENTO',
          prioridade: 'ALTA',
          responsavel: 'Armaria',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        agendamentos.unshift(newAgd);
        updated = true;
      }
    }
  });

  if (firearmsUpdated) {
    Database.saveFirearms(firearms);
  }

  if (updated) {
    Database.saveAgendamentos(agendamentos);
  }

  if (search && typeof search === 'string') {
    const term = search.trim().toLowerCase();
    agendamentos = agendamentos.filter(a =>
      a.firearm_serie.toLowerCase().includes(term) ||
      a.firearm_modelo.toLowerCase().includes(term) ||
      a.motivo_observacao.toLowerCase().includes(term) ||
      (a.responsavel && a.responsavel.toLowerCase().includes(term))
    );
  }

  if (firearm_id && typeof firearm_id === 'string') {
    agendamentos = agendamentos.filter(a => a.firearm_id === firearm_id);
  }

  if (status && typeof status === 'string' && status !== 'TODOS') {
    agendamentos = agendamentos.filter(a => a.status === status);
  }

  if (tipo && typeof tipo === 'string' && tipo !== 'TODOS') {
    agendamentos = agendamentos.filter(a => a.tipo === tipo);
  }

  if (prioridade && typeof prioridade === 'string' && prioridade !== 'TODOS') {
    agendamentos = agendamentos.filter(a => a.prioridade === prioridade);
  }

  // Sort by date ascending (soonest first)
  agendamentos.sort((a, b) => new Date(a.data_agendada).getTime() - new Date(b.data_agendada).getTime());

  return res.json(agendamentos);
});

// POST /api/agendamentos - Create new maintenance appointment
router.post('/', requireRole(['ADMIN', 'ARMEIRO']), (req: AuthenticatedRequest, res: Response) => {
  const { firearm_id, tipo, data_agendada, horario, motivo_observacao, prioridade, responsavel } = req.body;

  if (!firearm_id || !tipo || !data_agendada || !motivo_observacao) {
    return res.status(400).json({
      error: 'Campos obrigatórios ausentes: Armamento, Tipo de Manutenção, Data e Motivo.'
    });
  }

  const firearms = Database.getFirearms();
  const firearm = firearms.find(f => f.id === firearm_id || f.n_serie === firearm_id);

  if (!firearm) {
    return res.status(404).json({ error: 'Armamento não encontrado.' });
  }

  const newAgendamento: AgendamentoManutencao = {
    id: `agd-${Date.now()}`,
    firearm_id: firearm.id,
    firearm_serie: firearm.n_serie,
    firearm_modelo: `${firearm.marca} ${firearm.modelo}`,
    firearm_tipo: firearm.tipo,
    tipo: tipo as TipoManutencao,
    data_agendada,
    horario: horario || '09:00',
    motivo_observacao: motivo_observacao.trim(),
    status: 'AGENDADO',
    prioridade: (prioridade as PrioridadeAgendamento) || 'MEDIA',
    responsavel: responsavel ? responsavel.trim() : req.user!.nome,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  const list = Database.getAgendamentos();
  list.unshift(newAgendamento);
  Database.saveAgendamentos(list);

  Database.addLog({
    user_id: req.user!.id,
    user_nome: req.user!.nome,
    action: 'CRIACAO_AGENDAMENTO',
    details: `Agendou manutenção ${tipo} para ${firearm.n_serie} (${firearm.modelo}) em ${data_agendada}`,
    ip: req.ip
  });

  return res.status(201).json(newAgendamento);
});

// PUT /api/agendamentos/:id - Update scheduled appointment
router.put('/:id', requireRole(['ADMIN', 'ARMEIRO']), (req: AuthenticatedRequest, res: Response) => {
  const list = Database.getAgendamentos();
  const index = list.findIndex(a => a.id === req.params.id);

  if (index === -1) {
    return res.status(404).json({ error: 'Agendamento não encontrado.' });
  }

  const existing = list[index];
  const { data_agendada, horario, motivo_observacao, prioridade, responsavel, status, resultado_descricao } = req.body;

  const updated: AgendamentoManutencao = {
    ...existing,
    data_agendada: data_agendada || existing.data_agendada,
    horario: horario !== undefined ? horario : existing.horario,
    motivo_observacao: motivo_observacao ? motivo_observacao.trim() : existing.motivo_observacao,
    prioridade: prioridade || existing.prioridade,
    responsavel: responsavel ? responsavel.trim() : existing.responsavel,
    status: status || existing.status,
    resultado_descricao: resultado_descricao !== undefined ? resultado_descricao : existing.resultado_descricao,
    updated_at: new Date().toISOString()
  };

  if (status === 'CONCLUIDO' && existing.status !== 'CONCLUIDO') {
    updated.concluido_em = new Date().toISOString();
    
    // If firearm was needing repair, updating to CONCLUIDO restores it to BOM / DISPONIVEL
    const firearms = Database.getFirearms();
    const fIdx = firearms.findIndex(f => f.id === updated.firearm_id);
    if (fIdx !== -1 && firearms[fIdx].condicao === 'NECESSITA_REPARO') {
      firearms[fIdx].condicao = 'BOM';
      firearms[fIdx].situacao = 'DISPONIVEL';
      firearms[fIdx].updated_at = new Date().toISOString();
      Database.saveFirearms(firearms);
    }
  }

  list[index] = updated;
  Database.saveAgendamentos(list);

  Database.addLog({
    user_id: req.user!.id,
    user_nome: req.user!.nome,
    action: 'ATUALIZACAO_AGENDAMENTO',
    details: `Atualizou o agendamento de manutenção de ${updated.firearm_serie} (${updated.tipo})`,
    ip: req.ip
  });

  return res.json(updated);
});

// PUT /api/agendamentos/:id/status - Change status directly
router.put('/:id/status', requireRole(['ADMIN', 'ARMEIRO']), (req: AuthenticatedRequest, res: Response) => {
  const list = Database.getAgendamentos();
  const index = list.findIndex(a => a.id === req.params.id);

  if (index === -1) {
    return res.status(404).json({ error: 'Agendamento não encontrado.' });
  }

  const { status, resultado_descricao } = req.body;
  if (!status || !['AGENDADO', 'EM_ANDAMENTO', 'CONCLUIDO', 'CANCELADO'].includes(status)) {
    return res.status(400).json({ error: 'Status de agendamento inválido.' });
  }

  const agd = list[index];
  agd.status = status as StatusAgendamento;
  agd.updated_at = new Date().toISOString();

  if (status === 'CONCLUIDO') {
    agd.concluido_em = new Date().toISOString();
    if (resultado_descricao) {
      agd.resultado_descricao = resultado_descricao.trim();
    }
    // Restore firearm from NECESSITA_REPARO when maintenance is concluded
    const firearms = Database.getFirearms();
    const fIdx = firearms.findIndex(f => f.id === agd.firearm_id);
    if (fIdx !== -1 && firearms[fIdx].condicao === 'NECESSITA_REPARO') {
      firearms[fIdx].condicao = 'BOM';
      firearms[fIdx].situacao = 'DISPONIVEL';
      firearms[fIdx].updated_at = new Date().toISOString();
      Database.saveFirearms(firearms);
    }
  }

  list[index] = agd;
  Database.saveAgendamentos(list);

  Database.addLog({
    user_id: req.user!.id,
    user_nome: req.user!.nome,
    action: 'STATUS_AGENDAMENTO',
    details: `Alterou status do agendamento de ${agd.firearm_serie} para ${status}`,
    ip: req.ip
  });

  return res.json(agd);
});

// DELETE /api/agendamentos/:id - Delete appointment
router.delete('/:id', requireRole(['ADMIN', 'ARMEIRO']), (req: AuthenticatedRequest, res: Response) => {
  let list = Database.getAgendamentos();
  const agd = list.find(a => a.id === req.params.id);

  if (!agd) {
    return res.status(404).json({ error: 'Agendamento não encontrado.' });
  }

  list = list.filter(a => a.id !== req.params.id);
  Database.saveAgendamentos(list);

  Database.addLog({
    user_id: req.user!.id,
    user_nome: req.user!.nome,
    action: 'EXCLUSAO_AGENDAMENTO',
    details: `Cancelou/Excluiu o agendamento da arma ${agd.firearm_serie}`,
    ip: req.ip
  });

  return res.json({ success: true });
});

export default router;
