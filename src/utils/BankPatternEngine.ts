export interface BankPattern {
  id: string;
  name: string;
  country: string;
  currency: string;
  headerPatterns: string[];
  dateFormats: string[];
  amountPatterns: string[];
  descriptionPatterns: string[];
  balancePatterns: string[];
  transactionPatterns: RegExp[];
  columnHeaders: {
    pt: string[];
    en: string[];
    es: string[];
  };
}

export interface TransactionPattern {
  date: string;
  description: string;
  amount: string;
  type: 'debit' | 'credit' | 'auto';
  balance?: string;
}

export class BankPatternEngine {
  private patterns: BankPattern[] = [
    // BRASIL - Bancos Brasileiros
    {
      id: 'itau_br',
      name: 'Itaú',
      country: 'BR',
      currency: 'BRL',
      headerPatterns: ['itaú', 'banco itau', 'itau unibanco'],
      dateFormats: ['DD/MM/YYYY', 'DD/MM/YY'],
      amountPatterns: ['R\\$\\s*[\\d\\.]+,[\\d]{2}', '[\\d\\.]+,[\\d]{2}'],
      descriptionPatterns: ['compra cartão', 'pix', 'ted', 'doc', 'débito automático'],
      balancePatterns: ['saldo anterior', 'saldo atual', 'saldo final'],
      transactionPatterns: [
        /(\d{2}\/\d{2}\/\d{4})\s+(.+?)\s+([\d\.,]+)\s*([CD]?)/gi,
        /(\d{2}\/\d{2})\s+(.+?)\s+R\$\s*([\d\.,]+)/gi
      ],
      columnHeaders: {
        pt: ['data', 'descrição', 'valor', 'saldo'],
        en: ['date', 'description', 'amount', 'balance'],
        es: ['fecha', 'descripción', 'valor', 'saldo']
      }
    },
    {
      id: 'bradesco_br',
      name: 'Bradesco',
      country: 'BR',
      currency: 'BRL',
      headerPatterns: ['bradesco', 'banco bradesco'],
      dateFormats: ['DD/MM/YYYY', 'DD/MM/YY'],
      amountPatterns: ['R\\$\\s*[\\d\\.]+,[\\d]{2}', '[\\d\\.]+,[\\d]{2}'],
      descriptionPatterns: ['cartão de crédito', 'pix enviado', 'pix recebido', 'transferência'],
      balancePatterns: ['saldo anterior', 'saldo atual'],
      transactionPatterns: [
        /(\d{2}\/\d{2}\/\d{4})\s+(.+?)\s+R\$\s*([\d\.,]+)/gi,
        /(\d{2}\/\d{2})\s+(.+?)\s+([\d\.,]+)/gi
      ],
      columnHeaders: {
        pt: ['data', 'histórico', 'valor', 'saldo'],
        en: ['date', 'history', 'amount', 'balance'],
        es: ['fecha', 'historial', 'valor', 'saldo']
      }
    },
    {
      id: 'santander_br',
      name: 'Santander Brasil',
      country: 'BR',
      currency: 'BRL',
      headerPatterns: ['santander', 'banco santander brasil'],
      dateFormats: ['DD/MM/YYYY'],
      amountPatterns: ['R\\$\\s*[\\d\\.]+,[\\d]{2}'],
      descriptionPatterns: ['compra com cartão', 'pix', 'ted recebida', 'débito automático'],
      balancePatterns: ['saldo anterior', 'saldo'],
      transactionPatterns: [
        /(\d{2}\/\d{2}\/\d{4})\s+(.+?)\s+R\$\s*([\d\.,]+)/gi
      ],
      columnHeaders: {
        pt: ['data', 'descrição', 'valor', 'saldo'],
        en: ['date', 'description', 'amount', 'balance'],
        es: ['fecha', 'descripción', 'valor', 'saldo']
      }
    },
    {
      id: 'nubank_br',
      name: 'Nubank',
      country: 'BR',
      currency: 'BRL',
      headerPatterns: ['nubank', 'nu pagamentos'],
      dateFormats: ['DD/MM/YYYY'],
      amountPatterns: ['R\\$\\s*[\\d\\.]+,[\\d]{2}'],
      descriptionPatterns: ['compra no cartão', 'pix', 'transferência', 'pagamento'],
      balancePatterns: ['limite disponível', 'fatura atual'],
      transactionPatterns: [
        /(\d{2}\/\d{2}\/\d{4})\s+(.+?)\s+R\$\s*([\d\.,]+)/gi
      ],
      columnHeaders: {
        pt: ['data', 'descrição', 'valor'],
        en: ['date', 'description', 'amount'],
        es: ['fecha', 'descripción', 'valor']
      }
    },

    // EUA - Bancos Americanos
    {
      id: 'chase_us',
      name: 'Chase Bank',
      country: 'US',
      currency: 'USD',
      headerPatterns: ['chase', 'jp morgan chase', 'jpmorgan chase'],
      dateFormats: ['MM/DD/YYYY', 'MM/DD/YY'],
      amountPatterns: ['\\$[\\d,]+\\.[\\d]{2}', '[\\d,]+\\.[\\d]{2}'],
      descriptionPatterns: ['purchase', 'payment', 'transfer', 'ach', 'wire', 'check'],
      balancePatterns: ['balance', 'available balance', 'current balance'],
      transactionPatterns: [
        /(\d{2}\/\d{2}\/\d{4})\s+(.+?)\s+\$?([\d,]+\.\d{2})/gi,
        /(\d{2}\/\d{2})\s+(.+?)\s+\$?([\d,]+\.\d{2})/gi
      ],
      columnHeaders: {
        pt: ['data', 'descrição', 'valor', 'saldo'],
        en: ['date', 'description', 'amount', 'balance'],
        es: ['fecha', 'descripción', 'valor', 'saldo']
      }
    },
    {
      id: 'bankofamerica_us',
      name: 'Bank of America',
      country: 'US',
      currency: 'USD',
      headerPatterns: ['bank of america', 'boa', 'bankofamerica'],
      dateFormats: ['MM/DD/YYYY'],
      amountPatterns: ['\\$[\\d,]+\\.[\\d]{2}'],
      descriptionPatterns: ['card purchase', 'online payment', 'ach transfer', 'wire transfer'],
      balancePatterns: ['ending balance', 'available balance'],
      transactionPatterns: [
        /(\d{2}\/\d{2}\/\d{4})\s+(.+?)\s+\$?([\d,]+\.\d{2})/gi
      ],
      columnHeaders: {
        pt: ['data', 'descrição', 'valor', 'saldo'],
        en: ['date', 'description', 'amount', 'balance'],
        es: ['fecha', 'descripción', 'valor', 'saldo']
      }
    },
    {
      id: 'wellsfargo_us',
      name: 'Wells Fargo',
      country: 'US',
      currency: 'USD',
      headerPatterns: ['wells fargo', 'wellsfargo'],
      dateFormats: ['MM/DD/YYYY'],
      amountPatterns: ['\\$[\\d,]+\\.[\\d]{2}'],
      descriptionPatterns: ['purchase', 'payment', 'transfer', 'withdrawal', 'deposit'],
      balancePatterns: ['balance', 'ending daily balance'],
      transactionPatterns: [
        /(\d{2}\/\d{2}\/\d{4})\s+(.+?)\s+\$?([\d,]+\.\d{2})/gi
      ],
      columnHeaders: {
        pt: ['data', 'descrição', 'valor', 'saldo'],
        en: ['date', 'description', 'amount', 'balance'],
        es: ['fecha', 'descripción', 'valor', 'saldo']
      }
    },

    // ESPANHA - Bancos Espanhóis
    {
      id: 'santander_es',
      name: 'Santander España',
      country: 'ES',
      currency: 'EUR',
      headerPatterns: ['banco santander', 'santander españa'],
      dateFormats: ['DD/MM/YYYY', 'DD-MM-YYYY'],
      amountPatterns: ['[\\d\\.]+,[\\d]{2}\\s*€', '€\\s*[\\d\\.]+,[\\d]{2}'],
      descriptionPatterns: ['compra tarjeta', 'transferencia', 'sepa', 'bizum', 'domiciliación'],
      balancePatterns: ['saldo anterior', 'saldo actual', 'saldo disponible'],
      transactionPatterns: [
        /(\d{2}\/\d{2}\/\d{4})\s+(.+?)\s+([\d\.,]+)\s*€/gi,
        /(\d{2}-\d{2}-\d{4})\s+(.+?)\s+€\s*([\d\.,]+)/gi
      ],
      columnHeaders: {
        pt: ['data', 'conceito', 'valor', 'saldo'],
        en: ['date', 'concept', 'amount', 'balance'],
        es: ['fecha', 'concepto', 'importe', 'saldo']
      }
    },
    {
      id: 'bbva_es',
      name: 'BBVA España',
      country: 'ES',
      currency: 'EUR',
      headerPatterns: ['bbva', 'banco bilbao vizcaya'],
      dateFormats: ['DD/MM/YYYY'],
      amountPatterns: ['[\\d\\.]+,[\\d]{2}\\s*€'],
      descriptionPatterns: ['pago tarjeta', 'transferencia', 'sepa', 'bizum'],
      balancePatterns: ['saldo', 'saldo disponible'],
      transactionPatterns: [
        /(\d{2}\/\d{2}\/\d{4})\s+(.+?)\s+([\d\.,]+)\s*€/gi
      ],
      columnHeaders: {
        pt: ['data', 'descrição', 'valor', 'saldo'],
        en: ['date', 'description', 'amount', 'balance'],
        es: ['fecha', 'descripción', 'importe', 'saldo']
      }
    },
    {
      id: 'lacaixa_es',
      name: 'CaixaBank',
      country: 'ES',
      currency: 'EUR',
      headerPatterns: ['caixabank', 'la caixa', 'caixa'],
      dateFormats: ['DD/MM/YYYY'],
      amountPatterns: ['[\\d\\.]+,[\\d]{2}\\s*€'],
      descriptionPatterns: ['compra', 'transferencia', 'sepa', 'bizum', 'domiciliación'],
      balancePatterns: ['saldo anterior', 'saldo'],
      transactionPatterns: [
        /(\d{2}\/\d{2}\/\d{4})\s+(.+?)\s+([\d\.,]+)\s*€/gi
      ],
      columnHeaders: {
        pt: ['data', 'conceito', 'valor', 'saldo'],
        en: ['date', 'concept', 'amount', 'balance'],
        es: ['fecha', 'concepto', 'importe', 'saldo']
      }
    }
  ];

