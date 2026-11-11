import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  Clock,
  Sparkles,
  ExternalLink,
  MessageCircle,
  AlertCircle,
  Palette,
  Users,
  Calendar,
  QrCode,
  ArrowRight,
  Globe,
  Dumbbell,
  Loader2,
  RefreshCw,
  Copy,
  Check
} from 'lucide-react';
import {
  PRODUCT_NAME,
  WHATSAPP_NUMBER,
  BASE_DOMAIN,
  Language
} from '../constants';
import { StatusType, StatusResponse } from '../types';
import { fetchCadastroStatus } from '../api/apiClient';

interface BemVindoPageProps {
  cadastroId: string;
  lang: Language;
  onLanguageChange: (newLang: Language) => void;
  onNavigate: (path: string) => void;
  isTestMode?: boolean;
}

export default function BemVindoPage({
  cadastroId,
  lang,
  onLanguageChange,
  onNavigate,
  isTestMode = false,
}: BemVindoPageProps) {
  const [status, setStatus] = useState<StatusType>('pago');
  const [appUrl, setAppUrl] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [dominioProprio, setDominioProprio] = useState<string | null>(null);
  const [pollCount, setPollCount] = useState<number>(0);
  const [copied, setCopied] = useState<boolean>(false);

  // Consulta GET /api/cadastro/status?id=ID a cada 3 segundos
  useEffect(() => {
    let timer: NodeJS.Timeout;

    const checkStatus = async () => {
      const res: StatusResponse = await fetchCadastroStatus(cadastroId, isTestMode, pollCount);

      if (res.status) {
        setStatus(res.status);
      }
      if (res.appUrl) {
        setAppUrl(res.appUrl);
      }
      if (res.dominioProprio) {
        setDominioProprio(res.dominioProprio);
      }
      if (res.mensagem) {
        setErrorMessage(res.mensagem);
      }

      setPollCount(prev => prev + 1);
    };

    // Primeira checagem imediata
    checkStatus();

    // Se ainda não estiver pronto nem em erro, faz polling a cada 3s
    if (status !== 'pronto' && status !== 'erro') {
      timer = setInterval(checkStatus, 3000);
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [cadastroId, isTestMode, status, pollCount]);

  const whatsappSupportUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
    lang === 'pt-BR'
      ? `Olá! Estou na tela de boas-vindas com o código ${cadastroId} e preciso de ajuda.`
      : `¡Hola! Estoy en la pantalla de bienvenida con el código ${cadastroId} y necesito ayuda.`
  )}`;

  const handleCopyLink = () => {
    if (!appUrl) return;
    navigator.clipboard.writeText(appUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Definição dos passos da linha do tempo
  const stepsTimeline = [
    {
      id: 'pago',
      titlePt: 'Pagamento confirmado',
      titleEs: 'Pago confirmado',
      descPt: 'Transação aprovada com sucesso.',
      descEs: 'Transacción aprobada con éxito.',
      isDone: status === 'pago' || status === 'criando' || status === 'pronto',
      isActive: status === 'pago',
    },
    {
      id: 'criando',
      titlePt: 'Criando o app da sua academia',
      titleEs: 'Creando la app de tu gimnasio',
      descPt: 'Gerando banco de dados isolado, subdomínio e ambiente.',
      descEs: 'Generando base de datos aislada, subdominio y entorno.',
      isDone: status === 'criando' || status === 'pronto',
      isActive: status === 'criando',
    },
    {
      id: 'pronto',
      titlePt: 'Pronto para uso!',
      titleEs: '¡Listo para usar!',
      descPt: 'Tudo configurado para você e seus alunos.',
      descEs: 'Todo listo para ti y tus alumnos.',
      isDone: status === 'pronto',
      isActive: status === 'pronto',
    },
  ];

  return (
    <div className="min-h-screen bg-[#0B1120] text-slate-100 font-sans selection:bg-red-600 selection:text-white pb-24">
      {/* Topo fixo */}
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

        {/* Header da Tela */}
        <div className="text-center mb-10">
          <span className="text-xs font-mono bg-slate-900 border border-slate-800 text-red-400 px-3 py-1 rounded-full inline-block mb-3">
            ID: {cadastroId || 'CAD-DEMO'}
          </span>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            {status === 'pronto'
              ? (lang === 'pt-BR' ? 'Parabéns! O seu app está no ar 🎉' : '¡Felicitaciones! Tu app ya está lista 🎉')
              : (lang === 'pt-BR' ? 'Preparando o ambiente da sua academia' : 'Preparando el entorno de tu gimnasio')}
          </h1>
          <p className="mt-2 text-slate-300 text-sm max-w-lg mx-auto">
            {status === 'pronto'
              ? (lang === 'pt-BR'
                  ? 'A sua plataforma white-label exclusiva foi gerada com sucesso e já está disponível para acesso.'
                  : 'Tu plataforma white-label exclusiva ha sido creada con éxito y ya está disponible.')
              : (lang === 'pt-BR'
                  ? 'Estamos provisionando a estrutura em nuvem do seu aplicativo. Isso leva poucos segundos.'
                  : 'Estamos aprovisionando la estructura en la nube de tu app. Toma solo unos segundos.')}
          </p>
        </div>

        {/* Linha do Tempo Animada */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 mb-8 shadow-2xl">
          <div className="relative">
            {/* Linha vertical conectora */}
            <div className="absolute left-6 top-8 bottom-8 w-0.5 bg-slate-800 -z-0" />

            <div className="space-y-6 relative z-10">
              {stepsTimeline.map((item, idx) => {
                const isStepFinished = item.isDone && status !== item.id;
                const isStepCurrent = status === item.id;

                return (
                  <div key={idx} className="flex items-start gap-4">
                    {/* Ícone de status */}
                    <div
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border transition-all duration-300 ${
                        isStepFinished || (item.id === 'pronto' && status === 'pronto')
                          ? 'bg-emerald-600/20 border-emerald-500/80 text-emerald-400 shadow-md shadow-emerald-950'
                          : isStepCurrent
                          ? 'bg-red-600 border-red-500 text-white shadow-lg shadow-red-600/30'
                          : 'bg-slate-950 border-slate-800 text-slate-600'
                      }`}
                    >
                      {isStepFinished || (item.id === 'pronto' && status === 'pronto') ? (
                        <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                      ) : isStepCurrent ? (
                        <Loader2 className="w-6 h-6 animate-spin text-white" />
                      ) : (
                        <Clock className="w-5 h-5 text-slate-600" />
                      )}
                    </div>

                    {/* Textos */}
                    <div className="pt-1.5 flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className={`text-base font-bold ${isStepFinished || isStepCurrent ? 'text-white' : 'text-slate-500'}`}>
                          {lang === 'pt-BR' ? item.titlePt : item.titleEs}
                        </h3>
                        {isStepCurrent && status !== 'pronto' && (
                          <span className="text-[10px] bg-red-600/30 text-red-400 border border-red-500/30 px-2 py-0.5 rounded font-mono">
                            {lang === 'pt-BR' ? 'Em andamento...' : 'En progreso...'}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {lang === 'pt-BR' ? item.descPt : item.descEs}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ====================================================================
            STATUS: PRONTO (BOTÃO PRINCIPAL + O QUE FAZER PRIMEIRO)
            ==================================================================== */}
        {status === 'pronto' && (
          <div className="space-y-6 animate-fadeIn">
            
            {/* Box com URL do App e Botão Grande de Acesso */}
            <div className="bg-gradient-to-b from-red-950/40 to-slate-900 border-2 border-red-600/80 rounded-3xl p-6 sm:p-8 text-center shadow-2xl">
              <span className="text-xs font-bold uppercase tracking-wider text-red-400 block mb-2">
                {lang === 'pt-BR' ? 'Endereço Oficial do Seu App' : 'Dirección Oficial de tu App'}
              </span>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-2 max-w-lg mx-auto bg-slate-950/80 border border-slate-800 p-2 rounded-xl mb-6">
                <span className="font-mono text-sm sm:text-base font-bold text-white px-2 break-all">
                  {appUrl || `https://academia.${BASE_DOMAIN}`}
                </span>
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors shrink-0"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? (lang === 'pt-BR' ? 'Copiado!' : '¡Copiado!') : (lang === 'pt-BR' ? 'Copiar' : 'Copiar')}</span>
                </button>
              </div>

              {/* Botão Grande de Acesso */}
              <a
                href={appUrl || `https://academia.${BASE_DOMAIN}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex w-full sm:w-auto items-center justify-center gap-3 px-10 py-4 bg-red-600 hover:bg-red-700 active:scale-95 text-white font-black text-lg rounded-2xl shadow-xl shadow-red-600/40 transition-all focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:outline-none"
              >
                <span>{lang === 'pt-BR' ? 'Entrar no app e configurar' : 'Entrar a la app y configurar'}</span>
                <ExternalLink className="w-5 h-5" />
              </a>
            </div>

            {/* Banner Domínio Próprio (se configurado ou opção) */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-800 text-red-500 flex items-center justify-center shrink-0">
                  <Globe className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">
                    {lang === 'pt-BR' ? 'Conectar seu domínio próprio' : 'Conectar tu dominio propio'}
                  </h4>
                  <p className="text-xs text-slate-400">
                    {dominioProprio
                      ? `${dominioProprio} (${lang === 'pt-BR' ? 'pronto para apontar CNAME' : 'listo para configurar CNAME'})`
                      : (lang === 'pt-BR' ? 'Use o endereço app.suaacademia.com.br em 2 minutos' : 'Usa la dirección app.tudominio.com en 2 minutos')}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => onNavigate(`/dominio?cadastro=${cadastroId}${isTestMode ? '&teste=1' : ''}`)}
                className="w-full sm:w-auto px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs rounded-xl border border-slate-700 transition-colors flex items-center justify-center gap-1.5 shrink-0"
              >
                <span>{lang === 'pt-BR' ? 'Configurar Domínio' : 'Configurar Dominio'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* O Que Fazer Primeiro */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8">
              <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-red-500" />
                <span>{lang === 'pt-BR' ? 'O que fazer primeiro na sua academia:' : 'Qué hacer primero en tu gimnasio:'}</span>
              </h3>
              <p className="text-xs text-slate-400 mb-6">
                {lang === 'pt-BR'
                  ? 'Siga estes 4 passos simples para começar a receber alunos ainda hoje:'
                  : 'Sigue estos 4 sencillos pasos para comenzar a recibir alumnos hoy mismo:'}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Passo 1 */}
                <div className="bg-slate-950/70 border border-slate-800/90 rounded-2xl p-4 flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-red-600/20 text-red-400 flex items-center justify-center shrink-0 mt-0.5">
                    <Palette className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">
                      1. {lang === 'pt-BR' ? 'Colocar sua logo e cores' : 'Configurar tu logo y colores'}
                    </h4>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                      {lang === 'pt-BR'
                        ? 'Envie a logomarca e defina as cores oficiais para o aplicativo refletir sua identidade.'
                        : 'Sube tu logo y define los colores oficiales para reflejar tu marca.'}
                    </p>
                  </div>
                </div>

                {/* Passo 2 */}
                <div className="bg-slate-950/70 border border-slate-800/90 rounded-2xl p-4 flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-red-600/20 text-red-400 flex items-center justify-center shrink-0 mt-0.5">
                    <Users className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">
                      2. {lang === 'pt-BR' ? 'Cadastrar professores' : 'Registrar profesores'}
                    </h4>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                      {lang === 'pt-BR'
                        ? 'Dê acesso aos seus instrutores para eles montarem fichas e acompanharem alunos.'
                        : 'Otorga acceso a tus instructores para crear rutinas y seguir alumnos.'}
                    </p>
                  </div>
                </div>

                {/* Passo 3 */}
                <div className="bg-slate-950/70 border border-slate-800/90 rounded-2xl p-4 flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-red-600/20 text-red-400 flex items-center justify-center shrink-0 mt-0.5">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">
                      3. {lang === 'pt-BR' ? 'Montar a grade de aulas' : 'Crear la grilla de clases'}
                    </h4>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                      {lang === 'pt-BR'
                        ? 'Cadastre os horários de spinning, funcional, pilates ou lutas para reserva online.'
                        : 'Carga los horarios de spinning, funcional o pilates para reserva online.'}
                    </p>
                  </div>
                </div>

                {/* Passo 4 */}
                <div className="bg-slate-950/70 border border-slate-800/90 rounded-2xl p-4 flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-red-600/20 text-red-400 flex items-center justify-center shrink-0 mt-0.5">
                    <QrCode className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">
                      4. {lang === 'pt-BR' ? 'Imprimir o cartaz com QR' : 'Imprimir el cartel con QR'}
                    </h4>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                      {lang === 'pt-BR'
                        ? 'Cole na recepção: o aluno aponta a câmera e instala o app direto sem lojas.'
                        : 'Colócalo en recepción: los alumnos apuntan su cámara e instalan directo.'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ====================================================================
            STATUS: ERRO
            ==================================================================== */}
        {status === 'erro' && (
          <div className="bg-rose-950/60 border border-rose-700 rounded-3xl p-6 sm:p-8 text-center space-y-4">
            <AlertCircle className="w-12 h-12 text-rose-400 mx-auto" />
            <h3 className="text-xl font-bold text-white">
              {lang === 'pt-BR' ? 'Houve uma instabilidade na ativação' : 'Ocurrió un problema en la activación'}
            </h3>
            <p className="text-xs sm:text-sm text-rose-200 max-w-md mx-auto">
              {errorMessage || (lang === 'pt-BR'
                ? 'Não se preocupe: nosso suporte técnico já foi notificado e pode ativar seu ambiente manualmente em instantes.'
                : 'No te preocupes: nuestro soporte técnico te ayudará a activar tu cuenta al instante.')}
            </p>

            <div className="pt-2">
              <a
                href={whatsappSupportUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm transition-all shadow-lg shadow-emerald-950"
              >
                <MessageCircle className="w-4 h-4" />
                <span>{lang === 'pt-BR' ? 'Falar com o suporte no WhatsApp' : 'Hablar con soporte en WhatsApp'}</span>
              </a>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
