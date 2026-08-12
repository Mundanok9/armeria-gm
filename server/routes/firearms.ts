import { Router, Response } from 'express';
import { Database } from '../db';
import { Firearm, RegistroManutencao, PecaReparo } from '../../src/types/index';
import { authenticateJWT, requireRole, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

router.use(authenticateJWT);

// GET /api/firearms - List firearms with search and filtering
router.get('/', (req: AuthenticatedRequest, res: Response) => {
  let firearms = Database.getFirearms();
  const { search, tipo, situacao, condicao, atrasadas } = req.query;

  if (search && typeof search === 'string') {
    const term = search.trim().toLowerCase();
    firearms = firearms.filter(f =>
      f.n_serie.toLowerCase().includes(term) ||
      (f.n_patrimonio && f.n_patrimonio.toLowerCase().includes(term)) ||
      f.modelo.toLowerCase().includes(term) ||
      f.marca.toLowerCase().includes(term) ||
      f.calibre.toLowerCase().includes(term)
    );
  }

  if (tipo && typeof tipo === 'string' && tipo !== 'TODOS') {
    firearms = firearms.filter(f => f.tipo === tipo);
  }

  if (situacao && typeof situacao === 'string' && situacao !== 'TODOS') {
    firearms = firearms.filter(f => f.situacao === situacao);
  }

  if (condicao && typeof condicao === 'string' && condicao !== 'TODOS') {
    firearms = firearms.filter(f => f.condicao === condicao);
  }

  if (atrasadas === 'true' || atrasadas === '7dias') {
    const now = new Date();
    firearms = firearms.filter(f => {
      if (!f.proxima_manutencao) return false;
      const dueDate = new Date(f.proxima_manutencao);
      const diffTime = now.getTime() - dueDate.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 3600 * 24));
      return diffDays >= 7;
    });
  }

  return res.json(firearms);
});

// GET /api/firearms/pecas - Get all repair parts
router.get('/pecas/all', (req: AuthenticatedRequest, res: Response) => {
  const pecas = Database.getPecas();
  const { status, search } = req.query;

  let filtered = pecas;
  if (status && typeof status === 'string' && status !== 'TODOS') {
    filtered = filtered.filter(p => p.status === status);
  }

  if (search && typeof search === 'string') {
    const term = search.trim().toLowerCase();
    filtered = filtered.filter(p =>
      p.nome_peca.toLowerCase().includes(term) ||
      p.firearm_serie.toLowerCase().includes(term) ||
      p.firearm_modelo.toLowerCase().includes(term) ||
      (p.descricao && p.descricao.toLowerCase().includes(term))
    );
  }

  return res.json(filtered);
});

// PUT /api/firearms/pecas/:id/status - Update repair part status
router.put('/pecas/:id/status', requireRole(['ADMIN', 'ARMEIRO']), (req: AuthenticatedRequest, res: Response) => {
  const pecas = Database.getPecas();
  const index = pecas.findIndex(p => p.id === req.params.id);

  if (index === -1) {
    return res.status(404).json({ error: 'Peça de reparo não encontrada.' });
  }

  const { status } = req.body;
  if (!status || !['PENDENTE', 'ADQUIRIDA', 'INSTALADA'].includes(status)) {
    return res.status(400).json({ error: 'Status da peça inválido. Opções: PENDENTE, ADQUIRIDA, INSTALADA.' });
  }

  const peca = pecas[index];
  const prevStatus = peca.status;
  peca.status = status;
  pecas[index] = peca;
  Database.savePecas(pecas);

  // If marked as INSTALADA, inform and record in firearm's maintenance history
  if (status === 'INSTALADA' && prevStatus !== 'INSTALADA') {
    const firearms = Database.getFirearms();
    const fIdx = firearms.findIndex(f => f.id === peca.firearm_id || f.n_serie === peca.firearm_serie);
    if (fIdx !== -1) {
      const todayStr = new Date().toISOString().split('T')[0];
      const newLog = {
        id: `manut-peca-${Date.now()}`,
        data: todayStr,
        tipo: 'CORRETIVA' as const,
        descricao: `Instalação de Peça de Reparo: ${peca.nome_peca} (${peca.quantidade} un)${peca.descricao ? ` - ${peca.descricao}` : ''}`,
        responsavel: req.user?.nome || peca.responsavel || 'Armaria'
      };
      if (!firearms[fIdx].historico_manutencao) {
        firearms[fIdx].historico_manutencao = [];
      }
      firearms[fIdx].historico_manutencao.unshift(newLog);

      // Check if there are other pending or acquired parts for this firearm
      const remainingPending = pecas.filter(p => 
        (p.firearm_id === peca.firearm_id || p.firearm_serie === peca.firearm_serie) &&
        p.id !== peca.id &&
        p.status !== 'INSTALADA'
      );
      if (remainingPending.length === 0 && firearms[fIdx].condicao === 'NECESSITA_REPARO') {
        firearms[fIdx].condicao = 'BOM';
        firearms[fIdx].situacao = 'DISPONIVEL';
      }

      Database.saveFirearms(firearms);
    }
  }

  Database.addLog({
    user_id: req.user!.id,
    user_nome: req.user!.nome,
    action: 'ATUALIZACAO_PECA',
    details: `Atualizou o status da peça "${peca.nome_peca}" (Arma: ${peca.firearm_serie}) para ${status}`,
    ip: req.ip
  });

  return res.json(peca);
});

