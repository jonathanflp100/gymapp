import React, { useState } from 'react';
import {
  Globe,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  ExternalLink,
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  Loader2,
  Server,
  Dumbbell
} from 'lucide-react';
import {
  PRODUCT_NAME,
  CNAME_TARGET,
  BASE_DOMAIN,
  Language
} from '../constants';
import { verifyDomainConnection } from '../api/apiClient';

interface DominioPageProps {
  cadastroId: string;
  lang: Language;
  onLanguageChange: (newLang: Language) => void;
  onNavigate: (path: string) => void;
  isTestMode?: boolean;
}

export default function DominioPage({
  cadastroId,
  lang,
  onLanguageChange,
  onNavigate,
  isTestMode = false,
}: DominioPageProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyAttempt, setVerifyAttempt] = useState(0);
  const [verificationResult, setVerificationResult] = useState<{
    tested: boolean;
    conectado: boolean;
    mensagem: string;
  }>({
    tested: false,
    conectado: false,
    mensagem: '',
  });

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleVerify = async () => {
    setIsVerifying(true);
    const res = await verifyDomainConnection(cadastroId, verifyAttempt, isTestMode);
    setVerifyAttempt(prev => prev + 1);
    setIsVerifying(false);
    setVerificationResult({
      tested: true,
      conectado: res.conectado,
      mensagem: res.mensagem,
    });
  };

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
        
        {/* Botão Voltar */}
        <button
          type="button"
          onClick={() => onNavigate(`/bem-vindo?cadastro=${cadastroId}${isTestMode ? '&teste=1' : ''}`)}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{lang === 'pt-BR' ? 'Voltar para tela de boas-vindas' : 'Volver a la pantalla de bienvenida'}</span>
        </button>

        {/* Título da Tela */}
        <div className="mb-10">
          <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-red-500 mb-2">
            <Globe className="w-4 h-4" />
            <span>{lang === 'pt-BR' ? 'Personalização de Endereço' : 'Personalización de Dirección'}</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            {lang === 'pt-BR'
              ? 'Como conectar seu próprio domínio'
              : 'Cómo conectar tu propio dominio'}
          </h1>
          <p className="mt-2 text-slate-300 text-sm max-w-xl">
            {lang === 'pt-BR'
              ? 'Tenha um endereço totalmente seu (ex: app.suaacademia.com.br) com certificado de segurança SSL grátis emitido automaticamente.'
              : 'Ten una dirección 100% tuya (ej: app.tudominio.com) con certificado de seguridad SSL gratis emitido automáticamente.'}
          </p>
        </div>

        {/* 3 Passos Clavados */}
        <div className="space-y-6">

          {/* PASSO 1: Compre o domínio */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8">
            <div className="flex items-start gap-4">
              <span className="w-8 h-8 rounded-xl bg-red-600/20 text-red-500 font-mono font-bold text-sm flex items-center justify-center shrink-0">
                1
              </span>
              <div className="flex-1">
                <h3 className="text-base font-bold text-white">
                  {lang === 'pt-BR' ? 'Compre o domínio (se ainda não tiver)' : 'Registra el dominio (si aún no tienes uno)'}
                </h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  {lang === 'pt-BR'
                    ? 'Se você ainda não comprou o nome da sua academia na internet, use os registradores oficiais:'
                    : 'Si aún no registraste el nombre de tu gimnasio en internet, usa los registradores oficiales:'}
                </p>

                <div className="mt-4 flex flex-wrap gap-3">
                  <a
                    href="https://registro.br"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl text-xs font-semibold text-slate-200 transition-colors"
                  >
                    <span>🇧🇷 Registro.br (Brasil - .com.br)</span>
                    <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                  </a>

                  <a
                    href="https://www.nic.py"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl text-xs font-semibold text-slate-200 transition-colors"
                  >
                    <span>🇵🇾 NIC.py (Paraguay - .com.py)</span>
                    <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* PASSO 2: Crie um registro CNAME */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8">
            <div className="flex items-start gap-4">
              <span className="w-8 h-8 rounded-xl bg-red-600/20 text-red-500 font-mono font-bold text-sm flex items-center justify-center shrink-0">
                2
              </span>
              <div className="flex-1">
                <h3 className="text-base font-bold text-white">
                  {lang === 'pt-BR' ? 'Crie o apontamento CNAME no painel do domínio' : 'Crea el registro CNAME en el panel de tu dominio'}
                </h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  {lang === 'pt-BR'
                    ? 'Acesse a zona DNS onde seu domínio está hospedado e adicione a seguinte regra:'
                    : 'Ingresa a la zona DNS donde gestionas tu dominio y añade la siguiente regla:'}
                </p>

                {/* Tabela de configuração CNAME */}
                <div className="mt-4 bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden divide-y divide-slate-800/80 text-xs">
                  
                  {/* Tipo */}
                  <div className="p-3.5 flex items-center justify-between">
                    <span className="text-slate-400 font-medium">
                      {lang === 'pt-BR' ? 'Tipo de Registro' : 'Tipo de Registro'}
                    </span>
                    <span className="font-mono font-bold text-white bg-slate-900 px-2.5 py-1 rounded-md">
                      CNAME
                    </span>
                  </div>

                  {/* Nome / Host */}
                  <div className="p-3.5 flex items-center justify-between gap-2">
                    <div>
                      <span className="text-slate-400 font-medium block">
                        {lang === 'pt-BR' ? 'Nome / Entrada (Host)' : 'Nombre / Host'}
                      </span>
                      <span className="text-[11px] text-slate-500">
                        {lang === 'pt-BR' ? 'Cria o prefixo app.suaacademia.com' : 'Crea el prefijo app.tudominio.com'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-red-400 bg-slate-900 px-2.5 py-1 rounded-md">
                        app
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopy('app', 'host')}
                        className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded-md text-slate-300 transition-colors"
                        title="Copiar 'app'"
                      >
                        {copiedField === 'host' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  {/* Valor / Destino */}
                  <div className="p-3.5 flex items-center justify-between gap-2">
                    <div>
                      <span className="text-slate-400 font-medium block">
                        {lang === 'pt-BR' ? 'Destino / Apontamento' : 'Destino / Apuntador'}
                      </span>
                      <span className="text-[11px] text-slate-500">
                        {lang === 'pt-BR' ? 'Servidor central do aplicativo' : 'Servidor central de la aplicación'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-white bg-slate-900 px-2.5 py-1 rounded-md break-all">
                        {CNAME_TARGET}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopy(CNAME_TARGET, 'target')}
                        className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded-md text-slate-300 transition-colors"
                        title={`Copiar '${CNAME_TARGET}'`}
                      >
                        {copiedField === 'target' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                </div>
              </div>
            </div>
          </div>

          {/* PASSO 3: Verificar Conexão */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8">
            <div className="flex items-start gap-4">
              <span className="w-8 h-8 rounded-xl bg-red-600/20 text-red-500 font-mono font-bold text-sm flex items-center justify-center shrink-0">
                3
              </span>
              <div className="flex-1">
                <h3 className="text-base font-bold text-white">
                  {lang === 'pt-BR' ? 'Verifique a conexão' : 'Verifica la conexión'}
                </h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  {lang === 'pt-BR'
                    ? 'Depois de salvar no seu provedor de domínio, clique no botão abaixo para testar o apontamento.'
                    : 'Luego de guardar en tu registrador de dominio, haz clic abajo para probar la configuración.'}
                </p>

                {/* Botão de Verificação */}
                <div className="mt-5">
                  <button
                    type="button"
                    onClick={handleVerify}
                    disabled={isVerifying}
                    className="w-full sm:w-auto px-8 py-3.5 bg-red-600 hover:bg-red-700 active:scale-95 text-white font-bold rounded-xl text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-red-600/30 disabled:opacity-50"
                  >
                    {isVerifying ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>{lang === 'pt-BR' ? 'Consultando servidores DNS...' : 'Consultando servidores DNS...'}</span>
                      </>
                    ) : (
                      <>
                        <Globe className="w-4 h-4" />
                        <span>{lang === 'pt-BR' ? 'Verificar Apontamento' : 'Verificar Conexión'}</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Resultado da Verificação */}
                {verificationResult.tested && (
                  <div className="mt-5">
                    {verificationResult.conectado ? (
                      /* Sucesso: Conectado */
                      <div className="p-4 bg-emerald-950/60 border border-emerald-700 rounded-2xl flex items-start gap-3 text-emerald-200 text-xs sm:text-sm">
                        <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-bold text-white">
                            ✓ {lang === 'pt-BR' ? 'Domínio conectado com sucesso!' : '¡Dominio conectado con éxito!'}
                          </p>
                          <p className="text-emerald-300 mt-1 text-xs">
                            {verificationResult.mensagem || (lang === 'pt-BR'
                              ? 'O certificado SSL de segurança já está ativo e seus alunos podem acessar por este endereço.'
                              : 'El certificado de seguridad SSL ya está activo y tus alumnos pueden ingresar por esta dirección.')}
                          </p>
                        </div>
                      </div>
                    ) : (
                      /* Pendente: Propagando */
                      <div className="p-4 bg-amber-950/50 border border-amber-700/80 rounded-2xl flex items-start gap-3 text-amber-200 text-xs sm:text-sm">
                        <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-bold text-white">
                            {lang === 'pt-BR' ? 'Apontamento ainda não localizado' : 'Configuración aún no detectada'}
                          </p>
                          <p className="text-amber-300 mt-1 text-xs">
                            {lang === 'pt-BR'
                              ? 'Pode levar até algumas horas para o domínio propagar na internet mundial. Enquanto isso, seu app continua funcionando normalmente pelo subdomínio grátis!'
                              : 'Puede tardar hasta algunas horas en propagarse el dominio en internet. Mientras tanto, tu app sigue funcionando por el subdominio gratuito.'}
                          </p>
                          <button
                            type="button"
                            onClick={handleVerify}
                            className="mt-2 text-xs font-semibold underline hover:text-white"
                          >
                            {lang === 'pt-BR' ? 'Testar novamente agora' : 'Probar nuevamente ahora'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

              </div>
            </div>
          </div>

        </div>

      </main>
    </div>
  );
}
