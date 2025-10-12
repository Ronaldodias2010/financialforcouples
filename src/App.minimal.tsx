import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Landing from "./pages/Landing";
import Auth from "./pages/Auth";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const TestPage = () => (
  <div style={{ 
    minHeight: '100vh', 
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    fontFamily: 'sans-serif',
    textAlign: 'center',
    padding: '2rem'
  }}>
    <div>
      <h1 style={{ fontSize: '3rem', marginBottom: '1rem' }}>✅ App Funcionando!</h1>
      <p style={{ fontSize: '1.5rem' }}>Couples Financials está online</p>
      <p style={{ marginTop: '2rem', opacity: 0.9 }}>
        URL: {window.location.href}
      </p>
      <div style={{ marginTop: '2rem' }}>
        <a href="/auth" style={{ color: 'white', textDecoration: 'underline' }}>Ir para Login</a>
      </div>
    </div>
  </div>
);

const AppMinimal = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="*" element={<TestPage />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

export default AppMinimal;