  detectBank(text: string, language: 'pt' | 'en' | 'es' = 'pt'): BankPattern | null {
    const normalizedText = text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    
    for (const pattern of this.patterns) {
      for (const headerPattern of pattern.headerPatterns) {
        const normalizedPattern = headerPattern.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        if (normalizedText.includes(normalizedPattern)) {
          return pattern;
        }
      }
    }
    
    return null;
  }

  extractTransactions(text: string, pattern: BankPattern): TransactionPattern[] {
    const transactions: TransactionPattern[] = [];
    const lines = text.split('\n');
    
    for (const regex of pattern.transactionPatterns) {
      let match;
      regex.lastIndex = 0; // Reset regex
      
      while ((match = regex.exec(text)) !== null) {
        const [, date, description, amount, typeIndicator] = match;
        
        // Determine transaction type
        let type: 'debit' | 'credit' | 'auto' = 'auto';
        if (typeIndicator) {
          type = typeIndicator.toUpperCase() === 'C' ? 'credit' : 'debit';
        } else {
          // Auto-detect based on description keywords
          const descLower = description.toLowerCase();
          if (descLower.includes('pagamento') || descLower.includes('payment') || 
              descLower.includes('compra') || descLower.includes('purchase') ||
              descLower.includes('débito') || descLower.includes('debit')) {
            type = 'debit';
          } else if (descLower.includes('depósito') || descLower.includes('deposit') ||
                     descLower.includes('crédito') || descLower.includes('credit') ||
                     descLower.includes('recebimento') || descLower.includes('received')) {
            type = 'credit';
          }
        }
        
        transactions.push({
          date: date.trim(),
          description: description.trim(),
          amount: amount.replace(/[^\d,.-]/g, ''),
          type
        });
      }
    }
    
    return transactions;
  }

