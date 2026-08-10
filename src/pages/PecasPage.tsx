import React, { useState, useEffect } from 'react';
import { PecaReparo } from '../types/index';
import { ApiService } from '../services/api';
import { PdfService } from '../services/pdf';
import { Wrench, Package, Search, Filter, CheckCircle2, Clock, FileText, ArrowRight, ShieldAlert, AlertTriangle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface PecasPageProps {
  onViewFirearmDetails?: (firearmId: string) => void;
  refreshKey?: number;
}

export const PecasPage: React.FC<PecasPageProps> = ({ onViewFirearmDetails, refreshKey }) => {
  const { user } = useAuth();
  const [pecas, setPecas] = useState<PecaReparo[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('TODOS');

  useEffect(() => {
    loadPecas();
  }, [selectedStatus, search, refreshKey]);

  const loadPecas = async () => {
    setLoading(true);
    try {
      const list = await ApiService.getPecas({ status: selectedStatus, search });
      setPecas(list);
    } catch (err) {
      console.error('Error loading pecas:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: 'PENDENTE' | 'ADQUIRIDA' | 'INSTALADA') => {
    try {
      await ApiService.updatePecaStatus(id, newStatus);
      loadPecas();
    } catch (err: any) {
      alert(err.message || 'Erro ao atualizar status da peça.');
    }
  };

  const handleExportPDF = () => {
    PdfService.generateRelatorioPecasPDF(filteredPecas, `RELATÓRIO DE PEÇAS PARA REPARO (${selectedStatus})`);
  };

  const filteredPecas = pecas.filter(p =>
    p.nome_peca.toLowerCase().includes(search.toLowerCase()) ||
    p.firearm_serie.toLowerCase().includes(search.toLowerCase()) ||
    p.firearm_modelo.toLowerCase().includes(search.toLowerCase()) ||
    (p.descricao && p.descricao.toLowerCase().includes(search.toLowerCase()))
  );

  const totalPendentes = pecas.filter(p => p.status === 'PENDENTE').length;
  const totalAdquiridas = pecas.filter(p => p.status === 'ADQUIRIDA').length;
  const totalInstaladas = pecas.filter(p => p.status === 'INSTALADA').length;

  const canManage = user?.role === 'ADMIN' || user?.role === 'ARMEIRO';

  return (
    <div className="space-y-6">
      
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900 p-5 border border-slate-800 rounded-2xl shadow-lg">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center space-x-2">
            <Package className="w-5 h-5 text-amber-400" />
            <span>Peças para Reparo & Manutenção Corretiva</span>
          </h2>
          <p className="text-xs text-slate-400 font-medium mt-0.5">
            Acompanhamento de componentes e peças solicitadas para reposição no acervo
          </p>
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <button
            onClick={handleExportPDF}
            className="flex-1 sm:flex-initial flex items-center justify-center space-x-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold py-2.5 px-4 rounded-xl transition cursor-pointer"
          >
            <FileText className="w-4 h-4 text-emerald-400" />
            <span>Exportar Relatório PDF</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-md flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase text-amber-400">Pendentes de Aquisição</p>
            <p className="text-2xl font-black text-white mt-1">{totalPendentes}</p>
            <p className="text-[10px] text-slate-400">Aguardando compra/fornecedor</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-md flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase text-sky-400">Adquiridas / Em Estoque</p>
            <p className="text-2xl font-black text-white mt-1">{totalAdquiridas}</p>
            <p className="text-[10px] text-slate-400">Prontas para montagem</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center">
            <Package className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-md flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase text-emerald-400">Instaladas / Concluídas</p>
            <p className="text-2xl font-black text-white mt-1">{totalInstaladas}</p>
            <p className="text-[10px] text-slate-400">Armas reparadas</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-md flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="w-full md:w-96 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome da peça, modelo ou N° série..."
            className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-10 pr-4 py-2 text-white placeholder-slate-400 text-sm focus:outline-none focus:border-amber-500"
          />
        </div>

        <div className="flex items-center space-x-2 w-full md:w-auto">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="w-full md:w-48 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs font-semibold focus:outline-none focus:border-amber-500 cursor-pointer"
          >
            <option value="TODOS">Todos os Status</option>
            <option value="PENDENTE">Pendente de Aquisição</option>
            <option value="ADQUIRIDA">Adquirida / Em Estoque</option>
            <option value="INSTALADA">Instalada na Arma</option>
          </select>
        </div>
      </div>

      {/* Repair Parts Cards Grid */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 font-semibold">Carregando peças solicitadas...</div>
      ) : filteredPecas.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center space-y-3">
          <Package className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-lg font-bold text-white">Nenhuma peça encontrada</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Não há registros de peças para reparo correspondentes aos filtros selecionados.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredPecas.map((peca) => {
            const isPendente = peca.status === 'PENDENTE';
            const isAdquirida = peca.status === 'ADQUIRIDA';
            const isInstalada = peca.status === 'INSTALADA';

            return (
              <div
                key={peca.id}
                className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-5 shadow-lg flex flex-col justify-between space-y-4"
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
                      <p className="text-xs text-slate-300 font-medium">
                        Armamento: <strong className="text-white">{peca.firearm_modelo}</strong> (Série: <span className="font-mono text-sky-300">{peca.firearm_serie}</span>)
                      </p>
                    </div>

                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${
                      isPendente 
                        ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                        : isAdquirida
                        ? 'bg-sky-500/10 text-sky-300 border-sky-500/30'
                        : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                    }`}>
                      {peca.status === 'PENDENTE' && 'PENDENTE COMPRA'}
                      {peca.status === 'ADQUIRIDA' && 'ADQUIRIDA / ESTOQUE'}
                      {peca.status === 'INSTALADA' && 'INSTALADA'}
                    </span>
                  </div>

                  {peca.descricao && (
                    <div className="mt-3 bg-slate-900/80 p-3 rounded-xl border border-slate-700/60 text-xs text-slate-300">
                      <p className="font-bold text-slate-400 text-[10px] uppercase mb-0.5">Especificação Técnica / Detalhes</p>
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
                  <div className="pt-3 border-t border-slate-700/60 flex items-center justify-between space-x-2">
                    {onViewFirearmDetails && (
                      <button
                        onClick={() => onViewFirearmDetails(peca.firearm_id)}
                        className="text-xs font-bold text-slate-300 hover:text-white px-3 py-2 rounded-xl bg-slate-700/60 hover:bg-slate-700 transition"
                      >
                        Ver Ficha da Arma
                      </button>
                    )}

                    <div className="flex items-center space-x-2 ml-auto">
                      {isPendente && (
                        <button
                          onClick={() => handleUpdateStatus(peca.id, 'ADQUIRIDA')}
                          className="bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs px-3.5 py-2 rounded-xl shadow transition cursor-pointer flex items-center space-x-1"
                        >
                          <Package className="w-3.5 h-3.5" />
                          <span>Marcar Adquirida</span>
                        </button>
                      )}

                      {isAdquirida && (
                        <button
                          onClick={() => handleUpdateStatus(peca.id, 'INSTALADA')}
                          className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-3.5 py-2 rounded-xl shadow transition cursor-pointer flex items-center space-x-1"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Marcar Instalada</span>
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
  );
};
