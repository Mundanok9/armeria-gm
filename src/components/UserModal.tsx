import React, { useState, useEffect } from 'react';
import { User, UserRole, UserStatus } from '../types/index';
import { ApiService } from '../services/api';
import { X, UserPlus, Save, Trash2 } from 'lucide-react';

interface UserModalProps {
  isOpen: boolean;
  onClose: () => void;
  userToEdit: User | null;
  onSuccess: () => void;
}

export const UserModal: React.FC<UserModalProps> = ({
  isOpen,
  onClose,
  userToEdit,
  onSuccess
}) => {
  const [formData, setFormData] = useState({
    matricula: '',
    nome: '',
    cpf: '',
    cargo: 'Guarda Municipal 1ª Classe',
    role: 'OPERACIONAL' as UserRole,
    status: 'ATIVO' as UserStatus,
    password: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (userToEdit) {
      setFormData({
        matricula: userToEdit.matricula,
        nome: userToEdit.nome,
        cpf: userToEdit.cpf,
        cargo: userToEdit.cargo,
        role: userToEdit.role,
        status: userToEdit.status,
        password: '', // Leave blank if not changing
      });
    } else {
      setFormData({
        matricula: '',
        nome: '',
        cpf: '',
        cargo: 'Guarda Municipal 1ª Classe',
        role: 'OPERACIONAL',
        status: 'ATIVO',
        password: '',
      });
    }
    setError('');
  }, [userToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!userToEdit && !formData.password) {
      setError('A senha é obrigatória para o cadastro de novos usuários.');
      return;
    }

    setLoading(true);
    try {
      if (userToEdit) {
        await ApiService.updateUser(userToEdit.id, formData);
      } else {
        await ApiService.createUser(formData);
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar usuário.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
        
        {/* Header */}
        <div className="bg-slate-800 px-6 py-4 border-b border-slate-700 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <UserPlus className="w-5 h-5 text-sky-400" />
            <h2 className="text-lg font-bold text-white">
              {userToEdit ? 'Editar Dados do Usuário' : 'Cadastrar Novo Usuário / Servidor'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {error && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs font-semibold">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1 uppercase tracking-wider">
                Matrícula GM *
              </label>
              <input
                type="text"
                required
                disabled={!!userToEdit}
                value={formData.matricula}
                onChange={(e) => setFormData({ ...formData, matricula: e.target.value })}
                placeholder="Ex: GM-104"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white font-mono placeholder-slate-500 focus:outline-none focus:border-sky-500 text-sm disabled:opacity-60"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1 uppercase tracking-wider">
                CPF *
              </label>
              <input
                type="text"
                required
                value={formData.cpf}
                onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
                placeholder="000.000.000-00"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white font-mono placeholder-slate-500 focus:outline-none focus:border-sky-500 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1 uppercase tracking-wider">
              Nome Completo *
            </label>
            <input
              type="text"
              required
              value={formData.nome}
              onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              placeholder="Ex: Carlos Eduardo Silva"
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1 uppercase tracking-wider">
              Cargo / Posto
            </label>
            <input
              type="text"
              value={formData.cargo}
              onChange={(e) => setFormData({ ...formData, cargo: e.target.value })}
              placeholder="Ex: Guarda Municipal 1ª Classe, Inspetor, Subcomandante"
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 text-sm"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1 uppercase tracking-wider">
                Perfil de Acesso no Sistema *
              </label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-sky-500 text-sm cursor-pointer"
              >
                <option value="OPERACIONAL">Operacional (Consulta & Porte)</option>
                <option value="ARMEIRO">Armeiro (Gestão de Cautelas & Manutenção)</option>
                <option value="ADMIN">Administrador (Acesso Total)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1 uppercase tracking-wider">
                Status da Conta
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as UserStatus })}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-sky-500 text-sm cursor-pointer"
              >
                <option value="ATIVO">Ativo</option>
                <option value="INATIVO">Inativo / Suspenso</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1 uppercase tracking-wider">
              {userToEdit ? 'Nova Senha (deixe em branco se não desejar alterar)' : 'Senha de Acesso *'}
            </label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder={userToEdit ? '••••••••' : 'Sua senha segura'}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 text-sm"
            />
          </div>

          <div className="pt-4 flex items-center justify-between border-t border-slate-800">
            <div>
              {userToEdit && (
                <button
                  type="button"
                  onClick={async () => {
                    if (confirm(`Tem certeza que deseja EXCLUIR o usuário ${userToEdit.nome} (${userToEdit.matricula})? Esta ação é irreversível.`)) {
                      setLoading(true);
                      try {
                        await ApiService.deleteUser(userToEdit.id);
                        onSuccess();
                        onClose();
                      } catch (err: any) {
                        setError(err.message || 'Erro ao excluir usuário');
                      } finally {
                        setLoading(false);
                      }
                    }
                  }}
                  disabled={loading}
                  className="flex items-center space-x-1.5 bg-rose-600/10 hover:bg-rose-600/20 text-rose-400 border border-rose-500/30 px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer disabled:opacity-50"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Excluir Usuário</span>
                </button>
              )}
            </div>

            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl text-slate-300 hover:bg-slate-800 text-sm font-semibold transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex items-center space-x-2 bg-sky-600 hover:bg-sky-500 text-white px-6 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-sky-600/30 transition cursor-pointer disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{loading ? 'Salvando...' : 'Salvar Usuário'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
