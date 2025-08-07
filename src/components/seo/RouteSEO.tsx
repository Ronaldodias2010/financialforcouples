import { useEffect } from "react";
import { useLocation } from "react-router-dom";

// PR #4: SEO dinâmico para rotas internas (não altera landing pages)
export const RouteSEO = () => {
  const location = useLocation();

  useEffect(() => {
    const path = location.pathname;

    // Não tocar nas landings para evitar interferência
    if (path === "/" || path === "/landing-new") return;

    const base = "https://couplesfinancials.com";

    const map: Record<string, { title: string; description: string; canonical?: string }> = {
      "/auth": {
        title: "Login | Couples Financials",
        description: "Acesse sua conta segura para gerenciar as finanças do casal.",
        canonical: `${base}/auth`,
      },
      "/login": {
        title: "Login | Couples Financials",
        description: "Acesse sua conta segura para gerenciar as finanças do casal.",
        canonical: `${base}/login`,
      },
      "/app": {
        title: "Dashboard Financeiro para Casais | Couples Financials",
        description: "Acompanhe receitas, despesas, metas e investimentos do casal em um só lugar.",
        canonical: `${base}/app`,
      },
      "/accounts": {
        title: "Contas e Bancos | Couples Financials",
        description: "Gerencie contas bancárias e saldos compartilhados com praticidade.",
        canonical: `${base}/accounts`,
      },
      "/cards": {
        title: "Cartões de Crédito | Couples Financials",
        description: "Controle limites, faturas e gastos no cartão de crédito do casal.",
        canonical: `${base}/cards`,
      },
      "/mileage": {
        title: "Sistema de Milhas | Couples Financials",
        description: "Simule, acompanhe e otimize o acúmulo de milhas do casal.",
        canonical: `${base}/mileage`,
      },
      "/profile": {
        title: "Perfil do Usuário | Couples Financials",
        description: "Atualize dados pessoais, preferências e privacidade.",
        canonical: `${base}/profile`,
      },
      "/subscription": {
        title: "Assinatura e Planos | Couples Financials",
        description: "Gerencie sua assinatura, planos e pagamentos com segurança.",
        canonical: `${base}/subscription`,
      },
      "/admin": {
        title: "Admin | Couples Financials",
        description: "Ferramentas administrativas e visões internas do sistema.",
        canonical: `${base}/admin`,
      },
      "/change-password": {
        title: "Alterar Senha | Couples Financials",
        description: "Atualize sua senha com segurança.",
        canonical: `${base}/change-password`,
      },
      "/forgot-password": {
        title: "Esqueci a Senha | Couples Financials",
        description: "Receba instruções para recuperar o acesso à sua conta.",
        canonical: `${base}/forgot-password`,
      },
      "/reset-password": {
        title: "Redefinir Senha | Couples Financials",
        description: "Defina uma nova senha para sua conta.",
        canonical: `${base}/reset-password`,
      },
      "/email-confirmation": {
        title: "Confirmar E-mail | Couples Financials",
        description: "Confirme seu e-mail para ativar todos os recursos.",
        canonical: `${base}/email-confirmation`,
      },
      "/send-confirmation": {
        title: "Reenviar Confirmação | Couples Financials",
        description: "Reenvie o e-mail de confirmação da sua conta.",
        canonical: `${base}/send-confirmation`,
      },
      "/email-test": {
        title: "Teste de E-mail | Couples Financials",
        description: "Ambiente de teste para templates e envios de e-mail.",
        canonical: `${base}/email-test`,
      },
      "/admin-dashboard": {
        title: "Admin | Couples Financials",
        description: "Ferramentas administrativas e visões internas do sistema.",
        canonical: `${base}/admin`,
      }
    };

    // Encontrar a melhor correspondência (match exato ou por prefixo)
    const entry = map[path] || Object.entries(map).find(([key]) => key !== "/" && path.startsWith(key))?.[1];

    if (!entry) return;

    document.title = entry.title;

    const setMeta = (name: string, content: string) => {
      let el = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement | null;
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute("name", name);
        document.head.appendChild(el);
      }
      el.setAttribute("content", content);
    };

    setMeta("description", entry.description);

    // Atualizar canonical
    const ensureCanonical = (href: string) => {
      let link = document.querySelector("link[rel=canonical]") as HTMLLinkElement | null;
      if (!link) {
        link = document.createElement("link");
        link.setAttribute("rel", "canonical");
        document.head.appendChild(link);
      }
      link.setAttribute("href", href);
    };

    if (entry.canonical) ensureCanonical(entry.canonical);
  }, [location.pathname]);

  return null;
};
