import React, { useState } from 'react';
import {
  Dumbbell,
  Sparkles,
  Timer,
  Layers,
  PlaySquare,
  UserCheck,
  LineChart,
  Camera,
  CalendarCheck,
  Trophy,
  WifiOff,
  ClipboardList,
  Users,
  MessageCircle,
  Activity,
  Calendar,
  FileText,
  Palette,
  QrCode,
  Megaphone,
  Bell,
  BarChart3,
  Wrench,
  Globe,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  XCircle,
  ExternalLink,
  ShieldCheck,
  ArrowRight,
  Server,
  Zap,
  Menu,
  X
} from 'lucide-react';
import {
  PRODUCT_NAME,
  PRECO_ASSINATURA_BR,
  PRECO_ASSINATURA_PY,
  PRECO_LICENCA_BR,
  PRECO_LICENCA_PY,
  CUSTO_SERVIDOR_PY,
  WHATSAPP_NUMBER,
  DEMO_URL,
  SUPPORT_EMAIL,
  Language
} from '../constants';

/* ==========================================================================
   COMPONENTE AUXILIAR: MOCKUP DE CELULAR REALISTA
   ========================================================================== */

interface PhoneMockupProps {
  src: string;
  alt: string;
  type: 'home' | 'treino' | 'evolucao' | 'checkin' | 'relatorio' | 'config';
  label: string;
  className?: string;
  isCenter?: boolean;
}

