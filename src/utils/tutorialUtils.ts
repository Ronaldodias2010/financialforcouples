import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

type Language = 'pt' | 'en' | 'es';

// Color palette matching the theme
const colors = {
  primary: [102, 126, 234] as [number, number, number],
  secondary: [118, 75, 162] as [number, number, number],
  success: [16, 185, 129] as [number, number, number],
  warning: [245, 158, 11] as [number, number, number],
  premium: [139, 92, 246] as [number, number, number],
  danger: [239, 68, 68] as [number, number, number],
  bgLight: [248, 250, 252] as [number, number, number],
  bgCard: [241, 245, 249] as [number, number, number],
  textDark: [30, 41, 59] as [number, number, number],
  textMuted: [100, 116, 139] as [number, number, number],
  border: [226, 232, 240] as [number, number, number],
  white: [255, 255, 255] as [number, number, number],
};

interface SubSection {
  title: string;
  content?: string;
  steps?: { num: number; title: string; desc: string }[];
  features?: { title: string; desc: string }[];
  bullets?: string[];
  tipBox?: { title: string; content: string };
  warningBox?: { title: string; content: string };
  premiumBox?: { title: string; content: string };
}

interface Section {
  id: string;
  title: string;
  icon: string;
  intro: string;
  subSections: SubSection[];
  comparison?: {
    headers: string[];
    rows: string[][];
  };
}

interface TutorialContent {
  title: string;
  subtitle: string;
  tagline: string;
  tableOfContents: string;
  page: string;
  sections: Section[];
  footer: {
    support: string;
    email: string;
    website: string;
    copyright: string;
  };
}

