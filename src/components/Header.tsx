import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Shield, LogOut, User as UserIcon, Download, AlertTriangle, Cloud } from 'lucide-react';
import { ApiService } from '../services/api';

interface HeaderProps {
  onNavigateToOverdue?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onNavigateToOverdue }) => {
  const { user, logout } = useAuth();
  const [atrasadasCount, setAtrasadasCount] = useState<number>(0);

  useEffect(() => {
    if (user) {
      loadAlerts();
      const interval = setInterval(loadAlerts, 30000); // refresh every 30s
      return () => clearInterval(interval);
    }
  }, [user]);

  const loadAlerts = async () => {
    try {
      const stats = await ApiService.getStats();
      setAtrasadasCount(stats.atrasadasManutencao || 0);
    } catch (err) {
      // Ignore background errors
    }
  };

  const handleQuickBackup = async () => {
    try {
      const backup = await ApiService.exportBackup();
      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ARMERIA_GM_BACKUP_${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      alert(err.message || 'Erro ao exportar backup');
    }
  };

  const getRoleBadge = (role?: string) => {
    switch (role) {
      case 'ADMIN':
        return <span className="bg-rose-500/20 text-rose-300 text-xs font-bold px-2 py-0.5 rounded border border-rose-500/30">ADMINISTRADOR</span>;
      case 'ARMEIRO':
        return <span className="bg-amber-500/20 text-amber-300 text-xs font-bold px-2 py-0.5 rounded border border-amber-500/30">ARMEIRO</span>;
      default:
        return <span className="bg-sky-500/20 text-sky-300 text-xs font-bold px-2 py-0.5 rounded border border-sky-500/30">OPERACIONAL</span>;
    }
  };

  return (
    <header className="bg-slate-900 text-slate-100 border-b border-slate-800 shadow-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand Logo & Title */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-lg bg-sky-600 flex items-center justify-center shadow-lg shadow-sky-600/30">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-white flex items-center space-x-2">
              <span>ARMERIA GM</span>
              <span className="inline-flex items-center space-x-1 bg-emerald-500/20 text-emerald-300 text-[10px] font-semibold px-2 py-0.5 rounded-full border border-emerald-500/30">
                <Cloud className="w-3 h-3 text-emerald-400" />
                <span>Firebase Cloud</span>
              </span>
            </h1>
            <p className="text-xs text-slate-400 font-medium">Guarda Municipal — Controle de Armamento</p>
          </div>
        </div>

        {/* User Info & Actions */}
        {user && (
          <div className="flex items-center space-x-2 sm:space-x-4">
            
            {/* Admin / Armeiro Alert Badge for Overdue Maintenance (>7 days) */}
            {(user.role === 'ADMIN' || user.role === 'ARMEIRO') && atrasadasCount > 0 && (
              <button
                onClick={onNavigateToOverdue}
                title={`${atrasadasCount} armamento(s) com manutenção atrasada em mais de 7 dias!`}
                className="flex items-center space-x-1.5 bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/50 text-rose-300 font-bold text-xs px-3 py-1.5 rounded-xl transition animate-pulse cursor-pointer"
              >
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                <span className="hidden sm:inline">ALERTA ADM:</span>
                <span className="bg-rose-600 text-white text-[11px] px-2 py-0.5 rounded-full font-black">
                  {atrasadasCount} {atrasadasCount === 1 ? 'Arma Atrasada' : 'Armas Atrasadas'}
                </span>
              </button>
            )}

            {/* User Badge */}
            <div className="hidden md:flex items-center space-x-2.5 bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700/60">
              <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-slate-300">
                <UserIcon className="w-4 h-4" />
              </div>
              <div className="text-left">
                <p className="text-xs font-semibold text-slate-100 leading-tight">{user.nome}</p>
                <div className="flex items-center space-x-1.5 mt-0.5">
                  <span className="text-[10px] text-slate-400">Mat: {user.matricula}</span>
                  {getRoleBadge(user.role)}
                </div>
              </div>
            </div>

            {/* Quick Backup for Admin */}
            {user.role === 'ADMIN' && (
              <button
                onClick={handleQuickBackup}
                title="Exportar Backup do Banco de Dados"
                className="hidden lg:flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium px-3 py-2 rounded-lg border border-slate-700 transition"
              >
                <Download className="w-3.5 h-3.5 text-sky-400" />
                <span>Backup</span>
              </button>
            )}

            {/* Logout Button */}
            <button
              onClick={logout}
              className="flex items-center space-x-1.5 bg-rose-600/10 hover:bg-rose-600/20 text-rose-300 text-xs font-semibold px-3 py-2 rounded-lg border border-rose-500/30 transition cursor-pointer"
            >
              <LogOut className="w-4 h-4 text-rose-400" />
              <span className="hidden xs:inline">Sair</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
