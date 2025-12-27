import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

type Language = 'pt' | 'en' | 'es';

// Color palette matching the theme
const colors = {
  primary: [102, 126, 234] as [number, number, number],      // #667eea - Purple
  secondary: [118, 75, 162] as [number, number, number],     // #764ba2 - Purple secondary
  success: [16, 185, 129] as [number, number, number],       // #10b981 - Green (tip-box)
  warning: [245, 158, 11] as [number, number, number],       // #f59e0b - Amber (warning)
  premium: [139, 92, 246] as [number, number, number],       // #8b5cf6 - Premium purple
  danger: [239, 68, 68] as [number, number, number],         // #ef4444 - Red
  bgLight: [248, 250, 252] as [number, number, number],      // #f8fafc - Light bg
  bgCard: [241, 245, 249] as [number, number, number],       // #f1f5f9 - Card bg
  textDark: [30, 41, 59] as [number, number, number],        // #1e293b - Dark text
  textMuted: [100, 116, 139] as [number, number, number],    // #64748b - Muted text
  border: [226, 232, 240] as [number, number, number],       // #e2e8f0 - Border
  white: [255, 255, 255] as [number, number, number],
};

// Tutorial content for all languages
const getTutorialContent = (language: Language) => {
  const content = {
    pt: {
      title: 'Tutorial Completo',
      subtitle: 'Couples Financials',
      tagline: 'Guia definitivo para dominar suas finanças em casal',
      tableOfContents: 'Índice',
      page: 'Página',
      sections: [
        {
          id: 'introducao',
          title: '1. Introdução',
          icon: '🎯',
          description: 'O Couples Financials é uma plataforma completa de gestão financeira projetada especificamente para casais. Nossa missão é ajudar você e seu parceiro(a) a construírem uma vida financeira saudável e transparente juntos.',
          features: [
            { title: 'Gestão Compartilhada', desc: 'Controle conjunto das finanças do casal' },
            { title: 'Múltiplas Moedas', desc: 'Suporte para BRL, USD, EUR e GBP' },
            { title: 'Inteligência Artificial', desc: 'IA para análises e categorização automática' },
            { title: 'Sistema de Milhas', desc: 'Acompanhe e otimize suas milhas aéreas' },
          ],
          tipBox: {
            title: '💡 Dica',
            content: 'Para melhor experiência, recomendamos que ambos os parceiros criem suas contas e vinculem-se como casal nas configurações.'
          }
        },
        {
          id: 'planos',
          title: '2. Planos e Preços',
          icon: '💎',
          description: 'Oferecemos dois planos para atender diferentes necessidades:',
          comparison: {
            headers: ['Funcionalidade', 'Essential', 'Premium'],
            rows: [
              ['Dashboard Financeiro', '✓ Básico', '✓ Completo'],
              ['Contas e Cartões', '✓ Limitado', '✓ Ilimitado'],
              ['Transações Manuais', '✓', '✓'],
              ['Categorias Personalizadas', '✓', '✓'],
              ['Despesas Recorrentes', '✓', '✓'],
              ['Relatórios Básicos', '✓', '✓'],
              ['Relatórios Avançados', '✗', '✓'],
              ['Converter de Extratos (OCR)', '✗', '✓'],
              ['Sistema de Milhas com IA', '✗', '✓'],
              ['Investimentos', '✗', '✓'],
              ['Assistente IA Financeiro', '✗', '✓'],
              ['Suporte Prioritário', '✗', '✓'],
            ]
          },
          premiumBox: {
            title: '⭐ Desbloqueie o Premium',
            content: 'Assine o plano Premium e tenha acesso a todas as funcionalidades avançadas, incluindo IA, milhas e investimentos.'
          }
        },
        {
          id: 'primeiros-passos',
          title: '3. Primeiros Passos',
          icon: '🚀',
          description: 'Siga estes passos para configurar sua conta:',
          steps: [
            { num: 1, title: 'Crie sua conta', desc: 'Acesse o site e faça seu cadastro com email e senha segura.' },
            { num: 2, title: 'Configure seu perfil', desc: 'Adicione seu nome, foto e preferências de moeda.' },
            { num: 3, title: 'Adicione contas bancárias', desc: 'Cadastre suas contas correntes, poupanças e carteiras.' },
            { num: 4, title: 'Cadastre cartões', desc: 'Adicione seus cartões de crédito com limites e datas de vencimento.' },
            { num: 5, title: 'Vincule seu parceiro(a)', desc: 'Nas configurações, envie um convite para seu parceiro(a) se vincular.' },
          ],
          warningBox: {
            title: '⚠️ Importante',
            content: 'Mantenha sua senha segura e nunca compartilhe suas credenciais. Use senhas fortes com letras, números e símbolos.'
          }
        },
        {
          id: 'dashboard',
          title: '4. Dashboard Principal',
          icon: '📊',
          description: 'O Dashboard é sua central de comando financeiro. Aqui você visualiza:',
          features: [
            { title: 'Saldo Total', desc: 'Soma de todas as suas contas em tempo real' },
            { title: 'Gastos do Mês', desc: 'Total de despesas do mês atual' },
            { title: 'Receitas do Mês', desc: 'Total de receitas recebidas' },
            { title: 'Gráficos Interativos', desc: 'Visualize tendências e padrões de gastos' },
          ],
          tipBox: {
            title: '💡 Dica',
            content: 'Use os filtros por período e categoria para análises mais detalhadas dos seus gastos.'
          }
        },
        {
          id: 'contas',
          title: '5. Gerenciamento de Contas',
          icon: '🏦',
          description: 'Gerencie todas as suas contas bancárias em um só lugar:',
          features: [
            { title: 'Contas Correntes', desc: 'Cadastre contas de diferentes bancos' },
            { title: 'Poupança', desc: 'Acompanhe suas economias separadamente' },
            { title: 'Carteiras Digitais', desc: 'PicPay, Mercado Pago, etc.' },
            { title: 'Dinheiro em Espécie', desc: 'Controle o dinheiro físico' },
          ],
          steps: [
            { num: 1, title: 'Acesse Contas', desc: 'No menu lateral, clique em "Contas".' },
            { num: 2, title: 'Adicionar Nova', desc: 'Clique no botão "+ Nova Conta".' },
            { num: 3, title: 'Preencha os dados', desc: 'Nome, tipo, saldo inicial e moeda.' },
            { num: 4, title: 'Salvar', desc: 'Confirme para criar a conta.' },
          ]
        },
        {
          id: 'cartoes',
          title: '6. Cartões de Crédito',
          icon: '💳',
          description: 'Controle completo dos seus cartões de crédito:',
          features: [
            { title: 'Limite e Saldo', desc: 'Acompanhe limite disponível e fatura atual' },
            { title: 'Data de Fechamento', desc: 'Configure a data de fechamento da fatura' },
            { title: 'Data de Vencimento', desc: 'Nunca perca a data de pagamento' },
            { title: 'Múltiplos Cartões', desc: 'Gerencie todos os cartões da família' },
          ],
          tipBox: {
            title: '💡 Dica',
            content: 'Configure alertas para receber notificações antes do vencimento da fatura.'
          }
        },
        {
          id: 'transacoes',
          title: '7. Transações',
          icon: '💰',
          description: 'Registre e categorize todas as suas movimentações financeiras:',
          features: [
            { title: 'Receitas', desc: 'Salários, rendimentos, vendas, etc.' },
            { title: 'Despesas', desc: 'Gastos, compras, pagamentos' },
            { title: 'Transferências', desc: 'Movimentações entre contas' },
            { title: 'Parcelamentos', desc: 'Compras parceladas no cartão' },
          ],
          steps: [
            { num: 1, title: 'Nova Transação', desc: 'Clique no botão "+" ou "Nova Transação".' },
            { num: 2, title: 'Tipo', desc: 'Selecione Receita, Despesa ou Transferência.' },
            { num: 3, title: 'Detalhes', desc: 'Valor, descrição, categoria e data.' },
            { num: 4, title: 'Conta/Cartão', desc: 'Selecione de onde sai ou entra o dinheiro.' },
            { num: 5, title: 'Confirmar', desc: 'Salve a transação.' },
          ]
        },
        {
          id: 'categorias',
          title: '8. Categorias',
          icon: '🏷️',
          description: 'Organize suas finanças com categorias personalizadas:',
          features: [
            { title: 'Categorias Padrão', desc: 'Alimentação, Transporte, Moradia, etc.' },
            { title: 'Categorias Personalizadas', desc: 'Crie categorias específicas para você' },
            { title: 'Cores e Ícones', desc: 'Personalize a aparência' },
            { title: 'Subcategorias', desc: 'Organize em níveis para maior detalhamento' },
          ],
          tipBox: {
            title: '💡 Dica',
            content: 'Mantenha suas categorias organizadas para relatórios mais precisos e úteis.'
          }
        },
        {
          id: 'recorrentes',
          title: '9. Despesas Recorrentes',
          icon: '🔄',
          description: 'Automatize o controle de gastos fixos mensais:',
          features: [
            { title: 'Contas Fixas', desc: 'Aluguel, luz, água, internet' },
            { title: 'Assinaturas', desc: 'Netflix, Spotify, academia' },
            { title: 'Parcelas Fixas', desc: 'Financiamentos, empréstimos' },
            { title: 'Alertas', desc: 'Notificações antes do vencimento' },
          ],
          warningBox: {
            title: '⚠️ Atenção',
            content: 'Revise periodicamente suas despesas recorrentes para identificar assinaturas não utilizadas.'
          }
        },
        {
          id: 'converter',
          title: '10. Converter de Extratos',
          icon: '📄',
          description: 'Importe extratos bancários automaticamente (Premium):',
          features: [
            { title: 'Upload de PDF', desc: 'Envie extratos em formato PDF' },
            { title: 'OCR Inteligente', desc: 'Leitura automática com IA' },
            { title: 'Categorização', desc: 'IA sugere categorias automaticamente' },
            { title: 'Revisão', desc: 'Revise e confirme antes de importar' },
          ],
          steps: [
            { num: 1, title: 'Acesse Converter', desc: 'No menu, clique em "Converter Extratos".' },
            { num: 2, title: 'Upload', desc: 'Arraste ou selecione o arquivo PDF.' },
            { num: 3, title: 'Processamento', desc: 'Aguarde a IA processar o documento.' },
            { num: 4, title: 'Revisar', desc: 'Confira as transações detectadas.' },
            { num: 5, title: 'Importar', desc: 'Confirme para adicionar às suas transações.' },
          ],
          premiumBox: {
            title: '⭐ Recurso Premium',
            content: 'O Converter de Extratos está disponível apenas no plano Premium.'
          }
        },
        {
          id: 'milhas',
          title: '11. Sistema de Milhas',
          icon: '✈️',
          description: 'Acompanhe e otimize suas milhas aéreas (Premium):',
          features: [
            { title: 'Acúmulo Automático', desc: 'Calcule milhas baseado nos gastos do cartão' },
            { title: 'Múltiplos Programas', desc: 'LATAM Pass, Smiles, TudoAzul' },
            { title: 'Metas de Milhas', desc: 'Defina objetivos de acúmulo' },
            { title: 'Promoções', desc: 'Alertas de promoções das companhias' },
          ],
          tipBox: {
            title: '💡 Dica',
            content: 'Configure as regras de acúmulo de cada cartão para cálculos precisos de milhas.'
          }
        },
        {
          id: 'investimentos',
          title: '12. Investimentos',
          icon: '📈',
          description: 'Acompanhe sua carteira de investimentos (Premium):',
          features: [
            { title: 'Renda Fixa', desc: 'CDB, LCI, LCA, Tesouro Direto' },
            { title: 'Renda Variável', desc: 'Ações, FIIs, ETFs' },
            { title: 'Criptomoedas', desc: 'Bitcoin, Ethereum e outras' },
            { title: 'Rentabilidade', desc: 'Acompanhe o desempenho em tempo real' },
          ],
          premiumBox: {
            title: '⭐ Recurso Premium',
            content: 'O módulo de Investimentos está disponível apenas no plano Premium.'
          }
        },
        {
          id: 'ia',
          title: '13. Assistente IA',
          icon: '🤖',
          description: 'Use inteligência artificial para insights financeiros (Premium):',
          features: [
            { title: 'Chat Financeiro', desc: 'Converse sobre suas finanças' },
            { title: 'Análises Automáticas', desc: 'Insights sobre gastos e economia' },
            { title: 'Sugestões', desc: 'Recomendações personalizadas' },
            { title: 'Previsões', desc: 'Projeções baseadas no histórico' },
          ],
          tipBox: {
            title: '💡 Dica',
            content: 'Pergunte ao assistente sobre seus maiores gastos ou como economizar em categorias específicas.'
          }
        },
        {
          id: 'relatorios',
          title: '14. Relatórios',
          icon: '📊',
          description: 'Visualize relatórios detalhados das suas finanças:',
          features: [
            { title: 'Por Categoria', desc: 'Veja gastos agrupados por categoria' },
            { title: 'Por Período', desc: 'Análise mensal, trimestral, anual' },
            { title: 'Comparativos', desc: 'Compare meses e identifique tendências' },
            { title: 'Exportação', desc: 'Exporte para PDF ou planilha' },
          ],
          tipBox: {
            title: '💡 Dica',
            content: 'Use os relatórios mensalmente para identificar oportunidades de economia.'
          }
        },
      ],
      footer: {
        support: 'Suporte',
        email: 'support@couplesfin.com',
        website: 'www.couplesfinancials.com',
        copyright: '© 2024 Couples Financials. Todos os direitos reservados.'
      }
    },
    en: {
      title: 'Complete Tutorial',
      subtitle: 'Couples Financials',
      tagline: 'The ultimate guide to mastering your finances as a couple',
      tableOfContents: 'Table of Contents',
      page: 'Page',
      sections: [
        {
          id: 'introduction',
          title: '1. Introduction',
          icon: '🎯',
          description: 'Couples Financials is a complete financial management platform designed specifically for couples. Our mission is to help you and your partner build a healthy and transparent financial life together.',
          features: [
            { title: 'Shared Management', desc: 'Joint control of couple finances' },
            { title: 'Multiple Currencies', desc: 'Support for BRL, USD, EUR and GBP' },
            { title: 'Artificial Intelligence', desc: 'AI for analysis and automatic categorization' },
            { title: 'Miles System', desc: 'Track and optimize your airline miles' },
          ],
          tipBox: {
            title: '💡 Tip',
            content: 'For the best experience, we recommend that both partners create their accounts and link as a couple in the settings.'
          }
        },
        {
          id: 'plans',
          title: '2. Plans and Pricing',
          icon: '💎',
          description: 'We offer two plans to meet different needs:',
          comparison: {
            headers: ['Feature', 'Essential', 'Premium'],
            rows: [
              ['Financial Dashboard', '✓ Basic', '✓ Complete'],
              ['Accounts and Cards', '✓ Limited', '✓ Unlimited'],
              ['Manual Transactions', '✓', '✓'],
              ['Custom Categories', '✓', '✓'],
              ['Recurring Expenses', '✓', '✓'],
              ['Basic Reports', '✓', '✓'],
              ['Advanced Reports', '✗', '✓'],
              ['Statement Converter (OCR)', '✗', '✓'],
              ['AI Miles System', '✗', '✓'],
              ['Investments', '✗', '✓'],
              ['AI Financial Assistant', '✗', '✓'],
              ['Priority Support', '✗', '✓'],
            ]
          },
          premiumBox: {
            title: '⭐ Unlock Premium',
            content: 'Subscribe to the Premium plan and get access to all advanced features, including AI, miles and investments.'
          }
        },
        {
          id: 'getting-started',
          title: '3. Getting Started',
          icon: '🚀',
          description: 'Follow these steps to set up your account:',
          steps: [
            { num: 1, title: 'Create your account', desc: 'Visit the website and sign up with email and a secure password.' },
            { num: 2, title: 'Set up your profile', desc: 'Add your name, photo and currency preferences.' },
            { num: 3, title: 'Add bank accounts', desc: 'Register your checking, savings and wallet accounts.' },
            { num: 4, title: 'Register cards', desc: 'Add your credit cards with limits and due dates.' },
            { num: 5, title: 'Link your partner', desc: 'In settings, send an invitation for your partner to link.' },
          ],
          warningBox: {
            title: '⚠️ Important',
            content: 'Keep your password secure and never share your credentials. Use strong passwords with letters, numbers and symbols.'
          }
        },
        {
          id: 'dashboard',
          title: '4. Main Dashboard',
          icon: '📊',
          description: 'The Dashboard is your financial command center. Here you can view:',
          features: [
            { title: 'Total Balance', desc: 'Sum of all your accounts in real time' },
            { title: 'Monthly Expenses', desc: 'Total expenses for the current month' },
            { title: 'Monthly Income', desc: 'Total income received' },
            { title: 'Interactive Charts', desc: 'Visualize trends and spending patterns' },
          ],
          tipBox: {
            title: '💡 Tip',
            content: 'Use the filters by period and category for more detailed analysis of your expenses.'
          }
        },
        {
          id: 'accounts',
          title: '5. Account Management',
          icon: '🏦',
          description: 'Manage all your bank accounts in one place:',
          features: [
            { title: 'Checking Accounts', desc: 'Register accounts from different banks' },
            { title: 'Savings', desc: 'Track your savings separately' },
            { title: 'Digital Wallets', desc: 'PayPal, Venmo, etc.' },
            { title: 'Cash', desc: 'Control physical money' },
          ],
          steps: [
            { num: 1, title: 'Access Accounts', desc: 'In the sidebar, click on "Accounts".' },
            { num: 2, title: 'Add New', desc: 'Click the "+ New Account" button.' },
            { num: 3, title: 'Fill in the data', desc: 'Name, type, initial balance and currency.' },
            { num: 4, title: 'Save', desc: 'Confirm to create the account.' },
          ]
        },
        {
          id: 'cards',
          title: '6. Credit Cards',
          icon: '💳',
          description: 'Complete control of your credit cards:',
          features: [
            { title: 'Limit and Balance', desc: 'Track available limit and current bill' },
            { title: 'Closing Date', desc: 'Set the bill closing date' },
            { title: 'Due Date', desc: 'Never miss the payment date' },
            { title: 'Multiple Cards', desc: 'Manage all family cards' },
          ],
          tipBox: {
            title: '💡 Tip',
            content: 'Set up alerts to receive notifications before the bill is due.'
          }
        },
        {
          id: 'transactions',
          title: '7. Transactions',
          icon: '💰',
          description: 'Record and categorize all your financial movements:',
          features: [
            { title: 'Income', desc: 'Salaries, earnings, sales, etc.' },
            { title: 'Expenses', desc: 'Spending, purchases, payments' },
            { title: 'Transfers', desc: 'Movements between accounts' },
            { title: 'Installments', desc: 'Card installment purchases' },
          ],
          steps: [
            { num: 1, title: 'New Transaction', desc: 'Click the "+" or "New Transaction" button.' },
            { num: 2, title: 'Type', desc: 'Select Income, Expense or Transfer.' },
            { num: 3, title: 'Details', desc: 'Amount, description, category and date.' },
            { num: 4, title: 'Account/Card', desc: 'Select where the money comes from or goes to.' },
            { num: 5, title: 'Confirm', desc: 'Save the transaction.' },
          ]
        },
        {
          id: 'categories',
          title: '8. Categories',
          icon: '🏷️',
          description: 'Organize your finances with custom categories:',
          features: [
            { title: 'Default Categories', desc: 'Food, Transport, Housing, etc.' },
            { title: 'Custom Categories', desc: 'Create categories specific to you' },
            { title: 'Colors and Icons', desc: 'Customize the appearance' },
            { title: 'Subcategories', desc: 'Organize in levels for more detail' },
          ],
          tipBox: {
            title: '💡 Tip',
            content: 'Keep your categories organized for more accurate and useful reports.'
          }
        },
        {
          id: 'recurring',
          title: '9. Recurring Expenses',
          icon: '🔄',
          description: 'Automate the control of fixed monthly expenses:',
          features: [
            { title: 'Fixed Bills', desc: 'Rent, electricity, water, internet' },
            { title: 'Subscriptions', desc: 'Netflix, Spotify, gym' },
            { title: 'Fixed Installments', desc: 'Financing, loans' },
            { title: 'Alerts', desc: 'Notifications before due date' },
          ],
          warningBox: {
            title: '⚠️ Attention',
            content: 'Periodically review your recurring expenses to identify unused subscriptions.'
          }
        },
        {
          id: 'converter',
          title: '10. Statement Converter',
          icon: '📄',
          description: 'Import bank statements automatically (Premium):',
          features: [
            { title: 'PDF Upload', desc: 'Send statements in PDF format' },
            { title: 'Smart OCR', desc: 'Automatic reading with AI' },
            { title: 'Categorization', desc: 'AI suggests categories automatically' },
            { title: 'Review', desc: 'Review and confirm before importing' },
          ],
          steps: [
            { num: 1, title: 'Access Converter', desc: 'In the menu, click on "Convert Statements".' },
            { num: 2, title: 'Upload', desc: 'Drag or select the PDF file.' },
            { num: 3, title: 'Processing', desc: 'Wait for the AI to process the document.' },
            { num: 4, title: 'Review', desc: 'Check the detected transactions.' },
            { num: 5, title: 'Import', desc: 'Confirm to add to your transactions.' },
          ],
          premiumBox: {
            title: '⭐ Premium Feature',
            content: 'The Statement Converter is only available on the Premium plan.'
          }
        },
        {
          id: 'miles',
          title: '11. Miles System',
          icon: '✈️',
          description: 'Track and optimize your airline miles (Premium):',
          features: [
            { title: 'Auto Accumulation', desc: 'Calculate miles based on card spending' },
            { title: 'Multiple Programs', desc: 'LATAM Pass, United, Delta, etc.' },
            { title: 'Miles Goals', desc: 'Set accumulation targets' },
            { title: 'Promotions', desc: 'Airline promotion alerts' },
          ],
          tipBox: {
            title: '💡 Tip',
            content: 'Configure the accumulation rules for each card for accurate miles calculations.'
          }
        },
        {
          id: 'investments',
          title: '12. Investments',
          icon: '📈',
          description: 'Track your investment portfolio (Premium):',
          features: [
            { title: 'Fixed Income', desc: 'Bonds, CDs, Treasury' },
            { title: 'Variable Income', desc: 'Stocks, REITs, ETFs' },
            { title: 'Cryptocurrencies', desc: 'Bitcoin, Ethereum and others' },
            { title: 'Returns', desc: 'Track performance in real time' },
          ],
          premiumBox: {
            title: '⭐ Premium Feature',
            content: 'The Investments module is only available on the Premium plan.'
          }
        },
        {
          id: 'ai',
          title: '13. AI Assistant',
          icon: '🤖',
          description: 'Use artificial intelligence for financial insights (Premium):',
          features: [
            { title: 'Financial Chat', desc: 'Talk about your finances' },
            { title: 'Auto Analysis', desc: 'Insights on spending and savings' },
            { title: 'Suggestions', desc: 'Personalized recommendations' },
            { title: 'Forecasts', desc: 'Projections based on history' },
          ],
          tipBox: {
            title: '💡 Tip',
            content: 'Ask the assistant about your biggest expenses or how to save on specific categories.'
          }
        },
        {
          id: 'reports',
          title: '14. Reports',
          icon: '📊',
          description: 'View detailed reports of your finances:',
          features: [
            { title: 'By Category', desc: 'See expenses grouped by category' },
            { title: 'By Period', desc: 'Monthly, quarterly, yearly analysis' },
            { title: 'Comparisons', desc: 'Compare months and identify trends' },
            { title: 'Export', desc: 'Export to PDF or spreadsheet' },
          ],
          tipBox: {
            title: '💡 Tip',
            content: 'Use reports monthly to identify savings opportunities.'
          }
        },
      ],
      footer: {
        support: 'Support',
        email: 'support@couplesfin.com',
        website: 'www.couplesfinancials.com',
        copyright: '© 2024 Couples Financials. All rights reserved.'
      }
    },
    es: {
      title: 'Tutorial Completo',
      subtitle: 'Couples Financials',
      tagline: 'La guía definitiva para dominar tus finanzas en pareja',
      tableOfContents: 'Índice',
      page: 'Página',
      sections: [
        {
          id: 'introduccion',
          title: '1. Introducción',
          icon: '🎯',
          description: 'Couples Financials es una plataforma completa de gestión financiera diseñada específicamente para parejas. Nuestra misión es ayudarte a ti y a tu pareja a construir una vida financiera saludable y transparente juntos.',
          features: [
            { title: 'Gestión Compartida', desc: 'Control conjunto de las finanzas de la pareja' },
            { title: 'Múltiples Monedas', desc: 'Soporte para BRL, USD, EUR y GBP' },
            { title: 'Inteligencia Artificial', desc: 'IA para análisis y categorización automática' },
            { title: 'Sistema de Millas', desc: 'Rastrea y optimiza tus millas aéreas' },
          ],
          tipBox: {
            title: '💡 Consejo',
            content: 'Para una mejor experiencia, recomendamos que ambos miembros de la pareja creen sus cuentas y se vinculen en la configuración.'
          }
        },
        {
          id: 'planes',
          title: '2. Planes y Precios',
          icon: '💎',
          description: 'Ofrecemos dos planes para satisfacer diferentes necesidades:',
          comparison: {
            headers: ['Funcionalidad', 'Essential', 'Premium'],
            rows: [
              ['Panel Financiero', '✓ Básico', '✓ Completo'],
              ['Cuentas y Tarjetas', '✓ Limitado', '✓ Ilimitado'],
              ['Transacciones Manuales', '✓', '✓'],
              ['Categorías Personalizadas', '✓', '✓'],
              ['Gastos Recurrentes', '✓', '✓'],
              ['Informes Básicos', '✓', '✓'],
              ['Informes Avanzados', '✗', '✓'],
              ['Conversor de Extractos (OCR)', '✗', '✓'],
              ['Sistema de Millas con IA', '✗', '✓'],
              ['Inversiones', '✗', '✓'],
              ['Asistente IA Financiero', '✗', '✓'],
              ['Soporte Prioritario', '✗', '✓'],
            ]
          },
          premiumBox: {
            title: '⭐ Desbloquea Premium',
            content: 'Suscríbete al plan Premium y obtén acceso a todas las funciones avanzadas, incluyendo IA, millas e inversiones.'
          }
        },
        {
          id: 'primeros-pasos',
          title: '3. Primeros Pasos',
          icon: '🚀',
          description: 'Sigue estos pasos para configurar tu cuenta:',
          steps: [
            { num: 1, title: 'Crea tu cuenta', desc: 'Visita el sitio y regístrate con email y contraseña segura.' },
            { num: 2, title: 'Configura tu perfil', desc: 'Agrega tu nombre, foto y preferencias de moneda.' },
            { num: 3, title: 'Agrega cuentas bancarias', desc: 'Registra tus cuentas corrientes, de ahorro y billeteras.' },
            { num: 4, title: 'Registra tarjetas', desc: 'Agrega tus tarjetas de crédito con límites y fechas de vencimiento.' },
            { num: 5, title: 'Vincula a tu pareja', desc: 'En configuración, envía una invitación para que tu pareja se vincule.' },
          ],
          warningBox: {
            title: '⚠️ Importante',
            content: 'Mantén tu contraseña segura y nunca compartas tus credenciales. Usa contraseñas fuertes con letras, números y símbolos.'
          }
        },
        {
          id: 'dashboard',
          title: '4. Panel Principal',
          icon: '📊',
          description: 'El Panel es tu centro de comando financiero. Aquí puedes ver:',
          features: [
            { title: 'Saldo Total', desc: 'Suma de todas tus cuentas en tiempo real' },
            { title: 'Gastos del Mes', desc: 'Total de gastos del mes actual' },
            { title: 'Ingresos del Mes', desc: 'Total de ingresos recibidos' },
            { title: 'Gráficos Interactivos', desc: 'Visualiza tendencias y patrones de gastos' },
          ],
          tipBox: {
            title: '💡 Consejo',
            content: 'Usa los filtros por período y categoría para análisis más detallados de tus gastos.'
          }
        },
        {
          id: 'cuentas',
          title: '5. Gestión de Cuentas',
          icon: '🏦',
          description: 'Gestiona todas tus cuentas bancarias en un solo lugar:',
          features: [
            { title: 'Cuentas Corrientes', desc: 'Registra cuentas de diferentes bancos' },
            { title: 'Ahorro', desc: 'Rastrea tus ahorros por separado' },
            { title: 'Billeteras Digitales', desc: 'PayPal, Mercado Pago, etc.' },
            { title: 'Efectivo', desc: 'Controla el dinero físico' },
          ],
          steps: [
            { num: 1, title: 'Accede a Cuentas', desc: 'En el menú lateral, haz clic en "Cuentas".' },
            { num: 2, title: 'Agregar Nueva', desc: 'Haz clic en el botón "+ Nueva Cuenta".' },
            { num: 3, title: 'Completa los datos', desc: 'Nombre, tipo, saldo inicial y moneda.' },
            { num: 4, title: 'Guardar', desc: 'Confirma para crear la cuenta.' },
          ]
        },
        {
          id: 'tarjetas',
          title: '6. Tarjetas de Crédito',
          icon: '💳',
          description: 'Control completo de tus tarjetas de crédito:',
          features: [
            { title: 'Límite y Saldo', desc: 'Rastrea límite disponible y factura actual' },
            { title: 'Fecha de Cierre', desc: 'Configura la fecha de cierre de la factura' },
            { title: 'Fecha de Vencimiento', desc: 'Nunca pierdas la fecha de pago' },
            { title: 'Múltiples Tarjetas', desc: 'Gestiona todas las tarjetas de la familia' },
          ],
          tipBox: {
            title: '💡 Consejo',
            content: 'Configura alertas para recibir notificaciones antes del vencimiento de la factura.'
          }
        },
        {
          id: 'transacciones',
          title: '7. Transacciones',
          icon: '💰',
          description: 'Registra y categoriza todos tus movimientos financieros:',
          features: [
            { title: 'Ingresos', desc: 'Salarios, ganancias, ventas, etc.' },
            { title: 'Gastos', desc: 'Compras, pagos, consumos' },
            { title: 'Transferencias', desc: 'Movimientos entre cuentas' },
            { title: 'Cuotas', desc: 'Compras en cuotas con tarjeta' },
          ],
          steps: [
            { num: 1, title: 'Nueva Transacción', desc: 'Haz clic en el botón "+" o "Nueva Transacción".' },
            { num: 2, title: 'Tipo', desc: 'Selecciona Ingreso, Gasto o Transferencia.' },
            { num: 3, title: 'Detalles', desc: 'Monto, descripción, categoría y fecha.' },
            { num: 4, title: 'Cuenta/Tarjeta', desc: 'Selecciona de dónde sale o entra el dinero.' },
            { num: 5, title: 'Confirmar', desc: 'Guarda la transacción.' },
          ]
        },
        {
          id: 'categorias',
          title: '8. Categorías',
          icon: '🏷️',
          description: 'Organiza tus finanzas con categorías personalizadas:',
          features: [
            { title: 'Categorías Predeterminadas', desc: 'Alimentación, Transporte, Vivienda, etc.' },
            { title: 'Categorías Personalizadas', desc: 'Crea categorías específicas para ti' },
            { title: 'Colores e Iconos', desc: 'Personaliza la apariencia' },
            { title: 'Subcategorías', desc: 'Organiza en niveles para más detalle' },
          ],
          tipBox: {
            title: '💡 Consejo',
            content: 'Mantén tus categorías organizadas para informes más precisos y útiles.'
          }
        },
        {
          id: 'recurrentes',
          title: '9. Gastos Recurrentes',
          icon: '🔄',
          description: 'Automatiza el control de gastos fijos mensuales:',
          features: [
            { title: 'Facturas Fijas', desc: 'Alquiler, luz, agua, internet' },
            { title: 'Suscripciones', desc: 'Netflix, Spotify, gimnasio' },
            { title: 'Cuotas Fijas', desc: 'Financiamientos, préstamos' },
            { title: 'Alertas', desc: 'Notificaciones antes del vencimiento' },
          ],
          warningBox: {
            title: '⚠️ Atención',
            content: 'Revisa periódicamente tus gastos recurrentes para identificar suscripciones no utilizadas.'
          }
        },
        {
          id: 'conversor',
          title: '10. Conversor de Extractos',
          icon: '📄',
          description: 'Importa extractos bancarios automáticamente (Premium):',
          features: [
            { title: 'Carga de PDF', desc: 'Envía extractos en formato PDF' },
            { title: 'OCR Inteligente', desc: 'Lectura automática con IA' },
            { title: 'Categorización', desc: 'La IA sugiere categorías automáticamente' },
            { title: 'Revisión', desc: 'Revisa y confirma antes de importar' },
          ],
          steps: [
            { num: 1, title: 'Accede al Conversor', desc: 'En el menú, haz clic en "Convertir Extractos".' },
            { num: 2, title: 'Cargar', desc: 'Arrastra o selecciona el archivo PDF.' },
            { num: 3, title: 'Procesamiento', desc: 'Espera a que la IA procese el documento.' },
            { num: 4, title: 'Revisar', desc: 'Verifica las transacciones detectadas.' },
            { num: 5, title: 'Importar', desc: 'Confirma para agregar a tus transacciones.' },
          ],
          premiumBox: {
            title: '⭐ Función Premium',
            content: 'El Conversor de Extractos solo está disponible en el plan Premium.'
          }
        },
        {
          id: 'millas',
          title: '11. Sistema de Millas',
          icon: '✈️',
          description: 'Rastrea y optimiza tus millas aéreas (Premium):',
          features: [
            { title: 'Acumulación Automática', desc: 'Calcula millas basado en gastos de tarjeta' },
            { title: 'Múltiples Programas', desc: 'LATAM Pass, Smiles, Avianca' },
            { title: 'Metas de Millas', desc: 'Define objetivos de acumulación' },
            { title: 'Promociones', desc: 'Alertas de promociones de aerolíneas' },
          ],
          tipBox: {
            title: '💡 Consejo',
            content: 'Configura las reglas de acumulación de cada tarjeta para cálculos precisos de millas.'
          }
        },
        {
          id: 'inversiones',
          title: '12. Inversiones',
          icon: '📈',
          description: 'Rastrea tu cartera de inversiones (Premium):',
          features: [
            { title: 'Renta Fija', desc: 'Bonos, CDs, Tesoro' },
            { title: 'Renta Variable', desc: 'Acciones, REITs, ETFs' },
            { title: 'Criptomonedas', desc: 'Bitcoin, Ethereum y otras' },
            { title: 'Rentabilidad', desc: 'Rastrea el rendimiento en tiempo real' },
          ],
          premiumBox: {
            title: '⭐ Función Premium',
            content: 'El módulo de Inversiones solo está disponible en el plan Premium.'
          }
        },
        {
          id: 'ia',
          title: '13. Asistente IA',
          icon: '🤖',
          description: 'Usa inteligencia artificial para insights financieros (Premium):',
          features: [
            { title: 'Chat Financiero', desc: 'Conversa sobre tus finanzas' },
            { title: 'Análisis Automático', desc: 'Insights sobre gastos y ahorro' },
            { title: 'Sugerencias', desc: 'Recomendaciones personalizadas' },
            { title: 'Previsiones', desc: 'Proyecciones basadas en historial' },
          ],
          tipBox: {
            title: '💡 Consejo',
            content: 'Pregunta al asistente sobre tus mayores gastos o cómo ahorrar en categorías específicas.'
          }
        },
        {
          id: 'informes',
          title: '14. Informes',
          icon: '📊',
          description: 'Visualiza informes detallados de tus finanzas:',
          features: [
            { title: 'Por Categoría', desc: 'Ve gastos agrupados por categoría' },
            { title: 'Por Período', desc: 'Análisis mensual, trimestral, anual' },
            { title: 'Comparativos', desc: 'Compara meses e identifica tendencias' },
            { title: 'Exportación', desc: 'Exporta a PDF o hoja de cálculo' },
          ],
          tipBox: {
            title: '💡 Consejo',
            content: 'Usa los informes mensualmente para identificar oportunidades de ahorro.'
          }
        },
      ],
      footer: {
        support: 'Soporte',
        email: 'support@couplesfin.com',
        website: 'www.couplesfinancials.com',
        copyright: '© 2024 Couples Financials. Todos los derechos reservados.'
      }
    }
  };

  return content[language];
};

