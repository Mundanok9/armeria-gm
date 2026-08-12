import React, { useState } from 'react';
import { ApiService } from '../services/api';
import { Database, Download, Upload, CheckCircle2, AlertTriangle, ShieldAlert } from 'lucide-react';

export const BackupPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleExport = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const backupData = await ApiService.exportBackup();
      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ARMERIA_GM_BACKUP_${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setMessage({ type: 'success', text: 'Backup exportado com sucesso! Arquivo JSON gerado.' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Erro ao exportar backup.' });
    } finally {
      setLoading(false);
    }
  };

  const handleFileRestore = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content);

        if (!confirm('ATENÇÃO: A restauração de backup irá substituir o estado atual da base de dados. Deseja continuar?')) {
          return;
        }

        setLoading(true);
        const res = await ApiService.restoreBackup(parsed);
        setMessage({ type: 'success', text: res.message || 'Base de dados restaurada com sucesso!' });
      } catch (err: any) {
        setMessage({ type: 'error', text: 'Arquivo de backup inválido ou corrompido.' });
      } finally {
        setLoading(false);
      }
    };
    reader.readAsText(file);
  };

  const handleResetSystem = async () => {
    if (!confirm('ATENÇÃO EXTREMA: Esta ação irá excluir DEFINITIVAMENTE todos os armamentos, manutenções, peças solicitadas, agendamentos e registros de auditoria do sistema!\n\nEsta operação é irreversível e prepara o sistema para início com cadastros zerados.\n\nDeseja realmente prosseguir?')) {
      return;
    }

    setLoading(true);
    setMessage(null);
    try {
      const res = await ApiService.resetSystemData();
      setMessage({ type: 'success', text: res.message });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Erro ao zerar base de dados.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      
      {/* Header Bar */}
      <div className="bg-slate-900 p-6 border border-slate-800 rounded-2xl shadow-lg">
        <h2 className="text-xl font-bold text-white tracking-tight flex items-center space-x-2">
          <Database className="w-6 h-6 text-sky-400" />
          <span>Gestão de Backup & Inicialização do Sistema</span>
        </h2>
        <p className="text-xs text-slate-400 font-medium mt-1">
          Exporte backups do banco de dados ou zere os cadastros para início oficial da operação da armeria
        </p>
      </div>

      {message && (
        <div className={`p-4 rounded-xl text-xs font-bold flex items-center space-x-2 ${
          message.type === 'success' 
            ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
            : 'bg-rose-500/10 border border-rose-500/30 text-rose-300'
        }`}>
          {message.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
          <span>{message.text}</span>
        </div>
      )}

      {/* Backup Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Export Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg space-y-4 flex flex-col justify-between">
          <div>
            <div className="w-12 h-12 bg-sky-500/10 rounded-xl flex items-center justify-center text-sky-400 mb-4">
              <Download className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white">Exportar Backup</h3>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Gera uma cópia de segurança estruturada do banco de dados em formato `.json`.
            </p>
          </div>

          <button
            onClick={handleExport}
            disabled={loading}
            className="w-full bg-sky-600 hover:bg-sky-500 text-white font-bold py-3 px-4 rounded-xl text-xs shadow-lg transition cursor-pointer disabled:opacity-50 flex items-center justify-center space-x-2"
          >
            <Download className="w-4 h-4" />
            <span>{loading ? 'Gerando...' : 'Baixar Backup'}</span>
          </button>
        </div>

        {/* Restore Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg space-y-4 flex flex-col justify-between">
          <div>
            <div className="w-12 h-12 bg-amber-500/10 rounded-xl flex items-center justify-center text-amber-400 mb-4">
              <Upload className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white">Restaurar Backup</h3>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Selecione um arquivo de backup `.json` prévio do seu dispositivo para restaurar os dados.
            </p>
          </div>

          <label className="w-full bg-amber-600 hover:bg-amber-500 text-white font-bold py-3 px-4 rounded-xl text-xs shadow-lg transition cursor-pointer flex items-center justify-center space-x-2 text-center">
            <Upload className="w-4 h-4" />
            <span>{loading ? 'Restaurando...' : 'Carregar Backup'}</span>
            <input
              type="file"
              accept=".json"
              onChange={handleFileRestore}
              disabled={loading}
              className="hidden"
            />
          </label>
        </div>

        {/* Reset System Card */}
        <div className="bg-slate-900 border border-rose-900/40 rounded-2xl p-6 shadow-lg space-y-4 flex flex-col justify-between">
          <div>
            <div className="w-12 h-12 bg-rose-500/10 rounded-xl flex items-center justify-center text-rose-400 mb-4">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white">Zerar Cadastros</h3>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Remove todos os armamentos, agendamentos, manutenções, peças e registros de auditoria do sistema.
            </p>
          </div>

          <button
            onClick={handleResetSystem}
            disabled={loading}
            className="w-full bg-rose-700 hover:bg-rose-600 text-white font-bold py-3 px-4 rounded-xl text-xs shadow-lg transition cursor-pointer disabled:opacity-50 flex items-center justify-center space-x-2"
          >
            <ShieldAlert className="w-4 h-4" />
            <span>{loading ? 'Zerando...' : 'Zerar Base de Dados'}</span>
          </button>
        </div>

      </div>

    </div>
  );
};
