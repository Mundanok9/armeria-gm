import React, { useState } from 'react';
import { Firearm, CondicaoArmamento } from '../types/index';
import { ApiService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { X, Wrench, Save, PackagePlus, Calendar, AlertTriangle, ShieldCheck } from 'lucide-react';

interface ManutencaoModalProps {
  isOpen: boolean;
  onClose: () => void;
  firearm: Firearm | null;
  onSuccess: () => void;
}

export const ManutencaoModal: React.FC<ManutencaoModalProps> = ({
  isOpen,
  onClose,
  firearm,
  onSuccess
}) => {
  const { user } = useAuth();
  const [tipo, setTipo] = useState<'PREVENTIVA' | 'CORRETIVA'>('PREVENTIVA');
  const [descricao, setDescricao] = useState('');
  const [novaCondicao, setNovaCondicao] = useState<CondicaoArmamento | ''>('');

  // Fields for repair part request (Corretiva)
  const [precisaPeca, setPrecisaPeca] = useState(false);
  const [nomePeca, setNomePeca] = useState('');
  const [qtdPeca, setQtdPeca] = useState('1');
  const [descPeca, setDescPeca] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen || !firearm) return null;

  const currentResponsavel = user
    ? (user.cargo ? `${user.cargo} ${user.nome}` : user.nome)
    : 'Armeiro Responsável';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!descricao) {
      setError('Por favor, informe a descrição detalhada do serviço executado.');
      return;
    }

    if (tipo === 'CORRETIVA' && precisaPeca && !nomePeca.trim()) {
      setError('Por favor, informe o nome da peça necessária para aquisição.');
      return;
    }

    setLoading(true);
    try {
      await ApiService.addManutencao(firearm.id, {
        tipo,
        descricao,
        responsavel: currentResponsavel,
        nova_condicao: novaCondicao || undefined,
        peca_solicitada: (tipo === 'CORRETIVA' && precisaPeca && nomePeca.trim()) ? {
          nome_peca: nomePeca,
          quantidade: Number(qtdPeca) || 1,
          descricao: descPeca || undefined
        } : undefined
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Erro ao registrar manutenção.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl my-8">
        
        {/* Header */}
        <div className="bg-slate-800 px-6 py-4 border-b border-slate-700 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Wrench className="w-5 h-5 text-amber-400" />
            <h2 className="text-lg font-bold text-white">Registro de Manutenção Técnica</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs font-semibold">
              {error}
            </div>
          )}

          {/* Weapon Target Summary */}
          <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-3.5">
            <p className="text-[10px] uppercase font-bold text-slate-400">Armamento Alvo</p>
            <p className="text-sm font-bold text-white">
              {firearm.marca} {firearm.modelo} (Série: <span className="font-mono text-sky-400">{firearm.n_serie}</span>)
            </p>
          </div>

          {/* Tipo de Manutenção: PREVENTIVA vs CORRETIVA */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wider">
              Subdivisão de Manutenção *
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  setTipo('PREVENTIVA');
                  setPrecisaPeca(false);
                }}
                className={`p-3 rounded-xl border text-left flex flex-col justify-between transition cursor-pointer ${
                  tipo === 'PREVENTIVA'
                    ? 'bg-sky-600/20 border-sky-500 text-sky-200'
                    : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <ShieldCheck className={`w-4 h-4 ${tipo === 'PREVENTIVA' ? 'text-sky-400' : 'text-slate-500'}`} />
                  <span className="font-bold text-sm">PREVENTIVA</span>
                </div>
                <p className="text-[11px] mt-1 opacity-80">Revisão periódica de 30 dias, limpeza e lubrificação.</p>
              </button>

              <button
                type="button"
                onClick={() => setTipo('CORRETIVA')}
                className={`p-3 rounded-xl border text-left flex flex-col justify-between transition cursor-pointer ${
                  tipo === 'CORRETIVA'
                    ? 'bg-amber-600/20 border-amber-500 text-amber-200'
                    : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <Wrench className={`w-4 h-4 ${tipo === 'CORRETIVA' ? 'text-amber-400' : 'text-slate-500'}`} />
                  <span className="font-bold text-sm">CORRETIVA</span>
                </div>
                <p className="text-[11px] mt-1 opacity-80">Reparo de avarias e solicitação de peças para substituição.</p>
              </button>
            </div>
          </div>

          {/* 30-day Reset Info Box */}
          <div className="bg-sky-950/40 border border-sky-800/60 p-3 rounded-xl flex items-center space-x-2 text-sky-300 text-xs">
            <Calendar className="w-4 h-4 text-sky-400 shrink-0" />
            <span>
              <strong>Reinício Automático do Cronograma:</strong> Ao concluir esta manutenção ({tipo}), o prazo de prevenção de 30 dias será reiniciado a contar de hoje.
            </span>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1 uppercase tracking-wider">
              Descrição Detalhada do Serviço *
            </label>
            <textarea
              required
              rows={3}
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder={tipo === 'PREVENTIVA' 
                ? "Ex: Desmontagem de 1° escalão, limpeza ultrassônica, lubrificação e inspeção de agulha."
                : "Ex: Substituição da mola recuperadora e ajuste do pino de retenção."
              }
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 text-sm resize-none"
            />
          </div>

          {/* If CORRETIVA: Option to request a repair part */}
          {tipo === 'CORRETIVA' && (
            <div className="bg-amber-950/30 border border-amber-800/60 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <label className="flex items-center space-x-2 text-xs font-bold text-amber-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={precisaPeca}
                    onChange={(e) => setPrecisaPeca(e.target.checked)}
                    className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 bg-slate-800 border-slate-700"
                  />
                  <span>Descrever Peça Necessária para Aquisição</span>
                </label>
                <PackagePlus className="w-4 h-4 text-amber-400" />
              </div>

              {precisaPeca && (
                <div className="space-y-3 pt-2 border-t border-amber-800/40">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">
                      Nome da Peça / Componente *
                    </label>
                    <input
                      type="text"
                      required={precisaPeca}
                      value={nomePeca}
                      onChange={(e) => setNomePeca(e.target.value)}
                      placeholder="Ex: Mola do Tubo de Depósito 12GA, Extrator .40 S&W"
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div className="col-span-1">
                      <label className="block text-[11px] font-bold text-slate-300 mb-1">
                        Quantidade *
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={qtdPeca}
                        onChange={(e) => setQtdPeca(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-amber-500"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-[11px] font-bold text-slate-300 mb-1">
                        Especificação / Detalhes da Peça
                      </label>
                      <input
                        type="text"
                        value={descPeca}
                        onChange={(e) => setDescPeca(e.target.value)}
                        placeholder="Ex: Código do fabricante ou medidas"
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>

                  <p className="text-[10px] text-amber-400 font-medium">
                    * Este item será automaticamente cadastrado e exibido na aba "Peças para Reparo".
                  </p>
                </div>
              )}
            </div>
          )}

          <div className="bg-slate-800/70 border border-slate-700/70 rounded-xl p-3 flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                Responsável Técnico Logado
              </span>
              <span className="text-xs font-bold text-amber-400 flex items-center space-x-1.5 mt-0.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>{currentResponsavel}</span>
              </span>
            </div>
            {user?.matricula && (
              <span className="text-[11px] font-mono text-slate-400 bg-slate-900 border border-slate-800 px-2 py-1 rounded-md">
                Matrícula: {user.matricula}
              </span>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1 uppercase tracking-wider">
              Atualizar Condição Física do Armamento
            </label>
            <select
              value={novaCondicao}
              onChange={(e) => setNovaCondicao(e.target.value as CondicaoArmamento)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-amber-500 text-sm cursor-pointer"
            >
              <option value="">-- Manter Condição Atual ({firearm.condicao}) --</option>
              <option value="EXCELENTE">Excelente</option>
              <option value="BOM">Bom</option>
              <option value="REGULAR">Regular</option>
              <option value="NECESSITA_REPARO">Necessita Reparo</option>
            </select>
          </div>

          <div className="pt-4 flex items-center justify-end space-x-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl text-slate-300 hover:bg-slate-800 text-sm font-semibold transition cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center space-x-2 bg-amber-600 hover:bg-amber-500 text-white px-6 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-amber-600/30 transition cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{loading ? 'Salvando...' : 'Salvar e Reiniciar 30 Dias'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