  normalizeAmount(amount: string, currency: string): number {
    // Remove currency symbols and normalize decimal separators
    let normalized = amount.replace(/[R$€$£¥]/g, '').trim();
    
    if (currency === 'BRL' || currency === 'EUR') {
      // European format: 1.234,56
      normalized = normalized.replace(/\./g, '').replace(',', '.');
    } else {
      // US format: 1,234.56  
      normalized = normalized.replace(/,/g, '');
    }
    
    return parseFloat(normalized) || 0;
  }

  normalizeDate(date: string, pattern: BankPattern): Date | null {
    try {
      const formats = pattern.dateFormats;
      
      for (const format of formats) {
        if (format === 'DD/MM/YYYY' || format === 'DD/MM/YY') {
          const parts = date.split('/');
          if (parts.length >= 2) {
            const day = parseInt(parts[0]);
            const month = parseInt(parts[1]) - 1; // JS months are 0-indexed
            let year = parseInt(parts[2] || new Date().getFullYear().toString());
            
            if (year < 100) {
              year += year > 50 ? 1900 : 2000;
            }
            
            return new Date(year, month, day);
          }
        } else if (format === 'MM/DD/YYYY' || format === 'MM/DD/YY') {
          const parts = date.split('/');
          if (parts.length >= 2) {
            const month = parseInt(parts[0]) - 1;
            const day = parseInt(parts[1]);
            let year = parseInt(parts[2] || new Date().getFullYear().toString());
            
            if (year < 100) {
              year += year > 50 ? 1900 : 2000;
            }
            
            return new Date(year, month, day);
          }
        } else if (format === 'DD-MM-YYYY') {
          const parts = date.split('-');
          if (parts.length === 3) {
            const day = parseInt(parts[0]);
            const month = parseInt(parts[1]) - 1;
            const year = parseInt(parts[2]);
            
            return new Date(year, month, day);
          }
        }
      }
      
      return null;
    } catch (error) {
      console.warn('Date parsing error:', error);
      return null;
    }
  }

