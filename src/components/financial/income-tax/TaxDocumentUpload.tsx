import React, { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Upload, File, X, Loader2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { formatCpf } from '@/hooks/useCpfValidation';

interface TaxDocumentUploadProps {
  isOpen: boolean;
  onClose: () => void;
  category: string;
  categoryLabel: string;
  taxYear: number;
  onUpload: (params: {
    file: File;
    taxYear: number;
    category: string;
    amount?: number;
    providerName?: string;
    providerCpfCnpj?: string;
    notes?: string;
  }) => void;
  isUploading: boolean;
  uploadProgress: number;
}

export function TaxDocumentUpload({
  isOpen,
  onClose,
  category,
  categoryLabel,
  taxYear,
  onUpload,
  isUploading,
  uploadProgress
}: TaxDocumentUploadProps) {
  const { t } = useLanguage();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [file, setFile] = useState<File | null>(null);
  const [providerName, setProviderName] = useState('');
  const [providerCpfCnpj, setProviderCpfCnpj] = useState('');
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      setFile(droppedFile);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleCpfCnpjChange = (value: string) => {
    // Format as CPF or CNPJ
    const clean = value.replace(/\D/g, '');
    if (clean.length <= 11) {
      setProviderCpfCnpj(formatCpf(value));
    } else {
      // Format as CNPJ: XX.XXX.XXX/XXXX-XX
      const cnpj = clean.slice(0, 14);
      let formatted = cnpj;
      if (cnpj.length > 2) formatted = `${cnpj.slice(0, 2)}.${cnpj.slice(2)}`;
      if (cnpj.length > 5) formatted = `${cnpj.slice(0, 2)}.${cnpj.slice(2, 5)}.${cnpj.slice(5)}`;
      if (cnpj.length > 8) formatted = `${cnpj.slice(0, 2)}.${cnpj.slice(2, 5)}.${cnpj.slice(5, 8)}/${cnpj.slice(8)}`;
      if (cnpj.length > 12) formatted = `${cnpj.slice(0, 2)}.${cnpj.slice(2, 5)}.${cnpj.slice(5, 8)}/${cnpj.slice(8, 12)}-${cnpj.slice(12)}`;
      setProviderCpfCnpj(formatted);
    }
  };

  const handleSubmit = () => {
    if (!file) return;
    
    onUpload({
      file,
      taxYear,
      category,
      amount: amount ? parseFloat(amount.replace(',', '.')) : undefined,
      providerName: providerName || undefined,
      providerCpfCnpj: providerCpfCnpj.replace(/\D/g, '') || undefined,
      notes: notes || undefined
    });

    // Reset form after successful upload will happen via onClose
  };

  const resetForm = () => {
    setFile(null);
    setProviderName('');
    setProviderCpfCnpj('');
    setAmount('');
    setNotes('');
  };

  const handleClose = () => {
    if (!isUploading) {
      resetForm();
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            {t('tax.documents.uploadTitle')}
          </DialogTitle>
          <DialogDescription>
            {t('tax.documents.uploadDesc')} - {categoryLabel}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* File Drop Zone */}
          <div
            className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
              ${file ? 'border-green-500 bg-green-500/10' : 'border-muted-foreground/25 hover:border-primary'}`}
            onClick={() => fileInputRef.current?.click()}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
          >
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
              onChange={handleFileChange}
            />
            
            {file ? (
              <div className="flex items-center justify-center gap-2">
                <File className="h-8 w-8 text-green-500" />
                <div className="text-left">
                  <p className="font-medium">{file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(file.size / 1024).toFixed(1)} KB
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="ml-2"
                  onClick={(e) => {
                    e.stopPropagation();
                    setFile(null);
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <>
                <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">
                  {t('tax.documents.dropZone')}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  PDF, JPG, PNG, DOC (máx 10MB)
                </p>
              </>
            )}
          </div>

          {/* Provider Name */}
          <div className="space-y-2">
            <Label htmlFor="providerName">{t('tax.documents.providerName')}</Label>
            <Input
              id="providerName"
              value={providerName}
              onChange={(e) => setProviderName(e.target.value)}
              placeholder={t('tax.documents.providerNamePlaceholder')}
            />
          </div>

          {/* Provider CPF/CNPJ */}
          <div className="space-y-2">
            <Label htmlFor="providerCpfCnpj">{t('tax.documents.providerCpfCnpj')}</Label>
            <Input
              id="providerCpfCnpj"
              value={providerCpfCnpj}
              onChange={(e) => handleCpfCnpjChange(e.target.value)}
              placeholder="000.000.000-00"
            />
          </div>

          {/* Amount */}
          <div className="space-y-2">
            <Label htmlFor="amount">{t('tax.documents.amount')}</Label>
            <Input
              id="amount"
              type="text"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0,00"
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">{t('tax.documents.notes')}</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t('tax.documents.notesPlaceholder')}
              rows={2}
            />
          </div>

          {/* Upload Progress */}
          {isUploading && (
            <div className="space-y-2">
              <Progress value={uploadProgress} className="h-2" />
              <p className="text-xs text-center text-muted-foreground">
                {t('tax.documents.uploading')} {uploadProgress}%
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 justify-end pt-2">
            <Button variant="outline" onClick={handleClose} disabled={isUploading}>
              {t('common.cancel')}
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={!file || isUploading}
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {t('tax.documents.uploading')}
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  {t('tax.documents.upload')}
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
