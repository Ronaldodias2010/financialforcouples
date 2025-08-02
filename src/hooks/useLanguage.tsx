import { createContext, useContext, useState, ReactNode } from 'react';

interface LanguageContextType {
  language: 'pt' | 'en';
  setLanguage: (lang: 'pt' | 'en') => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const translations = {
  pt: {
    // Dashboard
    'dashboard.title': 'Gestão Financeira para Casais',
    'dashboard.subtitle': 'Controle suas finanças de forma inteligente',
    'dashboard.balance': 'Saldo Total',
    'dashboard.income': 'Receitas',
    'dashboard.expenses': 'Despesas',
    'dashboard.addTransaction': 'Adicionar Transação',
    'dashboard.viewMode': 'Modo de Visualização',
    'dashboard.both': 'Ambos',
    'dashboard.user1': 'Usuário 1',
    'dashboard.user2': 'Usuário 2',
    
    // Navigation
    'nav.dashboard': 'Dashboard',
    'nav.monthlyExpenses': 'Gastos Mensais',
    'nav.categories': 'Categorias',
    'nav.recurring': 'Gastos Recorrentes',
    'nav.cards': 'Cartões',
    'nav.accounts': 'Contas',
    'nav.profile': 'Perfil',
    'nav.back': 'Voltar',
    
    // Transactions
    'transaction.add': 'Adicionar Transação',
    'transaction.type': 'Tipo',
    'transaction.income': 'Receita',
    'transaction.expense': 'Despesa',
    'transaction.amount': 'Valor',
    'transaction.description': 'Descrição',
    'transaction.category': 'Categoria',
    'transaction.date': 'Data',
    'transaction.paymentMethod': 'Método de Pagamento',
    'transaction.cash': 'Dinheiro',
    'transaction.creditCard': 'Cartão de Crédito',
    'transaction.debitCard': 'Cartão de Débito',
    'transaction.bankTransfer': 'Transferência Bancária',
    'transaction.pix': 'PIX',
    'transaction.submit': 'Adicionar',
    'transaction.submitting': 'Adicionando...',
    
    // Cards
    'cards.title': 'Gerenciar Cartões',
    'cards.add': 'Adicionar Cartão',
    'cards.name': 'Nome do Cartão',
    'cards.type': 'Tipo do Cartão',
    'cards.credit': 'Crédito',
    'cards.debit': 'Débito',
    'cards.lastFourDigits': 'Últimos 4 Dígitos',
    'cards.creditLimit': 'Limite de Crédito',
    'cards.currentBalance': 'Saldo Atual',
    'cards.currency': 'Moeda',
    'cards.dueDate': 'Data de Vencimento',
    'cards.selectType': 'Selecione o tipo',
    'cards.selectDay': 'Selecione o dia',
    'cards.adding': 'Adicionando...',
    'cards.addCard': 'Adicionar Cartão',
    
    // Accounts
    'accounts.title': 'Gerenciar Contas',
    'accounts.add': 'Adicionar Conta',
    'accounts.name': 'Nome da Conta',
    'accounts.type': 'Tipo da Conta',
    'accounts.checking': 'Conta Corrente',
    'accounts.savings': 'Poupança',
    'accounts.investment': 'Investimento',
    'accounts.balance': 'Saldo',
    'accounts.bank': 'Banco',
    'accounts.selectType': 'Selecione o tipo',
    'accounts.adding': 'Adicionando...',
    'accounts.addAccount': 'Adicionar Conta',
    
    // Categories
    'categories.title': 'Gerenciar Categorias',
    'categories.add': 'Adicionar Categoria',
    'categories.name': 'Nome da Categoria',
    'categories.adding': 'Adicionando...',
    'categories.addCategory': 'Adicionar Categoria',
    
    // Messages
    'messages.cardAdded': 'Cartão adicionado com sucesso!',
    'messages.cardError': 'Erro ao adicionar cartão',
    'messages.accountAdded': 'Conta adicionada com sucesso!',
    'messages.accountError': 'Erro ao adicionar conta',
    'messages.categoryAdded': 'Categoria adicionada com sucesso!',
    'messages.categoryError': 'Erro ao adicionar categoria',
    'messages.transactionAdded': 'Transação adicionada com sucesso!',
    'messages.transactionError': 'Erro ao adicionar transação',
    
    // Common
    'common.required': 'obrigatório',
    'common.cancel': 'Cancelar',
    'common.save': 'Salvar',
    'common.edit': 'Editar',
    'common.delete': 'Excluir',
    'common.loading': 'Carregando...',
    'common.search': 'Pesquisar',
    'common.filter': 'Filtrar',
    'common.all': 'Todos',
    'common.none': 'Nenhum',
    'common.select': 'Selecionar',
  },
  en: {
    // Dashboard
    'dashboard.title': 'Financial Management for Couples',
    'dashboard.subtitle': 'Control your finances intelligently',
    'dashboard.balance': 'Total Balance',
    'dashboard.income': 'Income',
    'dashboard.expenses': 'Expenses',
    'dashboard.addTransaction': 'Add Transaction',
    'dashboard.viewMode': 'View Mode',
    'dashboard.both': 'Both',
    'dashboard.user1': 'User 1',
    'dashboard.user2': 'User 2',
    
    // Navigation
    'nav.dashboard': 'Dashboard',
    'nav.monthlyExpenses': 'Monthly Expenses',
    'nav.categories': 'Categories',
    'nav.recurring': 'Recurring Expenses',
    'nav.cards': 'Cards',
    'nav.accounts': 'Accounts',
    'nav.profile': 'Profile',
    'nav.back': 'Back',
    
    // Transactions
    'transaction.add': 'Add Transaction',
    'transaction.type': 'Type',
    'transaction.income': 'Income',
    'transaction.expense': 'Expense',
    'transaction.amount': 'Amount',
    'transaction.description': 'Description',
    'transaction.category': 'Category',
    'transaction.date': 'Date',
    'transaction.paymentMethod': 'Payment Method',
    'transaction.cash': 'Cash',
    'transaction.creditCard': 'Credit Card',
    'transaction.debitCard': 'Debit Card',
    'transaction.bankTransfer': 'Bank Transfer',
    'transaction.pix': 'PIX',
    'transaction.submit': 'Add',
    'transaction.submitting': 'Adding...',
    
    // Cards
    'cards.title': 'Manage Cards',
    'cards.add': 'Add Card',
    'cards.name': 'Card Name',
    'cards.type': 'Card Type',
    'cards.credit': 'Credit',
    'cards.debit': 'Debit',
    'cards.lastFourDigits': 'Last 4 Digits',
    'cards.creditLimit': 'Credit Limit',
    'cards.currentBalance': 'Current Balance',
    'cards.currency': 'Currency',
    'cards.dueDate': 'Due Date',
    'cards.selectType': 'Select type',
    'cards.selectDay': 'Select day',
    'cards.adding': 'Adding...',
    'cards.addCard': 'Add Card',
    
    // Accounts
    'accounts.title': 'Manage Accounts',
    'accounts.add': 'Add Account',
    'accounts.name': 'Account Name',
    'accounts.type': 'Account Type',
    'accounts.checking': 'Checking',
    'accounts.savings': 'Savings',
    'accounts.investment': 'Investment',
    'accounts.balance': 'Balance',
    'accounts.bank': 'Bank',
    'accounts.selectType': 'Select type',
    'accounts.adding': 'Adding...',
    'accounts.addAccount': 'Add Account',
    
    // Categories
    'categories.title': 'Manage Categories',
    'categories.add': 'Add Category',
    'categories.name': 'Category Name',
    'categories.adding': 'Adding...',
    'categories.addCategory': 'Add Category',
    
    // Messages
    'messages.cardAdded': 'Card added successfully!',
    'messages.cardError': 'Error adding card',
    'messages.accountAdded': 'Account added successfully!',
    'messages.accountError': 'Error adding account',
    'messages.categoryAdded': 'Category added successfully!',
    'messages.categoryError': 'Error adding category',
    'messages.transactionAdded': 'Transaction added successfully!',
    'messages.transactionError': 'Error adding transaction',
    
    // Common
    'common.required': 'required',
    'common.cancel': 'Cancel',
    'common.save': 'Save',
    'common.edit': 'Edit',
    'common.delete': 'Delete',
    'common.loading': 'Loading...',
    'common.search': 'Search',
    'common.filter': 'Filter',
    'common.all': 'All',
    'common.none': 'None',
    'common.select': 'Select',
  },
};

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguage] = useState<'pt' | 'en'>('pt');

  const t = (key: string): string => {
    return translations[language][key as keyof typeof translations['pt']] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};