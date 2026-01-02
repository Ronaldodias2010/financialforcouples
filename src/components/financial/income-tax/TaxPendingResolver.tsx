import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { 
  Tag, 
  TrendingUp, 
  FileText, 
  CheckCircle,
  Loader2
} from 'lucide-react';
import { PendingItem } from '@/hooks/useIncomeTaxReport';
import { usePendingResolver } from '@/hooks/usePendingResolver';
import { useTaxDocuments } from '@/hooks/useTaxDocuments';
import { TaxDocumentUpload } from './TaxDocumentUpload';
import { useLanguage } from '@/contexts/LanguageContext';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface TaxPendingResolverProps {
  item: PendingItem | null;
  isOpen: boolean;
  onClose: () => void;
  taxYear: number;
  formatCurrency: (value: number) => string;
}

export function TaxPendingResolver({ 
  item, 
  isOpen, 
  onClose, 
  taxYear,
  formatCurrency 
}: TaxPendingResolverProps) {
  const { t } = useLanguage();
  const { 
    categories, 
    incomeCategories, 
    isLoadingCategories, 
    isResolving,
    resolvePending,
    invalidateQueries
  } = usePendingResolver(taxYear);

  const {
    uploadDocument,
    isUploading,
    uploadProgress
  } = useTaxDocuments(taxYear);

  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [classification, setClassification] = useState<'taxable' | 'exempt'>('taxable');
  const [showDocumentUpload, setShowDocumentUpload] = useState(false);

  if (!item) return null;

  const handleResolve = async () => {
    if (item.type === 'missing_doc') {
      setShowDocumentUpload(true);
      return;
    }

    if (!selectedCategoryId) return;

    await resolvePending(item, {
      categoryId: selectedCategoryId,
      classification: item.type === 'high_income' ? classification : undefined
    });

    setSelectedCategoryId('');
    onClose();
  };

  const handleDocumentUpload = (params: {
    file: File;
    taxYear: number;
    category: string;
    amount?: number;
    providerName?: string;
    providerCpfCnpj?: string;
    notes?: string;
  }) => {
    uploadDocument(params, {
      onSuccess: () => {
        setShowDocumentUpload(false);
        invalidateQueries();
        onClose();
      }
    });
  };

  const handleDocumentUploadClose = () => {
    setShowDocumentUpload(false);
  };

  const getIcon = () => {
    switch (item.type) {
      case 'uncategorized':
        return <Tag className="h-5 w-5 text-amber-500" />;
      case 'high_income':
        return <TrendingUp className="h-5 w-5 text-green-500" />;
      case 'missing_doc':
        return <FileText className="h-5 w-5 text-red-500" />;
      default:
        return <Tag className="h-5 w-5" />;
    }
  };

  const getTitle = () => {
    switch (item.type) {
      case 'uncategorized':
        return t('tax.resolver.assignCategory');
      case 'high_income':
        return t('tax.resolver.classifyIncome');
      case 'missing_doc':
        return t('tax.resolver.attachDocument');
      default:
        return t('tax.resolver.resolve');
    }
  };

  const categoriesToShow = item.type === 'high_income' ? incomeCategories : categories;

  // For missing_doc, show document upload dialog
  if (showDocumentUpload && item.type === 'missing_doc') {
    const categoryLabel = item.description.replace(' - comprovante pendente', '');
    return (
      <TaxDocumentUpload
        isOpen={showDocumentUpload}
        onClose={handleDocumentUploadClose}
        category={item.id}
        categoryLabel={categoryLabel}
        taxYear={taxYear}
        onUpload={handleDocumentUpload}
        isUploading={isUploading}
        uploadProgress={uploadProgress}
      />
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getIcon()}
            {getTitle()}
          </DialogTitle>
          <DialogDescription>
            {t('tax.resolver.resolveItem')}
          </DialogDescription>
        </DialogHeader>

        {/* Item Info */}
        <div className="bg-muted/50 rounded-lg p-3 space-y-1">
          <p className="font-medium">{item.description}</p>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            {item.date && (
              <span>{format(new Date(item.date), 'dd/MM/yyyy', { locale: ptBR })}</span>
            )}
            <span className="font-medium text-foreground">{formatCurrency(item.amount)}</span>
          </div>
        </div>

        {/* Resolution Form */}
        {item.type === 'missing_doc' ? (
          <div className="text-center py-4">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground mb-4">
              {t('tax.resolver.uploadHint')}
            </p>
            <Button onClick={() => setShowDocumentUpload(true)}>
              <FileText className="h-4 w-4 mr-2" />
              {t('tax.resolver.selectFile')}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Classification (only for high_income) */}
            {item.type === 'high_income' && (
              <div className="space-y-2">
                <Label>{t('tax.resolver.incomeType')}</Label>
                <RadioGroup 
                  value={classification} 
                  onValueChange={(v) => setClassification(v as 'taxable' | 'exempt')}
                  className="flex gap-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="taxable" id="taxable" />
                    <Label htmlFor="taxable" className="font-normal">
                      {t('tax.resolver.taxable')}
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="exempt" id="exempt" />
                    <Label htmlFor="exempt" className="font-normal">
                      {t('tax.resolver.exempt')}
                    </Label>
                  </div>
                </RadioGroup>
              </div>
            )}

            {/* Category Selector */}
            <div className="space-y-2">
              <Label>{t('tax.resolver.selectCategory')}</Label>
              {isLoadingCategories ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : categoriesToShow.length === 0 ? (
                <p className="text-sm text-muted-foreground py-2">
                  {t('tax.resolver.noCategories')}
                </p>
              ) : (
                <ScrollArea className="h-[200px] border rounded-md p-2">
                  <RadioGroup 
                    value={selectedCategoryId} 
                    onValueChange={setSelectedCategoryId}
                    className="space-y-1"
                  >
                    {categoriesToShow.map((category) => (
                      <div 
                        key={category.id} 
                        className={`flex items-center space-x-3 p-2 rounded-md hover:bg-muted/50 cursor-pointer ${
                          selectedCategoryId === category.id ? 'bg-primary/10' : ''
                        }`}
                        onClick={() => setSelectedCategoryId(category.id)}
                      >
                        <RadioGroupItem value={category.id} id={category.id} />
                        <Label 
                          htmlFor={category.id} 
                          className="flex-1 cursor-pointer font-normal flex items-center gap-2"
                        >
                          {category.icon && <span>{category.icon}</span>}
                          <span>{category.name}</span>
                          <Badge 
                            variant="outline" 
                            className="ml-auto text-xs"
                            style={{ 
                              backgroundColor: category.color ? `${category.color}20` : undefined,
                              color: category.color || undefined
                            }}
                          >
                            {category.category_type === 'income' ? t('tax.resolver.income') : t('tax.resolver.expense')}
                          </Badge>
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </ScrollArea>
              )}
            </div>
          </div>
        )}

        {/* Actions */}
        {item.type !== 'missing_doc' && (
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={onClose}>
              {t('common.cancel')}
            </Button>
            <Button 
              onClick={handleResolve} 
              disabled={!selectedCategoryId || isResolving}
            >
              {isResolving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <CheckCircle className="h-4 w-4 mr-2" />
              )}
              {t('tax.resolver.save')}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
