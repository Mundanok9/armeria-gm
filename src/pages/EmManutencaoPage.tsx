import React, { useState, useEffect } from 'react';
import { Firearm, TipoArmamento, PecaReparo } from '../types/index';
import { ApiService } from '../services/api';
import { StatusChip } from '../components/StatusChip';
import { FirearmSilhouette } from '../components/FirearmSilhouette';
import { PdfService } from '../services/pdf';
import { useAuth } from '../context/AuthContext';
import {
  Wrench,
  Search,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Shield,
  FileText,
  Eye,
  RefreshCw,
  Plus,
  Package,
  CalendarClock,
  Clock,
  Filter,
  Check,
  ChevronRight
} from 'lucide-react';

interface EmManutencaoPageProps {
  onViewFirearmDetails: (firearmId: string) => void;
  onOpenManutencaoModal: (firearm: Firearm) => void;
  onOpenAgendamentoModal: (firearm?: Firearm) => void;
  initialSubTab?: 'bancada' | 'pecas' | 'todos';
  refreshKey?: number;
}

export const EmManutencaoPage: React.FC<EmManutencaoPageProps> = ({
  onViewFirearmDetails,
  onOpenManutencaoModal,
  onOpenAgendamentoModal,
  initialSubTab = 'todos',
  refreshKey
}) => {
  const { user } = useAuth();
  const [firearms, setFirearms] = useState<Firearm[]>([]);
  const [pecas, setPecas] = useState<PecaReparo[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingPecaId, setUpdatingPecaId] = useState<string | null>(null);

  // Filters state
  const [search, setSearch] = useState('');
  const [selectedTipo, setSelectedTipo] = useState<TipoArmamento | 'TODOS'>('TODOS');
  const [selectedPecaStatus, setSelectedPecaStatus] = useState<string>('TODOS');
  const [activeSubTab, setActiveSubTab] = useState<'todos' | 'bancada' | 'pecas'>(initialSubTab);

  const canManage = user?.role === 'ADMIN' || user?.role === 'ARMEIRO';

  useEffect(() => {
    if (initialSubTab) {
      setActiveSubTab(initialSubTab);
    }
  }, [initialSubTab]);

  useEffect(() => {
    loadData();
  }, [refreshKey]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [firearmsData, pecasData] = await Promise.all([
        ApiService.getFirearms(),
        ApiService.getPecas()
      ]);

      // Filter firearms with condition 'NECESSITA_REPARO' or situation 'MANUTENCAO'
      const inMaintenance = firearmsData.filter(
        f => f.condicao === 'NECESSITA_REPARO' || f.situacao === 'MANUTENCAO'
      );
      setFirearms(inMaintenance);
      setPecas(pecasData);
    } catch (err) {
      console.error('Erro ao carregar dados de manutenção e peças:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePecaStatus = async (pecaId: string, newStatus: 'PENDENTE' | 'ADQUIRIDA' | 'INSTALADA') => {
    setUpdatingPecaId(pecaId);
    try {
      await ApiService.updatePecaStatus(pecaId, newStatus);
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Erro ao atualizar status da peça.');
    } finally {
      setUpdatingPecaId(null);
    }
  };

  // Filtered firearms
  const filteredFirearms = firearms.filter(f => {
    const term = search.trim().toLowerCase();
    const matchesSearch =
      !term ||
      f.n_serie.toLowerCase().includes(term) ||
      (f.n_patrimonio && f.n_patrimonio.toLowerCase().includes(term)) ||
      f.marca.toLowerCase().includes(term) ||
      f.modelo.toLowerCase().includes(term) ||
      f.calibre.toLowerCase().includes(term);

    const matchesTipo = selectedTipo === 'TODOS' || f.tipo === selectedTipo;

    return matchesSearch && matchesTipo;
  });

  // Filtered pecas
  const filteredPecas = pecas.filter(p => {
    const term = search.trim().toLowerCase();
    const matchesSearch =
      !term ||
      p.nome_peca.toLowerCase().includes(term) ||
      p.firearm_serie.toLowerCase().includes(term) ||
      p.firearm_modelo.toLowerCase().includes(term) ||
      (p.descricao && p.descricao.toLowerCase().includes(term));

    const matchesStatus = selectedPecaStatus === 'TODOS' || p.status === selectedPecaStatus;

    return matchesSearch && matchesStatus;
  });

  // KPI Metrics
  const totalPendentes = pecas.filter(p => p.status === 'PENDENTE').length;
  const totalAdquiridas = pecas.filter(p => p.status === 'ADQUIRIDA').length;
  const totalInstaladas = pecas.filter(p => p.status === 'INSTALADA').length;

  const handleExportFirearmsPDF = () => {
    if (filteredFirearms.length === 0) return;
    PdfService.generateRelatorioArmasPDF(
      filteredFirearms,
      'Relatório de Armamentos em Manutenção e Reparo (Na Bancada)'
    );
  };

  const handleExportPecasPDF = () => {
    if (filteredPecas.length === 0) return;
    PdfService.generateRelatorioPecasPDF(
      filteredPecas,
      `Relatório de Peças para Reparo (${selectedPecaStatus})`
    );
  };

  return (
    <div className="space-y-6">
      
      {/* KPI Stats summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Stat 1: Total Armas em Bancada */}
        <div 
          onClick={() => setActiveSubTab('bancada')}
          className={`bg-slate-900 border rounded-2xl p-4 shadow-md flex items-center justify-between cursor-pointer transition ${
            activeSubTab === 'bancada' ? 'border-purple-500/60 ring-2 ring-purple-500/20' : 'border-slate-800 hover:border-slate-700'
          }`}
        >
          <div>
            <p className="text-xs font-bold text-purple-400 uppercase tracking-wider">Armas em Manutenção</p>
            <p className="text-3xl font-black text-white mt-1">{firearms.length}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Armamentos na bancada / reparo</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center shrink-0">
            <Wrench className="w-5 h-5" />
          </div>
        </div>

        {/* Stat 2: Peças Pendentes */}
        <div 
          onClick={() => {
            setActiveSubTab('pecas');
            setSelectedPecaStatus('PENDENTE');
          }}
          className={`bg-slate-900 border rounded-2xl p-4 shadow-md flex items-center justify-between cursor-pointer transition ${
            activeSubTab === 'pecas' && selectedPecaStatus === 'PENDENTE' ? 'border-amber-500/60 ring-2 ring-amber-500/20' : 'border-slate-800 hover:border-slate-700'
          }`}
        >
          <div>
            <p className="text-xs font-bold text-amber-400 uppercase tracking-wider">Peças Pendentes</p>
            <p className="text-3xl font-black text-amber-300 mt-1">{totalPendentes}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Aguardando aquisição</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        {/* Stat 3: Peças Adquiridas / Prontas para Instalação */}
        <div 
          onClick={() => {
            setActiveSubTab('pecas');
            setSelectedPecaStatus('ADQUIRIDA');
          }}
          className={`bg-slate-900 border rounded-2xl p-4 shadow-md flex items-center justify-between cursor-pointer transition ${
            activeSubTab === 'pecas' && selectedPecaStatus === 'ADQUIRIDA' ? 'border-sky-500/60 ring-2 ring-sky-500/20' : 'border-slate-800 hover:border-slate-700'
          }`}
        >
          <div>
            <p className="text-xs font-bold text-sky-400 uppercase tracking-wider">Adquiridas / Em Estoque</p>
            <p className="text-3xl font-black text-sky-300 mt-1">{totalAdquiridas}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Prontas para instalar na arma</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center shrink-0">
            <Package className="w-5 h-5" />
          </div>
        </div>

        {/* Stat 4: Peças Instaladas / Concluídas */}
        <div 
          onClick={() => {
            setActiveSubTab('pecas');
            setSelectedPecaStatus('INSTALADA');
          }}
          className={`bg-slate-900 border rounded-2xl p-4 shadow-md flex items-center justify-between cursor-pointer transition ${
            activeSubTab === 'pecas' && selectedPecaStatus === 'INSTALADA' ? 'border-emerald-500/60 ring-2 ring-emerald-500/20' : 'border-slate-800 hover:border-slate-700'
          }`}
        >
          <div>
            <p className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Peças Instaladas</p>
            <p className="text-3xl font-black text-emerald-300 mt-1">{totalInstaladas}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Reparos finalizados</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

      </div>

      {/* Sub-tab Navigation & View Mode */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900 p-2 border border-slate-800 rounded-2xl">
        <div className="flex items-center space-x-1.5 w-full sm:w-auto overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveSubTab('todos')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center space-x-2 ${
              activeSubTab === 'todos'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Wrench className="w-3.5 h-3.5" />
            <span>Visão Unificada ({firearms.length} Armas | {pecas.length} Peças)</span>
          </button>

          <button
            onClick={() => setActiveSubTab('bancada')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center space-x-2 ${
              activeSubTab === 'bancada'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Shield className="w-3.5 h-3.5 text-purple-300" />
            <span>Armamentos na Bancada ({firearms.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('pecas')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center space-x-2 ${
              activeSubTab === 'pecas'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Package className="w-3.5 h-3.5 text-amber-300" />
            <span>Peças de Reparo ({pecas.length})</span>
            {totalAdquiridas > 0 && (
              <span className="bg-sky-500 text-slate-950 font-black text-[10px] px-1.5 py-0.2 rounded-full">
                {totalAdquiridas} prontas
              </span>
            )}
          </button>
        </div>

        {/* Action button inside bar */}
        {activeSubTab === 'pecas' && (
          <button
            onClick={handleExportPecasPDF}
            className="text-xs font-bold text-emerald-400 hover:text-emerald-300 px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 transition cursor-pointer flex items-center space-x-1 ml-auto"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>PDF de Peças</span>
          </button>
        )}
      </div>

      {/* Filter Controls Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-md space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          
          {/* Search Box */}
          <div className="sm:col-span-2 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por Nº de Série, Peça, Marca, Modelo ou Calibre..."
              className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-10 pr-4 py-2 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-purple-500"
            />
          </div>

          {/* Filter options based on active tab */}
          {activeSubTab === 'pecas' ? (
            <div>
              <select
                value={selectedPecaStatus}
                onChange={(e) => setSelectedPecaStatus(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs font-semibold focus:outline-none focus:border-purple-500 cursor-pointer"
              >
                <option value="TODOS">Todos os Status de Peça</option>
                <option value="PENDENTE">Pendente de Aquisição</option>
                <option value="ADQUIRIDA">Adquirida / Pronta para Instalar</option>
                <option value="INSTALADA">Instalada na Arma</option>
              </select>
            </div>
          ) : (
            <div>
              <select
                value={selectedTipo}
                onChange={(e) => setSelectedTipo(e.target.value as any)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs font-semibold focus:outline-none focus:border-purple-500 cursor-pointer"
              >
                <option value="TODOS">Todos os Tipos de Armamento</option>
                <option value="PISTOLA">Pistola</option>
                <option value="REVOLVER">Revólver</option>
                <option value="CARABINA">Carabina</option>
                <option value="ESPINGARDA">Espingarda</option>
                <option value="FUZIL">Fuzil</option>
                <option value="SUBMETRALHADORA">Submetralhadora</option>
              </select>
            </div>
          )}

        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-400 font-semibold bg-slate-900 border border-slate-800 rounded-2xl">
          Carregando dados de manutenção e peças de reparo...
        </div>
      ) : (
        <div className="space-y-8">
          
          {/* SECTION 1: ARMAMENTOS NA BANCADA */}
          {(activeSubTab === 'todos' || activeSubTab === 'bancada') && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <h3 className="text-base font-bold text-white flex items-center space-x-2">
                  <Wrench className="w-4 h-4 text-purple-400" />
                  <span>Armamentos na Bancada / Necessitando Reparo ({filteredFirearms.length})</span>
                </h3>
              </div>

              {filteredFirearms.length === 0 ? (
                <div className="bg-slate-900 border border-emerald-500/30 rounded-2xl p-8 text-center space-y-3 shadow-xl">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div className="max-w-md mx-auto">
                    <h3 className="text-sm font-bold text-white">Nenhum armamento na bancada!</h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {search || selectedTipo !== 'TODOS'
                        ? 'Nenhum armamento atende aos filtros de pesquisa.'
                        : 'Todas as armas de fogo cadastradas estão com condição operante fora da bancada.'}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {filteredFirearms.map((firearm) => {
                    // Find repair parts requested specifically for this firearm
                    const firearmParts = pecas.filter(p => p.firearm_id === firearm.id);
                    const pendingParts = firearmParts.filter(p => p.status === 'PENDENTE');
                    const acquiredParts = firearmParts.filter(p => p.status === 'ADQUIRIDA');
                    const installedParts = firearmParts.filter(p => p.status === 'INSTALADA');

                    return (
                      <div
                        key={firearm.id}
                        className="relative overflow-hidden bg-slate-900 border border-purple-900/40 hover:border-purple-600/60 rounded-2xl p-5 shadow-xl flex flex-col justify-between transition group space-y-4"
                      >
                        {/* Background Watermark Silhouette */}
                        <div className="absolute right-0 top-3 pointer-events-none z-0 opacity-[0.12] group-hover:opacity-[0.22] transition-opacity duration-300 text-sky-400 w-48 h-28 flex items-center justify-center p-2">
                          <FirearmSilhouette tipo={firearm.tipo} className="w-full h-full object-contain" />
                        </div>

                        <div className="relative z-10">
                          {/* Header info */}
                          <div className="flex items-start justify-between gap-2 mb-3">
                            <div>
                              <span className="text-[10px] font-mono font-bold text-purple-300 bg-purple-950/80 border border-purple-800/80 px-2 py-0.5 rounded-md uppercase tracking-wider">
                                {firearm.tipo}
                              </span>
                              <h3 className="text-base font-black text-white mt-1 group-hover:text-purple-300 transition">
                                {firearm.marca} {firearm.modelo}
                              </h3>
                            </div>
                          </div>

                          {/* Status Badges */}
                          <div className="flex flex-wrap gap-2 mb-3">
                            <StatusChip status={firearm.situacao} />
                            <StatusChip status={firearm.condicao} />
                          </div>

                          {/* Technical Specs */}
                          <div className="space-y-1.5 text-xs text-slate-300 bg-slate-950/80 p-3 rounded-xl border border-slate-800/80 mb-3">
                            <div className="flex justify-between">
                              <span className="text-slate-500">Nº de Série:</span>
                              <span className="font-mono font-bold text-sky-300">{firearm.n_serie}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-500">Calibre:</span>
                              <span className="font-bold text-slate-200">{firearm.calibre}</span>
                            </div>
                          </div>

                          {/* LINKED REPAIR PARTS INLINE SECTION */}
                          <div className="bg-slate-950/90 border border-purple-900/50 rounded-xl p-3 space-y-2">
                            <div className="flex items-center justify-between border-b border-slate-800/80 pb-1.5">
                              <span className="text-[11px] font-bold text-purple-300 flex items-center space-x-1">
                                <Package className="w-3.5 h-3.5 text-amber-400" />
                                <span>Peças Solicitadas ({firearmParts.length})</span>
                              </span>
                              {canManage && (
                                <button
                                  onClick={() => onOpenManutencaoModal(firearm)}
                                  className="text-[10px] font-bold text-purple-400 hover:text-purple-300 underline cursor-pointer flex items-center space-x-0.5"
                                >
                                  <Plus className="w-3 h-3" />
                                  <span>Solicitar Peça</span>
                                </button>
                              )}
                            </div>

                            {firearmParts.length === 0 ? (
                              <p className="text-[11px] text-slate-500 italic py-1">
                                Nenhuma peça solicitada para este armamento.
                              </p>
                            ) : (
                              <div className="space-y-2 max-h-48 overflow-y-auto pr-1 text-xs">
                                {firearmParts.map((peca) => {
                                  const isPendente = peca.status === 'PENDENTE';
                                  const isAdquirida = peca.status === 'ADQUIRIDA';
                                  const isInstalada = peca.status === 'INSTALADA';
                                  const isUpdating = updatingPecaId === peca.id;

                                  return (
                                    <div
                                      key={peca.id}
                                      className="bg-slate-900 border border-slate-800 rounded-lg p-2.5 flex flex-col justify-between space-y-2"
                                    >
                                      <div className="flex items-start justify-between gap-1">
                                        <div>
                                          <p className="font-bold text-white text-xs">{peca.nome_peca}</p>
                                          <p className="text-[10px] text-slate-400">Qtd: {peca.quantidade} un. {peca.descricao && `• ${peca.descricao}`}</p>
                                        </div>
                                        <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded border shrink-0 ${
                                          isPendente
                                            ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                                            : isAdquirida
                                            ? 'bg-sky-500/10 text-sky-300 border-sky-500/30'
                                            : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                                        }`}>
                                          {isPendente && 'PENDENTE'}
                                          {isAdquirida && 'ESTOQUE'}
                                          {isInstalada && 'INSTALADA'}
                                        </span>
                                      </div>

                                      {/* Quick Installation / Purchase Buttons right inside firearm card */}
                                      {canManage && !isInstalada && (
                                        <div className="flex items-center space-x-2 pt-1 border-t border-slate-800">
                                          {isPendente && (
                                            <button
                                              onClick={() => handleUpdatePecaStatus(peca.id, 'ADQUIRIDA')}
                                              disabled={isUpdating}
                                              className="w-full bg-sky-600/90 hover:bg-sky-500 text-white font-bold text-[10px] py-1 px-2 rounded-lg transition cursor-pointer flex items-center justify-center space-x-1"
                                            >
                                              <Package className="w-3 h-3" />
                                              <span>{isUpdating ? 'Salvando...' : 'Marcar Adquirida'}</span>
                                            </button>
                                          )}

                                          {isAdquirida && (
                                            <button
                                              onClick={() => handleUpdatePecaStatus(peca.id, 'INSTALADA')}
                                              disabled={isUpdating}
                                              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] py-1.5 px-2 rounded-lg shadow-lg transition cursor-pointer flex items-center justify-center space-x-1"
                                            >
                                              <CheckCircle2 className="w-3.5 h-3.5" />
                                              <span>{isUpdating ? 'Instalando...' : 'Instalar Peça na Arma'}</span>
                                            </button>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="pt-3 border-t border-slate-800 grid grid-cols-2 gap-2">
                          {canManage && (
                            <button
                              onClick={() => onOpenManutencaoModal(firearm)}
                              className="col-span-2 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs py-2 px-3 rounded-xl shadow transition cursor-pointer flex items-center justify-center space-x-1.5"
                            >
                              <Wrench className="w-3.5 h-3.5" />
                              <span>Registrar Reparo / Solicitar Peça</span>
                            </button>
                          )}

                          <button
                            onClick={() => onViewFirearmDetails(firearm.id)}
                            className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs py-2 px-3 rounded-xl transition cursor-pointer flex items-center justify-center space-x-1"
                          >
                            <Eye className="w-3.5 h-3.5 text-sky-400" />
                            <span>Detalhes Ficha</span>
                          </button>

                          {canManage && (
                            <button
                              onClick={() => onOpenAgendamentoModal(firearm)}
                              className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs py-2 px-3 rounded-xl transition cursor-pointer flex items-center justify-center space-x-1"
                            >
                              <CalendarClock className="w-3.5 h-3.5 text-purple-400" />
                              <span>Agendar</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* SECTION 2: GESTÃO DE PEÇAS PARA REPARO */}
          {(activeSubTab === 'todos' || activeSubTab === 'pecas') && (
            <div className="space-y-4 pt-4 border-t border-slate-800">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <h3 className="text-base font-bold text-white flex items-center space-x-2">
                  <Package className="w-4 h-4 text-amber-400" />
                  <span>Gestão Geral de Peças de Reparo & Estoque ({filteredPecas.length})</span>
                </h3>
              </div>

              {filteredPecas.length === 0 ? (
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center space-y-2">
                  <Package className="w-10 h-10 text-slate-600 mx-auto" />
                  <h3 className="text-sm font-bold text-white">Nenhuma peça cadastrada</h3>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    Não há registros de peças para reparo correspondentes aos filtros selecionados.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredPecas.map((peca) => {
                    const isPendente = peca.status === 'PENDENTE';
                    const isAdquirida = peca.status === 'ADQUIRIDA';
                    const isInstalada = peca.status === 'INSTALADA';
                    const isUpdating = updatingPecaId === peca.id;

                    return (
                      <div
                        key={peca.id}
                        className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 shadow-lg flex flex-col justify-between space-y-4 transition"
                      >
                        <div>
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <span className="text-[10px] uppercase font-bold text-amber-400 bg-amber-950 px-2 py-0.5 rounded border border-amber-800">
                                Qtd: {peca.quantidade} un.
                              </span>
                              <h3 className="text-base font-bold text-white mt-1">
                                {peca.nome_peca}
                              </h3>
                              <p className="text-xs text-slate-300 font-medium mt-0.5">
                                Armamento: <strong className="text-white">{peca.firearm_modelo}</strong> (Série: <span className="font-mono text-sky-300">{peca.firearm_serie}</span>)
                              </p>
                            </div>

                            <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border shrink-0 ${
                              isPendente 
                                ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                                : isAdquirida
                                ? 'bg-sky-500/10 text-sky-300 border-sky-500/30'
                                : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                            }`}>
                              {isPendente && 'PENDENTE COMPRA'}
                              {isAdquirida && 'ESTOQUE / PRONTA'}
                              {isInstalada && 'INSTALADA'}
                            </span>
                          </div>

                          {peca.descricao && (
                            <div className="mt-3 bg-slate-950/80 p-3 rounded-xl border border-slate-800 text-xs text-slate-300">
                              <p className="font-bold text-slate-500 text-[10px] uppercase mb-0.5">Especificação Técnica / Detalhes</p>
                              <p>{peca.descricao}</p>
                            </div>
                          )}

                          <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400">
                            <span className="flex items-center space-x-1">
                              <Clock className="w-3.5 h-3.5 text-amber-400" />
                              <span>Solicitada em: {new Date(peca.data_solicitacao).toLocaleDateString('pt-BR')}</span>
                            </span>
                            <span>Armeiro: <strong className="text-slate-200">{peca.responsavel}</strong></span>
                          </div>
                        </div>

                        {/* Status Update Actions */}
                        {canManage && (
                          <div className="pt-3 border-t border-slate-800 flex items-center justify-between space-x-2">
                            {peca.firearm_id && (
                              <button
                                onClick={() => onViewFirearmDetails(peca.firearm_id)}
                                className="text-xs font-bold text-slate-300 hover:text-white px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 transition"
                              >
                                Ver Ficha da Arma
                              </button>
                            )}

                            <div className="flex items-center space-x-2 ml-auto">
                              {isPendente && (
                                <button
                                  onClick={() => handleUpdatePecaStatus(peca.id, 'ADQUIRIDA')}
                                  disabled={isUpdating}
                                  className="bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs px-3.5 py-2 rounded-xl shadow transition cursor-pointer flex items-center space-x-1"
                                >
                                  <Package className="w-3.5 h-3.5" />
                                  <span>{isUpdating ? 'Atualizando...' : 'Marcar Adquirida'}</span>
                                </button>
                              )}

                              {isAdquirida && (
                                <button
                                  onClick={() => handleUpdatePecaStatus(peca.id, 'INSTALADA')}
                                  disabled={isUpdating}
                                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-3.5 py-2 rounded-xl shadow transition cursor-pointer flex items-center space-x-1"
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  <span>{isUpdating ? 'Instalando...' : 'Instalar Peça na Arma'}</span>
                                </button>
                              )}

                              {isInstalada && (
                                <span className="text-xs font-semibold text-emerald-400 flex items-center space-x-1">
                                  <CheckCircle2 className="w-4 h-4" />
                                  <span>Componente Instalado</span>
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

        </div>
      )}

    </div>
  );
};
