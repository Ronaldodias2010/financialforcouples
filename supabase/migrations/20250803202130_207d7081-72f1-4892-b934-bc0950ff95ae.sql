-- Criar o trigger para atualizar saldos do cartão automaticamente
CREATE TRIGGER update_card_balance_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.transactions
  FOR EACH ROW EXECUTE FUNCTION public.update_card_balance();