// Complete tutorial content for Portuguese
const getTutorialContentPT = (): TutorialContent => ({
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
      intro: 'O Couples Financials é uma plataforma completa de gestão financeira projetada especialmente para casais que desejam organizar suas finanças de forma colaborativa e inteligente.',
      subSections: [
        {
          title: 'Recursos Principais',
          features: [
            { title: 'Gestão Inteligente', desc: 'Controle completo de receitas, despesas, investimentos e metas financeiras com ferramentas intuitivas e IA integrada.' },
            { title: 'Colaboração em Casal', desc: 'Funcionalidades específicas para casais compartilharem e organizarem suas finanças conjuntamente com transparência total.' },
            { title: 'Análises Detalhadas', desc: 'Relatórios visuais avançados e insights personalizados para tomar decisões financeiras mais informadas.' },
            { title: 'Sistema de Milhas', desc: 'Controle completo de programas de milhas e pontos com metas personalizadas e aproveitamento de promoções.' },
          ]
        },
        {
          title: 'O que Torna Nossa Plataforma Única',
          bullets: [
            'Interface Intuitiva: Design pensado para facilitar o uso diário',
            'Segurança Avançada: Criptografia de ponta e proteção de dados',
            'Suporte Multi-moeda: Gerencie finanças em diferentes moedas (BRL, USD, EUR, GBP)',
            'Sincronização em Tempo Real: Acesso simultâneo e atualizações instantâneas',
            'Recursos Premium: IA financeira, análises preditivas e suporte prioritário',
          ]
        },
        {
          title: 'Comparativo de Planos',
          content: 'Conheça as diferenças entre os planos disponíveis:'
        },
        {
          title: '',
          premiumBox: {
            title: 'Desbloqueie Todo o Potencial',
            content: 'O plano Premium oferece acesso completo a todas as funcionalidades, incluindo o novo Converter de Extratos, IA financeira avançada, integração com WhatsApp e suporte prioritário.'
          }
        },
        {
          title: '',
          tipBox: {
            title: 'Como Usar Este Tutorial',
            content: 'Este tutorial foi desenvolvido para ser usado tanto como referência rápida quanto como guia passo a passo. Recomendamos ler os primeiros capítulos completamente antes de começar a usar a plataforma. Para usuários experientes, use o índice para encontrar seções específicas.'
          }
        }
      ],
      comparison: {
        headers: ['Funcionalidade', 'Essential', 'Premium'],
        rows: [
          ['Dashboard Financeiro', 'Básico', 'Completo'],
          ['Contas e Cartões', 'Sim', 'Sim'],
          ['Transações Manuais', 'Sim', 'Sim'],
          ['Relatórios Básicos', 'Sim', 'Sim'],
          ['Gestão de Casal', 'Básico', 'Completo'],
          ['Converter de Extratos', 'Não', 'Sim'],
          ['WhatsApp / Comandos de Voz', 'Não', 'Sim'],
          ['Sistema de Milhas com IA', 'Não', 'Sim'],
          ['Planejamento com IA', 'Não', 'Sim'],
          ['Sugestões de Investimento', 'Não', 'Sim'],
          ['Metas Personalizadas', 'Não', 'Sim'],
          ['Análises Avançadas', 'Não', 'Sim'],
          ['Suporte Prioritário', 'Não', 'Sim'],
        ]
      }
    },
    {
      id: 'primeiros-passos',
      title: '2. Primeiros Passos',
      icon: '🚀',
      intro: 'Siga os passos abaixo para configurar sua conta e começar a usar a plataforma.',
      subSections: [
        {
          title: 'Processo de Registro',
          steps: [
            { num: 1, title: 'Criando sua Conta', desc: 'Acesse a plataforma e crie sua conta utilizando email e senha segura. O sistema automaticamente criará seu perfil personalizado e categorias padrão adaptadas ao contexto brasileiro.' },
            { num: 2, title: 'Verificação de Email', desc: 'Confirme seu email através do link enviado. Este passo é essencial para segurança e recuperação de conta.' },
            { num: 3, title: 'Configuração Inicial', desc: 'Defina sua moeda preferida (Real brasileiro por padrão), fuso horário, idioma e informações básicas do perfil. Estas configurações podem ser alteradas posteriormente.' },
          ]
        },
        {
          title: 'Explorando a Interface',
          features: [
            { title: 'Menu Principal', desc: 'Navegação lateral com acesso rápido a todas as funcionalidades principais da plataforma.' },
            { title: 'Dashboard Central', desc: 'Visão geral das suas finanças com gráficos, saldos atualizados e resumos mensais.' },
            { title: 'Ações Rápidas', desc: 'Botões flutuantes para adicionar transações, fazer transferências e consultas rápidas.' },
            { title: 'Central de Notificações', desc: 'Alertas inteligentes sobre vencimentos, metas e oportunidades financeiras.' },
          ]
        },
        {
          title: '',
          tipBox: {
            title: 'Como Iniciar',
            content: 'Para INICIAR a utilização da nossa plataforma: Na tela inicial desça até "Contas" e adicione suas Contas Correntes, na sequência adicione seus Cartões de Crédito. A partir deste ponto você já consegue utilizar nosso sistema de WhatsApp, pois ele já possui informações necessárias para iniciar as interações. Quanto mais informações você adicionar na nossa plataforma mais ela poderá lhe auxiliar.'
          }
        },
        {
          title: '',
          warningBox: {
            title: 'Segurança e Privacidade',
            content: 'Mantenha suas informações de login seguras e use uma senha forte com pelo menos 8 caracteres, incluindo números e símbolos. O sistema conta com criptografia AES-256 para proteger todos os seus dados financeiros. Nunca compartilhe suas credenciais com terceiros.'
          }
        },
        {
          title: '',
          premiumBox: {
            title: 'Recursos Premium Disponíveis',
            content: 'Usuários Premium têm acesso a funcionalidades exclusivas como IA financeira, análises preditivas, relatórios avançados, suporte prioritário e integração com WhatsApp para consultas por voz.'
          }
        }
      ]
    },
    {
      id: 'dashboard',
      title: '3. Dashboard Financeiro',
      icon: '📊',
      intro: 'O dashboard é o centro de controle das suas finanças, apresentando informações essenciais de forma visual e intuitiva.',
      subSections: [
        {
          title: 'Visão Geral Financeira',
          features: [
            { title: 'Resumo de Saldos', desc: 'Visualização em tempo real dos saldos de todas as contas, cartões e investimentos, com totais consolidados.' },
            { title: 'Gráficos Interativos', desc: 'Gráficos de receitas vs despesas, evolução patrimonial e distribuição por categorias com filtros personalizáveis.' },
            { title: 'Agenda Financeira', desc: 'Calendário com vencimentos de cartões, parcelas e compromissos financeiros futuros.' },
            { title: 'Metas e Objetivos', desc: 'Progresso visual das suas metas de economia, investimento e redução de gastos por categoria.' },
          ]
        },
        {
          title: 'Widgets Personalizáveis',
          steps: [
            { num: 1, title: 'Configuração de Widgets', desc: 'Personalize seu dashboard escolhendo quais informações deseja ver primeiro. Arraste e solte widgets para reorganizar.' },
            { num: 2, title: 'Filtros Inteligentes', desc: 'Configure filtros por período, categoria, tipo de transação ou membro do casal para análises específicas.' },
          ]
        },
        {
          title: 'Análises em Tempo Real',
          bullets: [
            'Balanço Mensal: Comparação automática entre receitas e despesas do mês',
            'Tendências: Identificação de padrões de gastos e oportunidades de economia',
            'Alertas Inteligentes: Notificações sobre gastos incomuns ou aproximação de limites',
            'Projeções: Estimativas de saldo futuro baseadas no histórico de transações',
          ]
        },
        {
          title: '',
          tipBox: {
            title: 'Dica de Produtividade',
            content: 'Configure seu dashboard para mostrar as informações mais importantes para sua rotina. Se você consulta frequentemente saldos de cartões, mantenha esse widget no topo. Para casais, ative a visualização consolidada para ter uma visão unificada das finanças.'
          }
        }
      ]
    },
    {
      id: 'transacoes',
      title: '4. Gerenciando Transações',
      icon: '💸',
      intro: 'Registre e organize todas as suas movimentações financeiras de forma simples e eficiente.',
      subSections: [
        {
          title: 'Adicionando Receitas',
          steps: [
            { num: 1, title: 'Nova Receita', desc: 'Clique em "Adicionar Transação" e selecione "Receita". Informe valor, data, categoria (salário, freelance, vendas, etc.) e método de recebimento (conta bancária, dinheiro, PIX).' },
            { num: 2, title: 'Categorização Automática', desc: 'O sistema aprende com suas transações e sugere automaticamente categorias baseadas no histórico e descrições similares.' },
          ]
        },
        {
          title: 'Registrando Despesas',
          steps: [
            { num: 1, title: 'Nova Despesa', desc: 'Selecione "Despesa", informe o valor, escolha a categoria apropriada, método de pagamento (dinheiro, cartão, conta, PIX) e adicione uma descrição detalhada.' },
            { num: 2, title: 'Parcelamento Inteligente', desc: 'Para compras parceladas, o sistema automaticamente distribui o valor nas próximas faturas do cartão de crédito.' },
          ]
        },
        {
          title: 'Transações Recorrentes',
          content: 'Ideal para despesas fixas como aluguel, financiamentos, assinaturas e salários:',
          features: [
            { title: 'Configuração de Recorrência', desc: 'Defina frequência (diária, semanal, quinzenal, mensal, anual) e período de vigência.' },
            { title: 'Geração Automática', desc: 'O sistema cria automaticamente as próximas ocorrências, mantendo seu controle sempre atualizado.' },
            { title: 'Edição Flexível', desc: 'Modifique valores específicos sem afetar o padrão geral da recorrência.' },
            { title: 'Projeções Futuras', desc: 'Visualize o impacto de gastos recorrentes no planejamento financeiro futuro.' },
          ]
        },
        {
          title: 'Sistema de Tags e Observações',
          bullets: [
            'Tags Personalizadas: Crie etiquetas para organizar transações (ex: "urgente", "lazer", "trabalho")',
            'Observações Detalhadas: Adicione contexto importante sobre cada transação',
            'Anexos: Vincule fotos de notas fiscais e comprovantes',
            'Localização: Registre onde a transação foi realizada',
          ]
        },
        {
          title: '',
          warningBox: {
            title: 'Boas Práticas para Registro',
            content: 'Sempre selecione corretamente o método de pagamento - isso afeta diretamente os saldos disponíveis. Para cartões de crédito, considere a data de vencimento da fatura. Para débito e dinheiro, o impacto é imediato no saldo. Use descrições claras para facilitar futuras consultas e análises.'
          }
        },
        {
          title: '',
          premiumBox: {
            title: 'Recursos Premium de Transações',
            content: 'Usuários Premium têm acesso a importação automática de extratos bancários, categorização inteligente por IA, detecção de duplicatas e análises preditivas de padrões de gastos.'
          }
        }
      ]
    },
    {
      id: 'contas',
      title: '5. Gestão de Contas Bancárias',
      icon: '🏦',
      intro: 'Gerencie todas as suas contas bancárias em um só lugar com controle preciso de saldos.',
      subSections: [
        {
          title: 'Adicionando Contas',
          steps: [
            { num: 1, title: 'Acesso ao Menu de Contas', desc: 'Navegue até "Contas" no menu principal e clique em "Adicionar Nova Conta".' },
            { num: 2, title: 'Informações da Conta', desc: 'Preencha: nome do banco (com seleção de ícones dos principais bancos brasileiros), tipo de conta (corrente/poupança), saldo inicial e limite de cheque especial se aplicável.' },
            { num: 3, title: 'Configurações Específicas', desc: 'Defina se a conta permite saque, transferências, se é conta principal e configure alertas de saldo baixo.' },
          ]
        },
        {
          title: 'Gestão da Conta de Dinheiro',
          content: 'A conta de dinheiro funciona de forma independente das demais contas:',
          features: [
            { title: 'Receitas em Dinheiro', desc: 'Registre apenas quando receber dinheiro físico real. Ex: "Recebido R$ 50 de venda" ou "Troco recebido R$ 10".' },
            { title: 'Despesas em Dinheiro', desc: 'Só é possível gastar se houver saldo suficiente. O sistema impede gastos sem saldo disponível.' },
            { title: 'Conexão via Saques', desc: 'A única ligação entre contas: saque retira da conta bancária e adiciona à conta de dinheiro automaticamente.' },
            { title: 'Controle Preciso', desc: 'Acompanhe exatamente quanto dinheiro físico você possui e onde foi gasto.' },
          ]
        },
        {
          title: 'Transferências Entre Contas',
          steps: [
            { num: 1, title: 'Nova Transferência', desc: 'Selecione conta de origem e destino, informe o valor e adicione uma descrição (ex: "Transferência para poupança").' },
            { num: 2, title: 'Tipos de Transferência', desc: 'Suporte a TED, DOC, PIX e transferências internas com registro automático em ambas as contas.' },
          ]
        },
        {
          title: 'Monitoramento e Alertas',
          bullets: [
            'Saldo em Tempo Real: Acompanhamento constante de todas as contas',
            'Alertas de Limite: Notificações quando saldo fica baixo ou usa cheque especial',
            'Histórico Detalhado: Todas as movimentações com filtros avançados',
            'Reconciliação: Compare seus registros com extratos bancários',
          ]
        },
        {
          title: '',
          tipBox: {
            title: 'Exemplo Prático de Uso',
            content: 'Cenário: Você tem R$ 2.000 no Itaú e precisa de R$ 200 em dinheiro para uma feira. Processo: Registre um saque de R$ 200. Resultado automático: R$ 1.800 no Itaú + R$ 200 na conta de dinheiro. Compra na feira: Registre despesa de R$ 150 em dinheiro. Resultado: R$ 50 restam na conta de dinheiro.'
          }
        },
        {
          title: '',
          warningBox: {
            title: 'Importante sobre Contas de Dinheiro',
            content: 'Nunca registre transações em dinheiro diretamente em contas bancárias. Use exclusivamente a conta de dinheiro para transações físicas em espécie. Esta separação garante controle preciso sobre cada tipo de saldo.'
          }
        }
      ]
    },
    {
      id: 'cartoes',
      title: '6. Gestão de Cartões',
      icon: '💳',
      intro: 'Controle completo dos seus cartões de crédito com gestão de faturas, limites e pagamentos.',
      subSections: [
        {
          title: 'Adicionando Cartões',
          steps: [
            { num: 1, title: 'Configuração Inicial', desc: 'Acesse "Cartões" e adicione novo cartão informando nome, bandeira (Visa, Mastercard, etc.), tipo (crédito/débito) e banco emissor.' },
            { num: 2, title: 'Cartões de Crédito', desc: 'Configure limite total, data de fechamento (quando a fatura é gerada), data de vencimento e melhor dia de compra para maximizar o prazo.' },
            { num: 3, title: 'Cartões de Débito', desc: 'Vincule à conta bancária correspondente para desconto automático do saldo disponível a cada compra.' },
          ]
        },
        {
          title: 'Gestão de Faturas',
          features: [
            { title: 'Controle de Limite', desc: 'Acompanhe limite disponível, valor da fatura atual e projeção para próximas faturas.' },
            { title: 'Calendário de Vencimentos', desc: 'Visualize todas as datas de vencimento em um calendário integrado com alertas automáticos.' },
            { title: 'Pagamento de Faturas', desc: 'Registre pagamentos totais ou parciais com histórico completo de quitações.' },
            { title: 'Parcelamentos', desc: 'Gerencie compras parceladas com distribuição automática entre faturas futuras.' },
          ]
        },
        {
          title: 'Pagamentos como Transferências Internas',
          content: 'Quando você realiza um pagamento de cartão de crédito no sistema, ele é registrado como uma transferência interna:',
          steps: [
            { num: 1, title: 'Saída da Conta Bancária', desc: 'Se você pagar usando uma conta bancária, o sistema registra uma transação de despesa (saída) na conta selecionada, debitando o valor pago do saldo disponível.' },
            { num: 2, title: 'Entrada Virtual no Cartão', desc: 'Simultaneamente, é criada uma transação de receita (entrada virtual) vinculada ao cartão, reduzindo a dívida e aumentando o limite disponível proporcionalmente.' },
            { num: 3, title: 'Visualização nas Transferências', desc: 'Essas movimentações aparecem automaticamente na aba "Transferências" dentro de "Receitas Mensais", permitindo rastrear todos os pagamentos de cartão realizados.' },
          ]
        },
        {
          title: 'Benefícios desta Abordagem',
          bullets: [
            'Transparência Total: Você vê exatamente de onde saiu o dinheiro e para onde foi',
            'Controle de Fluxo: As transferências internas não afetam seus saldos de receita/despesa mensais',
            'Histórico Completo: Todos os pagamentos ficam registrados em múltiplos locais',
            'Rastreabilidade: Fácil auditoria de pagamentos realizados ao longo do tempo',
          ]
        },
        {
          title: 'Cartões de Milhas',
          content: 'Para cartões que acumulam milhas ou pontos:',
          bullets: [
            'Configuração de Acúmulo: Defina quantos pontos por real gasto',
            'Metas de Milhas: Estabeleça objetivos de acúmulo mensal/anual',
            'Promoções Especiais: Registre multiplicadores em categorias específicas',
            'Histórico de Resgates: Acompanhe utilização de pontos e milhas',
          ]
        },
        {
          title: '',
          warningBox: {
            title: 'Moeda do Pagamento',
            content: 'Você pode escolher a moeda de pagamento ao realizar o pagamento do cartão. Por exemplo: se você tem um cartão em Dólar mas paga usando Reais, o sistema faz a conversão automática. O valor debitado da sua conta será em Reais, mas a dívida do cartão será reduzida no equivalente em Dólar.'
          }
        },
        {
          title: '',
          tipBox: {
            title: 'Dica para Maximizar Benefícios',
            content: 'Use nomes descritivos como "Nubank Roxinho", "Itaú Click Mastercard" para fácil identificação. Configure alertas de vencimento com 3-5 dias de antecedência. Para cartões com anuidade, monitore se os benefícios compensam o custo anual.'
          }
        },
        {
          title: '',
          premiumBox: {
            title: 'Recursos Premium para Cartões',
            content: 'Análise comparativa automática de benefícios, sugestões de cartões ideais para seu perfil, alertas de promoções especiais e otimização inteligente de pagamentos para maximizar cashback e milhas.'
          }
        }
      ]
    },
    {
      id: 'despesas-mensais',
      title: '7. Despesas Mensais',
      icon: '📅',
      intro: 'O módulo de despesas mensais organiza todos os seus gastos em 3 abas principais para controle completo e eficiente.',
      subSections: [
        {
          title: 'Despesas Pagas',
          content: 'Despesas do mês selecionado que já foram pagas:',
          bullets: [
            'Gastos já pagos e registrados no sistema',
            'Compras à vista, cartão de crédito, PIX, dinheiro',
            'Filtros por mês e categoria',
            'Visualização detalhada com valores e datas',
          ]
        },
        {
          title: 'Despesas Futuras',
          content: 'Despesas programadas que ainda não foram pagas:',
          features: [
            { title: 'Parcelas de Cartão', desc: 'Parcelas futuras de compras já realizadas distribuídas nas próximas faturas.' },
            { title: 'Despesas Recorrentes', desc: 'Contas fixas como aluguel, luz, internet geradas automaticamente.' },
            { title: 'Pagamentos de Faturas', desc: 'Datas de vencimento de faturas de cartão de crédito.' },
            { title: 'Despesas Manuais', desc: 'Despesas futuras que você adiciona manualmente no sistema.' },
          ]
        },
        {
          title: '',
          tipBox: {
            title: 'Sistema de Alertas de Vencimento',
            content: 'No dia do vencimento, aparece um alerta (tooltip) na página principal. Você pode pagar diretamente pelo alerta! Isso facilita não esquecer de nenhum compromisso financeiro.'
          }
        },
        {
          title: 'Despesas Atrasadas',
          content: 'Despesas que passaram da data de vencimento sem pagamento:',
          bullets: [
            'Despesas permanecem na lista até serem pagas',
            'Exibição padrão: últimos 90 dias',
            'Opção para ver despesas com mais de 90 dias de atraso',
            'Botão "Pagar" para quitar a despesa',
            'Após pagamento, a despesa some da lista de atrasadas',
          ]
        },
        {
          title: '',
          warningBox: {
            title: 'Como Resolver Despesas Atrasadas',
            content: 'Na aba "Atrasadas", identifique a despesa, clique em "Pagar" para quitar. Após o pagamento, ela é automaticamente removida da lista e registrada como paga.'
          }
        }
      ]
    },
    {
      id: 'despesas-recorrentes',
      title: '8. Despesas Recorrentes e Débitos Automáticos',
      icon: '🔄',
      intro: 'Despesas recorrentes são gastos fixos que se repetem periodicamente. A plataforma oferece dois modelos de automação: o Débito Automático dentro das Recorrentes (para valores fixos) e a aba Débitos Automáticos (para valores variáveis como faturas de cartão).',
      subSections: [
        {
          title: 'O que são Despesas Recorrentes',
          content: 'Gastos fixos que se repetem com frequência definida:',
          bullets: [
            'Aluguel, condomínio, IPTU',
            'Luz, água, gás, internet',
            'Assinaturas (streaming, apps, academia)',
            'Financiamentos e empréstimos',
          ]
        },
        {
          title: 'Como Adicionar',
          steps: [
            { num: 1, title: 'Acessar Menu', desc: 'Navegue até "Despesas Recorrentes" ou acesse pelo Fluxo de Caixa.' },
            { num: 2, title: 'Preencher Dados', desc: 'Informe: descrição, valor, categoria, frequência (diária, semanal, quinzenal, mensal, anual).' },
            { num: 3, title: 'Configurar Período', desc: 'Defina data de início, fim (opcional) e número de parcelas se aplicável.' },
          ]
        },
        {
          title: 'Fluxo de Geração Automática',
          content: 'O sistema cria automaticamente entradas em Despesas Futuras:',
          bullets: [
            'Despesa Recorrente → gera automaticamente → Despesa Futura',
            'No dia do vencimento → aparece alerta na tela principal',
            'Se não pagar → vai para Despesas Atrasadas',
            'Após pagamento → despesa concluída/removida',
          ]
        },
        {
          title: 'Modelo 1: Débito Automático em Recorrentes (Valores Fixos)',
          content: 'Dentro das Despesas Recorrentes, você pode ativar a opção "Débito Automático" para que o pagamento seja processado automaticamente na conta bancária vinculada:',
          steps: [
            { num: 1, title: 'Ativar Débito Automático', desc: 'Ao criar ou editar uma despesa recorrente, ative a opção "Débito Automático" e selecione a conta bancária de onde o valor será debitado.' },
            { num: 2, title: 'Processamento Automático', desc: 'No dia do vencimento, o sistema debita automaticamente o valor fixo da conta selecionada e registra a transação.' },
            { num: 3, title: 'Alerta de Saldo Insuficiente', desc: 'Se a conta não tiver saldo suficiente, o sistema exibe um alerta na tela principal e a despesa vai para "Atrasadas" para pagamento manual.' },
          ]
        },
        {
          title: '',
          tipBox: {
            title: 'Quando Usar o Débito Automático em Recorrentes',
            content: 'Ideal para despesas de valor fixo e previsível como aluguel, condomínio, assinaturas e mensalidades. O valor é sempre o mesmo mês a mês, então a automação é direta e segura.'
          }
        },
        {
          title: 'Modelo 2: Aba Débitos Automáticos (Valores Variáveis)',
          content: 'A aba "Débitos Automáticos" (ao lado de Recorrentes e Empréstimos) é dedicada a pagamentos de valores variáveis que mudam a cada mês:',
          features: [
            { title: 'Faturas de Cartão de Crédito', desc: 'Vincule um cartão de crédito e o sistema calcula automaticamente o valor da fatura com base nos gastos registrados no período.' },
            { title: 'Contas de Consumo', desc: 'Ideal para contas que variam mensalmente como energia elétrica, telefone, água e gás.' },
            { title: 'Dívida Atual em Vermelho', desc: 'Para cartões de crédito, o sistema exibe a "Dívida Atual" em vermelho, que aumenta conforme novos gastos são registrados.' },
            { title: 'Débito no Dia Programado', desc: 'No dia configurado, o sistema processa o débito da conta vinculada. Se não houver saldo, a despesa fica pendente em "Atrasadas".' },
          ]
        },
        {
          title: 'Como Configurar um Débito Automático Variável',
          steps: [
            { num: 1, title: 'Acesse a Aba', desc: 'Navegue até "Débitos Automáticos" na seção de despesas recorrentes.' },
            { num: 2, title: 'Selecione o Tipo', desc: 'Escolha entre "Fatura de Cartão" ou "Conta de Consumo" para definir o tipo de débito.' },
            { num: 3, title: 'Vincule Conta e Cartão', desc: 'Selecione a conta bancária de débito e, se for fatura, o cartão de crédito correspondente.' },
            { num: 4, title: 'Configure o Dia', desc: 'Defina o dia do mês em que o débito deve ser processado automaticamente.' },
          ]
        },
        {
          title: '',
          warningBox: {
            title: 'Regra de Propriedade',
            content: 'Importante: Você só pode configurar débitos automáticos para suas próprias contas e cartões. O sistema não permite misturar ativos de diferentes usuários. Cada pessoa gerencia apenas seus próprios débitos automáticos, garantindo a separação financeira individual mesmo no dashboard compartilhado.'
          }
        },
        {
          title: 'Comparação entre os Dois Modelos',
          bullets: [
            'Recorrentes com Débito Automático: Valor fixo, mesmo valor todo mês (ex: aluguel R$ 2.000)',
            'Aba Débitos Automáticos: Valor variável, muda conforme consumo (ex: fatura do cartão, conta de luz)',
            'Ambos debitam automaticamente da conta bancária no dia programado',
            'Ambos geram alerta se não houver saldo suficiente na conta',
            'Ambos movem para "Despesas Atrasadas" em caso de saldo insuficiente',
          ]
        },
        {
          title: '',
          tipBox: {
            title: 'Gestão de Recorrências e Débitos',
            content: 'Você pode editar valores, pausar temporariamente, ou cancelar permanentemente uma despesa recorrente. Para débitos automáticos variáveis, acompanhe a evolução da dívida do cartão em tempo real. O histórico de todas as ocorrências geradas fica disponível para consulta.'
          }
        }
      ]
    },
    {
      id: 'fluxo-caixa',
      title: '9. Fluxo de Caixa',
      icon: '💰',
      intro: 'Visão consolidada de todas as entradas e saídas que afetam o saldo bancário real.',
      subSections: [
        {
          title: 'O que é o Fluxo de Caixa',
          content: 'Diferente do dashboard de despesas, o Fluxo de Caixa mostra apenas movimentações reais:',
          features: [
            { title: 'Entradas', desc: 'Salários, receitas, transferências recebidas, resgates de investimentos.' },
            { title: 'Saídas', desc: 'Pagamentos de faturas de cartão, transferências enviadas, saques, débitos automáticos.' },
          ]
        },
        {
          title: 'O que NÃO entra no Fluxo de Caixa',
          bullets: [
            'Compras no cartão de crédito (afetam o limite, não o saldo)',
            'Parcelas futuras (são compromissos, não movimentação real)',
          ]
        },
        {
          title: 'Abas do Fluxo de Caixa',
          features: [
            { title: 'Visão Geral', desc: 'Gráficos e resumo do período com evolução de saldo e tendências.' },
            { title: 'Histórico', desc: 'Lista detalhada de todas as movimentações com filtros e busca.' },
            { title: 'Despesas', desc: 'Despesas consolidadas por categoria com análise detalhada.' },
            { title: 'Receitas', desc: 'Receitas consolidadas por categoria com visão detalhada.' },
            { title: 'Imposto de Renda', desc: 'Acesso direto ao módulo de IR para organização da declaração.' },
          ]
        },
        {
          title: 'Filtros e Exportação',
          bullets: [
            'Período: Mensal, Trimestral, Anual, Personalizado',
            'Ano específico para visão anual',
            'Exportação em PDF ou Excel',
          ]
        }
      ]
    },
    {
      id: 'investimentos',
      title: '10. Controle de Investimentos',
      icon: '📈',
      intro: 'Acompanhe sua carteira de investimentos com análises de rentabilidade e performance.',
      subSections: [
        {
          title: 'Cadastrando Investimentos',
          steps: [
            { num: 1, title: 'Novo Investimento', desc: 'Acesse "Investimentos" e adicione informando nome do produto, tipo (CDB, LCI/LCA, ações, fundos, etc.), valor investido, data de aplicação e instituição financeira.' },
            { num: 2, title: 'Configurações Avançadas', desc: 'Defina rentabilidade esperada, prazo de vencimento, liquidez (D+0, D+1, etc.) e se há proteção do FGC.' },
            { num: 3, title: 'Acompanhamento de Performance', desc: 'Atualize periodicamente o valor atual para monitorar rendimentos, perdas e compare com metas estabelecidas.' },
          ]
        },
        {
          title: 'Tipos de Investimento Suportados',
          features: [
            { title: 'Renda Fixa', desc: 'CDB, LCI, LCA, Tesouro Direto, CRI, CRA com cálculo automático de rentabilidade bruta e líquida.' },
            { title: 'Renda Variável', desc: 'Ações, FIIs, ETFs com acompanhamento de cotações e dividendos recebidos.' },
            { title: 'Fundos de Investimento', desc: 'Fundos multimercado, DI, ações com controle de cotas e performance histórica.' },
            { title: 'Internacional', desc: 'REITs, ações americanas, bonds com conversão automática de moedas.' },
          ]
        },
        {
          title: '',
          tipBox: {
            title: 'Estratégia de Diversificação',
            content: 'Use o sistema para manter uma carteira diversificada: 20-40% renda fixa, 40-60% renda variável, 10-20% reserva de emergência. Reavalie periodicamente e rebalanceie conforme necessário. Para casais, considere objetivos individuais e conjuntos.'
          }
        }
      ]
    },
    {
      id: 'milhas',
      title: '11. Sistema de Milhas',
      icon: '✈️',
      intro: 'Acompanhe e otimize suas milhas aéreas com estratégias inteligentes de acúmulo e resgate. Conecte seus programas de fidelidade e sincronize saldos automaticamente via extensão Chrome.',
      subSections: [
        {
          title: 'Configuração de Programas',
          steps: [
            { num: 1, title: 'Adicionando Programas', desc: 'Cadastre seus programas de fidelidade: LATAM Pass, Smiles, TudoAzul, Livelo, etc. Informe saldo inicial e validade dos pontos.' },
            { num: 2, title: 'Metas de Acúmulo', desc: 'Defina objetivos específicos: "Acumular 50.000 milhas LATAM até dezembro para viagem à Europa" com prazo e valor de passagem desejada.' },
            { num: 3, title: 'Vinculação com Cartões', desc: 'Configure quais cartões geram milhas em cada programa e suas respectivas taxas de conversão (ex: 1 real = 1 ponto Livelo).' },
          ]
        },
        {
          title: 'Conectando Programas de Milhas',
          content: 'O Couples Financials suporta os principais programas de milhas do Brasil e dos EUA:',
          features: [
            { title: 'LATAM Pass', desc: 'Programa da LATAM Airlines. Conecte sua conta para acompanhar saldo, metas e promoções de bonificação.' },
            { title: 'Smiles (GOL)', desc: 'Programa da GOL Linhas Aéreas. Monitore seus pontos e aproveite promoções de passagens.' },
            { title: 'Azul Fidelidade (TudoAzul)', desc: 'Programa da Azul. Acompanhe pontos acumulados e oportunidades de resgate.' },
            { title: 'Livelo / Esfera', desc: 'Programas de pontos bancários. Gerencie transferências para companhias aéreas parceiras.' },
          ]
        },
        {
          title: 'Como Conectar um Programa',
          steps: [
            { num: 1, title: 'Acesse o Módulo de Milhas', desc: 'No menu principal, navegue até "Milhagem" para acessar o dashboard de milhas.' },
            { num: 2, title: 'Adicione um Programa', desc: 'Clique em "Adicionar Programa" e selecione o programa desejado na lista (LATAM Pass, Smiles, Azul, Livelo, Esfera, AAdvantage, MileagePlus, SkyMiles).' },
            { num: 3, title: 'Informe o Saldo Inicial', desc: 'Digite o saldo atual de milhas/pontos que você possui no programa. Este valor será o ponto de partida para o acompanhamento.' },
            { num: 4, title: 'Configure Metas (Opcional)', desc: 'Defina uma meta de acúmulo com prazo para acompanhar o progresso no dashboard.' },
          ]
        },
        {
          title: 'Extensão Chrome - Couples Miles',
          content: 'A extensão Couples Miles permite sincronizar automaticamente o saldo dos seus programas de milhas diretamente do navegador, de forma segura e sem armazenar senhas.',
          features: [
            { title: 'Sincronização Segura', desc: 'A extensão captura apenas o saldo visível na página do programa, sem acessar senhas ou dados de login.' },
            { title: 'Extração sob Demanda', desc: 'A sincronização é acionada exclusivamente por clique manual do usuário - nunca automática.' },
            { title: 'Confirmação de Dados', desc: 'Antes de enviar o saldo para o Couples Financials, a extensão mostra um preview para você confirmar se o valor está correto.' },
            { title: 'Programas Suportados', desc: 'LATAM Pass, Smiles, Azul Fidelidade e Livelo. Novos programas são adicionados regularmente.' },
          ]
        },
        {
          title: 'Como Usar a Extensão Couples Miles',
          steps: [
            { num: 1, title: 'Instalar a Extensão', desc: 'Acesse a Chrome Web Store e procure por "Couples Miles Secure Sync" ou acesse diretamente pelo link disponível no dashboard de milhas. Clique em "Adicionar ao Chrome".' },
            { num: 2, title: 'Fazer Login na Extensão', desc: 'Após instalar, clique no ícone da extensão e faça login com sua conta do Couples Financials.' },
            { num: 3, title: 'Acessar o Site do Programa', desc: 'Abra o site oficial do programa de milhas (ex: latam.com) e faça login na sua conta. Navegue até a página onde seu saldo de milhas está visível.' },
            { num: 4, title: 'Sincronizar', desc: 'Com a página de milhas aberta, clique no ícone da extensão Couples Miles e depois em "Sincronizar Milhas". Confirme se o valor capturado está correto.' },
            { num: 5, title: 'Verificar no Dashboard', desc: 'Retorne ao Couples Financials e verifique que o saldo foi atualizado automaticamente no dashboard de milhas.' },
          ]
        },
        {
          title: '',
          tipBox: {
            title: 'Dica sobre a Extensão',
            content: 'A extensão funciona melhor quando você está na página principal da sua conta no programa de milhas (geralmente "Minha Conta" ou "Resumo"). Certifique-se de que o saldo está visível na tela antes de clicar em sincronizar. Se a captura falhar, a extensão oferece um botão de ajuda para navegar até a página correta.'
          }
        },
        {
          title: 'Estratégias de Acúmulo',
          features: [
            { title: 'Gastos Recorrentes', desc: 'Use cartões de milhas para pagamentos fixos: condomínio, escola, combustível, supermercado.' },
            { title: 'Promoções Especiais', desc: 'Monitore campanhas de bonificação: 3x pontos em farmácias, 5x em postos, compre e ganhe.' },
            { title: 'Parceiros', desc: 'Acumule em parceiros: hotéis, locadoras, e-commerce, restaurantes com multiplicadores especiais.' },
            { title: 'Transferências', desc: 'Gerencie transferências entre programas considerando taxas e bonificações sazonais.' },
          ]
        },
        {
          title: 'Gestão de Resgates',
          steps: [
            { num: 1, title: 'Planejamento de Viagens', desc: 'Simule resgates para diferentes destinos e datas. Compare custos em milhas vs dinheiro para encontrar o melhor custo-benefício.' },
            { num: 2, title: 'Produtos e Serviços', desc: 'Avalie resgates alternativos: upgrades, produtos, cashback quando não há disponibilidade de passagens.' },
          ]
        },
        {
          title: 'Monitoramento e Alertas',
          bullets: [
            'Vencimento de Pontos: Alertas automáticos para pontos próximos ao vencimento',
            'Promoções Ativas: Notificações sobre campanhas de bonificação em andamento',
            'Metas de Progresso: Acompanhamento visual do progresso para atingir objetivos',
            'Análise de Valor: Cálculo do CPM (custo por milha) de cada estratégia',
          ]
        },
        {
          title: 'Funcionalidades para Casais',
          features: [
            { title: 'Conta Conjunta', desc: 'Visualize saldos consolidados do casal em cada programa de milhas.' },
            { title: 'Metas Compartilhadas', desc: 'Definam objetivos conjuntos: "Lua de mel em Paris - 100.000 milhas LATAM".' },
            { title: 'Estratégia Coordenada', desc: 'Otimize gastos entre cartões dos dois para maximizar acúmulo conjunto.' },
            { title: 'Transferências Internas', desc: 'Gerencie transferências de pontos entre cônjuges quando permitido pelo programa.' },
          ]
        },
        {
          title: '',
          tipBox: {
            title: 'Estratégias Avançadas',
            content: 'Use cartões diferentes para categorias específicas: cartão A para supermercado (3x pontos), cartão B para combustível (5x pontos). Aproveite promoções sazonais e compre pontos com desconto quando necessário. Monitore constantemente as regras dos programas que mudam frequentemente.'
          }
        },
        {
          title: '',
          premiumBox: {
            title: 'Recursos Premium de Milhas',
            content: 'Sincronização automática com sites de programas via extensão Chrome, alertas de promoções personalizados, calculadora avançada de CPM, sugestões de estratégias otimizadas por IA e análise preditiva de melhores períodos para resgates.'
          }
        },
        {
          title: '',
          warningBox: {
            title: 'Cuidados com Milhas',
            content: 'Acompanhe datas de validade - pontos vencidos não podem ser recuperados. Não acumule indefinidamente; use regularmente para evitar perdas. Considere o custo real: se precisar gastar mais para ganhar milhas, avalie se vale a pena.'
          }
        }
      ]
    },
    {
      id: 'imposto-renda',
      title: '12. Imposto de Renda (Brasil)',
      icon: '📋',
      intro: 'Módulo completo para organizar sua declaração anual do Imposto de Renda. Versão Brasil disponível - demais versões em construção.',
      subSections: [
        {
          title: '',
          warningBox: {
            title: 'Aviso sobre Versões',
            content: 'Este módulo está disponível apenas para declaração no modelo brasileiro (Receita Federal). Versões para outros países (EUA, Europa, etc.) estão em construção.'
          }
        },
        {
          title: 'O que é o Módulo de IR',
          content: 'Ferramenta para organizar documentos e valores para sua declaração anual do Imposto de Renda. Centraliza todas as informações necessárias em um único lugar.'
        },
        {
          title: 'Seções do Módulo',
          features: [
            { title: 'Identificação', desc: 'CPF do titular e cônjuge, dados pessoais e informações cadastrais.' },
            { title: 'Rendimentos Tributáveis', desc: 'Salários, pró-labore, aluguéis recebidos e outras rendas sujeitas à tributação.' },
            { title: 'Rendimentos Isentos', desc: 'Poupança, dividendos, lucros e outros rendimentos não tributáveis.' },
            { title: 'Despesas Dedutíveis', desc: 'Saúde, educação, previdência com upload de comprovantes para organização.' },
            { title: 'Bens e Direitos', desc: 'Imóveis, veículos, investimentos e outros patrimônios a declarar.' },
            { title: 'Pendências', desc: 'Itens sem categoria, documentos faltando ou informações incompletas.' },
          ]
        },
        {
          title: 'Sistema de Pendências',
          steps: [
            { num: 1, title: 'Identificação Automática', desc: 'O sistema identifica automaticamente itens que precisam de atenção ou correção.' },
            { num: 2, title: 'Resolver Pendências', desc: 'Botão para resolver cada pendência diretamente, com sugestões de ação.' },
            { num: 3, title: 'Tipos de Pendência', desc: 'Sem categoria, receita não classificada, documento faltando, valor inconsistente.' },
          ]
        },
        {
          title: 'Exportação de Dados',
          features: [
            { title: 'Relatório PDF', desc: 'Relatório completo formatado para entregar ao seu contador.' },
            { title: 'Planilha Excel', desc: 'Dados organizados em planilha para preenchimento da declaração oficial.' },
          ]
        },
        {
          title: 'Tipos de Declaração',
          bullets: [
            'Simplificada: Desconto padrão de 20% sobre rendimentos tributáveis (limite R$ 16.754,34)',
            'Completa: Soma de todas as deduções comprovadas sem limite de valor',
            'O sistema sugere automaticamente a opção mais vantajosa baseado nos seus dados',
          ]
        },
        {
          title: '',
          warningBox: {
            title: 'Aviso Importante',
            content: 'Este módulo é uma ferramenta de organização. Para a declaração oficial, consulte um contador ou utilize o programa oficial da Receita Federal. Não nos responsabilizamos por informações incorretas na declaração.'
          }
        },
        {
          title: '',
          tipBox: {
            title: 'Dica de Uso',
            content: 'Mantenha seus documentos organizados ao longo do ano. Use o upload de comprovantes para despesas dedutíveis. Exporte o relatório em PDF para seu contador revisar antes da declaração oficial.'
          }
        }
      ]
    },
    {
      id: 'converter',
      title: '13. Converter de Extratos',
      icon: '📄',
      intro: 'Importe e processe extratos bancários automaticamente com tecnologia OCR e IA.',
      subSections: [
        {
          title: '',
          premiumBox: {
            title: 'Funcionalidade Exclusiva Premium',
            content: 'O Converter de Extratos é uma ferramenta avançada exclusiva para assinantes Premium que permite importar e processar extratos bancários e de cartões automaticamente.'
          }
        },
        {
          title: 'O Que é o Converter?',
          content: 'O Converter de Extratos transforma arquivos de extratos bancários em transações organizadas dentro da plataforma, eliminando a necessidade de digitar manualmente cada transação.',
          features: [
            { title: 'Múltiplos Formatos', desc: 'Suporta PDF, CSV, OFX, e imagens de extratos. Reconhecimento inteligente de diferentes layouts de bancos.' },
            { title: 'OCR Inteligente', desc: 'Tecnologia de reconhecimento óptico para extratos em imagem ou PDFs escaneados.' },
            { title: 'Categorização Automática', desc: 'IA identifica e categoriza transações automaticamente baseada em padrões e histórico.' },
            { title: 'Detecção de Duplicatas', desc: 'Sistema inteligente que identifica e alerta sobre transações possivelmente duplicadas.' },
          ]
        },
        {
          title: 'Como Usar o Converter',
          steps: [
            { num: 1, title: 'Upload do Arquivo', desc: 'Acesse o menu "Converter" e faça upload do seu extrato em PDF, CSV, OFX ou imagem.' },
            { num: 2, title: 'Preview e Validação', desc: 'Visualize as transações detectadas e confirme valores, datas e descrições antes de importar.' },
            { num: 3, title: 'Reconciliação', desc: 'Compare com transações existentes e resolva possíveis duplicatas ou conflitos.' },
            { num: 4, title: 'Regras de Importação', desc: 'Configure regras personalizadas para categorização automática de transações recorrentes.' },
            { num: 5, title: 'Exportação e Integração', desc: 'Exporte para Excel/CSV ou envie diretamente para suas transações na plataforma.' },
          ]
        },
        {
          title: 'Bancos Suportados',
          content: 'O Converter reconhece automaticamente extratos dos principais bancos brasileiros e internacionais:',
          bullets: [
            'Bancos Brasileiros: Itaú, Bradesco, Santander, Banco do Brasil, Caixa, Nubank, Inter, C6 Bank, BTG',
            'Cartões: Mastercard, Visa, Amex, Elo',
            'Formato Universal: Arquivos OFX são compatíveis com qualquer instituição',
          ]
        },
        {
          title: '',
          tipBox: {
            title: 'Dicas para Melhor Resultado',
            content: 'Para PDFs, prefira extratos baixados diretamente do internet banking (não escaneados). Para imagens, garanta boa iluminação e texto legível. Configure regras de categorização para transações recorrentes e ganhe tempo nos próximos imports.'
          }
        },
        {
          title: '',
          warningBox: {
            title: 'Privacidade e Segurança',
            content: 'Seus arquivos são processados com criptografia e não são armazenados em nossos servidores após o processamento. Todas as transações importadas são protegidas pelos mesmos padrões de segurança da plataforma.'
          }
        }
      ]
    },
    {
      id: 'ia',
      title: '14. Recursos de IA',
      icon: '🤖',
      intro: 'Use inteligência artificial para obter insights financeiros personalizados e automatizar tarefas.',
      subSections: [
        {
          title: 'Recomendações Personalizadas',
          content: 'Nossa IA financeira analisa seus dados para fornecer insights valiosos:',
          features: [
            { title: 'Análise de Padrões', desc: 'Identifica tendências de gastos, sazonalidades e oportunidades de economia baseadas no seu histórico financeiro.' },
            { title: 'Otimização de Cartões', desc: 'Sugere qual cartão usar em cada situação para maximizar benefícios, cashback e milhas.' },
            { title: 'Metas Inteligentes', desc: 'Propõe metas realistas baseadas na sua capacidade financeira e objetivos declarados.' },
            { title: 'Alertas Preditivos', desc: 'Avisa sobre possíveis problemas financeiros futuros e sugere ações preventivas.' },
          ]
        },
        {
          title: 'WhatsApp Smart (Premium)',
          content: 'Acesse suas informações financeiras via WhatsApp:',
          bullets: [
            'Consultas de Saldo: "Qual meu saldo no Nubank?"',
            'Gastos por Período: "Quanto gastei em alimentação este mês?"',
            'Lembretes: "Quais cartões vencem esta semana?"',
            'Análises Rápidas: "Como está meu orçamento?"',
          ]
        },
        {
          title: 'Configuração do WhatsApp',
          steps: [
            { num: 1, title: 'Configuração do WhatsApp', desc: 'Conecte seu número na área Premium do sistema. Receba um código de verificação via SMS para confirmar.' },
            { num: 2, title: 'Comandos Disponíveis', desc: 'Use comandos naturais em português. A IA entende contexto e pode responder perguntas complexas sobre suas finanças.' },
          ]
        },
        {
          title: 'Análise Preditiva',
          features: [
            { title: 'Projeções Financeiras', desc: 'Prevê saldos futuros baseados em padrões históricos e transações programadas.' },
            { title: 'Simulação de Cenários', desc: 'Analisa o impacto de grandes compras, mudanças de renda ou novos investimentos.' },
            { title: 'Sugestões de Investimento', desc: 'Recomenda produtos financeiros adequados ao seu perfil e objetivos.' },
            { title: 'Otimização Automática', desc: 'Sugere realocações de recursos para maximizar rentabilidade e liquidez.' },
          ]
        },
        {
          title: 'Consultor Financeiro IA',
          content: 'Chat avançado com IA especializada em finanças pessoais:',
          bullets: [
            'Planejamento Financeiro: Ajuda a criar estratégias personalizadas',
            'Educação Financeira: Explica conceitos e responde dúvidas',
            'Análise de Investimentos: Avalia oportunidades e riscos',
            'Gestão de Dívidas: Estratégias para quitação otimizada',
          ]
        },
        {
          title: 'Insights Automatizados',
          bullets: [
            'Relatórios Inteligentes: Análises automáticas semanais e mensais',
            'Detecção de Anomalias: Identifica gastos incomuns ou suspeitos',
            'Benchmarking: Compara seu desempenho com usuários similares',
            'Recomendações Sazonais: Sugere ajustes para diferentes épocas do ano',
          ]
        },
        {
          title: '',
          tipBox: {
            title: 'Maximizando os Recursos de IA',
            content: 'Para melhores resultados, mantenha seus dados sempre atualizados e utilize as categorias corretas. Quanto mais informações precisas, mais assertivas serão as recomendações da IA. Configure seus objetivos e metas para receber sugestões personalizadas.'
          }
        },
        {
          title: '',
          warningBox: {
            title: 'Privacidade e Segurança',
            content: 'Todos os recursos de IA operam com total segurança e privacidade. Seus dados nunca são compartilhados com terceiros. A IA processa informações localmente sempre que possível, e quando necessário usar serviços externos, os dados são criptografados e anonimizados.'
          }
        }
      ]
    },
    {
      id: 'casais',
      title: '15. Funcionalidades para Casais',
      icon: '👫',
      intro: 'Ferramentas especiais para gestão financeira colaborativa entre casais.',
      subSections: [
        {
          title: 'Convite e Configuração',
          steps: [
            { num: 1, title: 'Enviando Convite', desc: 'Na área "Casal", envie um convite por email para seu cônjuge. Ele receberá um link para criar conta vinculada.' },
            { num: 2, title: 'Definindo Permissões', desc: 'Configure o que cada um pode ver e editar: contas individuais, contas conjuntas, cartões pessoais vs compartilhados.' },
            { num: 3, title: 'Sincronização de Dados', desc: 'Escolha quais informações serão compartilhadas automaticamente entre os perfis do casal.' },
          ]
        },
        {
          title: 'Gestão Financeira Conjunta',
          features: [
            { title: 'Contas Compartilhadas', desc: 'Marquem contas como "conjuntas" para ambos terem visibilidade e acesso total aos dados.' },
            { title: 'Cartões do Casal', desc: 'Gerenciem cartões compartilhados com visibilidade de gastos de ambos os portadores.' },
            { title: 'Dashboard Unificado', desc: 'Visualização consolidada das finanças do casal com separação por responsável quando necessário.' },
            { title: 'Metas Conjuntas', desc: 'Definam objetivos financeiros em conjunto: casa própria, viagens, aposentadoria.' },
          ]
        },
        {
          title: 'Relatórios para Casais',
          steps: [
            { num: 1, title: 'Gastos Consolidados', desc: 'Visualizem gastos totais do casal por categoria, período e responsável. Identifiquem padrões de consumo conjunto.' },
            { num: 2, title: 'Divisão de Despesas', desc: 'Acompanhem divisões proporcionais: 50/50, por renda, por categoria específica ou modelo personalizado.' },
          ]
        },
        {
          title: 'Funcionalidades Colaborativas',
          bullets: [
            'Orçamento Compartilhado: Definam limites de gastos por categoria que ambos devem respeitar',
            'Notificações Cruzadas: Recebam alertas sobre gastos importantes do cônjuge',
            'Lista de Compras: Compartilhem listas sincronizadas para evitar compras duplicadas',
            'Planejamento de Viagens: Organização financeira conjunta para viagens e eventos',
          ]
        },
        {
          title: 'Metas e Objetivos em Casal',
          features: [
            { title: 'Sonho da Casa Própria', desc: 'Calculem valor necessário para entrada, financiamento e acompanhem progresso conjunto da poupança.' },
            { title: 'Viagens dos Sonhos', desc: 'Planejem destinos, custos e estratégias de economia. Incluam milhas e pontos no planejamento.' },
            { title: 'Filhos e Educação', desc: 'Organizem financeiramente para filhos: parto, educação, planos de saúde e reserva para futuro.' },
            { title: 'Aposentadoria', desc: 'Planejem aposentadoria conjunta com metas de investimento e projeções de longo prazo.' },
          ]
        },
        {
          title: '',
          warningBox: {
            title: 'Equilíbrio entre Transparência e Privacidade',
            content: 'Mesmo em relacionamentos, cada pessoa tem direito à privacidade financeira. Configure adequadamente: contas pessoais vs conjuntas, gastos individuais vs compartilhados, limite de valores para notificações automáticas, informações que devem permanecer privadas.'
          }
        },
        {
          title: '',
          tipBox: {
            title: 'Dicas para Comunicação Saudável',
            content: 'Use o sistema para facilitar conversas sobre dinheiro: Revisem relatórios mensais juntos, definam reuniões financeiras regulares, celebrem metas atingidas em conjunto, discutam ajustes necessários com dados concretos, usem alertas para evitar surpresas desagradáveis.'
          }
        },
        {
          title: '',
          premiumBox: {
            title: 'Recursos Premium para Casais',
            content: 'Mediação inteligente de conflitos financeiros, sugestões personalizadas para harmonia financeira, análise comparativa de compatibilidade financeira e consultoria especializada para casais via IA.'
          }
        }
      ]
    },
    {
      id: 'decisoes',
      title: '16. Central de Decisões',
      icon: '💕',
      intro: 'Tome decisões financeiras em conjunto com seu parceiro(a) de forma estruturada, evitando conflitos e promovendo harmonia.',
      subSections: [
        {
          title: 'O Que é a Central de Decisões',
          content: 'Um espaço seguro para casais discutirem e votarem em decisões financeiras importantes, desde pequenas compras até grandes investimentos.',
          features: [
            { title: 'Wizard Guiado', desc: 'Processo em 6 etapas para criar decisões estruturadas com contexto completo, restrições e cenários.' },
            { title: 'Sistema de Votação', desc: 'Cada parceiro pode votar: Concordar, Concordar com Condição, Discordar ou Pausar para reflexão.' },
            { title: 'Simulação de Cenários', desc: 'Visualize o impacto financeiro de cada opção: à vista, parcelado ou adiar a decisão.' },
            { title: 'Acordos Permanentes', desc: 'Crie acordos para decisões recorrentes, como limites de gastos sem consulta prévia.' },
          ]
        },
        {
          title: 'Como Criar uma Nova Decisão',
          steps: [
            { num: 1, title: 'Escolha o Tipo', desc: 'Selecione entre templates pré-definidos (Comprar vs Alugar, Pagar Dívida vs Investir, Trocar Carro, Viagem, Grande Compra) ou crie uma personalizada.' },
            { num: 2, title: 'Descreva o Contexto', desc: 'Informe título, descrição, valor estimado, data desejada, urgência e quem quer (você, parceiro(a) ou ambos).' },
            { num: 3, title: 'Defina Restrições', desc: 'Configure limite mensal, se pode parcelar, número máximo de parcelas e se afeta reserva de emergência ou metas.' },
            { num: 4, title: 'Analise Cenários', desc: 'O sistema gera 3 cenários automaticamente: pagamento à vista, parcelado e adiar. Veja projeções de 3, 6 e 12 meses.' },
            { num: 5, title: 'Vote na Decisão', desc: 'Escolha sua opção de voto e aguarde o voto do seu parceiro(a) para concluir.' },
            { num: 6, title: 'Crie um Acordo', desc: 'Opcionalmente, transforme a decisão em um acordo permanente para situações futuras similares.' },
          ]
        },
        {
          title: 'Tipos de Voto',
          features: [
            { title: 'Concordar', desc: 'Aprovação total da decisão proposta no cenário escolhido.' },
            { title: 'Concordar com Condição', desc: 'Aprovação mediante ajustes específicos (ex: "Só se for em 10x sem juros").' },
            { title: 'Discordar', desc: 'Rejeição da proposta com explicação para promover diálogo construtivo.' },
            { title: 'Pausar', desc: 'Solicitar mais tempo para pensar ou aguardar momento financeiro mais adequado.' },
          ]
        },
        {
          title: 'Acordos do Casal',
          content: 'Acordos são regras permanentes criadas a partir de decisões comuns:',
          bullets: [
            'Limite de Compra Sem Consulta: Ex: "Compras até R$ 500 não precisam de aprovação prévia"',
            'Categorias Prioritárias: Ex: "Gastos com saúde sempre são aprovados automaticamente"',
            'Revisão Periódica: Acordos podem ter data de revisão para ajustes conforme mudanças na vida financeira',
            'Histórico de Compliance: Acompanhe se os acordos estão sendo respeitados por ambos',
          ]
        },
        {
          title: 'Mensagens Anti-Conflito',
          content: 'O sistema exibe mensagens motivacionais para manter a harmonia durante discussões financeiras:',
          bullets: [
            'Lembretes de que vocês são um time trabalhando pelo mesmo objetivo',
            'Frases de encorajamento durante momentos de discordância',
            'Celebrações quando decisões são tomadas em consenso',
            'Sugestões para conversar presencialmente em casos complexos',
          ]
        },
        {
          title: '',
          tipBox: {
            title: 'Dicas para Decisões Harmoniosas',
            content: 'Use a Central de Decisões como ferramenta de diálogo, não de confronto. Ouça a motivação do outro antes de votar. Para decisões grandes, agende uma conversa presencial usando os dados do sistema como base. Lembre-se: o objetivo é construir juntos, não "ganhar" uma discussão.'
          }
        },
        {
          title: '',
          premiumBox: {
            title: 'Recursos Premium de Decisões',
            content: 'Usuários Premium têm acesso à mediadora IA PrIscA, que oferece sugestões imparciais, identifica pontos de acordo e propõe compromissos para decisões difíceis.'
          }
        }
      ]
    },
    {
      id: 'relatorios',
      title: '17. Relatórios e Análises',
      icon: '📊',
      intro: 'Visualize relatórios detalhados e análises das suas finanças para tomar melhores decisões.',
      subSections: [
        {
          title: 'Relatórios Básicos',
          features: [
            { title: 'Fluxo de Caixa', desc: 'Acompanhe entradas vs saídas mensais com projeções para meses futuros baseadas em padrões históricos.' },
            { title: 'Gastos por Categoria', desc: 'Visualize distribuição percentual de gastos com gráficos de pizza e barras interativos.' },
            { title: 'Análise de Cartões', desc: 'Utilização de limites, gastos por cartão e otimização de benefícios recebidos.' },
            { title: 'Evolução Temporal', desc: 'Gráficos de linha mostrando evolução patrimonial, gastos mensais e tendências.' },
          ]
        },
        {
          title: 'Análises Avançadas',
          steps: [
            { num: 1, title: 'Comparativos Períodos', desc: 'Compare meses, trimestres ou anos para identificar sazonalidades e mudanças de comportamento financeiro.' },
            { num: 2, title: 'Análise de Metas', desc: 'Acompanhe progresso de todas as metas com projeções de quando serão atingidas baseadas no ritmo atual.' },
            { num: 3, title: 'Rentabilidade de Investimentos', desc: 'Performance detalhada do portfólio com comparações contra benchmarks (CDI, IPCA, IBOVESPA).' },
          ]
        },
        {
          title: 'Dashboards Interativos',
          bullets: [
            'Filtros Avançados: Por período, categoria, membro do casal, tipo de transação',
            'Drill-down: Clique em gráficos para ver detalhes específicos',
            'Exportação: PDF, Excel, CSV para análises externas',
            'Agendamento: Receba relatórios automáticos por email',
          ]
        },
        {
          title: 'Insights Automáticos',
          features: [
            { title: 'Detecção de Padrões', desc: 'IA identifica tendências: "Gastos com alimentação aumentaram 15% nos últimos 3 meses".' },
            { title: 'Alertas Inteligentes', desc: 'Notificações sobre gastos incomuns, aproximação de limites e oportunidades de economia.' },
            { title: 'Projeções', desc: 'Estimativas de saldos futuros e tempo para atingir metas baseadas em comportamento atual.' },
            { title: 'Oportunidades', desc: 'Sugestões para otimização: "Transferir R$ 5.000 para investimento pode render R$ 300 extras por ano".' },
          ]
        },
        {
          title: 'Personalização de Relatórios',
          bullets: [
            'Widgets Customizáveis: Escolha quais gráficos aparecem no dashboard principal',
            'Cores e Temas: Personalize aparência para sua preferência',
            'Frequência de Atualizações: Configure intervalos de refresh automático',
            'Métricas Favoritas: Destaque KPIs mais importantes para seu perfil',
          ]
        },
        {
          title: '',
          tipBox: {
            title: 'Usando Relatórios para Decisões',
            content: 'Transforme dados em ações concretas: Identifique categorias com gastos crescentes para ajustar orçamento, use análises de cartões para maximizar benefícios, monitore performance de investimentos para rebalanceamento, analise sazonalidades para planejar gastos futuros.'
          }
        },
        {
          title: '',
          premiumBox: {
            title: 'Relatórios Premium',
            content: 'Análises preditivas avançadas, comparações com benchmarks de mercado, relatórios personalizados por IA, integração com planilhas do Google e análises de risco automatizadas.'
          }
        }
      ]
    },
    {
      id: 'configuracoes',
      title: '18. Configurações e Perfil',
      icon: '⚙️',
      intro: 'Personalize sua experiência e configure preferências de segurança e privacidade.',
      subSections: [
        {
          title: 'Configurações Pessoais',
          steps: [
            { num: 1, title: 'Informações do Perfil', desc: 'Atualize nome, email, telefone, foto do perfil e informações pessoais. Mantenha dados sempre atualizados para melhor experiência.' },
            { num: 2, title: 'Preferências Regionais', desc: 'Configure idioma (português, inglês, espanhol), moeda principal, fuso horário e formato de data/hora.' },
            { num: 3, title: 'Tema e Interface', desc: 'Escolha entre modo claro/escuro, densidade de informações e configurações de acessibilidade.' },
          ]
        },
        {
          title: 'Segurança e Privacidade',
          features: [
            { title: 'Gestão de Senha', desc: 'Altere senha regularmente, ative autenticação de dois fatores e gerencie dispositivos conectados.' },
            { title: 'Autenticação 2FA', desc: 'Configure 2FA via SMS, app autenticador ou email para segurança adicional em acessos.' },
            { title: 'Histórico de Acesso', desc: 'Monitore logins recentes, dispositivos utilizados e localizações de acesso.' },
            { title: 'Privacidade de Dados', desc: 'Configure níveis de compartilhamento, backup automático e retenção de dados históricos.' },
          ]
        },
        {
          title: 'Sistema de Notificações',
          steps: [
            { num: 1, title: 'Preferências de Notificação', desc: 'Configure quais eventos geram alertas: vencimentos, metas atingidas, gastos incomuns, novos recursos.' },
            { num: 2, title: 'Canais de Comunicação', desc: 'Escolha como receber notificações: email, SMS, push no app, WhatsApp (Premium).' },
            { num: 3, title: 'Frequência e Horários', desc: 'Defina horários para receber resumos diários/semanais e configure modo "não perturbe".' },
          ]
        },
        {
          title: 'Configurações Financeiras',
          bullets: [
            'Moeda Principal: Real brasileiro, Dólar americano, Euro ou outras',
            'Casas Decimais: Precisão para exibição de valores monetários',
            'Categorias Padrão: Personalização das categorias que aparecem primeiro',
            'Metas Automáticas: Configuração de metas recorrentes mensais/anuais',
          ]
        },
        {
          title: 'Backup e Sincronização',
          bullets: [
            'Backup Automático: Dados salvos na nuvem diariamente',
            'Sincronização Multi-dispositivo: Acesso sincronizado entre celular, tablet e computador',
            'Exportação de Dados: Download completo em formatos padrão (JSON, CSV)',
            'Importação: Migração de dados de outras plataformas financeiras',
          ]
        },
        {
          title: '',
          warningBox: {
            title: 'Segurança Recomendada',
            content: 'Para máxima segurança: ative 2FA, use senha única e forte, revise dispositivos conectados mensalmente, mantenha email de recuperação atualizado e configure alertas de acesso suspeito.'
          }
        },
        {
          title: '',
          tipBox: {
            title: 'Otimização de Performance',
            content: 'Para melhor experiência: mantenha apenas widgets essenciais no dashboard, configure períodos adequados aos seus hábitos de análise, use categorias consistentes e revise configurações trimestralmente.'
          }
        }
      ]
    },
    {
      id: 'parcerias',
      title: '19. Programa de Parcerias',
      icon: '🤝',
      intro: 'Monetize sua rede compartilhando o Couples Financials e ganhe comissões.',
      subSections: [
        {
          title: 'Sistema de Afiliados',
          features: [
            { title: 'Benefícios para Você', desc: 'Comissões recorrentes de U$5 a U$12 Dólares por assinatura ANUAL realizada com seu código. Bônus por metas e campanhas sazonais. Recebimento em até 45 dias.' },
            { title: 'Link Personalizado', desc: 'Receba seu link único de afiliado para rastrear conversões e comissões de forma transparente.' },
            { title: 'Dashboard de Afiliado', desc: 'Monitore cliques, conversões, comissões ganhas e pendentes em tempo real.' },
            { title: 'Pagamentos Mensais', desc: 'Receba comissões mensalmente via PIX, transferência bancária ou PayPal.' },
          ]
        },
        {
          title: 'Kit de Materiais Marketing',
          steps: [
            { num: 1, title: 'Recursos Visuais', desc: 'Banners em diversos tamanhos, logos, ícones, templates para stories do Instagram, posts para LinkedIn e Facebook.' },
            { num: 2, title: 'Conteúdo Escrito', desc: 'Scripts para vídeos, textos para posts, templates de email marketing e artigos para blogs.' },
            { num: 3, title: 'Recursos Interativos', desc: 'Vídeos demonstrativos, webinars gravados, apresentações e calculadoras financeiras personalizadas.' },
          ]
        },
        {
          title: 'Perfis Ideais para Parceria',
          bullets: [
            'Influenciadores Financeiros: Criadores de conteúdo sobre finanças pessoais',
            'Casais Influencers: Perfis que compartilham vida a dois e planejamento conjunto',
            'Educadores: Professores, coaches e consultores financeiros',
            'Blogueiros: Escritores de blogs sobre relacionamentos e finanças',
            'YouTubers: Criadores de vídeos educacionais e de lifestyle',
          ]
        },
        {
          title: '',
          premiumBox: {
            title: 'Programa VIP para Super Parceiros',
            content: 'Parceiros de alta performance têm acesso a: participação em decisões de produto, beta testing de novas funcionalidades, eventos exclusivos, comissões especiais e co-marketing personalizado.'
          }
        },
        {
          title: '',
          tipBox: {
            title: 'Dicas para Sucesso como Afiliado',
            content: 'Conheça profundamente o produto, compartilhe experiências genuínas, foque em educar sua audiência sobre finanças, use dados e resultados reais, engaje com comentários e dúvidas, e mantenha consistência na divulgação.'
          }
        },
        {
          title: '',
          warningBox: {
            title: 'Termos e Condições',
            content: 'Leia atentamente o contrato de afiliados. Práticas proibidas: spam, compras falsas, publicidade enganosa. Comissões são pagas apenas para conversões legítimas. Reservamo-nos o direito de revisar e aprovar materiais de marketing.'
          }
        }
      ]
    },
    {
      id: 'solucoes',
      title: '20. Solução de Problemas',
      icon: '🛠️',
      intro: 'Encontre respostas para problemas comuns e saiba como obter suporte.',
      subSections: [
        {
          title: 'Perguntas Frequentes (FAQ)',
          features: [
            { title: 'Esqueci minha senha', desc: 'Use "Esqueci senha" na tela de login. Verifique spam/lixo eletrônico. Se não receber, entre em contato conosco.' },
            { title: 'Saldos não conferem', desc: 'Verifique se todas as transações foram registradas corretamente. Compare com extratos bancários reais.' },
            { title: 'App não sincroniza', desc: 'Verifique conexão com internet. Force fechamento e reabra o app. Faça logout/login se necessário.' },
            { title: 'Problemas com convite de casal', desc: 'Verifique se email está correto. Cônjuge deve usar o mesmo email do convite para criar conta.' },
          ]
        },
        {
          title: 'Problemas Técnicos Comuns',
          steps: [
            { num: 1, title: 'Problemas de Login', desc: 'Sintomas: Não consegue entrar, erro de credenciais. Soluções: Verifique caps lock, limpe cache do navegador, tente navegador diferente, reset de senha.' },
            { num: 2, title: 'Lentidão na Plataforma', desc: 'Sintomas: Sistema carrega devagar, timeouts. Soluções: Verifique velocidade da internet, feche outras abas, limpe cache, use conexão mais estável.' },
            { num: 3, title: 'Dados Não Aparecem', desc: 'Sintomas: Transações, gráficos ou saldos em branco. Soluções: Recarregue página, verifique filtros aplicados, aguarde alguns minutos, entre em contato se persistir.' },
          ]
        },
        {
          title: 'Problemas com Dados Financeiros',
          bullets: [
            'Categorização Incorreta: Edite transações individuais ou atualize regras automáticas',
            'Duplicatas: Use função "Detectar Duplicatas" ou delete manualmente',
            'Valores Incorretos: Sempre confirme valores antes de salvar transações',
            'Datas Erradas: Verifique fuso horário nas configurações',
          ]
        },
        {
          title: 'Problemas com Cartões e Contas',
          features: [
            { title: 'Limite Incorreto', desc: 'Edite informações do cartão nas configurações. Confirme com dados reais da instituição financeira.' },
            { title: 'Datas de Vencimento', desc: 'Verifique datas de fechamento vs vencimento. Confirme se está configurado corretamente no sistema.' },
            { title: 'Saldo Bancário', desc: 'Compare com extratos oficiais. Registre transferências e saques que podem ter passado despercebidos.' },
            { title: 'Transferências', desc: 'Confirme se transferência foi registrada em ambas as contas (origem e destino).' },
          ]
        },
        {
          title: 'Canais de Suporte',
          features: [
            { title: 'Chat Online', desc: 'Disponível 24/7 para usuários Premium. Resposta em até 2 horas durante horário comercial.' },
            { title: 'Email Support', desc: 'suporte@couplesfinancials.com - Resposta em até 24h para usuários gratuitos, 4h para Premium.' },
            { title: 'WhatsApp Business', desc: 'Para usuários Premium: atendimento via WhatsApp com suporte técnico especializado.' },
            { title: 'Central de Ajuda', desc: 'Base de conhecimento completa com tutoriais, vídeos e soluções detalhadas.' },
          ]
        },
        {
          title: '',
          warningBox: {
            title: 'Atividade Suspeita',
            content: 'Se suspeitar de acesso não autorizado: Altere senha imediatamente, revise histórico de acessos, desconecte todos os dispositivos, ative autenticação de dois fatores, entre em contato conosco urgentemente.'
          }
        },
        {
          title: 'Relatando Bugs',
          steps: [
            { num: 1, title: 'Documente o Problema', desc: 'Anote: o que estava fazendo, mensagem de erro exata, browser/dispositivo usado, horário do problema.' },
            { num: 2, title: 'Screenshots e Evidências', desc: 'Capture telas do erro, copie URLs problemáticas, exporte dados se relevante.' },
            { num: 3, title: 'Entre em Contato', desc: 'Use canal de suporte com todas as informações coletadas. Seja específico e detalhado.' },
          ]
        },
        {
          title: '',
          tipBox: {
            title: 'Para Resolução Mais Rápida',
            content: 'Seja específico ao descrever problemas, forneça screenshots quando possível, inclua informações do dispositivo/browser, teste em navegador diferente antes de reportar, e tenha paciência - nossa equipe está sempre trabalhando para melhorar sua experiência.'
          }
        }
      ]
    }
  ],
  footer: {
    support: 'Suporte',
    email: 'suporte@couplesfinancials.com',
    website: 'www.couplesfinancials.com',
    copyright: '© 2024 Couples Financials. Todos os direitos reservados.'
  }
});

