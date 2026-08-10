import { Router, Response } from 'express';
import { Database } from '../db';
import { authenticateJWT, requireRole, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

router.use(authenticateJWT);

// GET /api/system/stats - Dashboard metrics & Admin alerts
router.get('/stats', (req: AuthenticatedRequest, res: Response) => {
  const firearms = Database.getFirearms();
  const users = Database.getUsers();
  const pecas = Database.getPecas();
  const agendamentos = Database.getAgendamentos();

  const now = new Date();

  // Firearms with 7+ days past maintenance due date
  const atrasadas7dias = firearms.filter(f => {
    if (!f.proxima_manutencao) return false;
    const dueDate = new Date(f.proxima_manutencao);
    const diffTime = now.getTime() - dueDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 3600 * 24));
    return diffDays >= 7;
  });

  const agendamentosPendentes = agendamentos.filter(a => a.status === 'AGENDADO' || a.status === 'EM_ANDAMENTO').length;

  const stats = {
    totalArmas: firearms.length,
    disponiveis: firearms.filter(f => f.situacao === 'DISPONIVEL').length,
    emManutencao: firearms.filter(f => f.situacao === 'MANUTENCAO').length,
    baixadas: firearms.filter(f => f.situacao === 'BAIXADA').length,
    atrasadasManutencao: atrasadas7dias.length,
    pecasPendentes: pecas.filter(p => p.status === 'PENDENTE').length,
    agendamentosPendentes,
    totalUsuarios: users.length
  };

  return res.json(stats);
});

// GET /api/system/backup - Export database JSON for backup
router.get('/backup', requireRole(['ADMIN']), (req: AuthenticatedRequest, res: Response) => {
  const users = Database.getUsers();
  const firearms = Database.getFirearms();
  const pecas = Database.getPecas();
  const agendamentos = Database.getAgendamentos();
  const logs = Database.getLogs();

  const backupData = {
    system: 'ARMERIA GM',
    version: '2.0.0',
    exported_at: new Date().toISOString(),
    exported_by: req.user!.nome,
    data: {
      users,
      firearms,
      pecas,
      agendamentos,
      logs
    }
  };

  Database.addLog({
    user_id: req.user!.id,
    user_nome: req.user!.nome,
    action: 'BACKUP_SISTEMA',
    details: 'Gerou arquivo de backup completo do banco de dados ARMERIA GM',
    ip: req.ip
  });

  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', `attachment; filename=ARMERIA_GM_BACKUP_${new Date().toISOString().slice(0, 10)}.json`);
  return res.json(backupData);
});

// POST /api/system/restore - Restore database from backup
router.post('/restore', requireRole(['ADMIN']), (req: AuthenticatedRequest, res: Response) => {
  const { backup } = req.body;

  if (!backup || !backup.data || !Array.isArray(backup.data.users) || !Array.isArray(backup.data.firearms)) {
    return res.status(400).json({ error: 'Formato de arquivo de backup inválido.' });
  }

  Database.saveUsers(backup.data.users);
  Database.saveFirearms(backup.data.firearms);
  if (Array.isArray(backup.data.pecas)) {
    Database.savePecas(backup.data.pecas);
  }
  if (Array.isArray(backup.data.logs)) {
    backup.data.logs.forEach((log: any) => Database.addLog(log));
  }

  Database.addLog({
    user_id: req.user!.id,
    user_nome: req.user!.nome,
    action: 'RESTAURACAO_BACKUP',
    details: 'Restaurou a base de dados a partir de um arquivo de backup externo',
    ip: req.ip
  });

  return res.json({ success: true, message: 'Banco de dados restaurado com sucesso!' });
});

export default router;
