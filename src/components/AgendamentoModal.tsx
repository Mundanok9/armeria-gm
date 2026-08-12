import React, { useState, useEffect } from 'react';
import { AgendamentoManutencao, Firearm, TipoManutencao, PrioridadeAgendamento, StatusAgendamento } from '../types/index';
import { ApiService } from '../services/api';
import { X, Calendar, Clock, Wrench, AlertTriangle, Shield, UserCheck, FileText } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface AgendamentoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  agendamentoToEdit?: AgendamentoManutencao | null;
  preselectedFirearm?: Firearm | null;
}

export const AgendamentoModal: React.FC<AgendamentoModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  agendamentoToEdit,
  preselectedFirearm
}) => {
  const { user } = useAuth();
  const [firearms, setFirearms] = useState<Firearm[]>([]);
  const [loadingFirearms, setLoadingFirearms] = useState(false);

  // Form states
  const [firearmId, setFirearmId] = useState('');
  const [tipo, setTipo] = useState<TipoManutencao>('PREVENTIVA');
  const [dataAgendada, setDataAgendada] = useState('');
  const [horario, setHorario] = useState('09:00');
  const [prioridade, setPrioridade] = useState<PrioridadeAgendamento>('MEDIA');
  const [responsavel, setResponsavel] = useState('');
  const [motivo, setMotivo] = useState('');
  const [status, setStatus] = useState<StatusAgendamento>('AGENDADO');
  const [resultadoDescricao, setResultadoDescricao] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadFirearmsList();
      if (agendamentoToEdit) {
        setFirearmId(agendamentoToEdit.firearm_id);
        setTipo(agendamentoToEdit.tipo);
        setDataAgendada(agendamentoToEdit.data_agendada);
        setHorario(agendamentoToEdit.horario || '09:00');
        setPrioridade(agendamentoToEdit.prioridade);
        setResponsavel(agendamentoToEdit.responsavel || user?.nome || '');
        setMotivo(agendamentoToEdit.motivo_observacao || '');
        setStatus(agendamentoToEdit.status);
        setResultadoDescricao(agendamentoToEdit.resultado_descricao || '');
      } else {
        // Defaults for new appointment
        if (preselectedFirearm) {
          setFirearmId(preselectedFirearm.id);
        } else {
          setFirearmId('');
        }
        setTipo('PREVENTIVA');
        // Default tomorrow
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        setDataAgendada(tomorrow.toISOString().split('T')[0]);
        setHorario('09:00');
        setPrioridade('MEDIA');
        setResponsavel(user?.nome || '');
        setMotivo('');
        setStatus('AGENDADO');
        setResultadoDescricao('');
      }
      setErrorMsg('');
    }
  }, [isOpen, agendamentoToEdit, preselectedFirearm]);

  const loadFirearmsList = async () => {
    setLoadingFirearms(true);
    try {
      const list = await ApiService.getFirearms();
      setFirearms(list);
      if (!firearmId && list.length > 0 && !preselectedFirearm) {
        setFirearmId(list[0].id);
      }
    } catch (err) {
      console.error('Error loading firearms for agendamento:', err);
    } finally {
      setLoadingFirearms(false);
    }
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!firearmId) {
      setErrorMsg('Selecione um armamento.');
      return;
    }

    if (!dataAgendada) {
      setErrorMsg('Informe a data do agendamento.');
      return;
    }

    if (!motivo.trim()) {
      setErrorMsg('Descreva o motivo ou detalhes da manutenção agendada.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (agendamentoToEdit) {
        await ApiService.updateAgendamento(agendamentoToEdit.id, {
          data_agendada: dataAgendada,
          horario,
          tipo,
          prioridade,
          responsavel,
          motivo_observacao: motivo,
          status,
          resultado_descricao: status === 'CONCLUIDO' ? resultadoDescricao : undefined
        });
      } else {
        await ApiService.createAgendamento({
          firearm_id: firearmId,
          tipo,
          data_agendada: dataAgendada,
          horario,
          prioridade,
          responsavel: responsavel || user?.nome,
          motivo_observacao: motivo
        });
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao salvar agendamento de manutenção.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden my-8">
        
        {/* Modal Header */}
        <div className="bg-slate-800/80 px-6 py-4 border-b border-slate-700 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-9 h-9 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">
                {agendamentoToEdit ? 'Editar Agendamento' : 'Novo Agendamento de Manutenção'}
              </h3>
              <p className="text-[11px] text-slate-400">Programe intervenções preventivas ou corretivas no acervo</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-700/50 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body / Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          
          {errorMsg && (
            <div className="bg-rose-950/80 border border-rose-600/80 p-3 rounded-xl text-rose-200 flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Select Firearm */}
          <div>
            <label className="block font-bold text-slate-300 mb-1 flex items-center space-x-1">
              <Shield className="w-3.5 h-3.5 text-sky-400" />
              <span>Armamento do Acervo *</span>
            </label>
            {loadingFirearms ? (
              <div className="text-slate-500 py-2">Carregando armamentos...</div>
            ) : (
              <>
                <select
                  value={firearmId}
                  onChange={(e) => setFirearmId(e.target.value)}
                  disabled={!!agendamentoToEdit}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-white font-semibold focus:outline-none focus:border-sky-500 disabled:opacity-60 cursor-pointer"
                >
                  {firearms.map((f) => (
                    <option key={f.id} value={f.id}>
                      [{f.tipo}] {f.marca} {f.modelo} — Série: {f.n_serie}
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-sky-400/80 mt-1 flex items-center space-x-1">
                  <span>ℹ️ Cada armamento mantém apenas um agendamento ativo por vez. Novo agendamento substituirá o anterior.</span>
                </p>
              </>
            )}
          </div>

          {/* Tipo & Prioridade Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-300 mb-1 flex items-center space-x-1">
                <Wrench className="w-3.5 h-3.5 text-amber-400" />
                <span>Tipo de Serviço *</span>
              </label>
              <select
                value={tipo}
                onChange={(e) => setTipo(e.target.value as TipoManutencao)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-white font-semibold focus:outline-none focus:border-sky-500 cursor-pointer"
              >
                <option value="PREVENTIVA">Manutenção PREVENTIVA (Rotina 30d)</option>
                <option value="CORRETIVA">Manutenção CORRETIVA (Reparo)</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-300 mb-1">Prioridade</label>
              <select
                value={prioridade}
                onChange={(e) => setPrioridade(e.target.value as PrioridadeAgendamento)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-white font-semibold focus:outline-none focus:border-sky-500 cursor-pointer"
              >
                <option value="BAIXA">Baixa</option>
                <option value="MEDIA">Média</option>
                <option value="ALTA">Alta</option>
                <option value="CRITICA">Crítica (Urgente)</option>
              </select>
            </div>
          </div>

          {/* Date & Time Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-300 mb-1 flex items-center space-x-1">
                <Calendar className="w-3.5 h-3.5 text-sky-400" />
                <span>Data Agendada *</span>
              </label>
              <input
                type="date"
                value={dataAgendada}
                onChange={(e) => setDataAgendada(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-semibold focus:outline-none focus:border-sky-500"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-300 mb-1 flex items-center space-x-1">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>Horário Previsto</span>
              </label>
              <input
                type="time"
                value={horario}
                onChange={(e) => setHorario(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-semibold focus:outline-none focus:border-sky-500"
              />
            </div>
          </div>

          {/* Status (If Editing) */}
          {agendamentoToEdit && (
            <div>
              <label className="block font-bold text-slate-300 mb-1">Status do Agendamento</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as StatusAgendamento)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-white font-semibold focus:outline-none focus:border-sky-500 cursor-pointer"
              >
                <option value="AGENDADO">AGENDADO (Pendente)</option>
                <option value="CONCLUIDO">CONCLUÍDO (Realizado)</option>
                <option value="CANCELADO">CANCELADO</option>
              </select>
            </div>
          )}

          {/* Armeiro Responsável */}
          <div>
            <label className="block font-bold text-slate-300 mb-1 flex items-center space-x-1">
              <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Armeiro Responsável</span>
            </label>
            <input
              type="text"
              value={responsavel}
              onChange={(e) => setResponsavel(e.target.value)}
              placeholder="Nome do Inspetor / Armeiro encarregado"
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
            />
          </div>

          {/* Motivo / Descrição */}
          <div>
            <label className="block font-bold text-slate-300 mb-1 flex items-center space-x-1">
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              <span>Motivo / Detalhes da Intervenção *</span>
            </label>
            <textarea
              rows={3}
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Descreva o motivo do agendamento, peças a serem verificadas ou relatórios de falha..."
              className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
            />
          </div>

          {/* Description of Result (if status === CONCLUIDO) */}
          {status === 'CONCLUIDO' && (
            <div className="bg-emerald-950/40 border border-emerald-600/60 p-3 rounded-xl space-y-2">
              <label className="block font-bold text-emerald-300 mb-1">Resultado da Intervenção / Observações de Conclusão</label>
              <textarea
                rows={2}
                value={resultadoDescricao}
                onChange={(e) => setResultadoDescricao(e.target.value)}
                placeholder="Informe o serviço executado na conclusão..."
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
          )}

          {/* Footer Actions */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold transition cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold shadow-lg shadow-sky-600/30 transition cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? 'Salvando...' : agendamentoToEdit ? 'Salvar Alterações' : 'Confirmar Agendamento'}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
