import { FinancialDashboard } from "@/components/financial/FinancialDashboard";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { LogOut, User } from "lucide-react";

const Index = () => {
  const { user, signOut } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex justify-end items-center">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <User className="h-4 w-4" />
              <span>{user?.email}</span>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={signOut}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sair
            </Button>
          </div>
        </div>
      </header>
      <main>
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col items-center text-center mb-8">
            <img 
              src="/lovable-uploads/dd7ede7f-5f8a-4148-ad57-7447549dd45d.png"
              alt="Financial Management Logo" 
              className="h-32 w-32 object-contain -mb-2"
            />
            <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Gestão Financeira para Casais
            </h1>
          </div>
        </div>
        <FinancialDashboard />
      </main>
    </div>
  );
};

export default Index;
