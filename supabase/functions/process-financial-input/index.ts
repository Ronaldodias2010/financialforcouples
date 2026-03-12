import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key',
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// ============================================================
// LANGUAGE DETECTION PATTERNS
// ============================================================
const LANGUAGE_PATTERNS = {
  pt: {
    words: ['gastei', 'paguei', 'comprei', 'recebi', 'transferi', 'depositei', 'saquei', 'qual', 'quanto', 'meu', 'minha', 'meus', 'minhas', 'hoje', 'ontem', 'amanhã', 'reais', 'cartão', 'conta', 'saldo', 'despesas', 'gastos', 'receitas', 'mês', 'mes', 'semana', 'categoria', 'categorias', 'total', 'resumo', 'olá', 'oi', 'bom dia', 'boa tarde', 'boa noite', 'obrigado', 'obrigada', 'por favor', 'já', 'não', 'sim', 'como', 'onde', 'porque', 'porquê'],
    patterns: [/r\$\s*[\d.,]+/i, /\d+\s*reais/i, /\bno\b/, /\bna\b/, /\bdo\b/, /\bda\b/, /\bde\b/, /ção\b/, /ções\b/]
  },
  en: {
    words: ['spent', 'paid', 'bought', 'received', 'transferred', 'deposited', 'withdrew', 'what', 'how', 'much', 'my', 'mine', 'today', 'yesterday', 'tomorrow', 'dollars', 'card', 'account', 'balance', 'expenses', 'spending', 'income', 'month', 'week', 'category', 'categories', 'total', 'summary', 'hello', 'hi', 'hey', 'good morning', 'good afternoon', 'good evening', 'thank you', 'thanks', 'please', 'already', 'not', 'yes', 'where', 'why', 'because', 'the', 'this', 'that', 'with', 'from', 'for'],
    patterns: [/\$\s*[\d.,]+/, /\d+\s*dollars?/i, /\bthe\b/i, /\bwith\b/i, /\bfor\b/i, /\bfrom\b/i, /tion\b/, /ing\b/]
  },
  es: {
    words: ['gasté', 'pagué', 'compré', 'recibí', 'transferí', 'deposité', 'retiré', 'cuál', 'cuánto', 'mi', 'mis', 'hoy', 'ayer', 'mañana', 'pesos', 'euros', 'tarjeta', 'cuenta', 'saldo', 'gastos', 'ingresos', 'mes', 'semana', 'categoría', 'categorías', 'total', 'resumen', 'hola', 'buenos días', 'buenas tardes', 'buenas noches', 'gracias', 'por favor', 'ya', 'no', 'sí', 'como', 'donde', 'porque', 'qué', 'cómo', 'dónde', 'cuándo'],
    patterns: [/€\s*[\d.,]+/, /\d+\s*pesos?/i, /\d+\s*euros?/i, /\bel\b/, /\bla\b/, /\blos\b/, /\blas\b/, /ción\b/, /ciones\b/]
  }
};

// ============================================================
// RESPONSE MESSAGES (MULTI-LANGUAGE) - Updated with subcategory support
// ============================================================
const RESPONSE_MESSAGES = {
  pt: {
    expenseRecorded: (amountOriginal: string, currencyOriginal: string, amountConverted: string, currencyConverted: string, rate: number | null, category: string, subcategory?: string | null) => {
      const categoryDisplay = subcategory ? `${category} > ${subcategory}` : category;
      if (rate && currencyOriginal !== currencyConverted) {
        return `💳 Gasto registrado\n${currencyOriginal} ${amountOriginal} → ${currencyConverted} ${amountConverted} (câmbio ${rate.toFixed(4)})\n📁 ${categoryDisplay}`;
      }
      return `💳 Gasto registrado\n${currencyConverted} ${amountConverted}\n📁 ${categoryDisplay}`;
    },
    incomeRecorded: (amountOriginal: string, currencyOriginal: string, amountConverted: string, currencyConverted: string, rate: number | null, category: string, subcategory?: string | null) => {
      const categoryDisplay = subcategory ? `${category} > ${subcategory}` : category;
      if (rate && currencyOriginal !== currencyConverted) {
        return `💰 Receita registrada\n${currencyOriginal} ${amountOriginal} → ${currencyConverted} ${amountConverted} (câmbio ${rate.toFixed(4)})\n📁 ${categoryDisplay}`;
      }
      return `💰 Receita registrada\n${currencyConverted} ${amountConverted}\n📁 ${categoryDisplay}`;
    }
  },
  en: {
    expenseRecorded: (amountOriginal: string, currencyOriginal: string, amountConverted: string, currencyConverted: string, rate: number | null, category: string, subcategory?: string | null) => {
      const categoryDisplay = subcategory ? `${category} > ${subcategory}` : category;
      if (rate && currencyOriginal !== currencyConverted) {
        return `💳 Expense recorded\n${currencyOriginal} ${amountOriginal} → ${currencyConverted} ${amountConverted} (exchange rate ${rate.toFixed(4)})\n📁 ${categoryDisplay}`;
      }
      return `💳 Expense recorded\n${currencyConverted} ${amountConverted}\n📁 ${categoryDisplay}`;
    },
    incomeRecorded: (amountOriginal: string, currencyOriginal: string, amountConverted: string, currencyConverted: string, rate: number | null, category: string, subcategory?: string | null) => {
      const categoryDisplay = subcategory ? `${category} > ${subcategory}` : category;
      if (rate && currencyOriginal !== currencyConverted) {
        return `💰 Income recorded\n${currencyOriginal} ${amountOriginal} → ${currencyConverted} ${amountConverted} (exchange rate ${rate.toFixed(4)})\n📁 ${categoryDisplay}`;
      }
      return `💰 Income recorded\n${currencyConverted} ${amountConverted}\n📁 ${categoryDisplay}`;
    }
  },
  es: {
    expenseRecorded: (amountOriginal: string, currencyOriginal: string, amountConverted: string, currencyConverted: string, rate: number | null, category: string, subcategory?: string | null) => {
      const categoryDisplay = subcategory ? `${category} > ${subcategory}` : category;
      if (rate && currencyOriginal !== currencyConverted) {
        return `💳 Gasto registrado\n${currencyOriginal} ${amountOriginal} → ${currencyConverted} ${amountConverted} (cambio ${rate.toFixed(4)})\n📁 ${categoryDisplay}`;
      }
      return `💳 Gasto registrado\n${currencyConverted} ${amountConverted}\n📁 ${categoryDisplay}`;
    },
    incomeRecorded: (amountOriginal: string, currencyOriginal: string, amountConverted: string, currencyConverted: string, rate: number | null, category: string, subcategory?: string | null) => {
      const categoryDisplay = subcategory ? `${category} > ${subcategory}` : category;
      if (rate && currencyOriginal !== currencyConverted) {
        return `💰 Ingreso registrado\n${currencyOriginal} ${amountOriginal} → ${currencyConverted} ${amountConverted} (cambio ${rate.toFixed(4)})\n📁 ${categoryDisplay}`;
      }
      return `💰 Ingreso registrado\n${currencyConverted} ${amountConverted}\n📁 ${categoryDisplay}`;
    }
  }
};

