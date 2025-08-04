import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Plus, Target, Calendar, Trash2, Edit } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useCurrencyConverter } from "@/hooks/useCurrencyConverter";
import { useLanguage } from "@/hooks/useLanguage";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface InvestmentGoal {
  id: string;
  name: string;
  description?: string;
  target_amount: number;
  current_amount: number;
  target_date?: string;
  currency: string;
}

interface GoalsManagerProps {
  goals: InvestmentGoal[];
  onRefresh: () => void;
  userPreferredCurrency: string;
}

export const GoalsManager = ({ goals, onRefresh, userPreferredCurrency }: GoalsManagerProps) => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();
  const { formatCurrency } = useCurrencyConverter();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<InvestmentGoal | null>(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    target_amount: "",
    target_date: "",
    currency: userPreferredCurrency
  });

  const currencies = [
    { value: "BRL", label: "Real (BRL)" },
    { value: "USD", label: "Dólar (USD)" },
    { value: "EUR", label: "Euro (EUR)" }
  ];

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      target_amount: "",
      target_date: "",
      currency: userPreferredCurrency
    });
    setEditingGoal(null);
  };

  const openDialog = (goal?: InvestmentGoal) => {
    if (goal) {
      setEditingGoal(goal);
      setFormData({
        name: goal.name,
        description: goal.description || "",
        target_amount: goal.target_amount.toString(),
        target_date: goal.target_date || "",
        currency: goal.currency
      });
    } else {
      resetForm();
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.target_amount) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const goalData = {
        user_id: user?.id,
        name: formData.name,
        description: formData.description || null,
        target_amount: parseFloat(formData.target_amount),
        target_date: formData.target_date || null,
        currency: formData.currency as any
      };

      if (editingGoal) {
        const { error } = await supabase
          .from("investment_goals")
          .update(goalData)
          .eq("id", editingGoal.id);

        if (error) throw error;

        toast({
          title: "Sucesso",
          description: "Objetivo atualizado com sucesso!",
        });
      } else {
        const { error } = await supabase
          .from("investment_goals")
          .insert({ ...goalData, current_amount: 0 });

        if (error) throw error;

        toast({
          title: "Sucesso",
          description: "Objetivo criado com sucesso!",
        });
      }

      setIsDialogOpen(false);
      resetForm();
      onRefresh();
    } catch (error) {
      console.error("Error saving goal:", error);
      toast({
        title: "Erro",
        description: "Erro ao salvar objetivo",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (goalId: string) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from("investment_goals")
        .delete()
        .eq("id", goalId);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Objetivo excluído com sucesso!",
      });
      
      onRefresh();
    } catch (error) {
      console.error("Error deleting goal:", error);
      toast({
        title: "Erro",
        description: "Erro ao excluir objetivo",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 100) return "bg-green-500";
    if (progress >= 75) return "bg-blue-500";
    if (progress >= 50) return "bg-yellow-500";
    return "bg-red-500";
  };

  const getDaysRemaining = (targetDate: string) => {
    const today = new Date();
    const target = new Date(targetDate);
    const diffTime = target.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">{t('goals.title')}</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => openDialog()}>
              <Plus className="h-4 w-4 mr-2" />
              {t('goals.newGoal')}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>
                {editingGoal ? t('goals.editGoal') : t('goals.newGoal')}
              </DialogTitle>
              <DialogDescription>
                {editingGoal ? t('goals.editGoalDesc') : t('goals.createGoal')}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">{t('goals.goalName')}</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder={t('goals.goalNamePlaceholder')}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    placeholder="Descrição do objetivo..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="target_amount">Valor Alvo *</Label>
                    <Input
                      id="target_amount"
                      type="number"
                      step="0.01"
                      value={formData.target_amount}
                      onChange={(e) => setFormData({...formData, target_amount: e.target.value})}
                      placeholder="0,00"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="currency">Moeda</Label>
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
                </div>

                <div className="space-y-2">
                  <Label htmlFor="target_date">Data Alvo</Label>
                  <Input
                    id="target_date"
                    type="date"
                    value={formData.target_date}
                    onChange={(e) => setFormData({...formData, target_date: e.target.value})}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? "Salvando..." : (editingGoal ? "Atualizar" : "Criar")}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {goals.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <Target className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              Nenhum objetivo definido ainda. Crie seu primeiro objetivo!
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {goals.map((goal) => {
            const progress = goal.target_amount > 0 ? (goal.current_amount / goal.target_amount) * 100 : 0;
            const remaining = goal.target_amount - goal.current_amount;
            const daysRemaining = goal.target_date ? getDaysRemaining(goal.target_date) : null;

            return (
              <Card key={goal.id} className="relative">
                <CardHeader className="pb-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{goal.name}</CardTitle>
                      {goal.description && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {goal.description}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openDialog(goal)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm" disabled={loading}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Excluir Objetivo</AlertDialogTitle>
                            <AlertDialogDescription>
                              Tem certeza que deseja excluir o objetivo "{goal.name}"? 
                              Esta ação não pode ser desfeita.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={() => handleDelete(goal.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Excluir
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium">Progresso</span>
                      <Badge variant={progress >= 100 ? "default" : "secondary"}>
                        {progress.toFixed(1)}%
                      </Badge>
                    </div>
                    <Progress value={Math.min(progress, 100)} className="h-2" />
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Atual</p>
                      <p className="font-semibold">
                        {formatCurrency(goal.current_amount, goal.currency as any)}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Meta</p>
                      <p className="font-semibold">
                        {formatCurrency(goal.target_amount, goal.currency as any)}
                      </p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-muted-foreground">Faltam</p>
                      <p className="font-semibold text-orange-600">
                        {formatCurrency(remaining, goal.currency as any)}
                      </p>
                    </div>
                  </div>

                  {goal.target_date && (
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4" />
                      <div>
                        <p className="text-muted-foreground">
                          {new Date(goal.target_date).toLocaleDateString("pt-BR")}
                        </p>
                        {daysRemaining !== null && (
                          <p className={`font-medium ${daysRemaining < 0 ? 'text-red-500' : daysRemaining < 30 ? 'text-orange-500' : 'text-green-600'}`}>
                            {daysRemaining < 0 
                              ? `${Math.abs(daysRemaining)} dias atrasado`
                              : `${daysRemaining} dias restantes`
                            }
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};