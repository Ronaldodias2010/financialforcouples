import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Settings, Trash2, Edit } from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';

interface ImportRule {
  id: string;
  name: string;
  descriptionPattern: string;
  amountMin?: number;
  amountMax?: number;
  assignCategory?: string;
  assignPaymentMethod?: string;
  assignTags: string[];
  markAsTransfer: boolean;
  language: 'pt' | 'en' | 'es';
  isActive: boolean;
  usageCount: number;
}

interface ImportRulesProps {
  onRuleCreated: (rule: Omit<ImportRule, 'id' | 'usageCount'>) => void;
}

export const ImportRules: React.FC<ImportRulesProps> = ({ onRuleCreated }) => {
  const { t, language } = useLanguage();
  const [isCreating, setIsCreating] = useState(false);
  const [newRule, setNewRule] = useState({
    name: '',
    descriptionPattern: '',
    amountMin: '',
    amountMax: '',
    assignCategory: '',
    assignPaymentMethod: '',
    assignTags: '',
    markAsTransfer: false,
  });

  // Mock existing rules
  const existingRules: ImportRule[] = [
    {
      id: '1',
      name: 'Netflix Subscription',
      descriptionPattern: 'NETFLIX|NFLX',
      assignCategory: 'entertainment',
      assignPaymentMethod: 'credit',
      assignTags: ['streaming', 'subscription'],
      markAsTransfer: false,
      language: 'pt',
      isActive: true,
      usageCount: 12
    },
    {
      id: '2',
      name: 'PIX Transfers',
      descriptionPattern: 'PIX|TRANSFERENCIA',
      markAsTransfer: true,
      assignCategory: 'transfer',
      assignPaymentMethod: 'pix',
      assignTags: ['pix'],
      language: 'pt',
      isActive: true,
      usageCount: 45
    },
    {
      id: '3',
      name: 'Grocery Stores',
      descriptionPattern: 'SUPERMERCADO|MERCADO|EXTRA|CARREFOUR',
      assignCategory: 'food',
      assignPaymentMethod: 'debit',
      assignTags: ['grocery', 'food'],
      markAsTransfer: false,
      language: 'pt',
      isActive: true,
      usageCount: 8
    }
  ];

  const handleCreateRule = () => {
    if (!newRule.name || !newRule.descriptionPattern) {
      return;
    }

    const rule = {
      name: newRule.name,
      descriptionPattern: newRule.descriptionPattern,
      amountMin: newRule.amountMin ? parseFloat(newRule.amountMin) : undefined,
      amountMax: newRule.amountMax ? parseFloat(newRule.amountMax) : undefined,
      assignCategory: newRule.assignCategory || undefined,
      assignPaymentMethod: newRule.assignPaymentMethod || undefined,
      assignTags: newRule.assignTags ? newRule.assignTags.split(',').map(tag => tag.trim()) : [],
      markAsTransfer: newRule.markAsTransfer,
      language: language,
      isActive: true,
    };

    onRuleCreated(rule);
    
    // Reset form
    setNewRule({
      name: '',
      descriptionPattern: '',
      amountMin: '',
      amountMax: '',
      assignCategory: '',
      assignPaymentMethod: '',
      assignTags: '',
      markAsTransfer: false,
    });
    setIsCreating(false);
  };

  return (
    <div className="space-y-6">
      {/* Existing Rules */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              {t('converter.rules.title')}
            </CardTitle>
            <Button onClick={() => setIsCreating(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              {t('converter.rules.create')}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('converter.rules.name')}</TableHead>
                  <TableHead>{t('converter.rules.condition')}</TableHead>
                  <TableHead>{t('converter.rules.action')}</TableHead>
                  <TableHead className="text-center">{t('converter.rules.usage')}</TableHead>
                  <TableHead className="text-center">{t('converter.rules.active')}</TableHead>
                  <TableHead className="w-20"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {existingRules.map((rule) => (
                  <TableRow key={rule.id}>
                    <TableCell className="font-medium">{rule.name}</TableCell>
                    <TableCell>
                      <code className="text-xs bg-muted px-2 py-1 rounded">
                        {rule.descriptionPattern}
                      </code>
                      {(rule.amountMin || rule.amountMax) && (
                        <div className="text-xs text-muted-foreground mt-1">
                          Valor: {rule.amountMin ? `≥ R$ ${rule.amountMin}` : ''} 
                          {rule.amountMin && rule.amountMax ? ' e ' : ''}
                          {rule.amountMax ? `≤ R$ ${rule.amountMax}` : ''}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {rule.assignCategory && (
                          <Badge variant="outline" className="text-xs">
                            Categoria: {rule.assignCategory}
                          </Badge>
                        )}
                        {rule.assignPaymentMethod && (
                          <Badge variant="outline" className="text-xs">
                            Método: {rule.assignPaymentMethod}
                          </Badge>
                        )}
                        {rule.markAsTransfer && (
                          <Badge variant="outline" className="text-xs">
                            Marcar como transferência
                          </Badge>
                        )}
                        {rule.assignTags.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {rule.assignTags.map((tag) => (
                              <Badge key={tag} variant="secondary" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary">{rule.usageCount}</Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Switch checked={rule.isActive} />
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm">
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Create New Rule */}
      {isCreating && (
        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle>{t('converter.rules.create')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="rule-name">{t('converter.rules.name')}</Label>
                <Input
                  id="rule-name"
                  placeholder="Ex: Netflix Subscriptions"
                  value={newRule.name}
                  onChange={(e) => setNewRule({ ...newRule, name: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="pattern">Padrão da Descrição (Regex)</Label>
                <Input
                  id="pattern"
                  placeholder="Ex: NETFLIX|NFLX"
                  value={newRule.descriptionPattern}
                  onChange={(e) => setNewRule({ ...newRule, descriptionPattern: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="min-amount">Valor Mínimo</Label>
                <Input
                  id="min-amount"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={newRule.amountMin}
                  onChange={(e) => setNewRule({ ...newRule, amountMin: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="max-amount">Valor Máximo</Label>
                <Input
                  id="max-amount"
                  type="number"
                  step="0.01"
                  placeholder="999.99"
                  value={newRule.amountMax}
                  onChange={(e) => setNewRule({ ...newRule, amountMax: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Categoria</Label>
                <Select value={newRule.assignCategory} onValueChange={(value) => setNewRule({ ...newRule, assignCategory: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecionar categoria..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="food">Alimentação</SelectItem>
                    <SelectItem value="transport">Transporte</SelectItem>
                    <SelectItem value="entertainment">Entretenimento</SelectItem>
                    <SelectItem value="bills">Contas</SelectItem>
                    <SelectItem value="health">Saúde</SelectItem>
                    <SelectItem value="transfer">Transferência</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="payment-method">Método de Pagamento</Label>
                <Select value={newRule.assignPaymentMethod} onValueChange={(value) => setNewRule({ ...newRule, assignPaymentMethod: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecionar método..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Dinheiro</SelectItem>
                    <SelectItem value="debit">Débito</SelectItem>
                    <SelectItem value="credit">Crédito</SelectItem>
                    <SelectItem value="pix">PIX</SelectItem>
                    <SelectItem value="transfer">Transferência</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tags">Tags (separadas por vírgula)</Label>
              <Input
                id="tags"
                placeholder="streaming, subscription, entertainment"
                value={newRule.assignTags}
                onChange={(e) => setNewRule({ ...newRule, assignTags: e.target.value })}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="mark-transfer"
                checked={newRule.markAsTransfer}
                onCheckedChange={(checked) => setNewRule({ ...newRule, markAsTransfer: checked })}
              />
              <Label htmlFor="mark-transfer">Marcar como transferência</Label>
            </div>

            <div className="flex gap-2 pt-4">
              <Button onClick={handleCreateRule}>Criar Regra</Button>
              <Button variant="outline" onClick={() => setIsCreating(false)}>
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
