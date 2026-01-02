import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Paperclip, 
  CheckCircle, 
  AlertTriangle, 
  AlertCircle,
  Lightbulb,
  File,
  Trash2,
  Eye
} from 'lucide-react';
import { DeductibleExpense } from '@/hooks/useIncomeTaxReport';
import { useLanguage } from '@/contexts/LanguageContext';
import { TaxDocumentUpload } from './TaxDocumentUpload';
import { useTaxDocuments, TaxDocument } from '@/hooks/useTaxDocuments';

interface TaxDeductionsSectionProps {
  deductions: DeductibleExpense[];
  formatCurrency: (value: number) => string;
  taxYear?: number;
}

export function TaxDeductionsSection({ deductions, formatCurrency, taxYear = new Date().getFullYear() - 1 }: TaxDeductionsSectionProps) {
  const { t } = useLanguage();
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<{ id: string; label: string } | null>(null);
  
  const { 
    documents, 
    uploadDocument, 
    isUploading, 
    uploadProgress,
    deleteDocument,
    getDocumentsByCategory,
    getDocumentCountByCategory
  } = useTaxDocuments(taxYear);

  const totalDeductible = deductions.reduce((sum, d) => sum + d.deductibleAmount, 0);
  const totalSpent = deductions.reduce((sum, d) => sum + d.total, 0);

  const getStatusBadge = (status: DeductibleExpense['status']) => {
    switch (status) {
      case 'ok':
        return (
          <Badge className="bg-green-500/10 text-green-500 border-green-500/20">
            <CheckCircle className="h-3 w-3 mr-1" />
            OK
          </Badge>
        );
      case 'missing_docs':
        return (
          <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20">
            <AlertTriangle className="h-3 w-3 mr-1" />
            {t('tax.deductions.missingDocs')}
          </Badge>
        );
      case 'exceeds_limit':
        return (
          <Badge className="bg-red-500/10 text-red-500 border-red-500/20">
            <AlertCircle className="h-3 w-3 mr-1" />
            {t('tax.deductions.exceedsLimit')}
          </Badge>
        );
    }
  };

  const handleOpenUpload = (categoryId: string, categoryLabel: string) => {
    setSelectedCategory({ id: categoryId, label: categoryLabel });
    setUploadModalOpen(true);
  };

  const handleCloseUpload = () => {
    setUploadModalOpen(false);
    setSelectedCategory(null);
  };

  const handleUpload = (params: any) => {
    uploadDocument(params, {
      onSuccess: () => {
        handleCloseUpload();
      }
    });
  };

  const getCategorySlug = (category: string): string => {
    return category
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, '-');
  };

  if (deductions.length === 0) {
    return (
      <div className="pt-4">
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-8">
            <Lightbulb className="h-10 w-10 text-amber-500 mb-3 opacity-50" />
            <p className="text-muted-foreground text-center mb-2">
              {t('tax.deductions.noDeductions')}
            </p>
            <p className="text-sm text-muted-foreground text-center max-w-md">
              {t('tax.deductions.hint')}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4 pt-4">
      {/* AI Tip */}
      <Card className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border-amber-500/20">
        <CardContent className="flex items-center gap-3 py-3">
          <Lightbulb className="h-5 w-5 text-amber-500 shrink-0" />
          <p className="text-sm">
            <strong>{t('tax.deductions.tip')}:</strong> {t('tax.deductions.tipText')}
          </p>
        </CardContent>
      </Card>

      {/* Deduction Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        {deductions.map((deduction, index) => {
          const categorySlug = getCategorySlug(deduction.category);
          const categoryDocs = getDocumentsByCategory(categorySlug);
          const docCount = categoryDocs.length || deduction.documentsCount;
          const usagePercent = deduction.legalLimit 
            ? Math.min((deduction.total / deduction.legalLimit) * 100, 100)
            : 0;

          return (
            <Card key={index} className="overflow-hidden">
              <CardContent className="pt-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="text-3xl">{deduction.icon}</div>
                    <div>
                      <h4 className="font-medium">{deduction.category}</h4>
                      <p className="text-xs text-muted-foreground">
                        {deduction.count} {t('tax.transactions')}
                      </p>
                    </div>
                  </div>
                  {getStatusBadge(deduction.status)}
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{t('tax.deductions.totalSpent')}</span>
                    <span className="font-medium">{formatCurrency(deduction.total)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{t('tax.deductions.deductible')}</span>
                    <span className="font-bold text-green-600">{formatCurrency(deduction.deductibleAmount)}</span>
                  </div>
                  {deduction.legalLimit && (
                    <>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">{t('tax.deductions.legalLimit')}</span>
                        <span>{formatCurrency(deduction.legalLimit)}</span>
                      </div>
                      <Progress value={usagePercent} className="h-2" />
                      <p className="text-xs text-muted-foreground text-right">
                        {usagePercent.toFixed(0)}% {t('tax.deductions.used')}
                      </p>
                    </>
                  )}
                </div>

                {/* Documents Section */}
                <div className="mt-4 pt-3 border-t space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      {docCount} {t('tax.deductions.documents')}
                    </span>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleOpenUpload(categorySlug, deduction.category)}
                    >
                      <Paperclip className="h-3 w-3 mr-1" />
                      {t('tax.deductions.attachDoc')}
                    </Button>
                  </div>

                  {/* List of attached documents */}
                  {categoryDocs.length > 0 && (
                    <div className="space-y-1 max-h-24 overflow-y-auto">
                      {categoryDocs.slice(0, 3).map((doc) => (
                        <div 
                          key={doc.id} 
                          className="flex items-center gap-2 text-xs p-2 bg-muted/50 rounded"
                        >
                          <File className="h-3 w-3 text-muted-foreground shrink-0" />
                          <span className="truncate flex-1">{doc.document_name}</span>
                          {doc.amount && (
                            <span className="text-muted-foreground shrink-0">
                              {formatCurrency(doc.amount)}
                            </span>
                          )}
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-5 w-5 shrink-0"
                            onClick={() => window.open(doc.document_url, '_blank')}
                          >
                            <Eye className="h-3 w-3" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-5 w-5 shrink-0 text-destructive hover:text-destructive"
                            onClick={() => deleteDocument(doc.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                      {categoryDocs.length > 3 && (
                        <p className="text-xs text-muted-foreground text-center">
                          +{categoryDocs.length - 3} {t('tax.documents.more')}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Summary */}
      <Card className="bg-amber-500/10">
        <CardContent className="py-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-muted-foreground">{t('tax.deductions.totalSpentLabel')}</span>
            <span className="font-medium">{formatCurrency(totalSpent)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="font-medium text-amber-600">{t('tax.deductions.totalDeductible')}</span>
            <span className="text-xl font-bold text-amber-600">
              {formatCurrency(totalDeductible)}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Upload Modal */}
      {selectedCategory && (
        <TaxDocumentUpload
          isOpen={uploadModalOpen}
          onClose={handleCloseUpload}
          category={selectedCategory.id}
          categoryLabel={selectedCategory.label}
          taxYear={taxYear}
          onUpload={handleUpload}
          isUploading={isUploading}
          uploadProgress={uploadProgress}
        />
      )}
    </div>
  );
}
