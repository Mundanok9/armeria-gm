import React from 'react';
import { LayoutDashboard, Shield, CalendarClock, Package, Users, FileText, Database, Wrench } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export type TabType = 'dashboard' | 'firearms' | 'em_manutencao' | 'agendamentos' | 'pecas' | 'users' | 'logs';

interface NavigationProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  agendamentosBadge?: number;
  emManutencaoBadge?: number;
}

export const Navigation: React.FC<NavigationProps> = ({ activeTab, onTabChange, agendamentosBadge, emManutencaoBadge }) => {
  const { user } = useAuth();

  const tabs = [
    {
      id: 'dashboard' as TabType,
      label: 'Visão Geral',
      icon: LayoutDashboard,
      show: true,
    },
    {
      id: 'firearms' as TabType,
      label: 'Armamentos',
      icon: Shield,
      show: true,
    },
    {
      id: 'em_manutencao' as TabType,
      label: 'Em Manutenção & Peças',
      icon: Wrench,
      show: true,
      badge: emManutencaoBadge,
    },
    {
      id: 'agendamentos' as TabType,
      label: 'Agendados',
      icon: CalendarClock,
      show: true,
      badge: agendamentosBadge,
    },
    {
      id: 'users' as TabType,
      label: 'Usuários',
      icon: Users,
      show: user?.role === 'ADMIN',
    },
    {
      id: 'logs' as TabType,
      label: 'Auditoria',
      icon: FileText,
      show: user?.role === 'ADMIN' || user?.role === 'ARMEIRO',
    },
  ];

  const getTabStyles = (tabId: TabType, isActive: boolean) => {
    switch (tabId) {
      case 'dashboard':
        return isActive
          ? 'bg-blue-950/60 text-blue-400 border-blue-500 shadow-sm shadow-blue-500/20'
          : 'text-slate-400 hover:text-blue-300 hover:bg-slate-800/40 border-transparent';
      case 'firearms':
        return isActive
          ? 'bg-emerald-950/60 text-emerald-400 border-emerald-500 shadow-sm shadow-emerald-500/20'
          : 'text-slate-400 hover:text-emerald-300 hover:bg-slate-800/40 border-transparent';
      case 'em_manutencao':
      case 'pecas':
        return isActive
          ? 'bg-orange-950/60 text-orange-400 border-orange-500 shadow-sm shadow-orange-500/20'
          : 'text-slate-400 hover:text-orange-300 hover:bg-slate-800/40 border-transparent';
      case 'agendamentos':
        return isActive
          ? 'bg-red-950/60 text-red-400 border-red-500 shadow-sm shadow-red-500/20'
          : 'text-slate-400 hover:text-red-300 hover:bg-slate-800/40 border-transparent';
      default:
        return isActive
          ? 'bg-slate-800 text-sky-400 border-sky-500 shadow-sm'
          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 border-transparent';
    }
  };

  const getIconColor = (tabId: TabType, isActive: boolean) => {
    if (!isActive) return 'text-slate-400';
    switch (tabId) {
      case 'dashboard': return 'text-blue-400';
      case 'firearms': return 'text-emerald-400';
      case 'em_manutencao':
      case 'pecas': return 'text-orange-400';
      case 'agendamentos': return 'text-red-400';
      default: return 'text-sky-400';
    }
  };

  const getBadgeStyle = (tabId: TabType) => {
    switch (tabId) {
      case 'em_manutencao': return 'bg-orange-500/20 text-orange-300 border-orange-500/40';
      case 'agendamentos': return 'bg-red-500/20 text-red-300 border-red-500/40';
      default: return 'bg-sky-500/20 text-sky-300 border-sky-500/40';
    }
  };

  return (
    <nav className="bg-slate-900 border-b border-slate-800 px-2 sm:px-4 pt-2">
      <div className="max-w-7xl mx-auto flex space-x-1 sm:space-x-2 overflow-x-auto no-scrollbar">
        {tabs.filter(t => t.show).map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id || (activeTab === 'pecas' && tab.id === 'em_manutencao');

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex items-center space-x-2 px-4 py-3 rounded-t-xl text-sm font-semibold transition-all border-b-2 whitespace-nowrap cursor-pointer ${getTabStyles(tab.id, isActive)}`}
            >
              <Icon className={`w-5 h-5 ${getIconColor(tab.id, isActive)}`} />
              <span>{tab.label}</span>
              {tab.badge !== undefined && tab.badge > 0 && (
                <span className={`ml-1 text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-full border ${getBadgeStyle(tab.id)}`}>
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
