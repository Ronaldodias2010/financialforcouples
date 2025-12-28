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

  const addTable = (headers: string[], rows: string[][], colWidths: number[] = [70, 100]) => {
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
      xPos += colWidths[i] || 50;
    });
    yPos += rowHeight;

    // Rows
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'normal');
    rows.forEach((row, rowIndex) => {
      if (rowIndex % 2 === 0) {
        doc.setFillColor(249, 250, 251);
      } else {
        doc.setFillColor(255, 255, 255);
      }
      doc.rect(margin, yPos, contentWidth, rowHeight, 'F');
      doc.setDrawColor(229, 231, 235);
      doc.rect(margin, yPos, contentWidth, rowHeight, 'S');

      xPos = margin + cellPadding;
      row.forEach((cell, i) => {
        doc.text(cell, xPos, yPos + 5.5);
        xPos += colWidths[i] || 50;
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
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('N8N + WhatsApp + Supabase', margin, 30);
  doc.setFontSize(14);
  doc.text('Guia Completo - IDEMPOTENTE', margin, 42);
  doc.setFontSize(10);
  doc.text('Couples Financials - v2.0', margin, 52);
  doc.setTextColor(0, 0, 0);
  yPos = 80;

  // IDEMPOTÊNCIA
  addTitle('[IDEMPOTENCIA - GARANTIA DE CONSISTENCIA]', 14);
  addText('O sistema garante que mensagens duplicadas NAO criem transacoes duplicadas.');
  yPos += 3;

  addTable(
    ['Mecanismo', 'Descricao'],
    [
      ['UNIQUE Constraint', '(user_id, whatsapp_message_id) impede duplicatas'],
      ['UPSERT Pattern', 'Se mensagem ja existe, retorna dados existentes'],
      ['external_reference_id', 'Transacoes usam referencia unica do input'],
      ['processed_at Check', 'Inputs processados retornam transaction_id'],
    ]
  );

  checkNewPage(80);
  addTitle('[FLUXO IDEMPOTENTE]', 14);
  addCode(`1. N8N envia POST /whatsapp-input com whatsapp_message_id
2. Edge Function verifica se ja existe:
   - SE EXISTE: Retorna { already_exists: true, input_id: "..." }
   - SE NAO: Cria novo com status "pending"
3. N8N envia PATCH com dados da IA
4. Edge Function verifica se processado:
   - SE SIM: Retorna { already_processed: true, transaction_id }
   - SE NAO: Atualiza e retorna status
5. process-financial-input usa external_reference_id`);

  doc.addPage();
  yPos = 20;

  addTitle('[PRE-REQUISITOS]', 14);
  addText('- N8N (self-hosted ou cloud)');
  addText('- WhatsApp Business API (Evolution API, WABA, etc)');
  addText('- Supabase Project com Edge Functions');
  addText('- OpenAI API Key para IA');

  checkNewPage(60);
  addTitle('[ARQUITETURA]', 14);
  addText('WhatsApp -> Evolution API -> N8N -> Edge Function -> Supabase');
  addText('1. Usuario envia mensagem no WhatsApp');
  addText('2. Evolution API recebe e encaminha para N8N');
  addText('3. N8N processa com IA e chama Edge Function');
  addText('4. Edge Function valida e salva no Supabase');

  checkNewPage(80);
  addTitle('[EDGE FUNCTIONS]', 14);
  addTable(
    ['Funcao', 'Metodo', 'Descricao'],
    [
      ['whatsapp-input', 'POST', 'Cria input (IDEMPOTENTE)'],
      ['whatsapp-input', 'PATCH', 'Atualiza com dados IA'],
      ['whatsapp-input', 'GET', 'Consulta status'],
      ['get-user-options', 'GET', 'Busca categorias/contas/cartoes'],
      ['process-financial-input', 'POST', 'Cria transacao'],
    ],
    [55, 35, 80]
  );

  doc.addPage();
  yPos = 20;

  addTitle('[PAYLOAD POST /whatsapp-input]', 14);
  addCode(`{
  "phone_number": "+5511999999999",
  "raw_message": "gastei 50 almoco credito nubank",
  "whatsapp_message_id": "wamid.abc123...",  // OBRIGATORIO!
  "source": "whatsapp"
}`);

  checkNewPage(80);
  addTitle('[RESPOSTA POST - NOVO INPUT]', 14);
  addCode(`{
  "success": true,
  "input_id": "uuid-do-input",
  "user_id": "uuid-do-usuario",
  "user_name": "Nome",
  "status": "pending",
  "already_exists": false,
  "message": "Input criado com sucesso"
}`);

  checkNewPage(80);
  addTitle('[RESPOSTA POST - JA EXISTE (IDEMPOTENTE)]', 14);
  addCode(`{
  "success": true,
  "input_id": "uuid-existente",
  "status": "confirmed",
  "already_exists": true,
  "processed": true,
  "transaction_id": "uuid-transacao",
  "message": "Input ja existe"
}`);

  doc.addPage();
  yPos = 20;

  addTitle('[PAYLOAD PATCH /whatsapp-input]', 14);
  addCode(`{
  "input_id": "uuid-do-input",
  "amount": 50.00,
  "currency": "BRL",
  "transaction_type": "expense",
  "payment_method": "credit_card",  // OBRIGATORIO
  "category_hint": "Alimentacao",
  "card_hint": "Nubank",            // Se credit_card
  "account_hint": null,             // Se debit_card/pix
  "description_hint": "Almoco",
  "confidence_score": 0.92,
  "owner_user": "user1",            // Para casais
  "auto_confirm": true
}`);

  checkNewPage(80);
  addTitle('[RESPOSTA PATCH - CAMPOS FALTANDO]', 14);
  addCode(`{
  "success": true,
  "input": { "id": "...", "status": "pending" },
  "auto_confirmed": false,
  "complete": false,
  "missing_fields": ["payment_method", "card_hint"],
  "message": "Campos faltando: payment_method, card_hint"
}`);

  checkNewPage(80);
  addTitle('[RESPOSTA PATCH - COMPLETO]', 14);
  addCode(`{
  "success": true,
  "input": { "id": "...", "status": "confirmed" },
  "auto_confirmed": true,
  "complete": true,
  "missing_fields": [],
  "message": "Input confirmado automaticamente"
}`);

  doc.addPage();
  yPos = 20;

  addTitle('[CAMPOS OBRIGATORIOS]', 14);
  addText('Para registrar uma transacao completa:');
  yPos += 3;
  
  addTable(
    ['Campo', 'Descricao'],
    [
      ['amount', 'Numero decimal obrigatorio (50, 150.50)'],
      ['transaction_type', '"expense" ou "income"'],
      ['payment_method', 'cash, pix, debit_card, credit_card'],
      ['category_hint', 'OBRIGATORIO para WhatsApp!'],
      ['card_hint', 'Nome do cartao (se credit_card)'],
      ['account_hint', 'Nome do banco (se debit_card/pix)'],
    ]
  );

  checkNewPage(80);
  addTitle('[CATEGORIA OBRIGATORIA - WHATSAPP]', 14);
  addText('Para inputs do WhatsApp, a categoria e OBRIGATORIA.');
  addText('Se nao for fornecida, o erro retornado sera:');
  addCode(`{
  "success": false,
  "error": "Categoria e obrigatoria para transacoes via WhatsApp",
  "error_code": "CATEGORY_REQUIRED",
  "hint": "Informe a categoria na mensagem"
}`);

  checkNewPage(100);
  addTitle('[FORMATO DA MENSAGEM]', 14);
  addText('Formato: [TIPO] [VALOR] [DESCRICAO] [FORMA] [BANCO/CARTAO]');
  yPos += 3;
  addText('TIPO: "gastei", "paguei", "recebi", "entrada", "+"');
  addText('FORMA: "dinheiro", "pix", "debito", "credito"');

  checkNewPage(80);
  addTitle('[EXEMPLOS DE MENSAGENS]', 14);
  addTable(
    ['Mensagem', 'Resultado'],
    [
      ['gastei 100 almoco credito Nubank', 'Despesa R$100 Nubank'],
      ['paguei 50 padaria debito Itau', 'Despesa R$50 Itau'],
      ['200 mercado pix Bradesco', 'Despesa R$200 Pix'],
      ['+1500 salario conta Santander', 'Receita R$1500'],
    ]
  );

  doc.addPage();
  yPos = 20;

  addTitle('[FLUXO DE PERGUNTAS DA IA]', 14);
  addText('Se a mensagem estiver incompleta, a IA pergunta:');
  yPos += 3;
  addCode(`Mensagem: "50 almoco"

IA: "Entendi R$50 em almoco. Como pagou?
1 - Dinheiro  2 - Pix  3 - Debito  4 - Credito"

Usuario: "4"

IA: "Qual cartao de credito?"
[Lista cartoes cadastrados]

Usuario: "Nubank"

IA: "Registrado: Despesa R$50 - Almoco
Cartao: Nubank (Credito) | Data: Hoje"`);

  checkNewPage(120);
  addTitle('[PROMPT OPENAI PARA N8N]', 14);
  addCode(`Voce extrai dados financeiros de mensagens.

CAMPOS OBRIGATORIOS:
- amount: valor numerico
- transaction_type: "expense" ou "income"
- payment_method: "cash", "pix", "debit_card", "credit_card"
- card_hint: nome do cartao (se credit_card)
- account_hint: nome do banco (se debit_card/pix)

SE INCOMPLETO:
{
  "complete": false,
  "missing": ["payment_method"],
  "question": "Como voce pagou?"
}

SE COMPLETO:
{
  "complete": true,
  "amount": 100,
  "transaction_type": "expense",
  "payment_method": "credit_card",
  "card_hint": "Nubank",
  "description_hint": "Almoco"
}`);

  doc.addPage();
  yPos = 20;

  addTitle('[SUPORTE A CASAIS]', 14);
  addText('O sistema suporta casais compartilhando financas.');
  addText('Use o campo owner_user para identificar quem registrou:');
  addCode(`{
  "owner_user": "user1"  // ou "user2"
}`);
  addText('O campo e opcional. Se nao informado, usa o usuario principal.');

  checkNewPage(80);
  addTitle('[VINCULACAO WHATSAPP]', 14);
  addText('1. Usuario acessa Configuracoes > WhatsApp');
  addText('2. Informa numero com DDI (+55...)');
  addText('3. Sistema envia codigo de verificacao');
  addText('4. Usuario confirma codigo no app');
  addText('5. Campo whatsapp_verified_at e preenchido');

  checkNewPage(60);
  addTitle('[SEGURANCA]', 14);
  addText('- Use HTTPS em todas as comunicacoes');
  addText('- Configure webhook secret no N8N');
  addText('- Mantenha API keys em variaveis de ambiente');
  addText('- Monitore logs regularmente');

  doc.addPage();
  yPos = 20;

  addTitle('[TROUBLESHOOTING]', 14);
  
  addText('Problema: Mensagens duplicadas');
  addText('- Verifique se whatsapp_message_id esta sendo enviado');
  addText('- Confirme constraint UNIQUE no banco');
  addText('- Confira resposta already_exists: true');
  yPos += 5;

  addText('Problema: Usuario nao encontrado');
  addText('- Confirme numero vinculado (+55...)');
  addText('- Verifique whatsapp_verified_at preenchido');
  addText('- Consulte tabela profiles');
  yPos += 5;

  addText('Problema: Campos faltando');
  addText('- Verifique prompt da IA');
  addText('- Confirme fluxo de perguntas');
  addText('- Consulte missing_fields na resposta');

  checkNewPage(60);
  addTitle('[TABELAS DO BANCO]', 14);
  addTable(
    ['Tabela', 'Descricao'],
    [
      ['profiles', 'phone_number, whatsapp_verified_at'],
      ['incoming_financial_inputs', 'whatsapp_message_id, status'],
      ['transactions', 'external_reference_id, source'],
    ]
  );

  checkNewPage(60);
  addTitle('[CAMPO SOURCE EM TRANSACTIONS]', 14);
  addText('O campo "source" identifica a origem da transacao:');
  addTable(
    ['Valor', 'Descricao'],
    [
      ['app', 'Criada manualmente no app'],
      ['whatsapp', 'Via integracao WhatsApp/N8N'],
      ['import', 'Importada de arquivo'],
      ['api', 'Via API externa'],
      ['recurring', 'Gerada automaticamente'],
    ]
  );

  checkNewPage(40);
  addTitle('[SUPORTE]', 14);
  addText('- N8N: https://docs.n8n.io');
  addText('- Evolution API: https://doc.evolution-api.com');
  addText('- Supabase: https://supabase.com/docs');

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

  doc.save('N8N-WhatsApp-Setup-Guide-Idempotente.pdf');
}
