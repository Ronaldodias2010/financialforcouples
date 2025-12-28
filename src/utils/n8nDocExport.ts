import jsPDF from 'jspdf';

export function exportN8NDocumentation() {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  let yPos = 20;

  const addTitle = (text: string, size: number = 16) => {
    doc.setFontSize(size);
    doc.setFont('helvetica', 'bold');
    doc.text(text, margin, yPos);
    yPos += size * 0.5 + 5;
  };

  const addText = (text: string, size: number = 10) => {
    doc.setFontSize(size);
    doc.setFont('helvetica', 'normal');
    const lines = doc.splitTextToSize(text, contentWidth);
    doc.text(lines, margin, yPos);
    yPos += lines.length * size * 0.4 + 5;
  };

  const addCode = (text: string) => {
    doc.setFontSize(9);
    doc.setFont('courier', 'normal');
    doc.setFillColor(245, 245, 245);
    const lines = doc.splitTextToSize(text, contentWidth - 10);
    const blockHeight = lines.length * 4 + 6;
    doc.rect(margin, yPos - 3, contentWidth, blockHeight, 'F');
    doc.text(lines, margin + 5, yPos + 2);
    yPos += blockHeight + 5;
  };

  const addTable = (headers: string[], rows: string[][]) => {
    const colWidths = [70, 100];
    const rowHeight = 8;
    const cellPadding = 3;

    // Header
    doc.setFillColor(59, 130, 246);
    doc.rect(margin, yPos, contentWidth, rowHeight, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    
    let xPos = margin + cellPadding;
    headers.forEach((header, i) => {
      doc.text(header, xPos, yPos + 5.5);
      xPos += colWidths[i];
    });
    yPos += rowHeight;

    // Rows
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'normal');
    rows.forEach((row, rowIndex) => {
      // Alternating row colors
      if (rowIndex % 2 === 0) {
        doc.setFillColor(249, 250, 251);
      } else {
        doc.setFillColor(255, 255, 255);
      }
      doc.rect(margin, yPos, contentWidth, rowHeight, 'F');
      
      // Border
      doc.setDrawColor(229, 231, 235);
      doc.rect(margin, yPos, contentWidth, rowHeight, 'S');

      xPos = margin + cellPadding;
      row.forEach((cell, i) => {
        doc.text(cell, xPos, yPos + 5.5);
        xPos += colWidths[i];
      });
      yPos += rowHeight;
    });
    yPos += 5;
  };

  const checkNewPage = (needed: number = 30) => {
    if (yPos + needed > doc.internal.pageSize.getHeight() - 20) {
      doc.addPage();
      yPos = 20;
    }
  };

  // Cover
  doc.setFillColor(59, 130, 246);
  doc.rect(0, 0, pageWidth, 60, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('Integracao N8N + WhatsApp', margin, 35);
  doc.setFontSize(12);
  doc.text('Couples Financials - Guia de Configuracao', margin, 48);
  doc.setTextColor(0, 0, 0);
  yPos = 80;

  // Introdução
  addTitle('[VISAO GERAL]', 14);
  addText('Este guia explica como configurar a integracao com N8N para receber lancamentos financeiros via WhatsApp no sistema Couples Financials.');

  checkNewPage();
  addTitle('[PRE-REQUISITOS]', 14);
  addText('- Conta no N8N (self-hosted ou cloud)');
  addText('- Conta Evolution API ou similar para WhatsApp');
  addText('- Acesso ao Supabase do projeto');

  checkNewPage(50);
  addTitle('[ARQUITETURA]', 14);
  addText('WhatsApp -> Evolution API -> N8N -> Edge Function -> Supabase');
  addText('O fluxo funciona da seguinte forma:');
  addText('1. Usuario envia mensagem no WhatsApp');
  addText('2. Evolution API recebe e encaminha para N8N');
  addText('3. N8N processa e chama a Edge Function');
  addText('4. Edge Function valida e salva no Supabase');

  checkNewPage(80);
  addTitle('[CONFIGURACAO DO N8N]', 14);
  addText('Passo 1: Criar novo Workflow');
  addText('- Acesse seu N8N e crie um novo workflow');
  addText('- Adicione um trigger "Webhook"');

  checkNewPage();
  addText('Passo 2: Configurar Webhook');
  addCode('URL: https://SEU_N8N/webhook/whatsapp-financial\nMetodo: POST\nAuthentication: Header Auth');

  checkNewPage();
  addText('Passo 3: Processar Mensagem');
  addText('Adicione um no "Code" com a logica de parsing:');
  addCode(`const message = $input.first().json.body.message;
const phoneNumber = $input.first().json.body.from;

// Extrair dados da mensagem
const regex = /([\\d.,]+)\\s*(.+)/;
const match = message.match(regex);

return [{
  json: {
    amount: parseFloat(match[1].replace(',', '.')),
    description: match[2].trim(),
    phone: phoneNumber,
    raw_message: message
  }
}];`);

  doc.addPage();
  yPos = 20;

  addTitle('[CONFIGURACAO DA EDGE FUNCTION]', 14);
  addText('A Edge Function whatsapp-webhook ja esta configurada no projeto.');
  addText('URL da Edge Function:');
  addCode('https://YOUR_PROJECT.supabase.co/functions/v1/whatsapp-webhook');

  checkNewPage();
  addText('Headers necessarios:');
  addCode(`Authorization: Bearer YOUR_ANON_KEY
Content-Type: application/json
x-webhook-secret: YOUR_WEBHOOK_SECRET`);

  checkNewPage();
  addText('Payload esperado:');
  addCode(`{
  "phone_number": "+5511999999999",
  "message": "50 almoco",
  "user_id": "uuid-do-usuario" // opcional
}`);

  checkNewPage(60);
  addTitle('[VINCULACAO DE USUARIO]', 14);
  addText('Para vincular um numero de WhatsApp a um usuario:');
  addText('1. Usuario acessa Configuracoes -> WhatsApp');
  addText('2. Informa o numero de telefone');
  addText('3. Sistema gera codigo de verificacao');
  addText('4. Usuario envia codigo via WhatsApp');
  addText('5. Sistema confirma vinculacao');

  checkNewPage(80);
  addTitle('[EXEMPLOS DE MENSAGENS]', 14);
  addText('Formatos aceitos pelo sistema:');
  yPos += 3;
  
  addTable(
    ['Mensagem', 'Resultado'],
    [
      ['"50 almoco"', 'Despesa R$50 - Almoco'],
      ['"150.50 supermercado"', 'Despesa R$150,50 - Supermercado'],
      ['"+500 salario"', 'Receita R$500 - Salario'],
      ['"entrada 1000 bonus"', 'Receita R$1000 - Bonus'],
    ]
  );

  doc.addPage();
  yPos = 20;

  addTitle('[SEGURANCA]', 14);
  addText('Configuracoes de seguranca importantes:');
  addText('- Use HTTPS em todas as comunicacoes');
  addText('- Configure o webhook secret no N8N e na Edge Function');
  addText('- Mantenha as chaves API em variaveis de ambiente');
  addText('- Monitore os logs de acesso regularmente');

  checkNewPage(50);
  addTitle('[TROUBLESHOOTING]', 14);
  addText('Problema: Mensagens nao chegam');
  addText('- Verifique se o webhook do N8N esta ativo');
  addText('- Confirme a URL da Edge Function');
  addText('- Verifique os logs no Supabase Dashboard');

  checkNewPage();
  addText('Problema: Usuario nao encontrado');
  addText('- Confirme que o numero esta vinculado');
  addText('- Verifique formato do numero (+55...)');
  addText('- Consulte tabela whatsapp_user_links');

  checkNewPage(40);
  addTitle('[SUPORTE]', 14);
  addText('Para duvidas ou problemas:');
  addText('- Consulte a documentacao do N8N: https://docs.n8n.io');
  addText('- Evolution API: https://doc.evolution-api.com');
  addText('- Supabase Edge Functions: https://supabase.com/docs/guides/functions');

  // Footer
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(128, 128, 128);
    doc.text(
      `Pagina ${i} de ${totalPages} | Couples Financials - ${new Date().toLocaleDateString('pt-BR')}`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    );
  }

  doc.save('N8N-WhatsApp-Setup-Guide.pdf');
}
