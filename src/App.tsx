import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

function App() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("Entrando...");
    
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setMessage("Erro: " + error.message);
    } else {
      setMessage("Login realizado com sucesso!");
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("Criando conta...");
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      setMessage("Erro: " + error.message);
    } else {
      setMessage("Conta criada! Faça login.");
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  if (loading) {
    return (
      <div style={{ 
        minHeight: "100vh", 
        display: "flex", 
        alignItems: "center", 
        justifyContent: "center",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        color: "white",
        fontFamily: "sans-serif"
      }}>
        <div>Carregando...</div>
      </div>
    );
  }

  if (user) {
    return (
      <div style={{ 
        minHeight: "100vh", 
        display: "flex", 
        flexDirection: "column",
        alignItems: "center", 
        justifyContent: "center",
        background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
        color: "white",
        fontFamily: "sans-serif",
        padding: "2rem"
      }}>
        <h1 style={{ fontSize: "2rem", marginBottom: "1rem" }}>✅ Bem-vindo!</h1>
        <p style={{ marginBottom: "1rem" }}>Email: {user.email}</p>
        <p style={{ marginBottom: "2rem" }}>Você está logado com sucesso!</p>
        <button 
          onClick={handleLogout}
          style={{
            padding: "12px 24px",
            background: "white",
            color: "#059669",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            fontWeight: "bold",
            fontSize: "1rem"
          }}
        >
          Sair
        </button>
      </div>
    );
  }

  return (
    <div style={{ 
      minHeight: "100vh", 
      display: "flex", 
      flexDirection: "column",
      alignItems: "center", 
      justifyContent: "center",
      background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      color: "white",
      fontFamily: "sans-serif",
      padding: "2rem"
    }}>
      <div style={{
        background: "rgba(255,255,255,0.1)",
        padding: "2rem",
        borderRadius: "12px",
        width: "100%",
        maxWidth: "400px"
      }}>
        <h1 style={{ fontSize: "2rem", marginBottom: "0.5rem", textAlign: "center" }}>
          💰 Couples Financials
        </h1>
        <p style={{ marginBottom: "2rem", textAlign: "center", opacity: 0.9 }}>
          Sistema de Controle Financeiro
        </p>

        <form onSubmit={handleLogin} style={{ marginBottom: "1rem" }}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{
              width: "100%",
              padding: "12px",
              marginBottom: "1rem",
              borderRadius: "6px",
              border: "none",
              fontSize: "1rem"
            }}
            required
          />
          <input
            type="password"
            placeholder="Senha"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{
              width: "100%",
              padding: "12px",
              marginBottom: "1rem",
              borderRadius: "6px",
              border: "none",
              fontSize: "1rem"
            }}
            required
          />
          
          <button 
            type="submit"
            style={{
              width: "100%",
              padding: "12px",
              background: "#10b981",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              fontWeight: "bold",
              fontSize: "1rem",
              marginBottom: "0.5rem"
            }}
          >
            Entrar
          </button>
          
          <button 
            type="button"
            onClick={handleSignUp}
            style={{
              width: "100%",
              padding: "12px",
              background: "#3b82f6",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              fontWeight: "bold",
              fontSize: "1rem"
            }}
          >
            Criar Conta
          </button>
        </form>

        {message && (
          <p style={{ 
            textAlign: "center", 
            marginTop: "1rem",
            padding: "0.75rem",
            background: "rgba(255,255,255,0.2)",
            borderRadius: "6px"
          }}>
            {message}
          </p>
        )}
      </div>
    </div>
  );
}

export default App;
