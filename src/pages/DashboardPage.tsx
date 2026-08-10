import React, { useState, useEffect } from 'react';
import { DashboardStats, Firearm, AuditLog } from '../types/index';
import { ApiService } from '../services/api';
import { PdfService } from '../services/pdf';
import { StatusChip } from '../components/StatusChip';
import { Shield, CheckCircle2, Wrench, Package, Users, Plus, FileText, Search, Activity, AlertTriangle, ArrowRight, CalendarClock } from 'lucide-react';

interface DashboardPageProps {
  onNavigate: (tab: any, params?: any) => void;
  onOpenNewFirearm: () => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigate, onOpenNewFirearm }) => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentFirearms, setRecentFirearms] = useState<Firearm[]>([]);
  const [recentLogs, setRecentLogs] = useState<AuditLog[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [sData, fData, lData] = await Promise.all([
        ApiService.getStats(),
        ApiService.getFirearms(),
        ApiService.getLogs().catch(() => [])
      ]);
      setStats(sData);
      setRecentFirearms(fData);
      setRecentLogs(lData.slice(0, 5));
    } catch (err) {
      console.error('Error loading dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      onNavigate('firearms', { search: searchQuery });
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-400 font-semibold">
        Carregando painel da Armeria...
      </div>
    );
  }

  const hasCriticalAlerts = (stats?.atrasadasManutencao || 0) > 0;

  return (
    <div className="space-y-6">
      
      {/* Search & Action Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-slate-700/80 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Painel de Controle da Armeria</h2>
          <p className="text-xs text-slate-300 mt-1">Gestão de acervo, cronograma de manutenção de 30 dias e solicitação de peças</p>
        </div>

        {/* Quick Search Field */}
        <form onSubmit={handleQuickSearch} className="flex items-center w-full md:w-auto space-x-2">
          <div className="relative flex-1 md:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por Série, Patrimônio ou Marca..."
              className="w-full bg-slate-900/90 border border-slate-700 rounded-xl pl-10 pr-4 py-2 text-white placeholder-slate-400 text-sm focus:outline-none focus:border-sky-500"
            />
          </div>
          <button
            type="submit"
            className="bg-sky-600 hover:bg-sky-500 text-white font-bold px-4 py-2 rounded-xl text-sm transition cursor-pointer shrink-0"
          >
            Buscar
          </button>
        </form>
      </div>

      {/* Admin Alert Banner for 7+ Days Overdue Maintenance */}
      {hasCriticalAlerts && (
        <div className="bg-rose-950/80 border border-rose-600 rounded-2xl p-5 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-pulse">
          <div className="flex items-start space-x-3">
            <div className="w-10 h-10 rounded-xl bg-rose-600/30 border border-rose-500/60 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-6 h-6 text-rose-300" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-rose-200 uppercase tracking-wider">
                ALERTA ADM: Manutenção Atrasada há mais de 7 dias!
              </h3>
              <p className="text-xs text-rose-300/90 mt-0.5">
                Existem <strong>{stats?.atrasadasManutencao} armamento(s)</strong> que ultrapassaram o limite crítico de 7 dias após o prazo de manutenção de 30 dias.
              </p>
            </div>
          </div>

          <button
            onClick={() => onNavigate('firearms', { atrasadas: true })}
            className="bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow transition cursor-pointer flex items-center space-x-1.5 shrink-0"
          >
            <span>Ver Armas com Alerta</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Card 1: Total Acervo */}
        <div 
          onClick={() => onNavigate('firearms')}
          className="bg-slate-800/90 hover:bg-slate-800 border border-slate-700 rounded-2xl p-4 shadow-md transition cursor-pointer"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-blue-400 uppercase tracking-wider">Total Acervo</span>
            <div className="w-7 h-7 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center">
              <Shield className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-2xl font-black text-blue-300">{stats?.totalArmas || 0}</p>
          <p className="text-[10px] text-slate-400 mt-1">Armamentos ativos</p>
        </div>

        {/* Card 2: Disponíveis */}
        <div 
          onClick={() => onNavigate('firearms', { situacao: 'DISPONIVEL' })}
          className="bg-slate-800/90 hover:bg-slate-800 border border-slate-700 rounded-2xl p-4 shadow-md transition cursor-pointer"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">Disponíveis</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-2xl font-black text-emerald-300">{stats?.disponiveis || 0}</p>
          <p className="text-[10px] text-slate-400 mt-1">Prontas no cofre</p>
        </div>

        {/* Card 3: Agendamentos */}
        <div 
          onClick={() => onNavigate('agendamentos')}
          className="bg-slate-800/90 hover:bg-slate-800 border border-slate-700 rounded-2xl p-4 shadow-md transition cursor-pointer"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-yellow-400 uppercase tracking-wider">Agendamentos</span>
            <div className="w-7 h-7 rounded-lg bg-yellow-500/10 text-yellow-400 flex items-center justify-center">
              <CalendarClock className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-2xl font-black text-yellow-300">{stats?.agendamentosPendentes || 0}</p>
          <p className="text-[10px] text-slate-400 mt-1">Manutenções agendadas</p>
        </div>

        {/* Card 4: Em Manutenção */}
        <div 
          onClick={() => onNavigate('em_manutencao')}
          className="bg-slate-800/90 hover:bg-slate-800 border border-slate-700 rounded-2xl p-4 shadow-md transition cursor-pointer"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-orange-400 uppercase tracking-wider">Em Manutenção</span>
            <div className="w-7 h-7 rounded-lg bg-orange-500/10 text-orange-400 flex items-center justify-center">
              <Wrench className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-2xl font-black text-orange-300">{stats?.emManutencao || 0}</p>
          <p className="text-[10px] text-slate-400 mt-1">Em manutenção</p>
        </div>

        {/* Card 5: Alerta ADM (>7 dias) */}
        <div 
          onClick={() => onNavigate('agendamentos', { status: 'AGENDADO' })}
          className={`border rounded-2xl p-4 shadow-md transition cursor-pointer ${
            hasCriticalAlerts
              ? 'bg-red-950/60 border-red-600/80 hover:bg-red-900/60'
              : 'bg-slate-800/90 border-slate-700 hover:bg-slate-800'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-red-400 uppercase tracking-wider">
              Alerta (+7d)
            </span>
            <div className="w-7 h-7 rounded-lg bg-red-500/10 text-red-400 flex items-center justify-center">
              <AlertTriangle className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-2xl font-black text-red-400">
            {stats?.atrasadasManutencao || 0}
          </p>
          <p className="text-[10px] text-slate-400 mt-1">Atrasadas &gt;7 dias</p>
        </div>

        {/* Card 6: Peças Pendentes */}
        <div 
          onClick={() => onNavigate('pecas')}
          className="bg-slate-800/90 hover:bg-slate-800 border border-slate-700 rounded-2xl p-4 shadow-md transition cursor-pointer"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-purple-400 uppercase tracking-wider">Peças Reparo</span>
            <div className="w-7 h-7 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center">
              <Package className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-2xl font-black text-purple-300">{stats?.pecasPendentes || 0}</p>
          <p className="text-[10px] text-slate-400 mt-1">Peças para aquisição</p>
        </div>
      </div>

      {/* Main Grid: Actions & Audit Logs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Quick Buttons Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-3">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider text-slate-300">Ações Rápidas</h3>
          <button
            onClick={onOpenNewFirearm}
            className="w-full bg-sky-600 hover:bg-sky-500 text-white font-bold py-3 px-4 rounded-xl text-xs flex items-center justify-center space-x-2 shadow-lg transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Cadastrar Novo Armamento</span>
          </button>

          <button
            onClick={() => onNavigate('pecas')}
            className="w-full bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 font-bold py-3 px-4 rounded-xl text-xs flex items-center justify-center space-x-2 transition cursor-pointer"
          >
            <Package className="w-4 h-4 text-amber-400" />
            <span>Aba Peças para Reparo</span>
          </button>

          <button
            onClick={() => PdfService.generateRelatorioArmasPDF(recentFirearms)}
            className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold py-3 px-4 rounded-xl text-xs flex items-center justify-center space-x-2 transition cursor-pointer"
          >
            <FileText className="w-4 h-4 text-emerald-400" />
            <span>Exportar Relatório Geral (PDF)</span>
          </button>
        </div>

        {/* Audit Feed Widget */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-3">
          <h3 className="text-sm font-bold text-white flex items-center space-x-2">
            <Activity className="w-4 h-4 text-emerald-400" />
            <span>Últimas Atividades de Auditoria</span>
          </h3>

          <div className="space-y-2">
            {recentLogs.map((log) => (
              <div key={log.id} className="text-xs bg-slate-800/50 p-2.5 rounded-lg border border-slate-800">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="font-semibold text-sky-400">{log.user_nome}</span>
                  <span className="text-[10px]">{new Date(log.timestamp).toLocaleTimeString('pt-BR')}</span>
                </div>
                <p className="text-slate-300 mt-1 font-medium line-clamp-2">{log.details}</p>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
};