// Helper function to sanitize text (remove emojis for PDF)
const sanitizeForPDF = (text: string): string => {
  return text
    .replace(/[\u{1F300}-\u{1FAFF}\u{1F900}-\u{1F9FF}\u{1F600}-\u{1F64F}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '')
    .replace(/[^\x00-\xFF]/g, '')
    .trim();
};

// Draw rounded rectangle
const drawRoundedRect = (
  pdf: jsPDF,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
  fillColor?: [number, number, number],
  borderColor?: [number, number, number]
) => {
  if (fillColor) {
    pdf.setFillColor(fillColor[0], fillColor[1], fillColor[2]);
  }
  if (borderColor) {
    pdf.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
  }
  
  pdf.roundedRect(x, y, width, height, radius, radius, fillColor ? 'F' : 'S');
};

// Draw gradient header (simulated with solid color)
const drawHeader = (pdf: jsPDF, title: string, subtitle: string, tagline: string) => {
  const pageWidth = pdf.internal.pageSize.getWidth();
  
  // Header background
  pdf.setFillColor(colors.primary[0], colors.primary[1], colors.primary[2]);
  pdf.rect(0, 0, pageWidth, 60, 'F');
  
  // Subtitle
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'normal');
  pdf.text(subtitle, pageWidth / 2, 20, { align: 'center' });
  
  // Main title
  pdf.setFontSize(28);
  pdf.setFont('helvetica', 'bold');
  pdf.text(title, pageWidth / 2, 35, { align: 'center' });
  
  // Tagline
  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'normal');
  pdf.text(sanitizeForPDF(tagline), pageWidth / 2, 50, { align: 'center' });
};