// English content - Full translation
const getTutorialContentEN = (): TutorialContent => {
  const ptContent = getTutorialContentPT();
  
  // Translation map for section titles
  const sectionTitleMap: Record<string, string> = {
    '1. Introdução': '1. Introduction',
    '2. Primeiros Passos': '2. Getting Started',
    '3. Dashboard Financeiro': '3. Financial Dashboard',
    '4. Gerenciando Transações': '4. Managing Transactions',
    '5. Gestão de Contas Bancárias': '5. Bank Account Management',
    '6. Gestão de Cartões': '6. Card Management',
    '7. Despesas Mensais': '7. Monthly Expenses',
    '8. Despesas Recorrentes': '8. Recurring Expenses',
    '9. Fluxo de Caixa': '9. Cash Flow',
    '10. Controle de Investimentos': '10. Investment Management',
    '11. Sistema de Milhas': '11. Mileage System',
    '12. Imposto de Renda (Brasil)': '12. Income Tax (Brazil)',
    '13. Converter de Extratos': '13. Statement Converter',
    '14. Recursos de IA': '14. AI Features',
    '15. Funcionalidades para Casais': '15. Couple Features',
    '16. Central de Decisões': '16. Decision Center',
    '17. Relatórios e Análises': '17. Reports and Analytics',
    '18. Configurações e Perfil': '18. Settings and Profile',
    '19. Programa de Parcerias': '19. Partnership Program',
    '20. Solução de Problemas': '20. Troubleshooting',
  };

  // Translation map for section intros
  const sectionIntroMap: Record<string, string> = {
    'introducao': 'Couples Financials is a complete financial management platform designed especially for couples who want to organize their finances collaboratively and intelligently.',
    'primeiros-passos': 'Follow the steps below to set up your account and start using the platform.',
    'dashboard': 'The dashboard is the control center of your finances, presenting essential information visually and intuitively.',
    'transacoes': 'Record and organize all your financial transactions simply and efficiently.',
    'contas': 'Manage all your bank accounts in one place with precise balance control.',
    'cartoes': 'Complete control of your credit cards with invoice management, limits, and payments.',
    'despesas-mensais': 'Complete view of monthly expenses organized by status: current, future, and overdue.',
    'despesas-recorrentes': 'Automatic management of fixed expenses that repeat monthly, such as subscriptions and bills.',
    'fluxo-caixa': 'Consolidated view of all inflows and outflows that affect your actual bank balance.',
    'investimentos': 'Track your investment portfolio with profitability and performance analysis.',
    'milhas': 'Track and optimize your airline miles with smart accumulation and redemption strategies. Connect your loyalty programs and sync balances automatically via Chrome extension.',
    'imposto-renda': 'Complete module to organize your annual Income Tax return. Brazil version available - other versions under construction.',
    'converter': 'Import and process bank statements automatically with OCR and AI technology.',
    'ia': 'Use artificial intelligence to get personalized financial insights and automate tasks.',
    'casais': 'Special tools for collaborative financial management between couples.',
    'decisoes': 'Make financial decisions together with your partner in a structured way, avoiding conflicts and promoting harmony.',
    'relatorios': 'View detailed reports and analyses of your finances to make better decisions.',
    'configuracoes': 'Customize your experience and configure security and privacy preferences.',
    'parcerias': 'Monetize your network by sharing Couples Financials and earn commissions.',
    'solucoes': 'Find answers to common problems and learn how to get support.',
  };

  return {
    title: 'Complete Tutorial',
    subtitle: 'Couples Financials',
    tagline: 'The ultimate guide to mastering your finances as a couple',
    tableOfContents: 'Table of Contents',
    page: 'Page',
    sections: ptContent.sections.map(section => ({
      ...section,
      title: sectionTitleMap[section.title] || section.title,
      intro: sectionIntroMap[section.id] || section.intro,
    })),
    footer: {
      support: 'Support',
      email: 'support@couplesfinancials.com',
      website: 'www.couplesfinancials.com',
      copyright: '© 2024 Couples Financials. All rights reserved.'
    }
  };
};

