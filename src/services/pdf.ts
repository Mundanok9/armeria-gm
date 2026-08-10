import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Firearm, PecaReparo, AgendamentoManutencao } from '../types/index';

export class PdfService {
  /**
   * Generates official "Ficha do Armamento" (Technical Weapon Sheet)
   */
  public static generateFichaArmaPDF(firearm: Firearm) {
    const doc = new jsPDF();
    const now = new Date().toLocaleDateString('pt-BR');

    // Header Background Accent
    doc.setFillColor(15, 23, 42); // Navy primary
    doc.rect(0, 0, 210, 32, 'F');

    // Header Text
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text('GUARDA MUNICIPAL — SISTEMA ARMERIA GM', 14, 15);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.text('FICHA TÉCNICA E CRONOGRAMA DE MANUTENÇÃO', 14, 24);

    doc.setFontSize(9);
    doc.text(`Emissão: ${now}`, 160, 24);

    // Section 1: Identification & Specs
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('1. DADOS DE IDENTIFICAÇÃO DO ARMAMENTO', 14, 42);

    doc.setLineWidth(0.5);
    doc.setDrawColor(203, 213, 225);
    doc.line(14, 44, 196, 44);

    autoTable(doc, {
      startY: 48,
      theme: 'grid',
      headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold' },
      styles: { fontSize: 9, cellPadding: 3 },
      head: [['ESPECIFICAÇÃO', 'DETALHES']],
      body: [
        ['Número de Série', firearm.n_serie],
        ['Número de Patrimônio', firearm.n_patrimonio],
        ['Tipo de Armamento', firearm.tipo],
        ['Marca / Fabricante', firearm.marca],
        ['Modelo', firearm.modelo],
        ['Calibre', firearm.calibre],
        ['Capacidade de Carga', `${firearm.capacidade} munições`],
        ['Acabamento', firearm.acabamento],
        ['Comprimento do Cano', firearm.comprimento_cano],
        ['Situação Atual', firearm.situacao],
        ['Condição Física / Conservação', firearm.condicao],
        ['Localização de Armazenamento', firearm.localizacao],
        ['Última Manutenção Realizada', firearm.ultima_manutencao ? new Date(firearm.ultima_manutencao).toLocaleDateString('pt-BR') : 'Sem registro'],
        ['Próxima Manutenção Programada (Ciclo 30 dias)', firearm.proxima_manutencao ? new Date(firearm.proxima_manutencao).toLocaleDateString('pt-BR') : 'Não agendada'],
        ['Observações Técnicas', firearm.observacoes || 'Nenhuma observação cadastrada.']
      ],
    });

    let currentY = (doc as any).lastAutoTable.finalY + 12;

    // Section 2: Maintenance History (Preventiva vs Corretiva)
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('2. HISTÓRICO DE MANUTENÇÕES (PREVENTIVA / CORRETIVA)', 14, currentY);
    doc.line(14, currentY + 2, 196, currentY + 2);

    if (firearm.historico_manutencao && firearm.historico_manutencao.length > 0) {
      autoTable(doc, {
        startY: currentY + 6,
        theme: 'striped',
        headStyles: { fillColor: [51, 65, 85], textColor: [255, 255, 255] },
        styles: { fontSize: 8, cellPadding: 3 },
        head: [['Data', 'Tipo', 'Descrição do Serviço', 'Peça Solicitada', 'Responsável Técnico']],
        body: firearm.historico_manutencao.map(m => [
          new Date(m.data).toLocaleDateString('pt-BR'),
          m.tipo,
          m.descricao,
          m.peca_solicitada ? `${m.peca_solicitada.nome_peca} (${m.peca_solicitada.quantidade} un)` : 'Nenhuma',
          m.responsavel
        ])
      });
      currentY = (doc as any).lastAutoTable.finalY + 25;
    } else {
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(10);
      doc.setTextColor(100, 116, 139);
      doc.text('Nenhum registro de manutenção ou reparo cadastrado para este armamento.', 14, currentY + 10);
      doc.setTextColor(15, 23, 42);
      currentY += 25;
    }

    // Signatures
    if (currentY > 240) {
      doc.addPage();
      currentY = 40;
    }

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);

    doc.line(20, currentY + 15, 95, currentY + 15);
    doc.text('Inspetor Responsável / Armeiro', 30, currentY + 20);
    doc.text('Guarda Municipal', 38, currentY + 25);

    doc.line(115, currentY + 15, 190, currentY + 15);
    doc.text('Visto da Chefia de Armamento', 125, currentY + 20);
    doc.text('Comando Guarda Municipal', 128, currentY + 25);

