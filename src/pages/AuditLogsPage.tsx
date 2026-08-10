import React, { useState, useEffect } from 'react';
import { AuditLog } from '../types/index';
import { ApiService } from '../services/api';
import { FileText, Search, ShieldCheck } from 'lucide-react';

export const AuditLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const list = await ApiService.getLogs();
      setLogs(list);
    } catch (err) {
      console.error('Error loading audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = logs.filter(l =>
    l.user_nome.toLowerCase().includes(search.toLowerCase()) ||
    l.action.toLowerCase().includes(search.toLowerCase()) ||
    l.details.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900 p-5 border border-slate-800 rounded-2xl shadow-lg">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center space-x-2">
            <FileText className="w-5 h-5 text-emerald-400" />
            <span>Trilha de Auditoria & Registros de Segurança</span>
          </h2>
          <p className="text-xs text-slate-400 font-medium mt-0.5">
            Histórico imutável de logins, movimentações e alterações realizadas no sistema
          </p>
        </div>

        <div className="w-full sm:w-72 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filtrar por Usuário ou Ação..."
            className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-10 pr-4 py-2 text-white placeholder-slate-400 text-sm focus:outline-none focus:border-emerald-500"
          />
        </div>
      </div>

      {/* Logs Table */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 font-semibold">Carregando logs de auditoria...</div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-800 text-slate-400 font-bold uppercase text-[10px]">
                <tr>
                  <th className="p-4">Data / Hora</th>
                  <th className="p-4">Usuário</th>
                  <th className="p-4">Ação Registrada</th>
                  <th className="p-4">Detalhes Operacionais</th>
                  <th className="p-4">Endereço IP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filtered.map((l) => (
                  <tr key={l.id} className="hover:bg-slate-800/40">
                    <td className="p-4 font-mono text-slate-400">
                      {new Date(l.timestamp).toLocaleString('pt-BR')}
                    </td>
                    <td className="p-4 font-bold text-sky-300">{l.user_nome}</td>
                    <td className="p-4">
                      <span className="bg-slate-800 text-slate-200 border border-slate-700 px-2.5 py-1 rounded text-[10px] font-mono font-bold">
                        {l.action}
                      </span>
                    </td>
                    <td className="p-4 font-medium text-slate-200">{l.details}</td>
                    <td className="p-4 font-mono text-slate-500">{l.ip || '127.0.0.1'}</td>
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