// Spanish content - Full translation
const getTutorialContentES = (): TutorialContent => {
  const ptContent = getTutorialContentPT();
  
  // Translation map for section titles
  const sectionTitleMap: Record<string, string> = {
    '1. Introdução': '1. Introducción',
    '2. Primeiros Passos': '2. Primeros Pasos',
    '3. Dashboard Financeiro': '3. Panel Financiero',
    '4. Gerenciando Transações': '4. Gestión de Transacciones',
    '5. Gestão de Contas Bancárias': '5. Gestión de Cuentas Bancarias',
    '6. Gestão de Cartões': '6. Gestión de Tarjetas',
    '7. Despesas Mensais': '7. Gastos Mensuales',
    '8. Despesas Recorrentes': '8. Gastos Recurrentes',
    '9. Fluxo de Caixa': '9. Flujo de Caja',
    '10. Controle de Investimentos': '10. Control de Inversiones',
    '11. Sistema de Milhas': '11. Sistema de Millas',
    '12. Imposto de Renda (Brasil)': '12. Impuesto de Renta (Brasil)',
    '13. Converter de Extratos': '13. Convertidor de Extractos',
    '14. Recursos de IA': '14. Recursos de IA',
    '15. Funcionalidades para Casais': '15. Funcionalidades para Parejas',
    '16. Central de Decisões': '16. Central de Decisiones',
    '17. Relatórios e Análises': '17. Informes y Análisis',
    '18. Configurações e Perfil': '18. Configuración y Perfil',
    '19. Programa de Parcerias': '19. Programa de Socios',
    '20. Solução de Problemas': '20. Solución de Problemas',
  };

  // Translation map for section intros
  const sectionIntroMap: Record<string, string> = {
    'introducao': 'Couples Financials es una plataforma completa de gestión financiera diseñada especialmente para parejas que desean organizar sus finanzas de forma colaborativa e inteligente.',
    'primeiros-passos': 'Sigue los pasos a continuación para configurar tu cuenta y empezar a usar la plataforma.',
    'dashboard': 'El panel es el centro de control de tus finanzas, presentando información esencial de forma visual e intuitiva.',
    'transacoes': 'Registra y organiza todas tus transacciones financieras de forma simple y eficiente.',
    'contas': 'Gestiona todas tus cuentas bancarias en un solo lugar con control preciso de saldos.',
    'cartoes': 'Control completo de tus tarjetas de crédito con gestión de facturas, límites y pagos.',
    'despesas-mensais': 'Vista completa de los gastos mensuales organizados por estado: actuales, futuros y atrasados.',
    'despesas-recorrentes': 'Gestión automática de gastos fijos que se repiten mensualmente, como suscripciones y facturas.',
    'fluxo-caixa': 'Vista consolidada de todas las entradas y salidas que afectan tu saldo bancario real.',
    'investimentos': 'Acompaña tu cartera de inversiones con análisis de rentabilidad y rendimiento.',
    'milhas': 'Acompaña y optimiza tus millas aéreas con estrategias inteligentes de acumulación y canje. Conecta tus programas de fidelidad y sincroniza saldos automáticamente con la extensión de Chrome.',
    'imposto-renda': 'Módulo completo para organizar tu declaración anual del Impuesto de Renta. Versión Brasil disponible - otras versiones en construcción.',
    'converter': 'Importa y procesa extractos bancarios automáticamente con tecnología OCR e IA.',
    'ia': 'Usa inteligencia artificial para obtener insights financieros personalizados y automatizar tareas.',
    'casais': 'Herramientas especiales para gestión financiera colaborativa entre parejas.',
    'decisoes': 'Toma decisiones financieras junto con tu pareja de forma estructurada, evitando conflictos y promoviendo armonía.',
    'relatorios': 'Visualiza informes detallados y análisis de tus finanzas para tomar mejores decisiones.',
    'configuracoes': 'Personaliza tu experiencia y configura preferencias de seguridad y privacidad.',
    'parcerias': 'Monetiza tu red compartiendo Couples Financials y gana comisiones.',
    'solucoes': 'Encuentra respuestas a problemas comunes y aprende cómo obtener soporte.',
  };

  return {
    title: 'Tutorial Completo',
    subtitle: 'Couples Financials',
    tagline: 'La guía definitiva para dominar tus finanzas en pareja',
    tableOfContents: 'Índice',
    page: 'Página',
    sections: ptContent.sections.map(section => ({
      ...section,
      title: sectionTitleMap[section.title] || section.title,
      intro: sectionIntroMap[section.id] || section.intro,
    })),
    footer: {
      support: 'Soporte',
      email: 'soporte@couplesfinancials.com',
      website: 'www.couplesfinancials.com',
      copyright: '© 2024 Couples Financials. Todos los derechos reservados.'
    }
  };
};

