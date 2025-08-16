import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Check, ChevronsUpDown, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { usePartnerNames } from "@/hooks/usePartnerNames";
import { useLanguage } from "@/hooks/useLanguage";

interface InvestmentGoal {
  id: string;
  name: string;
  description?: string;
  target_amount: number;
  current_amount: number;
  target_date?: string;
  currency: string;
}

interface InvestmentFormProps {
  goals: InvestmentGoal[];
  onSuccess: () => void;
  onCancel: () => void;
}

export const InvestmentForm = ({ goals, onSuccess, onCancel }: InvestmentFormProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { names } = usePartnerNames();
  const { t, language } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [investmentTypes, setInvestmentTypes] = useState<{ id: string; name: string }[]>([]);
  const [openTypeCombobox, setOpenTypeCombobox] = useState(false);
  const [newTypeName, setNewTypeName] = useState("");

  // Predefined investment types based on language
  const predefinedTypes = language === 'pt' ? [
    'Poupança',
    'Tesouro Direto', 
    'CDB',
    'LCI/LCA',
    'Debêntures',
    'Ações B3',
    'Fundos Imobiliários (FIIs)',
    'ETFs (Fundos de Índice)',
    'Fundos de Investimento',
    'Criptomoeda'
  ] : [
    'Treasury Bonds',
    'Corporate Bonds',
    'Bank Products (Certificate of Deposit)',
    'Stocks',
    'ETFs-S&P 500',
    'Mutual Funds',
    'REITs',
    '401(k) e IRA',
    '529 Plans',
    'Cryptocurrencies'
  ];
  const [formData, setFormData] = useState({
    name: "",
    type: "",
    amount: "",
    current_value: "",
    purchase_date: new Date().toISOString().split('T')[0],
    currency: "BRL",
    is_shared: false,
    owner_user: "user1",
    broker: "",
    notes: "",
    goal_id: "",
    crypto_name: "",
    yield_type: "none",
    yield_value: "",
    auto_calculate_yield: false
  });

  // Load investment types on component mount and combine with predefined types
  useEffect(() => {
    const loadInvestmentTypes = async () => {
      if (!user?.id) return;

      try {
        const { data, error } = await supabase
          .from("investment_types")
          .select("id, name")
          .order("name");

        if (error) throw error;
        
        // Combine predefined types with custom user types
        const predefinedTypesFormatted = predefinedTypes.map((type, index) => ({
          id: `predefined_${index}`,
          name: type
        }));
        
        const userTypes = data || [];
        
        // Remove duplicates between predefined and user types
        const filteredUserTypes = userTypes.filter(userType => 
          !predefinedTypes.some(predefined => 
            predefined.toLowerCase() === userType.name.toLowerCase()
          )
        );
        
        setInvestmentTypes([...predefinedTypesFormatted, ...filteredUserTypes]);
      } catch (error) {
        console.error("Error loading investment types:", error);
      }
    };

    loadInvestmentTypes();
  }, [user?.id, predefinedTypes]);

  // Function to add new investment type
  const addNewInvestmentType = async () => {
    if (!newTypeName.trim() || !user?.id) return;

    try {
      const { data, error } = await supabase
        .from("investment_types")
        .insert({
          user_id: user.id,
          name: newTypeName.trim()
        })
        .select("id, name")
        .single();

      if (error) {
        if (error.message.includes("duplicate key")) {
          toast({
            title: "Erro",
            description: "Este tipo de investimento já existe",
            variant: "destructive",
          });
          return;
        }
        throw error;
      }

      if (data) {
        setInvestmentTypes(prev => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)));
        setFormData(prev => ({ ...prev, type: data.name }));
        setNewTypeName("");
        setOpenTypeCombobox(false);
        
        toast({
          title: "Sucesso",
          description: "Novo tipo de investimento adicionado",
        });
      }
    } catch (error) {
      console.error("Error adding investment type:", error);
      toast({
        title: "Erro",
        description: "Erro ao adicionar tipo de investimento",
        variant: "destructive",
      });
    }
  };

  const currencies = [
    { value: "BRL", label: "Real (BRL)" },
    { value: "USD", label: "Dólar (USD)" },
    { value: "EUR", label: "Euro (EUR)" }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.type || !formData.amount || !formData.current_value) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive",
      });
      return;
    }

    if ((formData.type.toLowerCase().includes("cripto") || formData.type.toLowerCase().includes("crypto")) && !formData.crypto_name) {
      toast({
        title: "Erro",
        description: "Nome da criptomoeda é obrigatório",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase
        .from("investments")
        .insert({
          user_id: user?.id,
          name: formData.name,
          type: formData.type,
          amount: parseFloat(formData.amount),
          current_value: parseFloat(formData.current_value),
          purchase_date: formData.purchase_date,
          currency: formData.currency as any,
          is_shared: formData.is_shared,
          owner_user: formData.owner_user,
          broker: formData.broker || null,
          notes: (formData.type.toLowerCase().includes("cripto") || formData.type.toLowerCase().includes("crypto")) && formData.crypto_name ? 
            `${formData.crypto_name}${formData.notes ? ` - ${formData.notes}` : ''}` : 
            formData.notes || null,
          goal_id: formData.goal_id === "no_goal" ? null : formData.goal_id || null,
          yield_type: formData.yield_type === "none" ? null : formData.yield_type,
          yield_value: formData.yield_value ? parseFloat(formData.yield_value) : 0,
          auto_calculate_yield: formData.auto_calculate_yield,
          last_yield_date: formData.auto_calculate_yield ? formData.purchase_date : null
        });

      if (error) throw error;

      // Se houver objetivo associado, atualizar o valor atual
      if (formData.goal_id && formData.goal_id !== "no_goal") {
        const goal = goals.find(g => g.id === formData.goal_id);
        if (goal) {
          const { error: goalError } = await supabase
            .from("investment_goals")
            .update({
              current_amount: goal.current_amount + parseFloat(formData.current_value)
            })
            .eq("id", formData.goal_id);

          if (goalError) throw goalError;
        }
      }

      onSuccess();
    } catch (error) {
      console.error("Error creating investment:", error);
      toast({
        title: "Erro",
        description: "Erro ao criar investimento",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>{t('investments.newInvestment')}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">{t('investments.name')} *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder={t('investments.namePlaceholder')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">{t('investments.type')} *</Label>
              <Popover open={openTypeCombobox} onOpenChange={setOpenTypeCombobox}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={openTypeCombobox}
                    className="w-full justify-between"
                  >
                    {formData.type
                      ? investmentTypes.find((type) => type.name === formData.type)?.name
                      : t('investments.selectTypePlaceholder')}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0">
                  <Command>
                    <CommandInput 
                      placeholder="Buscar tipo..." 
                      value={newTypeName}
                      onValueChange={setNewTypeName}
                    />
                    <CommandList>
                      <CommandEmpty>
                        <div className="p-2">
                          <p className="text-sm text-muted-foreground mb-2">
                            Nenhum tipo encontrado.
                          </p>
                          {newTypeName.trim() && (
                            <Button 
                              onClick={addNewInvestmentType}
                              className="w-full text-left justify-start"
                              variant="outline"
                              size="sm"
                            >
                              <Plus className="mr-2 h-4 w-4" />
                              Criar "{newTypeName.trim()}"
                            </Button>
                          )}
                        </div>
                      </CommandEmpty>
                      <CommandGroup>
                        {investmentTypes.map((type) => (
                          <CommandItem
                            key={type.id}
                            value={type.name}
                            onSelect={(currentValue) => {
                              setFormData(prev => ({ 
                                ...prev, 
                                type: currentValue === formData.type ? "" : currentValue 
                              }));
                              setOpenTypeCombobox(false);
                              setNewTypeName("");
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                formData.type === type.name ? "opacity-100" : "opacity-0"
                              )}
                            />
                            {type.name}
                          </CommandItem>
                        ))}
                        {newTypeName.trim() && !investmentTypes.some(type => 
                          type.name.toLowerCase() === newTypeName.trim().toLowerCase()
                        ) && (
                          <CommandItem
                            value={newTypeName}
                            onSelect={() => addNewInvestmentType()}
                          >
                            <Plus className="mr-2 h-4 w-4" />
                            Criar "{newTypeName.trim()}"
                          </CommandItem>
                        )}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            {(formData.type.toLowerCase().includes("cripto") || formData.type.toLowerCase().includes("crypto")) && (
              <div className="space-y-2">
                <Label htmlFor="crypto_name">{t('investments.cryptoName')} *</Label>
                <Input
                  id="crypto_name"
                  value={formData.crypto_name}
                  onChange={(e) => setFormData({...formData, crypto_name: e.target.value})}
                  placeholder={t('investments.cryptoNamePlaceholder')}
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="amount">{t('investments.amount')} *</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData({...formData, amount: e.target.value})}
                placeholder={t('investments.amountPlaceholder')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="current_value">{t('investments.currentValueField')} *</Label>
              <Input
                id="current_value"
                type="number"
                step="0.01"
                value={formData.current_value}
                onChange={(e) => setFormData({...formData, current_value: e.target.value})}
                placeholder={t('investments.amountPlaceholder')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="purchase_date">{t('investments.purchaseDate')}</Label>
              <Input
                id="purchase_date"
                type="date"
                value={formData.purchase_date}
                onChange={(e) => setFormData({...formData, purchase_date: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="currency">{t('investments.currency')}</Label>
              <Select
                value={formData.currency}
                onValueChange={(value) => setFormData({...formData, currency: value})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {currencies.map((currency) => (
                    <SelectItem key={currency.value} value={currency.value}>
                      {currency.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="broker">{t('investments.broker')}</Label>
              <Input
                id="broker"
                value={formData.broker}
                onChange={(e) => setFormData({...formData, broker: e.target.value})}
                placeholder={t('investments.brokerPlaceholder')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="yield_type">Tipo de Rentabilidade</Label>
              <Select
                value={formData.yield_type}
                onValueChange={(value) => setFormData({...formData, yield_type: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo de rentabilidade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhum</SelectItem>
                  <SelectItem value="percentage">Percentual (%)</SelectItem>
                  <SelectItem value="fixed_amount">Valor Fixo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.yield_type && formData.yield_type !== "none" && (
              <div className="space-y-2">
                <Label htmlFor="yield_value">
                  {formData.yield_type === 'percentage' ? 'Percentual Mensal (%)' : 'Valor Mensal'}
                </Label>
                <Input
                  id="yield_value"
                  type="number"
                  step={formData.yield_type === 'percentage' ? '0.01' : '0.01'}
                  value={formData.yield_value}
                  onChange={(e) => setFormData({...formData, yield_value: e.target.value})}
                  placeholder={formData.yield_type === 'percentage' ? 'Ex: 1.5' : 'Ex: 100.00'}
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="goal">{t('investments.goalOptional')}</Label>
              <Select
                value={formData.goal_id}
                onValueChange={(value) => setFormData({...formData, goal_id: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('investments.associateGoal')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="no_goal">{t('investments.noGoal')}</SelectItem>
                  {goals.map((goal) => (
                    <SelectItem key={goal.id} value={goal.id}>
                      {goal.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="is_shared"
                checked={formData.is_shared}
                onCheckedChange={(checked) => setFormData({...formData, is_shared: checked})}
              />
              <Label htmlFor="is_shared">{t('investments.sharedInvestment')}</Label>
            </div>

            {formData.yield_type && formData.yield_type !== "none" && (
              <div className="flex items-center space-x-2">
                <Switch
                  id="auto_calculate_yield"
                  checked={formData.auto_calculate_yield}
                  onCheckedChange={(checked) => setFormData({...formData, auto_calculate_yield: checked})}
                />
                <Label htmlFor="auto_calculate_yield">Calcular rendimento automaticamente</Label>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="owner">{t('investments.owner')}</Label>
              <Select
                value={formData.owner_user}
                onValueChange={(value) => setFormData({...formData, owner_user: value})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user1">{names.user1Name}</SelectItem>
                  <SelectItem value="user2">{names.user2Name}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">{t('investments.notes')}</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                placeholder={t('investments.notesPlaceholder')}
              />
            </div>
          </div>

          <div className="flex gap-4">
            <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
              {t('investments.cancel')}
            </Button>
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? t('investments.saving') : t('investments.save')}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};