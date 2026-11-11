import React, { useState, useEffect, useRef } from 'react';
import {
  Building2,
  User,
  CreditCard,
  CheckCircle2,
  XCircle,
  ArrowRight,
  ArrowLeft,
  Lock,
  Globe,
  Dumbbell,
  ShieldCheck,
  AlertCircle,
  Loader2,
  ExternalLink,
  Eye,
  EyeOff,
  Sparkles
} from 'lucide-react';
import {
  PRODUCT_NAME,
  BASE_DOMAIN,
  PRECO_ASSINATURA_BR,
  PRECO_ASSINATURA_PY,
  WHATSAPP_NUMBER,
  Language
} from '../constants';
import { CadastroDraft, CadastroPayload } from '../types';
import { checkSubdomainAvailability, submitCadastro, cadastroOnline } from '../api/apiClient';

interface CadastroPageProps {
  lang: Language;
  onLanguageChange: (newLang: Language) => void;
  onNavigate: (path: string) => void;
  isTestMode?: boolean;
}

export function slugifySubdomain(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 30);
}

// Avaliador de força de senha
function calculatePasswordStrength(pass: string): {
  score: number; // 0 to 4
  labelPt: string;
  labelEs: string;
  color: string;
} {
  if (!pass) return { score: 0, labelPt: 'Vazia', labelEs: 'Vacía', color: 'bg-slate-700' };
  let points = 0;
  if (pass.length >= 10) points += 1;
  if (pass.length >= 14) points += 1;
  if (/[A-Z]/.test(pass) && /[a-z]/.test(pass)) points += 1;
  if (/[0-9]/.test(pass)) points += 0.5;
  if (/[^A-Za-z0-9]/.test(pass)) points += 0.5;

  const score = Math.min(4, Math.floor(points));
  switch (score) {
    case 1:
      return { score: 1, labelPt: 'Muito fraca (mín. 10 chars)', labelEs: 'Muy débil (mín. 10 caracteres)', color: 'bg-rose-600' };
    case 2:
      return { score: 2, labelPt: 'Média', labelEs: 'Media', color: 'bg-amber-500' };
    case 3:
      return { score: 3, labelPt: 'Forte', labelEs: 'Fuerte', color: 'bg-emerald-500' };
    case 4:
      return { score: 4, labelPt: 'Excelente', labelEs: 'Excelente', color: 'bg-emerald-400' };
    default:
      return { score: 0, labelPt: 'Fraca', labelEs: 'Débil', color: 'bg-rose-600' };
  }
}

