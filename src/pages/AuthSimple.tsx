import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export default function AuthSimple() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('Processando...');

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/app`
          }
        });
        if (error) throw error;
        setMessage('✅ Cadastro realizado! Verifique seu email.');
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        setMessage('✅ Login realizado!');
        window.location.href = '/app';
      }
    } catch (error: any) {
      setMessage(`❌ Erro: ${error.message}`);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '2rem'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '1rem',
        padding: '2rem',
        maxWidth: '400px',
        width: '100%',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
      }}>
        <h1 style={{ textAlign: 'center', marginBottom: '0.5rem', color: '#333' }}>
          Couples Financials
        </h1>
        <p style={{ textAlign: 'center', marginBottom: '2rem', color: '#666' }}>
          {isSignUp ? 'Criar Conta' : 'Entrar'}
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: '#333' }}>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '0.75rem',
                borderRadius: '0.5rem',
                border: '1px solid #ddd',
                fontSize: '1rem'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: '#333' }}>Senha</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '0.75rem',
                borderRadius: '0.5rem',
                border: '1px solid #ddd',
                fontSize: '1rem'
              }}
            />
          </div>

          <button
            type="submit"
            style={{
              padding: '0.75rem',
              borderRadius: '0.5rem',
              border: 'none',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              fontSize: '1rem',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
          >
            {isSignUp ? 'Cadastrar' : 'Entrar'}
          </button>
        </form>

        {message && (
          <p style={{ marginTop: '1rem', textAlign: 'center', color: '#333' }}>
            {message}
          </p>
        )}

        <button
          onClick={() => setIsSignUp(!isSignUp)}
          style={{
            marginTop: '1rem',
            width: '100%',
            padding: '0.5rem',
            background: 'transparent',
            border: 'none',
            color: '#667eea',
            cursor: 'pointer',
            textDecoration: 'underline'
          }}
        >
          {isSignUp ? 'Já tem conta? Entrar' : 'Não tem conta? Cadastre-se'}
        </button>

        <a
          href="/"
          style={{
            display: 'block',
            marginTop: '1rem',
            textAlign: 'center',
            color: '#666',
            textDecoration: 'none'
          }}
        >
          ← Voltar
        </a>
      </div>
    </div>
  );
}
