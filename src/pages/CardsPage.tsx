import { useState } from "react";
import { CardForm } from "@/components/cards/CardForm";
import { CardList } from "@/components/cards/CardList";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

interface CardsPageProps {
  onBack: () => void;
}

export const CardsPage = ({ onBack }: CardsPageProps) => {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleCardAdded = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
        <h1 className="text-3xl font-bold">Gerenciar Cartões</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <CardForm onCardAdded={handleCardAdded} />
        <CardList refreshTrigger={refreshTrigger} />
      </div>
    </div>
  );
};