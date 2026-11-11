import React, { useState, useEffect } from 'react';
import LandingPage from './pages/LandingPage';
import CadastroPage from './pages/CadastroPage';
import BemVindoPage from './pages/BemVindoPage';
import DominioPage from './pages/DominioPage';
import {
  PRODUCT_NAME,
  PRECO_ASSINATURA_PY,
  PRECO_LICENCA_PY,
  CUSTO_SERVIDOR_PY,
  WHATSAPP_NUMBER,
  DEMO_URL,
  SUPPORT_EMAIL,
  Language
} from './constants';

// Re-exporta constantes para acesso e customização no topo do arquivo
export {
  PRODUCT_NAME,
  PRECO_ASSINATURA_PY,
  PRECO_LICENCA_PY,
  CUSTO_SERVIDOR_PY,
  WHATSAPP_NUMBER,
  DEMO_URL,
  SUPPORT_EMAIL
};

export default function App() {
  // Idioma: o último escolhido; senão, o do celular (espanhol → es-PY)
  const [lang, setLangState] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem('site.lang');
      if (saved === 'pt-BR' || saved === 'es-PY') return saved;
    } catch {}
    return navigator.language?.toLowerCase().startsWith('es') ? 'es-PY' : 'pt-BR';
  });
  const setLang = (l: Language) => {
    setLangState(l);
    try {
      localStorage.setItem('site.lang', l);
    } catch {}
  };
  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);
  const [currentPath, setCurrentPath] = useState<string>(() => window.location.pathname);
  const [searchParams, setSearchParams] = useState<URLSearchParams>(() => new URLSearchParams(window.location.search));

  // Escuta histórico de navegação (botões voltar / avançar do navegador)
  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
      setSearchParams(new URLSearchParams(window.location.search));
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Navegador interno SPA sem recarregar a página
  const handleNavigate = (to: string) => {
    // Se for URL externa, redireciona
    if (to.startsWith('http://') || to.startsWith('https://')) {
      window.location.href = to;
      return;
    }

    // Se tiver âncora na mesma página
    if (to.startsWith('#')) {
      const el = document.querySelector(to);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
        return;
      }
    }

    const [pathname, search] = to.split('?');
    window.history.pushState({}, '', to);
    setCurrentPath(pathname);
    setSearchParams(new URLSearchParams(search || ''));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const isTestMode = searchParams.get('teste') === '1';
  const cadastroId = searchParams.get('cadastro') || 'CAD-102938';

  // Roteamento
  if (currentPath === '/cadastro') {
    return (
      <CadastroPage
        lang={lang}
        onLanguageChange={setLang}
        onNavigate={handleNavigate}
        isTestMode={isTestMode}
      />
    );
  }

  if (currentPath === '/bem-vindo') {
    return (
      <BemVindoPage
        cadastroId={cadastroId}
        lang={lang}
        onLanguageChange={setLang}
        onNavigate={handleNavigate}
        isTestMode={isTestMode}
      />
    );
  }

  if (currentPath === '/dominio') {
    return (
      <DominioPage
        cadastroId={cadastroId}
        lang={lang}
        onLanguageChange={setLang}
        onNavigate={handleNavigate}
        isTestMode={isTestMode}
      />
    );
  }

  return (
    <LandingPage
      lang={lang}
      onLanguageChange={setLang}
      onNavigate={handleNavigate}
      isTestMode={isTestMode}
    />
  );
}
