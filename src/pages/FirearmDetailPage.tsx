import React, { useState, useEffect } from 'react';
import { Firearm } from '../types/index';
import { ApiService } from '../services/api';
import { PdfService } from '../services/pdf';
import { StatusChip } from '../components/StatusChip';
import { 
  ArrowLeft, 
  Printer, 
  Wrench, 
  Shield, 
  FileText, 
  MapPin, 
  Calendar, 
  Trash2,
  Clock,
  AlertTriangle,
  PackageCheck,
  CheckCircle2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface FirearmDetailPageProps {
  firearmId: string;
  onBack: () => void;
  onOpenManutencao: (firearm: Firearm) => void;
  onEdit: (firearm: Firearm) => void;
}

export const FirearmDetailPage: React.FC<FirearmDetailPageProps> = ({
  firearmId,
  onBack,
  onOpenManutencao,
  onEdit
}) => {
  const { user } = useAuth();
  const [firearm, setFirearm] = useState<Firearm | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFirearm();
  }, [firearmId]);

  const loadFirearm = async () => {
    setLoading(true);
    try {
      const data = await ApiService.getFirearm(firearmId);
      setFirearm(data);
    } catch (err) {
      console.error('Error loading firearm details:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!firearm) return;
    if (confirm(`Tem certeza que deseja EXCLUIR o armamento Série ${firearm.n_serie}? Esta ação é irreversível.`)) {
      try {
        await ApiService.deleteFirearm(firearm.id);
        onBack();
      } catch (err: any) {
        alert(err.message || 'Erro ao excluir armamento');
      }
    }
  };

  if (loading) {
    return <div className="p-12 text-center text-slate-400 font-semibold">Carregando Ficha da Arma...</div>;
  }

  if (!firearm) {
    return (
      <div className="p-8 text-center text-rose-400 space-y-3">
        <p className="font-bold">Armamento não encontrado.</p>
        <button onClick={onBack} className="bg-slate-800 text-white px-4 py-2 rounded-xl text-xs">Voltar</button>
      </div>
    );
  }

  const canManage = user?.role === 'ADMIN' || user?.role === 'ARMEIRO';

  // Calculate 30-day schedule status
  const getScheduleDetails = () => {
    if (!firearm.proxima_manutencao) return null;
    const now = new Date();
    const dueDate = new Date(firearm.proxima_manutencao);
    const diffDays = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 3600 * 24));

    if (diffDays < 0) {
      const overdue = Math.abs(diffDays);
      const isCritical = overdue >= 7;
      return {
        isOverdue: true,
        isCritical,
        overdueDays: overdue,
        text: isCritical
          ? `ALERTA ADM: MANUTENÇÃO URGENTE! Atrasada há ${overdue} dias (Venceu dia ${new Date(firearm.proxima_manutencao).toLocaleDateString('pt-BR')})`
          : `Manutenção Atrasada há ${overdue} dias (${new Date(firearm.proxima_manutencao).toLocaleDateString('pt-BR')})`
      };
    }

    return {
      isOverdue: false,
      isCritical: false,
      overdueDays: 0,
      text: `Próxima Manutenção Preventiva em ${diffDays} dias (${new Date(firearm.proxima_manutencao).toLocaleDateString('pt-BR')})`
    };
  };

  const schedule = getScheduleDetails();

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      
      {/* Back & Actions Navigation Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <button
          onClick={onBack}
          className="flex items-center space-x-2 bg-slate-800 hover:bg-slate-700 text-slate-200 px-4 py-2.5 rounded-xl border border-slate-700 text-xs font-bold transition cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar para Lista de Armas</span>
        </button>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => PdfService.generateFichaArmaPDF(firearm)}
            className="flex items-center space-x-1.5 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold py-2.5 px-4 rounded-xl shadow-lg shadow-sky-600/30 transition cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimir Ficha PDF</span>
          </button>

          {canManage && (
            <>
              <button
                onClick={() => onEdit(firearm)}
                className="flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold py-2.5 px-3.5 rounded-xl transition cursor-pointer"
              >
                <FileText className="w-4 h-4 text-amber-400" />
                <span>Editar</span>
              </button>
              <button
                onClick={handleDelete}
                className="flex items-center space-x-1.5 bg-rose-600/10 hover:bg-rose-600/20 text-rose-400 border border-rose-500/30 text-xs font-bold py-2.5 px-3.5 rounded-xl transition cursor-pointer"
                title="Excluir Armamento"
              >
                <Trash2 className="w-4 h-4" />
                <span>Excluir</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Main Technical Sheet Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
        
        {/* Title Header */}
        <div className="border-b border-slate-800 pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 mb-2">
              <span className="bg-sky-950 text-sky-300 font-bold text-xs px-2.5 py-1 rounded-md border border-sky-800/80">
                {firearm.tipo}
              </span>
              <span className="text-xs font-mono text-slate-400">Patrimônio: {firearm.n_patrimonio}</span>
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight">
              {firearm.marca} {firearm.modelo}
            </h1>
            <p className="text-sm font-semibold text-slate-300 mt-0.5">Calibre: {firearm.calibre}</p>
          </div>

          <div className="flex flex-col items-start md:items-end space-y-2">
            <div className="flex items-center space-x-2">
              <StatusChip status={firearm.situacao} type="situacao" />
              <StatusChip status={firearm.condicao} type="condicao" />
            </div>
            <p className="text-xs text-slate-400 font-mono">
              N° de Série: <strong className="text-sky-300 text-sm">{firearm.n_serie}</strong>
            </p>
          </div>
        </div>

        {/* 30-Day Maintenance Schedule Card */}
        {schedule && (
          <div className={`rounded-2xl p-5 border shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
            schedule.isCritical
              ? 'bg-rose-950/70 border-rose-600 text-rose-100 animate-pulse'
              : schedule.isOverdue
              ? 'bg-amber-950/60 border-amber-600 text-amber-100'
              : 'bg-slate-800/80 border-slate-700/80 text-slate-200'
          }`}>
            <div className="space-y-1">
              <div className="flex items-center space-x-2 font-bold text-sm">
                {schedule.isCritical ? (
                  <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
                ) : schedule.isOverdue ? (
                  <Clock className="w-5 h-5 text-amber-400 shrink-0" />
                ) : (
                  <Calendar className="w-5 h-5 text-sky-400 shrink-0" />
                )}
                <span>{schedule.text}</span>
              </div>
              <p className="text-xs opacity-90">
                Cronograma Preventivo de 30 dias. Última realização:{' '}
                <strong>{firearm.ultima_manutencao ? new Date(firearm.ultima_manutencao).toLocaleDateString('pt-BR') : 'Não registrada'}</strong>
              </p>
            </div>

            {canManage && (
              <button
                onClick={() => onOpenManutencao(firearm)}
                className={`font-bold px-5 py-2.5 rounded-xl text-xs shadow-lg transition cursor-pointer shrink-0 flex items-center space-x-1.5 ${
                  schedule.isCritical
                    ? 'bg-rose-600 hover:bg-rose-500 text-white'
                    : 'bg-amber-600 hover:bg-amber-500 text-white'
                }`}
              >
                <Wrench className="w-4 h-4" />
                <span>Realizar Manutenção e Reiniciar 30 Dias</span>
              </button>
            )}
          </div>
        )}

        {/* Technical Attributes Grid */}
        <div>
          <h3 className="text-xs font-bold uppercase text-slate-400 tracking-wider mb-4 flex items-center space-x-2">
            <FileText className="w-4 h-4 text-sky-400" />
            <span>Especificações Técnicas Gerais</span>
          </h3>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-slate-800/50 p-5 rounded-2xl border border-slate-800">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Capacidade Carga</p>
              <p className="text-sm font-bold text-white mt-0.5">{firearm.capacidade} munições</p>
            </div>

            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Acabamento</p>
              <p className="text-sm font-bold text-white mt-0.5">{firearm.acabamento || 'Oxidado'}</p>
            </div>

            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Comprimento Cano</p>
              <p className="text-sm font-bold text-white mt-0.5">{firearm.comprimento_cano}</p>
            </div>

            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Local de Guarda</p>
              <p className="text-sm font-bold text-white mt-0.5 flex items-center space-x-1">
                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="truncate">{firearm.localizacao}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Observações */}
        {firearm.observacoes && (
          <div className="bg-slate-800/30 border border-slate-800 rounded-xl p-4 text-xs text-slate-300">
            <p className="font-bold text-slate-400 uppercase text-[10px] mb-1">Observações do Armeiro</p>
            <p>{firearm.observacoes}</p>
          </div>
        )}

        {/* Maintenance History Table */}
        <div className="pt-4 border-t border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-white flex items-center space-x-2">
              <Wrench className="w-4 h-4 text-amber-400" />
              <span>Histórico de Manutenções (Preventiva & Corretiva)</span>
            </h3>

            {canManage && (
              <button
                onClick={() => onOpenManutencao(firearm)}
                className="bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/30 font-bold px-3.5 py-1.5 rounded-xl text-xs transition cursor-pointer flex items-center space-x-1"
              >
                <Wrench className="w-3.5 h-3.5" />
                <span>+ Manutenção</span>
              </button>
            )}
          </div>

          {!firearm.historico_manutencao || firearm.historico_manutencao.length === 0 ? (
            <p className="text-xs text-slate-500 italic p-4 bg-slate-800/30 rounded-xl text-center">
              Nenhuma manutenção ou intervenção técnica registrada até o momento.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-800 text-slate-400 font-bold uppercase text-[10px]">
                  <tr>
                    <th className="p-3 rounded-l-xl">Data</th>
                    <th className="p-3">Tipo</th>
                    <th className="p-3">Descrição do Serviço</th>
                    <th className="p-3">Peça Solicitada</th>
                    <th className="p-3 rounded-r-xl">Responsável</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {firearm.historico_manutencao.map((m) => (
                    <tr key={m.id} className="hover:bg-slate-800/40">
                      <td className="p-3 font-mono font-semibold text-slate-200">
                        {new Date(m.data).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                          m.tipo === 'PREVENTIVA'
                            ? 'bg-sky-950/60 text-sky-300 border-sky-800/60'
                            : 'bg-amber-950/60 text-amber-300 border-amber-800/60'
                        }`}>
                          {m.tipo}
                        </span>
                      </td>
                      <td className="p-3 font-medium text-slate-100">{m.descricao}</td>
                      <td className="p-3 text-amber-300 font-medium">
                        {m.peca_solicitada ? (
                          <span>{m.peca_solicitada.nome_peca} ({m.peca_solicitada.quantidade} un)</span>
                        ) : (
                          <span className="text-slate-500">-</span>
                        )}
                      </td>
                      <td className="p-3 text-slate-400">{m.responsavel}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>

    </div>
  );
};
