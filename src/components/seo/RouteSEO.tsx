import { useEffect } from "react";
import { useLocation } from "react-router-dom";

// PR #4: SEO dinâmico para rotas internas (não altera landing pages)
export const RouteSEO = () => {
  const location = useLocation();

  useEffect(() => {
    const path = location.pathname;

    // Não tocar nas landings para evitar interferência
    if (path === "/" || path === "/landing-new") return;

    const hostname = typeof window !== 'undefined' ? window.location.hostname : 'couplesfinancials.com';
    const base = hostname === 'couplesfin.com' || hostname === 'www.couplesfin.com' 
      ? "https://couplesfin.com" 
      : "https://couplesfinancials.com";

    const map: Record<string, { title: string; description: string; canonical?: string; keywords?: string }> = {
      "/auth": {
        title: "Login | Couples Financials - Acesse sua Conta",
        description: "Acesse sua conta segura para gerenciar as finanças do casal. Login rápido e seguro com e-mail ou Google.",
        canonical: `${base}/auth`,
        keywords: "login couples financials, entrar app finanças casal, acesso conta",
      },
      "/login": {
        title: "Login | Couples Financials - Acesse sua Conta",
        description: "Acesse sua conta segura para gerenciar as finanças do casal. Login rápido e seguro.",
        canonical: `${base}/login`,
        keywords: "login couples financials, entrar app finanças casal",
      },
      "/app": {
        title: "Dashboard Financeiro para Casais | Couples Financials",
        description: "Acompanhe receitas, despesas, metas e investimentos do casal em um só lugar. Dashboard completo e intuitivo.",
        canonical: `${base}/app`,
        keywords: "dashboard financeiro casal, painel finanças, controle gastos",
      },
      "/accounts": {
        title: "Contas e Bancos | Couples Financials - Gestão de Contas",
        description: "Gerencie todas as contas bancárias do casal em um só lugar. Acompanhe saldos e movimentações com praticidade.",
        canonical: `${base}/accounts`,
        keywords: "contas bancárias casal, gestão contas, saldo bancário",
      },
      "/cards": {
        title: "Cartões de Crédito | Couples Financials - Controle de Cartões",
        description: "Controle limites, faturas e gastos de todos os cartões de crédito do casal. Nunca mais perca uma fatura.",
        canonical: `${base}/cards`,
        keywords: "cartão crédito casal, controle fatura, limite cartão",
      },
      "/mileage": {
        title: "Sistema de Milhas | Couples Financials - Acumule Milhas",
        description: "Simule, acompanhe e otimize o acúmulo de milhas aéreas do casal. Maximize seus pontos em cada compra.",
        canonical: `${base}/mileage`,
        keywords: "milhas aéreas, acumular milhas, programa fidelidade",
      },
      "/profile": {
        title: "Perfil do Usuário | Couples Financials",
        description: "Atualize seus dados pessoais, preferências de idioma e configurações de privacidade.",
        canonical: `${base}/profile`,
      },
      "/subscription": {
        title: "Assinatura e Planos | Couples Financials - Escolha seu Plano",
        description: "Conheça nossos planos: Gratuito, Essential e Premium. Escolha o melhor para as necessidades do seu casal.",
        canonical: `${base}/subscription`,
        keywords: "planos couples financials, assinatura premium, preços",
      },
      "/admin": {
        title: "Admin | Couples Financials",
        description: "Painel administrativo do sistema.",
        canonical: `${base}/admin`,
      },
      "/change-password": {
        title: "Alterar Senha | Couples Financials",
        description: "Atualize sua senha com segurança. Proteja sua conta com uma senha forte.",
        canonical: `${base}/change-password`,
      },
      "/forgot-password": {
        title: "Esqueci a Senha | Couples Financials - Recuperar Acesso",
        description: "Esqueceu sua senha? Receba instruções por e-mail para recuperar o acesso à sua conta de forma segura.",
        canonical: `${base}/forgot-password`,
        keywords: "esqueci senha, recuperar senha, redefinir senha",
      },
      "/reset-password": {
        title: "Redefinir Senha | Couples Financials",
        description: "Defina uma nova senha segura para sua conta.",
        canonical: `${base}/reset-password`,
      },
      "/email-confirmation": {
        title: "Confirmar E-mail | Couples Financials",
        description: "Confirme seu e-mail para ativar todos os recursos da sua conta.",
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
        title: "Admin Dashboard | Couples Financials",
        description: "Ferramentas administrativas e visões internas do sistema.",
        canonical: `${base}/admin-dashboard`,
      },
      "/sobre-nos": {
        title: "Sobre Nós | Couples Financials - Nossa História e Missão",
        description: "Conheça a história da Couples Financials, a primeira plataforma brasileira especializada em gestão financeira para casais. Nossa missão é ajudar casais a organizarem suas finanças juntos.",
        canonical: `${base}/sobre-nos`,
        keywords: "sobre couples financials, história, missão, equipe",
      },
      "/about-us": {
        title: "About Us | Couples Financials - Our Story and Mission",
        description: "Learn about Couples Financials' story, the first Brazilian platform specialized in financial management for couples. Our mission is to help couples organize their finances together.",
        canonical: `${base}/about-us`,
        keywords: "about couples financials, story, mission, team",
      },
      "/partnership": {
        title: "Programa de Parceiros | Couples Financials - Seja um Afiliado",
        description: "Junte-se ao nosso programa de afiliados e ganhe comissões indicando o Couples Financials. Parceria para influenciadores e criadores de conteúdo.",
        canonical: `${base}/partnership`,
        keywords: "afiliados, parceiros, comissão, influenciadores",
      },
      "/install-app": {
        title: "Instalar App | Couples Financials - Baixe o PWA",
        description: "Instale o Couples Financials no seu celular ou computador. App rápido e funciona offline.",
        canonical: `${base}/install-app`,
        keywords: "instalar app, baixar, pwa, aplicativo",
      },
      "/privacy": {
        title: "Política de Privacidade | Couples Financials",
        description: "Saiba como protegemos seus dados e informações financeiras. Transparência e segurança são nossas prioridades.",
        canonical: `${base}/privacy`,
        keywords: "privacidade, proteção dados, lgpd, segurança",
      },
      "/terms": {
        title: "Termos de Uso | Couples Financials",
        description: "Leia nossos termos de uso e condições do serviço Couples Financials.",
        canonical: `${base}/terms`,
        keywords: "termos uso, condições, contrato",
      },
      "/security-settings": {
        title: "Configurações de Segurança | Couples Financials",
        description: "Gerencie as configurações de segurança da sua conta.",
        canonical: `${base}/security-settings`,
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
    
    // Atualizar keywords se disponível
    if (entry.keywords) {
      setMeta("keywords", entry.keywords);
    }

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