const getTutorialContent = (language: Language): TutorialContent => {
  switch (language) {
    case 'en':
      return getTutorialContentEN();
    case 'es':
      return getTutorialContentES();
    default:
      return getTutorialContentPT();
  }
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
  fillColor?: [number, number, number]
) => {
  if (fillColor) {
    pdf.setFillColor(fillColor[0], fillColor[1], fillColor[2]);
  }
  pdf.roundedRect(x, y, width, height, radius, radius, fillColor ? 'F' : 'S');
};

// Draw gradient header
const drawHeader = (pdf: jsPDF, title: string, subtitle: string, tagline: string) => {
  const pageWidth = pdf.internal.pageSize.getWidth();
  
  pdf.setFillColor(colors.primary[0], colors.primary[1], colors.primary[2]);
  pdf.rect(0, 0, pageWidth, 60, 'F');
  
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'normal');
  pdf.text(subtitle, pageWidth / 2, 20, { align: 'center' });
  
  pdf.setFontSize(28);
  pdf.setFont('helvetica', 'bold');
  pdf.text(title, pageWidth / 2, 35, { align: 'center' });
  
  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'normal');
  pdf.text(sanitizeForPDF(tagline), pageWidth / 2, 50, { align: 'center' });
};

// Draw section header
const drawSectionHeader = (pdf: jsPDF, title: string, y: number): number => {
  const pageWidth = pdf.internal.pageSize.getWidth();
  const margin = 15;
  
  pdf.setFillColor(colors.primary[0], colors.primary[1], colors.primary[2]);
  pdf.rect(margin, y, pageWidth - 2 * margin, 12, 'F');
  
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.text(sanitizeForPDF(title), margin + 5, y + 8);
  
  return y + 18;
};

