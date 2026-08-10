import React, { useState, useEffect } from 'react';
import { User } from '../types/index';
import { ApiService } from '../services/api';
import { Users, UserPlus, Edit3, Trash2, Search, ShieldCheck } from 'lucide-react';

interface UsersPageProps {
  onOpenNewUser: () => void;
  onEditUser: (user: User) => void;
  refreshKey?: number;
}

export const UsersPage: React.FC<UsersPageProps> = ({ onOpenNewUser, onEditUser, refreshKey }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadUsers();
  }, [refreshKey]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const list = await ApiService.getUsers();
      setUsers(list);
    } catch (err) {
      console.error('Error loading users:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (user: User) => {
    if (confirm(`Tem certeza que deseja EXCLUIR o usuário ${user.nome} (Matrícula: ${user.matricula})? Esta ação é irreversível.`)) {
      try {
        await ApiService.deleteUser(user.id);
        await loadUsers();
      } catch (err: any) {
        alert(err.message || 'Erro ao excluir usuário');
      }
    }
  };

  const filtered = users.filter(u =>
    u.nome.toLowerCase().includes(search.toLowerCase()) ||
    u.matricula.toLowerCase().includes(search.toLowerCase()) ||
    u.cpf.includes(search)
  );

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return <span className="bg-rose-500/20 text-rose-300 text-xs font-bold px-2.5 py-1 rounded border border-rose-500/30">ADMINISTRADOR</span>;
      case 'ARMEIRO':
        return <span className="bg-amber-500/20 text-amber-300 text-xs font-bold px-2.5 py-1 rounded border border-amber-500/30">ARMEIRO</span>;
      default:
        return <span className="bg-sky-500/20 text-sky-300 text-xs font-bold px-2.5 py-1 rounded border border-sky-500/30">OPERACIONAL</span>;
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900 p-5 border border-slate-800 rounded-2xl shadow-lg">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center space-x-2">
            <Users className="w-5 h-5 text-sky-400" />
            <span>Controle de Usuários e Permissões</span>
          </h2>
          <p className="text-xs text-slate-400 font-medium mt-0.5">
            Cadastro de servidores da Guarda Municipal e privilégios de acesso ao sistema
          </p>
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <div className="w-full sm:w-64 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por Nome ou Matrícula..."
              className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-10 pr-4 py-2 text-white placeholder-slate-400 text-sm focus:outline-none focus:border-sky-500"
            />
          </div>

          <button
            onClick={onOpenNewUser}
            className="flex items-center space-x-1.5 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs py-2.5 px-4 rounded-xl shadow-lg transition cursor-pointer shrink-0"
          >
            <UserPlus className="w-4 h-4" />
            <span>Novo Usuário</span>
          </button>
        </div>
      </div>

      {/* Users Table */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 font-semibold">Carregando usuários...</div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-800 text-slate-400 font-bold uppercase text-[10px]">
                <tr>
                  <th className="p-4">Matrícula</th>
                  <th className="p-4">Nome Servidor</th>
                  <th className="p-4">CPF</th>
                  <th className="p-4">Cargo</th>
                  <th className="p-4">Perfil</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filtered.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-800/50">
                    <td className="p-4 font-mono font-bold text-sky-300">{u.matricula}</td>
                    <td className="p-4 font-bold text-white text-sm">{u.nome}</td>
                    <td className="p-4 font-mono text-slate-400">{u.cpf}</td>
                    <td className="p-4 text-slate-300">{u.cargo}</td>
                    <td className="p-4">{getRoleBadge(u.role)}</td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        u.status === 'ATIVO' 
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' 
                          : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                      }`}>
                        {u.status}
                      </span>
                    </td>
                    <td className="p-4 text-right flex items-center justify-end space-x-2">
                      <button
                        onClick={() => onEditUser(u)}
                        className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg border border-slate-700 transition cursor-pointer"
                        title="Editar Usuário"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteUser(u)}
                        className="p-2 bg-rose-600/10 hover:bg-rose-600/20 text-rose-400 border border-rose-500/30 rounded-lg transition cursor-pointer"
                        title="Excluir Usuário"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
};