  detectPaymentMethod(description: string, country: string): string {
    const descLower = description.toLowerCase();
    
    if (country === 'BR') {
      if (descLower.includes('pix')) return 'pix';
      if (descLower.includes('ted')) return 'ted';
      if (descLower.includes('doc')) return 'doc';
      if (descLower.includes('cartão') || descLower.includes('card')) return 'credit';
      if (descLower.includes('débito')) return 'debit';
      if (descLower.includes('boleto')) return 'boleto';
      if (descLower.includes('transferência')) return 'transfer';
    } else if (country === 'US') {
      if (descLower.includes('ach')) return 'ach';
      if (descLower.includes('wire')) return 'wire';
      if (descLower.includes('check')) return 'check';
      if (descLower.includes('zelle')) return 'zelle';
      if (descLower.includes('card') || descLower.includes('purchase')) return 'credit';
      if (descLower.includes('transfer')) return 'transfer';
    } else if (country === 'ES') {
      if (descLower.includes('sepa')) return 'sepa';
      if (descLower.includes('bizum')) return 'bizum';
      if (descLower.includes('tarjeta') || descLower.includes('card')) return 'credit';
      if (descLower.includes('transferencia')) return 'transfer';
      if (descLower.includes('domiciliación')) return 'direct_debit';
    }
    
    return 'cash';
  }

  getBanksByCountry(country: string): BankPattern[] {
    return this.patterns.filter(pattern => pattern.country === country);
  }

  getAllBanks(): BankPattern[] {
    return [...this.patterns];
  }
}

export const bankPatternEngine = new BankPatternEngine();