// Draw subsection title
const drawSubSectionTitle = (pdf: jsPDF, title: string, x: number, y: number): number => {
  if (!title) return y;
  
  pdf.setTextColor(colors.secondary[0], colors.secondary[1], colors.secondary[2]);
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'bold');
  pdf.text(sanitizeForPDF(title), x, y);
  
  return y + 8;
};

// Draw paragraph text
const drawParagraph = (pdf: jsPDF, text: string, x: number, y: number, width: number): number => {
  pdf.setTextColor(colors.textDark[0], colors.textDark[1], colors.textDark[2]);
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'normal');
  const lines = pdf.splitTextToSize(sanitizeForPDF(text), width);
  pdf.text(lines, x, y);
  return y + lines.length * 4.5 + 3;
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
  const descLines = pdf.splitTextToSize(sanitizeForPDF(description), width - 12);
  const height = 14 + descLines.length * 4;
  
  drawRoundedRect(pdf, x, y, width, height, 3, colors.bgCard);
  
  pdf.setFillColor(colors.primary[0], colors.primary[1], colors.primary[2]);
  pdf.rect(x, y, 3, height, 'F');
  
  pdf.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2]);
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'bold');
  pdf.text(sanitizeForPDF(title), x + 8, y + 8);
  
  pdf.setTextColor(colors.textMuted[0], colors.textMuted[1], colors.textMuted[2]);
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'normal');
  pdf.text(descLines, x + 8, y + 14);
  
  return height + 4;
};