// Draw section header
const drawSectionHeader = (pdf: jsPDF, title: string, y: number): number => {
  const pageWidth = pdf.internal.pageSize.getWidth();
  const margin = 15;
  
  // Background bar
  pdf.setFillColor(colors.primary[0], colors.primary[1], colors.primary[2]);
  pdf.rect(margin, y, pageWidth - 2 * margin, 12, 'F');
  
  // Title text
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.text(sanitizeForPDF(title), margin + 5, y + 8);
  
  return y + 18;
};

// Draw feature card
const drawFeatureCard = (
  pdf: jsPDF, 
  title: string, 
  description: string, 
  x: number, 
  y: number, 
  width: number
): number => {
  const height = 28;
  
  // Card background
  drawRoundedRect(pdf, x, y, width, height, 3, colors.bgCard);
  
  // Left accent bar
  pdf.setFillColor(colors.primary[0], colors.primary[1], colors.primary[2]);
  pdf.rect(x, y, 3, height, 'F');
  
  // Title
  pdf.setTextColor(colors.textDark[0], colors.textDark[1], colors.textDark[2]);
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'bold');
  pdf.text(sanitizeForPDF(title), x + 8, y + 10);
  
  // Description
  pdf.setTextColor(colors.textMuted[0], colors.textMuted[1], colors.textMuted[2]);
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'normal');
  const lines = pdf.splitTextToSize(sanitizeForPDF(description), width - 12);
  pdf.text(lines, x + 8, y + 18);
  
  return y + height + 5;
};

