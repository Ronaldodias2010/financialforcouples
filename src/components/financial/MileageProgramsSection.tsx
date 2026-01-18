import React, { useState } from 'react';
import { Plus, RefreshCw, Link2, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useMileagePrograms } from '@/hooks/useMileagePrograms';
import { MileageProgramCard } from './MileageProgramCard';
import { MileageProgramConnectModal } from './MileageProgramConnectModal';
import { MileageProgramEditModal } from './MileageProgramEditModal';
import { useLanguage } from '@/hooks/useLanguage';
import { formatMilesValue } from '@/data/mileagePrograms';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface MileageProgramsSectionProps {
  onMilesUpdate?: () => void;
}

export function MileageProgramsSection({ onMilesUpdate }: MileageProgramsSectionProps) {
  const { t } = useLanguage();
  const {
    programs,
    loading,
    syncing,
    totalSyncedMiles,
    totalEstimatedValue,
    connectProgram,
    disconnectProgram,
    updateProgramBalance,
    syncProgram,
    getAvailableProgramsToConnect
  } = useMileagePrograms();

  const [connectModalOpen, setConnectModalOpen] = useState(false);
  const [editingProgram, setEditingProgram] = useState<string | null>(null);
  const [disconnectingProgram, setDisconnectingProgram] = useState<string | null>(null);

  const handleConnect = async (programCode: string, memberId?: string, balance?: number) => {
    const program = await connectProgram(programCode, memberId);
    if (program && balance !== undefined && balance > 0) {
      await updateProgramBalance(program.id, balance, memberId);
    }
    onMilesUpdate?.();
  };

  const handleDisconnect = async () => {
    if (disconnectingProgram) {
      await disconnectProgram(disconnectingProgram);
      setDisconnectingProgram(null);
      onMilesUpdate?.();
    }
  };

  const handleUpdateBalance = async (programId: string, balance: number, memberId?: string) => {
    await updateProgramBalance(programId, balance, memberId);
    setEditingProgram(null);
    onMilesUpdate?.();
  };

  const programToEdit = programs.find(p => p.id === editingProgram);

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Link2 className="h-5 w-5 text-primary" />
            {t('mileage.programs.title')}
          </CardTitle>
          <div className="flex items-center gap-2">
            {programs.length > 0 && (
              <div className="text-right mr-4">
                <div className="text-2xl font-bold">
                  {totalSyncedMiles.toLocaleString()}
                </div>
                {totalEstimatedValue > 0 && (
                  <div className="text-sm text-muted-foreground">
                    ≈ R$ {totalEstimatedValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </div>
                )}
              </div>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setConnectModalOpen(true)}
              className="gap-1"
            >
              <Plus className="h-4 w-4" />
              {t('mileage.programs.addProgram')}
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          {programs.length === 0 ? (
            <div className="text-center py-12 space-y-4">
              <div className="w-16 h-16 rounded-full bg-muted mx-auto flex items-center justify-center">
                <Link2 className="h-8 w-8 text-muted-foreground" />
              </div>
              <div>
                <h3 className="font-medium text-foreground">
                  {t('mileage.programs.noPrograms')}
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {t('mileage.programs.noProgramsDesc')}
                </p>
              </div>
              <Button onClick={() => setConnectModalOpen(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                {t('mileage.programs.connectFirst')}
              </Button>
            </div>
          ) : (
            <Tabs defaultValue="balance" className="w-full">
              <TabsList className="mb-4">
                <TabsTrigger value="balance">{t('mileage.programs.balance')}</TabsTrigger>
                <TabsTrigger value="expiring">{t('mileage.programs.expiring')}</TabsTrigger>
                <TabsTrigger value="history">{t('mileage.programs.history')}</TabsTrigger>
              </TabsList>

              <TabsContent value="balance">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {programs.map(program => (
                    <MileageProgramCard
                      key={program.id}
                      program={program}
                      isSyncing={syncing === program.id}
                      onSync={() => syncProgram(program.id)}
                      onEdit={() => setEditingProgram(program.id)}
                      onDisconnect={() => setDisconnectingProgram(program.id)}
                    />
                  ))}
                  
                  {/* Add Program Card */}
                  <Card
                    className="border-dashed cursor-pointer hover:border-primary hover:bg-accent/50 transition-colors"
                    onClick={() => setConnectModalOpen(true)}
                  >
                    <CardContent className="flex flex-col items-center justify-center h-full min-h-[180px] gap-2">
                      <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                        <Plus className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {t('mileage.programs.addProgram')}
                      </span>
                    </CardContent>
                  </Card>
                </div>

                <p className="text-xs text-muted-foreground mt-4 text-center">
                  {t('mileage.programs.disclaimer')}
                </p>
              </TabsContent>

              <TabsContent value="expiring">
                <div className="text-center py-8 text-muted-foreground">
                  {t('mileage.programs.noExpiringMiles')}
                </div>
              </TabsContent>

              <TabsContent value="history">
                <div className="text-center py-8 text-muted-foreground">
                  {t('mileage.programs.noHistory')}
                </div>
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>

      {/* Connect Modal */}
      <MileageProgramConnectModal
        open={connectModalOpen}
        onOpenChange={setConnectModalOpen}
        availablePrograms={getAvailableProgramsToConnect()}
        onConnect={handleConnect}
      />

      {/* Edit Modal */}
      {programToEdit && (
        <MileageProgramEditModal
          open={!!editingProgram}
          onOpenChange={(open) => !open && setEditingProgram(null)}
          program={programToEdit}
          onSave={handleUpdateBalance}
        />
      )}

      {/* Disconnect Confirmation */}
      <AlertDialog open={!!disconnectingProgram} onOpenChange={(open) => !open && setDisconnectingProgram(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('mileage.programs.disconnectConfirm')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('mileage.programs.disconnectConfirmDesc')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDisconnect} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {t('mileage.programs.disconnect')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