// Draw bullet list
const drawBulletList = (pdf: jsPDF, bullets: string[], x: number, y: number, width: number): number => {
  let currentY = y;
  
  bullets.forEach((bullet) => {
    const cleanBullet = sanitizeForPDF(bullet);
    const parts = cleanBullet.split(':');
    
    pdf.setFillColor(colors.primary[0], colors.primary[1], colors.primary[2]);
    pdf.circle(x + 2, currentY - 1.5, 1.2, 'F');
    
    if (parts.length > 1) {
      pdf.setTextColor(colors.textDark[0], colors.textDark[1], colors.textDark[2]);
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'bold');
      pdf.text(parts[0] + ':', x + 6, currentY);
      
      pdf.setFont('helvetica', 'normal');
      const restText = parts.slice(1).join(':').trim();
      const lines = pdf.splitTextToSize(restText, width - 10);
      pdf.text(lines, x + 6 + pdf.getTextWidth(parts[0] + ': '), currentY);
      currentY += Math.max(5, lines.length * 4);
    } else {
      pdf.setTextColor(colors.textDark[0], colors.textDark[1], colors.textDark[2]);
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'normal');
      const lines = pdf.splitTextToSize(cleanBullet, width - 10);
      pdf.text(lines, x + 6, currentY);
      currentY += lines.length * 4.5;
    }
  });
  
  return currentY + 3;
};

