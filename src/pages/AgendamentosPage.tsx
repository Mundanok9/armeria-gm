import React, { useState, useEffect } from 'react';
import { AgendamentoManutencao, StatusAgendamento, PrioridadeAgendamento, TipoManutencao, Firearm } from '../types/index';
import { ApiService } from '../services/api';
import { PdfService } from '../services/pdf';
import { 
  Calendar, 
  Clock, 
  Wrench, 
  Plus, 
  Search, 
  Filter, 
  FileText, 
  AlertTriangle, 
  CheckCircle2, 
  Shield, 
  Edit3, 
  Trash2, 
  ArrowRight,
  List,
  CalendarDays,
  UserCheck,
  ChevronLeft,
  ChevronRight,
  Package
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface AgendamentosPageProps {
  onViewFirearmDetails: (firearmId: string) => void;
  onOpenManutencaoModal: (firearm: Firearm) => void;
  onOpenNewAgendamentoModal: () => void;
  onOpenEditAgendamentoModal: (agendamento: AgendamentoManutencao) => void;
  onNavigateToPecas?: (search?: string) => void;
  initialFilters?: { status?: string; tipo?: string; search?: string };
  refreshKey?: number;
}

export const AgendamentosPage: React.FC<AgendamentosPageProps> = ({
  onViewFirearmDetails,
  onOpenManutencaoModal,
  onOpenNewAgendamentoModal,
  onOpenEditAgendamentoModal,
  onNavigateToPecas,
  initialFilters,
  refreshKey
}) => {
  const { user } = useAuth();
  const [agendamentos, setAgendamentos] = useState<AgendamentoManutencao[]>([]);
  const [firearmsMap, setFirearmsMap] = useState<Record<string, Firearm>>({});
  const [loading, setLoading] = useState(true);

  // Filters state
  const [search, setSearch] = useState(initialFilters?.search || '');
  const [selectedStatus, setSelectedStatus] = useState<StatusAgendamento | 'TODOS'>((initialFilters?.status as any) || 'AGENDADO');
  const [selectedTipo, setSelectedTipo] = useState<TipoManutencao | 'TODOS'>((initialFilters?.tipo as any) || 'TODOS');
  const [selectedPrioridade, setSelectedPrioridade] = useState<PrioridadeAgendamento | 'TODOS'>('TODOS');
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('ASC');
  const [viewMode, setViewMode] = useState<'LISTA' | 'CALENDARIO'>('LISTA');

  // Sync state when initialFilters prop changes
  useEffect(() => {
    if (initialFilters) {
      if (initialFilters.status !== undefined) {
        setSelectedStatus(initialFilters.status as any);
      } else {
        setSelectedStatus('AGENDADO');
      }
      if (initialFilters.search !== undefined) {
        setSearch(initialFilters.search);
      }
      if (initialFilters.tipo !== undefined) {
        setSelectedTipo(initialFilters.tipo as any);
      }
    }
  }, [initialFilters]);

  // Calendar month state
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    loadData();
  }, [search, selectedStatus, selectedTipo, selectedPrioridade, refreshKey]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [list, fList] = await Promise.all([
        ApiService.getAgendamentos({
          search,
          status: selectedStatus,
          tipo: selectedTipo,
          prioridade: selectedPrioridade
        }),
        ApiService.getFirearms()
      ]);

      setAgendamentos(list);

      const fMap: Record<string, Firearm> = {};
      fList.forEach(f => {
        fMap[f.id] = f;
      });
      setFirearmsMap(fMap);

    } catch (err) {
      console.error('Error loading agendamentos:', err);
    } finally {
      setLoading(false);
    }
  };

  // Calculate sorted agendamentos by date closest first (or furthest first)
  const sortedAgendamentos = [...agendamentos].sort((a, b) => {
    const dateA = a.data_agendada || '';
    const dateB = b.data_agendada || '';
    if (dateA !== dateB) {
      return sortOrder === 'ASC' ? dateA.localeCompare(dateB) : dateB.localeCompare(dateA);
    }
    const timeA = a.horario || '';
    const timeB = b.horario || '';
    return sortOrder === 'ASC' ? timeA.localeCompare(timeB) : timeB.localeCompare(timeA);
  });

  const handleExportPDF = () => {
    PdfService.generateAgendaManutencoesPDF(
      sortedAgendamentos,
      `AGENDA DE MANUTENÇÕES (${selectedStatus} - ${selectedTipo})`
    );
  };

  const handleQuickStatusChange = async (agendamento: AgendamentoManutencao, newStatus: StatusAgendamento) => {
    try {
      await ApiService.updateAgendamentoStatus(agendamento.id, newStatus);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Erro ao alterar status');
    }
  };

  const handleDeleteAgendamento = async (id: string, serie: string) => {
    if (confirm(`Deseja realmente cancelar/excluir o agendamento da arma Série ${serie}?`)) {
      try {
        await ApiService.deleteAgendamento(id);
        loadData();
      } catch (err: any) {
        alert(err.message || 'Erro ao excluir agendamento');
      }
    }
  };

  const handleExecuteMaintenance = (agendamento: AgendamentoManutencao) => {
    const firearm = firearmsMap[agendamento.firearm_id];
    if (firearm) {
      onOpenManutencaoModal(firearm);
    } else {
      alert('Armamento correspondente não encontrado no acervo.');
    }
  };

  const canManage = user?.role === 'ADMIN' || user?.role === 'ARMEIRO';

  // Calendar calculations
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  const getAgendamentosForDate = (dateDay: number) => {
    const dayStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dateDay).padStart(2, '0')}`;
    return agendamentos.filter(a => a.data_agendada === dayStr);
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-slate-900 p-6 border border-slate-800 rounded-2xl shadow-lg">
        <div>
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
              <CalendarDays className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">Cronograma & Agendamento de Manutenções</h2>
          </div>
          <p className="text-xs text-slate-400 font-medium mt-1">
            Planejamento e acompanhamento de intervenções preventivas de 30 dias e reparos corretivos
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* View Mode Switcher */}
          <div className="bg-slate-800 p-1 rounded-xl border border-slate-700 flex items-center space-x-1 text-xs font-bold">
            <button
              onClick={() => setViewMode('LISTA')}
              className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg transition cursor-pointer ${
                viewMode === 'LISTA' ? 'bg-sky-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              <List className="w-4 h-4" />
              <span>Lista</span>
            </button>
            <button
              onClick={() => setViewMode('CALENDARIO')}
              className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg transition cursor-pointer ${
                viewMode === 'CALENDARIO' ? 'bg-sky-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>Calendário</span>
            </button>
          </div>

          <button
            onClick={handleExportPDF}
            className="flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold py-2.5 px-3.5 rounded-xl transition cursor-pointer"
          >
            <FileText className="w-4 h-4 text-emerald-400" />
            <span>Relatório PDF</span>
          </button>

          {canManage && (
            <button
              onClick={onOpenNewAgendamentoModal}
              className="flex items-center space-x-1.5 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold py-2.5 px-4 rounded-xl shadow-lg shadow-sky-600/30 transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Agendar Manutenção</span>
            </button>
          )}
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-md space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
          
          {/* Search Box */}
          <div className="lg:col-span-2 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Série, modelo ou motivo do agendamento..."
              className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-10 pr-4 py-2 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-sky-500"
            />
          </div>

          {/* Filter Status */}
          <div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as any)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs font-semibold focus:outline-none focus:border-sky-500 cursor-pointer"
            >
              <option value="TODOS">Todos os Status</option>
              <option value="AGENDADO">Agendado (Pendente)</option>
              <option value="EM_ANDAMENTO">Em Andamento (Bancada)</option>
              <option value="CONCLUIDO">Concluído</option>
              <option value="CANCELADO">Cancelado</option>
            </select>
          </div>

          {/* Filter Tipo */}
          <div>
            <select
              value={selectedTipo}
              onChange={(e) => setSelectedTipo(e.target.value as any)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs font-semibold focus:outline-none focus:border-sky-500 cursor-pointer"
            >
              <option value="TODOS">Todos os Tipos</option>
              <option value="PREVENTIVA">Preventiva (Rotina 30d)</option>
              <option value="CORRETIVA">Corretiva (Reparo)</option>
            </select>
          </div>

          {/* Filter Prioridade */}
          <div>
            <select
              value={selectedPrioridade}
              onChange={(e) => setSelectedPrioridade(e.target.value as any)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs font-semibold focus:outline-none focus:border-sky-500 cursor-pointer"
            >
              <option value="TODOS">Todas as Prioridades</option>
              <option value="CRITICA">Crítica (Urgente)</option>
              <option value="ALTA">Alta</option>
              <option value="MEDIA">Média</option>
              <option value="BAIXA">Baixa</option>
            </select>
          </div>

          {/* Sort Order */}
          <div>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as 'ASC' | 'DESC')}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-amber-300 border-amber-500/30 text-xs font-semibold focus:outline-none focus:border-amber-500 cursor-pointer"
            >
              <option value="ASC">📅 Datas Mais Próximas</option>
              <option value="DESC">📅 Datas Mais Distantes</option>
            </select>
          </div>

        </div>
      </div>

      {/* Main Display: LIST vs CALENDAR */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 font-semibold">Carregando agendamentos...</div>
      ) : viewMode === 'CALENDARIO' ? (

        /* CALENDAR VIEW */
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          
          {/* Calendar Header Month Control */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <h3 className="text-base font-bold text-white flex items-center space-x-2">
              <Calendar className="w-5 h-5 text-sky-400" />
              <span>Agenda de Manutenções — {monthNames[month]} {year}</span>
            </h3>

            <div className="flex items-center space-x-2">
              <button
                onClick={prevMonth}
                className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition cursor-pointer"
                title="Mês Anterior"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs font-bold text-sky-400 min-w-[120px] text-center">
                {monthNames[month]} {year}
              </span>
              <button
                onClick={nextMonth}
                className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition cursor-pointer"
                title="Próximo Mês"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Calendar Days Grid */}
          <div className="grid grid-cols-7 gap-1.5 text-center text-xs font-bold text-slate-400 uppercase py-2">
            <div>Dom</div>
            <div>Seg</div>
            <div>Ter</div>
            <div>Qua</div>
            <div>Qui</div>
            <div>Sex</div>
            <div>Sáb</div>
          </div>

          <div className="grid grid-cols-7 gap-2">
            {/* Empty slots for days before the 1st of the month */}
            {Array.from({ length: firstDayOfMonth }).map((_, i) => (
              <div key={`empty-${i}`} className="h-24 bg-slate-950/40 border border-slate-900/60 rounded-xl p-1.5 opacity-30" />
            ))}

            {/* Calendar Days */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dayAgendamentos = getAgendamentosForDate(day);
              const isToday = 
                new Date().getDate() === day &&
                new Date().getMonth() === month &&
                new Date().getFullYear() === year;

              return (
                <div
                  key={`day-${day}`}
                  className={`h-28 border rounded-xl p-2 flex flex-col justify-between transition ${
                    isToday
                      ? 'bg-sky-950/40 border-sky-500/80 ring-1 ring-sky-500/30'
                      : dayAgendamentos.length > 0
                      ? 'bg-slate-800/80 border-slate-700/80'
                      : 'bg-slate-900/50 border-slate-800/80'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-mono font-bold ${isToday ? 'text-sky-400 bg-sky-900/80 px-1.5 py-0.5 rounded' : 'text-slate-300'}`}>
                      {day}
                    </span>
                    {dayAgendamentos.length > 0 && (
                      <span className="text-[10px] bg-slate-700 text-slate-300 px-1.5 py-0.5 rounded-full font-bold">
                        {dayAgendamentos.length}
                      </span>
                    )}
                  </div>

                  <div className="space-y-1 overflow-y-auto max-h-16 no-scrollbar">
                    {dayAgendamentos.map(a => (
                      <div
                        key={a.id}
                        onClick={() => onOpenEditAgendamentoModal(a)}
                        className={`text-[9px] p-1 rounded font-bold truncate cursor-pointer transition flex items-center justify-between ${
                          a.prioridade === 'CRITICA'
                            ? 'bg-rose-900/80 text-rose-200 border border-rose-600/80'
                            : a.tipo === 'PREVENTIVA'
                            ? 'bg-sky-950 text-sky-300 border border-sky-800/80'
                            : 'bg-amber-950 text-amber-300 border border-amber-800/80'
                        }`}
                        title={`${a.tipo} - ${a.firearm_modelo} (${a.firearm_serie}): ${a.motivo_observacao}`}
                      >
                        <span className="truncate">{a.firearm_serie}</span>
                        <span className="text-[8px] opacity-80 shrink-0">{a.horario || ''}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

        </div>

      ) : sortedAgendamentos.length === 0 ? (
        
        /* EMPTY STATE */
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center space-y-3">
          <Calendar className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-lg font-bold text-white">Nenhum agendamento encontrado</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Não existem agendamentos de manutenção preventiva ou corretiva que correspondam aos filtros selecionados.
          </p>
          {canManage && (
            <button
              onClick={onOpenNewAgendamentoModal}
              className="mt-2 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold py-2.5 px-4 rounded-xl shadow transition cursor-pointer"
            >
              + Criar Novo Agendamento
            </button>
          )}
        </div>

      ) : (

        /* CARDS / LIST VIEW */
        <div className="space-y-3">
          {sortedAgendamentos.map((a) => {
            const todayStr = new Date().toISOString().split('T')[0];
            const isOverdue = (a.status === 'AGENDADO' || a.status === 'EM_ANDAMENTO') && a.data_agendada < todayStr;
            const firearm = firearmsMap[a.firearm_id];

            return (
              <div
                key={a.id}
                className={`border rounded-2xl p-5 shadow-lg transition flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
                  isOverdue || a.prioridade === 'CRITICA'
                    ? 'bg-rose-950/40 border-rose-600/80 hover:border-rose-500'
                    : a.status === 'CONCLUIDO'
                    ? 'bg-slate-900/60 border-slate-800 opacity-80'
                    : 'bg-slate-800/90 border-slate-700 hover:border-slate-600'
                }`}
              >
                
                {/* Left Section: Info */}
                <div className="space-y-2 flex-1">
                  
                  {/* Badges row */}
                  <div className="flex flex-wrap items-center gap-2">
                    
                    {/* Date badge */}
                    <div className={`flex items-center space-x-1 text-xs font-bold px-2.5 py-1 rounded-lg border ${
                      isOverdue
                        ? 'bg-rose-600 text-white border-rose-500 animate-pulse'
                        : 'bg-slate-900 text-sky-300 border-slate-700'
                    }`}>
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{new Date(a.data_agendada).toLocaleDateString('pt-BR')}</span>
                      {a.horario && <span className="text-[10px] opacity-80">às {a.horario}</span>}
                    </div>

                    {/* Tipo Badge */}
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-lg border ${
                      a.tipo === 'PREVENTIVA'
                        ? 'bg-sky-950/80 text-sky-300 border-sky-800/80'
                        : 'bg-amber-950/80 text-amber-300 border-amber-800/80'
                    }`}>
                      {a.tipo === 'PREVENTIVA' ? 'PREVENTIVA (Rotina 30d)' : 'CORRETIVA (Reparo)'}
                    </span>

                    {/* Prioridade Badge */}
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase border ${
                      a.prioridade === 'CRITICA'
                        ? 'bg-rose-900 text-rose-200 border-rose-600'
                        : a.prioridade === 'ALTA'
                        ? 'bg-amber-900 text-amber-200 border-amber-600'
                        : 'bg-slate-700 text-slate-300 border-slate-600'
                    }`}>
                      Prioridade: {a.prioridade}
                    </span>

                    {/* Status Badge */}
                    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase border ${
                      a.status === 'CONCLUIDO'
                        ? 'bg-emerald-950 text-emerald-300 border-emerald-700'
                        : a.status === 'EM_ANDAMENTO'
                        ? 'bg-amber-950 text-amber-300 border-amber-700'
                        : a.status === 'CANCELADO'
                        ? 'bg-slate-800 text-slate-500 border-slate-700'
                        : 'bg-sky-950 text-sky-300 border-sky-800'
                    }`}>
                      {a.status === 'EM_ANDAMENTO' ? 'EM ANDAMENTO (NA BANCADA)' : a.status}
                    </span>

                    {/* Condição Física Badge */}
                    {firearm?.condicao === 'NECESSITA_REPARO' && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase border bg-rose-950 text-rose-300 border-rose-700 flex items-center space-x-1">
                        <Wrench className="w-3 h-3 text-rose-400" />
                        <span>Condição: Necessita Reparo</span>
                      </span>
                    )}

                    {isOverdue && (
                      <span className="text-[10px] font-bold text-rose-400 flex items-center space-x-1">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>ATRASADA!</span>
                      </span>
                    )}
                  </div>

                  {/* Firearm name & series */}
                  <div>
                    <h3 className="text-base font-bold text-white flex items-center space-x-2">
                      <span>{a.firearm_modelo}</span>
                      <span className="text-xs font-mono font-normal text-sky-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-700">
                        Série: {a.firearm_serie}
                      </span>
                    </h3>
                    <p className="text-xs text-slate-300 mt-1 font-medium">
                      <strong className="text-slate-400">Motivo / Serviço:</strong> {a.motivo_observacao}
                    </p>
                  </div>

                  {/* Responsavel & Result */}
                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400">
                    {a.responsavel && (
                      <span className="flex items-center space-x-1">
                        <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Armeiro: {a.responsavel}</span>
                      </span>
                    )}
                    {a.concluido_em && (
                      <span className="text-emerald-400 font-semibold">
                        Concluído em: {new Date(a.concluido_em).toLocaleDateString('pt-BR')}
                      </span>
                    )}
                  </div>

                  {a.resultado_descricao && (
                    <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800 text-xs text-slate-300">
                      <strong className="text-emerald-400">Resultado da Intervenção:</strong> {a.resultado_descricao}
                    </div>
                  )}

                </div>

                {/* Right Section: Interactive Action Buttons */}
                <div className="flex flex-wrap md:flex-col items-stretch justify-end gap-2 w-full md:w-auto shrink-0 border-t md:border-t-0 md:border-l border-slate-700/60 pt-3 md:pt-0 md:pl-4">
                  
                  {/* Execute Maintenance Button */}
                  {canManage && a.status !== 'CONCLUIDO' && a.status !== 'CANCELADO' && (
                    <button
                      onClick={() => handleExecuteMaintenance(a)}
                      className="bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold py-2 px-3.5 rounded-xl shadow transition cursor-pointer flex items-center justify-center space-x-1.5"
                    >
                      <Wrench className="w-3.5 h-3.5" />
                      <span>Realizar Manutenção</span>
                    </button>
                  )}

                  {/* View Weapon Sheet */}
                  <button
                    onClick={() => onViewFirearmDetails(a.firearm_id)}
                    className="bg-slate-700/80 hover:bg-slate-700 text-slate-200 text-xs font-semibold py-2 px-3 rounded-xl transition cursor-pointer flex items-center justify-center space-x-1"
                  >
                    <Shield className="w-3.5 h-3.5 text-sky-400" />
                    <span>Ficha da Arma</span>
                  </button>

                  {/* Jump to repair parts if corrective */}
                  {a.tipo === 'CORRETIVA' && onNavigateToPecas && (
                    <button
                      onClick={() => onNavigateToPecas(a.firearm_serie)}
                      className="bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 text-xs font-semibold py-2 px-3 rounded-xl transition cursor-pointer flex items-center justify-center space-x-1"
                    >
                      <Package className="w-3.5 h-3.5 text-amber-400" />
                      <span>Peças da Arma</span>
                    </button>
                  )}

                  {/* Edit Schedule */}
                  {canManage && (
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => onOpenEditAgendamentoModal(a)}
                        className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold py-1.5 px-2.5 rounded-lg border border-slate-700 transition cursor-pointer flex items-center justify-center space-x-1"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-amber-400" />
                        <span>Editar</span>
                      </button>

                      <button
                        onClick={() => handleDeleteAgendamento(a.id, a.firearm_serie)}
                        className="p-1.5 bg-rose-950/40 hover:bg-rose-900/60 text-rose-400 border border-rose-500/30 rounded-lg transition cursor-pointer"
                        title="Cancelar / Excluir Agendamento"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                </div>

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};