// ============================================================
// EDGE LAYER: SUBCATEGORY SEMANTIC KEYWORDS (MULTI-LANGUAGE)
// ============================================================
const SUBCATEGORY_KEYWORDS: Record<string, { name_pt: string; name_en: string; name_es: string; keywords_pt: string[]; keywords_en: string[]; keywords_es: string[] }[]> = {
  // Alimentação / Food / Alimentación
  'alimentacao': [
    { 
      name_pt: 'Restaurante', name_en: 'Restaurant', name_es: 'Restaurante',
      keywords_pt: ['restaurante', 'almoco', 'almoço', 'jantar', 'outback', 'madero', 'applebees', 'applebee', 'churrascaria', 'pizzaria', 'rodizio', 'rodízio', 'bistro', 'bistrô', 'cantina', 'sushi', 'japa', 'japones', 'japonês', 'italiano', 'mexicano', 'chinês', 'chines', 'árabe', 'arabe', 'self service', 'buffet', 'bufê'],
      keywords_en: ['restaurant', 'lunch', 'dinner', 'outback', 'steakhouse', 'pizzeria', 'bistro', 'sushi', 'japanese', 'italian', 'mexican', 'chinese', 'arab', 'buffet', 'diner', 'eatery', 'grill'],
      keywords_es: ['restaurante', 'almuerzo', 'cena', 'asador', 'pizzeria', 'bistro', 'sushi', 'japonés', 'italiano', 'mexicano', 'chino', 'árabe', 'buffet', 'parrilla']
    },
    { 
      name_pt: 'Supermercado', name_en: 'Supermarket', name_es: 'Supermercado',
      keywords_pt: ['mercado', 'supermercado', 'extra', 'carrefour', 'pao de acucar', 'pão de açúcar', 'atacadao', 'atacadão', 'assai', 'assaí', 'big', 'walmart', 'makro', 'sam', 'sams club', 'dia', 'oba', 'natural da terra', 'hortifruti', 'sacolao', 'sacolão', 'feira', 'quitanda', 'mercearia', 'armazem', 'armazém'],
      keywords_en: ['market', 'supermarket', 'grocery', 'groceries', 'walmart', 'costco', 'target', 'whole foods', 'trader joes', 'aldi', 'lidl', 'safeway', 'kroger', 'publix'],
      keywords_es: ['supermercado', 'mercado', 'abarrotes', 'tienda', 'walmart', 'costco', 'carrefour', 'lidl', 'aldi', 'mercadona', 'soriana', 'chedraui']
    },
    { 
      name_pt: 'Delivery', name_en: 'Delivery', name_es: 'Delivery',
      keywords_pt: ['ifood', 'rappi', 'uber eats', 'ubereats', 'delivery', 'entrega', 'pedido', '99food', 'aiqfome', 'zé delivery', 'ze delivery', 'james delivery', 'goomer'],
      keywords_en: ['delivery', 'uber eats', 'doordash', 'grubhub', 'postmates', 'seamless', 'caviar', 'instacart', 'gopuff'],
      keywords_es: ['delivery', 'rappi', 'uber eats', 'didi food', 'pedidos ya', 'glovo', 'cornershop', 'entrega']
    },
    { 
      name_pt: 'Fast Food', name_en: 'Fast Food', name_es: 'Comida Rápida',
      keywords_pt: ['mcdonalds', 'mcdonald', 'mc donalds', 'burger king', 'bk', 'bob', 'bobs', "bob's", 'kfc', 'subway', 'habib', 'habibs', "habib's", 'giraffas', 'popeyes', 'wendys', "wendy's", 'taco bell', 'pizza hut', 'dominos', "domino's", 'spoleto', 'china in box', 'china box', 'coco bambu', 'fast food', 'lanchonete', 'hot dog', 'cachorro quente', 'pastel', 'pastelaria', 'coxinha', 'salgado', 'salgadinho', 'esfiha', 'esfirra'],
      keywords_en: ['mcdonalds', 'burger king', 'wendys', 'kfc', 'subway', 'taco bell', 'pizza hut', 'dominos', 'popeyes', 'chick fil a', 'chipotle', 'five guys', 'in n out', 'sonic', 'arbys', 'fast food', 'quick bite'],
      keywords_es: ['mcdonalds', 'burger king', 'wendys', 'kfc', 'subway', 'taco bell', 'pizza hut', 'dominos', 'popeyes', 'comida rapida', 'hamburguesa']
    },
    { 
      name_pt: 'Café/Padaria', name_en: 'Bakery/Coffee', name_es: 'Panadería/Café',
      keywords_pt: ['cafe', 'café', 'cafeteria', 'padaria', 'padoca', 'confeitaria', 'doceria', 'starbucks', 'cacau show', 'kopenhagen', 'brasil cacau', 'croissant', 'pao', 'pão', 'bolo', 'doce', 'sobremesa', 'lanche', 'breakfast', 'cafe da manha', 'café da manhã', 'cappuccino', 'espresso', 'expresso'],
      keywords_en: ['coffee', 'cafe', 'bakery', 'starbucks', 'dunkin', 'panera', 'peets', 'blue bottle', 'pastry', 'croissant', 'donut', 'doughnut', 'muffin', 'breakfast', 'brunch', 'espresso', 'cappuccino', 'latte'],
      keywords_es: ['cafe', 'café', 'cafeteria', 'panadería', 'pastelería', 'starbucks', 'croissant', 'pan', 'desayuno', 'pastel', 'dulce', 'espresso', 'cappuccino']
    },
    { 
      name_pt: 'Bar/Bebidas', name_en: 'Bar/Drinks', name_es: 'Bar/Bebidas',
      keywords_pt: ['bar', 'boteco', 'botequim', 'pub', 'balada', 'cerveja', 'chopp', 'chope', 'vinho', 'whisky', 'whiskey', 'vodka', 'gin', 'drink', 'drinks', 'coquetel', 'cocktail', 'happy hour', 'adega', 'emporio', 'empório', 'bebida', 'alcool', 'álcool', 'destilado', 'cachaça', 'caipirinha'],
      keywords_en: ['bar', 'pub', 'tavern', 'club', 'nightclub', 'beer', 'wine', 'whisky', 'whiskey', 'vodka', 'gin', 'drink', 'drinks', 'cocktail', 'happy hour', 'liquor', 'alcohol', 'brewery'],
      keywords_es: ['bar', 'pub', 'discoteca', 'cerveza', 'vino', 'whisky', 'vodka', 'gin', 'bebida', 'coctel', 'happy hour', 'licor', 'alcohol', 'cantina']
    }
  ],
  // Transporte / Transportation / Transporte  
  'transporte': [
    { 
      name_pt: 'Uber/99/Táxi', name_en: 'Rideshare/Taxi', name_es: 'Taxi/App',
      keywords_pt: ['uber', '99', 'noventa e nove', 'taxi', 'táxi', 'cabify', 'indriver', 'corrida', 'motorista', 'app de carona', 'carro de aplicativo', '99pop', '99taxi', 'pop', 'lyft'],
      keywords_en: ['uber', 'lyft', 'taxi', 'cab', 'rideshare', 'ride', 'driver', 'cabify', 'via'],
      keywords_es: ['uber', 'didi', 'cabify', 'taxi', 'beat', 'indriver', 'chofer', 'viaje']
    },
    { 
      name_pt: 'Combustível', name_en: 'Fuel', name_es: 'Combustible',
      keywords_pt: ['gasolina', 'combustivel', 'combustível', 'posto', 'shell', 'ipiranga', 'br', 'petrobras', 'ale', 'texaco', 'esso', 'etanol', 'alcool', 'álcool', 'diesel', 'gnv', 'abasteci', 'abastecer', 'tanque'],
      keywords_en: ['gas', 'gasoline', 'fuel', 'petrol', 'diesel', 'shell', 'exxon', 'chevron', 'bp', 'mobil', 'tank', 'fill up'],
      keywords_es: ['gasolina', 'combustible', 'diesel', 'gasolinera', 'estación', 'tanque', 'llenar']
    },
    { 
      name_pt: 'Estacionamento', name_en: 'Parking', name_es: 'Estacionamiento',
      keywords_pt: ['estacionamento', 'parkimetro', 'parquimetro', 'parquímetro', 'vaga', 'garagem', 'parking', 'zona azul', 'rotativo', 'manobrista', 'valet'],
      keywords_en: ['parking', 'garage', 'valet', 'lot', 'meter', 'park'],
      keywords_es: ['estacionamiento', 'parking', 'parqueadero', 'garaje', 'valet', 'parquímetro']
    },
    { 
      name_pt: 'Transporte Público', name_en: 'Public Transit', name_es: 'Transporte Público',
      keywords_pt: ['onibus', 'ônibus', 'metro', 'metrô', 'trem', 'barca', 'balsa', 'vlt', 'brt', 'bilhete unico', 'bilhete único', 'passagem', 'integracao', 'integração', 'cartao transporte', 'cartão transporte', 'sptrans', 'cptm'],
      keywords_en: ['bus', 'metro', 'subway', 'train', 'tram', 'transit', 'fare', 'ticket', 'pass', 'commute', 'public transport'],
      keywords_es: ['bus', 'metro', 'tren', 'tranvía', 'pasaje', 'boleto', 'transporte público', 'autobús']
    },
    { 
      name_pt: 'Pedágio', name_en: 'Toll', name_es: 'Peaje',
      keywords_pt: ['pedagio', 'pedágio', 'sem parar', 'veloe', 'move mais', 'conectcar', 'conect car', 'caseta', 'praca de pedagio', 'praça de pedágio', 'tag'],
      keywords_en: ['toll', 'tollway', 'turnpike', 'ez pass', 'fastrak', 'sunpass'],
      keywords_es: ['peaje', 'caseta', 'autopista', 'telepeaje', 'tag']
    },
    { 
      name_pt: 'Manutenção Veículo', name_en: 'Vehicle Maintenance', name_es: 'Mantenimiento Vehículo',
      keywords_pt: ['mecanico', 'mecânico', 'oficina', 'borracheiro', 'pneu', 'troca de oleo', 'troca de óleo', 'revisao', 'revisão', 'manutencao', 'manutenção', 'funilaria', 'conserto', 'pecas', 'peças', 'autopeças', 'lava jato', 'lavagem', 'polimento', 'alinhamento', 'balanceamento'],
      keywords_en: ['mechanic', 'garage', 'repair', 'tire', 'oil change', 'service', 'maintenance', 'parts', 'car wash', 'detailing', 'alignment'],
      keywords_es: ['mecánico', 'taller', 'llanta', 'cambio de aceite', 'revisión', 'mantenimiento', 'repuestos', 'lavado']
    }
  ],
  // Moradia / Housing / Vivienda
  'moradia': [
    { 
      name_pt: 'Aluguel', name_en: 'Rent', name_es: 'Alquiler',
      keywords_pt: ['aluguel', 'aluguer', 'mensalidade', 'arrendamento', 'locacao', 'locação', 'imobiliaria', 'imobiliária', 'quinto andar', 'quintoandar', 'zap', 'loft'],
      keywords_en: ['rent', 'rental', 'lease', 'landlord', 'tenant', 'apartment', 'flat'],
      keywords_es: ['alquiler', 'renta', 'arrendamiento', 'mensualidad', 'inmobiliaria']
    },
    { 
      name_pt: 'Água', name_en: 'Water', name_es: 'Agua',
      keywords_pt: ['agua', 'água', 'sabesp', 'copasa', 'cedae', 'sanepar', 'embasa', 'cagece', 'conta de agua', 'conta de água', 'saneamento'],
      keywords_en: ['water', 'water bill', 'utility'],
      keywords_es: ['agua', 'servicio de agua', 'factura de agua']
    },
    { 
      name_pt: 'Luz/Energia', name_en: 'Electricity', name_es: 'Electricidad',
      keywords_pt: ['luz', 'energia', 'eletricidade', 'conta de luz', 'enel', 'cpfl', 'cemig', 'light', 'celpe', 'coelba', 'elektro', 'eletropaulo', 'bandeira vermelha', 'bandeira amarela', 'kwh'],
      keywords_en: ['electricity', 'power', 'electric bill', 'utility', 'energy'],
      keywords_es: ['luz', 'electricidad', 'energía', 'factura de luz', 'cfe']
    },
    { 
      name_pt: 'Gás', name_en: 'Gas', name_es: 'Gas',
      keywords_pt: ['gas', 'gás', 'gas de cozinha', 'gás de cozinha', 'botijao', 'botijão', 'comgas', 'comgás', 'ultragaz', 'liquigas', 'liquigás', 'ceg', 'encanado', 'glp'],
      keywords_en: ['gas', 'natural gas', 'propane', 'cooking gas'],
      keywords_es: ['gas', 'gas natural', 'propano', 'gas de cocina', 'cilindro']
    },
    { 
      name_pt: 'Internet/TV', name_en: 'Internet/TV', name_es: 'Internet/TV',
      keywords_pt: ['internet', 'fibra', 'wifi', 'wi-fi', 'banda larga', 'tv a cabo', 'tv por assinatura', 'vivo', 'claro', 'tim', 'oi', 'net', 'sky', 'directv', 'netflix', 'globoplay', 'prime video', 'hbo', 'streaming', 'modem', 'roteador'],
      keywords_en: ['internet', 'wifi', 'fiber', 'broadband', 'cable', 'streaming', 'netflix', 'hulu', 'disney+', 'hbo'],
      keywords_es: ['internet', 'wifi', 'fibra', 'banda ancha', 'cable', 'streaming', 'netflix']
    },
    { 
      name_pt: 'Condomínio', name_en: 'Condo Fee', name_es: 'Condominio',
      keywords_pt: ['condominio', 'condomínio', 'taxa condominial', 'sindico', 'síndico', 'fundo de reserva', 'area comum', 'área comum'],
      keywords_en: ['condo', 'hoa', 'maintenance fee', 'association', 'building fee'],
      keywords_es: ['condominio', 'cuota', 'expensas', 'gastos comunes', 'administración']
    },
    { 
      name_pt: 'Telefone', name_en: 'Phone', name_es: 'Teléfono',
      keywords_pt: ['telefone', 'celular', 'plano', 'vivo', 'claro', 'tim', 'oi', 'nextel', 'recarga', 'credito celular', 'crédito celular', 'conta telefone', 'linha', 'chip'],
      keywords_en: ['phone', 'mobile', 'cell', 'cellular', 'plan', 'verizon', 'att', 't-mobile', 'sprint'],
      keywords_es: ['teléfono', 'celular', 'móvil', 'plan', 'recarga', 'chip', 'línea']
    }
  ],
  // Saúde / Health / Salud
  'saude': [
    { 
      name_pt: 'Farmácia', name_en: 'Pharmacy', name_es: 'Farmacia',
      keywords_pt: ['farmacia', 'farmácia', 'drogaria', 'remedio', 'remédio', 'medicamento', 'droga raia', 'drogasil', 'panvel', 'pague menos', 'araujo', 'araújo', 'ultrafarma', 'drogal', 'receita', 'antibiotico', 'antibiótico', 'vitamina', 'suplemento'],
      keywords_en: ['pharmacy', 'drugstore', 'medicine', 'medication', 'prescription', 'cvs', 'walgreens', 'rite aid', 'drug', 'vitamin', 'supplement'],
      keywords_es: ['farmacia', 'droguería', 'medicamento', 'medicina', 'receta', 'vitamina', 'suplemento']
    },
    { 
      name_pt: 'Consulta Médica', name_en: 'Doctor Visit', name_es: 'Consulta Médica',
      keywords_pt: ['medico', 'médico', 'consulta', 'doutor', 'dr', 'clinica', 'clínica', 'consultorio', 'consultório', 'especialista', 'cardiologista', 'dermatologista', 'ortopedista', 'pediatra', 'ginecologista', 'urologista', 'oftalmologista', 'neurologista', 'retorno'],
      keywords_en: ['doctor', 'physician', 'appointment', 'clinic', 'checkup', 'specialist', 'cardiologist', 'dermatologist', 'pediatrician'],
      keywords_es: ['médico', 'doctor', 'consulta', 'clínica', 'consultorio', 'especialista', 'cita médica']
    },
    { 
      name_pt: 'Dentista', name_en: 'Dentist', name_es: 'Dentista',
      keywords_pt: ['dentista', 'odontologo', 'odontólogo', 'dente', 'ortodontia', 'limpeza dental', 'canal', 'obturacao', 'obturação', 'clareamento', 'aparelho', 'extração', 'extracao', 'implante'],
      keywords_en: ['dentist', 'dental', 'teeth', 'tooth', 'orthodontist', 'cleaning', 'cavity', 'crown', 'braces', 'implant'],
      keywords_es: ['dentista', 'odontólogo', 'diente', 'ortodoncia', 'limpieza dental', 'implante', 'brackets']
    },
    { 
      name_pt: 'Exames', name_en: 'Lab Tests', name_es: 'Exámenes',
      keywords_pt: ['exame', 'laboratorio', 'laboratório', 'fleury', 'delboni', 'lavoisier', 'hermes pardini', 'a+', 'hemograma', 'sangue', 'urina', 'raio x', 'ressonancia', 'ressonância', 'tomografia', 'ultrassom', 'endoscopia', 'colonoscopia', 'biopsia', 'biópsia'],
      keywords_en: ['lab', 'laboratory', 'test', 'blood test', 'xray', 'mri', 'ct scan', 'ultrasound', 'biopsy', 'exam'],
      keywords_es: ['examen', 'laboratorio', 'análisis', 'sangre', 'orina', 'rayos x', 'resonancia', 'tomografía', 'ultrasonido']
    },
    { 
      name_pt: 'Plano de Saúde', name_en: 'Health Insurance', name_es: 'Seguro de Salud',
      keywords_pt: ['plano de saude', 'plano de saúde', 'convenio', 'convênio', 'unimed', 'amil', 'bradesco saude', 'bradesco saúde', 'sulamerica', 'sulamerica saude', 'notredame', 'hapvida', 'prevent senior', 'mensalidade plano', 'coparticipacao', 'coparticipação'],
      keywords_en: ['health insurance', 'insurance', 'premium', 'copay', 'deductible', 'coverage', 'plan'],
      keywords_es: ['seguro de salud', 'seguro médico', 'prima', 'copago', 'cobertura', 'plan de salud']
    },
    { 
      name_pt: 'Academia/Esporte', name_en: 'Gym/Sports', name_es: 'Gimnasio/Deporte',
      keywords_pt: ['academia', 'gym', 'smart fit', 'smartfit', 'bio ritmo', 'bodytech', 'crossfit', 'personal', 'personal trainer', 'pilates', 'yoga', 'natacao', 'natação', 'musculacao', 'musculação', 'treino', 'esporte', 'futebol', 'tênis', 'tenis', 'corrida'],
      keywords_en: ['gym', 'fitness', 'workout', 'crossfit', 'yoga', 'pilates', 'personal trainer', 'sports', 'swimming', 'running', 'tennis', 'soccer'],
      keywords_es: ['gimnasio', 'gym', 'crossfit', 'yoga', 'pilates', 'entrenador', 'deporte', 'natación', 'fútbol', 'tenis']
    }
  ],
  // Educação / Education / Educación
  'educacao': [
    { 
      name_pt: 'Escola/Faculdade', name_en: 'School/College', name_es: 'Escuela/Universidad',
      keywords_pt: ['escola', 'colegio', 'colégio', 'faculdade', 'universidade', 'mensalidade', 'matricula', 'matrícula', 'material escolar', 'uniforme', 'apostila', 'fies', 'prouni', 'vestibular', 'enem'],
      keywords_en: ['school', 'college', 'university', 'tuition', 'enrollment', 'semester', 'campus', 'course', 'degree'],
      keywords_es: ['escuela', 'colegio', 'universidad', 'matrícula', 'mensualidad', 'semestre', 'carrera']
    },
    { 
      name_pt: 'Cursos', name_en: 'Courses', name_es: 'Cursos',
      keywords_pt: ['curso', 'aula', 'ingles', 'inglês', 'espanhol', 'idioma', 'lingua', 'língua', 'cna', 'wizard', 'fisk', 'ccaa', 'cultura inglesa', 'open english', 'udemy', 'coursera', 'alura', 'rocketseat', 'excel', 'online'],
      keywords_en: ['course', 'class', 'lesson', 'language', 'english', 'spanish', 'online course', 'udemy', 'coursera', 'skillshare', 'masterclass', 'certification'],
      keywords_es: ['curso', 'clase', 'idioma', 'inglés', 'español', 'online', 'certificación', 'capacitación']
    },
    { 
      name_pt: 'Livros/Material', name_en: 'Books/Supplies', name_es: 'Libros/Material',
      keywords_pt: ['livro', 'livros', 'livraria', 'saraiva', 'cultura', 'amazon', 'estante virtual', 'kindle', 'ebook', 'apostila', 'caderno', 'caneta', 'material', 'papelaria', 'kalunga'],
      keywords_en: ['book', 'books', 'textbook', 'ebook', 'kindle', 'amazon', 'notebook', 'supplies', 'stationery', 'barnes noble'],
      keywords_es: ['libro', 'libros', 'librería', 'ebook', 'kindle', 'cuaderno', 'material', 'papelería']
    }
  ],
  // Lazer / Entertainment / Entretenimiento
  'lazer': [
    { 
      name_pt: 'Cinema/Teatro', name_en: 'Movies/Theater', name_es: 'Cine/Teatro',
      keywords_pt: ['cinema', 'cinemark', 'kinoplex', 'uci', 'imax', 'filme', 'teatro', 'espetaculo', 'espetáculo', 'peca', 'peça', 'musical', 'ingresso', 'pipoca', 'sessao', 'sessão'],
      keywords_en: ['movie', 'cinema', 'theater', 'theatre', 'show', 'play', 'musical', 'ticket', 'amc', 'regal', 'imax'],
      keywords_es: ['cine', 'película', 'teatro', 'show', 'obra', 'musical', 'entrada', 'función']
    },
    { 
      name_pt: 'Viagem', name_en: 'Travel', name_es: 'Viaje',
      keywords_pt: ['viagem', 'hotel', 'pousada', 'hostel', 'airbnb', 'booking', 'decolar', 'passagem', 'aerea', 'aérea', 'voo', 'aeroporto', 'mala', 'turismo', 'ferias', 'férias', 'resort', 'cruzeiro'],
      keywords_en: ['travel', 'trip', 'hotel', 'airbnb', 'booking', 'flight', 'airport', 'vacation', 'holiday', 'resort', 'cruise'],
      keywords_es: ['viaje', 'hotel', 'airbnb', 'vuelo', 'aeropuerto', 'vacaciones', 'turismo', 'resort', 'crucero']
    },
    { 
      name_pt: 'Streaming/Jogos', name_en: 'Streaming/Games', name_es: 'Streaming/Juegos',
      keywords_pt: ['netflix', 'spotify', 'amazon prime', 'disney', 'hbo', 'star+', 'deezer', 'youtube', 'twitch', 'xbox', 'playstation', 'ps5', 'ps4', 'nintendo', 'switch', 'steam', 'game', 'jogo', 'videogame'],
      keywords_en: ['netflix', 'spotify', 'amazon prime', 'disney', 'hbo', 'hulu', 'youtube', 'twitch', 'xbox', 'playstation', 'nintendo', 'steam', 'game', 'gaming'],
      keywords_es: ['netflix', 'spotify', 'amazon prime', 'disney', 'hbo', 'youtube', 'twitch', 'xbox', 'playstation', 'nintendo', 'juego', 'videojuego']
    },
    { 
      name_pt: 'Parque/Diversão', name_en: 'Parks/Fun', name_es: 'Parques/Diversión',
      keywords_pt: ['parque', 'zoologico', 'zoológico', 'aquario', 'aquário', 'museu', 'exposicao', 'exposição', 'show', 'concerto', 'festival', 'boliche', 'karaoke', 'escape room', 'paintball', 'kart', 'kartódromo'],
      keywords_en: ['park', 'zoo', 'aquarium', 'museum', 'exhibition', 'concert', 'festival', 'bowling', 'karaoke', 'escape room', 'arcade'],
      keywords_es: ['parque', 'zoológico', 'acuario', 'museo', 'exposición', 'concierto', 'festival', 'boliche', 'karaoke']
    }
  ],
  // Compras / Shopping
  'compras': [
    { 
      name_pt: 'Roupas', name_en: 'Clothing', name_es: 'Ropa',
      keywords_pt: ['roupa', 'roupas', 'camisa', 'calca', 'calça', 'vestido', 'saia', 'blusa', 'jaqueta', 'casaco', 'sapato', 'tenis', 'tênis', 'bota', 'chinelo', 'havaianas', 'renner', 'riachuelo', 'c&a', 'marisa', 'zara', 'hm', 'forever 21', 'shein', 'moda'],
      keywords_en: ['clothes', 'clothing', 'shirt', 'pants', 'dress', 'skirt', 'jacket', 'coat', 'shoes', 'sneakers', 'boots', 'fashion', 'zara', 'h&m', 'gap', 'uniqlo', 'nike', 'adidas'],
      keywords_es: ['ropa', 'camisa', 'pantalón', 'vestido', 'falda', 'chaqueta', 'zapatos', 'tenis', 'moda', 'zara', 'h&m', 'shein']
    },
    { 
      name_pt: 'Eletrônicos', name_en: 'Electronics', name_es: 'Electrónicos',
      keywords_pt: ['eletronico', 'eletrônico', 'celular', 'smartphone', 'iphone', 'samsung', 'xiaomi', 'notebook', 'laptop', 'computador', 'pc', 'tablet', 'ipad', 'tv', 'televisao', 'televisão', 'fone', 'headphone', 'airpods', 'camera', 'câmera', 'console', 'kabum', 'pichau', 'terabyte', 'magazine luiza', 'magalu', 'casas bahia', 'americanas', 'amazon'],
      keywords_en: ['electronics', 'phone', 'smartphone', 'iphone', 'samsung', 'laptop', 'computer', 'tablet', 'ipad', 'tv', 'headphones', 'airpods', 'camera', 'amazon', 'best buy', 'apple'],
      keywords_es: ['electrónicos', 'celular', 'smartphone', 'iphone', 'samsung', 'laptop', 'computadora', 'tablet', 'tv', 'audífonos', 'cámara', 'amazon']
    },
    { 
      name_pt: 'Casa/Decoração', name_en: 'Home/Decor', name_es: 'Casa/Decoración',
      keywords_pt: ['casa', 'decoracao', 'decoração', 'movel', 'móvel', 'moveis', 'móveis', 'sofa', 'sofá', 'cama', 'mesa', 'cadeira', 'armario', 'armário', 'estante', 'tapete', 'cortina', 'luminaria', 'luminária', 'quadro', 'tok stok', 'tokstok', 'etna', 'leroy merlin', 'telha norte', 'ikea', 'camicado', 'le biscuit'],
      keywords_en: ['home', 'decor', 'furniture', 'sofa', 'bed', 'table', 'chair', 'closet', 'rug', 'curtain', 'lamp', 'ikea', 'wayfair', 'pottery barn', 'crate barrel', 'west elm'],
      keywords_es: ['casa', 'decoración', 'mueble', 'muebles', 'sofá', 'cama', 'mesa', 'silla', 'armario', 'alfombra', 'cortina', 'lámpara', 'ikea']
    },
    { 
      name_pt: 'Beleza/Cosméticos', name_en: 'Beauty/Cosmetics', name_es: 'Belleza/Cosméticos',
      keywords_pt: ['beleza', 'cosmetico', 'cosmético', 'maquiagem', 'make', 'perfume', 'shampoo', 'condicionador', 'creme', 'hidratante', 'protetor solar', 'esmalte', 'salao', 'salão', 'cabeleireiro', 'manicure', 'depilacao', 'depilação', 'natura', 'boticario', 'boticário', 'avon', 'sephora', 'mac', 'lancome', 'oboticario'],
      keywords_en: ['beauty', 'cosmetics', 'makeup', 'perfume', 'shampoo', 'cream', 'lotion', 'sunscreen', 'salon', 'hair', 'nails', 'sephora', 'ulta', 'mac', 'lancome'],
      keywords_es: ['belleza', 'cosméticos', 'maquillaje', 'perfume', 'champú', 'crema', 'protector solar', 'salón', 'peluquería', 'manicure', 'sephora']
    }
  ],
  // Financeiro / Financial
  'financeiro': [
    { 
      name_pt: 'Impostos', name_en: 'Taxes', name_es: 'Impuestos',
      keywords_pt: ['imposto', 'ir', 'irpf', 'iptu', 'ipva', 'icms', 'iss', 'taxa', 'tributo', 'darj', 'gru', 'multa', 'receita federal', 'inss', 'fgts', 'contribuicao', 'contribuição'],
      keywords_en: ['tax', 'taxes', 'irs', 'income tax', 'property tax', 'sales tax', 'fee', 'fine', 'penalty'],
      keywords_es: ['impuesto', 'impuestos', 'iva', 'isr', 'predial', 'tenencia', 'multa', 'sat', 'contribución']
    },
    { 
      name_pt: 'Seguro', name_en: 'Insurance', name_es: 'Seguro',
      keywords_pt: ['seguro', 'seguradora', 'porto seguro', 'bradesco seguros', 'sulamerica', 'azul seguros', 'tokio marine', 'liberty', 'apolice', 'apólice', 'sinistro', 'franquia', 'cobertura', 'seguro auto', 'seguro residencial', 'seguro vida'],
      keywords_en: ['insurance', 'policy', 'premium', 'coverage', 'claim', 'deductible', 'life insurance', 'car insurance', 'home insurance'],
      keywords_es: ['seguro', 'aseguradora', 'póliza', 'prima', 'cobertura', 'siniestro', 'deducible']
    },
    { 
      name_pt: 'Investimento', name_en: 'Investment', name_es: 'Inversión',
      keywords_pt: ['investimento', 'aplicacao', 'aplicação', 'acao', 'ação', 'acoes', 'ações', 'fundo', 'cdb', 'lci', 'lca', 'tesouro direto', 'poupanca', 'poupança', 'renda fixa', 'renda variavel', 'renda variável', 'xp', 'btg', 'nuinvest', 'rico', 'clear', 'corretora', 'b3', 'bolsa'],
      keywords_en: ['investment', 'stocks', 'bonds', 'fund', 'etf', 'savings', 'portfolio', 'broker', 'trading', '401k', 'ira', 'roth'],
      keywords_es: ['inversión', 'acciones', 'bonos', 'fondo', 'ahorro', 'portafolio', 'broker', 'bolsa', 'trading']
    },
    { 
      name_pt: 'Empréstimo', name_en: 'Loan', name_es: 'Préstamo',
      keywords_pt: ['emprestimo', 'empréstimo', 'financiamento', 'parcela', 'prestacao', 'prestação', 'divida', 'dívida', 'credito', 'crédito', 'consignado', 'pessoal', 'juros', 'amortizacao', 'amortização', 'carnê'],
      keywords_en: ['loan', 'financing', 'installment', 'debt', 'credit', 'interest', 'mortgage', 'payment'],
      keywords_es: ['préstamo', 'financiamiento', 'cuota', 'deuda', 'crédito', 'interés', 'hipoteca', 'pago']
    },
    { 
      name_pt: 'Tarifas Bancárias', name_en: 'Bank Fees', name_es: 'Tarifas Bancarias',
      keywords_pt: ['tarifa', 'taxa', 'anuidade', 'manutencao de conta', 'manutenção de conta', 'ted', 'doc', 'saque', 'extrato', 'iof', 'spread', 'banco', 'bancario', 'bancário'],
      keywords_en: ['fee', 'bank fee', 'maintenance', 'atm', 'withdrawal', 'transfer', 'overdraft', 'service charge'],
      keywords_es: ['tarifa', 'comisión', 'anualidad', 'mantenimiento', 'retiro', 'transferencia', 'banco']
    }
  ]
};