// Draw tip box
const drawTipBox = (pdf: jsPDF, title: string, content: string, x: number, y: number, width: number): number => {
  const lines = pdf.splitTextToSize(sanitizeForPDF(content), width - 20);
  const height = 20 + lines.length * 5;
  
  // Background
  pdf.setFillColor(220, 252, 231); // Light green
  drawRoundedRect(pdf, x, y, width, height, 3, [220, 252, 231]);
  
  // Left accent
  pdf.setFillColor(colors.success[0], colors.success[1], colors.success[2]);
  pdf.rect(x, y, 4, height, 'F');
  
  // Title
  pdf.setTextColor(colors.success[0], colors.success[1], colors.success[2]);
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'bold');
  pdf.text(sanitizeForPDF(title), x + 10, y + 10);
  
  // Content
  pdf.setTextColor(colors.textDark[0], colors.textDark[1], colors.textDark[2]);
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'normal');
  pdf.text(lines, x + 10, y + 18);
  
  return y + height + 8;
};

// Draw warning box
const drawWarningBox = (pdf: jsPDF, title: string, content: string, x: number, y: number, width: number): number => {
  const lines = pdf.splitTextToSize(sanitizeForPDF(content), width - 20);
  const height = 20 + lines.length * 5;
  
  // Background
  pdf.setFillColor(254, 243, 199); // Light amber
  drawRoundedRect(pdf, x, y, width, height, 3, [254, 243, 199]);
  
  // Left accent
  pdf.setFillColor(colors.warning[0], colors.warning[1], colors.warning[2]);
  pdf.rect(x, y, 4, height, 'F');
  
  // Title
  pdf.setTextColor(180, 83, 9); // Amber dark
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'bold');
  pdf.text(sanitizeForPDF(title), x + 10, y + 10);
  
  // Content
  pdf.setTextColor(colors.textDark[0], colors.textDark[1], colors.textDark[2]);
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'normal');
  pdf.text(lines, x + 10, y + 18);
  
  return y + height + 8;
};

