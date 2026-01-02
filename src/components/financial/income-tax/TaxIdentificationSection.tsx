import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { User, CheckCircle, AlertCircle, Pencil, Save, X, Loader2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCpfValidation, formatCpf } from '@/hooks/useCpfValidation';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface TaxIdentificationSectionProps {
  profile: any;
  declarationType: 'individual' | 'joint';
}

export function TaxIdentificationSection({ profile, declarationType }: TaxIdentificationSectionProps) {
  const { t } = useLanguage();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [cpf, setCpf] = useState(profile?.cpf ? formatCpf(profile.cpf) : '');
  const [cpfPartner, setCpfPartner] = useState(profile?.cpf_partner ? formatCpf(profile.cpf_partner) : '');
  
  const { validateCpf, validationResult: cpfValidation } = useCpfValidation();
  const { validateCpf: validateCpfPartner, validationResult: cpfPartnerValidation } = useCpfValidation();

  useEffect(() => {
    if (profile?.cpf) setCpf(formatCpf(profile.cpf));
    if (profile?.cpf_partner) setCpfPartner(formatCpf(profile.cpf_partner));
  }, [profile]);

  const hasProfile = !!profile;
  const hasCpf = !!profile?.cpf;
  const hasCpfPartner = !!profile?.cpf_partner;

  const handleCpfChange = (value: string) => {
    const formatted = formatCpf(value);
    setCpf(formatted);
    validateCpf(formatted);
  };

  const handleCpfPartnerChange = (value: string) => {
    const formatted = formatCpf(value);
    setCpfPartner(formatted);
    validateCpfPartner(formatted);
  };

  const handleSave = async () => {
    // Validate both CPFs
    const cpfResult = validateCpf(cpf);
    const cpfPartnerResult = validateCpfPartner(cpfPartner);

    if (!cpfResult.isValid && cpf) {
      toast.error(cpfResult.errorMessage || t('tax.cpf.invalid'));
      return;
    }
    if (declarationType === 'joint' && !cpfPartnerResult.isValid && cpfPartner) {
      toast.error(cpfPartnerResult.errorMessage || t('tax.cpf.invalidPartner'));
      return;
    }

    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('profiles')
        .update({
          cpf: cpf.replace(/\D/g, '') || null,
          cpf_partner: cpfPartner.replace(/\D/g, '') || null
        })
        .eq('user_id', user.id);

      if (error) throw error;

      toast.success(t('tax.cpf.saved'));
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving CPF:', error);
      toast.error(t('tax.cpf.saveError'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setCpf(profile?.cpf ? formatCpf(profile.cpf) : '');
    setCpfPartner(profile?.cpf_partner ? formatCpf(profile.cpf_partner) : '');
    setIsEditing(false);
  };

  return (
    <div className="space-y-4 pt-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {t('tax.identification.help')}
        </p>
        {!isEditing ? (
          <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
            <Pencil className="h-4 w-4 mr-2" />
            {t('common.edit')}
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleCancel} disabled={isSaving}>
              <X className="h-4 w-4 mr-2" />
              {t('common.cancel')}
            </Button>
            <Button size="sm" onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              {t('common.save')}
            </Button>
          </div>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Person A */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-full bg-primary/10">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h4 className="font-medium">{t('tax.identification.personA')}</h4>
                <p className="text-sm text-muted-foreground">{t('tax.identification.mainDeclarant')}</p>
              </div>
              {hasProfile && hasCpf ? (
                <Badge className="ml-auto bg-green-500/10 text-green-500 border-green-500/20">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  OK
                </Badge>
              ) : (
                <Badge className="ml-auto bg-amber-500/10 text-amber-500 border-amber-500/20">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  {t('tax.incomplete')}
                </Badge>
              )}
            </div>

            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t('tax.identification.name')}</span>
                <span className="font-medium">{profile?.display_name || '-'}</span>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">CPF</span>
                  {isEditing ? (
                    <div className="w-40">
                      <Input
                        value={cpf}
                        onChange={(e) => handleCpfChange(e.target.value)}
                        placeholder="000.000.000-00"
                        className={`h-8 text-right ${!cpfValidation.isValid && cpf ? 'border-destructive' : ''}`}
                        maxLength={14}
                      />
                      {!cpfValidation.isValid && cpf && (
                        <p className="text-xs text-destructive mt-1 text-right">
                          {cpfValidation.errorMessage}
                        </p>
                      )}
                    </div>
                  ) : (
                    <span className="font-medium font-mono">
                      {profile?.cpf ? formatCpf(profile.cpf) : '-'}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Person B (if joint declaration) */}
        {declarationType === 'joint' && (
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-full bg-secondary/10">
                  <User className="h-5 w-5 text-secondary" />
                </div>
                <div>
                  <h4 className="font-medium">{t('tax.identification.personB')}</h4>
                  <p className="text-sm text-muted-foreground">{t('tax.identification.partner')}</p>
                </div>
                {profile?.second_user_name && hasCpfPartner ? (
                  <Badge className="ml-auto bg-green-500/10 text-green-500 border-green-500/20">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    OK
                  </Badge>
                ) : (
                  <Badge className="ml-auto bg-amber-500/10 text-amber-500 border-amber-500/20">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    {t('tax.incomplete')}
                  </Badge>
                )}
              </div>

              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{t('tax.identification.name')}</span>
                  <span className="font-medium">{profile?.second_user_name || '-'}</span>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">CPF</span>
                    {isEditing ? (
                      <div className="w-40">
                        <Input
                          value={cpfPartner}
                          onChange={(e) => handleCpfPartnerChange(e.target.value)}
                          placeholder="000.000.000-00"
                          className={`h-8 text-right ${!cpfPartnerValidation.isValid && cpfPartner ? 'border-destructive' : ''}`}
                          maxLength={14}
                        />
                        {!cpfPartnerValidation.isValid && cpfPartner && (
                          <p className="text-xs text-destructive mt-1 text-right">
                            {cpfPartnerValidation.errorMessage}
                          </p>
                        )}
                      </div>
                    ) : (
                      <span className="font-medium font-mono">
                        {profile?.cpf_partner ? formatCpf(profile.cpf_partner) : '-'}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Declaration Type Info */}
      <Card className="bg-muted/50">
        <CardContent className="pt-4">
          <p className="text-sm text-muted-foreground">
            <strong>{t('tax.identification.declarationType')}:</strong>{' '}
            {declarationType === 'individual' 
              ? t('tax.identification.individualDesc')
              : t('tax.identification.jointDesc')
            }
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
