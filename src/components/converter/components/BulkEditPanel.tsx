import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Edit3, Check, X, Tags, CreditCard, FolderOpen } from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';

interface BulkEditPanelProps {
  selectedTransactions: string[];
  onBulkUpdate: (updates: {
    categoryId?: string;
    paymentMethod?: string;
    tags?: string[];
    markDuplicate?: boolean;
    approve?: boolean;
  }) => void;
}

export const BulkEditPanel: React.FC<BulkEditPanelProps> = ({
  selectedTransactions,
  onBulkUpdate
}) => {
  const { t } = useLanguage();
  const [bulkCategory, setBulkCategory] = useState<string>('');
  const [bulkPaymentMethod, setBulkPaymentMethod] = useState<string>('');
  const [bulkTags, setBulkTags] = useState<string>('');

  if (selectedTransactions.length === 0) {
    return null;
  }

  const handleApplyBulkUpdates = () => {
    const updates: any = {};
    
    if (bulkCategory) updates.categoryId = bulkCategory;
    if (bulkPaymentMethod) updates.paymentMethod = bulkPaymentMethod;
    if (bulkTags) updates.tags = bulkTags.split(',').map(tag => tag.trim()).filter(Boolean);
    
    onBulkUpdate(updates);
    
    // Reset form
    setBulkCategory('');
    setBulkPaymentMethod('');
    setBulkTags('');
  };

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-primary">
          <Edit3 className="h-5 w-5" />
          {t('converter.bulk.title')}
          <Badge variant="default" className="ml-2">
            {selectedTransactions.length} selecionadas
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Quick Actions */}
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onBulkUpdate({ approve: true })}
              className="gap-2"
            >
              <Check className="h-4 w-4" />
              {t('converter.bulk.approve')}
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => onBulkUpdate({ markDuplicate: true })}
              className="gap-2"
            >
              <X className="h-4 w-4" />
              {t('converter.bulk.markDuplicate')}
            </Button>
          </div>

          {/* Bulk Edit Form */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <FolderOpen className="h-4 w-4" />
                {t('converter.bulk.assignCategory')}
              </label>
              <Select value={bulkCategory} onValueChange={setBulkCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar categoria..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="food">Alimentação</SelectItem>
                  <SelectItem value="transport">Transporte</SelectItem>
                  <SelectItem value="entertainment">Entretenimento</SelectItem>
                  <SelectItem value="bills">Contas</SelectItem>
                  <SelectItem value="health">Saúde</SelectItem>
                  <SelectItem value="shopping">Compras</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                {t('converter.bulk.assignPayment')}
              </label>
              <Select value={bulkPaymentMethod} onValueChange={setBulkPaymentMethod}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar método..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">{t('converter.paymentMethods.cash')}</SelectItem>
                  <SelectItem value="debit">{t('converter.paymentMethods.debit')}</SelectItem>
                  <SelectItem value="credit">{t('converter.paymentMethods.credit')}</SelectItem>
                  <SelectItem value="pix">{t('converter.paymentMethods.pix')}</SelectItem>
                  <SelectItem value="transfer">{t('converter.paymentMethods.transfer')}</SelectItem>
                  <SelectItem value="boleto">{t('converter.paymentMethods.boleto')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Tags className="h-4 w-4" />
                {t('converter.bulk.addTags')}
              </label>
              <Input
                placeholder="tag1, tag2, tag3..."
                value={bulkTags}
                onChange={(e) => setBulkTags(e.target.value)}
              />
            </div>
          </div>

          {/* Apply Button */}
          <div className="pt-4 border-t">
            <Button onClick={handleApplyBulkUpdates} className="w-full md:w-auto">
              Aplicar Alterações em {selectedTransactions.length} Transações
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};