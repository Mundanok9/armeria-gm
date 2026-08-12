import React from 'react';
import { Firearm } from '../types/index';
import { StatusChip } from './StatusChip';
import { Shield, Wrench, FileText, MapPin, AlertTriangle, Calendar, Clock, CalendarClock, Trash2 } from 'lucide-react';

interface FirearmCardProps {
  firearm: Firearm;
  onViewDetails: (firearm: Firearm) => void;
  onOpenManutencao: (firearm: Firearm) => void;
  onOpenAgendamento?: (firearm: Firearm) => void;
  onEdit?: (firearm: Firearm) => void;
  onDelete?: (firearm: Firearm) => void;
  userRole?: string;
}

export const FirearmCard: React.FC<FirearmCardProps> = ({
  firearm,
  onViewDetails,
  onOpenManutencao,
  onOpenAgendamento,
  onEdit,
  onDelete,
  userRole
}) => {
  const canManage = userRole === 'ADMIN' || userRole === 'ARMEIRO';

  // Calculate maintenance schedule status
  const getMaintenanceScheduleStatus = () => {
    if (!firearm.proxima_manutencao) return null;

    const now = new Date();
    const dueDate = new Date(firearm.proxima_manutencao);
    const diffTime = dueDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 3600 * 24));

    if (diffDays < 0) {
      const daysOverdue = Math.abs(diffDays);
      const isCriticalAlert = daysOverdue >= 7;

      return {
        label: isCriticalAlert 
          ? `ALERTA ADM: Atrasado há ${daysOverdue} dias! (Venceu dia ${new Date(firearm.proxima_manutencao).toLocaleDateString('pt-BR')})`
          : `Manutenção Atrasada há ${daysOverdue} dias`,
        isOverdue: true,
        isCritical: isCriticalAlert,
        days: daysOverdue
      };
    }

    return {
      label: `Próxima Manutenção em ${diffDays} dias (${new Date(firearm.proxima_manutencao).toLocaleDateString('pt-BR')})`,
      isOverdue: false,
      isCritical: false,
      days: diffDays
    };
  };

  const scheduleInfo = getMaintenanceScheduleStatus();

  return (
    <div className={`bg-slate-800/90 border rounded-2xl p-5 shadow-lg transition flex flex-col justify-between ${
      scheduleInfo?.isCritical 
        ? 'border-rose-500/80 ring-1 ring-rose-500/30 hover:border-rose-400' 
        : 'border-slate-700/80 hover:border-slate-600'
    }`}>
      {/* Top row: Serial & Status */}
      <div>
        <div className="flex items-start justify-between gap-2 mb-3">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-sky-400 tracking-wider bg-sky-950/60 border border-sky-800/80 px-2 py-0.5 rounded">
                {firearm.tipo}
              </span>
            </div>
            <h3 className="text-lg font-bold text-white mt-1 tracking-tight flex items-center space-x-2">
              <span>{firearm.marca} {firearm.modelo}</span>
            </h3>
            <p className="text-sm font-semibold text-slate-300">Calibre: {firearm.calibre}</p>
          </div>
          <div className="flex flex-col items-end space-y-1.5">
            <StatusChip status={firearm.situacao} type="situacao" />
            <StatusChip status={firearm.condicao} type="condicao" />
          </div>
        </div>

        {/* Serial Number highlight */}
        <div className="bg-slate-900/80 border border-slate-700/60 rounded-xl p-3 my-3">
          <div>
            <p className="text-[10px] uppercase font-bold text-slate-400">N° de Série</p>
            <p className="text-base font-mono font-bold text-sky-300">{firearm.n_serie}</p>
          </div>
        </div>

        {/* Location Info */}
        <div className="flex items-center space-x-1.5 text-xs text-slate-400 mb-3">
          <MapPin className="w-4 h-4 text-slate-500 shrink-0" />
          <span className="truncate">{firearm.localizacao}</span>
        </div>

        {/* Maintenance Schedule Alert Banner */}
        {scheduleInfo && (
          <div className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center space-x-2 mb-3 ${
            scheduleInfo.isCritical
              ? 'bg-rose-950/60 border-rose-600/80 text-rose-200 animate-pulse'
              : scheduleInfo.isOverdue
              ? 'bg-amber-950/60 border-amber-600/80 text-amber-200'
              : 'bg-slate-900/60 border-slate-700/60 text-slate-300'
          }`}>
            {scheduleInfo.isCritical ? (
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            ) : scheduleInfo.isOverdue ? (
              <Clock className="w-4 h-4 text-amber-400 shrink-0" />
            ) : (
              <Calendar className="w-4 h-4 text-sky-400 shrink-0" />
            )}
            <span className="truncate">{scheduleInfo.label}</span>
          </div>
        )}
      </div>

      {/* Action Buttons Grid */}
      <div className="pt-3 border-t border-slate-700/60 flex items-center gap-1.5">
        <button
          onClick={() => onViewDetails(firearm)}
          className="flex-1 flex items-center justify-center space-x-1 bg-slate-700 hover:bg-slate-600 text-slate-100 text-xs font-bold py-2.5 px-2 rounded-xl transition cursor-pointer"
        >
          <FileText className="w-3.5 h-3.5 text-sky-400" />
          <span>Ficha</span>
        </button>

        {canManage && (
          <button
            onClick={() => onOpenManutencao(firearm)}
            className={`flex-1 flex items-center justify-center space-x-1 text-xs font-bold py-2.5 px-2 rounded-xl transition cursor-pointer ${
              scheduleInfo?.isCritical
                ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-md'
                : 'bg-amber-600 hover:bg-amber-500 text-white shadow'
            }`}
          >
            <Wrench className="w-3.5 h-3.5" />
            <span>Manutenção</span>
          </button>
        )}

        {canManage && onOpenAgendamento && (
          <button
            onClick={() => onOpenAgendamento(firearm)}
            className="p-2.5 bg-sky-950/80 hover:bg-sky-900 text-sky-300 border border-sky-700/80 text-xs font-bold rounded-xl transition cursor-pointer"
            title="Agendar Manutenção Futura"
          >
            <CalendarClock className="w-4 h-4" />
          </button>
        )}

        {canManage && onEdit && (
          <button
            onClick={() => onEdit(firearm)}
            className="p-2.5 bg-slate-700/50 hover:bg-slate-600 text-slate-300 text-xs font-semibold rounded-xl transition cursor-pointer"
            title="Editar Ficha"
          >
            <Shield className="w-4 h-4 text-slate-400" />
          </button>
        )}

        {canManage && onDelete && (
          <button
            onClick={() => {
              if (confirm(`Tem certeza que deseja EXCLUIR o armamento Série ${firearm.n_serie}? Esta ação é irreversível.`)) {
                onDelete(firearm);
              }
            }}
            className="p-2.5 bg-rose-600/10 hover:bg-rose-600/20 text-rose-400 border border-rose-500/30 text-xs font-semibold rounded-xl transition cursor-pointer"
            title="Excluir Armamento"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};
