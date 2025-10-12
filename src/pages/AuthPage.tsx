import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/hooks/useLanguage';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const AuthPage = () => {
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('Entrando...');
    
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setMessage('Erro: ' + error.message);
    } else {
      setMessage('Login realizado com sucesso!');
    }
    setLoading(false);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('Criando conta...');
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      setMessage('Erro: ' + error.message);
    } else {
      setMessage('Conta criada! Faça login.');
    }
    setLoading(false);
  };

  return (
    <div 
      style={{ 
        minHeight: "100vh", 
        display: "flex", 
        flexDirection: "column",
        alignItems: "center", 
        justifyContent: "center",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        color: "white",
        fontFamily: "sans-serif",
        padding: "2rem"
      }}
    >
      <div style={{
        background: "rgba(255,255,255,0.1)",
        padding: "2rem",
        borderRadius: "12px",
        width: "100%",
        maxWidth: "400px",
        backdropFilter: "blur(10px)"
      }}>
        <h1 style={{ fontSize: "2rem", marginBottom: "0.5rem", textAlign: "center" }}>
          💰 {t('hero.title')}
        </h1>
        <p style={{ marginBottom: "2rem", textAlign: "center", opacity: 0.9 }}>
          Sistema de Controle Financeiro
        </p>

        <form onSubmit={handleLogin} style={{ marginBottom: "1rem" }}>
          <Input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{
              width: "100%",
              marginBottom: "1rem",
            }}
            required
            disabled={loading}
          />
          <Input
            type="password"
            placeholder="Senha"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{
              width: "100%",
              marginBottom: "1rem",
            }}
            required
            disabled={loading}
          />
          
          <Button 
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              marginBottom: "0.5rem",
              background: "#10b981",
              color: "white"
            }}
          >
            {loading ? 'Aguarde...' : 'Entrar'}
          </Button>
          
          <Button 
            type="button"
            onClick={handleSignUp}
            disabled={loading}
            style={{
              width: "100%",
              background: "#3b82f6",
              color: "white"
            }}
          >
            Criar Conta
          </Button>
        </form>

        {message && (
          <p style={{ 
            textAlign: "center", 
            marginTop: "1rem",
            padding: "0.75rem",
            background: "rgba(255,255,255,0.2)",
            borderRadius: "6px",
            fontSize: "0.9rem"
          }}>
            {message}
          </p>
        )}
      </div>
    </div>
  );
};

export default AuthPage;