const PhoneMockup: React.FC<PhoneMockupProps> = ({ src, alt, type, label, className = "", isCenter = false }) => {
  const [hasError, setHasError] = useState(false);

  const renderFallbackUI = () => {
    switch (type) {
      case 'treino':
        return (
          <div className="flex flex-col h-full bg-[#0F172A] text-slate-100 p-4 font-sans select-none">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <p className="text-[10px] uppercase font-bold tracking-wider text-red-500">Treino B · Costas e Bíceps</p>
                <p className="text-xs font-semibold text-white">4 de 6 exercícios concluídos</p>
              </div>
              <div className="flex items-center gap-1 bg-red-950/70 text-red-400 border border-red-800/40 px-2 py-0.5 rounded text-[10px] font-mono">
                <Timer className="w-3 h-3 animate-spin text-red-500" /> 00:45
              </div>
            </div>

            <div className="mt-3 bg-slate-900 border border-slate-800 rounded-xl p-3 shadow-md">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[9px] bg-red-600/20 text-red-400 px-1.5 py-0.5 rounded font-medium">Série Atual: 3ª</span>
                  <h4 className="text-xs font-bold text-white mt-1">Puxada Alta Frontal</h4>
                  <p className="text-[10px] text-slate-400">Última carga: 65 kg (8 reps)</p>
                </div>
                <div className="bg-red-600 text-white rounded-lg p-1.5">
                  <Dumbbell className="w-3.5 h-3.5" />
                </div>
              </div>

              <div className="mt-3 space-y-1.5 text-[10px]">
                <div className="flex justify-between items-center bg-slate-950/80 px-2.5 py-1.5 rounded text-slate-300">
                  <span>Série 1 · 12 reps</span>
                  <span className="font-mono font-semibold text-slate-200">60 kg</span>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                </div>
                <div className="flex justify-between items-center bg-slate-950/80 px-2.5 py-1.5 rounded text-slate-300">
                  <span>Série 2 · 10 reps</span>
                  <span className="font-mono font-semibold text-slate-200">65 kg</span>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                </div>
                <div className="flex justify-between items-center bg-red-950/40 border border-red-600/40 px-2.5 py-1.5 rounded text-white">
                  <span className="font-semibold text-red-400">Série 3 (Sugestão: +2.5kg)</span>
                  <span className="font-mono font-bold text-red-400">67.5 kg</span>
                  <span className="text-[9px] bg-red-600 text-white px-1 rounded">Fazer</span>
                </div>
              </div>

              <div className="mt-3 flex gap-2">
                <button type="button" className="flex-1 bg-red-600 hover:bg-red-700 text-white py-1.5 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Concluir Série
                </button>
                <button type="button" className="px-2 bg-slate-800 text-slate-300 rounded-lg text-[10px]">
                  + Carga
                </button>
              </div>
            </div>

            <div className="mt-2.5 bg-slate-900/60 border border-slate-800/80 rounded-xl p-2.5 flex items-center justify-between text-[11px]">
              <div>
                <p className="text-slate-400 text-[9px]">A seguir:</p>
                <p className="font-medium text-slate-200">Remada Baixa Triângulo</p>
              </div>
              <span className="text-red-400 font-semibold text-[10px]">4 × 10</span>
            </div>
          </div>
        );

      case 'evolucao':
        return (
          <div className="flex flex-col h-full bg-[#0F172A] text-slate-100 p-4 font-sans select-none">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <p className="text-[10px] uppercase font-bold tracking-wider text-red-500">Progresso & Cargas</p>
                <p className="text-xs font-semibold text-white">Supino Reto Barra</p>
              </div>
              <div className="bg-emerald-950/80 text-emerald-400 border border-emerald-800/40 px-2 py-0.5 rounded text-[10px] font-bold">
                +17.5% neste mês
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 mt-3">
              <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800 text-center">
                <span className="text-[9px] text-slate-400 block">Carga Inicial</span>
                <span className="text-sm font-bold font-mono text-slate-200">50 kg</span>
              </div>
              <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800 text-center">
                <span className="text-[9px] text-slate-400 block">Recorde Atual</span>
                <span className="text-sm font-bold font-mono text-red-400">82.5 kg</span>
              </div>
            </div>

            <div className="mt-3 bg-slate-900 border border-slate-800 rounded-xl p-3 flex-1 flex flex-col justify-between">
              <div className="flex justify-between items-center text-[10px] text-slate-400">
                <span>Evolução de Carga (kg)</span>
                <span className="text-red-400 font-medium">8 semanas</span>
              </div>
              
              <div className="h-28 flex items-end justify-between gap-1.5 pt-4 px-1">
                {[
                  { w: '50kg', h: '38%', label: 'Sem 1' },
                  { w: '55kg', h: '45%', label: 'Sem 2' },
                  { w: '60kg', h: '55%', label: 'Sem 3' },
                  { w: '65kg', h: '62%', label: 'Sem 4' },
                  { w: '70kg', h: '72%', label: 'Sem 5' },
                  { w: '75kg', h: '82%', label: 'Sem 6' },
                  { w: '82.5kg', h: '98%', label: 'Sem 8' },
                ].map((bar, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <div
                      className={`w-full rounded-t ${i === 6 ? 'bg-red-600' : 'bg-slate-700 hover:bg-slate-600'}`}
                      style={{ height: bar.h }}
                    />
                    <span className="text-[8px] text-slate-400 font-mono">{bar.label}</span>
                  </div>
                ))}
              </div>

              <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px]">
                <span className="text-slate-400">Frequência:</span>
                <span className="text-white font-medium">92% de assiduidade</span>
              </div>
            </div>

            <div className="mt-2.5 bg-slate-900 border border-slate-800 rounded-xl p-2 flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-red-600/20 text-red-400 flex items-center justify-center shrink-0">
                <Camera className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-bold text-white truncate">Fotos de Comparativo</p>
                <p className="text-[9px] text-slate-400">Registro seguro de bioimpedância</p>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
            </div>
          </div>
        );

      case 'checkin':
        return (
          <div className="flex flex-col h-full bg-[#0F172A] text-slate-100 p-4 font-sans select-none justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div>
                  <p className="text-[10px] uppercase font-bold tracking-wider text-red-500">Recepção & Catraca</p>
                  <p className="text-xs font-semibold text-white">Check-in Instantâneo</p>
                </div>
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              </div>

              <div className="mt-5 relative w-48 h-48 mx-auto bg-slate-950 rounded-2xl border-2 border-red-500/80 p-4 flex flex-col items-center justify-center shadow-lg">
                <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-red-500" />
                <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-red-500" />
                <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-red-500" />
                <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-red-500" />
                
                <QrCode className="w-24 h-24 text-red-500 animate-pulse" />
                <span className="text-[10px] text-slate-300 font-medium mt-3">Aproxime da câmera</span>
              </div>

              <div className="mt-4 bg-emerald-950/60 border border-emerald-800/60 rounded-xl p-3 text-center">
                <div className="flex items-center justify-center gap-1.5 text-emerald-400 font-bold text-xs">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Acesso Liberado</span>
                </div>
                <p className="text-[10px] text-slate-300 mt-0.5">Aluno ativo · Plano Anual VIP</p>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-center text-[10px] text-slate-400">
              Sem filas no balcão e sem demora
            </div>
          </div>
        );

      case 'relatorio':
        return (
          <div className="flex flex-col h-full bg-[#0F172A] text-slate-100 p-4 font-sans select-none">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <p className="text-[10px] uppercase font-bold tracking-wider text-red-500">Gestão do Proprietário</p>
                <p className="text-xs font-semibold text-white">Relatório Mensal</p>
              </div>
              <div className="bg-slate-800 text-slate-300 px-2 py-0.5 rounded text-[10px]">
                Novembro
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 mt-3">
              <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                <span className="text-[9px] text-slate-400">Alunos Ativos</span>
                <p className="text-sm font-bold text-white font-mono mt-0.5">384</p>
                <span className="text-[9px] text-emerald-400 font-semibold">+12% este mês</span>
              </div>
              <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                <span className="text-[9px] text-slate-400">Taxa de Retenção</span>
                <p className="text-sm font-bold text-red-400 font-mono mt-0.5">94.8%</p>
                <span className="text-[9px] text-slate-400">Menos evasão</span>
              </div>
            </div>

            <div className="mt-3 bg-red-950/40 border border-red-800/50 rounded-xl p-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-red-400">14 Alunos Sumidos (+7 dias)</span>
                <span className="text-[9px] bg-red-600 text-white px-1.5 py-0.5 rounded font-semibold">Alerta</span>
              </div>
              <p className="text-[9px] text-slate-300 mt-1">Dispare a mensagem de resgate no WhatsApp com 1 toque.</p>
              <button type="button" className="mt-2 w-full py-1 bg-red-600 text-white text-[10px] font-bold rounded-lg flex items-center justify-center gap-1">
                <MessageCircle className="w-3 h-3" /> Chamar Ausentes
              </button>
            </div>

            <div className="mt-3 bg-slate-900 border border-slate-800 rounded-xl p-2.5 flex-1 flex flex-col justify-between">
              <span className="text-[10px] text-slate-400 font-medium">Horários de Maior Frequência</span>
              <div className="flex items-end justify-between gap-1 h-16 pt-2">
                {[
                  { h: '30%', t: '06h' },
                  { h: '65%', t: '08h' },
                  { h: '40%', t: '12h' },
                  { h: '95%', t: '18h' },
                  { h: '80%', t: '20h' },
                ].map((b, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <div className={`w-full rounded-t ${b.t === '18h' ? 'bg-red-600' : 'bg-slate-700'}`} style={{ height: b.h }} />
                    <span className="text-[8px] text-slate-400">{b.t}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'config':
        return (
          <div className="flex flex-col h-full bg-[#0F172A] text-slate-100 p-4 font-sans select-none">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <p className="text-[10px] uppercase font-bold tracking-wider text-red-500">Personalização</p>
                <p className="text-xs font-semibold text-white">Sua Identidade Visual</p>
              </div>
              <Palette className="w-4 h-4 text-red-500" />
            </div>

            <div className="mt-3 space-y-3">
              <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                <label className="text-[9px] uppercase font-bold text-slate-400 block mb-1">Nome da Academia</label>
                <div className="bg-slate-950 px-2.5 py-1.5 rounded-lg border border-slate-800 text-xs text-white font-semibold">
                  Iron Fitness Club
                </div>
              </div>

              <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                <label className="text-[9px] uppercase font-bold text-slate-400 block mb-1.5">Cor Principal do App</label>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-red-600 ring-2 ring-white cursor-pointer" />
                  <div className="w-6 h-6 rounded-full bg-blue-600 opacity-60 cursor-pointer" />
                  <div className="w-6 h-6 rounded-full bg-amber-500 opacity-60 cursor-pointer" />
                  <div className="w-6 h-6 rounded-full bg-emerald-600 opacity-60 cursor-pointer" />
                  <span className="text-[10px] font-mono text-red-400 ml-1">#DC2626</span>
                </div>
              </div>

              <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                <label className="text-[9px] uppercase font-bold text-slate-400 block mb-1">Aparelhos Disponíveis</label>
                <div className="space-y-1.5 text-[10px] mt-2">
                  <div className="flex items-center justify-between text-slate-200">
                    <span>Leg Press 45°</span>
                    <span className="text-emerald-400 font-bold">Ativo</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-200">
                    <span>Smith Machine</span>
                    <span className="text-emerald-400 font-bold">Ativo</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-200">
                    <span>Cross Over / Polias</span>
                    <span className="text-emerald-400 font-bold">Ativo</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-3 bg-red-600 text-white rounded-xl py-2 text-center text-[10px] font-bold">
              Salvar Alterações
            </div>
          </div>
        );

      case 'home':
      default:
        return (
          <div className="flex flex-col h-full bg-[#0F172A] text-slate-100 p-4 font-sans select-none">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-red-600 flex items-center justify-center font-bold text-white text-xs shadow-md">
                  G
                </div>
                <div>
                  <p className="text-xs font-bold text-white leading-tight">SUA ACADEMIA</p>
                  <p className="text-[9px] text-slate-400">Olá, Lucas Silva</p>
                </div>
              </div>
              <div className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center text-slate-300">
                <Bell className="w-3.5 h-3.5" />
              </div>
            </div>

            <div className="mt-3 bg-gradient-to-r from-red-600 to-red-800 rounded-xl p-3 text-white shadow-lg">
              <div className="flex justify-between items-center">
                <div>
                  <span className="text-[9px] uppercase tracking-wider font-semibold opacity-90">Entrada Rápida</span>
                  <h4 className="text-xs font-bold">Check-in por QR Code</h4>
                  <p className="text-[9px] opacity-80 mt-0.5">Aproxime na catraca/recepção</p>
                </div>
                <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
                  <QrCode className="w-5 h-5 text-white" />
                </div>
              </div>
            </div>

            <div className="mt-3 bg-slate-900 border border-slate-800 rounded-xl p-3">
              <div className="flex justify-between items-center">
                <span className="text-[9px] uppercase tracking-wider font-bold text-red-400">Treino Recomendado</span>
                <span className="text-[9px] bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded">60 min</span>
              </div>
              <h4 className="text-xs font-bold text-white mt-1">Treino A: Peito e Tríceps</h4>
              <p className="text-[10px] text-slate-400 mt-0.5">7 exercícios · Cargas sincronizadas</p>

              <div className="mt-3 flex items-center justify-between pt-2 border-t border-slate-800/80">
                <div className="flex items-center gap-1.5 text-[10px] text-slate-300">
                  <Activity className="w-3.5 h-3.5 text-red-500" />
                  <span>Prof. Rafael Costa</span>
                </div>
                <button type="button" className="bg-red-600 text-white text-[10px] font-bold px-3 py-1 rounded-lg">
                  Iniciar
                </button>
              </div>
            </div>

            <div className="mt-3 bg-slate-900/60 border border-slate-800/80 rounded-xl p-2.5 flex items-center justify-between text-[10px]">
              <div className="flex items-center gap-2">
                <CalendarCheck className="w-4 h-4 text-red-400" />
                <div>
                  <p className="font-semibold text-slate-200">Spinning das 19h00</p>
                  <p className="text-[9px] text-slate-400">Vaga confirmada hoje</p>
                </div>
              </div>
              <span className="text-emerald-400 text-[9px] font-semibold">Confirmado</span>
            </div>

            <div className="mt-2.5 bg-slate-900/40 border border-slate-800/60 rounded-xl p-2 flex items-center justify-between text-[9px] text-slate-400">
              <div className="flex items-center gap-1.5">
                <Trophy className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-slate-200 font-medium">Ranking do Mês: 3º Lugar</span>
              </div>
              <span className="text-red-400 font-bold">18 treinos</span>
            </div>
          </div>
        );
    }
  };

  return (
    <div
      className={`relative mx-auto transition-all duration-300 ${
        isCenter ? 'z-20 scale-100 lg:scale-105' : 'z-10 opacity-90 hover:opacity-100 scale-95'
      } ${className}`}
    >
      <div className="relative w-[270px] sm:w-[285px] h-[540px] sm:h-[570px] bg-slate-950 rounded-[40px] p-2.5 shadow-2xl border-4 border-slate-800/90 ring-1 ring-slate-700/40">
        <div className="absolute top-4 left-1/2 -translate-x-1/2 w-24 h-4 bg-slate-900 rounded-full z-30 flex items-center justify-center">
          <div className="w-10 h-1 bg-slate-800 rounded-full" />
          <div className="w-2.5 h-2.5 bg-slate-800 rounded-full ml-2" />
        </div>

        <div className="w-full h-full bg-[#0B1120] rounded-[32px] overflow-hidden relative pt-6 flex flex-col border border-slate-800/60">
          {!hasError ? (
            <img
              src={src}
              alt={alt}
              onError={() => setHasError(true)}
              className="w-full h-full object-cover object-top"
              loading={isCenter || type === "home" || type === "evolucao" || type === "treino" ? "eager" : "lazy"}
            />
          ) : (
            renderFallbackUI()
          )}
        </div>

        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-28 h-1 bg-slate-700/80 rounded-full z-30" />
      </div>

      <p className="text-center text-xs text-slate-400 font-medium mt-3 tracking-wide">{label}</p>
    </div>
  );
};

/* ==========================================================================
   LANDING PAGE PRINCIPAL
   ========================================================================== */

interface LandingPageProps {
  lang: Language;
  onLanguageChange: (newLang: Language) => void;
  onNavigate: (path: string) => void;
  isTestMode?: boolean;
}

export default function LandingPage({
  lang,
  onLanguageChange,
  onNavigate,
  isTestMode = false,
}: LandingPageProps) {
  const [activeTab, setActiveTab] = useState<'student' | 'trainer' | 'owner'>('student');
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const currentYear = 2026;

  const whatsappLicenseMessage = encodeURIComponent(
    lang === 'pt-BR'
      ? "Olá! Quero saber da licença própria do app para academias."
      : "¡Hola! Quiero información sobre la licencia propia de la app para gimnasios."
  );
  const whatsappLicenseUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${whatsappLicenseMessage}`;

  const whatsappGeneralMessage = encodeURIComponent(
    lang === 'pt-BR'
      ? `Olá! Quero conhecer mais sobre o ${PRODUCT_NAME} para a minha academia.`
      : `¡Hola! Quiero conocer más sobre ${PRODUCT_NAME} para mi gimnasio.`
  );
  const whatsappGeneralUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${whatsappGeneralMessage}`;

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  return (
    <div className="min-h-screen bg-[#0B1120] text-slate-100 font-sans selection:bg-red-600 selection:text-white">

      {/* 1. TOPO FIXO */}
      <header className="sticky top-0 z-50 bg-[#0B1120]/90 backdrop-blur-md border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between gap-4">
          
          <a href="#" className="flex items-center gap-2.5 text-white font-black text-xl tracking-tight shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 rounded-lg p-1">
            <span className="w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center text-white shadow-md shadow-red-600/30">
              <Dumbbell className="w-5 h-5 text-white" />
            </span>
            <span className="tracking-tight">{PRODUCT_NAME}</span>
          </a>

          <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-300" aria-label="Navegação principal">
            <a href="#problema-solucao" className="hover:text-white transition-colors focus-visible:text-white focus-visible:outline-none">
              {lang === 'pt-BR' ? 'Vantagens' : 'Ventajas'}
            </a>
            <a href="#recursos" className="hover:text-white transition-colors focus-visible:text-white focus-visible:outline-none">
              {lang === 'pt-BR' ? 'Recursos' : 'Funciones'}
            </a>
            <a href="#como-funciona" className="hover:text-white transition-colors focus-visible:text-white focus-visible:outline-none">
              {lang === 'pt-BR' ? 'Como Funciona' : 'Cómo Funciona'}
            </a>
            <a href="#planos" className="hover:text-white transition-colors focus-visible:text-white focus-visible:outline-none">
              {lang === 'pt-BR' ? 'Planos' : 'Planes'}
            </a>
            <a href="#faq" className="hover:text-white transition-colors focus-visible:text-white focus-visible:outline-none">
              {lang === 'pt-BR' ? 'Dúvidas' : 'Preguntas'}
            </a>
          </nav>

          <div className="flex items-center gap-3">
            {isTestMode && (
              <span className="text-[11px] bg-amber-500/20 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded font-mono hidden sm:inline-block">
                Modo Teste (?teste=1)
              </span>
            )}

            <div className="flex items-center bg-slate-900 border border-slate-700/80 rounded-lg p-0.5 text-xs font-semibold">
              <button
                type="button"
                onClick={() => onLanguageChange('pt-BR')}
                className={`px-2.5 py-1.5 rounded-md transition-colors ${
                  lang === 'pt-BR'
                    ? 'bg-red-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Português do Brasil"
                aria-pressed={lang === 'pt-BR'}
              >
                🇧🇷 PT
              </button>
              <button
                type="button"
                onClick={() => onLanguageChange('es-PY')}
                className={`px-2.5 py-1.5 rounded-md transition-colors ${
                  lang === 'es-PY'
                    ? 'bg-red-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Español (Paraguay)"
                aria-pressed={lang === 'es-PY'}
              >
                🇵🇾 ES
              </button>
            </div>

            <a
              href={DEMO_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:inline-flex items-center justify-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg transition-all shadow-md shadow-red-600/20 whitespace-nowrap focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:outline-none"
            >
              <span>{lang === 'pt-BR' ? 'Testar a demo' : 'Probar la demo'}</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>

            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white focus-visible:ring-2 focus-visible:ring-red-500"
              aria-label="Menu"
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden bg-[#0B1120] border-b border-slate-800 px-4 py-5 space-y-3">
            <a
              href="#problema-solucao"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-slate-200 text-sm font-medium py-2 px-3 rounded-md hover:bg-slate-900"
            >
              {lang === 'pt-BR' ? 'Vantagens' : 'Ventajas'}
            </a>
            <a
              href="#recursos"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-slate-200 text-sm font-medium py-2 px-3 rounded-md hover:bg-slate-900"
            >
              {lang === 'pt-BR' ? 'Recursos' : 'Funciones'}
            </a>
            <a
              href="#como-funciona"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-slate-200 text-sm font-medium py-2 px-3 rounded-md hover:bg-slate-900"
            >
              {lang === 'pt-BR' ? 'Como Funciona' : 'Cómo Funciona'}
            </a>
            <a
              href="#planos"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-slate-200 text-sm font-medium py-2 px-3 rounded-md hover:bg-slate-900"
            >
              {lang === 'pt-BR' ? 'Planos' : 'Planes'}
            </a>
            <a
              href="#faq"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-slate-200 text-sm font-medium py-2 px-3 rounded-md hover:bg-slate-900"
            >
              {lang === 'pt-BR' ? 'Dúvidas' : 'Preguntas'}
            </a>
            <div className="pt-2">
              <a
                href={DEMO_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2 py-3 bg-red-600 text-white rounded-lg font-bold text-sm"
              >
                <span>{lang === 'pt-BR' ? 'Testar a demo' : 'Probar la demo'}</span>
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>
        )}
      </header>

      {/* 2. HERO */}
      <section className="relative pt-12 pb-20 sm:pt-20 sm:pb-28 overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-red-600/10 rounded-full blur-[140px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-red-500 mb-4">
              <span>{lang === 'pt-BR' ? 'App White-Label para Academias e Studios' : 'App White-Label para Gimnasios y Estudios'}</span>
              <span aria-hidden="true">·</span>
              <span>100% Customizável</span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.15] text-balance">
              {lang === 'pt-BR'
                ? 'O app da sua academia, com a sua marca, no celular de cada aluno.'
                : 'La app de tu gimnasio, con tu marca, en el celular de cada alumno.'}
            </h1>

            <p className="mt-5 text-base sm:text-lg text-slate-300 leading-relaxed max-w-2xl mx-auto">
              {lang === 'pt-BR'
                ? 'Treino com sugestão de carga, aulas, check-in por QR, evolução e acompanhamento dos alunos num só lugar. Seu nome, sua logo e suas cores.'
                : 'Entrenamiento con sugerencia de carga, clases, check-in por QR, evolución y seguimiento de alumnos en un solo lugar. Tu nombre, tu logo y tus colores.'}
            </p>

            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <a
                href="#planos"
                className="w-full sm:w-auto px-8 py-3.5 bg-red-600 hover:bg-red-700 active:scale-95 text-white font-bold rounded-xl text-base shadow-lg shadow-red-600/30 transition-all flex items-center justify-center gap-2 focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:outline-none"
              >
                <span>{lang === 'pt-BR' ? 'Começar agora' : 'Empezar ahora'}</span>
                <ArrowRight className="w-4 h-4" />
              </a>
              <a
                href={DEMO_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto px-8 py-3.5 bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 text-white font-semibold rounded-xl text-base transition-all flex items-center justify-center gap-2 focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:outline-none"
              >
                <span>{lang === 'pt-BR' ? 'Ver demonstração' : 'Ver demostración'}</span>
                <ExternalLink className="w-4 h-4 text-slate-400" />
              </a>
            </div>
          </div>

          <div className="mt-16 pt-4">
            <div className="flex flex-col lg:flex-row items-center justify-center gap-8 lg:gap-6 max-w-5xl mx-auto">
              <div className="order-2 lg:order-1 w-full lg:w-1/3">
                <PhoneMockup
                  src="/prints/home.webp"
                  alt="Tela inicial da academia com check-in QR e treinos"
                  type="home"
                  label={lang === 'pt-BR' ? 'Tela Inicial da Sua Academia' : 'Pantalla Inicial de tu Gimnasio'}
                />
              </div>

              <div className="order-1 lg:order-2 w-full lg:w-1/3">
                <PhoneMockup
                  src="/prints/treino.webp"
                  alt="Ficha de treino interativa com cargas anteriores e timer"
                  type="treino"
                  isCenter={true}
                  label={lang === 'pt-BR' ? 'Ficha de Treino Inteligente' : 'Rutina de Entrenamiento Inteligente'}
                />
              </div>

              <div className="order-3 lg:order-3 w-full lg:w-1/3">
                <PhoneMockup
                  src="/prints/evolucao.webp"
                  alt="Gráfico de evolução de cargas e histórico de frequência"
                  type="evolucao"
                  label={lang === 'pt-BR' ? 'Evolução e Cargas' : 'Evolución y Cargas'}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. PROBLEMA → SOLUÇÃO */}
      <section id="problema-solucao" className="py-20 bg-slate-950/60 border-y border-slate-800/80">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <p className="text-xs font-bold uppercase tracking-wider text-red-500 mb-2">
              {lang === 'pt-BR' ? 'Por que as academias perdem alunos?' : '¿Por qué los gimnasios pierden alumnos?'}
            </p>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
              {lang === 'pt-BR' ? 'O fim das fichas perdidas e do desânimo dos alunos' : 'El fin de las fichas de papel y del abandono de alumnos'}
            </h2>
            <p className="mt-3 text-slate-300 text-sm sm:text-base">
              {lang === 'pt-BR'
                ? 'Quando o aluno não percebe que está melhorando e você não sabe quem está sumindo, o resultado é cancelamento. Veja como resolvemos isso:'
                : 'Cuando el alumno no percibe su mejora y tú no sabes quién está faltando, el resultado es la cancelación. Así lo solucionamos:'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                problem: lang === 'pt-BR' ? 'Aluno que não vê a própria evolução perde a motivação e desiste.' : 'El alumno que no ve su evolución pierde la motivación y abandona.',
                solution: lang === 'pt-BR' ? 'Gráficos visuais de carga, histórico e fotos de antes/depois provam o resultado na prática.' : 'Gráficos visuales de carga, historial y fotos de antes/después demuestran el resultado en la práctica.',
              },
              {
                problem: lang === 'pt-BR' ? 'Ficha de papel amassa, rasga, se perde e gera filas para os instrutores.' : 'La ficha de papel se arruga, se rompe, se pierde y genera filas para los instructores.',
                solution: lang === 'pt-BR' ? 'Treino interativo na palma da mão, com cargas salvas automaticamente e timer de descanso.' : 'Rutina interactiva en la palma de la mano, con pesos guardados automáticamente y cronómetro de descanso.',
              },
              {
                problem: lang === 'pt-BR' ? 'O dono não sabe quem está sumindo até o momento em que a mensalidade atrasa.' : 'El dueño no sabe quién está faltando hasta el momento en que vence la mensualidad.',
                solution: lang === 'pt-BR' ? 'Alerta automático de alunos inativos com mensagem pronta de retorno no WhatsApp.' : 'Alerta automática de alumnos inactivos con mensaje listo para enviar por WhatsApp.',
              },
            ].map((item, idx) => (
              <div
                key={idx}
                className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between hover:border-slate-700 transition-colors"
              >
                <div className="pb-5 border-b border-slate-800">
                  <div className="flex items-center gap-2 text-rose-400 font-bold text-xs uppercase tracking-wider mb-2">
                    <XCircle className="w-4 h-4 text-rose-500 shrink-0" />
                    <span>{lang === 'pt-BR' ? 'Sem o aplicativo' : 'Sin la app'}</span>
                  </div>
                  <p className="text-slate-300 text-sm leading-relaxed">{item.problem}</p>
                </div>

                <div className="pt-5">
                  <div className="flex items-center gap-2 text-red-400 font-bold text-xs uppercase tracking-wider mb-2">
                    <CheckCircle2 className="w-4 h-4 text-red-500 shrink-0" />
                    <span>{lang === 'pt-BR' ? `Com o ${PRODUCT_NAME}` : `Con ${PRODUCT_NAME}`}</span>
                  </div>
                  <p className="text-white text-sm font-medium leading-relaxed">{item.solution}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. RECURSOS */}
      <section id="recursos" className="py-20 lg:py-28 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <p className="text-xs font-bold uppercase tracking-wider text-red-500 mb-2">
              {lang === 'pt-BR' ? 'Tecnologia Completa' : 'Tecnología Completa'}
            </p>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
              {lang === 'pt-BR' ? 'Tudo o que sua academia precisa para crescer e reter' : 'Todo lo que tu gimnasio necesita para crecer y retener'}
            </h2>
            <p className="mt-3 text-slate-300 text-sm sm:text-base">
              {lang === 'pt-BR'
                ? 'Funcionalidades pensadas no dia a dia da sala de musculação, na gestão dos instrutores e no faturamento do proprietário.'
                : 'Funcionalidades diseñadas para el día a día de la sala de pesas, la gestión de los profesores y los ingresos del propietario.'}
            </p>

            <div className="mt-8 inline-flex p-1.5 bg-slate-900 border border-slate-800 rounded-xl max-w-full overflow-x-auto">
              <button
                type="button"
                onClick={() => setActiveTab('student')}
                className={`px-5 py-2.5 rounded-lg text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
                  activeTab === 'student' ? 'bg-red-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
                }`}
              >
                {lang === 'pt-BR' ? 'Para o Aluno (11)' : 'Para el Alumno (11)'}
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('trainer')}
                className={`px-5 py-2.5 rounded-lg text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
                  activeTab === 'trainer' ? 'bg-red-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
                }`}
              >
                {lang === 'pt-BR' ? 'Para o Professor (6)' : 'Para el Profesor (6)'}
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('owner')}
                className={`px-5 py-2.5 rounded-lg text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
                  activeTab === 'owner' ? 'bg-red-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
                }`}
              >
                {lang === 'pt-BR' ? 'Para o Dono (7)' : 'Para el Dueño (7)'}
              </button>
            </div>
          </div>

          {activeTab === 'student' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {[
                { icon: Dumbbell, title: lang === 'pt-BR' ? "Treino do dia com cargas anteriores" : "Entrenamiento del día con cargas anteriores", desc: lang === 'pt-BR' ? "O aluno abre e já vê o peso que usou na última série, sem esquecimentos." : "El alumno abre la app y ve al instante el peso que usó en su última serie." },
                { icon: Sparkles, title: lang === 'pt-BR' ? "Sugestão de carga automática" : "Sugerencia de carga automática", desc: lang === 'pt-BR' ? "Algoritmo que orienta progressão contínua de carga para cada exercício." : "Algoritmo que orienta la progresión continua de peso para cada ejercicio." },
                { icon: Timer, title: lang === 'pt-BR' ? "Timer de descanso" : "Cronómetro de descanso", desc: lang === 'pt-BR' ? "Cronômetro integrado na tela para manter o foco e o ritmo do treino." : "Temporizador integrado en pantalla para mantener el ritmo del entrenamiento." },
                { icon: Layers, title: lang === 'pt-BR' ? "Bi-set, drop set e aquecimento" : "Bi-set, drop set y calentamiento", desc: lang === 'pt-BR' ? "Suporte completo a técnicas avançadas e aquecimentos específicos." : "Soporte completo para técnicas avanzadas y series de calentamiento." },
                { icon: PlaySquare, title: lang === 'pt-BR' ? "Mais de 5.600 exercícios com animação" : "Más de 5.600 ejercicios con animación", desc: lang === 'pt-BR' ? "Biblioteca completa com GIFs e instruções de execução correta." : "Biblioteca completa con animaciones e instrucciones de ejecución correcta." },
                { icon: UserCheck, title: lang === 'pt-BR' ? "Mapa do corpo humano" : "Mapa del cuerpo humano", desc: lang === 'pt-BR' ? "Visualização clara dos grupos musculares trabalhados no dia." : "Visualización gráfica de los grupos musculares trabajados en cada sesión." },
                { icon: LineChart, title: lang === 'pt-BR' ? "Gráfico de evolução por exercício" : "Gráfico de evolución por ejercicio", desc: lang === 'pt-BR' ? "Acompanhamento visual do ganho de força e volume treino a treino." : "Seguimiento visual del aumento de fuerza y volumen sesión tras sesión." },
                { icon: Camera, title: lang === 'pt-BR' ? "Fotos de antes e depois" : "Fotos de antes y después", desc: lang === 'pt-BR' ? "Espaço seguro para registrar transformações corporais e medidas." : "Registro seguro de transformaciones corporales y medidas físicas." },
                { icon: CalendarCheck, title: lang === 'pt-BR' ? "Reserva de aulas coletivas" : "Reserva de clases grupales", desc: lang === 'pt-BR' ? "Garante vaga em spinning, yoga, pilates ou funcional em 2 toques." : "Reserva de cupos en spinning, yoga, funcional o pilates en 2 toques." },
                { icon: Trophy, title: lang === 'pt-BR' ? "Ranking e desafios do mês" : "Ranking y desafíos del mes", desc: lang === 'pt-BR' ? "Gamificação que estimula a frequência e o engajamento da comunidade." : "Gamificación que estimula la asistencia y el compromiso de la comunidad." },
                { icon: WifiOff, title: lang === 'pt-BR' ? "Funciona sem internet" : "Funciona sin conexión a internet", desc: lang === 'pt-BR' ? "Pode treinar até no subsolo; sincroniza tudo assim que reconectar." : "Permite entrenar incluso sin señal; sincroniza al volver a conectarse." },
              ].map((feat, idx) => (
                <div key={idx} className="bg-slate-900/80 border border-slate-800/90 rounded-2xl p-5 hover:border-red-600/50 transition-all flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-red-600/15 border border-red-500/20 text-red-500 flex items-center justify-center shrink-0">
                    <feat.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">{feat.title}</h3>
                    <p className="text-xs text-slate-300 mt-1 leading-relaxed">{feat.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'trainer' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {[
                { icon: ClipboardList, title: lang === 'pt-BR' ? "Modelos de ficha prontos" : "Modelos de rutinas listos", desc: lang === 'pt-BR' ? "Templates rápidos para ABC, Push/Pull/Legs, Upper/Lower e adaptativos." : "Plantillas rápidas para rutinas ABC, Push/Pull/Legs, Upper/Lower y adaptación." },
                { icon: Users, title: lang === 'pt-BR' ? "Envio da ficha para vários alunos" : "Envío de rutinas a múltiples alumnos", desc: lang === 'pt-BR' ? "Economiza horas de montagem replicando rotinas personalizáveis com 1 clique." : "Ahorra horas replicando rutinas personalizables con 1 solo clic." },
                { icon: MessageCircle, title: lang === 'pt-BR' ? "Alunos sumidos com mensagem pronta" : "Alumnos ausentes con mensaje listo", desc: lang === 'pt-BR' ? "Lista de quem não treina há mais de 7 dias com link direto para o WhatsApp." : "Lista de alumnos que no entrenan hace más de 7 días con enlace directo a WhatsApp." },
                { icon: Activity, title: lang === 'pt-BR' ? "Avaliação física completa" : "Evaluación física completa", desc: lang === 'pt-BR' ? "Registro de dobras cutâneas, perímetros, bioimpedância e metas de composição." : "Registro de pliegues cutáneos, perímetros, bioimpedancia y metas corporales." },
                { icon: Calendar, title: lang === 'pt-BR' ? "Grade de aulas com lista de presença" : "Grilla de clases con lista de asistencia", desc: lang === 'pt-BR' ? "Controle em tempo real de quem compareceu às turmas da grade." : "Control en tiempo real de los alumnos presentes en cada clase." },
                { icon: FileText, title: lang === 'pt-BR' ? "Imprimir ficha em PDF" : "Imprimir rutina en PDF", desc: lang === 'pt-BR' ? "Opção rápida para imprimir caso algum aluno prefira o papel físico." : "Opción rápida para imprimir en caso de que algún alumno prefiera papel." },
              ].map((feat, idx) => (
                <div key={idx} className="bg-slate-900/80 border border-slate-800/90 rounded-2xl p-5 hover:border-red-600/50 transition-all flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-red-600/15 border border-red-500/20 text-red-500 flex items-center justify-center shrink-0">
                    <feat.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">{feat.title}</h3>
                    <p className="text-xs text-slate-300 mt-1 leading-relaxed">{feat.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'owner' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {[
                { icon: Palette, title: lang === 'pt-BR' ? "Logo, cores e nome da academia" : "Logo, colores y nombre de tu gimnasio", desc: lang === 'pt-BR' ? "Aplicativo 100% personalizado com a identidade visual da sua marca em cada tela." : "Aplicación 100% personalizada con la identidad visual de tu marca en cada pantalla." },
                { icon: QrCode, title: lang === 'pt-BR' ? "Check-in por QR Code na recepção" : "Check-in con código QR en recepción", desc: lang === 'pt-BR' ? "Validação rápida de presença sem filas no balcão e sem complicação." : "Validación rápida de ingreso sin filas en el mostrador y sin complicaciones." },
                { icon: Megaphone, title: lang === 'pt-BR' ? "Mural de avisos" : "Mural de avisos", desc: lang === 'pt-BR' ? "Divulgue eventos, horários especiais de feriados e novidades da academia." : "Publica eventos, horarios especiales de feriados y novedades del gimnasio." },
                { icon: Bell, title: lang === 'pt-BR' ? "Notificações no celular dos alunos" : "Notificaciones en el celular del alumno", desc: lang === 'pt-BR' ? "Mensagens push diretas para motivar, lembrar de treinar e engajar." : "Mensajes push directos para motivar, recordar entrenar y generar comunidad." },
                { icon: BarChart3, title: lang === 'pt-BR' ? "Relatório do mês" : "Reporte mensual", desc: lang === 'pt-BR' ? "Métricas de assiduidade, horários de pico e ranking de retenção de alunos." : "Métricas de asistencia, horarios pico y ranking de retención de alumnos." },
                { icon: Wrench, title: lang === 'pt-BR' ? "Escolha dos equipamentos disponíveis" : "Selección de máquinas disponibles", desc: lang === 'pt-BR' ? "O sistema adapta os treinos apenas aos aparelhos que sua academia realmente possui." : "El sistema adapta los ejercicios exclusivamente a los equipos que posee tu gimnasio." },
                { icon: Globe, title: lang === 'pt-BR' ? "Português e Espanhol" : "Español y Portugués", desc: lang === 'pt-BR' ? "Suporte nativo a múltiplos idiomas para atender alunos de diferentes nacionalidades." : "Soporte nativo en varios idiomas para atender alumnos de distintas nacionalidades." },
              ].map((feat, idx) => (
                <div key={idx} className="bg-slate-900/80 border border-slate-800/90 rounded-2xl p-5 hover:border-red-600/50 transition-all flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-red-600/15 border border-red-500/20 text-red-500 flex items-center justify-center shrink-0">
                    <feat.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">{feat.title}</h3>
                    <p className="text-xs text-slate-300 mt-1 leading-relaxed">{feat.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Vitrine das Telas de Gestão */}
          <div className="mt-16 pt-8 border-t border-slate-800/80">
            <div className="text-center max-w-2xl mx-auto mb-10">
              <span className="text-xs font-bold uppercase tracking-wider text-red-500 block mb-1">
                {lang === 'pt-BR' ? 'Controle Total do Proprietário' : 'Control Total del Propietario'}
              </span>
              <h3 className="text-xl sm:text-2xl font-extrabold text-white">
                {lang === 'pt-BR' ? 'Telas de Recepção, Relatórios e Personalização' : 'Pantallas de Recepción, Informes y Personalización'}
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 mt-2">
                {lang === 'pt-BR'
                  ? 'Do check-in sem filas ao acompanhamento de alunos inativos e troca de cores da sua marca.'
                  : 'Del check-in sin filas al seguimiento de alumnos inactivos y personalización de tu marca.'}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              <div className="flex flex-col items-center">
                <PhoneMockup
                  src="/prints/checkin.webp"
                  alt="Totem de check-in por QR Code na recepção da academia"
                  type="checkin"
                  label={lang === 'pt-BR' ? 'Check-in na Recepção' : 'Check-in en Recepción'}
                />
              </div>

              <div className="flex flex-col items-center">
                <PhoneMockup
                  src="/prints/relatorio.webp"
                  alt="Relatório do mês com assiduidade e alunos ausentes"
                  type="relatorio"
                  label={lang === 'pt-BR' ? 'Relatório Mensal' : 'Reporte Mensual'}
                />
              </div>

              <div className="flex flex-col items-center">
                <PhoneMockup
                  src="/prints/config.webp"
                  alt="Configuração de logo, cores e aparelhos da academia"
                  type="config"
                  label={lang === 'pt-BR' ? 'Personalização da Marca' : 'Personalización de Marca'}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. COMO FUNCIONA */}
      <section id="como-funciona" className="py-20 bg-slate-950/70 border-y border-slate-800/80">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <p className="text-xs font-bold uppercase tracking-wider text-red-500 mb-2">
              {lang === 'pt-BR' ? 'Implantação Imediata' : 'Puesta en Marcha Rápida'}
            </p>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
              {lang === 'pt-BR' ? 'Como funciona? Seu app no ar em 4 passos simples' : '¿Cómo funciona? Tu app lista en 4 sencillos pasos'}
            </h2>
            <p className="mt-3 text-slate-300 text-sm sm:text-base">
              {lang === 'pt-BR' ? 'Sem dor de cabeça técnica. Você não precisa programar nada nem esperar semanas.' : 'Sin complicaciones técnicas. No necesitas programar nada ni esperar semanas.'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { number: "01", title: lang === 'pt-BR' ? "Escolha o plano e cadastre a academia" : "Elige tu plan y registra tu gimnasio", desc: lang === 'pt-BR' ? "Selecione entre a assinatura mensal sem fidelidade ou a licença própria definitiva." : "Selecciona entre la suscripción mensual sin permanencia o la licencia propia definitiva." },
              { number: "02", title: lang === 'pt-BR' ? "Coloque sua logo e suas cores" : "Configura tu logo y tus colores", desc: lang === 'pt-BR' ? "Personalize a identidade do aplicativo com seu logotipo oficial, paleta e slogan." : "Personaliza la identidad de la aplicación con el logo oficial, colores y eslogan." },
              { number: "03", title: lang === 'pt-BR' ? "Cadastre professores e aulas" : "Registra profesores y clases", desc: lang === 'pt-BR' ? "Adicione sua equipe de instrutores, crie a grade horária e monte as rotinas de treino." : "Añade a tu equipo de instructores, define los horarios de clases y crea las rutinas." },
              { number: "04", title: lang === 'pt-BR' ? "Imprima o cartaz com QR Code" : "Imprime el cartel con el código QR", desc: lang === 'pt-BR' ? "Coloque na recepção: os alunos apontam a câmera e instalam o app direto, sem lojas." : "Colócalo en recepción: los alumnos apuntan su cámara e instalan al instante, sin tiendas." },
            ].map((step, idx) => (
              <div key={idx} className="relative bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between hover:border-slate-700 transition-colors">
                <div>
                  <span className="text-3xl font-black text-red-600/80 font-mono block mb-3">{step.number}</span>
                  <h3 className="text-base font-bold text-white mb-2 leading-snug">{step.title}</h3>
                  <p className="text-xs text-slate-300 leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. PLANOS */}
      <section id="planos" className="py-20 lg:py-28 relative">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <p className="text-xs font-bold uppercase tracking-wider text-red-500 mb-2">
              {lang === 'pt-BR' ? 'Investimento Transparente' : 'Inversión Transparente'}
            </p>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
              {lang === 'pt-BR' ? 'Planos pensados para a realidade da sua academia' : 'Planes pensados para la realidad de tu gimnasio'}
            </h2>
            <p className="mt-3 text-slate-300 text-sm sm:text-base">
              {lang === 'pt-BR' ? 'Sem taxas escondidas. Escolha entre modelo por assinatura ou licença própria definitiva.' : 'Sin tarifas ocultas. Elige entre modelo de suscripción o licencia propia definitiva.'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto items-stretch">
            
            {/* Card 1: Assinatura */}
            <div className="relative bg-slate-900 border-2 border-red-600 rounded-3xl p-7 sm:p-8 flex flex-col justify-between shadow-2xl shadow-red-950/40">
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-red-600 text-white text-[11px] font-black uppercase tracking-wider px-3.5 py-1 rounded-full shadow-md">
                {lang === 'pt-BR' ? 'Mais escolhido' : 'Más elegido'}
              </div>

              <div>
                <div className="flex justify-between items-baseline mb-2 mt-2">
                  <h3 className="text-xl font-bold text-white">{lang === 'pt-BR' ? 'Assinatura Mensal' : 'Suscripción Mensual'}</h3>
                  <span className="text-xs font-semibold text-slate-400">
                    {lang === 'pt-BR' ? 'Cancelamento livre' : 'Cancelación libre'}
                  </span>
                </div>

                <div className="mt-4 mb-6 pb-6 border-b border-slate-800">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl sm:text-5xl font-black text-white tracking-tight">
                      {lang === 'pt-BR' ? PRECO_ASSINATURA_BR : PRECO_ASSINATURA_PY}
                    </span>
                    <span className="text-sm font-semibold text-slate-400">{lang === 'pt-BR' ? '/mês' : '/mes'}</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    {lang === 'pt-BR' ? 'Sem taxa de adesão ou carência' : 'Sin matrícula ni permanencia mínima'}
                  </p>
                </div>

                <ul className="space-y-3.5 mb-8 text-sm">
                  {[
                    lang === 'pt-BR' ? 'App completo com a marca da sua academia' : 'App completa con la marca de tu gimnasio',
                    lang === 'pt-BR' ? 'Hospedagem, segurança e backup diário inclusos' : 'Alojamiento, seguridad y copias de seguridad diarias',
                    lang === 'pt-BR' ? 'Todas as atualizações e melhorias futuras' : 'Todas las actualizaciones y mejoras incluidas',
                    lang === 'pt-BR' ? 'Suporte direto e prioritário por WhatsApp' : 'Soporte directo y prioritario por WhatsApp',
                    lang === 'pt-BR' ? 'Implantação guiada e treinamento da equipe' : 'Implementación guiada y capacitación del equipo',
                    lang === 'pt-BR' ? 'Sem taxa de adesão ou fidelidade obrigatória' : 'Sin costo de activación ni permanencia forzada',
                  ].map((feat, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-slate-200">
                      <CheckCircle2 className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <button
                type="button"
                onClick={() => onNavigate('/cadastro?plano=assinatura')}
                className="w-full py-3.5 bg-red-600 hover:bg-red-700 active:scale-95 text-white font-bold rounded-xl text-center shadow-lg shadow-red-600/30 transition-all flex items-center justify-center gap-2 focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:outline-none"
              >
                <span>{lang === 'pt-BR' ? 'Assinar agora' : 'Suscribirme ahora'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* Card 2: Licença Própria */}
            <div className="bg-slate-900/90 border border-slate-800 hover:border-slate-700 rounded-3xl p-7 sm:p-8 flex flex-col justify-between transition-all">
              <div>
                <div className="flex justify-between items-baseline mb-2">
                  <h3 className="text-xl font-bold text-white">{lang === 'pt-BR' ? 'Licença Própria' : 'Licencia Propia'}</h3>
                  <span className="text-xs font-semibold text-slate-400">
                    {lang === 'pt-BR' ? 'Instalação definitiva' : 'Instalación definitiva'}
                  </span>
                </div>

                <div className="mt-4 mb-6 pb-6 border-b border-slate-800">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl sm:text-5xl font-black text-white tracking-tight">
                      {lang === 'pt-BR' ? PRECO_LICENCA_BR : PRECO_LICENCA_PY}
                    </span>
                    <span className="text-sm font-semibold text-slate-400">
                      {lang === 'pt-BR' ? ' pagamento único' : ' pago único'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                    {lang === 'pt-BR'
                      ? 'Sistema instalado no servidor da academia (servidor pago pela academia, cerca de R$ 30 a R$ 55/mês).'
                      : `Sistema instalado en el servidor del gimnasio (servidor abonado por el gimnasio, aprox. ${CUSTO_SERVIDOR_PY}).`}
                  </p>
                </div>

                <ul className="space-y-3.5 mb-8 text-sm">
                  {[
                    lang === 'pt-BR' ? 'Dados dos alunos 100% da academia, no servidor dela' : 'Datos de los alumnos 100% del gimnasio, en su propio servidor',
                    lang === 'pt-BR' ? 'Instalação no seu servidor próprio' : 'Instalación en servidor propio',
                    lang === 'pt-BR' ? 'Sem mensalidade fixa do aplicativo' : 'Sin mensualidad fija de la aplicación',
                    lang === 'pt-BR' ? 'Customização total da marca e domínio próprio' : 'Personalización total de la marca y dominio propio',
                    lang === 'pt-BR' ? 'Treinamento para gestão técnica e suporte inicial' : 'Capacitación de gestión técnica y soporte inicial',
                    lang === 'pt-BR' ? 'Licença de uso para a sua academia; atualizações com a manutenção anual opcional' : 'Licencia de uso para tu gimnasio; actualizaciones con el mantenimiento anual opcional',
                  ].map((feat, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-slate-200">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <a
                href={whatsappLicenseUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3.5 bg-slate-800 hover:bg-slate-700 active:scale-95 text-white font-bold rounded-xl text-center border border-slate-700 transition-all flex items-center justify-center gap-2 focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:outline-none"
              >
                <MessageCircle className="w-4 h-4 text-emerald-400" />
                <span>{lang === 'pt-BR' ? 'Falar com a gente' : 'Hablar con nosotros'}</span>
              </a>
            </div>
          </div>

          <div className="mt-12 max-w-4xl mx-auto bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 text-center sm:text-left sm:flex sm:items-center sm:gap-4">
            <div className="w-9 h-9 rounded-xl bg-slate-800 text-red-400 flex items-center justify-center shrink-0 mx-auto sm:mx-0 mb-3 sm:mb-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-red-400">
                {lang === 'pt-BR' ? 'Opcionais sob consulta:' : 'Opcionales bajo consulta:'}
              </p>
              <p className="text-xs sm:text-sm text-slate-300 mt-0.5 leading-relaxed">
                {lang === 'pt-BR'
                  ? 'Vídeos dos exercícios gravados com seus professores, app nas lojas (Google Play / App Store) e rede com várias unidades.'
                  : 'Videos de ejercicios grabados con tus propios profesores, publicación en tiendas (Google Play y App Store) y soporte para cadenas con múltiples sucursales.'}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Prova social: comentário conforme regra */}
      {/* Depoimentos reais virão aqui */}

      {/* 7. PERGUNTAS FREQUENTES */}
      <section id="faq" className="py-20 bg-slate-950/60 border-y border-slate-800/80">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <p className="text-xs font-bold uppercase tracking-wider text-red-500 mb-2">
              {lang === 'pt-BR' ? 'Tire Suas Dúvidas' : 'Preguntas Frecuentes'}
            </p>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
              {lang === 'pt-BR' ? 'Perguntas Frequentes' : 'Despeja todas tus dudas'}
            </h2>
            <p className="mt-3 text-slate-300 text-sm sm:text-base">
              {lang === 'pt-BR' ? 'Tudo o que você precisa saber antes de colocar o app da sua academia no ar.' : 'Todo lo que necesitas saber antes de lanzar la app de tu gimnasio.'}
            </p>
          </div>

          <div className="space-y-4">
            {[
              {
                q: lang === 'pt-BR' ? "Preciso de loja de aplicativos?" : "¿Necesito estar en las tiendas de aplicaciones?",
                a: lang === 'pt-BR' ? "Não! O GymApp utiliza tecnologia PWA moderna. O aluno aponta a câmera do celular para o QR Code na recepção e o aplicativo é instalado instantaneamente na tela inicial, tanto no Android quanto no iPhone, sem precisar buscar em lojas. Ele cria a conta em menos de um minuto." : "¡No! GymApp utiliza tecnología PWA moderna. El alumno enfoca con su cámara el código QR en recepción y la app se instala al instante en su pantalla de inicio (Android o iPhone), sin buscar en tiendas. Crea su cuenta en menos de un minuto.",
              },
              {
                q: lang === 'pt-BR' ? "Funciona com meu sistema de mensalidades e catraca?" : "¿Funciona con mi sistema actual de cuotas y molinetes?",
                a: lang === 'pt-BR' ? "Sim! O GymApp cuida especificamente do treino, das aulas, da evolução e do relacionamento com o aluno. Ele não substitui o seu sistema financeiro ou a catraca existente, funcionando em perfeita harmonia." : "¡Sí! GymApp se enfoca específicamente en los entrenamientos, las clases, la evolución y el vínculo con el alumno. No reemplaza tu sistema de facturación o control de acceso físico, conviven de forma armónica.",
              },
              {
                q: lang === 'pt-BR' ? "Meus dados ficam seguros?" : "¿Mis datos están seguros?",
                a: lang === 'pt-BR' ? "Totalmente. Cada academia possui um ambiente isolado com banco de dados independente e backup diário automático. Cada aluno vê só os próprios dados, e só a sua equipe vê os dados dos alunos." : "Totalmente. Cada gimnasio cuenta con un entorno aislado, base de datos independiente y respaldos diarios automáticos. Cada alumno ve solo sus datos, y solo tu equipo ve los datos de los alumnos.",
              },
              {
                q: lang === 'pt-BR' ? "Posso cancelar a assinatura quando quiser?" : "¿Puedo cancelar la suscripción cuando quiera?",
                a: lang === 'pt-BR' ? "Sim, no plano de Assinatura não existe fidelidade contratual amarrada. Você pode cancelar quando quiser, sem letras miúdas ou multas surpresa." : "Sí, el plan de Suscripción no tiene contratos forzados ni permanencia. Puedes darte de baja en cualquier momento sin penalizaciones ni letras chicas.",
              },
              {
                q: lang === 'pt-BR' ? "Em quanto tempo fica pronto?" : "¿En cuánto tiempo está listo?",
                a: lang === 'pt-BR' ? "No mesmo dia do cadastro! Assim que você cadastra sua academia e sobe seu logotipo, o sistema já fica disponível para os professores montarem as fichas e os alunos começarem a treinar." : "¡El mismo día del registro! Tan pronto configures tu gimnasio y subas tu logo, el sistema queda disponible para que los profesores carguen rutinas y los alumnos comiencen a entrenar.",
              },
            ].map((item, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div key={idx} className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden transition-colors">
                  <button
                    type="button"
                    onClick={() => toggleFaq(idx)}
                    className="w-full px-6 py-5 text-left flex items-center justify-between gap-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                    aria-expanded={isOpen}
                  >
                    <span className="text-sm sm:text-base font-bold text-white">{item.q}</span>
                    <ChevronDown className={`w-5 h-5 text-red-500 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {isOpen && (
                    <div className="px-6 pb-5 pt-1 text-xs sm:text-sm text-slate-300 leading-relaxed border-t border-slate-800/60">
                      {item.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 8. CHAMADA FINAL */}
      <section className="py-20 lg:py-28 relative overflow-hidden text-center">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight text-balance">
            {lang === 'pt-BR' ? 'Veja o app funcionando com a marca da sua academia' : 'Mira la app funcionando con la marca de tu gimnasio'}
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-300 max-w-xl mx-auto">
            {lang === 'pt-BR' ? 'Transforme a experiência dos seus alunos, diminua cancelamentos e fortaleça a sua marca hoje mesmo.' : 'Transforma la experiencia de tus alumnos, reduce deserciones y fortalece tu marca hoy mismo.'}
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              type="button"
              onClick={() => onNavigate('/cadastro?plano=assinatura')}
              className="w-full sm:w-auto px-8 py-3.5 bg-red-600 hover:bg-red-700 active:scale-95 text-white font-bold rounded-xl text-base shadow-lg shadow-red-600/30 transition-all flex items-center justify-center gap-2 focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:outline-none"
            >
              <span>{lang === 'pt-BR' ? 'Começar agora' : 'Empezar ahora'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <a
              href={whatsappGeneralUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto px-8 py-3.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-white font-semibold rounded-xl text-base transition-all flex items-center justify-center gap-2 focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:outline-none"
            >
              <MessageCircle className="w-5 h-5 text-emerald-400" />
              <span>{lang === 'pt-BR' ? 'Falar no WhatsApp' : 'Hablar por WhatsApp'}</span>
            </a>
          </div>
        </div>
      </section>

      {/* 9. RODAPÉ */}
      <footer className="bg-slate-950 border-t border-slate-800 text-slate-400 text-xs py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pb-10 border-b border-slate-800/80">
            <div>
              <div className="flex items-center gap-2 text-white font-black text-lg mb-2">
                <span className="w-6 h-6 rounded-md bg-red-600 flex items-center justify-center text-white text-xs">
                  <Dumbbell className="w-3.5 h-3.5" />
                </span>
                <span>{PRODUCT_NAME}</span>
              </div>
              <p className="text-slate-400 text-xs leading-relaxed max-w-sm">
                {lang === 'pt-BR' ? 'Plataforma White-Label para Academias, Studios e Centros de Treinamento.' : 'Plataforma White-Label para Gimnasios, Estudios y Centros de Entrenamiento.'}
              </p>
            </div>

            <div>
              <p className="text-white font-semibold text-xs uppercase tracking-wider mb-3">
                {lang === 'pt-BR' ? 'Navegação Rápida' : 'Navegación Rápida'}
              </p>
              <ul className="space-y-2">
                <li><a href="#problema-solucao" className="hover:text-white transition-colors">{lang === 'pt-BR' ? 'Vantagens' : 'Ventajas'}</a></li>
                <li><a href="#recursos" className="hover:text-white transition-colors">{lang === 'pt-BR' ? 'Recursos' : 'Funciones'}</a></li>
                <li><a href="#como-funciona" className="hover:text-white transition-colors">{lang === 'pt-BR' ? 'Como Funciona' : 'Cómo Funciona'}</a></li>
                <li><a href="#planos" className="hover:text-white transition-colors">{lang === 'pt-BR' ? 'Planos' : 'Planes'}</a></li>
                <li><a href="#faq" className="hover:text-white transition-colors">{lang === 'pt-BR' ? 'Dúvidas' : 'Preguntas'}</a></li>
              </ul>
            </div>

            <div>
              <p className="text-white font-semibold text-xs uppercase tracking-wider mb-3">
                {lang === 'pt-BR' ? 'Atendimento & Vendas' : 'Atención y Ventas'}
              </p>
              <ul className="space-y-2 text-slate-300">
                <li className="flex items-center gap-2">
                  <MessageCircle className="w-4 h-4 text-emerald-400" />
                  <span>WhatsApp: +55 (11) 99999-9999</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-slate-400">E-mail:</span>
                  <span>{SUPPORT_EMAIL}</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-slate-500">
            <p>© {currentYear} {PRODUCT_NAME}. {lang === 'pt-BR' ? 'Todos os direitos reservados.' : 'Todos los derechos reservados.'}</p>
            <p className="text-[11px]">{lang === 'pt-BR' ? 'Desenvolvido para alta retenção e fidelização em academias.' : 'Desarrollado para alta retención y fidelización en gimnasios.'}</p>
          </div>
        </div>
      </footer>

      {/* 10. BOTÃO FLUTUANTE DO WHATSAPP */}
      <aside aria-label="Atendimento via WhatsApp">
        <a
          href={whatsappGeneralUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 focus-visible:ring-4 focus-visible:ring-emerald-400/50 focus-visible:outline-none"
          title={lang === 'pt-BR' ? 'Falar no WhatsApp' : 'Hablar por WhatsApp'}
          aria-label={lang === 'pt-BR' ? 'Falar no WhatsApp' : 'Hablar por WhatsApp'}
        >
          <MessageCircle className="w-7 h-7" />
        </a>
      </aside>

    </div>
  );
}
