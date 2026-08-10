import React, { useState, useEffect } from 'react';
import { Firearm, TipoArmamento, SituacaoArmamento, CondicaoArmamento } from '../types/index';
import { ApiService } from '../services/api';
import { PdfService } from '../services/pdf';
import { FirearmCard } from '../components/FirearmCard';
import { Search, Plus, Filter, FileText, RefreshCw, ShieldAlert, AlertTriangle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface FirearmsPageProps {
  onViewDetails: (firearm: Firearm) => void;
  onOpenManutencao: (firearm: Firearm) => void;
  onOpenAgendamento?: (firearm: Firearm) => void;
  onOpenNewModal: () => void;
  onEditFirearm: (firearm: Firearm) => void;
  initialFilters?: { search?: string; tipo?: string; situacao?: string; condicao?: string; atrasadas?: boolean };
}

export const FirearmsPage: React.FC<FirearmsPageProps> = ({
  onViewDetails,
  onOpenManutencao,
  onOpenAgendamento,
  onOpenNewModal,
  onEditFirearm,
  initialFilters
}) => {
  const { user } = useAuth();
  const [firearms, setFirearms] = useState<Firearm[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(initialFilters?.search || '');
  const [selectedTipo, setSelectedTipo] = useState<TipoArmamento | 'TODOS'>('TODOS');
  const [selectedSituacao, setSelectedSituacao] = useState<SituacaoArmamento | 'TODOS'>((initialFilters?.situacao as any) || 'TODOS');
  const [selectedCondicao, setSelectedCondicao] = useState<CondicaoArmamento | 'TODOS'>('TODOS');
  const [filterAtrasadas, setFilterAtrasadas] = useState<boolean>(initialFilters?.atrasadas || false);

  useEffect(() => {
    setSearch(initialFilters?.search || '');
    setSelectedTipo((initialFilters?.tipo as any) || 'TODOS');
    setSelectedSituacao((initialFilters?.situacao as any) || 'TODOS');
    setSelectedCondicao((initialFilters?.condicao as any) || 'TODOS');
    setFilterAtrasadas(initialFilters?.atrasadas || false);
  }, [initialFilters]);

  useEffect(() => {
    loadFirearms();
  }, [search, selectedTipo, selectedSituacao, selectedCondicao, filterAtrasadas]);

  const loadFirearms = async () => {
    setLoading(true);
    try {
      const list = await ApiService.getFirearms({
        search,
        tipo: selectedTipo,
        situacao: selectedSituacao,
        condicao: selectedCondicao,
        atrasadas: filterAtrasadas
      });
      setFirearms(list);
    } catch (err) {
      console.error('Error loading firearms:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteFirearm = async (firearm: Firearm) => {
    try {
      await ApiService.deleteFirearm(firearm.id);
      await loadFirearms();
    } catch (err: any) {
      alert(err.message || 'Erro ao excluir armamento');
    }
  };

  const handleExportPDF = () => {
    PdfService.generateRelatorioArmasPDF(firearms, `RELATÓRIO DE ARMAMENTOS (Filtro: ${selectedSituacao})`);
  };

  const canManage = user?.role === 'ADMIN' || user?.role === 'ARMEIRO';

  return (
    <div className="space-y-6">
      
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900 p-5 border border-slate-800 rounded-2xl shadow-lg">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Gerenciamento de Armamentos</h2>
          <p className="text-xs text-slate-400 font-medium">Cadastre, pesquise e acompanhe o cronograma de manutenção de 30 dias de cada arma</p>
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <button
            onClick={handleExportPDF}
            className="flex-1 sm:flex-initial flex items-center justify-center space-x-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold py-2.5 px-4 rounded-xl transition cursor-pointer"
          >
            <FileText className="w-4 h-4 text-emerald-400" />
            <span>Relatório PDF</span>
          </button>

          {canManage && (
            <button
              onClick={onOpenNewModal}
              className="flex-1 sm:flex-initial flex items-center justify-center space-x-1.5 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold py-2.5 px-5 rounded-xl shadow-lg shadow-sky-600/30 transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Novo Armamento</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter bar for Overdue Alert toggle */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-md space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          
          {/* Search Box */}
          <div className="md:col-span-2 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="N° Série, Patrimônio ou Marca..."
              className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-10 pr-4 py-2 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-sky-500"
            />
          </div>

          {/* Filter Tipo */}
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-slate-400 shrink-0" />
            <select
              value={selectedTipo}
              onChange={(e) => setSelectedTipo(e.target.value as any)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs font-semibold focus:outline-none focus:border-sky-500 cursor-pointer"
            >
              <option value="TODOS">Todos os Tipos</option>
              <option value="PISTOLA">Pistolas</option>
              <option value="REVOLVER">Revólveres</option>
              <option value="ESPINGARDA">Espingardas</option>
              <option value="CARABINA">Carabinas</option>
              <option value="SUBMETRALHADORA">Submetralhadoras</option>
              <option value="OUTRO">Outros</option>
            </select>
          </div>

          {/* Filter Situação */}
          <div>
            <select
              value={selectedSituacao}
              onChange={(e) => setSelectedSituacao(e.target.value as any)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs font-semibold focus:outline-none focus:border-sky-500 cursor-pointer"
            >
              <option value="TODOS">Todas as Situações</option>
              <option value="DISPONIVEL">Disponível no Cofre</option>
              <option value="MANUTENCAO">Em Manutenção</option>
              <option value="INSPECAO">Em Inspeção</option>
              <option value="BAIXADA">Baixadas / Inativas</option>
            </select>
          </div>

          {/* Filter Condição */}
          <div>
            <select
              value={selectedCondicao}
              onChange={(e) => setSelectedCondicao(e.target.value as any)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs font-semibold focus:outline-none focus:border-sky-500 cursor-pointer"
            >
              <option value="TODOS">Todas as Condições</option>
              <option value="EXCELENTE">Excelente</option>
              <option value="BOM">Bom</option>
              <option value="REGULAR">Regular</option>
              <option value="NECESSITA_REPARO">Necessita Reparo</option>
            </select>
          </div>

        </div>

        {/* Quick filter button: Overdue 7+ Days Alert */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-800">
          <button
            onClick={() => setFilterAtrasadas(!filterAtrasadas)}
            className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-xl border text-xs font-bold transition cursor-pointer ${
              filterAtrasadas
                ? 'bg-rose-600 text-white border-rose-500 shadow-md'
                : 'bg-slate-800 text-rose-300 border-rose-500/30 hover:bg-slate-700'
            }`}
          >
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>Filtrar Apenas Atrasadas 7+ Dias (Alerta ADM)</span>
          </button>

          {filterAtrasadas && (
            <span className="text-xs text-rose-400 font-semibold">Exibindo armamentos com atraso crítico</span>
          )}
        </div>
      </div>

      {/* Firearms List Grid */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 font-semibold flex items-center justify-center space-x-2">
          <RefreshCw className="w-5 h-5 animate-spin text-sky-400" />
          <span>Buscando armamentos...</span>
        </div>
      ) : firearms.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center space-y-3">
          <ShieldAlert className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-lg font-bold text-white">Nenhum armamento encontrado</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Não foram encontrados armamentos correspondentes aos critérios de pesquisa ou filtros selecionados.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {firearms.map((f) => (
            <FirearmCard
              key={f.id}
              firearm={f}
              onViewDetails={onViewDetails}
              onOpenManutencao={onOpenManutencao}
              onOpenAgendamento={onOpenAgendamento}
              onEdit={onEditFirearm}
              onDelete={handleDeleteFirearm}
              userRole={user?.role}
            />
          ))}
        </div>
      )}

    </div>
  );
};
