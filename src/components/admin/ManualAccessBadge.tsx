import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, ExternalLink } from 'lucide-react';

interface ManualAccessBadgeProps {
  language: 'en' | 'pt';
  userId: string;
  onViewDetails?: () => void;
}

const text = {
  en: {
    granted: 'Granted Access',
    viewExpiration: 'View Expiration'
  },
  pt: {
    granted: 'Acesso Concedido',
    viewExpiration: 'Ver Validade'
  }
};

export function ManualAccessBadge({ language, userId, onViewDetails }: ManualAccessBadgeProps) {
  const t = text[language];

  return (
    <div className="flex items-center gap-2">
      <Badge 
        variant="outline" 
        className="bg-yellow-50 border-yellow-300 text-yellow-800 dark:bg-yellow-900/20 dark:border-yellow-700 dark:text-yellow-300"
      >
        <Clock className="w-3 h-3 mr-1" />
        {t.granted}
      </Badge>
      <Button
        size="sm"
        variant="ghost"
        className="h-6 px-2 text-xs text-blue-600 hover:text-blue-800"
        onClick={onViewDetails}
      >
        <ExternalLink className="w-3 h-3 mr-1" />
        {t.viewExpiration}
      </Button>
    </div>
  );
}