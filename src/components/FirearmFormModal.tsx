import React, { useState, useEffect } from 'react';
import { Firearm, TipoArmamento, SituacaoArmamento, CondicaoArmamento } from '../types/index';
import { X, Save, Shield, Trash2 } from 'lucide-react';

interface FirearmFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (firearmData: Partial<Firearm>) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
  initialData?: Firearm | null;
}

export const FirearmFormModal: React.FC<FirearmFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  initialData
}) => {
  const [formData, setFormData] = useState<Partial<Firearm>>({
    n_serie: '',
    tipo: 'PISTOLA',
    marca: 'Taurus',
    modelo: 'TS9',
    calibre: '9mm Parabellum',
    capacidade: 17,
    acabamento: 'Oxidado',
    comprimento_cano: '4.0 polegadas',
    situacao: 'DISPONIVEL',
    condicao: 'EXCELENTE',
    localizacao: 'Armeria Central - Armário A1',
    observacoes: '',
  });

  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    } else {
      setFormData({
        n_serie: '',
        tipo: 'PISTOLA',
        marca: 'Taurus',
        modelo: 'TS9',
        calibre: '9mm Parabellum',
        capacidade: 17,
        acabamento: 'Oxidado',
        comprimento_cano: '4.0 polegadas',
        situacao: 'DISPONIVEL',
        condicao: 'EXCELENTE',
        localizacao: 'Armeria Central - Armário A1',
        observacoes: '',
      });
    }
    setError('');
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.n_serie || !formData.marca || !formData.modelo) {
      setError('Por favor, preencha todos os campos obrigatórios (*).');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSave(formData);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar armamento.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl">
        
        {/* Header */}
        <div className="bg-slate-800 px-6 py-4 border-b border-slate-700 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Shield className="w-5 h-5 text-sky-400" />
            <h2 className="text-lg font-bold text-white">
              {initialData ? 'Editar Cadastro de Armamento' : 'Cadastrar Novo Armamento'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {error && (
            <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs font-semibold">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* N° de Série */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1 uppercase tracking-wider">
                N° de Série *
              </label>
              <input
                type="text"
                required
                value={formData.n_serie || ''}
                onChange={(e) => setFormData({ ...formData, n_serie: e.target.value })}
                placeholder="Ex: TS9-887412"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white font-mono placeholder-slate-500 focus:outline-none focus:border-sky-500 text-sm"
              />
            </div>

            {/* Tipo */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1 uppercase tracking-wider">
                Tipo de Armamento *
              </label>
              <select
                value={formData.tipo || 'PISTOLA'}
                onChange={(e) => setFormData({ ...formData, tipo: e.target.value as TipoArmamento })}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-sky-500 text-sm cursor-pointer"
              >
                <option value="PISTOLA">Pistola</option>
                <option value="REVOLVER">Revólver</option>
                <option value="ESPINGARDA">Espingarda</option>
                <option value="CARABINA">Carabina</option>
                <option value="SUBMETRALHADORA">Submetralhadora</option>
                <option value="FUZIL">Fuzil</option>
                <option value="OUTRO">Outro</option>
              </select>
            </div>

            {/* Marca */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1 uppercase tracking-wider">
                Marca / Fabricante *
              </label>
              <input
                type="text"
                required
                value={formData.marca || ''}
                onChange={(e) => setFormData({ ...formData, marca: e.target.value })}
                placeholder="Ex: Taurus, Glock, Imbel, CBC"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 text-sm"
              />
            </div>

            {/* Modelo */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1 uppercase tracking-wider">
                Modelo *
              </label>
              <input
                type="text"
                required
                value={formData.modelo || ''}
                onChange={(e) => setFormData({ ...formData, modelo: e.target.value })}
                placeholder="Ex: TS9, PT940, ST12"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 text-sm"
              />
            </div>

            {/* Calibre */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1 uppercase tracking-wider">
                Calibre *
              </label>
              <input
                type="text"
                required
                value={formData.calibre || ''}
                onChange={(e) => setFormData({ ...formData, calibre: e.target.value })}
                placeholder="Ex: 9mm Parabellum, .40 S&W, 12 GA"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 text-sm"
              />
            </div>

            {/* Capacidade */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1 uppercase tracking-wider">
                Capacidade de Carga (munições)
              </label>
              <input
                type="number"
                min="1"
                max="100"
                value={formData.capacidade || 15}
                onChange={(e) => setFormData({ ...formData, capacidade: Number(e.target.value) })}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-sky-500 text-sm"
              />
            </div>

            {/* Acabamento */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1 uppercase tracking-wider">
                Acabamento
              </label>
              <input
                type="text"
                value={formData.acabamento || ''}
                onChange={(e) => setFormData({ ...formData, acabamento: e.target.value })}
                placeholder="Ex: Oxidado Negro, Inox, Cerakote"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 text-sm"
              />
            </div>

            {/* Situação */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1 uppercase tracking-wider">
                Situação
              </label>
              <select
                value={formData.situacao || 'DISPONIVEL'}
                onChange={(e) => setFormData({ ...formData, situacao: e.target.value as SituacaoArmamento })}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-sky-500 text-sm cursor-pointer"
              >
                <option value="DISPONIVEL">Disponível</option>
                <option value="MANUTENCAO">Em Manutenção</option>
                <option value="BAIXADA">Baixada</option>
              </select>
            </div>

            {/* Condição */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1 uppercase tracking-wider">
                Condição Física
              </label>
              <select
                value={formData.condicao || 'EXCELENTE'}
                onChange={(e) => setFormData({ ...formData, condicao: e.target.value as CondicaoArmamento })}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-sky-500 text-sm cursor-pointer"
              >
                <option value="EXCELENTE">Excelente</option>
                <option value="BOM">Bom</option>
                <option value="REGULAR">Regular</option>
                <option value="NECESSITA_REPARO">Necessita Reparo</option>
              </select>
            </div>
          </div>

          {/* Localização */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1 uppercase tracking-wider">
              Localização de Armazenamento
            </label>
            <input
              type="text"
              value={formData.localizacao || ''}
              onChange={(e) => setFormData({ ...formData, localizacao: e.target.value })}
              placeholder="Ex: Armeria Central - Armário A1 - Gaveta 02"
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 text-sm"
            />
          </div>

          {/* Observações */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1 uppercase tracking-wider">
              Observações Técnicas / Acessórios
            </label>
            <textarea
              rows={3}
              value={formData.observacoes || ''}
              onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
              placeholder="Ex: Acompanha 3 carregadores, maleta e bandoleira."
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 text-sm resize-none"
            />
          </div>

          {/* Actions */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
            <div>
              {initialData && onDelete && (
                <button
                  type="button"
                  onClick={async () => {
                    if (confirm(`Tem certeza que deseja EXCLUIR o armamento Série ${initialData.n_serie}? Esta ação é irreversível.`)) {
                      setIsSubmitting(true);
                      try {
                        await onDelete(initialData.id);
                        onClose();
                      } catch (err: any) {
                        setError(err.message || 'Erro ao excluir armamento');
                      } finally {
                        setIsSubmitting(false);
                      }
                    }
                  }}
                  disabled={isSubmitting}
                  className="flex items-center space-x-1.5 bg-rose-600/10 hover:bg-rose-600/20 text-rose-400 border border-rose-500/30 px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer disabled:opacity-50"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Excluir Armamento</span>
                </button>
              )}
            </div>

            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 text-sm font-semibold transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center space-x-2 bg-sky-600 hover:bg-sky-500 text-white px-6 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-sky-600/30 transition cursor-pointer disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{isSubmitting ? 'Salvando...' : 'Salvar Armamento'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
