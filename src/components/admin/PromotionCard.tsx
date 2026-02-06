import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plane, MapPin, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Promotion {
  id: string;
  programa: string;
  origem: string | null;
  destino: string;
  milhas_min: number;
  titulo: string | null;
  link: string | null;
  data_coleta: string;
  is_active: boolean;
}

interface PromotionCardProps {
  promotion: Promotion;
}

const programColors: Record<string, string> = {
  'Smiles': 'bg-orange-500',
  'LATAM Pass': 'bg-red-500',
  'TudoAzul': 'bg-blue-500',
  'Livelo': 'bg-purple-500',
  'Diversos': 'bg-gray-500',
};

export function PromotionCard({ promotion }: PromotionCardProps) {
  const programColor = programColors[promotion.programa] || 'bg-gray-500';
  
  const formatMiles = (miles: number) => {
    if (miles >= 1000) {
      return `${(miles / 1000).toFixed(0)}k`;
    }
    return miles.toString();
  };

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <Badge className={`${programColor} text-white`}>
            {promotion.programa}
          </Badge>
          <span className="text-2xl font-bold text-primary">
            {formatMiles(promotion.milhas_min)}
          </span>
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <MapPin className="w-4 h-4 text-muted-foreground" />
            <span className="font-medium">{promotion.destino}</span>
          </div>
          
          {promotion.origem && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Plane className="w-4 h-4" />
              <span>Saindo de {promotion.origem}</span>
            </div>
          )}
          
          {promotion.titulo && (
            <p className="text-xs text-muted-foreground line-clamp-2 mt-2">
              {promotion.titulo}
            </p>
          )}
        </div>
        
        <div className="flex items-center justify-between mt-4 pt-3 border-t">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Calendar className="w-3 h-3" />
            {format(new Date(promotion.data_coleta), 'dd/MM', { locale: ptBR })}
          </div>
          
          {promotion.link && (
            <a 
              href={promotion.link} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-xs text-primary hover:underline"
            >
              Ver oferta →
            </a>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
