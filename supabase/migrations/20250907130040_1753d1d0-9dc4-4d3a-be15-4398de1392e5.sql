-- Add comprehensive default tags for income and expenses
INSERT INTO public.category_tags (name_pt, name_en, name_es, color, keywords_pt, keywords_en, keywords_es) VALUES
-- Income tags
('Salário Mensal', 'Monthly Salary', 'Salario Mensual', '#10B981', ARRAY['salário', 'pagamento', 'mensal', 'trabalho'], ARRAY['salary', 'payment', 'monthly', 'work'], ARRAY['salario', 'pago', 'mensual', 'trabajo']),
('13º Salário', '13th Salary', '13er Salario', '#10B981', ARRAY['décimo terceiro', 'gratificação', 'natal'], ARRAY['thirteenth', 'bonus', 'christmas'], ARRAY['decimotercero', 'gratificacion', 'navidad']),
('PLR/Participação', 'Profit Sharing', 'Participación Utilidades', '#10B981', ARRAY['plr', 'participação', 'lucros', 'resultado'], ARRAY['profit sharing', 'bonus', 'results'], ARRAY['participacion', 'beneficios', 'resultados']),
('Freelance', 'Freelance', 'Freelance', '#10B981', ARRAY['freelance', 'autônomo', 'projeto', 'serviço'], ARRAY['freelance', 'independent', 'project', 'service'], ARRAY['freelance', 'autonomo', 'proyecto', 'servicio']),
('Vendas', 'Sales', 'Ventas', '#10B981', ARRAY['vendas', 'comissão', 'comercial'], ARRAY['sales', 'commission', 'commercial'], ARRAY['ventas', 'comision', 'comercial']),
('Aluguel Recebido', 'Rent Received', 'Alquiler Recibido', '#10B981', ARRAY['aluguel', 'locação', 'imóvel', 'propriedade'], ARRAY['rent', 'rental', 'property', 'real estate'], ARRAY['alquiler', 'renta', 'propiedad', 'inmueble']),
('Dividendos', 'Dividends', 'Dividendos', '#10B981', ARRAY['dividendos', 'ações', 'investimento', 'bolsa'], ARRAY['dividends', 'stocks', 'investment', 'shares'], ARRAY['dividendos', 'acciones', 'inversion', 'bolsa']),
('Cashback', 'Cashback', 'Cashback', '#10B981', ARRAY['cashback', 'dinheiro de volta', 'recompensa'], ARRAY['cashback', 'money back', 'reward'], ARRAY['cashback', 'dinero de vuelta', 'recompensa']),
('Reembolso', 'Reimbursement', 'Reembolso', '#10B981', ARRAY['reembolso', 'devolução', 'restituição'], ARRAY['reimbursement', 'refund', 'return'], ARRAY['reembolso', 'devolucion', 'restitucion']),
('PIX Recebido', 'PIX Received', 'PIX Recibido', '#10B981', ARRAY['pix', 'transferência', 'recebimento'], ARRAY['pix', 'transfer', 'received'], ARRAY['pix', 'transferencia', 'recibido']),
('Aposentadoria', 'Retirement', 'Jubilación', '#10B981', ARRAY['aposentadoria', 'inss', 'previdência'], ARRAY['retirement', 'pension', 'social security'], ARRAY['jubilacion', 'pension', 'seguridad social']),
('Auxílio/Benefício', 'Government Aid', 'Ayuda Gubernamental', '#10B981', ARRAY['auxílio', 'benefício', 'governo', 'social'], ARRAY['aid', 'benefit', 'government', 'social'], ARRAY['ayuda', 'beneficio', 'gobierno', 'social']),