// Normalize category name to key for SUBCATEGORY_KEYWORDS lookup
function getCategoryKey(categoryName: string): string | null {
  const normalized = normalizeText(categoryName);
  const mapping: Record<string, string> = {
    'alimentacao': 'alimentacao',
    'food': 'alimentacao',
    'alimentacion': 'alimentacao',
    'transporte': 'transporte',
    'transportation': 'transporte',
    'moradia': 'moradia',
    'housing': 'moradia',
    'vivienda': 'moradia',
    'saude': 'saude',
    'health': 'saude',
    'salud': 'saude',
    'educacao': 'educacao',
    'education': 'educacao',
    'educacion': 'educacao',
    'lazer': 'lazer',
    'entertainment': 'lazer',
    'entretenimiento': 'lazer',
    'compras': 'compras',
    'shopping': 'compras',
    'financeiro': 'financeiro',
    'financial': 'financeiro',
    'financiero': 'financeiro'
  };
  return mapping[normalized] || null;
}

// EDGE Enrichment: Detect subcategory from message
interface SubcategoryEnrichmentResult {
  subcategoria: string | null;
  subcategoria_id: string | null;
  confianca_subcategoria: 'alta' | 'media' | 'baixa';
  subcategory_name_localized: string | null;
}

async function enrichSubcategory(
  supabase: any,
  message: string,
  categoryId: string | null,
  categoryName: string,
  userId: string,
  language: 'pt' | 'en' | 'es'
): Promise<SubcategoryEnrichmentResult> {
  const noMatch: SubcategoryEnrichmentResult = {
    subcategoria: null,
    subcategoria_id: null,
    confianca_subcategoria: 'baixa',
    subcategory_name_localized: null
  };

  if (!categoryId || !categoryName) {
    console.log('[EDGE] No category provided, skipping subcategory enrichment');
    return noMatch;
  }

  const categoryKey = getCategoryKey(categoryName);
  if (!categoryKey) {
    console.log('[EDGE] Category not mapped for subcategory enrichment:', categoryName);
    return noMatch;
  }

  const subcategoryDefinitions = SUBCATEGORY_KEYWORDS[categoryKey];
  if (!subcategoryDefinitions || subcategoryDefinitions.length === 0) {
    console.log('[EDGE] No subcategory definitions for category:', categoryKey);
    return noMatch;
  }

  const msgNormalized = normalizeText(message);
  console.log('[EDGE] Enriching subcategory for message:', msgNormalized.substring(0, 100));

  // Try to match keywords
  for (const subcat of subcategoryDefinitions) {
    const keywordsLang = subcat[`keywords_${language}` as keyof typeof subcat] as string[] || subcat.keywords_pt;
    
    for (const keyword of keywordsLang) {
      const keywordNorm = normalizeText(keyword);
      if (msgNormalized.includes(keywordNorm)) {
        console.log('[EDGE] Keyword match found:', keyword, '-> Subcategory:', subcat.name_pt);
        
        // Try to find the subcategory in user's subcategories
        const subcatNameLang = subcat[`name_${language}` as keyof typeof subcat] as string || subcat.name_pt;
        
        // First try exact match on name
        const { data: exactMatch } = await supabase
          .from('subcategories')
          .select('id, name, name_en, name_es')
          .eq('user_id', userId)
          .eq('category_id', categoryId)
          .or(`name.ilike.${subcat.name_pt},name_en.ilike.${subcat.name_en},name_es.ilike.${subcat.name_es}`)
          .is('deleted_at', null)
          .limit(1)
          .maybeSingle();

        if (exactMatch) {
          const localizedName = language === 'en' 
            ? (exactMatch.name_en || exactMatch.name)
            : language === 'es' 
              ? (exactMatch.name_es || exactMatch.name)
              : exactMatch.name;

          return {
            subcategoria: exactMatch.name,
            subcategoria_id: exactMatch.id,
            confianca_subcategoria: 'alta',
            subcategory_name_localized: localizedName
          };
        }

        // If no exact match, try partial match
        const { data: partialMatch } = await supabase
          .from('subcategories')
          .select('id, name, name_en, name_es')
          .eq('user_id', userId)
          .eq('category_id', categoryId)
          .or(`name.ilike.%${subcat.name_pt}%,name_en.ilike.%${subcat.name_en}%,name_es.ilike.%${subcat.name_es}%`)
          .is('deleted_at', null)
          .limit(1)
          .maybeSingle();

        if (partialMatch) {
          const localizedName = language === 'en' 
            ? (partialMatch.name_en || partialMatch.name)
            : language === 'es' 
              ? (partialMatch.name_es || partialMatch.name)
              : partialMatch.name;

          return {
            subcategoria: partialMatch.name,
            subcategoria_id: partialMatch.id,
            confianca_subcategoria: 'media',
            subcategory_name_localized: localizedName
          };
        }

        // Found keyword match but no subcategory in database
        console.log('[EDGE] Keyword matched but subcategory not found in database:', subcat.name_pt);
        return {
          subcategoria: subcat.name_pt,
          subcategoria_id: null,
          confianca_subcategoria: 'media',
          subcategory_name_localized: subcatNameLang
        };
      }
    }
  }

  console.log('[EDGE] No subcategory match found');
  return noMatch;
}