    // Save PDF
    doc.save(`FICHA_ARMA_${firearm.n_serie}.pdf`);
  }

  /**
   * Generates General Report of Armaments & Maintenance Schedules
   */
  public static generateRelatorioArmasPDF(firearms: Firearm[], title: string = 'RELATÓRIO GERAL DE ARMAMENTOS E CRONOGRAMA DE MANUTENÇÃO') {
    const doc = new jsPDF('landscape');
    const now = new Date().toLocaleDateString('pt-BR');

    // Header Background Accent
    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, 297, 28, 'F');

    // Header Text
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('GUARDA MUNICIPAL — ARMERIA GM', 14, 13);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(title.toUpperCase(), 14, 21);
    doc.text(`Data de Emissão: ${now} | Total: ${firearms.length} armamentos`, 190, 21);

    autoTable(doc, {
      startY: 34,
      theme: 'grid',
      headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold' },
      styles: { fontSize: 8, cellPadding: 2.5 },
      head: [['N° Série', 'Patrimônio', 'Tipo', 'Marca', 'Modelo', 'Calibre', 'Situação', 'Condição', 'Última Manut.', 'Próxima Manut. (30d)']],
      body: firearms.map(f => [
        f.n_serie,
        f.n_patrimonio,
        f.tipo,
        f.marca,
        f.modelo,
        f.calibre,
        f.situacao,
        f.condicao,
        f.ultima_manutencao ? new Date(f.ultima_manutencao).toLocaleDateString('pt-BR') : '-',
        f.proxima_manutencao ? new Date(f.proxima_manutencao).toLocaleDateString('pt-BR') : '-'
      ])
    });

    doc.save(`RELATORIO_ARMAMENTOS_${new Date().toISOString().slice(0, 10)}.pdf`);
  }

  /**
   * Generates Report for Repair Parts (Peças para Reparo)
   */
  public static generateRelatorioPecasPDF(pecas: PecaReparo[], title: string = 'RELATÓRIO DE PEÇAS PARA REPARO E MANUTENÇÃO CORRETIVA') {
    const doc = new jsPDF('landscape');
    const now = new Date().toLocaleDateString('pt-BR');

    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, 297, 28, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('GUARDA MUNICIPAL — ARMERIA GM', 14, 13);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(title.toUpperCase(), 14, 21);
    doc.text(`Data: ${now} | Total de Itens: ${pecas.length}`, 200, 21);

    autoTable(doc, {
      startY: 34,
      theme: 'grid',
      headStyles: { fillColor: [180, 83, 9], textColor: [255, 255, 255], fontStyle: 'bold' },
      styles: { fontSize: 8, cellPadding: 3 },
      head: [['Nome da Peça', 'Qtd', 'Modelo Armamento', 'N° Série', 'Status', 'Data Solicitada', 'Armeiro Responsável', 'Especificação']],
      body: pecas.map(p => [
        p.nome_peca,
        `${p.quantidade} un`,
        p.firearm_modelo,
        p.firearm_serie,
        p.status,
        new Date(p.data_solicitacao).toLocaleDateString('pt-BR'),
        p.responsavel,
        p.descricao || '-'
      ])
    });

    doc.save(`RELATORIO_PECAS_REPARO_${new Date().toISOString().slice(0, 10)}.pdf`);
  }

  /**
   * Generates Scheduled Maintenance Calendar & Agenda PDF Report
   */
  public static generateAgendaManutencoesPDF(agendamentos: AgendamentoManutencao[], title: string = 'CRONOGRAMA E AGENDA DE MANUTENÇÕES PREVENTIVAS E CORRETIVAS') {
    const doc = new jsPDF('landscape');
    const now = new Date().toLocaleDateString('pt-BR');

    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, 297, 28, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('GUARDA MUNICIPAL — ARMERIA GM', 14, 13);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(title.toUpperCase(), 14, 21);
    doc.text(`Data: ${now} | Total de Agendamentos: ${agendamentos.length}`, 190, 21);

    autoTable(doc, {
      startY: 34,
      theme: 'grid',
      headStyles: { fillColor: [14, 116, 144], textColor: [255, 255, 255], fontStyle: 'bold' },
      styles: { fontSize: 8, cellPadding: 3 },
      head: [['Data Agendada', 'Horário', 'Armamento / Modelo', 'N° Série', 'Tipo', 'Prioridade', 'Status', 'Armeiro Responsável', 'Motivo / Serviço Agendado']],
      body: agendamentos.map(a => [
        new Date(a.data_agendada).toLocaleDateString('pt-BR'),
        a.horario || '09:00',
        a.firearm_modelo,
        a.firearm_serie,
        a.tipo,
        a.prioridade,
        a.status,
        a.responsavel || '-',
        a.motivo_observacao
      ])
    });

    doc.save(`AGENDA_MANUTENCOES_${new Date().toISOString().slice(0, 10)}.pdf`);
  }
}