-- Additional expense tags
('Mercado', 'Grocery Store', 'Supermercado', '#EF4444', ARRAY['mercado', 'supermercado', 'feira', 'compras'], ARRAY['grocery', 'supermarket', 'shopping', 'food'], ARRAY['mercado', 'supermercado', 'compras', 'comida']),
('Gasolina', 'Gasoline', 'Gasolina', '#EF4444', ARRAY['gasolina', 'combustível', 'posto', 'carro'], ARRAY['gasoline', 'fuel', 'gas station', 'car'], ARRAY['gasolina', 'combustible', 'gasolinera', 'coche']),
('Farmácia', 'Pharmacy', 'Farmacia', '#EF4444', ARRAY['farmácia', 'remédio', 'medicamento', 'saúde'], ARRAY['pharmacy', 'medicine', 'medication', 'health'], ARRAY['farmacia', 'medicina', 'medicamento', 'salud']),
('Internet', 'Internet', 'Internet', '#EF4444', ARRAY['internet', 'wi-fi', 'banda larga', 'conexão'], ARRAY['internet', 'wi-fi', 'broadband', 'connection'], ARRAY['internet', 'wi-fi', 'banda ancha', 'conexion']),
('Celular', 'Mobile Phone', 'Teléfono Móvil', '#EF4444', ARRAY['celular', 'telefone', 'móvel', 'operadora'], ARRAY['mobile', 'phone', 'cell phone', 'carrier'], ARRAY['celular', 'telefono', 'movil', 'operadora']),
('Cartão de Crédito', 'Credit Card', 'Tarjeta de Crédito', '#EF4444', ARRAY['cartão', 'crédito', 'fatura', 'pagamento'], ARRAY['credit card', 'bill', 'payment'], ARRAY['tarjeta', 'credito', 'factura', 'pago']),
('Uber/Transporte', 'Uber/Transport', 'Uber/Transporte', '#EF4444', ARRAY['uber', 'transporte', 'corrida', 'táxi'], ARRAY['uber', 'transport', 'ride', 'taxi'], ARRAY['uber', 'transporte', 'viaje', 'taxi']),
('iFood/Delivery', 'iFood/Delivery', 'iFood/Delivery', '#EF4444', ARRAY['ifood', 'delivery', 'comida', 'entrega'], ARRAY['ifood', 'delivery', 'food', 'takeout'], ARRAY['ifood', 'delivery', 'comida', 'entrega']);

-- Associate tags with default income categories
WITH income_categories AS (
  SELECT id, name_pt FROM public.default_categories WHERE category_type = 'income'
),
relevant_tags AS (
  SELECT id, name_pt FROM public.category_tags WHERE name_pt IN (
    'Salário Mensal', '13º Salário', 'PLR/Participação', 'Freelance', 'Vendas', 
    'Aluguel Recebido', 'Dividendos', 'Cashback', 'Reembolso', 'PIX Recebido',
    'Aposentadoria', 'Auxílio/Benefício'
  )
)
INSERT INTO public.category_tag_relations (category_id, tag_id)
SELECT 
  ic.id as category_id,
  rt.id as tag_id
FROM income_categories ic, relevant_tags rt
WHERE 
  (ic.name_pt = 'Salário' AND rt.name_pt IN ('Salário Mensal', '13º Salário', 'PLR/Participação')) OR
  (ic.name_pt = 'Renda Extra' AND rt.name_pt IN ('Freelance', 'Vendas', 'PIX Recebido')) OR
  (ic.name_pt = 'Investimentos' AND rt.name_pt IN ('Dividendos', 'Aluguel Recebido', 'Cashback')) OR
  (ic.name_pt = 'Receita Extraordinária' AND rt.name_pt IN ('Reembolso', 'Auxílio/Benefício', 'Aposentadoria'));

-- Associate additional tags with default expense categories
WITH expense_categories AS (
  SELECT id, name_pt FROM public.default_categories WHERE category_type = 'expense'
),
expense_tags AS (
  SELECT id, name_pt FROM public.category_tags WHERE name_pt IN (
    'Mercado', 'Gasolina', 'Farmácia', 'Internet', 'Celular', 
    'Cartão de Crédito', 'Uber/Transporte', 'iFood/Delivery'
  )
)
INSERT INTO public.category_tag_relations (category_id, tag_id)
SELECT 
  ec.id as category_id,
  et.id as tag_id
FROM expense_categories ec, expense_tags et
WHERE 
  (ec.name_pt = 'Alimentação' AND et.name_pt IN ('Mercado', 'iFood/Delivery')) OR
  (ec.name_pt = 'Transporte' AND et.name_pt IN ('Gasolina', 'Uber/Transporte')) OR
  (ec.name_pt = 'Saúde' AND et.name_pt IN ('Farmácia')) OR
  (ec.name_pt = 'Tecnologia' AND et.name_pt IN ('Internet', 'Celular')) OR
  (ec.name_pt = 'Cartão de Crédito' AND et.name_pt IN ('Cartão de Crédito'))
ON CONFLICT (category_id, tag_id) DO NOTHING;