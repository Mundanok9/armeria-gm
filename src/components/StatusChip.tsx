import React from 'react';
import { SituacaoArmamento, CondicaoArmamento } from '../types/index';

interface StatusChipProps {
  status: SituacaoArmamento | CondicaoArmamento;
  type?: 'situacao' | 'condicao';
}

export const StatusChip: React.FC<StatusChipProps> = ({ status, type = 'situacao' }) => {
  let styleClasses = 'bg-slate-100 text-slate-700 border-slate-200';

  if (type === 'situacao') {
    switch (status) {
      case 'DISPONIVEL':
        styleClasses = 'bg-emerald-50 text-emerald-800 border-emerald-300 font-semibold';
        break;
      case 'MANUTENCAO':
        styleClasses = 'bg-amber-50 text-amber-800 border-amber-300 font-semibold';
        break;
      case 'BAIXADA':
        styleClasses = 'bg-rose-50 text-rose-800 border-rose-300 font-semibold';
        break;
    }
  } else {
    switch (status) {
      case 'EXCELENTE':
        styleClasses = 'bg-emerald-100/70 text-emerald-900 border-emerald-300';
        break;
      case 'BOM':
        styleClasses = 'bg-blue-100/70 text-blue-900 border-blue-300';
        break;
      case 'REGULAR':
        styleClasses = 'bg-amber-100/70 text-amber-900 border-amber-300';
        break;
      case 'NECESSITA_REPARO':
        styleClasses = 'bg-rose-100/70 text-rose-900 border-rose-300';
        break;
    }
  }

  const formatLabel = (str: string) => {
    return str.replace('_', ' ');
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs border uppercase tracking-wide whitespace-nowrap ${styleClasses}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5 opacity-80" />
      {formatLabel(status)}
    </span>
  );
};
