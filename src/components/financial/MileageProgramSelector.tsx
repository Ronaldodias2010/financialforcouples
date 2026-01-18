import React from 'react';
import { MileageProgramConfig } from '@/data/mileagePrograms';
import { useLanguage } from '@/hooks/useLanguage';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronRight, Globe, Plane } from 'lucide-react';

interface MileageProgramSelectorProps {
  programs: MileageProgramConfig[];
  onSelect: (program: MileageProgramConfig) => void;
}

export function MileageProgramSelector({ programs, onSelect }: MileageProgramSelectorProps) {
  const { t } = useLanguage();

  const brazilianPrograms = programs.filter(p => p.country === 'BR');
  const internationalPrograms = programs.filter(p => p.country !== 'BR');

  const ProgramItem = ({ program }: { program: MileageProgramConfig }) => (
    <Button
      variant="ghost"
      className="w-full justify-between h-auto py-3 px-4 hover:bg-accent"
      onClick={() => onSelect(program)}
    >
      <div className="flex items-center gap-3">
        <div 
          className="w-10 h-10 rounded-lg flex items-center justify-center p-1.5"
          style={{ backgroundColor: `${program.primaryColor}15` }}
        >
          {program.logo ? (
            <img 
              src={program.logo} 
              alt={program.name}
              className="w-full h-full object-contain"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                target.parentElement!.innerHTML = `<span class="text-sm font-bold" style="color: ${program.primaryColor}">${program.name.charAt(0)}</span>`;
              }}
            />
          ) : (
            <span 
              className="text-sm font-bold"
              style={{ color: program.primaryColor }}
            >
              {program.name.charAt(0)}
            </span>
          )}
        </div>
        <div className="text-left">
          <div className="font-medium text-foreground">{program.name}</div>
          {program.hasOAuth && (
            <Badge variant="secondary" className="text-xs mt-0.5">
              OAuth
            </Badge>
          )}
        </div>
      </div>
      <ChevronRight className="h-5 w-5 text-muted-foreground" />
    </Button>
  );

  return (
    <div className="space-y-4">
      {brazilianPrograms.length > 0 && (
        <div>
          <div className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-muted-foreground">
            <Globe className="h-4 w-4" />
            {t('mileage.programs.brazilian')}
          </div>
          <div className="space-y-1">
            {brazilianPrograms.map(program => (
              <ProgramItem key={program.code} program={program} />
            ))}
          </div>
        </div>
      )}

      {internationalPrograms.length > 0 && (
        <div>
          <div className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-muted-foreground">
            <Plane className="h-4 w-4" />
            {t('mileage.programs.international')}
          </div>
          <div className="space-y-1">
            {internationalPrograms.map(program => (
              <ProgramItem key={program.code} program={program} />
            ))}
          </div>
        </div>
      )}

      {programs.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          {t('mileage.programs.allConnected')}
        </div>
      )}
    </div>
  );
}