// ============================================================
// HELPER FUNCTIONS
// ============================================================

// Detect language from message
function detectLanguage(message: string): 'pt' | 'en' | 'es' {
  const msgLower = message.toLowerCase();
  const scores = { pt: 0, en: 0, es: 0 };
  
  for (const [lang, config] of Object.entries(LANGUAGE_PATTERNS)) {
    const langKey = lang as 'pt' | 'en' | 'es';
    
    for (const word of config.words) {
      const regex = new RegExp(`\\b${word}\\b`, 'i');
      if (regex.test(msgLower)) {
        scores[langKey] += 2;
      }
    }
    
    for (const pattern of config.patterns) {
      if (pattern.test(msgLower)) {
        scores[langKey] += 1;
      }
    }
  }
  
  const maxScore = Math.max(scores.pt, scores.en, scores.es);
  if (maxScore === 0) return 'pt';
  
  if (scores.en > scores.pt && scores.en > scores.es) return 'en';
  if (scores.es > scores.pt && scores.es > scores.en) return 'es';
  return 'pt';
}

// Format currency for display
function formatCurrencyDisplay(amount: number, currency: string): string {
  const symbols: Record<string, string> = { BRL: 'R$', USD: '$', EUR: '€' };
  const symbol = symbols[currency] || currency;
  return `${symbol} ${amount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// Helper: Validar se é um UUID válido
function isValidUUID(str: string | null | undefined): boolean {
  if (!str) return false;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}

// ============================================================
// FUNÇÃO DE NORMALIZAÇÃO DE TEXTO (REMOVE ACENTOS E ESPECIAIS)
// Converte "Itaú Pão de Açúcar" → "itau pao de acucar"
// ============================================================
function normalizeText(text: string): string {
  if (!text) return '';
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove diacríticos (acentos)
    .replace(/[^a-z0-9\s]/g, '')     // Remove caracteres especiais
    .trim();
}

// ============================================================
// CURRENCY CONVERSION FUNCTIONS
// ============================================================

interface ExchangeRate {
  base_currency: string;
  target_currency: string;
  rate: number;
}

// Get exchange rate from database
async function getExchangeRate(
  supabase: any,
  fromCurrency: string,
  toCurrency: string
): Promise<number | null> {
  if (fromCurrency === toCurrency) return 1;
  
  console.log(`[process-financial-input] Looking up exchange rate: ${fromCurrency} -> ${toCurrency}`);
  
  // Rates are stored as BRL -> target currency
  // So if we need USD -> BRL, we need 1 / (BRL -> USD rate)
  
  if (fromCurrency === 'BRL') {
    // BRL -> target currency (direct lookup)
    const { data, error } = await supabase
      .from('exchange_rates')
      .select('rate')
      .eq('base_currency', 'BRL')
      .eq('target_currency', toCurrency)
      .single();
    
    if (error || !data) {
      console.warn('[process-financial-input] Exchange rate not found:', error);
      return null;
    }
    
    console.log(`[process-financial-input] Found rate BRL -> ${toCurrency}: ${data.rate}`);
    return data.rate;
  } else if (toCurrency === 'BRL') {
    // target currency -> BRL (inverse of BRL -> source)
    const { data, error } = await supabase
      .from('exchange_rates')
      .select('rate')
      .eq('base_currency', 'BRL')
      .eq('target_currency', fromCurrency)
      .single();
    
    if (error || !data) {
      console.warn('[process-financial-input] Exchange rate not found:', error);
      return null;
    }
    
    // Inverse: if BRL -> USD is 0.18, then USD -> BRL is 1/0.18 = 5.55
    const inverseRate = 1 / data.rate;
    console.log(`[process-financial-input] Found inverse rate ${fromCurrency} -> BRL: ${inverseRate} (from ${data.rate})`);
    return inverseRate;
  } else {
    // Cross-rate: USD -> EUR = (USD -> BRL) * (BRL -> EUR)
    const { data: rateFrom } = await supabase
      .from('exchange_rates')
      .select('rate')
      .eq('base_currency', 'BRL')
      .eq('target_currency', fromCurrency)
      .single();
    
    const { data: rateTo } = await supabase
      .from('exchange_rates')
      .select('rate')
      .eq('base_currency', 'BRL')
      .eq('target_currency', toCurrency)
      .single();
    
    if (!rateFrom || !rateTo) {
      console.warn('[process-financial-input] Cross-rate not found');
      return null;
    }
    
    // Cross rate: (1/rateFrom) * rateTo
    const crossRate = rateTo.rate / rateFrom.rate;
    console.log(`[process-financial-input] Cross rate ${fromCurrency} -> ${toCurrency}: ${crossRate}`);
    return crossRate;
  }
}

// Convert amount between currencies
function convertCurrency(
  amount: number,
  rate: number
): number {
  // Work with cents to avoid floating point errors
  const amountCents = Math.round(amount * 100);
  const resultCents = Math.round(amountCents * rate);
  return resultCents / 100;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ success: false, error: 'Apenas POST é suportado' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const body = await req.json();
    const { input_id, force_confirm = false } = body;

    console.log('[process-financial-input] Processing input:', input_id);

    if (!input_id) {
      return new Response(
        JSON.stringify({ success: false, error: 'input_id é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ========================================
    // PASSO 1: Buscar input completo do banco
    // ========================================
    const { data: input, error: fetchError } = await supabase
      .from('incoming_financial_inputs')
      .select('*')
      .eq('id', input_id)
      .single();

    if (fetchError || !input) {
      console.error('[process-financial-input] Input not found:', input_id);
      return new Response(
        JSON.stringify({ success: false, error: 'Input não encontrado' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[process-financial-input] Input loaded:', {
      id: input.id,
      amount: input.amount,
      transaction_type: input.transaction_type,
      payment_method: input.payment_method,
      card_hint: input.card_hint,
      account_hint: input.account_hint,
      category_hint: input.category_hint,
      resolved_card_id: input.resolved_card_id,
      resolved_account_id: input.resolved_account_id,
      resolved_category_id: input.resolved_category_id,
      status: input.status
    });

    // Verificar se já foi processado
    if (input.processed_at) {
      console.log('[process-financial-input] Already processed:', input_id);
      return new Response(
        JSON.stringify({ 
          success: true, 
          status: 'processed',
          transaction_id: input.transaction_id,
          message: 'Transação já foi processada anteriormente'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Se force_confirm e status não é confirmed, confirmar primeiro
    if (force_confirm && input.status !== 'confirmed') {
      console.log('[process-financial-input] Force confirming input:', input_id);
      
      // Validar dados mínimos
      if (!input.amount || input.amount <= 0) {
        return new Response(
          JSON.stringify({ success: false, error: 'Valor inválido. Não é possível confirmar.' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (!input.transaction_type || !['expense', 'income'].includes(input.transaction_type)) {
        return new Response(
          JSON.stringify({ success: false, error: 'Tipo de transação inválido. Use expense ou income.' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { error: confirmError } = await supabase
        .from('incoming_financial_inputs')
        .update({ status: 'confirmed' })
        .eq('id', input_id);

      if (confirmError) {
        console.error('[process-financial-input] Confirm error:', confirmError);
        throw confirmError;
      }
    } else if (input.status === 'processed') {
      // Auto-confirm inputs that came from direct resolution (skip_ai_extraction flow)
      console.log('[process-financial-input] Auto-confirming processed input:', input_id);
      
      if (!input.amount || input.amount <= 0) {
        return new Response(
          JSON.stringify({ success: false, error: 'Valor inválido. Não é possível confirmar.' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { error: autoConfirmError } = await supabase
        .from('incoming_financial_inputs')
        .update({ status: 'confirmed', pending_question_field: null })
        .eq('id', input_id);

      if (autoConfirmError) {
        console.error('[process-financial-input] Auto-confirm error:', autoConfirmError);
        throw autoConfirmError;
      }
      
      input.status = 'confirmed';
    } else if (input.status !== 'confirmed') {
      console.log('[process-financial-input] Not confirmed:', input.status);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Input não está confirmado. Status atual: ${input.status}`,
          current_status: input.status,
          hint: 'Use force_confirm: true para forçar confirmação'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ========================================
    // PASSO 2: RESOLVER HINTS → IDs (NA EDGE)
    // ========================================
    console.log('[process-financial-input] Resolving hints to UUIDs...');

    let resolved_category_id: string | null = input.resolved_category_id;
    let resolved_card_id: string | null = input.resolved_card_id;
    let resolved_account_id: string | null = input.resolved_account_id;

    // 2.0 PRIORIDADE 0: Detectar instrução EXPLÍCITA do usuário ("classificar em X", "categorizar como X")
    if (!isValidUUID(resolved_category_id)) {
      const rawMsg = (input.raw_message || '').toLowerCase();
      const explicitCategoryPatterns = [
        /classificar\s+(?:em|como|na|no)\s+(.+?)(?:\s+no\s+cart[aã]o|\s+na\s+conta|\s*$|\s*,|\s*\.)/i,
        /categorizar\s+(?:em|como)\s+(.+?)(?:\s+no\s+cart[aã]o|\s+na\s+conta|\s*$|\s*,|\s*\.)/i,
        /categoria\s*[:\s]\s*(.+?)(?:\s+no\s+cart[aã]o|\s+na\s+conta|\s*$|\s*,|\s*\.)/i,
        /classify\s+(?:as|in|under)\s+(.+?)(?:\s+on\s+card|\s+in\s+account|\s*$|\s*,|\s*\.)/i,
        /clasificar\s+(?:en|como)\s+(.+?)(?:\s+en\s+tarjeta|\s+en\s+cuenta|\s*$|\s*,|\s*\.)/i,
      ];
      
      for (const pattern of explicitCategoryPatterns) {
        const match = rawMsg.match(pattern);
        if (match && match[1]) {
          const explicitCategory = match[1].trim();
          console.log('[process-financial-input] EXPLICIT CATEGORY INSTRUCTION detected:', explicitCategory);
          
          // Buscar categoria do usuário pelo nome explícito
          const { data: explicitCat } = await supabase
            .from('categories')
            .select('id, name')
            .eq('user_id', input.user_id)
            .is('deleted_at', null)
            .ilike('name', `%${explicitCategory}%`)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();
          
          if (explicitCat) {
            resolved_category_id = explicitCat.id;
            console.log('[process-financial-input] CATEGORY RESOLVED VIA EXPLICIT INSTRUCTION:', explicitCat.name);
          }
          break;
        }
      }
    }

    // 2.0b: Extrair card_hint de "no cartão X" se não já definido
    if (!input.card_hint && !isValidUUID(resolved_card_id)) {
      const rawMsg = (input.raw_message || '');
      const cardHintPatterns = [
        /no\s+cart[aã]o\s+(.+?)(?:\s*$|\s*,|\s*\.)/i,
        /on\s+(?:the\s+)?card\s+(.+?)(?:\s*$|\s*,|\s*\.)/i,
        /en\s+(?:la\s+)?tarjeta\s+(.+?)(?:\s*$|\s*,|\s*\.)/i,
      ];
      for (const pattern of cardHintPatterns) {
        const match = rawMsg.match(pattern);
        if (match && match[1]) {
          input.card_hint = match[1].trim();
          console.log('[process-financial-input] CARD HINT extracted from message:', input.card_hint);
          break;
        }
      }
    }

    // 2.1 PRIORIDADE 1: Resolver CATEGORIA por KEYWORDS da mensagem original (raw_message)
    // Somente se PRIORIDADE 0 (instrução explícita) não resolveu
    if (!isValidUUID(resolved_category_id)) {
      const rawMsgForLookup = (input.raw_message || '').toLowerCase();
      
      // Excluir palavras que são nomes de cartões/bancos/marcas de pagamento
      const brandExclusionWords = new Set([
        'mercado', 'pago', 'pagbank', 'pagseguro', 'picpay', 'stone', 'cielo',
        'nubank', 'inter', 'itau', 'bradesco', 'santander', 'caixa', 'sicredi',
        'sicoob', 'banrisul', 'safra', 'modal', 'daycoval', 'bmg', 'agibank',
        'next', 'neon', 'original', 'will', 'rico', 'clear',
        // Palavras de contexto que não devem pontuar categorias
        'classificar', 'categorizar', 'cartao', 'conta', 'resposta', 'usuario',
        'despesa', 'receita', 'gastei', 'paguei', 'comprei',
      ]);
      
      const rawWords = rawMsgForLookup
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9\s]/g, ' ')
        .split(/\s+/)
        .filter((w: string) => w.length > 3 && !brandExclusionWords.has(w));

      console.log('[process-financial-input] RAW MESSAGE KEYWORD LOOKUP - words:', rawWords.slice(0, 10));

      if (rawWords.length > 0) {
        const { data: allTagsForScoring } = await supabase
          .from('category_tags')
          .select('id, name_pt, keywords_pt, keywords_en, keywords_es');

        if (allTagsForScoring && allTagsForScoring.length > 0) {
          const allTagIds = allTagsForScoring.map((t: { id: string }) => t.id);
          const { data: allRelationsForScoring } = await supabase
            .from('category_tag_relations')
            .select('tag_id, category_id')
            .in('tag_id', allTagIds)
            .eq('is_active', true);

          if (allRelationsForScoring && allRelationsForScoring.length > 0) {
            const tagCategoryCount: Record<string, number> = {};
            const tagToDefaultCategories: Record<string, string[]> = {};
            for (const rel of allRelationsForScoring) {
              if (!tagToDefaultCategories[rel.tag_id]) tagToDefaultCategories[rel.tag_id] = [];
              tagToDefaultCategories[rel.tag_id].push(rel.category_id);
              tagCategoryCount[rel.tag_id] = (tagCategoryCount[rel.tag_id] || 0) + 1;
            }

            const categoryScores: Record<string, number> = {};
            const categoryMatchDetails: Record<string, string[]> = {};

            for (const word of rawWords) {
              for (const tag of allTagsForScoring) {
                const allKeywords = [
                  ...(tag.keywords_pt || []),
                  ...(tag.keywords_en || []),
                  ...(tag.keywords_es || [])
                ].map((k: string) => k.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''));

                if (allKeywords.includes(word)) {
                  const catCount = tagCategoryCount[tag.id] || 1;
                  const weight = catCount === 1 ? 10 : catCount <= 3 ? 5 : 1;
                  const defaultCats = tagToDefaultCategories[tag.id] || [];

                  for (const defaultCatId of defaultCats) {
                    categoryScores[defaultCatId] = (categoryScores[defaultCatId] || 0) + weight;
                    if (!categoryMatchDetails[defaultCatId]) categoryMatchDetails[defaultCatId] = [];
                    categoryMatchDetails[defaultCatId].push(`${word}→${tag.name_pt}(w${weight})`);
                  }
                }
              }
            }

            console.log('[process-financial-input] KEYWORD SCORING results:', categoryScores, categoryMatchDetails);

            const sortedCategories = Object.entries(categoryScores).sort((a, b) => b[1] - a[1]);
            if (sortedCategories.length > 0) {
              const bestDefaultCatId = sortedCategories[0][0];
              const bestScore = sortedCategories[0][1];
              console.log('[process-financial-input] BEST KEYWORD MATCH: default_category=', bestDefaultCatId, 'score=', bestScore);

              const { data: userCatByKeyword } = await supabase
                .from('categories')
                .select('id, name')
                .eq('user_id', input.user_id)
                .eq('default_category_id', bestDefaultCatId)
                .is('deleted_at', null)
                .limit(1)
                .single();

              if (userCatByKeyword) {
                resolved_category_id = userCatByKeyword.id;
                console.log('[process-financial-input] CATEGORY RESOLVED VIA RAW MESSAGE KEYWORDS:', userCatByKeyword.name, '(score:', bestScore, ')');
              }
            }
          }
        }
      }
    }

    // 2.1b PRIORIDADE 2: Resolver CATEGORIA por category_hint da IA (FALLBACK)
    if (!isValidUUID(resolved_category_id) && input.category_hint) {
      console.log('[process-financial-input] FALLBACK: Resolving category from AI hint:', input.category_hint);
      const searchTerm = input.category_hint.trim().toLowerCase();
      
      // Buscar em keywords_pt, en, es
      let tagMatches: any[] = [];
      
      const { data: tagByKeywordPt } = await supabase
        .from('category_tags')
        .select('id, name_pt, name_en, name_es, keywords_pt, keywords_en, keywords_es')
        .contains('keywords_pt', [searchTerm]);
      
      if (tagByKeywordPt && tagByKeywordPt.length > 0) {
        tagMatches = tagByKeywordPt;
      }
      
      if (tagMatches.length === 0) {
        const { data: tagByKeywordEn } = await supabase
          .from('category_tags')
          .select('id, name_pt, name_en, name_es, keywords_pt, keywords_en, keywords_es')
          .contains('keywords_en', [searchTerm]);
        if (tagByKeywordEn && tagByKeywordEn.length > 0) tagMatches = tagByKeywordEn;
      }
      
      if (tagMatches.length === 0) {
        const { data: tagByKeywordEs } = await supabase
          .from('category_tags')
          .select('id, name_pt, name_en, name_es, keywords_pt, keywords_en, keywords_es')
          .contains('keywords_es', [searchTerm]);
        if (tagByKeywordEs && tagByKeywordEs.length > 0) tagMatches = tagByKeywordEs;
      }
      
      // FALLBACK: nome parcial
      if (tagMatches.length === 0) {
        let { data: tagByName } = await supabase
          .from('category_tags')
          .select('id, name_pt, name_en, name_es')
          .ilike('name_pt', `%${searchTerm}%`);
        
        if (!tagByName || tagByName.length === 0) {
          const { data: tagByNameEn } = await supabase
            .from('category_tags')
            .select('id, name_pt, name_en, name_es')
            .ilike('name_en', `%${searchTerm}%`);
          tagByName = tagByNameEn;
        }
        
        if (tagByName && tagByName.length > 0) tagMatches = tagByName;
      }
      
      if (tagMatches && tagMatches.length > 0) {
        const tagIds = tagMatches.map((t: { id: string }) => t.id);
        const { data: relations } = await supabase
          .from('category_tag_relations')
          .select('category_id')
          .in('tag_id', tagIds)
          .eq('is_active', true)
          .limit(1);
        
        if (relations && relations.length > 0) {
          const defaultCategoryId = relations[0].category_id;
          
          const { data: userCategory } = await supabase
            .from('categories')
            .select('id, name')
            .eq('user_id', input.user_id)
            .eq('default_category_id', defaultCategoryId)
            .is('deleted_at', null)
            .limit(1)
            .single();
          
          if (userCategory) {
            resolved_category_id = userCategory.id;
            console.log('[process-financial-input] Category resolved via AI HINT TAG/KEYWORD:', searchTerm, '->', userCategory.name);
          }
        }
      }
      
      // FALLBACK: Busca direta pelo nome
      if (!resolved_category_id) {
        const { data: category } = await supabase
          .from('categories')
          .select('id')
          .eq('user_id', input.user_id)
          .ilike('name', `%${input.category_hint}%`)
          .is('deleted_at', null)
          .limit(1)
          .single();

        if (category?.id) {
          resolved_category_id = category.id;
          console.log('[process-financial-input] Category resolved by NAME:', resolved_category_id);
        }
      }
    }

    // 2.2 Resolver CARTÃO se payment_method = credit_card (busca inteligente COM PRIORIZAÇÃO POR TIPO)
    if (input.payment_method === 'credit_card') {
      if (!isValidUUID(resolved_card_id) && input.card_hint) {
        console.log('[process-financial-input] Resolving card from hint:', input.card_hint);
        
        // Palavras genéricas a ignorar na busca
        const stopWords = ['banco', 'cartão', 'cartao', 'card', 'de', 'do', 'da', 'credito', 'crédito'];
        
        // Extrair palavras relevantes do hint
        const words = input.card_hint.trim().toLowerCase().split(/\s+/)
          .filter((w: string) => w.length > 2 && !stopWords.includes(w));
        
        console.log('[process-financial-input] Card search keywords:', words);
        
        // Buscar todos os cartões do usuário COM TIPO
        const { data: cards } = await supabase
          .from('cards')
          .select('id, name, card_type')
          .eq('user_id', input.user_id)
          .is('deleted_at', null);
        
        if (cards && cards.length > 0) {
          // Separar cartões por tipo
          const creditCards = cards.filter((c: { card_type: string }) => c.card_type === 'credit');
          const debitCards = cards.filter((c: { card_type: string }) => c.card_type === 'debit');
          
          console.log('[process-financial-input] Cards by type - Credit:', creditCards.length, 'Debit:', debitCards.length);
          
          // Função de busca reutilizável COM NORMALIZAÇÃO DE ACENTOS
          const findCardInList = (cardList: typeof cards) => {
            const normalizedHint = normalizeText(input.card_hint);
            
            // Primeiro: busca exata normalizada
            let match = cardList.find((card: { id: string; name: string; card_type: string }) => 
              normalizeText(card.name) === normalizedHint
            );
            
            // Segundo: busca por substring completa normalizada
            if (!match) {
              match = cardList.find((card: { id: string; name: string; card_type: string }) => 
                normalizeText(card.name).includes(normalizedHint)
              );
            }
            
            // Terceiro: hint normalizado contém nome normalizado do cartão
            if (!match) {
              match = cardList.find((card: { id: string; name: string; card_type: string }) => 
                normalizedHint.includes(normalizeText(card.name))
              );
            }
            
            // Quarto: busca por palavras-chave normalizadas
            if (!match && words.length > 0) {
              const normalizedWords = words.map((w: string) => normalizeText(w));
              match = cardList.find((card: { id: string; name: string; card_type: string }) => {
                const cardName = normalizeText(card.name);
                return normalizedWords.some((word: string) => cardName.includes(word));
              });
            }
            
            return match;
          };
          
          // PRIORIZAR CARTÕES DE CRÉDITO (já que payment_method é credit_card)
          let match = findCardInList(creditCards);
          
          if (match) {
            console.log('[process-financial-input] Found CREDIT card match:', match.name);
          } else {
            // Se não encontrar crédito, tentar débito como fallback
            match = findCardInList(debitCards);
            if (match) {
              console.log('[process-financial-input] WARNING: Only found DEBIT card match:', match.name, '(payment_method is credit_card)');
            }
          }
          
          if (match) {
            resolved_card_id = match.id;
            console.log('[process-financial-input] Card resolved:', input.card_hint, '->', match.name, '(type:', match.card_type, ')');
          } else {
            console.log('[process-financial-input] Card not found for hint:', input.card_hint, 'Available:', cards.map((c: { name: string; card_type: string }) => `${c.name} (${c.card_type})`));
          }
        }
      }

      // Se ainda não tem card_id, buscar cartão padrão (apenas crédito)
      if (!isValidUUID(resolved_card_id)) {
        console.log('[process-financial-input] No card found, searching default CREDIT card...');
        
        const { data: defaultCard } = await supabase
          .from('cards')
          .select('id, name')
          .eq('user_id', input.user_id)
          .eq('card_type', 'credit')
          .is('deleted_at', null)
          .limit(1)
          .single();

        if (defaultCard?.id) {
          resolved_card_id = defaultCard.id;
          console.log('[process-financial-input] Default credit card used:', defaultCard.name, resolved_card_id);
        }
      }
    }

    // 2.3 Resolver CONTA se payment_method != credit_card
    if (input.payment_method !== 'credit_card') {
      if (!isValidUUID(resolved_account_id) && input.account_hint) {
        console.log('[process-financial-input] Resolving account from hint:', input.account_hint);
        
        const { data: account } = await supabase
          .from('accounts')
          .select('id')
          .eq('user_id', input.user_id)
          .ilike('name', `%${input.account_hint}%`)
          .is('deleted_at', null)
          .limit(1)
          .single();

        if (account?.id) {
          resolved_account_id = account.id;
          console.log('[process-financial-input] Account resolved:', resolved_account_id);
        }
      }

      // Se ainda não tem account_id, buscar conta padrão
      if (!isValidUUID(resolved_account_id)) {
        console.log('[process-financial-input] No account found, searching default account...');
        
        const { data: defaultAccount } = await supabase
          .from('accounts')
          .select('id')
          .eq('user_id', input.user_id)
          .is('deleted_at', null)
          .order('created_at', { ascending: true })
          .limit(1)
          .single();

        if (defaultAccount?.id) {
          resolved_account_id = defaultAccount.id;
          console.log('[process-financial-input] Default account used:', resolved_account_id);
        }
      }
    }

    // ========================================
    // PASSO 3: VALIDAÇÕES OBRIGATÓRIAS
    // ========================================
    console.log('[process-financial-input] Validating resolved IDs...');

    // 3.1 Categoria é obrigatória para WhatsApp
    if (input.source === 'whatsapp' && !isValidUUID(resolved_category_id)) {
      console.log('[process-financial-input] WhatsApp input missing category');
      return new Response(
        JSON.stringify({ 
          success: false, 
          status: 'error',
          error: 'Categoria é obrigatória para transações via WhatsApp',
          error_code: 'CATEGORY_REQUIRED',
          hint: input.category_hint 
            ? `Categoria "${input.category_hint}" não foi encontrada. Crie a categoria ou use um nome existente.`
            : 'Informe a categoria na mensagem (ex: "gastei 50 em alimentação")'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 3.2 Determinar resource_id baseado no payment_method
    let resource_id: string | null = null;
    let resource_type: 'card' | 'account' | null = null;

    if (input.payment_method === 'credit_card') {
      if (!isValidUUID(resolved_card_id)) {
        console.error('[process-financial-input] CRITICAL: No valid card_id for credit_card payment');
        return new Response(
          JSON.stringify({ 
            success: false, 
            status: 'error',
            error: 'Cartão de crédito não encontrado',
            error_code: 'CARD_NOT_FOUND',
            hint: input.card_hint 
              ? `Cartão "${input.card_hint}" não foi encontrado. Verifique o nome ou cadastre o cartão.`
              : 'Nenhum cartão de crédito cadastrado para este usuário.'
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      resource_id = resolved_card_id;
      resource_type = 'card';
    } else {
      // Para pix, débito, dinheiro → usa conta
      if (!isValidUUID(resolved_account_id)) {
        console.error('[process-financial-input] CRITICAL: No valid account_id for non-credit payment');
        return new Response(
          JSON.stringify({ 
            success: false, 
            status: 'error',
            error: 'Conta não encontrada',
            error_code: 'ACCOUNT_NOT_FOUND',
            hint: input.account_hint 
              ? `Conta "${input.account_hint}" não foi encontrada. Verifique o nome ou cadastre a conta.`
              : 'Nenhuma conta cadastrada para este usuário.'
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      resource_id = resolved_account_id;
      resource_type = 'account';
    }

    console.log('[process-financial-input] Resource resolved:', { resource_id, resource_type });

    // ========================================
    // PASSO 4: EDGE - ENRIQUECIMENTO DE SUBCATEGORIA
    // ========================================
    console.log('[EDGE] Starting subcategory enrichment...');
    const detectedLanguageForEdge = detectLanguage(input.raw_message || '');
    
    // Buscar nome da categoria para o EDGE
    let categoryNameForEdge = '';
    if (resolved_category_id) {
      const { data: catData } = await supabase
        .from('categories')
        .select('name')
        .eq('id', resolved_category_id)
        .maybeSingle();
      if (catData) {
        categoryNameForEdge = catData.name;
      }
    }
    
    // Executar enriquecimento EDGE
    const subcategoryEnrichment = await enrichSubcategory(
      supabase,
      input.raw_message || input.description_hint || '',
      resolved_category_id,
      categoryNameForEdge,
      input.user_id,
      detectedLanguageForEdge
    );
    
    console.log('[EDGE] Subcategory enrichment result:', subcategoryEnrichment);

    // ========================================
    // PASSO 4.1: ATUALIZAR INPUT COM IDs RESOLVIDOS + SUBCATEGORIA
    // ========================================
    const { error: updateError } = await supabase
      .from('incoming_financial_inputs')
      .update({
        resolved_category_id,
        resolved_card_id,
        resolved_account_id,
        subcategory_hint: subcategoryEnrichment.subcategoria,
        resolved_subcategory_id: subcategoryEnrichment.subcategoria_id,
        subcategory_confidence: subcategoryEnrichment.confianca_subcategoria,
        status: 'confirmed'
      })
      .eq('id', input_id);

    if (updateError) {
      console.error('[process-financial-input] Update error:', updateError);
      throw updateError;
    }

    console.log('[process-financial-input] Input updated with resolved IDs and subcategory');

    // ========================================
    // PASSO 4.5: DETECTAR MOEDAS E CONVERTER SE NECESSÁRIO
    // (Precisa vir antes da validação de saldo)
    // ========================================
    const detectedLanguage = detectLanguage(input.raw_message || '');
    console.log('[process-financial-input] Detected language:', detectedLanguage);
    
    // Moeda original do gasto (extraída pela IA)
    const originalCurrency = input.currency || 'BRL';
    const originalAmount = Math.abs(input.amount);
    
    // Buscar moeda da conta/cartão destino
    let targetCurrency = 'BRL';
    let targetResourceName = '';
    
    if (resource_type === 'account' && resolved_account_id) {
      const { data: accountCurrencyData } = await supabase
        .from('accounts')
        .select('currency, name')
        .eq('id', resolved_account_id)
        .single();
      
      if (accountCurrencyData) {
        targetCurrency = accountCurrencyData.currency || 'BRL';
        targetResourceName = accountCurrencyData.name;
      }
    } else if (resource_type === 'card' && resolved_card_id) {
      const { data: cardCurrencyData } = await supabase
        .from('cards')
        .select('currency, name')
        .eq('id', resolved_card_id)
        .single();
      
      if (cardCurrencyData) {
        targetCurrency = cardCurrencyData.currency || 'BRL';
        targetResourceName = cardCurrencyData.name;
      }
    }
    
    console.log('[process-financial-input] Currency check:', { 
      originalCurrency, 
      targetCurrency, 
      resourceName: targetResourceName 
    });
    
    // Converter moeda se necessário
    let finalAmount = originalAmount;
    let exchangeRateUsed: number | null = null;
    let amountOriginal: number | null = null;
    let currencyOriginal: string | null = null;
    
    if (originalCurrency !== targetCurrency) {
      console.log('[process-financial-input] Currency conversion needed:', originalCurrency, '->', targetCurrency);
      
      const rate = await getExchangeRate(supabase, originalCurrency, targetCurrency);
      
      if (rate) {
        exchangeRateUsed = rate;
        amountOriginal = originalAmount;
        currencyOriginal = originalCurrency;
        finalAmount = convertCurrency(originalAmount, rate);
        
        console.log('[process-financial-input] Conversion result:', {
          originalAmount,
          originalCurrency,
          rate,
          finalAmount,
          targetCurrency
        });
      } else {
        console.warn('[process-financial-input] Exchange rate not found, using original amount');
      }
    }

    // ========================================
    // PASSO 4.6: VALIDAR SALDO DA CONTA (se for despesa e usar conta)
    // Agora usando o valor CONVERTIDO
    // ========================================
    if (resource_type === 'account' && resolved_account_id && input.transaction_type === 'expense') {
      console.log('[process-financial-input] Validating account balance for expense...');
      
      const { data: accountData, error: accountError } = await supabase
        .from('accounts')
        .select('balance, name, currency, overdraft_limit')
        .eq('id', resolved_account_id)
        .single();

      if (accountError || !accountData) {
        console.error('[process-financial-input] Could not fetch account for balance check:', accountError);
        return new Response(
          JSON.stringify({ 
            success: false, 
            status: 'error',
            error: 'Não foi possível verificar o saldo da conta.',
            error_code: 'ACCOUNT_FETCH_ERROR',
            hint: 'Tente novamente ou verifique se a conta existe.'
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Calcular saldo disponível (saldo atual + limite de cheque especial)
      const currentBalance = accountData.balance || 0;
      const overdraftLimit = accountData.overdraft_limit || 0;
      const availableBalance = currentBalance + overdraftLimit;
      // Usar valor CONVERTIDO para validação de saldo
      const transactionAmount = finalAmount;

      console.log('[process-financial-input] Balance check (converted amount):', { 
        currentBalance, 
        overdraftLimit, 
        availableBalance, 
        transactionAmount,
        accountName: accountData.name,
        originalAmount: amountOriginal,
        originalCurrency: currencyOriginal
      });

      if (transactionAmount > availableBalance) {
        console.log('[process-financial-input] INSUFFICIENT_BALANCE - Rejecting transaction');
        
        const formattedBalance = formatCurrencyDisplay(currentBalance, accountData.currency || 'BRL');
        const formattedAvailable = formatCurrencyDisplay(availableBalance, accountData.currency || 'BRL');
        const formattedAmount = formatCurrencyDisplay(transactionAmount, targetCurrency);

        return new Response(
          JSON.stringify({ 
            success: false, 
            status: 'error',
            error: `Saldo insuficiente na conta "${accountData.name}".`,
            error_code: 'INSUFFICIENT_BALANCE',
            hint: `Saldo atual: ${formattedBalance}. Disponível (com limite): ${formattedAvailable}. Valor da transação: ${formattedAmount}.`,
            details: {
              account_name: accountData.name,
              current_balance: currentBalance,
              available_balance: availableBalance,
              requested_amount: transactionAmount,
              currency: accountData.currency || 'BRL'
            }
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }



    // ========================================
    // PASSO 6: CRIAR TRANSAÇÃO
    // ========================================
    console.log('[process-financial-input] Creating transaction...');

    const transactionDate = input.transaction_date || new Date().toISOString().split('T')[0];
    const description = input.description_hint || input.raw_message || 'Transação via WhatsApp';

    // Criar transação (owner_user é definido automaticamente pelo trigger set_owner_user_on_insert)
    const transactionData: any = {
      user_id: input.user_id,
      amount: finalAmount, // Valor convertido (ou original se mesma moeda)
      type: input.transaction_type,
      description: description,
      transaction_date: transactionDate,
      category_id: resolved_category_id,
      payment_method: input.payment_method || 'pix',
      currency: targetCurrency, // Moeda da conta/cartão
      status: 'completed',
      // Campos de rastreamento de conversão
      amount_original: amountOriginal,
      currency_original: currencyOriginal,
      exchange_rate_used: exchangeRateUsed
    };

    // EDGE: Adicionar subcategory_id se encontrada com confiança alta/média
    if (subcategoryEnrichment.subcategoria_id && 
        (subcategoryEnrichment.confianca_subcategoria === 'alta' || subcategoryEnrichment.confianca_subcategoria === 'media')) {
      transactionData.subcategory_id = subcategoryEnrichment.subcategoria_id;
      console.log('[EDGE] Subcategory added to transaction:', subcategoryEnrichment.subcategoria_id);
    }

    // Adicionar card_id ou account_id conforme o tipo
    if (resource_type === 'card') {
      transactionData.card_id = resource_id;
    } else {
      transactionData.account_id = resource_id;
    }

    console.log('[process-financial-input] Transaction data:', transactionData);

    const { data: transaction, error: transactionError } = await supabase
      .from('transactions')
      .insert(transactionData)
      .select('id')
      .single();

    if (transactionError) {
      console.error('[process-financial-input] Transaction insert error:', transactionError);
      throw transactionError;
    }

    console.log('[process-financial-input] Transaction created:', transaction.id);

    // ========================================
    // PASSO 7: ATUALIZAR SALDO (se for conta)
    // ========================================
    if (resource_type === 'account' && resolved_account_id) {
      const balanceChange = input.transaction_type === 'income' 
        ? finalAmount 
        : -finalAmount;

      const { error: balanceError } = await supabase.rpc('update_account_balance', {
        p_account_id: resolved_account_id,
        p_amount: balanceChange
      });

      if (balanceError) {
        console.warn('[process-financial-input] Balance update warning:', balanceError);
        // Não falhar por causa disso, a transação já foi criada
      } else {
        console.log('[process-financial-input] Account balance updated');
      }
    }

    // ========================================
    // PASSO 8: ATUALIZAR SALDO DO CARTÃO (se for cartão)
    // ========================================
    if (resource_type === 'card' && resolved_card_id && input.transaction_type === 'expense') {
      const { error: cardBalanceError } = await supabase
        .from('cards')
        .update({ 
          current_balance: supabase.rpc('get_card_balance', { p_card_id: resolved_card_id })
        })
        .eq('id', resolved_card_id);

      // Alternativa: incrementar diretamente
      const { data: currentCard } = await supabase
        .from('cards')
        .select('current_balance')
        .eq('id', resolved_card_id)
        .single();

      if (currentCard) {
        const newBalance = (currentCard.current_balance || 0) + finalAmount;
        await supabase
          .from('cards')
          .update({ current_balance: newBalance })
          .eq('id', resolved_card_id);
        
        console.log('[process-financial-input] Card balance updated:', newBalance);
      }
    }

    // ========================================
    // PASSO 9: CRIAR REGISTRO NO CASH FLOW (se for conta)
    // ========================================
    if (resource_type === 'account' && resolved_account_id) {
      const { data: accountData } = await supabase
        .from('accounts')
        .select('balance, name')
        .eq('id', resolved_account_id)
        .single();

      if (accountData) {
        const balanceChange = input.transaction_type === 'income' 
          ? finalAmount 
          : -finalAmount;

        const cashFlowData = {
          user_id: input.user_id,
          transaction_id: transaction.id,
          account_id: resolved_account_id,
          account_name: accountData.name,
          category_id: resolved_category_id,
          amount: finalAmount,
          movement_type: input.transaction_type,
          movement_date: transactionDate,
          description: description,
          balance_before: accountData.balance - balanceChange,
          balance_after: accountData.balance,
          currency: targetCurrency,
          owner_user: input.owner_user || 'user1',
          payment_method: input.payment_method || 'pix'
        };

        const { error: cashFlowError } = await supabase
          .from('cash_flow_history')
          .insert(cashFlowData);

        if (cashFlowError) {
          console.warn('[process-financial-input] Cash flow insert warning:', cashFlowError);
        } else {
          console.log('[process-financial-input] Cash flow record created');
        }
      }
    }

    // ========================================
    // PASSO 10: MARCAR INPUT COMO PROCESSADO
    // ========================================
    const { error: finalUpdateError } = await supabase
      .from('incoming_financial_inputs')
      .update({
        status: 'processed',
        processed_at: new Date().toISOString(),
        transaction_id: transaction.id
      })
      .eq('id', input_id);

    if (finalUpdateError) {
      console.error('[process-financial-input] Final update error:', finalUpdateError);
      // Não falhar, transação já foi criada
    }

    console.log('[process-financial-input] SUCCESS - Transaction created:', transaction.id);

    // ========================================
    // PASSO 11: BUSCAR NOME DA CATEGORIA
    // ========================================
    let categoryName = 'Sem categoria';
    if (resolved_category_id) {
      const { data: categoryData } = await supabase
        .from('categories')
        .select('name')
        .eq('id', resolved_category_id)
        .single();
      
      if (categoryData) {
        categoryName = categoryData.name;
      }
    }

    // ========================================
    // RESPOSTA FINAL (MULTI-IDIOMA) - COM SUBCATEGORIA
    // ========================================
    const msgs = RESPONSE_MESSAGES[detectedLanguage];
    const formattedOriginal = formatCurrencyDisplay(originalAmount, originalCurrency);
    const formattedConverted = formatCurrencyDisplay(finalAmount, targetCurrency);
    
    // Determinar nome da subcategoria a exibir (apenas se confiança alta ou média)
    const subcategoryToDisplay = (subcategoryEnrichment.confianca_subcategoria === 'alta' || subcategoryEnrichment.confianca_subcategoria === 'media')
      ? subcategoryEnrichment.subcategory_name_localized
      : null;
    
    let responseMessage: string;
    if (input.transaction_type === 'income') {
      responseMessage = msgs.incomeRecorded(
        formattedOriginal.split(' ')[1] || formattedOriginal, // Amount without symbol
        originalCurrency,
        formattedConverted.split(' ')[1] || formattedConverted,
        targetCurrency,
        exchangeRateUsed,
        categoryName,
        subcategoryToDisplay
      );
    } else {
      responseMessage = msgs.expenseRecorded(
        formattedOriginal.split(' ')[1] || formattedOriginal,
        originalCurrency,
        formattedConverted.split(' ')[1] || formattedConverted,
        targetCurrency,
        exchangeRateUsed,
        categoryName,
        subcategoryToDisplay
      );
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        status: 'processed',
        transaction_id: transaction.id,
        message: responseMessage,
        language: detectedLanguage,
        details: {
          amount: finalAmount,
          amount_original: amountOriginal,
          currency: targetCurrency,
          currency_original: currencyOriginal,
          exchange_rate: exchangeRateUsed,
          category_id: resolved_category_id,
          category_name: categoryName,
          subcategory_id: subcategoryEnrichment.subcategoria_id,
          subcategory_name: subcategoryEnrichment.subcategoria,
          subcategory_confidence: subcategoryEnrichment.confianca_subcategoria,
          resource_type,
          resource_id,
          transaction_type: input.transaction_type
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[process-financial-input] Error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        status: 'error',
        error: error.message 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
