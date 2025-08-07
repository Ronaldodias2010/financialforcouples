import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

const LandingSimple = () => {
  console.log("🔄 LandingSimple: Iniciando renderização");
  
  const navigate = useNavigate();
  console.log("🔄 LandingSimple: useNavigate OK");
  
  const { user } = useAuth();
  console.log("🔄 LandingSimple: useAuth OK, user:", !!user);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-purple-700 text-white flex items-center justify-center p-8">
      <div className="max-w-2xl text-center">
        <h1 className="text-4xl font-bold mb-4">💰 Couples Financials</h1>
        <p className="text-xl mb-6 opacity-90">Landing Page Funcionando!</p>
        
        <div className="bg-white/10 backdrop-blur-sm p-6 rounded-2xl mb-6">
          <div className="bg-green-500 p-3 rounded-lg mb-4">
            <strong className="text-lg">✅ LANDING SIMPLIFICADA OK</strong>
          </div>
          <p className="mb-2"><strong>useNavigate:</strong> ✅ OK</p>
          <p className="mb-2"><strong>useAuth:</strong> ✅ OK</p>
          <p><strong>User:</strong> {user ? '✅ Logado' : '❌ Não logado'}</p>
        </div>
        
        <div className="space-y-3">
          <Button 
            onClick={() => navigate("/auth")}
            className="bg-blue-500 hover:bg-blue-600 px-6 py-3 rounded-lg font-bold text-lg"
          >
            🔐 Ir para Auth
          </Button>
          
          {user && (
            <Button 
              onClick={() => navigate("/app")}
              className="bg-green-500 hover:bg-green-600 px-6 py-3 rounded-lg font-bold text-lg ml-4"
            >
              📱 Ir para App
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default LandingSimple;