// GET /api/firearms/:id - Get single firearm detail
router.get('/:id', (req: AuthenticatedRequest, res: Response) => {
  const firearms = Database.getFirearms();
  const firearm = firearms.find(f => f.id === req.params.id || f.n_serie === req.params.id);

  if (!firearm) {
    return res.status(404).json({ error: 'Armamento não encontrado.' });
  }

  return res.json(firearm);
});

// POST /api/firearms - Create firearm (ADMIN, ARMEIRO)
router.post('/', requireRole(['ADMIN', 'ARMEIRO']), (req: AuthenticatedRequest, res: Response) => {
  const {
    n_serie,
    n_patrimonio,
    tipo,
    marca,
    modelo,
    calibre,
    capacidade,
    acabamento,
    comprimento_cano,
    situacao,
    condicao,
    localizacao,
    observacoes
  } = req.body;

  if (!n_serie || !tipo || !marca || !modelo || !calibre) {
    return res.status(400).json({
      error: 'Campos obrigatórios ausentes: N° Série, Tipo, Marca, Modelo, Calibre.'
    });
  }

  const firearms = Database.getFirearms();

  if (firearms.some(f => f.n_serie.trim().toLowerCase() === n_serie.trim().toLowerCase())) {
    return res.status(400).json({ error: `Já existe um armamento cadastrado com o N° de Série "${n_serie}".` });
  }

  const today = new Date();
  const next30 = new Date(today);
  next30.setDate(today.getDate() + 30);

  const finalCondicao = condicao || 'EXCELENTE';
  const finalSituacao = finalCondicao === 'NECESSITA_REPARO' ? 'MANUTENCAO' : (situacao || 'DISPONIVEL');

  const newFirearm: Firearm = {
    id: `arm-${Date.now()}`,
    n_serie: n_serie.trim().toUpperCase(),
    n_patrimonio: n_patrimonio ? n_patrimonio.trim().toUpperCase() : '',
    tipo,
    marca: marca.trim(),
    modelo: modelo.trim(),
    calibre: calibre.trim(),
    capacidade: Number(capacidade) || 15,
    acabamento: acabamento ? acabamento.trim() : 'Oxidado',
    comprimento_cano: comprimento_cano ? comprimento_cano.trim() : '4.0 polegadas',
    situacao: finalSituacao,
    condicao: finalCondicao,
    localizacao: localizacao ? localizacao.trim() : 'Armeria Central',
    observacoes: observacoes ? observacoes.trim() : '',
    ultima_manutencao: today.toISOString().split('T')[0],
    proxima_manutencao: next30.toISOString().split('T')[0],
    historico_manutencao: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  firearms.push(newFirearm);
  Database.saveFirearms(firearms);

  if (finalCondicao === 'NECESSITA_REPARO') {
    const agendamentos = Database.getAgendamentos();
    agendamentos.unshift({
      id: `agd-repair-${newFirearm.id}`,
      firearm_id: newFirearm.id,
      firearm_serie: newFirearm.n_serie,
      firearm_modelo: `${newFirearm.marca} ${newFirearm.modelo}`,
      firearm_tipo: newFirearm.tipo,
      tipo: 'CORRETIVA',
      data_agendada: today.toISOString().split('T')[0],
      horario: '08:00',
      motivo_observacao: 'Armamento com condição física: Necessita Reparo (Na Bancada)',
      status: 'EM_ANDAMENTO',
      prioridade: 'ALTA',
      responsavel: 'Armaria',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });
    Database.saveAgendamentos(agendamentos);
  }

  Database.addLog({
    user_id: req.user!.id,
    user_nome: req.user!.nome,
    action: 'CADASTRO_ARMA',
    details: `Cadastrou o armamento ${newFirearm.tipo} ${newFirearm.marca} ${newFirearm.modelo} - Série: ${newFirearm.n_serie}`,
    ip: req.ip
  });

  return res.status(201).json(newFirearm);
});

// PUT /api/firearms/:id - Update firearm
router.put('/:id', requireRole(['ADMIN', 'ARMEIRO']), (req: AuthenticatedRequest, res: Response) => {
  const firearms = Database.getFirearms();
  const index = firearms.findIndex(f => f.id === req.params.id);

  if (index === -1) {
    return res.status(404).json({ error: 'Armamento não encontrado.' });
  }

  const existing = firearms[index];
  const {
    n_serie,
    n_patrimonio,
    tipo,
    marca,
    modelo,
    calibre,
    capacidade,
    acabamento,
    comprimento_cano,
    situacao,
    condicao,
    localizacao,
    observacoes
  } = req.body;

  const updatedCondicao = condicao || existing.condicao;
  let updatedSituacao = situacao || existing.situacao;

  if (updatedCondicao === 'NECESSITA_REPARO') {
    updatedSituacao = 'MANUTENCAO';
  }

  const updated: Firearm = {
    ...existing,
    n_serie: n_serie ? n_serie.trim().toUpperCase() : existing.n_serie,
    n_patrimonio: n_patrimonio ? n_patrimonio.trim().toUpperCase() : existing.n_patrimonio,
    tipo: tipo || existing.tipo,
    marca: marca ? marca.trim() : existing.marca,
    modelo: modelo ? modelo.trim() : existing.modelo,
    calibre: calibre ? calibre.trim() : existing.calibre,
    capacidade: capacidade !== undefined ? Number(capacidade) : existing.capacidade,
    acabamento: acabamento ? acabamento.trim() : existing.acabamento,
    comprimento_cano: comprimento_cano ? comprimento_cano.trim() : existing.comprimento_cano,
    situacao: updatedSituacao,
    condicao: updatedCondicao,
    localizacao: localizacao ? localizacao.trim() : existing.localizacao,
    observacoes: observacoes !== undefined ? observacoes.trim() : existing.observacoes,
    updated_at: new Date().toISOString()
  };

  firearms[index] = updated;
  Database.saveFirearms(firearms);

  // Sync agendamentos if NECESSITA_REPARO
  if (updatedCondicao === 'NECESSITA_REPARO') {
    const agendamentos = Database.getAgendamentos();
    const existingIndex = agendamentos.findIndex(a => a.firearm_id === updated.id && a.status !== 'CANCELADO');
    const todayStr = new Date().toISOString().split('T')[0];

    if (existingIndex !== -1) {
      if (agendamentos[existingIndex].status !== 'EM_ANDAMENTO') {
        agendamentos[existingIndex].status = 'EM_ANDAMENTO';
        agendamentos[existingIndex].updated_at = new Date().toISOString();
        Database.saveAgendamentos(agendamentos);
      }
    } else {
      agendamentos.unshift({
        id: `agd-repair-${updated.id}`,
        firearm_id: updated.id,
        firearm_serie: updated.n_serie,
        firearm_modelo: `${updated.marca} ${updated.modelo}`,
        firearm_tipo: updated.tipo,
        tipo: 'CORRETIVA',
        data_agendada: todayStr,
        horario: '08:00',
        motivo_observacao: 'Armamento com condição física: Necessita Reparo (Na Bancada)',
        status: 'EM_ANDAMENTO',
        prioridade: 'ALTA',
        responsavel: 'Armaria',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
      Database.saveAgendamentos(agendamentos);
    }
  }

  Database.addLog({
    user_id: req.user!.id,
    user_nome: req.user!.nome,
    action: 'ATUALIZACAO_ARMA',
    details: `Atualizou os dados do armamento ${updated.n_serie}`,
    ip: req.ip
  });

  return res.json(updated);
});

// POST /api/firearms/:id/manutencao - Add maintenance log (PREVENTIVA vs CORRETIVA)
router.post('/:id/manutencao', requireRole(['ADMIN', 'ARMEIRO']), (req: AuthenticatedRequest, res: Response) => {
  const firearms = Database.getFirearms();
  const index = firearms.findIndex(f => f.id === req.params.id);

  if (index === -1) {
    return res.status(404).json({ error: 'Armamento não encontrado.' });
  }

  const { tipo, descricao, responsavel, nova_condicao, peca_solicitada } = req.body;

  if (!tipo || !['PREVENTIVA', 'CORRETIVA'].includes(tipo)) {
    return res.status(400).json({ error: 'O tipo de manutenção deve ser PREVENTIVA ou CORRETIVA.' });
  }

  if (!descricao) {
    return res.status(400).json({ error: 'Informe a descrição do serviço executado.' });
  }

  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];

  // Calculate 30-day reset for maintenance schedule
  const next30 = new Date(today);
  next30.setDate(today.getDate() + 30);
  const proximaStr = next30.toISOString().split('T')[0];

  const maintenanceId = `man-${Date.now()}`;

  const newMaintenance: RegistroManutencao = {
    id: maintenanceId,
    data: todayStr,
    tipo: tipo as 'PREVENTIVA' | 'CORRETIVA',
    descricao: descricao.trim(),
    responsavel: responsavel ? responsavel.trim() : (req.user ? req.user.nome : 'Armeiro Responsável'),
    peca_solicitada: peca_solicitada && peca_solicitada.nome_peca ? {
      nome_peca: peca_solicitada.nome_peca.trim(),
      quantidade: Number(peca_solicitada.quantidade) || 1,
      descricao: peca_solicitada.descricao ? peca_solicitada.descricao.trim() : undefined
    } : undefined
  };

  const firearm = firearms[index];
  firearm.historico_manutencao.unshift(newMaintenance);
  firearm.ultima_manutencao = todayStr;
  firearm.proxima_manutencao = proximaStr; // Reinicia a contagem de 30 dias!
  firearm.updated_at = new Date().toISOString();

  if (nova_condicao) {
    firearm.condicao = nova_condicao;
  }

  if (firearm.condicao === 'NECESSITA_REPARO') {
    firearm.situacao = 'MANUTENCAO';
  } else if (firearm.situacao === 'MANUTENCAO') {
    firearm.situacao = 'DISPONIVEL';
  }

  // If firearm is now repaired (not NECESSITA_REPARO), conclude active agendamentos
  const agendamentos = Database.getAgendamentos();
  let agdUpdated = false;

  agendamentos.forEach(agd => {
    if (agd.firearm_id === firearm.id && agd.status === 'EM_ANDAMENTO') {
      if (firearm.condicao !== 'NECESSITA_REPARO') {
        agd.status = 'CONCLUIDO';
        agd.concluido_em = new Date().toISOString();
        agd.resultado_descricao = `Manutenção ${tipo} executada: ${descricao}`;
        agdUpdated = true;
      }
    }
  });

  if (agdUpdated) {
    Database.saveAgendamentos(agendamentos);
  }

  // If corrective maintenance generated a repair part request, record it in the Repair Parts database
  if (tipo === 'CORRETIVA' && peca_solicitada && peca_solicitada.nome_peca) {
    const pecas = Database.getPecas();
    const newPeca: PecaReparo = {
      id: `peca-${Date.now()}`,
      firearm_id: firearm.id,
      firearm_serie: firearm.n_serie,
      firearm_modelo: `${firearm.marca} ${firearm.modelo}`,
      manutencao_id: maintenanceId,
      nome_peca: peca_solicitada.nome_peca.trim(),
      quantidade: Number(peca_solicitada.quantidade) || 1,
      descricao: peca_solicitada.descricao ? peca_solicitada.descricao.trim() : undefined,
      data_solicitacao: new Date().toISOString(),
      status: 'PENDENTE',
      responsavel: req.user!.nome
    };
    pecas.unshift(newPeca);
    Database.savePecas(pecas);
  }

  Database.saveFirearms(firearms);

  Database.addLog({
    user_id: req.user!.id,
    user_nome: req.user!.nome,
    action: 'REGISTRO_MANUTENCAO',
    details: `Registrou manutenção ${tipo} para a arma ${firearm.n_serie}. Reiniciou ciclo de 30 dias (Próxima: ${proximaStr}).`,
    ip: req.ip
  });

  return res.json(firearm);
});

// DELETE /api/firearms/:id - Delete / Baixar armamento
router.delete('/:id', requireRole(['ADMIN']), (req: AuthenticatedRequest, res: Response) => {
  let firearms = Database.getFirearms();
  const firearm = firearms.find(f => f.id === req.params.id);

  if (!firearm) {
    return res.status(404).json({ error: 'Armamento não encontrado.' });
  }

  firearms = firearms.filter(f => f.id !== req.params.id);
  Database.saveFirearms(firearms);

  Database.addLog({
    user_id: req.user!.id,
    user_nome: req.user!.nome,
    action: 'EXCLUSAO_ARMA',
    details: `Excluiu o armamento ${firearm.n_serie} (${firearm.modelo}) do sistema`,
    ip: req.ip
  });

  return res.json({ success: true, message: 'Armamento removido com sucesso.' });
});

export default router;
