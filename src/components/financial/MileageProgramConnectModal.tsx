import React, { useState } from 'react';
import { Shield, CheckCircle2, XCircle, ExternalLink, AlertTriangle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MileageProgramConfig } from '@/data/mileagePrograms';
import { useLanguage } from '@/hooks/useLanguage';
import { MileageProgramSelector } from './MileageProgramSelector';

interface MileageProgramConnectModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  availablePrograms: MileageProgramConfig[];
  onConnect: (programCode: string, memberId?: string, balance?: number) => void;
}

type Step = 'select' | 'consent' | 'manual_entry';

export function MileageProgramConnectModal({
  open,
  onOpenChange,
  availablePrograms,
  onConnect
}: MileageProgramConnectModalProps) {
  const { t } = useLanguage();
  const [step, setStep] = useState<Step>('select');
  const [selectedProgram, setSelectedProgram] = useState<MileageProgramConfig | null>(null);
  const [consentAccepted, setConsentAccepted] = useState(false);
  const [memberId, setMemberId] = useState('');
  const [balance, setBalance] = useState('');

  const handleClose = () => {
    setStep('select');
    setSelectedProgram(null);
    setConsentAccepted(false);
    setMemberId('');
    setBalance('');
    onOpenChange(false);
  };

  const handleSelectProgram = (program: MileageProgramConfig) => {
    setSelectedProgram(program);
    setStep('consent');
  };

  const handleContinue = () => {
    if (!selectedProgram) return;

    if (selectedProgram.hasOAuth && selectedProgram.oauthUrl) {
      // For OAuth programs, would redirect to external auth
      // For now, we'll use manual entry as fallback
      setStep('manual_entry');
    } else {
      setStep('manual_entry');
    }
  };

  const handleManualConnect = () => {
    if (!selectedProgram) return;

    const balanceNum = parseFloat(balance.replace(/[^\d.-]/g, '')) || 0;
    onConnect(selectedProgram.code, memberId || undefined, balanceNum);
    handleClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        {step === 'select' && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                {t('mileage.programs.connect')}
              </DialogTitle>
              <DialogDescription>
                {t('mileage.programs.selectProgram')}
              </DialogDescription>
            </DialogHeader>
            
            <div className="max-h-[400px] overflow-y-auto -mx-6">
              <MileageProgramSelector 
                programs={availablePrograms}
                onSelect={handleSelectProgram}
              />
            </div>
          </>
        )}

        {step === 'consent' && selectedProgram && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                {t('mileage.programs.consent.title')}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              {/* Program Header */}
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <div 
                  className="w-12 h-12 rounded-lg flex items-center justify-center p-2"
                  style={{ backgroundColor: `${selectedProgram.primaryColor}15` }}
                >
                  {selectedProgram.logo ? (
                    <img 
                      src={selectedProgram.logo} 
                      alt={selectedProgram.name}
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <span 
                      className="text-lg font-bold"
                      style={{ color: selectedProgram.primaryColor }}
                    >
                      {selectedProgram.name.charAt(0)}
                    </span>
                  )}
                </div>
                <div>
                  <h3 className="font-semibold">{selectedProgram.name}</h3>
                </div>
              </div>

              {/* Warning */}
              <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-sm text-amber-800 dark:text-amber-200">
                  {t('mileage.programs.consent.text')}
                </p>
              </div>

              {/* Permissions */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-green-600">
                  <CheckCircle2 className="h-4 w-4" />
                  {t('mileage.programs.consent.canRead')}
                </div>
                <div className="flex items-center gap-2 text-sm text-green-600">
                  <CheckCircle2 className="h-4 w-4" />
                  {t('mileage.programs.consent.canReadHistory')}
                </div>
                <div className="flex items-center gap-2 text-sm text-red-500">
                  <XCircle className="h-4 w-4" />
                  {t('mileage.programs.consent.cannotRedeem')}
                </div>
                <div className="flex items-center gap-2 text-sm text-red-500">
                  <XCircle className="h-4 w-4" />
                  {t('mileage.programs.consent.cannotTransfer')}
                </div>
                <div className="flex items-center gap-2 text-sm text-red-500">
                  <XCircle className="h-4 w-4" />
                  {t('mileage.programs.consent.cannotModify')}
                </div>
              </div>

              {/* No Password Notice */}
              <p className="text-xs text-muted-foreground">
                {t('mileage.programs.consent.noPassword')}
              </p>

              {/* Consent Checkbox */}
              <div className="flex items-start gap-2">
                <Checkbox 
                  id="consent"
                  checked={consentAccepted}
                  onCheckedChange={(checked) => setConsentAccepted(checked === true)}
                />
                <Label htmlFor="consent" className="text-sm cursor-pointer">
                  {t('mileage.programs.consent.checkbox')}
                </Label>
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" onClick={() => setStep('select')}>
                {t('common.back')}
              </Button>
              <Button 
                onClick={handleContinue}
                disabled={!consentAccepted}
              >
                {selectedProgram.hasOAuth ? (
                  <>
                    {t('mileage.programs.consent.continue').replace('{program}', selectedProgram.name)}
                    <ExternalLink className="ml-2 h-4 w-4" />
                  </>
                ) : (
                  t('common.continue')
                )}
              </Button>
            </DialogFooter>
          </>
        )}

        {step === 'manual_entry' && selectedProgram && (
          <>
            <DialogHeader>
              <DialogTitle>
                {t('mileage.programs.manualEntry')}
              </DialogTitle>
              <DialogDescription>
                {t('mileage.programs.manualEntryDesc')}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {/* Program Header */}
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <div 
                  className="w-10 h-10 rounded-lg flex items-center justify-center p-1.5"
                  style={{ backgroundColor: `${selectedProgram.primaryColor}15` }}
                >
                  {selectedProgram.logo ? (
                    <img 
                      src={selectedProgram.logo} 
                      alt={selectedProgram.name}
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <span 
                      className="text-sm font-bold"
                      style={{ color: selectedProgram.primaryColor }}
                    >
                      {selectedProgram.name.charAt(0)}
                    </span>
                  )}
                </div>
                <span className="font-medium">{selectedProgram.name}</span>
              </div>

              {/* Member ID Input */}
              <div className="space-y-2">
                <Label htmlFor="memberId">
                  {t('mileage.programs.memberId')}
                </Label>
                <Input
                  id="memberId"
                  placeholder={t('mileage.programs.memberIdPlaceholder')}
                  value={memberId}
                  onChange={(e) => setMemberId(e.target.value)}
                />
              </div>

              {/* Balance Input */}
              <div className="space-y-2">
                <Label htmlFor="balance">
                  {t('mileage.programs.currentBalance')}
                </Label>
                <Input
                  id="balance"
                  type="number"
                  placeholder="0"
                  value={balance}
                  onChange={(e) => setBalance(e.target.value)}
                />
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" onClick={() => setStep('consent')}>
                {t('common.back')}
              </Button>
              <Button onClick={handleManualConnect}>
                {t('mileage.programs.connect')}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