// Draw premium box
const drawPremiumBox = (pdf: jsPDF, title: string, content: string, x: number, y: number, width: number): number => {
  const lines = pdf.splitTextToSize(sanitizeForPDF(content), width - 20);
  const height = 20 + lines.length * 5;
  
  // Background
  pdf.setFillColor(237, 233, 254); // Light purple
  drawRoundedRect(pdf, x, y, width, height, 3, [237, 233, 254]);
  
  // Left accent
  pdf.setFillColor(colors.premium[0], colors.premium[1], colors.premium[2]);
  pdf.rect(x, y, 4, height, 'F');
  
  // Title
  pdf.setTextColor(colors.premium[0], colors.premium[1], colors.premium[2]);
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'bold');
  pdf.text(sanitizeForPDF(title), x + 10, y + 10);
  
  // Content
  pdf.setTextColor(colors.textDark[0], colors.textDark[1], colors.textDark[2]);
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'normal');
  pdf.text(lines, x + 10, y + 18);
  
  return y + height + 8;
};

// Draw numbered step
const drawStep = (pdf: jsPDF, num: number, title: string, desc: string, x: number, y: number, width: number): number => {
  const circleRadius = 10;
  
  // Number circle
  pdf.setFillColor(colors.primary[0], colors.primary[1], colors.primary[2]);
  pdf.circle(x + circleRadius, y + circleRadius, circleRadius, 'F');
  
  // Number
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'bold');
  pdf.text(num.toString(), x + circleRadius, y + circleRadius + 4, { align: 'center' });
  
  // Title
  pdf.setTextColor(colors.textDark[0], colors.textDark[1], colors.textDark[2]);
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'bold');
  pdf.text(sanitizeForPDF(title), x + 28, y + 8);
  
  // Description
  pdf.setTextColor(colors.textMuted[0], colors.textMuted[1], colors.textMuted[2]);
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'normal');
  const lines = pdf.splitTextToSize(sanitizeForPDF(desc), width - 35);
  pdf.text(lines, x + 28, y + 16);
  
  return y + Math.max(25, 16 + lines.length * 5);
};

