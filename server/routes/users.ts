import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import { Database, UserRecord } from '../db';
import { authenticateJWT, requireRole, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// Protect all user endpoints
router.use(authenticateJWT);

// GET /api/users - List users
router.get('/', (req: AuthenticatedRequest, res: Response) => {
  const users = Database.getUsers();
  const sanitized = users.map(({ passwordHash, ...user }) => user);
  return res.json(sanitized);
});

// POST /api/users - Create user (ADMIN only)
router.post('/', requireRole(['ADMIN']), (req: AuthenticatedRequest, res: Response) => {
  const { matricula, nome, cpf, email, cargo, role, status, telefone, password } = req.body;

  if (!matricula || !nome || !cpf || !role || !password) {
    return res.status(400).json({ error: 'Campos obrigatórios ausentes (Matrícula, Nome, CPF, Função, Senha).' });
  }

  const users = Database.getUsers();

  if (users.some(u => u.matricula.toLowerCase() === matricula.trim().toLowerCase())) {
    return res.status(400).json({ error: `Já existe um usuário cadastrado com a Matrícula ${matricula}.` });
  }

  if (users.some(u => u.cpf === cpf.trim())) {
    return res.status(400).json({ error: `Já existe um usuário cadastrado com o CPF ${cpf}.` });
  }

  const newUser: UserRecord = {
    id: `usr-${Date.now()}`,
    matricula: matricula.trim(),
    nome: nome.trim(),
    cpf: cpf.trim(),
    email: email ? email.trim().toLowerCase() : '',
    cargo: cargo || 'Guarda Municipal',
    role: role || 'OPERACIONAL',
    status: status || 'ATIVO',
    telefone: telefone ? telefone.trim() : '',
    created_at: new Date().toISOString(),
    passwordHash: bcrypt.hashSync(password, 10),
  };

  users.push(newUser);
  Database.saveUsers(users);

  Database.addLog({
    user_id: req.user!.id,
    user_nome: req.user!.nome,
    action: 'CADASTRO_USUARIO',
    details: `Cadastrou o usuário ${newUser.nome} (${newUser.matricula}) com perfil ${newUser.role}`,
    ip: req.ip
  });

  const { passwordHash, ...sanitized } = newUser;
  return res.status(201).json(sanitized);
});

// PUT /api/users/:id - Update user
router.put('/:id', requireRole(['ADMIN']), (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { nome, cpf, email, cargo, role, status, telefone, password } = req.body;

  const users = Database.getUsers();
  const index = users.findIndex(u => u.id === id);

  if (index === -1) {
    return res.status(404).json({ error: 'Usuário não encontrado.' });
  }

  const existingUser = users[index];

  const updatedUser: UserRecord = {
    ...existingUser,
    nome: nome ? nome.trim() : existingUser.nome,
    cpf: cpf ? cpf.trim() : existingUser.cpf,
    email: email ? email.trim().toLowerCase() : existingUser.email,
    cargo: cargo ? cargo.trim() : existingUser.cargo,
    role: role || existingUser.role,
    status: status || existingUser.status,
    telefone: telefone !== undefined ? telefone.trim() : existingUser.telefone,
    passwordHash: password ? bcrypt.hashSync(password, 10) : existingUser.passwordHash
  };

  users[index] = updatedUser;
  Database.saveUsers(users);

  Database.addLog({
    user_id: req.user!.id,
    user_nome: req.user!.nome,
    action: 'ATUALIZACAO_USUARIO',
    details: `Atualizou os dados do usuário ${updatedUser.nome} (${updatedUser.matricula})`,
    ip: req.ip
  });

  const { passwordHash, ...sanitized } = updatedUser;
  return res.json(sanitized);
});

export default router;