// Draw tip box
const drawTipBox = (pdf: jsPDF, title: string, content: string, x: number, y: number, width: number): number => {
  const lines = pdf.splitTextToSize(sanitizeForPDF(content), width - 20);
  const height = 18 + lines.length * 4;
  
  pdf.setFillColor(220, 252, 231);
  drawRoundedRect(pdf, x, y, width, height, 3, [220, 252, 231]);
  
  pdf.setFillColor(colors.success[0], colors.success[1], colors.success[2]);
  pdf.rect(x, y, 4, height, 'F');
  
  pdf.setTextColor(colors.success[0], colors.success[1], colors.success[2]);
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'bold');
  pdf.text(sanitizeForPDF(title), x + 10, y + 9);
  
  pdf.setTextColor(colors.textDark[0], colors.textDark[1], colors.textDark[2]);
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'normal');
  pdf.text(lines, x + 10, y + 16);
  
  return y + height + 6;
};

// Draw warning box
const drawWarningBox = (pdf: jsPDF, title: string, content: string, x: number, y: number, width: number): number => {
  const lines = pdf.splitTextToSize(sanitizeForPDF(content), width - 20);
  const height = 18 + lines.length * 4;
  
  pdf.setFillColor(254, 243, 199);
  drawRoundedRect(pdf, x, y, width, height, 3, [254, 243, 199]);
  
  pdf.setFillColor(colors.warning[0], colors.warning[1], colors.warning[2]);
  pdf.rect(x, y, 4, height, 'F');
  
  pdf.setTextColor(180, 83, 9);
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'bold');
  pdf.text(sanitizeForPDF(title), x + 10, y + 9);
  
  pdf.setTextColor(colors.textDark[0], colors.textDark[1], colors.textDark[2]);
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'normal');
  pdf.text(lines, x + 10, y + 16);
  
  return y + height + 6;
};

// Draw premium box
const drawPremiumBox = (pdf: jsPDF, title: string, content: string, x: number, y: number, width: number): number => {
  const lines = pdf.splitTextToSize(sanitizeForPDF(content), width - 20);
  const height = 18 + lines.length * 4;
  
  pdf.setFillColor(237, 233, 254);
  drawRoundedRect(pdf, x, y, width, height, 3, [237, 233, 254]);
  
  pdf.setFillColor(colors.premium[0], colors.premium[1], colors.premium[2]);
  pdf.rect(x, y, 4, height, 'F');
  
  pdf.setTextColor(colors.premium[0], colors.premium[1], colors.premium[2]);
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'bold');
  pdf.text(sanitizeForPDF(title), x + 10, y + 9);
  
  pdf.setTextColor(colors.textDark[0], colors.textDark[1], colors.textDark[2]);
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'normal');
  pdf.text(lines, x + 10, y + 16);
  
  return y + height + 6;
};

// Draw numbered step
const drawStep = (pdf: jsPDF, num: number, title: string, desc: string, x: number, y: number, width: number): number => {
  const circleRadius = 8;
  
  pdf.setFillColor(colors.primary[0], colors.primary[1], colors.primary[2]);
  pdf.circle(x + circleRadius, y + circleRadius, circleRadius, 'F');
  
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'bold');
  pdf.text(num.toString(), x + circleRadius, y + circleRadius + 3.5, { align: 'center' });
  
  pdf.setTextColor(colors.textDark[0], colors.textDark[1], colors.textDark[2]);
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'bold');
  pdf.text(sanitizeForPDF(title), x + 22, y + 6);
  
  pdf.setTextColor(colors.textMuted[0], colors.textMuted[1], colors.textMuted[2]);
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'normal');
  const lines = pdf.splitTextToSize(sanitizeForPDF(desc), width - 28);
  pdf.text(lines, x + 22, y + 12);
  
  return y + Math.max(22, 12 + lines.length * 4);
};

// Draw page footer
const drawFooter = (pdf: jsPDF, pageNum: number, totalPages: number, pageLabel: string) => {
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  
  pdf.setTextColor(colors.textMuted[0], colors.textMuted[1], colors.textMuted[2]);
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'normal');
  
  pdf.text('Couples Financials', 15, pageHeight - 10);
  pdf.text(`${pageLabel} ${pageNum} / ${totalPages}`, pageWidth - 15, pageHeight - 10, { align: 'right' });
};

// Check if we need a new page
const checkNewPage = (pdf: jsPDF, currentY: number, neededHeight: number, margin: number): number => {
  const pageHeight = pdf.internal.pageSize.getHeight();
  if (currentY + neededHeight > pageHeight - margin - 15) {
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
    
    let totalPages = content.sections.length + 2;
    
    // Page 1: Cover
    drawHeader(pdf, content.title, content.subtitle, content.tagline);
    
    let currentY = 75;
    
    // Table of Contents
    pdf.setTextColor(colors.textDark[0], colors.textDark[1], colors.textDark[2]);
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text(content.tableOfContents, margin, currentY);
    currentY += 10;
    
    // TOC items in 2 columns
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    
    const halfSections = Math.ceil(content.sections.length / 2);
    content.sections.forEach((section, index) => {
      const col = index < halfSections ? 0 : 1;
      const row = index < halfSections ? index : index - halfSections;
      const x = margin + col * (contentWidth / 2);
      const y = currentY + row * 8;
      
      pdf.setTextColor(colors.textMuted[0], colors.textMuted[1], colors.textMuted[2]);
      pdf.text(sanitizeForPDF(section.title), x, y);
    });
    
    currentY += halfSections * 8 + 10;
    
    // Intro box
    pdf.setFillColor(colors.bgCard[0], colors.bgCard[1], colors.bgCard[2]);
    drawRoundedRect(pdf, margin, currentY, contentWidth, 35, 5, colors.bgCard);
    
    pdf.setTextColor(colors.textDark[0], colors.textDark[1], colors.textDark[2]);
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    const introLines = pdf.splitTextToSize(sanitizeForPDF(content.sections[0].intro), contentWidth - 20);
    pdf.text(introLines, margin + 10, currentY + 12);
    
    drawFooter(pdf, 1, totalPages, content.page);
    
    // Generate each section
    content.sections.forEach((section, sectionIndex) => {
      pdf.addPage();
      currentY = margin;
      
      // Section header
      currentY = drawSectionHeader(pdf, section.title, currentY);
      currentY += 3;
      
      // Section intro
      currentY = drawParagraph(pdf, section.intro, margin, currentY, contentWidth);
      currentY += 2;
      
      // Process each subsection
      section.subSections.forEach((subSection) => {
        // SubSection title
        if (subSection.title) {
          currentY = checkNewPage(pdf, currentY, 20, margin);
          currentY = drawSubSectionTitle(pdf, subSection.title, margin, currentY);
        }
        
        // Content paragraph
        if (subSection.content) {
          currentY = checkNewPage(pdf, currentY, 15, margin);
          currentY = drawParagraph(pdf, subSection.content, margin, currentY, contentWidth);
        }
        
        // Steps
        if (subSection.steps && subSection.steps.length > 0) {
          subSection.steps.forEach((step) => {
            currentY = checkNewPage(pdf, currentY, 28, margin);
            currentY = drawStep(pdf, step.num, step.title, step.desc, margin, currentY, contentWidth);
          });
        }
        
        // Features (2 columns)
        if (subSection.features && subSection.features.length > 0) {
          const cardWidth = (contentWidth - 5) / 2;
          
          for (let i = 0; i < subSection.features.length; i += 2) {
            currentY = checkNewPage(pdf, currentY, 35, margin);
            
            const feature1 = subSection.features[i];
            const height1 = drawFeatureCard(pdf, feature1.title, feature1.desc, margin, currentY, cardWidth);
            
            let height2 = 0;
            if (i + 1 < subSection.features.length) {
              const feature2 = subSection.features[i + 1];
              height2 = drawFeatureCard(pdf, feature2.title, feature2.desc, margin + cardWidth + 5, currentY, cardWidth);
            }
            
            currentY += Math.max(height1, height2);
          }
        }
        
        // Bullets
        if (subSection.bullets && subSection.bullets.length > 0) {
          currentY = checkNewPage(pdf, currentY, 30, margin);
          currentY = drawBulletList(pdf, subSection.bullets, margin, currentY, contentWidth);
        }
        
        // Tip box
        if (subSection.tipBox) {
          currentY = checkNewPage(pdf, currentY, 35, margin);
          currentY = drawTipBox(pdf, subSection.tipBox.title, subSection.tipBox.content, margin, currentY, contentWidth);
        }
        
        // Warning box
        if (subSection.warningBox) {
          currentY = checkNewPage(pdf, currentY, 35, margin);
          currentY = drawWarningBox(pdf, subSection.warningBox.title, subSection.warningBox.content, margin, currentY, contentWidth);
        }
        
        // Premium box
        if (subSection.premiumBox) {
          currentY = checkNewPage(pdf, currentY, 35, margin);
          currentY = drawPremiumBox(pdf, subSection.premiumBox.title, subSection.premiumBox.content, margin, currentY, contentWidth);
        }
      });
      
      // Comparison table (for section 1)
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
            1: { halign: 'center', cellWidth: 25 },
            2: { halign: 'center', cellWidth: 25 },
          },
          styles: {
            cellPadding: 2,
          },
        });
        
        currentY = (pdf as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;
      }
      
      drawFooter(pdf, sectionIndex + 2, totalPages, content.page);
    });
    
    // Final page
    pdf.addPage();
    currentY = pageHeight / 2 - 30;
    
    pdf.setFillColor(colors.primary[0], colors.primary[1], colors.primary[2]);
    pdf.circle(pageWidth / 2, currentY, 20, 'F');
    
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(24);
    pdf.setFont('helvetica', 'bold');
    pdf.text('CF', pageWidth / 2, currentY + 8, { align: 'center' });
    
    currentY += 35;
    
    pdf.setTextColor(colors.textDark[0], colors.textDark[1], colors.textDark[2]);
    pdf.setFontSize(18);
    pdf.setFont('helvetica', 'bold');
    pdf.text(content.subtitle, pageWidth / 2, currentY, { align: 'center' });
    
    currentY += 15;
    
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
