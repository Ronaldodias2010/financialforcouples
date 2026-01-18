import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MileageProgram } from '@/hooks/useMileagePrograms';
import { getProgramByCode } from '@/data/mileagePrograms';
import { useLanguage } from '@/hooks/useLanguage';

interface MileageProgramEditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  program: MileageProgram;
  onSave: (programId: string, balance: number, memberId?: string) => void;
}

export function MileageProgramEditModal({
  open,
  onOpenChange,
  program,
  onSave
}: MileageProgramEditModalProps) {
  const { t } = useLanguage();
  const [memberId, setMemberId] = useState('');
  const [balance, setBalance] = useState('');
  
  const programConfig = getProgramByCode(program.program_code);

  useEffect(() => {
    if (open) {
      setMemberId(program.external_member_id || '');
      setBalance(program.balance_miles.toString());
    }
  }, [open, program]);

  const handleSave = () => {
    const balanceNum = parseFloat(balance.replace(/[^\d.-]/g, '')) || 0;
    onSave(program.id, balanceNum, memberId || undefined);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {t('mileage.programs.editProgram')}
          </DialogTitle>
          <DialogDescription>
            {t('mileage.programs.editProgramDesc')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Program Header */}
          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
            <div 
              className="w-10 h-10 rounded-lg flex items-center justify-center p-1.5"
              style={{ backgroundColor: `${programConfig?.primaryColor || '#888'}15` }}
            >
              {programConfig?.logo ? (
                <img 
                  src={programConfig.logo} 
                  alt={program.program_name}
                  className="w-full h-full object-contain"
                />
              ) : (
                <span 
                  className="text-sm font-bold"
                  style={{ color: programConfig?.primaryColor || '#888' }}
                >
                  {program.program_name.charAt(0)}
                </span>
              )}
            </div>
            <span className="font-medium">{program.program_name}</span>
          </div>

          {/* Member ID Input */}
          <div className="space-y-2">
            <Label htmlFor="editMemberId">
              {t('mileage.programs.memberId')}
            </Label>
            <Input
              id="editMemberId"
              placeholder={t('mileage.programs.memberIdPlaceholder')}
              value={memberId}
              onChange={(e) => setMemberId(e.target.value)}
            />
          </div>

          {/* Balance Input */}
          <div className="space-y-2">
            <Label htmlFor="editBalance">
              {t('mileage.programs.currentBalance')}
            </Label>
            <Input
              id="editBalance"
              type="number"
              placeholder="0"
              value={balance}
              onChange={(e) => setBalance(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('common.cancel')}
          </Button>
          <Button onClick={handleSave}>
            {t('common.save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