// Draw page footer
const drawFooter = (pdf: jsPDF, pageNum: number, totalPages: number, pageLabel: string) => {
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  
  pdf.setTextColor(colors.textMuted[0], colors.textMuted[1], colors.textMuted[2]);
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'normal');
  
  // Logo/brand
  pdf.text('Couples Financials', 15, pageHeight - 10);
  
  // Page number
  pdf.text(`${pageLabel} ${pageNum} / ${totalPages}`, pageWidth - 15, pageHeight - 10, { align: 'right' });
};

// Check if we need a new page
const checkNewPage = (pdf: jsPDF, currentY: number, neededHeight: number, margin: number): number => {
  const pageHeight = pdf.internal.pageSize.getHeight();
  if (currentY + neededHeight > pageHeight - margin - 20) {
    pdf.addPage();
    return margin;
  }
  return currentY;
};

export const downloadTutorialPDF = async (language: Language = 'pt') => {
  try {
    const content = getTutorialContent(language);
    
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });
    
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 15;
    const contentWidth = pageWidth - 2 * margin;
    
    // Page 1: Cover
    drawHeader(pdf, content.title, content.subtitle, content.tagline);
    
    let currentY = 75;
    
    // Table of Contents
    pdf.setTextColor(colors.textDark[0], colors.textDark[1], colors.textDark[2]);
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text(content.tableOfContents, margin, currentY);
    currentY += 10;
    
    // TOC items
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    
    content.sections.forEach((section, index) => {
      const col = index < 7 ? 0 : 1;
      const row = index < 7 ? index : index - 7;
      const x = margin + col * (contentWidth / 2);
      const y = currentY + row * 8;
      
      pdf.setTextColor(colors.textMuted[0], colors.textMuted[1], colors.textMuted[2]);
      pdf.text(sanitizeForPDF(section.title), x, y);
    });
    
    currentY += 65;
    
    // Quick intro on first page
    pdf.setFillColor(colors.bgCard[0], colors.bgCard[1], colors.bgCard[2]);
    drawRoundedRect(pdf, margin, currentY, contentWidth, 40, 5, colors.bgCard);
    
    pdf.setTextColor(colors.textDark[0], colors.textDark[1], colors.textDark[2]);
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'normal');
    const introLines = pdf.splitTextToSize(sanitizeForPDF(content.sections[0].description), contentWidth - 20);
    pdf.text(introLines, margin + 10, currentY + 12);
    
    // Add footer to first page
    drawFooter(pdf, 1, content.sections.length + 1, content.page);
    
    // Generate each section
    content.sections.forEach((section, sectionIndex) => {
      pdf.addPage();
      currentY = margin;
      
      // Section header
      currentY = drawSectionHeader(pdf, section.title, currentY);
      currentY += 5;
      
      // Description
      pdf.setTextColor(colors.textDark[0], colors.textDark[1], colors.textDark[2]);
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      const descLines = pdf.splitTextToSize(sanitizeForPDF(section.description), contentWidth);
      pdf.text(descLines, margin, currentY);
      currentY += descLines.length * 5 + 8;
      
      // Feature cards (2 columns)
      if (section.features && section.features.length > 0) {
        const cardWidth = (contentWidth - 5) / 2;
        
        for (let i = 0; i < section.features.length; i += 2) {
          currentY = checkNewPage(pdf, currentY, 35, margin);
          
          // Left card
          const feature1 = section.features[i];
          drawFeatureCard(pdf, feature1.title, feature1.desc, margin, currentY, cardWidth);
          
          // Right card (if exists)
          if (i + 1 < section.features.length) {
            const feature2 = section.features[i + 1];
            drawFeatureCard(pdf, feature2.title, feature2.desc, margin + cardWidth + 5, currentY, cardWidth);
          }
          
          currentY += 35;
        }
      }
      
      // Steps
      if (section.steps && section.steps.length > 0) {
        currentY += 5;
        section.steps.forEach((step) => {
          currentY = checkNewPage(pdf, currentY, 30, margin);
          currentY = drawStep(pdf, step.num, step.title, step.desc, margin, currentY, contentWidth);
        });
      }
      
      // Comparison table
      if (section.comparison) {
        currentY = checkNewPage(pdf, currentY, 80, margin);
        currentY += 5;
        
        autoTable(pdf, {
          startY: currentY,
          head: [section.comparison.headers],
          body: section.comparison.rows,
          margin: { left: margin, right: margin },
          headStyles: {
            fillColor: [colors.primary[0], colors.primary[1], colors.primary[2]],
            textColor: 255,
            fontSize: 9,
            fontStyle: 'bold',
          },
          bodyStyles: {
            fontSize: 8,
            textColor: [colors.textDark[0], colors.textDark[1], colors.textDark[2]],
          },
          alternateRowStyles: {
            fillColor: [colors.bgCard[0], colors.bgCard[1], colors.bgCard[2]],
          },
          columnStyles: {
            0: { cellWidth: 'auto' },
            1: { halign: 'center', cellWidth: 30 },
            2: { halign: 'center', cellWidth: 30 },
          },
          styles: {
            cellPadding: 3,
          },
        });
        
        currentY = (pdf as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;
      }
      
      // Tip box
      if (section.tipBox) {
        currentY = checkNewPage(pdf, currentY, 35, margin);
        currentY = drawTipBox(pdf, section.tipBox.title, section.tipBox.content, margin, currentY, contentWidth);
      }
      
      // Warning box
      if (section.warningBox) {
        currentY = checkNewPage(pdf, currentY, 35, margin);
        currentY = drawWarningBox(pdf, section.warningBox.title, section.warningBox.content, margin, currentY, contentWidth);
      }
      
      // Premium box
      if (section.premiumBox) {
        currentY = checkNewPage(pdf, currentY, 35, margin);
        currentY = drawPremiumBox(pdf, section.premiumBox.title, section.premiumBox.content, margin, currentY, contentWidth);
      }
      
      // Footer
      drawFooter(pdf, sectionIndex + 2, content.sections.length + 1, content.page);
    });
    
    // Final page with contact info
    pdf.addPage();
    currentY = pageHeight / 2 - 30;
    
    // Logo area
    pdf.setFillColor(colors.primary[0], colors.primary[1], colors.primary[2]);
    pdf.circle(pageWidth / 2, currentY, 20, 'F');
    
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(24);
    pdf.setFont('helvetica', 'bold');
    pdf.text('CF', pageWidth / 2, currentY + 8, { align: 'center' });
    
    currentY += 35;
    
    // Thank you message
    pdf.setTextColor(colors.textDark[0], colors.textDark[1], colors.textDark[2]);
    pdf.setFontSize(18);
    pdf.setFont('helvetica', 'bold');
    pdf.text(content.subtitle, pageWidth / 2, currentY, { align: 'center' });
    
    currentY += 15;
    
    // Contact info
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(colors.textMuted[0], colors.textMuted[1], colors.textMuted[2]);
    pdf.text(content.footer.support + ': ' + content.footer.email, pageWidth / 2, currentY, { align: 'center' });
    currentY += 8;
    pdf.text(content.footer.website, pageWidth / 2, currentY, { align: 'center' });
    currentY += 15;
    
    pdf.setFontSize(9);
    pdf.text(content.footer.copyright, pageWidth / 2, currentY, { align: 'center' });
    
    // Download
    const fileName = `couples-financials-tutorial-${language}.pdf`;
    pdf.save(fileName);
    
  } catch (error) {
    console.error('Error generating PDF:', error);
    openTutorialHTML(language);
  }
};

export const openTutorialHTML = (language: Language = 'pt') => {
  const hostname = window.location.hostname;
  const isProd = hostname === 'couplesfinancials.com' || hostname === 'www.couplesfinancials.com' || 
                 hostname === 'couplesfin.com' || hostname === 'www.couplesfin.com';
  const baseUrl = isProd ? window.location.origin : 'https://couplesfinancials.com';
  const cacheBust = `?v=${Date.now()}`;
  const tutorialUrl = `${baseUrl}/tutorial-couples-financials-${language}.html${cacheBust}`;
  
  try {
    const newTab = window.open(tutorialUrl, '_blank');
    if (!newTab) {
      const fallbackUrl = `${baseUrl}/tutorial-couples-financials.html`;
      window.open(fallbackUrl, '_blank');
    }
  } catch (error) {
    console.error('[Tutorial] Error opening tutorial:', error);
    const fallbackUrl = `${baseUrl}/tutorial-couples-financials.html`;
    window.open(fallbackUrl, '_blank');
  }
};