export default function CadastroPage({
  lang,
  onLanguageChange,
  onNavigate,
  isTestMode = false,
}: CadastroPageProps) {
  // Etapa atual: 1, 2 ou 3
  const [step, setStep] = useState<number>(1);

  // Formulário: rascunho
  const [formData, setFormData] = useState<CadastroDraft>(() => {
    try {
      const saved = sessionStorage.getItem('gymapp_cadastro_draft');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {}

    return {
      academia: '',
      pais: 'BR',
      cidade: '',
      subdominio: '',
      usaDominioProprio: false,
      dominioProprio: '',
      nome: '',
      email: '',
      whatsapp: '',
      termosAceitos: false,
    };
  });

  // Campos de senha (não salvos no sessionStorage por segurança)
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Erros por campo
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [globalError, setGlobalError] = useState<string | null>(null);
  // Sem o servidor de cadastro no ar, avisa e oferece o WhatsApp em vez de travar no formulário
  const [servidorOk, setServidorOk] = useState(true);
  useEffect(() => {
    if (!isTestMode) cadastroOnline().then(setServidorOk);
  }, [isTestMode]);

  // Estado da verificação de subdomínio
  const [subdomainStatus, setSubdomainStatus] = useState<'idle' | 'checking' | 'available' | 'unavailable'>('idle');
  const [isSubdomainManual, setIsSubdomainManual] = useState(false);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Estado de envio
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Salva rascunho (sem senha) no sessionStorage
  useEffect(() => {
    try {
      sessionStorage.setItem('gymapp_cadastro_draft', JSON.stringify(formData));
    } catch (e) {}
  }, [formData]);

  // Sugestão automática de subdomínio ao digitar nome da academia
  const handleAcademiaChange = (value: string) => {
    setFormData(prev => {
      const updated = { ...prev, academia: value };
      if (!isSubdomainManual) {
        const slug = slugifySubdomain(value);
        updated.subdominio = slug;
      }
      return updated;
    });

    if (errors.academia) {
      setErrors(prev => ({ ...prev, academia: '' }));
    }

    if (!isSubdomainManual) {
      triggerSubdomainCheck(slugifySubdomain(value));
    }
  };

  const handleSubdomainChange = (value: string) => {
    setIsSubdomainManual(true);
    const slug = slugifySubdomain(value);
    setFormData(prev => ({ ...prev, subdominio: slug }));
    if (errors.subdominio) {
      setErrors(prev => ({ ...prev, subdominio: '' }));
    }
    triggerSubdomainCheck(slug);
  };

  // Debounce de 400ms para verificar disponibilidade
  const triggerSubdomainCheck = (slug: string) => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (!slug || slug.length < 3) {
      setSubdomainStatus('idle');
      return;
    }

    setSubdomainStatus('checking');

    debounceTimerRef.current = setTimeout(async () => {
      const isAvailable = await checkSubdomainAvailability(slug, isTestMode);
      setSubdomainStatus(isAvailable ? 'available' : 'unavailable');
    }, 400);
  };

  // Ajusta DDI do WhatsApp se o país mudar
  const handlePaisChange = (pais: 'BR' | 'PY') => {
    setFormData(prev => {
      let rawPhone = prev.whatsapp.replace(/^\+55|^\+595/, '').trim();
      const newDdi = pais === 'BR' ? '+55 ' : '+595 ';
      return {
        ...prev,
        pais,
        whatsapp: newDdi + rawPhone,
      };
    });
  };

  // Inicializa DDI se vazio
  useEffect(() => {
    if (!formData.whatsapp) {
      setFormData(prev => ({
        ...prev,
        whatsapp: prev.pais === 'BR' ? '+55 ' : '+595 ',
      }));
    }
  }, [formData.pais]);

  // Validação da Etapa 1
  const validateStep1 = (): boolean => {
    const errs: Record<string, string> = {};

    if (!formData.academia.trim()) {
      errs.academia = lang === 'pt-BR' ? 'Informe o nome da sua academia.' : 'Ingresa el nombre de tu gimnasio.';
    }

    if (!formData.cidade.trim()) {
      errs.cidade = lang === 'pt-BR' ? 'Informe a cidade da academia.' : 'Ingresa la ciudad del gimnasio.';
    }

    if (!formData.subdominio.trim() || formData.subdominio.length < 3) {
      errs.subdominio = lang === 'pt-BR'
        ? 'O endereço deve ter entre 3 e 30 letras, números ou hífens.'
        : 'La dirección debe tener entre 3 y 30 caracteres válidos.';
    } else if (subdomainStatus === 'unavailable') {
      errs.subdominio = lang === 'pt-BR'
        ? 'Este endereço já está em uso ou indisponível. Escolha outro.'
        : 'Esta dirección ya está en uso. Por favor elige otra.';
    }

    if (formData.usaDominioProprio && formData.dominioProprio.trim()) {
      const dom = formData.dominioProprio.trim();
      if (!/^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(dom)) {
        errs.dominioProprio = lang === 'pt-BR'
          ? 'Formato de domínio inválido. Exemplo: app.minhaacademia.com.br'
          : 'Formato de dominio inválido. Ejemplo: app.minuevogimnasio.com';
      }
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // Validação da Etapa 2
  const validateStep2 = (): boolean => {
    const errs: Record<string, string> = {};

    if (!formData.nome.trim()) {
      errs.nome = lang === 'pt-BR' ? 'Informe seu nome completo.' : 'Ingresa tu nombre completo.';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim() || !emailRegex.test(formData.email)) {
      errs.email = lang === 'pt-BR' ? 'Informe um e-mail válido.' : 'Ingresa un correo electrónico válido.';
    }

    const phoneDigits = formData.whatsapp.replace(/\D/g, '');
    if (phoneDigits.length < 10) {
      errs.whatsapp = lang === 'pt-BR'
        ? 'Informe seu WhatsApp com DDD/código de área.'
        : 'Ingresa tu número de WhatsApp válido.';
    }

    if (!senha || senha.length < 10) {
      errs.senha = lang === 'pt-BR'
        ? 'A senha deve ter no mínimo 10 caracteres.'
        : 'La contraseña debe tener mínimo 10 caracteres.';
    }

    if (senha !== confirmarSenha) {
      errs.confirmarSenha = lang === 'pt-BR'
        ? 'As senhas não coincidem.'
        : 'Las contraseñas no coinciden.';
    }

    if (!formData.termosAceitos) {
      errs.termos = lang === 'pt-BR'
        ? 'Você precisa aceitar os termos de uso para continuar.'
        : 'Debes aceptar los términos de uso para continuar.';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNextFromStep1 = () => {
    if (validateStep1()) {
      setStep(2);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleNextFromStep2 = () => {
    if (validateStep2()) {
      setStep(3);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Envio final na Etapa 3
  const handleFinalSubmit = async () => {
    setGlobalError(null);
    setIsSubmitting(true);

    const payload: CadastroPayload = {
      academia: formData.academia.trim(),
      pais: formData.pais,
      cidade: formData.cidade.trim(),
      subdominio: formData.subdominio.trim(),
      dominioProprio: formData.usaDominioProprio && formData.dominioProprio.trim() ? formData.dominioProprio.trim() : null,
      nome: formData.nome.trim(),
      email: formData.email.trim(),
      whatsapp: formData.whatsapp.trim(),
      senha: senha,
      plano: 'assinatura',
      idioma: lang,
    };

    const res = await submitCadastro(payload, isTestMode);

    setIsSubmitting(false);

    if (res.erro) {
      setGlobalError(res.erro);
      // Volta para a etapa correspondente ao erro se detectado
      if (res.erro.toLowerCase().includes('subdominio') || res.erro.toLowerCase().includes('academia')) {
        setStep(1);
      } else if (res.erro.toLowerCase().includes('senha') || res.erro.toLowerCase().includes('email')) {
        setStep(2);
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (res.checkoutUrl) {
      // Se for URL externa redireciona, se for rota interna navega
      if (res.checkoutUrl.startsWith('http://') || res.checkoutUrl.startsWith('https://')) {
        window.location.href = res.checkoutUrl;
      } else {
        onNavigate(res.checkoutUrl);
      }
    }
  };

  const passwordStrength = calculatePasswordStrength(senha);
  const precoAtual = formData.pais === 'BR' ? PRECO_ASSINATURA_BR : PRECO_ASSINATURA_PY;

  return (
    <div className="min-h-screen bg-[#0B1120] text-slate-100 font-sans selection:bg-red-600 selection:text-white pb-20">
      
      {/* Topo fixo com Logo e Seletor de Idioma */}
      <header className="sticky top-0 z-40 bg-[#0B1120]/95 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <button
            type="button"
            onClick={() => onNavigate('/')}
            className="flex items-center gap-2.5 text-white font-black text-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 rounded-lg p-1"
          >
            <span className="w-7 h-7 rounded-lg bg-red-600 flex items-center justify-center text-white shadow-md shadow-red-600/30">
              <Dumbbell className="w-4 h-4 text-white" />
            </span>
            <span>{PRODUCT_NAME}</span>
          </button>

          <div className="flex items-center gap-3">
            {isTestMode && (
              <span className="text-[11px] bg-amber-500/20 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded font-mono">
                Modo Teste (?teste=1)
              </span>
            )}
            
            {/* Seletor de Idioma */}
            <div className="flex items-center bg-slate-900 border border-slate-700 rounded-lg p-0.5 text-xs font-semibold">
              <button
                type="button"
                onClick={() => onLanguageChange('pt-BR')}
                className={`px-2 py-1 rounded-md transition-colors ${
                  lang === 'pt-BR' ? 'bg-red-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                🇧🇷 PT
              </button>
              <button
                type="button"
                onClick={() => onLanguageChange('es-PY')}
                className={`px-2 py-1 rounded-md transition-colors ${
                  lang === 'es-PY' ? 'bg-red-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                🇵🇾 ES
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 pt-10">

        {/* Barra de Progresso em 3 Etapas */}
        <div className="mb-10">
          <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
            <span className={step >= 1 ? 'text-red-500' : ''}>
              1. {lang === 'pt-BR' ? 'Sua academia' : 'Tu gimnasio'}
            </span>
            <span className={step >= 2 ? 'text-red-500' : ''}>
              2. {lang === 'pt-BR' ? 'Você' : 'Tú'}
            </span>
            <span className={step >= 3 ? 'text-red-500' : ''}>
              3. {lang === 'pt-BR' ? 'Pagamento' : 'Pago'}
            </span>
          </div>

          <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
            <div
              className="bg-red-600 h-full transition-all duration-300 ease-out"
              style={{ width: step === 1 ? '33.33%' : step === 2 ? '66.66%' : '100%' }}
            />
          </div>
        </div>

        {!servidorOk && (
          <div role="status" className="mb-6 rounded-2xl border border-amber-500/40 bg-amber-500/10 p-4 text-sm text-amber-100">
            <p className="font-bold">
              {lang === 'pt-BR' ? 'O cadastro online abre em breve.' : 'El registro en línea abre pronto.'}
            </p>
            <p className="mt-1 text-amber-100/80">
              {lang === 'pt-BR'
                ? 'Enquanto isso, a gente faz o seu cadastro pelo WhatsApp e o app da sua academia fica pronto no mesmo dia.'
                : 'Mientras tanto, hacemos tu registro por WhatsApp y la app de tu gimnasio queda lista el mismo día.'}
            </p>
            <a
              href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
                lang === 'pt-BR' ? 'Olá! Quero cadastrar minha academia no app.' : '¡Hola! Quiero registrar mi gimnasio en la app.'
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 font-bold text-white hover:bg-emerald-700"
            >
              {lang === 'pt-BR' ? 'Cadastrar pelo WhatsApp' : 'Registrarme por WhatsApp'}
            </a>
          </div>
        )}

        {/* Mensagem Global de Erro */}
        {globalError && (
          <div className="mb-6 p-4 bg-rose-950/70 border border-rose-700/80 rounded-2xl flex items-start gap-3 text-rose-200 text-sm">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-bold">{lang === 'pt-BR' ? 'Ops! Verifique as informações:' : '¡Atención! Revisa los datos:'}</p>
              <p className="text-xs mt-0.5">{globalError}</p>
            </div>
          </div>
        )}

        {/* Container Central do Formulário */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-10 shadow-2xl">

          {/* ====================================================================
              ETAPA 1: SUA ACADEMIA
              ==================================================================== */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
                  <Building2 className="w-6 h-6 text-red-500" />
                  <span>{lang === 'pt-BR' ? 'Dados da sua academia' : 'Datos de tu gimnasio'}</span>
                </h2>
                <p className="text-slate-400 text-xs sm:text-sm mt-1">
                  {lang === 'pt-BR'
                    ? 'Configuraremos o ambiente exclusivo e o endereço do app para os seus alunos.'
                    : 'Configuraremos el entorno exclusivo y la dirección de la app para tus alumnos.'}
                </p>
              </div>

              {/* Nome da academia */}
              <div>
                <label htmlFor="cad-campo-1" className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                  {lang === 'pt-BR' ? 'Nome da Academia *' : 'Nombre del Gimnasio *'}
                </label>
                <input
                  id="cad-campo-1"
                  type="text"
                  value={formData.academia}
                  onChange={e => handleAcademiaChange(e.target.value)}
                  placeholder={lang === 'pt-BR' ? 'Ex: Iron Fitness Club' : 'Ej: Iron Fitness Club'}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-red-500 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-red-500 transition-colors"
                />
                {errors.academia && (
                  <p className="text-red-400 text-xs mt-1.5 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" /> {errors.academia}
                  </p>
                )}
              </div>

              {/* País e Cidade em Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* País */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                    {lang === 'pt-BR' ? 'País *' : 'País *'}
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => handlePaisChange('BR')}
                      className={`py-3 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                        formData.pais === 'BR'
                          ? 'bg-red-600/20 border-red-500 text-white shadow-sm'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      <span>🇧🇷 Brasil</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handlePaisChange('PY')}
                      className={`py-3 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                        formData.pais === 'PY'
                          ? 'bg-red-600/20 border-red-500 text-white shadow-sm'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      <span>🇵🇾 Paraguay</span>
                    </button>
                  </div>
                </div>

                {/* Cidade */}
                <div>
                  <label htmlFor="cad-campo-2" className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                    {lang === 'pt-BR' ? 'Cidade *' : 'Ciudad *'}
                  </label>
                  <input
                  id="cad-campo-2"
                    type="text"
                    value={formData.cidade}
                    onChange={e => {
                      setFormData(prev => ({ ...prev, cidade: e.target.value }));
                      if (errors.cidade) setErrors(prev => ({ ...prev, cidade: '' }));
                    }}
                    placeholder={lang === 'pt-BR' ? 'Ex: São Paulo' : 'Ej: Asunción'}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-red-500 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-red-500 transition-colors"
                  />
                  {errors.cidade && (
                    <p className="text-red-400 text-xs mt-1.5 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" /> {errors.cidade}
                    </p>
                  )}
                </div>
              </div>

              {/* Endereço do app (Subdomínio) */}
              <div className="pt-2">
                <label htmlFor="cad-campo-3" className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                  {lang === 'pt-BR' ? 'Endereço do App (Subdomínio gratuito) *' : 'Dirección de la App (Subdominio gratis) *'}
                </label>
                
                <div className="relative flex items-center">
                  <input
                  id="cad-campo-3"
                    type="text"
                    value={formData.subdominio}
                    onChange={e => handleSubdomainChange(e.target.value)}
                    placeholder="nomedaacademia"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-red-500 rounded-xl pl-4 pr-10 py-3 text-white font-mono text-sm placeholder-slate-600 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-red-500 transition-colors"
                  />
                  <div className="absolute right-3 flex items-center pointer-events-none">
                    {subdomainStatus === 'checking' && (
                      <Loader2 className="w-4 h-4 text-slate-400 animate-spin" />
                    )}
                    {subdomainStatus === 'available' && (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    )}
                    {subdomainStatus === 'unavailable' && (
                      <XCircle className="w-5 h-5 text-rose-500" />
                    )}
                  </div>
                </div>

                {/* Prévia do link */}
                <div className="mt-2 flex items-center justify-between text-xs">
                  <span className="text-slate-400">
                    {lang === 'pt-BR' ? 'Prévia:' : 'Vista previa:'}{' '}
                    <span className="font-mono font-semibold text-red-400">
                      {formData.subdominio || 'nomedaacademia'}.{BASE_DOMAIN}
                    </span>
                  </span>

                  {subdomainStatus === 'available' && (
                    <span className="text-emerald-400 font-semibold flex items-center gap-1">
                      ✓ {lang === 'pt-BR' ? 'Disponível' : 'Disponible'}
                    </span>
                  )}
                  {subdomainStatus === 'unavailable' && (
                    <span className="text-rose-400 font-semibold flex items-center gap-1">
                      ✗ {lang === 'pt-BR' ? 'Indisponível' : 'No disponible'}
                    </span>
                  )}
                </div>

                {errors.subdominio && (
                  <p className="text-red-400 text-xs mt-1.5 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" /> {errors.subdominio}
                  </p>
                )}
              </div>

              {/* Opção Domínio Próprio */}
              <div className="mt-4 pt-4 border-t border-slate-800">
                <label className="flex items-start gap-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={formData.usaDominioProprio}
                    onChange={e => setFormData(prev => ({ ...prev, usaDominioProprio: e.target.checked }))}
                    className="mt-1 w-4 h-4 rounded border-slate-700 text-red-600 focus:ring-red-500 bg-slate-950"
                  />
                  <div>
                    <span className="text-xs sm:text-sm font-bold text-white block">
                      {lang === 'pt-BR'
                        ? 'Quero usar meu próprio domínio (opcional)'
                        : 'Quiero usar mi propio dominio (opcional)'}
                    </span>
                    <span className="text-xs text-slate-400">
                      {lang === 'pt-BR'
                        ? 'Você começa já com o endereço grátis acima. Depois do cadastro, mostramos como conectar o seu domínio em 2 minutos.'
                        : 'Comienzas inmediatamente con la dirección gratis arriba. Luego del registro, te mostramos cómo conectar tu dominio en 2 minutos.'}
                    </span>
                  </div>
                </label>

                {formData.usaDominioProprio && (
                  <div className="mt-4 pl-7">
                    <label htmlFor="cad-campo-4" className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                      {lang === 'pt-BR' ? 'Seu Domínio' : 'Tu Dominio'}
                    </label>
                    <input
                  id="cad-campo-4"
                      type="text"
                      value={formData.dominioProprio}
                      onChange={e => {
                        setFormData(prev => ({ ...prev, dominioProprio: e.target.value }));
                        if (errors.dominioProprio) setErrors(prev => ({ ...prev, dominioProprio: '' }));
                      }}
                      placeholder="app.minhaacademia.com.br"
                      className="w-full bg-slate-950 border border-slate-800 focus:border-red-500 rounded-xl px-4 py-2.5 text-white font-mono text-xs placeholder-slate-600 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-red-500 transition-colors"
                    />
                    {errors.dominioProprio && (
                      <p className="text-red-400 text-xs mt-1.5 flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5" /> {errors.dominioProprio}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Botão Avançar Etapa 1 */}
              <div className="pt-4 flex justify-end">
                <button
                  type="button"
                  onClick={handleNextFromStep1}
                  className="w-full sm:w-auto px-8 py-3.5 bg-red-600 hover:bg-red-700 active:scale-95 text-white font-bold rounded-xl text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-red-600/30"
                >
                  <span>{lang === 'pt-BR' ? 'Continuar para dados do responsável' : 'Continuar a datos del responsable'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ====================================================================
              ETAPA 2: VOCÊ (DADOS DO RESPONSÁVEL)
              ==================================================================== */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
                  <User className="w-6 h-6 text-red-500" />
                  <span>{lang === 'pt-BR' ? 'Dados de acesso do responsável' : 'Datos de acceso del responsable'}</span>
                </h2>
                <p className="text-slate-400 text-xs sm:text-sm mt-1">
                  {lang === 'pt-BR'
                    ? 'Esses dados serão usados para login como administrador principal da academia.'
                    : 'Estos datos se utilizarán para ingresar como administrador principal del gimnasio.'}
                </p>
              </div>

              {/* Nome do responsável */}
              <div>
                <label htmlFor="cad-campo-5" className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                  {lang === 'pt-BR' ? 'Nome Completo *' : 'Nombre Completo *'}
                </label>
                <input
                  id="cad-campo-5"
                  type="text"
                  value={formData.nome}
                  onChange={e => {
                    setFormData(prev => ({ ...prev, nome: e.target.value }));
                    if (errors.nome) setErrors(prev => ({ ...prev, nome: '' }));
                  }}
                  placeholder={lang === 'pt-BR' ? 'Ex: Carlos Alberto Silva' : 'Ej: Carlos Alberto Silva'}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-red-500 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-red-500 transition-colors"
                />
                {errors.nome && (
                  <p className="text-red-400 text-xs mt-1.5 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" /> {errors.nome}
                  </p>
                )}
              </div>

              {/* E-mail e WhatsApp em Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* E-mail */}
                <div>
                  <label htmlFor="cad-campo-6" className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                    {lang === 'pt-BR' ? 'E-mail Comercial *' : 'Correo Electrónico *'}
                  </label>
                  <input
                  id="cad-campo-6"
                    type="email"
                    value={formData.email}
                    onChange={e => {
                      setFormData(prev => ({ ...prev, email: e.target.value }));
                      if (errors.email) setErrors(prev => ({ ...prev, email: '' }));
                    }}
                    placeholder="carlos@academia.com"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-red-500 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-red-500 transition-colors"
                  />
                  {errors.email && (
                    <p className="text-red-400 text-xs mt-1.5 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" /> {errors.email}
                    </p>
                  )}
                </div>

                {/* WhatsApp com DDI */}
                <div>
                  <label htmlFor="cad-campo-7" className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                    {lang === 'pt-BR' ? 'WhatsApp com DDI *' : 'WhatsApp con código *'}
                  </label>
                  <input
                  id="cad-campo-7"
                    type="tel"
                    value={formData.whatsapp}
                    onChange={e => {
                      setFormData(prev => ({ ...prev, whatsapp: e.target.value }));
                      if (errors.whatsapp) setErrors(prev => ({ ...prev, whatsapp: '' }));
                    }}
                    placeholder={formData.pais === 'BR' ? '+55 11 99999-9999' : '+595 981 123456'}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-red-500 rounded-xl px-4 py-3 text-white font-mono placeholder-slate-600 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-red-500 transition-colors"
                  />
                  {errors.whatsapp && (
                    <p className="text-red-400 text-xs mt-1.5 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" /> {errors.whatsapp}
                    </p>
                  )}
                </div>
              </div>

              {/* Senha e Confirmar Senha */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                {/* Senha */}
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label htmlFor="cad-campo-8" className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                      {lang === 'pt-BR' ? 'Senha (mín. 10 chars) *' : 'Contraseña (mín. 10 caracteres) *'}
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-slate-400 hover:text-white text-xs flex items-center gap-1"
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      <span>{showPassword ? (lang === 'pt-BR' ? 'Ocultar' : 'Ocultar') : (lang === 'pt-BR' ? 'Ver' : 'Ver')}</span>
                    </button>
                  </div>
                  
                  <input
                  id="cad-campo-8"
                    type={showPassword ? 'text' : 'password'}
                    value={senha}
                    onChange={e => {
                      setSenha(e.target.value);
                      if (errors.senha) setErrors(prev => ({ ...prev, senha: '' }));
                    }}
                    placeholder="••••••••••••"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-red-500 rounded-xl px-4 py-3 text-white font-mono text-sm placeholder-slate-600 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-red-500 transition-colors"
                  />

                  {/* Medidor de Força da Senha */}
                  {senha && (
                    <div className="mt-2 space-y-1">
                      <div className="flex gap-1 h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                        {[1, 2, 3, 4].map(idx => (
                          <div
                            key={idx}
                            className={`flex-1 transition-all duration-300 ${
                              idx <= passwordStrength.score ? passwordStrength.color : 'bg-slate-800'
                            }`}
                          />
                        ))}
                      </div>
                      <p className="text-[11px] text-slate-400">
                        {lang === 'pt-BR' ? 'Segurança:' : 'Seguridad:'}{' '}
                        <span className="font-semibold text-slate-200">
                          {lang === 'pt-BR' ? passwordStrength.labelPt : passwordStrength.labelEs}
                        </span>
                      </p>
                    </div>
                  )}

                  {errors.senha && (
                    <p className="text-red-400 text-xs mt-1.5 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" /> {errors.senha}
                    </p>
                  )}
                </div>

                {/* Confirmar Senha */}
                <div>
                  <label htmlFor="cad-campo-9" className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                    {lang === 'pt-BR' ? 'Confirmar Senha *' : 'Confirmar Contraseña *'}
                  </label>
                  <input
                  id="cad-campo-9"
                    type={showPassword ? 'text' : 'password'}
                    value={confirmarSenha}
                    onChange={e => {
                      setConfirmarSenha(e.target.value);
                      if (errors.confirmarSenha) setErrors(prev => ({ ...prev, confirmarSenha: '' }));
                    }}
                    placeholder="••••••••••••"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-red-500 rounded-xl px-4 py-3 text-white font-mono text-sm placeholder-slate-600 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-red-500 transition-colors"
                  />
                  {errors.confirmarSenha && (
                    <p className="text-red-400 text-xs mt-1.5 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" /> {errors.confirmarSenha}
                    </p>
                  )}
                </div>
              </div>

              {/* Termos de uso */}
              <div className="pt-2">
                <label className="flex items-start gap-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={formData.termosAceitos}
                    onChange={e => {
                      setFormData(prev => ({ ...prev, termosAceitos: e.target.checked }));
                      if (errors.termos) setErrors(prev => ({ ...prev, termos: '' }));
                    }}
                    className="mt-1 w-4 h-4 rounded border-slate-700 text-red-600 focus:ring-red-500 bg-slate-950"
                  />
                  <span className="text-xs text-slate-300 leading-relaxed">
                    {lang === 'pt-BR'
                      ? 'Li e concordo com os Termos de Uso e a Política de Privacidade do serviço de aplicativo para academias.'
                      : 'He leído y acepto los Términos de Uso y la Política de Privacidad del servicio para gimnasios.'}
                  </span>
                </label>
                {errors.termos && (
                  <p className="text-red-400 text-xs mt-1.5 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" /> {errors.termos}
                  </p>
                )}
              </div>

              {/* Botões Voltar / Avançar */}
              <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="w-full sm:w-auto px-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl text-sm transition-all flex items-center justify-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>{lang === 'pt-BR' ? 'Voltar' : 'Atrás'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleNextFromStep2}
                  className="w-full sm:w-auto px-8 py-3.5 bg-red-600 hover:bg-red-700 active:scale-95 text-white font-bold rounded-xl text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-red-600/30"
                >
                  <span>{lang === 'pt-BR' ? 'Revisar plano e pagamento' : 'Revisar plan y pago'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ====================================================================
              ETAPA 3: PAGAMENTO (RESUMO DO PLANO E SUBMISSÃO)
              ==================================================================== */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
                  <CreditCard className="w-6 h-6 text-red-500" />
                  <span>{lang === 'pt-BR' ? 'Resumo da Assinatura' : 'Resumen de la Suscripción'}</span>
                </h2>
                <p className="text-slate-400 text-xs sm:text-sm mt-1">
                  {lang === 'pt-BR'
                    ? 'Confirme os dados antes de seguir para a finalização segura.'
                    : 'Confirma los datos antes de pasar al pago seguro.'}
                </p>
              </div>

              {/* Card Resumo do Plano */}
              <div className="bg-slate-950 border-2 border-red-600/80 rounded-2xl p-6 shadow-xl relative overflow-hidden">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
                  <div>
                    <span className="text-[10px] bg-red-600 text-white font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full">
                      {lang === 'pt-BR' ? 'Plano Assinatura Mensal' : 'Plan Suscripción Mensual'}
                    </span>
                    <h3 className="text-lg font-bold text-white mt-1">
                      {formData.academia || 'Sua Academia'}
                    </h3>
                    <p className="text-xs text-slate-400">
                      {formData.cidade} · {formData.pais === 'BR' ? 'Brasil' : 'Paraguay'}
                    </p>
                  </div>

                  <div className="text-left sm:text-right">
                    <p className="text-3xl font-black text-white tracking-tight">
                      {precoAtual}
                    </p>
                    <p className="text-xs text-slate-400">
                      {lang === 'pt-BR' ? 'por mês · sem fidelidade' : 'por mes · sin permanencia'}
                    </p>
                  </div>
                </div>

                {/* Dados da instalação */}
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-300">
                  <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                    <span className="text-slate-500 block text-[10px] uppercase font-bold">
                      {lang === 'pt-BR' ? 'Endereço Oficial' : 'Dirección Oficial'}
                    </span>
                    <span className="font-mono text-red-400 font-semibold break-all">
                      {formData.subdominio}.{BASE_DOMAIN}
                    </span>
                  </div>

                  {formData.usaDominioProprio && formData.dominioProprio && (
                    <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                      <span className="text-slate-500 block text-[10px] uppercase font-bold">
                        {lang === 'pt-BR' ? 'Domínio Próprio Adicional' : 'Dominio Propio Adicional'}
                      </span>
                      <span className="font-mono text-emerald-400 font-semibold break-all">
                        {formData.dominioProprio}
                      </span>
                    </div>
                  )}

                  <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                    <span className="text-slate-500 block text-[10px] uppercase font-bold">
                      {lang === 'pt-BR' ? 'Administrador' : 'Administrador'}
                    </span>
                    <span className="text-white font-medium">{formData.nome}</span>
                  </div>

                  <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                    <span className="text-slate-500 block text-[10px] uppercase font-bold">
                      {lang === 'pt-BR' ? 'E-mail e WhatsApp' : 'Correo y WhatsApp'}
                    </span>
                    <span className="text-white font-medium">{formData.email}</span>
                  </div>
                </div>

                {/* Vantagens inclusas */}
                <div className="mt-4 pt-4 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-300">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{lang === 'pt-BR' ? 'App completo com sua marca' : 'App completa con tu marca'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{lang === 'pt-BR' ? 'Backup diário e segurança' : 'Copia de seguridad diaria y soporte'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{lang === 'pt-BR' ? 'Atualizações contínuas inclusas' : 'Actualizaciones continuas incluidas'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{lang === 'pt-BR' ? 'Suporte por WhatsApp' : 'Soporte prioritario por WhatsApp'}</span>
                  </div>
                </div>
              </div>

              {/* Botões Voltar / Ir para o Pagamento */}
              <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  disabled={isSubmitting}
                  className="w-full sm:w-auto px-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>{lang === 'pt-BR' ? 'Editar dados' : 'Editar datos'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleFinalSubmit}
                  disabled={isSubmitting}
                  className="w-full sm:w-auto px-10 py-4 bg-red-600 hover:bg-red-700 active:scale-95 text-white font-black rounded-xl text-base transition-all flex items-center justify-center gap-2 shadow-xl shadow-red-600/40 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>{lang === 'pt-BR' ? 'Processando cadastro...' : 'Procesando registro...'}</span>
                    </>
                  ) : (
                    <>
                      <span>{lang === 'pt-BR' ? 'Ir para o pagamento' : 'Ir al pago seguro'}</span>
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
